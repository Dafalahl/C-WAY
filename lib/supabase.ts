import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface TrafficLog {
  id?: number;
  created_at?: string;
  node_id?: string;
  location?: string;
  distance_cm?: number;
  speed_kmh?: number;
  risk_score?: number;
  status: 'AMAN' | 'WASPADA' | 'BAHAYA';
}

// Inisialisasi Supabase Client (bisa dari ENV atau localStorage)
export function getSupabaseClient(): SupabaseClient | null {
  if (typeof window === 'undefined') {
    const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (envUrl && envKey) return createClient(envUrl, envKey);
    return null;
  }

  const storedUrl = localStorage.getItem('cway_supabase_url') || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const storedKey = localStorage.getItem('cway_supabase_key') || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (storedUrl && storedKey) {
    try {
      return createClient(storedUrl, storedKey);
    } catch (e) {
      console.error('Error creating Supabase client:', e);
      return null;
    }
  }

  return null;
}

