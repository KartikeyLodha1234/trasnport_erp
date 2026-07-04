import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

export default function VehicleDetails() {
  const { id } = useParams(); // URL से ID उठाएं
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // API से सिंगल व्हीकल का डेटा लाएं
    fetch(`http://localhost:5000/api/vehicles/${id}`)
      .then(res => res.json())
      .then(data => {
        setVehicle(data);
        setLoading(false);
      })
      .catch(err => console.error("Error:", err));
  }, [id]);

  if (loading) return <Container>Loading vehicle details...</Container>;

  return (
    <Container>
      <BackButton onClick={() => navigate(-1)}>← Back to Directory</BackButton>
      
      <DetailsCard>
        <HeaderSection>
          <h2>Vehicle Profile: {vehicle.vehicle_id}</h2>
          <StatusBadge>Active</StatusBadge>
        </HeaderSection>

        <GridContent>
          <InfoGroup>
            <label>Company Owner</label>
            <p>{vehicle.company_name}</p>
          </InfoGroup>
          <InfoGroup>
            <label>Truck Type</label>
            <p>{vehicle.type}</p>
          </InfoGroup>
          <InfoGroup>
            <label>Model Year</label>
            <p>{vehicle.year}</p>
          </InfoGroup>
          <InfoGroup>
            <label>License Plate</label>
            <p><strong>{vehicle.license_plate}</strong></p>
          </InfoGroup>
          <InfoGroup>
            <label>PUC Certificate Number</label>
            <p>{vehicle.puc_number}</p>
          </InfoGroup>
        </GridContent>

        <NotesSection>
          <label>Additional Notes</label>
          <p>{vehicle.notes || "No notes available."}</p>
        </NotesSection>
      </DetailsCard>
    </Container>
  );
}

// Styled Components
const Container = styled.div` max-width: 800px; margin: 40px auto; padding: 20px; `;
const BackButton = styled.button` background: none; border: none; color: #2563eb; cursor: pointer; margin-bottom: 20px; font-weight: 600; `;
const DetailsCard = styled.div` background: white; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0; `;
const HeaderSection = styled.div` display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; `;
const GridContent = styled.div` display: grid; grid-template-columns: 1fr 1fr; gap: 24px; `;
const InfoGroup = styled.div` label { font-size: 12px; color: #64748b; text-transform: uppercase; } p { font-size: 16px; font-weight: 500; color: #1e293b; margin-top: 4px; } `;
const NotesSection = styled.div` margin-top: 30px; padding-top: 20px; border-top: 1px solid #f1f5f9; label { font-size: 12px; color: #64748b; } p { color: #475569; margin-top: 8px; } `;
const StatusBadge = styled.span` background: #dcfce7; color: #166534; padding: 6px 16px; border-radius: 20px; font-weight: 600; font-size: 12px; `;