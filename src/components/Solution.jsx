import React, { useState, useEffect } from 'react';

export default function Solution() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setCurrentSlide((prev) => prev + 1);
    }, 6500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentSlide === 3) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentSlide(0);
      }, 4500); // 4500ms is the duration of our linear transition

      return () => clearTimeout(timer);
    }
  }, [currentSlide]);

  useEffect(() => {
    if (currentSlide === 0 && !isTransitioning) {
      const timer = setTimeout(() => {
        setIsTransitioning(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [currentSlide, isTransitioning]);

  const goToSlide = (index) => {
    setIsTransitioning(true);
    setCurrentSlide(index);
  };

  return (
    <div className="solution-scroll-wrapper" id="solution">
      <section className="section-solution">
      <div className="container text-center reveal-on-scroll">
        <span className="section-tag">THE SOLUTION</span>
        <h2 className="section-title">One Platform. Every Department.<br/><span className="highlight-blue">Complete Transparency.</span></h2>
      </div>
 
      {/* Large Browser Showcase */}
      <div className="container browser-showcase-container reveal-on-scroll">
        <div className="mock-browser-frame">
          <div className="browser-header">
            <div className="browser-dots">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
            </div>
            <div className="browser-address-bar">https://app.resolvex.gov</div>
          </div>
          {/* Horizontal Gallery Slider */}
          <div className="gallery-slider-wrapper">
            <div 
              className="gallery-slides" 
              style={{ 
                width: '400%',
                transform: `translateX(-${currentSlide * 25}%)`,
                transition: isTransitioning ? 'transform 4.5s linear' : 'none'
              }}
            >
              {/* Slide 1 */}
              <div className="gallery-slide" style={{ width: '25%', flex: '0 0 25%' }}>
                <div className="slide-grid">
                  <div className="slide-content">
                    <span className="slide-index">01 / CITIZEN INTAKE</span>
                    <h3 className="slide-title">Smart, Frictionless Filing</h3>
                    <p className="slide-desc">
                      Citizens lodge complaints through an intuitive portal. Automated drop-downs, location pins, and media attachments eliminate error and capture precise inputs.
                    </p>
                  </div>
                  <div className="slide-visual">
                    <div className="app-ui-mockup">
                      <div className="ui-card">
                        <div className="ui-card-header">File New Complaint</div>
                        <div className="ui-form-group">
                          <label>Category</label>
                          <div className="ui-input-mock">Infrastructure & Roads</div>
                        </div>
                        <div className="ui-form-group">
                          <label>Location</label>
                          <div className="ui-input-mock pin-icon">742 Evergreen Terrace, Sector 4</div>
                        </div>
                        <div className="ui-form-group">
                          <label>Description</label>
                          <div className="ui-textarea-mock">Pothole causing traffic bottlenecks at the intersection. Needs repair before monsoon.</div>
                        </div>
                        <button className="ui-btn-mock" onClick={(e) => e.preventDefault()}>Submit to Portal</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slide 2 */}
              <div className="gallery-slide" style={{ width: '25%', flex: '0 0 25%' }}>
                <div className="slide-grid">
                  <div className="slide-content">
                    <span className="slide-index">02 / AI CLASSIFICATION</span>
                    <h3 className="slide-title">Instant AI Sorting & Routing</h3>
                    <p className="slide-desc">
                      ResolveX NLP engine reads, indexes, checks duplicates, and immediately routes the complaint to the specific officer in charge, bypassing weeks of manual triage.
                    </p>
                  </div>
                  <div className="slide-visual">
                    <div className="app-ui-mockup">
                      <div className="ui-card ai-card-highlight">
                        <div className="ui-card-header">AI Verification Pipeline</div>
                        <div className="ai-confidence-meter">
                          <span>NLP Category Match Confidence:</span>
                          <span className="conf-badge">98.4%</span>
                        </div>
                        <div className="log-triage">
                          <div className="log-line highlight-emerald">&gt; Analyzing description keywords...</div>
                          <div className="log-line highlight-emerald">&gt; Match: [Pothole] -&gt; Public Works</div>
                          <div className="log-line highlight-emerald">&gt; Match: [Sector 4] -&gt; Ward 12 Unit</div>
                          <div className="log-line highlight-blue">&gt; Action: Auto-assigning to Officer R. Davis</div>
                        </div>
                        <div className="status-indicator">Triaging Complete</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slide 3 */}
              <div className="gallery-slide" style={{ width: '25%', flex: '0 0 25%' }}>
                <div className="slide-grid">
                  <div className="slide-content">
                    <span className="slide-index">03 / REAL-TIME TRACKING</span>
                    <h3 className="slide-title">Sovereign Transparency</h3>
                    <p className="slide-desc">
                      Both departments and citizens look at the exact same dashboard. Citizens receive notifications for every state transition, building deep administrative trust.
                    </p>
                  </div>
                  <div className="slide-visual">
                    <div className="app-ui-mockup">
                      <div className="ui-card">
                        <div className="ui-card-header">Complaint Status Tracker</div>
                        <div className="tracker-timeline">
                          <div className="tracker-step completed">
                            <span className="check-dot">✓</span>
                            <div className="step-info">
                              <h4>Filed Successfully</h4>
                              <p>July 11, 10:30 AM</p>
                            </div>
                          </div>
                          <div className="tracker-step completed">
                            <span className="check-dot">✓</span>
                            <div className="step-info">
                              <h4>Assigned to Public Works</h4>
                              <p>July 11, 10:31 AM</p>
                            </div>
                          </div>
                          <div className="tracker-step current">
                            <span className="check-dot pulsing-blue">●</span>
                            <div className="step-info">
                              <h4>Inspection Scheduled</h4>
                              <p>Officer R. Davis assigned</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slide 4 (Cloned Slide 1 for seamless infinite loop) */}
              <div className="gallery-slide" style={{ width: '25%', flex: '0 0 25%' }}>
                <div className="slide-grid">
                  <div className="slide-content">
                    <span className="slide-index">01 / CITIZEN INTAKE</span>
                    <h3 className="slide-title">Smart, Frictionless Filing</h3>
                    <p className="slide-desc">
                      Citizens lodge complaints through an intuitive portal. Automated drop-downs, location pins, and media attachments eliminate error and capture precise inputs.
                    </p>
                  </div>
                  <div className="slide-visual">
                    <div className="app-ui-mockup">
                      <div className="ui-card">
                        <div className="ui-card-header">File New Complaint</div>
                        <div className="ui-form-group">
                          <label>Category</label>
                          <div className="ui-input-mock">Infrastructure & Roads</div>
                        </div>
                        <div className="ui-form-group">
                          <label>Location</label>
                          <div className="ui-input-mock pin-icon">742 Evergreen Terrace, Sector 4</div>
                        </div>
                        <div className="ui-form-group">
                          <label>Description</label>
                          <div className="ui-textarea-mock">Pothole causing traffic bottlenecks at the intersection. Needs repair before monsoon.</div>
                        </div>
                        <button className="ui-btn-mock" onClick={(e) => e.preventDefault()}>Submit to Portal</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Slide Navigations */}
            <div className="gallery-nav-dots">
              <span className={`g-dot ${currentSlide === 0 || currentSlide === 3 ? 'active' : ''}`} onClick={() => goToSlide(0)}></span>
              <span className={`g-dot ${currentSlide === 1 ? 'active' : ''}`} onClick={() => goToSlide(1)}></span>
              <span className={`g-dot ${currentSlide === 2 ? 'active' : ''}`} onClick={() => goToSlide(2)}></span>
            </div>
          </div>
        </div>
      </div>
    </section>
    </div>
  );
}
