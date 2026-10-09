import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anon) {
  // Allow the app (and tests) to boot without credentials; data hooks
  // fall back to an empty state / local demo data until configured.
  console.warn('[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set — running in offline mode.');
}

export const supabase = createClient(url ?? 'https://placeholder.supabase.co', anon ?? 'placeholder-anon-key');

export const isSupabaseConfigured = Boolean(url && anon && !url.includes('placeholder'));
