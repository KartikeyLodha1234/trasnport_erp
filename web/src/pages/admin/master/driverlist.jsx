      import React, { useState, useEffect } from 'react';
      import styled from 'styled-components';
      // 🔴 सुनिश्चित करें कि DriverViewModal.jsx इसी फ़ोल्डर में है
      import DriverViewModal from './driverviewmodal'; 
          import DriverEditView from './drivereditview'; // Import the Edit component

      export default function DriverFleetDirectory() {
        // State Matrix Controls
        const [isModalOpen, setIsModalOpen] = useState(false);
        const [formSubmitted, setFormSubmitted] = useState(false);
        const [selectedDriverForEdit, setSelectedDriverForEdit] = useState(null);
        
        // लाइव फ्रंटएंड डेटा एरे स्टोर करने के लिए स्टेट
        const [driversData, setDriversData] = useState([]);
        
        // व्यू मॉडल में सिलेक्टेड ड्राइवर का डेटा भेजने के लिए स्टेट
        const [selectedDriverForView, setSelectedDriverForView] = useState(null);

        const [formData, setFormData] = useState({
          fullName: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          routes:'', 
          emergencyContact: '',
          addressProof: '',
          aadharCard: '',
          panCard: '',
          bankName: '',
          accountNumber: '',
          ifscCode: '',
          bankBranch: '',
          medicalReport: 'Pending', 
          policeVerification: 'Pending', 
          licenseNumber: '',
          experience: '',
          dob: '', 
          
          // File states
          licenseFile: null,
          policeFile: null,
          bankFile: null,
          medicalFile: null,
          aadharFile: null
        });

        // बैकएंड से डेटा सिंक करने के लिए फ़ंक्शन
        const fetchDrivers = async () => {
        try {
          const response = await fetch('http://localhost:8001/api/drivers/');
          const result = await response.json();
          if (response.ok && result.success) {
            setDriversData(result.data || []);
          }
        } catch (error) {
          console.error('Error fetching drivers from backend:', error);
        }
      };

const handleDelete = async (id) => {
        const isConfirmed = window.confirm("Are you sure you want to permanently delete this driver?");
        if (!isConfirmed) return;

        try {
          // Changed from 127.0.0.1 to localhost to prevent CORS block
          const response = await fetch(`http://localhost:8001/api/drivers/${id}`, {
            method: 'DELETE'
          });
          
          const result = await response.json();

          if (response.ok && result.success) {
            alert("Driver deleted successfully.");
            fetchDrivers(); // Refresh the table
          } else {
            alert(`Error deleting driver: ${result.message}`);
          }
        } catch (error) {
          console.error('Delete Error:', error);
          alert('Failed to connect to the backend server.');
        }
      };



        useEffect(() => {
          fetchDrivers();
        }, []);

        const handleChange = (e) => {
          const { name, value } = e.target;
          if (name === 'phone') {
            const onlyNums = value.replace(/[^0-9]/g, '');
            if (onlyNums.length <= 10) {
              setFormData((prev) => ({ ...prev, [name]: onlyNums }));
            }
            return;
          }
          setFormData((prev) => ({ ...prev, [name]: value }));
        };

        const handleFileChange = (e, fileKey) => {
          const file = e.target.files[0];
          if (file) {
            setFormData((prev) => ({ ...prev, [fileKey]: file }));
          }
        };

        // Web3 Hybrid Submission logic
        const handleSubmit = async (e) => {
          e.preventDefault();
          
          if (formData.phone.length !== 10) {
            alert('कृपया एक वैध 10-अंकों का फ़ोन नंबर दर्ज करें!');
            return;
          }

          setFormSubmitted(true);
          const dataToSend = new FormData();

          // FormData के अंदर सभी टेक्स्ट फ़ील्ड्स और फ़ाइलें अपेंड करना
          dataToSend.append('fullName', formData.fullName);
          dataToSend.append('email', formData.email);
          dataToSend.append('phone', formData.phone);
          dataToSend.append('password', formData.password);
          dataToSend.append('experience', formData.experience);
          dataToSend.append('licenseNumber', formData.licenseNumber);
          dataToSend.append('bankName', formData.bankName);
          dataToSend.append('accountNumber', formData.accountNumber);
          dataToSend.append('ifscCode', formData.ifscCode);
          dataToSend.append('bankBranch', formData.bankBranch);
          dataToSend.append('aadharCard', formData.aadharCard);
          dataToSend.append('panCard', formData.panCard);
          dataToSend.append('medicalReport', formData.medicalReport);
          dataToSend.append('policeVerification', formData.policeVerification);
          dataToSend.append('emergencyContact', formData.emergencyContact);
          dataToSend.append('addressProof', formData.addressProof);
          dataToSend.append('dob', formData.dob);

          if (formData.licenseFile) dataToSend.append('licenseFile', formData.licenseFile);
          if (formData.policeFile) dataToSend.append('policeFile', formData.policeFile);
          if (formData.bankFile) dataToSend.append('bankFile', formData.bankFile);
          if (formData.medicalFile) dataToSend.append('medicalFile', formData.medicalFile);
          if (formData.aadharFile) dataToSend.append('aadharFile', formData.aadharFile);

          if (!formData.licenseFile) {
            console.warn('No license file selected. Backend request will still be sent because the API accepts optional files.');
          }

          console.log('Submitting driver payload:', [...dataToSend.entries()].map(([key, value]) => [key, value instanceof File ? value.name : value]));

          try {
            const response = await fetch('http://localhost:8001/api/drivers/', {
              method: 'POST',
              body: dataToSend
            });

            const result = await response.json();
            console.log('Driver create response', response.status, result);

            if (response.ok && result.success) {
              setIsModalOpen(false); 
              fetchDrivers(); // Real-time sync रीफ्रेश
              
              // फॉर्म रीसेट
              setFormData({
                fullName: '', email: '', phone: '', password: '', confirmPassword: '', routes:'',
                emergencyContact: '', addressProof: '', aadharCard: '', panCard: '',
                bankName: '', accountNumber: '', ifscCode: '', bankBranch: '',
                medicalReport: 'Pending', policeVerification: 'Pending', licenseNumber: '', experience: '', dob: '',
                licenseFile: null, policeFile: null, bankFile: null, medicalFile: null, aadharFile: null
              });
            } else {
              alert(`बैकएंड एरर: ${result.message || 'रजिस्ट्रेशन फेल हो गया'}`);
            }
          } catch (error) {
            console.error('API Error:', error);
            alert('Node.js हाइब्रिड सर्वर से कनेक्शन फेल हो गया।');
          } finally {
            setFormSubmitted(false);
          }
        };

        const getInitials = (name) => {
          if (!name) return "DR";
          return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
        };

        return (
          <PageWrapper>
            {/* 1. Page Title Header Control Panel */}
            <HeaderControl>
              <TitleBlock>
                <h1>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="title-icon"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>
                  Driver Fleet Directory
                </h1>
                <p>Onboard operational operators and log transport authorizations into CargoMax index.</p>
              </TitleBlock>
              <AddButton type="button" onClick={() => setIsModalOpen(true)}>
                + Add Driver
              </AddButton>
            </HeaderControl>

            {/* 2. Metrics Cards */}
            <StatsGrid>
              <StatCard>
                <IconBox bg="#eff6ff" color="#2563eb">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </IconBox>
                <div className="stat-info">
                  <span className="lbl">Total Registered</span>
                  <span className="val">{driversData.length}</span>
                  <span className="sub">Live database counter</span>
                </div>
              </StatCard>

              <StatCard>
                <IconBox bg="#f0fdf4" color="#16a34a">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 4 12 14.01 9 11.01"/><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/></svg>
                </IconBox>
                <div className="stat-info">
                  <span className="lbl">Active Status</span>
                  <span className="val">{driversData.length}</span>
                  <span className="sub text-success">Verified On-Chain</span>
                </div>
              </StatCard>

              <StatCard>
                <IconBox bg="#e0f2fe" color="#0284c7">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>
                </IconBox>
                <div className="stat-info">
                  <span className="lbl">Fleet Efficiency</span>
                  <span className="val">100%</span>
                  <span className="sub text-success">Local Node Active</span>
                </div>
              </StatCard>
            </StatsGrid>

            {/* 3. Live Driver Registry Ledger Table */}
            <TableCardSection>
              <TableTopbarControls>
                <div className="title-area">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px', verticalAlign: 'middle'}}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                  Active Registry Ledger (Live Sync)
                </div>
              </TableTopbarControls>

              <TableResponsiveWrapper>
                <RegistryGridTable>
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>ID</th>
                      <th>Driver Name</th>
                      <th>Phone Number</th>
                      <th>Date of Birth</th>
                      <th>License Infrastructure</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'center', width: '160px' }}>Actions</th>
                    </tr>
                  </thead>
                <tbody>
    {driversData.length === 0 ? (
      <tr>
        <td colSpan="7" style={{ textAlign: 'center', color: '#94a3b8', padding: '24px' }}>
          कोई रिकॉर्ड नहीं मिला।
        </td>
      </tr>
    ) : (
      // यहाँ [a.id - b.id] करने से सबसे पुराना (सबसे छोटा ID) सबसे ऊपर दिखेगा (Ascending)
      [...driversData]
        .sort((a, b) => a.id - b.id) 
        .map((driver, index) => (
          <tr key={driver.id}>
            <td className="font-mono text-muted">#{index + 1}</td>
            <td>
              <DriverProfileBox>
                <AvatarBadge bg="#0ea5e9">{getInitials(driver.full_name)}</AvatarBadge>
                <span className="font-bold text-dark">{driver.full_name}</span>
              </DriverProfileBox>
            </td>
            <td className="font-semibold text-dark">{driver.phone}</td>
            <td className="text-muted">{driver.dob || 'N/A'}</td>
            <td className="text-dark font-mono">{driver.license_number}</td>
            <td>
              <StatusBadge>Active</StatusBadge>
            </td>
            <td>
            <ActionButtonsWrapper style={{justifyContent: 'center'}}>
    {/* View */}
    <button
      type="button"
      className="icon-btn-view"
      onClick={() => setSelectedDriverForView(driver)}
      title="View Driver"
    >
      👁️
    </button>

    {/* Edit */}
  {/* Edit Button */}
<button
  type="button"
  className="icon-btn-edit" 
  onClick={() => setSelectedDriverForEdit(driver)}
  title="Edit Driver"
>
  ✏️
</button>

    {/* Delete */}
    <button
      type="button"
      className="icon-btn-delete"
      onClick={() => handleDelete(driver.id)}
      title="Delete Driver"
    >
      🗑️
    </button>
  </ActionButtonsWrapper>
            </td>
          </tr>
        ))
    )}
  </tbody>
                </RegistryGridTable>
              </TableResponsiveWrapper>
            </TableCardSection>

            {/* 4. Complete Driver Onboarding Popup Modal */}
            {isModalOpen && (
              <ModalOverlay onClick={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '720px', zIndex: 2002 }} onClick={(e) => e.stopPropagation()}>
                  <ModalContent>
                    <ModalHeader>
                      <div>
                        <h5>Onboard New Operational Driver</h5>
                        <p className="modal-subtitle">Fill out personal info, credentials, and scan-copy document infrastructure mappings.</p>
                      </div>
                      <button type="button" className="close-x-btn" onClick={() => setIsModalOpen(false)}>✕</button>
                    </ModalHeader>

                    <ModalBody>
                      <FormSectionTitle>Personal Details</FormSectionTitle>
                      <FormRow>
                        <FormGroup>
                          <label htmlFor="fullName">Full Name</label>
                          <input type="text" id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="e.g. Kartikey Lodha" required />
                        </FormGroup>
                        <FormGroup>
                          <label htmlFor="phone">Phone No.</label>
                          <input 
                            type="tel" 
                            id="phone" 
                            name="phone" 
                            value={formData.phone} 
                            onChange={handleChange} 
                            placeholder="e.g. 9664153249" 
                            maxLength={10} 
                            pattern="[0-9]{10}"
                            required 
                          />
                        </FormGroup>
                      </FormRow>

                      <FormRow>
                        <FormGroup>
                          <label htmlFor="email">Email Address</label>
                          <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="e.g. driver@gmail.com" required />
                        </FormGroup>
                        <FormGroup>
                          <label htmlFor="password">Password</label>
                          <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} placeholder="......" required />
                        </FormGroup>
                        <FormGroup>
                          <label htmlFor="confirmPassword">Confirm Password</label>
                          <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="..........." required />
                        </FormGroup>
                         <FormGroup>
                          <label htmlFor="routes">routes</label>
                          <input type="password" id="routes" name="routes" value={formData.routes} onChange={handleChange} placeholder="..........." required />
                        </FormGroup>
                      </FormRow>

                      <FormRow columns="2">
                        <FormGroup>
                          <label htmlFor="emergencyContact">Emergency Contact</label>
                          <input type="tel" id="emergencyContact" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} placeholder="e.g. 9812345678" />
                        </FormGroup>
                        <FormGroup>
                          <label htmlFor="addressProof">Address Proof</label>
                          <input type="text" id="addressProof" name="addressProof" value={formData.addressProof} onChange={handleChange} placeholder="e.g. Driver ration card" />
                        </FormGroup>
                      </FormRow>

                      <FormRow>
                        <FormGroup style={{ maxWidth: '50%' }}>
                          <label htmlFor="dob">Date of Birth</label>
                          <input type="date" id="dob" name="dob" value={formData.dob} onChange={handleChange} required />
                        </FormGroup>
                        <FormGroup style={{ maxWidth: '50%' }}>
                          <label htmlFor="experience">Years of Experience</label>
                          <input type="number" id="experience" name="experience" value={formData.experience} onChange={handleChange} placeholder="e.g. 5" required />
                        </FormGroup>
                      </FormRow>

                      <FormSectionTitle>Identity Verification &amp; Licensing</FormSectionTitle>
                      <FormRow columns="3">
                        <FormGroup>
                          <label htmlFor="licenseNumber">License Number</label>
                          <input type="text" id="licenseNumber" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} placeholder="e.g. RJ06-2022001" required />
                        </FormGroup>
                        <FormGroup>
                          <label htmlFor="bankName">Bank Name</label>
                          <input type="text" id="bankName" name="bankName" value={formData.bankName} onChange={handleChange} placeholder="e.g. State Bank of India" required />
                        </FormGroup>
                        <FormGroup>
                          <label htmlFor="accountNumber">Bank Account Number</label>
                          <input type="text" id="accountNumber" name="accountNumber" value={formData.accountNumber} onChange={handleChange} placeholder="Enter account number" required />
                        </FormGroup>
                      </FormRow>

                      <FormRow columns="3">
                        <FormGroup>
                          <label htmlFor="ifscCode">IFSC Code</label>
                          <input type="text" id="ifscCode" name="ifscCode" value={formData.ifscCode} onChange={handleChange} placeholder="e.g. SBIN0001234" required />
                        </FormGroup>
                        <FormGroup>
                          <label htmlFor="bankBranch">Bank Branch</label>
                          <input type="text" id="bankBranch" name="bankBranch" value={formData.bankBranch} onChange={handleChange} placeholder="e.g. Bhilwara Main" required />
                        </FormGroup>
                        <FormGroup>
                          <label htmlFor="aadharCard">Aadhaar Card Number</label>
                          <input type="text" id="aadharCard" name="aadharCard" value={formData.aadharCard} onChange={handleChange} placeholder="Enter Aadhaar Number" required />
                        </FormGroup>
                      </FormRow>

                      <FormRow columns="3">
                        <FormGroup>
                          <label htmlFor="panCard">PAN Card Number (Optional)</label>
                          <input type="text" id="panCard" name="panCard" value={formData.panCard} onChange={handleChange} placeholder="e.g. ABCDE1234F" />
                        </FormGroup>
                        
                        <FormGroup>
                          <label htmlFor="medicalReport">Medical Report</label>
                          <select id="medicalReport" name="medicalReport" value={formData.medicalReport} onChange={handleChange} required>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                          </select>
                        </FormGroup>
                        
                        <FormGroup>
                          <label htmlFor="policeVerification">Police Verification</label>
                          <select id="policeVerification" name="policeVerification" value={formData.policeVerification} onChange={handleChange} required>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                          </select>
                        </FormGroup>
                      </FormRow>

                      <FormSectionTitle>Required Document Uploads</FormSectionTitle>
                      <UploadGridContainer>
                        <UploadGroupCard>
                          <label>Driving License</label>
                          <div className="inner-uploader-box">
                            <input type="file" id="licenseFile" onChange={(e) => handleFileChange(e, 'licenseFile')} />
                            <label htmlFor="licenseFile" className="upload-trigger">
                              {formData.licenseFile ? formData.licenseFile.name : 'Choose File / Drop here'}
                            </label>
                          </div>
                        </UploadGroupCard>

                        <UploadGroupCard>
                          <label>Police Certification</label>
                          <div className="inner-uploader-box">
                            <input type="file" id="policeFile" onChange={(e) => handleFileChange(e, 'policeFile')} />
                            <label htmlFor="policeFile" className="upload-trigger">
                              {formData.policeFile ? formData.policeFile.name : 'Choose File / Drop here'}
                            </label>
                          </div>
                        </UploadGroupCard>

                        <UploadGroupCard>
                          <label>Bank Passbook</label>
                          <div className="inner-uploader-box">
                            <input type="file" id="bankFile" onChange={(e) => handleFileChange(e, 'bankFile')} />
                            <label htmlFor="bankFile" className="upload-trigger">
                              {formData.bankFile ? formData.bankFile.name : 'Choose File / Drop here'}
                            </label>
                          </div>
                        </UploadGroupCard>

                        <UploadGroupCard>
                          <label>Medical Certificate</label>
                          <div className="inner-uploader-box">
                            <input type="file" id="medicalFile" onChange={(e) => handleFileChange(e, 'medicalFile')} />
                            <label htmlFor="medicalFile" className="upload-trigger">
                              {formData.medicalFile ? formData.medicalFile.name : 'Choose File / Drop here'}
                            </label>
                          </div>
                        </UploadGroupCard>

                        <UploadGroupCard>
                          <label>Aadhaar Card Copy</label>
                          <div className="inner-uploader-box">
                            <input type="file" id="aadharFile" onChange={(e) => handleFileChange(e, 'aadharFile')} />
                            <label htmlFor="aadharFile" className="upload-trigger">
                              {formData.aadharFile ? formData.aadharFile.name : 'Choose File / Drop here'}
                            </label>
                          </div>
                        </UploadGroupCard>
                      </UploadGridContainer>
                    </ModalBody>

                    <ModalFooter>
                      <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                      <button type="submit" className="btn-submit" disabled={formSubmitted}>
                        {formSubmitted ? 'Verifying on Chain...' : 'Add Driver'}
                      </button>
                    </ModalFooter>
                  </ModalContent>
                </form>
              </ModalOverlay>
            )}

            {/* 🔴 FIXED: यहाँ सिलेक्टेड ड्राइवर का डेटा रीयल-टाइम सीक्वेंस इंडेक्स क्वेरी के साथ व्यू मॉडल में पास किया जा रहा है */}
            {selectedDriverForView && (
              <DriverViewModal 
                driver={selectedDriverForView} 
                rowIndex={driversData.length - driversData.indexOf(selectedDriverForView)}
                onClose={() => setSelectedDriverForView(null)} 
              />
            )}
{selectedDriverForEdit && (
  <ModalOverlay onClick={() => setSelectedDriverForEdit(null)}>
    <div onClick={(e) => e.stopPropagation()}> {/* Modal band na ho andar click karne par */}
      <DriverEditView 
        driver={selectedDriverForEdit} 
        onSave={() => {
           fetchDrivers(); // Data refresh karein
           setSelectedDriverForEdit(null); // Modal close karein
        }}
        onClose={() => setSelectedDriverForEdit(null)}
      />
    </div>
  </ModalOverlay>
)}  
          </PageWrapper>
        );
      }

      /* 🔴 CSS Layout Structural Configuration */
      const PageWrapper = styled.div`
        width: 100%;
        box-sizing: border-box;
        padding: 24px;
        background-color: #f8fafc;
        min-height: 100vh;
        display: block;
        position: relative;
      `;

      const HeaderControl = styled.div` display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; gap: 16px; width: 100%; @media (max-width: 768px) { flex-direction: column; align-items: flex-start; } `;
      const TitleBlock = styled.div` h1 { font-size: 28px; font-weight: 700; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 8px; .title-icon { color: #2563eb; } } p { font-size: 14px; color: #64748b; margin: 4px 0 0 0; } `;
      const AddButton = styled.button` color: #ffffff; padding: 10px 20px; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; background-color: #2563eb; transition: background-color 0.15s ease; white-space: nowrap; &:hover { background-color: #1d4ed8; } `;
      const StatsGrid = styled.div` display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 32px; width: 100%; @media (max-width: 992px) { grid-template-columns: repeat(2, 1fr); } @media (max-width: 576px) { grid-template-columns: 1fr; } `;
      const StatCard = styled.div` background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; display: flex; align-items: center; gap: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); .stat-info { display: flex; flex-direction: column; } .lbl { font-size: 13px; color: #64748b; font-weight: 500; } .val { font-size: 24px; font-weight: 700; color: #0f172a; margin: 4px 0; line-height: 1; } .sub { font-size: 12px; color: #94a3b8; } `;
      const IconBox = styled.div` width: 48px; height: 48px; border-radius: 8px; background-color: ${props => props.bg}; color: ${props => props.color}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; `;
      const TableCardSection = styled.div` background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02); width: 100%; box-sizing: border-box; overflow: hidden; `;
      const TableTopbarControls = styled.div` padding: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; border-bottom: 1px solid #f1f5f9; .title-area { font-size: 16px; font-weight: 600; color: #1e293b; } `;
      const TableResponsiveWrapper = styled.div` width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; `;
      const RegistryGridTable = styled.table` width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; thead tr { border-bottom: 1px solid #e2e8f0; background-color: #fafafa; color: #334155; font-size: 12px; font-weight: 600; } th, td { padding: 14px 20px; white-space: nowrap; vertical-align: middle; } tbody tr { border-bottom: 1px solid #f1f5f9; &:hover { background-color: #f8fafc; } } .text-dark { color: #0f172a !important; } .text-muted { color: #475569 !important; } .font-bold { font-weight: 600; color: #0f172a !important; } .font-semibold { font-weight: 600; color: #1e293b !important; } .font-mono { font-family: monospace; color: #64748b; } `;
      const DriverProfileBox = styled.div` display: flex; align-items: center; gap: 12px; `;
      const AvatarBadge = styled.div` width: 32px; height: 32px; border-radius: 50%; color: #ffffff; font-weight: 700; font-size: 11px; display: flex; align-items: center; justify-content: center; background-color: ${props => props.bg}; flex-shrink: 0; `;
      const StatusBadge = styled.span` padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; display: inline-flex; align-items: center; gap: 6px; background-color: #f0fdf4; color: #16a34a; &::before { content: "●"; font-size: 8px; } `;

      const ActionButtonsWrapper = styled.div` 
        display: flex; 
        align-items: center; 
        gap: 8px; 
        
        .icon-btn-view, .icon-btn-edit, .icon-btn-delete { 
          background: #ffffff; 
          border: 1px solid #e2e8f0; 
          width: 32px; 
          height: 32px; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          cursor: pointer; 
          transition: all 0.15s ease;
          outline: none;
        } 
        
        .icon-btn-view { 
          color: #2563eb; 
          text-decoration: none; 
          &:hover { background: #eff6ff; border-color: #bfdbfe; } 
        }
        
        .icon-btn-edit { 
          color: #d97706; 
          &:hover { background: #fffbeb; border-color: #fde68a; } 
        }
        
        .icon-btn-delete { 
          color: #dc2626; 
          &:hover { background: #fef2f2; border-color: #fca5a5; } 
        }
      `;

      const ModalOverlay = styled.div` 
        position: fixed; 
        top: 0; 
        left: 0; 
        right: 0; 
        bottom: 0; 
        background-color: rgba(15, 23, 42, 0.6) !important; 
        backdrop-filter: none !important; 
        -webkit-backdrop-filter: none !important;
        display: flex; 
        align-items: center; 
        justify-content: center; 
        z-index: 2000 !important; 
        padding: 16px; 
      `;

      const ModalContent = styled.div` 
        background-color: #ffffff !important; 
        border-radius: 12px; 
        width: 100%; 
        display: flex; 
        flex-direction: column; 
        overflow: hidden; 
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15); 
        filter: none !important;
      `;

      const ModalHeader = styled.div` padding: 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-start; h5 { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0; } .modal-subtitle { font-size: 13px; color: #64748b; margin: 6px 0 0 0; } .close-x-btn { background: none; border: none; color: #94a3b8; font-size: 20px; cursor: pointer; } `;
      const ModalBody = styled.div` padding: 24px; max-height: 65vh; overflow-y: auto; `;
      const FormSectionTitle = styled.h6` font-size: 13px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 0.05em; margin: 24px 0 16px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; &:first-of-type { margin-top: 0; } `;
      const FormRow = styled.div` display: grid; grid-template-columns: ${props => props.columns === '3' ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)'}; gap: 16px; margin-bottom: 16px; @media (max-width: 576px) { grid-template-columns: 1fr; } `;
      const FormGroup = styled.div` display: flex; flex-direction: column; width: 100%; label { display: block; font-size: 13px; font-weight: 600; color: #1e293b; margin-bottom: 6px; } input[type="text"], input[type="tel"], input[type="email"], input[type="number"], input[type="password"], input[type="date"], select { width: 100%; padding: 10px 14px; font-size: 14px; border-radius: 6px; border: 1px solid #cbd5e1; background-color: #ffffff; color: #0f172a; outline: none; box-sizing: border-box; &:focus { border-color: #2563eb; box-shadow: 0 0 0 1px #2563eb; } } `;
      const UploadGridContainer = styled.div` display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; @media (max-width: 576px) { grid-template-columns: 1fr; } `;
      const UploadGroupCard = styled.div` display: flex; flex-direction: column; label { font-size: 13px; font-weight: 600; color: #1e293b; margin-bottom: 6px; } .inner-uploader-box { border: 2px dashed #cbd5e1; border-radius: 8px; padding: 16px; display: flex; flex-direction: column; align-items: center; gap: 8px; background: #f8fafc; input[type="file"] { display: none; } .upload-trigger { font-size: 12px; color: #475569; font-weight: 500; cursor: pointer; text-align: center; } } `;
      const ModalFooter = styled.div` padding: 16px 24px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 12px; background-color: #fafafa; button { padding: 10px 20px; font-size: 14px; font-weight: 600; border-radius: 6px; cursor: pointer; border: none; } .btn-cancel { background-color: #f1f5f9; color: #475569; } .btn-submit { background-color: #2563eb; color: #ffffff; } button:disabled { background-color: #94a3b8; cursor: not-allowed; } `;
      