import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';

export default function ProtectedRoute({ allowedRoles = [], children }) {
  const { user, role, isInitializing, loading } = useAuth();
  const location = useLocation();

  // Show sleek native brand loading screen while Supabase session & workspace synchronize
  if (isInitializing) {
    return (
      <div
        className="app-init-screen"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--rx-canvas, #f1f3f5)',
          padding: '20px',
          boxSizing: 'border-box',
          fontFamily: "var(--app-font, 'Plus Jakarta Sans', -apple-system, sans-serif)",
        }}
        role="status"
        aria-live="polite"
      >
        <div
          style={{
            background: 'var(--rx-surface, #ffffff)',
            border: '1px solid var(--rx-border, #e2e8f0)',
            borderRadius: '14px',
            padding: '36px 32px',
            boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            maxWidth: '360px',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* Brand Icon Badge */}
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'var(--rx-obsidian-brand, #18181b)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px',
              boxShadow: '0 4px 12px rgba(24, 24, 27, 0.18)',
            }}
          >
            <ShieldCheck size={22} />
          </div>

          {/* Brand Title */}
          <h2
            style={{
              margin: '0 0 4px 0',
              fontSize: '17px',
              fontWeight: 700,
              color: 'var(--rx-text, #0f172a)',
              letterSpacing: '-0.01em',
            }}
          >
            ResolveX
          </h2>
          <p
            style={{
              margin: '0 0 20px 0',
              fontSize: '13px',
              color: 'var(--rx-text-muted, #64748b)',
            }}
          >
            Institutional Grievance Management
          </p>

          {/* Status Indicator Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 16px',
              background: 'var(--rx-shade-inset, #f1f5f9)',
              border: '1px solid var(--rx-border-soft, #edf2f7)',
              borderRadius: '999px',
              fontSize: '12.5px',
              fontWeight: 500,
              color: 'var(--rx-text-secondary, #475569)',
            }}
          >
            <span
              className="spinner"
              style={{
                width: '13px',
                height: '13px',
                borderWidth: '2px',
                borderTopColor: 'var(--rx-obsidian-brand, #18181b)',
              }}
            />
            <span>Synchronizing workspace…</span>
          </div>
        </div>
      </div>
    );
  }

  // Resolve active user: prefer context user, fallback to synchronously cached storage during microtask transitions
  let activeUser = user;
  if (!activeUser && typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('cms_active_user_v1');
      if (saved) {
        activeUser = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('[ProtectedRoute] Storage parse exception:', e);
    }
  }

  // If user is still not resolved, check if network request is in flight before bouncing
  if (!activeUser) {
    if (loading) {
      return (
        <div
          className="app-init-screen"
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--rx-canvas, #f1f3f5)',
            padding: '20px',
            boxSizing: 'border-box',
            fontFamily: "var(--app-font, 'Plus Jakarta Sans', -apple-system, sans-serif)",
          }}
          role="status"
          aria-live="polite"
        >
          <div
            style={{
              background: 'var(--rx-surface, #ffffff)',
              border: '1px solid var(--rx-border, #e2e8f0)',
              borderRadius: '14px',
              padding: '36px 32px',
              boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              maxWidth: '360px',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'var(--rx-obsidian-brand, #18181b)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px',
                boxShadow: '0 4px 12px rgba(24, 24, 27, 0.18)',
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <h2
              style={{
                margin: '0 0 4px 0',
                fontSize: '17px',
                fontWeight: 700,
                color: 'var(--rx-text, #0f172a)',
                letterSpacing: '-0.01em',
              }}
            >
              ResolveX
            </h2>
            <p
              style={{
                margin: '0 0 20px 0',
                fontSize: '13px',
                color: 'var(--rx-text-muted, #64748b)',
              }}
            >
              Verifying credentials…
            </p>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 16px',
                background: 'var(--rx-shade-inset, #f1f5f9)',
                border: '1px solid var(--rx-border-soft, #edf2f7)',
                borderRadius: '999px',
                fontSize: '12.5px',
                fontWeight: 500,
                color: 'var(--rx-text-secondary, #475569)',
              }}
            >
              <span
                className="spinner"
                style={{
                  width: '13px',
                  height: '13px',
                  borderWidth: '2px',
                  borderTopColor: 'var(--rx-obsidian-brand, #18181b)',
                }}
              />
              <span>Connecting to session…</span>
            </div>
          </div>
        </div>
      );
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific roles are required and user does not have permission
  const userRole = (role || activeUser?.role || ROLES.STUDENT).toLowerCase();
  const normalizedAllowed = allowedRoles.map((r) => String(r).toLowerCase());

  if (normalizedAllowed.length > 0 && !normalizedAllowed.includes(userRole)) {
    // Determine default redirect path based on active user role
    const defaultRedirect =
      userRole === ROLES.ADMIN
        ? '/admin/dashboard'
        : userRole === ROLES.STAFF
        ? '/staff/queue'
        : '/dashboard';

    return <Navigate to={defaultRedirect} replace />;
  }

  // Support both wrapped component children or Outlet for route layout matching
  return children ? children : <Outlet />;
}
