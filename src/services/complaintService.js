import { generateComplaintsCSV } from '../utils/formatters.js';
import { ticketApi } from './api.js';
import {
  supabase,
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

const STORAGE_KEY = 'cms_complaints_v1';
const ID_COUNTER_KEY = 'cms_complaint_counter_v1';
const LIVE_DATA_EVENT = 'cms:live_data_changed';
const LIVE_CHANNEL_NAME = 'cms_live_realtime_broadcast';

let broadcastChannel = null;
if (typeof window !== 'undefined' && typeof window.BroadcastChannel === 'function') {
  try {
    broadcastChannel = new BroadcastChannel(LIVE_CHANNEL_NAME);
  } catch (e) {
    console.warn('[Realtime BroadcastChannel] Restricted or unsupported:', e);
  }
}

/**
 * Dispatches a live update notification to all active components and tabs.
 */
function notifyLiveChange(detail = {}) {
  if (typeof window === 'undefined') return;

  // 1. Same-window / React tree custom event (0ms instantaneous reflection)
  try {
    window.dispatchEvent(new CustomEvent(LIVE_DATA_EVENT, { detail }));
  } catch (e) {
    console.error('Failed to dispatch live update event:', e);
  }

  // 2. Cross-tab BroadcastChannel
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: LIVE_DATA_EVENT, ...detail });
    } catch (e) {
      console.warn('BroadcastChannel postMessage failed:', e);
    }
  }
}

/**
 * Background upsert of complaint record into Supabase
 */
async function syncComplaintToSupabase(complaint) {
  if (!isSupabaseConfigured || !supabase || !complaint) return { success: false };
  try {
    const payload = {
      id: complaint.id,
      title: complaint.title,
      description: complaint.description,
      category: complaint.category,
      priority: complaint.priority,
      status: complaint.status,
      location: complaint.location || '',
      created_at: complaint.createdAt,
      updated_at: complaint.updatedAt || new Date().toISOString(),
      resolved_at: complaint.resolvedAt || null,
      student_id: complaint.student?.id || 'anonymous',
      student_name: complaint.student?.name || 'Anonymous',
      student_email: complaint.student?.email || '',
      student_meta: complaint.student || {},
      assigned_to: complaint.assignedTo || null,
      resolution_details: complaint.resolutionDetails || null,
      org_key: complaint.org || complaint.currentOrg || 'COLLEGE',
      attachments: complaint.attachments || [],
    };
    const { data, error } = await supabase.from('complaints').upsert([payload], { onConflict: 'id' }).select();
    if (error) {
      console.warn('[Supabase Sync Complaint Error]:', error.message || error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.warn('[Supabase Sync Complaint Error]:', err);
    return { success: false, error: err };
  }
}

/**
 * Background insert of status transition history into Supabase
 */
async function recordStatusHistoryToSupabase(complaintId, status, updatedBy, note = '') {
  if (!isSupabaseConfigured || !supabase || !complaintId) return;
  try {
    await supabase.from('complaint_history').insert([
      {
        complaint_id: complaintId,
        status,
        updated_by: updatedBy || 'System',
        note: note || `Status changed to ${status}`,
        created_at: new Date().toISOString(),
      },
    ]);
  } catch (err) {
    console.warn('[Supabase History Insert Error]:', err);
  }
}

/**
 * Background insert of comment record into Supabase
 */
async function recordCommentToSupabase(complaintId, comment) {
  if (!isSupabaseConfigured || !supabase || !complaintId || !comment) return;
  try {
    await supabase.from('complaint_comments').insert([
      {
        id: comment.id,
        complaint_id: complaintId,
        sender_id: comment.senderId || '',
        sender_name: comment.senderName || 'Anonymous',
        sender_role: comment.senderRole || 'user',
        text: comment.text,
        is_internal: Boolean(comment.isInternal),
        created_at: comment.timestamp || new Date().toISOString(),
      },
    ]);
  } catch (err) {
    console.warn('[Supabase Comment Insert Error]:', err);
  }
}

/**
 * Initializes localStorage with empty complaints dataset if missing.
 */
const initStorage = () => {
  if (typeof window === 'undefined') return;
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(ID_COUNTER_KEY, '1000');
  }
};

/**
 * Retrieves all raw complaints from localStorage.
 * Returns empty array if no records exist.
 * @returns {Array}
 */
const getRawComplaints = () => {
  initStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Failed to read complaints from localStorage:', error);
    return [];
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

// Wire Supabase Realtime WebSocket listener for remote multi-device mutations
if (typeof window !== 'undefined') {
  initRealtimeSubscription((payload) => {
    try {
      if (payload.type === 'complaint') {
        const row = payload.new;
        if (!row || !row.id) return;

        const list = getRawComplaints();
        const index = list.findIndex((c) => c.id === row.id);

        const mappedComplaint = {
          id: row.id,
          title: row.title,
          description: row.description,
          category: row.category,
          priority: row.priority,
          status: row.status,
          location: row.location,
          org: row.org_key || 'COLLEGE',
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          resolvedAt: row.resolved_at,
          attachments: row.attachments || [],
          student: row.student_meta || {
            id: row.student_id,
            name: row.student_name,
            email: row.student_email,
          },
          assignedTo: row.assigned_to || null,
          resolutionDetails: row.resolution_details || null,
          statusHistory: index !== -1 ? (list[index].statusHistory || []) : [],
          comments: index !== -1 ? (list[index].comments || []) : [],
        };

        if (index === -1) {
          list.unshift(mappedComplaint);
        } else {
          list[index] = { ...list[index], ...mappedComplaint };
        }
        saveComplaints(list);
        notifyLiveChange({ type: 'remote_complaint', id: row.id, complaint: mappedComplaint });
      } else if (payload.type === 'comment') {
        const commentRow = payload.new;
        if (!commentRow || !commentRow.complaint_id) return;

        const list = getRawComplaints();
        const index = list.findIndex((c) => c.id === commentRow.complaint_id);
        if (index !== -1) {
          const complaint = list[index];
          if (!complaint.comments) complaint.comments = [];

          const alreadyExists = complaint.comments.some((c) => c.id === commentRow.id);
          if (!alreadyExists) {
            complaint.comments.push({
              id: commentRow.id,
              senderId: commentRow.sender_id,
              senderName: commentRow.sender_name,
              senderRole: commentRow.sender_role,
              text: commentRow.text,
              isInternal: commentRow.is_internal,
              timestamp: commentRow.created_at,
            });
            complaint.updatedAt = commentRow.created_at;
            list[index] = complaint;
            saveComplaints(list);
            notifyLiveChange({
              type: 'remote_comment',
              id: commentRow.complaint_id,
              complaint,
            });
          }
        }
      }
    } catch (err) {
      console.warn('[Supabase Realtime Live Error]:', err);
    }
  });
}

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
   * Subscribe to real-time live updates (both local actions, cross-tab, and Supabase WebSocket).
   * Calls callback with event details on any change without requiring page reload.
   * @param {Function} callback
   * @returns {Function} Unsubscribe cleanup function
   */
  subscribeToLiveUpdates: (callback) => {
    if (typeof window === 'undefined' || typeof callback !== 'function') {
      return () => {};
    }

    // 1. Same-window custom event handler (0ms instantaneous reflection)
    const handleLocalEvent = (e) => {
      callback(e.detail || {});
    };
    window.addEventListener(LIVE_DATA_EVENT, handleLocalEvent);

    // 2. Cross-tab BroadcastChannel handler
    const handleBroadcastMessage = (event) => {
      if (event.data && event.data.type === LIVE_DATA_EVENT) {
        callback(event.data);
      }
    };
    if (broadcastChannel) {
      broadcastChannel.addEventListener('message', handleBroadcastMessage);
    }

    // 3. Fallback cross-tab storage event
    const handleStorageEvent = (event) => {
      if (event.key === STORAGE_KEY) {
        callback({ type: 'storage_sync' });
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener(LIVE_DATA_EVENT, handleLocalEvent);
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handleBroadcastMessage);
      }
      window.removeEventListener('storage', handleStorageEvent);
    };
  },

  /**
   * Sync complaints from Supabase into local storage cache
   */
  syncFromSupabase: async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: dbComplaints, error } = await supabase
          .from('complaints')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(dbComplaints)) {
          const { data: dbComments } = await supabase.from('complaint_comments').select('*');
          const { data: dbHistory } = await supabase.from('complaint_history').select('*');

          const mappedList = dbComplaints.map((row) => {
            const comments = (dbComments || [])
              .filter((c) => c.complaint_id === row.id)
              .map((c) => ({
                id: c.id,
                senderId: c.sender_id,
                senderName: c.sender_name,
                senderRole: c.sender_role,
                text: c.text,
                isInternal: c.is_internal,
                timestamp: c.created_at,
              }));

            const statusHistory = (dbHistory || [])
              .filter((h) => h.complaint_id === row.id)
              .map((h) => ({
                status: h.status,
                updatedBy: h.updated_by,
                note: h.note,
                timestamp: h.created_at,
              }));

            return {
              id: row.id,
              title: row.title,
              description: row.description,
              category: row.category,
              priority: row.priority,
              status: row.status,
              location: row.location,
              org: row.org_key || 'COLLEGE',
              createdAt: row.created_at,
              updatedAt: row.updated_at,
              resolvedAt: row.resolved_at,
              attachments: row.attachments || [],
              student: row.student_meta || {
                id: row.student_id,
                name: row.student_name,
                email: row.student_email,
              },
              assignedTo: row.assigned_to || null,
              resolutionDetails: row.resolution_details || null,
              statusHistory: statusHistory.length > 0 ? statusHistory : [
                {
                  status: row.status,
                  updatedBy: row.student_name || 'User',
                  note: 'Complaint registered.',
                  timestamp: row.created_at,
                },
              ],
              comments,
            };
          });

          saveComplaints(mappedList);
          notifyLiveChange({ type: 'sync_supabase', count: mappedList.length });
          return mappedList;
        }
      } catch (err) {
        console.warn('[Supabase Direct Sync Error]:', err);
      }
    }

    try {
      const res = await ticketApi.list();
      if (res && res.tickets && Array.isArray(res.tickets) && res.tickets.length > 0) {
        saveComplaints(res.tickets);
        notifyLiveChange({ type: 'sync_api', count: res.tickets.length });
        return res.tickets;
      }
    } catch {
      // Remote API unreachable: serve local storage smoothly
    }
    return getRawComplaints();
  },

  /**
   * Asynchronously sync with Supabase and fetch filtered complaints
   * @param {Object} filters
   * @returns {Promise<Array>}
   */
  fetchComplaints: async (filters = {}) => {
    try {
      await complaintService.syncFromSupabase();
    } catch (err) {
      console.warn('[complaintService.fetchComplaints] Supabase sync warning:', err);
    }
    return complaintService.getAll(filters);
  },

  /**
   * Fetch all complaints filtered and sorted.
   * @param {Object} filters
   * @returns {Array}
   */
  getAll: (filters = {}) => {
    let list = getRawComplaints();

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
   * Find complaint by unique ID with robust, forgiving sanitization (Postel's Law).
   * Supports:
   * - Case-insensitive matching ('cms-2026-1001' matches 'CMS-2026-1001')
   * - Stripping hash/special symbols ('#CMS-2026-1001')
   * - Numeric suffix lookup ('1001' or '2026-1001')
   * @param {string} id
   * @returns {Object|null}
   */
  getById: (id) => {
    if (!id || typeof id !== 'string') return null;
    const cleanId = id.trim().replace(/^[#\s]+/, '').toLowerCase();
    if (!cleanId) return null;

    const list = getRawComplaints();
    
    // 1. Direct exact or case-insensitive match
    const exact = list.find((item) => item.id.toLowerCase() === cleanId);
    if (exact) return exact;

    // 2. Suffix / numeric ID matching (e.g. '1001' or '2026-1001' matching 'CMS-2026-1001')
    const suffixMatch = list.find((item) => {
      const itemId = item.id.toLowerCase();
      return itemId.endsWith(cleanId) || itemId.endsWith(`-${cleanId}`);
    });
    
    return suffixMatch || null;
  },

  /**
   * Create and store a new complaint with dynamic org defaults.
   * Persists to Supabase & localStorage.
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
      org: activeOrg,
      createdAt: now,
      updatedAt: now,
      student: data.student || {
        id: 'usr_student_1',
        name: userLabel,
        email: '',
        rollNo: '',
        room: data.location || locationLabel,
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
      attachments: data.attachments || [],
    };

    list.unshift(newComplaint);
    saveComplaints(list);
    notifyLiveChange({ type: 'create', complaint: newComplaint, id: newId });

    // Sync to Supabase & history in background while attaching promise for awaiters
    const syncPromise = Promise.all([
      syncComplaintToSupabase(newComplaint),
      recordStatusHistoryToSupabase(
        newId,
        STATUSES.PENDING,
        data.student?.name || userLabel,
        'Complaint registered in system.'
      ),
    ]).catch((err) => {
      console.warn('[complaintService.create] Sync warning:', err);
    });

    newComplaint._syncPromise = syncPromise;

    // Background sync to API backend
    ticketApi.create(newComplaint).catch(() => {});

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

    list[index] = complaint;
    saveComplaints(list);
    notifyLiveChange({ type: 'status_change', id, status: newStatus, complaint });

    // Sync to Supabase in background
    syncComplaintToSupabase(complaint);
    recordStatusHistoryToSupabase(id, newStatus, updaterName || 'System', note);

    // Background sync to API backend
    ticketApi.updateStatus(id, newStatus, note).catch(() => {});

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
      id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
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
    notifyLiveChange({ type: 'new_comment', id, comment: newComment, complaint });

    // Sync to Supabase in background
    syncComplaintToSupabase(complaint);
    recordCommentToSupabase(id, newComment);

    // Background sync to API backend
    ticketApi.addComment(id, text, isInternal).catch(() => {});

    return complaint;
  },

  /**
   * Reassign a complaint ticket to another staff member or department.
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

    const reassignmentComment = {
      id: `c_${Date.now()}`,
      senderName: reassignerName || 'Staff',
      senderRole: ROLES.STAFF,
      senderId: typeof reassignedBy === 'object' && reassignedBy ? reassignedBy.id : '',
      text: `[Internal Reassignment] Transferred ticket to ${targetAssignee.name} (${targetAssignee.department}).${
        reason ? ` Reason: ${reason}` : ''
      }`,
      timestamp: now,
      isInternal: true,
    };

    complaint.comments.push(reassignmentComment);

    list[index] = complaint;
    saveComplaints(list);
    notifyLiveChange({ type: 'reassign', id, complaint });

    // Sync to Supabase in background
    syncComplaintToSupabase(complaint);
    recordStatusHistoryToSupabase(id, complaint.status, reassignerName, note);
    recordCommentToSupabase(id, reassignmentComment);

    return complaint;
  },

  /**
   * Propose resolution for a complaint (Staff action).
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
    const propComment = {
      id: `c_${Date.now()}`,
      senderName: staffName,
      senderRole: ROLES.STAFF,
      text: `[Resolution Proposed] ${resolutionNotes || 'Issue has been addressed. Please review and confirm resolution.'}`,
      timestamp: now,
      isInternal: false,
    };
    complaint.comments.push(propComment);

    list[index] = complaint;
    saveComplaints(list);
    notifyLiveChange({ type: 'resolution_proposed', id, complaint });

    // Sync to Supabase in background
    syncComplaintToSupabase(complaint);
    recordStatusHistoryToSupabase(
      id,
      STATUSES.PENDING_CONFIRMATION,
      staffName,
      `Resolution proposed: ${resolutionNotes}`
    );
    recordCommentToSupabase(id, propComment);

    // Background sync to API backend
    ticketApi.proposeResolution(id, resolutionNotes).catch(() => {});

    return complaint;
  },

  /**
   * Confirm resolution (Complainant action).
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
    const confComment = {
      id: `c_${Date.now()}`,
      senderName: userName,
      senderRole: ROLES.STUDENT,
      text: `[Ticket Closed & Confirmed Resolved] ${feedbackNote || 'Confirmed issue is completely resolved. Thank you!'}`,
      timestamp: now,
      isInternal: false,
    };
    complaint.comments.push(confComment);

    list[index] = complaint;
    saveComplaints(list);
    notifyLiveChange({ type: 'resolution_confirmed', id, complaint });

    // Sync to Supabase in background
    syncComplaintToSupabase(complaint);
    recordStatusHistoryToSupabase(
      id,
      STATUSES.RESOLVED,
      userName,
      `Resolution confirmed: ${feedbackNote}`
    );
    recordCommentToSupabase(id, confComment);

    // Background sync to API backend
    ticketApi.confirmResolution(id, feedbackNote).catch(() => {});

    return complaint;
  },

  /**
   * Reject resolution (Complainant action).
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
    const rejComment = {
      id: `c_${Date.now()}`,
      senderName: userName,
      senderRole: ROLES.STUDENT,
      text: `[Resolution Rejected / Reopened] ${rejectionReason || 'The issue is not completely fixed yet. Please inspect further.'}`,
      timestamp: now,
      isInternal: false,
    };
    complaint.comments.push(rejComment);

    list[index] = complaint;
    saveComplaints(list);
    notifyLiveChange({ type: 'resolution_rejected', id, complaint });

    // Sync to Supabase in background
    syncComplaintToSupabase(complaint);
    recordStatusHistoryToSupabase(
      id,
      STATUSES.IN_PROGRESS,
      userName,
      `Resolution rejected: ${rejectionReason}`
    );
    recordCommentToSupabase(id, rejComment);

    // Background sync to API backend
    ticketApi.rejectResolution(id, rejectionReason).catch(() => {});

    return complaint;
  },

  /**
   * Resets local storage complaints back to a clean empty dataset.
   */
  resetToSeedData: () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(ID_COUNTER_KEY, '1000');
    notifyLiveChange({ type: 'reset_seed', count: 0 });
    return [];
  },

  /**
   * Returns analytical metrics summary, optionally filtered by currentOrg.
   * @param {string|Object} org
   */
  getStats: (org) => {
    let list = getRawComplaints();
    if (org) {
      const allowedCategories = getOrgCategories(org);
      list = list.filter((c) => allowedCategories.includes(c.category));
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
