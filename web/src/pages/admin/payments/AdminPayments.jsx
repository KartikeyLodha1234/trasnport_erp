import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';

const API_BASE = 'http://localhost:5000/api';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDriver, setFilterDriver] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [form, setForm] = useState({
    driver_id: '',
    shipment_id: '',
    amount: '',
    checkpoint: '',
    upi_id: '',
    upi_ref: '',
    note: ''
  });

  const [shipments, setShipments] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const [payRes, driverRes, shipRes] = await Promise.all([
        fetch(`${API_BASE}/payments`),
        fetch(`${API_BASE}/drivers`),
        fetch(`${API_BASE}/shipments`)
      ]);
      const payResult = await payRes.json();
      const driverResult = await driverRes.json();
      const shipResult = await shipRes.json();

      setPayments(payResult?.data || []);
      setDrivers(driverResult?.data || []);
      setShipments(shipResult?.data || []);
    } catch (err) {
      console.error('Error fetching payments:', err);
    }
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  // Derived stats
  const totalPaid = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  const driverSummary = drivers.map(d => {
    const driverPayments = payments.filter(p => parseInt(p.driver_id, 10) === d.id && p.status === 'completed');
    const total = driverPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    return { ...d, totalPaid: total, count: driverPayments.length };
  }).filter(d => d.totalPaid > 0).sort((a, b) => b.totalPaid - a.totalPaid);

  const handleDriverChange = (driverId) => {
    setForm(f => ({ ...f, driver_id: driverId, shipment_id: '' }));
  };

  const driverShipments = form.driver_id
    ? shipments.filter(s => parseInt(s.driver_id, 10) === parseInt(form.driver_id, 10))
    : [];

  const selectedDriverUPI = form.driver_id
    ? drivers.find(d => d.id === parseInt(form.driver_id, 10))?.upi_id || ''
    : '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.driver_id || !form.amount || !form.upi_id) {
      alert('Driver, Amount and UPI ID are required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, paid_by: 'admin' })
      });
      const result = await res.json();
      if (result.success) {
        const driverName = drivers.find(d => d.id === parseInt(form.driver_id))?.full_name || 'Driver';
        setSuccessMsg(`✅ ₹${form.amount} paid to ${driverName} via UPI`);
        setShowModal(false);
        setForm({ driver_id: '', shipment_id: '', amount: '', checkpoint: '', upi_id: '', upi_ref: '', note: '' });
        fetchData();
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        alert('❌ ' + result.message);
      }
    } catch (err) {
      alert('❌ Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payment record?')) return;
    try {
      const res = await fetch(`${API_BASE}/payments/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) fetchData();
    } catch (err) {
      alert('❌ Failed to delete');
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

  const filteredPayments = payments.filter(p => {
    const matchSearch =
      (p.driver_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.checkpoint || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.upi_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.id).includes(searchTerm);
    const matchDriver = filterDriver === 'all' || String(p.driver_id) === filterDriver;
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchDriver && matchStatus;
  });

  if (loading) return (
    <LoadingWrapper><div className="spinner" /><p>Loading payments…</p></LoadingWrapper>
  );

  return (
    <PageWrapper>
      <HeaderSection>
        <div>
          <h1>💳 Driver Payments</h1>
          <p>Manage UPI checkpoint payments to drivers across all active shipments</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Send Payment
        </button>
      </HeaderSection>

      {successMsg && <SuccessBanner>{successMsg}</SuccessBanner>}

      {/* Stats */}
      <StatsGrid>
        <StatCard>
          <div className="stat-icon total">💰</div>
          <div className="stat-content">
            <div className="stat-label">Total Paid Out</div>
            <div className="stat-value">₹{totalPaid.toLocaleString('en-IN')}</div>
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
          <div className="stat-icon drivers">👤</div>
          <div className="stat-content">
            <div className="stat-label">Drivers Paid</div>
            <div className="stat-value">{driverSummary.length}</div>
          </div>
        </StatCard>
        <StatCard>
          <div className="stat-icon count">📋</div>
          <div className="stat-content">
            <div className="stat-label">Transactions</div>
            <div className="stat-value">{payments.length}</div>
          </div>
        </StatCard>
      </StatsGrid>

      {/* Driver Summary */}
      {driverSummary.length > 0 && (
        <Card style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <h2>👤 Payment Summary by Driver</h2>
          </div>
          <DriverSummaryGrid>
            {driverSummary.map(d => (
              <DriverSummaryCard key={d.id}>
                <div className="avatar">{(d.full_name || 'D').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}</div>
                <div className="info">
                  <div className="name">{d.full_name}</div>
                  <div className="meta">{d.count} payment{d.count !== 1 ? 's' : ''}</div>
                </div>
                <div className="amount">₹{d.totalPaid.toLocaleString('en-IN')}</div>
              </DriverSummaryCard>
            ))}
          </DriverSummaryGrid>
        </Card>
      )}

      {/* Filters */}
      <FilterRow>
        <SearchInput
          type="text"
          placeholder="🔍 Search by driver, checkpoint, UPI ID..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <FilterSelect value={filterDriver} onChange={e => setFilterDriver(e.target.value)}>
          <option value="all">All Drivers</option>
          {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
        </FilterSelect>
        <FilterSelect value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </FilterSelect>
        <span className="count">{filteredPayments.length} of {payments.length}</span>
      </FilterRow>

      {/* Payments Table */}
      <Card>
        <div className="card-header">
          <h2>📋 All Transactions</h2>
          <span className="count">{filteredPayments.length} records</span>
        </div>
        {filteredPayments.length === 0 ? (
          <EmptyState>
            <span>💳</span>
            <p>{payments.length === 0 ? 'No payments recorded yet' : 'No payments match your filters'}</p>
            {payments.length === 0 && <small>Click "Send Payment" to record a UPI payment to a driver</small>}
          </EmptyState>
        ) : (
          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Driver</th>
                  <th>Amount</th>
                  <th>Checkpoint</th>
                  <th>Shipment</th>
                  <th>UPI ID</th>
                  <th>UPI Ref</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map(p => {
                  const s = getStatusStyle(p.status);
                  return (
                    <tr key={p.id}>
                      <td className="id">#{p.id}</td>
                      <td className="driver">{p.driver_name || '—'}</td>
                      <td className="amount">₹{parseFloat(p.amount).toLocaleString('en-IN')}</td>
                      <td>{p.checkpoint || '—'}</td>
                      <td>{p.shipment_id ? `#${p.shipment_id}` : '—'}</td>
                      <td className="upi">{p.upi_id}</td>
                      <td className="ref">{p.upi_ref || '—'}</td>
                      <td><StatusBadge bg={s.bg} color={s.color}>{p.status}</StatusBadge></td>
                      <td className="date">{formatDate(p.created_at)}</td>
                      <td>
                        <button className="btn-delete" onClick={() => handleDelete(p.id)} title="Delete">🗑️</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrapper>
        )}
      </Card>

      {/* SEND PAYMENT MODAL */}
      {showModal && (
        <ModalOverlay onClick={() => setShowModal(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <h5>📲 Send UPI Payment to Driver</h5>
              <button onClick={() => setShowModal(false)}>✕</button>
            </ModalHeader>
            <ModalBody>
              <UPIBadge>
                <span>🔵</span>
                <div>
                  <strong>UPI Checkpoint Payment</strong>
                  <p>Record a payment made to a driver at a delivery checkpoint</p>
                </div>
              </UPIBadge>

              <FormGrid>
                <FormGroup fullWidth>
                  <label>👤 Select Driver *</label>
                  <select value={form.driver_id} onChange={e => handleDriverChange(e.target.value)} required>
                    <option value="">Choose driver…</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name} — {d.email}</option>)}
                  </select>
                </FormGroup>
                <FormGroup>
                  <label>💰 Amount (₹) *</label>
                  <input type="number" placeholder="Enter amount"
                    value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
                </FormGroup>
                <FormGroup>
                  <label>📍 Checkpoint *</label>
                  <input type="text" placeholder="e.g. Nagpur Toll, Gate 3"
                    value={form.checkpoint} onChange={e => setForm(f => ({ ...f, checkpoint: e.target.value }))} />
                </FormGroup>
                <FormGroup>
                  <label>📲 Driver's UPI ID *</label>
                  <input type="text" placeholder="e.g. driver@upi or 9876543210@paytm"
                    value={form.upi_id}
                    onChange={e => setForm(f => ({ ...f, upi_id: e.target.value }))} required />
                </FormGroup>
                <FormGroup>
                  <label>🔖 UPI Ref / Transaction ID</label>
                  <input type="text" placeholder="Optional — paste UTR/ref no."
                    value={form.upi_ref} onChange={e => setForm(f => ({ ...f, upi_ref: e.target.value }))} />
                </FormGroup>
                <FormGroup fullWidth>
                  <label>📦 Linked Shipment</label>
                  <select value={form.shipment_id} onChange={e => setForm(f => ({ ...f, shipment_id: e.target.value }))}>
                    <option value="">Optional — link to a shipment</option>
                    {driverShipments.map(s => (
                      <option key={s.id} value={s.id}>#{s.id} → {s.destination} ({s.status})</option>
                    ))}
                  </select>
                </FormGroup>
                <FormGroup fullWidth>
                  <label>📝 Note</label>
                  <textarea rows={2} placeholder="Fuel, toll charges, loading fees, etc."
                    value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
                </FormGroup>
              </FormGrid>
            </ModalBody>
            <ModalFooter>
              <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-submit" onClick={handleSubmit} disabled={submitting}>
                {submitting ? '⏳ Processing…' : '💳 Record Payment'}
              </button>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageWrapper>
  );
};

export default AdminPayments;

// ===================== STYLED COMPONENTS =====================

const LoadingWrapper = styled.div`
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 16px; min-height: 100vh; background: linear-gradient(135deg, #f8fafc 0%, #f0f4f8 100%);
  color: #475569; font-size: 15px;
  .spinner { width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #2563eb;
    border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const PageWrapper = styled.div`
  max-width: 1400px; margin: 0 auto; padding: 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #f0f4f8 100%);
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const HeaderSection = styled.div`
  display: flex; justify-content: space-between; align-items: flex-start;
  flex-wrap: wrap; gap: 16px; margin-bottom: 24px;
  h1 { font-size: 28px; font-weight: 700; color: #0f172a; margin: 0; }
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
  padding: 12px 16px; margin-bottom: 16px; color: #166534; font-size: 14px; font-weight: 500;
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
    &.drivers { background: #eff6ff; }
    &.count { background: #fef3c7; }
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

const DriverSummaryGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px;
`;

const DriverSummaryCard = styled.div`
  display: flex; align-items: center; gap: 12px;
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px;
  .avatar {
    width: 36px; height: 36px; border-radius: 50%; background: #2563eb; color: white;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 12px; flex-shrink: 0;
  }
  .info { flex: 1; min-width: 0; }
  .name { font-size: 13px; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .meta { font-size: 11px; color: #94a3b8; }
  .amount { font-size: 15px; font-weight: 700; color: #2563eb; white-space: nowrap; }
`;

const FilterRow = styled.div`
  display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; align-items: center;
  .count { font-size: 13px; color: #94a3b8; margin-left: auto; }
`;

const SearchInput = styled.input`
  flex: 1; min-width: 200px; padding: 10px 14px;
  border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px;
  background: white; outline: none; transition: border-color 0.15s;
  &:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
`;

const FilterSelect = styled.select`
  padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 8px;
  font-size: 14px; background: white; outline: none; cursor: pointer;
  &:focus { border-color: #2563eb; }
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
  td { padding: 11px 12px; color: #1e293b; vertical-align: middle; }
  .id { font-family: monospace; font-weight: 600; color: #2563eb; }
  .driver { font-weight: 600; }
  .amount { font-weight: 700; color: #0f172a; }
  .upi { font-family: monospace; font-size: 12px; color: #7c3aed; }
  .ref { font-family: monospace; font-size: 12px; color: #64748b; }
  .date { color: #64748b; font-size: 12px; }
  .btn-delete {
    background: none; border: none; cursor: pointer; font-size: 15px;
    padding: 4px 8px; border-radius: 6px; transition: background 0.15s;
    &:hover { background: #fee2e2; }
  }
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
  background: white; border-radius: 14px; width: 100%; max-width: 580px;
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
