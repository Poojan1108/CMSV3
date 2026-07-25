import React from 'react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container grid grid-4 footer-links-grid">
        <div className="footer-info">
          <div className="logo-group">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 6L25 11.2V20.8L16 26L7 20.8V11.2L16 6Z" stroke="var(--primary)" strokeWidth="2"/>
              <circle cx="16" cy="16" r="3" fill="var(--text-white)"/>
            </svg>
            <span className="logo-text">ResolveX</span>
          </div>
          <p className="footer-description">Modernizing civic accountability.</p>
        </div>
        <div>
          <h4>Product</h4>
          <a href="#features">Features</a>
          <a href="#solution">How it Works</a>
          <a href="#stats">Pricing</a>
        </div>
        <div>
          <h4>Company</h4>
          <a href="#">About Us</a>
          <a href="#">Careers</a>
          <a href="#">Press Kit</a>
        </div>
        <div>
          <h4>Resources</h4>
          <a href="#">Help Center</a>
          <a href="#">Security</a>
          <a href="#">Contact Us</a>
        </div>
      </div>
      <div className="container footer-bottom">
        <p>© 2026 ResolveX Technologies Inc. All rights reserved.</p>
        <div className="social-links">
          <a href="#">Twitter</a>
          <a href="#">GitHub</a>
          <a href="#">LinkedIn</a>
        </div>
      </div>
    </footer>
  );
}
