import React from 'react';

/** Centered empty-state panel with icon, title, description and optional actions. */
export default function EmptyState({ icon: Icon, title, description, children }) {
  return (
    <div className="empty-state">
      {Icon && <Icon size={36} className="empty-icon" />}
      <h3 className="empty-title">{title}</h3>
      {description && <p className="empty-desc">{description}</p>}
      {children && <div className="empty-actions">{children}</div>}
    </div>
  );
}

/** Centered loading panel with spinner. */
export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  );
}
