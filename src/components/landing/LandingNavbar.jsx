import React, { useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';

export default function LandingNavbar({ setView, onScrollToSection }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('home');

  const handleNavClick = (sectionId, linkKey) => {
    setActiveLink(linkKey || sectionId);
    setMobileMenuOpen(false);
    if (onScrollToSection) {
      onScrollToSection(sectionId);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="rx-navbar">
      <div className="rx-container rx-nav-inner">
        {/* Brand Logo */}
        <div className="rx-brand-logo" onClick={() => handleNavClick('top', 'home')}>
          <span className="rx-logo-resolve">Resolve</span>
          <span className="rx-logo-x">X</span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="rx-nav-links" aria-label="Main Navigation">
          <button
            type="button"
            className={`rx-nav-link ${activeLink === 'home' ? 'active' : ''}`}
            onClick={() => handleNavClick('top', 'home')}
          >
            <span>Home</span>
            {activeLink === 'home' && <span className="rx-active-dot"></span>}
          </button>

          <button
            type="button"
            className={`rx-nav-link ${activeLink === 'features' ? 'active' : ''}`}
            onClick={() => handleNavClick('features', 'features')}
          >
            <span>Features</span>
          </button>

          <button
            type="button"
            className={`rx-nav-link ${activeLink === 'campuses' ? 'active' : ''}`}
            onClick={() => handleNavClick('campuses', 'campuses')}
          >
            <span>For Campuses</span>
          </button>

          <button
            type="button"
            className={`rx-nav-link ${activeLink === 'communities' ? 'active' : ''}`}
            onClick={() => handleNavClick('communities', 'communities')}
          >
            <span>For Communities</span>
          </button>

          <button
            type="button"
            className={`rx-nav-link ${activeLink === 'pricing' ? 'active' : ''}`}
            onClick={() => handleNavClick('pricing', 'pricing')}
          >
            <span>Pricing</span>
          </button>

          <button
            type="button"
            className={`rx-nav-link ${activeLink === 'resources' ? 'active' : ''}`}
            onClick={() => handleNavClick('resources', 'resources')}
          >
            <span>Resources</span>
          </button>
        </nav>

        {/* Right Action Group */}
        <div className="rx-nav-actions">
          <button
            type="button"
            className="rx-login-btn"
            onClick={() => setView('login')}
          >
            Login
          </button>

          <button
            type="button"
            className="rx-demo-btn"
            onClick={() => setView('signup')}
          >
            <span>Request a Demo</span>
            <ArrowRight size={14} />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="rx-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="rx-mobile-drawer">
          <button type="button" className="rx-mobile-link" onClick={() => handleNavClick('top', 'home')}>
            Home
          </button>
          <button type="button" className="rx-mobile-link" onClick={() => handleNavClick('features', 'features')}>
            Features
          </button>
          <button type="button" className="rx-mobile-link" onClick={() => handleNavClick('campuses', 'campuses')}>
            For Campuses
          </button>
          <button type="button" className="rx-mobile-link" onClick={() => handleNavClick('communities', 'communities')}>
            For Communities
          </button>
          <button type="button" className="rx-mobile-link" onClick={() => handleNavClick('pricing', 'pricing')}>
            Pricing
          </button>
          <button type="button" className="rx-mobile-link" onClick={() => handleNavClick('resources', 'resources')}>
            Resources
          </button>
          <div className="rx-mobile-action-bar">
            <button
              type="button"
              className="rx-mobile-login"
              onClick={() => {
                setMobileMenuOpen(false);
                setView('login');
              }}
            >
              Login
            </button>
            <button
              type="button"
              className="rx-mobile-demo"
              onClick={() => {
                setMobileMenuOpen(false);
                setView('signup');
              }}
            >
              Request a Demo ➔
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
