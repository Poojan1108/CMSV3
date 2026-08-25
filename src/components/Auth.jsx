import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ShieldCheck,
  Clock,
  Cpu,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ROLES } from '../utils/constants';

export default function Auth({ initialView = 'login', onBackToHome, onSuccess }) {
  const [authMode, setAuthMode] = useState(initialView); // 'login' | 'signup' | 'forgot-password'
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState(ROLES.STUDENT);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

  const { login, signup, resetPassword, userLabel, getRoleTerm } = useAuth();
  const { showToast } = useToast();

  const resetFormState = () => {
    setFormError('');
    setResetSuccessMessage('');
    setShowPassword(false);
  };

  const handleSwitchMode = (mode) => {
    resetFormState();
    setAuthMode(mode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setResetSuccessMessage('');
    setIsLoading(true);

    try {
      if (authMode === 'login') {
        if (!email.trim() || !password) {
          throw new Error('Please enter both email and password.');
        }
        await login(email.trim(), password);
        showToast('Welcome back! Signed in successfully.', 'success');
        if (onSuccess) onSuccess();
      } else if (authMode === 'signup') {
        if (!name.trim()) {
          throw new Error('Please provide your full name.');
        }
        if (!email.trim() || !password) {
          throw new Error('Please provide a valid email and password.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        await signup(email.trim(), password, name.trim(), selectedRole);
        showToast('Account created successfully! Welcome to ResolveX.', 'success');
        if (onSuccess) onSuccess();
      } else if (authMode === 'forgot-password') {
        if (!email.trim()) {
          throw new Error('Please enter the email address linked to your account.');
        }
        const result = await resetPassword(email.trim());
        setResetSuccessMessage(
          result?.message || 'Password reset link has been dispatched to your email!'
        );
        showToast('Password reset link sent! Check your email inbox.', 'success');
      }
    } catch (err) {
      const errorText = err.message || 'An error occurred during authentication.';
      setFormError(errorText);
      showToast(errorText, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Top Left Floating Logo / Home Link */}
      <div
        className="auth-header-logo"
        onClick={onBackToHome}
        role="button"
        tabIndex={0}
        aria-label="Back to landing page"
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="8" fill="var(--bg-landing, #0B0D14)" />
          <path d="M16 6L25 11.2V20.8L16 26L7 20.8V11.2L16 6Z" stroke="var(--primary, #3b82f6)" strokeWidth="2" />
          <circle cx="16" cy="16" r="3" fill="var(--text-white, #ffffff)" />
        </svg>
        <span className="logo-text">ResolveX</span>
      </div>

      {/* Top Right Quick Mode Toggles */}
      <div className="auth-header-actions">
        {authMode === 'login' && (
          <>
            <span className="header-hint">New to ResolveX?</span>
            <button
              type="button"
              className="auth-toggle-btn"
              onClick={() => handleSwitchMode('signup')}
            >
              Sign Up <ArrowRight size={14} style={{ marginLeft: '6px' }} />
            </button>
          </>
        )}
        {authMode === 'signup' && (
          <>
            <span className="header-hint">Already have an account?</span>
            <button
              type="button"
              className="auth-toggle-btn"
              onClick={() => handleSwitchMode('login')}
            >
              Log in <ArrowRight size={14} style={{ marginLeft: '6px' }} />
            </button>
          </>
        )}
        {authMode === 'forgot-password' && (
          <button
            type="button"
            className="auth-toggle-btn"
            onClick={() => handleSwitchMode('login')}
          >
            <ArrowLeft size={14} style={{ marginRight: '6px' }} /> Back to Log in
          </button>
        )}
      </div>

      {/* Main Grid Content */}
      <div className="auth-main-layout">
        {/* Left Side: Brand Showcase */}
        <div className="auth-left-brand">
          <div className="auth-left-content">
            <div className="auth-hero-text">
              <h1>
                Every Complaint.<br />
                Structured Into<br />
                <span className="blue-gradient-text">Resolution.</span>
              </h1>
              <p>
                A unified platform to capture, route, track, and resolve complaints across departments
                with complete transparency and real-time accountability.
              </p>
            </div>

            {/* Trust Badges */}
            <div className="auth-trust-badges-bar">
              <div className="auth-badge-item">
                <ShieldCheck size={16} className="badge-icon" />
                <span>Enterprise Security</span>
              </div>
              <div className="auth-badge-item">
                <Clock size={16} className="badge-icon" />
                <span>Real-time Tracking</span>
              </div>
              <div className="auth-badge-item">
                <Cpu size={16} className="badge-icon" />
                <span>Automated Triage</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Centered Floating Card */}
        <div className="auth-right-form-wrapper">
          <div className="auth-form-card">
            {/* Card Header */}
            <div className="auth-card-title-group">
              {authMode === 'login' && (
                <>
                  <h2>Welcome <span className="blue-gradient-text">Back</span></h2>
                  <p>Access your complaint management workspace.</p>
                </>
              )}
              {authMode === 'signup' && (
                <>
                  <h2>Create <span className="blue-gradient-text">Account</span></h2>
                  <p>Get started with your complaint management workspace.</p>
                </>
              )}
              {authMode === 'forgot-password' && (
                <>
                  <h2>Reset <span className="blue-gradient-text">Password</span></h2>
                  <p>Enter your email to receive recovery instructions.</p>
                </>
              )}
            </div>

            {/* Inline Error Alert */}
            {formError && (
              <div className="auth-error-alert" role="alert">
                <AlertCircle size={16} className="error-icon" />
                <span>{formError}</span>
              </div>
            )}

            {/* Inline Success Alert (for Password Reset) */}
            {resetSuccessMessage && (
              <div className="auth-success-alert" role="status">
                <CheckCircle2 size={16} className="success-icon" />
                <span>{resetSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              {/* Name Field on Signup */}
              {authMode === 'signup' && (
                <div className="form-input-wrapper">
                  <label htmlFor="auth-name">Full Name</label>
                  <div className="input-with-icon">
                    <User size={18} className="input-icon" />
                    <input
                      id="auth-name"
                      type="text"
                      placeholder="e.g. Alex Chen"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoComplete="name"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}

              {/* Role Selection on Signup */}
              {authMode === 'signup' && (
                <div className="form-input-wrapper">
                  <label htmlFor="auth-role">Select Account Type</label>
                  <div className="input-with-icon">
                    <select
                      id="auth-role"
                      className="auth-select-input"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      disabled={isLoading}
                    >
                      <option value={ROLES.STUDENT}>{userLabel || 'Student / User'}</option>
                      <option value={ROLES.STAFF}>{getRoleTerm(ROLES.STAFF) || 'Staff Officer'}</option>
                      <option value={ROLES.ADMIN}>{getRoleTerm(ROLES.ADMIN) || 'System Administrator'}</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div className="form-input-wrapper">
                <label htmlFor="auth-email">Email Address</label>
                <div className="input-with-icon">
                  <Mail size={18} className="input-icon" />
                  <input
                    id="auth-email"
                    type="email"
                    placeholder="youremail@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Field (Only for login and signup) */}
              {authMode !== 'forgot-password' && (
                <div className="form-input-wrapper">
                  <label htmlFor="auth-password">Password</label>
                  <div className="input-with-icon password-input-container">
                    <Lock size={18} className="input-icon" />
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={authMode === 'login' ? 'Enter your password' : 'Create strong password (min 6 chars)'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="pwd-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {authMode === 'login' && (
                    <button
                      type="button"
                      className="forgot-pwd-link-btn"
                      onClick={() => handleSwitchMode('forgot-password')}
                      disabled={isLoading}
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary auth-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="spin-animation" style={{ marginRight: '8px' }} />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    {authMode === 'login' && (
                      <>
                        <span>Login</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                    {authMode === 'signup' && (
                      <>
                        <span>Create Account</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                    {authMode === 'forgot-password' && (
                      <>
                        <KeyRound size={16} style={{ marginRight: '6px' }} />
                        <span>Send Reset Link</span>
                      </>
                    )}
                  </>
                )}
              </button>
            </form>

            {/* Back to Login link from Forgot Password */}
            {authMode === 'forgot-password' && (
              <div className="auth-card-sublinks">
                <button
                  type="button"
                  className="auth-sublink-btn"
                  onClick={() => handleSwitchMode('login')}
                  disabled={isLoading}
                >
                  Remembered your password? <strong>Log in</strong>
                </button>
              </div>
            )}

            <div className="auth-footer-note">
              <span className="note-lock-icon">🔒</span>
              <span>Protected with Firebase Auth & Supabase RLS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
