import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import * as XLSX from 'xlsx';

export default function MaintenanceRegistryLog() {
  // 🟢 State: Modal Management
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false); // 🔴 ADD THIS
  const [selectedLog, setSelectedLog] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  
  // 🟢 Form state for new maintenance log
  const [formData, setFormData] = useState({
    vehicle_id: '',
    category: '',
    service_date: '',
    cost: '',
    status: 'In Progress',
    description: '',
    maintenance_type: ''
  });

  // 🟢 Edit form state
  const [editFormData, setEditFormData] = useState({
    id: '',
    vehicle_id: '',
    category: '',
    service_date: '',
    cost: '',
    status: 'In Progress',
    description: '',
    maintenance_type: ''
  });

  // 🟢 Fetch data from backend
  useEffect(() => {
    fetchVehicles();
    fetchMaintenanceLogs();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/vehicles');
      const data = await response.json();
      if (response.ok) {
        setVehicles(data);
      } else {
        console.error('Failed to fetch vehicles:', data.message);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  const fetchMaintenanceLogs = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/maintenance');
      const data = await response.json();
      if (response.ok) {
        setMaintenanceLogs(data);
      }
    } catch (error) {
      console.error('Error fetching maintenance logs:', error);
    }
  };

  // 🟢 Handle form input changes
  const handleFormChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // 🟢 Handle edit form input changes
  const handleEditFormChange = (e) => {
    const { id, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // 🟢 Submit new maintenance log
  const handleSubmitMaintenance = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: formData.vehicle_id,
          category: formData.category,
          service_date: formData.service_date,
          cost: formData.cost,
          status: formData.status,
          description: formData.description,
          maintenance_type: formData.maintenance_type
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Maintenance log added successfully!');
        await fetchMaintenanceLogs();
        setIsModalOpen(false);
        resetForm();
      } else {
        alert(`❌ Error: ${data.message || 'Failed to add maintenance log'}`);
      }
    } catch (error) {
      console.error('Error adding maintenance log:', error);
      alert('❌ Network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 🟢 Submit edit maintenance log
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`http://localhost:5000/api/maintenance/${editFormData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: editFormData.vehicle_id,
          category: editFormData.category,
          service_date: editFormData.service_date,
          cost: editFormData.cost,
          status: editFormData.status,
          description: editFormData.description,
          maintenance_type: editFormData.maintenance_type
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Maintenance log updated successfully!');
        await fetchMaintenanceLogs();
        setIsEditModalOpen(false);
        setSelectedLog(null);
      } else {
        alert(`❌ Error: ${data.message || 'Failed to update maintenance log'}`);
      }
    } catch (error) {
      console.error('Error updating maintenance log:', error);
      alert('❌ Network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 🟢 Delete maintenance log
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this maintenance log?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/maintenance/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('✅ Maintenance log deleted successfully!');
        await fetchMaintenanceLogs();
      } else {
        const data = await response.json();
        alert(`❌ Error: ${data.message || 'Failed to delete maintenance log'}`);
      }
    } catch (error) {
      console.error('Error deleting maintenance log:', error);
      alert('❌ Network error occurred. Please try again.');
    }
  };

// 🟢 Open edit modal with log data - FIXED
const openEditModal = (log) => {
  console.log('🔍 Opening edit modal for log:', log);
  console.log('🔍 Vehicle ID from log:', log.vehicle_id, 'Type:', typeof log.vehicle_id);
  
  setSelectedLog(log);
  setEditFormData({
    id: log.id,
    vehicle_id: String(log.vehicle_id || ''), // 🔴 IMPORTANT: Convert to string
    category: log.category || '',
    service_date: log.service_date || '',
    cost: log.cost || '',
    status: log.status || 'In Progress',
    description: log.description || '',
    maintenance_type: log.maintenance_type || ''
  });
  
  console.log('📝 Edit form data set:', editFormData);
  setIsEditModalOpen(true);
};
  // 🟢 Open view modal
  const openViewModal = (log) => {
    setSelectedLog(log);
    setIsViewModalOpen(true);
  };

  // 🟢 Reset form
  const resetForm = () => {
    setFormData({
      vehicle_id: '',
      category: '',
      service_date: '',
      cost: '',
      status: 'In Progress',
      description: '',
      maintenance_type: ''
    });
  };

  // 🟢 Filter and search logs
  const filteredLogs = maintenanceLogs.filter(log => {
    const matchesSearch = 
      (log.vehicle_id?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
       log.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       log.id?.toString().toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'All' || log.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // 🟢 Get vehicle details for display
  const getVehicleDetails = (vehicleId) => {
    return vehicles.find(v => v.id === vehicleId);
  };

  // ==================== EXPORT FUNCTIONS ====================

  // 1. Export to CSV
  const exportToCSV = () => {
    const headers = ['Log ID', 'Vehicle ID', 'License Plate', 'Category', 'Description', 'Service Date', 'Cost', 'Status'];
    
    const rows = maintenanceLogs.map(log => {
      const vehicle = getVehicleDetails(log.vehicle_id);
      return [
        log.id,
        vehicle?.vehicle_id || log.vehicle_id,
        vehicle?.license_plate || 'N/A',
        log.category || log.maintenance_type || 'N/A',
        log.description || 'N/A',
        log.service_date || 'N/A',
        log.cost || 0,
        log.status || 'N/A'
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `maintenance_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsExportMenuOpen(false);
  };

  // 2. Export to Excel
  const exportToExcel = () => {
    try {
      const excelData = maintenanceLogs.map(log => {
        const vehicle = getVehicleDetails(log.vehicle_id);
        return {
          'Log ID': log.id,
          'Vehicle ID': vehicle?.vehicle_id || log.vehicle_id,
          'License Plate': vehicle?.license_plate || 'N/A',
          'Category': log.category || log.maintenance_type || 'N/A',
          'Description': log.description || 'N/A',
          'Service Date': log.service_date || 'N/A',
          'Cost (₹)': log.cost || 0,
          'Status': log.status || 'N/A'
        };
      });

      const totalCost = maintenanceLogs.reduce((sum, log) => sum + parseFloat(log.cost || 0), 0);
      const completedCount = maintenanceLogs.filter(log => log.status === 'Completed').length;
      const inProgressCount = maintenanceLogs.filter(log => log.status === 'In Progress').length;
      const pendingCount = maintenanceLogs.filter(log => log.status === 'Pending').length;

      const wb = XLSX.utils.book_new();
      const wsData = XLSX.utils.json_to_sheet(excelData);
      
      wsData['!cols'] = [
        { wch: 12 }, { wch: 15 }, { wch: 18 }, 
        { wch: 20 }, { wch: 40 }, { wch: 15 }, 
        { wch: 15 }, { wch: 15 }
      ];

      XLSX.utils.book_append_sheet(wb, wsData, 'Maintenance Logs');

      const summaryData = [
        ['MAINTENANCE LOGS SUMMARY'],
        [''],
        ['Metric', 'Value'],
        ['Total Records', maintenanceLogs.length],
        ['Total Cost', `₹${totalCost.toLocaleString()}`],
        ['Completed', completedCount],
        ['In Progress', inProgressCount],
        ['Pending', pendingCount],
        [''],
        ['Generated On', new Date().toLocaleString()],
        ['Total Vehicles', vehicles.length],
        ['Filter Applied', filterStatus !== 'All' ? filterStatus : 'None']
      ];

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      wsSummary['!cols'] = [{ wch: 25 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

      const wbout = XLSX.write(wb, { 
        bookType: 'xlsx', 
        type: 'array',
        bookSST: false
      });

      const blob = new Blob([wbout], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `maintenance_logs_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setIsExportMenuOpen(false);
      
      alert('✅ Excel file exported successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('❌ Failed to export Excel file. Please try again.');
    }
  };

  // 3. Export to PDF
  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for this site to export PDF');
      return;
    }

    const vehicle = (id) => {
      const v = getVehicleDetails(id);
      return v ? `${v.vehicle_id} [${v.license_plate}]` : id;
    };

    const tableRows = maintenanceLogs.map(log => `
      <tr>
        <td>${log.id}</td>
        <td>${vehicle(log.vehicle_id)}</td>
        <td>${log.category || log.maintenance_type || 'N/A'}</td>
        <td>${log.description || 'N/A'}</td>
        <td>${log.service_date || 'N/A'}</td>
        <td>₹${log.cost || 0}</td>
        <td><span style="color: ${log.status === 'Completed' ? '#16a34a' : log.status === 'In Progress' ? '#d97706' : '#dc2626'}">${log.status}</span></td>
      </tr>
    `).join('');

    const totalCost = maintenanceLogs.reduce((sum, log) => sum + parseFloat(log.cost || 0), 0);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Maintenance Logs Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #0f172a; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
            .header-info { display: flex; justify-content: space-between; margin-bottom: 20px; color: #64748b; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f1f5f9; color: #475569; font-weight: 600; padding: 12px; text-align: left; border: 1px solid #e2e8f0; }
            td { padding: 10px; border: 1px solid #e2e8f0; }
            .total-row { background-color: #f8fafc; font-weight: bold; }
            .footer { margin-top: 30px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <h1>📋 Maintenance Registry Log Report</h1>
          <div class="header-info">
            <span>Generated: ${new Date().toLocaleString()}</span>
            <span>Total Records: ${maintenanceLogs.length}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Vehicle</th>
                <th>Category</th>
                <th>Description</th>
                <th>Service Date</th>
                <th>Cost</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
              <tr class="total-row">
                <td colspan="5" style="text-align: right;">TOTAL</td>
                <td>₹${totalCost.toLocaleString()}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
          <div class="footer">
            © ${new Date().getFullYear()} Fleet Management System - Confidential Report
          </div>
          <script>
            window.onload = function() { window.print(); }
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setIsExportMenuOpen(false);
  };

  // 4. Export to JSON
  const exportToJSON = () => {
    const jsonData = maintenanceLogs.map(log => {
      const vehicle = getVehicleDetails(log.vehicle_id);
      return {
        ...log,
        vehicle_details: vehicle || null
      };
    });

    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `maintenance_logs_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsExportMenuOpen(false);
  };

  // 5. Export Current View (CSV)
  const exportCurrentView = () => {
    const headers = ['Log ID', 'Vehicle ID', 'License Plate', 'Category', 'Description', 'Service Date', 'Cost', 'Status'];
    
    const rows = filteredLogs.map(log => {
      const vehicle = getVehicleDetails(log.vehicle_id);
      return [
        log.id,
        vehicle?.vehicle_id || log.vehicle_id,
        vehicle?.license_plate || 'N/A',
        log.category || log.maintenance_type || 'N/A',
        log.description || 'N/A',
        log.service_date || 'N/A',
        log.cost || 0,
        log.status || 'N/A'
      ];
    });

    if (rows.length === 0) {
      alert('No records to export. Please adjust your filters.');
      setIsExportMenuOpen(false);
      return;
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `filtered_maintenance_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsExportMenuOpen(false);
  };

  // 6. Export Current View to Excel
  const exportCurrentViewToExcel = () => {
    try {
      const excelData = filteredLogs.map(log => {
        const vehicle = getVehicleDetails(log.vehicle_id);
        return {
          'Log ID': log.id,
          'Vehicle ID': vehicle?.vehicle_id || log.vehicle_id,
          'License Plate': vehicle?.license_plate || 'N/A',
          'Category': log.category || log.maintenance_type || 'N/A',
          'Description': log.description || 'N/A',
          'Service Date': log.service_date || 'N/A',
          'Cost (₹)': log.cost || 0,
          'Status': log.status || 'N/A'
        };
      });

      if (excelData.length === 0) {
        alert('No records to export. Please adjust your filters.');
        setIsExportMenuOpen(false);
        return;
      }

      const wb = XLSX.utils.book_new();
      const wsData = XLSX.utils.json_to_sheet(excelData);
      
      wsData['!cols'] = [
        { wch: 12 }, { wch: 15 }, { wch: 18 }, 
        { wch: 20 }, { wch: 40 }, { wch: 15 }, 
        { wch: 15 }, { wch: 15 }
      ];

      XLSX.utils.book_append_sheet(wb, wsData, 'Filtered Logs');

      const filterInfo = [
        ['FILTER INFORMATION'],
        [''],
        ['Filter Applied', filterStatus !== 'All' ? filterStatus : 'No filter'],
        ['Search Term', searchTerm || 'None'],
        ['Total Records', filteredLogs.length],
        ['Generated On', new Date().toLocaleString()]
      ];

      const wsFilter = XLSX.utils.aoa_to_sheet(filterInfo);
      wsFilter['!cols'] = [{ wch: 20 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, wsFilter, 'Filter Info');

      const wbout = XLSX.write(wb, { 
        bookType: 'xlsx', 
        type: 'array',
        bookSST: false
      });

      const blob = new Blob([wbout], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `filtered_maintenance_logs_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setIsExportMenuOpen(false);
      
      alert(`✅ Exported ${filteredLogs.length} records to Excel!`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('❌ Failed to export Excel file. Please try again.');
    }
  };

  // ==================== RENDER ====================

  return (
    <PageWrapper>
      {/* Header */}
      <HeaderControl>
        <TitleBlock>
          <h1>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="title-icon">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
            Maintenance Registry Log
          </h1>
          <p>Track asset interventions, routine service cycles, and repair logs.</p>
        </TitleBlock>
        <AddButton type="button" onClick={() => setIsModalOpen(true)}>
          ➕ Add Maintenance Log
        </AddButton>
      </HeaderControl>

      {/* Stats Summary - Same as before */}
      <StatsGrid>
        <StatCard>
          <IconBox bg="#eff6ff" color="#2563eb">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </IconBox>
          <div className="stat-info">
            <span className="lbl">Total Orders</span>
            <span className="val">{maintenanceLogs.length}</span>
            <span className="sub">This calendar year</span>
          </div>
        </StatCard>

        <StatCard>
          <IconBox bg="#fffbeb" color="#d97706">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </IconBox>
          <div className="stat-info">
            <span className="lbl">In Progress</span>
            <span className="val">
              {maintenanceLogs.filter(log => log.status === 'In Progress').length}
            </span>
            <span className="sub text-warning">Active maintenance items</span>
          </div>
        </StatCard>

        <StatCard>
          <IconBox bg="#f0fdf4" color="#16a34a">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 4 12 14.01 9 11.01"/>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            </svg>
          </IconBox>
          <div className="stat-info">
            <span className="lbl">Completed</span>
            <span className="val">
              {maintenanceLogs.filter(log => log.status === 'Completed').length}
            </span>
            <span className="sub text-success">Completed tasks</span>
          </div>
        </StatCard>

        <StatCard>
          <IconBox bg="#fef2f2" color="#dc2626">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="12" x2="12" y2="21"/>
              <path d="M17 12a5 5 0 1 0-10 0"/>
            </svg>
          </IconBox>
          <div className="stat-info">
            <span className="lbl">Total Expenses</span>
            <span className="val">
              ₹{maintenanceLogs.reduce((sum, log) => sum + parseFloat(log.cost || 0), 0).toLocaleString()}
            </span>
            <span className="sub">Current month metrics</span>
          </div>
        </StatCard>
      </StatsGrid>

      {/* Table Section with Export Dropdown */}
      <TableCardSection>
        <TableTopbarControls>
          <div className="title-area">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px', verticalAlign: 'middle'}}>
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            Intervention Records Ledger
            <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '8px' }}>
              ({filteredLogs.length} records)
            </span>
          </div>
          <RightInputGroupControl>
            <div className="search-input-box">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="12" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input 
                type="text" 
                placeholder="Search log or Plate..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
            </select>
            
            {/* Export Button with Dropdown */}
            <div className="export-wrapper">
              <button 
                className="btn-action-util export-btn"
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Export
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              
              {isExportMenuOpen && (
                <ExportDropdown>
                  <ExportDropdownItem onClick={exportToCSV}>
                    <span>📄</span> CSV
                    <small>Comma separated</small>
                  </ExportDropdownItem>
                  <ExportDropdownItem onClick={exportToExcel}>
                    <span>📊</span> Excel (.xlsx)
                    <small>With summary</small>
                  </ExportDropdownItem>
                  <ExportDropdownDivider />
                  <ExportDropdownItem onClick={exportToPDF}>
                    <span>📑</span> PDF
                    <small>Print as PDF</small>
                  </ExportDropdownItem>
                  <ExportDropdownItem onClick={exportToJSON}>
                    <span>📦</span> JSON
                    <small>Raw data</small>
                  </ExportDropdownItem>
                  <ExportDropdownDivider />
                  <ExportDropdownItem onClick={exportCurrentView} className="current-view">
                    <span>🔍</span> Current View (CSV)
                    <small>{filteredLogs.length} records</small>
                  </ExportDropdownItem>
                  <ExportDropdownItem onClick={exportCurrentViewToExcel} className="current-view">
                    <span>📊</span> Current View (Excel)
                    <small>{filteredLogs.length} records</small>
                  </ExportDropdownItem>
                </ExportDropdown>
              )}
            </div>
          </RightInputGroupControl>
        </TableTopbarControls>

        <TableResponsiveWrapper>
          <RegistryGridTable>
            <thead>
              <tr>
                <th style={{ width: '100px' }}>Log ID</th>
                <th>Vehicle Details</th>
                <th>Service Category</th>
                <th>Intervention Summary</th>
                <th>Service Date</th>
                <th>Cost</th>
                <th>Status</th>
                <th style={{ textAlign: 'center', width: '160px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No maintenance logs found
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const vehicle = getVehicleDetails(log.vehicle_id);
                  return (
                    <tr key={log.id}>
                      <td className="font-mono text-muted">{log.id}</td>
                      <td>
                        <div className="font-bold text-dark">{vehicle?.vehicle_id || log.vehicle_id}</div>
                        <PlateCodeBlock>{vehicle?.license_plate || 'N/A'}</PlateCodeBlock>
                      </td>
                      <td>
                        <CategoryBadge>{log.category || log.maintenance_type}</CategoryBadge>
                      </td>
                      <td className="summary-text">{log.description}</td>
                      <td className="text-muted">{log.service_date}</td>
                      <td className="font-semibold text-dark">₹{log.cost}</td>
                      <td>
                        <StatusBadge status={log.status}>
                          {log.status}
                        </StatusBadge>
                      </td>
                      <td>
                        <ActionButtonsWrapper>
                          <button 
                            className="icon-btn-view" 
                            title="View Details"
                            onClick={() => openViewModal(log)}
                          >
                            <svg width="15" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </button>
                          <button 
                            className="icon-btn-edit" 
                            title="Edit"
                            onClick={() => openEditModal(log)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                            </svg>
                          </button>
                          <button 
                            className="icon-btn-delete" 
                            title="Delete"
                            onClick={() => handleDelete(log.id)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                          </button>
                        </ActionButtonsWrapper>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </RegistryGridTable>
        </TableResponsiveWrapper>
      </TableCardSection>

      {/* ============ ADD MODAL ============ */}
      {isModalOpen && (
        <ModalOverlay onClick={() => setIsModalOpen(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <div>
                <h5>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginRight: '8px', verticalAlign: 'middle', color: '#2563eb'}}>
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                  </svg>
                  Log Maintenance Event
                </h5>
                <p className="modal-subtitle">Record repair details, structural component replacements, and expenses.</p>
              </div>
              <button type="button" className="close-x-btn" onClick={() => setIsModalOpen(false)}>✕</button>
            </ModalHeader>

            <ModalBody>
              <form onSubmit={handleSubmitMaintenance}>
                <FormRow>
                  <FormGroup>
                    <label htmlFor="vehicle_id">Target Fleet Vehicle</label>
                    <select 
                      id="vehicle_id" 
                      value={formData.vehicle_id} 
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Select target asset...</option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.vehicle_id} [{vehicle.license_plate}] - {vehicle.company_name}
                        </option>
                      ))}
                    </select>
                  </FormGroup>
                  <FormGroup>
                    <label htmlFor="category">Service Category</label>
                    <select 
                      id="category" 
                      value={formData.category} 
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">Select category</option>
                      <option value="Routine">🛠️ Scheduled / Routine Maintenance</option>
                      <option value="Breakdown">⚠️ Unscheduled Breakdown Repair</option>
                      <option value="Inspection">🔍 Inspection / Diagnostic</option>
                    </select>
                  </FormGroup>
                </FormRow>

                <FormRow columns="3">
                  <FormGroup>
                    <label htmlFor="service_date">Date of Service</label>
                    <input 
                      type="date" 
                      id="service_date" 
                      value={formData.service_date} 
                      onChange={handleFormChange}
                      required
                    />
                  </FormGroup>
                  <FormGroup>
                    <label htmlFor="cost">Total Cost (₹)</label>
                    <input 
                      type="number" 
                      id="cost" 
                      placeholder="e.g., 4500" 
                      value={formData.cost} 
                      onChange={handleFormChange}
                      required
                    />
                  </FormGroup>
                  <FormGroup>
                    <label htmlFor="status">State Configuration</label>
                    <select 
                      id="status" 
                      value={formData.status} 
                      onChange={handleFormChange}
                    >
                      <option value="In Progress">⏳ In Progress</option>
                      <option value="Completed">✅ Completed</option>
                      <option value="Pending">⏰ Pending</option>
                    </select>
                  </FormGroup>
                </FormRow>

                <FormGroup style={{ marginTop: '8px' }}>
                  <label htmlFor="description">Detailed Logs &amp; Diagnostics</label>
                  <textarea 
                    id="description" 
                    rows="3" 
                    placeholder="Specify parts replaced..."
                    value={formData.description}
                    onChange={handleFormChange}
                    required
                  />
                </FormGroup>

                <FormRow style={{ marginTop: '16px' }}>
                  <FormGroup>
                    <label htmlFor="maintenance_type">Maintenance Type</label>
                    <select 
                      id="maintenance_type" 
                      value={formData.maintenance_type} 
                      onChange={handleFormChange}
                    >
                      <option value="">Select type</option>
                      <option value="Preventive">🔄 Preventive</option>
                      <option value="Corrective">🔧 Corrective</option>
                      <option value="Emergency">🚨 Emergency</option>
                    </select>
                  </FormGroup>
                </FormRow>

                <ModalFooter>
                  <button 
                    type="button" 
                    className="btn-cancel" 
                    onClick={() => setIsModalOpen(false)}
                    disabled={loading}
                  >
                    Close
                  </button>
                  <button 
                    type="submit" 
                    className="btn-submit"
                    disabled={loading}
                  >
                    {loading ? '⏳ Saving...' : 'Save Log Entry'}
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
        <div>
          <h5>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginRight: '8px', verticalAlign: 'middle', color: '#d97706'}}>
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            Edit Maintenance Log
          </h5>
          <p className="modal-subtitle">Update maintenance record details.</p>
        </div>
        <button type="button" className="close-x-btn" onClick={() => setIsEditModalOpen(false)}>✕</button>
      </ModalHeader>

      <ModalBody>
        <form onSubmit={handleEditSubmit}>
          <FormRow>
            <FormGroup>
              <label htmlFor="edit_vehicle_id">Target Fleet Vehicle</label>
              <select 
                id="vehicle_id"
                value={editFormData.vehicle_id || ''}  // 🔴 Fallback to empty string
                onChange={handleEditFormChange}
                required
              >
                <option value="">Select target asset...</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={String(vehicle.id)}>  {/* 🔴 String conversion */}
                    {vehicle.vehicle_id} [{vehicle.license_plate}] - {vehicle.company_name}
                  </option>
                ))}
              </select>
              {/* 🔴 Debug info - remove after fixing */}
              <small style={{color: '#94a3b8', marginTop: '4px', display: 'block'}}>
                Selected Value: {editFormData.vehicle_id || 'none'} (Type: {typeof editFormData.vehicle_id})
              </small>
            </FormGroup>
            <FormGroup>
              <label htmlFor="category">Service Category</label>
              <select 
                id="category" 
                value={editFormData.category} 
                onChange={handleEditFormChange}
                required
              >
                <option value="">Select category</option>
                <option value="Routine">🛠️ Scheduled / Routine Maintenance</option>
                <option value="Breakdown">⚠️ Unscheduled Breakdown Repair</option>
                <option value="Inspection">🔍 Inspection / Diagnostic</option>
              </select>
            </FormGroup>
          </FormRow>

          {/* Rest of the form remains same */}
          <FormRow columns="3">
            <FormGroup>
              <label htmlFor="service_date">Date of Service</label>
              <input 
                type="date" 
                id="service_date" 
                value={editFormData.service_date || ''} 
                onChange={handleEditFormChange}
                required
              />
            </FormGroup>
            <FormGroup>
              <label htmlFor="cost">Total Cost (₹)</label>
              <input 
                type="number" 
                id="cost" 
                placeholder="e.g., 4500" 
                value={editFormData.cost || ''} 
                onChange={handleEditFormChange}
                required
              />
            </FormGroup>
            <FormGroup>
              <label htmlFor="status">State Configuration</label>
              <select 
                id="status" 
                value={editFormData.status} 
                onChange={handleEditFormChange}
              >
                <option value="In Progress">⏳ In Progress</option>
                <option value="Completed">✅ Completed</option>
                <option value="Pending">⏰ Pending</option>
              </select>
            </FormGroup>
          </FormRow>

          <FormGroup style={{ marginTop: '8px' }}>
            <label htmlFor="description">Detailed Logs &amp; Diagnostics</label>
            <textarea 
              id="description" 
              rows="3" 
              placeholder="Specify parts replaced..."
              value={editFormData.description || ''}
              onChange={handleEditFormChange}
              required
            />
          </FormGroup>

          <FormRow style={{ marginTop: '16px' }}>
            <FormGroup>
              <label htmlFor="maintenance_type">Maintenance Type</label>
              <select 
                id="maintenance_type" 
                value={editFormData.maintenance_type || ''} 
                onChange={handleEditFormChange}
              >
                <option value="">Select type</option>
                <option value="Preventive">🔄 Preventive</option>
                <option value="Corrective">🔧 Corrective</option>
                <option value="Emergency">🚨 Emergency</option>
              </select>
            </FormGroup>
          </FormRow>

          <ModalFooter>
            <button 
              type="button" 
              className="btn-cancel" 
              onClick={() => setIsEditModalOpen(false)}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-submit"
              disabled={loading}
            >
              {loading ? '⏳ Updating...' : 'Update Log Entry'}
            </button>
          </ModalFooter>
        </form>
      </ModalBody>
    </ModalContent>
  </ModalOverlay>
)}
      {/* ============ VIEW MODAL ============ */}
      {isViewModalOpen && selectedLog && (
        <ModalOverlay onClick={() => setIsViewModalOpen(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <div>
                <h5>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginRight: '8px', verticalAlign: 'middle', color: '#2563eb'}}>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  Maintenance Log Details
                </h5>
                <p className="modal-subtitle">Complete information about the maintenance record.</p>
              </div>
              <button type="button" className="close-x-btn" onClick={() => setIsViewModalOpen(false)}>✕</button>
            </ModalHeader>

            <ViewModalBody>
              <ViewInfoGrid>
                <ViewInfoItem>
                  <label>Log ID</label>
                  <span className="font-mono">{selectedLog.id}</span>
                </ViewInfoItem>
                <ViewInfoItem>
                  <label>Status</label>
                  <StatusBadge status={selectedLog.status}>{selectedLog.status}</StatusBadge>
                </ViewInfoItem>
                <ViewInfoItem>
                  <label>Vehicle</label>
                  <span>
                    {getVehicleDetails(selectedLog.vehicle_id)?.vehicle_id || selectedLog.vehicle_id}
                  </span>
                  <small style={{ color: '#94a3b8' }}>
                    {getVehicleDetails(selectedLog.vehicle_id)?.license_plate}
                  </small>
                </ViewInfoItem>
                <ViewInfoItem>
                  <label>Vehicle Company</label>
                  <span>{getVehicleDetails(selectedLog.vehicle_id)?.company_name || 'N/A'}</span>
                </ViewInfoItem>
                <ViewInfoItem>
                  <label>Service Category</label>
                  <CategoryBadge>{selectedLog.category || selectedLog.maintenance_type}</CategoryBadge>
                </ViewInfoItem>
                <ViewInfoItem>
                  <label>Maintenance Type</label>
                  <span>{selectedLog.maintenance_type || 'N/A'}</span>
                </ViewInfoItem>
                <ViewInfoItem>
                  <label>Service Date</label>
                  <span>{selectedLog.service_date}</span>
                </ViewInfoItem>
                <ViewInfoItem>
                  <label>Cost</label>
                  <span className="font-bold text-dark">₹{selectedLog.cost}</span>
                </ViewInfoItem>
                <ViewInfoItem fullWidth>
                  <label>Description</label>
                  <p className="description-text">{selectedLog.description}</p>
                </ViewInfoItem>
                <ViewInfoItem fullWidth>
                  <label>Created At</label>
                  <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                    {selectedLog.created_at ? new Date(selectedLog.created_at).toLocaleString() : 'N/A'}
                  </span>
                </ViewInfoItem>
              </ViewInfoGrid>

              <ViewModalFooter>
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={() => setIsViewModalOpen(false)}
                >
                  Close
                </button>
                <button 
                  type="button" 
                  className="btn-edit" 
                  onClick={() => {
                    setIsViewModalOpen(false);
                    openEditModal(selectedLog);
                  }}
                >
                  ✏️ Edit Log
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
    padding: 32px 24px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background-color: #f8fafc;
    min-height: 100vh;

    @media (max-width: 1024px) {
        padding: 20px 16px;
    }
`;

const HeaderControl = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 28px;
    gap: 16px;
    @media (max-width: 768px) { flex-direction: column; align-items: flex-start; }
`;

const TitleBlock = styled.div`
    h1 {
        font-size: 28px;
        font-weight: 700;
        color: #0f172a;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 8px;
        
        .title-icon { color: #2563eb; }
    }
    p { font-size: 14px; color: #64748b; margin: 4px 0 0 0; }
`;

const AddButton = styled.button`
    color: #ffffff;
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    background-color: #2563eb;
    transition: background-color 0.15s ease;
    white-space: nowrap;

    &:hover { background-color: #1d4ed8; }
    @media (max-width: 768px) { width: 100%; }
`;

const StatsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-bottom: 32px;
    @media (max-width: 1024px) { grid-template-columns: repeat(2, 1fr); }
    @media (max-width: 576px) { grid-template-columns: 1fr; }
`;

const StatCard = styled.div`
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);

    .stat-info { display: flex; flex-direction: column; }
    .lbl { font-size: 13px; color: #64748b; font-weight: 500; }
    .val { font-size: 24px; font-weight: 700; color: #0f172a; margin: 4px 0; line-height: 1; }
    .sub { font-size: 12px; color: #94a3b8; }
    
    .text-success { color: #16a34a; font-weight: 500; }
    .text-warning { color: #d97706; font-weight: 500; }
`;

const IconBox = styled.div`
    width: 48px;
    height: 48px;
    border-radius: 8px;
    background-color: ${props => props.bg};
    color: ${props => props.color};
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
`;

const TableCardSection = styled.div`
    background-color: #ffffff; 
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
`;

const TableTopbarControls = styled.div`
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
    border-bottom: 1px solid #f1f5f9;

    .title-area { font-size: 16px; font-weight: 600; color: #1e293b; }
`;

const RightInputGroupControl = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    position: relative;

    .search-input-box {
        display: flex;
        align-items: center;
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        padding: 6px 12px;
        color: #94a3b8;

        input {
            border: none; outline: none; font-size: 13px; color: #1e293b; padding-left: 8px;
            width: 180px;
            &::placeholder { color: #94a3b8; }
        }
    }

    .filter-select {
        padding: 7px 12px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        font-size: 13px;
        background: #ffffff;
        color: #475569;
        cursor: pointer;
        min-width: 120px;
    }

    .export-wrapper {
        position: relative;
    }

    .btn-action-util {
        background: #ffffff; 
        border: 1px solid #cbd5e1; 
        padding: 7px 14px; 
        font-size: 13px;
        font-weight: 500; 
        color: #475569; 
        border-radius: 6px; 
        cursor: pointer; 
        display: flex; 
        align-items: center; 
        gap: 6px;
        
        &:hover { 
            background: #f8fafc; 
            border-color: #2563eb;
            color: #2563eb;
        }

        &.export-btn {
            min-width: 90px;
            justify-content: center;
        }
    }
`;

const ExportDropdown = styled.div`
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    min-width: 250px;
    z-index: 1000;
    overflow: hidden;
    animation: dropdownSlideIn 0.15s ease-out;

    @keyframes dropdownSlideIn {
        from {
            opacity: 0;
            transform: translateY(-8px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;

const ExportDropdownItem = styled.button`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    width: 100%;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    color: #1e293b;
    transition: all 0.15s;
    text-align: left;

    &:hover {
        background: #f1f5f9;
    }

    span {
        font-size: 16px;
    }

    small {
        font-size: 11px;
        color: #94a3b8;
        margin-left: auto;
        white-space: nowrap;
    }

    &.current-view {
        border-top: 1px solid #e2e8f0;
        margin-top: 4px;
        padding-top: 12px;
    }
`;

const ExportDropdownDivider = styled.div`
    height: 1px;
    background: #e2e8f0;
    margin: 4px 0;
`;

const TableResponsiveWrapper = styled.div`
    width: 100%;
    overflow-x: auto;
`;

const RegistryGridTable = styled.table`
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 14px;

    thead tr {
        background-color: #fafafa;
        border-bottom: 1px solid #e2e8f0;
        color: #475569;
        font-size: 12px;
        font-weight: 600;
    }

    th, td { padding: 14px 20px; white-space: nowrap; vertical-align: middle; }
    tbody tr {
        border-bottom: 1px solid #f1f5f9;
        &:hover { background-color: #f8fafc; }
    }

    .font-mono { font-family: monospace; font-size: 13px; }
    .font-bold { font-weight: 600; }
    .font-semibold { font-weight: 600; }
    .text-muted { color: #64748b; }
    .text-dark { color: #0f172a; }
    .summary-text { max-width: 320px; overflow: hidden; text-overflow: ellipsis; color: #334155; }
`;

const PlateCodeBlock = styled.code`
    font-family: monospace;
    font-size: 11px;
    color: #64748b;
    background-color: #f1f5f9;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
    text-transform: uppercase;
`;

const CategoryBadge = styled.span`
    background-color: #f1f5f9;
    color: #475569;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
`;

const StatusBadge = styled.span`
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background-color: ${props => 
        props.status === 'Completed' ? '#f0fdf4' :
        props.status === 'In Progress' ? '#fffbeb' :
        '#fef2f2'
    };
    color: ${props => 
        props.status === 'Completed' ? '#16a34a' :
        props.status === 'In Progress' ? '#d97706' :
        '#dc2626'
    };
    &::before { content: "●"; font-size: 8px; }
`;

const ActionButtonsWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    button {
        background: #ffffff; border: 1px solid #e2e8f0; width: 32px; height: 32px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s;
    }
    .icon-btn-view { color: #2563eb; &:hover { background: #eff6ff; border-color: #bfdbfe; } }
    .icon-btn-edit { color: #d97706; &:hover { background: #fffbeb; border-color: #fde68a; } }
    .icon-btn-delete { color: #dc2626; &:hover { background: #fef2f2; border-color: #fca5a5; } }
`;

// ==================== MODAL STYLES ====================

const ModalOverlay = styled.div`
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background-color: rgba(15, 23, 42, 0.3); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 16px;
`;

const ModalContent = styled.div`
    background-color: #ffffff; border-radius: 12px; width: 100%; max-width: 680px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15); display: flex; flex-direction: column;
    overflow: hidden; animation: modalSlideIn 0.2s ease-out;

    @keyframes modalSlideIn {
        from { opacity: 0; transform: scale(0.97); }
        to { opacity: 1; transform: scale(1); }
    }
`;

const ModalHeader = styled.div`
    padding: 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-start;
    h5 { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0; }
    .modal-subtitle { font-size: 13px; color: #64748b; margin: 6px 0 0 0; }
    .close-x-btn { background: none; border: none; color: #94a3b8; font-size: 20px; cursor: pointer; }
`;

const ModalBody = styled.div` padding: 24px; max-height: 70vh; overflow-y: auto; `;

const FormRow = styled.div`
    display: grid;
    grid-template-columns: ${props => props.columns === '3' ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)'};
    gap: 16px; margin-bottom: 16px;
    @media (max-width: 576px) { grid-template-columns: 1fr; }
`;

const FormGroup = styled.div`
    display: flex; flex-direction: column; width: 100%;
    label { display: block; font-size: 13px; font-weight: 600; color: #1e293b; margin-bottom: 6px; }
    input[type="text"], input[type="number"], input[type="date"], select, textarea {
        width: 100%; padding: 10px 14px; font-size: 14px; border-radius: 6px;
        border: 1px solid #cbd5e1; background-color: #ffffff; color: #0f172a; outline: none; box-sizing: border-box;
        &:focus { border-color: #2563eb; box-shadow: 0 0 0 1px #2563eb; }
    }
    textarea { resize: none; }
`;

const ModalFooter = styled.div`
    padding: 16px 24px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 12px; background-color: #fafafa;
    button { padding: 10px 20px; font-size: 14px; font-weight: 600; border-radius: 6px; cursor: pointer; border: none; }
    .btn-cancel { background-color: #f1f5f9; color: #475569; }
    .btn-submit { background-color: #2563eb; color: #ffffff; }
    .btn-edit { background-color: #d97706; color: #ffffff; }
`;

// ==================== VIEW MODAL STYLES ====================

const ViewModalBody = styled.div` padding: 24px; max-height: 70vh; overflow-y: auto; `;

const ViewInfoGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
`;

const ViewInfoItem = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    ${props => props.fullWidth && 'grid-column: 1 / -1;'}

    label {
        font-size: 12px;
        font-weight: 600;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    span {
        font-size: 15px;
        color: #0f172a;
    }

    small {
        font-size: 13px;
    }

    .description-text {
        font-size: 14px;
        color: #334155;
        line-height: 1.6;
        margin: 4px 0 0 0;
        background: #f8fafc;
        padding: 12px;
        border-radius: 6px;
        border: 1px solid #f1f5f9;
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
        border-radius: 6px;
        cursor: pointer;
        border: none;
    }
    .btn-cancel {
        background-color: #f1f5f9;
        color: #475569;
    }
    .btn-edit {
        background-color: #d97706;
        color: #ffffff;
    }
`;