// web/src/components/navbar/TopNav.jsx
import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Package,
  Truck,
  Landmark,
  BarChart3,
  ClipboardList,
  Settings,
  Search,
  ChevronDown,
  User,
  Wallet,
  LogOut,
  X,
} from "lucide-react";

// ============ DESIGN TOKENS ============
const colors = {
  navBg: "#0B1220",
  navBorder: "rgba(255, 255, 255, 0.08)",
  navText: "#E2E8F0",
  navTextMuted: "#94A3B8",
  accent: "#6366F1",
  accentHover: "#818CF8",
  accentSoft: "rgba(99, 102, 241, 0.14)",
  subnavBg: "#FFFFFF",
  subnavBorder: "#E5E7EB",
  subnavText: "#475569",
  subnavTextActive: "#4F46E5",
  subnavHoverBg: "#F1F5F9",
  cardBg: "#FFFFFF",
  cardBorder: "#EEF1F5",
  cardText: "#1E293B",
  cardHoverBg: "#F8FAFC",
  danger: "#EF4444",
  dangerSoft: "rgba(239, 68, 68, 0.08)",
  sidebarBg: "#0B1220",
  sidebarBorder: "rgba(255, 255, 255, 0.08)",
  sidebarText: "#94A3B8",
};

const fontStack =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, 'Helvetica Neue', sans-serif";

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
      if (activeDropdown !== null) {
        const target = event.target;
        const dropdownElement = document.querySelector(
          `[data-dropdown="${activeDropdown}"]`,
        );
        if (dropdownElement && !dropdownElement.contains(target)) {
          setActiveDropdown(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
      if (event.key === "Escape") {
        setIsSidebarOpen(false);
        setActiveDropdown(null);
      }
    };

    if (isSidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const toggleDropdown = (index) => {
    setActiveDropdown(activeDropdown === index ? null : index);
  };

  const closeUserDropdown = () => {
    setIsDropdownOpen(false);
  };

  // ===== MENU ITEMS WITH DROPDOWNS =====
  const menuItems = [
    {
      path: "/dashboard",
      icon: Home,
      label: "Home",
      dropdown: [
        { path: "/dashboard", label: "Overview" },
        { path: "/home/live-map", label: "Live Shipments Map" },
        { path: "/home/fleet-status", label: "FleetStatus" },
      ],
    },
    {
      path: "/shipments",
      icon: Package,
      label: "Booking",
      dropdown: [
        { path: "/shipments", label: "All shipments" },
        { path: "/shipments/create", label: "New Booking" },
        { path: "/shipments/track", label: "Track Shipment" },
        { path: "/shipments/delayed", label: "Delayed Shipments" },
        { path: "/shipments/history", label: "Booking History" },
      ],
    },
    {
      path: "/delivery",
      icon: Truck,
      label: "Delivery",
      dropdown: [
        { path: "/delivery/driver-shipments", label: "Assign Delivery" },
        { path: "/delivery/track", label: "Track Delivery" },
        
        // ⚡ ADDED CHALLAN REGISTRY HERE ⚡
        { path: "/delivery/history", label: "Challan Registry" },
      ],
    },
    {
      path: "/masters",
      icon: ClipboardList,
      label: "Masters",
      dropdown: [
        { path: "/masters/city", label: "City" },
        { path: "/masters/parties", label: "Parties" },
        { path: "/masters/vehicles", label: "Vehicles" },
        { path: "/masters/drivershow", label: "Drivers" },
        { path: "/masters/routes", label: "Routes" },
        { path: "/masters/maintenance", label: "Maintenance" },
        { path: "/masters/branches", label: "Branches" },
      ],
    },
    {
      path: "/settings",
      icon: Settings,
      label: "Settings",
      dropdown: [
        { path: "/settings/company", label: "Company profile" },
        { path: "/settings/users", label: "User Management" },
        { path: "/settings/permissions", label: "Permissions" },
        { path: "/settings/integrations", label: "Integrations" },
      ],
    },
  ];

  const mobileMenuItems = [
    { path: "/dashboard", icon: Home, label: "Dashboard" },
    { path: "/shipments", icon: Package, label: "Booking" },
    { path: "/delivery", icon: Truck, label: "Delivery" },
    { path: "/accounts", icon: Landmark, label: "Rs Accounts" },
    { path: "/reports", icon: BarChart3, label: "Reports" },
    { path: "/masters", icon: ClipboardList, label: "Masters" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <NavWrapper>
      <TopNavbar>
        <NavLeft>
          <Hamburger
            ref={hamburgerRef}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            $isOpen={isSidebarOpen}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </Hamburger>
          <LogoContainer to="/dashboard">
            <LogoImage src="../../../img/logo.jpeg" alt="TransportERP Logo" />
            <Brand>TransportERP</Brand>
          </LogoContainer>
        </NavLeft>

        <SearchWrapper>
          <SearchIcon>
            <Search size={16} strokeWidth={2} />
          </SearchIcon>
          <SearchInput placeholder="Search..." />
          <Shortcut>⌘K</Shortcut>
        </SearchWrapper>

        <RightSection ref={dropdownRef}>
          <UserMenu onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
            <Avatar>
              <User size={17} strokeWidth={2} />
            </Avatar>
            <UserInfo>
              <Name>Admin</Name>
              <Role>Fleet Manager</Role>
            </UserInfo>
            <Chevron $isOpen={isDropdownOpen}>
              <ChevronDown size={15} strokeWidth={2} />
            </Chevron>
          </UserMenu>

          {isDropdownOpen && (
            <Dropdown>
              <StyledNavLink to="/profile" onClick={closeUserDropdown}>
                <User size={15} strokeWidth={1.9} /> Profile
              </StyledNavLink>
              <StyledNavLink to="/settings" onClick={closeUserDropdown}>
                <Settings size={15} strokeWidth={1.9} /> Settings
              </StyledNavLink>
              <StyledNavLink to="/wallet" onClick={closeUserDropdown}>
                <Wallet size={15} strokeWidth={1.9} /> Wallet
              </StyledNavLink>
              <Divider />
              <DropdownItem onClick={handleLogout} $danger>
                <LogOut size={15} strokeWidth={1.9} /> Logout
              </DropdownItem>
            </Dropdown>
          )}
        </RightSection>
      </TopNavbar>

      <SemiNavbar>
        {menuItems.map((item, index) => (
          <NavItemWrapper key={item.path}>
            <NavItem
              to={item.path}
              className={({ isActive }) => (isActive ? "active" : "")}
              onClick={(e) => {
                if (item.dropdown && item.dropdown.length > 0) {
                  e.preventDefault();
                  toggleDropdown(index);
                }
              }}
            >
              <NavIcon>
                <item.icon size={16} strokeWidth={1.9} />
              </NavIcon>
              <NavLabel>{item.label}</NavLabel>
              {item.dropdown && item.dropdown.length > 0 && (
                <DropdownArrow $isOpen={activeDropdown === index}>
                  <ChevronDown size={12} strokeWidth={2} />
                </DropdownArrow>
              )}
            </NavItem>
            {item.dropdown &&
              item.dropdown.length > 0 &&
              activeDropdown === index && (
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

      <>
        <MobileSidebar ref={sidebarRef} $isOpen={isSidebarOpen}>
          <SidebarHeader>
            <SidebarBrand>
              <LogoImage
                src="../../../ASSEST/logo.jpeg"
                alt="TransportERP Logo"
                style={{ height: "28px", marginRight: "10px" }}
              />
              TransportERP
            </SidebarBrand>
            <CloseButton
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close menu"
            >
              <X size={20} strokeWidth={2} />
            </CloseButton>
          </SidebarHeader>

          <SidebarMenu>
            {mobileMenuItems.map((item) => (
              <SidebarItem
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <SidebarIcon>
                  <item.icon size={18} strokeWidth={1.9} />
                </SidebarIcon>
                <SidebarLabel>{item.label}</SidebarLabel>
              </SidebarItem>
            ))}
          </SidebarMenu>

          <SidebarFooter>
            <FooterText>v2.0.0</FooterText>
          </SidebarFooter>
        </MobileSidebar>

        <Overlay
          $isOpen={isSidebarOpen}
          onClick={() => setIsSidebarOpen(false)}
        />
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
  font-family: ${fontStack};
`;

const TopNavbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${colors.navBg};
  border-bottom: 1px solid ${colors.navBorder};
  padding: 0 24px;
  height: 64px;
  color: ${colors.navText};

  @media (max-width: 768px) {
    padding: 0 12px;
    height: 56px;
  }
`;

const NavLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 200px;
`;

const LogoContainer = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: ${colors.navText};
  cursor: pointer;
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 0.85;
  }
`;

const LogoImage = styled.img`
  height: 30px;
  width: auto;
  object-fit: contain;
  border-radius: 6px;

  @media (max-width: 768px) {
    height: 24px;
  }
`;

const Hamburger = styled.button`
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  z-index: 1003;
  transition: background 0.15s ease;

  span {
    width: 20px;
    height: 2px;
    background: ${colors.navText};
    border-radius: 2px;
    transition: all 0.25s ease;
    transform-origin: center;
  }

  span:nth-child(1) {
    transform: ${(props) =>
      props.$isOpen ? "rotate(45deg) translate(4px, 4px)" : "rotate(0)"};
  }
  span:nth-child(2) {
    opacity: ${(props) => (props.$isOpen ? "0" : "1")};
  }
  span:nth-child(3) {
    transform: ${(props) =>
      props.$isOpen ? "rotate(-45deg) translate(4px, -4px)" : "rotate(0)"};
  }

  @media (max-width: 768px) {
    display: flex;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }
  &:hover span {
    background: ${colors.accentHover};
  }
`;

const Brand = styled.div`
  font-size: 17px;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  letter-spacing: -0.01em;

  @media (max-width: 768px) {
    font-size: 15px;
  }

  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

const SearchWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 7px 12px;
  border-radius: 8px;
  flex: 1;
  max-width: 460px;
  margin: 0 20px;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;

  &:focus-within {
    background: rgba(255, 255, 255, 0.08);
    border-color: ${colors.accent};
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const SearchIcon = styled.span`
  display: inline-flex;
  color: ${colors.navTextMuted};
`;

const SearchInput = styled.input`
  flex: 1;
  background: none;
  border: none;
  color: ${colors.navText};
  font-size: 13.5px;
  outline: none;
  font-family: inherit;

  &::placeholder {
    color: ${colors.navTextMuted};
  }
`;

const Shortcut = styled.kbd`
  background: rgba(255, 255, 255, 0.08);
  color: ${colors.navTextMuted};
  padding: 2px 7px;
  border-radius: 5px;
  font-size: 11px;
  font-family: ${fontStack};
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
  padding: 5px 12px 5px 5px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.07);
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
  background: linear-gradient(135deg, ${colors.accent}, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
  }
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  line-height: 1.3;

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
  font-size: 10.5px;
  color: ${colors.navTextMuted};
  letter-spacing: 0.01em;
`;

const Chevron = styled.span`
  display: inline-flex;
  color: ${colors.navTextMuted};
  transform: ${(props) => (props.$isOpen ? "rotate(180deg)" : "rotate(0deg)")};
  transition: transform 0.2s ease;

  @media (max-width: 768px) {
    display: none;
  }
`;

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  background: ${colors.cardBg};
  border: 1px solid ${colors.cardBorder};
  border-radius: 12px;
  box-shadow:
    0 4px 6px -2px rgba(0, 0, 0, 0.05),
    0 12px 24px -6px rgba(0, 0, 0, 0.14);
  min-width: 190px;
  padding: 6px;
  z-index: 1001;
  animation: slideDown 0.15s ease-out;

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 768px) {
    right: -50px;
    min-width: 170px;
  }
`;

const StyledNavLink = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 7px;
  cursor: pointer;
  color: ${colors.cardText};
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.15s ease;

  svg {
    color: ${colors.navTextMuted};
    flex-shrink: 0;
  }

  &:hover {
    background: ${colors.cardHoverBg};
  }

  &.active {
    background: ${colors.accentSoft};
    color: ${colors.accent};

    svg {
      color: ${colors.accent};
    }
  }
`;

const DropdownItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 7px;
  cursor: pointer;
  color: ${(props) => (props.$danger ? colors.danger : colors.cardText)};
  font-size: 13px;
  font-weight: 500;
  transition: background 0.15s ease;

  svg {
    flex-shrink: 0;
  }

  &:hover {
    background: ${(props) =>
      props.$danger ? colors.dangerSoft : colors.cardHoverBg};
  }
`;

const Divider = styled.hr`
  margin: 5px 4px;
  border: none;
  border-top: 1px solid ${colors.cardBorder};
`;

const SemiNavbar = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  background: ${colors.subnavBg};
  padding: 0 20px;
  border-bottom: 1px solid ${colors.subnavBorder};
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
  gap: 7px;
  padding: 13px 14px;
  color: ${colors.subnavText};
  text-decoration: none;
  font-size: 13.5px;
  font-weight: 500;
  transition:
    color 0.15s ease,
    background 0.15s ease;
  white-space: nowrap;
  cursor: pointer;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    left: 14px;
    right: 14px;
    bottom: 0;
    height: 2px;
    border-radius: 2px 2px 0 0;
    background: ${colors.accent};
    opacity: 0;
    transform: scaleX(0.6);
    transition:
      opacity 0.15s ease,
      transform 0.15s ease;
  }

  &:hover {
    color: #0f172a;
    background: ${colors.subnavHoverBg};
  }

  &.active {
    color: ${colors.subnavTextActive};
    font-weight: 600;

    &::after {
      opacity: 1;
      transform: scaleX(1);
    }
  }
`;

const NavIcon = styled.span`
  display: inline-flex;
  align-items: center;
  color: inherit;
`;

const NavLabel = styled.span``;

const DropdownArrow = styled.span`
  display: inline-flex;
  margin-left: 1px;
  color: ${colors.navTextMuted};
  transform: ${(props) => (props.$isOpen ? "rotate(180deg)" : "rotate(0deg)")};
  transition: transform 0.2s ease;
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  background: ${colors.cardBg};
  border: 1px solid ${colors.cardBorder};
  border-radius: 12px;
  box-shadow:
    0 4px 6px -2px rgba(0, 0, 0, 0.05),
    0 12px 24px -6px rgba(0, 0, 0, 0.14);
  min-width: 210px;
  padding: 6px;
  z-index: 1005;
  animation: slideDown 0.15s ease-out;

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const DropdownMenuItem = styled(NavLink)`
  display: block;
  padding: 8px 10px;
  border-radius: 7px;
  cursor: pointer;
  color: ${colors.cardText};
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.15s ease;

  &:hover {
    background: ${colors.cardHoverBg};
  }

  &.active {
    background: ${colors.accentSoft};
    color: ${colors.accent};
  }
`;

const MobileSidebar = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 280px;
  height: 100vh;
  background: ${colors.sidebarBg};
  transform: translateX(${(props) => (props.$isOpen ? "0" : "-100%")});
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1002;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.35);

  @media (min-width: 769px) {
    display: none;
  }
`;

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid ${colors.sidebarBorder};
  min-height: 56px;
`;

const SidebarBrand = styled.div`
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: ${colors.sidebarText};
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition:
    background 0.15s ease,
    color 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #ffffff;
  }
`;

const SidebarMenu = styled.nav`
  flex: 1;
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow-y: auto;
`;

const SidebarItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 11px 14px;
  color: ${colors.sidebarText};
  text-decoration: none;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 500;
  transition: all 0.15s ease;
  position: relative;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
  }

  &.active {
    color: #ffffff;
    background: ${colors.accentSoft};

    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 8px;
      bottom: 8px;
      width: 3px;
      border-radius: 0 3px 3px 0;
      background: ${colors.accent};
    }
  }
`;

const SidebarIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  color: inherit;
`;

const SidebarLabel = styled.span`
  font-weight: 500;
`;

const SidebarFooter = styled.div`
  padding: 14px 18px;
  border-top: 1px solid ${colors.sidebarBorder};
`;

const FooterText = styled.div`
  font-size: 11.5px;
  color: #475569;
  text-align: center;
  letter-spacing: 0.02em;
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(2px);
  z-index: 1001;
  opacity: ${(props) => (props.$isOpen ? "1" : "0")};
  visibility: ${(props) => (props.$isOpen ? "visible" : "hidden")};
  transition: all 0.3s ease;
  -webkit-tap-highlight-color: transparent;

  @media (min-width: 769px) {
    display: none;
  }
`;

export default TopNav;
