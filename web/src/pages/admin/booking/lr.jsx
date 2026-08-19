import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:8000/api";

// ── Static style helpers & presentational components ──────────────────────
const inputCls =
  "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white text-gray-800 placeholder-gray-400";
const selectCls =
  "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white text-gray-800 cursor-pointer";
const labelCls =
  "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5";

const Section = ({ icon, title, children }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
      <span className="text-base">{icon}</span>
      <span className="font-semibold text-gray-700 text-sm">{title}</span>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const Field = ({ label, required, children, hint }) => (
  <div className="flex flex-col gap-0">
    <label className={labelCls}>
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

const InfoBadge = ({ party }) => {
  if (!party) return null;
  return (
    <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
      <div className="flex items-start gap-2">
        <span className="text-blue-500 text-sm">📍</span>
        <div>
          <p className="text-xs font-semibold text-blue-800">{party.name}</p>
          <p className="text-xs text-blue-600 mt-0.5">{party.address}</p>
          <div className="flex gap-3 mt-1">
            {party.gstin && (
              <span className="text-xs text-gray-500">GST: {party.gstin}</span>
            )}
            {party.state && (
              <span className="text-xs text-gray-500">📌 {party.state}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const emptyFormData = {
  lr_number: "",
  booking_date: "",
  branch_id: "",
  route_id: "",
  pickup_location: "",
  delivery_location: "",
  eta: "",
  consignor_id: "",
  consignee_id: "",
  goods_desc: "",
  packages: "",
  weight: "",
  weight_type: "kg",
  invoice_no: "",
  invoice_value: "",
  eway_bill: "",
  payment_mode: "",
  freight_charge: "",
  loading_charges: "",
  unloading_charges: "",
  other_charges: "",
  discount: "",
  gst_applicable: false,
  gst_type: "igst",
  cgst_amount: 0,
  sgst_amount: 0,
  igst_amount: 0,
  gst: 0,
  total_amount: 0,
  notes: "",
  // New fields for driver, vehicle, and price
  driver_id: "",
  driver_name: "",
  driver_phone: "",
  vehicle_id: "",
  vehicle_number: "",
  vehicle_type: "",
  per_kg_rate: "",
  per_ton_rate: "",
  minimum_charge: "",
};

const CreateLR = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mastersLoading, setMastersLoading] = useState(true);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [branches, setBranches] = useState([]);
  const [parties, setParties] = useState([]);
  const [cities, setCities] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [consignorInfo, setConsignorInfo] = useState(null);
  const [consigneeInfo, setConsigneeInfo] = useState(null);
  const [formData, setFormData] = useState(emptyFormData);

  const fetchMasterData = async () => {
    setMastersLoading(true);
    try {
      console.log("🔍 Fetching master data...");
      
      const getMasterList = async (path, listKey) => {
        const response = await fetch(`${API_BASE}${path}`);
        if (!response.ok) throw new Error(`Could not load ${path}`);
        const payload = await response.json();
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload.data)) return payload.data;
        if (Array.isArray(payload[listKey])) return payload[listKey];
        return [];
      };

      const bData = await getMasterList("/branches/", "branches");
      const pData = await getMasterList("/parties/", "parties");
      const cData = await getMasterList("/cities/", "cities");
      const dData = await getMasterList("/drivers/", "drivers");
      const vData = await getMasterList("/vehicles/", "vehicles");

      console.log("📡 Branches:", bData);
      console.log("📡 Parties:", pData);
      console.log("📡 Cities:", cData);
      console.log("📡 Drivers:", dData);
      console.log("📡 Vehicles:", vData);

      setBranches(bData);
      setParties(pData);
      setCities(
        cData
          .filter((c) => c.status === "active")
          .map((c) => c.name || c)
      );
      setDrivers(dData.filter(d => d.status === "active"));
      setVehicles(vData.filter(v => v.status === "active"));

      // Manual routes
      const manualRoutes = [
        { id: 1, pickup_location: "Bhilwara", destination: "jaipur", via: "ajmer", stoppage: "xxv", status: "active", rate_per_kg: 15, rate_per_ton: 15000, minimum_charge: 500 },
        { id: 2, pickup_location: "jaipur", destination: "Bhilwara", via: "xcvx", stoppage: "cvzcv", status: "active", rate_per_kg: 15, rate_per_ton: 15000, minimum_charge: 500 },
        { id: 3, pickup_location: "Mumbai", destination: "Delhi", via: "Ahmedabad", stoppage: "stop1", status: "active", rate_per_kg: 20, rate_per_ton: 20000, minimum_charge: 1000 },
        { id: 4, pickup_location: "Delhi", destination: "Mumbai", via: "Jaipur", stoppage: "stop2", status: "active", rate_per_kg: 20, rate_per_ton: 20000, minimum_charge: 1000 },
      ];
      setRoutes(manualRoutes);
      
    } catch (err) {
      console.error("❌ Error fetching master data:", err);
      setAlert({
        type: "error",
        message: "Failed to load master data. Please refresh.",
      });
    } finally {
      setMastersLoading(false);
    }
  };

  const generateDocumentNumbers = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    setFormData((prev) => ({
      ...prev,
      lr_number: `LR${y}${m}${d}${String(Math.floor(Math.random() * 9000) + 1000)}`,
      booking_date: now.toISOString().split("T")[0],
      invoice_no: `INV${y}${m}${d}${String(Math.floor(Math.random() * 900) + 100)}`,
      eway_bill: String(Math.floor(Math.random() * 9000000000) + 1000000000),
    }));
  };

  useEffect(() => {
    fetchMasterData();
    generateDocumentNumbers();
  }, []);

  // Recalculate totals
  useEffect(() => {
    const freight = parseFloat(formData.freight_charge) || 0;
    const loading = parseFloat(formData.loading_charges) || 0;
    const unloading = parseFloat(formData.unloading_charges) || 0;
    const other = parseFloat(formData.other_charges) || 0;
    const discount = parseFloat(formData.discount) || 0;
    const subtotal = freight + loading + unloading + other - discount;

    let cgst = 0,
      sgst = 0,
      igst = 0;
    if (formData.gst_applicable && subtotal > 0) {
      if (formData.gst_type === "igst") igst = subtotal * 0.05;
      else {
        cgst = subtotal * 0.025;
        sgst = subtotal * 0.025;
      }
    }

    setFormData((prev) => ({
      ...prev,
      cgst_amount: cgst,
      sgst_amount: sgst,
      igst_amount: igst,
      gst: cgst + sgst + igst,
      total_amount: subtotal + cgst + sgst + igst,
    }));
  }, [
    formData.freight_charge,
    formData.loading_charges,
    formData.unloading_charges,
    formData.other_charges,
    formData.discount,
    formData.gst_applicable,
    formData.gst_type,
  ]);

  // Auto-detect intrastate vs interstate
  useEffect(() => {
    if (formData.consignor_id && formData.consignee_id) {
      const c1 = parties.find((p) => p.id === parseInt(formData.consignor_id));
      const c2 = parties.find((p) => p.id === parseInt(formData.consignee_id));
      if (c1?.state && c2?.state) {
        setFormData((prev) => ({
          ...prev,
          gst_type:
            c1.state.toLowerCase() === c2.state.toLowerCase()
              ? "cgst_sgst"
              : "igst",
        }));
      }
    }
  }, [formData.consignor_id, formData.consignee_id, parties]);

  // Keep freight in sync with route and weight
  useEffect(() => {
    if (!formData.route_id) return;
    const route = routes.find(
      (r) => String(r.id) === String(formData.route_id),
    );
    if (!route) return;

    const rawWeight = parseFloat(formData.weight) || 0;
    const weightInKg = formData.weight_type === "ton" ? rawWeight * 1000 : rawWeight;
    if (!weightInKg) return;

    // Calculate freight based on weight
    let freight = 0;
    if (formData.weight_type === "ton") {
      freight = (weightInKg / 1000) * (parseFloat(route.rate_per_ton) || 0);
    } else {
      freight = weightInKg * (parseFloat(route.rate_per_kg) || 0);
    }

    // Apply minimum charge if applicable
    const minCharge = parseFloat(route.minimum_charge) || 0;
    if (minCharge > 0 && freight < minCharge) {
      freight = minCharge;
    }

    setFormData((prev) => ({
      ...prev,
      freight_charge: freight.toFixed(2),
      per_kg_rate: route.rate_per_kg || "",
      per_ton_rate: route.rate_per_ton || "",
      minimum_charge: route.minimum_charge || "",
    }));
  }, [formData.weight, formData.weight_type, formData.route_id, routes]);

  // Auto-fill driver info when driver is selected
  useEffect(() => {
  if (formData.driver_id) {
    const driver = drivers.find(
      (d) => String(d.id) === String(formData.driver_id)
    );

    if (driver) {
      setFormData((prev) => ({
        ...prev,

        driver_name:
          driver.name ||
          driver.driver_name ||
          driver.full_name ||
          driver.driverName ||
          "",

        driver_phone:
          driver.phone ||
          driver.phone_number ||
          driver.mobile ||
          driver.mobile_number ||
          "",
      }));
    }
  } else {
    setFormData((prev) => ({
      ...prev,
      driver_name: "",
      driver_phone: "",
    }));
  }
}, [formData.driver_id, drivers]);

  // Auto-fill vehicle info when vehicle is selected
  useEffect(() => {
  if (formData.vehicle_id) {
    const vehicle = vehicles.find(
      (v) => String(v.id) === String(formData.vehicle_id)
    );

    if (vehicle) {
      setFormData((prev) => ({
        ...prev,

        vehicle_number:
          vehicle.vehicle_number ||
          vehicle.vehicle_no ||
          vehicle.registration_number ||
          vehicle.registration_no ||
          vehicle.reg_no ||
          "",

        vehicle_type:
          vehicle.vehicle_type ||
          vehicle.type ||
          "",
      }));
    }
  } else {
    setFormData((prev) => ({
      ...prev,
      vehicle_number: "",
      vehicle_type: "",
    }));
  }
}, [formData.vehicle_id, vehicles]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
    if (alert.message) setAlert({ type: "", message: "" });
  };

  const handleConsignorChange = (e) => {
    const id = e.target.value;
    const party = parties.find((p) => String(p.id) === id);
    setConsignorInfo(party || null);
    setFormData((prev) => ({
      ...prev,
      consignor_id: id,
      pickup_location: party ? party.city || "" : prev.pickup_location,
    }));
  };

  const handleConsigneeChange = (e) => {
    const id = e.target.value;
    const party = parties.find((p) => String(p.id) === id);
    setConsigneeInfo(party || null);
    setFormData((prev) => ({
      ...prev,
      consignee_id: id,
      delivery_location: party ? party.city || "" : prev.delivery_location,
    }));
  };

  const handleRouteChange = (e) => {
    const id = e.target.value;
    const route = routes.find((r) => String(r.id) === id);
    if (route) {
      const eta = new Date();
      const days = parseInt(route.estimated_days) || 1;
      eta.setDate(eta.getDate() + days);

      setFormData((prev) => ({
        ...prev,
        route_id: id,
        pickup_location: route.pickup_location || prev.pickup_location,
        delivery_location: route.destination || prev.delivery_location,
        eta: eta.toISOString().split("T")[0],
        per_kg_rate: route.rate_per_kg || "",
        per_ton_rate: route.rate_per_ton || "",
        minimum_charge: route.minimum_charge || "",
      }));

      // Calculate freight if weight exists
      if (formData.weight) {
        const rawWeight = parseFloat(formData.weight) || 0;
        const weightInKg = formData.weight_type === "ton" ? rawWeight * 1000 : rawWeight;
        if (weightInKg) {
          let freight = 0;
          if (formData.weight_type === "ton") {
            freight = (weightInKg / 1000) * (parseFloat(route.rate_per_ton) || 0);
          } else {
            freight = weightInKg * (parseFloat(route.rate_per_kg) || 0);
          }
          const minCharge = parseFloat(route.minimum_charge) || 0;
          if (minCharge > 0 && freight < minCharge) {
            freight = minCharge;
          }
          setFormData((prev) => ({
            ...prev,
            freight_charge: freight.toFixed(2),
          }));
        }
      }
    } else {
      setFormData((prev) => ({ ...prev, route_id: "", eta: "", per_kg_rate: "", per_ton_rate: "", minimum_charge: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.pickup_location.trim())
      return setAlert({
        type: "error",
        message: "Pickup location is required.",
      });
    if (!formData.delivery_location.trim())
      return setAlert({
        type: "error",
        message: "Delivery location is required.",
      });
    if (!formData.goods_desc.trim())
      return setAlert({
        type: "error",
        message: "Description of goods is required.",
      });
    if (!formData.payment_mode)
      return setAlert({ type: "error", message: "Payment type is required." });
    if (!formData.freight_charge || parseFloat(formData.freight_charge) <= 0)
      return setAlert({
        type: "error",
        message: "Freight amount is required.",
      });

    setLoading(true);
    setAlert({ type: "", message: "" });

    try {
      const res = await fetch(`${API_BASE}/shipments/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lr_number: formData.lr_number,
          booking_date: formData.booking_date,
          pickup_location: formData.pickup_location,
          delivery_location: formData.delivery_location,
          destination: formData.delivery_location,
          consignor_id: formData.consignor_id || null,
          consignee_id: formData.consignee_id || null,
          client: formData.consignor_id || "",
          goods_desc: formData.goods_desc,
          packages: parseInt(formData.packages) || 0,
          weight: parseFloat(formData.weight) || 0,
          weight_type: formData.weight_type,
          invoice_no: formData.invoice_no || "",
          invoice_value: parseFloat(formData.invoice_value) || 0,
          eway_bill: formData.eway_bill || "",
          payment_mode: formData.payment_mode,
          freight_charge: parseFloat(formData.freight_charge) || 0,
          loading_charges: parseFloat(formData.loading_charges) || 0,
          unloading_charges: parseFloat(formData.unloading_charges) || 0,
          other_charges: parseFloat(formData.other_charges) || 0,
          discount: parseFloat(formData.discount) || 0,
          gst: formData.gst || 0,
          notes: formData.notes || "",
          status: "pending",
          route_id: formData.route_id || null,
          branch_id: formData.branch_id || null,
          // New fields
          driver_id: formData.driver_id || null,
          driver_name: formData.driver_name || "",
          driver_phone: formData.driver_phone || "",
          vehicle_id: formData.vehicle_id || null,
          vehicle_number: formData.vehicle_number || "",
          vehicle_type: formData.vehicle_type || "",
          per_kg_rate: parseFloat(formData.per_kg_rate) || 0,
          per_ton_rate: parseFloat(formData.per_ton_rate) || 0,
          minimum_charge: parseFloat(formData.minimum_charge) || 0,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setAlert({
          type: "success",
          message: `LR ${formData.lr_number} booked successfully!`,
        });

        setTimeout(() => {
          navigate("/shipments", {
            state: { refresh: true, newLR: formData.lr_number }
          });
        }, 1500);
      } else {
        setAlert({
          type: "error",
          message: data.detail || data.message || "Failed to book LR.",
        });
      }
    } catch {
      setAlert({
        type: "error",
        message: "Network error. Please check your connection.",
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-bold text-gray-800">New Booking</h1>
            <p className="text-xs text-gray-400">Create a new Lorry Receipt</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-semibold border border-blue-100">
            {formData.lr_number}
          </span>
        </div>
      </div>

      {/* Fixed alert notification */}
      {alert.message && (
        <div
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm flex items-center gap-2 bg-opacity-95 backdrop-blur-sm border"
          style={{
            backgroundColor: alert.type === "success" ? "#f0fdf4" : "#fef2f2",
            borderColor: alert.type === "success" ? "#bbf7d0" : "#fecaca",
            color: alert.type === "success" ? "#166534" : "#991b1b",
          }}
        >
          {alert.type === "success" ? "✅" : "❌"} {alert.message}
          <button
            type="button"
            onClick={() => setAlert({ type: "", message: "" })}
            className="ml-3 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-3 gap-5">
          {/* LEFT COLUMN - 2/3 width */}
          <div className="col-span-2 flex flex-col gap-5">
            {/* LR Details */}
            <Section icon="📄" title="LR Details">
              <div className="grid grid-cols-3 gap-4">
                <Field label="LR Number" required>
                  <input
                    className={`${inputCls} bg-gray-50 font-bold tracking-wide`}
                    value={formData.lr_number}
                    readOnly
                  />
                </Field>
                <Field label="Booking Date" required>
                  <input
                    type="date"
                    name="booking_date"
                    className={inputCls}
                    value={formData.booking_date}
                    onChange={handleChange}
                    required
                  />
                </Field>
                <Field label="Branch">
                  <select
                    name="branch_id"
                    className={selectCls}
                    value={formData.branch_id}
                    onChange={handleChange}
                    disabled={mastersLoading}
                  >
                    <option value="">
                      {mastersLoading ? "Loading branches…" : "Select Branch"}
                    </option>
                    {branches.map((b, index) => (
                      <option key={b.id || b.branch_id || index} value={b.id || b.branch_id || ""}>
                        {b.name || b.branch_name || "Unnamed Branch"}
                        {(b.city || b.location) ? ` — ${b.city || b.location}` : ""}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </Section>

            {/* Driver & Vehicle Section */}
            <Section icon="🚛" title="Driver & Vehicle Details">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Field label="Select Driver">
                    <select
                      name="driver_id"
                      className={selectCls}
                      value={formData.driver_id}
                      onChange={handleChange}
                      disabled={mastersLoading}
                    >
                      <option value="">-- Select Driver --</option>
                    {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name ||
                            d.driver_name ||
                            d.full_name ||
                            d.driverName ||
                            "Unnamed Driver"}
                          {d.phone || d.phone_number || d.mobile || d.mobile_number
                            ? ` · ${d.phone || d.phone_number || d.mobile || d.mobile_number}`
                            : ""}
                        </option>
                      ))}
                    </select>
                  </Field>
                  {formData.driver_name && (
                    <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-100">
                      <p className="text-xs font-semibold text-green-800">Driver: {formData.driver_name}</p>
                      {formData.driver_phone && (
                        <p className="text-xs text-green-600">📞 {formData.driver_phone}</p>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <Field label="Select Vehicle">
                    <select
                      name="vehicle_id"
                      className={selectCls}
                      value={formData.vehicle_id}
                      onChange={handleChange}
                      disabled={mastersLoading}
                    >
                      <option value="">-- Select Vehicle --</option>
                      {vehicles.map((v) => (
  <option key={v.id} value={v.id}>
    {v.vehicle_number ||
      v.vehicle_no ||
      v.registration_number ||
      v.registration_no ||
      v.reg_no ||
      v.vehicleName ||
      "Unnamed Vehicle"}
    {v.vehicle_type || v.type
      ? ` · ${v.vehicle_type || v.type}`
      : ""}
  </option>
))}
                    </select>
                  </Field>
                  {formData.vehicle_number && (
                    <div className="mt-2 p-2 bg-purple-50 rounded-lg border border-purple-100">
                      <p className="text-xs font-semibold text-purple-800">Vehicle: {formData.vehicle_number}</p>
                      {formData.vehicle_type && (
                        <p className="text-xs text-purple-600">Type: {formData.vehicle_type}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Section>

            {/* Route Selection */}
            <Section icon="🗺️" title="Route">
              <Field
                label="Select Route"
                hint="Selecting a route auto-fills pickup, delivery city and freight amount"
              >
                <select
                  className={selectCls}
                  value={formData.route_id}
                  onChange={handleRouteChange}
                  disabled={mastersLoading}
                >
                  <option value="">
                    {mastersLoading
                      ? "Loading routes…"
                      : "-- Select a route (optional) --"}
                  </option>
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.pickup_location} → {r.destination}
                      {r.via ? ` via ${r.via}` : ""}
                      {r.stoppage ? ` · ${r.stoppage}` : ""}
                    </option>
                  ))}
                </select>
                {!mastersLoading && routes.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1.5">
                    ⚠️ No active routes found. Add routes in Masters → Routes first.
                  </p>
                )}
              </Field>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <Field label="Pickup City" required>
                  <input
                    type="text"
                    name="pickup_location"
                    className={inputCls}
                    value={formData.pickup_location}
                    onChange={handleChange}
                    list="city_list"
                    placeholder="Origin city"
                    required
                  />
                </Field>
                <Field label="Delivery City" required>
                  <input
                    type="text"
                    name="delivery_location"
                    className={inputCls}
                    value={formData.delivery_location}
                    onChange={handleChange}
                    list="city_list"
                    placeholder="Destination city"
                    required
                  />
                </Field>
              </div>

              {formData.eta && (
                <p className="text-xs text-gray-500 mt-2">
                  📅 Estimated delivery:{" "}
                  <span className="font-medium text-gray-700">
                    {formData.eta}
                  </span>
                </p>
              )}

              <datalist id="city_list">
                {cities.map((c, i) => (
                  <option key={i} value={c} />
                ))}
              </datalist>
            </Section>

            {/* Consignor & Consignee */}
            <Section icon="🔄" title="Consignor & Consignee">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <Field label="Consignor (Sender)">
                    <select
                      className={selectCls}
                      value={formData.consignor_id}
                      onChange={handleConsignorChange}
                      disabled={mastersLoading}
                    >
                      <option value="">-- Select Consignor --</option>
                      {parties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} · {p.city}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <InfoBadge party={consignorInfo} />
                </div>
                <div>
                  <Field label="Consignee (Receiver)">
                    <select
                      className={selectCls}
                      value={formData.consignee_id}
                      onChange={handleConsigneeChange}
                      disabled={mastersLoading}
                    >
                      <option value="">-- Select Consignee --</option>
                      {parties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} · {p.city}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <InfoBadge party={consigneeInfo} />
                </div>
              </div>
            </Section>

            {/* Goods Details */}
            <Section icon="📦" title="Goods Details">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Field label="Description of Goods" required>
                  <input
                    type="text"
                    name="goods_desc"
                    className={inputCls}
                    value={formData.goods_desc}
                    onChange={handleChange}
                    placeholder="e.g. Electronic Goods, Steel Pipes"
                    required
                  />
                </Field>
                <Field label="No. of Packages">
                  <input
                    type="number"
                    name="packages"
                    className={inputCls}
                    value={formData.packages}
                    onChange={handleChange}
                    min="0"
                    placeholder="0"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Field label="Weight">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="weight"
                      className="flex-1 min-w-0 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white text-gray-800 placeholder-gray-400"
                      value={formData.weight}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                    <select
                      name="weight_type"
                      className="w-24 flex-shrink-0 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white text-gray-800 cursor-pointer"
                      value={formData.weight_type}
                      onChange={handleChange}
                    >
                      <option value="kg">Kg</option>
                      <option value="ton">Ton</option>
                    </select>
                  </div>
                </Field>
                <Field label="Invoice / Bill No.">
                  <input
                    type="text"
                    name="invoice_no"
                    className={inputCls}
                    value={formData.invoice_no}
                    onChange={handleChange}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Invoice Value (₹)">
                  <input
                    type="number"
                    name="invoice_value"
                    className={inputCls}
                    value={formData.invoice_value}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </Field>
                <Field label="E-Way Bill No.">
                  <input
                    type="text"
                    name="eway_bill"
                    className={inputCls}
                    value={formData.eway_bill}
                    onChange={handleChange}
                  />
                </Field>
              </div>
            </Section>

            {/* Remarks */}
            <Section icon="💬" title="Remarks">
              <textarea
                name="notes"
                className={`${inputCls} resize-none`}
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                placeholder="Additional notes or special instructions..."
              />
            </Section>
          </div>

          {/* RIGHT COLUMN - 1/3 width */}
          <div className="flex flex-col gap-5">
            {/* Payment type */}
            <Section icon="💳" title="Payment">
              <Field label="Payment Type" required>
                <select
                  name="payment_mode"
                  className={selectCls}
                  value={formData.payment_mode}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select --</option>
                  <option value="paid">Paid (Prepaid)</option>
                  <option value="topay">To Pay</option>
                  <option value="tbb">To Be Billed</option>
                </select>
              </Field>
            </Section>

            {/* Freight & Charges */}
            <Section icon="💰" title="Freight & Charges">
              <div className="flex flex-col gap-3">
                {/* Rate Information */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Rate Information</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-gray-500">Per Kg Rate</p>
                      <p className="text-sm font-semibold text-gray-800">
                        ₹{formData.per_kg_rate || "0.00"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Per Ton Rate</p>
                      <p className="text-sm font-semibold text-gray-800">
                        ₹{formData.per_ton_rate || "0.00"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Minimum Charge</p>
                      <p className="text-sm font-semibold text-gray-800">
                        ₹{formData.minimum_charge || "0.00"}
                      </p>
                    </div>
                  </div>
                </div>

                <Field label="Freight Amount (₹)" required>
                  <input
                    type="number"
                    name="freight_charge"
                    className={`${inputCls} font-bold text-base`}
                    value={formData.freight_charge}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    required
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Loading (₹)">
                    <input
                      type="number"
                      name="loading_charges"
                      className={inputCls}
                      value={formData.loading_charges}
                      onChange={handleChange}
                      min="0"
                      placeholder="0"
                    />
                  </Field>
                  <Field label="Unloading (₹)">
                    <input
                      type="number"
                      name="unloading_charges"
                      className={inputCls}
                      value={formData.unloading_charges}
                      onChange={handleChange}
                      min="0"
                      placeholder="0"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Other (₹)">
                    <input
                      type="number"
                      name="other_charges"
                      className={inputCls}
                      value={formData.other_charges}
                      onChange={handleChange}
                      min="0"
                      placeholder="0"
                    />
                  </Field>
                  <Field label="Discount (₹)">
                    <input
                      type="number"
                      name="discount"
                      className={inputCls}
                      value={formData.discount}
                      onChange={handleChange}
                      min="0"
                      placeholder="0"
                    />
                  </Field>
                </div>

                {/* GST */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      name="gst_applicable"
                      checked={formData.gst_applicable}
                      onChange={handleChange}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm font-semibold text-blue-800">
                      GST Applicable
                    </span>
                  </label>

                  {formData.gst_applicable && (
                    <div>
                      <div className="flex gap-4 mb-3">
                        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                          <input
                            type="radio"
                            name="gst_type"
                            value="igst"
                            checked={formData.gst_type === "igst"}
                            onChange={handleChange}
                          />
                          IGST @5%
                        </label>
                        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                          <input
                            type="radio"
                            name="gst_type"
                            value="cgst_sgst"
                            checked={formData.gst_type === "cgst_sgst"}
                            onChange={handleChange}
                          />
                          CGST+SGST @2.5%
                        </label>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: "CGST", val: formData.cgst_amount },
                          { label: "SGST", val: formData.sgst_amount },
                          { label: "IGST", val: formData.igst_amount },
                        ].map(({ label, val }) => (
                          <div key={label}>
                            <p className="text-xs text-gray-500 mb-1">
                              {label} (₹)
                            </p>
                            <input
                              className={`${inputCls} bg-gray-100`}
                              value={val.toFixed(2)}
                              readOnly
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Charge breakdown */}
                <div className="border border-gray-100 rounded-lg overflow-hidden text-sm">
                  {[
                    {
                      label: "Freight",
                      val: parseFloat(formData.freight_charge) || 0,
                    },
                    {
                      label: "Loading",
                      val: parseFloat(formData.loading_charges) || 0,
                    },
                    {
                      label: "Unloading",
                      val: parseFloat(formData.unloading_charges) || 0,
                    },
                    {
                      label: "Other",
                      val: parseFloat(formData.other_charges) || 0,
                    },
                    {
                      label: "Discount",
                      val: -(parseFloat(formData.discount) || 0),
                    },
                    { label: "GST", val: formData.gst || 0 },
                  ]
                    .filter((item) => item.val !== 0)
                    .map(({ label, val }) => (
                      <div
                        key={label}
                        className="flex justify-between px-3 py-2 border-b border-gray-50 last:border-0"
                      >
                        <span className="text-gray-500">{label}</span>
                        <span
                          className={val < 0 ? "text-red-500" : "text-gray-700"}
                        >
                          {val < 0 ? "-" : ""}₹{Math.abs(val).toFixed(2)}
                        </span>
                      </div>
                    ))}
                </div>

                {/* Total */}
                <div className="bg-blue-600 text-white rounded-xl px-4 py-4 text-right">
                  <p className="text-xs opacity-75 uppercase tracking-wider mb-1">
                    Total Amount
                  </p>
                  <p className="text-3xl font-bold">
                    ₹{formData.total_amount.toFixed(2)}
                  </p>
                </div>
              </div>
            </Section>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl transition text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span> Booking...
                  </>
                ) : (
                  <>✅ Book LR</>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate("/shipments")}
                disabled={loading}
                className="w-full py-3 bg-white hover:bg-gray-50 text-gray-600 font-medium rounded-xl border border-gray-200 transition text-sm"
              >
                ✕ Cancel
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateLR;