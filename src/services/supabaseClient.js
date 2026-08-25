import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  !supabaseUrl.includes('your-project-id') &&
  supabaseAnonKey !== 'your_supabase_anon_public_key_here'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // Session managed by Firebase Auth
      },
    })
  : null;

if (!isSupabaseConfigured) {
  console.info(
    '[ResolveX] Supabase is running in local storage fallback mode. Add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local to enable live database persistence.'
  );
}

/**
 * Fetch a user profile from Supabase by UID
 */
export async function getProfileFromSupabase(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.warn('[Supabase getProfile warning]:', error.message);
    }
    return data || null;
  } catch (err) {
    console.warn('[Supabase getProfile error]:', err);
    return null;
  }
}

/**
 * Upsert and persist a user profile in Supabase profiles table
 */
export async function syncUserProfileToSupabase(userProfile, isExplicitUpdate = false) {
  if (!isSupabaseConfigured || !supabase || !userProfile?.id) {
    return userProfile;
  }

  try {
    // 1. Check if profile already exists in Supabase
    const { data: existing, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userProfile.id)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.warn('[Supabase profiles fetch warning]:', fetchError.message);
    }

    // If existing record exists and we are not doing an explicit signup/role update
    if (existing && !isExplicitUpdate) {
      return {
        ...userProfile,
        ...existing,
        role: existing.role || userProfile.role || 'student',
      };
    }

    // 2. Prepare full profile record to upsert
    const profileRecord = {
      id: userProfile.id,
      name: userProfile.name || userProfile.displayName || existing?.name || 'User',
      email: userProfile.email || existing?.email,
      role: isExplicitUpdate ? userProfile.role : (existing?.role || userProfile.role || 'student'),
      org_key: userProfile.orgKey || existing?.org_key || 'COLLEGE',
      avatar_url: userProfile.photoURL || userProfile.avatar || existing?.avatar_url || null,
      created_at: existing?.created_at || new Date().toISOString(),
    };

    const { data: upserted, error: upsertError } = await supabase
      .from('profiles')
      .upsert(profileRecord, { onConflict: 'id' })
      .select()
      .single();

    if (upsertError) {
      console.warn('[Supabase profiles upsert warning]:', upsertError.message);
      return userProfile;
    }

    return {
      ...userProfile,
      ...upserted,
      role: upserted.role,
    };
  } catch (err) {
    console.error('[Supabase syncUserProfile error]:', err);
    return userProfile;
  }
}
