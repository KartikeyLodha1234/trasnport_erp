import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function AllShipments() {
  const [shipments, setShipments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState('asc');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [editFormData, setEditFormData] = useState({
    client: '',
    destination: '',
    driver_id: '',
    vehicle_id: '',
    status: '',
    eta: '',
    notes: '',
    weight: '',
    pickup_location: '',
    delivery_location: '',
    freight_charge: '',
    gst: '',
    payment_mode: ''
  });

  const API_BASE = 'http://localhost:8001/api';

  const fetchShipments = async () => {
    try {
      const response = await fetch(`${API_BASE}/shipments/`);
      const result = await response.json();
      const data = result.data || result;
      const shipmentsArray = Array.isArray(data) ? data : [];
      const sortedData = shipmentsArray.sort((a, b) => a.id - b.id);
      setShipments(sortedData);
    } catch (error) {
      console.error('Error fetching shipments:', error);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await fetch(`${API_BASE}/drivers/`);
      const result = await response.json();
      const data = result.data || result;
      setDrivers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await fetch(`${API_BASE}/vehicles/`);
      const result = await response.json();
      const data = result.data || result;
      setVehicles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  useEffect(() => {
    fetchShipments();
    fetchDrivers();
    fetchVehicles();
  }, []);

  const totalShipments = shipments.length;
  
  const deliveredCount = shipments.filter(s => 
    (s.status || '').toLowerCase() === 'delivered'
  ).length;
  
  const inTransitCount = shipments.filter(s => 
    ['in-transit', 'in transit', 'transit'].includes((s.status || '').toLowerCase())
  ).length;
  
  const pendingCount = shipments.filter(s => 
    ['pending', 'loading'].includes((s.status || '').toLowerCase())
  ).length;

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = 
      (shipment.lr_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (shipment.tracking_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (shipment.client || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (shipment.destination || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(shipment.id).includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || 
      (shipment.status || '').toLowerCase() === statusFilter.toLowerCase() ||
      (statusFilter === 'in-transit' && ['in transit', 'transit'].includes((shipment.status || '').toLowerCase())) ||
      (statusFilter === 'pending' && ['loading'].includes((shipment.status || '').toLowerCase()));
    
    return matchesSearch && matchesStatus;
  });

  const exportCurrentViewCSV = () => {
    if (filteredShipments.length === 0) { alert('No shipments to export!'); return; }
    try {
      const headers = ['ID', 'LR Number', 'Tracking ID', 'Client', 'Destination', 'Weight', 'Driver', 'Vehicle', 'Status', 'ETA', 'Freight', 'Payment Mode', 'Notes'];
      const rows = filteredShipments.map(shipment => {
        const driverName = getDriverName(shipment.driver_id);
        const vehicleInfo = getVehicleInfo(shipment.vehicle_id);
        const formattedDate = formatDate(shipment.eta);
        const status = getStatusColor(shipment.status).label;
        return [shipment.id, shipment.lr_number || 'N/A', shipment.tracking_id || 'N/A', shipment.client || 'N/A', shipment.destination || 'N/A', shipment.weight || 'N/A', driverName, vehicleInfo, status, formattedDate, `₹${shipment.freight_charge || 0}`, shipment.payment_mode || 'cash', shipment.notes || 'N/A'];
      });
      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.setAttribute('href', URL.createObjectURL(blob));
      link.setAttribute('download', `shipments_${new Date().toISOString().split('T')[0]}.csv`);
      link.click();
      URL.revokeObjectURL(link.href);
      setIsExportOpen(false);
    } catch (error) { alert('❌ Failed to export CSV'); }
  };

  const exportCurrentViewExcel = () => {
    if (filteredShipments.length === 0) { alert('No shipments to export!'); return; }
    try {
      const excelData = filteredShipments.map(shipment => ({
        'ID': shipment.id, 'LR Number': shipment.lr_number || 'N/A', 'Tracking ID': shipment.tracking_id || 'N/A',
        'Client': shipment.client || 'N/A', 'Destination': shipment.destination || 'N/A', 'Weight': shipment.weight || 'N/A',
        'Driver': getDriverName(shipment.driver_id), 'Vehicle': getVehicleInfo(shipment.vehicle_id),
        'Status': getStatusColor(shipment.status).label, 'ETA': formatDate(shipment.eta),
        'Freight': `₹${shipment.freight_charge || 0}`, 'GST': `${shipment.gst || 0}%`,
        'Payment': shipment.payment_mode || 'cash', 'Notes': shipment.notes || 'N/A'
      }));
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(wb, ws, 'Shipments');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.setAttribute('href', URL.createObjectURL(blob));
      link.setAttribute('download', `shipments_${new Date().toISOString().split('T')[0]}.xlsx`);
      link.click();
      URL.revokeObjectURL(link.href);
      setIsExportOpen(false);
    } catch (error) { alert('❌ Failed to export Excel'); }
  };

  const exportCurrentViewPDF = () => {
    if (filteredShipments.length === 0) { alert('No shipments to export!'); return; }
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');
      doc.setFontSize(20); doc.setTextColor(37, 99, 235);
      doc.text('Shipment Report', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
      const tableHeaders = ['ID', 'LR Number', 'Client', 'Destination', 'Driver', 'Status', 'ETA', 'Freight'];
      const tableRows = filteredShipments.map(shipment => [
        shipment.id, shipment.lr_number || 'N/A', shipment.client || 'N/A', shipment.destination || 'N/A',
        getDriverName(shipment.driver_id), getStatusColor(shipment.status).label, formatDate(shipment.eta), `₹${shipment.freight_charge || 0}`
      ]);
      doc.autoTable({ startY: 40, head: [tableHeaders], body: tableRows, theme: 'striped', headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontSize: 9 }, bodyStyles: { fontSize: 8 }, margin: { left: 14, right: 14 } });
      doc.save(`shipments_${new Date().toISOString().split('T')[0]}.pdf`);
      setIsExportOpen(false);
    } catch (error) { alert('❌ Failed to export PDF'); }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleSort = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    setShipments([...shipments].sort((a, b) => newOrder === 'asc' ? a.id - b.id : b.id - a.id));
  };

  const handleUpdateShipment = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cleanedData = {};
      for (const [key, value] of Object.entries(editFormData)) {
        if (value === '' || value === undefined) {
          cleanedData[key] = null;
        } else {
          cleanedData[key] = value;
        }
      }

      const response = await fetch(`${API_BASE}/shipments/${selectedShipment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedData)
      });
      if (response.ok) {
        alert('✅ Shipment updated successfully!');
        setIsEditModalOpen(false);
        fetchShipments();
      } else {
        const result = await response.json();
        alert(`❌ Error: ${result.message || result.detail}`);
      }
    } catch (error) {
      alert('❌ Failed to update shipment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShipment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this shipment?')) return;
    try {
      const response = await fetch(`${API_BASE}/shipments/${id}`, { method: 'DELETE' });
      if (response.ok) {
        alert('✅ Shipment deleted successfully');
        fetchShipments();
      } else {
        const result = await response.json();
        alert(`❌ Error: ${result.message || result.detail}`);
      }
    } catch (error) {
      alert('❌ Failed to delete shipment');
    }
  };

  const viewChallan = (shipment) => {
    alert(`📄 Challan Details\n\nLR Number: ${shipment.lr_number || 'N/A'}\nClient: ${shipment.client || 'N/A'}\nDestination: ${shipment.destination || 'N/A'}\nPickup: ${shipment.pickup_location || 'N/A'}\nDelivery: ${shipment.delivery_location || 'N/A'}\nWeight: ${shipment.weight || 'N/A'} kg\nFreight: ₹${shipment.freight_charge || 0}\nPayment: ${shipment.payment_mode || 'N/A'}\nStatus: ${shipment.status || 'Pending'}`);
  };

  const downloadChallan = (shipment) => {
    const url = `${API_BASE}/shipments/${shipment.id}/challan-pdf`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.download = `Challan_${shipment.lr_number || shipment.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getDriverName = (driverId) => {
    const driver = drivers.find(d => d.id === driverId || d.id === parseInt(driverId));
    return driver ? driver.full_name : 'Not Assigned';
  };

  const getVehicleInfo = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId || v.id === parseInt(vehicleId));
    return vehicle ? `${vehicle.vehicle_id} - ${vehicle.license_plate || ''}` : 'Not Assigned';
  };

  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    const colors = {
      'delivered': { bg: '#dcfce7', color: '#166534', label: 'Delivered' },
      'in-transit': { bg: '#dbeafe', color: '#1e40af', label: 'In Transit' },
      'in transit': { bg: '#dbeafe', color: '#1e40af', label: 'In Transit' },
      'transit': { bg: '#dbeafe', color: '#1e40af', label: 'In Transit' },
      'pending': { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
      'loading': { bg: '#f1f5f9', color: '#475569', label: 'Loading' },
      'delayed': { bg: '#fee2e2', color: '#991b1b', label: 'Delayed' }
    };
    return colors[s] || { bg: '#f1f5f9', color: '#475569', label: status || 'Pending' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try { return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return dateString; }
  };

  const openEditModal = (shipment) => {
    setSelectedShipment(shipment);
    setEditFormData({
      client: shipment.client || '',
      destination: shipment.destination || '',
      driver_id: shipment.driver_id || '',
      vehicle_id: shipment.vehicle_id || '',
      status: shipment.status || 'pending',
      eta: shipment.eta ? shipment.eta.substring(0, 16) : '',
      notes: shipment.notes || '',
      weight: shipment.weight || '',
      pickup_location: shipment.pickup_location || '',
      delivery_location: shipment.delivery_location || '',
      freight_charge: shipment.freight_charge || '',
      gst: shipment.gst || '',
      payment_mode: shipment.payment_mode || 'cash'
    });
    setIsEditModalOpen(true);
  };

  return (
    <PageWrapper>
      <HeaderSection>
        <div>
          <h1>🚚 Shipment Operations</h1>
          <p>Assign drivers, update status, and track all consignments.</p>
        </div>
        <ActionButtons>
          <div className="export-wrapper">
            <button className="btn-export" onClick={() => setIsExportOpen(!isExportOpen)}>📊 Export</button>
            {isExportOpen && (
              <ExportDropdown>
                <ExportDropdownItem onClick={exportCurrentViewCSV}><span>📄</span><div><strong>CSV</strong><small>{filteredShipments.length} records</small></div></ExportDropdownItem>
                <ExportDropdownItem onClick={exportCurrentViewExcel}><span>📊</span><div><strong>Excel</strong><small>{filteredShipments.length} records</small></div></ExportDropdownItem>
                <ExportDropdownItem onClick={exportCurrentViewPDF}><span>📑</span><div><strong>PDF</strong><small>{filteredShipments.length} records</small></div></ExportDropdownItem>
              </ExportDropdown>
            )}
          </div>
          <button className="btn-refresh" onClick={fetchShipments}>🔄 Refresh</button>
        </ActionButtons>
      </HeaderSection>

      <StatsGrid>
        <StatCard><div className="icon" style={{ background: '#eff6ff', color: '#2563eb' }}>📦</div><div><div className="label">Total LRs</div><div className="value">{totalShipments}</div></div></StatCard>
        <StatCard><div className="icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>✅</div><div><div className="label">Delivered</div><div className="value">{deliveredCount}</div></div></StatCard>
        <StatCard><div className="icon" style={{ background: '#dbeafe', color: '#2563eb' }}>🚚</div><div><div className="label">In Transit</div><div className="value">{inTransitCount}</div></div></StatCard>
        <StatCard><div className="icon" style={{ background: '#fef3c7', color: '#d97706' }}>⏳</div><div><div className="label">Pending</div><div className="value">{pendingCount}</div></div></StatCard>
      </StatsGrid>

      <FilterSection>
        <SearchInput type="text" placeholder="🔍 Search by LR No, Client, or Destination..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="loading">Loading</option>
          <option value="in-transit">In Transit</option>
          <option value="delayed">Delayed</option>
          <option value="delivered">Delivered</option>
        </FilterSelect>
        <FilterCount>{filteredShipments.length} of {totalShipments} shipments</FilterCount>
      </FilterSection>

      <TableCard>
        <div className="card-header">
          <h2>📋 All Consignments</h2>
          <div className="card-actions">
            <button className="btn-sort" onClick={toggleSort}>Sort {sortOrder === 'asc' ? '↑' : '↓'}</button>
            <span className="count">{filteredShipments.length} shipments</span>
          </div>
        </div>
        <TableWrapper>
          <Table>
            <thead>
              <tr>
                <th onClick={toggleSort} style={{ cursor: 'pointer' }}>ID {sortOrder === 'asc' ? '↑' : '↓'}</th>
                <th>LR Number</th>
                <th>Client</th>
                <th>Destination</th>
                <th>Driver</th>
                <th>Vehicle</th>
                <th>Status</th>
                <th>ETA</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.length === 0 ? (
                <tr><td colSpan="9" className="empty-state">{shipments.length === 0 ? 'No consignments yet. Go to Create LR to book new shipments!' : 'No shipments match your filters'}</td></tr>
              ) : (
                filteredShipments.map((shipment) => {
                  const status = getStatusColor(shipment.status);
                  return (
                    <tr key={shipment.id}>
                      <td className="id">#{shipment.id}</td>
                      <td className="lr-number">{shipment.lr_number || 'N/A'}</td>
                      <td className="client">{shipment.client || 'N/A'}</td>
                      <td>{shipment.destination || 'N/A'}</td>
                      <td>{getDriverName(shipment.driver_id)}</td>
                      <td>{getVehicleInfo(shipment.vehicle_id)}</td>
                      <td><StatusBadge bg={status.bg} color={status.color}>{status.label}</StatusBadge></td>
                      <td>{formatDate(shipment.eta)}</td>
                      <td>
                        <ActionButtonsRow>
                          <button className="btn-challan" onClick={() => viewChallan(shipment)} title="View">📄</button>
                          <button className="btn-pdf" onClick={() => downloadChallan(shipment)} title="Download PDF">⬇️</button>
                          <button className="btn-view" onClick={() => { setSelectedShipment(shipment); setIsViewModalOpen(true); }} title="View Details">👁️</button>
                          <button className="btn-edit" onClick={() => openEditModal(shipment)} title="Edit">✏️</button>
                          <button className="btn-delete" onClick={() => handleDeleteShipment(shipment.id)} title="Delete">🗑️</button>
                        </ActionButtonsRow>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </TableWrapper>
      </TableCard>

      {isEditModalOpen && selectedShipment && (
        <ModalOverlay onClick={() => setIsEditModalOpen(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader><h5>✏️ Manage Shipment #{selectedShipment.id}</h5><button className="btn-close" onClick={() => setIsEditModalOpen(false)}>✕</button></ModalHeader>
            <ModalBody>
              <form onSubmit={handleUpdateShipment}>
                <FormRow>
                  <FormGroup><label>👤 Assign Driver</label><select name="driver_id" value={editFormData.driver_id} onChange={handleEditChange}><option value="">Select driver...</option>{drivers.map((driver) => (<option key={driver.id} value={driver.id}>{driver.full_name}</option>))}</select></FormGroup>
                  <FormGroup><label>🚛 Assign Vehicle</label><select name="vehicle_id" value={editFormData.vehicle_id} onChange={handleEditChange}><option value="">Select vehicle...</option>{vehicles.map((vehicle) => (<option key={vehicle.id} value={vehicle.id}>{vehicle.vehicle_id} - {vehicle.license_plate || ''}</option>))}</select></FormGroup>
                </FormRow>
                <FormRow>
                  <FormGroup><label>📊 Update Status</label><select name="status" value={editFormData.status} onChange={handleEditChange}><option value="pending">Pending</option><option value="loading">Loading</option><option value="in-transit">In Transit</option><option value="delayed">Delayed</option><option value="delivered">Delivered</option></select></FormGroup>
                  <FormGroup><label>⏰ ETA</label><input type="datetime-local" name="eta" value={editFormData.eta} onChange={handleEditChange} /></FormGroup>
                </FormRow>
                <FormRow><FormGroup fullWidth><label>📝 Notes</label><textarea name="notes" rows="2" value={editFormData.notes} onChange={handleEditChange} /></FormGroup></FormRow>
                <InfoBox><strong>📋 Shipment Info:</strong><span>Client: {editFormData.client || 'N/A'}</span><span>Destination: {editFormData.destination || 'N/A'}</span><span>Pickup: {editFormData.pickup_location || 'N/A'} → Delivery: {editFormData.delivery_location || 'N/A'}</span><span>Weight: {editFormData.weight || 'N/A'} kg | Freight: ₹{editFormData.freight_charge || 0}</span></InfoBox>
                <ModalFooter><button type="button" className="btn-cancel" onClick={() => setIsEditModalOpen(false)}>Cancel</button><button type="submit" className="btn-submit" disabled={loading}>{loading ? 'Updating...' : '✅ Update'}</button></ModalFooter>
              </form>
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}

      {isViewModalOpen && selectedShipment && (
        <ModalOverlay onClick={() => setIsViewModalOpen(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <ModalHeader><h5>📋 Consignment Details</h5><button className="btn-close" onClick={() => setIsViewModalOpen(false)}>✕</button></ModalHeader>
            <ViewModalBody>
              <ViewGrid>
                <ViewItem><label>Shipment ID</label><span className="id">#{selectedShipment.id}</span></ViewItem>
                <ViewItem><label>LR Number</label><span className="lr">{selectedShipment.lr_number || 'N/A'}</span></ViewItem>
                <ViewItem><label>Status</label><StatusBadge bg={getStatusColor(selectedShipment.status).bg} color={getStatusColor(selectedShipment.status).color}>{getStatusColor(selectedShipment.status).label}</StatusBadge></ViewItem>
                <ViewItem><label>🏢 Client</label><span>{selectedShipment.client || 'N/A'}</span></ViewItem>
                <ViewItem><label>📍 Destination</label><span>{selectedShipment.destination || 'N/A'}</span></ViewItem>
                <ViewItem><label>📍 Pickup</label><span>{selectedShipment.pickup_location || 'N/A'}</span></ViewItem>
                <ViewItem><label>📍 Delivery</label><span>{selectedShipment.delivery_location || 'N/A'}</span></ViewItem>
                <ViewItem><label>👤 Driver</label><span>{getDriverName(selectedShipment.driver_id)}</span></ViewItem>
                <ViewItem><label>🚛 Vehicle</label><span>{getVehicleInfo(selectedShipment.vehicle_id)}</span></ViewItem>
                <ViewItem><label>📦 Weight</label><span>{selectedShipment.weight || 'N/A'} kg</span></ViewItem>
                <ViewItem><label>⏰ ETA</label><span>{formatDate(selectedShipment.eta)}</span></ViewItem>
                <ViewItem><label>💰 Freight</label><span>₹{selectedShipment.freight_charge || 0}</span></ViewItem>
                <ViewItem><label>💳 Payment</label><span>{selectedShipment.payment_mode || 'cash'}</span></ViewItem>
                <ViewItem fullWidth><label>📝 Notes</label><p className="notes">{selectedShipment.notes || 'No notes'}</p></ViewItem>
              </ViewGrid>
              <ViewModalFooter>
                <button className="btn-cancel" onClick={() => setIsViewModalOpen(false)}>Close</button>
                <button className="btn-challan-view" onClick={() => { viewChallan(selectedShipment); }}>📄 View</button>
                <button className="btn-pdf-download" onClick={() => { downloadChallan(selectedShipment); }}>⬇️ PDF</button>
                <button className="btn-edit" onClick={() => { setIsViewModalOpen(false); openEditModal(selectedShipment); }}>✏️ Manage</button>
              </ViewModalFooter>
            </ViewModalBody>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageWrapper>
  );
}

// ==================== STYLED COMPONENTS ====================

const PageWrapper = styled.div`max-width:1400px;margin:0 auto;padding:24px;background:#f8fafc;min-height:100vh;font-family:sans-serif;`;
const HeaderSection = styled.div`display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:16px;h1{font-size:28px;font-weight:700;color:#0f172a;margin:0;}p{color:#64748b;margin:4px 0 0 0;font-size:14px;}`;
const ActionButtons = styled.div`display:flex;gap:12px;align-items:center;.export-wrapper{position:relative;}.btn-export{padding:10px 20px;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;background:white;color:#475569;border:1px solid #e2e8f0;&:hover{background:#f8fafc;}}.btn-refresh{padding:10px 20px;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;background:white;color:#475569;border:1px solid #e2e8f0;&:hover{background:#f8fafc;}}`;
const ExportDropdown = styled.div`position:absolute;top:calc(100% + 8px);right:0;background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.15);min-width:220px;z-index:1000;overflow:hidden;`;
const ExportDropdownItem = styled.button`display:flex;align-items:center;gap:12px;padding:12px 16px;width:100%;background:none;border:none;cursor:pointer;text-align:left;font-family:inherit;&:hover{background:#f1f5f9;}span{font-size:20px;}div{strong{font-size:14px;color:#1e293b;}small{font-size:11px;color:#94a3b8;}}`;
const FilterSection = styled.div`display:flex;gap:16px;margin-bottom:20px;flex-wrap:wrap;align-items:center;`;
const SearchInput = styled.input`flex:1;min-width:200px;padding:10px 14px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;outline:none;&:focus{border-color:#2563eb;}`;
const FilterSelect = styled.select`padding:10px 14px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;outline:none;cursor:pointer;`;
const FilterCount = styled.span`font-size:13px;color:#94a3b8;margin-left:auto;`;
const StatsGrid = styled.div`display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;`;
const StatCard = styled.div`background:white;border:1px solid #e2e8f0;border-radius:12px;padding:16px 20px;display:flex;align-items:center;gap:16px;.icon{width:44px;height:44px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px;}.label{font-size:13px;color:#64748b;}.value{font-size:24px;font-weight:700;color:#0f172a;}`;
const TableCard = styled.div`background:white;border:1px solid #e2e8f0;border-radius:12px;padding:20px;overflow:hidden;.card-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;h2{font-size:18px;font-weight:600;color:#1e293b;margin:0;}.card-actions{display:flex;align-items:center;gap:12px;.btn-sort{padding:4px 12px;border:1px solid #e2e8f0;border-radius:4px;background:white;cursor:pointer;font-size:12px;color:#475569;&:hover{background:#f8fafc;}}.count{font-size:13px;color:#94a3b8;}}}`;
const TableWrapper = styled.div`overflow-x:auto;`;
const Table = styled.table`width:100%;border-collapse:collapse;font-size:13px;thead{background:#f8fafc;border-bottom:2px solid #e2e8f0;th{padding:10px 12px;text-align:left;font-weight:600;color:#475569;font-size:11px;text-transform:uppercase;}}tbody{tr{border-bottom:1px solid #f1f5f9;&:hover{background:#f8fafc;}}td{padding:10px 12px;color:#1e293b;}.id{font-family:monospace;font-weight:600;color:#2563eb;}.lr-number{font-family:monospace;font-weight:700;color:#0f172a;}.client{font-weight:500;}.empty-state{text-align:center;color:#94a3b8;padding:40px!important;font-size:14px;}}`;
const StatusBadge = styled.span`padding:4px 10px;border-radius:9999px;font-size:11px;font-weight:600;background:${p=>p.bg||'#f1f5f9'};color:${p=>p.color||'#475569'};`;
const ActionButtonsRow = styled.div`display:flex;gap:2px;button{padding:4px 7px;border:none;border-radius:4px;cursor:pointer;font-size:12px;background:transparent;}.btn-challan{color:#2563eb;background:#eff6ff;&:hover{background:#dbeafe;}}.btn-pdf{color:#d97706;background:#fef3c7;&:hover{background:#fde68a;}}.btn-view{color:#2563eb;&:hover{background:#eff6ff;}}.btn-edit{color:#d97706;&:hover{background:#fffbeb;}}.btn-delete{color:#dc2626;&:hover{background:#fef2f2;}}`;
const ModalOverlay = styled.div`position:fixed;inset:0;background:rgba(15,23,42,0.5);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:2000;padding:16px;`;
const ModalContent = styled.div`background:#fff;border-radius:12px;width:100%;max-width:650px;max-height:90vh;overflow:hidden;display:flex;flex-direction:column;`;
const ModalHeader = styled.div`padding:16px 20px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;h5{font-size:18px;font-weight:600;margin:0;}.btn-close{background:none;border:none;color:#94a3b8;font-size:20px;cursor:pointer;&:hover{color:#475569;}}`;
const ModalBody = styled.div`padding:20px;overflow-y:auto;max-height:60vh;`;
const FormRow = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;`;
const FormGroup = styled.div`display:flex;flex-direction:column;${p=>p.fullWidth&&'grid-column:1/-1;'}label{font-size:13px;font-weight:500;color:#475569;margin-bottom:6px;}input,select,textarea{width:100%;padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;outline:none;box-sizing:border-box;&:focus{border-color:#2563eb;}}textarea{resize:vertical;min-height:50px;}`;
const InfoBox = styled.div`background:#f0f4ff;border:1px solid #c5d5ff;border-radius:8px;padding:12px 14px;margin-bottom:16px;display:flex;flex-direction:column;gap:4px;font-size:13px;strong{color:#2563eb;}span{color:#475569;}`;
const ModalFooter = styled.div`padding:14px 20px;border-top:1px solid #e2e8f0;display:flex;justify-content:flex-end;gap:12px;background:#f8fafc;button{padding:10px 20px;font-size:14px;font-weight:500;border-radius:8px;cursor:pointer;border:none;&:disabled{opacity:0.6;cursor:not-allowed;}}.btn-cancel{background:#f1f5f9;color:#475569;&:hover{background:#e2e8f0;}}.btn-submit{background:#2563eb;color:#fff;&:hover{background:#1d4ed8;}}`;
const ViewModalBody = styled.div`padding:20px;overflow-y:auto;max-height:60vh;`;
const ViewGrid = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:14px;`;
const ViewItem = styled.div`display:flex;flex-direction:column;gap:4px;${p=>p.fullWidth&&'grid-column:1/-1;'}label{font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;}span,.notes{font-size:14px;color:#0f172a;}.id{font-family:monospace;font-size:16px;color:#2563eb;font-weight:600;}.lr{font-family:monospace;font-size:14px;color:#0f172a;font-weight:700;}.notes{background:#f8fafc;padding:10px 12px;border-radius:6px;border:1px solid #f1f5f9;margin:0;color:#475569;}`;
const ViewModalFooter = styled.div`padding:16px 0 0 0;border-top:1px solid #e2e8f0;display:flex;justify-content:flex-end;gap:12px;margin-top:16px;button{padding:10px 20px;font-size:14px;font-weight:600;border-radius:8px;cursor:pointer;border:none;}.btn-cancel{background:#f1f5f9;color:#475569;&:hover{background:#e2e8f0;}}.btn-challan-view{background:#eff6ff;color:#2563eb;&:hover{background:#dbeafe;}}.btn-pdf-download{background:#fef3c7;color:#d97706;&:hover{background:#fde68a;}}.btn-edit{background:#fef3c7;color:#d97706;&:hover{background:#fde68a;}}`;