import React from 'react';
import { NavLink, Link } from 'react-router-dom';
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
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Wrench,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';

export default function Sidebar({
  isMobileOpen,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
}) {
  const { role } = useAuth();

  // Define nav links for each role
  const getNavItems = () => {
    switch (role) {
      case ROLES.STAFF:
        return [
          {
            path: '/staff/queue',
            label: 'Department Queue',
            icon: Inbox,
            badge: 'Queue',
          },
          {
            path: '/staff/assigned',
            label: 'Assigned Complaints',
            icon: CheckSquare,
          },
          {
            path: '/staff/resolutions',
            label: 'Resolution Log',
            icon: History,
          },
        ];
      case ROLES.ADMIN:
        return [
          {
            path: '/admin/dashboard',
            label: 'Global Dashboard',
            icon: BarChart3,
          },
          {
            path: '/admin/analytics',
            label: 'Analytics & Insights',
            icon: TrendingUp,
          },
          {
            path: '/admin/departments',
            label: 'Department Mgmt',
            icon: Building2,
          },
        ];
      case ROLES.STUDENT:
      default:
        return [
          {
            path: '/dashboard',
            label: 'Student Dashboard',
            icon: LayoutDashboard,
          },
          {
            path: '/complaints/new',
            label: 'New Complaint',
            icon: PlusCircle,
          },
          {
            path: '/complaints',
            label: 'My Complaints',
            icon: FileText,
          },
          {
            path: '/track',
            label: 'Track Ticket',
            icon: Search,
          },
        ];
    }
  };

  const navItems = getNavItems();

  const getRoleHeader = () => {
    switch (role) {
      case ROLES.ADMIN:
        return {
          title: 'ADMIN CONSOLE',
          icon: ShieldAlert,
          className: 'role-header-admin',
        };
      case ROLES.STAFF:
        return {
          title: 'STAFF WORKSPACE',
          icon: Wrench,
          className: 'role-header-staff',
        };
      case ROLES.STUDENT:
      default:
        return {
          title: 'STUDENT PORTAL',
          icon: GraduationCap,
          className: 'role-header-student',
        };
    }
  };

  const roleHeader = getRoleHeader();
  const HeaderIcon = roleHeader.icon;

  return (
    <>
      {/* Overlay backdrop for mobile view */}
      {isMobileOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`app-sidebar ${isCollapsed ? 'collapsed' : ''} ${
          isMobileOpen ? 'mobile-open' : ''
        }`}
      >
        {/* Sidebar Header & Toggle */}
        <div className="sidebar-header">
          {!isCollapsed && (
            <div className={`sidebar-role-tag ${roleHeader.className}`}>
              <HeaderIcon size={14} />
              <span>{roleHeader.title}</span>
            </div>
          )}
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <div className="nav-section-title">
            {!isCollapsed ? 'NAVIGATION' : '•••'}
          </div>
          <ul className="nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path} className="nav-item">
                  <NavLink
                    to={item.path}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'active' : ''}`
                    }
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className="nav-link-icon">
                      <Icon size={18} />
                    </div>
                    {!isCollapsed && (
                      <span className="nav-link-label">{item.label}</span>
                    )}
                    {!isCollapsed && item.badge && (
                      <span className="nav-link-badge">{item.badge}</span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer - Back to Landing Page */}
        <div className="sidebar-footer">
          <Link
            to="/landing"
            className="nav-link back-landing-link"
            onClick={onCloseMobile}
            title={isCollapsed ? 'Back to Landing Page' : undefined}
          >
            <div className="nav-link-icon">
              <ArrowLeft size={18} />
            </div>
            {!isCollapsed && (
              <span className="nav-link-label">Back to Landing Page</span>
            )}
          </Link>
        </div>
      </aside>
    </>
  );
}
