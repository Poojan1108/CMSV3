import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  ChevronDown,
  Check,
  Building2,
  GraduationCap,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ROLES, ORG_ARCHETYPES } from '../utils/constants';

const ARCHETYPE_OPTIONS = [
  {
    id: 'COLLEGE',
    label: 'College',
    icon: GraduationCap,
    userTerm: 'Student',
    locationLabel: 'Hostel Block / Room No',
  },
  {
    id: 'SOCIETY',
    label: 'Housing Society',
    icon: Building2,
    userTerm: 'Resident',
    locationLabel: 'Block & Flat / Unit No',
  },
  {
    id: 'CORPORATE',
    label: 'Corporate',
    icon: Briefcase,
    userTerm: 'Employee',
    locationLabel: 'Floor / Workstation Desk ID',
  },
];

const getOrgIcon = (type) => {
  switch ((type || '').toLowerCase()) {
    case 'college':
      return GraduationCap;
    case 'society':
      return Building2;
    case 'corporate':
      return Briefcase;
    default:
      return Building2;
  }
};

export default function Auth({ initialView = 'login', onBackToHome, onSuccess }) {
  const [authMode, setAuthMode] = useState(initialView); // 'login' | 'signup' | 'forgot-password'
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

  const { login, signup, resetPassword, orgTemplates, orgKey } = useAuth();
  const { showToast } = useToast();

  // Multi-Tenant Organization Registration State
  const [selectedOrgKey, setSelectedOrgKey] = useState(orgKey || '');
  const [isCreatingNewOrg, setIsCreatingNewOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgBaseTemplate, setNewOrgBaseTemplate] = useState('CORPORATE');
  const [newOrgUserTerm, setNewOrgUserTerm] = useState('Member');
  const [newOrgLocationLabel, setNewOrgLocationLabel] = useState('Location / Room / Area');

  // Searchable Combobox State
  const [orgSearchQuery, setOrgSearchQuery] = useState('');
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const comboboxRef = useRef(null);
  const searchInputRef = useRef(null);

  // Sanitize, clean, and deduplicate organizations from templates/database
  const sanitizedOrgs = useMemo(() => {
    const list = [];
    const seenNames = new Set();

    const clean = (str) => {
      if (!str) return '';
      return str.replace(/<[^>]*>?/gm, '').trim();
    };

    Object.entries(orgTemplates || {}).forEach(([key, org]) => {
      if (!org || !org.name) return;
      if (org.name.includes('Template')) return; // exclude base archetypes

      const cleanName = clean(org.name);
      if (!cleanName || cleanName.length < 2) return;

      const lower = cleanName.toLowerCase();
      if (seenNames.has(lower)) return;
      seenNames.add(lower);

      list.push({
        key,
        name: cleanName,
        type: (org.type || 'organization').toLowerCase(),
        userTerm: org.userTerm || org.userLabel || 'Member',
      });
    });

    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [orgTemplates]);

  // Active selected org object
  const activeSelectedOrg = useMemo(() => {
    if (!sanitizedOrgs.length) return null;
    return sanitizedOrgs.find((o) => o.key === selectedOrgKey) || sanitizedOrgs[0];
  }, [sanitizedOrgs, selectedOrgKey]);

  // Sync selected key if uninitialized or points to non-existent org
  useEffect(() => {
    if (sanitizedOrgs.length > 0) {
      const match = sanitizedOrgs.find((o) => o.key === selectedOrgKey);
      if (!match) {
        setSelectedOrgKey(sanitizedOrgs[0].key);
      }
    }
  }, [sanitizedOrgs, selectedOrgKey]);

  // Filtered organizations based on search input
  const filteredOrgs = useMemo(() => {
    if (!orgSearchQuery.trim()) return sanitizedOrgs;
    const q = orgSearchQuery.toLowerCase().trim();
    return sanitizedOrgs.filter((o) =>
      o.name.toLowerCase().includes(q) || o.type.toLowerCase().includes(q)
    );
  }, [sanitizedOrgs, orgSearchQuery]);

  // Click outside listener for combobox
  useEffect(() => {
    function handleClickOutside(event) {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target)) {
        setIsOrgDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto focus search input when combobox opens
  useEffect(() => {
    if (isOrgDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOrgDropdownOpen]);

  const handleComboboxKeyDown = (e) => {
    if (!isOrgDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setIsOrgDropdownOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1 < filteredOrgs.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredOrgs.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOrgs[highlightedIndex]) {
        handleSelectOrg(filteredOrgs[highlightedIndex].key);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOrgDropdownOpen(false);
    }
  };

  const handleSelectOrg = (key) => {
    setSelectedOrgKey(key);
    setOrgSearchQuery('');
    setIsOrgDropdownOpen(false);
  };

  const resetFormState = () => {
    setFormError('');
    setResetSuccessMessage('');
    setShowPassword(false);
    setIsCreatingNewOrg(false);
    setNewOrgName('');
    setOrgSearchQuery('');
    setIsOrgDropdownOpen(false);
    setNewOrgBaseTemplate('CORPORATE');
    setNewOrgUserTerm('Member');
    setNewOrgLocationLabel('Location / Room / Area');
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
        const loginRes = await login(email.trim(), password);
        showToast('Welcome back! Signed in successfully.', 'success');
        if (onSuccess) onSuccess(loginRes?.user);
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

        let signupRes;
        if (isCreatingNewOrg) {
          if (!newOrgName.trim()) {
            throw new Error('Please declare an organization or institution name.');
          }
          if (newOrgName.trim().length < 3) {
            throw new Error('Organization name must be at least 3 characters long.');
          }
          signupRes = await signup(email.trim(), password, name.trim(), ROLES.ADMIN, null, {
            name: newOrgName.trim(),
            baseTemplate: newOrgBaseTemplate,
            userTerm: newOrgUserTerm.trim() || undefined,
            locationLabel: newOrgLocationLabel.trim() || undefined,
          });
          showToast(`Organization "${newOrgName}" registered! Welcome Administrator.`, 'success');
        } else {
          const targetKey = activeSelectedOrg?.key || selectedOrgKey;
          signupRes = await signup(email.trim(), password, name.trim(), ROLES.STUDENT, targetKey);
          showToast('Account created successfully! Welcome to ResolveX.', 'success');
        }

        if (onSuccess) onSuccess(signupRes?.user);
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
                {authMode === 'signup' && (isCreatingNewOrg ? 'Create Organization' : 'Create account')}
                {authMode === 'forgot-password' && 'Reset password'}
              </h1>
              <p className="auth-main-subtitle">
                {authMode === 'login' && 'Simplify your workflow and boost your productivity with ResolveX. Get started for free.'}
                {authMode === 'signup' &&
                  (isCreatingNewOrg
                    ? 'Launch a branded resolution hub for your campus, company, or residential society.'
                    : 'Join your organization on ResolveX to submit and track community requests.')}
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

            {/* Signup Persona Tabs: Join vs Create */}
            {authMode === 'signup' && (
              <div className="auth-segmented-tabs" role="tablist" aria-label="Registration type">
                <button
                  type="button"
                  role="tab"
                  aria-selected={!isCreatingNewOrg}
                  className={`auth-tab-btn ${!isCreatingNewOrg ? 'active' : ''}`}
                  onClick={() => {
                    setIsCreatingNewOrg(false);
                    setFormError('');
                  }}
                >
                  <GraduationCap size={15} />
                  <span>Join Organization</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isCreatingNewOrg}
                  className={`auth-tab-btn ${isCreatingNewOrg ? 'active' : ''}`}
                  onClick={() => {
                    setIsCreatingNewOrg(true);
                    setFormError('');
                  }}
                >
                  <Building2 size={15} />
                  <span>Create Organization</span>
                </button>
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
                    placeholder={isCreatingNewOrg ? 'Administrator Full Name' : 'Full Name'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                    disabled={isLoading}
                  />
                </div>
              )}

              {/* TAB 1: JOIN EXISTING ORGANIZATION - Searchable Combobox */}
              {authMode === 'signup' && !isCreatingNewOrg && (
                <div className="auth-combobox-wrapper" ref={comboboxRef}>
                  <div
                    role="combobox"
                    aria-expanded={isOrgDropdownOpen}
                    aria-haspopup="listbox"
                    tabIndex={0}
                    className={`auth-combobox-trigger ${isOrgDropdownOpen ? 'open' : ''}`}
                    onClick={() => setIsOrgDropdownOpen((prev) => !prev)}
                    onKeyDown={handleComboboxKeyDown}
                  >
                    <div className="auth-combobox-selected-content">
                      {activeSelectedOrg ? (
                        <>
                          {React.createElement(getOrgIcon(activeSelectedOrg.type), {
                            size: 16,
                            className: 'auth-combobox-type-icon',
                          })}
                          <span className="auth-combobox-selected-name">{activeSelectedOrg.name}</span>
                          <span className="auth-combobox-type-badge">{activeSelectedOrg.type}</span>
                        </>
                      ) : (
                        <span className="auth-combobox-placeholder">Select your organization</span>
                      )}
                    </div>
                    <ChevronDown
                      size={16}
                      className={`auth-combobox-arrow ${isOrgDropdownOpen ? 'rotated' : ''}`}
                    />
                  </div>

                  {isOrgDropdownOpen && (
                    <div className="auth-combobox-dropdown" role="listbox">
                      <div className="auth-combobox-search-box">
                        <Search size={14} className="auth-combobox-search-icon" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          className="auth-combobox-search-input"
                          placeholder="Type to filter organizations..."
                          value={orgSearchQuery}
                          onChange={(e) => {
                            setOrgSearchQuery(e.target.value);
                            setHighlightedIndex(0);
                          }}
                          onKeyDown={handleComboboxKeyDown}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      <div className="auth-combobox-list">
                        {filteredOrgs.length > 0 ? (
                          filteredOrgs.map((org, idx) => {
                            const Icon = getOrgIcon(org.type);
                            const isSelected = org.key === activeSelectedOrg?.key;
                            const isHighlighted = idx === highlightedIndex;
                            return (
                              <div
                                key={org.key}
                                role="option"
                                aria-selected={isSelected}
                                className={`auth-combobox-option ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectOrg(org.key);
                                }}
                                onMouseEnter={() => setHighlightedIndex(idx)}
                              >
                                <div className="auth-combobox-option-info">
                                  <Icon size={15} className="auth-combobox-option-icon" />
                                  <span className="auth-combobox-option-name">{org.name}</span>
                                  <span className="auth-combobox-type-badge">{org.type}</span>
                                </div>
                                {isSelected && <Check size={14} className="auth-combobox-check" />}
                              </div>
                            );
                          })
                        ) : (
                          <div className="auth-combobox-empty">
                            {orgSearchQuery.trim() ? (
                              <>
                                <p>No organization found matching &ldquo;{orgSearchQuery.trim()}&rdquo;</p>
                                <button
                                  type="button"
                                  className="auth-combobox-switch-create-btn"
                                  onClick={() => {
                                    setNewOrgName(orgSearchQuery.trim());
                                    setIsCreatingNewOrg(true);
                                    setIsOrgDropdownOpen(false);
                                  }}
                                >
                                  + Register &ldquo;{orgSearchQuery.trim()}&rdquo; as New Organization
                                </button>
                              </>
                            ) : (
                              <>
                                <p>No organizations available yet</p>
                                <button
                                  type="button"
                                  className="auth-combobox-switch-create-btn"
                                  onClick={() => {
                                    setIsCreatingNewOrg(true);
                                    setIsOrgDropdownOpen(false);
                                  }}
                                >
                                  + Register New Organization
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CREATE NEW WORKSPACE - Dedicated Streamlined Fields */}
              {authMode === 'signup' && isCreatingNewOrg && (
                <div className="auth-creator-card-group">
                  {/* Organization Name */}
                  <div className="auth-pill-field">
                    <input
                      id="auth-new-org-name"
                      type="text"
                      className="auth-pill-input"
                      placeholder="Organization Name * (e.g. Stanford University)"
                      value={newOrgName}
                      onChange={(e) => setNewOrgName(e.target.value)}
                      required
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>

                  {/* Archetype Selector (Pure Pills matching design system) */}
                  <div className="auth-archetype-section">
                    <label className="auth-archetype-heading">Select Organization Archetype</label>
                    <div className="auth-archetype-pills" role="radiogroup" aria-label="Organization Archetype">
                      {ARCHETYPE_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        const isSelected = newOrgBaseTemplate === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            className={`auth-archetype-pill-btn ${isSelected ? 'active' : ''}`}
                            onClick={() => {
                              setNewOrgBaseTemplate(opt.id);
                              setNewOrgUserTerm(opt.userTerm);
                              setNewOrgLocationLabel(opt.locationLabel);
                            }}
                          >
                            <Icon size={14} className="auth-archetype-pill-icon" />
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Email / Username Field */}
              <div className="auth-pill-field">
                <input
                  id="auth-email"
                  type="email"
                  className="auth-pill-input"
                  placeholder={authMode === 'login' ? 'Email or Username' : (isCreatingNewOrg ? 'Admin Email Address' : 'Institutional / Work Email')}
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
                    {authMode === 'signup' && (isCreatingNewOrg ? 'Create Organization & Account' : 'Register & Join')}
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

