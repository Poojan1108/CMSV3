import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FileText,
  PlusCircle,
  Search,
  Inbox,
  CheckSquare,
  History,
  BarChart3,
  Building2,
  Users,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';

/**
 * Navigation model. `match` controls how the active state is resolved so
 * sibling routes (e.g. /complaints vs /complaints/new) never highlight
 * at the same time.
 */
const NAV_CONFIG = {
  [ROLES.STUDENT]: [
    { path: '/complaints', label: 'My Complaints', icon: FileText, match: 'exact' },
    { path: '/complaints/new', label: 'New Complaint', icon: PlusCircle, match: 'exact' },
    { path: '/track', label: 'Track Ticket', icon: Search, match: 'exact' },
  ],
  [ROLES.STAFF]: [
    { path: '/staff/queue', label: 'Department Queue', icon: Inbox, match: 'exact' },
    { path: '/staff/assigned', label: 'Assigned to Me', icon: CheckSquare, match: 'exact' },
    { path: '/staff/resolutions', label: 'Resolution Log', icon: History, match: 'exact' },
  ],
  [ROLES.ADMIN]: [
    { path: '/admin/analytics', label: 'Analytics & Governance', icon: BarChart3, match: 'exact' },
    { path: '/admin/departments', label: 'Departments & SLA', icon: Building2, match: 'exact' },
    { path: '/admin/members', label: 'Staff & Members', icon: Users, match: 'exact' },
  ],
};

export default function Sidebar({ isMobileOpen, onCloseMobile, isCollapsed, onToggleCollapse }) {
  const { pathname } = useLocation();
  const { role } = useAuth();

  const userRole = (role || ROLES.STUDENT).toLowerCase();
  const navItems = NAV_CONFIG[userRole] || NAV_CONFIG[ROLES.STUDENT];

  // On mobile drawer mode, always show full labels even if desktop sidebar was collapsed
  const showLabels = isMobileOpen || !isCollapsed;

  const isItemActive = (item) => {
    if (item.path === '/complaints' && pathname === '/dashboard') return true;
    if (item.path === '/admin/analytics' && pathname === '/admin/dashboard') return true;
    return item.match === 'exact' ? pathname === item.path : pathname.startsWith(item.path);
  };

  return (
    <>
      {isMobileOpen && (
        <div
          className="sx-sidebar-backdrop"
          onClick={onCloseMobile}
          onTouchStart={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sx-sidebar ${isCollapsed && !isMobileOpen ? 'is-collapsed' : ''} ${
          isMobileOpen ? 'is-mobile-open' : ''
        }`}
        aria-label="Sidebar Navigation"
      >
        {/* Sidebar Header & Toggle */}
        <div className="sx-sidebar-head">
          {showLabels && (
            <span className="sx-sidebar-head-title">Menu</span>
          )}
          <button
            type="button"
            className="sx-collapse-btn"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          {/* Mobile close button inside the drawer header */}
          {isMobileOpen && (
            <button
              type="button"
              className="sx-mobile-close-btn"
              onClick={onCloseMobile}
              aria-label="Close navigation menu"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="sx-sidebar-nav" aria-label="Primary">
          <ul className="sx-nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={onCloseMobile}
                    className={`sx-nav-item ${active ? 'is-active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                    title={!showLabels ? item.label : undefined}
                  >
                    <Icon size={17} />
                    {showLabels && <span className="sx-nav-label">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="sx-sidebar-foot">
          <Link
            to="/landing"
            onClick={onCloseMobile}
            className="sx-nav-item sx-nav-home"
            title={!showLabels ? 'Back to Home' : undefined}
          >
            <ArrowLeft size={17} />
            {showLabels && <span className="sx-nav-label">Back to Home</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}
