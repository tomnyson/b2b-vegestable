import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!;
if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error(
    'Missing Supabase environment variables. Please define NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in .env.local'
  );
}

// Client instance for use in frontend code
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin instance for backend use only (e.g., creating users)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});