import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

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
            {/* Public Landing Page */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/landing" element={<LandingPage />} />

            {/* Authenticated Web Application Layout Shell */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<MyComplaintsList />} />
              <Route path="/complaints" element={<MyComplaintsList />} />
              <Route path="/complaints/new" element={<NewComplaintForm />} />
              <Route path="/track" element={<TicketTracker />} />
              
              <Route path="/staff/queue" element={<StaffQueue />} />
              <Route path="/staff/assigned" element={<StaffQueue />} />
              <Route path="/staff/resolutions" element={<StaffResolutions />} />

              <Route path="/admin/dashboard" element={<AdminAnalytics />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/departments" element={<AdminDepartments />} />
            </Route>

            {/* Catch-all redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
