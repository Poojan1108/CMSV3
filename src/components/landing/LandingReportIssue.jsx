import React from 'react';
import {
  Zap,
  Camera,
  Layers
} from 'lucide-react';
import MobileReportIssueIllustration from './MobileReportIssueIllustration';

const MobilePhoneIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/>
    <path d="M12 18h.01"/>
  </svg>
);

export default function LandingReportIssue() {
  return (
    <section className="rx-section rx-report-section" id="features">
      <div className="rx-container">
        <div className="rx-report-grid">
          {/* Left Column: Feature Description & Bullets */}
          <div className="rx-report-left">
            <span className="rx-section-badge">REPORT IN UNDER 60 SECONDS</span>

            <h2 className="rx-section-heading">
              <span className="rx-highlight-word">
                One platform.
                <span className="rx-yellow-circle-backdrop"></span>
              </span>
              <br />
              Every issue.
            </h2>

            <p className="rx-section-sub">
              Report maintenance issues with photos, location details, and a quick
              description — anytime, anywhere.
            </p>

            <ul className="rx-feature-checklist">
              <li className="rx-check-item">
                <div className="rx-check-circle">
                  <Zap size={18} />
                </div>
                <div className="rx-check-text">
                  <strong>Quick & easy reporting</strong>
                  <span>Submit issue details in under 60 seconds</span>
                </div>
              </li>

              <li className="rx-check-item">
                <div className="rx-check-circle">
                  <Camera size={18} />
                </div>
                <div className="rx-check-text">
                  <strong>Add photos and location</strong>
                  <span>Attach photo proof with room & GPS verification</span>
                </div>
              </li>

              <li className="rx-check-item">
                <div className="rx-check-circle">
                  <Layers size={18} />
                </div>
                <div className="rx-check-text">
                  <strong>Multiple issue categories</strong>
                  <span>Plumbing, electrical, Wi-Fi, HVAC, sanitation & more</span>
                </div>
              </li>

              <li className="rx-check-item">
                <div className="rx-check-circle">
                  <MobilePhoneIcon size={18} />
                </div>
                <div className="rx-check-text">
                  <strong>Works on web and mobile</strong>
                  <span>Seamlessly accessible on every smartphone and laptop</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Right Column: Balanced Vector Artwork with App UI in Phone */}
          <div className="rx-report-right">
            <div className="rx-character-vector">
              <MobileReportIssueIllustration />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
