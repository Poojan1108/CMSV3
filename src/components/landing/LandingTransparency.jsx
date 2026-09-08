import React from 'react';
import {
  Clock,
  Check,
  ArrowRight,
  User,
  Settings,
  ShieldCheck,
  Bell
} from 'lucide-react';

const STAGES = [
  {
    step: 1,
    title: 'Reported',
    subtitle: 'By Resident',
    timestamp: '10:00 AM',
    icon: Check,
    circleColor: '#059669',
    status: 'completed',
  },
  {
    step: 2,
    title: 'Acknowledged',
    subtitle: 'System verified',
    timestamp: '10:05 AM',
    icon: Check,
    circleColor: '#059669',
    status: 'completed',
  },
  {
    step: 3,
    title: 'Assigned',
    subtitle: 'To Rajesh K.',
    timestamp: '10:14 AM',
    icon: Check,
    circleColor: '#059669',
    status: 'completed',
  },
  {
    step: 4,
    title: 'In Progress',
    subtitle: 'Technician on site',
    timestamp: '10:20 AM',
    icon: Settings,
    circleColor: '#f59e0b',
    status: 'active',
  },
  {
    step: 5,
    title: 'Resolved',
    subtitle: 'Pending proof review',
    timestamp: 'Est. 11:30 AM',
    icon: ArrowRight,
    circleColor: '#94a3b8',
    status: 'upcoming',
  },
  {
    step: 6,
    title: 'Closed',
    subtitle: 'Resident sign-off',
    timestamp: 'Est. 12:00 PM',
    icon: ShieldCheck,
    circleColor: '#94a3b8',
    status: 'upcoming',
  },
];

export default function LandingTransparency() {
  return (
    <section className="rx-section rx-transparency-section" id="transparency">
      <div className="rx-container">
        {/* Centered, Symmetrical Section Header */}
        <div className="rx-section-header-center rx-transparency-header">
          <span className="rx-section-badge">REAL-TIME TRANSPARENCY</span>
          <h2 className="rx-section-heading">
            See exactly what’s happening.
            <span className="rx-highlight-word">
              <span className="rx-yellow-circle-backdrop"></span>
            </span>
          </h2>
          <p className="rx-section-sub">
            Track every ticket through a transparent 6-stage lifecycle with live technician assignment,
            automated SLA countdowns, and resident sign-off protection.
          </p>
        </div>

        {/* Unified Live Ticket Tracker Showcase Card */}
        <div className="rx-ticket-tracker-card">
          {/* Header Bar with Integrated Live SLA Timer */}
          <div className="rx-ticket-tracker-topbar">
            <div className="rx-ticket-meta">
              <div className="rx-ticket-id-badge">
                <span className="rx-pulse-dot"></span>
                LIVE TICKET #RX-2849
              </div>
              <h3 className="rx-ticket-name">Water leakage under bathroom sink</h3>
              <div className="rx-ticket-tags">
                <span className="rx-tag-pill rx-tag-location">📍 Block A, Room 304</span>
                <span className="rx-tag-pill rx-tag-category">Plumbing</span>
                <span className="rx-tag-pill rx-tag-priority">High Urgency</span>
              </div>
            </div>

            {/* Seamlessly Integrated SLA Countdown */}
            <div className="rx-sla-integrated-box">
              <div className="rx-sla-clock-wrap">
                <Clock size={22} />
              </div>
              <div className="rx-sla-details">
                <span className="rx-sla-label">SLA Countdown</span>
                <span className="rx-sla-value">1h 24m remaining</span>
                <span className="rx-sla-target">Expected by 12:30 PM (2h Max)</span>
              </div>
            </div>
          </div>

          {/* Modern Linear-Style 6-Stage Progress Pipeline */}
          <div className="rx-pipeline-container">
            {/* Continuous Progress Rail */}
            <div className="rx-pipeline-rail-track">
              <div className="rx-pipeline-rail-fill"></div>
            </div>

            {/* 6 Clean Pipeline Stage Columns */}
            <div className="rx-pipeline-stages-grid">
              {STAGES.map((stage) => {
                const isCompleted = stage.status === 'completed';
                const isActive = stage.status === 'active';
                const isUpcoming = stage.status === 'upcoming';

                return (
                  <div
                    key={stage.step}
                    className={`rx-pipeline-column ${
                      isActive ? 'col-active' : isCompleted ? 'col-completed' : 'col-upcoming'
                    }`}
                  >
                    {/* Node on the rail */}
                    <div className="rx-pipeline-node-anchor">
                      <div className="rx-pipeline-node-circle">
                        {isCompleted && <Check size={11} strokeWidth={3} />}
                        {isActive && <span className="rx-active-pulse-core"></span>}
                        {isUpcoming && <span className="rx-upcoming-dot"></span>}
                      </div>
                    </div>

                    {/* Stage Card */}
                    <div className="rx-pipeline-card">
                      <div className="rx-pipeline-card-top">
                        <span className="rx-pipeline-step-badge">STAGE 0{stage.step}</span>
                        {isActive && <span className="rx-pipeline-live-tag">LIVE</span>}
                      </div>
                      <h4 className="rx-pipeline-stage-name">{stage.title}</h4>
                      <p className="rx-pipeline-stage-sub">{stage.subtitle}</p>
                      <div className="rx-pipeline-status-row">
                        {isActive ? (
                          <span className="rx-tag-in-progress">
                            <span className="rx-pulse-mini-dot"></span>
                            On Site
                          </span>
                        ) : isCompleted ? (
                          <span className="rx-tag-completed">✓ {stage.timestamp}</span>
                        ) : (
                          <span className="rx-tag-upcoming">{stage.timestamp}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom 3 Trust & Transparency Pillars */}
          <div className="rx-tracker-guarantees-grid">
            <div className="rx-guarantee-card">
              <div className="rx-guarantee-icon-wrap rx-icon-emerald">
                <User size={18} />
              </div>
              <div className="rx-guarantee-text">
                <strong>Assigned Technician</strong>
                <p>Rajesh Kumar (Lead Plumber) dispatched with direct in-app contact</p>
              </div>
            </div>

            <div className="rx-guarantee-card">
              <div className="rx-guarantee-icon-wrap rx-icon-blue">
                <Bell size={18} />
              </div>
              <div className="rx-guarantee-text">
                <strong>Live Push &amp; SMS Alerts</strong>
                <p>Instant notifications sent to resident upon every status transition</p>
              </div>
            </div>

            <div className="rx-guarantee-card">
              <div className="rx-guarantee-icon-wrap rx-icon-amber">
                <ShieldCheck size={18} />
              </div>
              <div className="rx-guarantee-text">
                <strong>Resident Sign-off Guarantee</strong>
                <p>Tickets cannot close until resident inspects and approves the fix</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
