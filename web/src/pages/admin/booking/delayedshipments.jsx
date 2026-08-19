import React, { useState, useEffect, useMemo, useCallback } from "react";
import styled, { keyframes, css } from "styled-components";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  AlertOctagon,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Search,
  Download,
  RefreshCw,
  FileText,
  MapPin,
  User,
  Truck,
  Activity,
} from "lucide-react";

const API_BASE = "http://localhost:8000/api";

export default function DelayedShipments() {
  const [delayedShipments, setDelayedShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("All");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Replaced axios with native fetch for zero dependencies
      const [shipmentRes, driverRes, vehicleRes] = await Promise.all([
        fetch(`${API_BASE}/shipments/`),
        fetch(`${API_BASE}/drivers/`),
        fetch(`${API_BASE}/vehicles/`),
      ]);

      const [shipmentData, driverData, vehicleData] = await Promise.all([
        shipmentRes.json(),
        driverRes.json(),
        vehicleRes.json(),
      ]);

      const shipments = shipmentData.data || shipmentData || [];
      const drivers = driverData.data || driverData || [];
      const vehicles = vehicleData.data || vehicleData || [];

      // Filter delayed shipments
      const delayed = shipments.filter((s) => {
        const currentStatus = (s.status || "").toLowerCase();
        return currentStatus === "delayed" || currentStatus === "alert";
      });

      // Map with driver and vehicle details
      const mappedDelayed = delayed.map((s) => {
        const driver = drivers.find(
          (d) => d.id === s.driver_id || d.id === parseInt(s.driver_id),
        );
        const vehicle = vehicles.find(
          (v) => v.id === s.vehicle_id || v.id === parseInt(s.vehicle_id),
        );

        return {
          id: s.tracking_id || `TRK-${String(s.id).padStart(4, "0")}`,
          shipmentId: s.id,
          driver: driver?.full_name || "Unassigned",
          vehicle: vehicle?.vehicle_id || "N/A",
          vehicleName: vehicle?.company_name || "N/A",
          route: `${vehicle?.company_name || "Origin"} → ${s.destination || "N/A"}`,
          origin: vehicle?.company_name || "Origin",
          destination: s.destination || "N/A",
          reason: getDelayReason(s.status, s.notes),
          severity: getSeverity(s.status, s.notes),
          status: s.status,
          eta: s.eta,
          notes: s.notes,
          client: s.client || "N/A",
          weight: s.weight || "N/A",
        };
      });

      setDelayedShipments(mappedDelayed);
    } catch (error) {
      console.error("Error fetching delayed shipments:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data exactly once when the component mounts
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ==================== HELPERS ====================

  const getDelayReason = (status, notes) => {
    const normalizedStatus = (status || "").toLowerCase();
    if (notes && notes.toLowerCase().includes("traffic"))
      return "Traffic Congestion";
    if (notes && notes.toLowerCase().includes("weather"))
      return "Weather Conditions";
    if (notes && notes.toLowerCase().includes("mechanical"))
      return "Mechanical Issue";
    if (normalizedStatus === "alert") return "Critical Alert - Immediate Attention";
    return "Route Delay";
  };

  const getSeverity = (status, notes) => {
    if ((status || "").toLowerCase() === "alert") return "Critical";
    if (notes && notes.toLowerCase().includes("critical")) return "Critical";
    if (notes && notes.toLowerCase().includes("urgent")) return "High";
    return "Medium";
  };

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case "Critical":
        return {
          bg: "#FEE2E2",
          color: "#991B1B",
          border: "#FECACA",
          icon: AlertOctagon,
        };
      case "High":
        return {
          bg: "#FEF3C7",
          color: "#B45309",
          border: "#FDE68A",
          icon: AlertTriangle,
        };
      case "Medium":
        return {
          bg: "#FFEDD5",
          color: "#C2410C",
          border: "#FED7AA",
          icon: Clock,
        };
      case "Low":
        return {
          bg: "#DCFCE7",
          color: "#166534",
          border: "#BBF7D0",
          icon: ShieldAlert,
        };
      default:
        return {
          bg: "#F1F5F9",
          color: "#475569",
          border: "#E2E8F0",
          icon: Activity,
        };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === "0000-00-00 00:00:00") return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  // ==================== MEMOIZED DATA ====================

  const filteredShipments = useMemo(() => {
    return delayedShipments.filter((s) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        s.id.toLowerCase().includes(q) ||
        s.driver.toLowerCase().includes(q) ||
        s.route.toLowerCase().includes(q) ||
        s.client.toLowerCase().includes(q);
      const matchesSeverity =
        filterSeverity === "All" || s.severity === filterSeverity;
      return matchesSearch && matchesSeverity;
    });
  }, [delayedShipments, searchTerm, filterSeverity]);

  const stats = useMemo(() => {
    return {
      total: delayedShipments.length,
      critical: delayedShipments.filter((s) => s.severity === "Critical")
        .length,
      high: delayedShipments.filter((s) => s.severity === "High").length,
      medium: delayedShipments.filter((s) => s.severity === "Medium").length,
    };
  }, [delayedShipments]);

  // ==================== EXPORT FUNCTIONS ====================

  const exportToPDF = () => {
    if (delayedShipments.length === 0)
      return alert("No delayed shipments to export!");

    try {
      const doc = new jsPDF("landscape", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(20);
      doc.setTextColor(220, 38, 38);
      doc.text("Delayed Shipments & Exceptions Report", pageWidth / 2, 20, {
        align: "center",
      });

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 28, {
        align: "center",
      });

      doc.setFillColor(248, 250, 252);
      doc.rect(14, 35, pageWidth - 28, 25, "F");

      const summaryItems = [
        { label: "Total Delayed", value: stats.total },
        { label: "Critical Exceptions", value: stats.critical },
        { label: "High Priority", value: stats.high },
        { label: "Medium Priority", value: stats.medium },
      ];

      const itemWidth = (pageWidth - 28) / summaryItems.length;
      summaryItems.forEach((item, index) => {
        const x = 14 + index * itemWidth;
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(item.label, x + itemWidth / 2, 42, { align: "center" });
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.text(String(item.value), x + itemWidth / 2, 52, {
          align: "center",
        });
      });

      const tableHeaders = [
        "Tracking ID",
        "Client",
        "Driver & Vehicle",
        "Route Leg",
        "Severity",
        "ETA",
        "Root Cause",
      ];
      const tableRows = delayedShipments.map((s) => [
        s.id,
        s.client,
        `${s.driver} (${s.vehicle})`,
        s.route,
        s.severity,
        formatDate(s.eta),
        s.reason,
      ]);

      doc.autoTable({
        startY: 70,
        head: [tableHeaders],
        body: tableRows,
        theme: "grid",
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: "bold",
        },
        bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 },
      });

      doc.save(
        `exception_report_${new Date().toISOString().split("T")[0]}.pdf`,
      );
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Failed to generate PDF. Check console for details.");
    }
  };

  // ==================== RENDER ====================

  return (
    <Container>
      <PageHeader>
        <div className="title-section">
          <h1>Exceptions & Delays</h1>
          <p className="subtitle">
            Live tracking matrix for blocked and delayed shipments{" "}
            <span className="dot">•</span> {stats.total} total exceptions
          </p>
        </div>
        <div className="action-section">
          <IconButton onClick={fetchData} title="Refresh Data">
            <RefreshCw size={16} className={loading ? "spin" : ""} />
          </IconButton>
          <Button $variant="primary" onClick={exportToPDF}>
            <Download size={16} /> Export Report
          </Button>
        </div>
      </PageHeader>

      <StatsContainer>
        <SummaryCard $borderColor="#FECACA">
          <div className="card-header">
            <p>Critical Exceptions</p>
            <div className="icon-wrapper critical">
              <AlertOctagon size={16} />
            </div>
          </div>
          <h3>{stats.critical}</h3>
          <p className="metric-subtext">Requires immediate intervention</p>
        </SummaryCard>
        <SummaryCard $borderColor="#FDE68A">
          <div className="card-header">
            <p>High Priority</p>
            <div className="icon-wrapper high">
              <AlertTriangle size={16} />
            </div>
          </div>
          <h3>{stats.high}</h3>
          <p className="metric-subtext">Significant ETA impact</p>
        </SummaryCard>
        <SummaryCard $borderColor="#FED7AA">
          <div className="card-header">
            <p>Medium Priority</p>
            <div className="icon-wrapper medium">
              <Clock size={16} />
            </div>
          </div>
          <h3>{stats.medium}</h3>
          <p className="metric-subtext">Standard route delays</p>
        </SummaryCard>
        <SummaryCard>
          <div className="card-header">
            <p>Total Disrupted</p>
            <div className="icon-wrapper neutral">
              <Activity size={16} />
            </div>
          </div>
          <h3>{stats.total}</h3>
          <p className="metric-subtext">Active fleet exceptions</p>
        </SummaryCard>
      </StatsContainer>

      <Toolbar>
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by Trip ID, Driver, or Route..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-wrapper">
          <Select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
          >
            <option value="All">All Severities</option>
            <option value="Critical">🚨 Critical Only</option>
            <option value="High">⚠️ High Priority</option>
            <option value="Medium">📌 Medium Priority</option>
          </Select>
        </div>
      </Toolbar>

      <TableCard>
        <TableWrapper>
          <Table>
            <thead>
              <tr>
                <th>Trip Details</th>
                <th>Party / Client</th>
                <th>Driver & Fleet</th>
                <th>Severity Status</th>
                <th>Delay Reason & ETA</th>
                <th className="align-right">Notes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filteredShipments.length === 0 ? (
                <EmptyStateRow colSpan="6">
                  <div className="empty-content">
                    <ShieldAlert
                      size={48}
                      className="text-green-500 mb-4"
                      style={{ color: "#10B981" }}
                    />
                    <h4>No Exceptions Found</h4>
                    <p>
                      All shipments are currently running on time without
                      disruption.
                    </p>
                  </div>
                </EmptyStateRow>
              ) : (
                filteredShipments.map((shipment) => {
                  const sevStyles = getSeverityStyles(shipment.severity);
                  const Icon = sevStyles.icon;
                  return (
                    <tr key={shipment.id}>
                      <td>
                        <div className="primary-text font-mono">
                          {shipment.id}
                        </div>
                        <div className="secondary-text flex-center">
                          <MapPin size={12} className="mr-1" />{" "}
                          {shipment.origin} → {shipment.destination}
                        </div>
                      </td>
                      <td>
                        <div className="primary-text">{shipment.client}</div>
                        <div className="secondary-text">
                          ID: {shipment.shipmentId}
                        </div>
                      </td>
                      <td>
                        <div className="primary-text flex-center">
                          <User size={14} className="mr-1 text-gray-400" />{" "}
                          {shipment.driver}
                        </div>
                        <div className="secondary-text flex-center mt-1">
                          <Truck size={14} className="mr-1 text-gray-400" />{" "}
                          {shipment.vehicle}
                        </div>
                      </td>
                      <td>
                        <Badge
                          $bg={sevStyles.bg}
                          $color={sevStyles.color}
                          $border={sevStyles.border}
                        >
                          <Icon size={12} className="mr-1" />{" "}
                          {shipment.severity} Priority
                        </Badge>
                      </td>
                      <td>
                        <div className="primary-text text-danger font-medium">
                          {shipment.reason}
                        </div>
                        <div className="secondary-text">
                          Est: {formatDate(shipment.eta)}
                        </div>
                      </td>
                      <td className="align-right">
                        <div
                          className="secondary-text clamp-2"
                          title={shipment.notes}
                        >
                          {shipment.notes || "No operational notes provided."}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </TableWrapper>
      </TableCard>
    </Container>
  );
}

// ==========================================
// STYLED COMPONENTS (Enterprise UI System)
// ==========================================

const spinAnimation = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

const Container = styled.div`
  max-width: 1440px;
  margin: 0 auto;
  padding: 32px 24px;
  min-height: 100vh;
  background-color: #f9fafb;
  font-family:
    -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, Helvetica,
    Arial, sans-serif;
  color: #111827;
`;

const PageHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;

  .title-section {
    h1 {
      font-size: 24px;
      font-weight: 600;
      letter-spacing: -0.02em;
      margin: 0 0 6px 0;
      color: #111827;
    }
    .subtitle {
      font-size: 13px;
      color: #6b7280;
      margin: 0;
      display: flex;
      align-items: center;
      .dot {
        margin: 0 8px;
        font-size: 10px;
        color: #d1d5db;
      }
    }
  }

  .action-section {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .spin {
    animation: ${spinAnimation} 1s linear infinite;
  }
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;

  ${(props) =>
    props.$variant === "primary" &&
    css`
      background: #111827;
      color: white;
      border: 1px solid #111827;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      &:hover {
        background: #374151;
        border-color: #374151;
      }
    `}
`;

const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: #f3f4f6;
    color: #111827;
  }
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
`;

const SummaryCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-top: 3px solid ${(props) => props.$borderColor || "#E5E7EB"};
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    p {
      font-size: 13px;
      font-weight: 500;
      color: #6b7280;
      margin: 0;
    }

    .icon-wrapper {
      padding: 6px;
      border-radius: 6px;
      display: flex;
      &.critical {
        background: #fee2e2;
        color: #991b1b;
      }
      &.high {
        background: #fef3c7;
        color: #b45309;
      }
      &.medium {
        background: #ffedd5;
        color: #c2410c;
      }
      &.neutral {
        background: #f3f4f6;
        color: #374151;
      }
    }
  }

  h3 {
    font-size: 24px;
    font-weight: 600;
    color: #111827;
    margin: 0;
    letter-spacing: -0.02em;
  }

  .metric-subtext {
    font-size: 12px;
    color: #9ca3af;
    margin: 6px 0 0 0;
  }
`;

const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;

  .search-wrapper {
    position: relative;
    flex: 1;
    min-width: 280px;
    max-width: 480px;

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #9ca3af;
    }

    input {
      width: 100%;
      padding: 10px 16px 10px 38px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 13px;
      color: #111827;
      background: white;
      outline: none;
      transition: border-color 0.15s;

      &::placeholder {
        color: #9ca3af;
      }
      &:focus {
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
      }
    }
  }
`;

const Select = styled.select`
  padding: 10px 36px 10px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  background: white
    url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%208l5%205%205-5%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%221.5%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E")
    no-repeat right 10px center;
  -webkit-appearance: none;
  cursor: pointer;
  outline: none;

  &:focus {
    border-color: #6366f1;
  }
`;

const TableCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  overflow: hidden;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  width: 100%;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  text-align: left;

  thead {
    background: #f9fafb;

    th {
      padding: 14px 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
      border-bottom: 1px solid #e5e7eb;
      white-space: nowrap;

      &.align-right {
        text-align: right;
      }
    }
  }

  tbody {
    tr {
      transition: background 0.15s;
      &:hover {
        background: #f9fafb;
      }
      &:last-child td {
        border-bottom: none;
      }
    }

    td {
      padding: 16px 20px;
      border-bottom: 1px solid #f3f4f6;
      vertical-align: top;

      &.align-right {
        text-align: right;
      }

      .primary-text {
        font-size: 13px;
        font-weight: 500;
        color: #111827;
        margin-bottom: 4px;
      }
      .secondary-text {
        font-size: 12px;
        color: #6b7280;
      }
      .text-danger {
        color: #dc2626;
      }
      .font-mono {
        font-family: ui-monospace, SFMono-Regular, monospace;
        letter-spacing: -0.01em;
      }
      .font-medium {
        font-weight: 600;
      }
      .flex-center {
        display: flex;
        align-items: center;
      }
      .mr-1 {
        margin-right: 4px;
      }
      .mt-1 {
        margin-top: 4px;
      }
      .clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        max-width: 250px;
      }
    }
  }
`;

const SkeletonBox = styled.div`
  height: 64px;
  border-bottom: 1px solid #f3f4f6;
  animation: ${shimmer} 2s infinite linear;
  background: linear-gradient(to right, #f6f7f8 4%, #edeef1 25%, #f6f7f8 36%);
  background-size: 1000px 100%;
`;

const SkeletonRow = () => (
  <tr>
    <td colSpan="6" style={{ padding: 0 }}>
      <SkeletonBox />
    </td>
  </tr>
);

const EmptyStateRow = styled.td`
  padding: 64px 20px !important;
  text-align: center;

  .empty-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #9ca3af;

    h4 {
      font-size: 16px;
      color: #111827;
      margin: 16px 0 8px 0;
      font-weight: 500;
    }
    p {
      font-size: 13px;
      margin: 0;
    }
  }
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: ${(p) => p.$bg};
  color: ${(p) => p.$color};
  border: 1px solid ${(p) => p.$border};
`;
