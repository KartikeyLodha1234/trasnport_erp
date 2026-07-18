// vehicleedit.js
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

export default function VehicleEdit({ vehicleData, onClose, onRefresh }) {
    const [formData, setFormData] = useState({
        vehicle_id: '',
        type: '',
        company_name: '',
        year: '',
        license_plate: '',
        puc_number: '',
        notes: ''
    });
    const [pucFile, setPucFile] = useState(null);
    const [loading, setLoading] = useState(false);

    // Populate form when vehicleData changes
    useEffect(() => {
        if (vehicleData && vehicleData.id) {
            console.log("Vehicle data received:", vehicleData); // Debug log
            setFormData({
                vehicle_id: vehicleData.vehicle_id || '',
                type: vehicleData.type || '',
                company_name: vehicleData.company_name || '',
                year: vehicleData.year || '',
                license_plate: vehicleData.license_plate || '',
                puc_number: vehicleData.puc_certificate_number || vehicleData.puc_number || '',
                notes: vehicleData.notes || ''
            });
        } else {
            console.warn("No vehicle data or missing id:", vehicleData);
        }
    }, [vehicleData]);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setPucFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Check if vehicle has an id
        if (!vehicleData || !vehicleData.id) {
            alert('Error: Vehicle data is missing. Please try again.');
            return;
        }

        setLoading(true);
        
        try {
            // Use FormData for file upload
            const dataToSend = new FormData();
            dataToSend.append('vehicle_id', formData.vehicle_id);
            dataToSend.append('type', formData.type);
            dataToSend.append('company_name', formData.company_name);
            dataToSend.append('year', formData.year);
            dataToSend.append('license_plate', formData.license_plate);
            dataToSend.append('puc_number', formData.puc_number);
            dataToSend.append('notes', formData.notes);
            
            if (pucFile) {
                dataToSend.append('pucFile', pucFile);
            }

            const response = await fetch(`http://localhost:8001/api/vehicles/${vehicleData.id}`, {
                method: 'PUT',
                body: dataToSend
            });
            
            if (response.ok) {
                alert('Vehicle updated successfully!');
                onRefresh();
                onClose();
            } else {
                const errorData = await response.json();
                alert(`Failed to update vehicle: ${errorData.message || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('Error updating vehicle:', err);
            alert('Error updating vehicle. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    // If no vehicle data, show loading or error
    if (!vehicleData) {
        return (
            <ModalHeader>
                <div>
                    <h5>Edit Vehicle</h5>
                    <p className="modal-subtitle">Loading vehicle data...</p>
                </div>
                <button type="button" className="close-x-btn" onClick={onClose}>✕</button>
            </ModalHeader>
        );
    }

    return (
        <>
            <ModalHeader>
                <div>
                    <h5>Edit Vehicle</h5>
                    <p className="modal-subtitle">Update vehicle details in the fleet registry.</p>
                </div>
                <button type="button" className="close-x-btn" onClick={onClose}>✕</button>
            </ModalHeader>

            <form onSubmit={handleSubmit}>
                <ModalBody>
                    <FormRow>
                        <FormGroup>
                            <label># Vehicle ID</label>
                            <input 
                                type="text" 
                                id="vehicle_id" 
                                placeholder="e.g., TRK-004" 
                                value={formData.vehicle_id} 
                                onChange={handleChange} 
                                required
                            />
                        </FormGroup>
                        <FormGroup>
                            <label>🚌 Type</label>
                            <select id="type" value={formData.type} onChange={handleChange} required>
                                <option value="">Select Type</option>
                                <option value="mini">Mini Truck</option>
                                <option value="heavy">Heavy Truck</option>
                            </select>
                        </FormGroup>
                    </FormRow>

                    <FormRow>
                        <FormGroup>
                            <label>🏷️ Company Name</label>
                            <input 
                                type="text" 
                                id="company_name" 
                                placeholder="e.g., Cascadia" 
                                value={formData.company_name} 
                                onChange={handleChange} 
                                required
                            />
                        </FormGroup>
                        <FormGroup>
                            <label>📅 Model Year</label>
                            <input 
                                type="text" 
                                id="year" 
                                placeholder="e.g., 2023" 
                                value={formData.year} 
                                onChange={handleChange} 
                                required
                            />
                        </FormGroup>
                    </FormRow>

                    <FormRow>
                        <FormGroup>
                            <label>💳 License Plate</label>
                            <input 
                                type="text" 
                                id="license_plate" 
                                placeholder="E.G., TRK-004-NY" 
                                value={formData.license_plate} 
                                onChange={handleChange} 
                                required
                            />
                        </FormGroup>
                        <FormGroup>
                            <label>📋 PUC Certificate Number</label>
                            <input 
                                type="text" 
                                id="puc_number" 
                                placeholder="E.G., RJ06-PUC-12345" 
                                value={formData.puc_number} 
                                onChange={handleChange} 
                            />
                        </FormGroup>
                    </FormRow>

                    <FormGroup style={{ marginBottom: '16px' }}>
                        <label>PUC Certificate File</label>
                        <UploadBox>
                            <input 
                                type="file" 
                                id="pucFile" 
                                accept="image/*,application/pdf" 
                                onChange={handleFileChange} 
                            />
                            <div className="upload-text">
                                {pucFile ? `Selected: ${pucFile.name}` : 'Choose PUC File / Drop here'}
                            </div>
                        </UploadBox>
                    </FormGroup>

                    <FormGroup>
                        <label>📝 Notes</label>
                        <textarea 
                            rows="3" 
                            id="notes" 
                            placeholder="Additional notes..." 
                            value={formData.notes} 
                            onChange={handleChange}
                        ></textarea>
                    </FormGroup>
                </ModalBody>

                <ModalFooter>
                    <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
                        ✕ Cancel
                    </button>
                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? 'Updating...' : '✓ Update Vehicle'}
                    </button>
                </ModalFooter>
            </form>
        </>
    );
}

// Styles for VehicleEdit Components
const ModalHeader = styled.div`
    padding: 24px; 
    border-bottom: 1px solid #e2e8f0; 
    display: flex; 
    justify-content: space-between; 
    align-items: center;
    background-color: #ffffff;

    h5 { 
        font-size: 20px; 
        font-weight: 700; 
        color: #0f172a; 
        margin: 0; 
    }
    
    .modal-subtitle { 
        font-size: 13px; 
        color: #64748b; 
        margin: 4px 0 0 0; 
    }
    
    .close-x-btn { 
        background: #f1f5f9;
        border: none; 
        width: 32px; 
        height: 32px; 
        border-radius: 50%;
        cursor: pointer; 
        color: #475569; 
        font-size: 16px; 
        display: flex; 
        align-items: center; 
        justify-content: center;
        transition: all 0.2s;
        
        &:hover { 
            background: #e2e8f0; 
            color: #0f172a;
        }
    }
`;
const ModalBody = styled.div`
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
  overflow-x: hidden;   /* Hide horizontal scroll */
  box-sizing: border-box;
`;

const FormRow = styled.div` 
    display: grid; 
    grid-template-columns: 1fr 1fr; 
    gap: 16px; 
    margin-bottom: 16px; 
`;

const FormGroup = styled.div`
    display: flex; 
    flex-direction: column; 
    width: 100%; 
    box-sizing: border-box;
    
    label { 
        display: block; 
        font-size: 13px; 
        font-weight: 600; 
        color: #1e293b; 
        margin-bottom: 6px; 
    }
    
    input, select, textarea {
        width: 100%; 
        padding: 10px 14px; 
        font-size: 14px; 
        border-radius: 6px;
        border: 1px solid #cbd5e1; 
        background-color: #ffffff; 
        color: #0f0f0f; 
        outline: none;
        
        &:focus { 
            border-color: #2563eb; 
            box-shadow: 0 0 0 1px #2563eb; 
        }
    }
`;

const UploadBox = styled.div`
    position: relative;
    border: 2px dashed #cbd5e1;
    border-radius: 6px;
    padding: 20px;
    text-align: center;
    background: #f8fafc;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        border-color: #2563eb;
        background: #f1f5f9;
    }

    input[type="file"] {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
    }

    .upload-text {
        font-size: 14px;
        color: #2563eb;
        font-weight: 500;
    }
`;

const ModalFooter = styled.div` 
    padding: 16px 24px; 
    border-top: 1px solid #e2e8f0; 
    display: flex; 
    justify-content: flex-end; 
    gap: 12px; 
    background: #fafafa; 
    
    .btn-submit { 
        background: #2563eb; 
        color: white; 
        border: none; 
        padding: 10px 20px; 
        border-radius: 6px; 
        cursor: pointer; 
        
        &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
    } 
    
    .btn-cancel { 
        background: #f1f5f9; 
        border: none; 
        padding: 10px 20px; 
        border-radius: 6px; 
        cursor: pointer;
        
        &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
    } 
`;