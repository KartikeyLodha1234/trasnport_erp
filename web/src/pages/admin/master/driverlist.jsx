import React, { useState, useEffect } from "react";
import DriverViewModal from "./driverviewmodal";
import DriverEditView from "./drivereditview";

// ─────────────────────── VALIDATION HELPERS ───────────────────────
const validatePAN = (pan) => {
  if (!pan) return true;
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
};

const validateAadhaar = (aadhaar) => /^\d{12}$/.test(aadhaar);
const validateIFSC = (ifsc) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);
const validateAccountNumber = (acc) => acc.length >= 8 && /^\d+$/.test(acc);
const validateLicense = (lic) => lic.length >= 8;

export default function DriverFleetDirectory() {
  // ───── State ─────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [selectedDriverForEdit, setSelectedDriverForEdit] = useState(null);
  const [driversData, setDriversData] = useState([]);
  const [selectedDriverForView, setSelectedDriverForView] = useState(null);
  const [routesData, setRoutesData] = useState([]);
  const [errors, setErrors] = useState({});

  const initialForm = {
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    routeId: "",
    emergencyContact: "",
    addressProof: "",
    aadharCard: "",
    panCard: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    bankBranch: "",
    medicalReport: "Pending",
    policeVerification: "Pending",
    licenseNumber: "",
    experience: "",
    dob: "",
    status: "active",
    licenseFile: null,
    policeFile: null,
    bankFile: null,
    medicalFile: null,
    aadharFile: null,
  };
  const [formData, setFormData] = useState(initialForm);

  // ───── API Calls ─────
  const fetchDrivers = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/drivers/");
      const data = await res.json();
      if (res.ok && data.success) setDriversData(data.data || []);
    } catch (err) {
      console.error("Fetch drivers error:", err);
    }
  };
const fetchRoutes = async () => {
  try {
    console.log("🔍 Fetching routes from: http://localhost:8000/api/routes/");
    const res = await fetch("http://localhost:8000/api/routes/");
    console.log("📡 Response status:", res.status);
    console.log("📡 Response ok:", res.ok);
    
    if (!res.ok) {
      console.error("❌ Response not OK:", res.status, res.statusText);
      return;
    }
    
    const data = await res.json();
    console.log("📡 Routes data:", data);
    console.log("📡 Data type:", typeof data);
    console.log("📡 Data.success:", data.success);
    console.log("📡 Data.data:", data.data);
    
    if (data.success) {
      const routes = data.data || [];
      console.log("✅ Routes set:", routes);
      setRoutesData(routes);
    } else {
      console.error("❌ API returned success=false:", data);
    }
  } catch (err) {
    console.error("❌ Fetch routes error:", err);
    console.error("❌ Error message:", err.message);
  }
};
  useEffect(() => {
    fetchDrivers();
    fetchRoutes();
  }, []);

  // ───── Handlers ─────
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const onlyNums = value.replace(/[^0-9]/g, "");
      if (onlyNums.length <= 10) {
        setFormData((prev) => ({ ...prev, [name]: onlyNums }));
      }
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

  // ───── Validation ─────
  const validate = () => {
    const err = {};
    if (!formData.fullName.trim()) err.fullName = "Full name is required.";
    if (!formData.email.trim()) err.email = "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) err.email = "Invalid email format.";
    if (formData.phone.length !== 10) err.phone = "Phone must be exactly 10 digits.";
    if (formData.password.length < 6) err.password = "Password must be at least 6 characters.";
    if (formData.password !== formData.confirmPassword) err.confirmPassword = "Passwords do not match.";
    if (!formData.licenseNumber.trim()) err.licenseNumber = "License number is required.";
    else if (!validateLicense(formData.licenseNumber)) err.licenseNumber = "License number must be at least 8 characters.";
    if (!formData.aadharCard.trim()) err.aadharCard = "Aadhaar number is required.";
    else if (!validateAadhaar(formData.aadharCard)) err.aadharCard = "Aadhaar must be 12 digits.";
    if (formData.panCard && !validatePAN(formData.panCard)) err.panCard = "Invalid PAN format.";
    if (!formData.bankName.trim()) err.bankName = "Bank name is required.";
    if (!formData.accountNumber.trim()) err.accountNumber = "Account number is required.";
    else if (!validateAccountNumber(formData.accountNumber)) err.accountNumber = "Account number must be at least 8 digits.";
    if (!formData.ifscCode.trim()) err.ifscCode = "IFSC code is required.";
    else if (!validateIFSC(formData.ifscCode)) err.ifscCode = "Invalid IFSC.";
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

  // ───── Submit ─────
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setFormSubmitted(true);
    const dataToSend = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (key === "confirmPassword" || value instanceof File) return;
      dataToSend.append(key, value);
    });

    ["licenseFile", "policeFile", "bankFile", "medicalFile", "aadharFile"].forEach((fkey) => {
      if (formData[fkey]) dataToSend.append(fkey, formData[fkey]);
    });

    dataToSend.set("experience", parseInt(formData.experience) || 0);

    try {
      const res = await fetch("http://localhost:8000/api/drivers/", {
        method: "POST",
        body: dataToSend,
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setIsModalOpen(false);
        fetchDrivers();
        setFormData(initialForm);
        setErrors({});
        alert("✅ Driver added successfully!");
      } else {
        alert(`Error: ${result.message || result.detail || "Registration failed"}`);
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert("Connection to server failed. Please check if backend is running.");
    } finally {
      setFormSubmitted(false);
    }
  };

  // ───── Delete ─────
  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this driver?")) return;
    try {
      const res = await fetch(`http://localhost:8000/api/drivers/${id}`, {
        method: "DELETE"
      });
      const result = await res.json();
      if (res.ok && result.success) {
        alert("Driver deleted.");
        fetchDrivers();
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (err) {
      alert("Connection failed.");
    }
  };

  const getInitials = (name) =>
    !name ? "DR" : name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  // ───── Dynamic Stats ─────
  const total = driversData.length;
  const verified = driversData.filter(
    (d) => d.medical_report === "Approved" && d.police_verification === "Approved"
  ).length;
  const efficiency = total > 0 ? `${Math.round((verified / total) * 100)}%` : "0%";

  // ───── Render ─────
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Driver Fleet Directory</h1>
          <p className="mt-1 text-gray-500">Onboard operational operators and log transport authorizations.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 active:scale-95"
        >
          + Add Driver
        </button>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Registered</p>
              <p className="text-2xl font-bold text-gray-800">{total}</p>
              <p className="text-xs text-gray-400">Live database counter</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 4 12 14.01 9 11.01"/><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/></svg>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Verified Drivers</p>
              <p className="text-2xl font-bold text-green-600">{verified}</p>
              <p className="text-xs text-green-500">Approved documents</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Fleet Efficiency</p>
              <p className="text-2xl font-bold text-gray-800">{efficiency}</p>
              <p className="text-xs text-sky-500">Verification rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Driver Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">Active Registry Ledger</h2>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
            {driversData.length} Drivers
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-900 text-white">
              <tr>
                <th className="px-5 py-3 text-left font-medium">ID</th>
                <th className="px-5 py-3 text-left font-medium">Driver Name</th>
                <th className="px-5 py-3 text-left font-medium">Phone</th>
                <th className="px-5 py-3 text-left font-medium">DOB</th>
                <th className="px-5 py-3 text-left font-medium">License No.</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {driversData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-500">No records found.</td>
                </tr>
              ) : (
                [...driversData].sort((a, b) => a.id - b.id).map((driver, index) => (
                  <tr key={driver.id} className="hover:bg-gray-50 transition-colors">
                    <td className="whitespace-nowrap px-5 py-4 font-mono text-blue-600">#{index + 1}</td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                          {getInitials(driver.full_name)}
                        </div>
                        <span className="font-medium text-gray-800">{driver.full_name}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-gray-800">{driver.phone}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-gray-600">{driver.dob || "—"}</td>
                    <td className="whitespace-nowrap px-5 py-4 font-mono text-gray-600">{driver.license_number || "—"}</td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        (driver.status || "active") === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          (driver.status || "active") === "active" ? "bg-green-500" : "bg-red-500"
                        }`} />
                        {(driver.status || "active") === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex justify-center gap-1.5">
                        <button onClick={() => setSelectedDriverForView(driver)} className="rounded-xl bg-sky-500 p-2 text-white transition hover:bg-sky-600" title="View">👁️</button>
                        <button onClick={() => setSelectedDriverForEdit(driver)} className="rounded-xl bg-yellow-500 p-2 text-white transition hover:bg-yellow-600" title="Edit">✏️</button>
                        <button onClick={() => handleDelete(driver.id)} className="rounded-xl bg-red-500 p-2 text-white transition hover:bg-red-600" title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Driver Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setIsModalOpen(false)}>
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4 rounded-t-2xl">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Onboard New Operational Driver</h2>
                <p className="text-sm text-gray-500">Fill out personal info, credentials, and document uploads.</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">✕</button>
            </div>

            <div className="p-6 space-y-8">
              {/* Personal Details */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">Personal Details</h3>
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Full Name <span className="text-red-500">*</span></label>
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="e.g. Rajesh Kumar" className={`w-full rounded-xl border px-4 py-3 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100 ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`} />
                    {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Phone No. <span className="text-red-500">*</span></label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="10-digit number" maxLength={10} className={`w-full rounded-xl border px-4 py-3 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`} />
                    {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Email Address <span className="text-red-500">*</span></label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="driver@example.com" className={`w-full rounded-xl border px-4 py-3 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100 ${errors.email ? 'border-red-500' : 'border-gray-300'}`} />
                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Password <span className="text-red-500">*</span></label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Min. 6 characters" className={`w-full rounded-xl border px-4 py-3 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100 ${errors.password ? 'border-red-500' : 'border-gray-300'}`} />
                    {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Confirm Password <span className="text-red-500">*</span></label>
                    <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter password" className={`w-full rounded-xl border px-4 py-3 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`} />
                    {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
                  </div>
                                   <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Emergency Contact</label>
                    <input type="tel" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} placeholder="e.g. 9812345678" className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Address Proof <span className="text-red-500">*</span></label>
                    <select name="addressProof" value={formData.addressProof} onChange={handleChange} className={`w-full rounded-xl border bg-white px-4 py-3 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100 ${errors.addressProof ? 'border-red-500' : 'border-gray-300'}`}>
                      <option value="">-- Select document type --</option>
                      <option value="Aadhaar Card">Aadhaar Card</option>
                      <option value="Voter ID">Voter ID</option>
                      <option value="Ration Card">Ration Card</option>
                      <option value="Passport">Passport</option>
                      <option value="Utility Bill">Utility Bill</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.addressProof && <p className="mt-1 text-xs text-red-500">{errors.addressProof}</p>}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Date of Birth <span className="text-red-500">*</span></label>
                    <input type="date" name="dob" value={formData.dob} onChange={handleChange} className={`w-full rounded-xl border px-4 py-3 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100 ${errors.dob ? 'border-red-500' : 'border-gray-300'}`} />
                    {errors.dob && <p className="mt-1 text-xs text-red-500">{errors.dob}</p>}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Years of Experience <span className="text-red-500">*</span></label>
                    <input type="number" name="experience" value={formData.experience} onChange={handleChange} placeholder="e.g. 5" min="0" className={`w-full rounded-xl border px-4 py-3 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100 ${errors.experience ? 'border-red-500' : 'border-gray-300'}`} />
                    {errors.experience && <p className="mt-1 text-xs text-red-500">{errors.experience}</p>}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Identity Verification */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">Identity Verification & Licensing</h3>
                <div className="grid gap-5 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">License Number <span className="text-red-500">*</span></label>
                    <input type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} placeholder="e.g. RJ06-2022001" className={`w-full rounded-xl border px-4 py-3 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100 ${errors.licenseNumber ? 'border-red-500' : 'border-gray-300'}`} />
                    {errors.licenseNumber && <p className="mt-1 text-xs text-red-500">{errors.licenseNumber}</p>}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Bank Name <span className="text-red-500">*</span></label>
                    <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} placeholder="e.g. SBI" className={`w-full rounded-xl border px-4 py-3 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100 ${errors.bankName ? 'border-red-500' : 'border-gray-300'}`} />
                    {errors.bankName && <p className="mt-1 text-xs text-red-500">{errors.bankName}</p>}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Account Number <span className="text-red-500">*</span></label>
                    <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange} placeholder="Enter account number" className={`w-full rounded-xl border px-4 py-3 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100 ${errors.accountNumber ? 'border-red-500' : 'border-gray-300'}`} />
                    {errors.accountNumber && <p className="mt-1 text-xs text-red-500">{errors.accountNumber}</p>}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">IFSC Code <span className="text-red-500">*</span></label>
                    <input type="text" name="ifscCode" value={formData.ifscCode} onChange={handleChange} placeholder="e.g. SBIN0001234" className={`w-full rounded-xl border px-4 py-3 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100 ${errors.ifscCode ? 'border-red-500' : 'border-gray-300'}`} />
                    {errors.ifscCode && <p className="mt-1 text-xs text-red-500">{errors.ifscCode}</p>}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Bank Branch <span className="text-red-500">*</span></label>
                    <input type="text" name="bankBranch" value={formData.bankBranch} onChange={handleChange} placeholder="e.g. Main Branch" className={`w-full rounded-xl border px-4 py-3 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100 ${errors.bankBranch ? 'border-red-500' : 'border-gray-300'}`} />
                    {errors.bankBranch && <p className="mt-1 text-xs text-red-500">{errors.bankBranch}</p>}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Aadhaar Number <span className="text-red-500">*</span></label>
                    <input type="text" name="aadharCard" value={formData.aadharCard} onChange={handleChange} placeholder="12 digits" maxLength={12} className={`w-full rounded-xl border px-4 py-3 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100 ${errors.aadharCard ? 'border-red-500' : 'border-gray-300'}`} />
                    {errors.aadharCard && <p className="mt-1 text-xs text-red-500">{errors.aadharCard}</p>}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">PAN Card (Optional)</label>
                    <input type="text" name="panCard" value={formData.panCard} onChange={handleChange} placeholder="e.g. ABCDE1234F" className={`w-full rounded-xl border px-4 py-3 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100 ${errors.panCard ? 'border-red-500' : 'border-gray-300'}`} />
                    {errors.panCard && <p className="mt-1 text-xs text-red-500">{errors.panCard}</p>}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Medical Report <span className="text-red-500">*</span></label>
                    <select name="medicalReport" value={formData.medicalReport} onChange={handleChange} className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100">
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Police Verification <span className="text-red-500">*</span></label>
                    <select name="policeVerification" value={formData.policeVerification} onChange={handleChange} className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-100">
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Document Uploads */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">Required Document Uploads</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    { key: "licenseFile", label: "Driving License" },
                    { key: "policeFile", label: "Police Certification" },
                    { key: "bankFile", label: "Bank Passbook" },
                    { key: "medicalFile", label: "Medical Certificate" },
                    { key: "aadharFile", label: "Aadhaar Card Copy" },
                  ].map(({ key, label }) => (
                    <div key={key} className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4">
                      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
                      <div className="flex items-center gap-3">
                        <input type="file" id={key} onChange={(e) => handleFileChange(e, key)} className="hidden" />
                        <label htmlFor={key} className="cursor-pointer rounded-lg bg-white px-4 py-2 text-sm font-medium text-blue-600 shadow-sm hover:bg-blue-50 transition">
                          {formData[key] ? formData[key].name : "Choose file"}
                        </label>
                        {formData[key] && <span className="text-xs text-green-600">✓ Selected</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-gray-50 px-6 py-4 rounded-b-2xl">
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition">Cancel</button>
              <button type="submit" disabled={formSubmitted} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed">
                {formSubmitted ? "Verifying…" : "Add Driver"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View & Edit Modals */}
      {selectedDriverForView && (
        <DriverViewModal
          driver={selectedDriverForView}
          rowIndex={driversData.length - driversData.indexOf(selectedDriverForView)}
          onClose={() => setSelectedDriverForView(null)}
        />
      )}

      {selectedDriverForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedDriverForEdit(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <DriverEditView
              driver={selectedDriverForEdit}
              onSave={() => { fetchDrivers(); setSelectedDriverForEdit(null); }}
              onClose={() => setSelectedDriverForEdit(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}