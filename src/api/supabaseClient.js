import { createClient } from '@supabase/supabase-js';

// These are safe to expose in a public (client-side) build: the anon key is
// designed to be public and is protected by Row Level Security on the database.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Surface a clear message instead of a cryptic runtime crash.
  console.error(
    'Missing Supabase config. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY ' +
    'in .env.local (local dev) or as build-time env vars (deploy).'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

// Name of the Storage bucket used for uploaded files (signs, plans, etc.).
export const STORAGE_BUCKET = 'uploads';
