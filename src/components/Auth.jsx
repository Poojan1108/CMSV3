import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, ShieldCheck, Clock, Cpu, ArrowRight } from 'lucide-react';

export default function Auth({ initialView = 'login', onBackToHome, onSuccess }) {
  const [isLogin, setIsLogin] = useState(initialView === 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setShowPassword(false);
    setEmail('');
    setPassword('');
    setName('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSuccess) {
      onSuccess();
    } else if (onBackToHome) {
      onBackToHome();
    }
  };

  return (
    <div className="auth-page-container">
      {/* Top Left Floating Logo */}
      <div className="auth-header-logo" onClick={onBackToHome}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="8" fill="var(--bg-landing)"/>
          <path d="M16 6L25 11.2V20.8L16 26L7 20.8V11.2L16 6Z" stroke="var(--primary)" strokeWidth="2"/>
          <circle cx="16" cy="16" r="3" fill="var(--text-white)"/>
        </svg>
        <span className="logo-text">ResolveX</span>
      </div>

      {/* Top Right Floating Toggle Button */}
      <div className="auth-header-actions">
        {isLogin ? (
          <>
            <span className="header-hint">New here?</span>
            <button className="auth-toggle-btn" onClick={toggleAuthMode}>
              Sign Up <ArrowRight size={14} style={{ marginLeft: '4px' }} />
            </button>
          </>
        ) : (
          <>
            <span className="header-hint">Already have an account?</span>
            <button className="auth-toggle-btn" onClick={toggleAuthMode}>
              Log in <ArrowRight size={14} style={{ marginLeft: '4px' }} />
            </button>
          </>
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
                A unified platform to capture, route, track, and resolve complaints across departments with complete transparency and accountability.
              </p>
            </div>

            {/* Bottom Absolute Trust Badges moved inside brand flow */}
            <div className="auth-trust-badges-bar">
              <div className="auth-badge-item">
                <ShieldCheck size={16} className="badge-icon" />
                <span>Data Secure</span>
              </div>
              <div className="auth-badge-item">
                <Clock size={16} className="badge-icon" />
                <span>Real-time Tracking</span>
              </div>
              <div className="auth-badge-item">
                <Cpu size={16} className="badge-icon" />
                <span>AI Powered</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Centered Floating Card */}
        <div className="auth-right-form-wrapper">
          <div className="auth-form-card">
            <div className="auth-card-title-group">
              {isLogin ? (
                <>
                  <h2>Welcome <span className="blue-gradient-text">Back</span></h2>
                  <p>Access your complaint management workspace.</p>
                </>
              ) : (
                <>
                  <h2>Create <span className="blue-gradient-text">Account</span></h2>
                  <p>Get started with your complaint management workspace.</p>
                </>
              )}
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {!isLogin && (
                <div className="form-input-wrapper">
                  <label>Full Name</label>
                  <div className="input-with-icon">
                    <User size={18} className="input-icon" />
                    <input 
                      type="text" 
                      placeholder="Enter your name" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required 
                    />
                  </div>
                </div>
              )}

              <div className="form-input-wrapper">
                <label>Email Address</label>
                <div className="input-with-icon">
                  <Mail size={18} className="input-icon" />
                  <input 
                    type="email" 
                    placeholder="youremail@company.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="form-input-wrapper">
                <label>Password</label>
                <div className="input-with-icon password-input-container">
                  <Lock size={18} className="input-icon" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder={isLogin ? "Enter your password" : "Create password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                  <button 
                    type="button" 
                    className="pwd-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {isLogin && (
                  <a href="#" className="forgot-pwd-link" onClick={(e) => e.preventDefault()}>
                    Forgot Password?
                  </a>
                )}
              </div>

              <button type="submit" className="btn btn-primary auth-submit-btn">
                <span>{isLogin ? 'Login' : 'Create Account'}</span> 
                <ArrowRight size={16} />
              </button>
            </form>

            <div className="auth-footer-note">
              <span className="note-lock-icon">🔒</span>
              <span>Protected with enterprise-grade encryption</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
