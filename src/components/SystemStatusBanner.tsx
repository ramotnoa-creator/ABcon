import { useEffect, useState } from 'react';
import { checkDbHealth, getDbStatus, type DbStatus } from '../lib/dbHealth';

/**
 * Thin warning banner shown at the top of the app when the DB is unreachable.
 * Hidden when connected, in demo mode, or while checking.
 */
export default function SystemStatusBanner() {
  const [status, setStatus] = useState<DbStatus>(getDbStatus);
  const [dismissed, setDismissed] = useState(false);
  const [checking, setChecking] = useState(false);

  // Run initial health check on mount
  useEffect(() => {
    checkDbHealth().then(setStatus);
  }, []);

  const handleRecheck = async () => {
    setChecking(true);
    const result = await checkDbHealth();
    setStatus(result);
    setChecking(false);
    if (result === 'connected') setDismissed(false); // auto-show if it reconnects then disconnects again
  };

  // Only show when disconnected and not dismissed
  if (status !== 'disconnected' || dismissed) return null;

  return (
    <div
      dir="rtl"
      className="flex items-center justify-between gap-3 bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800 px-4 py-2 text-sm text-amber-800 dark:text-amber-200"
    >
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px]">cloud_off</span>
        <span>הנתונים נשמרים מקומית — אין חיבור לשרת</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleRecheck}
          disabled={checking}
          className="rounded px-3 py-1 text-xs font-bold bg-amber-200 dark:bg-amber-800 hover:bg-amber-300 dark:hover:bg-amber-700 transition-colors disabled:opacity-50"
        >
          {checking ? 'בודק...' : 'בדוק שוב'}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="rounded p-1 hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
          title="סגור"
          aria-label="סגור הודעה"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    </div>
  );
}
