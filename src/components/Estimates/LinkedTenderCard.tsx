/**
 * LinkedTenderCard Component
 * Displays the tender linked to an estimate (1:1 relationship)
 * Shows tender status, winner info, and provides navigation/update options
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Tender } from '../../types';

interface LinkedTenderCardProps {
  estimateId: string;
  projectId: string;
  tender: Tender | null | undefined;
  onUpdateTender?: () => void;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export default function LinkedTenderCard({
  projectId,
  tender,
  onUpdateTender,
}: LinkedTenderCardProps) {
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);

  if (!tender) {
    return null; // Don't show card if no tender is linked
  }

  const handleViewTender = () => {
    navigate(`/projects/${projectId}?tab=tenders`);
  };

  const handleUpdateFromEstimate = async () => {
    if (!onUpdateTender) return;

    try {
      setIsUpdating(true);
      await onUpdateTender();
    } catch (error) {
      console.error('Error updating tender from estimate:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Determine status badge color
  const getStatusBadge = () => {
    switch (tender.status) {
      case 'WinnerSelected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
            <span className="material-symbols-outlined text-[14px]">emoji_events</span>
            זוכה נבחר
          </span>
        );
      case 'Open':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
            <span className="material-symbols-outlined text-[14px]">mail</span>
            פתוח
          </span>
        );
      case 'Draft':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
            <span className="material-symbols-outlined text-[14px]">edit</span>
            טיוטה
          </span>
        );
      case 'Canceled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">
            <span className="material-symbols-outlined text-[14px]">cancel</span>
            בוטל
          </span>
        );
      default:
        return null;
    }
  };

  // Check if tender is outdated
  const isOutdated = tender.is_estimate_outdated;
  const canUpdate = (tender.status === 'Draft' || tender.status === 'Open') && isOutdated;

  return (
    <div className="bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="size-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[24px]">
              description
            </span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-main-light dark:text-text-main-dark">
              מכרז מקושר
            </h3>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              אומדן זה יוצא למכרז
            </p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Tender Details */}
      <div className="space-y-3">
        <div>
          <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">
            שם המכרז:
          </div>
          <div className="text-base font-bold text-text-main-light dark:text-text-main-dark">
            {tender.tender_name}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {tender.due_date && (
            <div>
              <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">
                תאריך סגירה:
              </div>
              <div className="text-sm font-medium text-text-main-light dark:text-text-main-dark">
                {formatDate(tender.due_date)}
              </div>
            </div>
          )}

          {tender.estimated_budget && (
            <div>
              <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">
                תקציב משוער:
              </div>
              <div className="text-sm font-bold text-primary">
                {formatCurrency(tender.estimated_budget)}
              </div>
            </div>
          )}
        </div>

        {/* Winner Info */}
        {tender.status === 'WinnerSelected' && tender.winner_professional_name && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-[20px]">
                emoji_events
              </span>
              <div className="text-sm font-bold text-green-800 dark:text-green-200">
                זוכה במכרז
              </div>
            </div>
            <div className="text-base font-bold text-text-main-light dark:text-text-main-dark mb-1">
              {tender.winner_professional_name}
            </div>
            {tender.contract_amount && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  סכום חוזה:
                </span>
                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(tender.contract_amount)}
                </span>
                {tender.estimated_budget && tender.contract_amount < tender.estimated_budget && (
                  <span className="text-xs text-green-600 dark:text-green-400">
                    (חיסכון: {formatCurrency(tender.estimated_budget - tender.contract_amount)})
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Outdated Warning */}
        {isOutdated && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mt-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-orange-600 dark:text-orange-400 text-[20px]">
                warning
              </span>
              <div className="flex-1">
                <div className="text-sm font-bold text-orange-800 dark:text-orange-200 mb-1">
                  האומדן השתנה מאז הייצוא למכרז
                </div>
                <div className="text-xs text-orange-700 dark:text-orange-300">
                  {canUpdate
                    ? 'ניתן לעדכן את המכרז מהאומדן המעודכן'
                    : 'לא ניתן לעדכן - המכרז כבר סגור או זוכה נבחר'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Up to Date Indicator */}
        {!isOutdated && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 mt-4">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>המכרז מעודכן עם האומדן</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6 pt-6 border-t border-blue-200 dark:border-blue-800">
        <button
          onClick={handleViewTender}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition text-sm font-bold"
        >
          <span className="material-symbols-outlined text-[18px]">visibility</span>
          צפייה במכרז
        </button>

        {canUpdate && onUpdateTender && (
          <button
            onClick={handleUpdateFromEstimate}
            disabled={isUpdating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-bold"
          >
            {isUpdating ? (
              <>
                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                מעדכן...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">sync</span>
                עדכון מכרז מהאומדן
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
