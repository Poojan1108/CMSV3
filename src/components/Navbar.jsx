import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Problem', href: '#problem' },
  { label: 'Solution', href: '#solution' },
  { label: 'Workflow', href: '#workflow' },
  { label: 'Features', href: '#features' },
  { label: 'Dashboard', href: '#dashboard' },
  { label: 'Impact', href: '#stats' },
];

export function BrandMark({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M16 6L25 11.2V20.8L16 26L7 20.8V11.2L16 6Z" stroke="var(--lx-accent)" strokeWidth="2" />
      <circle cx="16" cy="16" r="3" fill="currentColor" />
    </svg>
  );
}

export default function Navbar({ setView }) {
  const [scrolled, setScrolled] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setIsDrawerOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <header className={`lx-navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="lx-container lx-navbar-inner">
          <a
            href="#top"
            className="lx-logo"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <BrandMark />
            ResolveX
          </a>

          <nav className="lx-nav-links" aria-label="Primary">
            {NAV_ITEMS.map((item) => (
              <a key={item.href} href={item.href} onClick={(e) => handleNavClick(e, item.href)}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className="lx-nav-actions">
            <a
              href="#login"
              className="lx-link"
              onClick={(e) => {
                e.preventDefault();
                setView('login');
              }}
            >
              Log in
            </a>
            <button
              type="button"
              className="lx-btn lx-btn-primary lx-btn-sm"
              onClick={() => setView('signup')}
            >
              Get Started
            </button>
          </div>

          <button
            type="button"
            className="lx-mobile-toggle"
            onClick={() => setIsDrawerOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={isDrawerOpen}
          >
            {isDrawerOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </header>

      {isDrawerOpen && (
        <div className="lx-drawer-backdrop" onClick={() => setIsDrawerOpen(false)}>
          <div className="lx-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="lx-drawer-head">
              <span className="lx-logo">
                <BrandMark size={22} />
                ResolveX
              </span>
              <button
                type="button"
                className="lx-mobile-toggle"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Close menu"
              >
                <X size={19} />
              </button>
            </div>

            <nav className="lx-drawer-nav" aria-label="Mobile">
              {NAV_ITEMS.map((item) => (
                <a key={item.href} href={item.href} onClick={(e) => handleNavClick(e, item.href)}>
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="lx-drawer-actions">
              <button
                type="button"
                className="lx-btn lx-btn-ghost"
                onClick={() => {
                  setIsDrawerOpen(false);
                  setView('login');
                }}
              >
                Log in
              </button>
              <button
                type="button"
                className="lx-btn lx-btn-primary"
                onClick={() => {
                  setIsDrawerOpen(false);
                  setView('signup');
                }}
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
