import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
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
  return createClient(url, process.env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${userToken}` } }
  });
}
