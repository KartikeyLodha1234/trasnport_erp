import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:8001/api';

const PageContainer = styled.div`
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: ${props => props.columns || '1fr 1fr'};
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Panel = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const PanelHeader = styled.div`
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #1e293b;
`;

const PanelTitle = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
`;

const PanelBody = styled.div`
  padding: 16px;
`;

const FormGroup = styled.div`
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #334155;
  margin-bottom: 4px;
`;

const Required = styled.span`
  color: #ef4444;
  margin-left: 2px;
`;

const Input = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
  background: ${props => props.readOnly ? '#f8fafc' : 'white'};

  &:focus {
    outline: none;
    border-color: #0044e4;
    box-shadow: 0 0 0 3px rgba(0, 68, 228, 0.1);
  }

  &.fw-bold {
    font-weight: 700;
  }

  &:disabled {
    background: #f1f5f9;
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  width: 100%;
  box-sizing: border-box;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  transition: all 0.2s;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #0044e4;
    box-shadow: 0 0 0 3px rgba(0, 68, 228, 0.1);
  }

  &:disabled {
    background: #f1f5f9;
    cursor: not-allowed;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  box-sizing: border-box;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
  min-height: 80px;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #0044e4;
    box-shadow: 0 0 0 3px rgba(0, 68, 228, 0.1);
  }
`;

const InputGroup = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const GSTSection = styled.div`
  background: #f0f4ff;
  border: 1px solid #c5d5ff;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 12px;
`;

const GSTCheckbox = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;

  label {
    font-size: 12.5px;
    font-weight: 600;
    color: #0044e4;
    cursor: pointer;
    margin: 0;
  }

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
`;

const GSTTypeGroup = styled.div`
  display: flex;
  gap: 16px;
  margin: 8px 0;

  label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    cursor: pointer;
  }

  input[type="radio"] {
    cursor: pointer;
  }
`;

const TotalBox = styled.div`
  background: #0044e4;
  color: white;
  border-radius: 4px;
  padding: 10px 14px;
  text-align: right;

  .label {
    font-size: 11px;
    opacity: 0.8;
  }

  .amount {
    font-size: 22px;
    font-weight: 700;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &.primary {
    background: #0044e4;
    color: white;

    &:hover {
      background: #0037b8;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  &.secondary {
    background: #e2e8f0;
    color: #334155;

    &:hover {
      background: #cbd5e1;
    }
  }
`;

const Datalist = styled.datalist``;

const GSTInfo = styled.div`
  font-size: 11px;
  color: #666;
  margin-top: 3px;
`;

const Alert = styled.div`
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 14px;
  
  ${props => props.type === 'success' && `
    background: #dcfce7;
    color: #166534;
    border: 1px solid #bbf7d0;
  `}
  
  ${props => props.type === 'error' && `
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fecaca;
  `}
`;

const CreateLR = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [formData, setFormData] = useState({
    lr_number: '',
    booking_date: '',
    branch_id: '',
    pickup_location: '',
    delivery_location: '',
    consignor_id: '',
    consignee_id: '',
    goods_desc: '',
    packages: '',
    weight: '',
    weight_type: 'kg',
    invoice_no: '',
    invoice_value: '',
    eway_bill: '',
    payment_mode: '',
    freight_charge: '',
    loading_charges: 0,
    unloading_charges: 0,
    other_charges: 0,
    discount: 0,
    gst_applicable: false,
    gst_type: 'igst',
    cgst_amount: 0,
    sgst_amount: 0,
    igst_amount: 0,
    gst: 0,
    total_amount: 0,
    notes: '',
  });

  const [consignorGST, setConsignorGST] = useState('');
  const [consigneeGST, setConsigneeGST] = useState('');
  const [branches, setBranches] = useState([]);
  const [parties, setParties] = useState([]);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    fetchMasterData();
    generateDocumentNumbers();
  }, []);

  const fetchMasterData = async () => {
    try {
      const branchesRes = await fetch(`${API_BASE}/branches`);
      const branchesResult = await branchesRes.json();
      if (branchesResult.success || branchesResult.data) {
        setBranches(branchesResult.data || branchesResult);
      }

      const partiesRes = await fetch(`${API_BASE}/parties`);
      const partiesResult = await partiesRes.json();
      if (partiesResult.success || partiesResult.data) {
        setParties(partiesResult.data || partiesResult);
      }

      const citiesRes = await fetch(`${API_BASE}/cities`);
      const citiesResult = await citiesRes.json();
      if (citiesResult.success || citiesResult.data) {
        const cityData = citiesResult.data || citiesResult;
        const cityNames = Array.isArray(cityData) ? cityData.map(c => c.name || c) : [];
        setCities(cityNames);
      }
    } catch (error) {
      console.error('Error fetching master data:', error);
      setAlert({ type: 'error', message: 'Failed to load master data. Please refresh.' });
    }
  };

  const generateDocumentNumbers = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    const lrSeq = String(Math.floor(Math.random() * 9000) + 1000);
    const lrNumber = `LR${year}${month}${day}${lrSeq}`;
    
    const invSeq = String(Math.floor(Math.random() * 900) + 100);
    const invoiceNo = `INV${year}${month}${day}${invSeq}`;
    
    const ewaySeq = String(Math.floor(Math.random() * 9000000000) + 1000000000);
    const ewayBill = ewaySeq;
    
    setFormData(prev => ({
      ...prev,
      lr_number: lrNumber,
      booking_date: today.toISOString().split('T')[0],
      invoice_no: invoiceNo,
      eway_bill: ewayBill,
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (alert.message) {
      setAlert({ type: '', message: '' });
    }

    if (name === 'consignor_id') {
      const party = parties.find(p => p.id === parseInt(value));
      setConsignorGST(party ? `GSTIN: ${party.gstin || 'N/A'}` : '');
    }

    if (name === 'consignee_id') {
      const party = parties.find(p => p.id === parseInt(value));
      setConsigneeGST(party ? `GSTIN: ${party.gstin || 'N/A'}` : '');
    }
  };

  // Auto-determine GST type based on party states
  useEffect(() => {
    if (formData.consignor_id && formData.consignee_id) {
      const consignor = parties.find(p => p.id === parseInt(formData.consignor_id));
      const consignee = parties.find(p => p.id === parseInt(formData.consignee_id));
      
      if (consignor && consignee && consignor.state && consignee.state) {
        if (consignor.state.toLowerCase() === consignee.state.toLowerCase()) {
          setFormData(prev => ({ ...prev, gst_type: 'cgst_sgst' }));
        } else {
          setFormData(prev => ({ ...prev, gst_type: 'igst' }));
        }
      }
    }
  }, [formData.consignor_id, formData.consignee_id, parties]);

  useEffect(() => {
    calculateTotal();
  }, [formData.loading_charges, formData.unloading_charges, formData.other_charges, 
      formData.discount, formData.freight_charge, formData.gst_type, formData.gst_applicable]);

  const toggleGST = (checked) => {
    setFormData(prev => ({
      ...prev,
      gst_applicable: checked,
    }));
  };

  const calculateTotal = () => {
    const freight = parseFloat(formData.freight_charge) || 0;
    const loading = parseFloat(formData.loading_charges) || 0;
    const unloading = parseFloat(formData.unloading_charges) || 0;
    const other = parseFloat(formData.other_charges) || 0;
    const discount = parseFloat(formData.discount) || 0;

    let subtotal = freight + loading + unloading + other - discount;
    let cgst = 0, sgst = 0, igst = 0;

    if (formData.gst_applicable && subtotal > 0) {
      if (formData.gst_type === 'igst') {
        igst = subtotal * 0.05;
      } else {
        cgst = subtotal * 0.025;
        sgst = subtotal * 0.025;
      }
    }

    const totalGst = cgst + sgst + igst;
    const total = subtotal + totalGst;

    setFormData(prev => ({
      ...prev,
      cgst_amount: cgst,
      sgst_amount: sgst,
      igst_amount: igst,
      gst: totalGst,
      total_amount: total,
    }));
  };

  const validateForm = () => {
    if (!formData.pickup_location.trim()) {
      setAlert({ type: 'error', message: 'Please enter Pickup Location.' });
      return false;
    }
    if (!formData.delivery_location.trim()) {
      setAlert({ type: 'error', message: 'Please enter Delivery Location.' });
      return false;
    }
    if (!formData.goods_desc.trim()) {
      setAlert({ type: 'error', message: 'Please enter Description of Goods.' });
      return false;
    }
    if (!formData.payment_mode) {
      setAlert({ type: 'error', message: 'Please select Payment Type.' });
      return false;
    }
    if (!formData.freight_charge || parseFloat(formData.freight_charge) <= 0) {
      setAlert({ type: 'error', message: 'Please enter Freight Amount.' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setAlert({ type: '', message: '' });

    try {
      const payload = {
        lr_number: formData.lr_number,
        booking_date: formData.booking_date,
        pickup_location: formData.pickup_location,
        delivery_location: formData.delivery_location,
        destination: formData.delivery_location,
        consignor_id: formData.consignor_id || null,
        consignee_id: formData.consignee_id || null,
        client: formData.consignor_id || '',
        goods_desc: formData.goods_desc,
        packages: parseInt(formData.packages) || 0,
        weight: parseFloat(formData.weight) || 0,
        weight_type: formData.weight_type,
        invoice_no: formData.invoice_no || '',
        invoice_value: parseFloat(formData.invoice_value) || 0,
        eway_bill: formData.eway_bill || '',
        payment_mode: formData.payment_mode,
        freight_charge: parseFloat(formData.freight_charge) || 0,
        loading_charges: parseFloat(formData.loading_charges) || 0,
        unloading_charges: parseFloat(formData.unloading_charges) || 0,
        other_charges: parseFloat(formData.other_charges) || 0,
        discount: parseFloat(formData.discount) || 0,
        gst: formData.gst || 0,
        notes: formData.notes || '',
        status: 'pending',
      };

      const response = await fetch(`${API_BASE}/shipments/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setAlert({ 
          type: 'success', 
          message: `LR ${formData.lr_number} booked successfully!` 
        });
        setTimeout(() => {
          navigate('/shipments');
        }, 1500);
      } else {
        setAlert({ 
          type: 'error', 
          message: data.detail || data.message || 'Failed to book LR.' 
        });
      }
    } catch (error) {
      console.error('Error booking LR:', error);
      setAlert({ 
        type: 'error', 
        message: 'Network error. Please check your connection.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <Form onSubmit={handleSubmit}>
        {alert.message && (
          <Alert type={alert.type}>
            {alert.type === 'success' ? '✅ ' : '❌ '}
            {alert.message}
          </Alert>
        )}

        <Row columns="2fr 1fr">
          <Column>
            <Panel>
              <PanelHeader>
                <PanelTitle>📄 LR Details</PanelTitle>
              </PanelHeader>
              <PanelBody>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <FormGroup>
                    <Label>LR Number <Required>*</Required></Label>
                    <Input type="text" name="lr_number" value={formData.lr_number} onChange={handleChange} className="fw-bold" required readOnly />
                  </FormGroup>
                  <FormGroup>
                    <Label>Booking Date <Required>*</Required></Label>
                    <Input type="date" name="booking_date" value={formData.booking_date} onChange={handleChange} required />
                  </FormGroup>
                  <FormGroup>
                    <Label>Branch</Label>
                    <Select name="branch_id" value={formData.branch_id} onChange={handleChange}>
                      <option value="">Select Branch</option>
                      {branches.map(branch => (
                        <option key={branch.id} value={branch.id}>{branch.name}</option>
                      ))}
                    </Select>
                  </FormGroup>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <FormGroup>
                    <Label>Pickup Location <Required>*</Required></Label>
                    <Input type="text" name="pickup_location" value={formData.pickup_location} onChange={handleChange} list="city_list" placeholder="Origin city" required />
                  </FormGroup>
                  <FormGroup>
                    <Label>Delivery Location <Required>*</Required></Label>
                    <Input type="text" name="delivery_location" value={formData.delivery_location} onChange={handleChange} list="city_list" placeholder="Destination city" required />
                  </FormGroup>
                </div>
                <Datalist id="city_list">
                  {cities.map((city, index) => (
                    <option key={index} value={city} />
                  ))}
                </Datalist>
              </PanelBody>
            </Panel>

            <Panel>
              <PanelHeader>
                <PanelTitle>🔄 Consignor & Consignee</PanelTitle>
              </PanelHeader>
              <PanelBody>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <FormGroup>
                    <Label>Consignor (Sender)</Label>
                    <Select name="consignor_id" value={formData.consignor_id} onChange={handleChange}>
                      <option value="">-- Select Consignor --</option>
                      {parties.map(party => (
                        <option key={party.id} value={party.id}>{party.name} - {party.city}</option>
                      ))}
                    </Select>
                    {consignorGST && (
                      <GSTInfo>
                        {consignorGST}
                        {parties.find(p => p.id === parseInt(formData.consignor_id))?.state && 
                          ` | State: ${parties.find(p => p.id === parseInt(formData.consignor_id)).state}`}
                      </GSTInfo>
                    )}
                  </FormGroup>
                  <FormGroup>
                    <Label>Consignee (Receiver)</Label>
                    <Select name="consignee_id" value={formData.consignee_id} onChange={handleChange}>
                      <option value="">-- Select Consignee --</option>
                      {parties.map(party => (
                        <option key={party.id} value={party.id}>{party.name} - {party.city}</option>
                      ))}
                    </Select>
                    {consigneeGST && (
                      <GSTInfo>
                        {consigneeGST}
                        {parties.find(p => p.id === parseInt(formData.consignee_id))?.state && 
                          ` | State: ${parties.find(p => p.id === parseInt(formData.consignee_id)).state}`}
                      </GSTInfo>
                    )}
                  </FormGroup>
                </div>
              </PanelBody>
            </Panel>

            <Panel>
              <PanelHeader>
                <PanelTitle>📦 Goods Details</PanelTitle>
              </PanelHeader>
              <PanelBody>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <FormGroup>
                    <Label>Description of Goods <Required>*</Required></Label>
                    <Input type="text" name="goods_desc" value={formData.goods_desc} onChange={handleChange} placeholder="e.g. Electronic Goods" required />
                  </FormGroup>
                  <FormGroup>
                    <Label>No. of Packages</Label>
                    <Input type="number" name="packages" value={formData.packages} onChange={handleChange} min="0" placeholder="0" />
                  </FormGroup>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <FormGroup>
                    <Label>Weight</Label>
                    <InputGroup>
                      <Input type="number" name="weight" value={formData.weight} onChange={handleChange} min="0" step="0.01" placeholder="0.00" style={{ flex: 1 }} />
                      <Select name="weight_type" value={formData.weight_type} onChange={handleChange} style={{ width: '80px' }}>
                        <option value="kg">Kg</option>
                        <option value="ton">Ton</option>
                      </Select>
                    </InputGroup>
                  </FormGroup>
                  <FormGroup>
                    <Label>Invoice / Bill No.</Label>
                    <Input type="text" name="invoice_no" value={formData.invoice_no} onChange={handleChange} placeholder="Auto-generated invoice number" />
                  </FormGroup>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <FormGroup>
                    <Label>Invoice Value (₹)</Label>
                    <Input type="number" name="invoice_value" value={formData.invoice_value} onChange={handleChange} min="0" step="0.01" placeholder="0.00" />
                  </FormGroup>
                  <FormGroup>
                    <Label>E-Way Bill No.</Label>
                    <Input type="text" name="eway_bill" value={formData.eway_bill} onChange={handleChange} placeholder="Auto-generated e-way bill" />
                  </FormGroup>
                </div>
              </PanelBody>
            </Panel>
          </Column>

          <Column>
            <Panel>
              <PanelHeader>
                <PanelTitle>💰 Freight & Charges</PanelTitle>
              </PanelHeader>
              <PanelBody>
                <FormGroup style={{ marginBottom: '12px' }}>
                  <Label>Payment Type <Required>*</Required></Label>
                  <Select name="payment_mode" value={formData.payment_mode} onChange={handleChange} required>
                    <option value="">-- Select --</option>
                    <option value="paid">Paid (Prepaid)</option>
                    <option value="topay">To Pay</option>
                    <option value="tbb">To Be Billed</option>
                  </Select>
                </FormGroup>

                <FormGroup style={{ marginBottom: '12px' }}>
                  <Label>Freight Amount (₹) <Required>*</Required></Label>
                  <Input type="number" name="freight_charge" value={formData.freight_charge} onChange={handleChange} min="0" step="0.01" placeholder="0.00" className="fw-bold" required />
                </FormGroup>

                <FormGroup style={{ marginBottom: '12px' }}>
                  <Label>Loading Charges (₹)</Label>
                  <Input type="number" name="loading_charges" value={formData.loading_charges} onChange={handleChange} min="0" step="0.01" placeholder="0" />
                </FormGroup>

                <FormGroup style={{ marginBottom: '12px' }}>
                  <Label>Unloading Charges (₹)</Label>
                  <Input type="number" name="unloading_charges" value={formData.unloading_charges} onChange={handleChange} min="0" step="0.01" placeholder="0" />
                </FormGroup>

                <FormGroup style={{ marginBottom: '12px' }}>
                  <Label>Other Charges (₹)</Label>
                  <Input type="number" name="other_charges" value={formData.other_charges} onChange={handleChange} min="0" step="0.01" placeholder="0" />
                </FormGroup>

                <FormGroup style={{ marginBottom: '12px' }}>
                  <Label>Discount (₹)</Label>
                  <Input type="number" name="discount" value={formData.discount} onChange={handleChange} min="0" step="0.01" placeholder="0" />
                </FormGroup>

                <GSTSection>
                  <GSTCheckbox>
                    <input type="checkbox" name="gst_applicable" id="gst_applicable" checked={formData.gst_applicable} onChange={(e) => toggleGST(e.target.checked)} />
                    <label htmlFor="gst_applicable">GST Applicable</label>
                  </GSTCheckbox>

                  {formData.gst_applicable && (
                    <>
                      <div>
                        <Label style={{ fontSize: '11.5px', color: '#555' }}>GST Type</Label>
                        <GSTTypeGroup>
                          <label>
                            <input type="radio" name="gst_type" value="igst" checked={formData.gst_type === 'igst'} onChange={handleChange} />
                            IGST @5%
                          </label>
                          <label>
                            <input type="radio" name="gst_type" value="cgst_sgst" checked={formData.gst_type === 'cgst_sgst'} onChange={handleChange} />
                            CGST+SGST @2.5% each
                          </label>
                        </GSTTypeGroup>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                        <FormGroup>
                          <Label style={{ fontSize: '10.5px', color: '#666' }}>CGST (₹)</Label>
                          <Input type="number" value={formData.cgst_amount.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                        </FormGroup>
                        <FormGroup>
                          <Label style={{ fontSize: '10.5px', color: '#666' }}>SGST (₹)</Label>
                          <Input type="number" value={formData.sgst_amount.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                        </FormGroup>
                        <FormGroup>
                          <Label style={{ fontSize: '10.5px', color: '#666' }}>IGST (₹)</Label>
                          <Input type="number" value={formData.igst_amount.toFixed(2)} readOnly style={{ background: '#f5f5f5' }} />
                        </FormGroup>
                      </div>
                    </>
                  )}
                </GSTSection>

                <TotalBox>
                  <div className="label">TOTAL AMOUNT</div>
                  <div className="amount">₹ {formData.total_amount.toFixed(2)}</div>
                </TotalBox>
              </PanelBody>
            </Panel>

            <Panel>
              <PanelHeader>
                <PanelTitle>💬 Remarks</PanelTitle>
              </PanelHeader>
              <PanelBody>
                <Textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Additional notes..." rows="3" />
              </PanelBody>
            </Panel>

            <Panel>
              <PanelBody style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Button type="submit" className="primary" disabled={loading}>
                  {loading ? '⏳ Booking...' : '✅ Book LR'}
                </Button>
                <Button type="button" className="secondary" onClick={() => navigate('/shipments')} disabled={loading}>
                  ✕ Cancel
                </Button>
              </PanelBody>
            </Panel>
          </Column>
        </Row>
      </Form>
    </PageContainer>
  );
};

export default CreateLR;