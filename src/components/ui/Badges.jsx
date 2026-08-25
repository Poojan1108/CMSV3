import React from 'react';
import { AlertTriangle, Clock, ShieldCheck } from 'lucide-react';
import { STATUS_LABELS, PRIORITY_LABELS } from '../../utils/constants';

/** Status pill with tone derived from status key. */
export function StatusBadge({ status }) {
  const label = STATUS_LABELS[status] || status;
  return (
    <span className={`badge status-${status || 'default'}`}>
      <span className="badge-dot" />
      {label}
    </span>
  );
}

/** Priority pill. */
export function PriorityBadge({ priority }) {
  const label = PRIORITY_LABELS[priority] || priority;
  return <span className={`badge priority-${priority || 'low'}`}>{label}</span>;
}

/**
 * SLA pill. Accepts the object returned by getSlaStatus().
 * Renders nothing when SLA data is unavailable.
 */
export function SlaBadge({ sla, showIcon = true }) {
  if (!sla) return null;

  const tone = sla.isBreached ? 'sla-breached' : sla.isWarning ? 'sla-warning' : 'sla-ok';
  const Icon = sla.isBreached ? AlertTriangle : Clock;

  return (
    <span className={`badge ${tone}`} title={`SLA target: ${sla.limitHours}h max turnaround`}>
      {showIcon && <Icon size={12} />}
      {sla.badgeText}
    </span>
  );
}

/** Monospace ticket id chip with optional copy affordance handled by parent. */
export function TicketId({ id }) {
  return <span className="ticket-id">{id}</span>;
}

/** Small neutral category tag. */
export function Tag({ children }) {
  return <span className="tag">{children}</span>;
}

/** SLA completion indicator used on closed tickets. */
export function SlaDoneIcon({ sla }) {
  if (!sla?.isCompleted) return null;
  return sla.isBreached ? (
    <AlertTriangle size={13} className="tone-danger" />
  ) : (
    <ShieldCheck size={13} className="tone-success" />
  );
}
