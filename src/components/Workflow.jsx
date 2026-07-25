import React, { useState, useEffect, useRef } from 'react';

export default function Workflow() {
  const containerRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [activeItems, setActiveItems] = useState([]);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      
      // Calculate vertical scroll progress relative to active item trigger points
      const trigger = vh * 0.6; // Matches the point where timeline cards become active
      const start = rect.top;
      const totalDist = rect.height - 150; // Approximates the distance between first and last item
      const currentDist = trigger - start;
      
      let p = 0;
      if (totalDist > 0) {
        p = Math.max(0, Math.min(1, currentDist / totalDist));
      }
      setProgress(p);

      // Check which items are active
      const items = containerRef.current.querySelectorAll('.timeline-item');
      const activeIdx = [];
      items.forEach((item, index) => {
        const itemRect = item.getBoundingClientRect();
        if (itemRect.top < vh * 0.6) {
          activeIdx.push(index);
        }
      });
      setActiveItems(activeIdx);
    };

    window.addEventListener('scroll', handleScroll);
    // Trigger initial check
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const timelineData = [
    {
      num: 1,
      title: "Citizen Files Request",
      desc: "A resident uploads photos, writes a description, and sets geo-coordinates on the Portal mobile or web application.",
      badge: "Intake"
    },
    {
      num: 2,
      title: "AI Verification & Categorization",
      desc: "Our algorithms cross-check database duplicates, sanitize media files, parse categorization models, and draft recommendations.",
      badge: "ResolveX AI Engine",
      isAi: true
    },
    {
      num: 3,
      title: "Department Queue Routing",
      desc: "The complaint routes directly to the specific department (Water, Transit, Sanitation) and gets grouped by urgency score.",
      badge: "Triage"
    },
    {
      num: 4,
      title: "Officer Assignment & Inspection",
      desc: "The local field officer receives a notification on their specialized field tablet, details the actions, and updates inspectors.",
      badge: "Operations"
    },
    {
      num: 5,
      title: "Resolution & Verification",
      desc: "Upon completing the work, officers log photo proof. ResolveX alerts the citizen to confirm the fix before closing the ticket.",
      badge: "Complete",
      isSuccess: true
    },
    {
      num: 6,
      title: "Citizen Notification",
      desc: "A confirmation notification is pushed to the citizen via SMS and Email along with a link to feedback survey forms.",
      badge: "Notification"
    }
  ];

  return (
    <section className="section-workflow" id="workflow">
      <div className="container text-center reveal-on-scroll">
        <span className="section-tag">THE LIFECYCLE</span>
        <h2 className="section-title">End-to-End Workflow Pipeline</h2>
        <p className="section-subtitle">
          Watch a complaint move from filing to active resolution across our automated architecture.
        </p>
      </div>

      <div className="container timeline-container" ref={containerRef}>
        {/* Connecting Line that Grows on Scroll */}
        <div className="timeline-line-bg">
          <div className="timeline-line-fill" style={{ height: `${progress * 100}%` }}></div>
        </div>

        {timelineData.map((item, idx) => (
          <div key={idx} className={`timeline-item ${activeItems.includes(idx) ? 'active' : ''}`}>
            <div className="timeline-num">{item.num}</div>
            <div className="timeline-content-card">
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
              <span className={`badge ${item.isAi ? 'badge-ai' : ''} ${item.isSuccess ? 'success-badge' : ''}`}>
                {item.badge}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
