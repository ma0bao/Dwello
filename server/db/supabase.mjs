import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!url || !key || !anonKey) {
  throw new Error(
    'Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_ANON_KEY. ' +
    'Copy .env.example to .env and fill in your Supabase project credentials.'
  );
}

// Service role client: bypasses RLS — backend use only, never expose to browser.
export const supabase = createClient(url, key, {
  auth: { persistSession: false }
});

// Creates a per-request client that enforces RLS using the user's JWT.
// Use this in all user-facing route handlers instead of the service-role client.
export function createUserClient(userToken) {
  return createClient(url, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${userToken}` } }
  });
}
