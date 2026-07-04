// pages/driver/DriverShipment.jsx - Fixed
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Sidebar from './drivercomponents/Sidebar'; // ✅ Import as Sidebar

const DriverShipment = () => {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [driverId, setDriverId] = useState(null);
  const [driverName, setDriverName] = useState('');
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const API_BASE = 'http://localhost:5000/api';

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    const id = localStorage.getItem('userId');

    console.log('🔍 DriverShipment - Token:', token ? 'Present' : 'Missing');
    console.log('🔍 DriverShipment - Role:', role);
    console.log('🔍 DriverShipment - ID:', id);

    if (!token || role !== 'driver') {
      navigate('/login');
      return;
    }

    setDriverId(id);
    setDriverName(localStorage.getItem('userName') || 'Driver');
    fetchShipments(id);
  }, [navigate]);

  const fetchShipments = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching shipments for driver:', id);
      
      const response = await fetch(`${API_BASE}/shipments`);
      const data = await response.json();
      
      console.log('📦 All Shipments Response:', data);
      
      // Handle different response structures
      const shipmentsArray = data?.data || data || [];
      const driverShipments = shipmentsArray.filter(s => {
        const shipDriverId = s.driver_id ? parseInt(s.driver_id) : null;
        return shipDriverId === parseInt(id);
      });
      
      console.log('✅ Driver Shipments Found:', driverShipments.length);
      setShipments(driverShipments);
      
    } catch (error) {
      console.error('❌ Error fetching shipments:', error);
      setError('Failed to load shipments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'In Transit': '#16a34a',
      'in_transit': '#16a34a',
      'Loading': '#2563eb',
      'loading': '#2563eb',
      'Delivered': '#8b5cf6',
      'delivered': '#8b5cf6',
      'Delayed': '#dc2626',
      'delayed': '#dc2626',
      'Pending': '#f59e0b',
      'pending': '#f59e0b'
    };
    return colors[status] || '#94a3b8';
  };

  const getStatusDisplay = (status) => {
    const display = {
      'in_transit': 'In Transit',
      'loading': 'Loading',
      'delivered': 'Delivered',
      'delayed': 'Delayed',
      'pending': 'Pending'
    };
    return display[status] || status;
  };

  const getStatusIcon = (status) => {
    const icons = {
      'In Transit': '🚚',
      'in_transit': '🚚',
      'Loading': '📦',
      'loading': '📦',
      'Delivered': '✅',
      'delivered': '✅',
      'Delayed': '⚠️',
      'delayed': '⚠️',
      'Pending': '⏳',
      'pending': '⏳'
    };
    return icons[status] || '📋';
  };

  const handleRefresh = () => {
    if (driverId) {
      fetchShipments(driverId);
    }
  };

  if (loading) {
    return (
      <LoadingWrapper>
        <div className="loader">📦</div>
        <p>Loading shipments...</p>
      </LoadingWrapper>
    );
  }

  return (
    <DashboardWrapper>
      {/* Driver Sidebar - Using Sidebar component */}
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      {/* Main Content */}
      <MainContent>
        {/* Header with Hamburger Menu */}
        <Header>
          <div className="header-left">
            <button 
              className="hamburger-btn"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              ☰
            </button>
            <div>
              <h1>📦 My Shipments</h1>
              <p>Welcome back, {driverName}!</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="refresh-btn" onClick={handleRefresh}>
              🔄 Refresh
            </button>
            <div className="time">
              {new Date().toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </Header>

        {/* Stats Cards */}
        <StatsGrid>
          <StatCard>
            <div className="icon" style={{ background: '#dbeafe', color: '#2563eb' }}>📦</div>
            <div className="stat-info">
              <h3>Total Shipments</h3>
              <p className="number">{shipments.length}</p>
            </div>
          </StatCard>

          <StatCard>
            <div className="icon" style={{ background: '#d1fae5', color: '#059669' }}>🚚</div>
            <div className="stat-info">
              <h3>In Progress</h3>
              <p className="number" style={{ color: '#059669' }}>
                {shipments.filter(s => 
                  s.status === 'In Transit' || s.status === 'in_transit' || 
                  s.status === 'Loading' || s.status === 'loading'
                ).length}
              </p>
            </div>
          </StatCard>

          <StatCard>
            <div className="icon" style={{ background: '#ede9fe', color: '#7c3aed' }}>✅</div>
            <div className="stat-info">
              <h3>Delivered</h3>
              <p className="number" style={{ color: '#7c3aed' }}>
                {shipments.filter(s => 
                  s.status === 'Delivered' || s.status === 'delivered'
                ).length}
              </p>
            </div>
          </StatCard>
        </StatsGrid>

        {/* Error Message */}
        {error && (
          <ErrorBox>
            ⚠️ {error}
          </ErrorBox>
        )}

        {/* Shipments Table */}
        <TableCardSection>
          <TableTopbarControls>
            <div className="title-area">
              📋 All Shipments
            </div>
            <span className="count">{shipments.length} shipments</span>
          </TableTopbarControls>

          <TableResponsiveWrapper>
            {shipments.length === 0 ? (
              <EmptyState>
                <span>📭</span>
                <p>No shipments assigned yet</p>
                <small>Click "Refresh" to check for new assignments</small>
              </EmptyState>
            ) : (
              <RegistryGridTable>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Destination</th>
                    <th>Client</th>
                    <th>Status</th>
                    <th>ETA</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.map((shipment) => {
                    const statusDisplay = getStatusDisplay(shipment.status);
                    const statusColor = getStatusColor(shipment.status);
                    const statusIcon = getStatusIcon(shipment.status);
                    
                    return (
                      <tr key={shipment.id}>
                        <td className="font-mono text-muted">#{shipment.id}</td>
                        <td className="text-dark">{shipment.destination || 'N/A'}</td>
                        <td className="text-dark">{shipment.client || 'N/A'}</td>
                        <td>
                          <StatusBadge color={statusColor}>
                            {statusIcon} {statusDisplay}
                          </StatusBadge>
                        </td>
                        <td className="text-muted">
                          {shipment.eta ? new Date(shipment.eta).toLocaleString() : 'N/A'}
                        </td>
                        <td>
                          <ActionButtonsWrapper style={{ justifyContent: 'center' }}>
                            <button 
                              type="button" 
                              className="icon-btn-view"
                              onClick={() => alert(`Shipment #${shipment.id}\nDestination: ${shipment.destination}\nStatus: ${statusDisplay}`)}
                            >
                              👁️
                            </button>
                          </ActionButtonsWrapper>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </RegistryGridTable>
            )}
          </TableResponsiveWrapper>
        </TableCardSection>

        <Footer>
          <p>© 2024 CargoMax Logistics. All rights reserved.</p>
        </Footer>
      </MainContent>
    </DashboardWrapper>
  );
};

// ============================================
// STYLED COMPONENTS
// ============================================

const LoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f8fafc;
  
  .loader {
    font-size: 48px;
    animation: pulse 1.5s ease-in-out infinite;
  }
  
  p {
    margin-top: 16px;
    font-size: 18px;
    color: #64748b;
    font-weight: 500;
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
`;

const DashboardWrapper = styled.div`
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
`;

const MainContent = styled.div`
  flex: 1;
  margin-left: 0;
  padding: 32px;
  overflow-y: auto;

  @media (min-width: 1024px) {
    margin-left: 260px;
  }

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .hamburger-btn {
    display: none;
    background: none;
    border: none;
    font-size: 28px;
    cursor: pointer;
    color: #0f172a;
    padding: 4px 8px;
    border-radius: 8px;

    &:hover {
      background: #e2e8f0;
    }
  }

  @media (max-width: 1024px) {
    .hamburger-btn {
      display: block;
    }
  }

  h1 {
    font-size: 28px;
    color: #0f172a;
    margin: 0;
    font-weight: 700;
  }

  p {
    color: #64748b;
    margin: 4px 0 0 0;
    font-size: 14px;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .refresh-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    background: #4f46e5;
    color: white;
    font-weight: 600;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;

    &:hover {
      background: #4338ca;
    }
  }

  .time {
    color: #64748b;
    font-size: 14px;
    background: white;
    padding: 8px 16px;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 32px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  background: white;
  padding: 20px 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }

  .icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
  }

  .stat-info {
    flex: 1;
  }

  h3 {
    color: #64748b;
    font-size: 13px;
    margin: 0 0 4px 0;
    font-weight: 500;
  }

  .number {
    font-size: 24px;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
    line-height: 1.2;
  }
`;

const ErrorBox = styled.div`
  background: #fef2f2;
  border: 1px solid #fca5a5;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-weight: 500;
`;

const TableCardSection = styled.div`
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
`;

const TableTopbarControls = styled.div`
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  border-bottom: 1px solid #f1f5f9;
  
  .title-area {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
  }
  
  .count {
    font-size: 13px;
    color: #64748b;
    background: #f1f5f9;
    padding: 4px 12px;
    border-radius: 20px;
  }
`;

const TableResponsiveWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

const RegistryGridTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 14px;
  
  thead tr {
    border-bottom: 1px solid #e2e8f0;
    background-color: #fafafa;
    color: #334155;
    font-size: 12px;
    font-weight: 600;
  }
  
  th, td {
    padding: 14px 20px;
    white-space: nowrap;
    vertical-align: middle;
  }
  
  tbody tr {
    border-bottom: 1px solid #f1f5f9;
    &:hover {
      background-color: #f8fafc;
    }
  }
  
  .text-dark {
    color: #0f172a !important;
  }
  
  .text-muted {
    color: #475569 !important;
  }
  
  .font-mono {
    font-family: monospace;
    color: #64748b;
  }
`;

const StatusBadge = styled.span`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: ${props => props.color}20;
  color: ${props => props.color};
`;

const ActionButtonsWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
  .icon-btn-view {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s ease;
    outline: none;
    color: #2563eb;
    
    &:hover {
      background: #eff6ff;
      border-color: #bfdbfe;
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;

  span {
    font-size: 48px;
    display: block;
    margin-bottom: 16px;
  }

  p {
    font-size: 18px;
    margin: 0;
    color: #64748b;
    font-weight: 500;
  }

  small {
    font-size: 14px;
    color: #cbd5e1;
    display: block;
    margin-top: 8px;
  }
`;

const Footer = styled.div`
  text-align: center;
  padding: 16px;
  color: #94a3b8;
  font-size: 13px;
  border-top: 1px solid #e2e8f0;
  margin-top: 24px;

  p {
    margin: 0;
  }
`;

export default DriverShipment;  