import React from 'react';
import { ArrowRight } from 'lucide-react';
import PipelineMaintenanceArt from './PipelineMaintenanceArt';

const ROLES_DATA = [
  {
    id: 'students',
    title: 'Students & Residents',
    desc: 'Report issues, track progress, and confirm resolutions — all in one place.',
    linkText: 'A better living experience',
    svgGraphic: (
      <img
        src="/Group%20Chat-amico.svg"
        alt="Students & Residents"
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    ),
  },
  {
    id: 'staff',
    title: 'Staff & Technicians',
    desc: 'Receive and manage tasks, meet SLAs, and keep communities running smoothly.',
    linkText: 'Work smarter',
    svgGraphic: (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <PipelineMaintenanceArt />
      </div>
    ),
  },
  {
    id: 'admins',
    title: 'Management & Admins',
    desc: 'Get full visibility, ensure accountability, and drive better operational efficiency.',
    linkText: 'Greater control',
    svgGraphic: (
      <img
        src="/Admin-bro.svg"
        alt="Management & Admins"
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    ),
  },
];

export default function LandingRoles({ setView }) {
  return (
    <section className="rx-section rx-roles-section" id="campuses">
      <div className="rx-container">
        <div className="rx-section-header-center">
          <span className="rx-section-badge">BUILT FOR EVERYONE INVOLVED</span>
          <h2 className="rx-section-heading">Simple for users. Powerful for teams.</h2>
        </div>

        <div className="rx-roles-grid">
          {ROLES_DATA.map((role) => (
            <div key={role.id} className="rx-role-card">
              <div className="rx-role-graphic-box">
                {role.svgGraphic}
              </div>

              <h3 className="rx-role-title">{role.title}</h3>
              <p className="rx-role-desc">{role.desc}</p>

              <button
                type="button"
                className="rx-role-link-btn"
                onClick={() => setView('signup')}
              >
                <span>{role.linkText}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
