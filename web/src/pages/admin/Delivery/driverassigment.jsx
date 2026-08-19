import React, { useState, useEffect, useMemo } from "react";
import styled, { keyframes, css } from "styled-components";
import { ethers } from "ethers";
import {
  Truck,
  User,
  IndianRupee,
  Wallet,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Activity,
  Package,
  CheckCircle2,
  Milestone,
  X,
  FileCheck,
  AlertCircle,
  Link,
  ShieldAlert,
  Zap,
  Lock,
} from "lucide-react";

const API_BASE = "http://localhost:8000/api";

const ESCROW_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const ESCROW_ABI = [
  "function lockFreight(string _challanId, bytes32 _docHash, address _driver) external payable",
  "function releasePayment(string _challanId) external",
];

export default function DriverShipment() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);

  const [settlementData, setSettlementData] = useState(null);
  const [podVerified, setPodVerified] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [emergencyData, setEmergencyData] = useState(null);
  const [emergencyAmount, setEmergencyAmount] = useState("");
  const [emergencyReason, setEmergencyReason] = useState("");

  // ⚡ UI State for Escrow Locking
  const [lockingEscrow, setLockingEscrow] = useState(null);
  const [lockedEscrows, setLockedEscrows] = useState(new Set());

  const fetchLiveChallans = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/challans/active`);
      if (!response.ok) throw new Error("Failed to fetch active challans");
      const data = await response.json();
      setAssignments(data.data || data || []);
    } catch (error) {
      console.error("Error fetching live challan data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveChallans();
  }, []);

  const toggleRow = (id) => setExpandedRow(expandedRow === id ? null : id);

  const filteredAssignments = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return assignments.filter(
      (a) =>
        a.stopCount > 0 &&
        (a.driverName?.toLowerCase().includes(q) ||
          a.vehiclePlate?.toLowerCase().includes(q) ||
          a.challanId?.toLowerCase().includes(q)),
    );
  }, [assignments, searchTerm]);

  const stats = useMemo(() => {
    return {
      activeCount: filteredAssignments.length,
      totalAdvances: filteredAssignments.reduce(
        (sum, a) => sum + (a.financials?.advancePaid || 0),
        0,
      ),
      totalPendingPay: filteredAssignments.reduce(
        (sum, a) =>
          sum +
          ((a.financials?.balanceDue || 0) > 0 ? a.financials.balanceDue : 0),
        0,
      ),
    };
  }, [filteredAssignments]);

  const formatInr = (num) =>
    `₹${Math.abs(Number(num || 0)).toLocaleString("en-IN")}`;

  const openSettlementModal = (trip, stop) => {
    setSettlementData({ trip, stop, amount: trip.financials.balanceDue });
    setPodVerified(false);
  };
  const closeSettlementModal = () => {
    if (!isProcessingPayment) {
      setSettlementData(null);
      setPodVerified(false);
    }
  };

  const handleLockEscrow = async (trip) => {
    try {
      if (!window.ethereum)
        throw new Error("Please install MetaMask to use Web3 Escrow.");

      setLockingEscrow(trip.challanId);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const escrowContract = new ethers.Contract(
        ESCROW_ADDRESS,
        ESCROW_ABI,
        signer,
      );

      const payloadString = `${trip.challanId}-${trip.driverName}-${trip.financials.totalTripPay}`;
      const docHash = ethers.id(payloadString);

      const driverWallet = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

      // For Demo: Convert INR amount directly to Wei representation (Rounded to prevent decimal crashes)
      const amountToLock = ethers.parseUnits(
        Math.round(trip.financials.totalTripPay).toString(),
        "wei",
      );
      const tx = await escrowContract.lockFreight(
        trip.challanId,
        docHash,
        driverWallet,
        { value: amountToLock },
      );

      await tx.wait();

      // ⚡ Update UI immediately after block confirmation
      setLockedEscrows((prev) => new Set(prev).add(trip.challanId));
    } catch (error) {
      console.error(error);
      alert(`Blockchain Transaction Failed: ${error.message}`);
    } finally {
      setLockingEscrow(null);
    }
  };

  const handleAuthorizeTransfer = async () => {
    if (!podVerified) return;
    setIsProcessingPayment(true);
    try {
      if (!window.ethereum)
        throw new Error("MetaMask is required for final settlement.");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const escrowContract = new ethers.Contract(
        ESCROW_ADDRESS,
        ESCROW_ABI,
        signer,
      );

      const tx = await escrowContract.releasePayment(
        settlementData.trip.challanId,
      );
      await tx.wait();

      const response = await fetch(
        `${API_BASE}/challans/${settlementData.trip.challanId}/settle`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stop_id: settlementData.stop.id,
            amount_settled: settlementData.amount,
          }),
        },
      );

      if (!response.ok) throw new Error("Backend ledger sync failed");

      // ⚡ Instantly triggers re-render, removing the row from the active list
      await fetchLiveChallans();
    } catch (error) {
      console.error("Settlement error:", error);
      alert(`Settlement failed: ${error.message}`);
    } finally {
      setIsProcessingPayment(false);
      setSettlementData(null);
    }
  };

  const handleIssueEmergencyAdvance = async (e) => {
    e.preventDefault();
    if (!emergencyAmount || !emergencyReason) return;
    setIsProcessingPayment(true);
    const amount = parseFloat(emergencyAmount);
    try {
      const response = await fetch(
        `${API_BASE}/challans/${emergencyData.challanId}/advance`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            reason: emergencyReason,
            type: "Emergency",
          }),
        },
      );
      if (!response.ok) throw new Error("Failed to post advance");
      await fetchLiveChallans();
      setEmergencyData(null);
      setEmergencyAmount("");
      setEmergencyReason("");
    } catch (error) {
      console.error("Advance error:", error);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <Container>
      <PageHeader>
        <div className="title-section">
          <h1>Fleet Operations & Ledger</h1>
          <p className="subtitle">
            Monitor route manifests, dispatch emergency funds, and clear Web3
            escrows.
          </p>
        </div>
        <div className="action-section">
          <IconButton onClick={fetchLiveChallans} title="Refresh Data">
            <RefreshCw size={16} className={loading ? "spin" : ""} />
          </IconButton>
        </div>
      </PageHeader>

      <StatsContainer>
        <SummaryCard>
          <div className="card-header">
            <p>Active Challans</p>
            <div
              className="icon-wrapper"
              style={{ background: "#EEF2FF", color: "#4F46E5" }}
            >
              <Truck size={18} />
            </div>
          </div>
          <h3>{stats.activeCount}</h3>
          <p className="metric-subtext">Currently orchestrated trips</p>
        </SummaryCard>
        <SummaryCard>
          <div className="card-header">
            <p>Capital Locked (Advances)</p>
            <div
              className="icon-wrapper"
              style={{ background: "#FEF3C7", color: "#D97706" }}
            >
              <IndianRupee size={18} />
            </div>
          </div>
          <h3>{formatInr(stats.totalAdvances)}</h3>
          <p className="metric-subtext">Batta released for fuel & tolls</p>
        </SummaryCard>
        <SummaryCard>
          <div className="card-header">
            <p>Escrow Payouts Pending</p>
            <div
              className="icon-wrapper"
              style={{ background: "#ECFDF5", color: "#059669" }}
            >
              <Wallet size={18} />
            </div>
          </div>
          <h3>{formatInr(stats.totalPendingPay)}</h3>
          <p className="metric-subtext">Awaiting delivery signatures</p>
        </SummaryCard>
      </StatsContainer>

      <Toolbar>
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by Driver, Plate, or Challan ID..."
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
                <th>Driver & Vehicle</th>
                <th>Trip Challan</th>
                <th className="align-center">Drops</th>
                <th className="align-right">Trip Pay</th>
                <th className="align-right">Advance Paid</th>
                <th className="align-right">Balance Due</th>
                <th className="align-center">Manifest</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filteredAssignments.length === 0 ? (
                <tr>
                  <EmptyStateRow colSpan="7">
                    <div className="empty-content">
                      <Activity size={48} className="text-gray-300 mb-4" />
                      <h4>No Active Fleet Operations</h4>
                    </div>
                  </EmptyStateRow>
                </tr>
              ) : (
                filteredAssignments.map((row) => (
                  <React.Fragment key={row.challanId}>
                    <tr
                      className="master-row"
                      onClick={() => toggleRow(row.challanId)}
                    >
                      <td>
                        <div className="primary-text flex-center">
                          <User size={14} className="mr-2 text-gray-400" />{" "}
                          {row.driverName}
                        </div>
                        <div className="secondary-text font-mono mt-1 flex-center">
                          <Truck size={12} className="mr-2 text-gray-400" />{" "}
                          {row.vehiclePlate}
                        </div>
                      </td>
                      <td>
                        <div className="primary-text font-mono">
                          {row.challanId}
                        </div>
                        <div className="secondary-text flex-center mt-1">
                          {row.origin} → {row.finalDest}
                        </div>
                      </td>
                      <td className="align-center">
                        <Badge $bg="#EEF2FF" $color="#4338CA" $border="#C7D2FE">
                          {row.stopCount} Stops
                        </Badge>
                      </td>
                      <td className="align-right">
                        <div className="primary-text font-medium">
                          {formatInr(row.financials.totalTripPay)}
                        </div>
                      </td>
                      <td className="align-right">
                        <div className="primary-text text-warning font-medium">
                          -{formatInr(row.financials.advancePaid)}
                        </div>
                      </td>
                      <td className="align-right">
                        {row.financials.balanceDue < 0 ? (
                          <div className="primary-text text-danger font-bold">
                            Owes {formatInr(row.financials.balanceDue)}
                          </div>
                        ) : (
                          <div className="primary-text text-success font-bold">
                            {formatInr(row.financials.balanceDue)}
                          </div>
                        )}
                      </td>
                      <td className="align-center actions-cell">
                        <IconButton>
                          {expandedRow === row.challanId ? (
                            <ChevronUp size={18} />
                          ) : (
                            <ChevronDown size={18} />
                          )}
                        </IconButton>
                      </td>
                    </tr>
                    {expandedRow === row.challanId && (
                      <ExpandedRow>
                        <td colSpan="7">
                          <div className="manifest-container">
                            <div className="manifest-header flex-between">
                              <h4>
                                <Milestone
                                  size={16}
                                  className="mr-2 text-indigo-600"
                                />{" "}
                                Route Waypoints & Drop Schedule
                              </h4>
                              <div style={{ display: "flex", gap: "10px" }}>
                                {/* ⚡ UI Update Logic Implemented Here ⚡ */}
                                {lockedEscrows.has(row.challanId) ? (
                                  <Button
                                    disabled
                                    style={{
                                      background: "#ECFDF5",
                                      color: "#059669",
                                      border: "1px solid #10B981",
                                    }}
                                  >
                                    <CheckCircle2 size={14} className="mr-2" />{" "}
                                    Escrow Secured
                                  </Button>
                                ) : (
                                  <Button
                                    $variant="primary"
                                    onClick={() => handleLockEscrow(row)}
                                    disabled={lockingEscrow === row.challanId}
                                  >
                                    {lockingEscrow === row.challanId ? (
                                      <>
                                        <RefreshCw
                                          size={14}
                                          className="spin mr-2"
                                        />{" "}
                                        Locking...
                                      </>
                                    ) : (
                                      <>
                                        <Lock size={14} className="mr-2" /> Lock
                                        Web3 Escrow
                                      </>
                                    )}
                                  </Button>
                                )}

                                <Button
                                  $variant="danger-outline"
                                  onClick={() => setEmergencyData(row)}
                                >
                                  <Zap size={14} className="mr-2" /> Issue
                                  Emergency Funds
                                </Button>
                              </div>
                            </div>
                            {row.financials.toPayCollected > 0 && (
                              <WarningBanner>
                                <AlertCircle size={16} className="mr-2" />{" "}
                                Driver collected{" "}
                                {formatInr(row.financials.toPayCollected)} in
                                "To Pay" physical cash on this route.
                              </WarningBanner>
                            )}
                            <div className="timeline mt-3">
                              {row.stops.map((stop, index) => (
                                <div className="timeline-item" key={stop.id}>
                                  <div className="indicator">
                                    <div className="circle"></div>
                                    {index !== row.stops.length - 1 && (
                                      <div className="line"></div>
                                    )}
                                  </div>
                                  <div className="content">
                                    <div className="stop-header">
                                      <h5>
                                        Drop {index + 1}: {stop.destination}
                                      </h5>
                                      <span className="lr-badge">
                                        {stop.id} • {stop.lrType}
                                      </span>
                                    </div>
                                    <div className="cargo-details">
                                      <Package
                                        size={14}
                                        className="mr-2 text-gray-400"
                                      />{" "}
                                      {stop.weight} of {stop.cargo}
                                    </div>
                                    <div className="actions mt-3">
                                      {index === row.stops.length - 1 &&
                                      row.financials.balanceDue > 0 ? (
                                        <Button
                                          $variant="secondary"
                                          style={{
                                            fontSize: "12px",
                                            padding: "6px 12px",
                                          }}
                                          onClick={() =>
                                            openSettlementModal(row, stop)
                                          }
                                        >
                                          <CheckCircle2
                                            size={14}
                                            className="text-success mr-1"
                                          />{" "}
                                          Verify POD & Release Escrow
                                        </Button>
                                      ) : index === row.stops.length - 1 &&
                                        row.financials.balanceDue < 0 ? (
                                        <Button
                                          $variant="secondary"
                                          style={{
                                            fontSize: "12px",
                                            padding: "6px 12px",
                                            color: "#991b1b",
                                            borderColor: "#fecaca",
                                          }}
                                        >
                                          <ShieldAlert
                                            size={14}
                                            className="mr-1"
                                          />{" "}
                                          Remit Cash Before Settlement
                                        </Button>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </ExpandedRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </Table>
        </TableWrapper>
      </TableCard>

      {emergencyData && (
        <ModalOverlay
          onClick={() => !isProcessingPayment && setEmergencyData(null)}
        >
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <div className="flex-center">
                <Zap size={20} className="mr-2 text-orange-500" />
                <h3>Dispatch Emergency Funds</h3>
              </div>
              <IconButton
                onClick={() => setEmergencyData(null)}
                disabled={isProcessingPayment}
              >
                <X size={20} />
              </IconButton>
            </ModalHeader>
            <form onSubmit={handleIssueEmergencyAdvance}>
              <ModalBody>
                <div className="info-grid" style={{ marginBottom: "20px" }}>
                  <div className="info-block">
                    <label>Driver</label>
                    <span className="font-medium">
                      {emergencyData.driverName}
                    </span>
                  </div>
                  <div className="info-block">
                    <label>Challan ID</label>
                    <span className="font-mono text-indigo">
                      {emergencyData.challanId}
                    </span>
                  </div>
                </div>
                <FormGroup>
                  <label>Fund Amount (INR)</label>
                  <div className="input-with-icon">
                    <IndianRupee size={16} className="icon" />
                    <input
                      type="number"
                      required
                      min="1"
                      max={
                        emergencyData.financials.balanceDue > 0
                          ? emergencyData.financials.balanceDue
                          : 50000
                      }
                      placeholder="e.g., 2000"
                      value={emergencyAmount}
                      onChange={(e) => setEmergencyAmount(e.target.value)}
                      disabled={isProcessingPayment}
                    />
                  </div>
                </FormGroup>
                <FormGroup>
                  <label>Reason for Exception</label>
                  <select
                    required
                    value={emergencyReason}
                    onChange={(e) => setEmergencyReason(e.target.value)}
                    disabled={isProcessingPayment}
                  >
                    <option value="">Select reason...</option>
                    <option value="Tire / Puncture">Tire / Puncture</option>
                    <option value="Mechanical Breakdown">
                      Mechanical Breakdown
                    </option>
                    <option value="RTO / Challan / Toll">
                      RTO / Challan / Toll issue
                    </option>
                    <option value="Extra Fuel Needed">Extra Fuel Needed</option>
                  </select>
                </FormGroup>
              </ModalBody>
              <ModalFooter>
                <Button
                  type="button"
                  $variant="ghost"
                  onClick={() => setEmergencyData(null)}
                  disabled={isProcessingPayment}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  $variant="danger"
                  disabled={
                    isProcessingPayment || !emergencyAmount || !emergencyReason
                  }
                >
                  {isProcessingPayment ? (
                    <>
                      <RefreshCw size={16} className="spin mr-1" />{" "}
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap size={16} className="mr-1" /> Authorize Instant
                      Transfer
                    </>
                  )}
                </Button>
              </ModalFooter>
            </form>
          </Modal>
        </ModalOverlay>
      )}

      {settlementData && (
        <ModalOverlay onClick={closeSettlementModal}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <div className="flex-center">
                <Link size={20} className="mr-2 text-indigo-600" />
                <h3>Execute Web3 Settlement</h3>
              </div>
              <IconButton
                onClick={closeSettlementModal}
                disabled={isProcessingPayment}
              >
                <X size={20} />
              </IconButton>
            </ModalHeader>
            <ModalBody>
              <div className="info-grid" style={{ marginBottom: "20px" }}>
                <div className="info-block">
                  <label>Driver Profile</label>
                  <span>{settlementData.trip.driverName}</span>
                </div>
                <div className="info-block">
                  <label>Smart Contract ID</label>
                  <span className="font-mono text-indigo">
                    {settlementData.trip.challanId}
                  </span>
                </div>
              </div>
              <AmountCard>
                <div className="label">Escrow Release Amount</div>
                <div className="amount">{formatInr(settlementData.amount)}</div>
                <div className="subtext">
                  Auto-deducted from master trip escrow
                </div>
              </AmountCard>
              <VerificationBox $active={podVerified}>
                <label className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    checked={podVerified}
                    onChange={(e) => setPodVerified(e.target.checked)}
                    disabled={isProcessingPayment}
                  />
                  <div className="checkbox-content">
                    <span className="title">
                      <FileCheck size={16} className="mr-2" /> Cryptographic POD
                      Verified
                    </span>
                    <span className="desc">
                      I confirm delivery conditions are met and authorize escrow
                      release via Smart Contract.
                    </span>
                  </div>
                </label>
              </VerificationBox>
            </ModalBody>
            <ModalFooter>
              <Button
                $variant="ghost"
                onClick={closeSettlementModal}
                disabled={isProcessingPayment}
              >
                Cancel
              </Button>
              <Button
                $variant="primary"
                onClick={handleAuthorizeTransfer}
                disabled={!podVerified || isProcessingPayment}
                style={{ background: podVerified ? "#0F172A" : "#94A3B8" }}
              >
                {isProcessingPayment ? (
                  <>
                    <RefreshCw size={16} className="spin mr-1" /> Signing
                    Transaction...
                  </>
                ) : (
                  <>
                    <Link size={16} className="mr-1" /> Sign & Release Escrow
                  </>
                )}
              </Button>
            </ModalFooter>
          </Modal>
        </ModalOverlay>
      )}
    </Container>
  );
}

// STYLING
const spinAnimation = keyframes`from { transform: rotate(0deg); } to { transform: rotate(360deg); }`;
const shimmer = keyframes`0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; }`;
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
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
  .title-section h1 {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.03em;
    margin: 0 0 8px 0;
    color: #0f172a;
  }
  .title-section .subtitle {
    font-size: 14px;
    color: #64748b;
    margin: 0;
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
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  ${(props) =>
    props.$variant === "primary" &&
    css`
      background: #0f172a;
      color: white;
      border: 1px solid #0f172a;
      &:hover:not(:disabled) {
        background: #1e293b;
        transform: translateY(-1px);
      }
    `} ${(props) =>
    props.$variant === "secondary" &&
    css`
      background: white;
      color: #334155;
      border: 1px solid #e2e8f0;
      &:hover:not(:disabled) {
        background: #f8fafc;
        border-color: #cbd5e1;
      }
    `} ${(props) =>
    props.$variant === "danger" &&
    css`
      background: #ef4444;
      color: white;
      border: 1px solid #ef4444;
      &:hover:not(:disabled) {
        background: #dc2626;
      }
    `} ${(props) =>
    props.$variant === "danger-outline" &&
    css`
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
      &:hover:not(:disabled) {
        background: #fee2e2;
      }
    `} ${(props) =>
    props.$variant === "ghost" &&
    css`
      background: transparent;
      color: #64748b;
      border: 1px solid transparent;
      &:hover:not(:disabled) {
        background: #f1f5f9;
        color: #0f172a;
      }
    `} &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  &:hover:not(:disabled) {
    background: #f1f5f9;
    color: #0f172a;
  }
`;
const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;
const SummaryCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    p {
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      margin: 0;
    }
    .icon-wrapper {
      padding: 10px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
  h3 {
    font-size: 28px;
    font-weight: 700;
    margin: 0;
    color: #0f172a;
  }
  .metric-subtext {
    font-size: 13px;
    color: #94a3b8;
    margin: 8px 0 0 0;
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
  width: 100%;
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
      color: #64748b;
      border-bottom: 1px solid #e2e8f0;
      white-space: nowrap;
      &.align-right {
        text-align: right;
      }
      &.align-center {
        text-align: center;
      }
    }
  }
  tbody {
    tr.master-row {
      transition: background 0.15s;
      cursor: pointer;
      &:hover {
        background: #f8fafc;
      }
    }
    td {
      padding: 20px 24px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
      white-space: nowrap;
      &.align-right {
        text-align: right;
      }
      &.align-center {
        text-align: center;
      }
      .primary-text {
        font-size: 14px;
        font-weight: 600;
        color: #0f172a;
        margin-bottom: 4px;
      }
      .secondary-text {
        font-size: 13px;
        color: #64748b;
      }
      .text-warning {
        color: #d97706;
      }
      .text-success {
        color: #059669;
      }
      .text-danger {
        color: #dc2626;
      }
      .font-mono {
        font-family: ui-monospace, monospace;
      }
      .font-medium {
        font-weight: 600;
      }
      .font-bold {
        font-weight: 700;
      }
      .flex-center {
        display: flex;
        align-items: center;
      }
      .mr-2 {
        margin-right: 8px;
      }
      .mt-1 {
        margin-top: 4px;
      }
    }
  }
`;
const ExpandedRow = styled.tr`
  background: #fafaf9;
  td {
    padding: 0 !important;
    border-bottom: 1px solid #e2e8f0 !important;
  }
  .manifest-container {
    padding: 32px 40px;
    border-left: 4px solid #6366f1;
  }
  .manifest-header {
    margin-bottom: 20px;
    h4 {
      display: flex;
      align-items: center;
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
  }
  .flex-between {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .timeline {
    display: flex;
    flex-direction: column;
  }
  .timeline-item {
    display: flex;
    gap: 20px;
    position: relative;
    padding-bottom: 24px;
    &:last-child {
      padding-bottom: 0;
    }
  }
  .indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 16px;
    .circle {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 3px solid #6366f1;
      background: white;
      z-index: 2;
    }
    .line {
      position: absolute;
      top: 14px;
      bottom: 0;
      left: 6px;
      width: 2px;
      background: #e0e7ff;
      z-index: 1;
    }
  }
  .content {
    flex: 1;
    margin-top: -4px;
  }
  .stop-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 6px;
    h5 {
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
      margin: 0;
    }
    .lr-badge {
      font-size: 11px;
      font-weight: 600;
      font-family: monospace;
      background: #eef2ff;
      color: #4338ca;
      padding: 4px 8px;
      border-radius: 6px;
      border: 1px solid #c7d2fe;
    }
  }
  .cargo-details {
    font-size: 13px;
    color: #64748b;
    display: flex;
    align-items: center;
  }
  .mt-3 {
    margin-top: 12px;
  }
`;
const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 700;
  background: ${(p) => p.$bg};
  color: ${(p) => p.$color};
  border: 1px solid ${(p) => p.$border};
`;
const WarningBanner = styled.div`
  display: inline-flex;
  align-items: center;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 16px;
`;
const SkeletonBox = styled.div`
  height: 72px;
  border-bottom: 1px solid #f1f5f9;
  animation: ${shimmer} 2s infinite linear;
  background: linear-gradient(to right, #f8fafc 4%, #f1f5f9 25%, #f8fafc 36%);
  background-size: 1000px 100%;
`;
const SkeletonRow = () => (
  <tr>
    <td colSpan="7" style={{ padding: 0 }}>
      <SkeletonBox />
    </td>
  </tr>
);
const EmptyStateRow = styled.td`
  padding: 80px 20px !important;
  text-align: center;
  .empty-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #94a3b8;
    h4 {
      font-size: 18px;
      color: #0f172a;
      margin: 16px 0 8px 0;
      font-weight: 600;
    }
  }
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
  max-width: 480px;
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
  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #0f172a;
  }
`;
const ModalBody = styled.div`
  padding: 32px;
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  .info-block {
    display: flex;
    flex-direction: column;
    gap: 6px;
    label {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
    }
    span {
      font-size: 15px;
      font-weight: 600;
      color: #0f172a;
      &.font-mono {
        font-family: ui-monospace, monospace;
      }
      &.text-indigo {
        color: #4f46e5;
      }
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
`;
const FormGroup = styled.div`
  margin-bottom: 24px;
  label {
    display: block;
    font-size: 13px;
    font-weight: 700;
    color: #334155;
    margin-bottom: 8px;
  }
  select,
  input {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    font-size: 14px;
    outline: none;
    background: white;
    &:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
  }
  .input-with-icon {
    position: relative;
    .icon {
      position: absolute;
      left: 16px;
      top: 12px;
      color: #94a3b8;
    }
    input {
      padding-left: 44px;
    }
  }
`;
const AmountCard = styled.div`
  background: #f8fafc;
  border: 2px dashed #cbd5e1;
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  margin-bottom: 24px;
  .label {
    font-size: 12px;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .amount {
    font-size: 36px;
    font-weight: 800;
    color: #059669;
  }
  .subtext {
    font-size: 12px;
    color: #64748b;
    margin-top: 4px;
  }
`;
const VerificationBox = styled.div`
  border: 2px solid ${(p) => (p.$active ? "#10B981" : "#E2E8F0")};
  background: ${(p) => (p.$active ? "#ECFDF5" : "white")};
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s;
  .checkbox-wrapper {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    cursor: pointer;
    input {
      margin-top: 3px;
      width: 18px;
      height: 18px;
      accent-color: #10b981;
    }
  }
  .checkbox-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
    .title {
      font-size: 14px;
      font-weight: 700;
      color: ${(p) => (p.$active ? "#065F46" : "#0F172A")};
    }
    .desc {
      font-size: 12px;
      color: ${(p) => (p.$active ? "#047857" : "#64748B")};
    }
  }
`;
