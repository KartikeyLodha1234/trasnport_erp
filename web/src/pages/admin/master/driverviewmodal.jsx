import React from 'react';
import styled from 'styled-components';

export default function DriverViewModal({ driver, rowIndex, onClose }) {
  if (!driver) return null;

  // नाम से इनिशियल्स निकालने के लिए यूटिलिटी
  const getInitials = (name) => {
    if (!name) return "DR";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ProfileSummaryBlock>
            <AvatarBadge bg="#0ea5e9">{getInitials(driver.full_name)}</AvatarBadge>
            <div>
              <h5>{driver.full_name}</h5>
              <p className="modal-subtitle">Driver ID: #{rowIndex || 1} | Status: <span className="status-tag">Active</span></p>
            </div>
          </ProfileSummaryBlock>
          <CloseXBtn type="button" onClick={onClose}>✕</CloseXBtn>
        </ModalHeader>

        <ModalBody>
          {/* Section 1: Personal Details */}
          <DetailSectionTitle>Personal Details</DetailSectionTitle>
          <InfoGrid>
            <InfoBox>
              <span className="label">Full Name</span>
              <span className="value">{driver.full_name || 'N/A'}</span>
            </InfoBox>
            <InfoBox>
              <span className="label">Phone Number</span>
              <span className="value">{driver.phone || 'N/A'}</span>
            </InfoBox>
            <InfoBox>
              <span className="label">Email Address</span>
              <span className="value">{driver.email || 'N/A'}</span>
            </InfoBox>
            <InfoBox>
              <span className="label">Date of Birth</span>
              {/* 🔴 FIXED: यहाँ DOB का नया फ़ील्ड बॉक्स जोड़ा गया है */}
              <span className="value font-mono">{driver.dob || 'N/A'}</span>
            </InfoBox>
            <InfoBox>
              <span className="label">Years of Experience</span>
              <span className="value">{driver.experience || 0} Years</span>
            </InfoBox>
          </InfoGrid>

          {/* Section 2: Verification Mapping */}
          <DetailSectionTitle>Identity & Verification Mappings</DetailSectionTitle>
          <InfoGrid>
            <InfoBox>
              <span className="label">License Number</span>
              <span className="value font-mono">{driver.license_number || 'N/A'}</span>
            </InfoBox>
            <InfoBox>
              <span className="label">Aadhaar Card Number</span>
              <span className="value font-mono">
                {driver.aadhar_card ? `xxxx-xxxx-${driver.aadhar_card.slice(-4)}` : 'N/A'}
              </span>
            </InfoBox>
            <InfoBox>
              <span className="label">PAN Card Number</span>
              <span className="value font-mono">{driver.pan_card || 'N/A'}</span>
            </InfoBox>
          </InfoGrid>

          {/* Section 3: Compliance Status */}
          <DetailSectionTitle>Compliance & Background Verification</DetailSectionTitle>
          <InfoGrid columns="2">
            <InfoBox>
              <span className="label">Medical Fitness Report</span>
              <StatusBadge approved={driver.medical_report === 'Approved'}>
                {driver.medical_report || 'Pending'}
              </StatusBadge>
            </InfoBox>
            <InfoBox>
              <span className="label">Police Criminal Record Verification</span>
              <StatusBadge approved={driver.police_verification === 'Approved'}>
                {driver.police_verification || 'Pending'}
              </StatusBadge>
            </InfoBox>
          </InfoGrid>

          {/* Section 4: Bank Infrastructure */}
          <DetailSectionTitle>Settlement Bank Infrastructure</DetailSectionTitle>
          <InfoGrid columns="4">
            <InfoBox>
              <span className="label">Bank Name</span>
              <span className="value">{driver.bank_name || 'N/A'}</span>
            </InfoBox>
            <InfoBox>
              <span className="label">Account Number</span>
              <span className="value font-mono">{driver.account_number || 'N/A'}</span>
            </InfoBox>
            <InfoBox>
              <span className="label">IFSC Code</span>
              <span className="value font-mono">{driver.ifsc_code || 'N/A'}</span>
            </InfoBox>
            <InfoBox>
              <span className="label">Bank Branch</span>
              <span className="value">{driver.bank_branch || 'N/A'}</span>
            </InfoBox>
          </InfoGrid>

          {/* Section 5: Secure Cloud Documents */}
          <DetailSectionTitle>On-Chain Vault Documents</DetailSectionTitle>
          <DocsListStack>
            
            <DocLinkBox>
              <div className="doc-info">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <div>
                  <span className="doc-title">Driving License Digital Copy</span>
                  <span className="doc-sub">Primary verification layer</span>
                </div>
              </div>
              {driver.license_file_path ? (
                <a href={driver.license_file_path} target="_blank" rel="noreferrer" className="btn-download">Open File ↗</a>
              ) : <span className="no-file">Not Uploaded</span>}
            </DocLinkBox>

            <DocLinkBox>
              <div className="doc-info">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <div>
                  <span className="doc-title">Aadhaar Card Scan Copy</span>
                  <span className="doc-sub">Identity infrastructure mapping</span>
                </div>
              </div>
              {driver.aadhar_file_path ? (
                <a href={driver.aadhar_file_path} target="_blank" rel="noreferrer" className="btn-download">Open File ↗</a>
              ) : <span className="no-file">Not Uploaded</span>}
            </DocLinkBox>

            <DocLinkBox>
              <div className="doc-info">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <div>
                  <span className="doc-title">Bank Passbook / Cancelled Cheque</span>
                  <span className="doc-sub">Settlement settlement audit file</span>
                </div>
              </div>
              {driver.bank_file_path ? (
                <a href={driver.bank_file_path} target="_blank" rel="noreferrer" className="btn-download">Open File ↗</a>
              ) : <span className="no-file">Not Uploaded</span>}
            </DocLinkBox>

            <DocLinkBox>
              <div className="doc-info">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <div>
                  <span className="doc-title">Medical Fitness Certification</span>
                  <span className="doc-sub">Health metrics log authorization</span>
                </div>
              </div>
              {driver.medical_file_path ? (
                <a href={driver.medical_file_path} target="_blank" rel="noreferrer" className="btn-download">Open File ↗</a>
              ) : <span className="no-file">Not Uploaded</span>}
            </DocLinkBox>

            <DocLinkBox>
              <div className="doc-info">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <div>
                  <span className="doc-title">Police Background Clearance</span>
                  <span className="doc-sub">Criminal record clean logs</span>
                </div>
              </div>
              {driver.police_file_path ? (
                <a href={driver.police_file_path} target="_blank" rel="noreferrer" className="btn-download">Open File ↗</a>
              ) : <span className="no-file">Not Uploaded</span>}
            </DocLinkBox>

          </DocsListStack>
        </ModalBody>

        <ModalFooter>
          <button type="button" className="btn-close-footer" onClick={onClose}>Close Profile</button>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
}

/* ---------------- Styled UI Schema ---------------- */
const ModalOverlay = styled.div` position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 3000; padding: 16px; `;
const ModalContent = styled.div` background-color: #ffffff; border-radius: 12px; width: 100%; max-width: 760px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.2); animation: slideUp 0.2s ease-out; `;
const ModalHeader = styled.div` padding: 20px 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background-color: #f8fafc; `;
const ProfileSummaryBlock = styled.div` display: flex; align-items: center; gap: 16px; h5 { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0; } .modal-subtitle { font-size: 13px; color: #64748b; margin: 4px 0 0 0; } .status-tag { color: #16a34a; font-weight: 600; } `;
const AvatarBadge = styled.div` width: 44px; height: 44px; border-radius: 50%; color: #ffffff; font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; background-color: ${props => props.bg}; `;
const CloseXBtn = styled.button` background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer; &:hover { color: #0f172a; } `;
const ModalBody = styled.div` padding: 24px; max-height: 65vh; overflow-y: auto; `;
const DetailSectionTitle = styled.h6` font-size: 12px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 0.05em; margin: 20px 0 12px 0; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; &:first-of-type { margin-top: 0; } `;
const InfoGrid = styled.div` display: grid; grid-template-columns: ${props => props.columns === '4' ? 'repeat(4, 1fr)' : props.columns === '2' ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)'}; gap: 16px; margin-bottom: 8px; @media (max-width: 600px) { grid-template-columns: 1fr !important; } `;
const InfoBox = styled.div` display: flex; flex-direction: column; background-color: #f8fafc; padding: 10px 14px; border-radius: 6px; border: 1px solid #f1f5f9; .label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; } .value { font-size: 14px; color: #1e293b; font-weight: 500; margin-top: 4px; } .font-mono { font-family: monospace; } `;
const StatusBadge = styled.span` font-size: 13px; font-weight: 600; margin-top: 4px; color: ${props => props.approved ? '#16a34a' : '#d97706'}; `;
const DocsListStack = styled.div` display: flex; flex-direction: column; gap: 10px; `;
const DocLinkBox = styled.div` display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 8px; .doc-info { display: flex; align-items: center; gap: 12px; color: #334155; svg { color: #2563eb; } } .doc-title { display: block; font-size: 14px; font-weight: 600; color: #1e293b; } .doc-sub { font-size: 12px; color: #64748b; } .btn-download { background: #2563eb; color: #ffffff; padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; text-decoration: none; &:hover { background: #1d4ed8; } } .no-file { font-size: 12px; color: #94a3b8; font-weight: 500; } `;
const ModalFooter = styled.div` padding: 14px 24px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; background-color: #fafafa; .btn-close-footer { background-color: #f1f5f9; color: #475569; border: none; padding: 8px 18px; font-size: 14px; font-weight: 600; border-radius: 6px; cursor: pointer; &:hover { background-color: #e2e8f0; } } `;