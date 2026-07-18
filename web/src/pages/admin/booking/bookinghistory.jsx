import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const API_BASE = 'http://localhost:8001/api';

export default function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/shipments/`);
      const responseData = response.data;
      const data = responseData.data || responseData || [];
      
      // Show only completed/delivered and cancelled - history records
      const historyData = Array.isArray(data) 
        ? data
            .filter(s => 
              s.status?.toLowerCase() === 'delivered' || 
              s.status?.toLowerCase() === 'cancelled'
            )
            .map((shipment) => ({
              id: shipment.id,
              company: shipment.client || 'N/A',
              driver: shipment.driver_name || 'Not Assigned',
              driver_id: shipment.driver_id,
              truck: shipment.vehicle_id || 'N/A',
              plate: shipment.license_plate || 'N/A',
              cargo: shipment.goods_desc || 'N/A',
              destination: shipment.destination || 'N/A',
              bookingDate: shipment.booking_date ? shipment.booking_date.split('T')[0] : 'N/A',
              deliveryDate: shipment.eta ? shipment.eta.split('T')[0] : null,
              status: shipment.status || 'Pending',
              amount: `₹${(shipment.freight_charge || 0).toLocaleString()}`,
              paymentStatus: shipment.payment_mode || 'Pending',
              lr_number: shipment.lr_number,
              tracking_id: shipment.tracking_id,
            }))
        : [];
      
      setBookings(historyData);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'delivered': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#64748b';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'paid': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'refunded': return '#ef4444';
      default: return '#64748b';
    }
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const stats = {
    total: bookings.length,
    delivered: bookings.filter(b => b.status?.toLowerCase() === 'delivered').length,
    cancelled: bookings.filter(b => b.status?.toLowerCase() === 'cancelled').length,
    totalRevenue: bookings
      .filter(b => b.status?.toLowerCase() === 'delivered')
      .reduce((sum, b) => sum + parseInt(b.amount.replace(/[₹,]/g, '') || 0), 0)
  };

  return (
    <PageWrapper>
      <Header>
        <div>
          <h1>Booking History</h1>
          <p>View completed and cancelled bookings</p>
        </div>
      </Header>

      <StatsGrid>
        <StatCard>
          <p>Total Records</p>
          <h3>{stats.total}</h3>
        </StatCard>
        <StatCard color="#10b981">
          <p>Delivered</p>
          <h3>{stats.delivered}</h3>
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

      <TableCard>
        <TableHeader>
          <h3>Booking Records</h3>
          <span>{bookings.length} Records</span>
        </TableHeader>
        <TableWrapper>
          <Table>
            <thead>
              <tr>
                <th>LR Number</th>
                <th>Company</th>
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
              {loading ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    Loading history...
                  </td>
                </tr>
              ) : bookings.length > 0 ? (
                bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td><strong>{booking.lr_number || `#${booking.id}`}</strong></td>
                    <td>{booking.company}</td>
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
                      <ViewButton onClick={() => handleViewDetails(booking)}>View</ViewButton>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No booking history found. Completed bookings will appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </TableWrapper>
      </TableCard>

      {showModal && selectedBooking && (
        <ModalOverlay onClick={() => setShowModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h3>Booking Details - #{selectedBooking.id}</h3>
              <CloseButton onClick={() => setShowModal(false)}>✕</CloseButton>
            </ModalHeader>
            <ModalBody>
              <DetailGrid>
                <DetailItem><label>LR Number</label><span>{selectedBooking.lr_number || 'N/A'}</span></DetailItem>
                <DetailItem><label>Tracking ID</label><span>{selectedBooking.tracking_id || 'N/A'}</span></DetailItem>
                <DetailItem><label>Company</label><span>{selectedBooking.company}</span></DetailItem>
                <DetailItem><label>Driver</label><span>{selectedBooking.driver}</span></DetailItem>
                <DetailItem><label>Truck</label><span>{selectedBooking.truck}</span></DetailItem>
                <DetailItem><label>Plate</label><span>{selectedBooking.plate}</span></DetailItem>
                <DetailItem><label>Cargo</label><span>{selectedBooking.cargo}</span></DetailItem>
                <DetailItem><label>Destination</label><span>{selectedBooking.destination}</span></DetailItem>
                <DetailItem><label>Booking Date</label><span>{selectedBooking.bookingDate}</span></DetailItem>
                <DetailItem><label>Delivery Date</label><span>{selectedBooking.deliveryDate || 'Not Delivered'}</span></DetailItem>
                <DetailItem><label>Amount</label><span><strong>{selectedBooking.amount}</strong></span></DetailItem>
                <DetailItem fullWidth>
                  <label>Status</label>
                  <StatusBadge color={getStatusColor(selectedBooking.status)}>{selectedBooking.status}</StatusBadge>
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

// All styled components remain the same as your original file
const PageWrapper = styled.div`
  max-width: 1400px; margin: 0 auto; padding: 24px; background: #f1f5f9; min-height: 100vh;
`;
const Header = styled.div`
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;
  h1 { font-size: 28px; color: #0f172a; margin: 0; }
  p { color: #64748b; margin: 4px 0 0 0; }
`;
const StatsGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px;
`;
const StatCard = styled.div`
  background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  p { color: #64748b; font-size: 14px; margin: 0 0 8px 0; }
  h3 { color: ${props => props.color || '#0f172a'}; font-size: 24px; margin: 0; }
`;
const TableCard = styled.div`
  background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden;
`;
const TableHeader = styled.div`
  padding: 16px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;
  h3 { font-size: 16px; color: #0f172a; margin: 0; }
  span { font-size: 14px; color: #64748b; background: #f1f5f9; padding: 4px 12px; border-radius: 12px; }
`;
const TableWrapper = styled.div`overflow-x: auto;`;
const Table = styled.table`
  width: 100%; border-collapse: collapse; font-size: 14px;
  thead { background: #f8fafc; }
  th { text-align: left; padding: 12px 16px; color: #475569; font-weight: 600; font-size: 12px; text-transform: uppercase; white-space: nowrap; }
  td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #1e293b; white-space: nowrap; }
  tbody tr:hover { background: #f8fafc; }
`;
const StatusBadge = styled.span`
  background: ${props => props.color + '20'}; color: ${props => props.color};
  padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; display: inline-block;
`;
const ViewButton = styled.button`
  background: #e2e8f0; color: #475569; padding: 4px 16px; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;
  &:hover { background: #cbd5e1; }
`;
const ModalOverlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px;
`;
const ModalContent = styled.div`
  background: white; border-radius: 8px; width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 25px rgba(0,0,0,0.2);
`;
const ModalHeader = styled.div`
  padding: 16px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;
  h3 { font-size: 18px; color: #0f172a; margin: 0; }
`;
const CloseButton = styled.button`
  background: none; border: none; font-size: 20px; color: #64748b; cursor: pointer; padding: 4px 8px;
  &:hover { color: #0f172a; }
`;
const ModalBody = styled.div`padding: 20px;`;
const DetailGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;
const DetailItem = styled.div`
  display: flex; flex-direction: column; gap: 4px;
  grid-column: ${props => props.fullWidth ? '1 / -1' : 'auto'};
  label { font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600; }
  span { font-size: 16px; color: #0f172a; }
`;
const ModalFooter = styled.div`
  padding: 16px 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end;
  button { background: #e2e8f0; color: #475569; padding: 8px 24px; border: none; border-radius: 4px; cursor: pointer;
    &:hover { background: #cbd5e1; }
  }
`;