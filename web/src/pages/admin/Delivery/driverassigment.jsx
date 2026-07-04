import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

export default function DriverShipment() {
    // 🚛 ड्राइवर और शिपमेंट असाइनमेंट का लाइव डेटा मैट्रिक्स
    const activeAssignments = [
        { SRno: "1", Comapnyname: "Kartikey Lodha", truckmodelname: "TRK-4022", numberplate: "rj06pa6666", cargo: "Industrial Gears", destination: "Udaipur", status: "In Transit" },
        { SRno: "2", Comapnyname: "Ramesh Chandra", truckmodelname: "TRK-1092", numberplate: "rj06pa1122", cargo: "Textile Fabric", destination: "Bhilwara", status: "Loading" },
        { SRno: "3", Comapnyname: "Suresh Kumar", truckmodelname: "TRK-8819", numberplate: "rj06pa9988", cargo: "Electronics", destination: "Jaipur", status: "Dispatched" }
    ];

    return (
        <PageWrapper>

            {/* 1. Header Control System Setup */}
            <HeaderControl>
                <TitleBlock>
                    <h2>Driver Assignments</h2>
                    <p>Monitor tactical driver allocations, active cargo manifests, and delivery progress metrics.</p>
                </TitleBlock>
                
                {/* 🟢 LINKED: यह बटन अब आपके Create Shipment फ़ॉर्म पर नेविगेट करेगा */}
                {/* <Link to="/new-shipment" style={{ textDecoration: 'none' }}>
                                    <button 
                                        type="button" 
                                        style={{ 
                                            backgroundColor: '#2563eb', 
                                            color: '#ffffff', 
                                            padding: '10px 20px', 
                                            border: 'none', 
                                            borderRadius: '10px', 
                                            fontSize: '14px', 
                                            fontWeight: 'bold', 
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
                                            transition: 'background-color 0.15s'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                                    >
                                        ➕ Add shipment
                                    </button>
                                </Link> */}
            </HeaderControl>

            {/* 2. Stats Summary Ribbon */}
            <StatsRibbon>
                <StatCard>
                    <p>Active Drivers On Road</p>
                    <span>{activeAssignments.length} Drivers Assigned</span>
                </StatCard>
                <StatCard variant="success">
                    <p>Manifest Efficiency</p>
                    <span>100% Operational</span>
                </StatCard>
            </StatsRibbon>

            {/* 3. Live Assignments Ledger Data Table */}
            <LedgerCard>
                <LedgerHeader>
                    <h3>Active Logistics Ledger</h3>
                </LedgerHeader>

                <TableResponsiveWrapper>
                    <LedgerTable>
                        <thead>
                            <tr>
                                <th>Sr.no</th>
                                <th>Driver / Operator</th>
                                <th>Truck Model</th>
                                <th>Number Plate</th>
                                <th>Cargo Material</th>
                                <th>Destination</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeAssignments.map((row) => (
                                <tr key={row.SRno}>
                                    <td className="monospace color-slate">{row.SRno}</td>
                                    <td className="font-semibold text-white">{row.Comapnyname}</td>
                                    <td>{row.truckmodelname}</td>
                                    <td className="monospace text-blue text-uppercase">{row.numberplate}</td>
                                    <td>{row.cargo}</td>
                                    <td className="font-semibold text-white">{row.destination}</td>
                                    <td>
                                        <StatusBadge status={row.status}>{row.status}</StatusBadge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </LedgerTable>
                </TableResponsiveWrapper>
            </LedgerCard>

        </PageWrapper>
    );
}

/* ---------------- Responsive Styled Components ---------------- */

const PageWrapper = styled.div`
    max-width: 1140px;
    margin: 0 auto;
    padding: 20px;
    font-family: sans-serif;

    @media (max-width: 1024px) {
        padding: 16px 12px;
    }
`;

const HeaderControl = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    gap: 16px;

    @media (max-width: 768px) {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
        
        a {
            width: 100%;
        }
    }
`;

const TitleBlock = styled.div`
    h2 {
        font-size: 26px;
        font-weight: bold;
        color: #f02501;
        margin: 0 0 6px 0;
    }
    p {
        font-size: 14px;
        color: #64748b;
        margin: 0;
    }

    @media (max-width: 768px) {
        h2 { font-size: 22px; }
        p { font-size: 13px; }
    }
`;

const AddButton = styled.button`
    color: #ffffff;
    padding: 10px 20px;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
    background-color: #2563eb;
    transition: background-color 0.15s;
    white-space: nowrap;

    &:hover {
        background-color: #1d4ed8;
    }

    @media (max-width: 768px) {
        width: 100%;
        padding: 14px;
    }
`;

const StatsRibbon = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 32px;
`;

const StatCard = styled.div`
    flex: 1 1 200px;
    background-color: #0b1329;
    padding: 20px;
    border-radius: 12px;
    color: #fff;
    border: 1px solid #1e293b;

    p {
        font-size: 12px;
        color: #94a3b8;
        margin: 0 0 8px 0;
        text-transform: uppercase;
    }

    span {
        font-size: 24px;
        font-weight: bold;
        color: ${props => props.variant === 'success' ? '#34d399' : '#ffffff'};
    }
`;

const LedgerCard = styled.div`
    background-color: #0b1329;
    border-radius: 16px;
    border: 1px solid #1e293b;
    overflow: hidden;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
`;

const LedgerHeader = styled.div`
    padding: 20px;
    border-bottom: 1px solid #1e293b;
    background-color: #0f172a;

    h3 {
        font-size: 16px;
        font-weight: bold;
        color: #ffffff;
        margin: 0;
    }
`;

const TableResponsiveWrapper = styled.div`
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
`;

const LedgerTable = styled.table`
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 14px;
    color: #cbd5e1;

    thead tr {
        background-color: #0f172a;
        border-bottom: 2px solid #1e293b;
        color: #94a3b8;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    th, td {
        padding: 16px 24px;
        white-space: nowrap;
    }

    tbody tr {
        border-bottom: 1px solid #1e293b;
        &:hover {
            background-color: #111c3a;
        }
    }

    .monospace { font-family: monospace; }
    .color-slate { color: #94a3b8; }
    .font-semibold { font-weight: 600; }
    .text-white { color: #fff; }
    .text-blue { color: #38bdf8; }
    .text-uppercase { text-transform: uppercase; }

    @media (max-width: 768px) {
        th, td {
            padding: 12px 16px;
        }
    }
`;

const StatusBadge = styled.span`
    background-color: ${props => 
        props.status === 'In Transit' ? 'rgba(56,189,248,0.15)' : 
        props.status === 'Loading' ? 'rgba(251,191,36,0.15)' : 'rgba(52,211,153,0.15)'};
    color: ${props => 
        props.status === 'In Transit' ? '#38bdf8' : 
        props.status === 'Loading' ? '#fbbf24' : '#34d399'};
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    
    &::before {
        content: "●";
        margin-right: 6px;
        font-size: 10px;
    }
`;