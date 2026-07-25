import React from 'react';

export default function Problem() {
  return (
    <section className="section-problem" id="problem">
      <div className="container text-center reveal-on-scroll">
        <span className="section-tag">THE PROBLEM</span>
        <h2 className="section-title">Why Traditional Systems Fail<br/><span className="highlight-blue">Citizens Every Day</span></h2>
        <p className="section-subtitle">
          Outdated complaint management leads to lost requests, zero visibility, and delayed actions — causing frustration for both citizens and departments.
        </p>
      </div>

      <div className="grid container grid-3 reveal-on-scroll">
        {/* Problem Card 1 */}
        <div className="problem-card">
          <div className="card-icon-wrapper">
            <svg className="problem-svg-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="64" height="64" rx="16" fill="rgba(0, 102, 255, 0.1)" />
              <path d="M22 18H42M22 26H34" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round"/>
              <rect x="18" y="14" width="28" height="36" rx="4" stroke="#8A8A93" strokeWidth="2"/>
              <circle cx="44" cy="44" r="8" fill="#FF453A"/>
              <path d="M41 41 L47 47 M47 41 L41 47" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h3 className="card-title">Lost & Untracked Complaints</h3>
          <p className="card-description">
            Complaints are lost in paperwork, spreadsheets, and manual logs with no real visibility.
          </p>
          <div className="card-illustration">
            <div className="card-ui-preview">
              <div className="preview-row expired">
                <span className="preview-id">#1024 (Road)</span>
                <span className="preview-status status-expired">Lost In Queue</span>
                <span className="preview-time">18d ago</span>
              </div>
              <div className="preview-row warning">
                <span className="preview-id">#1023 (Water)</span>
                <span className="preview-status status-warning">Unassigned</span>
                <span className="preview-time">12d ago</span>
              </div>
            </div>
          </div>
        </div>

        {/* Problem Card 2 */}
        <div className="problem-card">
          <div className="card-icon-wrapper">
            <svg className="problem-svg-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="64" height="64" rx="16" fill="rgba(0, 102, 255, 0.1)" />
              <path d="M32 16V48 M20 24 L44 40 M20 40 L44 24" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="32" cy="32" r="20" stroke="#8A8A93" strokeWidth="2"/>
            </svg>
          </div>
          <h3 className="card-title">Slow & Manual Processes</h3>
          <p className="card-description">
            Manual routing, unclear ownership, and lengthy back-and-forth cause unnecessary delays.
          </p>
          <div className="card-illustration">
            <div className="card-ui-preview" style={{ justifyContent: 'space-between', padding: '12px 16px' }}>
              <div className="timeline-step done">
                <span className="step-dot"></span>
                <span className="step-name">Submitted</span>
                <span className="step-meta">Instant</span>
              </div>
              <div className="timeline-step pending">
                <span className="step-dot active"></span>
                <span className="step-name">Manual Sorting</span>
                <span className="step-meta text-red">+4.2 Days</span>
              </div>
              <div className="timeline-step blocked">
                <span className="step-dot"></span>
                <span className="step-name">Department Action</span>
                <span className="step-meta text-gray">Blocked</span>
              </div>
            </div>
          </div>
        </div>

        {/* Problem Card 3 */}
        <div className="problem-card">
          <div className="card-icon-wrapper">
            <svg className="problem-svg-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="64" height="64" rx="16" fill="rgba(0, 102, 255, 0.1)" />
              <path d="M32 14C22.06 14 14 22.06 14 32S22.06 50 32 50" stroke="#8A8A93" strokeWidth="2" strokeDasharray="4 4"/>
              <path d="M42 32 C42 37.5 37.5 42 32 42" stroke="var(--primary)" strokeWidth="3"/>
              <circle cx="32" cy="32" r="14" stroke="#8A8A93" strokeWidth="2"/>
              <circle cx="32" cy="32" r="3" fill="var(--primary)"/>
            </svg>
          </div>
          <h3 className="card-title">No Transparency or Accountability</h3>
          <p className="card-description">
            Citizens can't track progress and departments lack accountability at every stage.
          </p>
          <div className="card-illustration">
            <div className="card-ui-preview" style={{ justifyContent: 'center' }}>
              <div className="transparency-status">
                <div className="status-header">
                  <span className="label">Current Status</span>
                  <span className="value text-red">No Update</span>
                </div>
                <div className="status-progress-bar">
                  <div className="bar-fill error"></div>
                </div>
                <div className="status-footer">
                  <span>Last Update: 14 days ago</span>
                  <span>Assigned: N/A</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Problem Bottom Banner */}
      <div className="container container-narrow reveal-on-scroll problem-banner-container">
        <div className="banner-card">
          <div className="banner-content">
            <div className="banner-icon-badge">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <p className="banner-text">It's time for a modern, unified platform built for transparency, speed, and citizen trust.</p>
          </div>
          <a href="#" className="banner-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
