import React from 'react';
import { ShieldCheck, Clock, Lock } from 'lucide-react';

const TRUST_POINTS = [
  { icon: ShieldCheck, label: 'AI-powered triage' },
  { icon: Clock, label: 'Real-time tracking' },
  { icon: Lock, label: 'Data secure' },
];

export default function Hero({ setView }) {
  return (
    <section className="lx-hero" id="top">
      {/* Background video with cinematic blends */}
      <div className="lx-hero-media" aria-hidden="true">
        <video
          src="/hero-bg-animated.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
      </div>

      <div className="lx-container">
        <div className="lx-hero-inner">
          <span className="lx-hero-badge">
            <ShieldCheck size={13} />
            Complaint management, rebuilt for trust
          </span>

          <h1 className="lx-hero-title">
            Every complaint.
            <br />
            <em>Structured into</em> resolution.
          </h1>

          <p className="lx-hero-desc">
            A unified platform to capture, route, track, and resolve complaints across
            departments — with complete transparency and accountability at every step.
          </p>

          <div className="lx-hero-actions">
            <button
              type="button"
              className="lx-btn lx-btn-primary"
              onClick={() => setView('signup')}
            >
              Register a Complaint
            </button>
            <button
              type="button"
              className="lx-btn lx-btn-ghost"
              onClick={() => setView('login')}
            >
              Track Complaint
            </button>
          </div>

          <div className="lx-hero-points">
            {TRUST_POINTS.map((point) => {
              const Icon = point.icon;
              return (
                <span key={point.label} className="lx-hero-point">
                  <Icon size={14} />
                  {point.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
