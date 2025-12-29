import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables - will be set in .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if we're in demo/dev mode (no Supabase configured)
export const isDemoMode = !supabaseUrl || !supabaseAnonKey;

// Create Supabase client (singleton) - only if credentials are available
export const supabase: SupabaseClient | null = isDemoMode
  ? null
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });

// Database types (will match our Supabase schema)
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          phone: string | null;
          role: 'admin' | 'project_manager' | 'entrepreneur' | 'accountant';
          is_active: boolean;
          last_login: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          phone?: string | null;
          role: 'admin' | 'project_manager' | 'entrepreneur' | 'accountant';
          is_active?: boolean;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          phone?: string | null;
          role?: 'admin' | 'project_manager' | 'entrepreneur' | 'accountant';
          is_active?: boolean;
          last_login?: string | null;
          updated_at?: string;
        };
      };
      project_assignments: {
        Row: {
          id: string;
          user_id: string;
          project_id: string;
          assigned_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id: string;
          assigned_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string;
          assigned_at?: string;
        };
      };
    };
  };
}
