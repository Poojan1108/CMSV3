import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const CONTROL_CHECKLIST = [
  'Review the completed work',
  'Rate your experience',
  'Provide feedback (optional)',
  'Keep communities accountable',
];

export default function LandingCitizenControl() {
  return (
    <section className="rx-section rx-control-section">
      <div className="rx-container">
        <div className="rx-control-grid">
          {/* Left Column: Heading & Control Checklist */}
          <div className="rx-control-left-text">
            <span className="rx-section-badge">USERS STAY IN CONTROL</span>

            <h2 className="rx-section-heading">
              Resolution isn’t complete
              <br />
              <span className="rx-highlight-word">
                until you say so.
                <span className="rx-yellow-circle-backdrop"></span>
              </span>
            </h2>

            <p className="rx-section-sub">
              No ticket is closed until you review the work and personally confirm the resolution.
            </p>

            <ul className="rx-control-checklist">
              {CONTROL_CHECKLIST.map((item, idx) => (
                <li key={idx} className="rx-control-check-item">
                  <div className="rx-control-check-icon">
                    <CheckCircle2 size={18} strokeWidth={2.2} />
                  </div>
                  <span className="rx-control-check-label">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column: Resolution Complete Vector Art */}
          <div className="rx-control-right-visual">
            <div className="rx-control-character-vector">
              <img
                src="/Done-rafiki.svg"
                alt="Issue Completed and Resolved"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
