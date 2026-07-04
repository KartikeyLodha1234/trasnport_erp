import React, { useState } from 'react';
import styled from 'styled-components';

export default function TrackShipment() {
  const [trackId, setTrackId] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ==================== API CALL ====================
  const API_BASE = 'http://localhost:5000/api';

  const handleTrackSearch = async (e) => {
    e.preventDefault();
    
    if (!trackId.trim()) {
      setError('Please enter a tracking ID');
      return;
    }

    setLoading(true);
    setError('');
    setSearchResult(null);

    try {
      // Try to find shipment by tracking ID or ID
      const response = await fetch(`${API_BASE}/shipments`);
      const result = await response.json();

      if (response.ok) {
        const shipments = result.data || [];
        // Search by tracking_id or id
        const shipment = shipments.find(s =>
          s.tracking_id?.toLowerCase() === trackId.trim().toLowerCase() ||
          s.id?.toString() === trackId.trim()
        );

        if (shipment) {
          // Get driver and vehicle details
          const driverResponse = await fetch(`${API_BASE}/drivers`);
          const drivers = await driverResponse.json();
          const driver = drivers.data?.find(d => d.id === shipment.driver_id);
          
          const vehicleResponse = await fetch(`${API_BASE}/vehicles`);
          const vehicles = await vehicleResponse.json();
          const vehicle = vehicles.find(v => v.id === shipment.vehicle_id);

          // Generate tracking steps based on status
          const steps = generateTrackingSteps(shipment);
          
          setSearchResult({
            id: shipment.tracking_id || `TRK-${String(shipment.id).padStart(4, '0')}`,
            shipmentId: shipment.id,
            client: shipment.client || 'N/A',
            origin: vehicle?.company_name || 'N/A',
            destination: shipment.destination || 'N/A',
            status: shipment.status || 'Pending',
            eta: shipment.eta ? new Date(shipment.eta).toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'N/A',
            currentLocation: getCurrentLocation(shipment.status),
            driver: driver?.full_name || 'Unassigned',
            vehicle: vehicle?.vehicle_id || 'N/A',
            licensePlate: vehicle?.license_plate || 'N/A',
            weight: shipment.weight || 'N/A',
            notes: shipment.notes || 'No notes',
            steps: steps,
            statusColor: getStatusColor(shipment.status)
          });
        } else {
          setError('❌ No shipment found with this tracking ID');
        }
      } else {
        setError('❌ Failed to fetch shipment data');
      }
    } catch (error) {
      console.error('Error tracking shipment:', error);
      setError('❌ Network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ==================== HELPERS ====================

  const getCurrentLocation = (status) => {
    const locations = {
      'Delivered': '📍 Destination Reached',
      'In Transit': '📍 En Route - Jaipur Bypass',
      'Loading': '📍 Loading Bay - Warehouse',
      'Delayed': '📍 Traffic Hold - NH-48',
      'Pending': '📍 Awaiting Dispatch',
      'Alert': '📍 Emergency Stop - Service Area'
    };
    return locations[status] || '📍 In Transit';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Delivered': '#10b981',
      'In Transit': '#38bdf8',
      'Loading': '#94a3b8',
      'Delayed': '#f59e0b',
      'Pending': '#f59e0b',
      'Alert': '#ef4444'
    };
    return colors[status] || '#94a3b8';
  };

  const generateTrackingSteps = (shipment) => {
    const baseSteps = [
      { title: 'Manifest Created', date: shipment.created_at ? new Date(shipment.created_at).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : 'N/A', done: true }
    ];

    if (shipment.status === 'Loading') {
      baseSteps.push(
        { title: 'Vehicle Assigned', date: 'In Progress', done: true },
        { title: 'Cargo Loading', date: 'In Progress', done: true },
        { title: 'Dispatched From Origin', date: 'Pending', done: false }
      );
    } else if (shipment.status === 'In Transit') {
      baseSteps.push(
        { title: 'Vehicle Assigned', date: 'Completed', done: true },
        { title: 'Cargo Loading', date: 'Completed', done: true },
        { title: 'Dispatched From Origin', date: 'Completed', done: true },
        { title: 'In Transit', date: 'In Progress', done: true },
        { title: 'Out for Delivery', date: 'Pending', done: false }
      );
    } else if (shipment.status === 'Delivered') {
      baseSteps.push(
        { title: 'Vehicle Assigned', date: 'Completed', done: true },
        { title: 'Cargo Loading', date: 'Completed', done: true },
        { title: 'Dispatched From Origin', date: 'Completed', done: true },
        { title: 'In Transit', date: 'Completed', done: true },
        { title: 'Out for Delivery', date: 'Completed', done: true },
        { title: 'Delivered Successfully', date: shipment.eta || 'Completed', done: true }
      );
    } else if (shipment.status === 'Delayed') {
      baseSteps.push(
        { title: 'Vehicle Assigned', date: 'Completed', done: true },
        { title: 'Cargo Loading', date: 'Completed', done: true },
        { title: 'Dispatched From Origin', date: 'Completed', done: true },
        { title: 'In Transit', date: 'In Progress', done: true },
        { title: '⚠️ Delayed', date: 'Pending', done: false }
      );
    } else {
      baseSteps.push(
        { title: 'Vehicle Assigned', date: 'Pending', done: false },
        { title: 'Cargo Loading', date: 'Pending', done: false }
      );
    }

    return baseSteps;
  };

  // ==================== RENDER ====================

  return (
    <PageWrapper>
      {/* Header */}
      <HeaderSection>
        <h1>📍 Real-Time Cargo Tracking</h1>
        <p>Enter transport manifest or assignment credentials to scan active fleet coordinates.</p>
      </HeaderSection>

      {/* Search Box */}
      <SearchContainer>
        <form onSubmit={handleTrackSearch}>
          <SearchInputGroup>
            <div className="input-wrapper">
              <label>Shipment / Tracking ID</label>
              <input 
                type="text" 
                value={trackId}
                onChange={(e) => setTrackId(e.target.value)}
                placeholder="e.g. TRK-2026-0001 or SHP-1001" 
                required
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? '⏳ Searching...' : '🔍 Locate Freight'}
            </button>
          </SearchInputGroup>
        </form>
      </SearchContainer>

      {/* Error Message */}
      {error && (
        <ErrorBox>
          <span>❌</span>
          <p>{error}</p>
          <button onClick={() => setError('')}>✕</button>
        </ErrorBox>
      )}

      {/* Results */}
      {searchResult && !loading && (
        <ResultsContainer>
          {/* Left: Timeline */}
          <TimelineCard>
            <h3>
              <span>🚚</span> Transit Progress Pipeline
              <span className="status-badge" style={{ backgroundColor: searchResult.statusColor + '20', color: searchResult.statusColor }}>
                {searchResult.status}
              </span>
            </h3>
            
            <TimelineList>
              {searchResult.steps.map((step, idx) => (
                <TimelineItem key={idx}>
                  <div className="node-wrapper">
                    <div className={`node ${step.done ? 'completed' : 'pending'}`} />
                    {idx !== searchResult.steps.length - 1 && (
                      <div className={`line ${step.done ? 'completed' : 'pending'}`} />
                    )}
                  </div>
                  <div className="step-content">
                    <h4 className={step.done ? 'completed' : 'pending'}>{step.title}</h4>
                    <p>{step.date}</p>
                  </div>
                </TimelineItem>
              ))}
            </TimelineList>
          </TimelineCard>

          {/* Right: Details */}
          <DetailsCard>
            <h3>
              <span>📋</span> Shipment Details
              <span className="tracking-id">{searchResult.id}</span>
            </h3>
            
            <DetailGrid>
              <DetailItem>
                <label>Client Operator</label>
                <strong>{searchResult.client}</strong>
              </DetailItem>
              <DetailItem>
                <label>Current Position</label>
                <strong className="location">{searchResult.currentLocation}</strong>
              </DetailItem>
              <DetailItem>
                <label>Route Matrix</label>
                <span>{searchResult.origin} → {searchResult.destination}</span>
              </DetailItem>
              <DetailItem>
                <label>Estimated ETA</label>
                <strong className="eta">{searchResult.eta}</strong>
              </DetailItem>
              <DetailItem>
                <label>👤 Driver</label>
                <span>{searchResult.driver}</span>
              </DetailItem>
              <DetailItem>
                <label>🚛 Vehicle</label>
                <span>{searchResult.vehicle} [{searchResult.licensePlate}]</span>
              </DetailItem>
              <DetailItem>
                <label>⚖️ Weight</label>
                <span>{searchResult.weight}</span>
              </DetailItem>
              <DetailItem fullWidth>
                <label>📝 Notes</label>
                <p>{searchResult.notes}</p>
              </DetailItem>
            </DetailGrid>
          </DetailsCard>
        </ResultsContainer>
      )}
    </PageWrapper>
  );
}

// ==================== STYLED COMPONENTS ====================

const PageWrapper = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: linear-gradient(135deg, #f8fafc 0%, #f0f4f8 100%);
  min-height: 100vh;
`;

const HeaderSection = styled.div`
  margin-bottom: 28px;
  
  h1 {
    font-size: 26px;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
  }
  p {
    font-size: 14px;
    color: #64748b;
    margin: 4px 0 0 0;
  }
`;

const SearchContainer = styled.div`
  background: #0b1329;
  padding: 24px;
  border-radius: 16px;
  border: 1px solid #1e293b;
  margin-bottom: 24px;
`;

const SearchInputGroup = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: flex-end;

  .input-wrapper {
    flex: 1;
    min-width: 200px;
    
    label {
      display: block;
      font-size: 11px;
      font-weight: 600;
      color: #cbd5e1;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }
    
    input {
      width: 100%;
      background: #0f172a;
      border: 1px solid #334155;
      padding: 12px 16px;
      border-radius: 10px;
      color: #ffffff;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
      
      &:focus {
        border-color: #2563eb;
      }
      
      &::placeholder {
        color: #64748b;
      }
    }
  }
  
  button {
    background: #2563eb;
    color: #ffffff;
    padding: 12px 28px;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
    height: 48px;
    white-space: nowrap;
    
    &:hover:not(:disabled) {
      background: #1d4ed8;
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
`;

const ErrorBox = styled.div`
  background: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 10px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  
  p {
    margin: 0;
    flex: 1;
    color: #991b1b;
    font-size: 14px;
  }
  
  button {
    background: none;
    border: none;
    color: #991b1b;
    font-size: 18px;
    cursor: pointer;
  }
`;

const ResultsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
`;

const TimelineCard = styled.div`
  flex: 2 1 500px;
  background: #0b1329;
  padding: 28px;
  border-radius: 16px;
  border: 1px solid #1e293b;
  color: #fff;
  
  h3 {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 16px;
    font-weight: 700;
    margin: 0 0 24px 0;
    border-bottom: 1px solid #1e293b;
    padding-bottom: 12px;
    
    .status-badge {
      margin-left: auto;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
  }
`;

const TimelineList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
`;

const TimelineItem = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-start;
  
  .node-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
    
    .node {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 4px solid #334155;
      background: #1e293b;
      transition: all 0.3s;
      
      &.completed {
        background: #34d399;
        border-color: #0f172a;
        box-shadow: 0 0 20px rgba(52, 211, 153, 0.3);
      }
      
      &.pending {
        background: #1e293b;
        border-color: #334155;
      }
    }
    
    .line {
      width: 2px;
      height: 40px;
      margin-top: 4px;
      transition: all 0.3s;
      
      &.completed {
        background: #34d399;
      }
      
      &.pending {
        background: #1e293b;
      }
    }
  }
  
  .step-content {
    flex: 1;
    
    h4 {
      font-size: 14px;
      font-weight: 600;
      margin: 0 0 2px 0;
      
      &.completed {
        color: #ffffff;
      }
      
      &.pending {
        color: #64748b;
      }
    }
    
    p {
      font-size: 12px;
      color: #94a3b8;
      margin: 0;
    }
  }
`;

const DetailsCard = styled.div`
  flex: 1 1 300px;
  background: #0f172a;
  padding: 24px;
  border-radius: 16px;
  border: 1px solid #1e293b;
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 16px;
  
  h3 {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 15px;
    font-weight: 700;
    color: #38bdf8;
    margin: 0 0 4px 0;
    text-transform: uppercase;
    
    .tracking-id {
      margin-left: auto;
      font-size: 12px;
      color: #60a5fa;
      font-family: monospace;
      text-transform: uppercase;
    }
  }
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  
  ${props => props.fullWidth && 'grid-column: 1 / -1;'}
  
  label {
    font-size: 11px;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }
  
  strong, span, p {
    font-size: 13px;
    color: #ffffff;
    margin: 0;
  }
  
  .location {
    color: #f59e0b;
  }
  
  .eta {
    color: #34d399;
  }
  
  p {
    font-size: 13px;
    color: #94a3b8;
    margin: 0;
    background: #0b1329;
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid #1e293b;
  }
`;
