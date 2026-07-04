// components/DriverSidebar.jsx
import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const DriverSidebar = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const location = useLocation();
  
  // Path matching helper function
  const isActive = (path) => location.pathname === path ? 'active' : '';

  // Prevent background scroll on mobile when sidebar is open (UX Fix)
  useEffect(() => {
    if (isSidebarOpen && window.innerWidth <= 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isSidebarOpen]);

  const handleLinkClick = () => {
    if (window.innerWidth <= 1024) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <>
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      <aside className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        {/* Logo Section */}
        <div className="sidebar-logo-section">
          <Link to="/driver-dashboard" className="sidebar-logo" onClick={handleLinkClick}>
            🚛 CargoMax
          </Link>
        </div>

        <div className="sidebar-menu-wrapper">
          {/* DASHBOARD GROUP */}
          <div className="menu-group">
            <p className="group-title">DASHBOARD</p>
            <ul className="group-items">
              <li className={`sidebar-item ${isActive('/driver-dashboard')}`}>
                <Link to="/driver-dashboard" className="sidebar-link" onClick={handleLinkClick}>
                  <span className="icon">📊</span> <span className="text">Overview</span>
                </Link>
              </li>
              <li className={`sidebar-item ${isActive('/driver-live-map')}`}>
                <Link to="/driver-live-map" className="sidebar-link" onClick={handleLinkClick}>
                  <span className="icon">🗺️</span> <span className="text">Live Tracking</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* SHIPMENTS GROUP */}
          <div className="menu-group">
            <p className="group-title">SHIPMENTS</p>
            <ul className="group-items">
              <li className={`sidebar-item ${isActive('/driver-shipments')}`}>
                <Link to="/driver-shipments" className="sidebar-link" onClick={handleLinkClick}>
                  <span className="icon">📦</span> <span className="text">My Shipments</span>
                </Link>
              </li>
              <li className={`sidebar-item ${isActive('/driver-track')}`}>
                <Link to="/driver-track" className="sidebar-link" onClick={handleLinkClick}>
                  <span className="icon">📍</span> <span className="text">Track Shipment</span>
                </Link>
              </li>
              <li className={`sidebar-item ${isActive('/driver-history')}`}>
                <Link to="/driver-history" className="sidebar-link" onClick={handleLinkClick}>
                  <span className="icon">📜</span> <span className="text">Delivery History</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* FLEET MANAGEMENT - Driver Specific */}
          <div className="menu-group">
            <p className="group-title">MY FLEET</p>
            <ul className="group-items">
              <li className={`sidebar-item ${isActive('/driver-vehicle')}`}>
                <Link to="/driver-vehicle" className="sidebar-link" onClick={handleLinkClick}>
                  <span className="icon">🚛</span> <span className="text">My Vehicle</span>
                </Link>
              </li>
              <li className={`sidebar-item ${isActive('/driver-maintenance')}`}>
                <Link to="/driver-maintenance" className="sidebar-link" onClick={handleLinkClick}>
                  <span className="icon">🔧</span> <span className="text">Maintenance</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* PROFILE GROUP */}
          <div className="menu-group">
            <p className="group-title">ACCOUNT</p>
            <ul className="group-items">
              <li className={`sidebar-item ${isActive('/driver-profile')}`}>
                <Link to="/driver-profile" className="sidebar-link" onClick={handleLinkClick}>
                  <span className="icon">👤</span> <span className="text">My Profile</span>
                </Link>
              </li>
              <li className={`sidebar-item ${isActive('/driver-settings')}`}>
                <Link to="/driver-settings" className="sidebar-link" onClick={handleLinkClick}>
                  <span className="icon">⚙️</span> <span className="text">Settings</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Logout Button - Fixed at bottom */}
        <div className="sidebar-footer">
          <Link to="/logout" className="sidebar-logout" onClick={handleLinkClick}>
            <span className="icon">🚪</span> <span className="text">Logout</span>
          </Link>
        </div>
      </aside>
    </>
  );
};

export default DriverSidebar;