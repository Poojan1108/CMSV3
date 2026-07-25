/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Backend mail and database services disconnected for demo/showcase version
const isConfigured = false;

export const supabase = null;

export const isSupabaseConfigured = false;

console.info('[Demo Mode] All backend mail and database services are disconnected.');
