import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function AllShipments() {
  const [shipments, setShipments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState('asc');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [formData, setFormData] = useState({
    client: '',
    destination: '',
    driver_id: '',
    vehicle_id: '',
    status: 'pending',
    eta: '',
    notes: '',
    weight: '',
    pickup_location: '',
    delivery_location: '',
    freight_charge: '',
    gst: '18',
    payment_mode: 'cash'
  });

  const [editFormData, setEditFormData] = useState({
    id: '',
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

  const API_BASE = 'http://localhost:5000/api';

  // ==================== FETCH DATA ====================

  const fetchShipments = async () => {
    try {
      const response = await fetch(`${API_BASE}/shipments`);
      const result = await response.json();
      if (result.success) {
        const sortedData = (result.data || []).sort((a, b) => a.id - b.id);
        setShipments(sortedData);
      }
    } catch (error) {
      console.error('Error fetching shipments:', error);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await fetch(`${API_BASE}/drivers`);
      const result = await response.json();
      if (result.success) {
        setDrivers(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await fetch(`${API_BASE}/vehicles`);
      const result = await response.json();
      if (result.success || Array.isArray(result)) {
        setVehicles(result.data || result || []);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  useEffect(() => {
    fetchShipments();
    fetchDrivers();
    fetchVehicles();
  }, []);

  // ==================== STATS CALCULATION ====================
  
  const totalShipments = shipments.length;
  
  const deliveredCount = shipments.filter(s => 
    s.status === 'delivered' || s.status === 'Delivered'
  ).length;
  
  const inTransitCount = shipments.filter(s => 
    s.status === 'in-transit' || s.status === 'In Transit' || s.status === 'transit'
  ).length;
  
  const pendingCount = shipments.filter(s => 
    s.status === 'pending' || s.status === 'Pending' || 
    s.status === 'loading' || s.status === 'Loading'
  ).length;

  // ==================== FILTERED SHIPMENTS ====================
  
  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = 
      (shipment.tracking_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (shipment.client || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (shipment.destination || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(shipment.id).includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || 
      shipment.status === statusFilter ||
      (statusFilter === 'delivered' && shipment.status === 'Delivered') ||
      (statusFilter === 'in-transit' && (shipment.status === 'In Transit' || shipment.status === 'transit')) ||
      (statusFilter === 'pending' && (shipment.status === 'Pending' || shipment.status === 'loading' || shipment.status === 'Loading'));
    
    return matchesSearch && matchesStatus;
  });

  // ==================== EXPORT FUNCTIONS ====================

  const exportCurrentViewCSV = () => {
    if (filteredShipments.length === 0) {
      alert('No shipments to export!');
      return;
    }

    try {
      const headers = ['ID', 'Tracking ID', 'Client', 'Destination', 'Weight', 'Driver', 'Vehicle', 'Status', 'ETA', 'Freight', 'Payment Mode', 'Notes'];
      
      const rows = filteredShipments.map(shipment => {
        const driverName = getDriverName(shipment.driver_id);
        const vehicleInfo = getVehicleInfo(shipment.vehicle_id);
        const formattedDate = formatDate(shipment.eta);
        const status = getStatusColor(shipment.status).label;
        
        return [
          shipment.id,
          shipment.tracking_id || 'N/A',
          shipment.client || 'N/A',
          shipment.destination || 'N/A',
          shipment.weight || 'N/A',
          driverName,
          vehicleInfo,
          status,
          formattedDate,
          `₹${shipment.freight_charge || 0}`,
          shipment.payment_mode || 'cash',
          shipment.notes || 'N/A'
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `shipments_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert(`✅ ${filteredShipments.length} shipments exported to CSV!`);
      setIsExportOpen(false);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('❌ Failed to export CSV: ' + error.message);
    }
  };

  const exportCurrentViewExcel = () => {
    if (filteredShipments.length === 0) {
      alert('No shipments to export!');
      return;
    }

    try {
      const excelData = filteredShipments.map(shipment => ({
        'ID': shipment.id,
        'Tracking ID': shipment.tracking_id || 'N/A',
        'Client': shipment.client || 'N/A',
        'Destination': shipment.destination || 'N/A',
        'Weight': shipment.weight || 'N/A',
        'Driver': getDriverName(shipment.driver_id),
        'Vehicle': getVehicleInfo(shipment.vehicle_id),
        'Status': getStatusColor(shipment.status).label,
        'Expected Delivery': formatDate(shipment.eta),
        'Freight Charge': `₹${shipment.freight_charge || 0}`,
        'GST': `${shipment.gst || 0}%`,
        'Payment Mode': shipment.payment_mode || 'cash',
        'Notes': shipment.notes || 'N/A'
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      ws['!cols'] = [
        { wch: 10 }, { wch: 18 }, { wch: 25 }, { wch: 25 }, { wch: 12 },
        { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 15 },
        { wch: 10 }, { wch: 15 }, { wch: 30 }
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'Shipments');

      const summaryData = [
        ['📊 SHIPMENT REPORT'],
        [''],
        ['Generated On:', new Date().toLocaleString()],
        ['Filter Applied:', statusFilter !== 'all' ? statusFilter : 'All'],
        ['Search:', searchTerm || 'None'],
        [''],
        ['Metric', 'Value'],
        ['Total Shipments', shipments.length],
        ['Filtered Shipments', filteredShipments.length],
        ['Delivered', deliveredCount],
        ['In Transit', inTransitCount],
        ['Pending', pendingCount]
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      wsSummary['!cols'] = [{ wch: 30 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `shipments_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert(`✅ ${filteredShipments.length} shipments exported to Excel!`);
      setIsExportOpen(false);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('❌ Failed to export Excel: ' + error.message);
    }
  };

  const exportCurrentViewPDF = () => {
    if (filteredShipments.length === 0) {
      alert('No shipments to export!');
      return;
    }

    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      
      doc.setFontSize(20);
      doc.setTextColor(37, 99, 235);
      doc.text('📦 Shipment Report', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 28, { align: 'center' });
      doc.text(`Filter: ${statusFilter !== 'all' ? statusFilter : 'All'} | Search: ${searchTerm || 'None'}`, pageWidth / 2, 34, { align: 'center' });
      
      const tableHeaders = ['ID', 'Tracking ID', 'Client', 'Destination', 'Weight', 'Driver', 'Status', 'ETA', 'Freight'];
      const tableRows = filteredShipments.map(shipment => [
        shipment.id,
        shipment.tracking_id || 'N/A',
        shipment.client || 'N/A',
        shipment.destination || 'N/A',
        shipment.weight || 'N/A',
        getDriverName(shipment.driver_id),
        getStatusColor(shipment.status).label,
        formatDate(shipment.eta),
        `₹${shipment.freight_charge || 0}`
      ]);

      doc.autoTable({
        startY: 40,
        head: [tableHeaders],
        body: tableRows,
        theme: 'striped',
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold'
        },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 }
      });

      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Total: ${filteredShipments.length} shipments • ${new Date().getFullYear()} Fleet Management`,
        pageWidth / 2,
        finalY,
        { align: 'center' }
      );

      doc.save(`shipments_${new Date().toISOString().split('T')[0]}.pdf`);
      alert(`✅ ${filteredShipments.length} shipments exported to PDF!`);
      setIsExportOpen(false);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('❌ Failed to export PDF: ' + error.message);
    }
  };

  // ==================== FORM HANDLERS ====================

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  // ==================== SORT FUNCTION ====================

  const toggleSort = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    const sorted = [...shipments].sort((a, b) => {
      return newOrder === 'asc' ? a.id - b.id : b.id - a.id;
    });
    setShipments(sorted);
  };

  // ==================== CRUD OPERATIONS ====================

  const handleCreateShipment = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/shipments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Shipment created successfully!');
        setIsModalOpen(false);
        fetchShipments();
        setFormData({
          client: '',
          destination: '',
          driver_id: '',
          vehicle_id: '',
          status: 'pending',
          eta: '',
          notes: '',
          weight: '',
          pickup_location: '',
          delivery_location: '',
          freight_charge: '',
          gst: '18',
          payment_mode: 'cash'
        });
      } else {
        alert(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error creating shipment:', error);
      alert('❌ Failed to create shipment');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateShipment = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/shipments/${editFormData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Shipment updated successfully!');
        setIsEditModalOpen(false);
        fetchShipments();
      } else {
        alert(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error updating shipment:', error);
      alert('❌ Failed to update shipment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShipment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this shipment?')) return;

    try {
      const response = await fetch(`${API_BASE}/shipments/${id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (result.success) {
        alert('✅ Shipment deleted successfully');
        fetchShipments();
      } else {
        alert(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error deleting shipment:', error);
      alert('❌ Failed to delete shipment');
    }
  };

  // ==================== CHALLAN FUNCTIONS ====================

  const viewChallan = (shipment) => {
    window.open(`${API_BASE}/shipments/${shipment.id}/challan-preview`, '_blank');
  };

  const downloadChallan = (shipment) => {
    window.open(`${API_BASE}/shipments/${shipment.id}/challan`, '_blank');
  };

  // ==================== HELPERS ====================

  const getDriverName = (driverId) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver ? driver.full_name : 'Not Assigned';
  };

  const getVehicleInfo = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.vehicle_id}` : 'Not Assigned';
  };

  const getStatusColor = (status) => {
    const colors = {
      'delivered': { bg: '#dcfce7', color: '#166534', label: 'Delivered' },
      'Delivered': { bg: '#dcfce7', color: '#166534', label: 'Delivered' },
      'in-transit': { bg: '#dbeafe', color: '#1e40af', label: 'In Transit' },
      'In Transit': { bg: '#dbeafe', color: '#1e40af', label: 'In Transit' },
      'transit': { bg: '#dbeafe', color: '#1e40af', label: 'In Transit' },
      'pending': { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
      'Pending': { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
      'loading': { bg: '#f1f5f9', color: '#475569', label: 'Loading' },
      'Loading': { bg: '#f1f5f9', color: '#475569', label: 'Loading' },
      'delayed': { bg: '#fef3c7', color: '#92400e', label: 'Delayed' },
      'Delayed': { bg: '#fef3c7', color: '#92400e', label: 'Delayed' }
    };
    return colors[status] || colors['pending'];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
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

  const openEditModal = (shipment) => {
    setSelectedShipment(shipment);
    setEditFormData({
      id: shipment.id,
      client: shipment.client || '',
      destination: shipment.destination || '',
      driver_id: shipment.driver_id || '',
      vehicle_id: shipment.vehicle_id || '',
      status: shipment.status || 'pending',
      eta: shipment.eta || '',
      notes: shipment.notes || '',
      weight: shipment.weight || '',
      pickup_location: shipment.pickup_location || '',
      delivery_location: shipment.delivery_location || '',
      freight_charge: shipment.freight_charge || '',
      gst: shipment.gst || '18',
      payment_mode: shipment.payment_mode || 'cash'
    });
    setIsEditModalOpen(true);
  };

  // ==================== RENDER ====================

  return (
    <PageWrapper>
      {/* Header */}
      <HeaderSection>
        <div>
          <h1>📦 All Cargo Shipments</h1>
          <p>Track, audit, and dispatch system-wide freight transactions.</p>
        </div>
        <ActionButtons>
          <div className="export-wrapper">
            <button 
              className="btn-export" 
              onClick={() => setIsExportOpen(!isExportOpen)}
            >
              📊 Export
            </button>
            {isExportOpen && (
              <ExportDropdown>
                <ExportDropdownItem onClick={exportCurrentViewCSV}>
                  <span>📄</span>
                  <div>
                    <strong>CSV</strong>
                    <small>{filteredShipments.length} records</small>
                  </div>
                </ExportDropdownItem>
                <ExportDropdownItem onClick={exportCurrentViewExcel}>
                  <span>📊</span>
                  <div>
                    <strong>Excel (.xlsx)</strong>
                    <small>{filteredShipments.length} records</small>
                  </div>
                </ExportDropdownItem>
                <ExportDropdownItem onClick={exportCurrentViewPDF}>
                  <span>📑</span>
                  <div>
                    <strong>PDF</strong>
                    <small>{filteredShipments.length} records</small>
                  </div>
                </ExportDropdownItem>
              </ExportDropdown>
            )}
          </div>
          
          <button className="btn-refresh" onClick={fetchShipments}>
            🔄 Refresh
          </button>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            + New Shipment
          </button>
        </ActionButtons>
      </HeaderSection>

      {/* Stats */}
      <StatsGrid>
        <StatCard>
          <div className="icon" style={{ background: '#eff6ff', color: '#2563eb' }}>📦</div>
          <div>
            <div className="label">Total</div>
            <div className="value">{totalShipments}</div>
          </div>
        </StatCard>
        
        <StatCard>
          <div className="icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>✅</div>
          <div>
            <div className="label">Delivered</div>
            <div className="value">{deliveredCount}</div>
          </div>
        </StatCard>
        
        <StatCard>
          <div className="icon" style={{ background: '#dbeafe', color: '#2563eb' }}>🚚</div>
          <div>
            <div className="label">In Transit</div>
            <div className="value">{inTransitCount}</div>
          </div>
        </StatCard>
        
        <StatCard>
          <div className="icon" style={{ background: '#fef3c7', color: '#d97706' }}>⏳</div>
          <div>
            <div className="label">Pending</div>
            <div className="value">{pendingCount}</div>
          </div>
        </StatCard>
      </StatsGrid>

      {/* Search & Filter */}
      <FilterSection>
        <SearchInput
          type="text"
          placeholder="🔍 Search by Tracking ID, Client, or Destination..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <FilterSelect
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="delivered">Delivered</option>
          <option value="in-transit">In Transit</option>
          <option value="pending">Pending</option>
          <option value="loading">Loading</option>
          <option value="delayed">Delayed</option>
        </FilterSelect>
        <FilterCount>
          {filteredShipments.length} of {totalShipments} shipments
        </FilterCount>
      </FilterSection>

      {/* Shipments Table */}
      <TableCard>
        <div className="card-header">
          <h2>📋 Recent Shipments</h2>
          <div className="card-actions">
            <button className="btn-sort" onClick={toggleSort}>
              Sort {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
            <span className="count">{filteredShipments.length} shipments</span>
          </div>
        </div>

        <TableWrapper>
          <Table>
            <thead>
              <tr>
                <th onClick={toggleSort} style={{ cursor: 'pointer' }}>
                  ID {sortOrder === 'asc' ? '↑' : '↓'}
                </th>
                <th>Tracking ID</th>
                <th>Client</th>
                <th>Destination</th>
                <th>Weight</th>
                <th>Status</th>
                <th>ETA</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-state">
                    {shipments.length === 0 ? 'No shipments found. Create a new shipment!' : 'No shipments match your filters'}
                  </td>
                </tr>
              ) : (
                filteredShipments.map((shipment) => {
                  const status = getStatusColor(shipment.status);
                  return (
                    <tr key={shipment.id}>
                      <td className="id">#{shipment.id}</td>
                      <td className="tracking-id">{shipment.tracking_id || 'N/A'}</td>
                      <td className="client">{shipment.client || 'N/A'}</td>
                      <td>{shipment.destination || 'N/A'}</td>
                      <td>{shipment.weight || 'N/A'} kg</td>
                      <td>
                        <StatusBadge bg={status.bg} color={status.color}>
                          {status.label}
                        </StatusBadge>
                      </td>
                      <td>{formatDate(shipment.eta)}</td>
                      <td>
                        <ActionButtons>
                          <button 
                            className="btn-challan" 
                            onClick={() => viewChallan(shipment)}
                            title="View Challan"
                          >
                            📄
                          </button>
                          <button 
                            className="btn-pdf" 
                            onClick={() => downloadChallan(shipment)}
                            title="Download PDF"
                          >
                            ⬇️
                          </button>
                          <button 
                            className="btn-view" 
                            onClick={() => {
                              setSelectedShipment(shipment);
                              setIsViewModalOpen(true);
                            }}
                            title="View Details"
                          >
                            👁️
                          </button>
                          <button 
                            className="btn-edit" 
                            onClick={() => openEditModal(shipment)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button 
                            className="btn-delete" 
                            onClick={() => handleDeleteShipment(shipment.id)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </ActionButtons>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </TableWrapper>
      </TableCard>

      {/* ============ CREATE MODAL ============ */}
      {isModalOpen && (
        <ModalOverlay onClick={() => setIsModalOpen(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h5>➕ New Shipment</h5>
              <button className="btn-close" onClick={() => setIsModalOpen(false)}>✕</button>
            </ModalHeader>
            <ModalBody>
              <form onSubmit={handleCreateShipment}>
                <FormRow>
                  <FormGroup>
                    <label>🏢 Client Name *</label>
                    <input 
                      type="text" 
                      name="client" 
                      placeholder="Enter client name" 
                      value={formData.client}
                      onChange={handleChange}
                      required
                    />
                  </FormGroup>
                  <FormGroup>
                    <label>📍 Destination *</label>
                    <input 
                      type="text" 
                      name="destination" 
                      placeholder="Enter destination" 
                      value={formData.destination}
                      onChange={handleChange}
                      required
                    />
                  </FormGroup>
                </FormRow>

                <FormRow>
                  <FormGroup>
                    <label>📦 Weight (kg)</label>
                    <input 
                      type="number" 
                      name="weight" 
                      placeholder="Enter weight" 
                      value={formData.weight}
                      onChange={handleChange}
                    />
                  </FormGroup>
                  <FormGroup>
                    <label>📊 Status</label>
                    <select 
                      name="status" 
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="pending">Pending</option>
                      <option value="loading">Loading</option>
                      <option value="in-transit">In Transit</option>
                      <option value="delayed">Delayed</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </FormGroup>
                </FormRow>

                <FormRow>
                  <FormGroup>
                    <label>👤 Driver</label>
                    <select 
                      name="driver_id" 
                      value={formData.driver_id}
                      onChange={handleChange}
                    >
                      <option value="">Select driver...</option>
                      {drivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.full_name}
                        </option>
                      ))}
                    </select>
                  </FormGroup>
                  <FormGroup>
                    <label>🚛 Vehicle</label>
                    <select 
                      name="vehicle_id" 
                      value={formData.vehicle_id}
                      onChange={handleChange}
                    >
                      <option value="">Select vehicle...</option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.vehicle_id} - {vehicle.license_plate || ''}
                        </option>
                      ))}
                    </select>
                  </FormGroup>
                </FormRow>

                <FormRow>
                  <FormGroup>
                    <label>📍 Pickup Location</label>
                    <input 
                      type="text" 
                      name="pickup_location" 
                      placeholder="Pickup location" 
                      value={formData.pickup_location}
                      onChange={handleChange}
                    />
                  </FormGroup>
                  <FormGroup>
                    <label>📍 Delivery Location</label>
                    <input 
                      type="text" 
                      name="delivery_location" 
                      placeholder="Delivery location" 
                      value={formData.delivery_location}
                      onChange={handleChange}
                    />
                  </FormGroup>
                </FormRow>

                <FormRow>
                  <FormGroup>
                    <label>💰 Freight Charge (₹)</label>
                    <input 
                      type="number" 
                      name="freight_charge" 
                      placeholder="0" 
                      value={formData.freight_charge}
                      onChange={handleChange}
                    />
                  </FormGroup>
                  <FormGroup>
                    <label>🧾 GST (%)</label>
                    <input 
                      type="number" 
                      name="gst" 
                      placeholder="18" 
                      value={formData.gst}
                      onChange={handleChange}
                    />
                  </FormGroup>
                </FormRow>

                <FormRow>
                  <FormGroup>
                    <label>💳 Payment Mode</label>
                    <select 
                      name="payment_mode" 
                      value={formData.payment_mode}
                      onChange={handleChange}
                    >
                      <option value="cash">Cash</option>
                      <option value="online">Online</option>
                      <option value="credit">Credit</option>
                      <option value="upi">UPI</option>
                    </select>
                  </FormGroup>
                  <FormGroup>
                    <label>⏰ Expected Delivery</label>
                    <input 
                      type="datetime-local" 
                      name="eta" 
                      value={formData.eta}
                      onChange={handleChange}
                    />
                  </FormGroup>
                </FormRow>

                <FormRow>
                  <FormGroup fullWidth>
                    <label>📝 Notes</label>
                    <textarea 
                      name="notes" 
                      rows="2" 
                      placeholder="Additional notes..."
                      value={formData.notes}
                      onChange={handleChange}
                    />
                  </FormGroup>
                </FormRow>

                <ModalFooter>
                  <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-submit" disabled={loading}>
                    {loading ? '⏳ Creating...' : 'Create Shipment'}
                  </button>
                </ModalFooter>
              </form>
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* ============ EDIT MODAL ============ */}
      {isEditModalOpen && (
        <ModalOverlay onClick={() => setIsEditModalOpen(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h5>✏️ Edit Shipment</h5>
              <button className="btn-close" onClick={() => setIsEditModalOpen(false)}>✕</button>
            </ModalHeader>
            <ModalBody>
              <form onSubmit={handleUpdateShipment}>
                <FormRow>
                  <FormGroup>
                    <label>🏢 Client Name *</label>
                    <input 
                      type="text" 
                      name="client" 
                      placeholder="Enter client name" 
                      value={editFormData.client}
                      onChange={handleEditChange}
                      required
                    />
                  </FormGroup>
                  <FormGroup>
                    <label>📍 Destination *</label>
                    <input 
                      type="text" 
                      name="destination" 
                      placeholder="Enter destination" 
                      value={editFormData.destination}
                      onChange={handleEditChange}
                      required
                    />
                  </FormGroup>
                </FormRow>

                <FormRow>
                  <FormGroup>
                    <label>📦 Weight (kg)</label>
                    <input 
                      type="number" 
                      name="weight" 
                      placeholder="Enter weight" 
                      value={editFormData.weight}
                      onChange={handleEditChange}
                    />
                  </FormGroup>
                  <FormGroup>
                    <label>📊 Status</label>
                    <select 
                      name="status" 
                      value={editFormData.status}
                      onChange={handleEditChange}
                    >
                      <option value="pending">Pending</option>
                      <option value="loading">Loading</option>
                      <option value="in-transit">In Transit</option>
                      <option value="delayed">Delayed</option>
                      <option value="delivered">Delivered</option>
                    </select>
                  </FormGroup>
                </FormRow>

                <FormRow>
                  <FormGroup>
                    <label>👤 Driver</label>
                    <select 
                      name="driver_id" 
                      value={editFormData.driver_id}
                      onChange={handleEditChange}
                    >
                      <option value="">Select driver...</option>
                      {drivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.full_name}
                        </option>
                      ))}
                    </select>
                  </FormGroup>
                  <FormGroup>
                    <label>🚛 Vehicle</label>
                    <select 
                      name="vehicle_id" 
                      value={editFormData.vehicle_id}
                      onChange={handleEditChange}
                    >
                      <option value="">Select vehicle...</option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.vehicle_id} - {vehicle.license_plate || ''}
                        </option>
                      ))}
                    </select>
                  </FormGroup>
                </FormRow>

                <FormRow>
                  <FormGroup>
                    <label>📍 Pickup Location</label>
                    <input 
                      type="text" 
                      name="pickup_location" 
                      placeholder="Pickup location" 
                      value={editFormData.pickup_location}
                      onChange={handleEditChange}
                    />
                  </FormGroup>
                  <FormGroup>
                    <label>📍 Delivery Location</label>
                    <input 
                      type="text" 
                      name="delivery_location" 
                      placeholder="Delivery location" 
                      value={editFormData.delivery_location}
                      onChange={handleEditChange}
                    />
                  </FormGroup>
                </FormRow>

                <FormRow>
                  <FormGroup>
                    <label>💰 Freight Charge (₹)</label>
                    <input 
                      type="number" 
                      name="freight_charge" 
                      placeholder="0" 
                      value={editFormData.freight_charge}
                      onChange={handleEditChange}
                    />
                  </FormGroup>
                  <FormGroup>
                    <label>🧾 GST (%)</label>
                    <input 
                      type="number" 
                      name="gst" 
                      placeholder="18" 
                      value={editFormData.gst}
                      onChange={handleEditChange}
                    />
                  </FormGroup>
                </FormRow>

                <FormRow>
                  <FormGroup>
                    <label>💳 Payment Mode</label>
                    <select 
                      name="payment_mode" 
                      value={editFormData.payment_mode}
                      onChange={handleEditChange}
                    >
                      <option value="cash">Cash</option>
                      <option value="online">Online</option>
                      <option value="credit">Credit</option>
                      <option value="upi">UPI</option>
                    </select>
                  </FormGroup>
                  <FormGroup>
                    <label>⏰ Expected Delivery</label>
                    <input 
                      type="datetime-local" 
                      name="eta" 
                      value={editFormData.eta}
                      onChange={handleEditChange}
                    />
                  </FormGroup>
                </FormRow>

                <FormRow>
                  <FormGroup fullWidth>
                    <label>📝 Notes</label>
                    <textarea 
                      name="notes" 
                      rows="2" 
                      placeholder="Additional notes..."
                      value={editFormData.notes}
                      onChange={handleEditChange}
                    />
                  </FormGroup>
                </FormRow>

                <ModalFooter>
                  <button type="button" className="btn-cancel" onClick={() => setIsEditModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-submit" disabled={loading}>
                    {loading ? '⏳ Updating...' : 'Update Shipment'}
                  </button>
                </ModalFooter>
              </form>
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* ============ VIEW MODAL ============ */}
      {isViewModalOpen && selectedShipment && (
        <ModalOverlay onClick={() => setIsViewModalOpen(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <ModalHeader>
              <h5>📋 Shipment Details</h5>
              <button className="btn-close" onClick={() => setIsViewModalOpen(false)}>✕</button>
            </ModalHeader>
            <ViewModalBody>
              <ViewGrid>
                <ViewItem>
                  <label>Shipment ID</label>
                  <span className="id">#{selectedShipment.id}</span>
                </ViewItem>
                <ViewItem>
                  <label>Tracking ID</label>
                  <span className="tracking">{selectedShipment.tracking_id || 'N/A'}</span>
                </ViewItem>
                <ViewItem>
                  <label>Status</label>
                  <StatusBadge 
                    bg={getStatusColor(selectedShipment.status).bg} 
                    color={getStatusColor(selectedShipment.status).color}
                  >
                    {getStatusColor(selectedShipment.status).label}
                  </StatusBadge>
                </ViewItem>
                <ViewItem>
                  <label>🏢 Client</label>
                  <span>{selectedShipment.client || 'N/A'}</span>
                </ViewItem>
                <ViewItem>
                  <label>📍 Destination</label>
                  <span>{selectedShipment.destination || 'N/A'}</span>
                </ViewItem>
                <ViewItem>
                  <label>📍 Pickup</label>
                  <span>{selectedShipment.pickup_location || 'N/A'}</span>
                </ViewItem>
                <ViewItem>
                  <label>📍 Delivery</label>
                  <span>{selectedShipment.delivery_location || 'N/A'}</span>
                </ViewItem>
                <ViewItem>
                  <label>👤 Driver</label>
                  <span>{getDriverName(selectedShipment.driver_id)}</span>
                </ViewItem>
                <ViewItem>
                  <label>🚛 Vehicle</label>
                  <span>{getVehicleInfo(selectedShipment.vehicle_id)}</span>
                </ViewItem>
                <ViewItem>
                  <label>📦 Weight</label>
                  <span>{selectedShipment.weight || 'N/A'} kg</span>
                </ViewItem>
                <ViewItem>
                  <label>⏰ ETA</label>
                  <span>{formatDate(selectedShipment.eta)}</span>
                </ViewItem>
                <ViewItem>
                  <label>💰 Freight</label>
                  <span>₹{selectedShipment.freight_charge || 0}</span>
                </ViewItem>
                <ViewItem>
                  <label>🧾 GST</label>
                  <span>{selectedShipment.gst || 0}%</span>
                </ViewItem>
                <ViewItem>
                  <label>💳 Payment</label>
                  <span>{selectedShipment.payment_mode || 'cash'}</span>
                </ViewItem>
                <ViewItem fullWidth>
                  <label>📝 Notes</label>
                  <p className="notes">{selectedShipment.notes || 'No notes'}</p>
                </ViewItem>
                <ViewItem fullWidth>
                  <label>📄 Challan Number</label>
                  <span className="challan">{selectedShipment.challan_number || 'Not generated'}</span>
                </ViewItem>
              </ViewGrid>

              <ViewModalFooter>
                <button className="btn-cancel" onClick={() => setIsViewModalOpen(false)}>
                  Close
                </button>
                <button 
                  className="btn-challan-view" 
                  onClick={() => {
                    setIsViewModalOpen(false);
                    viewChallan(selectedShipment);
                  }}
                >
                  📄 View Challan
                </button>
                <button 
                  className="btn-edit" 
                  onClick={() => {
                    setIsViewModalOpen(false);
                    openEditModal(selectedShipment);
                  }}
                >
                  ✏️ Edit
                </button>
              </ViewModalFooter>
            </ViewModalBody>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageWrapper>
  );
}

// ==================== STYLED COMPONENTS ====================

const PageWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #f0f4f8 100%);
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  @media (max-width: 768px) {
    padding: 16px;
  }
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
    font-weight: 700;
    color: #0f172a;
    margin: 0;
  }
  p {
    color: #64748b;
    margin: 4px 0 0 0;
    font-size: 14px;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;

  .export-wrapper {
    position: relative;
  }

  .btn-export {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
    background: white;
    color: #475569;
    border: 1px solid #e2e8f0;
    &:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }
  }

  .btn-refresh {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
    background: white;
    color: #475569;
    border: 1px solid #e2e8f0;
    &:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }
  }

  .btn-primary {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
    background: #2563eb;
    color: white;
    &:hover {
      background: #1d4ed8;
    }
  }
`;

const ExportDropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  min-width: 220px;
  z-index: 1000;
  overflow: hidden;
  animation: dropdownSlideIn 0.15s ease-out;

  @keyframes dropdownSlideIn {
    from {
      opacity: 0;
      transform: translateY(-8px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;

const ExportDropdownItem = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  font-family: inherit;

  &:hover {
    background: #f1f5f9;
  }

  span {
    font-size: 20px;
    flex-shrink: 0;
  }

  div {
    display: flex;
    flex-direction: column;
    gap: 2px;
    
    strong {
      font-size: 14px;
      color: #1e293b;
      font-weight: 600;
    }
    
    small {
      font-size: 11px;
      color: #94a3b8;
    }
  }
`;

const FilterSection = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 200px;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  outline: none;
  transition: border-color 0.15s;

  &:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  @media (max-width: 640px) {
    min-width: 100%;
  }
`;

const FilterSelect = styled.select`
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  outline: none;
  cursor: pointer;
  min-width: 140px;

  &:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const FilterCount = styled.span`
  font-size: 13px;
  color: #94a3b8;
  margin-left: auto;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;

  .icon {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }

  .label {
    font-size: 13px;
    color: #64748b;
    font-weight: 500;
  }
  .value {
    font-size: 24px;
    font-weight: 700;
    color: #0f172a;
  }
`;

const TableCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  overflow: hidden;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h2 {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .card-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .btn-sort {
        padding: 4px 12px;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        background: white;
        cursor: pointer;
        font-size: 12px;
        color: #475569;
        &:hover {
          background: #f8fafc;
        }
      }
      
      .count {
        font-size: 13px;
        color: #94a3b8;
      }
    }
  }
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin: -20px;
  padding: 20px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;

  thead {
    background: #f8fafc;
    border-bottom: 2px solid #e2e8f0;

    th {
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      color: #475569;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }
  }

  tbody {
    tr {
      border-bottom: 1px solid #f1f5f9;
      transition: background 0.15s;
      
      &:hover {
        background: #f8fafc;
      }
    }

    td {
      padding: 12px 16px;
      vertical-align: middle;
      color: #1e293b;
    }

    .id {
      font-family: monospace;
      font-weight: 600;
      color: #2563eb;
    }

    .tracking-id {
      font-family: monospace;
      font-weight: 600;
      color: #d97706;
      font-size: 12px;
    }

    .client {
      font-weight: 500;
    }

    .empty-state {
      text-align: center;
      color: #94a3b8;
      padding: 40px !important;
      font-size: 14px;
    }
  }
`;

const StatusBadge = styled.span`
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
  background-color: ${props => props.bg || '#f1f5f9'};
  color: ${props => props.color || '#475569'};
`;

// const ActionButtons = styled.div`
//   display: flex;
//   gap: 4px;
//   flex-wrap: wrap;

//   button {
//     padding: 4px 8px;
//     border: none;
//     border-radius: 4px;
//     cursor: pointer;
//     font-size: 13px;
//     transition: all 0.2s;
//     background: transparent;
//   }

//   .btn-challan {
//     color: #2563eb;
//     background: #eff6ff;
//     &:hover { background: #dbeafe; }
//   }

//   .btn-pdf {
//     color: #d97706;
//     background: #fef3c7;
//     &:hover { background: #fde68a; }
//   }

//   .btn-view {
//     color: #2563eb;
//     &:hover { background: #eff6ff; }
//   }

//   .btn-edit {
//     color: #d97706;
//     &:hover { background: #fffbeb; }
//   }

//   .btn-delete {
//     color: #dc2626;
//     &:hover { background: #fef2f2; }
//   }
// `;

// ==================== MODAL STYLES ====================

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 16px;
`;

const ModalContent = styled.div`
  background-color: #ffffff;
  border-radius: 12px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: modalFadeIn 0.2s ease-out;

  @keyframes modalFadeIn {
    from { opacity: 0; transform: scale(0.95) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
`;

const ModalHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h5 {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
  }

  .btn-close {
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 20px;
    cursor: pointer;
    padding: 4px;
    &:hover { color: #475569; }
  }
`;

const ModalBody = styled.div`
  padding: 20px;
  overflow-y: auto;
  max-height: 60vh;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;

  @media (max-width: 576px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  ${props => props.fullWidth && 'grid-column: 1 / -1;'}

  label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: #475569;
    margin-bottom: 6px;
  }

  input, select, textarea {
    width: 100%;
    padding: 10px 12px;
    font-size: 14px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    background-color: #ffffff;
    color: #1e293b;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s ease;
    font-family: inherit;

    &:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
  }

  textarea {
    resize: vertical;
    min-height: 50px;
  }
`;

const ModalFooter = styled.div`
  padding: 14px 20px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background-color: #f8fafc;

  button {
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 500;
    border-radius: 8px;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .btn-cancel {
    background-color: #f1f5f9;
    color: #475569;
    &:hover:not(:disabled) { background-color: #e2e8f0; }
  }

  .btn-submit {
    background-color: #2563eb;
    color: #ffffff;
    &:hover:not(:disabled) { background-color: #1d4ed8; }
  }
`;

// ==================== VIEW MODAL STYLES ====================

const ViewModalBody = styled.div`
  padding: 20px;
  overflow-y: auto;
  max-height: 60vh;
`;

const ViewGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
`;

const ViewItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  ${props => props.fullWidth && 'grid-column: 1 / -1;'}

  label {
    font-size: 11px;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  span, .notes {
    font-size: 14px;
    color: #0f172a;
  }

  .id {
    font-family: monospace;
    font-size: 16px;
    color: #2563eb;
    font-weight: 600;
  }

  .tracking {
    font-family: monospace;
    font-size: 14px;
    color: #d97706;
    font-weight: 600;
  }

  .challan {
    font-family: monospace;
    color: #d97706;
    font-weight: 600;
  }

  .notes {
    background: #f8fafc;
    padding: 10px 12px;
    border-radius: 6px;
    border: 1px solid #f1f5f9;
    margin: 0;
    line-height: 1.6;
    color: #475569;
  }
`;

const ViewModalFooter = styled.div`
  padding: 16px 0 0 0;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;

  button {
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 600;
    border-radius: 8px;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
  }

  .btn-cancel {
    background-color: #f1f5f9;
    color: #475569;
    &:hover { background-color: #e2e8f0; }
  }

  .btn-challan-view {
    background-color: #eff6ff;
    color: #2563eb;
    &:hover { background-color: #dbeafe; }
  }

  .btn-edit {
    background-color: #fef3c7;
    color: #d97706;
    &:hover { background-color: #fde68a; }
  }
`;