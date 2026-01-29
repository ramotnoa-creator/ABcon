import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getRoleDisplayName, canManageUsers } from '../../utils/permissions';
import { isDemoMode } from '../../lib/neon';
import MobileMenu from './MobileMenu';

const navItems = [
  { label: 'לוח בקרה', path: '/dashboard', icon: 'dashboard' },
  { label: 'פרויקטים', path: '/projects', icon: 'folder' },
  { label: 'בקרת עלויות', path: '/cost-control', icon: 'assessment' },
  { label: 'אנשי מקצוע', path: '/professionals', icon: 'people' },
  { label: 'קבצים', path: '/files', icon: 'description' },
];

// Helper to get user initials from full name
function getUserInitials(fullName: string): string {
  const parts = fullName.trim().split(' ');
  if (parts.length >= 2) {
    return parts[0][0] + parts[parts.length - 1][0];
  }
  return fullName.substring(0, 2).toUpperCase();
}

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Development mode - use mock user
  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';
  const mockUser = isDevMode ? {
    id: 'dev-user-1',
    email: 'admin@anproyektim.com',
    full_name: 'משתמש ניסיון',
    role: 'admin' as const,
    is_active: true,
    created_at: new Date().toISOString(),
  } : null;

  const displayUser = user || mockUser;

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    if (isDevMode) {
      // In dev mode, just log to console
      console.log('Logout (dev mode)');
      setIsUserMenuOpen(false);
      return;
    }

    try {
      await logout();
      setIsUserMenuOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Get user display data
  const userInitials = displayUser ? getUserInitials(displayUser.full_name) : '';
  const userRole = displayUser ? getRoleDisplayName(displayUser.role) : '';

  return (
    <>
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-border-light dark:border-border-dark px-4 lg:px-10 py-3 bg-surface-light dark:bg-surface-dark transition-colors sticky top-0 z-40 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
        {/* Logo */}
        <div className="flex items-center gap-4 lg:gap-8">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-4 group">
              <img
                src="/favicon.png"
                alt="אנ פרויקטים"
                className="size-8 transition-transform duration-300 group-hover:scale-110"
              />
              <h2 className="hidden md:block text-lg font-bold leading-tight tracking-[-0.015em] transition-colors duration-200 group-hover:text-primary">אנ פרויקטים</h2>
            </Link>
            {/* Connection Status Indicator */}
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
              isDemoMode
                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
            }`}>
              <span className={`size-1.5 rounded-full ${isDemoMode ? 'bg-orange-500' : 'bg-green-500'} animate-pulse`} />
              {isDemoMode ? 'דמו' : 'פעיל'}
            </div>
          </div>
        </div>

        {/* Navigation & User */}
        <div className="flex items-center gap-4 lg:gap-6">
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-4 py-2 min-h-11 rounded-lg text-sm font-medium transition-all duration-200 group overflow-hidden flex items-center ${
                    active
                      ? 'text-primary'
                      : 'hover:text-primary'
                  }`}
                >
                  {/* Hover overlay - 20% opacity */}
                  <span className={`absolute inset-0 rounded-lg transition-opacity duration-200 ${
                    active 
                      ? 'bg-primary/20 opacity-100' 
                      : 'bg-primary/20 opacity-0 group-hover:opacity-100'
                  }`} />
                  <span className="relative z-10 flex items-center gap-2">
                    <span className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
                      {item.icon}
                    </span>
                    {item.label}
                  </span>
                  {/* Active indicator */}
                  {active && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-primary rounded-full z-10" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Divider - Desktop only */}
          <div className="hidden md:block w-px h-8 bg-border-light dark:bg-border-dark" />

          {/* User Profile Section */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 px-2 py-2 min-h-11 rounded-lg hover:bg-background-light dark:hover:bg-background-dark transition-all duration-200 group"
            >
              {/* Avatar */}
              <div className="size-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm transition-transform duration-200 group-hover:scale-105">
                {userInitials}
              </div>
              {/* User name - Desktop only */}
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium text-text-main-light dark:text-text-main-dark leading-tight">
                  {displayUser?.full_name}
                </span>
                <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark leading-tight">
                  {userRole}
                </span>
              </div>
              {/* Dropdown arrow */}
              <span className={`material-symbols-outlined text-[18px] text-text-secondary-light dark:text-text-secondary-dark transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>

            {/* User Dropdown Menu */}
            {isUserMenuOpen && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsUserMenuOpen(false)}
                />
                {/* Menu */}
                <div className="absolute left-0 top-full mt-2 w-56 bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg border border-border-light dark:border-border-dark z-50 overflow-hidden animate-scale-in origin-top-left">
                  {/* User info header */}
                  <div className="p-4 border-b border-border-light dark:border-border-dark">
                    <p className="font-bold text-sm">{displayUser?.full_name}</p>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">{displayUser?.email}</p>
                    <p className="text-xs text-primary mt-1">{userRole}</p>
                  </div>
                  
                  {/* Menu items */}
                  <div className="py-2">
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-main-light dark:text-text-main-dark hover:bg-background-light dark:hover:bg-background-dark transition-colors text-right">
                      <span className="material-symbols-outlined text-[20px]">person</span>
                      הפרופיל שלי
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-main-light dark:text-text-main-dark hover:bg-background-light dark:hover:bg-background-dark transition-colors text-right">
                      <span className="material-symbols-outlined text-[20px]">settings</span>
                      הגדרות
                    </button>
                    {canManageUsers(displayUser) && (
                      <Link
                        to="/admin/users"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-main-light dark:text-text-main-dark hover:bg-background-light dark:hover:bg-background-dark transition-colors text-right"
                      >
                        <span className="material-symbols-outlined text-[20px]">group</span>
                        ניהול משתמשים
                      </Link>
                    )}
                  </div>
                  
                  {/* Logout */}
                  <div className="border-t border-border-light dark:border-border-dark py-2">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-right"
                    >
                      <span className="material-symbols-outlined text-[20px]">logout</span>
                      התנתקות
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden size-11 flex items-center justify-center rounded-lg hover:bg-background-light dark:hover:bg-background-dark transition-all duration-200 btn-press"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="תפריט"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>
        </div>
      </header>
      {isMobileMenuOpen && (
        <MobileMenu onClose={() => setIsMobileMenuOpen(false)} />
      )}
    </>
  );
}
