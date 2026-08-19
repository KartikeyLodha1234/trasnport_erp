import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import {
  Search,
  FileText,
  Truck,
  Calendar,
  History,
  X,
  Printer,
  User as UserIcon,
  Package,
} from "lucide-react";

const API_BASE = "http://localhost:8000/api";

export default function ChallanHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChallan, setSelectedChallan] = useState(null);
  const [challanShipments, setChallanShipments] = useState([]);
  const [loadingShipments, setLoadingShipments] = useState(false);
  const [challanHash, setChallanHash] = useState("Pending Hashing...");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/challans/`);
      if (!response.ok) throw new Error("Failed to fetch history");
      const data = await response.json();
      setHistory(data.data || []);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (challan) => {
    setSelectedChallan(challan);
    setLoadingShipments(true);
    setChallanShipments([]);
    setChallanHash("Generating Deterministic Hash...");

    try {
      const response = await fetch(`${API_BASE}/shipments/`);
      if (response.ok) {
        const data = await response.json();
        const allShipments = data.data || [];
        const attachedLRs = allShipments.filter(
          (s) =>
            String(s.challan_number || "")
              .trim()
              .toLowerCase() ===
            String(challan.challan_no || "")
              .trim()
              .toLowerCase(),
        );
        setChallanShipments(attachedLRs);

        const totalFreight = attachedLRs.reduce(
          (sum, s) => sum + (parseFloat(s.freight_charge) || 0),
          0,
        );
        const payloadString = `${challan.challan_no}-${challan.driver_name}-${totalFreight}`;

        const msgBuffer = new TextEncoder().encode(payloadString);
        const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex =
          "0x" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

        setTimeout(() => {
          setChallanHash(hashHex);
        }, 800);
      }
    } catch (error) {
      console.error("Failed to load attached LRs:", error);
    } finally {
      setLoadingShipments(false);
    }
  };

  const printOfficialChallan = () => {
    if (!selectedChallan) return;
    const printWindow = window.open("", "_blank");
    const challanNo = selectedChallan.challan_no;

    const rows = challanShipments
      .map(
        (s, i) =>
          `<tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"}">
        <td style="font-family:monospace;font-weight:700">${s.lr_number || "N/A"}</td>
        <td>${s.pickup_location || "N/A"}</td>
        <td>${s.delivery_location || s.destination || "N/A"}</td>
        <td>${s.client || "N/A"}</td>
        <td>${s.consignee_name || "N/A"}</td>
        <td>${s.goods_desc || "N/A"}</td>
        <td>${s.weight || 0} ${s.weight_type || "kg"}</td>
        <td style="font-weight:600">₹${Number(s.freight_charge || 0).toLocaleString("en-IN")}</td>
      </tr>`,
      )
      .join("");

    const totalFreight = challanShipments.reduce(
      (sum, s) => sum + (parseFloat(s.freight_charge) || 0),
      0,
    );
    const totalWeight = challanShipments.reduce(
      (sum, s) =>
        sum +
        ((s.weight_type || "kg").toLowerCase() === "ton"
          ? parseFloat(s.weight) * 1000
          : parseFloat(s.weight) || 0),
      0,
    );

    const formattedDate = new Date(
      selectedChallan.created_at,
    ).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    printWindow.document.write(
      `<!DOCTYPE html><html><head><title>Challan ${challanNo}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,sans-serif;padding:20px;color:#0f172a}.header{background:#0b1220;color:white;padding:20px 28px;display:flex;justify-content:space-between;border-radius:14px 14px 0 0}.header h2{font-size:21px;font-weight:700;letter-spacing:-0.01em}.header .tag{background:rgba(99,102,241,0.2);color:#a5b4fc;padding:5px 14px;border-radius:6px;font-weight:700;font-size:12px;letter-spacing:0.03em;text-transform:uppercase;display:inline-block}.banner{display:flex;justify-content:space-between;padding:14px 28px;background:#f8fafc;border-bottom:1px solid #e2e8f0}.banner .label{font-size:10.5px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#94a3b8;margin-bottom:3px}.banner .value{font-size:22px;font-weight:800;font-family:"SF Mono",Menlo,monospace}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:22px 28px;margin-bottom:18px}.info-card{border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px}.info-card .card-label{font-size:10px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#6366f1;margin-bottom:7px}.info-card .card-name{font-weight:700;font-size:15px;color:#0f172a}.info-card .card-detail{font-size:12.5px;color:#64748b;margin-top:3px}.table-container{border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin:0 28px 18px 28px}table{width:100%;border-collapse:collapse;font-size:12.5px}thead{background:#0b1220;color:white}th{padding:9px 12px;text-align:left;font-size:11px;font-weight:600}td{padding:9px 12px;border-bottom:1px solid #f1f5f9}tfoot{background:#f0fdf4;font-weight:700}tfoot td{padding:11px 12px;color:#166534;font-size:14px}.signatures{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;padding:0 28px;margin-bottom:18px}.sig-box{border:1px solid #e2e8f0;border-radius:10px;padding:18px 16px;text-align:center}.sig-line{height:36px;border-bottom:1px dashed #cbd5e1;margin-bottom:8px}.sig-label{font-size:11px;color:#94a3b8;font-weight:600}.footer-note{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:11px 15px;font-size:11px;color:#64748b;margin:0 28px 20px 28px}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><div class="header"><div><h2>FleetChain Logistics</h2><div style="font-size:11px;color:rgba(255,255,255,0.6);margin-top:3px">Transport Management System</div></div><div style="text-align:right"><div class="tag">Lorry Challan</div><div style="font-size:11px;color:rgba(255,255,255,0.6);margin-top:3px">Master Record</div></div></div><div class="banner"><div><div class="label">Challan Number</div><div class="value">${challanNo}</div></div><div style="text-align:right"><div class="label">Date Generated</div><div class="value" style="font-size:15px;font-family:sans-serif">${formattedDate}</div></div></div><div class="info-grid"><div class="info-card"><div class="card-label">Assigned Driver</div><div class="card-name">${selectedChallan.driver_name || "N/A"}</div><div class="card-detail">📞 N/A</div><div style="font-size:11.5px;color:#94a3b8;margin-top:2px">License: N/A</div></div><div class="info-card"><div class="card-label">Assigned Vehicle</div><div class="card-name">${selectedChallan.vehicle_code || "N/A"}</div><div class="card-detail">🚛 N/A</div><div style="font-size:11.5px;color:#94a3b8;margin-top:2px">Plate: ${selectedChallan.license_plate || "N/A"}</div></div></div><div class="table-container"><table><thead><tr><th>LR Number</th><th>From</th><th>To</th><th>Consignor</th><th>Consignee</th><th>Goods</th><th>Weight</th><th>Freight</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td colspan="6" style="color:#0f172a;font-size:12.5px">Total (${challanShipments.length} consignments)</td><td style="color:#0f172a;font-size:12.5px">${totalWeight.toLocaleString("en-IN")} kg</td><td>₹${totalFreight.toLocaleString("en-IN")}</td></tr></tfoot></table></div><div class="signatures"><div class="sig-box"><div class="sig-line"></div><div class="sig-label">Consignor Signature</div></div><div class="sig-box"><div class="sig-line"></div><div class="sig-label">Driver Signature</div></div><div class="sig-box"><div class="sig-line"></div><div class="sig-label">Receiver Signature</div></div></div><div class="footer-note">Blockchain Secured Hash: ${challanHash}</div></body></html>`,
    );
    printWindow.document.close();
    printWindow.print();
  };

  const filteredHistory = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return history.filter((item) => {
      const safeId = String(item.challan_no || "").toLowerCase();
      const safeDriver = String(item.driver_name || "").toLowerCase();
      const safePlate = String(item.license_plate || "").toLowerCase();
      return (
        safeId.includes(q) || safeDriver.includes(q) || safePlate.includes(q)
      );
    });
  }, [history, searchTerm]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const formatInr = (num) => `₹${Number(num || 0).toLocaleString("en-IN")}`;

  return (
    <Container>
      <PageHeader>
        <div>
          <h1>Master Challan Registry</h1>
          <p className="subtitle">
            Immutable ledger of all generated transport manifests.
          </p>
        </div>
      </PageHeader>
      <Toolbar>
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by ID, Driver, or Plate..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Toolbar>
      <TableCard>
        <TableWrapper>
          <Table>
            <thead>
              <tr>
                <th>Creation Date</th>
                <th>Challan ID</th>
                <th>Driver Profile</th>
                <th>Vehicle Asset</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="5"
                    style={{ textAlign: "center", padding: "40px" }}
                  >
                    Loading immutable records...
                  </td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    style={{
                      textAlign: "center",
                      padding: "60px",
                      color: "#64748B",
                    }}
                  >
                    <History
                      size={48}
                      style={{ margin: "0 auto 16px auto", opacity: 0.5 }}
                    />
                    <p>No historical records found.</p>
                  </td>
                </tr>
              ) : (
                filteredHistory.map((row) => (
                  <tr
                    key={row.id || row.challan_no}
                    onClick={() => handlePreview(row)}
                    className="clickable-row"
                  >
                    <td>
                      <div className="flex-center text-gray">
                        <Calendar size={14} className="mr-2" />
                        {formatDate(row.created_at)}
                      </div>
                    </td>
                    <td>
                      <div className="font-mono font-medium">
                        {row.challan_no}
                      </div>
                    </td>
                    <td>
                      <div className="font-medium">
                        {row.driver_name || "Unassigned"}
                      </div>
                    </td>
                    <td>
                      <div className="flex-center">
                        <Truck size={14} className="mr-2 text-gray" />
                        <span className="font-mono">
                          {row.license_plate || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge $status={row.status}>
                        {row.status || "Draft"}
                      </StatusBadge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </TableWrapper>
      </TableCard>

      {selectedChallan && (
        <ModalOverlay onClick={() => setSelectedChallan(null)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <div className="flex-center">
                <FileText size={20} className="mr-2 text-indigo-600" />
                <h3>Manifest Preview</h3>
              </div>
              <IconButton onClick={() => setSelectedChallan(null)}>
                <X size={20} />
              </IconButton>
            </ModalHeader>
            <ModalBody>
              <div className="preview-header">
                <span className="label">Challan Number</span>
                <h2 className="font-mono">{selectedChallan.challan_no}</h2>
                <StatusBadge
                  $status={selectedChallan.status}
                  style={{ marginTop: "12px" }}
                >
                  {selectedChallan.status || "Draft"}
                </StatusBadge>
              </div>
              <InfoGrid>
                <InfoBlock>
                  <label>Assigned Driver</label>
                  <p className="flex-center">
                    <UserIcon size={14} className="mr-2 text-gray" />{" "}
                    {selectedChallan.driver_name || "N/A"}
                  </p>
                </InfoBlock>
                <InfoBlock>
                  <label>Dispatch Vehicle</label>
                  <p className="flex-center font-mono">
                    <Truck size={14} className="mr-2 text-gray" />{" "}
                    {selectedChallan.license_plate || "N/A"}
                  </p>
                </InfoBlock>
                <InfoBlock>
                  <label>Timestamp</label>
                  <p className="flex-center">
                    <Calendar size={14} className="mr-2 text-gray" />{" "}
                    {formatDate(selectedChallan.created_at)}
                  </p>
                </InfoBlock>
                <InfoBlock>
                  <label>Blockchain Sync</label>
                  <p
                    className="font-mono text-indigo-600"
                    style={{ fontSize: "11px", wordBreak: "break-all" }}
                  >
                    {challanHash}
                  </p>
                </InfoBlock>
              </InfoGrid>

              <div style={{ marginTop: "32px" }}>
                <h4
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#1e293b",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Package size={16} className="mr-2 text-gray" /> Attached
                  Consignments (LRs)
                </h4>
                <ShipmentListWrapper>
                  {loadingShipments ? (
                    <div
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "#64748b",
                        fontSize: "13px",
                      }}
                    >
                      Locating attached manifests...
                    </div>
                  ) : challanShipments.length === 0 ? (
                    <div
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "#64748b",
                        fontSize: "13px",
                        background: "#f8fafc",
                        borderRadius: "8px",
                        border: "1px dashed #cbd5e1",
                      }}
                    >
                      No LRs are currently attached to this dispatch ticket.
                    </div>
                  ) : (
                    <ShipmentTable>
                      <thead>
                        <tr>
                          <th>LR Number</th>
                          <th>Destination</th>
                          <th>Weight</th>
                          <th>Freight</th>
                        </tr>
                      </thead>
                      <tbody>
                        {challanShipments.map((lr) => (
                          <tr key={lr.id}>
                            <td className="font-mono font-medium text-indigo-600">
                              {lr.lr_number}
                            </td>
                            <td>
                              {lr.delivery_location || lr.destination || "N/A"}
                            </td>
                            <td>
                              {lr.weight} {lr.weight_type}
                            </td>
                            <td className="font-medium">
                              {formatInr(lr.freight_charge)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </ShipmentTable>
                  )}
                </ShipmentListWrapper>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button $variant="ghost" onClick={() => setSelectedChallan(null)}>
                Close Viewer
              </Button>
              <Button
                $variant="primary"
                onClick={printOfficialChallan}
                disabled={challanShipments.length === 0}
              >
                <Printer size={16} className="mr-2" /> Reprint Master PDF
              </Button>
            </ModalFooter>
          </Modal>
        </ModalOverlay>
      )}
    </Container>
  );
}

// STYLING
const Container = styled.div`
  max-width: 1440px;
  margin: 0 auto;
  padding: 40px 32px;
  min-height: 100vh;
  background-color: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, "Inter", sans-serif;
  color: #0f172a;
`;
const PageHeader = styled.header`
  margin-bottom: 32px;
  h1 {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.03em;
    margin: 0 0 8px 0;
  }
  .subtitle {
    font-size: 14px;
    color: #64748b;
    margin: 0;
  }
`;
const Toolbar = styled.div`
  margin-bottom: 24px;
  .search-wrapper {
    position: relative;
    max-width: 400px;
    .search-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
    }
    input {
      width: 100%;
      padding: 12px 16px 12px 42px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      font-size: 14px;
      outline: none;
      background: white;
      &:focus {
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
      }
    }
  }
`;
const TableCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
  overflow: hidden;
`;
const TableWrapper = styled.div`
  overflow-x: auto;
`;
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  thead {
    background: #f8fafc;
    th {
      padding: 16px 24px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      border-bottom: 1px solid #e2e8f0;
    }
  }
  tbody {
    tr.clickable-row {
      border-bottom: 1px solid #f1f5f9;
      cursor: pointer;
      transition: background 0.15s ease;
      &:hover {
        background: #f8fafc;
      }
    }
    td {
      padding: 16px 24px;
      font-size: 14px;
      vertical-align: middle;
      .flex-center {
        display: flex;
        align-items: center;
      }
      .mr-2 {
        margin-right: 8px;
      }
      .text-gray {
        color: #64748b;
      }
      .font-mono {
        font-family: ui-monospace, monospace;
      }
      .font-medium {
        font-weight: 600;
      }
    }
  }
`;
const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  background: ${(p) => (p.$status === "settled" ? "#ECFDF5" : "#EEF2FF")};
  color: ${(p) => (p.$status === "settled" ? "#059669" : "#4338CA")};
`;
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 20px;
`;
const Modal = styled.div`
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  border: 1px solid #e2e8f0;
`;
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  border-bottom: 1px solid #f1f5f9;
  background: #fafaf9;
  flex-shrink: 0;
  .flex-center {
    display: flex;
    align-items: center;
  }
  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #0f172a;
  }
  .text-indigo-600 {
    color: #4f46e5;
  }
`;
const IconButton = styled.button`
  display: inline-flex;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: #f1f5f9;
    color: #0f172a;
  }
`;
const ModalBody = styled.div`
  padding: 32px;
  overflow-y: auto;
  flex-grow: 1;
  .preview-header {
    text-align: center;
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 1px dashed #e2e8f0;
    .label {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.05em;
    }
    h2 {
      margin: 8px 0 0 0;
      font-size: 28px;
      color: #0f172a;
    }
  }
  .font-mono {
    font-family: ui-monospace, monospace;
  }
  .text-indigo-600 {
    color: #4f46e5;
  }
`;
const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
`;
const InfoBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  label {
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  p {
    margin: 0;
    font-size: 15px;
    font-weight: 500;
    color: #0f172a;
  }
  .text-gray {
    color: #94a3b8;
  }
  .flex-center {
    display: flex;
    align-items: center;
  }
  .mr-2 {
    margin-right: 8px;
  }
`;
const ShipmentListWrapper = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
`;
const ShipmentTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;
  thead {
    background: #f8fafc;
    th {
      padding: 10px 14px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: #64748b;
      border-bottom: 1px solid #e2e8f0;
    }
  }
  tbody {
    tr {
      border-bottom: 1px solid #f1f5f9;
      &:last-child {
        border-bottom: none;
      }
    }
    td {
      padding: 12px 14px;
      color: #334155;
    }
  }
`;
const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px 32px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
  flex-shrink: 0;
`;
const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  .mr-2 {
    margin-right: 8px;
  }
  ${(props) =>
    props.$variant === "primary" &&
    ` background: #0f172a; color: white; border: 1px solid #0f172a; &:hover { background: #1e293b; transform: translateY(-1px); } `} ${(
    props,
  ) =>
    props.$variant === "ghost" &&
    ` background: transparent; color: #64748b; border: 1px solid transparent; &:hover { background: #f1f5f9; color: #0f172a; } `} &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
