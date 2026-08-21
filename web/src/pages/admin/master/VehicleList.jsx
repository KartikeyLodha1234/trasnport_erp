import React, { useState, useEffect, useCallback } from "react";

// ====================== VEHICLE FLEET DIRECTORY ======================
export default function VehicleFleetDirectory() {
  // ───── State ─────
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const initialForm = {
    type: "heavy",
    company_name: "",
    year: "",
    license_plate: "",
    driver_id: "",
    puc_certificate_number: "",
    puc_expiry_date: "",
    notes: "",
    pucFile: null,
  };
  const [form, setForm] = useState(initialForm);
  const [editForm, setEditForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // ───── API Calls ─────
  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/vehicles/");
      console.log("📥 Vehicle API status:", res.status);
      const data = await res.json();
      console.log("📦 Vehicle API response:", data);

      if (!res.ok) {
        throw new Error(data?.detail || data?.message || "Failed to fetch vehicles");
      }

      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data.data)) {
        list = data.data;
      } else if (Array.isArray(data.vehicles)) {
        list = data.vehicles;
      } else if (Array.isArray(data.results)) {
        list = data.results;
      }

      console.log("🚗 Final vehicle list:", list);
      console.log("🚗 Vehicle count:", list.length);
      setVehicles(list);
    } catch (err) {
      console.error("❌ Fetch vehicles error:", err);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDrivers = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:8000/api/drivers/");
      const data = await res.json();
      if (!res.ok) {
        console.error("❌ Drivers API error:", res.status, data);
        return;
      }
      const list = data.data || data || [];
      console.log("👤 Drivers data:", list);
      setDrivers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Error fetching drivers:", err);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
    fetchDrivers();
  }, [fetchVehicles, fetchDrivers]);

  // ───── Handlers ─────
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setForm((prev) => ({ ...prev, pucFile: file }));
  };

  const handleEditFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setEditForm((prev) => ({ ...prev, pucFile: file }));
  };

  // ───── Validation ─────
  const validate = (data) => {
    const err = {};
    if (!data.type?.trim()) err.type = "Type is required.";
    if (!data.company_name?.trim()) err.company_name = "Company name is required.";
    if (!data.license_plate?.trim()) err.license_plate = "License plate is required.";
    if (data.year && isNaN(parseInt(data.year))) err.year = "Invalid year.";
    return err;
  };

  // ───── Create ─────
  const handleCreate = async (e) => {
    e.preventDefault();
    const err = validate(form);
    setErrors(err);
    if (Object.keys(err).length > 0) return;

    setSubmitting(true);
    try {
      const fd = new FormData();

      fd.append("type", form.type || "heavy");
      fd.append("company_name", form.company_name || "");
      fd.append("license_plate", form.license_plate || "");
      fd.append("year", form.year || "");
      fd.append("puc_certificate_number", form.puc_certificate_number || "");
      fd.append("puc_expiry_date", form.puc_expiry_date || "");
      fd.append("notes", form.notes || "");

      // ✅ Send driver_id
      const driverIdValue = form.driver_id || "";
      console.log("📤 Sending driver_id:", driverIdValue);
      fd.append("driver_id", driverIdValue);

      if (form.pucFile instanceof File) {
        fd.append("pucFile", form.pucFile);
      }

      console.log("📤 FormData contents:");
      for (let [key, value] of fd.entries()) {
        console.log(`  ${key}: ${value}`);
      }

      const res = await fetch("http://localhost:8000/api/vehicles/", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      console.log("📥 Response:", data);

      if (res.ok) {
        fetchVehicles();
        setForm(initialForm);
        setShowCreate(false);
        alert("✅ Vehicle created successfully!");
      } else {
        alert(`❌ Error: ${data.detail || data.message || "Failed to create vehicle."}`);
      }
    } catch (err) {
      console.error("❌ Error:", err);
      alert("Connection error.");
    } finally {
      setSubmitting(false);
    }
  };

  // ───── Delete ─────
  // ✅ FIXED: Accept vehicle object, use integer ID
  const handleDelete = async (vehicle) => {
    // ✅ Use numeric ID, not vehicle_id
    const dbId = vehicle.id;

    console.log("🗑️ Deleting vehicle:", {
      display_id: vehicle.vehicle_id,
      db_id: dbId
    });

    if (!window.confirm(`Permanently delete vehicle ${vehicle.vehicle_id}?`)) return;

    try {
      const res = await fetch(`http://localhost:8000/api/vehicles/${dbId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchVehicles();
        alert("✅ Vehicle deleted successfully!");
      } else {
        const data = await res.json();
        alert(`❌ Delete failed: ${data.detail || "Unknown error"}`);
      }
    } catch (err) {
      console.error("❌ Delete error:", err);
      alert("Connection error.");
    }
  };

  // ───── Edit Modal Open ─────
  // ✅ FIXED: Use integer ID for API
  const openEditModal = (vehicle) => {
    console.log("🚗 Opening edit for:", vehicle);

    // ✅ Store both IDs
    const dbId = vehicle.id;           // Integer: 23
    const displayId = vehicle.vehicle_id; // String: "VEH-0023"

    console.log("  Database ID (API):", dbId);
    console.log("  Display ID (UI):", displayId);

    setSelectedVehicle(vehicle);
    setEditForm({
      db_id: dbId,                    // ✅ For API calls
      vehicle_id: displayId,          // ✅ For display
      type: vehicle.type || "heavy",
      company_name: vehicle.company_name || "",
      year: vehicle.year || "",
      license_plate: vehicle.license_plate || "",
      driver_id: vehicle.driver_id || "",
      puc_certificate_number: vehicle.puc_certificate_number || "",
      puc_expiry_date: vehicle.puc_expiry_date || "",
      notes: vehicle.notes || "",
      status: vehicle.status || "active",
      pucFile: null,
    });
    setShowEdit(true);
    setErrors({});
  };

  // ───── Edit Submit ─────
  // ✅ FIXED: Use db_id for API URL
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!editForm || !selectedVehicle) {
      alert("Vehicle data not available.");
      return;
    }

    const err = validate(editForm);
    setErrors(err);
    if (Object.keys(err).length > 0) return;

    // ✅ Use db_id for API
    const vehicleId = editForm.db_id;

    if (!vehicleId) {
      console.error("❌ No db_id found:", editForm);
      alert("Vehicle ID not found.");
      return;
    }

    console.log("=================================");
    console.log("🚗 Updating Vehicle");
    console.log("Database ID:", vehicleId);
    console.log("Display ID:", editForm.vehicle_id);
    console.log("Driver ID:", editForm.driver_id);
    console.log("=================================");

    setSubmitting(true);

    try {
      const fd = new FormData();

      fd.append("type", editForm.type || "");
      fd.append("company_name", editForm.company_name || "");
      fd.append("license_plate", editForm.license_plate || "");
      fd.append("year", editForm.year || "");
      fd.append("puc_certificate_number", editForm.puc_certificate_number || "");
      fd.append("puc_expiry_date", editForm.puc_expiry_date || "");
      fd.append("notes", editForm.notes || "");
      fd.append("status", editForm.status || "active");

      // ✅ Driver ID
      const driverId = editForm.driver_id ? String(editForm.driver_id) : "";
      console.log("📤 Sending driver_id:", driverId);
      fd.append("driver_id", driverId);

      if (editForm.pucFile instanceof File) {
        fd.append("pucFile", editForm.pucFile);
      }

      // ✅ Use db_id in URL
      const res = await fetch(`http://localhost:8000/api/vehicles/${vehicleId}`, {
        method: "PUT",
        body: fd,
      });

      const data = await res.json();
      console.log("📥 Update response:", data);

      if (!res.ok) {
        alert(`Error: ${data.detail || data.message || "Update failed."}`);
        return;
      }

      alert("✅ Vehicle updated successfully.");
      await fetchVehicles();
      setShowEdit(false);
      setSelectedVehicle(null);
      setEditForm(null);
      setErrors({});
    } catch (err) {
      console.error("❌ Update error:", err);
      alert("Connection error.");
    } finally {
      setSubmitting(false);
    }
  };

  // ───── Stats ─────
  const total = vehicles.length;
  const active = vehicles.filter((v) => v.status === "active").length;
  const heavy = vehicles.filter((v) => v.type === "heavy").length;

  // ───── Helper Functions ─────
  const getDriverName = (vehicle) => {
    if (!vehicle) return "Unassigned";

    if (vehicle.driver_name && vehicle.driver_name !== "null" && vehicle.driver_name !== "undefined") {
      return vehicle.driver_name;
    }

    if (vehicle.driver?.name) {
      return vehicle.driver.name;
    }

    if (vehicle.driver_id) {
      const driver = drivers.find(d => String(d.id) === String(vehicle.driver_id));
      if (driver) {
        return driver.full_name || driver.name || driver.driver_name || "Unassigned";
      }
      return "Unassigned";
    }

    return "Unassigned";
  };

  const getDriverDisplayName = (driver) => {
    const name = driver.name || driver.driver_name || driver.full_name || "Unknown";
    if ((!name || name === "Unknown") && driver.phone) {
      return driver.phone;
    }
    return driver.phone ? `${name} (${driver.phone})` : name;
  };

  // ───── Render ─────
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Vehicle Fleet Directory</h1>
          <p className="mt-1 text-gray-500">Monitor tactical fleet asset distributions and status configurations.</p>
        </div>
        <button
          onClick={() => {
            setShowCreate(true);
            setForm(initialForm);
            setErrors({});
            fetchDrivers();
          }}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 active:scale-95"
        >
          + Add Vehicle
        </button>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Vehicles</p>
              <p className="text-2xl font-bold text-gray-800">{total}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 4 12 14.01 9 11.01" />
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Active</p>
              <p className="text-2xl font-bold text-green-600">{active}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Heavy Trucks</p>
              <p className="text-2xl font-bold text-amber-600">{heavy}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">Active Registry</h2>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
            {vehicles.length} Vehicles
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-900 text-white">
              <tr>
                <th className="px-5 py-3 text-left font-medium">#</th>
                <th className="px-5 py-3 text-left font-medium">Company</th>
                <th className="px-5 py-3 text-left font-medium">Type</th>
                <th className="px-5 py-3 text-left font-medium">Driver</th>
                <th className="px-5 py-3 text-left font-medium">Year</th>
                <th className="px-5 py-3 text-left font-medium">Plate</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-500">Loading vehicles...</td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-500">No vehicles registered.</td>
                </tr>
              ) : (
                vehicles.map((v, idx) => (
                  <tr key={v.id || idx} className="hover:bg-gray-50 transition-colors">
                    <td className="whitespace-nowrap px-5 py-4 font-mono text-blue-600">#{v.id}</td>
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-800">{v.company_name}</td>
                    <td className="whitespace-nowrap px-5 py-4 capitalize text-gray-700">{v.type}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-gray-700">{getDriverName(v)}</td>
                    <td className="whitespace-nowrap px-5 py-4">{v.year || "—"}</td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-mono font-semibold text-rose-600">
                        {v.license_plate}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        (v.status || "active") === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          (v.status || "active") === "active"
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`} />
                        {(v.status || "active") === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedVehicle(v);
                            setShowView(true);
                          }}
                          className="rounded-xl bg-sky-500 p-2 text-white transition hover:bg-sky-600"
                          title="View"
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => openEditModal(v)}
                          className="rounded-xl bg-yellow-500 p-2 text-white transition hover:bg-yellow-600"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(v)}  // ✅ Pass entire object
                          className="rounded-xl bg-red-500 p-2 text-white transition hover:bg-red-600"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* Create Modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowCreate(false)}
        >
          <form
            onSubmit={handleCreate}
            className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4 rounded-t-2xl">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Add New Vehicle
                </h2>
                <p className="text-sm text-gray-500">
                  Enter vehicle details to update the fleet registry.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleFormChange}
                    className={`w-full rounded-xl border bg-white px-4 py-3 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100 ${errors.type ? "border-red-500" : "border-gray-300"}`}
                  >
                    <option value="heavy">Heavy Truck</option>
                    <option value="mini">Mini Truck</option>
                  </select>
                  {errors.type && (
                    <p className="mt-1 text-xs text-red-500">{errors.type}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    value={form.company_name}
                    onChange={handleFormChange}
                    placeholder="e.g. ABC Logistics"
                    className={`w-full rounded-xl border px-4 py-3 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100 ${errors.company_name ? "border-red-500" : "border-gray-300"}`}
                  />
                  {errors.company_name && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.company_name}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Year
                  </label>
                  <input
                    type="text"
                    name="year"
                    value={form.year}
                    onChange={handleFormChange}
                    placeholder="e.g. 2022"
                    className={`w-full rounded-xl border px-4 py-3 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100 ${errors.year ? "border-red-500" : "border-gray-300"}`}
                  />
                  {errors.year && (
                    <p className="mt-1 text-xs text-red-500">{errors.year}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    License Plate <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="license_plate"
                    value={form.license_plate}
                    onChange={handleFormChange}
                    placeholder="e.g. MH-01-AB-1234"
                    className={`w-full rounded-xl border px-4 py-3 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100 ${errors.license_plate ? "border-red-500" : "border-gray-300"}`}
                  />
                  {errors.license_plate && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.license_plate}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    PUC Certificate Number
                  </label>
                  <input
                    type="text"
                    name="puc_certificate_number"
                    value={form.puc_certificate_number}
                    onChange={handleFormChange}
                    placeholder="e.g. RJ06-PUC-12345"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Driver
                  </label>
                  <select
                    name="driver_id"
                    value={form.driver_id || ""}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select Driver</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {getDriverDisplayName(driver)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  PUC Certificate (File Upload)
                </label>
                <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      id="pucFile"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="pucFile"
                      className="cursor-pointer rounded-lg bg-white px-4 py-2 text-sm font-medium text-blue-600 shadow-sm hover:bg-blue-50 transition"
                    >
                      {form.pucFile ? form.pucFile.name : "Choose PUC file"}
                    </label>
                    {form.pucFile && (
                      <span className="text-xs text-green-600">✓ Selected</span>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleFormChange}
                  rows="3"
                  placeholder="Additional notes..."
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-gray-50 px-6 py-4 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Adding…" : "Add Vehicle"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View Modal */}
      {showView && selectedVehicle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowView(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Vehicle Details
              </h2>
              <button
                onClick={() => setShowView(false)}
                className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    Vehicle ID
                  </label>
                  <p className="font-mono font-semibold">
                    {selectedVehicle.vehicle_id}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    Type
                  </label>
                  <p className="capitalize">{selectedVehicle.type}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    Company
                  </label>
                  <p>{selectedVehicle.company_name}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    Year
                  </label>
                  <p>{selectedVehicle.year || "—"}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    License Plate
                  </label>
                  <p className="font-mono font-semibold text-rose-600">
                    {selectedVehicle.license_plate}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    Driver
                  </label>
                  <p className="font-medium text-gray-800">
                    {getDriverName(selectedVehicle)}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    PUC Number
                  </label>
                  <p>{selectedVehicle.puc_certificate_number || "—"}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    PUC Expiry
                  </label>
                  <p>{selectedVehicle.puc_expiry_date || "—"}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    Status
                  </label>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      (selectedVehicle.status || "active") === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {(selectedVehicle.status || "active") === "active"
                      ? "Active"
                      : "Inactive"}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">
                  Notes
                </label>
                <p className="mt-1 rounded-lg bg-gray-50 p-3 text-gray-700">
                  {selectedVehicle.notes || "—"}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4 rounded-b-2xl">
              <button
                onClick={() => setShowView(false)}
                className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowView(false);
                  openEditModal(selectedVehicle);
                }}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && editForm && selectedVehicle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowEdit(false)}
        >
          <form
            onSubmit={handleEditSubmit}
            className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b bg-white px-6 py-4 rounded-t-2xl">
  <div>
    <h2 className="text-lg font-semibold text-gray-800">
      Edit Vehicle
    </h2>
    <p className="text-sm text-gray-500">
      Update vehicle information.
      {editForm?.driver_id && (
        <span className="ml-2 text-blue-600">
          Current Driver: {getDriverName(selectedVehicle)}
        </span>
      )}
    </p>
  </div>
  <button
    type="button"
    onClick={() => setShowEdit(false)}
    className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
  >
    ✕
  </button>
</div>
            <div className="p-6 space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type"
                    value={editForm.type}
                    onChange={handleEditFormChange}
                    className={`w-full rounded-xl border bg-white px-4 py-3 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100 ${errors.type ? "border-red-500" : "border-gray-300"}`}
                  >
                    <option value="heavy">Heavy Truck</option>
                    <option value="mini">Mini Truck</option>
                  </select>
                  {errors.type && (
                    <p className="mt-1 text-xs text-red-500">{errors.type}</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    value={editForm.company_name}
                    onChange={handleEditFormChange}
                    className={`w-full rounded-xl border px-4 py-3 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100 ${errors.company_name ? "border-red-500" : "border-gray-300"}`}
                  />
                  {errors.company_name && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.company_name}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Year
                  </label>
                  <input
                    type="text"
                    name="year"
                    value={editForm.year}
                    onChange={handleEditFormChange}
                    className={`w-full rounded-xl border px-4 py-3 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100 ${errors.year ? "border-red-500" : "border-gray-300"}`}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    License Plate <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="license_plate"
                    value={editForm.license_plate}
                    onChange={handleEditFormChange}
                    className={`w-full rounded-xl border px-4 py-3 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100 ${errors.license_plate ? "border-red-500" : "border-gray-300"}`}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    PUC Certificate Number
                  </label>
                  <input
                    type="text"
                    name="puc_certificate_number"
                    value={editForm.puc_certificate_number}
                    onChange={handleEditFormChange}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    name="status"
                    value={editForm.status || "active"}
                    onChange={handleEditFormChange}
                    className="w-full rounded-xl border bg-white px-4 py-3 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Driver
                  </label>
                  <select
                    name="driver_id"
                    value={editForm?.driver_id || ""}  // ✅ This should show selected
                    onChange={handleEditFormChange}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select Driver</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {getDriverDisplayName(driver)}
                      </option>
                    ))}
                  </select>
                  {editForm?.driver_id && (
                    <p className="mt-1 text-xs text-green-600">
                      ✅ Selected Driver ID: {editForm.driver_id}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Replace PUC Certificate
                </label>
                <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      id="editPucFile"
                      onChange={handleEditFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="editPucFile"
                      className="cursor-pointer rounded-lg bg-white px-4 py-2 text-sm font-medium text-blue-600 shadow-sm hover:bg-blue-50 transition"
                    >
                      {editForm.pucFile
                        ? editForm.pucFile.name
                        : "Choose new file"}
                    </label>
                    {editForm.pucFile && (
                      <span className="text-xs text-green-600">✓ Selected</span>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={editForm.notes}
                  onChange={handleEditFormChange}
                  rows="3"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-gray-50 px-6 py-4 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setShowEdit(false)}
                className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Updating…" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}