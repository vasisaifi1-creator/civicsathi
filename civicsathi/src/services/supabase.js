import { createClient } from '@supabase/supabase-js';

// Only the public "anon" key is ever used in the browser. Data is protected by
// Row Level Security in the database. Never add a service_role key to this project.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && /^https?:\/\//.test(SUPABASE_URL)
);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export const IMAGE_BUCKET = 'complaint-images';
