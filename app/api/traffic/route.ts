import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_URL = 'https://eaijbohetlhmkksptxdj.supabase.co';
const DEFAULT_KEY_B64 = 'c2Jfc2VjcmV0X24wVXUtZEZiTG56LXpYMlVYUTVKN1Ffemowb2t6ODI=';

function getSecretKey(): string {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  try {
    return Buffer.from(DEFAULT_KEY_B64, 'base64').toString('utf-8');
  } catch {
    return '';
  }
}



export async function GET() {
  try {
    const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL).replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
    const key = getSecretKey();

    if (!url || !key) {
      return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 });
    }

    const supabase = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await supabase
      .from('traffic_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Server API error fetching from Supabase:', error);
      return NextResponse.json({ error: error.message, logs: [] }, { status: 500 });
    }

    return NextResponse.json({ logs: data ?? [] });
  } catch (err: any) {
    console.error('Server API exception:', err);
    return NextResponse.json({ error: err.message || 'Internal server error', logs: [] }, { status: 500 });
  }
}
