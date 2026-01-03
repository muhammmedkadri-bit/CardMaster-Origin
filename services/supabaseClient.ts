import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

console.log('[Supabase Debug] URL:', supabaseUrl);
console.log('[Supabase Debug] Key exists:', !!supabaseAnonKey, 'Length:', supabaseAnonKey?.length);

export const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey, {
        realtime: {
            heartbeatIntervalMs: 1000,
        }
    })
    : null;

if (!supabase) {
    console.warn('Supabase configuration missing or invalid. Cloud sync features will be disabled.');
} else {
    // Expose to window for console debugging
    (window as any).supabase = supabase;
    console.log('[Supabase] Client initialized and exposed to window.supabase for debugging');
}
