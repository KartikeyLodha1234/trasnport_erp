// web/src/pages/admin/profile.jsx
import React, { useState } from 'react';
import styled from 'styled-components';

const PageContainer = styled.div`
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
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

const Divider = styled.hr`
  margin: 24px 0;
  border: none;
  border-top: 1px solid #e2e8f0;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 16px 0;
`;

const Profile = () => {
  const [formData, setFormData] = useState({
    email: 'admin@transporterp.com',
    ownerName: 'Admin User',
    role: 'Administrator',
    memberSince: 'January 2024',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
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

    // Validate passwords only if they are filled
    if (formData.currentPassword || formData.newPassword || formData.confirmPassword) {
      // Current Password validation
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Current password is required';
        isValid = false;
      }

      // New Password validation
      if (!formData.newPassword) {
        newErrors.newPassword = 'New password is required';
        isValid = false;
      } else if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'Password must be at least 6 characters';
        isValid = false;
      }

      // Confirm Password validation
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
        isValid = false;
      } else if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const dataToSend = {
      email: formData.email,
      ownerName: formData.ownerName,
      role: formData.role,
      memberSince: formData.memberSince,
    };

    // Only include password fields if they are filled
    if (formData.currentPassword && formData.newPassword) {
      dataToSend.currentPassword = formData.currentPassword;
      dataToSend.newPassword = formData.newPassword;
    }

    console.log('Profile Update Data:', dataToSend);
    alert('Profile updated successfully!');
    
    // Clear password fields after submit
    setFormData(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }));
  };

  return (
    <PageContainer>
      <Card>
        <CardHeader>
          👤 User Profile
        </CardHeader>
        <CardBody>
          <Form onSubmit={handleSubmit}>
            {/* Row 1: Email & Owner Name */}
            <Row columns="1fr 1fr">
              <FormGroup>
                <Label>
                  Email <Required>*</Required>
                </Label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  disabled
                  readOnly
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>Full Name</Label>
                <Input
                  type="text"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  placeholder="Full Name"
                  disabled
                  readOnly
                />
              </FormGroup>
            </Row>

            {/* Row 2: Role & Member Since */}
            <Row columns="1fr 1fr">
              <FormGroup>
                <Label>Role</Label>
                <Input
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  placeholder="Role"
                  disabled
                  readOnly
                />
              </FormGroup>
              <FormGroup>
                <Label>Member Since</Label>
                <Input
                  type="text"
                  name="memberSince"
                  value={formData.memberSince}
                  onChange={handleChange}
                  placeholder="Member Since"
                  disabled
                  readOnly
                />
              </FormGroup>
            </Row>

            <Divider />

            {/* Password Change Section */}
            <SectionTitle>🔐 Change Password</SectionTitle>

            {/* Row 3: Current Password */}
            <Row columns="1fr 1fr">
              <FormGroup>
                <Label>
                  Current Password
                </Label>
                <Input
                  type="password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="Enter current password"
                />
                {errors.currentPassword && <ErrorMessage>{errors.currentPassword}</ErrorMessage>}
              </FormGroup>
                 <FormGroup>
                <Label>
                  New Password
                </Label>
                <Input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Enter new password"
                />
                {errors.newPassword && <ErrorMessage>{errors.newPassword}</ErrorMessage>}
              </FormGroup>
            </Row>

            {/* Row 4: New Password & Confirm Password */}
            <Row columns="1fr 1fr">
           
              <FormGroup>
                <Label>
                  Confirm New Password
                </Label>
                <Input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                />
                {errors.confirmPassword && <ErrorMessage>{errors.confirmPassword}</ErrorMessage>}
              </FormGroup>
            </Row>

            <Button type="submit">
              💾 Update Profile
            </Button>
          </Form>
        </CardBody>
      </Card>
    </PageContainer>
  );
};

export default Profile;