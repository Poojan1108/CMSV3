import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ROLES } from './utils/constants';

// Layout & Guards
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import NewComplaintForm from './pages/NewComplaintForm';
import MyComplaintsList from './pages/MyComplaintsList';
import TicketTracker from './pages/TicketTracker';

import StaffQueue from './pages/StaffQueue';
import StaffResolutions from './pages/StaffResolutions';

import AdminAnalytics from './pages/AdminAnalytics';
import AdminDepartments from './pages/AdminDepartments';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Landing & Authentication Pages */}
            <Route path="/" element={<LandingPage initialMode="landing" />} />
            <Route path="/landing" element={<LandingPage initialMode="landing" />} />
            <Route path="/login" element={<LandingPage initialMode="login" />} />
            <Route path="/signup" element={<LandingPage initialMode="signup" />} />
            <Route path="/forgot-password" element={<LandingPage initialMode="forgot-password" />} />

            {/* Authenticated Web Application Layout Shell */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              {/* Student / User Portal Routes */}
              <Route element={<ProtectedRoute allowedRoles={[ROLES.STUDENT, ROLES.ADMIN]} />}>
                <Route path="/dashboard" element={<MyComplaintsList />} />
                <Route path="/complaints" element={<MyComplaintsList />} />
                <Route path="/complaints/new" element={<NewComplaintForm />} />
                <Route path="/track" element={<TicketTracker />} />
              </Route>

              {/* Staff / Resolver Workspace Routes */}
              <Route element={<ProtectedRoute allowedRoles={[ROLES.STAFF, ROLES.ADMIN]} />}>
                <Route path="/staff/queue" element={<StaffQueue />} />
                <Route path="/staff/assigned" element={<StaffQueue />} />
                <Route path="/staff/resolutions" element={<StaffResolutions />} />
              </Route>

              {/* System Admin Console Routes */}
              <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
                <Route path="/admin/dashboard" element={<AdminAnalytics />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
                <Route path="/admin/departments" element={<AdminDepartments />} />
              </Route>
            </Route>

            {/* Catch-all redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
