import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ROLES } from './utils/constants';

// Layout & Guards
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Lazy-loaded Pages (Code-split per Route)
const LandingPage = lazy(() => import('./pages/LandingPage'));
const NewComplaintForm = lazy(() => import('./pages/NewComplaintForm'));
const MyComplaintsList = lazy(() => import('./pages/MyComplaintsList'));
const TicketTracker = lazy(() => import('./pages/TicketTracker'));

const StaffQueue = lazy(() => import('./pages/StaffQueue'));
const StaffResolutions = lazy(() => import('./pages/StaffResolutions'));

const AdminAnalytics = lazy(() => import('./pages/AdminAnalytics'));
const AdminDepartments = lazy(() => import('./pages/AdminDepartments'));
const AdminMembers = lazy(() => import('./pages/AdminMembers'));

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Suspense
            fallback={
              <div
                style={{
                  minHeight: '100vh',
                  width: '100vw',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--rx-canvas, #f8fafc)',
                  padding: '20px',
                  boxSizing: 'border-box',
                  fontFamily: "var(--app-font, 'Plus Jakarta Sans', -apple-system, sans-serif)",
                }}
                role="status"
                aria-live="polite"
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '14px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '11px',
                      background: 'var(--rx-obsidian-brand, #18181b)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 16px rgba(24, 24, 27, 0.18)',
                      fontWeight: 800,
                      fontSize: '17px',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    RX
                  </div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 14px',
                      background: 'var(--rx-surface, #ffffff)',
                      border: '1px solid var(--rx-border, #e2e8f0)',
                      borderRadius: '999px',
                      fontSize: '12.5px',
                      fontWeight: 500,
                      color: 'var(--rx-text-secondary, #475569)',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                    }}
                  >
                    <span
                      className="spinner"
                      style={{
                        width: '12px',
                        height: '12px',
                        borderWidth: '2px',
                        borderTopColor: 'var(--rx-obsidian-brand, #18181b)',
                      }}
                    />
                    <span>Loading ResolveX…</span>
                  </div>
                </div>
              </div>
            }
          >
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
                  <Route path="/admin/members" element={<AdminMembers />} />
                </Route>
              </Route>

              {/* Catch-all redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
