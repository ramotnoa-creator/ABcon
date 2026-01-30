/**
 * Estimate Version History Component
 * Shows all estimate revisions for a project item
 */

import { useState, useEffect } from 'react';
import { getEstimateHistory, type ProjectItemEstimate } from '../../services/projectItemEstimatesService';

interface EstimateVersionHistoryProps {
  projectItemId: string;
  projectItemName: string;
}

export default function EstimateVersionHistory({ projectItemId, projectItemName }: EstimateVersionHistoryProps) {
  const [estimates, setEstimates] = useState<ProjectItemEstimate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, [projectItemId]);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const history = await getEstimateHistory(projectItemId);
      setEstimates(history);
    } catch (err) {
      console.error('Error loading estimate history:', err);
      setError('שגיאה בטעינת היסטוריית אומדנים');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (estimates.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        אין היסטוריית אומדנים זמינה
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">
        היסטוריית אומדנים - {projectItemName}
      </h3>

      <div className="space-y-3">
        {estimates.map((estimate, index) => (
          <div
            key={estimate.id}
            className={`border rounded-lg p-4 ${
              estimate.is_current
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    גרסה {estimate.version}
                  </span>
                  {estimate.is_current && (
                    <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-semibold rounded">
                      נוכחית
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(estimate.created_at).toLocaleDateString('he-IL')} {new Date(estimate.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {index < estimates.length - 1 && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {calculateDifference(estimates[index + 1].estimated_cost, estimate.estimated_cost)}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">עלות משוערת</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  ₪{estimate.estimated_cost.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">שיעור מע"מ</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {estimate.vat_rate}%
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">כולל מע"מ</div>
                <div className="text-sm font-bold text-green-600 dark:text-green-400">
                  ₪{estimate.total_with_vat.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">נוצר על ידי</div>
                <div className="text-sm text-gray-900 dark:text-gray-100">
                  {estimate.created_by}
                </div>
              </div>
            </div>

            {estimate.revision_reason && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">סיבת עדכון:</div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {estimate.revision_reason}
                </div>
              </div>
            )}

            {estimate.notes && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">הערות:</div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {estimate.notes}
                </div>
              </div>
            )}

            {!estimate.is_current && estimate.superseded_at && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                הוחלף בתאריך {new Date(estimate.superseded_at).toLocaleDateString('he-IL')}
                {estimate.superseded_by && ` על ידי ${estimate.superseded_by}`}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
          סיכום
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-blue-700 dark:text-blue-300">סה"כ גרסאות:</span>{' '}
            <span className="font-semibold">{estimates.length}</span>
          </div>
          <div>
            <span className="text-blue-700 dark:text-blue-300">אומדן ראשוני:</span>{' '}
            <span className="font-semibold">
              ₪{estimates[estimates.length - 1].estimated_cost.toLocaleString('he-IL')}
            </span>
          </div>
          <div>
            <span className="text-blue-700 dark:text-blue-300">אומדן נוכחי:</span>{' '}
            <span className="font-semibold">
              ₪{estimates[0].estimated_cost.toLocaleString('he-IL')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function calculateDifference(oldCost: number, newCost: number): string {
  const diff = newCost - oldCost;
  const percentChange = oldCost > 0 ? ((diff / oldCost) * 100).toFixed(1) : '0';

  if (diff > 0) {
    return `↑ +₪${diff.toLocaleString('he-IL')} (+${percentChange}%)`;
  } else if (diff < 0) {
    return `↓ ₪${Math.abs(diff).toLocaleString('he-IL')} (${percentChange}%)`;
  }
  return '—';
}
