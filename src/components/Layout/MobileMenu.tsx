import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface MobileMenuProps {
  onClose: () => void;
}

export default function MobileMenu({ onClose }: MobileMenuProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isClosing, setIsClosing] = useState(false);

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const menuItems = [
    { label: 'לוח בקרה', path: '/dashboard', icon: 'dashboard' },
    { label: 'פרויקטים', path: '/projects', icon: 'folder' },
    { label: 'בקרת עלויות', path: '/cost-control', icon: 'assessment' },
    { label: 'אנשי מקצוע', path: '/professionals', icon: 'people' },
    { label: 'קבצים', path: '/files', icon: 'description' },
  ];

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 250);
  }, [onClose]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [handleClose]);

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop with fade animation */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-250 ${
          isClosing ? 'opacity-0' : 'animate-backdrop-fade'
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />
      
      {/* Slide-in panel */}
      <div
        role="dialog"
        aria-modal="true"
        className={`absolute right-0 top-0 bottom-0 w-72 bg-surface-light dark:bg-surface-dark border-l border-border-light dark:border-border-dark shadow-2xl transition-transform duration-250 ease-smooth ${
          isClosing ? 'translate-x-full' : 'animate-slide-in-right'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
          <div className="flex items-center gap-3">
            <img 
              src="/favicon.png" 
              alt="אנ פרויקטים" 
              className="size-8"
            />
            <h3 className="text-lg font-bold">תפריט</h3>
          </div>
          <button
            onClick={handleClose}
            className="size-10 flex items-center justify-center rounded-lg hover:bg-background-light dark:hover:bg-background-dark transition-colors btn-press"
            aria-label="סגור"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>
        
        {/* Navigation with staggered animation */}
        <nav className="flex flex-col p-4 stagger-children">
          {menuItems.map((item, index) => {
            const active = isActive(item.path);
            const className = `relative flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 animate-fade-in-up group overflow-hidden ${
              active
                ? 'text-primary shadow-sm'
                : 'hover:translate-x-1 text-text-main-light dark:text-text-main-dark'
            }`;
            const style = { animationDelay: `${index * 50}ms` };
            const content = (
              <>
                {/* Hover overlay - 20% opacity */}
                <span className={`absolute inset-0 rounded-lg transition-opacity duration-200 ${
                  active 
                    ? 'bg-primary/20 opacity-100' 
                    : 'bg-primary/20 opacity-0 group-hover:opacity-100'
                }`} />
                <span className={`material-symbols-outlined text-[20px] transition-transform duration-200 relative z-10 ${active ? '' : 'group-hover:scale-110'}`}>
                  {item.icon}
                </span>
                <span className="relative z-10">{item.label}</span>
                {active && (
                  <span className="material-symbols-outlined text-[16px] mr-auto relative z-10">
                    arrow_back
                  </span>
                )}
              </>
            );

            return item.path === '#' ? (
              <a
                key={item.label}
                href={item.path}
                onClick={handleClose}
                className={className}
                style={style}
              >
                {content}
              </a>
            ) : (
              <Link
                key={item.label}
                to={item.path}
                onClick={handleClose}
                className={className}
                style={style}
              >
                {content}
              </Link>
            );
          })}
        </nav>

        {/* User Section & Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-border-light dark:border-border-dark">
          {/* User Info */}
          <div className="p-4 border-b border-border-light dark:border-border-dark">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                {user?.full_name?.charAt(0) ?? '?'}
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">{user?.full_name ?? 'אורח'}</p>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">{user?.email ?? ''}</p>
              </div>
            </div>
          </div>
          
          {/* User Actions */}
          <div className="p-2">
            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-text-main-light dark:text-text-main-dark hover:bg-background-light dark:hover:bg-background-dark transition-colors">
              <span className="material-symbols-outlined text-[20px]">person</span>
              הפרופיל שלי
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-text-main-light dark:text-text-main-dark hover:bg-background-light dark:hover:bg-background-dark transition-colors">
              <span className="material-symbols-outlined text-[20px]">settings</span>
              הגדרות
            </button>
            <button
              onClick={() => { logout(); handleClose(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              התנתקות
            </button>
          </div>
          
          {/* Copyright */}
          <div className="p-3 border-t border-border-light dark:border-border-dark">
            <p className="text-xs text-center text-text-secondary-light dark:text-text-secondary-dark">
              אנ פרויקטים {new Date().getFullYear()} ©
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
