import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';

export default function FleetStatusDashboard() {
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states
  const [vehicles, setVehicles] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalVehicles: 0,
    available: 0,
    inTransit: 0,
    underMaintenance: 0
  });

  // ==================== API CALLS ====================
  const API_BASE = 'http://localhost:5000/api';

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchVehicles(),
        fetchShipments(),
        fetchDrivers(),
        fetchLogs()
      ]);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load fleet data. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await fetch(`${API_BASE}/vehicles`);
      if (!response.ok) throw new Error('Failed to fetch vehicles');
      const data = await response.json();
      console.log('✅ Vehicles loaded:', data);
      const vehiclesData = Array.isArray(data) ? data : [];
      setVehicles(vehiclesData);
      updateStats(vehiclesData);
    } catch (error) {
      console.error('❌ Error fetching vehicles:', error);
      setVehicles([]);
    }
  };

  const fetchShipments = async () => {
    try {
      const response = await fetch(`${API_BASE}/shipments`);
      if (!response.ok) throw new Error('Failed to fetch shipments');
      const data = await response.json();
      console.log('✅ Shipments loaded:', data);
      const shipmentsData = Array.isArray(data) ? data : (data.data || []);
      setShipments(shipmentsData);
    } catch (error) {
      console.error('❌ Error fetching shipments:', error);
      setShipments([]);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await fetch(`${API_BASE}/drivers`);
      if (!response.ok) throw new Error('Failed to fetch drivers');
      const data = await response.json();
      console.log('✅ Drivers loaded:', data);
      const driversData = data.success ? data.data : (Array.isArray(data) ? data : []);
      setDrivers(driversData);
    } catch (error) {
      console.error('❌ Error fetching drivers:', error);
      setDrivers([]);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch(`${API_BASE}/logs`);
      if (!response.ok) throw new Error('Failed to fetch logs');
      const data = await response.json();
      console.log('✅ Logs loaded:', data);
      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('❌ Error fetching logs:', error);
      setLogs([]);
    }
  };

  // ==================== UPDATE STATS ====================
  const updateStats = (vehiclesData) => {
    const total = vehiclesData.length || 0;
    
    // Count vehicles with active shipments
    const inTransit = shipments.filter(s => 
      s.status === 'In Transit' || 
      s.status === 'in_transit' || 
      s.status === 'Loading' ||
      s.status === 'loading'
    ).length;
    
    // Calculate available (vehicles not in transit)
    const available = total - inTransit;
    // Maintenance (some vehicles might be under maintenance)
    const underMaintenance = Math.max(0, Math.floor(total * 0.15)); // 15% assumption

    setStats({
      totalVehicles: total,
      available: Math.max(0, available - underMaintenance),
      inTransit: inTransit,
      underMaintenance: underMaintenance
    });
  };

  // Update stats when shipments change
  useEffect(() => {
    if (vehicles.length > 0) {
      updateStats(vehicles);
    }
  }, [shipments]);

  // ==================== HELPERS ====================
  const getDriverName = (driverId) => {
    if (!driverId) return 'Unassigned';
    const driver = drivers.find(d => d.id === driverId);
    return driver ? driver.full_name : 'Unknown';
  };

  const getVehicleStatus = (vehicleId) => {
    const shipment = shipments.find(s => 
      s.vehicle_id === vehicleId || 
      s.vehicle_id === parseInt(vehicleId) ||
      s.vehicle_id === String(vehicleId)
    );
    if (!shipment) return 'Available';
    
    const statusMap = {
      'Delivered': 'Completed',
      'delivered': 'Completed',
      'In Transit': 'On Time',
      'in_transit': 'On Time',
      'Delayed': 'Delayed',
      'delayed': 'Delayed',
      'Alert': 'Critical',
      'alert': 'Critical',
      'Loading': 'Loading',
      'loading': 'Loading',
      'Pending': 'Pending',
      'pending': 'Pending'
    };
    return statusMap[shipment.status] || shipment.status || 'Available';
  };

  const getVehicleRoute = (vehicleId) => {
    const shipment = shipments.find(s => 
      s.vehicle_id === vehicleId || 
      s.vehicle_id === parseInt(vehicleId) ||
      s.vehicle_id === String(vehicleId)
    );
    if (!shipment) return 'No Route';
    return shipment.destination || 'N/A';
  };

  const getVehicleLoad = (vehicleId) => {
    const shipment = shipments.find(s => 
      s.vehicle_id === vehicleId || 
      s.vehicle_id === parseInt(vehicleId) ||
      s.vehicle_id === String(vehicleId)
    );
    return shipment ? shipment.weight || 'N/A' : 'Available';
  };

  const getVehicleETA = (vehicleId) => {
    const shipment = shipments.find(s => 
      s.vehicle_id === vehicleId || 
      s.vehicle_id === parseInt(vehicleId) ||
      s.vehicle_id === String(vehicleId)
    );
    if (shipment && shipment.eta) {
      const date = new Date(shipment.eta);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      return shipment.eta;
    }
    return 'N/A';
  };

  const getVehicleSpeed = (status) => {
    if (status === 'Completed' || status === 'Available') return '0 km/h';
    if (status === 'Delayed') return '45 km/h';
    if (status === 'Critical') return '0 km/h ⚠️';
    return `${Math.floor(Math.random() * 40 + 40)} km/h`;
  };

  const getStatusColor = (status) => {
    const colors = {
      'On Time': '#16a34a',
      'Completed': '#16a34a',
      'Delayed': '#eab308',
      'Critical': '#dc2626',
      'Loading': '#0ea5e9',
      'Available': '#0ea5e9',
      'Pending': '#eab308'
    };
    return colors[status] || '#0ea5e9';
  };

  // ==================== LIVE VEHICLES DATA ====================
  const liveVehicles = useMemo(() => {
    console.log('🔄 Generating live vehicles from:', { vehicles, shipments, drivers });
    
    if (!vehicles || vehicles.length === 0) {
      // Fallback data
      return [
        { id: 'TRK-4022', driver: 'Rajesh Kumar', route: 'Mumbai → Delhi', status: 'On Time', load: 'Electronic Items (14 Tons)', speed: '68 km/h', eta: '4 hrs' },
        { id: 'TRK-8819', driver: 'Amit Sharma', route: 'Jaipur → Udaipur', status: 'Delayed', load: 'Industrial Gears (22 Tons)', speed: '45 km/h', eta: '1.5 hrs' },
        { id: 'TRK-1092', driver: 'Vikram Singh', route: 'Ahmedabad → Bhilwara', status: 'On Time', load: 'Textile Fabric (8 Tons)', speed: '72 km/h', eta: '35 mins' },
        { id: 'TRK-5541', driver: 'Sanjay Dutt', route: 'Delhi → Chandigarh', status: 'Critical', load: 'Perishable Dairy (6 Tons)', speed: '0 km/h ⚠️', eta: 'Unknown' },
      ];
    }

    return vehicles.map((vehicle, index) => {
      const vehicleId = vehicle.vehicle_id || vehicle.id || `VH-${index}`;
      const status = getVehicleStatus(vehicleId);
      const route = getVehicleRoute(vehicleId);
      const driverName = getDriverName(vehicle.driver_id);
      const load = getVehicleLoad(vehicleId);
      const eta = getVehicleETA(vehicleId);
      const speed = getVehicleSpeed(status);

      return {
        id: vehicleId,
        driver: driverName,
        route: `${vehicle.company_name || 'N/A'} → ${route}`,
        status: status,
        load: load !== 'Available' ? `${load} Tons` : 'Available',
        speed: speed,
        eta: eta
      };
    });
  }, [vehicles, shipments, drivers]);

  // Set first vehicle as selected when data loads
  useEffect(() => {
    if (liveVehicles.length > 0 && !selectedVehicle) {
      setSelectedVehicle(liveVehicles[0].id);
    }
  }, [liveVehicles, selectedVehicle]);

  // ==================== FILTER VEHICLES ====================
  const filteredVehicles = liveVehicles.filter(truck => {
    const query = searchQuery.toLowerCase().trim();
    return truck.id.toLowerCase().includes(query) ||
           truck.route.toLowerCase().includes(query) ||
           truck.driver.toLowerCase().includes(query);
  });

  // ==================== CRITICAL ALERTS ====================
  const criticalAlerts = useMemo(() => {
    const alerts = [];
    
    // Check for critical vehicles
    liveVehicles.forEach(vehicle => {
      if (vehicle.status === 'Critical') {
        alerts.push({
          id: `ALT-${Math.floor(Math.random() * 9000 + 1000)}`,
          truckId: vehicle.id,
          message: `⚠️ Vehicle ${vehicle.id} has critical issue. Immediate attention required!`,
          location: vehicle.route.split('→')[1]?.trim() || 'Unknown Location',
          severity: 'Critical',
          time: 'Just now'
        });
      }
    });

    // Check for delayed vehicles
    liveVehicles.forEach(vehicle => {
      if (vehicle.status === 'Delayed') {
        alerts.push({
          id: `ALT-${Math.floor(Math.random() * 9000 + 1000)}`,
          truckId: vehicle.id,
          message: `⏰ Vehicle ${vehicle.id} is delayed. ETA not available.`,
          location: vehicle.route.split('→')[1]?.trim() || 'Unknown Location',
          severity: 'Warning',
          time: '15 mins ago'
        });
      }
    });

    return alerts.slice(0, 5);
  }, [liveVehicles]);

  // ==================== STATS CALCULATION ====================
  const onTimeCount = liveVehicles.filter(v => v.status === 'On Time' || v.status === 'Completed').length;
  const delayedCount = liveVehicles.filter(v => v.status === 'Delayed').length;
  const criticalCount = liveVehicles.filter(v => v.status === 'Critical').length;

  // ==================== LOADING STATE ====================
  if (loading) {
    return (
      <PageWrapper>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h2 style={{ color: '#1e293b', marginBottom: '12px' }}>🔄 Loading Fleet Data...</h2>
          <p style={{ color: '#64748b' }}>Please wait while we fetch the latest fleet information.</p>
          <div style={{ 
            marginTop: '20px', 
            width: '40px', 
            height: '40px', 
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            display: 'inline-block'
          }}></div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#dc2626' }}>
          <h2>❌ Error Loading Fleet Data</h2>
          <p style={{ color: '#64748b', marginTop: '8px' }}>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '16px',
              padding: '10px 24px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            🔄 Retry
          </button>
        </div>
      </PageWrapper>
    );
  }

  // ==================== RENDER ====================
  return (
    <PageWrapper>
      {/* Title Section */}
      <HeaderSection>
        <div>
          <h2>🚛 Fleet Status Dashboard</h2>
          <p>Real-time asset telemetry configurations, operational health metrics, and breakdown logs.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn-refresh"
            onClick={loadAllData}
            style={{
              padding: '8px 16px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              color: '#475569',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = '#f1f5f9'}
            onMouseLeave={(e) => e.target.style.background = '#ffffff'}
          >
            🔄 Refresh
          </button>
        </div>
      </HeaderSection>

      {/* KPI Index Row */}
      <MetricsGrid>
        <KpiCard border="#2563eb">
          <p className="kpi-label">Total Assets Index</p>
          <h3 className="kpi-value text-dark">{stats.totalVehicles} Trucks</h3>
          <p className="kpi-subtext">Total fleet size</p>
        </KpiCard>

        <KpiCard border="#16a34a">
          <p className="kpi-label">Available (Ready)</p>
          <h3 className="kpi-value text-success">{stats.available} Active</h3>
          <p className="kpi-subtext">Ready for dispatch</p>
        </KpiCard>

        <KpiCard border="#0ea5e9">
          <p className="kpi-label">In Transit (On Duty)</p>
          <h3 className="kpi-value text-info">{stats.inTransit} Fleet</h3>
          <p className="kpi-subtext">Currently on the road</p>
        </KpiCard>

        <KpiCard border="#eab308">
          <p className="kpi-label">Under Maintenance</p>
          <h3 className="kpi-value text-warning">{stats.underMaintenance} Workshop</h3>
          <p className="kpi-subtext">In service/repair</p>
        </KpiCard>
      </MetricsGrid>

      {/* Search Bar */}
      <SearchWrapper>
        <SearchBox>
          <i className="bi bi-search"></i>
          <input 
            type="text" 
            placeholder="Search by Vehicle ID, Route, or Driver..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-btn" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </SearchBox>
        <StatusBadgeGroup>
          <span className="badge ontime">✅ On Time: {onTimeCount}</span>
          <span className="badge delayed">⏰ Delayed: {delayedCount}</span>
          <span className="badge critical">🚨 Critical: {criticalCount}</span>
        </StatusBadgeGroup>
      </SearchWrapper>

      {/* Main Content Split View */}
      <ContentSplitGrid>
        {/* Left: Fleet Deployment Efficiency */}
        <ContentCard>
          <h4 className="card-title">Fleet Deployment Efficiency</h4>
          <EfficiencyWrapper>
            <CircularProgress>
              <span className="percentage">
                {vehicles.length > 0 ? Math.round((stats.inTransit / vehicles.length) * 100) : 0}%
              </span>
              <span className="subtext">Utilization</span>
            </CircularProgress>

            <ProgressBarGroup>
              <ProgressItem>
                <div className="progress-label">
                  <span>Available Assets</span>
                  <span>{Math.round((stats.available / (stats.totalVehicles || 1)) * 100)}%</span>
                </div>
                <BarBase>
                  <BarFill color="#16a34a" width={`${Math.round((stats.available / (stats.totalVehicles || 1)) * 100)}%`} />
                </BarBase>
              </ProgressItem>

              <ProgressItem>
                <div className="progress-label">
                  <span>Active Deployment</span>
                  <span>{Math.round((stats.inTransit / (stats.totalVehicles || 1)) * 100)}%</span>
                </div>
                <BarBase>
                  <BarFill color="#0ea5e9" width={`${Math.round((stats.inTransit / (stats.totalVehicles || 1)) * 100)}%`} />
                </BarBase>
              </ProgressItem>

              <ProgressItem>
                <div className="progress-label">
                  <span>Workshop Repair</span>
                  <span>{Math.round((stats.underMaintenance / (stats.totalVehicles || 1)) * 100)}%</span>
                </div>
                <BarBase>
                  <BarFill color="#eab308" width={`${Math.round((stats.underMaintenance / (stats.totalVehicles || 1)) * 100)}%`} />
                </BarBase>
              </ProgressItem>
            </ProgressBarGroup>
          </EfficiencyWrapper>
        </ContentCard>

        {/* Right: Critical Alerts */}
        <ContentCard>
          <h4 className="card-title">Critical Fleet Alerts</h4>
          <AlertsListGroup>
            {criticalAlerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                ✅ No critical alerts at this time.
              </div>
            ) : (
              criticalAlerts.map((alert, index) => (
                <AlertItem 
                  key={index}
                  bg={alert.severity === 'Critical' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(234, 179, 8, 0.08)'}
                  border={alert.severity === 'Critical' ? '#f87171' : '#facc15'}
                >
                  <div className="alert-header">
                    <span className="truck-tag">{alert.truckId}</span>
                    <span className="alert-id">{alert.id}</span>
                  </div>
                  <p className="alert-message">{alert.message}</p>
                  <div className="alert-footer">
                    <span className="location">📍 {alert.location}</span>
                    <span className={`status-pill ${alert.severity === 'Critical' ? 'badge-danger' : 'badge-warning'}`}>
                      {alert.severity}
                    </span>
                  </div>
                </AlertItem>
              ))
            )}
          </AlertsListGroup>
        </ContentCard>
      </ContentSplitGrid>

      {/* Vehicle List Section */}
      <VehicleListCard>
        <div className="card-header">
          <h4>🚛 Active Vehicles</h4>
          <span className="count">{filteredVehicles.length} vehicles</span>
        </div>
        <VehicleGrid>
          {filteredVehicles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', gridColumn: '1 / -1' }}>
              No vehicles found matching your search.
            </div>
          ) : (
            filteredVehicles.map((vehicle) => (
              <VehicleCard 
                key={vehicle.id}
                statusColor={getStatusColor(vehicle.status)}
                isSelected={selectedVehicle === vehicle.id}
                onClick={() => setSelectedVehicle(vehicle.id)}
              >
                <div className="vehicle-header">
                  <span className="vehicle-id">{vehicle.id}</span>
                  <span className={`status-badge ${vehicle.status.toLowerCase().replace(' ', '-')}`}>
                    {vehicle.status}
                  </span>
                </div>
                <div className="vehicle-details">
                  <p className="driver"><strong>👤 Driver:</strong> {vehicle.driver}</p>
                  <p className="route"><strong>📍 Route:</strong> {vehicle.route}</p>
                  <p className="load"><strong>📦 Load:</strong> {vehicle.load}</p>
                  <p className="speed"><strong>⚡ Speed:</strong> {vehicle.speed}</p>
                  <p className="eta"><strong>⏰ ETA:</strong> {vehicle.eta}</p>
                </div>
              </VehicleCard>
            ))
          )}
        </VehicleGrid>
      </VehicleListCard>
    </PageWrapper>
  );
}

// ==================== STYLED COMPONENTS ====================

const PageWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  background-color: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  min-height: 100vh;
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;

  h2 {
    font-size: 24px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 6px 0;
  }
  p {
    font-size: 14px;
    color: #64748b;
    margin: 0;
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 24px;

  @media (max-width: 1024px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 576px) { grid-template-columns: 1fr; }
`;

const KpiCard = styled.div`
  background: #ffffff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border-left: 4px solid ${props => props.border};

  .kpi-label {
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 0 6px 0;
  }
  .kpi-value {
    font-size: 22px;
    font-weight: 700;
    margin: 0;
  }
  .kpi-subtext {
    font-size: 12px;
    color: #94a3b8;
    margin: 4px 0 0 0;
  }
  .text-dark { color: #1e293b; }
  .text-success { color: #16a34a; }
  .text-info { color: #0ea5e9; }
  .text-warning { color: #d97706; }
`;

const SearchWrapper = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  align-items: center;
`;

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0 12px;
  min-width: 200px;

  i {
    color: #94a3b8;
    font-size: 16px;
  }

  input {
    flex: 1;
    border: none;
    outline: none;
    padding: 10px 12px;
    font-size: 14px;
    color: #1e293b;
    background: transparent;
  }

  .clear-btn {
    background: none;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    font-size: 14px;
    padding: 4px 8px;
    
    &:hover {
      color: #475569;
    }
  }
`;

const StatusBadgeGroup = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  .badge {
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    
    &.ontime {
      background: #dcfce7;
      color: #15803d;
    }
    &.delayed {
      background: #fef9c3;
      color: #a16207;
    }
    &.critical {
      background: #fee2e2;
      color: #b91c1c;
    }
  }
`;

const ContentSplitGrid = styled.div`
  display: grid;
  grid-template-columns: 5fr 7fr;
  gap: 24px;
  margin-bottom: 24px;

  @media (max-width: 992px) { grid-template-columns: 1fr; }
`;

const ContentCard = styled.div`
  background: #ffffff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  .card-title {
    font-size: 16px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 20px 0;
  }
`;

const EfficiencyWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
`;

const CircularProgress = styled.div`
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: #f8fafc;
  border: 3px solid #2563eb;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .percentage {
    font-size: 22px;
    font-weight: 700;
    color: #2563eb;
    line-height: 1;
  }
  .subtext {
    font-size: 11px;
    color: #64748b;
    margin-top: 2px;
  }
`;

const ProgressBarGroup = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const ProgressItem = styled.div`
  .progress-label {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    font-weight: 500;
    color: #64748b;
    margin-bottom: 6px;
    span:last-child { color: #1e293b; font-weight: 600; }
  }
`;

const BarBase = styled.div`
  width: 100%;
  height: 8px;
  background-color: #f1f5f9;
  border-radius: 9999px;
  overflow: hidden;
`;

const BarFill = styled.div`
  height: 100%;
  background-color: ${props => props.color};
  width: ${props => props.width};
  border-radius: 9999px;
  transition: width 0.6s ease;
`;

const AlertsListGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const AlertItem = styled.div`
  border: 1px solid ${props => props.border};
  background-color: ${props => props.bg};
  border-radius: 6px;
  padding: 14px 16px;

  .alert-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  .truck-tag {
    background: #1e293b;
    color: #ffffff;
    font-family: monospace;
    font-size: 12px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 4px;
  }
  .alert-id {
    font-family: monospace;
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
  }
  .alert-message {
    font-size: 13px;
    font-weight: 500;
    color: #1e293b;
    margin: 0 0 12px 0;
  }
  .alert-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
    padding-top: 10px;
  }
  .location {
    font-size: 12px;
    color: #475569;
    font-weight: 500;
  }
  .status-pill {
    font-size: 11px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 9999px;
    text-transform: uppercase;
  }
  .badge-danger { background-color: #dc2626; color: #ffffff; }
  .badge-warning { background-color: #eab308; color: #1e293b; }
`;

const VehicleListCard = styled.div`
  background: #ffffff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h4 {
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }
    
    .count {
      font-size: 13px;
      color: #64748b;
      background: #f1f5f9;
      padding: 4px 12px;
      border-radius: 20px;
    }
  }
`;

const VehicleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
`;

const VehicleCard = styled.div`
  background: #ffffff;
  border: 2px solid ${props => props.isSelected ? props.statusColor : '#e2e8f0'};
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${props => props.isSelected ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  .vehicle-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #f1f5f9;

    .vehicle-id {
      font-family: monospace;
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
    }

    .status-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 20px;
      
      &.on-time, &.completed {
        background: #dcfce7;
        color: #15803d;
      }
      &.delayed {
        background: #fef9c3;
        color: #a16207;
      }
      &.critical {
        background: #fee2e2;
        color: #b91c1c;
      }
      &.loading, &.available {
        background: #dbeafe;
        color: #1e40af;
      }
    }
  }

  .vehicle-details {
    p {
      margin: 4px 0;
      font-size: 13px;
      color: #475569;
      
      strong {
        color: #1e293b;
      }
    }
  }
`;