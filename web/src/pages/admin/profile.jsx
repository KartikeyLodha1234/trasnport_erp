// web/src/pages/admin/profile.jsx
import React, { useState } from 'react';
import styled from 'styled-components';

const PageContainer = styled.div`
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
`;

const ProfileCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 32px;
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e2e8f0;
`;

const Avatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  color: white;
`;

const ProfileInfo = styled.div`
  flex: 1;
`;

const Name = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 4px 0;
`;

const Role = styled.p`
  font-size: 14px;
  color: #64748b;
  margin: 0;
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #f1f5f9;
`;

const DetailRow = styled.div`
  display: flex;
  padding: 8px 0;
  border-bottom: 1px solid #f8fafc;

  &:last-child {
    border-bottom: none;
  }
`;

const Label = styled.div`
  width: 150px;
  font-size: 14px;
  color: #64748b;
  flex-shrink: 0;
`;

const Value = styled.div`
  flex: 1;
  font-size: 14px;
  color: #1e293b;
  font-weight: 500;
`;

const Button = styled.button`
  padding: 8px 24px;
  background: #0044e4;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #0037b8;
  }
`;

export default function Profile() {
  const [user] = useState({
    name: 'Admin User',
    email: 'admin@transporterp.com',
    role: 'Administrator',
    department: 'Operations',
    phone: '+91 9664153249',
    joined: 'January 2024',
    
  });

  return (
    <PageContainer>
      <ProfileCard>
        <ProfileHeader>
          <Avatar>👨‍💼</Avatar>
          <ProfileInfo>
            <Name>{user.name}</Name>
            <Role>{user.role} • {user.department}</Role>
          </ProfileInfo>
          <Button>Edit Profile</Button>
        </ProfileHeader>

        <Section>
          <SectionTitle>Personal Information</SectionTitle>
          <DetailRow>
            <Label>Full Name</Label>
            <Value>{user.name}</Value>
          </DetailRow>
          <DetailRow>
            <Label>Email</Label>
            <Value>{user.email}</Value>
          </DetailRow>
          <DetailRow>
            <Label>Phone</Label>
            <Value>{user.phone}</Value>
          </DetailRow>
          <DetailRow>
            <Label>Department</Label>
            <Value>{user.department}</Value>
          </DetailRow>
        </Section>

        <Section>
          <SectionTitle>Account Information</SectionTitle>
          <DetailRow>
            <Label>Role</Label>
            <Value>{user.role}</Value>
          </DetailRow>
          <DetailRow>
            <Label>Joined</Label>
            <Value>{user.joined}</Value>
          </DetailRow>

        </Section>
      </ProfileCard>
    </PageContainer>
  );
}