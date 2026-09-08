import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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

/**
 * Initializes a Supabase Realtime channel that listens for live database mutations.
 * Calls callback on any INSERT, UPDATE, or DELETE on complaints or comments.
 */
export function initRealtimeSubscription(onPayload) {
  if (!isSupabaseConfigured || !supabase) {
    return () => {};
  }

  const channel = supabase
    .channel('cms-live-realtime-channel')
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
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.info('[Supabase Realtime] Connected to live WebSocket stream.');
      }
    });

  return () => {
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
