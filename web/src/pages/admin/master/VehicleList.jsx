import { Upload } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from "react-router-dom";
import VehicleView from "./vehicleview";
import VehicleEdit from "./vehicleedit";

export default function DriverFleetDirectory() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [vehiclesData, setVehiclesData] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [vehicleFormData, setVehicleFormData] = useState({
        vehicleId: '',
        vehicleType: '',
        companyName: '',
        modelYear: '',
        licensePlate: '',
        pucNumber: '',
        pucExpiry: '',
        notes: ''
    });
    const navigate = useNavigate();

    // Handle View button click
    const handleView = (row) => {
        setSelectedVehicle(row);
        setIsViewModalOpen(true);
    };

    // Handle Edit button click - FIXED
    const handleEdit = (row) => {
        console.log("Editing vehicle:", row);
        
        setSelectedVehicle(row);
        
        // Set form data for editing - match the VehicleEdit component's expected format
        setVehicleFormData({
            id: row.id || '',
            vehicle_id: row.vehicle_id || row.id || '',
            type: row.type || '',
            company_name: row.company_name || '',
            year: row.year || '',
            license_plate: row.license_plate || '',
            puc_number: row.puc_number || '',
            puc_expiry: row.puc_expiry || '',
            notes: row.notes || '',
            status: row.status || 'active'
        });
        
        // Open the edit modal
        setIsEditModalOpen(true);
    };

    // Handle Delete
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this vehicle?")) return;
        
        try {
            const response = await fetch(`http://localhost:5000/api/vehicles/${id}`, { 
                method: 'DELETE' 
            });
            if (response.ok) {
                fetchVehicles(); // Refresh list
            }
        } catch (err) {
            console.error("Delete Error:", err);
        }
    };

    // Handle vehicle update from edit modal
    const handleUpdateVehicle = async (updatedData) => {
        try {
            const response = await fetch(`http://localhost:5000/api/vehicles/${selectedVehicle.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
            
            if (response.ok) {
                setIsEditModalOpen(false);
                await fetchVehicles();
            } else {
                alert("Failed to update vehicle.");
            }
        } catch (err) {
            console.error("Error updating vehicle:", err);
        }
    };

    const handleFileChange = (e, fieldName) => {
        setVehicleFormData(prev => ({ ...prev, [fieldName]: e.target.files[0] }));
    };

    const fetchVehicles = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/vehicles');
            const data = await response.json();
            if (data) {
                setVehiclesData(Array.isArray(data) ? data : (data.data || []));
            }
        } catch (err) {
            console.error("Error fetching vehicles:", err);
        }
    };

    useEffect(() => {
        fetchVehicles();
    }, []);

    const handleVehicleChange = (e) => {
        const { id, value } = e.target; 
        setVehicleFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleAddVehicle = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/vehicles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(vehicleFormData)
            });
            
            if (response.ok) {
                setVehicleFormData({
                    vehicleId: '', vehicleType: '', companyName: '',
                    modelYear: '', licensePlate: '', pucNumber: '',
                    pucExpiry: '', notes: ''
                });
                setIsModalOpen(false);
                await fetchVehicles();
            } else {
                alert("Failed to save vehicle.");
            }
        } catch (err) {
            console.error("Error adding vehicle:", err);
        }
    };

    return (
        <PageWrapper>
            {/* Header */}
            <HeaderControl>
                <TitleBlock>
                    <h1>Vehicle Fleet Directory</h1>
                    <p>Monitor tactical fleet asset distributions and status configurations.</p>
                </TitleBlock>
                <AddButton type="button" onClick={() => setIsModalOpen(true)}>+ Add Vehicle</AddButton>
            </HeaderControl>

            {/* Table */}
            <TableCardSection>
                <TableTopbarControls>Active Registry Ledger</TableTopbarControls>
                <TableResponsiveWrapper>
                    <RegistryGridTable>
                        <thead>
                            <tr>
                                <th>Sr. No</th>
                                <th>Company Owner</th>
                                <th>Truck Model</th>
                                <th>Model Year</th>
                                <th>Number Plate</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vehiclesData.map((row, index) => (
                                <tr key={row.id || index}>
                                    <td>{index + 1}</td>
                                    <td>{row.company_name}</td>
                                    <td>{row.type}</td>
                                    <td>{row.year}</td>
                                    <td><PlateTag>{row.license_plate}</PlateTag></td>
                                    <td><StatusBadge>Active</StatusBadge></td>
                                    <td>
                                        <ActionButtons>
                                            <button className="view" onClick={() => handleView(row)}>View</button>
                                            <button 
                                                className="edit" 
                                                onClick={() => handleEdit(row)}
                                            >
                                                Edit
                                            </button>
                                            <button className="delete" onClick={() => handleDelete(row.id)}>Delete</button>
                                        </ActionButtons>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </RegistryGridTable>
                </TableResponsiveWrapper>
            </TableCardSection>

            {/* Add Vehicle Modal */}
            {isModalOpen && (
                <ModalOverlay onClick={() => setIsModalOpen(false)}>
                    <ModalContent onClick={(e) => e.stopPropagation()}>
                        <ModalHeader>
                            <div>
                                <h5>Add New Vehicle</h5>
                                <p className="modal-subtitle">Enter vehicle details to update the fleet registry.</p>
                            </div>
                            <button type="button" className="close-x-btn" onClick={() => setIsModalOpen(false)}>✕</button>
                        </ModalHeader>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            await handleAddVehicle();
                        }}>
                            <ModalBody>
                                <FormRow>
                                    <FormGroup>
                                        <label># Vehicle ID</label>
                                        <input type="text" id="vehicleId" placeholder="e.g., TRK-004" value={vehicleFormData.vehicleId} onChange={handleVehicleChange} />
                                    </FormGroup>
                                    <FormGroup>
                                        <label>🚌 Type</label>
                                        <select id="vehicleType" value={vehicleFormData.vehicleType} onChange={handleVehicleChange}>
                                            <option value="">Select Type</option>
                                            <option value="mini">Mini Truck</option>
                                            <option value="heavy">Heavy Truck</option>
                                        </select>
                                    </FormGroup>
                                </FormRow>

                                <FormRow>
                                    <FormGroup>
                                        <label>🏷️ Company Name</label>
                                        <input type="text" id="companyName" placeholder="e.g., Cascadia" value={vehicleFormData.companyName} onChange={handleVehicleChange} />
                                    </FormGroup>
                                    <FormGroup>
                                        <label>📅 Model Year</label>
                                        <input type="text" id="modelYear" placeholder="e.g., 2023" value={vehicleFormData.modelYear} onChange={handleVehicleChange} />
                                    </FormGroup>
                                </FormRow>

                                <FormRow>
                                    <FormGroup>
                                        <label>💳 License Plate</label>
                                        <input type="text" id="licensePlate" placeholder="E.G., TRK-004-NY" value={vehicleFormData.licensePlate} onChange={handleVehicleChange} />
                                    </FormGroup>
                                    <FormGroup>
                                        <label>📋 PUC Certificate Number</label>
                                        <input type="text" id="pucNumber" placeholder="E.G., RJ06-PUC-12345" value={vehicleFormData.pucNumber} onChange={handleVehicleChange} />
                                    </FormGroup>
                                </FormRow>

                                <UploadGridContainer>
                                    <UploadGroupCard>
                                        <label>PUC Certificate</label>
                                        <div className="inner-uploader-box">
                                            <input 
                                                type="file" 
                                                id="pucFile" 
                                                onChange={(e) => handleFileChange(e, 'pucFile')} 
                                            />
                                            <label htmlFor="pucFile" className="upload-trigger">
                                                {vehicleFormData.pucFile ? vehicleFormData.pucFile.name : 'Choose PUC File / Drop here'}
                                            </label>
                                        </div>
                                    </UploadGroupCard>
                                </UploadGridContainer>

                                <FormGroup>
                                    <label>📝 Notes</label>
                                    <textarea rows="3" id="notes" placeholder="Additional notes..." value={vehicleFormData.notes} onChange={handleVehicleChange}></textarea>
                                </FormGroup>
                            </ModalBody>

                            <ModalFooter>
                                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>✕ Cancel</button>
                                <button type="submit" className="btn-submit">✓ Add Vehicle</button>
                            </ModalFooter>
                        </form>
                    </ModalContent>
                </ModalOverlay>
            )}

            {/* View Vehicle Modal */}
            {isViewModalOpen && selectedVehicle && (
                <ModalOverlay onClick={() => setIsViewModalOpen(false)}>
                    <ModalContent onClick={(e) => e.stopPropagation()}>
                        <ModalHeader>
                            <div>
                                <h5>Vehicle Details</h5>
                                <p className="modal-subtitle">Complete vehicle information and compliance status.</p>
                            </div>
                            <button type="button" className="close-x-btn" onClick={() => setIsViewModalOpen(false)}>✕</button>
                        </ModalHeader>

                        <ModalBody>
                            <DetailsSection>
                                <SectionTitle>🚛 VEHICLE INFORMATION</SectionTitle>
                                <DetailsGrid>
                                    <DetailRow>
                                        <DetailLabel>Vehicle ID</DetailLabel>
                                        <DetailValue>{selectedVehicle.vehicle_id || 'N/A'}</DetailValue>
                                    </DetailRow>
                                    <DetailRow>
                                        <DetailLabel>Company Owner</DetailLabel>
                                        <DetailValue>{selectedVehicle.company_name || 'N/A'}</DetailValue>
                                    </DetailRow>
                                    <DetailRow>
                                        <DetailLabel>Model Year</DetailLabel>
                                        <DetailValue>{selectedVehicle.year || 'N/A'}</DetailValue>
                                    </DetailRow>
                                    <DetailRow>
                                        <DetailLabel>License Plate</DetailLabel>
                                        <DetailValue>{selectedVehicle.license_plate || 'N/A'}</DetailValue>
                                    </DetailRow>
                                    <DetailRow>
                                        <DetailLabel>PUC Certificate</DetailLabel>
                                        <DetailValue>{selectedVehicle.puc_number || 'N/A'}</DetailValue>
                                    </DetailRow>
                                </DetailsGrid>
                            </DetailsSection>

                            <DetailsSection>
                                <SectionTitle>📋 ADDITIONAL NOTES</SectionTitle>
                                <NotesBox>{selectedVehicle.notes || 'No additional notes'}</NotesBox>
                            </DetailsSection>
                        </ModalBody>

                        <ModalFooter>
                            <button type="button" className="btn-cancel" onClick={() => setIsViewModalOpen(false)}>✕ Close</button>
                            <button type="button" className="btn-submit" onClick={() => {
                                setIsViewModalOpen(false);
                                handleEdit(selectedVehicle);
                            }}>OK</button>
                        </ModalFooter>
                    </ModalContent>
                </ModalOverlay>
            )}

            {/* Edit Vehicle Modal - FIXED: Passing data correctly */}
            {isEditModalOpen && selectedVehicle && (
                <ModalOverlay onClick={() => setIsEditModalOpen(false)}>
                    <ModalContent onClick={(e) => e.stopPropagation()}>
                        <VehicleEdit
                            vehicle={selectedVehicle}
                            formData={vehicleFormData}
                            onClose={() => setIsEditModalOpen(false)}
                            onRefresh={fetchVehicles}
                            onUpdate={handleUpdateVehicle}
                            onFormChange={handleVehicleChange}
                        />
                    </ModalContent>
                </ModalOverlay>
            )}
        </PageWrapper>
    );
}

// All your existing styles remain the same...
const PageWrapper = styled.div` max-width: 1400px; margin: 0 auto; padding: 32px 24px; background-color: #f8fafc; min-height: 100vh; `;
const HeaderControl = styled.div` display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; `;
const TitleBlock = styled.div` h1 { font-size: 28px; font-weight: 700; color: #0f172a; margin: 0; } p { color: #64748b; } `;
const AddButton = styled.button` color: white; padding: 10px 20px; border: none; border-radius: 6px; background-color: #2563eb; cursor: pointer; `;
const TableCardSection = styled.div` background: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; `;
const TableTopbarControls = styled.div`
    padding: 20px; 
    font-size: 16px; 
    font-weight: 600; 
    color: #000000;
    border-bottom: 1px solid #e2e8f0; 
`;
const TableResponsiveWrapper = styled.div` overflow-x: auto; `;
const RegistryGridTable = styled.table`
    width: 100%; 
    border-collapse: collapse; 
    font-size: 14px;
    color: #334155;

    thead { 
        background-color: #f8fafc;
        border-bottom: 2px solid #e2e8f0; 
        color: #1e293b;
        font-weight: 700;
    }
    
    tbody tr:hover {
        background-color: #f1f5f9;
    }

    th, td { 
        padding: 16px 20px; 
        border-bottom: 1px solid #e2e8f0;
    }
`;
const PlateTag = styled.span` background-color: #fff1f2; color: #e11d48; padding: 4px 8px; border-radius: 4px; font-family: monospace; `;
const StatusBadge = styled.span` padding: 4px 12px; border-radius: 20px; font-size: 12px; background: #f0fdf4; color: #16a34a; `;

// Modal Styles
const ModalOverlay = styled.div` position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 16px; `;
const ModalContent = styled.div`
    position: relative;
    z-index: 1;
    background-color: #ffffff; 
    border-radius: 12px; 
    width: 100%; 
    max-width: 680px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    border: 1px solid #e2e8f0;
`;
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
const ModalBody = styled.div` padding: 24px; max-height: 70vh; overflow-y: auto; overflow-x: hidden; `;
const FormRow = styled.div` display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; `;
const FormGroup = styled.div`
    display: flex; flex-direction: column; width: 100%; box-sizing: border-box;
    label { display: block; font-size: 13px; font-weight: 600; color: #1e293b; margin-bottom: 6px; }
    input, select, textarea {
        width: 100%; 
        box-sizing: border-box;
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
const ModalFooter = styled.div` 
    padding: 16px 24px; 
    border-top: 1px solid #e2e8f0; 
    display: flex; 
    justify-content: flex-end; 
    gap: 12px; 
    background: #fafafa; 
    .btn-submit { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; } 
    .btn-cancel { background: #f1f5f9; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; } 
`;
const ActionButtons = styled.div`
    display: flex;
    gap: 8px;
    button {
        padding: 6px 12px;
        border-radius: 4px;
        border: none;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        transition: all 0.2s;
    } 
    .edit { background: #e0f2fe; color: #0284c7; }
    .view { background: #f3fff0; color: #0ee971; }
    .delete { background: #fee2e2; color: #dc2626; }
    .edit:hover { background: #bae6fd; }
    .view:hover { background: #dbeafe; }
    .delete:hover { background: #fecaca; }
`;
const UploadGridContainer = styled.div` margin: 16px 0; `;
const UploadGroupCard = styled.div`
    border: 2px dashed #e2e8f0;
    padding: 20px; 
    border-radius: 10px; 
    background: #ffffff; 
    margin: 16px 0;
    label { 
        font-size: 13px; 
        font-weight: 600; 
        color: #475569; 
        margin-bottom: 12px; 
        display: block; 
    }
    .inner-uploader-box { position: relative; }
    input[type="file"] { display: none; }
    .upload-trigger { 
        display: block; 
        padding: 14px; 
        background: #f8fafc;
        border: 1px solid #cbd5e1; 
        border-radius: 8px; 
        cursor: pointer; 
        text-align: center; 
        color: #3b82f6;
        font-weight: 500;
        transition: all 0.2s;
        &:hover {
            background: #eff6ff;
            border-color: #3b82f6;
        }
    }
`;

// View Modal Styles
const DetailsSection = styled.div` margin-bottom: 24px; `;
const SectionTitle = styled.h6`
    font-size: 13px;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 16px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding-bottom: 8px;
    border-bottom: 2px solid #e2e8f0;
`;
const DetailsGrid = styled.div` display: grid; grid-template-columns: 1fr 1fr; gap: 16px; `;
const DetailRow = styled.div` display: flex; flex-direction: column; `;
const DetailLabel = styled.label`
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
`;
const DetailValue = styled.span`
    font-size: 14px;
    color: #1e293b;
    padding: 8px 12px;
    background: #f8fafc;
    border-radius: 6px;
    border-left: 3px solid #2563eb;
    font-weight: 500;
`;
const NotesBox = styled.div`
    background: #f8fafc;
    padding: 12px 16px;
    border-radius: 6px;
    border-left: 3px solid #2563eb;
    color: #475569;
    font-size: 14px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-wrap: break-word;
`;