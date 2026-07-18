import React, { useState, useEffect } from "react";
import styled from "styled-components";

// 1. Helper component define karein
const DocSection = ({ title, docName, fileKey, setFormData }) => (
  <UploadBox>
    <h3 className="section-title">{title}</h3>
    <div className="doc-item">
      {docName ? <span>📄 {docName} <span className="status">Verified ✓</span></span> : <span>No document uploaded</span>}
    </div>
    <div style={{ marginTop: "10px" }}>
      <label className="label-text">RE-UPLOAD {title.toUpperCase()}</label>
      <input type="file" onChange={(e) => setFormData(p => ({...p, [fileKey]: e.target.files[0]}))} style={{ display: "block", marginTop: "5px" }} />
    </div>
  </UploadBox>
);

export default function DriverEditView({ driver, onSave, onClose }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "", email: "", phone: "", licenseNumber: "",
    aadharCard: "", medicalReport: "Pending", policeVerification: "Pending",
    bankName: "", accountNumber: "", ifscCode: "", bankBranch: "",
    licenseFile: null, aadharFile: null, panFile: null, bankFile: null 
  });

  useEffect(() => {
    if (driver) {
      setFormData({
        fullName: driver.full_name || "",
        email: driver.email || "",
        phone: driver.phone || "",
        licenseNumber: driver.license_number || "",
        aadharCard: driver.aadhar_card || "",
        medicalReport: driver.medical_report || "Pending",
        policeVerification: driver.police_verification || "Pending",
        bankName: driver.bank_name || "",
        accountNumber: driver.account_number || "",
        ifscCode: driver.ifsc_code || "",
        bankBranch: driver.bank_branch || "",
        licenseFile: null, aadharFile: null, panFile: null, bankFile: null
      });
    }
  }, [driver]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = new FormData();
    Object.keys(formData).forEach((key) => {
        if (formData[key] !== null) data.append(key, formData[key]);
    });

    try {
      const response = await fetch(`http://localhost:8001/api/drivers/${driver.id}`, {
        method: "PUT",
        body: data,
      });
      if (response.ok) { alert("Profile Updated"); onSave(); }
      else { alert("Update failed"); }
    } catch (error) { alert("Server Error"); }
    finally { setLoading(false); }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <Container onClick={(e) => e.stopPropagation()}>
        <Header>
          <h2>Edit Driver Profile</h2>
          <button onClick={onClose}>✕</button>
        </Header>

        <form onSubmit={handleUpdate}>
          <Body>
            <SectionHeader>Personal Details</SectionHeader>
            <FormRow>
              <FormGroup><label>Full Name</label><input name="fullName" value={formData.fullName} onChange={handleChange} /></FormGroup>
              <FormGroup><label>Phone Number</label><input name="phone" value={formData.phone} onChange={handleChange} /></FormGroup>
            </FormRow>

            <SectionHeader>Bank Details</SectionHeader>
            <FormRow>
              <FormGroup><label>Bank Name</label><input name="bankName" value={formData.bankName} onChange={handleChange} /></FormGroup>
              <FormGroup><label>Account Number</label><input name="accountNumber" value={formData.accountNumber} onChange={handleChange} /></FormGroup>
            </FormRow>

            <SectionHeader>On-Chain Vault Documents</SectionHeader>
            <DocSection title="Driving License" docName={driver.license_document} fileKey="licenseFile" setFormData={setFormData} />
            <DocSection title="Aadhaar Card" docName={driver.aadhar_document} fileKey="aadharFile" setFormData={setFormData} />
            <DocSection title="Bank Passbook" docName={driver.bank_document} fileKey="bankFile" setFormData={setFormData} />
          </Body>

          <Footer>
            <button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Changes"}</button>
          </Footer>
        </form>
      </Container>
    </ModalOverlay>
  );
}

// Styled Components
const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center; z-index: 9999;
`;
const Container = styled.div` width: 750px; background: white; border-radius: 12px; overflow: hidden; `;
const Header = styled.div` padding: 20px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; h2 { margin: 0; font-size: 18px; } button { border: none; background: none; cursor: pointer; } `;
const Body = styled.div` padding: 20px; max-height: 70vh; overflow-y: auto; `;
const SectionHeader = styled.h4` font-size: 11px; color: #2563eb; text-transform: uppercase; margin: 20px 0 10px 0; `;
const FormRow = styled.div` display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 10px; `;
const FormGroup = styled.div` display: flex; flex-direction: column; label { font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 5px; } input, select { padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px; } `;
const UploadBox = styled.div` margin-top: 20px; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; .section-title { font-size: 11px; color: #94a3b8; text-transform: uppercase; margin-bottom: 10px; } .doc-item { font-size: 13px; color: #334; margin-bottom: 8px; } .label-text { font-size: 11px; font-weight: bold; color: #64748b; } `;
const Footer = styled.div` padding: 20px; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; button { background: #2563eb; color: white; padding: 10px 25px; border-radius: 6px; border: none; cursor: pointer; } `;