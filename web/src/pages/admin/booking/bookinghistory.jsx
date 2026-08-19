import React, { useState, useEffect, useMemo, useCallback } from "react";
import styled, { keyframes, css } from "styled-components";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Download,
  Printer,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  MapPin,
  Clock,
  FileText,
  Truck,
  User,
  IndianRupee,
  FileCheck,
  X,
  Calendar,
  FileDigit,
  Copy,
  ExternalLink,
  Activity,
} from "lucide-react";

const API_BASE = "http://localhost:8000/api";

export default function BookingHistory() {
  const navigate = useNavigate();

  // State
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({
    key: "bookingDate",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const fetchBookings = async () => {
    try {
      setLoading(true);

      // PHASE 2 FIX: Fetching the Master Dictionaries so we get real names!
      const [shipmentsRes, driversRes, vehiclesRes] = await Promise.all([
        fetch(`${API_BASE}/shipments/`),
        fetch(`${API_BASE}/drivers/`),
        fetch(`${API_BASE}/vehicles/`),
      ]);

      const [shipmentsData, driversData, vehiclesData] = await Promise.all([
        shipmentsRes.json(),
        driversRes.json(),
        vehiclesRes.json(),
      ]);

      const rawShipments = shipmentsData.data || shipmentsData || [];
      const driversList = driversData.data || driversData || [];
      const vehiclesList = vehiclesData.data || vehiclesData || [];

      // Translators
      const getDriverName = (id) => {
        const driver = driversList.find(
          (d) => d.id === id || d.id === parseInt(id),
        );
        return driver ? driver.full_name : "Not Assigned";
      };

      const getVehicleInfo = (id) => {
        const vehicle = vehiclesList.find(
          (v) => v.id === id || v.id === parseInt(id),
        );
        return vehicle ? `${vehicle.vehicle_id}` : "N/A";
      };

      // Map the data using our translators
      // The booking ledger is the complete record of bookings, not only a
      // short list of completed states. Pending and in-transit LRs must be
      // visible immediately after they are created.
      const historyData = Array.isArray(rawShipments)
        ? rawShipments.map((shipment) => ({
              id: shipment.id,
              company: shipment.client || "N/A",
              driver: getDriverName(shipment.driver_id),
              driver_id: shipment.driver_id,
              truck: getVehicleInfo(shipment.vehicle_id),
              plate: shipment.license_plate || "N/A",
              cargo: shipment.goods_desc || "N/A",
              destination: shipment.destination || "N/A",
              pickup: shipment.pickup_location || "N/A",
              weight: shipment.weight || 0,
              weight_type: shipment.weight_type || "kg",
              bookingDate: shipment.booking_date
                ? shipment.booking_date.split("T")[0]
                : "N/A",
              deliveryDate: shipment.eta ? shipment.eta.split("T")[0] : null,
              status: shipment.status || "Pending",
              amount: `₹${Number(shipment.freight_charge || 0).toLocaleString("en-IN")}`,
              rawAmount: Number(shipment.freight_charge || 0),
              paymentStatus: shipment.payment_mode || "Pending",
              lr_number: shipment.lr_number,
              tracking_id: shipment.tracking_id,
              notes: shipment.notes || "",
            }))
        : [];

      setBookings(historyData);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Memoized Derived Data
  const stats = useMemo(() => {
    const total = bookings.length;
    const delivered = bookings.filter(
      (b) => b.status?.toLowerCase() === "delivered",
    ).length;
    const cancelled = bookings.filter(
      (b) => b.status?.toLowerCase() === "cancelled",
    ).length;
    const revenue = bookings
      .filter((b) => b.status?.toLowerCase() === "delivered")
      .reduce((sum, b) => sum + (b.rawAmount || 0), 0);

    return {
      total,
      delivered,
      cancelled,
      revenue,
      avgFreight: delivered ? revenue / delivered : 0,
      completionRate: total ? Math.round((delivered / total) * 100) : 0,
    };
  }, [bookings]);

  const filteredAndSortedBookings = useMemo(() => {
    let result = bookings.filter((b) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        (b.lr_number || "").toLowerCase().includes(q) ||
        (b.company || "").toLowerCase().includes(q) ||
        (b.destination || "").toLowerCase().includes(q) ||
        (b.pickup || "").toLowerCase().includes(q) ||
        (b.driver || "").toLowerCase().includes(q) ||
        String(b.id).includes(q);
      const matchStatus =
        statusFilter === "all" ||
        b.status?.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });

    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (typeof aValue === "string") aValue = aValue.toLowerCase();
        if (typeof bValue === "string") bValue = bValue.toLowerCase();

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [bookings, searchTerm, statusFilter, sortConfig]);

  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedBookings.slice(start, start + itemsPerPage);
  }, [filteredAndSortedBookings, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedBookings.length / itemsPerPage);

  // Handlers
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  const handleExportCSV = useCallback(() => {
    const headers = [
      "ID,LR Number,Company,Pickup,Destination,Driver,Truck,Booking Date,Delivery Date,Status,Payment,Freight",
    ];
    const rows = filteredAndSortedBookings.map(
      (b) =>
        `${b.id},"${b.lr_number || ""}","${b.company}","${b.pickup}","${b.destination}","${b.driver}","${b.truck}","${b.bookingDate}","${b.deliveryDate || ""}","${b.status}","${b.paymentStatus}",${b.rawAmount}`,
    );
    const csvContent =
      "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `booking_history_${new Date().getTime()}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredAndSortedBookings]);

  const openDrawer = (booking) => {
    setSelectedBooking(booking);
    setShowDrawer(true);
  };

  const closeDrawer = () => {
    setShowDrawer(false);
    setTimeout(() => setSelectedBooking(null), 300);
  };

  // Utilities
  const formatInr = (num) => `₹${Number(num || 0).toLocaleString("en-IN")}`;

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return {
          bg: "#dcfce7",
          color: "#166534",
          border: "#bbf7d0",
          icon: CheckCircle2,
        };
      case "cancelled":
        return {
          bg: "#fee2e2",
          color: "#991b1b",
          border: "#fecaca",
          icon: XCircle,
        };
      case "delayed":
        return {
          bg: "#fef3c7",
          color: "#92400e",
          border: "#fde68a",
          icon: Clock,
        };
      case "assigned":
        return {
          bg: "#e0e7ff",
          color: "#4338ca",
          border: "#c7d2fe",
          icon: Truck,
        };
      default:
        return {
          bg: "#f1f5f9",
          color: "#475569",
          border: "#e2e8f0",
          icon: Activity,
        };
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return { bg: "#dcfce7", color: "#166534", border: "#bbf7d0" };
      case "pending":
        return { bg: "#fef3c7", color: "#b45309", border: "#fde68a" };
      case "refunded":
        return { bg: "#fee2e2", color: "#991b1b", border: "#fecaca" };
      case "topay":
        return { bg: "#e0e7ff", color: "#4338ca", border: "#c7d2fe" };
      case "tbb":
        return { bg: "#f3e8ff", color: "#7e22ce", border: "#e9d5ff" };
      default:
        return { bg: "#f1f5f9", color: "#475569", border: "#e2e8f0" };
    }
  };

  return (
    <Container>
      <PageHeader>
        <div className="title-section">
          <h1>Booking Ledger</h1>
          <p className="subtitle">
            Historical & assigned records <span className="dot">•</span>{" "}
            {stats.total} total entries
          </p>
        </div>
        <div className="action-section">
          <IconButton onClick={fetchBookings} title="Refresh Data">
            <RefreshCw size={16} className={loading ? "spin" : ""} />
          </IconButton>
          <Button $variant="secondary" onClick={() => window.print()}>
            <Printer size={16} /> Print Report
          </Button>
          <Button $variant="primary" onClick={handleExportCSV}>
            <Download size={16} /> Export CSV
          </Button>
        </div>
      </PageHeader>

      <StatsContainer>
        <SummaryCard>
          <div className="card-header">
            <p>Total Revenue</p>
            <div className="icon-wrapper primary">
              <IndianRupee size={16} />
            </div>
          </div>
          <h3>{formatInr(stats.revenue)}</h3>
        </SummaryCard>
        <SummaryCard>
          <div className="card-header">
            <p>Completed Trips</p>
            <div className="icon-wrapper success">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <h3>{stats.delivered}</h3>
          <p className="metric-subtext">
            {stats.completionRate}% completion rate
          </p>
        </SummaryCard>
        <SummaryCard>
          <div className="card-header">
            <p>Average Freight</p>
            <div className="icon-wrapper neutral">
              <Activity size={16} />
            </div>
          </div>
          <h3>{formatInr(stats.avgFreight)}</h3>
        </SummaryCard>
        <SummaryCard>
          <div className="card-header">
            <p>Cancelled Bookings</p>
            <div className="icon-wrapper danger">
              <XCircle size={16} />
            </div>
          </div>
          <h3>{stats.cancelled}</h3>
        </SummaryCard>
      </StatsContainer>

      <Toolbar>
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by LR, Party, Vehicle, or Destination..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="filter-wrapper">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="loading">Loading</option>
            <option value="in-transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="assigned">Assigned</option>
            <option value="delayed">Delayed</option>
          </Select>
          <Button $variant="secondary" className="advanced-filter">
            <Filter size={16} /> Filters
          </Button>
        </div>
      </Toolbar>

      <TableCard>
        <DesktopView>
          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <th onClick={() => handleSort("lr_number")}>
                    Booking Info{" "}
                    {sortConfig.key === "lr_number" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th onClick={() => handleSort("company")}>
                    Party & Route{" "}
                    {sortConfig.key === "company" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th>Vehicle & Driver</th>
                  <th onClick={() => handleSort("bookingDate")}>
                    Dates{" "}
                    {sortConfig.key === "bookingDate" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th onClick={() => handleSort("status")}>
                    Status{" "}
                    {sortConfig.key === "status" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="align-right"
                    onClick={() => handleSort("rawAmount")}
                  >
                    Freight{" "}
                    {sortConfig.key === "rawAmount" &&
                      (sortConfig.direction === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="align-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))
                ) : paginatedBookings.length > 0 ? (
                  paginatedBookings.map((b) => {
                    const st = getStatusColor(b.status);
                    const pt = getPaymentStatusColor(b.paymentStatus);
                    return (
                      <tr
                        key={b.id}
                        onClick={() => openDrawer(b)}
                        className="clickable-row"
                      >
                        <td>
                          <div className="primary-text font-mono">
                            {b.lr_number || `#${b.id}`}
                          </div>
                          <div className="secondary-text">
                            ID: {b.tracking_id || "N/A"}
                          </div>
                        </td>
                        <td>
                          <div className="primary-text">{b.company}</div>
                          <div className="secondary-text flex-center">
                            <MapPin size={12} className="mr-1" /> {b.pickup} →{" "}
                            {b.destination}
                          </div>
                        </td>
                        <td>
                          <div className="primary-text">{b.truck}</div>
                          <div className="secondary-text flex-center">
                            <User size={12} className="mr-1" /> {b.driver}
                          </div>
                        </td>
                        <td>
                          <div className="primary-text">
                            {b.deliveryDate || b.bookingDate}
                          </div>
                          <div className="secondary-text">
                            Booked: {b.bookingDate}
                          </div>
                        </td>
                        <td>
                          <StatusBadge
                            bg={st.bg}
                            color={st.color}
                            border={st.border}
                          >
                            {b.status}
                          </StatusBadge>
                        </td>
                        <td className="align-right">
                          <div className="primary-text font-medium">
                            {b.amount}
                          </div>
                          <div className="mt-1">
                            <PaymentBadge
                              bg={pt.bg}
                              color={pt.color}
                              border={pt.border}
                            >
                              {b.paymentStatus}
                            </PaymentBadge>
                          </div>
                        </td>
                        <td className="align-right actions-cell">
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              openDrawer(b);
                            }}
                          >
                            <MoreHorizontal size={18} />
                          </IconButton>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <EmptyStateRow colSpan="7">
                    <div className="empty-content">
                      <FileDigit size={48} />
                      <h4>No records found</h4>
                      <p>
                        Adjust your search filters or try a different date
                        range.
                      </p>
                      <Button
                        $variant="secondary"
                        onClick={() => {
                          setSearchTerm("");
                          setStatusFilter("all");
                        }}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </EmptyStateRow>
                )}
              </tbody>
            </Table>
          </TableWrapper>
        </DesktopView>

        <MobileView>
          {loading ? (
            <div style={{ padding: "20px" }}>Loading...</div>
          ) : paginatedBookings.length > 0 ? (
            paginatedBookings.map((b) => {
              const st = getStatusColor(b.status);
              return (
                <MobileCard key={b.id} onClick={() => openDrawer(b)}>
                  <div className="card-header">
                    <div>
                      <span className="lr font-mono">
                        {b.lr_number || `#${b.id}`}
                      </span>
                      <div className="company">{b.company}</div>
                    </div>
                    <StatusBadge bg={st.bg} color={st.color} border={st.border}>
                      {b.status}
                    </StatusBadge>
                  </div>
                  <div className="card-body">
                    <div className="route">
                      <MapPin size={14} className="mr-1 text-gray" /> {b.pickup}{" "}
                      <span className="text-gray mx-1">→</span> {b.destination}
                    </div>
                    <div className="flex-between mt-3">
                      <div>
                        <div className="label">Freight</div>
                        <div className="value font-medium">{b.amount}</div>
                      </div>
                      <div className="text-right">
                        <div className="label">Date</div>
                        <div className="value">
                          {b.deliveryDate || b.bookingDate}
                        </div>
                      </div>
                    </div>
                  </div>
                </MobileCard>
              );
            })
          ) : (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              No records found
            </div>
          )}
        </MobileView>

        {!loading && filteredAndSortedBookings.length > 0 && (
          <Pagination>
            <div className="page-info">
              Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to{" "}
              <strong>
                {Math.min(
                  currentPage * itemsPerPage,
                  filteredAndSortedBookings.length,
                )}
              </strong>{" "}
              of <strong>{filteredAndSortedBookings.length}</strong> results
            </div>
            <div className="page-controls">
              <IconButton
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft size={18} />
              </IconButton>
              <IconButton
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <ChevronRight size={18} />
              </IconButton>
            </div>
          </Pagination>
        )}
      </TableCard>

      <DrawerOverlay isOpen={showDrawer} onClick={closeDrawer} />
      <DrawerPanel isOpen={showDrawer}>
        {selectedBooking && (
          <>
            <DrawerHeader>
              <div>
                <h2>
                  {selectedBooking.lr_number ||
                    `Booking #${selectedBooking.id}`}
                </h2>
                <p>Created on {selectedBooking.bookingDate}</p>
              </div>
              <div className="actions">
                <IconButton title="Print">
                  <Printer size={18} />
                </IconButton>
                <IconButton onClick={closeDrawer} title="Close">
                  <X size={20} />
                </IconButton>
              </div>
            </DrawerHeader>

            <DrawerBody>
              <div className="quick-actions">
                <Button $variant="secondary" className="full-width">
                  <FileText size={16} /> Download LR
                </Button>
                <Button $variant="secondary" className="full-width">
                  <IndianRupee size={16} /> Invoice
                </Button>
              </div>

              <StatusBanner
                bg={getStatusColor(selectedBooking.status).bg}
                border={getStatusColor(selectedBooking.status).border}
              >
                <div
                  className="status-icon"
                  style={{
                    color: getStatusColor(selectedBooking.status).color,
                  }}
                >
                  {React.createElement(
                    getStatusColor(selectedBooking.status).icon,
                    { size: 24 },
                  )}
                </div>
                <div>
                  <h4
                    style={{
                      color: getStatusColor(selectedBooking.status).color,
                    }}
                  >
                    {selectedBooking.status}
                  </h4>
                  <p>
                    Last activity date:{" "}
                    {selectedBooking.deliveryDate ||
                      selectedBooking.bookingDate}
                    .
                  </p>
                </div>
              </StatusBanner>

              <Section>
                <h3>Shipment Specifications</h3>
                <Grid2>
                  <InfoBlock>
                    <label>Consignor / Party</label>
                    <span>{selectedBooking.company}</span>
                  </InfoBlock>
                  <InfoBlock>
                    <label>Cargo Description</label>
                    <span>{selectedBooking.cargo}</span>
                  </InfoBlock>
                  <InfoBlock>
                    <label>Actual Weight</label>
                    <span>
                      {selectedBooking.weight} {selectedBooking.weight_type}
                    </span>
                  </InfoBlock>
                  <InfoBlock>
                    <label>Tracking ID</label>
                    <span className="link flex-center">
                      {selectedBooking.tracking_id || "N/A"}{" "}
                      {selectedBooking.tracking_id && (
                        <ExternalLink size={12} className="ml-1" />
                      )}
                    </span>
                  </InfoBlock>
                </Grid2>
              </Section>

              <Section>
                <h3>Logistics & Route</h3>
                <div className="route-box">
                  <div className="point">
                    <div className="dot start"></div>
                    <div>
                      <label>Origin</label>
                      <span>{selectedBooking.pickup}</span>
                    </div>
                  </div>
                  <div className="line"></div>
                  <div className="point">
                    <div className="dot end"></div>
                    <div>
                      <label>Destination</label>
                      <span>{selectedBooking.destination}</span>
                    </div>
                  </div>
                </div>
                <Grid2 style={{ marginTop: "16px" }}>
                  <InfoBlock>
                    <label>Driver Assigned</label>
                    <span className="flex-center">
                      <User size={14} className="mr-1 text-gray" />{" "}
                      {selectedBooking.driver}
                    </span>
                  </InfoBlock>
                  <InfoBlock>
                    <label>Vehicle Fleet</label>
                    <span className="flex-center">
                      <Truck size={14} className="mr-1 text-gray" />{" "}
                      {selectedBooking.truck}
                    </span>
                  </InfoBlock>
                </Grid2>
              </Section>

              <Section>
                <h3>Financial Overview</h3>
                <FinancialBox>
                  <div className="fin-row">
                    <span>Base Freight</span>
                    <span>{selectedBooking.amount}</span>
                  </div>
                  <div className="fin-row">
                    <span>Payment Status</span>
                    <PaymentBadge
                      bg={
                        getPaymentStatusColor(selectedBooking.paymentStatus).bg
                      }
                      color={
                        getPaymentStatusColor(selectedBooking.paymentStatus)
                          .color
                      }
                      border={
                        getPaymentStatusColor(selectedBooking.paymentStatus)
                          .border
                      }
                    >
                      {selectedBooking.paymentStatus}
                    </PaymentBadge>
                  </div>
                  <div className="fin-divider"></div>
                  <div className="fin-row total">
                    <span>Total Settled</span>
                    <span>{selectedBooking.amount}</span>
                  </div>
                </FinancialBox>
              </Section>

              {selectedBooking.notes && (
                <Section>
                  <h3>Internal Notes</h3>
                  <div className="notes-box">{selectedBooking.notes}</div>
                </Section>
              )}
            </DrawerBody>
          </>
        )}
      </DrawerPanel>
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

  @media (max-width: 768px) {
    padding: 20px 16px;
  }
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

  ${(props) =>
    props.$variant === "secondary" &&
    css`
      background: white;
      color: #374151;
      border: 1px solid #d1d5db;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
      &:hover {
        background: #f9fafb;
        border-color: #9ca3af;
      }
    `}
  &.full-width {
    width: 100%;
  }
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
  &:hover:not(:disabled) {
    background: #f3f4f6;
    color: #111827;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
      &.primary {
        background: #f3f4f6;
        color: #374151;
      }
      &.success {
        background: #dcfce7;
        color: #166534;
      }
      &.danger {
        background: #fee2e2;
        color: #991b1b;
      }
      &.neutral {
        background: #e0e7ff;
        color: #4338ca;
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
      &:focus {
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
      }
    }
  }
  .filter-wrapper {
    display: flex;
    gap: 12px;
  }
  @media (max-width: 768px) {
    .search-wrapper {
      max-width: 100%;
    }
    .advanced-filter {
      display: none;
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
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
`;

const TableCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  overflow: hidden;
`;
const DesktopView = styled.div`
  display: block;
  @media (max-width: 768px) {
    display: none;
  }
`;
const MobileView = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    padding: 12px;
    gap: 12px;
    background: #f9fafb;
  }
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
    border-bottom: 1px solid #e5e7eb;
    th {
      padding: 14px 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
      border-bottom: 1px solid #e5e7eb;
      white-space: nowrap;
      cursor: pointer;
      user-select: none;
      &:hover {
        color: #111827;
      }
      &.align-right {
        text-align: right;
      }
    }
  }
  tbody {
    tr {
      transition: background 0.15s;
      &.clickable-row {
        cursor: pointer;
      }
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
      white-space: nowrap;
      &.align-right {
        text-align: right;
      }
      &.actions-cell {
        padding-top: 12px;
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
      .font-mono {
        font-family:
          ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
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
        margin-top: 6px;
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
    <td colSpan="7" style={{ padding: 0 }}>
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
      margin: 0 0 20px 0;
    }
  }
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  background: ${(p) => p.bg};
  color: ${(p) => p.color};
  border: 1px solid ${(p) => p.border || "transparent"};
`;
const PaymentBadge = styled.span`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: ${(p) => p.bg};
  color: ${(p) => p.color};
  border: 1px solid ${(p) => p.border || "transparent"};
`;

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
  background: white;
  .page-info {
    font-size: 13px;
    color: #6b7280;
    strong {
      color: #111827;
      font-weight: 600;
    }
  }
  .page-controls {
    display: flex;
    gap: 8px;
  }
`;

const MobileCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
  cursor: pointer;
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f3f4f6;
    .lr {
      font-size: 14px;
      font-weight: 600;
      font-family: monospace;
      color: #111827;
    }
    .company {
      font-size: 13px;
      color: #6b7280;
      margin-top: 4px;
    }
  }
  .card-body {
    .route {
      font-size: 13px;
      font-weight: 500;
      color: #111827;
      display: flex;
      align-items: center;
    }
    .flex-between {
      display: flex;
      justify-content: space-between;
    }
    .mt-3 {
      margin-top: 16px;
    }
    .text-right {
      text-align: right;
    }
    .text-gray {
      color: #9ca3af;
    }
    .mx-1 {
      margin: 0 8px;
    }
    .label {
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    .value {
      font-size: 14px;
      color: #111827;
    }
    .font-medium {
      font-weight: 600;
    }
  }
`;

const DrawerOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.4);
  backdrop-filter: blur(2px);
  z-index: 1000;
  opacity: ${(p) => (p.isOpen ? 1 : 0)};
  visibility: ${(p) => (p.isOpen ? "visible" : "hidden")};
  transition: opacity 0.3s ease;
`;

const DrawerPanel = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  max-width: 480px;
  background: white;
  z-index: 1001;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.1);
  transform: translateX(${(p) => (p.isOpen ? "0" : "100%")});
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
`;

const DrawerHeader = styled.div`
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: #f9fafb;
  h2 {
    font-size: 18px;
    font-weight: 600;
    color: #111827;
    margin: 0 0 4px 0;
  }
  p {
    font-size: 13px;
    color: #6b7280;
    margin: 0;
  }
  .actions {
    display: flex;
    gap: 8px;
  }
`;

const DrawerBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  .quick-actions {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
  }
`;

const StatusBanner = styled.div`
  background: ${(p) => p.bg};
  border: 1px solid ${(p) => p.border};
  border-radius: 12px;
  padding: 16px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 32px;
  .status-icon {
    margin-top: 2px;
  }
  h4 {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 4px 0;
  }
  p {
    font-size: 13px;
    color: #4b5563;
    margin: 0;
    line-height: 1.4;
  }
`;

const Section = styled.div`
  margin-bottom: 32px;
  h3 {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #9ca3af;
    margin: 0 0 16px 0;
    border-bottom: 1px solid #f3f4f6;
    padding-bottom: 8px;
  }
  .route-box {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    position: relative;
    .point {
      display: flex;
      gap: 12px;
      position: relative;
      z-index: 2;
    }
    .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid white;
      margin-top: 4px;
      &.start {
        background: #3b82f6;
      }
      &.end {
        background: #10b981;
      }
    }
    .line {
      position: absolute;
      left: 21.5px;
      top: 24px;
      bottom: 24px;
      width: 1px;
      border-left: 1px dashed #d1d5db;
      z-index: 1;
    }
    label {
      font-size: 11px;
      color: #6b7280;
      display: block;
      margin-bottom: 2px;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    span {
      font-size: 14px;
      font-weight: 500;
      color: #111827;
    }
  }
  .notes-box {
    background: #fefce8;
    border: 1px solid #fef08a;
    border-radius: 8px;
    padding: 16px;
    font-size: 13px;
    color: #854d0e;
    line-height: 1.5;
  }
`;

const Grid2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 24px;
`;
const InfoBlock = styled.div`
  label {
    display: block;
    font-size: 11px;
    color: #6b7280;
    margin-bottom: 4px;
  }
  span {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: #111827;
    &.link {
      color: #2563eb;
      cursor: pointer;
    }
    &.link:hover {
      text-decoration: underline;
    }
    .flex-center {
      display: flex;
      align-items: center;
    }
    .mr-1 {
      margin-right: 6px;
    }
    .text-gray {
      color: #9ca3af;
    }
    .ml-1 {
      margin-left: 4px;
    }
  }
`;
const FinancialBox = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  .fin-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    color: #4b5563;
    margin-bottom: 12px;
    &:last-child {
      margin-bottom: 0;
    }
    &.total {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
    }
  }
  .fin-divider {
    height: 1px;
    background: #e5e7eb;
    margin: 12px 0;
  }
`;
