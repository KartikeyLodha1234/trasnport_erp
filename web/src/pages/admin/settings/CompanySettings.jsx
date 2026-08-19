// web/src/pages/admin/settings/CompanySettings.jsx
import React, { useState } from 'react';
import styled from 'styled-components';

const PageContainer = styled.div`
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
`;

const Card = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const CardHeader = styled.div`
  padding: 16px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 600;
  font-size: 16px;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CardBody = styled.div`
  padding: 24px;
`;

const Form = styled.form``;

const Row = styled.div`
  display: grid;
  grid-template-columns: ${props => props.columns || '1fr 1fr'};
  gap: 16px;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-size: 14px;
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
  background: white;

  &:focus {
    outline: none;
    border-color: #0044e4;
    box-shadow: 0 0 0 3px rgba(0, 68, 228, 0.1);
  }

  &::placeholder {
    color: #94a3b8;
  }

  &:disabled {
    background: #f1f5f9;
    color: #64748b;
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
  transition: all 0.2s;
  resize: vertical;
  min-height: 60px;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #0044e4;
    box-shadow: 0 0 0 3px rgba(0, 68, 228, 0.1);
  }

  &::placeholder {
    color: #94a3b8;
  }
`;

const Button = styled.button`
  padding: 10px 24px;
  background: #0044e4;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: #0037b8;
  }

  &:active {
    transform: scale(0.98);
  }
`;

const ErrorMessage = styled.span`
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
`;

const CompanySettings = () => {
  const [formData, setFormData] = useState({
    companyName: 'Transport', // Default value - non-editable
    ownerName: '',
    phone: '',
    gstin: '',
    panNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [errors, setErrors] = useState({
    companyName: '',
    city: '',
    state: '',
    pincode: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {};

    // Validate Company Name (required but non-editable)
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company Name is required';
      isValid = false;
    }

    // Validate City (required)
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
      isValid = false;
    }

    // Validate State (required)
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
      isValid = false;
    }

    // Validate Pincode (required)
    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
      isValid = false;
    } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
      newErrors.pincode = 'Pincode must be 6 digits';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    console.log('Company Profile Data:', formData);
    alert('Company profile saved successfully!');
  };

  return (
    <PageContainer>
      <Card>
        <CardHeader>
          🏢 Company Profile
        </CardHeader>
        <CardBody>
          <Form onSubmit={handleSubmit}>
            {/* Row 1: Company Name (Disabled/Read-only) & Phone */}
            <Row columns="1fr 1fr">
              <FormGroup>
                <Label>
                  Company Name <Required>*</Required>
                </Label>
                <Input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Company Name"
                  disabled
                  readOnly
                  required
                />
                {errors.companyName && <ErrorMessage>{errors.companyName}</ErrorMessage>}
              </FormGroup>
               <FormGroup>
                <Label>Owner Name</Label>
                <Input
                  type="text"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  placeholder="Owner Name"
                />
              </FormGroup>
              <FormGroup>
                <Label>
                  City <Required>*</Required>
                </Label>
                <Input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                  required
                />
                {errors.city && <ErrorMessage>{errors.city}</ErrorMessage>}
              </FormGroup>
              <FormGroup>
                <Label>
                  State <Required>*</Required>
                </Label>
                <Input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State"
                  required
                />
                {errors.state && <ErrorMessage>{errors.state}</ErrorMessage>}
              </FormGroup>
                <FormGroup>
                <Label>PAN Number</Label>
                <Input
                  type="text"
                  name="panNumber"
                  value={formData.panNumber}
                  onChange={handleChange}
                  placeholder="PAN Number"
                />
              </FormGroup>
              <FormGroup>
                <Label>Phone</Label>
                <Input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Phone"
                />
              </FormGroup>
              <FormGroup>
                <Label>
                  Pincode <Required>*</Required>
                </Label>
                <Input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="Pincode"
                  required
                  maxLength="6"
                />
                {errors.pincode && <ErrorMessage>{errors.pincode}</ErrorMessage>}
              </FormGroup>
              <FormGroup>
                <Label>GSTIN</Label>
                <Input
                  type="text"
                  name="gstin"
                  value={formData.gstin}
                  onChange={handleChange}
                  placeholder="GSTIN"
                />
              </FormGroup>
            </Row>

            {/* Row 2: Address (full width) */}
            <FormGroup style={{ marginBottom: '16px' }}>
              <Label>Address</Label>
              <Textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="2"
                placeholder="Address"
              />
            </FormGroup>



            <Button type="submit">
              💾 Save Company Profile
            </Button>
          </Form>
        </CardBody>
      </Card>
    </PageContainer>
  );
};

export default CompanySettings;