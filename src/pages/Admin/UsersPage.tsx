import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { canManageUsers, getRoleDisplayName, getAvailableRoles } from '../../utils/permissions';
import { getProjects } from '../../data/storage';
import type { User, UserRole } from '../../types/auth';
import type { Project } from '../../types';

// Mock users data for development - will be replaced with Supabase
const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'admin@anproyektim.com',
    full_name: 'יוסי כהן',
    phone: '050-1234567',
    role: 'admin',
    is_active: true,
    last_login: '2026-01-13T10:00:00Z',
    created_at: '2025-01-01T00:00:00Z',
    assignedProjects: [],
  },
  {
    id: '2',
    email: 'pm@anproyektim.com',
    full_name: 'דני לוי',
    phone: '050-2345678',
    role: 'project_manager',
    is_active: true,
    last_login: '2026-01-12T14:30:00Z',
    created_at: '2025-02-15T00:00:00Z',
    assignedProjects: ['1', '2'],
  },
  {
    id: '3',
    email: 'entrepreneur@client.com',
    full_name: 'משה אברהם',
    phone: '050-3456789',
    role: 'entrepreneur',
    is_active: true,
    last_login: '2026-01-10T09:15:00Z',
    created_at: '2025-03-20T00:00:00Z',
    assignedProjects: ['1'],
  },
  {
    id: '4',
    email: 'accountant@office.com',
    full_name: 'שרה גולד',
    phone: '050-4567890',
    role: 'accountant',
    is_active: true,
    last_login: '2026-01-11T16:45:00Z',
    created_at: '2025-04-10T00:00:00Z',
    assignedProjects: [],
  },
  {
    id: '5',
    email: 'inactive@example.com',
    full_name: 'אבי ישראלי',
    phone: '050-5678901',
    role: 'project_manager',
    is_active: false,
    last_login: '2025-12-01T10:00:00Z',
    created_at: '2025-05-01T00:00:00Z',
    assignedProjects: ['3'],
  },
];

// Storage keys
const USERS_STORAGE_KEY = 'abcon_users';
const CREDENTIALS_STORAGE_KEY = 'abcon_credentials';

// Generate a temporary password
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Get users from localStorage or use mock data
function getUsers(): User[] {
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(MOCK_USERS));
  // Set default credentials for mock users
  const defaultCredentials: Record<string, string> = {
    'admin@anproyektim.com': 'admin123',
    'pm@anproyektim.com': 'pm123456',
    'entrepreneur@client.com': 'client123',
    'accountant@office.com': 'account123',
    'inactive@example.com': 'inactive123',
  };
  localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(defaultCredentials));
  return MOCK_USERS;
}

// Save users to localStorage
function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

// Save user credentials
function saveCredential(email: string, password: string): void {
  const stored = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
  const credentials = stored ? JSON.parse(stored) : {};
  credentials[email] = password;
  localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(credentials));
}

// Export for use in login
export function validateCredentials(email: string, password: string): User | null {
  const credentials = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
  if (!credentials) return null;

  const creds = JSON.parse(credentials);
  if (creds[email] !== password) return null;

  const users = getUsers();
  const user = users.find(u => u.email === email);
  if (!user || !user.is_active) return null;

  return user;
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showAssignmentsModal, setShowAssignmentsModal] = useState(false);
  const [selectedUserForAssignment, setSelectedUserForAssignment] = useState<User | null>(null);
  const [resetPasswordInfo, setResetPasswordInfo] = useState<{ user: User; tempPassword: string } | null>(null);

  // Check permission
  if (!canManageUsers(currentUser)) {
    return (
      <div className="flex-1 px-4 lg:px-10 py-6 max-w-[1400px] mx-auto w-full">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <span className="material-symbols-outlined text-red-500 text-4xl mb-2">block</span>
          <h2 className="text-xl font-bold text-red-700 dark:text-red-300 mb-2">אין הרשאה</h2>
          <p className="text-red-600 dark:text-red-400">רק מנהל ראשי יכול לגשת לדף זה</p>
        </div>
      </div>
    );
  }

  // Load users on mount
  useEffect(() => {
    setUsers(getUsers());
  }, []);

  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.full_name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          u.phone?.toLowerCase().includes(query)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    // Active filter
    if (activeFilter === 'active') {
      filtered = filtered.filter((u) => u.is_active);
    } else if (activeFilter === 'inactive') {
      filtered = filtered.filter((u) => !u.is_active);
    }

    return filtered;
  }, [users, searchQuery, roleFilter, activeFilter]);

  const handleToggleActive = (userId: string) => {
    const updatedUsers = users.map((u) =>
      u.id === userId ? { ...u, is_active: !u.is_active, updated_at: new Date().toISOString() } : u
    );
    setUsers(updatedUsers);
    saveUsers(updatedUsers);
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser?.id) {
      alert('לא ניתן למחוק את המשתמש שלך');
      return;
    }
    if (window.confirm('האם אתה בטוח שברצונך למחוק משתמש זה?')) {
      const updatedUsers = users.filter((u) => u.id !== userId);
      setUsers(updatedUsers);
      saveUsers(updatedUsers);
    }
  };

  const handleSaveUser = (userData: Partial<User> & { password?: string; assignedProjects?: string[] }) => {
    if (editingUser) {
      // Update existing user
      const { password, assignedProjects, ...userDataWithoutPassword } = userData;
      const updatedUsers = users.map((u) =>
        u.id === editingUser.id
          ? { ...u, ...userDataWithoutPassword, assignedProjects: assignedProjects || u.assignedProjects, updated_at: new Date().toISOString() }
          : u
      );
      setUsers(updatedUsers);
      saveUsers(updatedUsers);

      // Save new password if provided
      if (password && userData.email) {
        saveCredential(userData.email, password);
      }
    } else {
      // Create new user
      const newUser: User = {
        id: Date.now().toString(),
        email: userData.email || '',
        full_name: userData.full_name || '',
        phone: userData.phone,
        role: userData.role || 'project_manager',
        is_active: true,
        created_at: new Date().toISOString(),
        assignedProjects: userData.assignedProjects || [],
      };
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      saveUsers(updatedUsers);

      // Save credentials for new user
      if (userData.password && userData.email) {
        saveCredential(userData.email, userData.password);
      }
    }
    setShowCreateModal(false);
    setEditingUser(null);
  };

  const handleOpenAssignments = (user: User) => {
    setSelectedUserForAssignment(user);
    setShowAssignmentsModal(true);
  };

  const handleResetPassword = (user: User) => {
    const tempPassword = generateTempPassword();
    saveCredential(user.email, tempPassword);
    setResetPasswordInfo({ user, tempPassword });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('he-IL');
  };

  const roles = getAvailableRoles();

  return (
    <div className="flex-1 px-4 lg:px-10 py-6 max-w-[1400px] mx-auto w-full pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
              ניהול משתמשים
            </h1>
            <p className="text-text-secondary-light dark:text-text-secondary-dark mt-2 text-sm md:text-base">
              יצירה, עריכה והרשאות משתמשים במערכת
            </p>
          </div>
          <button
            onClick={() => {
              setEditingUser(null);
              setShowCreateModal(true);
            }}
            className="flex items-center justify-center h-10 px-4 rounded-lg bg-primary text-white hover:bg-primary-hover transition text-sm font-bold"
          >
            <span className="material-symbols-outlined me-2 text-[18px]">person_add</span>
            משתמש חדש
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-4 border border-border-light dark:border-border-dark">
          <div className="text-2xl font-bold text-primary">{users.length}</div>
          <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">סה"כ משתמשים</div>
        </div>
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-4 border border-border-light dark:border-border-dark">
          <div className="text-2xl font-bold text-green-600">{users.filter(u => u.is_active).length}</div>
          <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">משתמשים פעילים</div>
        </div>
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-4 border border-border-light dark:border-border-dark">
          <div className="text-2xl font-bold text-blue-600">{users.filter(u => u.role === 'project_manager').length}</div>
          <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">מנהלי פרויקטים</div>
        </div>
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-4 border border-border-light dark:border-border-dark">
          <div className="text-2xl font-bold text-purple-600">{users.filter(u => u.role === 'entrepreneur').length}</div>
          <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">יזמים</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-center rounded-lg bg-background-light dark:bg-background-dark h-10 px-3 border border-border-light dark:border-border-dark focus-within:border-primary">
            <span className="material-symbols-outlined text-text-secondary-light dark:text-text-secondary-dark text-[20px] me-2">
              search
            </span>
            <input
              type="text"
              className="w-full bg-transparent border-none focus:ring-0 text-sm placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark"
              placeholder="חיפוש לפי שם, אימייל או טלפון..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="w-full md:w-48">
          <select
            className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">כל התפקידים</option>
            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-text-secondary-light dark:text-text-secondary-dark cursor-pointer">
            <input
              type="radio"
              name="activeFilter"
              className="text-primary focus:ring-primary"
              checked={activeFilter === 'all'}
              onChange={() => setActiveFilter('all')}
            />
            הכל
          </label>
          <label className="flex items-center gap-2 text-sm text-text-secondary-light dark:text-text-secondary-dark cursor-pointer">
            <input
              type="radio"
              name="activeFilter"
              className="text-primary focus:ring-primary"
              checked={activeFilter === 'active'}
              onChange={() => setActiveFilter('active')}
            />
            פעילים
          </label>
          <label className="flex items-center gap-2 text-sm text-text-secondary-light dark:text-text-secondary-dark cursor-pointer">
            <input
              type="radio"
              name="activeFilter"
              className="text-primary focus:ring-primary"
              checked={activeFilter === 'inactive'}
              onChange={() => setActiveFilter('inactive')}
            />
            לא פעילים
          </label>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background-light dark:bg-background-dark border-b border-border-light dark:border-border-dark">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                  משתמש
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                  תפקיד
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                  טלפון
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                  התחברות אחרונה
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                  פרויקטים
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                  סטטוס
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-secondary-light dark:text-text-secondary-dark">
                    לא נמצאו משתמשים
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-background-light dark:hover:bg-background-dark transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                          {user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium">{user.full_name}</div>
                          <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' :
                        user.role === 'project_manager' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' :
                        user.role === 'entrepreneur' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200' :
                        'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200'
                      }`}>
                        {getRoleDisplayName(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {user.phone || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {formatDateTime(user.last_login)}
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'admin' || user.role === 'accountant' ? (
                        <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">כל הפרויקטים</span>
                      ) : (
                        <button
                          onClick={() => handleOpenAssignments(user)}
                          className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary-hover transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">folder</span>
                          {user.assignedProjects?.length || 0} פרויקטים
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(user.id)}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold transition-colors ${
                          user.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        {user.is_active ? 'פעיל' : 'לא פעיל'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setShowCreateModal(true);
                          }}
                          className="p-2 rounded-lg hover:bg-background-light dark:hover:bg-background-dark transition-colors text-text-secondary-light dark:text-text-secondary-dark hover:text-primary"
                          title="עריכה"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleResetPassword(user)}
                          className="p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors text-text-secondary-light dark:text-text-secondary-dark hover:text-amber-600"
                          title="איפוס סיסמה"
                        >
                          <span className="material-symbols-outlined text-[20px]">key</span>
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-text-secondary-light dark:text-text-secondary-dark hover:text-red-600"
                          title="מחיקה"
                          disabled={user.id === currentUser?.id}
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden flex flex-col gap-4">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-text-secondary-light dark:text-text-secondary-dark">
            לא נמצאו משתמשים
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-4"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                    {user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold">{user.full_name}</h3>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {user.email}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                    user.is_active
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200'
                  }`}
                >
                  {user.is_active ? 'פעיל' : 'לא פעיל'}
                </span>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary-light dark:text-text-secondary-dark">תפקיד:</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                    user.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' :
                    user.role === 'project_manager' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' :
                    user.role === 'entrepreneur' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200' :
                    'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200'
                  }`}>
                    {getRoleDisplayName(user.role)}
                  </span>
                </div>
                {user.phone && (
                  <div>
                    <span className="text-text-secondary-light dark:text-text-secondary-dark">טלפון: </span>
                    <span>{user.phone}</span>
                  </div>
                )}
                <div>
                  <span className="text-text-secondary-light dark:text-text-secondary-dark">התחברות אחרונה: </span>
                  <span>{formatDateTime(user.last_login)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-border-light dark:border-border-dark">
                <button
                  onClick={() => {
                    setEditingUser(user);
                    setShowCreateModal(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  עריכה
                </button>
                {(user.role === 'project_manager' || user.role === 'entrepreneur') && (
                  <button
                    onClick={() => handleOpenAssignments(user)}
                    className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors text-sm font-medium"
                  >
                    <span className="material-symbols-outlined text-[18px]">folder</span>
                    פרויקטים ({user.assignedProjects?.length || 0})
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <UserFormModal
          user={editingUser}
          onSave={handleSaveUser}
          onClose={() => {
            setShowCreateModal(false);
            setEditingUser(null);
          }}
        />
      )}

      {/* Assignments Modal */}
      {showAssignmentsModal && selectedUserForAssignment && (
        <UserAssignmentsModal
          user={selectedUserForAssignment}
          onSave={(updatedUser) => {
            const updatedUsers = users.map((u) =>
              u.id === updatedUser.id ? updatedUser : u
            );
            setUsers(updatedUsers);
            saveUsers(updatedUsers);
            setShowAssignmentsModal(false);
            setSelectedUserForAssignment(null);
          }}
          onClose={() => {
            setShowAssignmentsModal(false);
            setSelectedUserForAssignment(null);
          }}
        />
      )}

      {/* Reset Password Modal */}
      {resetPasswordInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setResetPasswordInfo(null)} />
          <div className="relative bg-surface-light dark:bg-surface-dark rounded-xl shadow-xl w-full max-w-sm mx-4">
            <div className="p-6 text-center">
              <div className="size-16 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto mb-4 flex items-center justify-center">
                <span className="material-symbols-outlined text-green-600 text-3xl">check_circle</span>
              </div>
              <h2 className="text-xl font-bold mb-2">הסיסמה אופסה בהצלחה</h2>
              <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
                סיסמה זמנית עבור {resetPasswordInfo.user.full_name}
              </p>
              <div className="bg-background-light dark:bg-background-dark rounded-lg p-4 mb-4">
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">סיסמה חדשה:</p>
                <p className="text-2xl font-mono font-bold tracking-wider select-all">{resetPasswordInfo.tempPassword}</p>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-4">
                <span className="material-symbols-outlined text-[14px] align-middle me-1">warning</span>
                העתק את הסיסמה ושלח למשתמש. היא לא תוצג שוב.
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(resetPasswordInfo.tempPassword);
                }}
                className="w-full h-10 rounded-lg border border-border-light dark:border-border-dark hover:bg-background-light dark:hover:bg-background-dark transition-colors text-sm font-medium mb-2 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">content_copy</span>
                העתק סיסמה
              </button>
              <button
                onClick={() => setResetPasswordInfo(null)}
                className="w-full h-10 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-bold"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// User Form Modal Component
function UserFormModal({
  user,
  onSave,
  onClose,
}: {
  user: User | null;
  onSave: (userData: Partial<User> & { password?: string; assignedProjects?: string[] }) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || 'project_manager' as UserRole,
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedProjects, setSelectedProjects] = useState<string[]>(user?.assignedProjects || []);

  // Get projects for assignment
  const projects: Project[] = useMemo(() => getProjects(), []);

  const isNewUser = !user;
  const showPasswordFields = isNewUser || changePassword;
  const showProjectAssignment = formData.role === 'project_manager' || formData.role === 'entrepreneur';
  const roles = getAvailableRoles();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'שם מלא הוא שדה חובה';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'אימייל הוא שדה חובה';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'אימייל לא תקין';
    }

    // Password validation for new users or when changing password
    if (showPasswordFields) {
      if (!formData.password) {
        newErrors.password = 'סיסמה היא שדה חובה';
      } else if (formData.password.length < 6) {
        newErrors.password = 'סיסמה חייבת להכיל לפחות 6 תווים';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'הסיסמאות אינן תואמות';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Pass password for new users or when changing password
    const { confirmPassword, ...dataToSave } = formData;
    const dataWithProjects = {
      ...dataToSave,
      assignedProjects: showProjectAssignment ? selectedProjects : [],
    };
    if (isNewUser || changePassword) {
      onSave(dataWithProjects);
    } else {
      onSave({
        full_name: dataToSave.full_name,
        email: dataToSave.email,
        phone: dataToSave.phone,
        role: dataToSave.role,
        assignedProjects: showProjectAssignment ? selectedProjects : [],
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-surface-light dark:bg-surface-dark rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
          <h2 className="text-xl font-bold">{user ? 'עריכת משתמש' : 'יצירת משתמש חדש'}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-background-light dark:hover:bg-background-dark transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">שם מלא *</label>
            <input
              type="text"
              className={`w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border ${errors.full_name ? 'border-red-500' : 'border-border-light dark:border-border-dark'} text-sm focus:ring-2 focus:ring-primary focus:border-primary`}
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
            {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">אימייל *</label>
            <input
              type="email"
              className={`w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border ${errors.email ? 'border-red-500' : 'border-border-light dark:border-border-dark'} text-sm focus:ring-2 focus:ring-primary focus:border-primary`}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">טלפון</label>
            <input
              type="tel"
              className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="050-1234567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">תפקיד *</label>
            <select
              className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
            >
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
          {/* Password Section */}
          {!isNewUser && (
            <div className="border-t border-border-light dark:border-border-dark pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-primary focus:ring-primary"
                  checked={changePassword}
                  onChange={(e) => {
                    setChangePassword(e.target.checked);
                    if (!e.target.checked) {
                      setFormData({ ...formData, password: '', confirmPassword: '' });
                      setErrors({});
                    }
                  }}
                />
                <span className="text-sm font-medium">שינוי סיסמה</span>
              </label>
            </div>
          )}
          {showPasswordFields && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {isNewUser ? 'סיסמה *' : 'סיסמה חדשה *'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`w-full h-10 px-3 pe-10 rounded-lg bg-background-light dark:bg-background-dark border ${errors.password ? 'border-red-500' : 'border-border-light dark:border-border-dark'} text-sm focus:ring-2 focus:ring-primary focus:border-primary`}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="לפחות 6 תווים"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-main-light dark:hover:text-text-main-dark"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">אימות סיסמה *</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border ${errors.confirmPassword ? 'border-red-500' : 'border-border-light dark:border-border-dark'} text-sm focus:ring-2 focus:ring-primary focus:border-primary`}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="הזן שוב את הסיסמה"
                />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
            </>
          )}
          {/* Project Assignment Section */}
          {showProjectAssignment && (
            <div className="border-t border-border-light dark:border-border-dark pt-4">
              <label className="block text-sm font-medium mb-2">שיוך פרויקטים</label>
              {projects.length === 0 ? (
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">אין פרויקטים במערכת</p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2 border border-border-light dark:border-border-dark rounded-lg p-2">
                  {projects.map((project) => (
                    <label
                      key={project.id}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedProjects.includes(project.id)
                          ? 'bg-primary/10'
                          : 'hover:bg-background-light dark:hover:bg-background-dark'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="rounded text-primary focus:ring-primary"
                        checked={selectedProjects.includes(project.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProjects([...selectedProjects, project.id]);
                          } else {
                            setSelectedProjects(selectedProjects.filter(id => id !== project.id));
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{project.project_name}</div>
                        <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark truncate">{project.client_name}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-2">
                {selectedProjects.length} פרויקטים נבחרו
              </p>
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-lg border border-border-light dark:border-border-dark hover:bg-background-light dark:hover:bg-background-dark transition-colors text-sm font-medium"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="flex-1 h-10 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-bold"
            >
              {user ? 'שמירה' : 'יצירה'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// User Assignments Modal Component
function UserAssignmentsModal({
  user,
  onSave,
  onClose,
}: {
  user: User;
  onSave: (updatedUser: User) => void;
  onClose: () => void;
}) {
  // Get projects from storage module
  const projects: Project[] = useMemo(() => getProjects(), []);

  const [selectedProjects, setSelectedProjects] = useState<string[]>(user.assignedProjects || []);

  const handleToggleProject = (projectId: string) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleSave = () => {
    onSave({
      ...user,
      assignedProjects: selectedProjects,
      updated_at: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-surface-light dark:bg-surface-dark rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
          <div>
            <h2 className="text-xl font-bold">שיוך פרויקטים</h2>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{user.full_name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-background-light dark:hover:bg-background-dark transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {projects.length === 0 ? (
            <div className="text-center py-8 text-text-secondary-light dark:text-text-secondary-dark">
              אין פרויקטים במערכת
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <label
                  key={project.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedProjects.includes(project.id)
                      ? 'border-primary bg-primary/10'
                      : 'border-border-light dark:border-border-dark hover:bg-background-light dark:hover:bg-background-dark'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="rounded text-primary focus:ring-primary"
                    checked={selectedProjects.includes(project.id)}
                    onChange={() => handleToggleProject(project.id)}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{project.project_name}</div>
                    <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {project.client_name}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-3 p-4 border-t border-border-light dark:border-border-dark">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-10 rounded-lg border border-border-light dark:border-border-dark hover:bg-background-light dark:hover:bg-background-dark transition-colors text-sm font-medium"
          >
            ביטול
          </button>
          <button
            onClick={handleSave}
            className="flex-1 h-10 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-bold"
          >
            שמירה ({selectedProjects.length} פרויקטים)
          </button>
        </div>
      </div>
    </div>
  );
}
