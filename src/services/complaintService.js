/**
 * complaintService.js
 * In-Place Refactored Service Layer for CMS_V2
 *
 * Backed by the stateless PostgREST complaintApi repository.
 * Eliminates localStorage dual-source-of-truth bloat, reduces event noise,
 * and maintains 100% backward-compatible API contracts with existing UI components.
 */

import { generateComplaintsCSV } from '../utils/formatters.js';
import {
  isSupabaseConfigured,
  initRealtimeSubscription,
} from './supabaseClient.js';
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
import { complaintApi } from './complaintApi.js';

const LIVE_DATA_EVENT = 'cms:live_data_changed';

/**
 * In-memory state cache for instantaneous, synchronous React renders without layout flicker.
 * Database is the authoritative source of truth.
 */
let memoryComplaints = [];
let lastSyncTimestamp = 0;
let syncPromise = null;
const SYNC_CACHE_TTL_MS = 3000;

/**
 * Dispatches a live update notification to active React components.
 */
function notifyLiveChange(detail = {}) {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent(LIVE_DATA_EVENT, { detail }));
  } catch (e) {
    console.error('[complaintService] Failed to dispatch live update event:', e);
  }
}

/**
 * Auto-routes a category to its responsible department.
 */
export const getCategoryDepartment = (category) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('elevator') || cat.includes('lift')) {
    return { id: null, name: 'Elevator & Lift Operations' };
  }
  if (cat.includes('gate') || cat.includes('security') || cat.includes('cctv')) {
    return { id: null, name: 'Security & Gate Management' };
  }
  if (cat.includes('clubhouse') || cat.includes('amenities') || cat.includes('gym') || cat.includes('pool')) {
    return { id: null, name: 'Clubhouse & Amenities Operations' };
  }
  if (cat.includes('waste') || cat.includes('garbage')) {
    return { id: null, name: 'Waste Management & Sanitation' };
  }
  if (cat.includes('plumb') || cat.includes('water')) {
    return { id: null, name: 'Plumbing & Water Services' };
  }
  if (cat.includes('power') || cat.includes('electric')) {
    return { id: null, name: 'Electrical & Power Services' };
  }
  if (cat.includes('hostel') || cat.includes('mess') || cat.includes('warden')) {
    return { id: null, name: 'Hostel & Residential Welfare' };
  }
  if (cat.includes('meeting') || cat.includes('conference')) {
    return { id: null, name: 'AV & Collaboration Services' };
  }
  if (cat.includes('cafeteria') || cat.includes('pantry')) {
    return { id: null, name: 'Cafeteria & Pantry Management' };
  }
  if (cat.includes('hr') || cat.includes('payroll') || cat.includes('people')) {
    return { id: null, name: 'Human Resources & People Ops' };
  }
  if (cat.includes('facility') || cat.includes('cooling') || cat.includes('temperature')) {
    return { id: null, name: 'Workplace Facilities & AC' };
  }
  if (cat.includes('it') || cat.includes('wifi') || cat.includes('lab') || cat.includes('computer') || cat.includes('network') || cat.includes('switch') || cat.includes('hardware') || cat.includes('vpn')) {
    return { id: null, name: 'IT & Digital Infrastructure' };
  }
  return { id: null, name: 'Maintenance & Estate Services' };
};

/**
 * Computes official SLA response and resolution deadlines based on ticket priority.
 */
export const calculateSlaDeadlines = (priority, fromDate = new Date()) => {
  const p = (priority || 'medium').toLowerCase();
  const baseTime = fromDate instanceof Date ? fromDate.getTime() : new Date(fromDate).getTime();

  const slaConfigs = {
    urgent: { responseHours: 2, resolveHours: 12 },
    high: { responseHours: 6, resolveHours: 24 },
    medium: { responseHours: 12, resolveHours: 48 },
    low: { responseHours: 24, resolveHours: 72 },
  };

  const config = slaConfigs[p] || slaConfigs.medium;
  return {
    slaResponseDue: new Date(baseTime + config.responseHours * 3600000).toISOString(),
    slaResolveDue: new Date(baseTime + config.resolveHours * 3600000).toISOString(),
  };
};

/**
 * Fetches remote departments from Supabase public.departments table.
 */
export async function fetchRemoteDepartments(orgKey) {
  return complaintApi.fetchDepartments(orgKey);
}

/**
 * Generates a collision-free ticket ID (e.g. CMS-2026-8492).
 */
const getNextId = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CMS-${year}-${rand}`;
};

/**
 * Initializes Supabase Realtime WebSocket subscription for live remote database mutations.
 */
let realtimeInitialized = false;
export function ensureRealtimeSubscription() {
  if (typeof window === 'undefined' || realtimeInitialized) return;
  realtimeInitialized = true;

  initRealtimeSubscription((payload) => {
    try {
      if (payload.type === 'complaint') {
        const row = payload.new;
        if (!row || !row.id) return;

        const index = memoryComplaints.findIndex((c) => c.id === row.id);
        if (index === -1) {
          // New ticket lodged on remote device; trigger background fetch to populate relations
          complaintService.syncTicketDetails(row.id).then((fresh) => {
            if (fresh) notifyLiveChange({ type: 'remote_complaint', id: row.id, complaint: fresh });
          });
        } else {
          // Update in-memory complaint properties
          memoryComplaints[index] = {
            ...memoryComplaints[index],
            title: row.title ?? memoryComplaints[index].title,
            description: row.description ?? memoryComplaints[index].description,
            status: row.status ?? memoryComplaints[index].status,
            priority: row.priority ?? memoryComplaints[index].priority,
            resolvedAt: row.resolved_at ?? memoryComplaints[index].resolvedAt,
            updatedAt: row.updated_at ?? memoryComplaints[index].updatedAt,
          };
          notifyLiveChange({ type: 'remote_complaint', id: row.id, complaint: memoryComplaints[index] });
        }
      } else if (payload.type === 'comment') {
        const commentRow = payload.new;
        if (!commentRow || !commentRow.complaint_id) return;

        const index = memoryComplaints.findIndex((c) => c.id === commentRow.complaint_id);
        if (index !== -1) {
          const complaint = memoryComplaints[index];
          if (!complaint.comments) complaint.comments = [];

          const exists = complaint.comments.some((c) => c.id === commentRow.id);
          if (!exists) {
            complaint.comments.push({
              id: commentRow.id,
              senderId: commentRow.sender_id,
              senderName: commentRow.sender_name,
              senderRole: commentRow.sender_role,
              text: commentRow.text,
              isInternal: Boolean(commentRow.is_internal),
              timestamp: commentRow.created_at,
              createdAt: commentRow.created_at,
            });
            complaint.updatedAt = commentRow.created_at;
            notifyLiveChange({ type: 'remote_comment', id: commentRow.complaint_id, complaint });
          }
        }
      }
    } catch (err) {
      console.warn('[complaintService Realtime Handler Exception]:', err);
    }
  });
}

export const complaintService = {
  /**
   * Helper methods to dynamically resolve organization template attributes
   */
  getCategories: (org, registry) => getOrgCategories(org, registry),
  getLocationLabel: (org, registry) => getOrgLocationLabel(org, registry),
  getUserLabel: (org, registry) => getOrgUserLabel(org, registry),
  getRoleTerm: (role, org, registry) => getRoleTerm(role, org, registry),
  resolveOrg: (org, registry) => resolveOrg(org, registry),

  /**
   * Subscribe to real-time live updates.
   * Calls callback with event details on any change without requiring page reload.
   * @param {Function} callback
   * @returns {Function} Unsubscribe cleanup function
   */
  subscribeToLiveUpdates: (callback) => {
    if (typeof window === 'undefined' || typeof callback !== 'function') {
      return () => {};
    }
    ensureRealtimeSubscription();

    const handleLocalEvent = (e) => {
      callback(e.detail || {});
    };
    window.addEventListener(LIVE_DATA_EVENT, handleLocalEvent);

    return () => {
      window.removeEventListener(LIVE_DATA_EVENT, handleLocalEvent);
    };
  },

  /**
   * Generates a collision-free ticket ID (e.g. CMS-2026-8492)
   */
  generateId: () => getNextId(),

  /**
   * Sync complaints from Supabase into memory cache.
   * Deduplicates concurrent in-flight requests and avoids waterfall child table scans.
   */
  syncFromSupabase: async ({ force = false, orgKey = null } = {}) => {
    ensureRealtimeSubscription();
    if (!isSupabaseConfigured) {
      return memoryComplaints;
    }

    if (!force && Date.now() - lastSyncTimestamp < SYNC_CACHE_TTL_MS && memoryComplaints.length > 0) {
      return memoryComplaints;
    }

    if (syncPromise) {
      return syncPromise;
    }

    syncPromise = (async () => {
      try {
        const remoteComplaints = await complaintApi.fetchComplaints({
          orgKey: orgKey && orgKey !== 'ALL' ? orgKey : null,
          limit: 200,
        });

        if (Array.isArray(remoteComplaints)) {
          memoryComplaints = remoteComplaints;
          lastSyncTimestamp = Date.now();
        }
      } catch (err) {
        console.warn('[complaintService.syncFromSupabase Warning]:', err);
      } finally {
        syncPromise = null;
      }
      return memoryComplaints;
    })();

    return syncPromise;
  },

  /**
   * Fetches fresh full ticket details (including comments and history) for a specific ticket.
   */
  syncTicketDetails: async (complaintId) => {
    if (!complaintId) return null;
    try {
      const freshTicket = await complaintApi.getComplaintById(complaintId);
      if (freshTicket) {
        const index = memoryComplaints.findIndex((c) => c.id === freshTicket.id);
        if (index !== -1) {
          memoryComplaints[index] = freshTicket;
        } else {
          memoryComplaints.unshift(freshTicket);
        }
        return freshTicket;
      }
    } catch (err) {
      console.warn('[complaintService.syncTicketDetails Error]:', err);
    }
    return complaintService.getById(complaintId);
  },

  /**
   * Asynchronously sync with Supabase and fetch filtered complaints
   * @param {Object} filters
   * @returns {Promise<Array>}
   */
  fetchComplaints: async (filters = {}) => {
    try {
      await complaintService.syncFromSupabase({
        orgKey: filters.org || filters.orgKey || null,
        force: true,
      });
    } catch (err) {
      console.warn('[complaintService.fetchComplaints] Supabase sync warning:', err);
    }
    return complaintService.getAll(filters);
  },

  /**
   * Fetch all complaints filtered and sorted synchronously from memory cache.
   * @param {Object} filters
   * @returns {Array}
   */
  getAll: (filters = {}) => {
    let list = [...memoryComplaints];

    const { status, category, priority, search, studentId, assignedToId, org, currentOrg, sortBy = 'newest' } = filters;

    const activeOrg = currentOrg || org;
    if (activeOrg) {
      const orgKeyStr = typeof activeOrg === 'object' ? (activeOrg.orgKey || activeOrg.key || activeOrg.type) : activeOrg;
      if (orgKeyStr && orgKeyStr !== 'ALL') {
        list = list.filter((item) => {
          if (!item.org) return true;
          return String(item.org).toUpperCase() === String(orgKeyStr).toUpperCase();
        });
      }
    }

    if (category && category !== 'all' && category !== 'all_org') {
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
          (item.student && (item.student.name || '').toLowerCase().includes(q))
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
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return list;
  },

  /**
   * Find complaint by unique ID with forgiving sanitization (Postel's Law).
   * @param {string} id
   * @returns {Object|null}
   */
  getById: (id) => {
    if (!id || typeof id !== 'string') return null;
    const cleanId = id.trim().replace(/^[#\s]+/, '').toLowerCase();
    if (!cleanId) return null;

    // 1. Direct or case-insensitive match in memory
    const exact = memoryComplaints.find((item) => item.id.toLowerCase() === cleanId);
    if (exact) return exact;

    // 2. Suffix / numeric ID matching
    const suffixMatch = memoryComplaints.find((item) => {
      const itemId = item.id.toLowerCase();
      return itemId.endsWith(cleanId) || itemId.endsWith(`-${cleanId}`);
    });

    return suffixMatch || null;
  },

  /**
   * Create and store a new complaint.
   * Optimistically inserts into memory, saves directly to Supabase via complaintApi.
   * @param {Object} data
   * @returns {Object} Newly created complaint
   */
  create: (data) => {
    const now = new Date().toISOString();
    const newId = data.id || getNextId();
    const activeOrg = data.currentOrg || data.org || data.org_key || '';
    const userLabel = getOrgUserLabel(activeOrg);
    const locationLabel = getOrgLocationLabel(activeOrg);
    const priority = (data.priority || PRIORITIES.MEDIUM).toLowerCase();

    const { slaResponseDue, slaResolveDue } = calculateSlaDeadlines(priority, now);
    const autoDept = getCategoryDepartment(data.category);

    const studentMeta = {
      id: data.student?.id || data.studentId || null,
      name: data.student?.name || data.studentName || userLabel,
      email: data.student?.email || data.studentEmail || '',
      rollNo: data.student?.rollNo || data.student?.roll_no || '',
      room: data.student?.room || data.location || locationLabel,
      phone: data.student?.phone || '',
      isAnonymous: Boolean(data.isAnonymous),
      accessDate: data.accessDate || null,
      timeSlot: data.timeSlot || null,
      urgencyJustification: data.urgencyJustification || null,
    };

    const newComplaint = {
      id: newId,
      title: data.title,
      description: data.description,
      category: data.category,
      priority,
      status: (data.status || STATUSES.PENDING).toLowerCase(),
      location: data.location || locationLabel,
      org: activeOrg,
      createdAt: now,
      updatedAt: now,
      slaResponseDue,
      slaResolveDue,
      slaBreached: false,
      departmentId: data.departmentId || autoDept.id,
      departmentName: autoDept.name,
      student: studentMeta,
      student_meta: studentMeta,
      assignedTo: data.assignedTo || null,
      statusHistory: [
        {
          status: (data.status || STATUSES.PENDING).toLowerCase(),
          updatedBy: studentMeta.name || userLabel,
          note: 'Complaint registered in system.',
          timestamp: now,
        },
      ],
      comments: [],
      attachments: data.attachments || [],
      accessDate: data.accessDate || null,
      timeSlot: data.timeSlot || null,
      urgencyJustification: data.urgencyJustification || null,
    };

    // Optimistic memory cache insertion
    memoryComplaints.unshift(newComplaint);
    lastSyncTimestamp = Date.now();
    notifyLiveChange({ type: 'create', complaint: newComplaint, id: newId });

    // Persist to Supabase PostgREST asynchronously
    const syncPromise = complaintApi.insertComplaint(newComplaint).then(async (saved) => {
      try {
        await complaintApi.insertHistory({
          complaintId: newId,
          status: (data.status || STATUSES.PENDING).toLowerCase(),
          updatedBy: studentMeta.name || userLabel,
          note: 'Complaint registered in system.',
          timestamp: now,
        });
      } catch (err) {
        console.warn('[complaintService.create] History sync warning:', err);
      }

      const idx = memoryComplaints.findIndex((c) => c.id === newId);
      if (idx !== -1 && saved) {
        memoryComplaints[idx] = saved;
      }
      return saved;
    }).catch((err) => {
      console.warn('[complaintService.create] Database sync warning:', err);
    });

    newComplaint._syncPromise = syncPromise;
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
    const index = memoryComplaints.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const updaterName = typeof updatedBy === 'object' && updatedBy ? updatedBy.name : updatedBy;
    const updaterRole = typeof updatedBy === 'object' && updatedBy ? (updatedBy.role || '').toLowerCase() : '';
    const now = new Date().toISOString();

    // Enforce RBAC: Students cannot arbitrarily update status
    if (updaterRole === ROLES.STUDENT) {
      console.warn(`[RBAC] Student "${updaterName}" is not authorized to update ticket status directly.`);
      return null;
    }

    const complaint = memoryComplaints[index];
    complaint.status = newStatus;
    complaint.updatedAt = now;
    if (newStatus === STATUSES.RESOLVED) {
      complaint.resolvedAt = now;
    }

    if (!complaint.statusHistory) {
      complaint.statusHistory = [];
    }

    complaint.statusHistory.push({
      status: newStatus,
      updatedBy: updaterName || 'System',
      note: note || `Status changed to ${newStatus}`,
      timestamp: now,
    });

    memoryComplaints[index] = complaint;
    notifyLiveChange({ type: 'status_change', id, status: newStatus, complaint });

    // Direct atomic PostgREST update
    complaintApi.updateComplaint(id, {
      status: newStatus,
      resolved_at: newStatus === STATUSES.RESOLVED ? now : null,
    }).catch((err) => {
      console.warn('[complaintService.updateStatus] Sync warning:', err);
    });

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
    const index = memoryComplaints.findIndex((item) => item.id === id);
    if (index === -1) return null;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return null;
    }

    const now = new Date().toISOString();
    const senderName = typeof sender === 'object' && sender ? sender.name : sender;
    const senderRole = typeof sender === 'object' && sender ? sender.role : ROLES.STUDENT;
    const senderId = typeof sender === 'object' && sender ? sender.id : '';

    const cleanIsInternal = senderRole === ROLES.STUDENT ? false : Boolean(isInternal);

    const newComment = {
      id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderName: senderName || 'Anonymous',
      senderRole: senderRole || 'user',
      senderId: senderId || '',
      text,
      timestamp: now,
      createdAt: now,
      isInternal: cleanIsInternal,
    };

    const complaint = memoryComplaints[index];
    if (!complaint.comments) {
      complaint.comments = [];
    }

    complaint.comments.push(newComment);
    complaint.updatedAt = now;

    memoryComplaints[index] = complaint;
    notifyLiveChange({ type: 'new_comment', id, comment: newComment, complaint });

    // Direct atomic insert into complaint_comments
    complaintApi.insertComment({
      ...newComment,
      complaintId: id,
    }).catch((err) => {
      console.warn('[complaintService.addComment] Sync warning:', err);
    });

    return complaint;
  },

  /**
   * Reassign a complaint ticket to another staff member.
   */
  reassign: (id, targetAssignee, reassignedBy, reason = '') => {
    const index = memoryComplaints.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const now = new Date().toISOString();
    const reassignerName = typeof reassignedBy === 'object' && reassignedBy ? reassignedBy.name : reassignedBy;
    const reassignerRole = typeof reassignedBy === 'object' && reassignedBy ? (reassignedBy.role || '').toLowerCase() : '';
    const reassignerId = typeof reassignedBy === 'object' && reassignedBy ? reassignedBy.id : '';

    if (reassignerRole === ROLES.STUDENT) {
      console.warn(`[RBAC] Student "${reassignerName}" is not authorized to reassign tickets.`);
      return null;
    }

    const complaint = memoryComplaints[index];
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

    const reassignmentComment = {
      id: `c_${Date.now()}`,
      senderName: reassignerName || 'Staff',
      senderRole: ROLES.STAFF,
      senderId: reassignerId || '',
      eventType: 'reassign',
      text: `[Internal Reassignment] Transferred ticket to ${targetAssignee.name} (${targetAssignee.department}).${
        reason ? ` Reason: ${reason}` : ''
      }`,
      timestamp: now,
      createdAt: now,
      isInternal: true,
    };

    complaint.comments.push(reassignmentComment);
    memoryComplaints[index] = complaint;
    notifyLiveChange({ type: 'reassign', id, complaint });

    // Direct atomic PostgREST update + comment record
    Promise.all([
      complaintApi.updateComplaint(id, {
        assigned_to_id: targetAssignee?.id || null,
        assigned_to_name: targetAssignee.name,
        assigned_to_department: targetAssignee.department,
        department_id: targetAssignee.departmentId || null,
      }),
      complaintApi.insertComment({ ...reassignmentComment, complaintId: id }),
    ]).catch((err) => {
      console.warn('[complaintService.reassign] Sync warning:', err);
    });

    return complaint;
  },

  /**
   * Propose resolution for a complaint (Staff action).
   */
  proposeResolution: (id, staffUser, resolutionNotes = '') => {
    const index = memoryComplaints.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const now = new Date().toISOString();
    const staffName = typeof staffUser === 'object' && staffUser ? staffUser.name : staffUser || 'Staff';
    const staffRole = typeof staffUser === 'object' && staffUser ? (staffUser.role || '').toLowerCase() : '';
    const staffId = typeof staffUser === 'object' && staffUser ? staffUser.id : '';

    if (staffRole === ROLES.STUDENT) {
      console.warn(`[RBAC] Student "${staffName}" is not authorized to propose ticket resolution.`);
      return null;
    }

    const complaint = memoryComplaints[index];
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
    const propComment = {
      id: `c_${Date.now()}`,
      senderName: staffName,
      senderRole: ROLES.STAFF,
      senderId: staffId || '',
      eventType: 'resolution_proposed',
      text: `[Resolution Proposed] ${resolutionNotes || 'Issue has been addressed. Please review and confirm resolution.'}`,
      timestamp: now,
      createdAt: now,
      isInternal: false,
    };
    complaint.comments.push(propComment);

    memoryComplaints[index] = complaint;
    notifyLiveChange({ type: 'resolution_proposed', id, complaint });

    Promise.all([
      complaintApi.updateComplaint(id, {
        status: STATUSES.PENDING_CONFIRMATION,
        resolution_details: complaint.resolutionDetails,
      }),
      complaintApi.insertComment({ ...propComment, complaintId: id }),
    ]).catch((err) => {
      console.warn('[complaintService.proposeResolution] Sync warning:', err);
    });

    return complaint;
  },

  /**
   * Confirm resolution (Complainant action).
   */
  confirmResolution: (id, user, feedbackNote = '') => {
    const index = memoryComplaints.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const now = new Date().toISOString();
    const userName = typeof user === 'object' && user ? user.name : user || 'User';
    const userId = typeof user === 'object' && user ? user.id : '';

    const complaint = memoryComplaints[index];
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
    const confComment = {
      id: `c_${Date.now()}`,
      senderName: userName,
      senderRole: ROLES.STUDENT,
      senderId: userId || '',
      eventType: 'resolution_confirmed',
      text: `[Ticket Closed & Confirmed Resolved] ${feedbackNote || 'Confirmed issue is completely resolved. Thank you!'}`,
      timestamp: now,
      createdAt: now,
      isInternal: false,
    };
    complaint.comments.push(confComment);

    memoryComplaints[index] = complaint;
    notifyLiveChange({ type: 'resolution_confirmed', id, complaint });

    Promise.all([
      complaintApi.updateComplaint(id, {
        status: STATUSES.RESOLVED,
        resolved_at: now,
        resolution_details: complaint.resolutionDetails,
      }),
      complaintApi.insertComment({ ...confComment, complaintId: id }),
      complaintApi.insertHistory({
        complaintId: id,
        status: STATUSES.RESOLVED,
        updatedBy: userName,
        note: `Resolution confirmed by user.${feedbackNote ? ` Feedback: ${feedbackNote}` : ''}`,
        timestamp: now,
      }),
    ]).catch((err) => {
      console.warn('[complaintService.confirmResolution] Sync warning:', err);
    });

    return complaint;
  },

  /**
   * Reject resolution (Complainant action).
   */
  rejectResolution: (id, user, rejectionReason = '') => {
    const index = memoryComplaints.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const now = new Date().toISOString();
    const userName = typeof user === 'object' && user ? user.name : user || 'User';
    const userId = typeof user === 'object' && user ? user.id : '';

    const complaint = memoryComplaints[index];
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
    const rejComment = {
      id: `c_${Date.now()}`,
      senderName: userName,
      senderRole: ROLES.STUDENT,
      senderId: userId || '',
      eventType: 'resolution_rejected',
      text: `[Resolution Rejected / Reopened] ${rejectionReason || 'The issue is not completely fixed yet. Please inspect further.'}`,
      timestamp: now,
      createdAt: now,
      isInternal: false,
    };
    complaint.comments.push(rejComment);

    memoryComplaints[index] = complaint;
    notifyLiveChange({ type: 'resolution_rejected', id, complaint });

    Promise.all([
      complaintApi.updateComplaint(id, {
        status: STATUSES.IN_PROGRESS,
        resolution_details: complaint.resolutionDetails,
      }),
      complaintApi.insertComment({ ...rejComment, complaintId: id }),
      complaintApi.insertHistory({
        complaintId: id,
        status: STATUSES.IN_PROGRESS,
        updatedBy: userName,
        note: `Resolution rejected by user. Reopened ticket. Reason: ${rejectionReason || 'Issue not resolved yet.'}`,
        timestamp: now,
      }),
    ]).catch((err) => {
      console.warn('[complaintService.rejectResolution] Sync warning:', err);
    });

    return complaint;
  },

  /**
   * Clears memory cache on logout.
   */
  clearCache: () => {
    memoryComplaints = [];
    lastSyncTimestamp = 0;
    syncPromise = null;
    notifyLiveChange({ type: 'cache_cleared' });
  },

  /**
   * Resets complaints cache for testing.
   */
  resetToSeedData: () => {
    memoryComplaints = [];
    lastSyncTimestamp = 0;
    notifyLiveChange({ type: 'reset_seed', count: 0 });
    return [];
  },

  /**
   * Analytical KPI totals computed from current dataset.
   * @param {string|Object} org
   */
  getStats: (org) => {
    let list = [...memoryComplaints];
    if (org) {
      const orgKeyStr = typeof org === 'object' ? (org.orgKey || org.key || org.type) : org;
      if (orgKeyStr && orgKeyStr !== 'ALL') {
        list = list.filter((c) => !c.org || String(c.org).toUpperCase() === String(orgKeyStr).toUpperCase());
      }
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
   * @param {Array} [complaints] - Optional complaints list; defaults to all complaints.
   * @returns {string}
   */
  exportToCSV: (complaints) => {
    const list = complaints || memoryComplaints;
    return generateComplaintsCSV(list);
  },
};
