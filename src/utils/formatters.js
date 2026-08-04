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
  return {
    bg: `status-${status || 'default'}`,
    text: '',
    border: '',
    dot: 'status-dot',
  };
};

/**
 * Returns custom badge classes for a given priority level.
 * @param {string} priority
 * @returns {{ bg: string, text: string, border: string }}
 */
export const getPriorityBadgeColor = (priority) => {
  return {
    bg: `priority-${priority || 'default'}`,
    text: '',
    border: '',
  };
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


