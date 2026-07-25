/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import {
  Menu,
  X,
  ArrowRight
} from 'lucide-react';
import { PageKey, NavLink } from '@/src/core/types';
import { NAV_LINKS } from '@/src/core/constants/data';

interface HeaderProps {
  currentPage: PageKey;
  onPageChange: (page: PageKey) => void;
  onGetInTouch: () => void;
}

export default function Header({ currentPage, onPageChange, onGetInTouch }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const lastActiveHeaderRef = useRef<HTMLElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Lock scroll when mobile menu is open to prevent background scrolling
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      lastActiveHeaderRef.current = document.activeElement as HTMLElement;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setMobileMenuOpen(false);
        } else if (e.key === 'Tab' && mobileMenuRef.current) {
          const focusableElements = Array.from(mobileMenuRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )) as HTMLElement[];
          if (mobileToggleRef.current) {
            focusableElements.unshift(mobileToggleRef.current);
          }
          if (focusableElements.length > 0) {
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            if (e.shiftKey) {
              if (document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
              }
            } else {
              if (document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
              }
            }
          }
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
        if (lastActiveHeaderRef.current) {
          lastActiveHeaderRef.current.focus();
        }
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileMenuOpen]);

  // Helper to handle client clicking a navigation key
  const handleNavClick = (key: PageKey) => {
    onPageChange(key);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="w-full bg-[#030712]/70 backdrop-blur-md border-b border-white/15 sticky top-0 z-50 shadow-lg">

      {/* Main Corporate Header Panel */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center h-16">

          {/* Logo Brand Frame */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50 rounded-lg group text-left h-full"
          >
            <img 
                src="/carnezalog2.png" 
                alt="Demo Logo" 
                className="h-18 w-auto object-contain select-none group-hover:scale-105 transition-transform duration-300 mt-1"
              />
          </button>

          {/* Desktop Nav Actions */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link: NavLink) => {
              const isActive = currentPage === link.key;
              return (
                <button
                  key={link.key}
                  onClick={() => handleNavClick(link.key)}
                  className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50 ${isActive
                      ? 'text-brand-accent-light font-semibold bg-white/5'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-3.5 right-3.5 h-0.5 bg-brand-accent-light rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* CTA Action button */}
          <div className="hidden md:block">
            <button
              onClick={onGetInTouch}
              className="bg-gradient-to-r from-brand-accent to-brand-secondary hover:from-brand-accent-light hover:to-brand-accent text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50"
            >
              Get In Touch
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Hamburguer Toggler */}
          <div className="flex md:hidden">
            <button
              ref={mobileToggleRef}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50 rounded-lg"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Navigation overlay */}
      {mobileMenuOpen && (
        <div 
          ref={mobileMenuRef}
          id="mobile-navigation"
          className="md:hidden bg-[#030712]/95 backdrop-blur-lg border-b border-white/10 animate-in slide-in-from-top-4 duration-200"
        >
          <nav className="px-4 pt-2 pb-6 space-y-1 shadow-inner">
            {NAV_LINKS.map((link: NavLink) => {
              const isActive = currentPage === link.key;
              return (
                <button
                  key={link.key}
                  onClick={() => handleNavClick(link.key)}
                  className={`w-full text-left px-4 py-3 text-base font-medium rounded-lg transition-colors flex justify-between items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50 ${isActive
                      ? 'bg-white/10 text-white font-semibold'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                >
                  <span>{link.label}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-brand-accent-light" />}
                </button>
              );
            })}
            <div className="pt-4 px-4">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onGetInTouch();
                }}
                className="w-full bg-gradient-to-r from-brand-accent to-brand-secondary hover:from-brand-accent-light hover:to-brand-accent text-white text-center font-semibold py-3 px-4 rounded-xl shadow-sm transition-all text-sm flex justify-center items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50"
              >
                Get In Touch
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

