/**
 * SourceEstimateCard Component
 * Displays the source estimate linked to a tender
 * Shows estimate details, outdated warnings, and provides navigation/update options
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Estimate } from '../../types';

interface SourceEstimateCardProps {
  estimate: Estimate | null | undefined;
  projectId: string;
  tenderId: string;
  isOutdated?: boolean;
  exportedAt?: string;
  onUpdateFromEstimate?: () => void;
  canUpdate?: boolean; // Only allowed before winner selection
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function SourceEstimateCard({
  estimate,
  projectId,
  isOutdated,
  onUpdateFromEstimate,
  canUpdate,
}: SourceEstimateCardProps) {
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);

  if (!estimate) {
    return null; // Don't show card if no estimate is linked
  }

  const handleViewEstimate = () => {
    const estimateTab = estimate.estimate_type === 'planning' ? 'planning-estimate' : 'execution-estimate';
    navigate(`/projects/${projectId}?tab=${estimateTab}`);
  };

  const handleUpdateFromEstimate = async () => {
    if (!onUpdateFromEstimate) return;

    try {
      setIsUpdating(true);
      await onUpdateFromEstimate();
    } catch (error) {
      console.error('Error updating from estimate:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="mb-4 pb-4 border-b border-border-light dark:border-border-dark">
      {/* Simple Reference Line */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-[18px]">
            assessment
          </span>
          <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            מקור:
          </span>
          <button
            onClick={handleViewEstimate}
            className="text-sm font-bold text-primary hover:underline"
          >
            {estimate.name}
          </button>
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200">
            {estimate.estimate_type === 'planning' ? 'תכנון' : 'ביצוע'}
          </span>
          {estimate.total_amount > 0 && (
            <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              • {formatCurrency(estimate.total_amount)}
            </span>
          )}
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-2">
          {isOutdated && canUpdate && (
            <button
              onClick={handleUpdateFromEstimate}
              disabled={isUpdating}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 text-xs font-bold"
            >
              {isUpdating ? (
                <>
                  <div className="size-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  מעדכן...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[14px]">sync</span>
                  עדכן
                </>
              )}
            </button>
          )}
          {!isOutdated && (
            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              מעודכן
            </div>
          )}
        </div>
      </div>

      {/* Outdated Warning (compact) */}
      {isOutdated && (
        <div className="mt-2 flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400">
          <span className="material-symbols-outlined text-[14px]">warning</span>
          <span>האומדן השתנה מאז הייצוא</span>
          {!canUpdate && <span>• לא ניתן לעדכן</span>}
        </div>
      )}
    </div>
  );
}
