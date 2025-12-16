import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import MobileMenu from './MobileMenu';

const navItems = [
  { label: 'לוח בקרה', path: '/dashboard', icon: 'dashboard' },
  { label: 'פרויקטים', path: '/projects', icon: 'folder' },
  { label: 'אנשי מקצוע', path: '/professionals', icon: 'people' },
  { label: 'קבצים', path: '/files', icon: 'description' },
  { label: 'תקציב', path: '/budget', icon: 'payments' },
];

// Mock user data - replace with actual user data from auth
const currentUser = {
  name: 'משה כהן',
  email: 'moshe@example.com',
  avatar: null, // Can be a URL to user's avatar
  initials: 'מכ',
};

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    // TODO: Implement actual logout logic
    console.log('Logging out...');
    setIsUserMenuOpen(false);
  };

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
          </div>
        </div>

        {/* Navigation & User */}
        <div className="flex items-center gap-4 lg:gap-6">
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 group overflow-hidden ${
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
          <div className="hidden lg:block w-px h-8 bg-border-light dark:bg-border-dark" />

          {/* User Profile Section */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-background-light dark:hover:bg-background-dark transition-all duration-200 group"
            >
              {/* Avatar */}
              <div className="size-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm transition-transform duration-200 group-hover:scale-105">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="size-full rounded-full object-cover" />
                ) : (
                  currentUser.initials
                )}
              </div>
              {/* User name - Desktop only */}
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium text-text-main-light dark:text-text-main-dark leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark leading-tight">
                  {currentUser.email}
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
                    <p className="font-bold text-sm">{currentUser.name}</p>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">{currentUser.email}</p>
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
            className="lg:hidden size-10 flex items-center justify-center rounded-lg hover:bg-background-light dark:hover:bg-background-dark transition-all duration-200 btn-press"
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
