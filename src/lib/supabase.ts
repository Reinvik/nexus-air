import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://qtzpzgwyjptbnipvyjdu.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0enB6Z3d5anB0Ym5pcHZ5amR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NDY4MDAsImV4cCI6MjA4MTQyMjgwMH0.An72d0glXpf6RZR5nwQ9OnLeU00loVqkZkNjUJhICA4';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL?.trim()) || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()) || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: { eventsPerSecond: 20 }
  }
});

// Schema de climatización unificado para Nexus Air
export const AIR_SCHEMA = 'air';

export const supabaseAir = supabase.schema(AIR_SCHEMA);
