import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Challan = () => {
  const user = { name: 'Admin', role: 'admin' };
  const [challans, setChallans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingChallan, setEditingChallan] = useState(null);
  const [form, setForm] = useState({
    challanNumber: '',
    challanDate: new Date().toISOString().slice(0,10),
    partyName: '',
    vehicleNumber: '',
    fromLocation: '',
    toLocation: '',
    totalAmount: '',
    status: 'pending',
    paymentStatus: 'pending',
    assignedTo: 'admin'
  });

  useEffect(() => {
    const mockData = [
      {
        _id: '1',
        challanNumber: 'CH-202401-0001',
        challanDate: '2024-01-15',
        partyName: 'ABC Traders',
        vehicleNumber: 'MH-01-AB-1234',
        fromLocation: 'Mumbai',
        toLocation: 'Delhi',
        totalAmount: 25000,
        status: 'dispatched',
        paymentStatus: 'paid',
        assignedTo: 'admin'
      },
      {
        _id: '2',
        challanNumber: 'CH-202401-0002',
        challanDate: '2024-01-18',
        partyName: 'XYZ Enterprises',
        vehicleNumber: 'MH-02-CD-5678',
        fromLocation: 'Pune',
        toLocation: 'Chennai',
        totalAmount: 35000,
        status: 'pending',
        paymentStatus: 'pending',
        assignedTo: 'driver'
      }
    ];
    setChallans(mockData);
    setLoading(false);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateSingle = (e) => {
    e.preventDefault();
    if (!form.partyName || !form.vehicleNumber) {
      alert('Please fill Party Name and Vehicle Number');
      return;
    }
    
    const newChallan = {
      _id: Date.now().toString(),
      challanNumber: form.challanNumber || `CH-${Date.now().toString().slice(-6)}`,
      challanDate: form.challanDate,
      partyName: form.partyName,
      vehicleNumber: form.vehicleNumber,
      fromLocation: form.fromLocation || 'N/A',
      toLocation: form.toLocation || 'N/A',
      totalAmount: Number(form.totalAmount) || 0,
      status: form.status,
      paymentStatus: form.paymentStatus,
      assignedTo: form.assignedTo
    };
    setChallans(prev => [newChallan, ...prev]);
    resetForm();
    setShowForm(false);
  };

  const createTwoChallans = () => {
    const now = Date.now();
    const newOnes = [
      {
        _id: `${now}-a`,
        challanNumber: `CH-${now.toString().slice(-6)}-A`,
        challanDate: new Date().toISOString().slice(0,10),
        partyName: 'NewCo A',
        vehicleNumber: 'MH-99-XX-0001',
        fromLocation: 'Bengaluru',
        toLocation: 'Hyderabad',
        totalAmount: 12000,
        status: 'pending',
        paymentStatus: 'pending',
        assignedTo: 'driver'
      },
      {
        _id: `${now}-b`,
        challanNumber: `CH-${now.toString().slice(-6)}-B`,
        challanDate: new Date().toISOString().slice(0,10),
        partyName: 'NewCo B',
        vehicleNumber: 'MH-99-XX-0002',
        fromLocation: 'Kochi',
        toLocation: 'Trivandrum',
        totalAmount: 18000,
        status: 'dispatched',
        paymentStatus: 'paid',
        assignedTo: 'admin'
      }
    ];
    setChallans(prev => [...newOnes, ...prev]);
  };

  const deleteChallan = (id) => {
    if (window.confirm('Are you sure you want to delete this challan?')) {
      setChallans(prev => prev.filter(c => c._id !== id));
    }
  };

  const editChallan = (challan) => {
    setEditingChallan(challan._id);
    setForm({
      challanNumber: challan.challanNumber,
      challanDate: challan.challanDate,
      partyName: challan.partyName,
      vehicleNumber: challan.vehicleNumber,
      fromLocation: challan.fromLocation || '',
      toLocation: challan.toLocation || '',
      totalAmount: challan.totalAmount,
      status: challan.status,
      paymentStatus: challan.paymentStatus,
      assignedTo: challan.assignedTo || 'admin'
    });
    setShowForm(true);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    const updatedChallan = {
      _id: editingChallan,
      challanNumber: form.challanNumber,
      challanDate: form.challanDate,
      partyName: form.partyName,
      vehicleNumber: form.vehicleNumber,
      fromLocation: form.fromLocation || 'N/A',
      toLocation: form.toLocation || 'N/A',
      totalAmount: Number(form.totalAmount) || 0,
      status: form.status,
      paymentStatus: form.paymentStatus,
      assignedTo: form.assignedTo
    };
    setChallans(prev => prev.map(c => c._id === editingChallan ? updatedChallan : c));
    resetForm();
    setShowForm(false);
    setEditingChallan(null);
  };

  const resetForm = () => {
    setForm({
      challanNumber: '',
      challanDate: new Date().toISOString().slice(0,10),
      partyName: '',
      vehicleNumber: '',
      fromLocation: '',
      toLocation: '',
      totalAmount: '',
      status: 'pending',
      paymentStatus: 'pending',
      assignedTo: 'admin'
    });
  };

  const downloadChallanPdf = (challan) => {
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      doc.setFontSize(20);
      doc.setTextColor(0, 68, 228);
      doc.text('CHALLAN', 40, 50);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text('Transport ERP System', 40, 70);
      doc.setDrawColor(0, 68, 228);
      doc.line(40, 80, 550, 80);
      doc.setFontSize(12);
      doc.setTextColor(0);
      let y = 100;
      const fields = [
        ['Challan Number', challan.challanNumber],
        ['Date', challan.challanDate],
        ['Party Name', challan.partyName],
        ['Vehicle Number', challan.vehicleNumber],
        ['From Location', challan.fromLocation],
        ['To Location', challan.toLocation],
        ['Total Amount', `₹${Number(challan.totalAmount).toLocaleString()}`],
        ['Status', challan.status.toUpperCase()],
        ['Payment Status', challan.paymentStatus.toUpperCase()],
        ['Assigned To', (challan.assignedTo || 'admin').toUpperCase()]
      ];
      fields.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(`${label}:`, 40, y);
        doc.setFont('helvetica', 'normal');
        doc.text(String(value), 200, y);
        y += 24;
      });
      y += 20;
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text('Generated by Transport ERP System', 40, y);
      doc.text(`Date: ${new Date().toLocaleString()}`, 40, y + 16);
      doc.save(`${challan.challanNumber || 'challan'}.pdf`);
    } catch (err) {
      alert('Failed to generate PDF.');
      console.error(err);
    }
  };

  const filteredChallans = challans.filter(challan =>
    challan.challanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (challan.partyName && challan.partyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (challan.vehicleNumber && challan.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 style={{ margin: 0, color: '#1e293b' }}>Challan Management</h1>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => { setEditingChallan(null); resetForm(); setShowForm(!showForm); }}
            style={{ padding: '10px 20px', backgroundColor: '#0044e4', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
            {showForm ? '✕ Close Form' : '+ Create Challan'}
          </button>
          
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input type="text" placeholder="Search by Challan Number, Party Name, or Vehicle Number..."
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
      </div>

      {showForm && (
        <div style={{ marginBottom: '20px', background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, color: '#1e293b' }}>{editingChallan ? 'Edit Challan' : 'Create Challan'}</h3>
          <form onSubmit={editingChallan ? handleUpdate : handleCreateSingle}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <input name="challanNumber" placeholder="Challan Number (optional)" value={form.challanNumber} onChange={handleInputChange} style={inputStyle} />
              <input name="challanDate" type="date" value={form.challanDate} onChange={handleInputChange} style={inputStyle} required />
              <input name="partyName" placeholder="Party Name *" value={form.partyName} onChange={handleInputChange} style={inputStyle} required />
              <input name="vehicleNumber" placeholder="Vehicle Number *" value={form.vehicleNumber} onChange={handleInputChange} style={inputStyle} required />
              <input name="fromLocation" placeholder="From Location" value={form.fromLocation} onChange={handleInputChange} style={inputStyle} />
              <input name="toLocation" placeholder="To Location" value={form.toLocation} onChange={handleInputChange} style={inputStyle} />
              <input name="totalAmount" type="number" placeholder="Total Amount" value={form.totalAmount} onChange={handleInputChange} style={inputStyle} />
              <select name="status" value={form.status} onChange={handleInputChange} style={inputStyle}>
                <option value="pending">Pending</option>
                <option value="dispatched">Dispatched</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select name="paymentStatus" value={form.paymentStatus} onChange={handleInputChange} style={inputStyle}>
                <option value="pending">Payment Pending</option>
                <option value="paid">Payment Paid</option>
              </select>
              <select name="assignedTo" value={form.assignedTo} onChange={handleInputChange} style={inputStyle}>
                <option value="admin">Admin</option>
                <option value="driver">Driver</option>
              </select>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              <button type="submit" style={{ padding: '10px 24px', background: editingChallan ? '#f59e0b' : '#0044e4', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                {editingChallan ? 'Update Challan' : 'Create Challan'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingChallan(null); resetForm(); }}
                style={{ padding: '10px 24px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '8px', overflow: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              <th style={thStyle}>Challan No.</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Party</th>
              <th style={thStyle}>Vehicle</th>
              <th style={thStyle}>From/To</th>
              <th style={{...thStyle, textAlign: 'right'}}>Amount</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Payment</th>
              <th style={thStyle}>Assigned</th>
              <th style={{...thStyle, textAlign: 'center'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredChallans.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  No challans found. Click "Create Challan" to add one.
                </td>
              </tr>
            ) : (
              filteredChallans.map((challan) => (
                <tr key={challan._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={tdStyle}><strong>{challan.challanNumber}</strong></td>
                  <td style={tdStyle}>{challan.challanDate}</td>
                  <td style={tdStyle}>{challan.partyName}</td>
                  <td style={tdStyle}>{challan.vehicleNumber}</td>
                  <td style={tdStyle}>{challan.fromLocation} → {challan.toLocation}</td>
                  <td style={{...tdStyle, textAlign: 'right'}}>₹{Number(challan.totalAmount).toLocaleString()}</td>
                  <td style={tdStyle}><span style={getStatusStyle(challan.status)}>{challan.status}</span></td>
                  <td style={tdStyle}><span style={getPaymentStyle(challan.paymentStatus)}>{challan.paymentStatus}</span></td>
                  <td style={tdStyle}><span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', background: challan.assignedTo === 'admin' ? '#dbeafe' : '#fef3c7', color: challan.assignedTo === 'admin' ? '#1e40af' : '#92400e' }}>{(challan.assignedTo || 'admin').toUpperCase()}</span></td>
                  <td style={{...tdStyle, textAlign: 'center'}}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <button onClick={() => editChallan(challan)} style={actionButtonStyle('#f59e0b')}>✏️</button>
                      <button onClick={() => downloadChallanPdf(challan)} style={actionButtonStyle('#0ea5a4')}>📄</button>
                      <button onClick={() => deleteChallan(challan._id)} style={actionButtonStyle('#ef4444')}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '20px', padding: '12px 16px', background: '#f0fdf4', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ margin: 0, color: '#065f46' }}>
          ✅ User logged in: <strong>{user?.name || 'Admin'}</strong> ({user?.role || 'admin'})
        </p>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>
          Total Challans: {challans.length}
        </p>
      </div>
    </div>
  );
};

const inputStyle = {
  padding: '10px 12px',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  fontSize: '14px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box'
};

const thStyle = {
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: '600',
  color: '#475569',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  borderBottom: '2px solid #e2e8f0'
};

const tdStyle = {
  padding: '12px 16px',
  fontSize: '14px',
  color: '#1e293b'
};

const getStatusStyle = (status) => ({
  padding: '4px 12px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: '500',
  display: 'inline-block',
  background: status === 'dispatched' ? '#dbeafe' : 
              status === 'delivered' ? '#d1fae5' :
              status === 'cancelled' ? '#fee2e2' : '#fef3c7',
  color: status === 'dispatched' ? '#1e40af' : 
         status === 'delivered' ? '#065f46' :
         status === 'cancelled' ? '#991b1b' : '#92400e'
});

const getPaymentStyle = (paymentStatus) => ({
  padding: '4px 12px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: '500',
  display: 'inline-block',
  background: paymentStatus === 'paid' ? '#d1fae5' : '#fef3c7',
  color: paymentStatus === 'paid' ? '#065f46' : '#92400e'
});

const actionButtonStyle = (color) => ({
  padding: '4px 8px',
  background: 'white',
  color: color,
  border: `1px solid ${color}`,
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px'
});

export default Challan;