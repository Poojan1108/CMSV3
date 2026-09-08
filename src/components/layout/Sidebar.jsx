import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Search,
  Inbox,
  CheckSquare,
  History,
  BarChart3,
  TrendingUp,
  Building2,
  ArrowLeft,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldAlert,
  Wrench,
  GraduationCap,
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
  ],
};

const ROLE_META = {
  [ROLES.STUDENT]: { label: 'Student Portal', icon: GraduationCap, tone: 'info' },
  [ROLES.STAFF]: { label: 'Staff Workspace', icon: Wrench, tone: 'warning' },
  [ROLES.ADMIN]: { label: 'Admin Console', icon: ShieldAlert, tone: 'success' },
};

export default function Sidebar({ isMobileOpen, onCloseMobile, isCollapsed, onToggleCollapse }) {
  const { pathname } = useLocation();
  const { role, currentOrg } = useAuth();

  const navItems = NAV_CONFIG[role] || NAV_CONFIG[ROLES.STUDENT];
  const meta = ROLE_META[role] || ROLE_META[ROLES.STUDENT];
  const RoleIcon = meta.icon;

  const isItemActive = (item) => {
    if (item.path === '/complaints' && pathname === '/dashboard') return true;
    if (item.path === '/admin/analytics' && pathname === '/admin/dashboard') return true;
    return item.match === 'exact' ? pathname === item.path : pathname.startsWith(item.path);
  };

  return (
    <>
      {isMobileOpen && (
        <div className="sx-sidebar-backdrop" onClick={onCloseMobile} aria-hidden="true" />
      )}

      <aside
        className={`sx-sidebar ${isCollapsed ? 'is-collapsed' : ''} ${
          isMobileOpen ? 'is-mobile-open' : ''
        }`}
      >
        {/* Role / workspace identity */}
        <div className="sx-sidebar-head">
          <div className={`sx-role-card tone-${meta.tone}`}>
            <span className="sx-role-icon">
              <RoleIcon size={15} />
            </span>
            {!isCollapsed && (
              <span className="sx-role-text">
                <span className="sx-role-title">{meta.label}</span>
                <span className="sx-role-org">{currentOrg?.name || 'ResolveX'}</span>
              </span>
            )}
          </div>

          <button
            type="button"
            className="sx-collapse-btn"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="sx-sidebar-nav" aria-label="Primary">
          {!isCollapsed && <p className="sx-nav-caption">Menu</p>}
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
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon size={17} />
                    {!isCollapsed && <span className="sx-nav-label">{item.label}</span>}
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
            title={isCollapsed ? 'Back to Home' : undefined}
          >
            <ArrowLeft size={17} />
            {!isCollapsed && <span className="sx-nav-label">Back to Home</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}
