import React from 'react';

export default function Hero({ setView }) {
  return (
    <section className="section-hero" id="hero">
      {/* Background Image with workflow panel */}
      <div className="hero-video-bg-container">
        <video 
          src="/hero-bg-animated.mp4" 
          className="hero-bg-video" 
          autoPlay 
          loop 
          muted 
          playsInline
        />
       
        <div className="video-blend-overlay top-blend"></div>
        <div className="video-blend-overlay bottom-blend"></div>
        <div className="video-blend-overlay left-blend"></div>
        <div className="video-blend-overlay right-blend"></div>
        <div className="video-star-cover"></div>
      </div>

      <div className="hero-container">
        {/* Centered Hero Content */}
        <div className="hero-content reveal-on-scroll">
          <h1 className="hero-title">
            Every Complaint. <span className="gradient-text">Structured Into</span> Resolution.
          </h1>
          <p className="hero-description">
            A unified platform to capture, route, track, and resolve complaints across departments with complete transparency and accountability.
          </p>
          <div className="hero-ctas">
            <a href="#" className="btn btn-primary btn-icon" onClick={(e) => { e.preventDefault(); setView('signup'); }}>
              Register Complaint
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <a href="#" className="btn btn-secondary" onClick={(e) => { e.preventDefault(); setView('login'); }}>Track Complaint</a>
          </div>
          
          <div className="hero-trust-bullets">
            <div className="trust-bullet">
              <svg className="trust-bullet-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              <span>AI Powered</span>
            </div>
            <div className="trust-bullet">
              <svg className="trust-bullet-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>Real-time Tracking</span>
            </div>
            <div className="trust-bullet">
              <svg className="trust-bullet-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>Data Secure</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
