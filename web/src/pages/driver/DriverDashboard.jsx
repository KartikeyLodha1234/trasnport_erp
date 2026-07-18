// pages/driver/DriverDashboard.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';

const API_BASE = 'http://localhost:8001/api';

const DriverDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [userName, setUserName] = useState('Driver');
  const [driverId, setDriverId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [driverData, setDriverData] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [vehicle, setVehicle] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [stats, setStats] = useState({
    totalShipments: 0,
    inProgress: 0,
    completed: 0,
    earnings: 0
  });

  const isActive = (path) => location.pathname === path ? 'active' : '';

  // ============= FETCH DATA =============
  const fetchAllData = useCallback(async (id) => {
    try {
      const driverIdNum = parseInt(id, 10);
      
      const [driverRes, shipmentRes, vehicleRes, logsRes] = await Promise.all([
        fetch(`${API_BASE}/drivers`),
        fetch(`${API_BASE}/shipments`),
        fetch(`${API_BASE}/vehicles`),
        fetch(`${API_BASE}/logs`)
      ]);

      const driverData = await driverRes.json();
      const shipmentData = await shipmentRes.json();
      const vehicleData = await vehicleRes.json();
      const logsData = await logsRes.json();

      // Process drivers
      const drivers = driverData?.data || driverData || [];
      const me = Array.isArray(drivers) 
        ? drivers.find(d => parseInt(d.id) === driverIdNum) 
        : null;
      
      if (me) {
        setUserName(me.full_name || 'Driver');
        setDriverData(me);
      }

      // Process shipments
      const allShipments = shipmentData?.data || shipmentData || [];
      const myShipments = allShipments
        .filter(s => parseInt(s.driver_id, 10) === driverIdNum)
        .sort((a, b) => b.id - a.id);
      
      setShipments(myShipments);

      // Process vehicle
      const vehicles = vehicleData?.data || vehicleData || [];
      const activeWithVehicle = myShipments.find(s => s.vehicle_id);
      const myVehicle = activeWithVehicle
        ? vehicles.find(v => v.id === activeWithVehicle.vehicle_id)
        : null;
      setVehicle(myVehicle || null);

      // Calculate stats
      const inProgress = myShipments.filter(s => 
        ['In Transit', 'in_transit', 'Loading', 'loading'].includes(s.status)
      ).length;
      
      const completed = myShipments.filter(s => 
        ['Delivered', 'delivered'].includes(s.status)
      ).length;

      setStats({
        totalShipments: myShipments.length,
        inProgress: inProgress,
        completed: completed,
        earnings: completed * 5000
      });

      // Create notifications
      const shipmentNotifications = myShipments.slice(0, 5).map(s => ({
        id: `ship-${s.id}`,
        type: s.status === 'Delivered' || s.status === 'delivered' ? 'success' : 
              s.status === 'Delayed' || s.status === 'Alert' ? 'alert' : 'info',
        title: `Shipment #${s.id} — ${s.status}`,
        description: s.destination || 'No destination set',
        time: s.updated_at 
          ? new Date(s.updated_at).toLocaleString('en-IN', { 
              day: '2-digit', 
              month: 'short', 
              hour: '2-digit', 
              minute: '2-digit' 
            }) 
          : 'Just now'
      }));

      const logs = Array.isArray(logsData) ? logsData : (logsData?.data || []);
      const systemNotifications = logs.slice(0, 4).map((log, idx) => ({
        id: log.id || `log-${idx}`,
        type: log.type === 'success' || log.type === 'delivered' ? 'success' : 'info',
        title: log.title || 'System update',
        description: log.description || '',
        time: log.time || ''
      }));

      setNotifications([...shipmentNotifications, ...systemNotifications].slice(0, 8));
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Error fetching driver dashboard data:', error);
    }
  }, []);

  // ============= INITIAL LOAD =============
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    const id = localStorage.getItem('userId');

    if (!token) {
      navigate('/login');
      return;
    }
    
    if (role !== 'driver') {
      navigate('/dashboard');
      return;
    }

    setDriverId(id);
    setUserName(localStorage.getItem('userName') || 'Driver');

    const loadData = async () => {
      await fetchAllData(id);
      setLoading(false);
    };
    
    loadData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (id) fetchAllData(id);
    }, 30000);

    return () => clearInterval(interval);
  }, [navigate, fetchAllData]);

  // ============= HANDLERS =============
  const handleRefresh = async () => {
    if (!driverId) return;
    setRefreshing(true);
    await fetchAllData(driverId);
    setRefreshing(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // ============= HELPERS =============
  const getStatusStyle = (status) => {
    const map = {
      'Delivered': { bg: '#dcfce7', color: '#166534' },
      'delivered': { bg: '#dcfce7', color: '#166534' },
      'In Transit': { bg: '#dbeafe', color: '#1e40af' },
      'in_transit': { bg: '#dbeafe', color: '#1e40af' },
      'Loading': { bg: '#f1f5f9', color: '#475569' },
      'loading': { bg: '#f1f5f9', color: '#475569' },
      'Delayed': { bg: '#fee2e2', color: '#991b1b' },
      'delayed': { bg: '#fee2e2', color: '#991b1b' },
      'Alert': { bg: '#fee2e2', color: '#991b1b' },
      'alert': { bg: '#fee2e2', color: '#991b1b' },
      'Pending': { bg: '#fef3c7', color: '#92400e' },
      'pending': { bg: '#fef3c7', color: '#92400e' }
    };
    return map[status] || { bg: '#f1f5f9', color: '#475569' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit', 
        month: 'short', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const initials = (userName || 'D')
    .split(' ')
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // ============= RENDER =============
  if (loading) {
    return (
      <LoadingWrapper>
        <div className="spinner" />
        <p>Loading your dashboard…</p>
      </LoadingWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <SidebarComponent>
        <div className="logo">🚛 CargoMax</div>
        <div className="profile">
          <div className="avatar">{initials}</div>
          <div>
            <div className="name">{userName}</div>
            <div className="role">Driver</div>
          </div>
        </div>
        <nav>
          <Link to="/driver-dashboard" className={isActive('/driver-dashboard')}>
            <span>📊</span> Overview
          </Link>
          <Link to="/driver-shipments" className={isActive('/driver-shipments')}>
            <span>📦</span> My Shipments
          </Link>
          <Link to="/driver-payments" className={isActive('/driver-payments')}>
            <span>💳</span> Payments
          </Link>
        </nav>
        <button onClick={handleLogout} className="logout-btn">🚪 Logout</button>
      </SidebarComponent>

      <MainContent>
        <HeaderSection>
          <div>
            <h1>Welcome back, {userName.split(' ')[0]} 👋</h1>
            <p>Here's what's happening with your fleet assignments today.</p>
          </div>
          <ActionButtons>
            <button className="btn-refresh" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? '⏳ Refreshing…' : '🔄 Refresh'}
            </button>
            {lastUpdated && (
              <span className="last-updated">
                Updated {lastUpdated.toLocaleTimeString('en-IN', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            )}
          </ActionButtons>
        </HeaderSection>

        <StatsGrid>
          <StatCard>
            <div className="stat-icon total">📦</div>
            <div className="stat-content">
              <div className="stat-label">My Shipments</div>
              <div className="stat-value">{stats.totalShipments}</div>
            </div>
          </StatCard>

          <StatCard>
            <div className="stat-icon transit">🚚</div>
            <div className="stat-content">
              <div className="stat-label">In Progress</div>
              <div className="stat-value">{stats.inProgress}</div>
            </div>
          </StatCard>

          <StatCard>
            <div className="stat-icon delivered">✅</div>
            <div className="stat-content">
              <div className="stat-label">Completed</div>
              <div className="stat-value">{stats.completed}</div>
            </div>
          </StatCard>

          <StatCard>
            <div className="stat-icon earnings">💰</div>
            <div className="stat-content">
              <div className="stat-label">Earnings</div>
              <div className="stat-value">₹{stats.earnings.toLocaleString('en-IN')}</div>
            </div>
          </StatCard>
        </StatsGrid>

        {stats.inProgress === 0 && stats.totalShipments > 0 && (
          <AlertBanner type="success">
            <span>✅</span>
            <div>
              <strong>All caught up!</strong>
              <p>You have no active shipments. Check back later for new assignments.</p>
            </div>
          </AlertBanner>
        )}

        <TwoColumnLayout>
          <LeftColumn>
            <Card id="shipments">
              <div className="card-header">
                <h2>📦 My Shipments</h2>
                <span className="count">{shipments.length} total</span>
              </div>

              {shipments.length === 0 ? (
                <EmptyState>
                  <span>📭</span>
                  <p>No shipments assigned yet</p>
                  <small>New assignments will appear here automatically</small>
                </EmptyState>
              ) : (
                <TableWrapper>
                  <Table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Destination</th>
                        <th>Client</th>
                        <th>Status</th>
                        <th>ETA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shipments.map((s) => {
                        const status = getStatusStyle(s.status);
                        return (
                          <tr key={s.id}>
                            <td className="id">#{s.id}</td>
                            <td>{s.destination || 'N/A'}</td>
                            <td>{s.client || 'N/A'}</td>
                            <td>
                              <StatusBadge bg={status.bg} color={status.color}>
                                {s.status}
                              </StatusBadge>
                            </td>
                            <td className="eta">{formatDate(s.eta)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </TableWrapper>
              )}
            </Card>
          </LeftColumn>

          <RightColumn>
            <Card id="vehicle">
              <div className="card-header">
                <h2>🚛 My Vehicle</h2>
              </div>
              {vehicle ? (
                <VehicleInfo>
                  <div className="row">
                    <label>Vehicle ID</label>
                    <strong>{vehicle.vehicle_id || vehicle.id}</strong>
                  </div>
                  <div className="row">
                    <label>Type</label>
                    <span>{vehicle.type || 'N/A'}</span>
                  </div>
                  <div className="row">
                    <label>License Plate</label>
                    <span>{vehicle.license_plate || 'N/A'}</span>
                  </div>
                  <div className="row">
                    <label>Company</label>
                    <span>{vehicle.company_name || 'N/A'}</span>
                  </div>
                </VehicleInfo>
              ) : (
                <EmptyState small>
                  <span>🚛</span>
                  <p>No vehicle currently assigned</p>
                </EmptyState>
              )}
            </Card>

            <Card id="updates">
              <div className="card-header">
                <h2>🔔 Recent Updates</h2>
              </div>
              {notifications.length === 0 ? (
                <EmptyState small>
                  <span>📭</span>
                  <p>Nothing new right now</p>
                </EmptyState>
              ) : (
                <NotificationList>
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <span className={`badge ${n.type}`}>
                        {n.type === 'success' ? '✓' : n.type === 'alert' ? '!' : 'i'}
                      </span>
                      <div>
                        <p className="title">{n.title}</p>
                        {n.description && <p className="desc">{n.description}</p>}
                        {n.time && <p className="time">{n.time}</p>}
                      </div>
                    </li>
                  ))}
                </NotificationList>
              )}
            </Card>
          </RightColumn>
        </TwoColumnLayout>

        <Footer>
          <p>© {new Date().getFullYear()} CargoMax Logistics. All rights reserved.</p>
        </Footer>
      </MainContent>
    </DashboardWrapper>
  );
};

export default DriverDashboard;

// =====================================
// STYLED COMPONENTS
// =====================================

const LoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f0f4f8 100%);
  color: #475569;
  font-size: 15px;
  font-weight: 500;

  .spinner {
    width: 36px;
    height: 36px;
    border: 3px solid #e2e8f0;
    border-top-color: #2563eb;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const DashboardWrapper = styled.div`
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f0f4f8 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const SidebarComponent = styled.div`
  width: 260px;
  background-color: #070b19;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  color: white;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  left: 0;
  top: 0;
  z-index: 100;

  .logo {
    font-size: 22px;
    font-weight: 700;
    padding: 0 8px;
    margin-bottom: 24px;
  }

  .profile {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 12px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 12px;
    margin-bottom: 24px;

    .avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: #2563eb;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 13px;
      flex-shrink: 0;
    }

    .name {
      font-size: 14px;
      font-weight: 600;
      color: #ffffff;
    }

    .role {
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  }

  nav {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;

    a {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 8px;
      color: #94a3b8;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.15s;

      &:hover {
        background: rgba(255, 255, 255, 0.04);
        color: #ffffff;
      }

      &.active {
        background: rgba(37, 99, 235, 0.15);
        color: #60a5fa;
      }
    }
  }

  .logout-btn {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #f87171;
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.15s;

    &:hover {
      background: rgba(248, 113, 113, 0.1);
    }
  }
`;

const MainContent = styled.div`
  flex: 1;
  margin-left: 260px;
  padding: 28px 32px;
  max-width: 1400px;
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;

  h1 {
    font-size: 26px;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
  }
  p {
    color: #64748b;
    margin: 4px 0 0 0;
    font-size: 14px;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  .btn-refresh {
    padding: 10px 18px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: white;
    color: #475569;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;

    &:hover:not(:disabled) {
      background: #f8fafc;
      border-color: #cbd5e1;
    }
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .last-updated {
    font-size: 12px;
    color: #94a3b8;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;

  @media (max-width: 1024px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 576px) { grid-template-columns: 1fr; }
`;

const StatCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    transform: translateY(-2px);
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    flex-shrink: 0;

    &.total { background: #eff6ff; }
    &.transit { background: #dbeafe; }
    &.delivered { background: #f0fdf4; }
    &.earnings { background: #faf5ff; }
  }

  .stat-label {
    font-size: 13px;
    color: #94a3b8;
    font-weight: 500;
  }

  .stat-value {
    font-size: 22px;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.2;
  }
`;

const AlertBanner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: ${props => props.type === 'success' ? '#f0fdf4' : '#fef2f2'};
  border: 1px solid ${props => props.type === 'success' ? '#bbf7d0' : '#fecaca'};
  border-radius: 12px;
  padding: 14px 18px;
  margin-bottom: 20px;

  span { font-size: 20px; }

  strong {
    display: block;
    color: ${props => props.type === 'success' ? '#166534' : '#991b1b'};
    font-size: 14px;
  }
  p {
    margin: 2px 0 0 0;
    font-size: 13px;
    color: ${props => props.type === 'success' ? '#15803d' : '#b91c1c'};
  }
`;

const TwoColumnLayout = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  align-items: start;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Card = styled.div`
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
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .count {
      font-size: 13px;
      color: #94a3b8;
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${props => (props.small ? '24px 12px' : '40px 12px')};
  color: #94a3b8;

  span { 
    font-size: ${props => (props.small ? '28px' : '36px')}; 
    display: block; 
    margin-bottom: 8px; 
  }
  p { 
    font-size: 14px; 
    margin: 0; 
    color: #64748b; 
  }
  small { 
    font-size: 12px; 
    color: #94a3b8; 
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
    border-bottom: 2px solid #e2e8f0;

    th {
      padding: 10px 12px;
      text-align: left;
      font-weight: 600;
      color: #475569;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
    }
  }

  tbody tr {
    border-bottom: 1px solid #f1f5f9;
    transition: background 0.15s;

    &:hover { background: #f8fafc; }
    &:last-child { border-bottom: none; }
  }

  td {
    padding: 12px;
    color: #1e293b;
    vertical-align: middle;
  }

  .id {
    font-family: monospace;
    font-weight: 600;
    color: #2563eb;
  }

  .eta {
    color: #64748b;
    font-size: 13px;
  }
`;

const StatusBadge = styled.span`
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
  background-color: ${props => props.bg || '#f1f5f9'};
  color: ${props => props.color || '#475569'};
`;

const VehicleInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;

  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 8px;
    border-bottom: 1px solid #f1f5f9;

    &:last-child { 
      border-bottom: none; 
      padding-bottom: 0; 
    }

    label {
      font-size: 12px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    strong, span {
      font-size: 14px;
      color: #0f172a;
    }
  }
`;

const NotificationList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;

  li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  .badge {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    margin-top: 1px;

    &.success { background: #dcfce7; color: #166534; }
    &.alert { background: #fee2e2; color: #991b1b; }
    &.info { background: #dbeafe; color: #1e40af; }
  }

  .title {
    font-size: 13px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
  }
  .desc {
    font-size: 12px;
    color: #64748b;
    margin: 2px 0 0 0;
  }
  .time {
    font-size: 11px;
    color: #94a3b8;
    margin: 2px 0 0 0;
  }
`;

const Footer = styled.div`
  text-align: center;
  padding: 24px 0 8px 0;

  p {
    font-size: 12px;
    color: #94a3b8;
    margin: 0;
  }
`;