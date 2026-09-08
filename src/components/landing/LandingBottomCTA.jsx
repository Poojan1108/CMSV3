import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function LandingBottomCTA({ setView }) {
  return (
    <section className="rx-bottom-cta-section">
      <div className="rx-container">
        <div className="rx-bottom-cta-card">
          {/* Left: Heading, Subtitle & CTA button */}
          <div className="rx-bottom-cta-left">
            <span className="rx-section-badge">CLEANER SPACES. HAPPIER PEOPLE.</span>

            <h2 className="rx-bottom-cta-title">
              Make every issue easier to resolve.
            </h2>

            <p className="rx-bottom-cta-sub">
              Join campuses and communities that trust ResolveX.
            </p>

            <button
              type="button"
              className="rx-btn-primary"
              onClick={() => setView('signup')}
            >
              <span>Request a Demo</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Right: Skyline Illustration Vector & Handwritten Note */}
          <div className="rx-bottom-cta-right">
            <div className="rx-skyline-wrapper">
              {/* Campus Skyline Illustration */}
              <img
                src="/Houses-bro.svg"
                alt="Better Communities Tomorrow"
                style={{ width: '100%', maxWidth: '430px', height: 'auto', display: 'block', margin: '0 auto' }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
