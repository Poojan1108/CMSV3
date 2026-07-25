import React, { useState, useEffect } from 'react';

export default function Navbar({ setView }) {
  const [scrolled, setScrolled] = useState(false);

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

  return (
    <header className="navbar" style={scrolled ? {
      padding: '10px 0',
    } : {}}>
      <div className="nav-container">
        <a href="#" className="logo-group" onClick={(e) => { e.preventDefault(); setView('landing'); }}>
          {/* ResolveX Geometric Tech Logo */}
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="var(--bg-landing)"/>
            <path d="M16 6L25 11.2V20.8L16 26L7 20.8V11.2L16 6Z" stroke="var(--primary)" stroke-width="2"/>
            <circle cx="16" cy="16" r="3" fill="var(--text-white)"/>
          </svg>
          <span className="logo-text">ResolveX</span>
        </a>

        <nav className="nav-links">
          <a href="#problem">The Problem</a>
          <a href="#solution">Solution</a>
          <a href="#workflow">Workflow</a>
          <a href="#features">Features</a>
          <a href="#dashboard">Dashboard</a>
          <a href="#stats">Impact</a>
        </nav>

        <div className="nav-actions">
          <a href="#" className="btn-link" onClick={(e) => { e.preventDefault(); setView('login'); }}>Log in</a>
          <a href="#" className="btn btn-primary" onClick={(e) => { e.preventDefault(); setView('signup'); }}>Get Started</a>
        </div>
      </div>
    </header>
  );
}
