import React, { useState, useEffect, useRef } from 'react';

export default function DashboardShowcase() {
  const containerRef = useRef(null);
  const [activeScreen, setActiveScreen] = useState(0);

  const urls = [
    'https://app.resolvex.gov/citizen/dashboard',
    'https://app.resolvex.gov/department/dispatch',
    'https://app.resolvex.gov/executive/analytics'
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const cards = containerRef.current.querySelectorAll('.scroll-card');
      const vh = window.innerHeight;
      let active = 0;
      cards.forEach((card, idx) => {
        const rect = card.getBoundingClientRect();
        if (rect.top < vh * 0.5) {
          active = idx;
        }
      });
      setActiveScreen(active);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="section-dashboard-showcase" id="dashboard" ref={containerRef}>
      <div className="container showcase-grid">
        {/* Sticky Left Browser Frame */}
        <div className="sticky-frame-wrapper">
          <div className="mock-browser-frame frame-sticky">
            <div className="browser-header">
              <div className="browser-dots">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
              </div>
              <div className="browser-address-bar">{urls[activeScreen]}</div>
            </div>
            <div className="showcase-content-area">
              <div className="dashboard-mockup-inner">
                {/* Screen 1: Citizen View */}
                {activeScreen === 0 && (
                  <div className="mock-screen active" data-screen-index="0">
                    <div className="mock-sidebar">
                      <div className="sidebar-item active">Dashboard</div>
                      <div className="sidebar-item">Complaints</div>
                      <div className="sidebar-item">Map</div>
                    </div>
                    <div className="mock-body">
                      <h3 className="mock-body-title">My Filed Complaints</h3>
                      <div className="mock-complaint-row">
                        <div className="flex-column">
                          <span className="bold">Water pipeline leak</span>
                          <span className="text-gray">Lincoln street, W4</span>
                        </div>
                        <span className="mock-status green">Resolved</span>
                      </div>
                      <div className="mock-complaint-row">
                        <div className="flex-column">
                          <span className="bold">Broken street light</span>
                          <span className="text-gray">Evergreen terrace, S4</span>
                        </div>
                        <span className="mock-status yellow">In Progress</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Screen 2: Dispatcher View */}
                {activeScreen === 1 && (
                  <div className="mock-screen active" data-screen-index="1">
                    <div className="mock-sidebar">
                      <div className="sidebar-item">Dashboard</div>
                      <div className="sidebar-item active">Queue</div>
                      <div className="sidebar-item">Officers</div>
                    </div>
                    <div className="mock-body">
                      <h3 className="mock-body-title">Department Dispatch Queue</h3>
                      <div className="mock-dispatch-list">
                        <div className="mock-complaint-row dispatch-item">
                          <div className="flex-column">
                            <span className="bold">Road Crater repair</span>
                            <span className="text-gray">Public Works - Assigned to Officer R. Davis</span>
                          </div>
                          <span className="mock-status green">Dispatched</span>
                        </div>
                        <div className="mock-complaint-row dispatch-item" style={{ borderLeftColor: 'var(--accent-amber)' }}>
                          <div className="flex-column">
                            <span className="bold">Blocked sewer main</span>
                            <span className="text-gray">Sanitation - Needs Assignment</span>
                          </div>
                          <span className="mock-status yellow">Pending</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Screen 3: Executive Analytics View */}
                {activeScreen === 2 && (
                  <div className="mock-screen active" data-screen-index="2">
                    <div className="mock-sidebar">
                      <div className="sidebar-item">Dashboard</div>
                      <div className="sidebar-item">Reports</div>
                      <div className="sidebar-item active">Analytics</div>
                    </div>
                    <div className="mock-body">
                      <h3 className="mock-body-title">Executive Analytics Hub</h3>
                      <div className="mock-analytics-grid">
                        <div className="analytics-widget">
                          <span className="text-gray" style={{ fontSize: '10px' }}>Avg Resolution Time</span>
                          <h4 style={{ fontSize: '20px', color: 'var(--accent-cyan)' }}>2.1 Days</h4>
                        </div>
                        <div className="analytics-widget">
                          <span className="text-gray" style={{ fontSize: '10px' }}>SLA Compliance</span>
                          <h4 style={{ fontSize: '20px', color: 'var(--accent-emerald)' }}>98.4%</h4>
                        </div>
                      </div>
                      <div style={{ marginTop: '10px' }}>
                        <span className="text-gray" style={{ fontSize: '10px', display: 'block', marginBottom: '4px' }}>Closure Rates by Ward</span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '50px' }}>
                          <div style={{ backgroundColor: 'var(--primary)', width: '20%', height: '60%', borderRadius: '2px' }}></div>
                          <div style={{ backgroundColor: 'var(--primary)', width: '20%', height: '90%', borderRadius: '2px' }}></div>
                          <div style={{ backgroundColor: 'var(--primary)', width: '20%', height: '40%', borderRadius: '2px' }}></div>
                          <div style={{ backgroundColor: 'var(--primary)', width: '20%', height: '80%', borderRadius: '2px' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scrolling Right Content Cards */}
        <div className="scroll-content-container">
          <div className="scroll-card reveal-on-scroll" data-trigger-screen="0">
            <span className="card-badge">CITIZEN EXPERIENCE</span>
            <h3>The Citizen Dashboard</h3>
            <p>
              Citizens can file new requests, upload digital photo proof, track active progress milestones, and directly message assigned technicians.
            </p>
          </div>
          <div className="scroll-card reveal-on-scroll" data-trigger-screen="1">
            <span className="card-badge">DEPT ADMINISTRATOR</span>
            <h3>The Dispatch Panel</h3>
            <p>
              Department heads receive structured data, view workloads across active officers, assign jobs, and manage task prioritization from a centralized panel.
            </p>
          </div>
          <div className="scroll-card reveal-on-scroll" data-trigger-screen="2">
            <span className="card-badge">EXECUTIVE METRICS</span>
            <h3>The Executive Analytics Hub</h3>
            <p>
              High-level decision makers track macro statistics: average closure rates, heatmaps of infrastructural complaints, and departmental SLA performance.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
