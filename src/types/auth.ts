export type UserRole = 'admin' | 'project_manager' | 'entrepreneur' | 'accountant';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at?: string;
  assignedProjects?: string[]; // For project managers and entrepreneurs
}

export interface ProjectAssignment {
  id: string;
  user_id: string;
  project_id: string;
  assigned_at: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: User;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: UserRole;
}

export interface AuthError {
  message: string;
  code?: string;
}

// Re-export to force module reload
export type { AuthError as AuthErrorType };
