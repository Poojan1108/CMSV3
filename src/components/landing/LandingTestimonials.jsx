import React from 'react';

const PARTNERS = [
  {
    name: 'Rivermere University',
    iconSvg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v4M12 14v4M16 14v4"/>
      </svg>
    ),
  },
  {
    name: 'Greenwood Residences',
    iconSvg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
        <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/>
      </svg>
    ),
  },
  {
    name: 'Maple Living',
    iconSvg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    name: 'Horizon Campus',
    iconSvg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 20h20M7 20v-5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v5M6 4l6-2 6 2v6H6Z"/>
      </svg>
    ),
  },
];

export default function LandingTestimonials() {
  return (
    <section className="rx-section rx-testimonials-section">
      <div className="rx-container">
        <div className="rx-section-header-center">
          <span className="rx-section-badge">TRUSTED BY COMMUNITIES</span>
        </div>

        <div className="rx-testimonial-grid">
          {/* Left: Testimonial Quote */}
          <div className="rx-testimonial-card">
            <div className="rx-testimonial-user">
              <div className="rx-testimonial-avatar">
                <span>PS</span>
              </div>
              <div className="rx-testimonial-meta">
                <blockquote className="rx-testimonial-quote">
                  “ResolveX has made it so easy for our students to report issues, and the
                  transparency is a game-changer. Our campus is cleaner, safer, and more responsive than ever.”
                </blockquote>
                <div className="rx-author-details">
                  <span className="rx-author-name">Priya Sharma</span>
                  <span className="rx-author-title">Student Council President, Rivermere University</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: 4 Partner Logo Cards */}
          <div className="rx-partners-grid">
            {PARTNERS.map((partner, idx) => (
              <div key={idx} className="rx-partner-badge">
                <div className="rx-partner-icon-wrap">
                  {partner.iconSvg}
                </div>
                <span className="rx-partner-name">{partner.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
