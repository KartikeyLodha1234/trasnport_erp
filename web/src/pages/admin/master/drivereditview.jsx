import React, { useState } from "react";
import styled from "styled-components";

const validatePAN = (pan) => (!pan ? true : /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan));
const validateAadhaar = (aadhaar) => /^\d{12}$/.test(aadhaar);
const validateIFSC = (ifsc) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);
const validateAccountNumber = (acc) => acc.length >= 8 && /^\d+$/.test(acc);
const validateLicense = (lic) => lic.length >= 8;

export default function DriverEditView({ driver, onSave, onClose }) {
  if (!driver) return null;

  const [formData, setFormData] = useState({
    fullName: driver.full_name || driver.fullName || "",
    email: driver.email || "",
    phone: driver.phone || "",
    password: "",
    dob: driver.dob || "",
    experience: driver.experience || 0,
    licenseNumber: driver.license_number || driver.licenseNumber || "",
    bankName: driver.bank_name || driver.bankName || "",
    accountNumber: driver.account_number || driver.accountNumber || "",
    ifscCode: driver.ifsc_code || driver.ifscCode || "",
    bankBranch: driver.bank_branch || driver.bankBranch || "",
    emergencyContact: driver.emergency_contact || driver.emergencyContact || "",
    addressProof: driver.address_proof || driver.addressProof || "",
    aadharCard: driver.aadhar_card || driver.aadharCard || "",
    panCard: driver.pan_card || driver.panCard || "",
    medicalReport: driver.medical_report || driver.medicalReport || "Pending",
    policeVerification: driver.police_verification || driver.policeVerification || "Pending",
    routeId: driver.route_id || driver.routeId || "",
    status: driver.status || "active",
    licenseFile: null,
    policeFile: null,
    bankFile: null,
    medicalFile: null,
    aadharFile: null,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const onlyNums = value.replace(/[^0-9]/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: onlyNums }));
      setErrors((prev) => ({ ...prev, [name]: "" }));
      return;
    }
    if (name === "aadharCard") {
      const onlyNums = value.replace(/[^0-9]/g, "").slice(0, 12);
      setFormData((prev) => ({ ...prev, [name]: onlyNums }));
      setErrors((prev) => ({ ...prev, [name]: "" }));
      return;
    }
    if (name === "accountNumber") {
      const onlyNums = value.replace(/[^0-9]/g, "");
      setFormData((prev) => ({ ...prev, [name]: onlyNums }));
      setErrors((prev) => ({ ...prev, [name]: "" }));
      return;
    }
    if (name === "panCard") {
      const upper = value.toUpperCase();
      setFormData((prev) => ({ ...prev, [name]: upper }));
      setErrors((prev) => ({ ...prev, [name]: "" }));
      return;
    }
    if (name === "ifscCode") {
      const upper = value.toUpperCase();
      setFormData((prev) => ({ ...prev, [name]: upper }));
      setErrors((prev) => ({ ...prev, [name]: "" }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (e, fileKey) => {
    const file = e.target.files[0];
    if (file) setFormData((prev) => ({ ...prev, [fileKey]: file }));
  };

  const validate = () => {
    const err = {};
    if (!formData.fullName.trim()) err.fullName = "Full name is required.";
    if (!formData.email.trim()) err.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) err.email = "Invalid email format.";

    if (formData.phone.length !== 10) err.phone = "Phone must be exactly 10 digits.";

    if (formData.password && formData.password.length < 6) err.password = "Password must be at least 6 characters.";

    if (!formData.licenseNumber.trim()) err.licenseNumber = "License number is required.";
    else if (!validateLicense(formData.licenseNumber)) err.licenseNumber = "License number must be at least 8 characters.";

    if (!formData.aadharCard.trim()) err.aadharCard = "Aadhaar number is required.";
    else if (!validateAadhaar(formData.aadharCard)) err.aadharCard = "Aadhaar must be 12 digits.";

    if (formData.panCard && !validatePAN(formData.panCard)) err.panCard = "Invalid PAN format.";

    if (!formData.bankName.trim()) err.bankName = "Bank name is required.";
    if (!formData.accountNumber.trim()) err.accountNumber = "Account number is required.";
    else if (!validateAccountNumber(formData.accountNumber)) err.accountNumber = "Account number must be at least 8 digits.";
    if (!formData.ifscCode.trim()) err.ifscCode = "IFSC code is required.";
    else if (!validateIFSC(formData.ifscCode)) err.ifscCode = "Invalid IFSC code.";
    if (!formData.bankBranch.trim()) err.bankBranch = "Bank branch is required.";

    if (!formData.dob.trim()) err.dob = "Date of birth is required.";
    else {
      const birth = new Date(formData.dob);
      const today = new Date();
      const age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (age < 18 || (age === 18 && m < 0)) err.dob = "Driver must be at least 18 years old.";
    }

    if (formData.experience && parseInt(formData.experience) < 0) err.experience = "Experience cannot be negative.";

    return err;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  const validationErrors = validate();
  setErrors(validationErrors);

  if (Object.keys(validationErrors).length > 0) return;

  setLoading(true);

  const dataToSend = new FormData();

  // Append only non-file fields
  Object.entries(formData).forEach(([key, value]) => {
    // Skip file fields
    if (
      key === "licenseFile" ||
      key === "policeFile" ||
      key === "bankFile" ||
      key === "medicalFile" ||
      key === "aadharFile"
    ) {
      return;
    }

    // Skip empty password
    if (key === "password" && !value) {
      return;
    }

    // Skip null/undefined
    if (value === null || value === undefined) {
      return;
    }

    dataToSend.append(key, value);
  });

  // Append files only if they are actual File objects
  [
    "licenseFile",
    "policeFile",
    "bankFile",
    "medicalFile",
    "aadharFile",
  ].forEach((key) => {
    if (formData[key] instanceof File) {
      dataToSend.append(key, formData[key]);
    }
  });

  // Debug
  console.log("===== FormData =====");
  for (const [key, value] of dataToSend.entries()) {
    console.log(key, value, value instanceof File);
  }

  try {
    const res = await fetch(
      `http://localhost:8000/api/drivers/${driver.id}`,
      {
        method: "PUT",
        body: dataToSend,
      }
    );

    const result = await res.json();

    if (res.ok && result.success) {
      alert("Driver updated successfully");
      onSave();
    } else {
      console.log(result);

      if (Array.isArray(result.detail)) {
        alert(
          result.detail
            .map((d) => `${d.loc.join(".")} : ${d.msg}`)
            .join("\n")
        );
      } else {
        alert(result.detail || result.message || "Update failed");
      }
    }
  } catch (err) {
    console.error(err);
    alert("Connection failed");
  } finally {
    setLoading(false);
  }
};

  return (
    <ModalOverlay onClick={onClose}>
      <FormWrapper onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <div>
            <h5>Edit Driver – {driver.full_name || driver.fullName}</h5>
            <p className="modal-subtitle">Update personal info, documents, status, and compliance.</p>
          </div>
          <CloseBtn type="button" onClick={onClose}>✕</CloseBtn>
        </ModalHeader>

        <ModalBody>
          {/* Personal Details */}
          <SectionTitle>Personal Details</SectionTitle>
          <FormGrid columns="2">
            <Field><label>Full Name <span className="req">*</span></label><Input type="text" name="fullName" value={formData.fullName} onChange={handleChange} />{errors.fullName && <ErrorText>{errors.fullName}</ErrorText>}</Field>
            <Field><label>Phone No. <span className="req">*</span></label><Input type="tel" name="phone" value={formData.phone} onChange={handleChange} maxLength={10} />{errors.phone && <ErrorText>{errors.phone}</ErrorText>}</Field>
            <Field><label>Email <span className="req">*</span></label><Input type="email" name="email" value={formData.email} onChange={handleChange} />{errors.email && <ErrorText>{errors.email}</ErrorText>}</Field>
            <Field><label>New Password (leave blank to keep current)</label><Input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Min. 6 chars" />{errors.password && <ErrorText>{errors.password}</ErrorText>}</Field>
            <Field><label>Emergency Contact</label><Input type="tel" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} /></Field>
            <Field><label>Address Proof</label><Select name="addressProof" value={formData.addressProof} onChange={handleChange}><option value="">-- Select --</option><option value="Aadhaar Card">Aadhaar Card</option><option value="Voter ID">Voter ID</option><option value="Ration Card">Ration Card</option><option value="Passport">Passport</option><option value="Utility Bill">Utility Bill</option><option value="Other">Other</option></Select></Field>
            <Field><label>Date of Birth <span className="req">*</span></label><Input type="date" name="dob" value={formData.dob} onChange={handleChange} />{errors.dob && <ErrorText>{errors.dob}</ErrorText>}</Field>
            <Field><label>Experience (years) <span className="req">*</span></label><Input type="number" name="experience" value={formData.experience} onChange={handleChange} min="0" />{errors.experience && <ErrorText>{errors.experience}</ErrorText>}</Field>
            <Field><label>Route</label><Input type="text" name="routeId" value={formData.routeId} onChange={handleChange} placeholder="Optional route ID" /></Field>
            <Field><label>Status</label><Select name="status" value={formData.status} onChange={handleChange}><option value="active">Active</option><option value="inactive">Inactive</option></Select></Field>
          </FormGrid>

          {/* Identity & Verification */}
          <SectionTitle>Identity & Verification</SectionTitle>
          <FormGrid columns="3">
            <Field><label>License Number <span className="req">*</span></label><Input type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} />{errors.licenseNumber && <ErrorText>{errors.licenseNumber}</ErrorText>}</Field>
            <Field><label>Aadhaar Number <span className="req">*</span></label><Input type="text" name="aadharCard" value={formData.aadharCard} onChange={handleChange} maxLength={12} />{errors.aadharCard && <ErrorText>{errors.aadharCard}</ErrorText>}</Field>
            <Field><label>PAN Card (optional)</label><Input type="text" name="panCard" value={formData.panCard} onChange={handleChange} />{errors.panCard && <ErrorText>{errors.panCard}</ErrorText>}</Field>
            <Field><label>Medical Report</label><Select name="medicalReport" value={formData.medicalReport} onChange={handleChange}><option value="Pending">Pending</option><option value="Approved">Approved</option></Select></Field>
            <Field><label>Police Verification</label><Select name="policeVerification" value={formData.policeVerification} onChange={handleChange}><option value="Pending">Pending</option><option value="Approved">Approved</option></Select></Field>
          </FormGrid>

          {/* Bank Details */}
          <SectionTitle>Bank Details</SectionTitle>
          <FormGrid columns="2">
            <Field><label>Bank Name <span className="req">*</span></label><Input type="text" name="bankName" value={formData.bankName} onChange={handleChange} />{errors.bankName && <ErrorText>{errors.bankName}</ErrorText>}</Field>
            <Field><label>Account Number <span className="req">*</span></label><Input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange} />{errors.accountNumber && <ErrorText>{errors.accountNumber}</ErrorText>}</Field>
            <Field><label>IFSC Code <span className="req">*</span></label><Input type="text" name="ifscCode" value={formData.ifscCode} onChange={handleChange} />{errors.ifscCode && <ErrorText>{errors.ifscCode}</ErrorText>}</Field>
            <Field><label>Bank Branch <span className="req">*</span></label><Input type="text" name="bankBranch" value={formData.bankBranch} onChange={handleChange} />{errors.bankBranch && <ErrorText>{errors.bankBranch}</ErrorText>}</Field>
          </FormGrid>

          {/* Document Uploads */}
          <SectionTitle>Document Uploads</SectionTitle>
          <FormGrid columns="2">
            {[
              { key: "licenseFile", label: "Driving License" },
              { key: "policeFile", label: "Police Certification" },
              { key: "bankFile", label: "Bank Passbook" },
              { key: "medicalFile", label: "Medical Certificate" },
              { key: "aadharFile", label: "Aadhaar Card Copy" },
            ].map(({ key, label }) => (
              <Field key={key}>
                <label>{label}</label>
                <div className="file-box">
                  <input type="file" id={`edit-${key}`} onChange={(e) => handleFileChange(e, key)} hidden />
                  <label htmlFor={`edit-${key}`} className="file-label">
                    {formData[key] ? formData[key].name : "Choose file"}
                  </label>
                  {formData[key] && <span className="file-ok">✓ Selected</span>}
                </div>
              </Field>
            ))}
          </FormGrid>
        </ModalBody>

        <ModalFooter>
          <ButtonCancel type="button" onClick={onClose}>Cancel</ButtonCancel>
          <ButtonSave type="submit" disabled={loading}>
            {loading ? "Updating…" : "Save Changes"}
          </ButtonSave>
        </ModalFooter>
      </FormWrapper>
    </ModalOverlay>
  );
}

// ────────────── Styled Components ──────────────
const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(15, 23, 42, 0.5); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 3000; padding: 16px;
`;
const FormWrapper = styled.form`
  background: white; border-radius: 12px; width: 100%; max-width: 760px;
  max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 40px rgba(0,0,0,0.2);
  display: flex; flex-direction: column;
`;
const ModalHeader = styled.div`
  padding: 20px 24px; border-bottom: 1px solid #e2e8f0;
  display: flex; justify-content: space-between; align-items: center; background: #f8fafc;
  h5 { margin: 0; font-size: 18px; color: #0f172a; }
  .modal-subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
`;
const CloseBtn = styled.button`
  background: none; border: none; font-size: 18px; color: #94a3b8; cursor: pointer;
  &:hover { color: #0f172a; }
`;
const ModalBody = styled.div` padding: 24px; `;
const SectionTitle = styled.h6`
  font-size: 12px; font-weight: 700; color: #2563eb; text-transform: uppercase;
  letter-spacing: 0.05em; margin: 20px 0 12px 0; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;
  &:first-of-type { margin-top: 0; }
`;
const FormGrid = styled.div`
  display: grid;
  grid-template-columns: ${(p) => p.columns === "3" ? "repeat(3, 1fr)" : "repeat(2, 1fr)"};
  gap: 16px;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;
const Field = styled.div`
  display: flex; flex-direction: column; width: 100%;
  label { font-size: 13px; font-weight: 600; color: #1e293b; margin-bottom: 6px; }
  .req { color: #ef4444; }
  .file-box { display: flex; align-items: center; gap: 12px; }
  .file-label { cursor: pointer; background: white; padding: 8px 16px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 13px; color: #2563eb; font-weight: 500; }
  .file-ok { font-size: 12px; color: #16a34a; font-weight: 500; }
`;
const Input = styled.input`
  width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px;
  font-size: 14px; color: #0f172a; outline: none;
  &:focus { border-color: #2563eb; box-shadow: 0 0 0 2px rgba(37,99,235,0.1); }
`;
const Select = styled.select`
  width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px;
  font-size: 14px; color: #0f172a; background: white; outline: none;
  &:focus { border-color: #2563eb; box-shadow: 0 0 0 2px rgba(37,99,235,0.1); }
`;
const ErrorText = styled.p` margin: 4px 0 0 0; font-size: 12px; color: #ef4444; `;
const ModalFooter = styled.div`
  padding: 16px 24px; border-top: 1px solid #e2e8f0;
  display: flex; justify-content: flex-end; gap: 12px; background: #fafafa;
`;
const ButtonCancel = styled.button`
  background: #f1f5f9; color: #475569; border: none; padding: 10px 20px;
  border-radius: 8px; font-weight: 600; cursor: pointer;
`;
const ButtonSave = styled.button`
  background: #2563eb; color: white; border: none; padding: 10px 20px;
  border-radius: 8px; font-weight: 600; cursor: pointer;
  &:disabled { opacity: 0.6; }
`;
