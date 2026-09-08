import React from 'react';

export default function LandingFooter({ setView, onScrollToSection }) {
  const handleNavClick = (sectionId) => {
    if (onScrollToSection) {
      onScrollToSection(sectionId);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="rx-footer">
      <div className="rx-container rx-footer-inner">
        {/* Left: Brand Logo & Tagline */}
        <div className="rx-footer-brand-wrap">
          <div className="rx-footer-logo" onClick={() => handleNavClick('top')}>
            <span className="rx-logo-resolve">Resolve</span>
            <span className="rx-logo-x">X</span>
          </div>
          <span className="rx-footer-tagline">Issues today. Better tomorrow.</span>
        </div>

        {/* Center: Nav Links */}
        <nav className="rx-footer-nav" aria-label="Footer Navigation">
          <button type="button" onClick={() => handleNavClick('top')}>Home</button>
          <button type="button" onClick={() => handleNavClick('features')}>Features</button>
          <button type="button" onClick={() => handleNavClick('campuses')}>For Campuses</button>
          <button type="button" onClick={() => handleNavClick('communities')}>For Communities</button>
          <button type="button" onClick={() => handleNavClick('pricing')}>Pricing</button>
          <button type="button" onClick={() => handleNavClick('resources')}>Resources</button>
          <span className="rx-footer-static-link">Privacy</span>
          <span className="rx-footer-static-link">Terms</span>
          <span className="rx-footer-static-link">Contact</span>
        </nav>

        {/* Right: Social Media Icons (Clean inline SVGs) */}
        <div className="rx-footer-socials">
          <a href="#linkedin" className="rx-social-icon-btn" aria-label="LinkedIn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2Z"/>
            </svg>
          </a>
          <a href="#twitter" className="rx-social-icon-btn" aria-label="X / Twitter">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <a href="#youtube" className="rx-social-icon-btn" aria-label="YouTube">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21.58 7.19a2.5 2.5 0 0 0-1.76-1.77C18.26 5 12 5 12 5s-6.26 0-7.82.42A2.5 2.5 0 0 0 2.42 7.19 26.2 26.2 0 0 0 2 12a26.2 26.2 0 0 0 .42 4.81 2.5 2.5 0 0 0 1.76 1.77C5.74 19 12 19 12 19s6.26 0 7.82-.42a2.5 2.5 0 0 0 1.76-1.77C22 15.62 22 12 22 12s0-3.62-.42-4.81ZM10 15V9l5.2 3-5.2 3Z"/>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
