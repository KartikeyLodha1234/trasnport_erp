import React, { useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const API_BASE = 'http://localhost:8001/api';

export default function TrackShipment() {
  const [trackId, setTrackId] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ==================== API CALL ====================

  const handleTrackSearch = async (e) => {
    e.preventDefault();
    
    if (!trackId.trim()) {
      setError('Please enter a tracking ID or LR number');
      return;
    }

    setLoading(true);
    setError('');
    setSearchResult(null);

    try {
      // Try direct search by LR number first
      let shipment = null;
      
      try {
        const lrRes = await axios.get(`${API_BASE}/shipments/search/?q=${encodeURIComponent(trackId.trim())}`);
        const lrResults = lrRes.data.data || lrRes.data || [];
        if (lrResults.length > 0) {
          shipment = lrResults[0];
        }
      } catch (searchErr) {
        // Search endpoint might not exist, fall back to fetching all
      }

      // Fallback: fetch all shipments and search locally
      if (!shipment) {
        const shipmentRes = await axios.get(`${API_BASE}/shipments/`);
        const shipments = shipmentRes.data.data || shipmentRes.data || [];
        
        shipment = shipments.find(s =>
          s.tracking_id?.toLowerCase() === trackId.trim().toLowerCase() ||
          s.lr_number?.toLowerCase() === trackId.trim().toLowerCase() ||
          s.id?.toString() === trackId.trim() ||
          String(s.id).padStart(4, '0') === trackId.trim()
        );
      }

      if (!shipment) {
        setError('❌ No shipment found with this tracking ID or LR number');
        setLoading(false);
        return;
      }

      // Fetch driver and vehicle
      let driver = null;
      let vehicle = null;

      try {
        const [driverRes, vehicleRes] = await Promise.all([
          axios.get(`${API_BASE}/drivers/`),
          axios.get(`${API_BASE}/vehicles/`)
        ]);

        const drivers = driverRes.data.data || driverRes.data || [];
        const vehicles = vehicleRes.data.data || vehicleRes.data || [];
        
        driver = drivers.find(d => d.id === shipment.driver_id || d.id === parseInt(shipment.driver_id));
        vehicle = vehicles.find(v => v.id === shipment.vehicle_id || v.id === parseInt(shipment.vehicle_id));
      } catch (err) {
        console.warn('Could not fetch driver/vehicle details');
      }

      const steps = generateTrackingSteps(shipment);
      
      setSearchResult({
        id: shipment.tracking_id || `TRK-${String(shipment.id).padStart(4, '0')}`,
        lrNumber: shipment.lr_number || 'N/A',
        shipmentId: shipment.id,
        client: shipment.client || 'N/A',
        origin: shipment.pickup_location || vehicle?.company_name || 'N/A',
        destination: shipment.destination || shipment.delivery_location || 'N/A',
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
        weight: shipment.weight ? `${shipment.weight} ${shipment.weight_type || 'kg'}` : 'N/A',
        goodsDesc: shipment.goods_desc || 'N/A',
        packages: shipment.packages || 'N/A',
        freightCharge: shipment.freight_charge || 0,
        paymentMode: shipment.payment_mode || 'N/A',
        notes: shipment.notes || 'No notes',
        steps: steps,
        statusColor: getStatusColor(shipment.status)
      });
    } catch (err) {
      console.error('Error tracking shipment:', err);
      setError('❌ Network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ==================== HELPERS ====================

  function getCurrentLocation(status) {
    const statusLower = (status || '').toLowerCase();
    const locations = {
      'delivered': '📍 Destination Reached',
      'in transit': '📍 En Route - Highway',
      'in-transit': '📍 En Route - Highway',
      'transit': '📍 En Route - Highway',
      'loading': '📍 Loading Bay - Warehouse',
      'delayed': '📍 Traffic Hold - Highway',
      'pending': '📍 Awaiting Dispatch',
    };
    return locations[statusLower] || '📍 In Transit';
  }

  function getStatusColor(status) {
    const statusLower = (status || '').toLowerCase();
    const colors = {
      'delivered': '#10b981',
      'in transit': '#38bdf8',
      'in-transit': '#38bdf8',
      'transit': '#38bdf8',
      'loading': '#fbbf24',
      'delayed': '#f59e0b',
      'pending': '#94a3b8',
    };
    return colors[statusLower] || '#94a3b8';
  }

  function generateTrackingSteps(shipment) {
    const statusLower = (shipment.status || '').toLowerCase();
    
    const baseSteps = [
      { 
        title: '📋 Booking Confirmed', 
        date: shipment.created_at ? new Date(shipment.created_at).toLocaleString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : 'N/A', 
        done: true 
      }
    ];

    if (statusLower === 'pending') {
      baseSteps.push(
        { title: '🚛 Vehicle Assignment', date: 'Pending', done: false },
        { title: '📦 Cargo Loading', date: 'Pending', done: false },
        { title: '🛣️ Dispatched', date: 'Pending', done: false }
      );
    } else if (statusLower === 'loading') {
      baseSteps.push(
        { title: '🚛 Vehicle Assigned', date: 'Completed', done: true },
        { title: '📦 Cargo Loading', date: 'In Progress', done: true },
        { title: '🛣️ Dispatched', date: 'Pending', done: false }
      );
    } else if (['in transit', 'in-transit', 'transit'].includes(statusLower)) {
      baseSteps.push(
        { title: '🚛 Vehicle Assigned', date: 'Completed', done: true },
        { title: '📦 Cargo Loading', date: 'Completed', done: true },
        { title: '🛣️ Dispatched', date: 'Completed', done: true },
        { title: '📍 In Transit', date: 'In Progress', done: true },
        { title: '🏠 Out for Delivery', date: 'Pending', done: false }
      );
    } else if (statusLower === 'delayed') {
      baseSteps.push(
        { title: '🚛 Vehicle Assigned', date: 'Completed', done: true },
        { title: '📦 Cargo Loading', date: 'Completed', done: true },
        { title: '🛣️ Dispatched', date: 'Completed', done: true },
        { title: '⚠️ Delayed', date: 'In Progress', done: true },
        { title: '🏠 Delivery', date: 'Pending', done: false }
      );
    } else if (statusLower === 'delivered') {
      baseSteps.push(
        { title: '🚛 Vehicle Assigned', date: 'Completed', done: true },
        { title: '📦 Cargo Loading', date: 'Completed', done: true },
        { title: '🛣️ Dispatched', date: 'Completed', done: true },
        { title: '📍 In Transit', date: 'Completed', done: true },
        { title: '🏠 Out for Delivery', date: 'Completed', done: true },
        { title: '✅ Delivered Successfully', date: shipment.eta ? new Date(shipment.eta).toLocaleString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : 'Completed', done: true }
      );
    } else {
      baseSteps.push(
        { title: '🚛 Vehicle Assignment', date: 'Pending', done: false },
        { title: '📦 Cargo Loading', date: 'Pending', done: false }
      );
    }

    return baseSteps;
  }

  const formatStatus = (status) => {
    if (!status) return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
  };

  // ==================== RENDER ====================

  return (
    <PageWrapper>
      <HeaderSection>
        <h1>📍 Real-Time Cargo Tracking</h1>
        <p>Enter your LR number or tracking ID to check your shipment status.</p>
      </HeaderSection>

      <SearchContainer>
        <form onSubmit={handleTrackSearch}>
          <SearchInputGroup>
            <div className="input-wrapper">
              <label>LR Number / Tracking ID</label>
              <input 
                type="text" 
                value={trackId}
                onChange={(e) => setTrackId(e.target.value)}
                placeholder="e.g. LR20260716001 or TRK-1001" 
                required
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? '⏳ Searching...' : '🔍 Track Shipment'}
            </button>
          </SearchInputGroup>
        </form>
      </SearchContainer>

      {error && (
        <ErrorBox>
          <span>❌</span>
          <p>{error}</p>
          <button onClick={() => setError('')}>✕</button>
        </ErrorBox>
      )}

      {searchResult && !loading && (
        <ResultsContainer>
          <TimelineCard>
            <h3>
              <span>🚚</span> Transit Progress
              <span className="status-badge" style={{ backgroundColor: searchResult.statusColor + '20', color: searchResult.statusColor }}>
                {formatStatus(searchResult.status)}
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

          <DetailsCard>
            <h3>
              <span>📋</span> Shipment Details
              <span className="tracking-id">{searchResult.id}</span>
            </h3>
            
            <DetailGrid>
              <DetailItem>
                <label>LR Number</label>
                <strong className="lr-number">{searchResult.lrNumber}</strong>
              </DetailItem>
              <DetailItem>
                <label>Shipment ID</label>
                <span>#{searchResult.shipmentId}</span>
              </DetailItem>
              <DetailItem>
                <label>Client</label>
                <strong>{searchResult.client}</strong>
              </DetailItem>
              <DetailItem>
                <label>Current Location</label>
                <strong className="location">{searchResult.currentLocation}</strong>
              </DetailItem>
              <DetailItem>
                <label>Route</label>
                <span>{searchResult.origin} → {searchResult.destination}</span>
              </DetailItem>
              <DetailItem>
                <label>Est. Delivery</label>
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
                <label>📦 Goods</label>
                <span>{searchResult.goodsDesc}</span>
              </DetailItem>
              <DetailItem>
                <label>⚖️ Weight</label>
                <span>{searchResult.weight}</span>
              </DetailItem>
              <DetailItem>
                <label>💰 Freight</label>
                <span>₹{searchResult.freightCharge}</span>
              </DetailItem>
              <DetailItem>
                <label>💳 Payment</label>
                <span>{searchResult.paymentMode}</span>
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
      
      &.completed { color: #ffffff; }
      &.pending { color: #64748b; }
    }
    
    p {
      font-size: 12px;
      color: #94a3b8;
      margin: 0;
    }
  }
`;

const DetailsCard = styled.div`
  flex: 1 1 320px;
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
  
  .location { color: #f59e0b; }
  .eta { color: #34d399; }
  .lr-number { color: #60a5fa; font-family: monospace; font-size: 14px; }
  
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