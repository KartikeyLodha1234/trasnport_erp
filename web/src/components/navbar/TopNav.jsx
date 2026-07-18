// web/src/components/navbar/TopNav.jsx
import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { NavLink, useNavigate } from 'react-router-dom';

const TopNav = () => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);
  const sidebarRef = useRef(null);
  const hamburgerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      // Close semi-nav dropdowns when clicking outside
      if (activeDropdown !== null) {
        const target = event.target;
        const dropdownElement = document.querySelector(`[data-dropdown="${activeDropdown}"]`);
        if (dropdownElement && !dropdownElement.contains(target)) {
          setActiveDropdown(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarRef.current && 
        !sidebarRef.current.contains(event.target) &&
        hamburgerRef.current && 
        !hamburgerRef.current.contains(event.target)
      ) {
        setIsSidebarOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsSidebarOpen(false);
        setActiveDropdown(null);
      }
    };

    if (isSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleDropdown = (index) => {
    setActiveDropdown(activeDropdown === index ? null : index);
  };

  // Close user dropdown when clicking a link
  const closeUserDropdown = () => {
    setIsDropdownOpen(false);
  };

  // ===== MENU ITEMS WITH DROPDOWNS =====
  const menuItems = [
    { 
      path: '/dashboard', 
      icon: '🏠', 
      label: 'Home',
      dropdown: [
        { path: '/dashboard', label: 'Overview' },
        { path: '/home/live-map', label: 'Live Shipments Map' },
        { path: '/home/fleet-status', label: 'FleetStatus' },
      ]
    },
    { 
      path: '/shipments', 
      icon: '📦', 
      label: 'Booking',
      dropdown: [
        { path: '/shipments', label: 'All shipments' },
        { path: '/shipments/create', label: 'New Booking' },
        { path: '/shipments/track', label: 'Track Shipment' },
        { path: '/shipments/delayed', label: 'Delayed Shipments' },
        { path: '/shipments/history', label: 'Booking History' },
      ]
    },
    { 
      path: '/delivery', 
      icon: '🚚', 
      label: 'Delivery',
      dropdown: [
        { path: '/delivery/driver-shipments', label: 'Assign Delivery' },
        { path: '/delivery/track', label: 'Track Delivery' },
        { path: '/delivery/completed', label: 'Completed' },
      ]
    },
    { 
      path: '/accounts', 
      icon: '💰', 
      label: 'Rs Accounts',
      dropdown: [
        { path: '/accounts/overview', label: 'Overview' },
        { path: '/accounts/transactions', label: 'Transactions' },
        { path: '/accounts/receivables', label: 'Receivables' },
        { path: '/accounts/payables', label: 'Payables' },
      ]
    },
    { 
      path: '/reports', 
      icon: '📈', 
      label: 'Reports',
      dropdown: [
        { path: '/reports/sales', label: 'Sales Report' },
        { path: '/reports/financial', label: 'Financial Report' },
        { path: '/reports/operational', label: 'Operational Report' },
        { path: '/reports/custom', label: 'Custom Report' },
      ]
    },
    { 
         
      path: '/masters',
      icon: '📋', 
      label: 'Masters',
      dropdown: [
        { path: '/masters/clients', label: 'Clients' },
        { path: '/masters/city', label: 'City' },
        { path: '/masters/parties', label: 'Parties' },
        { path: '/masters/vehicles', label: 'Vehicles' },
        { path: '/masters/drivershow', label: 'Drivers' },
        { path: '/masters/routes', label: 'Routes' },
        { path: '/masters/maintenance', label: 'Maintenance' },
        { path: '/masters/branches', label: 'Branches' },
      ]
    },
    { 
      path: '/settings', 
      icon: '⚙️', 
      label: 'Settings',
      dropdown: [
        // { path: '/settings/profile', label: 'Profile' },
        { path: '/settings/company', label: 'Company profile' },
        { path: '/settings/users', label: 'User Management' },
        { path: '/settings/permissions', label: 'Permissions' },
        { path: '/settings/integrations', label: 'Integrations' },
      ]
    },
  ];

  const mobileMenuItems = [
    { path: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { path: '/shipments', icon: '📦', label: 'Booking' },
    { path: '/delivery', icon: '🚚', label: 'Delivery' },
    { path: '/accounts', icon: '💰', label: 'Rs Accounts' },
    { path: '/reports', icon: '📈', label: 'Reports' },
    { path: '/masters', icon: '📋', label: 'Masters' },
    { path: '/settings', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <NavWrapper>
      <TopNavbar>
        <NavLeft>
          <Hamburger 
            ref={hamburgerRef} 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            $isOpen={isSidebarOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </Hamburger>
          <LogoContainer to="/dashboard">
            <LogoImage 
              src="../../../img/logo.jpeg" 
              alt="TransportERP Logo"
            />
            <Brand>TransportERP</Brand>
          </LogoContainer>
        </NavLeft>

        <SearchWrapper>
          <SearchIcon>🔍</SearchIcon>
          <SearchInput placeholder="Search..." />
          <Shortcut>⌘K</Shortcut>
        </SearchWrapper>

        <RightSection ref={dropdownRef}>
          <UserMenu onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
            <Avatar>👨‍💼</Avatar>
            <UserInfo>
              <Name>Admin</Name>
              <Role>Fleet Manager</Role>
            </UserInfo>
            <Chevron $isOpen={isDropdownOpen}>▼</Chevron>
          </UserMenu>

          {isDropdownOpen && (
            <Dropdown>
              <StyledNavLink to="/profile" onClick={closeUserDropdown}>
                👤 Profile
              </StyledNavLink>
              <StyledNavLink to="/settings" onClick={closeUserDropdown}>
                ⚙️ Settings
              </StyledNavLink>
              <StyledNavLink to="/wallet" onClick={closeUserDropdown}>
  👛 Wallet
</StyledNavLink>
              <Divider />
              <DropdownItem onClick={handleLogout} style={{ color: '#ef4444' }}>
                🚪 Logout
              </DropdownItem>
            </Dropdown>
          )}
        </RightSection>
      </TopNavbar>

      {/* ===== SEMI NAVBAR WITH DROPDOWNS ===== */}
      <SemiNavbar>
        {menuItems.map((item, index) => (
          <NavItemWrapper key={item.path}>
            <NavItem
              to={item.path}
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={(e) => {
                // If item has dropdown, toggle it
                if (item.dropdown && item.dropdown.length > 0) {
                  e.preventDefault();
                  toggleDropdown(index);
                }
              }}
            >
              <NavIcon>{item.icon}</NavIcon>
              <NavLabel>{item.label}</NavLabel>
              {item.dropdown && item.dropdown.length > 0 && (
                <DropdownArrow $isOpen={activeDropdown === index}>▼</DropdownArrow>
              )}
            </NavItem>
            {item.dropdown && item.dropdown.length > 0 && activeDropdown === index && (
              <DropdownMenu data-dropdown={index}>
                {item.dropdown.map((subItem) => (
                  <DropdownMenuItem
                    key={subItem.path}
                    to={subItem.path}
                    onClick={() => {
                      setActiveDropdown(null);
                    }}
                  >
                    {subItem.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenu>
            )}
          </NavItemWrapper>
        ))}
      </SemiNavbar>

      {/* ===== MOBILE SIDEBAR ===== */}
      <>
        <MobileSidebar ref={sidebarRef} $isOpen={isSidebarOpen}>
          <SidebarHeader>
            <SidebarBrand>
              <LogoImage 
                src="../../../ASSEST/logo.jpeg" 
                alt="TransportERP Logo"
                style={{ height: '30px', marginRight: '10px' }}
              />
              TransportERP
            </SidebarBrand>
            <CloseButton onClick={() => setIsSidebarOpen(false)}>✕</CloseButton>
          </SidebarHeader>
          
          <SidebarMenu>
            {mobileMenuItems.map((item) => (
              <SidebarItem
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                <SidebarIcon>{item.icon}</SidebarIcon>
                <SidebarLabel>{item.label}</SidebarLabel>
              </SidebarItem>
            ))}
          </SidebarMenu>
          
          <SidebarFooter>
            <FooterText>v2.0.0</FooterText>
          </SidebarFooter>
        </MobileSidebar>

        <Overlay $isOpen={isSidebarOpen} onClick={() => setIsSidebarOpen(false)} />
      </>
    </NavWrapper>
  );
};

// ============ STYLES ============

const NavWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
`;

const TopNavbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #0044e4;
  padding: 0 24px;
  height: 64px;
  color: white;

  @media (max-width: 768px) {
    padding: 0 12px;
    height: 56px;
  }
`;

const NavLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 200px;
`;

const LogoContainer = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: white;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;

const LogoImage = styled.img`
  height: 32px;
  width: auto;
  object-fit: contain;

  @media (max-width: 768px) {
    height: 24px;
  }
`;

const Hamburger = styled.button`
  display: none;
  flex-direction: column;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  z-index: 1003;

  span {
    width: 24px;
    height: 2px;
    background: white;
    border-radius: 2px;
    transition: all 0.3s ease;
    transform-origin: center;
  }

  span:nth-child(1) {
    transform: ${props => props.$isOpen ? 'rotate(45deg) translate(4px, 4px)' : 'rotate(0)'};
  }
  span:nth-child(2) {
    opacity: ${props => props.$isOpen ? '0' : '1'};
  }
  span:nth-child(3) {
    transform: ${props => props.$isOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'rotate(0)'};
  }

  @media (max-width: 768px) {
    display: flex;
  }

  &:hover span {
    background: #60a5fa;
  }
`;

const Brand = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: white;
  white-space: nowrap;

  @media (max-width: 768px) {
    font-size: 16px;
  }

  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const SearchWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.15);
  padding: 6px 14px;
  border-radius: 8px;
  flex: 1;
  max-width: 500px;
  margin: 0 20px;

  @media (max-width: 768px) {
    display: none;
  }
`;

const SearchIcon = styled.span`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
`;

const SearchInput = styled.input`
  flex: 1;
  background: none;
  border: none;
  color: white;
  font-size: 14px;
  outline: none;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const Shortcut = styled.kbd`
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.6);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;

  @media (max-width: 768px) {
    gap: 8px;
  }
`;

const UserMenu = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 12px 4px 4px;
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  @media (max-width: 768px) {
    padding: 4px 8px 4px 4px;
    gap: 6px;
  }
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: white;

  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    display: none;
  }
`;

const Name = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #f1f5f9;
`;

const Role = styled.div`
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
`;

const Chevron = styled.span`
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  transform: ${props => props.$isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
  transition: transform 0.3s ease;

  @media (max-width: 768px) {
    display: none;
  }
`;

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  min-width: 180px;
  padding: 6px;
  z-index: 1001;
  animation: slideDown 0.15s ease-out;

  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 768px) {
    right: -50px;
    min-width: 160px;
  }
`;

// New styled component for NavLink in dropdown
const StyledNavLink = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  color: #1e3458;
  font-size: 13px;
  text-decoration: none;
  transition: background 0.2s;

  &:hover {
    background: #f1f5f9;
  }

  &.active {
    background: #e2e8f0;
    font-weight: 500;
  }
`;

const DropdownItem = styled.div`
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  color: #1e3458;
  font-size: 13px;
  transition: background 0.2s;

  &:hover {
    background: #f1f5f9;
  }
`;

const Divider = styled.hr`
  margin: 4px 0;
  border: none;
  border-top: 1px solid #e2e8f0;
`;

// ===== SEMI NAVBAR =====
const SemiNavbar = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  background: #a2bbf0;
  padding: 6px 24px;
  border-bottom: 1px solid #8aa3d4;
  overflow-x: visible;
  position: relative;
  z-index: 99;

  @media (max-width: 768px) {
    display: none;
  }

  &::-webkit-scrollbar {
    height: 0;
  }
`;

const NavItemWrapper = styled.div`
  position: relative;
`;

const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  color: #1f4d97;
  text-decoration: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    color: #0f172a;
  }

  &.active {
    color: #0044e4;
    background: rgba(255, 255, 255, 0.5);
    font-weight: 600;
  }
`;

const NavIcon = styled.span`
  font-size: 16px;
`;

const NavLabel = styled.span``;

const DropdownArrow = styled.span`
  font-size: 8px;
  margin-left: 2px;
  transform: ${props => props.$isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
  transition: transform 0.2s ease;
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  padding: 6px;
  z-index: 1005;
  animation: slideDown 0.15s ease-out;

  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const DropdownMenuItem = styled(NavLink)`
  display: block;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  color: #1e3458;
  font-size: 13px;
  text-decoration: none;
  transition: background 0.2s;

  &:hover {
    background: #f1f5f9;
  }

  &.active {
    background: #e2e8f0;
    font-weight: 500;
  }
`;

// ===== MOBILE SIDEBAR =====
const MobileSidebar = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 280px;
  height: 100vh;
  background: #0a0f1a;
  transform: translateX(${props => props.$isOpen ? '0' : '-100%'});
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1002;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 20px rgba(0, 0, 0, 0.4);

  @media (min-width: 769px) {
    display: none;
  }
`;

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #1a2332;
  min-height: 56px;
`;

const SidebarBrand = styled.div`
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 700;
  color: #60a5fa;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 22px;
  cursor: pointer;
  padding: 4px 8px;

  &:hover {
    color: white;
  }
`;

const SidebarMenu = styled.nav`
  flex: 1;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
`;

const SidebarItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  color: #8899aa;
  text-decoration: none;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
  }

  &.active {
    color: #60a5fa;
    background: rgba(96, 165, 250, 0.1);
  }
`;

const SidebarIcon = styled.span`
  font-size: 18px;
  min-width: 28px;
`;

const SidebarLabel = styled.span`
  font-weight: 400;
`;

const SidebarFooter = styled.div`
  padding: 16px 20px;
  border-top: 1px solid #1a2332;
`;

const FooterText = styled.div`
  font-size: 12px;
  color: #475569;
  text-align: center;
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1001;
  opacity: ${props => props.$isOpen ? '1' : '0'};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transition: all 0.3s ease;
  -webkit-tap-highlight-color: transparent;

  @media (min-width: 769px) {
    display: none;
  }
`;

export default TopNav;