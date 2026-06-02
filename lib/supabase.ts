import { createClient } from '@supabase/supabase-js';
import { assertSupabaseConfigured } from '@/lib/production-config';

assertSupabaseConfigured(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

type SupabaseClient = ReturnType<typeof createClient>;

const missingSupabaseClient = new Proxy(
  {},
  {
    get() {
      throw new Error('Supabase environment variables are missing.');
    },
  },
) as SupabaseClient;

export const supabase = isSupabaseConfigured
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  : missingSupabaseClient;
