import React from 'react';
import {
  UserCheck,
  Clock,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';

const ACCOUNTABILITY_POINTS = [
  {
    icon: UserCheck,
    title: 'Smart Auto-Assignment',
    description: 'Every ticket instantly routes to the qualified technician by category and facility.',
  },
  {
    icon: Clock,
    title: 'Enforced SLA Timers',
    description: 'Target resolution countdowns keep technicians on schedule with live tracking.',
  },
  {
    icon: AlertTriangle,
    title: 'Automated Escalation Alerts',
    description: 'Supervisors receive immediate notification if any ticket nears its deadline.',
  },
  {
    icon: ShieldCheck,
    title: 'Tamper-Proof Audit Trail',
    description: 'Every status update, inspection note, and timestamp is permanently logged.',
  },
];

export default function LandingOwner() {
  return (
    <section className="rx-section rx-owner-section" id="accountability">
      <div className="rx-container">
        <div className="rx-owner-grid">
          {/* Left Column: Heading & Accountability Features */}
          <div className="rx-owner-left">
            <span className="rx-section-badge">ACCOUNTABILITY IN ACTION</span>

            <h2 className="rx-section-heading">
              Every complaint
              <br />
              <span className="rx-highlight-word">
                has an owner.
                <span className="rx-yellow-circle-backdrop"></span>
              </span>
            </h2>

            <p className="rx-section-sub">
              Issues are automatically routed to the right team with strict SLA timers.
              Get notified at every step, with escalations to ensure nothing is ignored.
            </p>

            <div className="rx-owner-features-list">
              {ACCOUNTABILITY_POINTS.map((pt, idx) => {
                const IconComponent = pt.icon;
                return (
                  <div key={idx} className="rx-owner-feature-row">
                    <div className="rx-owner-feature-icon-box">
                      <IconComponent size={18} strokeWidth={2.2} />
                    </div>
                    <div className="rx-owner-feature-content">
                      <h4 className="rx-owner-feature-title">{pt.title}</h4>
                      <p className="rx-owner-feature-desc">{pt.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Maintenance Technician Vector Art */}
          <div className="rx-owner-right">
            <div className="rx-owner-vector-container">
              <img
                src="/Product%20teardown-bro.svg"
                alt="Maintenance inspection and repair"
                className="rx-owner-illustration"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
