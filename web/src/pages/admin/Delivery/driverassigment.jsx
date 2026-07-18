import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled from 'styled-components';

const API_BASE = 'http://localhost:8001/api';

export default function DriverShipment() {
  const [assignments, setAssignments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      const [shipRes, driverRes, vehicleRes] = await Promise.all([
        axios.get(`${API_BASE}/shipments/`),
        axios.get(`${API_BASE}/drivers/`),
        axios.get(`${API_BASE}/vehicles/`)
      ]);

      const shipments = shipRes.data.data || shipRes.data || [];
      const driversList = driverRes.data.data || driverRes.data || [];
      const vehiclesList = vehicleRes.data.data || vehicleRes.data || [];

      setDrivers(driversList);
      setVehicles(vehiclesList);

      const getDriverName = (driverId) => {
        const driver = driversList.find(d => d.id === driverId || d.id === parseInt(driverId));
        return driver ? driver.full_name : `Driver #${driverId}`;
      };

      const getVehicleInfo = (vehicleId) => {
        const vehicle = vehiclesList.find(v => v.id === vehicleId || v.id === parseInt(vehicleId));
        if (!vehicle) return { model: 'N/A', plate: 'N/A' };
        return {
          model: vehicle.vehicle_id || vehicle.type || 'N/A',
          plate: vehicle.license_plate || 'N/A'
        };
      };

      const withDrivers = Array.isArray(shipments)
        ? shipments
            .filter(s => s.driver_id)
            .map((s, index) => {
              const vehicle = getVehicleInfo(s.vehicle_id);
              return {
                id: s.id,
                srNo: index + 1,
                lrNumber: s.lr_number || 'N/A',
                driverName: getDriverName(s.driver_id),
                driverId: s.driver_id,
                truckModel: vehicle.model,
                numberPlate: vehicle.plate,
                cargo: s.goods_desc || 'N/A',
                destination: s.destination || s.delivery_location || 'N/A',
                status: s.status || 'Pending',
                eta: s.eta || null
              };
            })
        : [];

      setAssignments(withDrivers);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'in transit':
      case 'in-transit':
      case 'transit': return '#38bdf8';
      case 'loading': return '#fbbf24';
      case 'dispatched': return '#34d399';
      case 'delivered': return '#10b981';
      case 'delayed': return '#ef4444';
      case 'pending': return '#94a3b8';
      default: return '#94a3b8';
    }
  };

  const formatStatus = (status) => {
    if (!status) return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
  };

  return (
    <PageWrapper>
      <HeaderControl>
        <TitleBlock>
          <h2>Driver Assignments</h2>
          <p>Monitor driver allocations, active cargo manifests, and delivery progress.</p>
        </TitleBlock>
      </HeaderControl>

      <StatsRibbon>
        <StatCard>
          <p>Active Drivers On Road</p>
          <span>{assignments.length} Assigned</span>
        </StatCard>
        <StatCard variant="success">
          <p>In Transit</p>
          <span>{assignments.filter(a => ['in transit', 'in-transit', 'transit'].includes(a.status?.toLowerCase())).length} Shipments</span>
        </StatCard>
        <StatCard variant="warning">
          <p>Loading / Pending</p>
          <span>{assignments.filter(a => ['loading', 'pending'].includes(a.status?.toLowerCase())).length} Shipments</span>
        </StatCard>
      </StatsRibbon>

      <LedgerCard>
        <LedgerHeader>
          <h3>Active Logistics Ledger</h3>
        </LedgerHeader>

        <TableResponsiveWrapper>
          <LedgerTable>
            <thead>
              <tr>
                <th>Sr.no</th>
                <th>LR Number</th>
                <th>Driver / Operator</th>
                <th>Truck Model</th>
                <th>Number Plate</th>
                <th>Cargo Material</th>
                <th>Destination</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    Loading assignments...
                  </td>
                </tr>
              ) : assignments.length > 0 ? (
                assignments.map((row) => (
                  <tr key={row.id}>
                    <td className="monospace color-slate">{row.srNo}</td>
                    <td className="monospace text-blue font-semibold">{row.lrNumber}</td>
                    <td className="font-semibold text-white">{row.driverName}</td>
                    <td>{row.truckModel}</td>
                    <td className="monospace text-blue text-uppercase">{row.numberPlate}</td>
                    <td>{row.cargo}</td>
                    <td className="font-semibold text-white">{row.destination}</td>
                    <td>
                      <StatusBadge color={getStatusColor(row.status)}>
                        {formatStatus(row.status)}
                      </StatusBadge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No active driver assignments found. Assign drivers from Shipment Operations.
                  </td>
                </tr>
              )}
            </tbody>
          </LedgerTable>
        </TableResponsiveWrapper>
      </LedgerCard>
    </PageWrapper>
  );
}

/* ---------------- Styled Components ---------------- */

const PageWrapper = styled.div`
  max-width: 1140px;
  margin: 0 auto;
  padding: 20px;
  font-family: sans-serif;

  @media (max-width: 1024px) {
    padding: 16px 12px;
  }
`;

const HeaderControl = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
`;

const TitleBlock = styled.div`
  h2 {
    font-size: 26px;
    font-weight: bold;
    color: #f02501;
    margin: 0 0 6px 0;
  }
  p {
    font-size: 14px;
    color: #64748b;
    margin: 0;
  }

  @media (max-width: 768px) {
    h2 { font-size: 22px; }
    p { font-size: 13px; }
  }
`;

const StatsRibbon = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 32px;
`;

const StatCard = styled.div`
  flex: 1 1 200px;
  background-color: #0b1329;
  padding: 20px;
  border-radius: 12px;
  color: #fff;
  border: 1px solid #1e293b;

  p {
    font-size: 12px;
    color: #94a3b8;
    margin: 0 0 8px 0;
    text-transform: uppercase;
  }

  span {
    font-size: 24px;
    font-weight: bold;
    color: ${props => 
      props.variant === 'success' ? '#34d399' : 
      props.variant === 'warning' ? '#fbbf24' : '#ffffff'};
  }
`;

const LedgerCard = styled.div`
  background-color: #0b1329;
  border-radius: 16px;
  border: 1px solid #1e293b;
  overflow: hidden;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
`;

const LedgerHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid #1e293b;
  background-color: #0f172a;

  h3 {
    font-size: 16px;
    font-weight: bold;
    color: #ffffff;
    margin: 0;
  }
`;

const TableResponsiveWrapper = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

const LedgerTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 14px;
  color: #cbd5e1;

  thead tr {
    background-color: #0f172a;
    border-bottom: 2px solid #1e293b;
    color: #94a3b8;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  th, td {
    padding: 16px 24px;
    white-space: nowrap;
  }

  tbody tr {
    border-bottom: 1px solid #1e293b;
    &:hover {
      background-color: #111c3a;
    }
  }

  .monospace { font-family: monospace; }
  .color-slate { color: #94a3b8; }
  .font-semibold { font-weight: 600; }
  .text-white { color: #fff; }
  .text-blue { color: #38bdf8; }
  .text-uppercase { text-transform: uppercase; }

  @media (max-width: 768px) {
    th, td {
      padding: 12px 16px;
    }
  }
`;

const StatusBadge = styled.span`
  background-color: ${props => props.color + '20'};
  color: ${props => props.color};
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  
  &::before {
    content: "●";
    margin-right: 6px;
    font-size: 10px;
  }
`;