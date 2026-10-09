/**
 * complaintApi.js
 * Stateless Supabase PostgREST API Repository
 *
 * Implements clean, relational, production-tested database queries
 * for the Complaint Management System (CMS_V2).
 * Follows the Open-Source Repository Pattern (zero localStorage dependencies).
 */

import { supabase, isSupabaseConfigured } from './supabaseClient.js';

/**
 * Standard relational query selector for complaints.
 * Performs native PostgreSQL LEFT JOINs on comments and status history in a single round-trip.
 */
const COMPLAINT_RELATIONAL_SELECT = `
  *,
  complaint_comments (*),
  complaint_history (*)
`;

export const complaintApi = {
  /**
   * Fetches complaints filtered by tenant and optional criteria with relational comments and history.
   * Pushes filtering to the PostgreSQL database level.
   *
   * @param {Object} [filters={}]
   * @param {string} [filters.orgKey] - Active tenant identifier
   * @param {string} [filters.status] - Lifecycle status ('pending', 'in_progress', etc.)
   * @param {string} [filters.category] - Category name
   * @param {string} [filters.priority] - Priority tier ('low', 'medium', 'high', 'urgent')
   * @param {string} [filters.studentId] - Filter by complainant UUID
   * @param {string} [filters.assignedToId] - Filter by technician UUID
   * @param {string} [filters.search] - Free-text search query
   * @param {string} [filters.sortBy='newest'] - Sort order ('newest', 'oldest', 'priority')
   * @param {number} [filters.limit=100] - Pagination batch limit
   * @param {number} [filters.page=0] - Page offset
   * @returns {Promise<Array>} Normalized complaint records
   */
  async fetchComplaints(filters = {}) {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }

    try {
      const {
        orgKey,
        status,
        category,
        priority,
        studentId,
        assignedToId,
        search,
        sortBy = 'newest',
        limit = 100,
        page = 0,
      } = filters;

      let query = supabase
        .from('complaints')
        .select(COMPLAINT_RELATIONAL_SELECT);

      // Multi-tenant scoping
      if (orgKey && orgKey !== 'ALL') {
        query = query.eq('org_key', orgKey);
      }

      // Filter constraints
      if (status && status !== 'all') {
        query = query.eq('status', status.toLowerCase());
      }
      if (category && category !== 'all' && category !== 'all_org') {
        query = query.eq('category', category);
      }
      if (priority && priority !== 'all') {
        query = query.eq('priority', priority.toLowerCase());
      }
      if (studentId) {
        query = query.eq('student_id', studentId);
      }
      if (assignedToId) {
        query = query.eq('assigned_to_id', assignedToId);
      }

      // Text search filter across title, description, and ID
      if (search && search.trim()) {
        const q = search.trim();
        query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,id.ilike.%${q}%,location.ilike.%${q}%`);
      }

      // Sorting
      if (sortBy === 'oldest') {
        query = query.order('created_at', { ascending: true });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Range pagination
      const from = page * limit;
      query = query.range(from, from + limit - 1);

      const { data, error } = await query;
      if (error) {
        console.warn('[complaintApi.fetchComplaints Error]:', error.message || error);
        throw error;
      }

      return (data || []).map(normalizeComplaintRow);
    } catch (err) {
      console.warn('[complaintApi.fetchComplaints Exception]:', err);
      throw err;
    }
  },

  /**
   * Retrieves a single ticket by ID with relational comments and history.
   * Implements robust, forgiving ID lookup (strips '#', handles case-insensitivity, and suffix matching).
   *
   * @param {string} id - Ticket identifier
   * @returns {Promise<Object|null>} Normalized complaint object or null
   */
  async getComplaintById(id) {
    if (!id || !isSupabaseConfigured || !supabase) return null;

    try {
      const cleanId = String(id).trim().replace(/^[#\s]+/, '');

      // 1. Primary lookup by exact ID (case-insensitive)
      const { data, error } = await supabase
        .from('complaints')
        .select(COMPLAINT_RELATIONAL_SELECT)
        .ilike('id', cleanId)
        .maybeSingle();

      if (!error && data) {
        return normalizeComplaintRow(data);
      }

      // 2. Suffix / numeric fallback matching (e.g. '1001' matching 'CMS-2026-1001')
      const { data: suffixData, error: suffixError } = await supabase
        .from('complaints')
        .select(COMPLAINT_RELATIONAL_SELECT)
        .ilike('id', `%${cleanId}`)
        .limit(1);

      if (!suffixError && suffixData && suffixData.length > 0) {
        return normalizeComplaintRow(suffixData[0]);
      }

      return null;
    } catch (err) {
      console.warn('[complaintApi.getComplaintById Exception]:', err);
      return null;
    }
  },

  /**
   * Inserts a newly lodged complaint into public.complaints.
   *
   * @param {Object} payload - Complaint record
   * @returns {Promise<Object>} Created and normalized complaint
   */
  async insertComplaint(payload) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase client is not configured.');
    }

    try {
      const orgKey = payload.org || payload.org_key || payload.currentOrg || '';
      let resolvedDeptId = payload.departmentId || payload.department_id || null;

      if (!resolvedDeptId && payload.category && orgKey) {
        const { data: dept } = await supabase
          .from('departments')
          .select('id')
          .eq('org_key', orgKey)
          .ilike('name', payload.category)
          .maybeSingle();
        
        if (dept && dept.id) {
          resolvedDeptId = dept.id;
        }
      }

/**
 * Safely sanitizes UUID values to prevent PostgreSQL 22P02 "invalid input syntax for type uuid"
 * errors when demo accounts, empty strings, or string IDs are passed to relational foreign keys.
 */
const toUuidOrNull = (val) =>
  typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim())
    ? val.trim()
    : null;

      const dbPayload = {
        id: payload.id,
        title: payload.title,
        description: payload.description,
        category: payload.category,
        priority: (payload.priority || 'medium').toLowerCase(),
        status: (payload.status || 'pending').toLowerCase(),
        location: payload.location || '',
        org_key: orgKey,
        created_at: payload.createdAt || payload.created_at || new Date().toISOString(),
        updated_at: payload.updatedAt || payload.updated_at || new Date().toISOString(),
        resolved_at: payload.resolvedAt || payload.resolved_at || null,
        student_id: toUuidOrNull(payload.student?.id || payload.studentId),
        student_name: payload.student?.name || payload.studentName || 'Anonymous',
        student_email: payload.student?.email || payload.studentEmail || '',
        student_meta: payload.student || payload.student_meta || {},
        assigned_to: payload.assignedTo || null,
        assigned_to_id: toUuidOrNull(payload.assignedTo?.id || payload.assigned_to_id),
        assigned_to_name: payload.assignedTo?.name || payload.assigned_to_name || null,
        assigned_to_department: payload.assignedTo?.department || payload.assigned_to_department || payload.departmentName || '',
        department_id: toUuidOrNull(resolvedDeptId),
        sla_response_due: payload.slaResponseDue || payload.sla_response_due || null,
        sla_resolve_due: payload.slaResolveDue || payload.sla_resolve_due || null,
        sla_breached: Boolean(payload.slaBreached || payload.sla_breached),
        resolution_details: payload.resolutionDetails || payload.resolution_details || null,
        attachments: payload.attachments || [],
      };

      const { data, error } = await supabase
        .from('complaints')
        .insert([dbPayload])
        .select(COMPLAINT_RELATIONAL_SELECT)
        .single();

      if (error) {
        console.error('[complaintApi.insertComplaint Error]:', error.message || error);
        throw error;
      }

      return normalizeComplaintRow(data);
    } catch (err) {
      console.error('[complaintApi.insertComplaint Exception]:', err);
      throw err;
    }
  },

  /**
   * Performs an atomic partial update on a complaint.
   *
   * @param {string} id - Ticket identifier
   * @param {Object} fields - Updated columns
   * @returns {Promise<Object>} Updated normalized complaint
   */
  async updateComplaint(id, fields) {
    if (!id || !isSupabaseConfigured || !supabase) {
      throw new Error('Supabase client is not configured or missing ID.');
    }

    try {
      const payload = {
        ...fields,
        updated_at: new Date().toISOString(),
      };
      if ('student_id' in fields) payload.student_id = toUuidOrNull(fields.student_id);
      if ('assigned_to_id' in fields) payload.assigned_to_id = toUuidOrNull(fields.assigned_to_id);
      if ('department_id' in fields) payload.department_id = toUuidOrNull(fields.department_id);

      const { data, error } = await supabase
        .from('complaints')
        .update(payload)
        .eq('id', id)
        .select(COMPLAINT_RELATIONAL_SELECT)
        .single();

      if (error) {
        console.error('[complaintApi.updateComplaint Error]:', error.message || error);
        throw error;
      }

      return normalizeComplaintRow(data);
    } catch (err) {
      console.error('[complaintApi.updateComplaint Exception]:', err);
      throw err;
    }
  },

  /**
   * Appends a comment to a ticket thread in public.complaint_comments.
   *
   * @param {Object} commentPayload
   * @returns {Promise<Object>} Inserted comment row
   */
  async insertComment(commentPayload) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase client is not configured.');
    }

    try {
      const payload = {
        id: commentPayload.id || `c_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        complaint_id: commentPayload.complaintId || commentPayload.complaint_id,
        sender_id: toUuidOrNull(commentPayload.senderId || commentPayload.sender_id),
        sender_name: commentPayload.senderName || commentPayload.sender_name || 'Anonymous',
        sender_role: commentPayload.senderRole || commentPayload.sender_role || 'user',
        text: commentPayload.text,
        is_internal: Boolean(commentPayload.isInternal || commentPayload.is_internal),
        created_at: commentPayload.timestamp || commentPayload.created_at || new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('complaint_comments')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error('[complaintApi.insertComment Error]:', error.message || error);
        throw error;
      }

      return {
        id: data.id,
        senderId: data.sender_id,
        senderName: data.sender_name,
        senderRole: data.sender_role,
        text: data.text,
        isInternal: data.is_internal,
        timestamp: data.created_at,
        createdAt: data.created_at,
      };
    } catch (err) {
      console.error('[complaintApi.insertComment Exception]:', err);
      throw err;
    }
  },

  /**
   * Appends a history record to the ticket timeline in public.complaint_history.
   *
   * @param {Object} historyPayload
   * @returns {Promise<Object>} Inserted history row
   */
  async insertHistory(historyPayload) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase client is not configured.');
    }

    try {
      const payload = {
        complaint_id: historyPayload.complaintId || historyPayload.complaint_id,
        status: historyPayload.status,
        updated_by: historyPayload.updatedBy || historyPayload.updated_by || 'System',
        note: historyPayload.note || '',
        created_at: historyPayload.timestamp || historyPayload.created_at || new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('complaint_history')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error('[complaintApi.insertHistory Error]:', error.message || error);
        throw error;
      }

      return data;
    } catch (err) {
      console.error('[complaintApi.insertHistory Exception]:', err);
      throw err;
    }
  },

  /**
   * Fetches active departments for an organization from public.departments.
   *
   * @param {string} orgKey
   * @returns {Promise<Array>}
   */
  async fetchDepartments(orgKey) {
    if (!isSupabaseConfigured || !supabase || !orgKey) return [];
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('org_key', orgKey)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('[complaintApi.fetchDepartments Exception]:', err);
      return [];
    }
  },
};

/**
 * Normalizes a raw Supabase complaint record into the standard camelCase shape
 * expected by UI components across the application.
 */
function normalizeComplaintRow(row) {
  if (!row) return null;

  // Normalize comments from relational join
  const comments = (row.complaint_comments || []).map((c) => ({
    id: c.id,
    senderId: c.sender_id,
    senderName: c.sender_name,
    senderRole: c.sender_role,
    text: c.text,
    isInternal: Boolean(c.is_internal),
    timestamp: c.created_at,
    createdAt: c.created_at,
  }));

  // Normalize history from relational join
  const dbTimeline = (row.complaint_history || []).map((h) => ({
    status: h.status,
    updatedBy: h.updated_by || 'Staff',
    note: h.note || `Status: ${h.status}`,
    timestamp: h.created_at,
  }));

  const hasInitialEntry = dbTimeline.some(
    (h) => (h.status || '').toLowerCase() === 'pending'
  );
  const statusHistory = hasInitialEntry
    ? dbTimeline
    : [
        {
          status: 'pending',
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
    location: row.location || '',
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
    accessDate: row.student_meta?.accessDate || null,
    timeSlot: row.student_meta?.timeSlot || null,
    urgencyJustification: row.student_meta?.urgencyJustification || null,
    student: row.student_meta || {
      id: row.student_id,
      name: row.student_name,
      email: row.student_email,
    },
    student_meta: row.student_meta || {},
    assignedTo: row.assigned_to || (row.assigned_to_id ? {
      id: row.assigned_to_id,
      name: row.assigned_to_name || 'Staff Member',
      department: row.assigned_to_department || '',
    } : null),
    resolutionDetails: row.resolution_details || null,
    statusHistory,
    comments,
  };
}
