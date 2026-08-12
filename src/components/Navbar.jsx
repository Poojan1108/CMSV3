import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navbar({ setView }) {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleNavClick = (e, sectionId) => {
    if (sectionId) {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    closeMobileMenu();
  };

  return (
    <>
      <header className={`navbar ${scrolled ? 'scrolled' : ''}`} style={scrolled ? { padding: '10px 0' } : {}}>
        <div className="nav-container">
          <a href="#" className="logo-group" onClick={(e) => { e.preventDefault(); setView('landing'); closeMobileMenu(); }}>
            {/* ResolveX Geometric Tech Logo */}
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="var(--bg-landing)"/>
              <path d="M16 6L25 11.2V20.8L16 26L7 20.8V11.2L16 6Z" stroke="var(--primary)" strokeWidth="2"/>
              <circle cx="16" cy="16" r="3" fill="var(--text-white)"/>
            </svg>
            <span className="logo-text">ResolveX</span>
          </a>

          <nav className="nav-links desktop-only">
            <a href="#problem" onClick={(e) => handleNavClick(e, 'problem')}>The Problem</a>
            <a href="#solution" onClick={(e) => handleNavClick(e, 'solution')}>Solution</a>
            <a href="#workflow" onClick={(e) => handleNavClick(e, 'workflow')}>Workflow</a>
            <a href="#features" onClick={(e) => handleNavClick(e, 'features')}>Features</a>
            <a href="#dashboard" onClick={(e) => handleNavClick(e, 'dashboard')}>Dashboard</a>
            <a href="#stats" onClick={(e) => handleNavClick(e, 'stats')}>Impact</a>
          </nav>

          <div className="nav-actions desktop-only">
            <a href="#" className="btn-link" onClick={(e) => { e.preventDefault(); setView('login'); }}>Log in</a>
            <a href="#" className="btn btn-primary" onClick={(e) => { e.preventDefault(); setView('signup'); }}>Get Started</a>
          </div>

          <button
            type="button"
            className="landing-mobile-toggle"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="landing-mobile-backdrop" onClick={closeMobileMenu}>
          <div className="landing-mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <span className="logo-text">ResolveX Navigation</span>
              <button type="button" className="drawer-close-btn" onClick={closeMobileMenu}>
                <X size={20} />
              </button>
            </div>

            <nav className="drawer-nav-links">
              <a href="#problem" onClick={(e) => handleNavClick(e, 'problem')}>The Problem</a>
              <a href="#solution" onClick={(e) => handleNavClick(e, 'solution')}>Solution</a>
              <a href="#workflow" onClick={(e) => handleNavClick(e, 'workflow')}>Workflow</a>
              <a href="#features" onClick={(e) => handleNavClick(e, 'features')}>Features</a>
              <a href="#dashboard" onClick={(e) => handleNavClick(e, 'dashboard')}>Dashboard</a>
              <a href="#stats" onClick={(e) => handleNavClick(e, 'stats')}>Impact</a>
            </nav>

            <div className="drawer-nav-actions">
              <a 
                href="#" 
                className="btn btn-secondary btn-full" 
                onClick={(e) => { e.preventDefault(); setView('login'); closeMobileMenu(); }}
              >
                Log in
              </a>
              <a 
                href="#" 
                className="btn btn-primary btn-full" 
                onClick={(e) => { e.preventDefault(); setView('signup'); closeMobileMenu(); }}
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

