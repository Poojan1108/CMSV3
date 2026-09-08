import React, { useState } from 'react';
import { ArrowRight, Play } from 'lucide-react';
import StorysetHeroArt from './StorysetHeroArt';

export default function LandingHero({ setView, onOpenVideoModal }) {
  return (
    <section className="rx-hero-section" id="top">
      {/* Background ambient decorative shapes */}
      <div className="rx-ambient-circle rx-ambient-green" aria-hidden="true"></div>
      <div className="rx-ambient-circle rx-ambient-blue" aria-hidden="true"></div>
      <div className="rx-ambient-circle rx-ambient-peach" aria-hidden="true"></div>

      <div className="rx-container rx-hero-grid">
        {/* Left Column: Messaging & CTAs */}
        <div className="rx-hero-left">
          <span className="rx-hero-tagline">TRACK. MANAGE. RESOLVE.</span>

          <h1 className="rx-hero-title">
            From Complaints
            <br />
            <span className="rx-hero-blue">to Change.</span>
          </h1>

          <p className="rx-hero-desc">
            A unified platform for campuses, residential communities, and facilities
            to manage grievances and maintenance — efficiently, transparently, and accountably.
          </p>

          <div className="rx-hero-actions">
            <button
              type="button"
              className="rx-btn-primary"
              onClick={() => setView('signup')}
            >
              <span>Request a Demo</span>
              <ArrowRight size={15} />
            </button>

            <button
              type="button"
              className="rx-btn-secondary"
              onClick={() => {
                const el = document.getElementById('features');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span className="rx-play-icon-wrap">
                <Play size={12} fill="#111827" />
              </span>
              <span>See How It Works</span>
            </button>
          </div>

          {/* 3-Stat Counter Strip */}
          <div className="rx-hero-stats-strip">
            <div className="rx-stat-item">
              <span className="rx-stat-num">50K+</span>
              <span className="rx-stat-label">Issues Resolved</span>
            </div>

            <div className="rx-stat-divider"></div>

            <div className="rx-stat-item">
              <span className="rx-stat-num">99%</span>
              <span className="rx-stat-label">On-Time SLA</span>
            </div>

            <div className="rx-stat-divider"></div>

            <div className="rx-stat-item">
              <span className="rx-stat-num">200+</span>
              <span className="rx-stat-label">Communities Trust Us</span>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Visual Asset & Hand-Drawn Annotations */}
        <div className="rx-hero-right">
          <div className="rx-hero-image-wrapper">
            <StorysetHeroArt />
          </div>
        </div>
      </div>
    </section>
  );
}
