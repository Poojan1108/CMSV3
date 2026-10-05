import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ChevronDown,
  Menu,
  X,
  GraduationCap,
  Wrench,
  ShieldAlert,
  LogOut,
  Building2,
  Building,
  Home,
  Sliders,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROLES } from '../../utils/constants';

function getOrgIcon(typeKey, currentOrg) {
  const t = (currentOrg?.type || typeKey || '').toUpperCase();
  if (t.includes('SOCIETY') || t.includes('RESIDENCY') || t.includes('RWA')) return <Home size={14} />;
  if (t.includes('CORPORATE') || t.includes('OFFICE') || t.includes('CORP')) return <Building size={14} />;
  if (t.includes('CUSTOM')) return <Sliders size={14} />;
  return <Building2 size={14} />;
}

export default function HeaderNavbar({ isMobileMenuOpen, onToggleMobileMenu }) {
  const {
    user,
    role,
    orgKey,
    currentOrg,
    switchOrgTemplate,
    orgTemplates,
    logout,
  } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [openMenu, setOpenMenu] = useState(null); // 'org' | 'profile' | null

  const orgRef = useRef(null);
  const profileRef = useRef(null);

  // Close profile dropdown whenever mobile sidebar menu is opened to prevent visual clash
  useEffect(() => {
    if (isMobileMenuOpen) {
      setOpenMenu(null);
    }
  }, [isMobileMenuOpen]);

  // Handle outside click & mobile touchstart + Escape key dismissal
  useEffect(() => {
    const handleOutsideInteraction = (event) => {
      const refs = [orgRef, profileRef];
      const insideAny = refs.some((ref) => ref.current?.contains(event.target));
      if (!insideAny) setOpenMenu(null);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };

    document.addEventListener('mousedown', handleOutsideInteraction);
    document.addEventListener('touchstart', handleOutsideInteraction, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideInteraction);
      document.removeEventListener('touchstart', handleOutsideInteraction);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleMenu = (menu) => setOpenMenu((prev) => (prev === menu ? null : menu));

  function getRoleLabel(roleName) {
    if (!currentOrg) return roleName;
    if (roleName === ROLES.ADMIN) {
      const term = currentOrg.adminTerm || 'Admin';
      return (term === 'Operations / HR Admin' || term === 'Admin & HR') ? 'Workspace Admin' : term;
    }
    if (roleName === ROLES.STAFF) return currentOrg.staffTerm || 'Staff';
    return currentOrg.userTerm || 'Member';
  }

  return (
    <header className="app-header-navbar">
      <div className="header-left">
        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={() => {
            setOpenMenu(null);
            onToggleMobileMenu();
          }}
          aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Link to="/dashboard" className="header-brand" onClick={() => setOpenMenu(null)}>
          <span className="brand-logo-icon">
            <ShieldCheck size={18} />
          </span>
          <span className="brand-text">
            <span className="brand-title">ResolveX</span>
          </span>
        </Link>
      </div>

      <div className="header-right">
        {/* Organization Indicator Badge */}
        <div
          className="role-switcher-btn"
          style={{ cursor: 'default' }}
          title={`Organization: ${currentOrg?.name || 'ResolveX'} (${currentOrg?.type || 'Standard'})`}
        >
          {getOrgIcon(orgKey, currentOrg)}
          <span className="org-switcher-label">
            <strong>{currentOrg?.name || 'ResolveX'}</strong>
          </span>
        </div>

        {/* Authenticated User Profile & Role Indicator */}
        <div className="user-profile-container" ref={profileRef}>
          <button
            type="button"
            className="user-profile-card"
            onClick={() => toggleMenu('profile')}
            aria-expanded={openMenu === 'profile'}
            aria-haspopup="true"
            title={`Signed in as ${user?.name || user?.email} (${getRoleLabel(role)})`}
          >
            <span className={`profile-role-badge role-${role}`}>
              {getRoleLabel(role)}
            </span>
            <span className="profile-user-name">
              {user?.name || user?.email?.split('@')[0] || 'User'}
            </span>
            <ChevronDown
              size={13}
              className={`chevron-icon ${openMenu === 'profile' ? 'open' : ''}`}
            />
          </button>

          {openMenu === 'profile' && (
            <div className="profile-dropdown-menu" role="menu">
              <div className="profile-menu-header">
                <p className="profile-menu-name">{user?.name || 'User'}</p>
                <p className="profile-menu-email">{user?.email}</p>
              </div>
              <button
                type="button"
                className="profile-menu-item"
                role="menuitem"
                onClick={async () => {
                  setOpenMenu(null);
                  await logout();
                  showToast('Signed out successfully.', 'info');
                  navigate('/');
                }}
              >
                <LogOut size={15} />
                Sign out &amp; exit
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
