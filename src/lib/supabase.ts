import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL?.trim()) || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()) || 'placeholder-anon-key';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  // console.info('Nexus Air: Operando en modo local reactivo con almacenamiento sincronizado.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: { eventsPerSecond: 20 }
  }
});

// Schema de climatización unificado para Nexus Air
export const AIR_SCHEMA = 'air';

export const supabaseAir = supabase.schema(AIR_SCHEMA);
