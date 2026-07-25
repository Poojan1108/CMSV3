import React, { useState } from 'react';

export default function Features() {
  const [activeFeature, setActiveFeature] = useState(0);

  const featuresData = [
    {
      title: "Advanced AI Auto-Categorization",
      tagline: "CAPABILITIES",
      desc: "Automated tags identify issues instantly. Natural language understanding interprets citizen descriptions, preventing human routing errors and bottlenecked inboxes.",
      points: [
        "99% accuracy in routing categorization models",
        "Instantly flags toxic, unsafe, or irrelevant posts",
        "Connects automatically to regional legacy DBs"
      ],
      mockup: (
        <div className="feature-mockup-inner ai-categorization">
          <div className="mockup-header">
            <span className="mockup-dot red"></span>
            <span className="mockup-dot yellow"></span>
            <span className="mockup-dot green"></span>
            <span className="mockup-title">ResolveX Triage Engine</span>
          </div>
          <div className="mockup-body">
            <div className="input-field-mock">
              <span className="field-label">Citizen Description Input</span>
              <div className="field-value">
                "Water mains burst on Lincoln St, flooding basements."
              </div>
            </div>
            
            <div className="ai-processing-node">
              <div className="pulse-ring"></div>
              <div className="ai-node-content">
                <span className="node-icon">⚙</span>
                <span>Analyzing Taxonomy...</span>
              </div>
            </div>

            <div className="routing-results">
              <div className="route-item route-inactive">
                <span className="route-name">Transit Dept</span>
                <span className="match-pct">4%</span>
              </div>
              <div className="route-item active-route">
                <span className="route-name">Water & Sewer</span>
                <span className="match-pct glow-text">96% Match</span>
              </div>
              <div className="route-item route-inactive">
                <span className="route-name">Sanitation Dept</span>
                <span className="match-pct">0%</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "SLA Compliance & Escalations",
      tagline: "TIMELINES",
      desc: "Set strict, enforceable timelines based on incident type. ResolveX automatically escalates overdue complaints to senior managers to keep citizens moving.",
      points: [
        "Visual alerts for expiring response windows",
        "Automated multi-tier notification hierarchies",
        "Comprehensive performance statistics by department"
      ],
      mockup: (
        <div className="feature-mockup-inner sla-monitoring">
          <div className="mockup-header">
            <span className="mockup-dot red"></span>
            <span className="mockup-dot yellow"></span>
            <span className="mockup-dot green"></span>
            <span className="mockup-title">Active SLA Monitor</span>
          </div>
          <div className="mockup-body">
            <div className="sla-progress-bars">
              <div className="progress-item">
                <div className="progress-labels">
                  <span>P1 Critical (Roads)</span>
                  <span className="progress-pct expired">105% Overdue</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill red-fill" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div className="progress-item">
                <div className="progress-labels">
                  <span>P2 Normal (Sanitation)</span>
                  <span className="progress-pct warning">60% Elapsed</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill yellow-fill" style={{ width: '60%' }}></div>
                </div>
              </div>

              <div className="progress-item">
                <div className="progress-labels">
                  <span>P3 Low (Parks)</span>
                  <span className="progress-pct success">20% Elapsed</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill green-fill" style={{ width: '20%' }}></div>
                </div>
              </div>
            </div>

            <div className="escalation-alert-card">
              <div className="alert-badge">▲ ESCALATION TRIGGERED</div>
              <p className="alert-msg">Ticket #9482 exceeded 24-hr response SLA. Automatic notification dispatched to Department Chief.</p>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <section className="section-features" id="features">
      <div className="container text-center reveal-on-scroll">
        <span className="section-tag">CAPABILITIES</span>
        <h2 className="section-title">Built for Modern Governance</h2>
      </div>

      <div className="container feature-hub-container reveal-on-scroll">
        {/* Left Side: Selectors */}
        <div className="feature-selectors">
          {featuresData.map((feature, idx) => (
            <div 
              key={idx} 
              className={`feature-selector-card ${activeFeature === idx ? 'active' : ''}`}
              onClick={() => setActiveFeature(idx)}
            >
              <span className="feature-card-tag">{feature.tagline}</span>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
              
              <ul className="feature-card-list">
                {feature.points.map((pt, pIdx) => (
                  <li key={pIdx}>{pt}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Right Side: Interactive Mockup Panel */}
        <div className="feature-mockup-panel">
          {featuresData[activeFeature].mockup}
        </div>
      </div>
    </section>
  );
}
