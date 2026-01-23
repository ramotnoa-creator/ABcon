import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { updatePassword, isDemoMode } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);

  // Check for valid token in URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !hash.includes('access_token')) {
      // No token found - might be direct navigation or expired link
      // In production, you'd want to validate this more thoroughly
      console.log('No access token found in URL');
    }
  }, []);

  const validatePassword = (pass: string): string | null => {
    if (pass.length < 8) {
      return 'הסיסמה חייבת להכיל לפחות 8 תווים';
    }
    if (!/[A-Z]/.test(pass) && !/[a-z]/.test(pass)) {
      // Allow Hebrew characters or require English letters
      if (!/[\u0590-\u05FF]/.test(pass)) {
        return 'הסיסמה חייבת להכיל אותיות';
      }
    }
    if (!/[0-9]/.test(pass)) {
      return 'הסיסמה חייבת להכיל לפחות ספרה אחת';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    if (isDemoMode) {
      setError('עדכון סיסמה לא זמין במצב דמו');
      return;
    }

    setIsLoading(true);

    try {
      await updatePassword(password);
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: unknown) {
      console.error('Password update error:', err);
      const errorMessage = err instanceof Error ? err.message : 'שגיאה בעדכון הסיסמה';
      if (errorMessage.includes('expired') || errorMessage.includes('invalid')) {
        setTokenValid(false);
        setError('הקישור פג תוקף או אינו תקין. נא לבקש קישור חדש.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark px-4">
        <div className="w-full max-w-md">
          <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-xl border border-border-light dark:border-border-dark p-8 text-center">
            <div className="mb-6">
              <div className="size-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-3xl">
                  check_circle
                </span>
              </div>
              <h2 className="text-2xl font-bold mb-2">הסיסמה עודכנה בהצלחה!</h2>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">
                הסיסמה שלך שונתה. מעבירים אותך לדף ההתחברות...
              </p>
            </div>
            <div className="w-full h-1 bg-background-light dark:bg-background-dark rounded-full overflow-hidden">
              <div className="h-full bg-green-500 animate-[progress_3s_linear]" style={{ animation: 'progress 3s linear' }} />
            </div>
            <style>{`
              @keyframes progress {
                from { width: 0%; }
                to { width: 100%; }
              }
            `}</style>
            <Link
              to="/login"
              className="mt-6 flex items-center justify-center h-11 px-4 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-bold w-full"
            >
              המשך להתחברות
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Token invalid state
  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark px-4">
        <div className="w-full max-w-md">
          <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-xl border border-border-light dark:border-border-dark p-8 text-center">
            <div className="mb-6">
              <div className="size-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-3xl">
                  link_off
                </span>
              </div>
              <h2 className="text-2xl font-bold mb-2">הקישור אינו תקין</h2>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">
                הקישור לאיפוס הסיסמה פג תוקף או אינו תקין.
                <br />
                נא לבקש קישור חדש.
              </p>
            </div>
            <Link
              to="/forgot-password"
              className="flex items-center justify-center h-11 px-4 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-bold w-full"
            >
              בקשת קישור חדש
            </Link>
            <Link
              to="/login"
              className="mt-3 flex items-center justify-center h-11 px-4 rounded-lg border border-border-light dark:border-border-dark hover:bg-background-light dark:hover:bg-background-dark transition-colors text-sm font-medium w-full"
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
              <span className="material-symbols-outlined text-primary text-3xl">password</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">הגדרת סיסמה חדשה</h2>
            <p className="text-text-secondary-light dark:text-text-secondary-dark">
              נא להזין את הסיסמה החדשה שלך
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">סיסמה חדשה</label>
              <div className="relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-secondary-light dark:text-text-secondary-dark text-[20px]">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full h-11 pr-10 pl-10 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  placeholder="הזן סיסמה חדשה"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-main-light dark:hover:text-text-main-dark transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              <p className="mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                לפחות 8 תווים, עם אות אחת וספרה אחת לפחות
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">אימות סיסמה</label>
              <div className="relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-secondary-light dark:text-text-secondary-dark text-[20px]">
                  lock
                </span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="w-full h-11 pr-10 pl-10 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  placeholder="הזן שוב את הסיסמה"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-main-light dark:hover:text-text-main-dark transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showConfirmPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Password strength indicator */}
            {password && (
              <div className="space-y-2">
                <div className="flex gap-1">
                  <div className={`h-1 flex-1 rounded-full ${password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div className={`h-1 flex-1 rounded-full ${/[A-Za-z\u0590-\u05FF]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div className={`h-1 flex-1 rounded-full ${/[0-9]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div className={`h-1 flex-1 rounded-full ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
                <div className="flex gap-2 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  <span className={password.length >= 8 ? 'text-green-600' : ''}>8+ תווים</span>
                  <span>|</span>
                  <span className={/[A-Za-z\u0590-\u05FF]/.test(password) ? 'text-green-600' : ''}>אותיות</span>
                  <span>|</span>
                  <span className={/[0-9]/.test(password) ? 'text-green-600' : ''}>מספרים</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-bold flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                  מעדכן...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">check</span>
                  עדכון סיסמה
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
              <span className="font-bold">מצב דמו:</span> עדכון סיסמה לא זמין
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
