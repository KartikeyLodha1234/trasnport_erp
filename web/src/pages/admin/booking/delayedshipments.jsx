import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function DelayedShipments() {
  const [delayedShipments, setDelayedShipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('All');

  // ==================== API CALLS ====================
  const API_BASE = 'http://localhost:5000/api';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch shipments
      const shipmentRes = await fetch(`${API_BASE}/shipments`);
      const shipmentData = await shipmentRes.json();
      
      // Fetch drivers
      const driverRes = await fetch(`${API_BASE}/drivers`);
      const driverData = await driverRes.json();
      
      // Fetch vehicles
      const vehicleRes = await fetch(`${API_BASE}/vehicles`);
      const vehicleData = await vehicleRes.json();

      if (shipmentRes.ok) {
        setDrivers(driverData.data || []);
        setVehicles(vehicleData || []);

        const shipments = shipmentData.data || [];

        // Filter delayed shipments
        const delayed = shipments.filter(s =>
          s.status === 'Delayed' || s.status === 'Alert'
        );
        
        // Map with driver and vehicle details
        const mappedDelayed = delayed.map(s => {
          const driver = driverData.data?.find(d => d.id === s.driver_id);
          const vehicle = vehicleData?.find(v => v.id === s.vehicle_id);
          
          return {
            id: s.tracking_id || `TRK-${String(s.id).padStart(4, '0')}`,
            shipmentId: s.id,
            driver: driver?.full_name || 'Unassigned',
            vehicle: vehicle?.vehicle_id || 'N/A',
            vehicleName: vehicle?.company_name || 'N/A',
            route: `${vehicle?.company_name || 'Origin'} → ${s.destination || 'N/A'}`,
            reason: getDelayReason(s.status, s.notes),
            severity: getSeverity(s.status, s.notes),
            status: s.status,
            destination: s.destination,
            eta: s.eta,
            notes: s.notes,
            client: s.client || 'N/A',
            weight: s.weight || 'N/A'
          };
        });
        
        setDelayedShipments(mappedDelayed);
      }
    } catch (error) {
      console.error('Error fetching delayed shipments:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==================== HELPERS ====================

  const getDelayReason = (status, notes) => {
    if (notes && notes.toLowerCase().includes('traffic')) return 'Traffic Congestion';
    if (notes && notes.toLowerCase().includes('weather')) return 'Weather Conditions';
    if (notes && notes.toLowerCase().includes('mechanical')) return 'Mechanical Issue';
    if (status === 'Alert') return 'Critical Alert - Immediate Attention';
    return 'Route Delay';
  };

  const getSeverity = (status, notes) => {
    if (status === 'Alert') return 'Critical';
    if (notes && notes.toLowerCase().includes('critical')) return 'Critical';
    if (notes && notes.toLowerCase().includes('urgent')) return 'High';
    return 'Medium';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'Critical': '#dc2626',
      'High': '#f59e0b',
      'Medium': '#f97316',
      'Low': '#22c55e'
    };
    return colors[severity] || '#94a3b8';
  };

  const getSeverityBg = (severity) => {
    const colors = {
      'Critical': 'rgba(220, 38, 38, 0.1)',
      'High': 'rgba(245, 158, 11, 0.1)',
      'Medium': 'rgba(249, 115, 22, 0.1)',
      'Low': 'rgba(34, 197, 94, 0.1)'
    };
    return colors[severity] || 'rgba(148, 163, 184, 0.1)';
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === '0000-00-00 00:00:00') return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
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

  // Filter shipments
  const filteredShipments = delayedShipments.filter(s => {
    const matchesSearch = 
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.client.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = filterSeverity === 'All' || s.severity === filterSeverity;
    
    return matchesSearch && matchesSeverity;
  });

  // ==================== EXPORT FUNCTIONS ====================

  const exportToPDF = () => {
    if (delayedShipments.length === 0) {
      alert('No delayed shipments to export!');
      return;
    }

    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      
      doc.setFontSize(20);
      doc.setTextColor(220, 38, 38);
      doc.text('⚠️ Delayed Shipments Report', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 28, { align: 'center' });
      
      doc.setFillColor(248, 250, 252);
      doc.rect(14, 35, pageWidth - 28, 25, 'F');
      
      const summaryItems = [
        { label: 'Total Delayed', value: delayedShipments.length },
        { label: 'Critical', value: delayedShipments.filter(s => s.severity === 'Critical').length },
        { label: 'High', value: delayedShipments.filter(s => s.severity === 'High').length },
        { label: 'Medium', value: delayedShipments.filter(s => s.severity === 'Medium').length }
      ];
      
      const itemWidth = (pageWidth - 28) / summaryItems.length;
      summaryItems.forEach((item, index) => {
        const x = 14 + (index * itemWidth);
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(item.label, x + itemWidth / 2, 42, { align: 'center' });
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.text(String(item.value), x + itemWidth / 2, 52, { align: 'center' });
      });
      
      const tableHeaders = ['Trip ID', 'Client', 'Driver', 'Route', 'Status', 'Severity', 'ETA', 'Reason'];
      const tableRows = delayedShipments.map(s => [
        s.id,
        s.client,
        s.driver,
        s.route,
        s.status,
        s.severity,
        formatDate(s.eta),
        s.reason
      ]);

      doc.autoTable({
        startY: 70,
        head: [tableHeaders],
        body: tableRows,
        theme: 'striped',
        headStyles: {
          fillColor: [220, 38, 38],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold'
        },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 30 },
          2: { cellWidth: 25 },
          3: { cellWidth: 35 },
          4: { cellWidth: 25 },
          5: { cellWidth: 20 },
          6: { cellWidth: 30 },
          7: { cellWidth: 35 }
        }
      });

      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `© ${new Date().getFullYear()} Fleet Management • ${delayedShipments.length} delayed shipments`,
        pageWidth / 2,
        finalY,
        { align: 'center' }
      );

      doc.save(`delayed_shipments_${new Date().toISOString().split('T')[0]}.pdf`);
      alert(`✅ ${delayedShipments.length} delayed shipments exported to PDF!`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('❌ Failed to export PDF: ' + error.message);
    }
  };

  // ==================== STATS ====================
  const criticalCount = delayedShipments.filter(s => s.severity === 'Critical').length;
  const highCount = delayedShipments.filter(s => s.severity === 'High').length;
  const mediumCount = delayedShipments.filter(s => s.severity === 'Medium').length;

  // ==================== RENDER ====================

  return (
    <PageWrapper>
      {/* Header */}
      <HeaderSection>
        <div>
          <h1><span>⚠️</span> Exception & Delayed Shipments</h1>
          <p>Live tracking exception matrix</p>
        </div>
        <ActionButtons>
          <button className="btn-secondary" onClick={fetchData}>
            🔄 Refresh
          </button>
          <button className="btn-primary" onClick={exportToPDF}>
            📄 Export PDF
          </button>
        </ActionButtons>
      </HeaderSection>

      {/* Stats */}
      <StatsGrid>
        <StatCard color="#dc2626">
          <span className="stat-icon">🚨</span>
          <div>
            <span className="stat-label">Critical</span>
            <span className="stat-value">{criticalCount}</span>
          </div>
        </StatCard>
        <StatCard color="#f59e0b">
          <span className="stat-icon">⚠️</span>
          <div>
            <span className="stat-label">High Priority</span>
            <span className="stat-value">{highCount}</span>
          </div>
        </StatCard>
        <StatCard color="#f97316">
          <span className="stat-icon">📌</span>
          <div>
            <span className="stat-label">Medium Priority</span>
            <span className="stat-value">{mediumCount}</span>
          </div>
        </StatCard>
        <StatCard color="#64748b">
          <span className="stat-icon">📊</span>
          <div>
            <span className="stat-label">Total Delayed</span>
            <span className="stat-value">{delayedShipments.length}</span>
          </div>
        </StatCard>
      </StatsGrid>

      {/* Search & Filter */}
      <FilterBar>
        <SearchBox>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input 
            type="text" 
            placeholder="Search by Trip ID, Driver, or Route..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchBox>
        <FilterSelect 
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
        >
          <option value="All">All Severity</option>
          <option value="Critical">🚨 Critical</option>
          <option value="High">⚠️ High</option>
          <option value="Medium">📌 Medium</option>
          <option value="Low">✅ Low</option>
        </FilterSelect>
      </FilterBar>

      {/* Table */}
      <TableContainer>
        {loading ? (
          <div className="loading-state">⏳ Loading delayed shipments...</div>
        ) : filteredShipments.length === 0 ? (
          <div className="empty-state">
            <span>✅</span>
            <p>No delayed shipments found</p>
            <small>All shipments are running on time</small>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Trip ID</th>
                <th>Client</th>
                <th>Driver</th>
                <th>Route Leg</th>
                <th>Status</th>
                <th>Severity</th>
                <th>ETA</th>
                <th>Disruption Reason</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.map((shipment, index) => (
                <tr key={shipment.id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  <td className="trip-id">{shipment.id}</td>
                  <td className="client">{shipment.client}</td>
                  <td className="driver">{shipment.driver}</td>
                  <td className="route">{shipment.route}</td>
                  <td>
                    <StatusBadge status={shipment.status}>
                      {shipment.status}
                    </StatusBadge>
                  </td>
                  <td>
                    <SeverityBadge 
                      bgColor={getSeverityBg(shipment.severity)}
                      textColor={getSeverityColor(shipment.severity)}
                    >
                      {shipment.severity}
                    </SeverityBadge>
                  </td>
                  <td className="eta">{formatDate(shipment.eta)}</td>
                  <td className="reason">❌ {shipment.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableContainer>
    </PageWrapper>
  );
}

// ==================== STYLED COMPONENTS ====================

const PageWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  background: #f1f5f9;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;

  h1 {
    font-size: 28px;
    font-weight: 900;
    color: #0f172a;
    margin: 0 0 4px 0;
    display: flex;
    align-items: center;
    gap: 10px;
    
    span { color: #dc2626; }
  }
  p {
    font-size: 15px;
    color: #475569;
    margin: 0;
    font-weight: 600;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;

  button {
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 600;
    border-radius: 8px;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
  }

  .btn-secondary {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    color: #475569;
    &:hover { background: #f8fafc; }
  }

  .btn-primary {
    background: #dc2626;
    color: #ffffff;
    &:hover { background: #b91c1c; }
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 1024px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 576px) { grid-template-columns: 1fr; }
`;

const StatCard = styled.div`
  background: #ffffff;
  border-radius: 10px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  border-left: 4px solid ${props => props.color};
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);

  .stat-icon { font-size: 24px; }
  .stat-label {
    display: block;
    font-size: 12px;
    color: #64748b;
    font-weight: 500;
    text-transform: uppercase;
  }
  .stat-value {
    display: block;
    font-size: 24px;
    font-weight: 700;
    color: #0f172a;
  }
`;

const FilterBar = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;

  @media (max-width: 576px) {
    flex-direction: column;
  }
`;

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  flex: 1;
  min-width: 200px;

  svg { color: #94a3b8; flex-shrink: 0; }
  input {
    border: none;
    outline: none;
    font-size: 14px;
    color: #1e293b;
    width: 100%;
    background: transparent;
    &::placeholder { color: #94a3b8; }
  }
`;

const FilterSelect = styled.select`
  box-sizing: border-box;
  padding: 10px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14px;
  color: #1e293b;
  background: #ffffff;
  cursor: pointer;
  min-width: 150px;

  &:focus { outline: none; border-color: #2563eb; }
`;

const TableContainer = styled.div`
  background: #ffffff;
  border: 2px solid #94a3b8;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow-x: auto;

  .loading-state, .empty-state {
    text-align: center;
    padding: 40px;
    color: #64748b;
    
    span { font-size: 40px; display: block; margin-bottom: 8px; }
    p { font-size: 16px; margin: 0; }
    small { font-size: 13px; color: #94a3b8; }
  }

  table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;

    thead tr {
      background: #e2e8f0;
      border-bottom: 2px solid #cbd5e1;
      
      th {
        padding: 14px;
        color: #1e293b;
        font-weight: 800;
        font-size: 13px;
        text-transform: uppercase;
        white-space: nowrap;
      }
    }

    tbody tr {
      border-bottom: 1px solid #e2e8f0;
      &:hover { background: #f8fafc; }
      &:last-child { border-bottom: none; }
    }

    td {
      padding: 16px;
      font-size: 14px;
      color: #0f172a;
      vertical-align: middle;
    }

    .trip-id {
      font-weight: 900;
      font-size: 15px;
      color: #0f172a;
    }
    .client { font-weight: 600; color: #0f172a; }
    .driver { font-weight: 700; color: #0f172a; }
    .route { font-weight: 700; color: #334155; }
    .eta { font-weight: 500; color: #64748b; }
    .reason { font-weight: 800; color: #dc2626; }
  }
`;

const StatusBadge = styled.span`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => 
    props.status === 'Delayed' ? '#fef3c7' :
    props.status === 'Alert' ? '#fee2e2' :
    '#f1f5f9'
  };
  color: ${props => 
    props.status === 'Delayed' ? '#92400e' :
    props.status === 'Alert' ? '#991b1b' :
    '#475569'
  };
`;

const SeverityBadge = styled.span`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background-color: ${props => props.bgColor};
  color: ${props => props.textColor};
`;
