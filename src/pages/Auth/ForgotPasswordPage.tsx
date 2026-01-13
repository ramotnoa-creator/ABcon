import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ForgotPasswordPage() {
  const { resetPassword, isDemoMode } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('נא להזין כתובת אימייל');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('כתובת אימייל לא תקינה');
      return;
    }

    if (isDemoMode) {
      setError('איפוס סיסמה לא זמין במצב דמו');
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: unknown) {
      console.error('Password reset error:', err);
      setError('שגיאה בשליחת אימייל לאיפוס סיסמה. נא לנסות שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark px-4">
        <div className="w-full max-w-md">
          <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-xl border border-border-light dark:border-border-dark p-8 text-center">
            <div className="mb-6">
              <div className="size-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-3xl">
                  mark_email_read
                </span>
              </div>
              <h2 className="text-2xl font-bold mb-2">האימייל נשלח!</h2>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">
                שלחנו לך אימייל עם קישור לאיפוס הסיסמה.
                <br />
                נא לבדוק את תיבת הדואר הנכנס שלך.
              </p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6 text-right">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <span className="font-bold">שים לב:</span> אם לא קיבלת את האימייל תוך מספר דקות, נא לבדוק את תיקיית הספאם.
              </p>
            </div>
            <Link
              to="/login"
              className="flex items-center justify-center h-11 px-4 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-bold w-full"
            >
              חזרה לדף ההתחברות
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/login" className="inline-flex items-center gap-3 group">
            <img
              src="/favicon.png"
              alt="אנ פרויקטים"
              className="size-12 transition-transform duration-300 group-hover:scale-110"
            />
            <h1 className="text-2xl font-bold">אנ פרויקטים</h1>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-xl border border-border-light dark:border-border-dark p-8">
          <div className="text-center mb-6">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-primary text-3xl">lock_reset</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">שכחת סיסמה?</h2>
            <p className="text-text-secondary-light dark:text-text-secondary-dark">
              הזן את כתובת האימייל שלך ונשלח לך קישור לאיפוס הסיסמה
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">כתובת אימייל</label>
              <div className="relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-secondary-light dark:text-text-secondary-dark text-[20px]">
                  mail
                </span>
                <input
                  type="email"
                  className="w-full h-11 pr-10 pl-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                  שולח...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">send</span>
                  שליחת קישור לאיפוס
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary-hover transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              חזרה לדף ההתחברות
            </Link>
          </div>
        </div>

        {/* Demo mode notice */}
        {isDemoMode && (
          <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-center">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <span className="font-bold">מצב דמו:</span> איפוס סיסמה לא זמין
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
