import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  ChevronDown, 
  UserCheck, 
  Menu, 
  X, 
  GraduationCap, 
  Wrench, 
  ShieldAlert,
  Sparkles,
  LogOut,
  Building2,
  Building,
  Home,
  Sliders
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROLES } from '../../utils/constants';

export default function HeaderNavbar({ isMobileMenuOpen, onToggleMobileMenu }) {
  const { 
    user, 
    role, 
    switchRole, 
    orgKey, 
    currentOrg, 
    switchOrgTemplate, 
    orgTemplates 
  } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const roleDropdownRef = useRef(null);
  const orgDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target)) {
        setIsRoleDropdownOpen(false);
      }
      if (orgDropdownRef.current && !orgDropdownRef.current.contains(event.target)) {
        setIsOrgDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleSelect = (targetRole) => {
    switchRole(targetRole);
    setIsRoleDropdownOpen(false);
    showToast(`Switched persona to ${targetRole.toUpperCase()}`, 'info');

    if (targetRole === ROLES.ADMIN) {
      navigate('/admin/dashboard');
    } else if (targetRole === ROLES.STAFF) {
      navigate('/staff/queue');
    } else {
      navigate('/dashboard');
    }
  };

  const handleOrgSelect = (targetOrgKey) => {
    switchOrgTemplate(targetOrgKey);
    setIsOrgDropdownOpen(false);
    showToast(`Organization set to: ${orgTemplates[targetOrgKey]?.name || targetOrgKey}`, 'success');
  };

  const getOrgIcon = (typeKey) => {
    switch (typeKey) {
      case 'SOCIETY':
        return <Home size={15} />;
      case 'CORPORATE':
        return <Building size={15} />;
      case 'CUSTOM':
        return <Sliders size={15} />;
      case 'COLLEGE':
      default:
        return <Building2 size={15} />;
    }
  };

  const getRoleIcon = (roleName) => {
    switch (roleName) {
      case ROLES.ADMIN:
        return <ShieldAlert size={14} className="role-icon admin" />;
      case ROLES.STAFF:
        return <Wrench size={14} className="role-icon staff" />;
      case ROLES.STUDENT:
      default:
        return <GraduationCap size={14} className="role-icon student" />;
    }
  };

  const getRoleLabel = (roleName) => {
    switch (roleName) {
      case ROLES.ADMIN:
        return currentOrg?.adminTerm || 'Admin';
      case ROLES.STAFF:
        return currentOrg?.staffTerm || 'Staff';
      case ROLES.STUDENT:
      default:
        return currentOrg?.userTerm || 'Student';
    }
  };

  return (
    <header className="app-header-navbar">
      <div className="header-left">
        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={onToggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link to="/dashboard" className="header-brand">
          <div className="brand-logo-icon">
            <ShieldCheck size={20} />
          </div>
          <div className="brand-text">
            <span className="brand-title">{currentOrg?.name || 'CampusCare'}</span>
            <span className="brand-badge">{currentOrg?.type || 'CMS v2'}</span>
          </div>
        </Link>
      </div>

      <div className="header-right">
        {/* Organization Template Switcher */}
        <div className="role-switcher-container" ref={orgDropdownRef}>
          <button
            type="button"
            className="role-switcher-btn org-badge-btn"
            onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
            title="Click to switch Organization Template (College, Society, Corporate, Custom)"
            style={{
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              color: 'var(--primary-light)'
            }}
          >
            {getOrgIcon(orgKey)}
            <span className="role-switcher-label">
              Org: <strong>{currentOrg?.type?.split('/')[0] || orgKey}</strong>
            </span>
            <ChevronDown size={14} className={`chevron-icon ${isOrgDropdownOpen ? 'open' : ''}`} />
          </button>

          {isOrgDropdownOpen && (
            <div className="role-dropdown-menu">
              <div className="dropdown-header">
                <span className="dropdown-title">Organization Templates</span>
                <span className="dropdown-subtitle">Switch template mode for testing</span>
              </div>
              <div className="role-options-list">
                {Object.keys(orgTemplates).map((key) => {
                  const item = orgTemplates[key];
                  const isSelected = orgKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`role-option-item ${isSelected ? 'active' : ''}`}
                      onClick={() => handleOrgSelect(key)}
                    >
                      <div className="role-option-icon student">
                        {getOrgIcon(key)}
                      </div>
                      <div className="role-option-text">
                        <span className="role-name">{item.name}</span>
                        <span className="role-desc">{item.type} • {item.userTerm}</span>
                      </div>
                      {isSelected && <UserCheck size={16} className="active-check" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Persona Switcher Dropdown */}
        <div className="role-switcher-container" ref={roleDropdownRef}>
          <button
            type="button"
            className={`role-switcher-btn role-badge-${role}`}
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            title="Click to switch persona role for testing"
          >
            <Sparkles size={14} className="sparkle-icon" />
            <span className="role-switcher-label">
              Role: <strong>{getRoleLabel(role)}</strong>
            </span>
            <ChevronDown size={14} className={`chevron-icon ${isRoleDropdownOpen ? 'open' : ''}`} />
          </button>

          {isRoleDropdownOpen && (
            <div className="role-dropdown-menu">
              <div className="dropdown-header">
                <span className="dropdown-title">Testing Persona Switcher</span>
                <span className="dropdown-subtitle">Switch persona role for testing</span>
              </div>
              <div className="role-options-list">
                <button
                  type="button"
                  className={`role-option-item ${role === ROLES.STUDENT ? 'active' : ''}`}
                  onClick={() => handleRoleSelect(ROLES.STUDENT)}
                >
                  <div className="role-option-icon student">
                    <GraduationCap size={16} />
                  </div>
                  <div className="role-option-text">
                    <span className="role-name">{currentOrg?.userTerm || 'Student'} Persona</span>
                    <span className="role-desc">Alex Chen • {currentOrg?.type}</span>
                  </div>
                  {role === ROLES.STUDENT && <UserCheck size={16} className="active-check" />}
                </button>

                <button
                  type="button"
                  className={`role-option-item ${role === ROLES.STAFF ? 'active' : ''}`}
                  onClick={() => handleRoleSelect(ROLES.STAFF)}
                >
                  <div className="role-option-icon staff">
                    <Wrench size={16} />
                  </div>
                  <div className="role-option-text">
                    <span className="role-name">{currentOrg?.staffTerm || 'Staff'} Persona</span>
                    <span className="role-desc">Dr. Vance / Resolver Team</span>
                  </div>
                  {role === ROLES.STAFF && <UserCheck size={16} className="active-check" />}
                </button>

                <button
                  type="button"
                  className={`role-option-item ${role === ROLES.ADMIN ? 'active' : ''}`}
                  onClick={() => handleRoleSelect(ROLES.ADMIN)}
                >
                  <div className="role-option-icon admin">
                    <ShieldAlert size={16} />
                  </div>
                  <div className="role-option-text">
                    <span className="role-name">{currentOrg?.adminTerm || 'Admin'} Persona</span>
                    <span className="role-desc">Executive Management</span>
                  </div>
                  {role === ROLES.ADMIN && <UserCheck size={16} className="active-check" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Card */}
        <div className="user-profile-container" ref={profileDropdownRef}>
          <button
            type="button"
            className="user-profile-card"
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
          >
            <div className="avatar-wrapper">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="user-avatar-img" />
              ) : (
                <div className="user-avatar-fallback">
                  {user?.name ? user.name.charAt(0) : 'U'}
                </div>
              )}
              <span className={`status-indicator status-${role}`} />
            </div>
            <div className="user-info-text">
              <span className="user-name">{user?.name || 'Guest User'}</span>
              <span className="user-subtext">
                {getRoleIcon(role)}
                <span>{getRoleLabel(role)}</span>
              </span>
            </div>
            <ChevronDown size={14} className={`chevron-icon ${isProfileDropdownOpen ? 'open' : ''}`} />
          </button>

          {isProfileDropdownOpen && (
            <div className="profile-dropdown-menu">
              <div className="profile-menu-header">
                <p className="profile-menu-name">{user?.name}</p>
                <p className="profile-menu-email">{user?.email}</p>
                <span className={`profile-role-pill role-pill-${role}`}>
                  {currentOrg?.name} • {getRoleLabel(role)}
                </span>
              </div>
              <div className="profile-menu-divider" />
              <button
                type="button"
                className="profile-menu-item logout"
                onClick={() => {
                  setIsProfileDropdownOpen(false);
                  showToast('Navigating to landing page...', 'info');
                  navigate('/');
                }}
              >
                <LogOut size={16} />
                <span>Return to Landing Page</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
