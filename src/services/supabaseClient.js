import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  supabaseAnonKey !== 'your_supabase_anon_public_key_here'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

let activeRealtimeChannel = null;

/**
 * Synchronizes user JWT with Supabase Realtime WebSocket transport.
 * Required so PostgreSQL RLS evaluates authenticated SELECT policies for postgres_changes.
 */
export async function setRealtimeAuth(token) {
  if (isSupabaseConfigured && supabase && supabase.realtime) {
    try {
      if (token) {
        await supabase.realtime.setAuth(token);
        console.info('[Supabase Realtime] Auth token synchronized with WebSocket transport.');
      }
    } catch (e) {
      console.warn('[Supabase Realtime] setAuth notice:', e);
    }
  }
}

/**
 * Initializes a Supabase Realtime channel that listens for live database mutations.
 * Calls callback on any INSERT, UPDATE, or DELETE on complaints, comments, or history.
 */
export function initRealtimeSubscription(onPayload) {
  if (!isSupabaseConfigured || !supabase) {
    return () => {};
  }

  if (activeRealtimeChannel) {
    try {
      supabase.removeChannel(activeRealtimeChannel);
    } catch (e) {
      console.warn('[Supabase Realtime] Channel cleanup warning:', e);
    }
    activeRealtimeChannel = null;
  }

  // Ensure active session JWT is passed to Realtime transport to satisfy RLS
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.access_token) {
      setRealtimeAuth(session.access_token);
    }
  }).catch(() => {});

  const channelId = `cms-live-${Date.now()}`;
  const channel = supabase
    .channel(channelId)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'complaints' },
      (payload) => {
        if (typeof onPayload === 'function') {
          onPayload({ type: 'complaint', ...payload });
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'complaint_comments' },
      (payload) => {
        if (typeof onPayload === 'function') {
          onPayload({ type: 'comment', ...payload });
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'complaint_history' },
      (payload) => {
        if (typeof onPayload === 'function') {
          onPayload({ type: 'history', ...payload });
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.info('[Supabase Realtime] Connected to live WebSocket stream.');
      }
    });

  activeRealtimeChannel = channel;

  return () => {
    if (activeRealtimeChannel === channel) {
      activeRealtimeChannel = null;
    }
    supabase.removeChannel(channel);
  };
}

/**
 * Converts a browser File/Blob to a Base64 data URL string.
 */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an attachment to Supabase Storage bucket 'complaint-attachments'.
 * Gracefully falls back to a high-speed Data URL if Supabase Storage is not yet configured or reachable.
 *
 * @param {File} file - The file object from input or drag-and-drop
 * @param {string} [ticketId='draft'] - Associated ticket identifier
 * @returns {Promise<{ id: string, name: string, size: number, type: string, url: string }>}
 */
export async function uploadComplaintAttachment(file, ticketId = 'draft') {
  const fileId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const cleanName = file.name ? file.name.replace(/[^a-zA-Z0-9._-]/g, '_') : 'image.jpg';
  const filePath = `complaints/${ticketId}/${Date.now()}_${cleanName}`;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.storage
        .from('complaint-attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (!error && data) {
        const { data: urlData } = supabase.storage
          .from('complaint-attachments')
          .getPublicUrl(filePath);

        if (urlData?.publicUrl) {
          return {
            id: fileId,
            name: file.name,
            size: file.size,
            type: file.type,
            url: urlData.publicUrl,
            storagePath: filePath,
          };
        }
      } else if (error) {
        console.warn('[Supabase Storage] Upload error, using Data URL fallback:', error.message);
      }
    } catch (err) {
      console.warn('[Supabase Storage] Upload exception, using Data URL fallback:', err);
    }
  }

  // Resilient fallback: data URL ensures the image displays immediately without failure
  try {
    const dataUrl = await fileToDataUrl(file);
    return {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      url: dataUrl,
    };
  } catch (err) {
    console.error('Failed to convert file to data URL:', err);
    return {
      id: fileId,
      name: file.name || 'image.jpg',
      size: file.size || 0,
      type: file.type || 'image/jpeg',
      url: '',
    };
  }
}

/**
 * Retrieves the application profile for an authenticated Supabase user.
 *
 * @param {string} userId - auth.users UUID
 * @returns {Promise<object|null>} Profile record or null if not found
 */
export async function getUserProfile(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[Supabase getUserProfile Error]:', error.message);
      return null;
    }
    return data || null;
  } catch (err) {
    console.warn('[Supabase getUserProfile Exception]:', err);
    return null;
  }
}

/**
 * Upserts a profile record in the public.profiles table.
 *
 * @param {object} profile - Profile data containing id, name, email, role, org_key
 * @returns {Promise<object|null>} The saved profile or null
 */
export async function upsertUserProfile(profile) {
  if (!isSupabaseConfigured || !supabase || !profile?.id) return null;
  try {
    const payload = {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: (profile.role || 'student').toLowerCase(),
      org_key: profile.org_key || profile.orgKey || null,
      department_id: profile.department_id || profile.departmentId || null,
      avatar_url: profile.avatar_url || profile.avatar || null,
      phone: profile.phone || null,
      roll_no: profile.roll_no || profile.rollNo || null,
      room_no: profile.room_no || profile.room || null,
      assigned_categories: profile.assigned_categories || profile.assignedCategories || [],
      updated_at: new Date().toISOString(),
    };

    if (!payload.org_key) {
      console.warn('[Supabase upsertUserProfile Warning]: Missing org_key in profile, aborting broken profile write.');
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert([payload], { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) {
      console.warn('[Supabase upsertUserProfile Error]:', error.message);
      return null;
    }
    return data || payload;
  } catch (err) {
    console.warn('[Supabase upsertUserProfile Exception]:', err);
    return null;
  }
}

/**
 * Fetches all registered member profiles within a given organization.
 * Used to populate live staff reassignment dropdowns and department rosters.
 *
 * @param {string} orgKey - Organization key
 * @returns {Promise<Array>} Array of normalized profile objects
 */
export async function fetchOrgProfiles(orgKey) {
  if (!isSupabaseConfigured || !supabase || !orgKey) return [];
  try {
    let query = supabase
      .from('profiles')
      .select('*')
      .in('role', ['staff', 'admin']);

    if (orgKey !== 'ALL') {
      query = query.eq('org_key', orgKey);
    }
    const { data, error } = await query;
    if (error) {
      console.warn('[Supabase fetchOrgProfiles Error]:', error.message);
      return [];
    }
    return (data || []).map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      role: (p.role || 'staff').toLowerCase(),
      orgKey: p.org_key,
      department: p.department_name || '',
      departmentId: p.department_id,
      avatar: p.avatar_url,
      phone: p.phone,
      rollNo: p.roll_no,
      room: p.room_no,
      assignedCategories: p.assigned_categories || [],
    }));
  } catch (err) {
    console.warn('[Supabase fetchOrgProfiles Exception]:', err);
    return [];
  }
}

/**
 * Fetches all active organizations from Supabase public.organizations table.
 */
export async function fetchOrganizations() {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('[Supabase Org] fetchOrganizations error:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('[Supabase Org] fetchOrganizations exception:', err);
    return [];
  }
}

/**
 * Inserts a newly declared custom organization into Supabase public.organizations.
 */
export async function createOrganization(orgData) {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('organizations')
      .insert({
        org_key: orgData.org_key,
        name: orgData.name,
        type: orgData.type || 'college',
        user_term: orgData.user_term || 'Member',
        staff_term: orgData.staff_term || 'Staff',
        admin_term: orgData.admin_term || 'Admin',
        location_label: orgData.location_label || 'Location / Address',
        categories: orgData.categories || [],
      })
      .select()
      .single();

    if (error) {
      console.error('[Supabase Org] createOrganization error:', error.message);
      throw error;
    }
    return data;
  } catch (err) {
    console.error('[Supabase Org] createOrganization exception:', err);
    throw err;
  }
}


