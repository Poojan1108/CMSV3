import React from 'react';

export default function CTA({ setView }) {
  return (
    <section className="section-cta" id="cta">

      
      <div className="container text-center reveal-on-scroll">
        <h2 className="cta-title">Ready to modernize complaint management?</h2>
        <p className="cta-subtitle">
          Join municipal teams worldwide using ResolveX to deliver transparency and trust.
        </p>
        <div className="cta-actions">
          <a href="#" className="btn btn-primary" onClick={(e) => { e.preventDefault(); setView('signup'); }}>Get Started</a>
          <a href="#" className="btn btn-secondary">Book Demo</a>
        </div>
      </div>
    </section>
  );
}
