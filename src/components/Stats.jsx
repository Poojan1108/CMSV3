import React, { useState, useEffect, useRef } from 'react';

function StatCard({ target, label, suffix, isDecimal }) {
  const [value, setValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          triggerCountAnimation();
        }
      });
    }, { threshold: 0.2 });

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  const triggerCountAnimation = () => {
    let startVal = 0;
    const duration = 1500; // 1.5 seconds
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Quadratic ease-out
      const easeProgress = progress * (2 - progress);
      const currentVal = startVal + easeProgress * (target - startVal);
      
      setValue(currentVal);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setValue(target);
      }
    };

    requestAnimationFrame(animate);
  };

  const displayValue = isDecimal ? value.toFixed(1) : Math.floor(value);

  return (
    <div className="stat-card reveal-on-scroll" ref={cardRef}>
      <div className="stat-number">
        {displayValue}
        {suffix}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function Stats() {
  return (
    <section className="section-stats" id="stats">
      <div className="container grid grid-4">
        <StatCard target={98} label="Resolution Accuracy" suffix="%" />
        <StatCard target={12} label="Complaints Processed" suffix="K+" />
        <StatCard target={2.1} label="Day Average Resolution" suffix="" isDecimal={true} />
        <StatCard target={18} label="Departments Integrated" suffix="" />
      </div>
    </section>
  );
}
