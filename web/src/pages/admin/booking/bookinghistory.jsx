import React, { useState } from 'react';
import styled from 'styled-components';

export default function BookingHistory() {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Booking History Data
  const bookings = [
    { 
      id: "B001", 
      company: "Kartikey Lodha", 
      driver: "Rajesh Kumar",
      truck: "TRK-4022", 
      plate: "RJ06 PA 6666",
      cargo: "Industrial Gears", 
      destination: "Udaipur", 
      bookingDate: "2024-01-10", 
      deliveryDate: "2024-01-13",
      status: "Delivered", 
      amount: "₹45,000",
      paymentStatus: "Paid"
    },
    { 
      id: "B002", 
      company: "Ramesh Chandra", 
      driver: "Amit Singh",
      truck: "TRK-1092", 
      plate: "RJ06 PA 1122",
      cargo: "Textile Fabric", 
      destination: "Bhilwara", 
      bookingDate: "2024-01-08", 
      deliveryDate: "2024-01-12",
      status: "Delivered", 
      amount: "₹32,000",
      paymentStatus: "Paid"
    },
    { 
      id: "B003", 
      company: "Suresh Kumar", 
      driver: "Pankaj Sharma",
      truck: "TRK-8819", 
      plate: "RJ06 PA 9988",
      cargo: "Electronics", 
      destination: "Jaipur", 
      bookingDate: "2024-01-05", 
      deliveryDate: null,
      status: "Cancelled", 
      amount: "₹28,000",
      paymentStatus: "Refunded"
    },
    { 
      id: "B004", 
      company: "Priya Transport", 
      driver: "Vikram Patel",
      truck: "TRK-5544", 
      plate: "RJ06 PA 3344",
      cargo: "Construction Material", 
      destination: "Kota", 
      bookingDate: "2024-01-03", 
      deliveryDate: "2024-01-07",
      status: "Delivered", 
      amount: "₹55,000",
      paymentStatus: "Paid"
    },
    { 
      id: "B005", 
      company: "Mohan Logistics", 
      driver: "Sunil Kumar",
      truck: "TRK-6677", 
      plate: "RJ06 PA 7788",
      cargo: "Medical Supplies", 
      destination: "Ajmer", 
      bookingDate: "2024-01-12", 
      deliveryDate: null,
      status: "In Transit", 
      amount: "₹38,000",
      paymentStatus: "Pending"
    }
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'Delivered': return '#10b981';
      case 'In Transit': return '#3b82f6';
      case 'Cancelled': return '#ef4444';
      case 'Pending': return '#f59e0b';
      default: return '#64748b';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch(status) {
      case 'Paid': return '#10b981';
      case 'Pending': return '#f59e0b';
      case 'Refunded': return '#ef4444';
      default: return '#64748b';
    }
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  // Stats
  const stats = {
    total: bookings.length,
    delivered: bookings.filter(b => b.status === 'Delivered').length,
    inTransit: bookings.filter(b => b.status === 'In Transit').length,
    cancelled: bookings.filter(b => b.status === 'Cancelled').length,
    totalRevenue: bookings.reduce((sum, b) => {
      if (b.status !== 'Cancelled') {
        return sum + parseInt(b.amount.replace(/[₹,]/g, ''));
      }
      return sum;
    }, 0)
  };

  return (
    <PageWrapper>
      {/* Header */}
      <Header>
        <div>
          <h1>Booking History</h1>
          <p>View all past and current bookings</p>
        </div>
      </Header>

      {/* Stats */}
      <StatsGrid>
        <StatCard>
          <p>Total Bookings</p>
          <h3>{stats.total}</h3>
        </StatCard>
        <StatCard color="#10b981">
          <p>Delivered</p>
          <h3>{stats.delivered}</h3>
        </StatCard>
        <StatCard color="#3b82f6">
          <p>In Transit</p>
          <h3>{stats.inTransit}</h3>
        </StatCard>
        <StatCard color="#ef4444">
          <p>Cancelled</p>
          <h3>{stats.cancelled}</h3>
        </StatCard>
        <StatCard color="#8b5cf6">
          <p>Total Revenue</p>
          <h3>₹{stats.totalRevenue.toLocaleString()}</h3>
        </StatCard>
      </StatsGrid>

      {/* Bookings Table */}
      <TableCard>
        <TableHeader>
          <h3>All Bookings</h3>
          <span>{bookings.length} Records</span>
        </TableHeader>
        <TableWrapper>
          <Table>
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Company</th>
                <th>Driver</th>
                <th>Truck</th>
                <th>Plate</th>
                <th>Cargo</th>
                <th>Destination</th>
                <th>Booking Date</th>
                <th>Delivery Date</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td><strong>{booking.id}</strong></td>
                  <td>{booking.company}</td>
                  <td>{booking.driver}</td>
                  <td>{booking.truck}</td>
                  <td>{booking.plate}</td>
                  <td>{booking.cargo}</td>
                  <td>{booking.destination}</td>
                  <td>{booking.bookingDate}</td>
                  <td>{booking.deliveryDate || '—'}</td>
                  <td><strong>{booking.amount}</strong></td>
                  <td>
                    <StatusBadge color={getPaymentStatusColor(booking.paymentStatus)}>
                      {booking.paymentStatus}
                    </StatusBadge>
                  </td>
                  <td>
                    <StatusBadge color={getStatusColor(booking.status)}>
                      {booking.status}
                    </StatusBadge>
                  </td>
                  <td>
                    <ViewButton onClick={() => handleViewDetails(booking)}>
                      View
                    </ViewButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrapper>
      </TableCard>

      {/* View Details Modal */}
      {showModal && selectedBooking && (
        <ModalOverlay onClick={() => setShowModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h3>Booking Details - {selectedBooking.id}</h3>
              <CloseButton onClick={() => setShowModal(false)}>✕</CloseButton>
            </ModalHeader>
            <ModalBody>
              <DetailGrid>
                <DetailItem>
                  <label>Company</label>
                  <span>{selectedBooking.company}</span>
                </DetailItem>
                <DetailItem>
                  <label>Driver</label>
                  <span>{selectedBooking.driver}</span>
                </DetailItem>
                <DetailItem>
                  <label>Truck Model</label>
                  <span>{selectedBooking.truck}</span>
                </DetailItem>
                <DetailItem>
                  <label>Number Plate</label>
                  <span>{selectedBooking.plate}</span>
                </DetailItem>
                <DetailItem>
                  <label>Cargo</label>
                  <span>{selectedBooking.cargo}</span>
                </DetailItem>
                <DetailItem>
                  <label>Destination</label>
                  <span>{selectedBooking.destination}</span>
                </DetailItem>
                <DetailItem>
                  <label>Booking Date</label>
                  <span>{selectedBooking.bookingDate}</span>
                </DetailItem>
                <DetailItem>
                  <label>Delivery Date</label>
                  <span>{selectedBooking.deliveryDate || 'Not Delivered'}</span>
                </DetailItem>
                <DetailItem>
                  <label>Amount</label>
                  <span><strong>{selectedBooking.amount}</strong></span>
                </DetailItem>
                <DetailItem>
                  <label>Payment Status</label>
                  <StatusBadge color={getPaymentStatusColor(selectedBooking.paymentStatus)}>
                    {selectedBooking.paymentStatus}
                  </StatusBadge>
                </DetailItem>
                <DetailItem fullWidth>
                  <label>Status</label>
                  <StatusBadge color={getStatusColor(selectedBooking.status)}>
                    {selectedBooking.status}
                  </StatusBadge>
                </DetailItem>
              </DetailGrid>
            </ModalBody>
            <ModalFooter>
              <button onClick={() => setShowModal(false)}>Close</button>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageWrapper>
  );
}

// Styled Components
const PageWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  background: #f1f5f9;
  min-height: 100vh;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  h1 {
    font-size: 28px;
    color: #0f172a;
    margin: 0;
  }

  p {
    color: #64748b;
    margin: 4px 0 0 0;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const StatCard = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);

  p {
    color: #64748b;
    font-size: 14px;
    margin: 0 0 8px 0;
  }

  h3 {
    color: ${props => props.color || '#0f172a'};
    font-size: 24px;
    margin: 0;
  }
`;

const TableCard = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  overflow: hidden;
`;

const TableHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    font-size: 16px;
    color: #0f172a;
    margin: 0;
  }

  span {
    font-size: 14px;
    color: #64748b;
    background: #f1f5f9;
    padding: 4px 12px;
    border-radius: 12px;
  }
`;

const TableWrapper = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;

  thead {
    background: #f8fafc;
  }

  th {
    text-align: left;
    padding: 12px 16px;
    color: #475569;
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
  }

  td {
    padding: 12px 16px;
    border-bottom: 1px solid #f1f5f9;
    color: #1e293b;
    white-space: nowrap;
  }

  tbody tr:hover {
    background: #f8fafc;
  }
`;

const StatusBadge = styled.span`
  background: ${props => props.color + '20'};
  color: ${props => props.color};
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
`;

const ViewButton = styled.button`
  background: #e2e8f0;
  color: #475569;
  padding: 4px 16px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;

  &:hover {
    background: #cbd5e1;
  }
`;

// Modal Styles
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
`;

const ModalHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    font-size: 18px;
    color: #0f172a;
    margin: 0;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  color: #64748b;
  cursor: pointer;
  padding: 4px 8px;

  &:hover {
    color: #0f172a;
  }
`;

const ModalBody = styled.div`
  padding: 20px;
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  grid-column: ${props => props.fullWidth ? '1 / -1' : 'auto'};

  label {
    font-size: 12px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
  }

  span {
    font-size: 16px;
    color: #0f172a;
  }
`;

const ModalFooter = styled.div`
  padding: 16px 20px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;

  button {
    background: #e2e8f0;
    color: #475569;
    padding: 8px 24px;
    border: none;
    border-radius: 4px;
    cursor: pointer;

    &:hover {
      background: #cbd5e1;
    }
  }
`;