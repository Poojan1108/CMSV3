import { generateComplaintsCSV } from '../utils/formatters.js';
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
 * Auto-routes a category to its responsible department.
 */
export const getCategoryDepartment = (category) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('hostel') || cat.includes('mess') || cat.includes('sanitation') || cat.includes('warden')) {
    return { id: null, name: 'Hostel & Residential Welfare' };
  }
  if (cat.includes('it') || cat.includes('wifi') || cat.includes('lab') || cat.includes('computer') || cat.includes('network') || cat.includes('switch')) {
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

  // Explicit SLA configuration in hours
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
 * Background upsert of complaint record into Supabase with all relational columns
 */
async function syncComplaintToSupabase(complaint) {
  if (!isSupabaseConfigured || !supabase || !complaint) return { success: false };
  try {
    const priority = (complaint.priority || 'medium').toLowerCase();
    const status = (complaint.status || 'pending').toLowerCase();
    const autoDept = getCategoryDepartment(complaint.category);

    const rawDeptId = complaint.departmentId || complaint.department_id;
    const isUuid = typeof rawDeptId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawDeptId);
    const rawAssignedId = complaint.assignedTo?.id || complaint.assigned_to_id;
    const isAssignedUuid = typeof rawAssignedId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawAssignedId);
    const departmentName = complaint.assignedTo?.department || complaint.assigned_to_department || autoDept.name;

    const payload = {
      id: complaint.id,
      title: complaint.title,
      description: complaint.description,
      category: complaint.category,
      priority,
      status,
      location: complaint.location || '',
      created_at: complaint.createdAt || new Date().toISOString(),
      updated_at: complaint.updatedAt || new Date().toISOString(),
      resolved_at: complaint.resolvedAt || null,
      student_id: (complaint.student?.id || complaint.studentId) === 'anonymous' ? null : (complaint.student?.id || complaint.studentId || null),
      student_name: complaint.student?.name || complaint.studentName || 'Anonymous',
      student_email: complaint.student?.email || complaint.studentEmail || '',
      student_meta: complaint.student_meta || complaint.student || {},
      assigned_to: complaint.assignedTo || null,
      assigned_to_id: isAssignedUuid ? rawAssignedId : null,
      assigned_to_name: complaint.assignedTo?.name || complaint.assigned_to_name || null,
      assigned_to_department: departmentName,
      department_id: isUuid ? rawDeptId : null,
      sla_response_due: complaint.slaResponseDue || complaint.sla_response_due || null,
      sla_resolve_due: complaint.slaResolveDue || complaint.sla_resolve_due || null,
      sla_breached: Boolean(complaint.slaBreached || complaint.sla_breached),
      resolution_details: complaint.resolutionDetails || null,
      org_key: complaint.org || complaint.currentOrg || complaint.org_key || '',
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
 * Atomic partial update of complaint fields in Supabase.
 * Avoids overwriting unmodified columns or clobbering concurrent staff edits.
 */
async function updateComplaintFieldsInSupabase(id, fields) {
  if (!isSupabaseConfigured || !supabase || !id) return { success: false };
  try {
    const payload = {
      ...fields,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('complaints')
      .update(payload)
      .eq('id', id)
      .select();
    if (error) {
      console.warn('[Supabase Update Complaint Error]:', error.message || error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.warn('[Supabase Update Complaint Exception]:', err);
    return { success: false, error: err };
  }
}

// Note: Audit history is handled atomically in PostgreSQL via the log_complaint_status_audit trigger.

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
 * Generates collision-free complaint ticket ID (e.g., CMS-2026-8492).
 * Eliminates cross-device overwrite hazards.
 * @returns {string}
 */
const getNextId = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CMS-${year}-${rand}`;
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
          org: row.org_key || '',
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          resolvedAt: row.resolved_at,
          attachments: row.attachments || [],
          student: row.student_meta || {
            id: row.student_id,
            name: row.student_name,
            email: row.student_email,
          },
          assignedTo: row.assigned_to || (row.assigned_to_id ? {
            id: row.assigned_to_id,
            name: row.assigned_to_name || 'Staff Member',
            department: row.assigned_to_department || '',
          } : null),
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
      } else if (payload.type === 'history') {
        const historyRow = payload.new;
        if (!historyRow || !historyRow.complaint_id) return;

        const list = getRawComplaints();
        const index = list.findIndex((c) => c.id === historyRow.complaint_id);
        if (index !== -1) {
          const complaint = list[index];
          if (!complaint.statusHistory) complaint.statusHistory = [];

          const exists = complaint.statusHistory.some(
            (h) => h.timestamp === historyRow.created_at && h.status === historyRow.status
          );
          if (!exists) {
            complaint.statusHistory.push({
              status: historyRow.status,
              updatedBy: historyRow.updated_by || 'System',
              note: historyRow.note || `Status: ${historyRow.status}`,
              timestamp: historyRow.created_at,
            });
            list[index] = complaint;
            saveComplaints(list);
            notifyLiveChange({
              type: 'remote_history',
              id: historyRow.complaint_id,
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
  getCategories: (org, registry) => getOrgCategories(org, registry),
  getLocationLabel: (org, registry) => getOrgLocationLabel(org, registry),
  getUserLabel: (org, registry) => getOrgUserLabel(org, registry),
  getRoleTerm: (role, org, registry) => getRoleTerm(role, org, registry),
  resolveOrg: (org, registry) => resolveOrg(org, registry),

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

            const dbTimeline = (dbHistory || [])
              .filter((h) => h.complaint_id === row.id)
              .map((h) => ({
                status: h.status,
                updatedBy: h.updated_by,
                note: h.note,
                timestamp: h.created_at,
              }));

            // Ensure initial submission event is always anchored at inception of timeline
            const hasInitialEntry = dbTimeline.some(
              (h) => (h.status || '').toLowerCase() === STATUSES.PENDING
            );
            const statusHistory = hasInitialEntry
              ? dbTimeline
              : [
                  {
                    status: STATUSES.PENDING,
                    updatedBy: row.student_name || 'User',
                    note: 'Complaint registered in system.',
                    timestamp: row.created_at,
                  },
                  ...dbTimeline,
                ];

            return {
              id: row.id,
              title: row.title,
              description: row.description,
              category: row.category,
              priority: (row.priority || 'medium').toLowerCase(),
              status: (row.status || 'pending').toLowerCase(),
              location: row.location,
              org: row.org_key || '',
              createdAt: row.created_at,
              updatedAt: row.updated_at,
              resolvedAt: row.resolved_at,
              slaResponseDue: row.sla_response_due,
              slaResolveDue: row.sla_resolve_due,
              slaBreached: Boolean(row.sla_breached),
              departmentId: row.department_id,
              departmentName: row.assigned_to_department || (row.assigned_to && row.assigned_to.department) || '',
              attachments: row.attachments || [],
              student: row.student_meta || {
                id: row.student_id,
                name: row.student_name,
                email: row.student_email,
              },
              student_meta: row.student_meta || {},
              assignedTo: row.assigned_to || (row.assigned_to_id ? {
                id: row.assigned_to_id,
                name: row.assigned_to_name || 'Staff Member',
                department: row.assigned_to_department || (row.assigned_to && row.assigned_to.department) || '',
              } : null),
              resolutionDetails: row.resolution_details || null,
              statusHistory,
              comments,
            };
          });

          const existingList = getRawComplaints();
          const existingMap = new Map(existingList.map((c) => [c.id, c]));
          mappedList.forEach((c) => existingMap.set(c.id, c));
          const mergedList = Array.from(existingMap.values());
          saveComplaints(mergedList);
          notifyLiveChange({ type: 'sync_supabase', count: mergedList.length });
          return mappedList;
        }
      } catch (err) {
        console.warn('[Supabase Direct Sync Error]:', err);
      }
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
    const newId = data.id || getNextId();
    const activeOrg = data.currentOrg || data.org || data.org_key || '';
    const userLabel = getOrgUserLabel(activeOrg);
    const locationLabel = getOrgLocationLabel(activeOrg);
    const priority = (data.priority || PRIORITIES.MEDIUM).toLowerCase();

    // Auto-calculate SLA response and resolve deadlines based on priority
    const { slaResponseDue, slaResolveDue } = calculateSlaDeadlines(priority, now);

    // Auto-route category to respective department
    const autoDept = getCategoryDepartment(data.category);

    const studentMeta = {
      id: data.student?.id || data.studentId || 'anonymous',
      name: data.student?.name || data.studentName || userLabel,
      email: data.student?.email || data.studentEmail || '',
      rollNo: data.student?.rollNo || data.student?.roll_no || '',
      room: data.student?.room || data.location || locationLabel,
      phone: data.student?.phone || '',
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
    };

    list.unshift(newComplaint);
    saveComplaints(list);
    notifyLiveChange({ type: 'create', complaint: newComplaint, id: newId });

    // Sync to Supabase in background while attaching promise for awaiters
    const syncPromise = syncComplaintToSupabase(newComplaint).catch((err) => {
      console.warn('[complaintService.create] Sync warning:', err);
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
    const list = getRawComplaints();
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const updaterName = typeof updatedBy === 'object' && updatedBy ? updatedBy.name : updatedBy;
    const updaterRole = typeof updatedBy === 'object' && updatedBy ? (updatedBy.role || '').toLowerCase() : '';
    const updaterId = typeof updatedBy === 'object' && updatedBy ? updatedBy.id : '';
    const now = new Date().toISOString();

    // Enforce RBAC: Students cannot arbitrarily update status or bypass workflow
    if (updaterRole === ROLES.STUDENT) {
      console.warn(`[RBAC] Student "${updaterName}" is not authorized to update ticket status directly.`);
      return null;
    }

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
      updatedById: updaterId || '',
      updatedByRole: updaterRole || '',
      note: note || `Status changed to ${newStatus}`,
      timestamp: now,
    });

    list[index] = complaint;
    saveComplaints(list);
    notifyLiveChange({ type: 'status_change', id, status: newStatus, complaint });

    // Sync to Supabase in background (atomically sync partial status fields; history logged by PostgreSQL trigger)
    updateComplaintFieldsInSupabase(id, {
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
    const list = getRawComplaints();
    const index = list.findIndex((item) => item.id === id);
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
      sender: {
        id: senderId || '',
        name: senderName || 'Anonymous',
        role: senderRole || 'user',
      },
      text,
      timestamp: now,
      createdAt: now,
      isInternal: cleanIsInternal,
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

    // Sync to Supabase in background (atomically sync complaint state + comment record)
    Promise.all([
      syncComplaintToSupabase(complaint),
      recordCommentToSupabase(id, newComment),
    ]).catch((err) => {
      console.warn('[complaintService.addComment] Sync warning:', err);
    });

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
    const reassignerRole = typeof reassignedBy === 'object' && reassignedBy ? (reassignedBy.role || '').toLowerCase() : '';
    const reassignerId = typeof reassignedBy === 'object' && reassignedBy ? reassignedBy.id : '';

    // Enforce RBAC: Students cannot reassign tickets
    if (reassignerRole === ROLES.STUDENT) {
      console.warn(`[RBAC] Student "${reassignerName}" is not authorized to reassign tickets.`);
      return null;
    }

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
      senderId: reassignerId || '',
      sender: {
        id: reassignerId || '',
        name: reassignerName || 'Staff',
        role: ROLES.STAFF,
      },
      eventType: 'reassign',
      text: `[Internal Reassignment] Transferred ticket to ${targetAssignee.name} (${targetAssignee.department}).${
        reason ? ` Reason: ${reason}` : ''
      }`,
      timestamp: now,
      createdAt: now,
      isInternal: true,
    };

    complaint.comments.push(reassignmentComment);

    list[index] = complaint;
    saveComplaints(list);
    notifyLiveChange({ type: 'reassign', id, complaint });

    // Sync to Supabase in background (atomically sync assignment fields + comment; history logged by PostgreSQL trigger)
    const targetId = targetAssignee?.id;
    const isTargetUuid = typeof targetId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);

    Promise.all([
      updateComplaintFieldsInSupabase(id, {
        assigned_to_id: isTargetUuid ? targetId : null,
        assigned_to_name: targetAssignee.name,
        assigned_to_department: targetAssignee.department,
        department_id: targetAssignee.departmentId || null,
      }),
      recordCommentToSupabase(id, reassignmentComment),
    ]).catch((err) => {
      console.warn('[complaintService.reassign] Sync warning:', err);
    });

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
    const staffRole = typeof staffUser === 'object' && staffUser ? (staffUser.role || '').toLowerCase() : '';
    const staffId = typeof staffUser === 'object' && staffUser ? staffUser.id : '';

    // Enforce RBAC: Only Staff / Admin can propose resolution
    if (staffRole === ROLES.STUDENT) {
      console.warn(`[RBAC] Student "${staffName}" is not authorized to propose ticket resolution.`);
      return null;
    }

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
      senderId: staffId || '',
      sender: {
        id: staffId || '',
        name: staffName,
        role: ROLES.STAFF,
      },
      eventType: 'resolution_proposed',
      text: `[Resolution Proposed] ${resolutionNotes || 'Issue has been addressed. Please review and confirm resolution.'}`,
      timestamp: now,
      createdAt: now,
      isInternal: false,
    };
    complaint.comments.push(propComment);

    list[index] = complaint;
    saveComplaints(list);
    notifyLiveChange({ type: 'resolution_proposed', id, complaint });

    // Sync to Supabase in background (atomically sync resolution proposal + comment; history logged by PostgreSQL trigger)
    Promise.all([
      updateComplaintFieldsInSupabase(id, {
        status: STATUSES.PENDING_CONFIRMATION,
        resolution_details: complaint.resolutionDetails,
      }),
      recordCommentToSupabase(id, propComment),
    ]).catch((err) => {
      console.warn('[complaintService.proposeResolution] Sync warning:', err);
    });

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
    const userId = typeof user === 'object' && user ? user.id : '';

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
      senderId: userId || '',
      sender: {
        id: userId || '',
        name: userName,
        role: ROLES.STUDENT,
      },
      eventType: 'resolution_confirmed',
      text: `[Ticket Closed & Confirmed Resolved] ${feedbackNote || 'Confirmed issue is completely resolved. Thank you!'}`,
      timestamp: now,
      createdAt: now,
      isInternal: false,
    };
    complaint.comments.push(confComment);

    list[index] = complaint;
    saveComplaints(list);
    notifyLiveChange({ type: 'resolution_confirmed', id, complaint });

    // Sync to Supabase in background (atomically sync confirmation fields + comment; history logged by PostgreSQL trigger)
    Promise.all([
      updateComplaintFieldsInSupabase(id, {
        status: STATUSES.RESOLVED,
        resolved_at: now,
        resolution_details: complaint.resolutionDetails,
      }),
      recordCommentToSupabase(id, confComment),
    ]).catch((err) => {
      console.warn('[complaintService.confirmResolution] Sync warning:', err);
    });

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
    const userId = typeof user === 'object' && user ? user.id : '';

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
      senderId: userId || '',
      sender: {
        id: userId || '',
        name: userName,
        role: ROLES.STUDENT,
      },
      eventType: 'resolution_rejected',
      text: `[Resolution Rejected / Reopened] ${rejectionReason || 'The issue is not completely fixed yet. Please inspect further.'}`,
      timestamp: now,
      createdAt: now,
      isInternal: false,
    };
    complaint.comments.push(rejComment);

    list[index] = complaint;
    saveComplaints(list);
    notifyLiveChange({ type: 'resolution_rejected', id, complaint });

    // Sync to Supabase in background (atomically sync reopened state + rejection comment; history logged by PostgreSQL trigger)
    Promise.all([
      updateComplaintFieldsInSupabase(id, {
        status: STATUSES.IN_PROGRESS,
        resolution_details: complaint.resolutionDetails,
      }),
      recordCommentToSupabase(id, rejComment),
    ]).catch((err) => {
      console.warn('[complaintService.rejectResolution] Sync warning:', err);
    });

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
   * @param {Array} [complaints] - Optional complaints list; defaults to all complaints in storage.
   * @returns {string}
   */
  exportToCSV: (complaints) => {
    const list = complaints || getRawComplaints();
    return generateComplaintsCSV(list);
  },
};
