import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ShieldCheck,
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

  const { login, signup, resetPassword, userLabel, getRoleTerm, orgTemplates, orgKey } = useAuth();
  const { showToast } = useToast();

  // Multi-Tenant Organization Registration State
  const [selectedOrgKey, setSelectedOrgKey] = useState(orgKey || 'COLLEGE');
  const [isCreatingNewOrg, setIsCreatingNewOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgBaseTemplate, setNewOrgBaseTemplate] = useState('COLLEGE');
  const [newOrgUserTerm, setNewOrgUserTerm] = useState('');
  const [newOrgLocationLabel, setNewOrgLocationLabel] = useState('');

  const resetFormState = () => {
    setFormError('');
    setResetSuccessMessage('');
    setShowPassword(false);
    setIsCreatingNewOrg(false);
    setNewOrgName('');
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
          throw new Error('Please enter a valid email and password.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }

        if (isCreatingNewOrg) {
          if (!newOrgName.trim()) {
            throw new Error('Please provide an organization name.');
          }
          await signup(email.trim(), password, name.trim(), ROLES.ADMIN, null, {
            name: newOrgName.trim(),
            baseTemplate: newOrgBaseTemplate,
            userTerm: newOrgUserTerm.trim() || undefined,
            locationLabel: newOrgLocationLabel.trim() || undefined,
          });
          showToast(`Organization "${newOrgName}" created! Welcome Admin.`, 'success');
        } else {
          await signup(email.trim(), password, name.trim(), selectedRole, selectedOrgKey);
          showToast('Account created successfully! Welcome to ResolveX.', 'success');
        }

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
    <div className="auth-canvas">
      {/* Back to Home Button */}
      <button
        type="button"
        className="auth-floating-back-btn"
        onClick={onBackToHome}
        aria-label="Back to home"
      >
        <ArrowLeft size={14} />
        <span>Back to Home</span>
      </button>

      {/* Main 2-Column Split Container (Form on Left, Rounded Card on Right) */}
      <div className="auth-split-wrapper">
        {/* Left: Clean Form Area */}
        <div className="auth-form-column">
          <div className="auth-form-inner">
            {/* Header Title & Subtitle */}
            <div className="auth-header-block">
              <div
                className="auth-mobile-brand"
                onClick={onBackToHome}
                role="button"
                tabIndex={0}
                aria-label="ResolveX Home"
              >
                <span className="rx-logo-resolve">Resolve</span>
                <span className="rx-logo-x">X</span>
              </div>

              <h1 className="auth-main-title">
                {authMode === 'login' && 'Welcome back!'}
                {authMode === 'signup' && 'Create account'}
                {authMode === 'forgot-password' && 'Reset password'}
              </h1>
              <p className="auth-main-subtitle">
                {authMode === 'login' && "Simplify your workflow and boost your productivity with ResolveX. Get started for free."}
                {authMode === 'signup' && 'Join the ResolveX network to manage community and campus resolutions.'}
                {authMode === 'forgot-password' && 'Enter your institutional email to receive a secure password recovery link.'}
              </p>
            </div>

            {/* Error Alert Box */}
            {formError && (
              <div className="auth-alert error" role="alert">
                <AlertCircle size={15} className="auth-alert-icon" />
                <span>{formError}</span>
              </div>
            )}

            {/* Success Alert Box */}
            {resetSuccessMessage && (
              <div className="auth-alert success" role="status">
                <CheckCircle2 size={15} className="auth-alert-icon" />
                <span>{resetSuccessMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="auth-form-pill-group">
              {/* Full Name (Sign Up only) */}
              {authMode === 'signup' && (
                <div className="auth-pill-field">
                  <input
                    id="auth-name"
                    type="text"
                    className="auth-pill-input"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                    disabled={isLoading}
                  />
                </div>
              )}

              {/* Role Selection (Sign Up only) */}
              {authMode === 'signup' && (
                <div className="auth-pill-field">
                  <select
                    id="auth-role"
                    className="auth-pill-input auth-pill-select"
                    value={selectedRole}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      setSelectedRole(newRole);
                      if (newRole !== ROLES.ADMIN) {
                        setIsCreatingNewOrg(false);
                      }
                    }}
                    disabled={isLoading}
                  >
                    <option value={ROLES.STUDENT}>{userLabel || 'Student / Resident / Member'}</option>
                    <option value={ROLES.STAFF}>{getRoleTerm(ROLES.STAFF) || 'Staff / Field Technician'}</option>
                    <option value={ROLES.ADMIN}>{getRoleTerm(ROLES.ADMIN) || 'System Administrator'}</option>
                  </select>
                </div>
              )}

              {/* Organization Selection (Sign Up only) */}
              {authMode === 'signup' && (
                <>
                  <div className="auth-pill-field">
                    <select
                      id="auth-org-select"
                      className="auth-pill-input auth-pill-select"
                      value={isCreatingNewOrg ? 'CREATE_NEW' : selectedOrgKey}
                      onChange={(e) => {
                        if (e.target.value === 'CREATE_NEW') {
                          setIsCreatingNewOrg(true);
                          setSelectedRole(ROLES.ADMIN);
                        } else {
                          setIsCreatingNewOrg(false);
                          setSelectedOrgKey(e.target.value);
                        }
                      }}
                      disabled={isLoading}
                    >
                      <optgroup label="Join Existing Organization">
                        {Object.keys(orgTemplates).map((key) => (
                          <option key={key} value={key}>
                            {orgTemplates[key]?.name || key} ({orgTemplates[key]?.type || 'organization'})
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Create Organization">
                        <option value="CREATE_NEW">➕ Register New Organization (Admin)</option>
                      </optgroup>
                    </select>
                  </div>

                  {/* New Custom Organization Creation Fields */}
                  {isCreatingNewOrg && (
                    <>
                      <div className="auth-pill-field">
                        <input
                          id="auth-new-org-name"
                          type="text"
                          className="auth-pill-input"
                          placeholder="Organization Name (e.g. St. Xavier's University)"
                          value={newOrgName}
                          onChange={(e) => setNewOrgName(e.target.value)}
                          required={isCreatingNewOrg}
                          disabled={isLoading}
                        />
                      </div>

                      <div className="auth-pill-field">
                        <select
                          id="auth-new-org-template"
                          className="auth-pill-input auth-pill-select"
                          value={newOrgBaseTemplate}
                          onChange={(e) => setNewOrgBaseTemplate(e.target.value)}
                          disabled={isLoading}
                        >
                          <option value="COLLEGE">🎓 College / University Template</option>
                          <option value="SOCIETY">🏢 Housing Society Template</option>
                          <option value="CORPORATE">💼 Corporate Workplace Template</option>
                          <option value="CUSTOM">⚙️ Custom Setup (Custom terms)</option>
                        </select>
                      </div>

                      {newOrgBaseTemplate === 'CUSTOM' && (
                        <>
                          <div className="auth-pill-field">
                            <input
                              id="auth-custom-user-term"
                              type="text"
                              className="auth-pill-input"
                              placeholder="Member Term (e.g. Resident, Tenant, Client)"
                              value={newOrgUserTerm}
                              onChange={(e) => setNewOrgUserTerm(e.target.value)}
                              disabled={isLoading}
                            />
                          </div>
                          <div className="auth-pill-field">
                            <input
                              id="auth-custom-location-label"
                              type="text"
                              className="auth-pill-input"
                              placeholder="Location Label (e.g. Flat No, Cabin No, Desk ID)"
                              value={newOrgLocationLabel}
                              onChange={(e) => setNewOrgLocationLabel(e.target.value)}
                              disabled={isLoading}
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Email / Username Field */}
              <div className="auth-pill-field">
                <input
                  id="auth-email"
                  type="email"
                  className="auth-pill-input"
                  placeholder={authMode === 'login' ? 'Username' : 'Institutional Email'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>

              {/* Password Field */}
              {authMode !== 'forgot-password' && (
                <div className="auth-pill-field auth-password-field">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-pill-input auth-pill-password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="auth-password-toggle-pill"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              )}

              {/* Forgot Password Link on Right (Login mode only) */}
              {authMode === 'login' && (
                <div className="auth-forgot-row">
                  <button
                    type="button"
                    className="auth-forgot-pill-btn"
                    onClick={() => handleSwitchMode('forgot-password')}
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              {/* Submit Pill Button */}
              <button
                type="submit"
                className="auth-pill-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="auth-spin" />
                    <span>Please wait...</span>
                  </>
                ) : (
                  <>
                    {authMode === 'login' && 'Login'}
                    {authMode === 'signup' && 'Register'}
                    {authMode === 'forgot-password' && 'Send Recovery Link'}
                  </>
                )}
              </button>
            </form>

            {/* Bottom Switcher */}
            <div className="auth-bottom-switcher">
              {authMode === 'login' && (
                <p>
                  Not a member?{' '}
                  <button
                    type="button"
                    className="auth-switch-pill-link"
                    onClick={() => handleSwitchMode('signup')}
                  >
                    Register now
                  </button>
                </p>
              )}
              {authMode === 'signup' && (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="auth-switch-pill-link"
                    onClick={() => handleSwitchMode('login')}
                  >
                    Login
                  </button>
                </p>
              )}
              {authMode === 'forgot-password' && (
                <p>
                  Remembered your password?{' '}
                  <button
                    type="button"
                    className="auth-switch-pill-link"
                    onClick={() => handleSwitchMode('login')}
                  >
                    Back to Login
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Rounded Illustration Card */}
        <div className="auth-hero-column">
          <div className="auth-hero-card">
            {/* Vector Illustration */}
            <div className="auth-hero-art-wrapper">
              <img
                src="/Cabin-bro.svg"
                alt="ResolveX Workflow & Living"
                className="auth-hero-vector"
              />
            </div>

            {/* Carousel Indicator Dots */}
            <div className="auth-hero-dots">
              <span className="auth-dot" />
              <span className="auth-dot active" />
              <span className="auth-dot" />
            </div>

            {/* Tagline Headline */}
            <h2 className="auth-hero-tagline">
              Make your work easier and organized with <strong>ResolveX</strong>
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
}
