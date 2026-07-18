import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';

const API_BASE = 'http://localhost:8001/api';

const DriverPayments = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [userName, setUserName] = useState('Driver');
  const [driverId, setDriverId] = useState(localStorage.getItem('userId'));
  const [payments, setPayments] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    shipment_id: '',
    amount: '',
    checkpoint: '',
    upi_id: '',
    note: ''
  });

  const initials = (userName || 'D')
    .split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  const totalReceived = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const fetchData = useCallback(async (id) => {
    try {
      const [payRes, shipRes] = await Promise.all([
        fetch(`${API_BASE}/payments/driver/${id}`),
        fetch(`${API_BASE}/shipments`)
      ]);
      const payResult = await payRes.json();
      const shipResult = await shipRes.json();

      setPayments(payResult?.data || []);
      const allShipments = shipResult?.data || [];
      setShipments(allShipments.filter(s => parseInt(s.driver_id, 10) === parseInt(id, 10))
    );const userEmail = localStorage.getItem('userEmail');
const me = drivers.find(d => d.email === userEmail);
if (me) {
  setDriverId(me.id);
  localStorage.setItem('userId', me.id); // keep it in sync
}
    } catch (err) {
      console.error('Error fetching payments:', err);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    const id = localStorage.getItem('userId');
    const name = localStorage.getItem('userName');

    if (!token) { navigate('/login'); return; }
    if (role !== 'driver') { navigate('/dashboard'); return; }

    setDriverId(id);
    setUserName(name || 'Driver');

    fetchData(id).finally(() => setLoading(false));
  }, [navigate, fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.upi_id || !form.amount || !form.checkpoint) {
      alert('Please fill in Amount, Checkpoint and UPI ID');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
  driver_id: driverId || localStorage.getItem('userId'),
          shipment_id: form.shipment_id || null,
          amount: form.amount,
          checkpoint: form.checkpoint,
          upi_id: form.upi_id,
          note: form.note,
          paid_by: userName
        })
      });
      const result = await res.json();
      if (result.success) {
        setSuccessMsg(`✅ Payment of ₹${form.amount} requested at ${form.checkpoint}`);
        setShowModal(false);
        setForm({ shipment_id: '', amount: '', checkpoint: '', upi_id: '', note: '' });
        fetchData(driverId);
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        alert('❌ ' + result.message);
      }
    } catch (err) {
      alert('❌ Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusStyle = (status) => ({
    completed: { bg: '#dcfce7', color: '#166534' },
    pending: { bg: '#fef3c7', color: '#92400e' },
    failed: { bg: '#fee2e2', color: '#991b1b' }
  }[status] || { bg: '#f1f5f9', color: '#475569' });

  if (loading) return (
    <LoadingWrapper><div className="spinner" /><p>Loading payments…</p></LoadingWrapper>
  );

  return (
    <DashboardWrapper>
      <Sidebar>
        <div className="logo">🚛 CargoMax</div>
        <div className="profile">
          <div className="avatar">{initials}</div>
          <div>
            <div className="name">{userName}</div>
            <div className="role">Driver</div>
          </div>
        </div>
        <nav>
          <Link to="/driver-dashboard" className={isActive('/driver-dashboard')}><span>📊</span> Overview</Link>
          <Link to="/driver-shipments" className={isActive('/driver-shipments')}><span>📦</span> My Shipments</Link>
          <Link to="/driver-payments" className={isActive('/driver-payments')}><span>💳</span> Payments</Link>
        </nav>
        <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="logout-btn">
          🚪 Logout
        </button>
      </Sidebar>

      <MainContent>
        <HeaderSection>
          <div>
            <h1>💳 Payments</h1>
            <p>Request checkpoint payments via UPI and view your payment history.</p>
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + Request Payment
          </button>
        </HeaderSection>

        {successMsg && <SuccessBanner>{successMsg}</SuccessBanner>}

        <StatsGrid>
          <StatCard>
            <div className="stat-icon total">💰</div>
            <div className="stat-content">
              <div className="stat-label">Total Received</div>
              <div className="stat-value">₹{totalReceived.toLocaleString('en-IN')}</div>
            </div>
          </StatCard>
          <StatCard>
            <div className="stat-icon completed">✅</div>
            <div className="stat-content">
              <div className="stat-label">Completed</div>
              <div className="stat-value">{payments.filter(p => p.status === 'completed').length}</div>
            </div>
          </StatCard>
          <StatCard>
            <div className="stat-icon pending">⏳</div>
            <div className="stat-content">
              <div className="stat-label">Pending</div>
              <div className="stat-value">{payments.filter(p => p.status === 'pending').length}</div>
            </div>
          </StatCard>
          <StatCard>
            <div className="stat-icon count">📋</div>
            <div className="stat-content">
              <div className="stat-label">Total Transactions</div>
              <div className="stat-value">{payments.length}</div>
            </div>
          </StatCard>
        </StatsGrid>

        <Card>
          <div className="card-header">
            <h2>📋 Payment History</h2>
            <span className="count">{payments.length} transactions</span>
          </div>

          {payments.length === 0 ? (
            <EmptyState>
              <span>💳</span>
              <p>No payments yet</p>
              <small>Click "Request Payment" to record a checkpoint UPI payment</small>
            </EmptyState>
          ) : (
            <TableWrapper>
              <Table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Amount</th>
                    <th>Checkpoint</th>
                    <th>Shipment</th>
                    <th>UPI ID</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => {
                    const s = getStatusStyle(p.status);
                    return (
                      <tr key={p.id}>
                        <td className="id">#{p.id}</td>
                        <td className="amount">₹{parseFloat(p.amount).toLocaleString('en-IN')}</td>
                        <td>{p.checkpoint || '—'}</td>
                        <td>{p.tracking_id ? `#${p.shipment_id} ${p.tracking_id}` : p.shipment_id ? `#${p.shipment_id}` : '—'}</td>
                        <td className="upi">{p.upi_id}</td>
                        <td><StatusBadge bg={s.bg} color={s.color}>{p.status}</StatusBadge></td>
                        <td className="date">{formatDate(p.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </TableWrapper>
          )}
        </Card>

        {/* UPI PAYMENT MODAL */}
        {showModal && (
          <ModalOverlay onClick={() => setShowModal(false)}>
            <ModalContent onClick={e => e.stopPropagation()}>
              <ModalHeader>
                <h5>📲 Request Checkpoint Payment</h5>
                <button onClick={() => setShowModal(false)}>✕</button>
              </ModalHeader>
              <ModalBody>
                <UPIBadge>
                  <span>🔵</span>
                  <div>
                    <strong>UPI Payment</strong>
                    <p>Admin will transfer funds directly to your UPI ID</p>
                  </div>
                </UPIBadge>

                <FormGrid>
                  <FormGroup>
                    <label>💰 Amount (₹) *</label>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      value={form.amount}
                      onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                      required
                    />
                  </FormGroup>
                  <FormGroup>
                    <label>📍 Checkpoint *</label>
                    <input
                      type="text"
                      placeholder="e.g. Nagpur Toll, Mumbai Gate 3"
                      value={form.checkpoint}
                      onChange={e => setForm(f => ({ ...f, checkpoint: e.target.value }))}
                      required
                    />
                  </FormGroup>
                  <FormGroup>
                    <label>📲 Your UPI ID *</label>
                    <input
                      type="text"
                      placeholder="e.g. driver@upi or 9876543210@paytm"
                      value={form.upi_id}
                      onChange={e => setForm(f => ({ ...f, upi_id: e.target.value }))}
                      required
                    />
                  </FormGroup>
                  <FormGroup>
                    <label>📦 Linked Shipment</label>
                    <select
                      value={form.shipment_id}
                      onChange={e => setForm(f => ({ ...f, shipment_id: e.target.value }))}
                    >
                      <option value="">Select shipment (optional)</option>
                      {shipments.map(s => (
                        <option key={s.id} value={s.id}>
                          #{s.id} → {s.destination} ({s.status})
                        </option>
                      ))}
                    </select>
                  </FormGroup>
                  <FormGroup fullWidth>
                    <label>📝 Note</label>
                    <textarea
                      placeholder="Reason for payment (fuel, toll, loading charges, etc.)"
                      value={form.note}
                      rows={2}
                      onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                    />
                  </FormGroup>
                </FormGrid>
              </ModalBody>
              <ModalFooter>
                <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn-submit" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? '⏳ Submitting…' : '📲 Submit Request'}
                </button>
              </ModalFooter>
            </ModalContent>
          </ModalOverlay>
        )}
      </MainContent>
    </DashboardWrapper>
  );
};

export default DriverPayments;

// ===================== STYLED COMPONENTS =====================

const LoadingWrapper = styled.div`
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 16px; min-height: 100vh; background: linear-gradient(135deg, #f8fafc 0%, #f0f4f8 100%);
  color: #475569; font-size: 15px;
  .spinner { width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #2563eb;
    border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const DashboardWrapper = styled.div`
  display: flex; min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f0f4f8 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const Sidebar = styled.div`
  width: 260px; background-color: #070b19;
  border-right: 1px solid rgba(255,255,255,0.05);
  color: white; padding: 24px 16px;
  display: flex; flex-direction: column;
  position: fixed; height: 100vh; left: 0; top: 0; z-index: 100;
  .logo { font-size: 22px; font-weight: 700; padding: 0 8px; margin-bottom: 24px; }
  .profile {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 12px; background: rgba(255,255,255,0.04);
    border-radius: 12px; margin-bottom: 24px;
    .avatar { width: 38px; height: 38px; border-radius: 50%; background: #2563eb;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 13px; flex-shrink: 0; }
    .name { font-size: 14px; font-weight: 600; color: #fff; }
    .role { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
  }
  nav {
    display: flex; flex-direction: column; gap: 4px; flex: 1;
    a {
      display: flex; align-items: center; gap: 10px; padding: 10px 12px;
      border-radius: 8px; color: #94a3b8; text-decoration: none;
      font-size: 14px; font-weight: 500; transition: all 0.15s;
      &:hover { background: rgba(255,255,255,0.04); color: #fff; }
      &.active { background: rgba(37,99,235,0.15); color: #60a5fa; }
    }
  }
  .logout-btn {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    color: #f87171; padding: 10px 12px; border-radius: 8px;
    cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.15s;
    &:hover { background: rgba(248,113,113,0.1); }
  }
`;

const MainContent = styled.div`
  flex: 1; margin-left: 260px; padding: 28px 32px; max-width: 1400px;
`;

const HeaderSection = styled.div`
  display: flex; justify-content: space-between; align-items: flex-start;
  flex-wrap: wrap; gap: 16px; margin-bottom: 24px;
  h1 { font-size: 26px; font-weight: 700; color: #0f172a; margin: 0; }
  p { color: #64748b; margin: 4px 0 0 0; font-size: 14px; }
  .btn-primary {
    padding: 10px 20px; background: #2563eb; color: white;
    border: none; border-radius: 8px; font-size: 14px;
    font-weight: 600; cursor: pointer; transition: all 0.15s;
    &:hover { background: #1d4ed8; }
  }
`;

const SuccessBanner = styled.div`
  background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px;
  padding: 12px 16px; margin-bottom: 16px; color: #166534;
  font-size: 14px; font-weight: 500;
`;

const StatsGrid = styled.div`
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 16px; margin-bottom: 20px;
  @media (max-width: 1024px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 576px) { grid-template-columns: 1fr; }
`;

const StatCard = styled.div`
  background: white; border: 1px solid #e2e8f0; border-radius: 12px;
  padding: 18px 20px; display: flex; align-items: center; gap: 14px;
  transition: all 0.2s ease;
  &:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.05); transform: translateY(-2px); }
  .stat-icon {
    width: 48px; height: 48px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0;
    &.total { background: #faf5ff; }
    &.completed { background: #f0fdf4; }
    &.pending { background: #fef3c7; }
    &.count { background: #eff6ff; }
  }
  .stat-label { font-size: 13px; color: #94a3b8; font-weight: 500; }
  .stat-value { font-size: 22px; font-weight: 700; color: #0f172a; line-height: 1.2; }
`;

const Card = styled.div`
  background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;
  .card-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
    h2 { font-size: 16px; font-weight: 600; color: #1e293b; margin: 0; }
    .count { font-size: 13px; color: #94a3b8; }
  }
`;

const EmptyState = styled.div`
  text-align: center; padding: 40px 12px; color: #94a3b8;
  span { font-size: 36px; display: block; margin-bottom: 8px; }
  p { font-size: 14px; margin: 0; color: #64748b; }
  small { font-size: 12px; }
`;

const TableWrapper = styled.div` overflow-x: auto; `;

const Table = styled.table`
  width: 100%; border-collapse: collapse; font-size: 14px;
  thead {
    background: #f8fafc; border-bottom: 2px solid #e2e8f0;
    th { padding: 10px 12px; text-align: left; font-weight: 600; color: #475569;
      font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
  }
  tbody tr {
    border-bottom: 1px solid #f1f5f9; transition: background 0.15s;
    &:hover { background: #f8fafc; } &:last-child { border-bottom: none; }
  }
  td { padding: 12px; color: #1e293b; vertical-align: middle; }
  .id { font-family: monospace; font-weight: 600; color: #2563eb; }
  .amount { font-weight: 700; color: #0f172a; }
  .upi { font-family: monospace; font-size: 13px; color: #7c3aed; }
  .date { color: #64748b; font-size: 13px; }
`;

const StatusBadge = styled.span`
  padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600;
  display: inline-block;
  background-color: ${p => p.bg || '#f1f5f9'};
  color: ${p => p.color || '#475569'};
`;

const ModalOverlay = styled.div`
  position: fixed; inset: 0; background: rgba(15,23,42,0.5);
  backdrop-filter: blur(4px); display: flex; align-items: center;
  justify-content: center; z-index: 2000; padding: 16px;
`;

const ModalContent = styled.div`
  background: white; border-radius: 14px; width: 100%; max-width: 560px;
  max-height: 90vh; box-shadow: 0 20px 40px rgba(0,0,0,0.15);
  display: flex; flex-direction: column; overflow: hidden;
  animation: fadeUp 0.2s ease;
  @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
`;

const ModalHeader = styled.div`
  padding: 16px 20px; border-bottom: 1px solid #e2e8f0;
  display: flex; justify-content: space-between; align-items: center;
  h5 { font-size: 17px; font-weight: 700; color: #1e293b; margin: 0; }
  button { background: none; border: none; color: #94a3b8; font-size: 20px; cursor: pointer;
    &:hover { color: #475569; } }
`;

const ModalBody = styled.div`
  padding: 20px; overflow-y: auto; flex: 1;
`;

const UPIBadge = styled.div`
  display: flex; align-items: flex-start; gap: 12px;
  background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px;
  padding: 12px 14px; margin-bottom: 20px;
  span { font-size: 20px; }
  strong { display: block; color: #1e40af; font-size: 14px; }
  p { margin: 2px 0 0 0; font-size: 12px; color: #3b82f6; }
`;

const FormGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`;

const FormGroup = styled.div`
  display: flex; flex-direction: column;
  ${p => p.fullWidth && 'grid-column: 1 / -1;'}
  label { font-size: 13px; font-weight: 500; color: #475569; margin-bottom: 6px; }
  input, select, textarea {
    padding: 10px 12px; font-size: 14px; border-radius: 8px;
    border: 1px solid #e2e8f0; background: #fff; color: #1e293b;
    outline: none; width: 100%; box-sizing: border-box; font-family: inherit;
    transition: border-color 0.15s;
    &:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
  }
  textarea { resize: vertical; min-height: 60px; }
`;

const ModalFooter = styled.div`
  padding: 14px 20px; border-top: 1px solid #e2e8f0;
  display: flex; justify-content: flex-end; gap: 12px; background: #f8fafc;
  button { padding: 10px 20px; font-size: 14px; font-weight: 600;
    border-radius: 8px; cursor: pointer; border: none; transition: all 0.2s;
    &:disabled { opacity: 0.6; cursor: not-allowed; } }
  .btn-cancel { background: #f1f5f9; color: #475569; &:hover { background: #e2e8f0; } }
  .btn-submit { background: #2563eb; color: white; &:hover:not(:disabled) { background: #1d4ed8; } }
`;
