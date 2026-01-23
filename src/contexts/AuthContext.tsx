import React, { createContext, useContext, useEffect, useState } from 'react';
import { isDemoMode as isNeonDemoMode } from '../lib/neon';
import type { User, LoginCredentials, RegisterData, AuthError } from '../types/auth';
import {
  authenticateUser,
  getUserById,
  registerUser,
  updateUserPassword,
  saveSession,
  getSession,
  clearSession,
} from '../services/authService';

// Session interface for authentication
interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: User;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
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
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo user for when database is not configured
const DEMO_USER: User = {
  id: 'demo-user',
  email: 'demo@example.com',
  full_name: 'משתמש דמו',
  phone: undefined,
  role: 'admin',
  is_active: true,
  last_login: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  assignedProjects: ['1', '2', '3'],
};

// Determine which database mode we're using
const isDemoMode = isNeonDemoMode;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: !isDemoMode, // In demo mode, no need to check session
  });
  const [error, setError] = useState<AuthError | null>(null);

  // Initialize auth state on mount
  useEffect(() => {
    // In demo mode, we're already authenticated with demo user
    if (isDemoMode) {
      return;
    }

    // Neon mode: Check for stored session
    const session = getSession();
    if (session) {
      // Verify user still exists and is active
      getUserById(session.user.id)
        .then((user) => {
          if (user && user.is_active) {
            setAuthState({
              user,
              session: null,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            clearSession();
            setAuthState({
              user: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        })
        .catch(() => {
          clearSession();
          setAuthState({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
          });
        });
    } else {
      setAuthState({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  // Login with email and password
  const login = async (credentials: LoginCredentials) => {
    // In demo mode, validate against stored credentials
    if (isDemoMode) {
      setError(null);
      setAuthState((prev: AuthState) => ({ ...prev, isLoading: true }));

      // Validate credentials from localStorage
      const storedCredentials = localStorage.getItem('abcon_credentials');
      const storedUsers = localStorage.getItem('abcon_users');

      if (!storedCredentials || !storedUsers) {
        // Initialize with default data if not present
        setAuthState({
          user: DEMO_USER,
          session: null,
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      }

      const creds = JSON.parse(storedCredentials);
      const users = JSON.parse(storedUsers);

      // Check credentials
      if (creds[credentials.email] !== credentials.password) {
        setError({ message: 'אימייל או סיסמה שגויים' });
        setAuthState((prev: AuthState) => ({ ...prev, isLoading: false }));
        throw new Error('אימייל או סיסמה שגויים');
      }

      // Find user
      const user = users.find((u: User) => u.email === credentials.email);
      if (!user) {
        setError({ message: 'משתמש לא נמצא' });
        setAuthState((prev: AuthState) => ({ ...prev, isLoading: false }));
        throw new Error('משתמש לא נמצא');
      }

      // Check if active
      if (!user.is_active) {
        setError({ message: 'חשבון זה אינו פעיל. אנא פנה למנהל המערכת.' });
        setAuthState((prev: AuthState) => ({ ...prev, isLoading: false }));
        throw new Error('חשבון זה אינו פעיל. אנא פנה למנהל המערכת.');
      }

      // Update last login
      const updatedUsers = users.map((u: User) =>
        u.id === user.id ? { ...u, last_login: new Date().toISOString() } : u
      );
      localStorage.setItem('abcon_users', JSON.stringify(updatedUsers));

      setAuthState({
        user: { ...user, last_login: new Date().toISOString() },
        session: null,
        isAuthenticated: true,
        isLoading: false,
      });
      return;
    }

    // Neon mode: Authenticate with password hashing
    try {
      setError(null);
      setAuthState((prev: AuthState) => ({ ...prev, isLoading: true }));

      const user = await authenticateUser(credentials);

      if (!user) {
        setError({ message: 'אימייל או סיסמה שגויים' });
        setAuthState((prev: AuthState) => ({ ...prev, isLoading: false }));
        throw new Error('אימייל או סיסמה שגויים');
      }

      // Save session to localStorage
      saveSession(user);

      setAuthState({
        user,
        session: null,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: unknown) {
      console.error('Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'שגיאה בהתחברות';
      const errorCode = (err as { code?: string })?.code;
      setError({
        message: errorMessage,
        code: errorCode,
      });
      setAuthState((prev: AuthState) => ({ ...prev, isLoading: false }));
      throw err;
    }
  };

  // Logout
  const logout = async () => {
    if (isDemoMode) {
      setAuthState({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return;
    }

    // Neon mode: Clear session from localStorage
    clearSession();
    setAuthState({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  // Register new user (only admins can do this in production)
  const register = async (data: RegisterData) => {
    if (isDemoMode) {
      throw new Error('Registration not available in demo mode');
    }

    try {
      setError(null);
      setAuthState((prev: AuthState) => ({ ...prev, isLoading: true }));

      await registerUser(data);

      setAuthState((prev: AuthState) => ({ ...prev, isLoading: false }));
    } catch (err: unknown) {
      console.error('Registration error:', err);
      const errorMessage = err instanceof Error ? err.message : 'שגיאה ברישום';
      const errorCode = (err as { code?: string })?.code;
      setError({
        message: errorMessage,
        code: errorCode,
      });
      setAuthState((prev: AuthState) => ({ ...prev, isLoading: false }));
      throw err;
    }
  };

  // Send password reset email
  const resetPassword = async (email: string) => {
    if (isDemoMode) {
      throw new Error('Password reset not available in demo mode');
    }

    // Note: Password reset via email would require email service integration
    // For now, this is a placeholder that admin would handle manually
    try {
      setError(null);
      // TODO: Implement email-based password reset with email service
      throw new Error('Password reset feature requires email service configuration');
    } catch (err: unknown) {
      console.error('Password reset error:', err);
      const errorMessage = err instanceof Error ? err.message : 'שגיאה בשליחת אימייל לאיפוס סיסמה';
      const errorCode = (err as { code?: string })?.code;
      setError({
        message: errorMessage,
        code: errorCode,
      });
      throw err;
    }
  };

  // Update password (after reset)
  const updatePassword = async (newPassword: string) => {
    if (isDemoMode) {
      throw new Error('Password update not available in demo mode');
    }

    try {
      setError(null);

      if (!authState.user) {
        throw new Error('No user logged in');
      }

      await updateUserPassword(authState.user.id, newPassword);
    } catch (err: unknown) {
      console.error('Password update error:', err);
      const errorMessage = err instanceof Error ? err.message : 'שגיאה בעדכון סיסמה';
      const errorCode = (err as { code?: string })?.code;
      setError({
        message: errorMessage,
        code: errorCode,
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
    isDemoMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
