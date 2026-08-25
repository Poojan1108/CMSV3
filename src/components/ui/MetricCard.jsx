import React from 'react';

/**
 * Metric/stat card.
 * - `onClick` / `isActive` turn it into a filter toggle.
 * - `tone` maps to bg-tone-* helpers (accent|success|warning|danger|info|neutral).
 */
export default function MetricCard({
  icon: Icon,
  label,
  value,
  tone = 'neutral',
  onClick,
  isActive = false,
}) {
  const clickable = typeof onClick === 'function';
  const className = `metric-card${clickable ? ' is-clickable' : ''}${isActive ? ' is-active' : ''}`;

  const body = (
    <>
      {Icon && (
        <div className={`metric-icon bg-tone-${tone}`}>
          <Icon size={19} />
        </div>
      )}
      <div>
        <div className="metric-value">{value}</div>
        <div className="metric-label">{label}</div>
      </div>
    </>
  );

  if (clickable) {
    return (
      <button type="button" className={className} onClick={onClick} aria-pressed={isActive}>
        {body}
      </button>
    );
  }

  return <div className={className}>{body}</div>;
}
