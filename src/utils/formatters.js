import { STATUSES, PRIORITIES } from './constants.js';

/**
 * Generates a formatted ticket ID.
 * @param {number} sequenceNumber - Sequential number or count.
 * @param {number} year - Optional year, defaults to current year.
 * @returns {string} e.g. "CMS-2026-1001"
 */
export const generateTicketId = (sequenceNumber = 1, year = new Date().getFullYear()) => {
  const paddedNumber = String(sequenceNumber).padStart(4, '0');
  return `CMS-${year}-${paddedNumber}`;
};

/**
 * Formats an ISO or timestamp string into a human-readable date and time.
 * @param {string|Date} dateInput
 * @returns {string} e.g. "Jul 23, 2026, 01:15 PM"
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return 'N/A';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Invalid Date';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

/**
 * Formats a timestamp into a relative time string (e.g., "5 mins ago", "2 hours ago", "Yesterday").
 * @param {string|Date} dateInput
 * @returns {string}
 */
export const formatRelativeTime = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays}d ago`;
  }
  return formatDate(dateInput);
};

/**
 * Returns Tailwind badge classes for a given status.
 * @param {string} status
 * @returns {{ bg: string, text: string, border: string, dot: string }}
 */
export const getStatusBadgeColor = (status) => {
  switch (status) {
    case STATUSES.PENDING:
      return {
        bg: 'bg-amber-500/10 dark:bg-amber-500/20',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-500/30',
        dot: 'bg-amber-500',
      };
    case STATUSES.IN_PROGRESS:
      return {
        bg: 'bg-blue-500/10 dark:bg-blue-500/20',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-500/30',
        dot: 'bg-blue-500',
      };
    case STATUSES.RESOLVED:
      return {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-500/30',
        dot: 'bg-emerald-500',
      };
    case STATUSES.REJECTED:
      return {
        bg: 'bg-rose-500/10 dark:bg-rose-500/20',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-500/30',
        dot: 'bg-rose-500',
      };
    default:
      return {
        bg: 'bg-slate-500/10 dark:bg-slate-500/20',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-500/30',
        dot: 'bg-slate-500',
      };
  }
};

/**
 * Returns Tailwind badge classes for a given priority level.
 * @param {string} priority
 * @returns {{ bg: string, text: string, border: string }}
 */
export const getPriorityBadgeColor = (priority) => {
  switch (priority) {
    case PRIORITIES.LOW:
      return {
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-600 dark:text-slate-400',
        border: 'border-slate-300 dark:border-slate-700',
      };
    case PRIORITIES.MEDIUM:
      return {
        bg: 'bg-sky-100 dark:bg-sky-950/60',
        text: 'text-sky-700 dark:text-sky-300',
        border: 'border-sky-300 dark:border-sky-800',
      };
    case PRIORITIES.HIGH:
      return {
        bg: 'bg-orange-100 dark:bg-orange-950/60',
        text: 'text-orange-700 dark:text-orange-300',
        border: 'border-orange-300 dark:border-orange-800',
      };
    case PRIORITIES.URGENT:
      return {
        bg: 'bg-red-100 dark:bg-red-950/60',
        text: 'text-red-700 dark:text-red-300',
        border: 'border-red-300 dark:border-red-800',
      };
    default:
      return {
        bg: 'bg-gray-100 dark:bg-gray-800',
        text: 'text-gray-600 dark:text-gray-400',
        border: 'border-gray-300 dark:border-gray-700',
      };
  }
};

/**
 * Calculates SLA status for a complaint.
 * Thresholds: Urgent = 4h, High = 24h, Medium/Low = 48h
 */
export const getSlaStatus = (complaint) => {
  if (!complaint || !complaint.createdAt) {
    return { isBreached: false, badgeText: 'SLA N/A', remainingHours: 0, elapsedHours: 0, limitHours: 48 };
  }

  const isCompleted = complaint.status === STATUSES.RESOLVED || complaint.status === STATUSES.REJECTED;

  let limitHours = 48;
  if (complaint.priority === PRIORITIES.URGENT) {
    limitHours = 4;
  } else if (complaint.priority === PRIORITIES.HIGH) {
    limitHours = 24;
  } else if (complaint.priority === PRIORITIES.MEDIUM || complaint.priority === PRIORITIES.LOW) {
    limitHours = 48;
  }

  const createdTime = new Date(complaint.createdAt).getTime();
  const endTime = isCompleted && complaint.updatedAt ? new Date(complaint.updatedAt).getTime() : Date.now();
  const elapsedMs = endTime - createdTime;
  const elapsedHours = Math.max(0, elapsedMs / (1000 * 60 * 60));
  const remainingHours = limitHours - elapsedHours;
  const isBreached = elapsedHours > limitHours;
  const isWarning = !isCompleted && !isBreached && remainingHours <= limitHours * 0.3;

  let badgeText = '';
  if (isCompleted) {
    badgeText = isBreached
      ? `SLA Exceeded (+${Math.ceil(elapsedHours - limitHours)}h)`
      : `SLA Compliant (${Math.round(elapsedHours)}h)`;
  } else if (isBreached) {
    const overdueHours = Math.ceil(elapsedHours - limitHours);
    badgeText = `SLA Breached (+${overdueHours}h)`;
  } else if (remainingHours < 1) {
    const remainingMins = Math.max(1, Math.round(remainingHours * 60));
    badgeText = `SLA: ${remainingMins}m remaining`;
  } else {
    badgeText = `SLA: ${Math.round(remainingHours)}h remaining`;
  }

  return {
    limitHours,
    elapsedHours: Math.round(elapsedHours * 10) / 10,
    remainingHours: Math.round(remainingHours * 10) / 10,
    isBreached,
    isWarning,
    isCompleted,
    badgeText,
  };
};

/**
 * Generates a formatted RFC 4180 compliant CSV string from an array of complaint objects.
 * @param {Array} complaints - Array of complaint objects
 * @returns {string} CSV formatted string with header and quoted/escaped values
 */
export const generateComplaintsCSV = (complaints = []) => {
  const headers = [
    'Ticket ID',
    'Title',
    'Category',
    'Priority',
    'Status',
    'Location',
    'Created At',
    'Updated At',
    'Student Name',
    'Student RollNo',
    'Assigned Staff',
  ];

  if (!Array.isArray(complaints) || complaints.length === 0) {
    return headers.join(',');
  }

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const rows = complaints.map((c) => {
    const studentName = c.student?.name || '';
    const studentRollNo = c.student?.rollNo || '';
    const assignedStaff = c.assignedTo?.name || 'Unassigned';

    return [
      escapeCSV(c.id),
      escapeCSV(c.title),
      escapeCSV(c.category),
      escapeCSV(c.priority),
      escapeCSV(c.status),
      escapeCSV(c.location),
      escapeCSV(c.createdAt),
      escapeCSV(c.updatedAt),
      escapeCSV(studentName),
      escapeCSV(studentRollNo),
      escapeCSV(assignedStaff),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};


