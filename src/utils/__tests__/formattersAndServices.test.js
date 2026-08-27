import { generateTicketId, formatDate, formatRelativeTime, getSlaStatus, generateComplaintsCSV } from '../formatters.js';
import { complaintService } from '../../services/complaintService.js';
import { STATUSES, PRIORITIES, ROLES } from '../constants.js';

// Setup Mock LocalStorage for Node environment
class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  clear() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  get length() {
    return Object.keys(this.store).length;
  }
  key(i) {
    return Object.keys(this.store)[i] || null;
  }
}

global.localStorage = new LocalStorageMock();
global.window = global;

// Lightweight test framework runner
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function describe(suiteName, fn) {
  console.log(`\n=== ${suiteName} ===`);
  fn();
}

function test(testName, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${testName}`);
  } catch (error) {
    failedTests++;
    console.error(`  ✗ ${testName}`);
    console.error(`    Error: ${error.message}`);
  }
}

function expect(actual) {
  const matchers = {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
      }
    },
    toEqual(expected) {
      const a = JSON.stringify(actual);
      const e = JSON.stringify(expected);
      if (a !== e) {
        throw new Error(`Expected ${e}, but got ${a}`);
      }
    },
    toBeGreaterThan(expected) {
      if (actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    },
    toBeLessThan(expected) {
      if (actual >= expected) {
        throw new Error(`Expected ${actual} to be less than ${expected}`);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected ${actual} to be truthy`);
      }
    },
    toBeFalsy() {
      if (actual) {
        throw new Error(`Expected ${actual} to be falsy`);
      }
    },
    toBeNull() {
      if (actual !== null) {
        throw new Error(`Expected null, but got ${JSON.stringify(actual)}`);
      }
    },
    toContain(expected) {
      if (typeof actual === 'string') {
        if (!actual.includes(expected)) {
          throw new Error(`Expected string "${actual}" to contain "${expected}"`);
        }
      } else if (Array.isArray(actual)) {
        if (!actual.includes(expected)) {
          throw new Error(`Expected array to contain ${JSON.stringify(expected)}`);
        }
      } else {
        throw new Error(`Unsupported type for toContain assertion`);
      }
    },
  };

  matchers.not = {
    toBe(expected) {
      if (actual === expected) {
        throw new Error(`Expected value NOT to be ${JSON.stringify(expected)}`);
      }
    },
    toContain(expected) {
      if (typeof actual === 'string' && actual.includes(expected)) {
        throw new Error(`Expected string "${actual}" NOT to contain "${expected}"`);
      }
    },
  };

  return matchers;
}

// SUITE 1: Ticket ID Generation
describe('1. Ticket ID Generator Tests', () => {
  test('generates formatted ticket ID with default sequence and current year', () => {
    const currentYear = new Date().getFullYear();
    const id = generateTicketId();
    expect(id).toBe(`CMS-${currentYear}-0001`);
  });

  test('formats custom sequence numbers with 4-digit zero padding', () => {
    expect(generateTicketId(1, 2026)).toBe('CMS-2026-0001');
    expect(generateTicketId(42, 2026)).toBe('CMS-2026-0042');
    expect(generateTicketId(999, 2026)).toBe('CMS-2026-0999');
    expect(generateTicketId(1005, 2026)).toBe('CMS-2026-1005');
  });

  test('handles boundary sequence numbers (0, 9999, >9999)', () => {
    expect(generateTicketId(0, 2026)).toBe('CMS-2026-0000');
    expect(generateTicketId(9999, 2026)).toBe('CMS-2026-9999');
    expect(generateTicketId(10000, 2026)).toBe('CMS-2026-10000');
  });

  test('formats custom year parameter', () => {
    expect(generateTicketId(101, 2025)).toBe('CMS-2025-0101');
    expect(generateTicketId(500, 2030)).toBe('CMS-2030-0500');
  });
});

// SUITE 2: Relative Time Formatter
describe('2. Relative Time Formatter Tests', () => {
  test('returns "Just now" for timestamps under 60 seconds', () => {
    const nowISO = new Date().toISOString();
    const thirtySecAgoISO = new Date(Date.now() - 30 * 1000).toISOString();
    const fiftyNineSecAgoISO = new Date(Date.now() - 59 * 1000).toISOString();

    expect(formatRelativeTime(nowISO)).toBe('Just now');
    expect(formatRelativeTime(thirtySecAgoISO)).toBe('Just now');
    expect(formatRelativeTime(fiftyNineSecAgoISO)).toBe('Just now');
  });

  test('returns minutes ago format for times under 60 minutes', () => {
    const oneMinAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const fiftyNineMinAgo = new Date(Date.now() - 59 * 60 * 1000).toISOString();

    expect(formatRelativeTime(oneMinAgo)).toBe('1m ago');
    expect(formatRelativeTime(fiveMinAgo)).toBe('5m ago');
    expect(formatRelativeTime(fiftyNineMinAgo)).toBe('59m ago');
  });

  test('returns hours ago format for times under 24 hours', () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const twentyThreeHoursAgo = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString();

    expect(formatRelativeTime(oneHourAgo)).toBe('1h ago');
    expect(formatRelativeTime(twoHoursAgo)).toBe('2h ago');
    expect(formatRelativeTime(twentyThreeHoursAgo)).toBe('23h ago');
  });

  test('returns days ago format for times under 30 days', () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const twentyNineDaysAgo = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString();

    expect(formatRelativeTime(oneDayAgo)).toBe('1d ago');
    expect(formatRelativeTime(threeDaysAgo)).toBe('3d ago');
    expect(formatRelativeTime(twentyNineDaysAgo)).toBe('29d ago');
  });

  test('falls back to formatted absolute date string for dates > 30 days old', () => {
    const thirtyFiveDaysAgo = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString();
    const result = formatRelativeTime(thirtyFiveDaysAgo);
    expect(result).not.toBe('');
    expect(result).not.toContain('ago');
  });

  test('handles invalid, null, and empty date inputs gracefully with fallback', () => {
    expect(formatRelativeTime(null)).toBe('');
    expect(formatRelativeTime(undefined)).toBe('');
    expect(formatRelativeTime('')).toBe('');
    expect(formatRelativeTime('invalid-date-string')).toBe('');
  });
});

// SUITE 3: Complaint Service - create()
describe('3. Complaint Service: create()', () => {
  test('validates required fields, sets defaults, generates ticket ID, and persists to LocalStorage', () => {
    complaintService.resetToSeedData();

    const inputData = {
      title: 'Water Leakage in Lab',
      description: 'Pipe broken in Chemistry Lab',
      category: 'Maintenance',
    };

    const newTicket = complaintService.create(inputData);

    const currentYear = new Date().getFullYear();
    expect(newTicket.id).toBe(`CMS-${currentYear}-1006`);
    expect(newTicket.title).toBe('Water Leakage in Lab');
    expect(newTicket.description).toBe('Pipe broken in Chemistry Lab');
    expect(newTicket.category).toBe('Maintenance');
    expect(newTicket.priority).toBe(PRIORITIES.MEDIUM);
    expect(newTicket.status).toBe(STATUSES.PENDING);
    expect(newTicket.location).toBe('Hostel Block / Room No');
    expect(newTicket.student.id).toBe('usr_student_1');
    expect(newTicket.statusHistory.length).toBe(1);
    expect(newTicket.statusHistory[0].status).toBe(STATUSES.PENDING);
    expect(newTicket.comments).toEqual([]);

    // Check LocalStorage persistence
    const rawStorage = localStorage.getItem('cms_complaints_v1');
    expect(rawStorage).toBeTruthy();
    const storedList = JSON.parse(rawStorage);
    expect(storedList[0].id).toBe(`CMS-${currentYear}-1006`);
  });

  test('increments ticket ID sequence on subsequent creations', () => {
    complaintService.resetToSeedData();

    const ticket1 = complaintService.create({ title: 'Issue 1', description: 'Desc 1', category: 'General' });
    const ticket2 = complaintService.create({ title: 'Issue 2', description: 'Desc 2', category: 'General' });

    const currentYear = new Date().getFullYear();
    expect(ticket1.id).toBe(`CMS-${currentYear}-1006`);
    expect(ticket2.id).toBe(`CMS-${currentYear}-1007`);
  });
});

// SUITE 4: Complaint Service - getAll()
describe('4. Complaint Service: getAll()', () => {
  test('filters complaints by status', () => {
    complaintService.resetToSeedData();

    const pending = complaintService.getAll({ status: STATUSES.PENDING });
    expect(pending.length).toBe(2);
    expect(pending.every((item) => item.status === STATUSES.PENDING)).toBe(true);

    const inProgress = complaintService.getAll({ status: STATUSES.IN_PROGRESS });
    expect(inProgress.length).toBe(1);
    expect(inProgress[0].id).toBe('CMS-2026-1001');

    const resolved = complaintService.getAll({ status: STATUSES.RESOLVED });
    expect(resolved.length).toBe(1);
    expect(resolved[0].id).toBe('CMS-2026-1003');

    const rejected = complaintService.getAll({ status: STATUSES.REJECTED });
    expect(rejected.length).toBe(1);
    expect(rejected[0].id).toBe('CMS-2026-1004');
  });

  test('filters complaints by category', () => {
    complaintService.resetToSeedData();

    const wifiComplaints = complaintService.getAll({ category: 'IT & Wifi' });
    expect(wifiComplaints.length).toBe(1);
    expect(wifiComplaints[0].id).toBe('CMS-2026-1002');

    const sanitationComplaints = complaintService.getAll({ category: 'Sanitation' });
    expect(sanitationComplaints.length).toBe(1);
    expect(sanitationComplaints[0].id).toBe('CMS-2026-1005');
  });

  test('filters complaints by priority', () => {
    complaintService.resetToSeedData();

    const urgent = complaintService.getAll({ priority: PRIORITIES.URGENT });
    expect(urgent.length).toBe(1);
    expect(urgent[0].id).toBe('CMS-2026-1001');

    const high = complaintService.getAll({ priority: PRIORITIES.HIGH });
    expect(high.length).toBe(2);
  });

  test('filters complaints by search query', () => {
    complaintService.resetToSeedData();

    const matchTitle = complaintService.getAll({ search: 'restroom' });
    expect(matchTitle.length).toBe(1);
    expect(matchTitle[0].id).toBe('CMS-2026-1001');

    const matchId = complaintService.getAll({ search: '1003' });
    expect(matchId.length).toBe(1);
    expect(matchId[0].id).toBe('CMS-2026-1003');

    const matchStudent = complaintService.getAll({ search: 'Liam' });
    expect(matchStudent.length).toBe(2);

    const matchNone = complaintService.getAll({ search: 'nonexistenttermxyz' });
    expect(matchNone.length).toBe(0);
  });

  test('sorts complaints by date and priority', () => {
    complaintService.resetToSeedData();

    const newest = complaintService.getAll({ sortBy: 'newest' });
    expect(newest[0].createdAt >= newest[newest.length - 1].createdAt).toBe(true);

    const oldest = complaintService.getAll({ sortBy: 'oldest' });
    expect(oldest[0].createdAt <= oldest[oldest.length - 1].createdAt).toBe(true);

    const prioritySorted = complaintService.getAll({ sortBy: 'priority' });
    expect(prioritySorted[0].priority).toBe(PRIORITIES.URGENT);
  });
});

// SUITE 5: Complaint Service - updateStatus()
describe('5. Complaint Service: updateStatus()', () => {
  test('updates complaint status, appends audit log to statusHistory, and refreshes timestamp', () => {
    complaintService.resetToSeedData();

    const updated = complaintService.updateStatus(
      'CMS-2026-1002',
      STATUSES.IN_PROGRESS,
      { name: 'Sarah Jenkins' },
      'Technician dispatched to lab 3.'
    );

    expect(updated).toBeTruthy();
    expect(updated.status).toBe(STATUSES.IN_PROGRESS);

    const latestHistory = updated.statusHistory[updated.statusHistory.length - 1];
    expect(latestHistory.status).toBe(STATUSES.IN_PROGRESS);
    expect(latestHistory.updatedBy).toBe('Sarah Jenkins');
    expect(latestHistory.note).toBe('Technician dispatched to lab 3.');
    expect(latestHistory.timestamp).toBeTruthy();

    const fetched = complaintService.getById('CMS-2026-1002');
    expect(fetched.status).toBe(STATUSES.IN_PROGRESS);
  });

  test('handles string updater and provides default audit note if note is omitted', () => {
    complaintService.resetToSeedData();

    const updated = complaintService.updateStatus('CMS-2026-1005', STATUSES.RESOLVED, 'Admin Eleanor');

    expect(updated.status).toBe(STATUSES.RESOLVED);
    const latestHistory = updated.statusHistory[updated.statusHistory.length - 1];
    expect(latestHistory.updatedBy).toBe('Admin Eleanor');
    expect(latestHistory.note).toBe(`Status changed to ${STATUSES.RESOLVED}`);
  });

  test('returns null for non-existent complaint ID', () => {
    complaintService.resetToSeedData();
    const result = complaintService.updateStatus('CMS-9999-9999', STATUSES.RESOLVED, 'Admin');
    expect(result).toBeNull();
  });
});

// SUITE 6: Complaint Service - addComment()
describe('6. Complaint Service: addComment()', () => {
  test('adds public comment with sender metadata', () => {
    complaintService.resetToSeedData();

    const senderObj = { name: 'Alex Chen', role: ROLES.STUDENT, id: 'usr_student_1' };
    const updated = complaintService.addComment('CMS-2026-1001', senderObj, 'Any update on the plumber?', false);

    expect(updated).toBeTruthy();
    const addedComment = updated.comments[updated.comments.length - 1];
    expect(addedComment.senderName).toBe('Alex Chen');
    expect(addedComment.senderRole).toBe(ROLES.STUDENT);
    expect(addedComment.senderId).toBe('usr_student_1');
    expect(addedComment.text).toBe('Any update on the plumber?');
    expect(addedComment.isInternal).toBe(false);
  });

  test('adds internal note comment for staff', () => {
    complaintService.resetToSeedData();

    const staffObj = { name: 'Dr. Robert Vance', role: ROLES.STAFF, id: 'usr_staff_warden' };
    const updated = complaintService.addComment('CMS-2026-1001', staffObj, 'Internal note: part ordered.', true);

    const addedComment = updated.comments[updated.comments.length - 1];
    expect(addedComment.isInternal).toBe(true);
    expect(addedComment.senderRole).toBe(ROLES.STAFF);
  });

  test('rejects empty or whitespace-only comments', () => {
    complaintService.resetToSeedData();

    const senderObj = { name: 'Alex Chen', role: ROLES.STUDENT, id: 'usr_student_1' };
    expect(complaintService.addComment('CMS-2026-1001', senderObj, '', false)).toBeNull();
    expect(complaintService.addComment('CMS-2026-1001', senderObj, '   ', false)).toBeNull();
    expect(complaintService.addComment('CMS-2026-1001', senderObj, null, false)).toBeNull();
  });

  test('returns null when adding comment to non-existent ticket ID', () => {
    complaintService.resetToSeedData();
    expect(complaintService.addComment('CMS-9999-9999', 'Alex', 'Test comment')).toBeNull();
  });
});

// SUITE 7: Complaint Service - getStats()
describe('7. Complaint Service: getStats()', () => {
  test('calculates accurate aggregate metrics from complaints dataset', () => {
    complaintService.resetToSeedData();

    const stats = complaintService.getStats();
    expect(stats.total).toBe(6);
    expect(stats.pending).toBe(2);
    expect(stats.inProgress).toBe(1);
    expect(stats.resolved).toBe(1);
    expect(stats.rejected).toBe(1);
    expect(stats.urgent).toBe(1);
  });

  test('updates stats dynamically when new tickets are created', () => {
    complaintService.resetToSeedData();

    complaintService.create({
      title: 'Emergency Generator Failure',
      description: 'Main generator down',
      category: 'Electrical',
      priority: PRIORITIES.URGENT,
    });

    const updatedStats = complaintService.getStats();
    expect(updatedStats.total).toBe(7);
    expect(updatedStats.pending).toBe(3);
    expect(updatedStats.urgent).toBe(2);
  });
});

// SUITE 8: SLA Calculation Helper (getSlaStatus)
describe('8. SLA Calculation Helper: getSlaStatus()', () => {
  test('handles null, undefined, or missing createdAt gracefully with fallback object', () => {
    const fallbackNull = getSlaStatus(null);
    expect(fallbackNull).toEqual({
      isBreached: false,
      badgeText: 'SLA N/A',
      remainingHours: 0,
      elapsedHours: 0,
      limitHours: 48,
    });

    const fallbackUndefined = getSlaStatus(undefined);
    expect(fallbackUndefined.badgeText).toBe('SLA N/A');

    const fallbackEmptyObj = getSlaStatus({});
    expect(fallbackEmptyObj.badgeText).toBe('SLA N/A');

    const fallbackNoCreatedAt = getSlaStatus({ priority: PRIORITIES.HIGH });
    expect(fallbackNoCreatedAt.badgeText).toBe('SLA N/A');
  });

  test('calculates correct limitHours based on priority level', () => {
    const nowISO = new Date().toISOString();

    const urgentSla = getSlaStatus({ priority: PRIORITIES.URGENT, createdAt: nowISO });
    expect(urgentSla.limitHours).toBe(4);

    const highSla = getSlaStatus({ priority: PRIORITIES.HIGH, createdAt: nowISO });
    expect(highSla.limitHours).toBe(24);

    const mediumSla = getSlaStatus({ priority: PRIORITIES.MEDIUM, createdAt: nowISO });
    expect(mediumSla.limitHours).toBe(48);

    const lowSla = getSlaStatus({ priority: PRIORITIES.LOW, createdAt: nowISO });
    expect(lowSla.limitHours).toBe(48);

    const defaultSla = getSlaStatus({ priority: 'UNKNOWN_PRIORITY', createdAt: nowISO });
    expect(defaultSla.limitHours).toBe(48);
  });

  test('calculates SLA metrics for active ticket within limit (healthy state)', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const sla = getSlaStatus({
      priority: PRIORITIES.HIGH,
      status: STATUSES.IN_PROGRESS,
      createdAt: twoHoursAgo,
    });

    expect(sla.limitHours).toBe(24);
    expect(sla.elapsedHours).toBe(2);
    expect(sla.remainingHours).toBe(22);
    expect(sla.isBreached).toBe(false);
    expect(sla.isWarning).toBe(false);
    expect(sla.isCompleted).toBe(false);
    expect(sla.badgeText).toBe('SLA: 22h remaining');
  });

  test('flags warning status when remaining time is within warning threshold (<= 30% of limit)', () => {
    // 3 hours elapsed for URGENT (4h limit) -> 1 hour remaining (25% remaining, <= 30%)
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const sla = getSlaStatus({
      priority: PRIORITIES.URGENT,
      status: STATUSES.PENDING,
      createdAt: threeHoursAgo,
    });

    expect(sla.limitHours).toBe(4);
    expect(sla.elapsedHours).toBe(3);
    expect(sla.remainingHours).toBe(1);
    expect(sla.isWarning).toBe(true);
    expect(sla.isBreached).toBe(false);
    expect(sla.badgeText).toBe('SLA: 1h remaining');
  });

  test('formats remaining time in minutes when less than 1 hour remains on active ticket', () => {
    // 3.5 hours elapsed for URGENT (4h limit) -> 0.5 hour = 30 minutes remaining
    const threeAndHalfHoursAgo = new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString();
    const sla = getSlaStatus({
      priority: PRIORITIES.URGENT,
      status: STATUSES.PENDING,
      createdAt: threeAndHalfHoursAgo,
    });

    expect(sla.remainingHours).toBe(0.5);
    expect(sla.isWarning).toBe(true);
    expect(sla.isBreached).toBe(false);
    expect(sla.badgeText).toBe('SLA: 30m remaining');
  });

  test('detects SLA breach for active ticket exceeding priority limit', () => {
    // 6 hours elapsed for URGENT (4h limit) -> 2 hours overdue
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const sla = getSlaStatus({
      priority: PRIORITIES.URGENT,
      status: STATUSES.IN_PROGRESS,
      createdAt: sixHoursAgo,
    });

    expect(sla.limitHours).toBe(4);
    expect(sla.elapsedHours).toBe(6);
    expect(sla.remainingHours).toBe(-2);
    expect(sla.isBreached).toBe(true);
    expect(sla.isWarning).toBe(false);
    expect(sla.badgeText).toBe('SLA Breached (+2h)');
  });

  test('calculates SLA compliance for completed (RESOLVED/REJECTED) ticket within limit', () => {
    const createdAt = '2026-07-20T10:00:00.000Z';
    const updatedAt = '2026-07-20T12:00:00.000Z'; // 2 hours elapsed

    const resolvedSla = getSlaStatus({
      priority: PRIORITIES.HIGH,
      status: STATUSES.RESOLVED,
      createdAt,
      updatedAt,
    });

    expect(resolvedSla.isCompleted).toBe(true);
    expect(resolvedSla.isBreached).toBe(false);
    expect(resolvedSla.elapsedHours).toBe(2);
    expect(resolvedSla.badgeText).toBe('SLA Compliant (2h)');
  });

  test('calculates SLA breach for completed ticket resolved/rejected past limit', () => {
    const createdAt = '2026-07-20T10:00:00.000Z';
    const updatedAt = '2026-07-22T10:00:00.000Z'; // 48 hours elapsed for HIGH (24h limit) -> +24h overdue

    const rejectedSla = getSlaStatus({
      priority: PRIORITIES.HIGH,
      status: STATUSES.REJECTED,
      createdAt,
      updatedAt,
    });

    expect(rejectedSla.isCompleted).toBe(true);
    expect(rejectedSla.isBreached).toBe(true);
    expect(rejectedSla.elapsedHours).toBe(48);
    expect(rejectedSla.badgeText).toBe('SLA Exceeded (+24h)');
  });

  test('handles edge case where createdAt is in the future relative to current time', () => {
    const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour in future
    const sla = getSlaStatus({
      priority: PRIORITIES.MEDIUM,
      status: STATUSES.PENDING,
      createdAt: futureDate,
    });

    expect(sla.elapsedHours).toBe(0);
    expect(sla.remainingHours).toBe(48);
    expect(sla.isBreached).toBe(false);
  });
});

// SUITE 9: Complaint Service: reassign()
describe('9. Complaint Service: reassign()', () => {
  test('reassigns ticket to new target assignee, updates assignedTo, updatedAt, statusHistory audit log, and adds internal comment with transfer note', () => {
    complaintService.resetToSeedData();

    const targetAssignee = {
      id: 'usr_staff_2',
      name: 'Mark Davis',
      department: 'Plumbing Department',
    };

    const reassignedBy = {
      id: 'usr_staff_1',
      name: 'Dr. Robert Vance',
      role: ROLES.STAFF,
    };

    const reason = 'Requires specialized heavy-duty plumbing repair.';

    const updatedTicket = complaintService.reassign('CMS-2026-1001', targetAssignee, reassignedBy, reason);

    expect(updatedTicket).toBeTruthy();
    expect(updatedTicket.assignedTo).toEqual(targetAssignee);
    expect(updatedTicket.updatedAt).toBeTruthy();

    // Verify audit log entry in statusHistory
    const latestHistory = updatedTicket.statusHistory[updatedTicket.statusHistory.length - 1];
    expect(latestHistory.status).toBe(updatedTicket.status);
    expect(latestHistory.updatedBy).toBe('Dr. Robert Vance');
    expect(latestHistory.note).toBe('Reassigned to Mark Davis (Plumbing Department). Reason: Requires specialized heavy-duty plumbing repair.');
    expect(latestHistory.timestamp).toBeTruthy();

    // Verify internal comment log
    const latestComment = updatedTicket.comments[updatedTicket.comments.length - 1];
    expect(latestComment.senderName).toBe('Dr. Robert Vance');
    expect(latestComment.senderRole).toBe(ROLES.STAFF);
    expect(latestComment.senderId).toBe('usr_staff_1');
    expect(latestComment.isInternal).toBe(true);
    expect(latestComment.text).toBe('[Internal Reassignment] Transferred ticket to Mark Davis (Plumbing Department). Reason: Requires specialized heavy-duty plumbing repair.');

    // Verify LocalStorage persistence
    const persisted = complaintService.getById('CMS-2026-1001');
    expect(persisted.assignedTo).toEqual(targetAssignee);
  });

  test('handles string reassignedBy parameter and omitted transfer reason', () => {
    complaintService.resetToSeedData();

    const targetAssignee = {
      id: 'usr_staff_3',
      name: 'Alice Smith',
      department: 'IT Support',
    };

    const updatedTicket = complaintService.reassign('CMS-2026-1002', targetAssignee, 'Warden Adams');

    expect(updatedTicket).toBeTruthy();
    expect(updatedTicket.assignedTo).toEqual(targetAssignee);

    const latestHistory = updatedTicket.statusHistory[updatedTicket.statusHistory.length - 1];
    expect(latestHistory.updatedBy).toBe('Warden Adams');
    expect(latestHistory.note).toBe('Reassigned to Alice Smith (IT Support)');

    const latestComment = updatedTicket.comments[updatedTicket.comments.length - 1];
    expect(latestComment.senderName).toBe('Warden Adams');
    expect(latestComment.senderId).toBe('');
    expect(latestComment.text).toBe('[Internal Reassignment] Transferred ticket to Alice Smith (IT Support).');
  });

  test('falls back to default reassigner name "Staff" when reassignedBy is null or empty', () => {
    complaintService.resetToSeedData();

    const targetAssignee = {
      id: 'usr_staff_4',
      name: 'Electrical Team',
      department: 'Maintenance',
    };

    const updatedTicket = complaintService.reassign('CMS-2026-1005', targetAssignee, null);

    expect(updatedTicket).toBeTruthy();
    const latestHistory = updatedTicket.statusHistory[updatedTicket.statusHistory.length - 1];
    expect(latestHistory.updatedBy).toBe('Staff');

    const latestComment = updatedTicket.comments[updatedTicket.comments.length - 1];
    expect(latestComment.senderName).toBe('Staff');
  });

  test('returns null when attempting to reassign a non-existent complaint ID', () => {
    complaintService.resetToSeedData();

    const targetAssignee = { id: 'usr_staff_1', name: 'Dr. Vance', department: 'Admin' };
    const result = complaintService.reassign('CMS-9999-9999', targetAssignee, 'Admin');

    expect(result).toBeNull();
  });

  test('safely initializes statusHistory and comments arrays if they were missing on target ticket', () => {
    complaintService.resetToSeedData();

    // Manually manipulate raw storage to remove statusHistory & comments from a ticket
    const rawList = JSON.parse(localStorage.getItem('cms_complaints_v1'));
    delete rawList[0].statusHistory;
    delete rawList[0].comments;
    localStorage.setItem('cms_complaints_v1', JSON.stringify(rawList));

    const targetAssignee = { id: 'usr_staff_5', name: 'CareTaker John', department: 'Facilities' };
    const result = complaintService.reassign(rawList[0].id, targetAssignee, 'Supervisor');

    expect(result).toBeTruthy();
    expect(Array.isArray(result.statusHistory)).toBe(true);
    expect(result.statusHistory.length).toBe(1);
    expect(Array.isArray(result.comments)).toBe(true);
    expect(result.comments.length).toBe(1);
  });
});

// SUITE 10: Complaint Service - resetToSeedData()
describe('10. Admin Functionality: resetToSeedData()', () => {
  test('restores default seed dataset into LocalStorage and returns INITIAL_COMPLAINTS', () => {
    localStorage.clear();
    const result = complaintService.resetToSeedData();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(6);
    expect(result[0].id).toBe('CMS-2026-1001');

    const storedComplaints = JSON.parse(localStorage.getItem('cms_complaints_v1'));
    expect(storedComplaints.length).toBe(6);
    expect(storedComplaints[0].id).toBe('CMS-2026-1001');

    const counter = localStorage.getItem('cms_complaint_counter_v1');
    expect(counter).toBe('1005');
  });

  test('overwrites mutated complaints and modified storage state back to seed defaults', () => {
    complaintService.resetToSeedData();

    // Mutate state by creating a new ticket and updating another
    complaintService.create({ title: 'Temporary Ticket', description: 'Will be wiped', category: 'General' });
    complaintService.updateStatus('CMS-2026-1001', STATUSES.RESOLVED, 'Admin');

    const beforeReset = complaintService.getAll();
    expect(beforeReset.length).toBe(7);

    // Perform Reset
    const afterReset = complaintService.resetToSeedData();
    expect(afterReset.length).toBe(6);

    const reFetched = complaintService.getAll();
    expect(reFetched.length).toBe(6);
    expect(reFetched.find((c) => c.title === 'Temporary Ticket')).toBeFalsy();
    // CMS-2026-1001 status in seed data is IN_PROGRESS
    expect(reFetched.find((c) => c.id === 'CMS-2026-1001').status).toBe(STATUSES.IN_PROGRESS);
  });

  test('restores seed data when LocalStorage has been corrupted or cleared', () => {
    localStorage.setItem('cms_complaints_v1', 'CORRUPTED_JSON_STRING!!!');
    localStorage.setItem('cms_complaint_counter_v1', '9999');

    const result = complaintService.resetToSeedData();
    expect(result.length).toBe(6);

    const stored = JSON.parse(localStorage.getItem('cms_complaints_v1'));
    expect(stored.length).toBe(6);
    expect(localStorage.getItem('cms_complaint_counter_v1')).toBe('1005');
  });

  test('ensures ticket creation after reset starts with correct next sequence ID', () => {
    complaintService.resetToSeedData();

    const created = complaintService.create({
      title: 'Post Reset Ticket',
      description: 'Checking ID sequence',
      category: 'Maintenance',
    });

    const currentYear = new Date().getFullYear();
    expect(created.id).toBe(`CMS-${currentYear}-1006`);
  });
});

// SUITE 11: CSV Export String Generation Logic
describe('11. Admin Functionality: CSV Export String Generation', () => {
  test('returns CSV header line when provided empty dataset or invalid input', () => {
    const expectedHeader = 'Ticket ID,Title,Category,Priority,Status,Location,Created At,Updated At,Student Name,Student RollNo,Assigned Staff';

    expect(generateComplaintsCSV([])).toBe(expectedHeader);
    expect(generateComplaintsCSV(null)).toBe(expectedHeader);
    expect(generateComplaintsCSV(undefined)).toBe(expectedHeader);
    expect(generateComplaintsCSV('invalid_input')).toBe(expectedHeader);
  });

  test('formats single complaint object into standard RFC 4180 CSV string', () => {
    const sampleComplaints = [
      {
        id: 'CMS-2026-1001',
        title: 'Restroom Flush Not Working',
        category: 'Hostel',
        priority: PRIORITIES.HIGH,
        status: STATUSES.IN_PROGRESS,
        location: 'Hostel Block B - Room 204',
        createdAt: '2026-07-20T10:30:00.000Z',
        updatedAt: '2026-07-21T14:15:00.000Z',
        student: { name: 'Alex Chen', rollNo: 'CS-2024-042' },
        assignedTo: { name: 'Dr. Robert Vance' },
      },
    ];

    const csvOutput = generateComplaintsCSV(sampleComplaints);
    const lines = csvOutput.split('\n');

    expect(lines.length).toBe(2);
    expect(lines[0]).toBe('Ticket ID,Title,Category,Priority,Status,Location,Created At,Updated At,Student Name,Student RollNo,Assigned Staff');
    expect(lines[1]).toBe(
      '"CMS-2026-1001","Restroom Flush Not Working","Hostel","high","in_progress","Hostel Block B - Room 204","2026-07-20T10:30:00.000Z","2026-07-21T14:15:00.000Z","Alex Chen","CS-2024-042","Dr. Robert Vance"'
    );
  });

  test('escapes internal double-quotes in field values properly with double quotes', () => {
    const sampleComplaints = [
      {
        id: 'CMS-2026-1002',
        title: 'Projector "No Signal" in "Lab 3"',
        category: 'IT & Wifi',
        priority: PRIORITIES.MEDIUM,
        status: STATUSES.PENDING,
        location: 'CS "Main" Building',
        createdAt: '2026-07-21T09:00:00.000Z',
        updatedAt: '2026-07-21T09:00:00.000Z',
        student: { name: 'Jane "JJ" Doe', rollNo: 'CS-2024-099' },
        assignedTo: null,
      },
    ];

    const csvOutput = generateComplaintsCSV(sampleComplaints);
    const rowLine = csvOutput.split('\n')[1];

    expect(rowLine).toContain('"Projector ""No Signal"" in ""Lab 3"""');
    expect(rowLine).toContain('"CS ""Main"" Building"');
    expect(rowLine).toContain('"Jane ""JJ"" Doe"');
    expect(rowLine).toContain('"Unassigned"');
  });

  test('handles missing or null properties and unassigned staff with safe fallbacks', () => {
    const incompleteComplaint = [
      {
        id: 'CMS-2026-9999',
        // missing title, category, priority, status, location, student, assignedTo
      },
    ];

    const csvOutput = generateComplaintsCSV(incompleteComplaint);
    const rowLine = csvOutput.split('\n')[1];

    expect(rowLine).toBe('"CMS-2026-9999","","","","","","","","","","Unassigned"');
  });

  test('works via complaintService.exportToCSV() method with stored complaints', () => {
    complaintService.resetToSeedData();
    const csvOutput = complaintService.exportToCSV();

    const lines = csvOutput.split('\n');
    expect(lines.length).toBe(7); // 1 header + 6 seed complaints
    expect(lines[0]).toContain('Ticket ID');
    expect(lines[1]).toContain('CMS-2026-1001');
    expect(lines[5]).toContain('CMS-2026-1005');
  });
});

describe('Postel’s Law & Jakob’s Law - Ticket ID Sanitization (getById)', () => {
  test('finds complaint with exact ID', () => {
    complaintService.resetToSeedData();
    const found = complaintService.getById('CMS-2026-1001');
    expect(found).toBeTruthy();
    expect(found.id).toBe('CMS-2026-1001');
  });

  test('finds complaint with lowercase ID', () => {
    complaintService.resetToSeedData();
    const found = complaintService.getById('cms-2026-1001');
    expect(found).toBeTruthy();
    expect(found.id).toBe('CMS-2026-1001');
  });

  test('finds complaint with leading hash symbol and whitespace', () => {
    complaintService.resetToSeedData();
    const found = complaintService.getById('  #CMS-2026-1002  ');
    expect(found).toBeTruthy();
    expect(found.id).toBe('CMS-2026-1002');
  });

  test('finds complaint with numeric suffix lookup (e.g. 1003)', () => {
    complaintService.resetToSeedData();
    const found = complaintService.getById('1003');
    expect(found).toBeTruthy();
    expect(found.id).toBe('CMS-2026-1003');
  });

  test('returns null for empty or non-existent ID gracefully', () => {
    complaintService.resetToSeedData();
    expect(complaintService.getById('')).toBe(null);
    expect(complaintService.getById('   ')).toBe(null);
    expect(complaintService.getById('NON-EXISTENT-9999')).toBe(null);
    expect(complaintService.getById(null)).toBe(null);
  });
});

// Print Final Report & Exit
console.log('\n========================================');
console.log(`TEST RUN SUMMARY:`);
console.log(`Total Test Cases : ${totalTests}`);
console.log(`Passed           : ${passedTests}`);
console.log(`Failed           : ${failedTests}`);
console.log('========================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

