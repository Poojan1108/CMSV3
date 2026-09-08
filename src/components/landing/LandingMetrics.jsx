import React from 'react';
import { Users, Clock, Star, Building2 } from 'lucide-react';

const METRICS_DATA = [
  {
    icon: Users,
    iconColor: '#3b82f6',
    bgColor: '#eff6ff',
    value: '50K+',
    label: 'Issues Resolved',
  },
  {
    icon: Clock,
    iconColor: '#10b981',
    bgColor: '#ecfdf5',
    value: '99%',
    label: 'On-time SLA',
  },
  {
    icon: Star,
    iconColor: '#f59e0b',
    bgColor: '#fffbeb',
    value: '4.8/5',
    label: 'User Satisfaction',
  },
  {
    icon: Building2,
    iconColor: '#64748b',
    bgColor: '#f1f5f9',
    value: '200+',
    label: 'Communities',
  },
];

export default function LandingMetrics() {
  return (
    <section className="rx-section rx-metrics-section">
      <div className="rx-container">
        <div className="rx-section-header-center">
          <span className="rx-section-badge">REAL IMPACT, STRONGER COMMUNITIES</span>
        </div>

        <div className="rx-metrics-grid">
          {METRICS_DATA.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="rx-metric-tile">
                <div
                  className="rx-metric-icon-wrap"
                  style={{ backgroundColor: item.bgColor, color: item.iconColor }}
                >
                  <Icon size={24} />
                </div>
                <div className="rx-metric-info">
                  <span className="rx-metric-val">{item.value}</span>
                  <span className="rx-metric-lbl">{item.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
