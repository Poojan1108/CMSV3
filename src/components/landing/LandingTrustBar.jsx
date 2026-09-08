import { GraduationCap, Building2, Building } from 'lucide-react';

const TRUST_SECTORS = [
  {
    icon: GraduationCap,
    iconColor: '#059669',
    bgColor: '#ecfdf5',
    title: 'Educational Campuses',
    subtitle: 'Students · Faculty · Staff',
  },
  {
    icon: Building2,
    iconColor: '#2563eb',
    bgColor: '#eff6ff',
    title: 'Residential Communities',
    subtitle: 'Residents · Management',
  },
  {
    icon: Building,
    iconColor: '#059669',
    bgColor: '#ecfdf5',
    title: 'Facilities & Commercial',
    subtitle: 'Tenants · Operations',
  },
];

export default function LandingTrustBar() {
  return (
    <section className="rx-trust-bar-section">
      <div className="rx-container">
        <h3 className="rx-trust-header">TRUSTED BY CAMPUSES, COMMUNITIES AND FACILITIES</h3>

        <div className="rx-trust-grid">
          {TRUST_SECTORS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="rx-trust-card">
                <div
                  className="rx-trust-icon-box"
                  style={{ backgroundColor: item.bgColor, color: item.iconColor }}
                >
                  <Icon size={22} strokeWidth={2} />
                </div>
                <div className="rx-trust-card-text">
                  <h4 className="rx-trust-card-title">{item.title}</h4>
                  <p className="rx-trust-card-sub">{item.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
