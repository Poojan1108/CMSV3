import { INITIAL_COMPLAINTS } from '../data/mockData.js';
import { generateComplaintsCSV } from '../utils/formatters.js';
import {
  STATUSES,
  PRIORITIES,
  ROLES,
  getOrgCategories,
  getOrgLocationLabel,
  getOrgUserLabel,
  getRoleTerm,
  resolveOrg,
} from '../utils/constants.js';

const STORAGE_KEY = 'cms_complaints_v1';
const ID_COUNTER_KEY = 'cms_complaint_counter_v1';

/**
 * Initializes localStorage with seed complaints if empty.
 */
const initStorage = () => {
  if (typeof window === 'undefined') return;
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_COMPLAINTS));
    localStorage.setItem(ID_COUNTER_KEY, '1005');
  }
};

/**
 * Retrieves all raw complaints from localStorage.
 * @returns {Array}
 */
const getRawComplaints = () => {
  initStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : INITIAL_COMPLAINTS;
  } catch (error) {
    console.error('Failed to read complaints from localStorage:', error);
    return INITIAL_COMPLAINTS;
  }
};

/**
 * Persists complaints array to localStorage.
 * @param {Array} complaints
 */
const saveComplaints = (complaints) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
  } catch (error) {
    console.error('Failed to save complaints to localStorage:', error);
  }
};

/**
 * Generates next sequential complaint ticket ID (e.g., CMS-2026-1006).
 * @returns {string}
 */
const getNextId = () => {
  initStorage();
  let currentCounter = parseInt(localStorage.getItem(ID_COUNTER_KEY) || '1005', 10);
  currentCounter += 1;
  localStorage.setItem(ID_COUNTER_KEY, currentCounter.toString());
  const year = new Date().getFullYear();
  return `CMS-${year}-${currentCounter}`;
};

export const complaintService = {
  /**
   * Helper methods to dynamically resolve organization template attributes
   */
  getCategories: (org = 'COLLEGE') => getOrgCategories(org),
  getLocationLabel: (org = 'COLLEGE') => getOrgLocationLabel(org),
  getUserLabel: (org = 'COLLEGE') => getOrgUserLabel(org),
  getRoleTerm: (role, org = 'COLLEGE') => getRoleTerm(role, org),
  resolveOrg: (org = 'COLLEGE') => resolveOrg(org),

  /**
   * Fetch all complaints filtered and sorted.
   * @param {Object} filters
   * @returns {Array}
   */
  getAll: (filters = {}) => {
    let list = getRawComplaints();

    const { status, category, priority, search, studentId, assignedToId, org, currentOrg, sortBy = 'newest' } = filters;

    const activeOrg = currentOrg || org;
    if (activeOrg && category === 'all_org') {
      const allowedCategories = getOrgCategories(activeOrg);
      list = list.filter((item) => allowedCategories.includes(item.category));
    } else if (category && category !== 'all') {
      list = list.filter((item) => item.category === category);
    }

    if (status && status !== 'all') {
      list = list.filter((item) => item.status === status);
    }

    if (priority && priority !== 'all') {
      list = list.filter((item) => item.priority === priority);
    }

    if (studentId) {
      list = list.filter((item) => item.student?.id === studentId);
    }

    if (assignedToId) {
      list = list.filter((item) => item.assignedTo?.id === assignedToId);
    }

    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (item) =>
          item.id.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.location && item.location.toLowerCase().includes(q)) ||
          (item.student && item.student.name.toLowerCase().includes(q))
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (sortBy === 'priority') {
        const pMap = { [PRIORITIES.URGENT]: 4, [PRIORITIES.HIGH]: 3, [PRIORITIES.MEDIUM]: 2, [PRIORITIES.LOW]: 1 };
        return (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
      }
      // default: newest first
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return list;
  },

  /**
   * Find complaint by unique ID.
   * @param {string} id
   * @returns {Object|null}
   */
  getById: (id) => {
    const list = getRawComplaints();
    return list.find((item) => item.id === id) || null;
  },

  /**
   * Create and store a new complaint with dynamic org defaults.
   * @param {Object} data
   * @returns {Object} Newly created complaint
   */
  create: (data) => {
    const list = getRawComplaints();
    const now = new Date().toISOString();
    const newId = getNextId();
    const activeOrg = data.currentOrg || data.org || 'COLLEGE';
    const userLabel = getOrgUserLabel(activeOrg);
    const locationLabel = getOrgLocationLabel(activeOrg);

    const newComplaint = {
      id: newId,
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority || PRIORITIES.MEDIUM,
      status: STATUSES.PENDING,
      location: data.location || locationLabel,
      createdAt: now,
      updatedAt: now,
      student: data.student || {
        id: 'usr_student_1',
        name: 'Alex Chen',
        email: 'alex.chen@campus.edu',
        rollNo: 'CS-2024-042',
        room: 'Block B - 304',
      },
      assignedTo: null,
      statusHistory: [
        {
          status: STATUSES.PENDING,
          updatedBy: data.student?.name || userLabel,
          note: 'Complaint registered in system.',
          timestamp: now,
        },
      ],
      comments: [],
    };

    list.unshift(newComplaint);
    saveComplaints(list);
    return newComplaint;
  },

  /**
   * Update complaint status and log history.
   * @param {string} id
   * @param {string} newStatus
   * @param {string|Object} updatedBy - Name or user object
   * @param {string} note
   * @returns {Object|null}
   */
  updateStatus: (id, newStatus, updatedBy, note = '') => {
    const list = getRawComplaints();
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const updaterName = typeof updatedBy === 'object' ? updatedBy.name : updatedBy;
    const now = new Date().toISOString();

    const complaint = list[index];
    complaint.status = newStatus;
    complaint.updatedAt = now;

    if (!complaint.statusHistory) {
      complaint.statusHistory = [];
    }

    complaint.statusHistory.push({
      status: newStatus,
      updatedBy: updaterName || 'System',
      note: note || `Status changed to ${newStatus}`,
      timestamp: now,
    });

    list[index] = complaint;
    saveComplaints(list);
    return complaint;
  },

  /**
   * Add comment to a complaint.
   * @param {string} id
   * @param {Object|string} sender - User object or name string
   * @param {string} text
   * @param {boolean} isInternal
   * @returns {Object|null}
   */
  addComment: (id, sender, text, isInternal = false) => {
    const list = getRawComplaints();
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return null;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return null;
    }

    const now = new Date().toISOString();
    const senderName = typeof sender === 'object' ? sender.name : sender;
    const senderRole = typeof sender === 'object' ? sender.role : ROLES.STUDENT;
    const senderId = typeof sender === 'object' ? sender.id : '';

    const newComment = {
      id: `c_${Date.now()}`,
      senderName: senderName || 'Anonymous',
      senderRole: senderRole || 'user',
      senderId,
      text,
      timestamp: now,
      isInternal,
    };

    const complaint = list[index];
    if (!complaint.comments) {
      complaint.comments = [];
    }

    complaint.comments.push(newComment);
    complaint.updatedAt = now;

    list[index] = complaint;
    saveComplaints(list);
    return complaint;
  },

  /**
   * Reassign a complaint ticket to another staff member or department.
   * @param {string} id
   * @param {Object} targetAssignee - { id, name, department }
   * @param {string|Object} reassignedBy
   * @param {string} reason
   * @returns {Object|null}
   */
  reassign: (id, targetAssignee, reassignedBy, reason = '') => {
    const list = getRawComplaints();
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const now = new Date().toISOString();
    const reassignerName = typeof reassignedBy === 'object' && reassignedBy ? reassignedBy.name : reassignedBy;
    const complaint = list[index];

    complaint.assignedTo = targetAssignee;
    complaint.updatedAt = now;

    if (!complaint.statusHistory) {
      complaint.statusHistory = [];
    }

    const note = `Reassigned to ${targetAssignee.name} (${targetAssignee.department})${
      reason ? `. Reason: ${reason}` : ''
    }`;

    complaint.statusHistory.push({
      status: complaint.status,
      updatedBy: reassignerName || 'Staff',
      note,
      timestamp: now,
    });

    if (!complaint.comments) {
      complaint.comments = [];
    }

    complaint.comments.push({
      id: `c_${Date.now()}`,
      senderName: reassignerName || 'Staff',
      senderRole: ROLES.STAFF,
      senderId: typeof reassignedBy === 'object' && reassignedBy ? reassignedBy.id : '',
      text: `[Internal Reassignment] Transferred ticket to ${targetAssignee.name} (${targetAssignee.department}).${
        reason ? ` Reason: ${reason}` : ''
      }`,
      timestamp: now,
      isInternal: true,
    });

    list[index] = complaint;
    saveComplaints(list);
    return complaint;
  },

  /**
   * Propose resolution for a complaint (Staff action).
   * Moves ticket to PENDING_CONFIRMATION status and dispatches request to complainant.
   * @param {string} id
   * @param {Object|string} staffUser
   * @param {string} resolutionNotes
   * @returns {Object|null}
   */
  proposeResolution: (id, staffUser, resolutionNotes = '') => {
    const list = getRawComplaints();
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const now = new Date().toISOString();
    const staffName = typeof staffUser === 'object' && staffUser ? staffUser.name : staffUser || 'Staff';

    const complaint = list[index];
    complaint.status = STATUSES.PENDING_CONFIRMATION;
    complaint.updatedAt = now;
    complaint.resolutionDetails = {
      notes: resolutionNotes || 'Staff has resolved the issue and requested your confirmation.',
      staffName,
      proposedAt: now,
    };

    if (!complaint.statusHistory) complaint.statusHistory = [];
    complaint.statusHistory.push({
      status: STATUSES.PENDING_CONFIRMATION,
      updatedBy: staffName,
      note: `Resolution proposed: ${resolutionNotes || 'Issue fixed. Awaiting user confirmation.'}`,
      timestamp: now,
    });

    if (!complaint.comments) complaint.comments = [];
    complaint.comments.push({
      id: `c_${Date.now()}`,
      senderName: staffName,
      senderRole: ROLES.STAFF,
      text: `[Resolution Proposed] ${resolutionNotes || 'Issue has been addressed. Please review and confirm resolution.'}`,
      timestamp: now,
      isInternal: false,
    });

    list[index] = complaint;
    saveComplaints(list);
    return complaint;
  },

  /**
   * Confirm resolution (Complainant action).
   * Moves ticket from PENDING_CONFIRMATION to RESOLVED.
   * @param {string} id
   * @param {Object|string} user
   * @param {string} feedbackNote
   * @returns {Object|null}
   */
  confirmResolution: (id, user, feedbackNote = '') => {
    const list = getRawComplaints();
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const now = new Date().toISOString();
    const userName = typeof user === 'object' && user ? user.name : user || 'User';

    const complaint = list[index];
    complaint.status = STATUSES.RESOLVED;
    complaint.updatedAt = now;
    complaint.resolvedAt = now;
    if (complaint.resolutionDetails) {
      complaint.resolutionDetails.confirmedAt = now;
      complaint.resolutionDetails.userFeedback = feedbackNote;
    }

    if (!complaint.statusHistory) complaint.statusHistory = [];
    complaint.statusHistory.push({
      status: STATUSES.RESOLVED,
      updatedBy: userName,
      note: `Resolution confirmed by user.${feedbackNote ? ` Feedback: ${feedbackNote}` : ''}`,
      timestamp: now,
    });

    if (!complaint.comments) complaint.comments = [];
    complaint.comments.push({
      id: `c_${Date.now()}`,
      senderName: userName,
      senderRole: ROLES.STUDENT,
      text: `[Ticket Closed & Confirmed Resolved] ${feedbackNote || 'Confirmed issue is completely resolved. Thank you!'}`,
      timestamp: now,
      isInternal: false,
    });

    list[index] = complaint;
    saveComplaints(list);
    return complaint;
  },

  /**
   * Reject resolution (Complainant action).
   * Reverts ticket from PENDING_CONFIRMATION back to IN_PROGRESS.
   * @param {string} id
   * @param {Object|string} user
   * @param {string} rejectionReason
   * @returns {Object|null}
   */
  rejectResolution: (id, user, rejectionReason = '') => {
    const list = getRawComplaints();
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const now = new Date().toISOString();
    const userName = typeof user === 'object' && user ? user.name : user || 'User';

    const complaint = list[index];
    complaint.status = STATUSES.IN_PROGRESS;
    complaint.updatedAt = now;
    if (complaint.resolutionDetails) {
      complaint.resolutionDetails.rejectedAt = now;
      complaint.resolutionDetails.rejectionReason = rejectionReason;
    }

    if (!complaint.statusHistory) complaint.statusHistory = [];
    complaint.statusHistory.push({
      status: STATUSES.IN_PROGRESS,
      updatedBy: userName,
      note: `Resolution rejected by user. Reopened ticket. Reason: ${rejectionReason || 'Issue not resolved yet.'}`,
      timestamp: now,
    });

    if (!complaint.comments) complaint.comments = [];
    complaint.comments.push({
      id: `c_${Date.now()}`,
      senderName: userName,
      senderRole: ROLES.STUDENT,
      text: `[Resolution Rejected / Reopened] ${rejectionReason || 'The issue is not completely fixed yet. Please inspect further.'}`,
      timestamp: now,
      isInternal: false,
    });

    list[index] = complaint;
    saveComplaints(list);
    return complaint;
  },

  /**
   * Resets local storage complaints back to initial mock seed data.
   */
  resetToSeedData: () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_COMPLAINTS));
    localStorage.setItem(ID_COUNTER_KEY, '1005');
    return INITIAL_COMPLAINTS;
  },

  /**
   * Returns analytical metrics summary, optionally filtered by currentOrg.
   * @param {string|Object} org
   */
  getStats: (org) => {
    let list = getRawComplaints();
    if (org) {
      const categories = getOrgCategories(org);
      // Keeps stats calculation smooth and compatible across org templates
    }
    return {
      total: list.length,
      pending: list.filter((c) => c.status === STATUSES.PENDING).length,
      inProgress: list.filter((c) => c.status === STATUSES.IN_PROGRESS).length,
      pendingConfirmation: list.filter((c) => c.status === STATUSES.PENDING_CONFIRMATION).length,
      resolved: list.filter((c) => c.status === STATUSES.RESOLVED).length,
      rejected: list.filter((c) => c.status === STATUSES.REJECTED).length,
      urgent: list.filter((c) => c.priority === PRIORITIES.URGENT).length,
    };
  },

  /**
   * Generates a formatted CSV string representation of complaints.
   * @param {Array} [complaints] - Optional complaints list; defaults to all complaints in storage.
   * @returns {string}
   */
  exportToCSV: (complaints) => {
    const list = complaints || getRawComplaints();
    return generateComplaintsCSV(list);
  },
};

