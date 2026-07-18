import React, { useState, useEffect, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';

export default function LiveMap() {
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [drivers, setDrivers] = useState([]);

  const API_BASE = 'http://localhost:8001/api';

  // ==================== API CALLS ====================
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
        fetchDrivers()
      ]);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await fetch(`${API_BASE}/vehicles`);
      if (!response.ok) throw new Error('Failed to fetch vehicles');
      const data = await response.json();
      console.log('Vehicles:', data);
      setVehicles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setVehicles([]);
    }
  };

  const fetchShipments = async () => {
    try {
      const response = await fetch(`${API_BASE}/shipments`);
      if (!response.ok) throw new Error('Failed to fetch shipments');
      const data = await response.json();
      console.log('Shipments:', data);
      // Handle both formats
      const shipmentsData = Array.isArray(data) ? data : (data.data || []);
      setShipments(shipmentsData);
    } catch (error) {
      console.error('Error fetching shipments:', error);
      setShipments([]);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await fetch(`${API_BASE}/drivers`);
      if (!response.ok) throw new Error('Failed to fetch drivers');
      const data = await response.json();
      console.log('Drivers:', data);
      const driversData = data.success ? data.data : (Array.isArray(data) ? data : []);
      setDrivers(driversData);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setDrivers([]);
    }
  };

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
      'delivered': 'Completed',
      'Delivered': 'Completed',
      'in_transit': 'On Time',
      'In Transit': 'On Time',
      'delayed': 'Delayed',
      'Delayed': 'Delayed',
      'alert': 'Critical',
      'Alert': 'Critical',
      'loading': 'Loading',
      'Loading': 'Loading'
    };
    return statusMap[shipment.status] || shipment.status || 'Available';
  };

  const getVehicleRoute = (vehicleId) => {
    const shipment = shipments.find(s => 
      s.vehicle_id === vehicleId || 
      s.vehicle_id === parseInt(vehicleId) ||
      s.vehicle_id === String(vehicleId)
    );
    return shipment ? shipment.destination : 'N/A';
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
          year: 'numeric'
        });
      }
      return shipment.eta;
    }
    return 'N/A';
  };

  // ==================== MAP VEHICLES DATA ====================
  const liveVehicles = useMemo(() => {
    console.log('Generating live vehicles from:', { vehicles, shipments, drivers });
    
    // If no vehicles, use fallback data
    if (!vehicles || vehicles.length === 0) {
      return [
        { id: 'TRK-4022', driver: 'Rajesh Kumar', route: 'Mumbai → Delhi', startCity: 'Mumbai', endCity: 'Delhi', status: 'On Time', load: '14', speed: 68, eta: '4 hrs', pct: '65%' },
        { id: 'TRK-8819', driver: 'Amit Sharma', route: 'Jaipur → Udaipur', startCity: 'Jaipur', endCity: 'Udaipur', status: 'Delayed', load: '18', speed: 52, eta: '5 hrs', pct: '40%' },
        { id: 'TRK-1092', driver: 'Vikram Singh', route: 'Ahmedabad → Bhilwara', startCity: 'Ahmedabad', endCity: 'Bhilwara', status: 'On Time', load: '12', speed: 72, eta: '2 hrs', pct: '75%' },
        { id: 'TRK-5541', driver: 'Sanjay Dutt', route: 'Delhi → Chandigarh', startCity: 'Delhi', endCity: 'Chandigarh', status: 'Critical', load: '22', speed: 0, eta: 'N/A', pct: '25%' },
      ];
    }

    return vehicles.map((vehicle, index) => {
      const vehicleId = vehicle.vehicle_id || vehicle.id || `VH-${index}`;
      const status = getVehicleStatus(vehicleId);
      const route = getVehicleRoute(vehicleId);
      const driverName = getDriverName(vehicle.driver_id) || 'Unassigned';
      
      let displayStatus = status;
      let pct = '50%';
      
      if (status === 'Completed') pct = '100%';
      else if (status === 'On Time') pct = '65%';
      else if (status === 'Delayed') pct = '40%';
      else if (status === 'Critical') pct = '25%';
      else if (status === 'Loading') pct = '30%';

      return {
        id: vehicleId,
        driver: driverName,
        route: `${vehicle.company_name || 'Start'} → ${route}`,
        startCity: vehicle.company_name || 'Start',
        endCity: route || 'Destination',
        status: displayStatus,
        load: Math.floor(Math.random() * 10 + 10).toString(),
        speed: Math.floor(Math.random() * 40 + 40),
        eta: getVehicleETA(vehicleId),
        pct: pct,
      };
    });
  }, [vehicles, shipments, drivers]);

  // Map coordinates
  const mapCoordinates = useMemo(() => {
    const coords = {};
    const positions = [
      { top: "42%", left: "46%", path: "M 80 320 Q 240 120, 420 220 T 720 100", startPos: { bottom: "18%", left: "8%" }, endPos: { top: "18%", right: "12%" } },
      { top: "58%", left: "32%", path: "M 120 150 L 320 340", startPos: { top: "30%", left: "15%" }, endPos: { bottom: "25%", left: "38%" } },
      { top: "72%", left: "22%", path: "M 40 410 Q 120 380, 240 310", startPos: { bottom: "10%", left: "5%" }, endPos: { bottom: "35%", left: "28%" } },
      { top: "24%", left: "62%", path: "M 380 110 L 620 40", startPos: { top: "22%", left: "45%" }, endPos: { top: "10%", right: "25%" } },
      { top: "35%", left: "55%", path: "M 200 200 Q 400 100, 600 300", startPos: { top: "15%", left: "25%" }, endPos: { bottom: "30%", right: "15%" } },
      { top: "65%", left: "45%", path: "M 100 500 Q 300 400, 500 500", startPos: { bottom: "10%", left: "15%" }, endPos: { bottom: "20%", right: "20%" } },
    ];

    liveVehicles.forEach((v, index) => {
      const theme = v.status === 'Completed' ? 'var(--success)' : 
                    v.status === 'On Time' ? 'var(--success)' : 
                    v.status === 'Delayed' ? 'var(--warning)' : 
                    v.status === 'Critical' ? 'var(--danger)' : 'var(--info)';
      coords[v.id] = {
        ...positions[index % positions.length],
        theme: theme
      };
    });
    return coords;
  }, [liveVehicles]);

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    return liveVehicles.filter(truck => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = truck.id.toLowerCase().includes(query) || 
                            truck.route.toLowerCase().includes(query) || 
                            truck.driver.toLowerCase().includes(query);
      
      const normalizedStatus = truck.status.toLowerCase().replace(' ', '');
      const matchesFilter = statusFilter === 'all' || normalizedStatus === statusFilter;

      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, statusFilter, liveVehicles]);

  // Set first vehicle as selected when data loads
  useEffect(() => {
    if (liveVehicles.length > 0 && !selectedVehicle) {
      setSelectedVehicle(liveVehicles[0].id);
    }
  }, [liveVehicles, selectedVehicle]);

  const currentVehicleData = liveVehicles.find(v => v.id === selectedVehicle) || liveVehicles[0] || {};
  const telemetry = mapCoordinates[currentVehicleData.id] || mapCoordinates[liveVehicles[0]?.id] || {};

  // Stats
  const onTimeCount = liveVehicles.filter(v => v.status === 'On Time' || v.status === 'Completed').length;
  const delayedCount = liveVehicles.filter(v => v.status === 'Delayed').length;
  const criticalCount = liveVehicles.filter(v => v.status === 'Critical').length;

  // ==================== LOADING STATE ====================
  if (loading) {
    return (
      <ContainerWrapper>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <h2>🔄 Loading Fleet Data...</h2>
          <p>Please wait while we fetch the latest information.</p>
        </div>
      </ContainerWrapper>
    );
  }

  if (error) {
    return (
      <ContainerWrapper>
        <div style={{ textAlign: 'center', padding: '50px', color: '#dc2626' }}>
          <h2>❌ Error Loading Data</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{ padding: '10px 20px', marginTop: '10px', cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      </ContainerWrapper>
    );
  }

  // ==================== RENDER ====================
  return (
    <ContainerWrapper>
      <HeaderSection>
        <div>
          <h2>📍 Live-Status Dashboard</h2>
          <p>Real-time asset telemetry configurations, operational health metrics, and breakdown logs.</p>
        </div>
        <Toolbar>
          <button type="button" className="btn-outline" onClick={() => window.location.reload()}>
            <i className="bi bi-arrow-repeat me-1"></i> Refresh
          </button>
        </Toolbar>
      </HeaderSection>

      <MetricsRow>
        <KpiCard border="var(--primary)">
          <p className="kpi-title">Total Assets Index</p>
          <h3>{vehicles.length || liveVehicles.length} Trucks</h3>
        </KpiCard>
        <KpiCard border="var(--success)">
          <p className="kpi-title">Available (Ready)</p>
          <h3 className="text-success">{onTimeCount} Active</h3>
        </KpiCard>
        <KpiCard border="var(--info)">
          <p className="kpi-title">In Transit (On Duty)</p>
          <h3 className="text-info">{liveVehicles.filter(v => v.status === 'On Time').length} Fleet</h3>
        </KpiCard>
        <KpiCard border="var(--warning)">
          <p className="kpi-title">Under Maintenance</p>
          <h3 className="text-warning">{delayedCount + criticalCount} Workshop</h3>
        </KpiCard>
      </MetricsRow>

      <MainGridLayout>
        <SidebarCard>
          <div className="card-header-custom">
            <h6>
              <i className="bi bi-truck me-2"></i>Active Vehicles
              <span className="badge-pill">{filteredVehicles.length}</span>
            </h6>
            <span className="live-tag">
              <span className="live-dot"></span> Live
            </span>
          </div>

          <SidebarBody>
            <SearchGroupWrapper>
              <span className="search-icon"><i className="bi bi-search"></i></span>
              <input 
                type="text" 
                placeholder="Search active trucks, drivers..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="clear-btn" onClick={() => setSearchQuery('')}>
                  <i className="bi bi-x-lg"></i>
                </button>
              )}
            </SearchGroupWrapper>

            <StatusToggleGroup>
              <button className={statusFilter === 'all' ? 'active' : ''} onClick={() => setStatusFilter('all')}>All</button>
              <button className={`btn-ontime ${statusFilter === 'ontime' ? 'active' : ''}`} onClick={() => setStatusFilter('ontime')}>
                <i className="bi bi-check-circle me-1"></i> On Time
              </button>
              <button className={`btn-delayed ${statusFilter === 'delayed' ? 'active' : ''}`} onClick={() => setStatusFilter('delayed')}>
                <i className="bi bi-clock me-1"></i> Delayed
              </button>
              <button className={`btn-critical ${statusFilter === 'critical' ? 'active' : ''}`} onClick={() => setStatusFilter('critical')}>
                <i className="bi bi-exclamation-triangle me-1"></i> Critical
              </button>
            </StatusToggleGroup>

            <VehicleScrollListWrapper>
              {filteredVehicles.length > 0 ? (
                filteredVehicles.map((truck) => {
                  const isActive = truck.id === selectedVehicle;
                  const isCompleted = truck.status === 'Completed';
                  return (
                    <VehicleItemButton 
                      key={truck.id} 
                      className={isActive ? 'active' : ''} 
                      onClick={() => setSelectedVehicle(truck.id)}
                    >
                      <div className="item-top-row">
                        <div className="truck-info-block">
                          <i className={`bi bi-truck fs-4 icon-display ${truck.status === 'Delayed' ? 'text-warning' : truck.status === 'Critical' ? 'text-danger' : isCompleted ? 'text-success' : ''}`}></i>
                          <div>
                            <div className="truck-id-txt">{truck.id}</div>
                            <div className="route-lbl"><i className="bi bi-geo-alt me-1"></i>{truck.route}</div>
                          </div>
                        </div>
                        <div className="status-eta-block">
                          <span className={`badge-status ${truck.status === 'On Time' || truck.status === 'Completed' ? 'bg-success-subtle' : truck.status === 'Delayed' ? 'bg-warning-subtle' : 'bg-danger-subtle'}`}>
                            {truck.status}
                          </span>
                          <div className="eta-lbl">ETA: {truck.eta}</div>
                        </div>
                      </div>

                      <div className="progress-container">
                        <ProgressTrackBase>
                          <ProgressBarFill 
                            width={truck.pct} 
                            color={truck.status === 'Completed' ? 'var(--success)' : truck.status === 'On Time' ? 'var(--success)' : truck.status === 'Delayed' ? 'var(--warning)' : 'var(--danger)'}
                          />
                        </ProgressTrackBase>
                        <div className="progress-labels-row">
                          <span>{truck.startCity}</span>
                          <span>{truck.pct}</span>
                          <span>{truck.endCity}</span>
                        </div>
                      </div>
                    </VehicleItemButton>
                  );
                })
              ) : (
                <NoDataPlaceholder>No matching assets found.</NoDataPlaceholder>
              )}
            </VehicleScrollListWrapper>
          </SidebarBody>

          <SidebarFooterMetricsGroup>
            <div>
              <span className="lbl">On Time</span>
              <span className="val text-success">{onTimeCount}</span>
            </div>
            <div>
              <span className="lbl">Delayed</span>
              <span className="val text-warning">{delayedCount}</span>
            </div>
            <div>
              <span className="lbl">Critical</span>
              <span className="val text-danger">{criticalCount}</span>
            </div>
          </SidebarFooterMetricsGroup>
        </SidebarCard>

        <MapDisplayCard>
          <CanvasContainer>
            <SvgViewSpace id="mapSvgCanvas">
              {telemetry.path && (
                <path 
                  d={telemetry.path}
                  stroke="url(#activeRouteGrad)" 
                  strokeWidth="4" 
                  fill="none" 
                  strokeDasharray="8 5"
                  strokeLinecap="round" 
                />
              )}
              <defs>
                <linearGradient id="activeRouteGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
                </linearGradient>
              </defs>
            </SvgViewSpace>

            {telemetry.startPos && (
              <MapAnchorNode style={telemetry.startPos}>
                <PulseRadarPoint color="var(--success)" />
                <div className="node-lbl">{currentVehicleData.startCity || 'Start'}</div>
              </MapAnchorNode>
            )}

            {telemetry.endPos && (
              <MapAnchorNode style={telemetry.endPos}>
                <PulseRadarPoint color="var(--danger)" />
                <div className="node-lbl">{currentVehicleData.endCity || 'End'}</div>
              </MapAnchorNode>
            )}

            {telemetry.top && telemetry.left && (
              <LiveVehicleMarker style={{ top: telemetry.top, left: telemetry.left }}>
                <MarkerCircleIcon style={{ backgroundColor: telemetry.theme || 'var(--primary)' }}>
                  <i className="bi bi-truck text-white"></i>
                </MarkerCircleIcon>
                <div className="marker-id-tag">{currentVehicleData.id}</div>
                <RadarEchoCircle style={{ color: telemetry.theme || 'var(--primary)' }} />
              </LiveVehicleMarker>
            )}

            <div className="grid-overlay"></div>
            <div className="globe-ambient-backplate">
              <i className="bi bi-globe"></i>
            </div>
          </CanvasContainer>

          <TelemetryControlFooterBar>
            <div className="profile-identity-pane">
              <div className="icon-badge-box">
                <i className="bi bi-radar fs-3"></i>
              </div>
              <div>
                <div className="pane-truck-id">{currentVehicleData.id || 'N/A'}</div>
                <div className="pane-driver-name">{currentVehicleData.driver || 'Unknown'}</div>
              </div>
            </div>

            <HudTelemetryValuesGrid>
              <div className="hud-metric-unit-item">
                <span className="lbl">Current Speed</span>
                <span className="val">{currentVehicleData.speed || 0} <span className="unit">km/h</span></span>
              </div>
              <div className="hud-metric-unit-item border-left-split">
                <span className="lbl">Timeline ETA</span>
                <span className="val text-success">{currentVehicleData.eta || 'N/A'}</span>
              </div>
              <div className="hud-metric-unit-item border-left-split">
                <span className="lbl">Net Load Capacity</span>
                <span className="val">{currentVehicleData.load || 0} <span className="unit">tons</span></span>
              </div>
            </HudTelemetryValuesGrid>
          </TelemetryControlFooterBar>
        </MapDisplayCard>
      </MainGridLayout>
    </ContainerWrapper>
  );
}

// ==================== STYLED COMPONENTS ====================
// (Keep all your existing styled components exactly as they are)
// ... all the styled components remain the same ...
// ==================== STYLED COMPONENTS ====================

const alphaBlink = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
`;

const pulseRing = keyframes`
  0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
`;

const ContainerWrapper = styled.div`
  --primary: #2563eb;
  --success: #16a34a;
  --warning: #eab308;
  --danger: #dc2626;
  --info: #0ea5e9;
  
  max-width: 1440px;
  margin: 0 auto;
  padding: 24px;
  background-color: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;

  h2 { font-size: 24px; font-weight: 700; color: #1e293b; margin: 0 0 4px 0; }
  p { font-size: 14px; color: #64748b; margin: 0; }
`;

const Toolbar = styled.div`
  display: flex;
  gap: 12px;

  button {
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 600;
    border-radius: 6px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    transition: all 0.2s ease;
  }
  .btn-outline {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    color: #475569;
    &:hover { background: #f1f5f9; }
  }
  .btn-primary {
    background: var(--primary);
    border: 1px solid var(--primary);
    color: #ffffff;
    &:hover { background: #1d4ed8; }
  }
`;

const MetricsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
  @media (max-width: 992px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 576px) { grid-template-columns: 1fr; }
`;

const KpiCard = styled.div`
  background: #ffffff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  border-left: 4px solid ${props => props.border};

  .kpi-title { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; margin: 0 0 4px 0; }
  h3 { font-size: 20px; font-weight: 700; margin: 0; color: #1e293b; }
  .text-success { color: var(--success); }
  .text-info { color: var(--info); }
  .text-warning { color: var(--warning); }
`;

const MainGridLayout = styled.div`
  display: grid;
  grid-template-columns: 4fr 8fr;
  gap: 24px;
  @media (max-width: 1200px) { grid-template-columns: 1fr; }
`;

// Sidebar
const SidebarCard = styled.div`
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  height: 600px;
  overflow: hidden;

  .card-header-custom {
    padding: 16px 20px;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    justify-content: space-between;
    align-items: center;

    h6 { font-size: 15px; font-weight: 700; margin: 0; color: #1e293b; }
    .badge-pill { background: var(--primary); color: #ffffff; padding: 2px 8px; border-radius: 20px; font-size: 11px; margin-left: 8px; }
    .live-tag { font-size: 12px; color: #64748b; display: inline-flex; align-items: center; gap: 6px; }
    .live-dot { width: 8px; height: 8px; background: var(--success); border-radius: 50%; animation: ${alphaBlink} 1.5s infinite; }
  }
`;

const SidebarBody = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow: hidden;
`;

const SearchGroupWrapper = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  margin-bottom: 12px;

  .search-icon { padding-left: 12px; color: #94a3b8; display: flex; align-items: center; }
  input {
    width: 100%;
    padding: 10px 12px;
    font-size: 13px;
    border: none;
    outline: none;
    color: #1e293b;
    background: transparent;
  }
  .clear-btn { background: none; border: none; color: #94a3b8; cursor: pointer; padding-right: 12px; &:hover { color: #475569; } }
`;

const StatusToggleGroup = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
  padding-bottom: 4px;
  &::-webkit-scrollbar { height: 0px; }

  button {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 500;
    color: #475569;
    border-radius: 6px;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s ease;

    &:hover { background: #f8fafc; }
    &.active { background: #64748b; border-color: #64748b; color: #ffffff; }
  }
  .btn-ontime.active { background: var(--success); border-color: var(--success); }
  .btn-delayed.active { background: var(--warning); border-color: var(--warning); }
  .btn-critical.active { background: var(--danger); border-color: var(--danger); }
`;

const VehicleScrollListWrapper = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-right: 2px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
`;

const VehicleItemButton = styled.div`
  background: #ffffff;
  border: 1px solid #edf2f7;
  border-radius: 8px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover { transform: translateX(4px); background-color: #f8fafc; }

  &.active {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    color: #ffffff;
    border-color: #1e40af;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);

    .truck-id-txt, .icon-display, .route-lbl, .driver-lbl, .eta-lbl { color: #ffffff !important; }
    .route-lbl, .driver-lbl, .eta-lbl { opacity: 0.85; }
  }

  .item-top-row { display: flex; justify-content: space-between; align-items: flex-start; }
  .truck-info-block { display: flex; gap: 12px; align-items: flex-start; }
  .truck-id-txt { font-size: 15px; font-weight: 700; color: #1e293b; }
  .route-lbl { font-size: 12px; color: #64748b; margin-top: 2px; }
  
  .status-eta-block { text-align: right; }
  .badge-status { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; }
  .bg-success-subtle { background: #dcfce7; color: #15803d; }
  .bg-warning-subtle { background: #fef9c3; color: #a16207; }
  .bg-danger-subtle { background: #fee2e2; color: #b91c1c; }
  .eta-lbl { font-size: 12px; color: #475569; margin-top: 6px; font-weight: 500; }

  .progress-container { margin-top: 12px; }
  .progress-labels-row { display: flex; justify-content: space-between; font-size: 11px; opacity: 0.7; margin-top: 4px; }
`;

const ProgressTrackBase = styled.div`
  width: 100%;
  height: 4px;
  background: rgba(0,0,0,0.06);
  border-radius: 4px;
  overflow: hidden;
  .active & { background: rgba(255,255,255,0.25); }
`;

const ProgressBarFill = styled.div`
  height: 100%;
  width: ${props => props.width};
  background-color: ${props => props.color};
  .active & { background-color: #ffffff; }
`;

const SidebarFooterMetricsGroup = styled.div`
  padding: 12px 16px;
  border-top: 1px solid #f1f5f9;
  background: #fafafa;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  text-align: center;

  div { display: flex; flex-direction: column; align-items: center; }
  .lbl { font-size: 11px; color: #64748b; font-weight: 500; }
  .val { font-size: 14px; font-weight: 700; margin-top: 2px; }
  .text-success { color: var(--success); }
  .text-warning { color: var(--warning); }
  .text-danger { color: var(--danger); }
`;

const NoDataPlaceholder = styled.p`
  font-size: 13px; color: #64748b; text-align: center; padding: 24px 0; margin: 0;
`;

// Map
const MapDisplayCard = styled.div`
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 600px;
`;

const CanvasContainer = styled.div`
  background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
  position: relative;
  flex-grow: 1;
  overflow: hidden;

  .grid-overlay {
    position: absolute;
    inset: 0;
    opacity: 0.15;
    background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
  }

  .globe-ambient-backplate {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    color: #ffffff;
    opacity: 0.04;
    font-size: 9rem;
    pointer-events: none;
  }
`;

const SvgViewSpace = styled.svg`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
`;

const MapAnchorNode = styled.div`
  position: absolute;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;

  .node-lbl {
    color: rgba(255,255,255,0.6);
    font-size: 11px;
    font-weight: 600;
    margin-top: 6px;
    background: rgba(0,0,0,0.3);
    padding: 2px 6px;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
`;

const PulseRadarPoint = styled.span`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => props.color};
  box-shadow: 0 0 12px ${props => props.color};
`;

const LiveVehicleMarker = styled.div`
  position: absolute;
  z-index: 3;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1);

  .marker-id-tag {
    color: #ffffff;
    font-size: 11px;
    font-weight: 700;
    margin-top: 4px;
    text-shadow: 0 2px 4px rgba(0,0,0,0.8);
  }
`;

const MarkerCircleIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #ffffff;
  box-shadow: 0 4px 10px rgba(0,0,0,0.4);
`;

const RadarEchoCircle = styled.div`
  position: absolute;
  top: 32%; left: 50%;
  width: 50px; height: 50px;
  border: 2px solid currentColor;
  border-radius: 50%;
  animation: ${pulseRing} 2.5s ease-out infinite;
  transform: translate(-50%, -50%);
  pointer-events: none;
`;

const TelemetryControlFooterBar = styled.div`
  padding: 16px 20px;
  border-top: 1px solid #e2e8f0;
  background: #ffffff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;

  .profile-identity-pane { display: flex; align-items: center; gap: 14px; }
  .icon-badge-box { background: rgba(37,99,235,0.1); color: var(--primary); padding: 8px 12px; border-radius: 8px; }
  .pane-truck-id { font-size: 16px; font-weight: 700; color: #1e293b; }
  .pane-driver-name { font-size: 13px; color: #64748b; margin-top: 2px; }
`;

const HudTelemetryValuesGrid = styled.div`
  display: flex;
  align-items: center;
  flex-grow: 1;
  justify-content: flex-end;
  
  @media (max-width: 768px) { justify-content: space-between; width: 100%; }

  .hud-metric-unit-item {
    display: flex;
    flex-direction: column;
    padding: 0 24px;
    
    &:last-child { padding-right: 0; }
  }
  .border-left-split { border-left: 1px solid #e2e8f0; }

  .lbl { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; letter-spacing: 0.02em; }
  .val { font-size: 18px; font-weight: 700; color: #1e293b; margin-top: 4px; }
  .unit { font-size: 13px; font-weight: 500; color: #64748b; }
  .text-success { color: var(--success); }
`;