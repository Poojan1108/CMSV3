import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';

export default function ProtectedRoute({ allowedRoles = [], children }) {
  const { user, role } = useAuth();
  const location = useLocation();

  // If user is not logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific roles are required and user does not have permission
  const userRole = (role || user?.role || ROLES.STUDENT).toLowerCase();
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
