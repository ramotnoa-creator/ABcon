import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User, LoginCredentials, RegisterData } from '../types/auth';
import type { Session as SupabaseSession } from '@supabase/supabase-js';

// Define AuthError and AuthState inline to avoid module import issues
interface AuthError {
  message: string;
  code?: string;
}

interface AuthState {
  user: User | null;
  session: SupabaseSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType {
  user: User | null;
  session: SupabaseSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  hasRole: (roles: string[]) => boolean;
  error: AuthError | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const [error, setError] = useState<AuthError | null>(null);

  // Fetch user profile from user_profiles table
  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*, project_assignments(project_id)')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      // Transform database row to User type
      const user: User = {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        phone: data.phone,
        role: data.role,
        is_active: data.is_active,
        last_login: data.last_login,
        created_at: data.created_at,
        updated_at: data.updated_at,
        assignedProjects: data.project_assignments?.map((pa: any) => pa.project_id) || [],
      };

      return user;
    } catch (err) {
      console.error('Unexpected error fetching user profile:', err);
      return null;
    }
  };

  // Update last login timestamp
  const updateLastLogin = async (userId: string) => {
    await supabase
      .from('user_profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId);
  };

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          setAuthState({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return;
        }

        if (session?.user) {
          const userProfile = await fetchUserProfile(session.user.id);

          if (userProfile) {
            setAuthState({
              user: userProfile,
              session,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            setAuthState({
              user: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } else {
          setAuthState({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setAuthState({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);

        if (event === 'SIGNED_IN' && session?.user) {
          const userProfile = await fetchUserProfile(session.user.id);

          if (userProfile) {
            await updateLastLogin(session.user.id);
            setAuthState({
              user: userProfile,
              session,
              isAuthenticated: true,
              isLoading: false,
            });
          }
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } else if (event === 'TOKEN_REFRESHED' && session) {
          // Keep user profile, just update session
          setAuthState((prev: AuthState) => ({
            ...prev,
            session,
          }));
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Login with email and password
  const login = async (credentials: LoginCredentials) => {
    try {
      setError(null);
      setAuthState((prev: AuthState) => ({ ...prev, isLoading: true }));

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (signInError) {
        throw signInError;
      }

      if (!data.user) {
        throw new Error('No user returned from login');
      }

      // Fetch user profile
      const userProfile = await fetchUserProfile(data.user.id);

      if (!userProfile) {
        throw new Error('User profile not found');
      }

      // Check if user is active
      if (!userProfile.is_active) {
        await supabase.auth.signOut();
        throw new Error('חשבון זה אינו פעיל. אנא פנה למנהל המערכת.');
      }

      // Update last login
      await updateLastLogin(data.user.id);

      setAuthState({
        user: userProfile,
        session: data.session,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      console.error('Login error:', err);
      setError({
        message: err.message || 'שגיאה בהתחברות',
        code: err.code,
      });
      setAuthState((prev: AuthState) => ({ ...prev, isLoading: false }));
      throw err;
    }
  };

  // Logout
  const logout = async () => {
    try {
      setError(null);
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        throw signOutError;
      }

      setAuthState({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (err: any) {
      console.error('Logout error:', err);
      setError({
        message: err.message || 'שגיאה בהתנתקות',
        code: err.code,
      });
      throw err;
    }
  };

  // Register new user (only admins can do this in production)
  const register = async (data: RegisterData) => {
    try {
      setError(null);
      setAuthState((prev: AuthState) => ({ ...prev, isLoading: true }));

      // Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!authData.user) {
        throw new Error('No user returned from registration');
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([
          {
            id: authData.user.id,
            email: data.email,
            full_name: data.full_name,
            phone: data.phone,
            role: data.role,
            is_active: true,
            created_at: new Date().toISOString(),
          },
        ]);

      if (profileError) {
        // If profile creation fails, we should delete the auth user
        // But Supabase doesn't allow client-side user deletion
        // This would need to be handled server-side
        console.error('Profile creation error:', profileError);
        throw new Error('Failed to create user profile');
      }

      setAuthState((prev: AuthState) => ({ ...prev, isLoading: false }));
    } catch (err: any) {
      console.error('Registration error:', err);
      setError({
        message: err.message || 'שגיאה ברישום',
        code: err.code,
      });
      setAuthState((prev: AuthState) => ({ ...prev, isLoading: false }));
      throw err;
    }
  };

  // Send password reset email
  const resetPassword = async (email: string) => {
    try {
      setError(null);

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        throw resetError;
      }
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError({
        message: err.message || 'שגיאה בשליחת אימייל לאיפוס סיסמה',
        code: err.code,
      });
      throw err;
    }
  };

  // Update password (after reset)
  const updatePassword = async (newPassword: string) => {
    try {
      setError(null);

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }
    } catch (err: any) {
      console.error('Password update error:', err);
      setError({
        message: err.message || 'שגיאה בעדכון סיסמה',
        code: err.code,
      });
      throw err;
    }
  };

  // Check if user has one of the specified roles
  const hasRole = (roles: string[]): boolean => {
    return authState.user ? roles.includes(authState.user.role) : false;
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user: authState.user,
    session: authState.session,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    login,
    logout,
    register,
    resetPassword,
    updatePassword,
    hasRole,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
