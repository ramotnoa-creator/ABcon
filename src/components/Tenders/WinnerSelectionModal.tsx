import { createPortal } from 'react-dom';
import type { Tender, TenderParticipant, Professional } from '../../types';

interface WinnerSelectionModalProps {
  tender: Tender;
  winnerParticipant: TenderParticipant;
  winnerProfessional: Professional;
  onConfirm: () => void;
  onCancel: () => void;
}

const formatCurrency = (amount?: number): string => {
  if (amount === undefined || amount === null) return '-';
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function WinnerSelectionModal({
  tender,
  winnerParticipant,
  winnerProfessional,
  onConfirm,
  onCancel,
}: WinnerSelectionModalProps) {
  const contractAmount = winnerParticipant.total_amount || 0;
  const estimatedBudget = tender.estimated_budget || 0;

  // Calculate variance
  const variance = estimatedBudget - contractAmount;
  const variancePercent = estimatedBudget > 0 ? (variance / estimatedBudget) * 100 : 0;
  const variantColor = variance >= 0 ? 'green' : 'red';

  return createPortal(
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-xl border border-border-light dark:border-border-dark w-full max-w-md max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border-light dark:border-border-dark">
            <h3 className="text-lg font-bold">בחירת זוכה במכרז</h3>
            <button
              onClick={onCancel}
              className="size-8 flex items-center justify-center hover:bg-background-light dark:hover:bg-background-dark rounded transition-colors"
              aria-label="סגור"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Winner Info */}
            <div className="winner-info p-4 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-[32px]">
                  emoji_events
                </span>
                <div>
                  <h4 className="font-bold text-green-900 dark:text-green-100">זוכה</h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {winnerProfessional.professional_name}
                  </p>
                  {winnerProfessional.company_name && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      {winnerProfessional.company_name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Amounts Comparison */}
            <div className="amounts space-y-3">
              <div className="amount-row flex justify-between items-center p-3 rounded-lg bg-background-light dark:bg-background-dark">
                <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  תקציב משוער:
                </span>
                <span className="amount font-bold">{formatCurrency(estimatedBudget)}</span>
              </div>
              <div className="amount-row flex justify-between items-center p-3 rounded-lg bg-background-light dark:bg-background-dark">
                <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  סכום חוזה:
                </span>
                <span className="amount font-bold text-primary">{formatCurrency(contractAmount)}</span>
              </div>
              <div className={`variance-row p-4 rounded-lg border-2 ${
                variantColor === 'green'
                  ? 'bg-green-50 dark:bg-green-900/10 border-green-300 dark:border-green-900/50'
                  : 'bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-900/50'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`font-bold ${
                    variantColor === 'green' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                  }`}>
                    שונות:
                  </span>
                  <div className="text-left">
                    <span className={`variance text-lg font-bold ${
                      variantColor === 'green' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                    }`}>
                      {variance >= 0 ? '+' : ''}{formatCurrency(Math.abs(variance))}
                    </span>
                    <span className={`text-sm ms-2 ${
                      variantColor === 'green' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      ({variancePercent >= 0 ? '+' : ''}{variancePercent.toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined ${
                    variantColor === 'green' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {variance >= 0 ? 'trending_down' : 'trending_up'}
                  </span>
                  <span className={`text-sm font-bold ${
                    variantColor === 'green' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                  }`}>
                    {variance >= 0 ? 'חיסכון!' : 'חריגה מהתקציב'}
                  </span>
                </div>
              </div>
            </div>

            {/* Budget Creation Info */}
            <div className="auto-budget-section p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30">
              <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-2">
                <span className="material-symbols-outlined text-[16px] align-middle me-1">account_balance_wallet</span>
                יצירת פריט תקציב אוטומטית
              </h4>
              <p className="text-xs text-blue-800 dark:text-blue-200 mb-2">
                המערכת תיצור אוטומטית פריט תקציב עם הפרטים הבאים:
              </p>
              <ul className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[14px] mt-0.5">check_circle</span>
                  <span>סכום תקציב: {formatCurrency(contractAmount)}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[14px] mt-0.5">check_circle</span>
                  <span>קישור לאומדן: {formatCurrency(estimatedBudget)}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[14px] mt-0.5">check_circle</span>
                  <span>מעקב שונות אוטומטי</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[14px] mt-0.5">check_circle</span>
                  <span>קישור לספק: {winnerProfessional.professional_name}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-bold"
              >
                ביטול
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors text-sm font-bold"
              >
                <span className="material-symbols-outlined text-[18px] align-middle me-1">check</span>
                אשר זוכה ויצור תקציב
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
