// web/src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import styled from 'styled-components';

import TopNav from "../web/src/components/navbar/TopNav.jsx";
import ProtectedRoute from "../web/src/components/ProtectedRoute.jsx";

import Login from "../web/src/pages/login.jsx";
// Dashboard
import MaintenanceRegistryLog from "../web/src/pages/admin/master/maintenancelogs.jsx";
import routes from "../web/src/pages/admin/routes/routes.jsx";
import ClientsPage from "../web/src/pages/admin/master/client.jsx";
import Home from "../web/src/pages/admin/dashboard/Home.jsx";
import LiveMap from "../web/src/pages/admin/dashboard/live-map.jsx";
import CreateLR from '../web/src/pages/admin/booking/lr.jsx';
import FleetStatus from "../web/src/pages/admin/dashboard/fleetstatus.jsx";
//driver assignment
import AllShipments from "../web/src/pages/admin/booking/allshipments.jsx";
import DriverShipment from "../web/src/pages/admin/Delivery/driverassigment.jsx";
import DriverShow from "../web/src/pages/admin/master/driverlist.jsx";
import Track from "../web/src/pages/admin/booking/track.jsx";
import DelayedShipments from "../web/src/pages/admin/booking/delayedshipments.jsx";
import VehicleList from "../web/src/pages/admin/master/VehicleList.jsx";
import VehicleView from "../web/src/pages/admin/master/vehicleview.jsx";
import VehicleEdit from "../web/src/pages/admin/master/vehicleedit.jsx";
import Profile from "../web/src/pages/admin/profile.jsx";
import CompanySettings from "../web/src/pages/admin/settings/CompanySettings.jsx";
import AdminWallet from "../web/src/pages/admin/wallet/wallet.jsx";
import Transactions from "../web/src/pages/admin/transactions/Transactions.jsx";
import Cities from "../web/src/pages/admin/routes/city.jsx";

// ===== STYLED COMPONENTS =====
const LayoutWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f1f5f9;
`;

const ContentArea = styled.main`
  flex: 1;
  padding: 24px;
  margin-top: 112px;
  margin-left: 0;
  background: #f1f5f9;
  min-height: calc(100vh - 112px);
  width: 100%;

  @media (max-width: 768px) {
    margin-top: 56px;
    padding: 12px;
  }
`;

// ===== APP =====
function App() {
  const DashboardLayout = ({ children }) => (
    <LayoutWrapper>
      <TopNav />
      <ContentArea>{children}</ContentArea>
    </LayoutWrapper>
  );

  // Helper function to wrap routes with ProtectedRoute and DashboardLayout
  const ProtectedRouteWithLayout = (Component, props = {}) => (
    <ProtectedRoute {...props}>
      <DashboardLayout>
        <Component />
      </DashboardLayout>
    </ProtectedRoute>
  );

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Dashboard Routes */}
        <Route path="/dashboard" element={ProtectedRouteWithLayout(Home)} />
        <Route path="/home/live-map" element={ProtectedRouteWithLayout(LiveMap)} />
        <Route path="/home/fleet-status" element={ProtectedRouteWithLayout(FleetStatus)} />

        {/* Shipment Routes */}
        <Route path="/shipments" element={ProtectedRouteWithLayout(AllShipments)} />
        <Route path="/shipments/create" element={ProtectedRouteWithLayout(CreateLR)} />
        <Route path="/shipments/delayed" element={ProtectedRouteWithLayout(DelayedShipments)} />
        <Route path="/shipments/track" element={ProtectedRouteWithLayout(Track)} />
        <Route 
          path="/shipments/history" 
          element={ProtectedRouteWithLayout(() => <div>Booking History Page</div>)} 
        />

        {/* Delivery Routes */}
        <Route 
          path="/delivery" 
          element={ProtectedRouteWithLayout(() => <div>Delivery Page</div>)} 
        />
        <Route 
          path="/delivery/driver-shipments" 
          element={ProtectedRouteWithLayout(DriverShipment)} 
        />
        <Route 
          path="/delivery/track" 
          element={ProtectedRouteWithLayout(Track)} 
        />
        <Route 
          path="/delivery/completed" 
          element={ProtectedRouteWithLayout(() => <div>Completed Deliveries Page</div>)} 
        />

        {/* Accounts Routes */}
        <Route 
          path="/accounts" 
          element={ProtectedRouteWithLayout(() => <div>Accounts Page</div>)} 
        />
        <Route 
          path="/accounts/overview" 
          element={ProtectedRouteWithLayout(() => <div>Accounts Overview Page</div>)} 
        />
      <Route 
  path="/accounts/transactions" 
  element={ProtectedRouteWithLayout(Transactions, { requiredRole: 'admin' })} 
/>
        <Route 
          path="/accounts/receivables" 
          element={ProtectedRouteWithLayout(() => <div>Receivables Page</div>)} 
        />
        <Route 
          path="/accounts/payables" 
          element={ProtectedRouteWithLayout(() => <div>Payables Page</div>)} 
        />

        {/* Reports Routes */}
        <Route 
          path="/reports" 
          element={ProtectedRouteWithLayout(() => <div>Reports Page</div>)} 
        />
        <Route 
          path="/reports/sales" 
          element={ProtectedRouteWithLayout(() => <div>Sales Report Page</div>)} 
        />
        <Route 
          path="/reports/financial" 
          element={ProtectedRouteWithLayout(() => <div>Financial Report Page</div>)} 
        />
        <Route 
          path="/reports/operational" 
          element={ProtectedRouteWithLayout(() => <div>Operational Report Page</div>)} 
        />
        <Route 
          path="/reports/custom" 
          element={ProtectedRouteWithLayout(() => <div>Custom Report Page</div>)} 
        />

        {/* Masters Routes */}
        <Route 
          path="/masters" 
          element={ProtectedRouteWithLayout(() => <div>Masters Page</div>)} 
        />
        <Route 
          path="/masters/clients" 
          element={ProtectedRouteWithLayout(ClientsPage)} 
        />
        <Route 
          path="/masters/city" 
          element={ProtectedRouteWithLayout(Cities)} 
        />
        <Route 
          path="/masters/vehicles" 
          element={ProtectedRouteWithLayout(VehicleList, { requiredRole: 'admin' })} 
        />
        <Route 
          path="/vehicle-view/:id?" 
          element={ProtectedRouteWithLayout(VehicleView, { requiredRole: 'admin' })} 
        />
        <Route 
          path="/vehicle-edit/:id?" 
          element={ProtectedRouteWithLayout(VehicleEdit, { requiredRole: 'admin' })} 
        />
        <Route 
          path="/masters/drivershow" 
          element={ProtectedRouteWithLayout(DriverShow, { requiredRole: 'admin' })} 
        />
        <Route 
          path="/masters/routes" 
          element={ProtectedRouteWithLayout(routes)} 
        />
        <Route 
          path="/masters/maintenance" 
          element={ProtectedRouteWithLayout(MaintenanceRegistryLog)} 
        />

        {/* Settings Routes */}
        <Route 
          path="/settings" 
          element={ProtectedRouteWithLayout(CompanySettings)} 
        />
        {/* Profile - both routes point to the same component */}
        <Route 
          path="/profile" 
          element={ProtectedRouteWithLayout(Profile)} 
        />
        {/* <Route 
          path="/settings/profile" 
          element={ProtectedRouteWithLayout(Profile)} 
        /> */}
        <Route path="/wallet" element={ProtectedRouteWithLayout(AdminWallet)} />
        <Route 
          path="/settings/company" 
          element={ProtectedRouteWithLayout(CompanySettings)} 
        />
        <Route 
          path="/settings/users" 
          element={ProtectedRouteWithLayout(() => <div>User Management Page</div>)} 
        />
        <Route 
          path="/settings/permissions" 
          element={ProtectedRouteWithLayout(() => <div>Permissions Page</div>)} 
        />
        <Route 
          path="/settings/integrations" 
          element={ProtectedRouteWithLayout(() => <div>Integrations Page</div>)} 
        />

        {/* Catch-all route for 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;