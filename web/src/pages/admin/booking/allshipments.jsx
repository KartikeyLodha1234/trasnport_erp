import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useNavigate, useLocation } from "react-router-dom";

const API_BASE = "http://localhost:8000/api";

const toKg = (weight, unitType) => {
  const w = parseFloat(weight) || 0;
  return (unitType || "kg").toLowerCase() === "ton" ? w * 1000 : w;
};

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const csvEscape = (value) => {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export default function Shipments() {
  const navigate = useNavigate();
  const challanPrintRef = useRef(null);
  const location = useLocation();
  
  // ─── STATE DECLARATIONS ───
  const [shipments, setShipments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [parties, setParties] = useState([]);
  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState("desc");
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [routeFilter, setRouteFilter] = useState("all");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isChallanOpen, setIsChallanOpen] = useState(false);
  const [isCreateChallanOpen, setIsCreateChallanOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);

  const [selectedLRs, setSelectedLRs] = useState([]);
  const [challanDriver, setChallanDriver] = useState("");
  const [challanVehicle, setChallanVehicle] = useState("");
  const [challanAdvance, setChallanAdvance] = useState("");
  const [challanRoute, setChallanRoute] = useState("");
  const [generatedChallan, setGeneratedChallan] = useState(null);
  const [challanSaving, setChallanSaving] = useState(false);

  const [editFormData, setEditFormData] = useState({
    driver_id: "",
    vehicle_id: "",
    status: "",
    eta: "",
    notes: "",
    delay_category: "",
    route_id: "",
  });

  // ─── FETCH ALL DATA ───
  const fetchAll = async () => {
    try {
      console.log("🔍 Fetching shipments data...");
      
      const fetchList = async (path) => {
        const response = await fetch(`${API_BASE}${path}`);
        if (!response.ok) throw new Error(`${path} returned ${response.status}`);
        const payload = await response.json();
        const list = payload?.data ?? payload;
        return Array.isArray(list) ? list : [];
      };

      const lists = [];
      for (const path of [
        "/shipments/",
        "/drivers/",
        "/vehicles/",
        "/parties/",
        "/branches/",
        "/routes/",
      ]) {
        try {
          lists.push(await fetchList(path));
        } catch (error) {
          console.error(`Could not load ${path}`, error);
          lists.push([]);
        }
      }
      const [arr, driversData, vehiclesData, partiesData, branchesData, routesData] = lists;
      
      console.log("📦 Routes data received:", routesData);
      
      setShipments(
        [...arr].sort((a, b) =>
          sortOrder === "asc" ? a.id - b.id : b.id - a.id,
        ),
      );
      setDrivers(driversData);
      setVehicles(vehiclesData);
      setParties(partiesData);
      setBranches(branchesData);
      setRoutes(routesData);
    } catch (e) {
      console.error("Fetch error:", e);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ─── HELPER FUNCTIONS ───
  const getDriver = (id) =>
    drivers.find((x) => x.id === id || x.id === parseInt(id));
  const getVehicle = (id) =>
    vehicles.find((x) => x.id === id || x.id === parseInt(id));
  const getParty = (id) =>
    parties.find((x) => x.id === id || x.id === parseInt(id));
  const getRoute = (id) =>
    routes.find((x) => x.id === id || x.id === parseInt(id));

  const getDriverName = (id) => getDriver(id)?.full_name || "Not Assigned";
  const getVehicleInfo = (id) => {
    const v = getVehicle(id);
    return v ? `${v.vehicle_id} — ${v.license_plate || ""}` : "Not Assigned";
  };
  const getRouteName = (id) => {
    const r = getRoute(id);
    return r?.route_name || r?.name || "N/A";
  };

  const statusMap = {
    delivered: { bg: "#dcfce7", color: "#166534", label: "Delivered" },
    "in-transit": { bg: "#dbeafe", color: "#1e40af", label: "In Transit" },
    "in transit": { bg: "#dbeafe", color: "#1e40af", label: "In Transit" },
    transit: { bg: "#dbeafe", color: "#1e40af", label: "In Transit" },
    pending: { bg: "#fef3c7", color: "#92400e", label: "Pending" },
    loading: { bg: "#f1f5f9", color: "#475569", label: "Loading" },
    delayed: { bg: "#fee2e2", color: "#991b1b", label: "Delayed" },
  };
  const getStatus = (s) =>
    statusMap[(s || "").toLowerCase()] || {
      bg: "#f1f5f9",
      color: "#475569",
      label: s || "Pending",
    };

  const fmt = (d) => {
    if (!d) return "N/A";
    try {
      return new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  const pendingForChallan = shipments.filter(
    (s) =>
      ["pending", "loading"].includes((s.status || "").toLowerCase()) &&
      !s.challan_number,
  );
  const pendingForChallanIds = pendingForChallan.map((s) => s.id);

  // ─── FILTERED DATA ───
  const filtered = shipments.filter((s) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      (s.lr_number || "").toLowerCase().includes(q) ||
      (s.client || "").toLowerCase().includes(q) ||
      (s.destination || "").toLowerCase().includes(q) ||
      String(s.id).includes(q);
    const matchStatus =
      statusFilter === "all" ||
      (s.status || "").toLowerCase() === statusFilter.toLowerCase() ||
      (statusFilter === "in-transit" &&
        ["in transit", "transit"].includes((s.status || "").toLowerCase())) ||
      (statusFilter === "pending" &&
        ["loading"].includes((s.status || "").toLowerCase()));
    const matchRoute =
      routeFilter === "all" || s.route_id === parseInt(routeFilter);
    return matchSearch && matchStatus && matchRoute;
  });

  const stats = {
    total: shipments.length,
    delivered: shipments.filter(
      (s) => (s.status || "").toLowerCase() === "delivered",
    ).length,
    transit: shipments.filter((s) =>
      ["in-transit", "in transit", "transit"].includes(
        (s.status || "").toLowerCase(),
      ),
    ).length,
    pending: shipments.filter((s) =>
      ["pending", "loading"].includes((s.status || "").toLowerCase()),
    ).length,
  };

  // ─── CRUD OPERATIONS ───
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this shipment?")) return;
    try {
      const res = await fetch(`${API_BASE}/shipments/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchAll();
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.detail || "Failed to delete shipment.");
      }
    } catch {
      alert("Network error — failed to delete shipment.");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/shipments/${selectedShipment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        fetchAll();
      } else {
        const d = await res.json();
        alert(d.detail || "Update failed");
      }
    } catch {
      alert("Update failed");
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (s) => {
    setSelectedShipment(s);
    setEditFormData({
      driver_id: s.driver_id || "",
      vehicle_id: s.vehicle_id || "",
      status: s.status || "pending",
      eta: s.eta ? String(s.eta).substring(0, 16) : "",
      notes: s.notes || "",
      route_id: s.route_id || "",
    });
    setIsEditModalOpen(true);
  };

  // ─── EXPORT FUNCTIONS ───
  const exportCSV = () => {
    const header = [
      "ID",
      "LR",
      "Client",
      "Destination",
      "Route",
      "Driver",
      "Vehicle",
      "Status",
      "ETA",
      "Freight",
    ];
    const rows = filtered.map((s) => [
      s.id,
      s.lr_number,
      s.client,
      s.destination,
      getRouteName(s.route_id),
      getDriverName(s.driver_id),
      getVehicleInfo(s.vehicle_id),
      getStatus(s.status).label,
      fmt(s.eta),
      s.freight_charge || 0,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob(["\uFEFF" + csv], { type: "text/csv" }),
    );
    a.download = "shipments.csv";
    a.click();
    setIsExportOpen(false);
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        filtered.map((s) => ({
          ID: s.id,
          LR: s.lr_number,
          Client: s.client,
          Destination: s.destination,
          Route: getRouteName(s.route_id),
          Driver: getDriverName(s.driver_id),
          Vehicle: getVehicleInfo(s.vehicle_id),
          Status: getStatus(s.status).label,
          ETA: fmt(s.eta),
          Freight: s.freight_charge || 0,
        })),
      ),
      "Shipments",
    );
    XLSX.writeFile(wb, "shipments.xlsx");
    setIsExportOpen(false);
  };

  const exportPDF = () => {
    const doc = new jsPDF("landscape");
    doc.text("Shipment Report — FleetChain", 140, 15, { align: "center" });
    doc.autoTable({
      startY: 25,
      head: [
        [
          "ID",
          "LR Number",
          "Client",
          "Destination",
          "Route",
          "Driver",
          "Status",
          "ETA",
          "Freight (₹)",
        ],
      ],
      body: filtered.map((s) => [
        s.id,
        s.lr_number,
        s.client,
        s.destination,
        getRouteName(s.route_id),
        getDriverName(s.driver_id),
        getStatus(s.status).label,
        fmt(s.eta),
        s.freight_charge || 0,
      ]),
      theme: "striped",
    });
    doc.save("shipments.pdf");
    setIsExportOpen(false);
  };

  // ─── CHALLAN FUNCTIONS ───
  const toggleLR = (id) => {
    setSelectedLRs((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const isAllSelected =
    pendingForChallanIds.length > 0 &&
    pendingForChallanIds.every((id) => selectedLRs.includes(id));

  const generateChallan = async () => {
    if (selectedLRs.length === 0) {
      alert("Select at least one LR");
      return;
    }
    if (!challanDriver) {
      alert("Select a driver");
      return;
    }
    if (!challanVehicle) {
      alert("Select a vehicle");
      return;
    }
    if (!challanRoute) {
      alert("Select a route");
      return;
    }

    const lrs = shipments.filter((s) => selectedLRs.includes(s.id));
    const driver = getDriver(challanDriver);
    const vehicle = getVehicle(challanVehicle);
    const now = new Date();
    const challanNo = `CH-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

    const advanceValue = parseFloat(challanAdvance) || 0;

    const totalFreight = lrs.reduce(
      (sum, s) => sum + (parseFloat(s.freight_charge) || 0),
      0,
    );
    const totalWeightKg = lrs.reduce(
      (sum, s) => sum + toKg(s.weight, s.weight_type),
      0,
    );

    const challan = {
      challanNo,
      date: now.toISOString().split("T")[0],
      driver,
      vehicle,
      lrs,
      advance: advanceValue,
      totalFreight,
      totalWeightKg,
      balanceDue: totalFreight - advanceValue,
      routeId: challanRoute,
    };

    setGeneratedChallan(challan);
    setIsCreateChallanOpen(false);
    setIsChallanOpen(true);
    setChallanSaving(true);

    try {
      await fetch(`${API_BASE}/challans/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challan_no: challanNo,
          date: challan.date,
          driver_id: challanDriver,
          vehicle_id: challanVehicle,
          shipment_ids: selectedLRs,
          advance_paid: advanceValue,
          route_id: challanRoute,
          total_freight: lrs.reduce(
            (sum, s) => sum + (parseFloat(s.freight_charge) || 0),
            0,
          ),
          total_weight_kg: lrs.reduce(
            (sum, s) => sum + toKg(s.weight, s.weight_type),
            0,
          ),
        }),
      })
        .then((res) => {
          if (res.ok) fetchAll();
        })
        .catch(() => null);
    } finally {
      setChallanSaving(false);
    }
  };

  const printChallan = () => window.print();

  const downloadChallanPDF = () => {
    if (!generatedChallan) return;
    const { challanNo, date, driver, vehicle, lrs, advance, balanceDue } =
      generatedChallan;

    const doc = new jsPDF("landscape");

    doc.setFillColor(11, 18, 32);
    doc.rect(0, 0, 297, 25, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("FleetChain Logistics", 14, 12);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Transport Management System", 14, 19);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("LORRY CHALLAN", 240, 12);
    doc.text(challanNo, 240, 19);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${fmt(date)}`, 14, 33);
    doc.text(
      `Driver: ${driver?.full_name || "N/A"}  |  Vehicle: ${vehicle?.vehicle_id || "N/A"} — ${vehicle?.license_plate || ""}`,
      14,
      40,
    );

    const totalFreight = lrs.reduce(
      (sum, s) => sum + (parseFloat(s.freight_charge) || 0),
      0,
    );
    const totalWeightKg = lrs.reduce(
      (sum, s) => sum + toKg(s.weight, s.weight_type),
      0,
    );

    doc.autoTable({
      startY: 48,
      head: [
        [
          "LR Number",
          "From",
          "To",
          "Consignor",
          "Consignee",
          "Goods",
          "Weight",
          "Freight (₹)",
        ],
      ],
      body: lrs.map((s) => [
        s.lr_number || "N/A",
        s.pickup_location || "N/A",
        s.delivery_location || s.destination || "N/A",
        getParty(s.consignor_id)?.name || s.client || "N/A",
        getParty(s.consignee_id)?.name || "N/A",
        s.goods_desc || "N/A",
        `${s.weight || 0} ${s.weight_type || "kg"}`,
        `₹${s.freight_charge || 0}`,
      ]),
      foot: [
        [
          "",
          "",
          "",
          "",
          "",
          "Total (normalized):",
          `${totalWeightKg.toLocaleString("en-IN")} kg`,
          `₹${totalFreight.toLocaleString("en-IN")}`,
        ],
      ],
      theme: "striped",
      headStyles: { fillColor: [11, 18, 32] },
      footStyles: { fontStyle: "bold", fillColor: [240, 253, 244] },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 32 },
        2: { cellWidth: 32 },
        3: { cellWidth: 40 },
        4: { cellWidth: 40 },
        5: { cellWidth: 45 },
        6: { cellWidth: 24 },
        7: { cellWidth: 24 },
      },
      styles: { fontSize: 9, cellPadding: 3 },
    });

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(
      `Advance / Batta Paid: Rs. ${(advance || 0).toLocaleString("en-IN")}`,
      14,
      doc.lastAutoTable.finalY + 10,
    );
    doc.text(
      `Balance Due on Delivery: Rs. ${(balanceDue || 0).toLocaleString("en-IN")}`,
      14,
      doc.lastAutoTable.finalY + 17,
    );

    const finalY = doc.lastAutoTable.finalY + 30;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text("Consignor Signature: ___________________", 14, finalY);
    doc.text("Driver Signature: ___________________", 120, finalY);
    doc.text("Receiver Signature: ___________________", 226, finalY);
    doc.text(
      "Generated by FleetChain TMS • Booked at Owner's Risk",
      14,
      finalY + 12,
    );

    doc.save(`${challanNo}.pdf`);
  };

  // ─── RENDER ───
  return (
    <PageWrapper>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #challan-print-area, #challan-print-area * { visibility: visible; }
          #challan-print-area { position: absolute; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* ─── HEADER ─── */}
      <HeaderSection>
        <div>
          <h1>🚚 Shipment Operations</h1>
          <p>View, create, and manage all consignments.</p>
        </div>
        <ActionButtons>
          <button
            className="btn-challan"
            onClick={async () => {
              setSelectedLRs([]);
              setChallanDriver("");
              setChallanVehicle("");
              setChallanAdvance("");
              setChallanRoute("");
              await fetchAll();
              setIsCreateChallanOpen(true);
            }}
          >
            📋 Create Challan
          </button>
          <div style={{ position: "relative" }}>
            <button
              className="btn-secondary"
              onClick={() => setIsExportOpen(!isExportOpen)}
            >
              📊 Export
            </button>
            {isExportOpen && (
              <DropdownMenu>
                <DropdownItem onClick={exportCSV}>
                  <span>📄</span>
                  <div>
                    <strong>CSV</strong>
                    <small>{filtered.length} records</small>
                  </div>
                </DropdownItem>
                <DropdownItem onClick={exportExcel}>
                  <span>📊</span>
                  <div>
                    <strong>Excel</strong>
                    <small>{filtered.length} records</small>
                  </div>
                </DropdownItem>
                <DropdownItem onClick={exportPDF}>
                  <span>📑</span>
                  <div>
                    <strong>PDF</strong>
                    <small>{filtered.length} records</small>
                  </div>
                </DropdownItem>
              </DropdownMenu>
            )}
          </div>
          <button className="btn-secondary" onClick={fetchAll}>
            🔄 Refresh
          </button>
        </ActionButtons>
      </HeaderSection>

      {/* ─── STATS ─── */}
      <StatsGrid>
        {[
          {
            icon: "📦",
            label: "Total LRs",
            value: stats.total,
            bg: "#eff6ff",
            color: "#2563eb",
          },
          {
            icon: "✅",
            label: "Delivered",
            value: stats.delivered,
            bg: "#f0fdf4",
            color: "#16a34a",
          },
          {
            icon: "🚚",
            label: "In Transit",
            value: stats.transit,
            bg: "#dbeafe",
            color: "#2563eb",
          },
          {
            icon: "⏳",
            label: "Pending",
            value: stats.pending,
            bg: "#fef3c7",
            color: "#d97706",
          },
        ].map((s) => (
          <StatCard key={s.label}>
            <div className="icon" style={{ background: s.bg, color: s.color }}>
              {s.icon}
            </div>
            <div>
              <div className="label">{s.label}</div>
              <div className="value">{s.value}</div>
            </div>
          </StatCard>
        ))}
      </StatsGrid>

      {/* ─── FILTERS ─── */}
      <FilterBar>
        <SearchBox
          type="text"
          placeholder="🔍 Search by LR No, Client, Destination..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <FilterSelect
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="loading">Loading</option>
          <option value="in-transit">In Transit</option>
          <option value="delayed">Delayed</option>
          <option value="delivered">Delivered</option>
        </FilterSelect>
        <FilterSelect
          value={routeFilter}
          onChange={(e) => setRouteFilter(e.target.value)}
        >
          <option value="all">All Routes</option>
          {routes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.route_name || r.name || `Route #${r.id}`}
            </option>
          ))}
        </FilterSelect>
        <span style={{ fontSize: 13, color: "#94a3b8", marginLeft: "auto" }}>
          {filtered.length} of {stats.total} shipments
        </span>
      </FilterBar>

      {/* ─── TABLE ─── */}
      <TableCard>
        <div className="card-header">
          <h2>📋 All Consignments</h2>
          <button
            className="btn-sort"
            onClick={() => {
              const o = sortOrder === "asc" ? "desc" : "asc";
              setSortOrder(o);
              setShipments(
                [...shipments].sort((a, b) =>
                  o === "asc" ? a.id - b.id : b.id - a.id,
                ),
              );
            }}
          >
            Sort {sortOrder === "asc" ? "↑" : "↓"}
          </button>
        </div>
        <TableWrapper>
          <Table>
            <thead>
              <tr>
                <th>ID</th>
                <th>LR Number</th>
                <th>Client</th>
                <th>Destination</th>
                <th>Route</th>
                <th>Driver</th>
                <th>Vehicle</th>
                <th>Status</th>
                <th>ETA</th>
                <th>Freight</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: "center", padding: 48, color: "#94a3b8" }}>
                    No consignments found.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const st = getStatus(s.status);
                  return (
                    <tr key={s.id}>
                      <td>
                        <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#2563eb" }}>
                          #{s.id}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontFamily: "monospace", fontWeight: 700 }}>
                          {s.lr_number || "N/A"}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{s.client || "N/A"}</td>
                      <td>{s.destination || "N/A"}</td>
                      <td>{getRouteName(s.route_id)}</td>
                      <td>{getDriverName(s.driver_id)}</td>
                      <td>{getVehicleInfo(s.vehicle_id)}</td>
                      <td>
                        <Badge bg={st.bg} color={st.color}>
                          {st.label}
                        </Badge>
                      </td>
                      <td>{fmt(s.eta)}</td>
                      <td style={{ fontWeight: 600 }}>{inr(s.freight_charge)}</td>
                      <td>
                        <BtnRow>
                          <IconBtn
                            title="View LR"
                            onClick={() => {
                              setSelectedShipment(s);
                              setIsViewModalOpen(true);
                            }}
                          >
                            👁️
                          </IconBtn>
                          <IconBtn
                            title="Assign Driver / Edit"
                            onClick={() => openEdit(s)}
                          >
                            ✏️
                          </IconBtn>
                          <IconBtn
                            title="Delete"
                            danger
                            onClick={() => handleDelete(s.id)}
                          >
                            🗑️
                          </IconBtn>
                        </BtnRow>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </TableWrapper>
      </TableCard>

      {/* ─── VIEW LR MODAL ─── */}
      {isViewModalOpen && selectedShipment && (
        <ModalOverlay className="no-print" onClick={() => setIsViewModalOpen(false)}>
          <Modal onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <ModalHead>
              <h5>📄 LR Details — {selectedShipment.lr_number}</h5>
              <CloseBtn onClick={() => setIsViewModalOpen(false)}>✕</CloseBtn>
            </ModalHead>
            <ModalBody>
              <Grid2>
                {[
                  ["Shipment ID", `#${selectedShipment.id}`],
                  ["LR Number", selectedShipment.lr_number],
                  ["Booking Date", fmt(selectedShipment.booking_date || selectedShipment.created_at)],
                  ["Status", <Badge bg={getStatus(selectedShipment.status).bg} color={getStatus(selectedShipment.status).color}>{getStatus(selectedShipment.status).label}</Badge>],
                  ["Pickup", selectedShipment.pickup_location || "N/A"],
                  ["Delivery", selectedShipment.delivery_location || selectedShipment.destination || "N/A"],
                  ["Route", getRouteName(selectedShipment.route_id)],
                  ["Consignor", getParty(selectedShipment.consignor_id)?.name || selectedShipment.client || "N/A"],
                  ["Consignee", getParty(selectedShipment.consignee_id)?.name || "N/A"],
                  ["Goods", selectedShipment.goods_desc || "N/A"],
                  ["Weight", `${selectedShipment.weight || 0} ${selectedShipment.weight_type || "kg"}`],
                  ["Packages", selectedShipment.packages || 0],
                  ["Invoice No", selectedShipment.invoice_no || "N/A"],
                  ["Invoice Value", inr(selectedShipment.invoice_value)],
                  ["E-Way Bill", selectedShipment.eway_bill || "N/A"],
                  ["Payment Mode", (selectedShipment.payment_mode || "N/A").toUpperCase()],
                  ["ETA", fmt(selectedShipment.eta)],
                  ["Driver", getDriverName(selectedShipment.driver_id)],
                  ["Vehicle", getVehicleInfo(selectedShipment.vehicle_id)],
                  ["Freight", inr(selectedShipment.freight_charge)],
                  ["Loading", inr(selectedShipment.loading_charges)],
                  ["Unloading", inr(selectedShipment.unloading_charges)],
                  ["Other", inr(selectedShipment.other_charges)],
                  ["Discount", inr(selectedShipment.discount)],
                  ["GST", inr(selectedShipment.gst)],
                  ["Total Amount", <strong style={{ fontSize: 16, color: "#166534" }}>{inr(selectedShipment.total_amount != null ? selectedShipment.total_amount : selectedShipment.freight_charge || 0)}</strong>],
                ].map(([label, val]) => (
                  <InfoItem key={label}>
                    <div className="label">{label}</div>
                    <div className="val">{val}</div>
                  </InfoItem>
                ))}
                {selectedShipment.notes && (
                  <InfoItem style={{ gridColumn: "1/-1" }}>
                    <div className="label">Notes</div>
                    <div className="val" style={{ background: "#fefce8", padding: "8px 12px", borderRadius: 6, border: "1px solid #fde68a", color: "#92400e" }}>
                      {selectedShipment.notes}
                    </div>
                  </InfoItem>
                )}
              </Grid2>
            </ModalBody>
            <ModalFoot>
              <Btn onClick={() => setIsViewModalOpen(false)}>Close</Btn>
              <Btn primary onClick={() => { setIsViewModalOpen(false); openEdit(selectedShipment); }}>
                ✏️ Edit
              </Btn>
            </ModalFoot>
          </Modal>
        </ModalOverlay>
      )}

      {/* ─── EDIT MODAL ─── */}
      {isEditModalOpen && selectedShipment && (
        <ModalOverlay className="no-print" onClick={() => setIsEditModalOpen(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHead>
              <h5>✏️ Update Shipment #{selectedShipment.id}</h5>
              <CloseBtn onClick={() => setIsEditModalOpen(false)}>✕</CloseBtn>
            </ModalHead>
            <ModalBody>
              <form id="editForm" onSubmit={handleUpdate}>
                <FRow>
                  <FGroup>
                    <label>👤 Assign Driver</label>
                    <select
                      value={editFormData.driver_id}
                      onChange={(e) => setEditFormData((p) => ({ ...p, driver_id: e.target.value }))}
                    >
                      <option value="">-- Select Driver --</option>
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.full_name || d.name || `Driver #${d.id}`}
                        </option>
                      ))}
                    </select>
                  </FGroup>
                  <FGroup>
                    <label>🚛 Assign Vehicle</label>
                    <select
                      value={editFormData.vehicle_id}
                      onChange={(e) => setEditFormData((p) => ({ ...p, vehicle_id: e.target.value }))}
                    >
                      <option value="">-- Select Vehicle --</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.vehicle_id} — {v.license_plate || ""}
                        </option>
                      ))}
                    </select>
                  </FGroup>
                </FRow>
                <FRow>
                  <FGroup>
                    <label>📍 Route</label>
                    <select
                      value={editFormData.route_id}
                      onChange={(e) => setEditFormData((p) => ({ ...p, route_id: e.target.value }))}
                    >
                      <option value="">-- Select Route --</option>
                      {routes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.route_name || r.name || `Route #${r.id}`}
                          {r.from_location && r.to_location ? ` (${r.from_location} → ${r.to_location})` : ''}
                        </option>
                      ))}
                    </select>
                  </FGroup>
                  <FGroup>
                    <label>📊 Status</label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData((p) => ({ ...p, status: e.target.value }))}
                    >
                      <option value="pending">Pending</option>
                      <option value="loading">Loading</option>
                      <option value="in-transit">In Transit</option>
                      <option value="delayed">Delayed</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </FGroup>
                </FRow>
                <FRow>
                  <FGroup>
                    <label>⏰ ETA</label>
                    <input
                      type="datetime-local"
                      value={editFormData.eta}
                      onChange={(e) => setEditFormData((p) => ({ ...p, eta: e.target.value }))}
                    />
                  </FGroup>
                </FRow>
                <FGroup style={{ marginBottom: 0 }}>
                  <label>📝 Notes</label>
                  <textarea
                    rows={3}
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData((p) => ({ ...p, notes: e.target.value }))}
                  />
                </FGroup>
                <InfoBanner style={{ marginTop: 16 }}>
                  <strong>LR:</strong> {selectedShipment.lr_number} &nbsp;|&nbsp; <strong>From:</strong> {selectedShipment.pickup_location} → {selectedShipment.delivery_location || selectedShipment.destination} &nbsp;|&nbsp; <strong>Freight:</strong> {inr(selectedShipment.freight_charge)}
                </InfoBanner>
              </form>
            </ModalBody>
            <ModalFoot>
              <Btn onClick={() => setIsEditModalOpen(false)}>Cancel</Btn>
              <Btn primary type="submit" form="editForm" disabled={loading}>
                {loading ? "Saving..." : "✅ Save"}
              </Btn>
            </ModalFoot>
          </Modal>
        </ModalOverlay>
      )}

      {/* ─── CREATE CHALLAN MODAL ─── */}
      {isCreateChallanOpen && (
        <ModalOverlay className="no-print" onClick={() => setIsCreateChallanOpen(false)}>
          <Modal onClick={(e) => e.stopPropagation()} style={{ maxWidth: 950 }}>
            <ModalHead>
              <h5>📋 Create Challan — Select LRs</h5>
              <CloseBtn onClick={() => setIsCreateChallanOpen(false)}>✕</CloseBtn>
            </ModalHead>
            <ModalBody>
              <FRow style={{ marginBottom: 20 }}>
                <FGroup>
                  <label>👤 Driver <span style={{ color: "#ef4444" }}>*</span></label>
                  <select value={challanDriver} onChange={(e) => setChallanDriver(e.target.value)}>
                    <option value="">-- Select Driver --</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.full_name || d.name || `Driver #${d.id}`}
                      </option>
                    ))}
                  </select>
                </FGroup>
                <FGroup>
                  <label>🚛 Vehicle <span style={{ color: "#ef4444" }}>*</span></label>
                  <select value={challanVehicle} onChange={(e) => setChallanVehicle(e.target.value)}>
                    <option value="">-- Select Vehicle --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicle_id} — {v.license_plate || ""}
                      </option>
                    ))}
                  </select>
                </FGroup>
              </FRow>

              {/* ✅ YELLOW HIGHLIGHTED AREA - Advance + Route */}
              <FRow style={{ marginBottom: 20, background: "#fffbeb", padding: "16px", borderRadius: "8px", border: "2px solid #fbbf24" }}>
                <FGroup>
                  <label>💰 Initial Advance / Batta (INR)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g., 5000 for fuel/tolls"
                    value={challanAdvance}
                    onChange={(e) => setChallanAdvance(e.target.value)}
                  />
                </FGroup>
                <FGroup>
                  <label>📍 Route <span style={{ color: "#ef4444" }}>*</span></label>
                  <select
                    value={challanRoute}
                    onChange={(e) => setChallanRoute(e.target.value)}
                  >
                    <option value="">-- Select Route --</option>
                    {routes.length === 0 ? (
                      <option value="" disabled>No routes available</option>
                    ) : (
                      routes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.route_name || r.name || `Route #${r.id}`}
                          {r.from_location && r.to_location ? ` (${r.from_location} → ${r.to_location})` : ''}
                        </option>
                      ))
                    )}
                  </select>
                </FGroup>
              </FRow>

              <div style={{ fontWeight: 600, fontSize: 14, color: "#475569", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Select LRs to include in this challan:</span>
                <span style={{ fontWeight: 500, color: "#94a3b8" }}>Pending or loading LRs not yet on a challan</span>
              </div>

              {pendingForChallan.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32, color: "#94a3b8", background: "#f8fafc", borderRadius: 8, border: "1px dashed #e2e8f0" }}>
                  No eligible LRs available. Create a pending booking first.
                </div>
              ) : (
                <LRSelectTable>
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={(e) => {
                            setSelectedLRs(e.target.checked ? pendingForChallanIds : []);
                          }}
                        />
                      </th>
                      <th>LR Number</th>
                      <th>From → To</th>
                      <th>Route</th>
                      <th>Client</th>
                      <th>Goods</th>
                      <th>Weight</th>
                      <th>Freight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingForChallan.map((s) => (
                      <tr
                        key={s.id}
                        style={{ background: selectedLRs.includes(s.id) ? "#eff6ff" : "white", cursor: "pointer" }}
                        onClick={() => toggleLR(s.id)}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedLRs.includes(s.id)}
                            onChange={() => toggleLR(s.id)}
                          />
                        </td>
                        <td style={{ fontFamily: "monospace", fontWeight: 700 }}>{s.lr_number || "N/A"}</td>
                        <td>{s.pickup_location || "N/A"} → {s.delivery_location || s.destination || "N/A"}</td>
                        <td>{getRouteName(s.route_id)}</td>
                        <td>{getParty(s.consignor_id)?.name || s.client || "N/A"}</td>
                        <td>{s.goods_desc || "N/A"}</td>
                        <td>{s.weight || 0} {s.weight_type || "kg"}</td>
                        <td>{inr(s.freight_charge)}</td>
                      </tr>
                    ))}
                  </tbody>
                </LRSelectTable>
              )}

              {selectedLRs.length > 0 && (
                <SummaryBox>
                  <span>✅ {selectedLRs.length} LR{selectedLRs.length > 1 ? "s" : ""} selected</span>
                  <span>Total Freight: {inr(shipments.filter((s) => selectedLRs.includes(s.id)).reduce((sum, s) => sum + (parseFloat(s.freight_charge) || 0), 0))}</span>
                  <span>Total Weight: {shipments.filter((s) => selectedLRs.includes(s.id)).reduce((sum, s) => sum + toKg(s.weight, s.weight_type), 0).toLocaleString("en-IN")} kg</span>
                  <span style={{ color: "#2563eb" }}>Advance: {inr(parseFloat(challanAdvance) || 0)}</span>
                  <span style={{ color: "#dc2626" }}>Balance: {inr((shipments.filter((s) => selectedLRs.includes(s.id)).reduce((sum, s) => sum + (parseFloat(s.freight_charge) || 0), 0)) - (parseFloat(challanAdvance) || 0))}</span>
                  <span style={{ color: "#7c3aed" }}>Route: {challanRoute ? routes.find(r => r.id === parseInt(challanRoute))?.route_name || "N/A" : "Not selected"}</span>
                </SummaryBox>
              )}
            </ModalBody>
            <ModalFoot>
              <Btn onClick={() => setIsCreateChallanOpen(false)}>Cancel</Btn>
              <Btn 
                primary 
                onClick={generateChallan} 
                disabled={selectedLRs.length === 0 || challanSaving || !challanRoute}
              >
                {challanSaving ? "Generating..." : `📋 Generate Challan (${selectedLRs.length} LRs)`}
              </Btn>
            </ModalFoot>
          </Modal>
        </ModalOverlay>
      )}

      {/* ─── CHALLAN VIEW MODAL ─── */}
      {isChallanOpen && generatedChallan && (
        <ModalOverlay className="no-print" onClick={() => setIsChallanOpen(false)}>
          <ChallanDoc id="challan-print-area" ref={challanPrintRef} onClick={(e) => e.stopPropagation()}>
            <ChallanHeader>
              <div>
                <ChallanBrand>FleetChain Logistics</ChallanBrand>
                <ChallanSub>Transport Management System · GST Reg. Transport Service</ChallanSub>
              </div>
              <ChallanHeaderRight>
                <ChallanTag>Lorry Challan</ChallanTag>
                <ChallanSub>Original Copy</ChallanSub>
              </ChallanHeaderRight>
            </ChallanHeader>
            <ChallanNumberBanner>
              <div>
                <BannerLabel>Challan Number</BannerLabel>
                <BannerValue>{generatedChallan.challanNo}</BannerValue>
              </div>
              <div style={{ textAlign: "right" }}>
                <BannerLabel>Date</BannerLabel>
                <BannerValueSmall>{fmt(generatedChallan.date)}</BannerValueSmall>
              </div>
            </ChallanNumberBanner>
            <ChallanBody>
              <InfoCardGrid>
                <InfoCard>
                  <InfoCardLabel>Driver</InfoCardLabel>
                  <InfoCardName>{generatedChallan.driver?.full_name || "N/A"}</InfoCardName>
                  <InfoCardLine>{generatedChallan.driver?.phone || "No phone on file"}</InfoCardLine>
                  <InfoCardLineMuted>License: {generatedChallan.driver?.license_number || "N/A"}</InfoCardLineMuted>
                </InfoCard>
                <InfoCard>
                  <InfoCardLabel>Vehicle</InfoCardLabel>
                  <InfoCardName>{generatedChallan.vehicle?.vehicle_id || "N/A"}</InfoCardName>
                  <InfoCardLine>{generatedChallan.vehicle?.license_plate || "No plate on file"}</InfoCardLine>
                  <InfoCardLineMuted>{generatedChallan.vehicle?.vehicle_type || ""}</InfoCardLineMuted>
                </InfoCard>
                <InfoCard style={{ gridColumn: "1 / -1" }}>
                  <InfoCardLabel>Route</InfoCardLabel>
                  <InfoCardName>
                    {generatedChallan.routeId 
                      ? routes.find(r => r.id === parseInt(generatedChallan.routeId))?.route_name || "N/A"
                      : "N/A"}
                  </InfoCardName>
                </InfoCard>
              </InfoCardGrid>

              <ChallanTableCard>
                <ChallanTableCaption>Consignments in this Challan</ChallanTableCaption>
                <ChallanTable>
                  <thead>
                    <tr>
                      <th>LR Number</th>
                      <th>From → To</th>
                      <th>Client</th>
                      <th>Weight</th>
                      <th>Freight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generatedChallan.lrs.map((s) => (
                      <tr key={s.id}>
                        <td className="mono">{s.lr_number || "N/A"}</td>
                        <td>{s.pickup_location || "N/A"} → {s.delivery_location || s.destination || "N/A"}</td>
                        <td>{getParty(s.consignor_id)?.name || s.client || "N/A"}</td>
                        <td>{s.weight || 0} {s.weight_type || "kg"}</td>
                        <td className="strong">{inr(s.freight_charge)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3}>Total Weight</td>
                      <td colSpan={2}>{generatedChallan.totalWeightKg.toLocaleString("en-IN")} kg</td>
                    </tr>
                    <tr>
                      <td colSpan={3}>Total Freight</td>
                      <td colSpan={2} className="total">{inr(generatedChallan.totalFreight)}</td>
                    </tr>
                    <tr>
                      <td colSpan={3}>Advance / Batta Paid</td>
                      <td colSpan={2}>{inr(generatedChallan.advance)}</td>
                    </tr>
                    <tr>
                      <td colSpan={3}>Balance Due on Delivery</td>
                      <td colSpan={2} className="total">{inr(generatedChallan.balanceDue)}</td>
                    </tr>
                  </tfoot>
                </ChallanTable>
              </ChallanTableCard>

              <SignatureGrid>
                <SignatureBox>
                  <SignatureLine />
                  <SignatureLabel>Driver Signature</SignatureLabel>
                </SignatureBox>
                <SignatureBox>
                  <SignatureLine />
                  <SignatureLabel>Dispatcher Signature</SignatureLabel>
                </SignatureBox>
                <SignatureBox>
                  <SignatureLine />
                  <SignatureLabel>Company Seal</SignatureLabel>
                </SignatureBox>
              </SignatureGrid>

              <ChallanFooterNote>
                Advance/Batta shown above is recorded against this challan and should be reconciled at the time of final settlement. This is a system-generated document from FleetChain Logistics.
              </ChallanFooterNote>
            </ChallanBody>
            <ChallanActionBar className="no-print">
              <ChallanMeta>
                {generatedChallan.lrs.length} LR{generatedChallan.lrs.length > 1 ? "s" : ""} • {generatedChallan.challanNo}
              </ChallanMeta>
              <div style={{ display: "flex", gap: 10 }}>
                <Btn onClick={printChallan}>🖨️ Print Document</Btn>
                <Btn primary onClick={downloadChallanPDF}>⬇️ Download PDF</Btn>
                <Btn onClick={() => { setIsChallanOpen(false); setGeneratedChallan(null); }}>Close</Btn>
              </div>
            </ChallanActionBar>
          </ChallanDoc>
        </ModalOverlay>
      )}
    </PageWrapper>
  );
}

// ══════════════ STYLED COMPONENTS ══════════════
// ... (all your existing styled components go here - I've kept them as is)
const PageWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  background: #f8fafc;
  min-height: 100vh;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto,
    "Helvetica Neue", sans-serif;
`;
// ... (rest of your styled components remain unchanged)
const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
  h1 {
    font-size: 28px;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
  }
  p {
    color: #64748b;
    margin: 4px 0 0;
    font-size: 14px;
  }
`;
const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  .btn-new {
    padding: 10px 22px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    background: #6366f1;
    color: white;
    transition: background 0.15s ease;
    &:hover {
      background: #4f46e5;
    }
  }
  .btn-challan {
    padding: 10px 22px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    background: #166534;
    color: white;
    transition: background 0.15s ease;
    &:hover {
      background: #14532d;
    }
  }
  .btn-secondary {
    padding: 10px 18px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    background: white;
    color: #475569;
    transition: background 0.15s ease;
    &:hover {
      background: #f8fafc;
    }
  }
`;
const DropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  max-height: 320px;
  overflow-y: auto;
  z-index: 1000;
`;
const DropdownItem = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  &:hover {
    background: #f1f5f9;
  }
  span {
    font-size: 20px;
  }
  div strong {
    display: block;
    font-size: 14px;
    color: #1e293b;
  }
  div small {
    font-size: 11px;
    color: #94a3b8;
  }
`;
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;
const StatCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  .icon {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
  }
  .label {
    font-size: 13px;
    color: #64748b;
  }
  .value {
    font-size: 24px;
    font-weight: 700;
    color: #0f172a;
  }
`;
const FilterBar = styled.div`
  display: flex;
  gap: 14px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
`;
const SearchBox = styled.input`
  flex: 1;
  min-width: 200px;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  &:focus {
    border-color: #6366f1;
  }
`;
const FilterSelect = styled.select`
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  cursor: pointer;
`;
const TableCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    h2 {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }
    .btn-sort {
      padding: 4px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      background: white;
      cursor: pointer;
      font-size: 12px;
      color: #475569;
      &:hover {
        background: #f8fafc;
      }
    }
  }
`;
const TableWrapper = styled.div`
  overflow-x: auto;
`;
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  thead {
    background: #f8fafc;
    border-bottom: 2px solid #e2e8f0;
    th {
      padding: 10px 12px;
      text-align: left;
      font-weight: 600;
      color: #475569;
      font-size: 11px;
      text-transform: uppercase;
    }
  }
  tbody {
    tr {
      border-bottom: 1px solid #f1f5f9;
      &:hover {
        background: #f8fafc;
      }
    }
    td {
      padding: 10px 12px;
      color: #1e293b;
    }
  }
`;
const Badge = styled.span`
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  background: ${(p) => p.bg || "#f1f5f9"};
  color: ${(p) => p.color || "#475569"};
`;
const BtnRow = styled.div`
  display: flex;
  gap: 4px;
`;
const IconBtn = styled.button`
  padding: 5px 8px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  background: ${(p) => (p.danger ? "#fef2f2" : "#f8fafc")};
  color: ${(p) => (p.danger ? "#dc2626" : "#475569")};
  &:hover {
    background: ${(p) => (p.danger ? "#fee2e2" : "#e2e8f0")};
  }
`;
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 16px;
`;
const Modal = styled.div`
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 620px;
  max-height: 92vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;
const ModalHead = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  h5 {
    font-size: 17px;
    font-weight: 700;
    margin: 0;
    color: #0f172a;
  }
`;
const CloseBtn = styled.button`
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 20px;
  cursor: pointer;
  &:hover {
    color: #475569;
  }
`;
const ModalBody = styled.div`
  padding: 20px;
  overflow-y: auto;
  flex: 1;
`;
const ModalFoot = styled.div`
  padding: 14px 20px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background: #f8fafc;
`;
const Btn = styled.button`
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  border: none;
  background: ${(p) => (p.primary ? "#6366f1" : "#f1f5f9")};
  color: ${(p) => (p.primary ? "white" : "#475569")};
  transition: background 0.15s ease;
  &:hover {
    background: ${(p) => (p.primary ? "#4f46e5" : "#e2e8f0")};
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
const Grid2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
`;
const InfoItem = styled.div`
  .label {
    font-size: 11px;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    margin-bottom: 3px;
  }
  .val {
    font-size: 14px;
    color: #0f172a;
    font-weight: 500;
  }
`;
const FRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
`;
const FGroup = styled.div`
  display: flex;
  flex-direction: column;
  label {
    font-size: 13px;
    font-weight: 500;
    color: #475569;
    margin-bottom: 6px;
  }
  input,
  select,
  textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    outline: none;
    box-sizing: border-box;
    &:focus {
      border-color: #6366f1;
    }
  }
  textarea {
    resize: vertical;
    min-height: 80px;
  }
`;
const InfoBanner = styled.div`
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  color: #475569;
  strong {
    color: #4f46e5;
  }
`;
const LRSelectTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  thead {
    background: #0f172a;
    color: white;
    th {
      padding: 10px 12px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
  }
  tbody {
    tr {
      border-bottom: 1px solid #f1f5f9;
      transition: background 0.15s;
      &:hover {
        background: #eff6ff;
      }
    }
    td {
      padding: 10px 12px;
    }
  }
`;
const SummaryBox = styled.div`
  margin-top: 14px;
  padding: 12px 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  font-size: 13px;
  font-weight: 600;
  color: #166534;
`;
const ChallanDoc = styled.div`
  background: white;
  border-radius: 14px;
  width: 100%;
  max-width: 840px;
  max-height: 92vh;
  overflow: auto;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto,
    "Helvetica Neue", sans-serif;
  font-size: 13px;
  box-shadow: 0 24px 60px -12px rgba(0, 0, 0, 0.35);
`;
const ChallanHeader = styled.div`
  background: #0b1220;
  color: white;
  padding: 20px 28px;
  border-radius: 14px 14px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;
const ChallanBrand = styled.div`
  font-size: 21px;
  font-weight: 700;
  letter-spacing: -0.01em;
`;
const ChallanSub = styled.div`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 3px;
`;
const ChallanHeaderRight = styled.div`
  text-align: right;
`;
const ChallanTag = styled.div`
  display: inline-block;
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
  padding: 5px 14px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
`;
const ChallanNumberBanner = styled.div`
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  padding: 14px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
const BannerLabel = styled.div`
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #94a3b8;
  margin-bottom: 3px;
`;
const BannerValue = styled.div`
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  font-family: "SF Mono", Menlo, monospace;
`;
const BannerValueSmall = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
`;
const ChallanBody = styled.div`
  padding: 22px 28px;
`;
const InfoCardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 18px;
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;
const InfoCard = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 14px 16px;
`;
const InfoCardLabel = styled.div`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #6366f1;
  margin-bottom: 7px;
`;
const InfoCardName = styled.div`
  font-weight: 700;
  font-size: 15px;
  color: #0f172a;
`;
const InfoCardLine = styled.div`
  font-size: 12.5px;
  color: #64748b;
  margin-top: 3px;
`;
const InfoCardLineMuted = styled.div`
  font-size: 11.5px;
  color: #94a3b8;
  margin-top: 2px;
`;
const ChallanTableCard = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 18px;
`;
const ChallanTableCaption = styled.div`
  background: #f8fafc;
  padding: 9px 16px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #475569;
  text-transform: uppercase;
  border-bottom: 1px solid #e2e8f0;
`;
const ChallanTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
  thead {
    background: #0b1220;
    color: white;
    th {
      padding: 9px 12px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
    }
  }
  tbody td {
    padding: 9px 12px;
    border-bottom: 1px solid #f1f5f9;
  }
  .mono {
    font-family: "SF Mono", Menlo, monospace;
    font-weight: 700;
  }
  .strong {
    font-weight: 600;
  }
  tfoot {
    background: #f0fdf4;
    font-weight: 700;
    tr td {
      padding: 11px 12px;
    }
    .total {
      color: #166534;
      font-size: 14px;
    }
  }
`;
const SignatureGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
  margin-bottom: 18px;
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;
const SignatureBox = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 18px 16px;
  text-align: center;
`;
const SignatureLine = styled.div`
  height: 36px;
  border-bottom: 1px dashed #cbd5e1;
  margin-bottom: 8px;
`;
const SignatureLabel = styled.div`
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
`;
const ChallanFooterNote = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 11px 15px;
  font-size: 11px;
  color: #64748b;
`;
const ChallanActionBar = styled.div`
  border-top: 1px solid #e2e8f0;
  padding: 16px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  border-radius: 0 0 14px 14px;
  position: sticky;
  bottom: 0;
`;
const ChallanMeta = styled.div`
  font-size: 11px;
  color: #94a3b8;
`;
