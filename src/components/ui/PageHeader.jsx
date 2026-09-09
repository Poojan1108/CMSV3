import React from 'react';

/** Standard page header: optional breadcrumb, eyebrow chip, title, description, actions. */
export default function PageHeader({ eyebrow, icon, title, description, breadcrumb, actions }) {
  return (
    <header className="page-header">
      <div style={{ minWidth: 0, width: '100%' }}>
        {breadcrumb}
        {eyebrow && (
          <div>
            <span className="eyebrow">
              {icon}
              {eyebrow}
            </span>
          </div>
        )}
        <h1 className="page-title" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>{title}</h1>
        {description && <p className="page-desc" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

/** Breadcrumb back-link row. */
export function Breadcrumb({ to, onNavigate, children }) {
  return (
    <nav className="page-breadcrumb" style={{ marginBottom: 8 }} aria-label="Breadcrumb">
      <a
        href={to}
        className="breadcrumb-link"
        onClick={(e) => {
          e.preventDefault();
          onNavigate?.();
        }}
      >
        {children}
      </a>
    </nav>
  );
}
