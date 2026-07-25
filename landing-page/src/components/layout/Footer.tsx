/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  ArrowUp, 
  Facebook, 
  Linkedin, 
  Twitter, 
  Instagram,
  ExternalLink
} from 'lucide-react';
import { PageKey, NavLink } from '@/src/core/types';
import { CORPORATE_INFO, NAV_LINKS, THERAPEUTIC_SEGMENTS } from '@/src/core/constants/data';

interface FooterProps {
  onPageChange: (page: PageKey) => void;
  onSelectSegment: (segmentId: string) => void;
}

export default function Footer({ onPageChange, onSelectSegment }: FooterProps) {
  
  // Back to top function handler
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Nav helper for internal routing
  const navigateTo = useCallback((key: PageKey) => {
    onPageChange(key);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [onPageChange]);

  const handleProductSegmentClick = useCallback((segmentId: string) => {
    onSelectSegment(segmentId);
    navigateTo('products');
  }, [onSelectSegment, navigateTo]);

  return (
    <footer className="bg-brand-dark-site text-slate-300 relative pt-16 pb-8 border-t border-brand-primary/20">
      
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-accent-light via-brand-accent to-brand-primary" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
        
        {/* Column 1: Brand & Socials */}
        <div className="space-y-6">
          <div className="flex items-center">
              <img 
                src="/carnezalog2.png" 
                alt="Demo Logo" 
                width={240}
                height={70}
                loading="lazy"
                className="h-20 w-auto object-contain select-none"
              />
          </div>
          <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
            {CORPORATE_INFO.aboutBrief} Committed to international quality, affordability, and clinical state audits.
          </p>
          <div className="flex items-center gap-3.5">
            <a 
              href={CORPORATE_INFO.socials.facebook} 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Facebook Link"
              className="w-9 h-9 rounded-full bg-slate-800 hover:bg-brand-accent hover:text-white flex items-center justify-center transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a 
              href={CORPORATE_INFO.socials.linkedin} 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="LinkedIn Link"
              className="w-9 h-9 rounded-full bg-slate-800 hover:bg-brand-accent hover:text-white flex items-center justify-center transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a 
              href={CORPORATE_INFO.socials.twitter} 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Twitter Link"
              className="w-9 h-9 rounded-full bg-slate-800 hover:bg-brand-accent hover:text-white flex items-center justify-center transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50"
            >
              <Twitter className="w-4 h-4" />
            </a>
            <a 
              href={CORPORATE_INFO.socials.instagram} 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Instagram Link"
              className="w-9 h-9 rounded-full bg-slate-800 hover:bg-brand-accent hover:text-white flex items-center justify-center transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50"
            >
              <Instagram className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h3 className="text-white text-base font-semibold tracking-wider uppercase mb-6 relative pb-2 inline-block">
            Quick Links
            <span className="absolute bottom-0 left-0 w-8 h-0.5 bg-brand-accent" />
          </h3>
          <ul className="space-y-3.5 text-sm">
            {NAV_LINKS.map((link: NavLink) => (
              <li key={link.key}>
                <a
                  href={link.key === 'home' ? '/' : `/${link.key}`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo(link.key);
                  }}
                  className="hover:text-brand-accent-light hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50 rounded flex items-center gap-1.5 cursor-pointer text-left w-fit"
                >
                  <span className="text-[10px] text-brand-accent-light" aria-hidden="true">◆</span>
                  <span>{link.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Our Products/Segments */}
        <div>
          <h3 className="text-white text-base font-semibold tracking-wider uppercase mb-6 relative pb-2 inline-block">
            Our Products
            <span className="absolute bottom-0 left-0 w-8 h-0.5 bg-brand-accent" />
          </h3>
          <ul className="space-y-3.5 text-sm">
            {THERAPEUTIC_SEGMENTS.slice(0, 6).map((seg) => (
              <li key={seg.id}>
                <a
                  href={`/products?segment=${seg.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleProductSegmentClick(seg.id);
                  }}
                  className="hover:text-brand-accent-light hover:underline transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50 rounded flex items-center gap-1.5 cursor-pointer w-fit"
                >
                  <span className="text-[10px] text-brand-accent-light" aria-hidden="true">◆</span>
                  <span>{seg.name}</span>
                </a>
              </li>
            ))}
            <li className="pt-1.5 border-t border-slate-800">
              <a
                href="/products"
                onClick={(e) => {
                  e.preventDefault();
                  onSelectSegment('all');
                  navigateTo('products');
                }}
                className="hover:text-brand-accent-light font-bold text-brand-accent-light uppercase text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50 rounded flex items-center gap-1 cursor-pointer w-fit"
              >
                <span>View All Products</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </li>
          </ul>
        </div>

        {/* Column 4: Contact Core Area */}
        <div>
          <h3 className="text-white text-base font-semibold tracking-wider uppercase mb-6 relative pb-2 inline-block">
            Contact Us
            <span className="absolute bottom-0 left-0 w-8 h-0.5 bg-brand-accent" />
          </h3>
          <div className="space-y-4.5 text-sm leading-relaxed text-slate-400">
            <div className="flex gap-3 items-start">
              <MapPin className="w-5 h-5 text-brand-accent-light shrink-0 mt-0.5" aria-hidden="true" />
              <span>{CORPORATE_INFO.address}</span>
            </div>
            <div className="flex gap-3 items-center">
              <Phone className="w-4 h-4 text-brand-accent-light shrink-0" aria-hidden="true" />
              <a href={`tel:${CORPORATE_INFO.phone}`} className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50 rounded">
                {CORPORATE_INFO.phone}
              </a>
            </div>
            <div className="flex gap-3 items-center">
              <Mail className="w-4 h-4 text-brand-accent-light shrink-0" aria-hidden="true" />
              <a href={`mailto:${CORPORATE_INFO.email}`} className="hover:text-white transition-colors break-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50 rounded">
                {CORPORATE_INFO.email}
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* Dividers & Copyright info bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-brand-primary/20">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Demo Pharma Pvt. Ltd. All Rights Reserved.</p>
          <div className="flex items-center gap-6 font-light">
            <a 
              href="/terms" 
              onClick={(e) => {
                e.preventDefault();
                navigateTo('terms');
              }}
              className="cursor-pointer hover:text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50 rounded"
            >
              Terms & Conditions
            </a>
          </div>
        </div>
      </div>

      {/* Back to top dynamic float pill */}
      <button
        onClick={scrollToTop}
        aria-label="Back to top"
        className="absolute right-6 bottom-6 bg-brand-accent hover:bg-brand-accent-light text-white p-3 rounded-full shadow-lg hover:-translate-y-1 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
      >
        <ArrowUp className="w-5 h-5" />
      </button>

    </footer>
  );
}

