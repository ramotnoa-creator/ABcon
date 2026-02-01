/**
 * Project Items List Component
 * Reusable table showing project items with estimates
 */

// import { useState } from 'react';
// import type { ProjectItem } from '../../services/projectItemsService';

interface ProjectItemsListProps {
  items: any[]; // Items with estimates from view
  onEdit?: (item: any) => void;
  onDelete?: (itemId: string) => void;
  onExportToTender?: (itemId: string) => void;
  onViewDetail?: (itemId: string) => void;
  showActions?: boolean;
  showType?: boolean;
}

export default function ProjectItemsList({
  items,
  onEdit,
  onDelete,
  onExportToTender,
  onViewDetail,
  showActions = true,
  showType = false
}: ProjectItemsListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-lg">אין פריטים להצגה</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-border-light dark:border-border-dark">
          <tr>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              שם הפריט
            </th>
            {showType && (
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                סוג
              </th>
            )}
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              קטגוריה
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              אומדן
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              כולל מע"מ
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              סטטוס
            </th>
            {showActions && (
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                פעולות
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-surface-dark divide-y divide-border-light dark:divide-border-dark">
          {items.map((item) => (
            <tr
              key={item.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
              onClick={() => onViewDetail?.(item.id)}
            >
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {item.name}
                  </div>
                  {item.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {item.description}
                    </div>
                  )}
                </div>
              </td>
              {showType && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <TypeBadge type={item.type} />
                </td>
              )}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                {item.category || '—'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                ₪{parseFloat(item.estimated_cost || 0).toLocaleString('he-IL', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600 dark:text-green-400">
                ₪{parseFloat(item.total_with_vat || 0).toLocaleString('he-IL', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={item.current_status} />
              </td>
              {showActions && (
                <td className="px-6 py-4 whitespace-nowrap text-sm" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    {item.current_status === 'estimation' && onExportToTender && (
                      <button
                        onClick={() => onExportToTender(item.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
                        title="ייצוא למכרז"
                      >
                        ייצוא למכרז
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item)}
                        className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-xs"
                        disabled={item.current_status === 'locked'}
                      >
                        ערוך
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(item.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs"
                        disabled={item.current_status === 'locked'}
                      >
                        מחק
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    estimation: { label: 'אומדן', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    tender_draft: { label: 'טיוטת מכרז', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    tender_open: { label: 'מכרז פתוח', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
    tender_closed: { label: 'מכרז סגור', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
    tender_cancelled: { label: 'מכרז בוטל', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    contracted: { label: 'חוזה', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    in_progress: { label: 'בביצוע', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
    completed: { label: 'הושלם', className: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400' },
    cancelled: { label: 'בוטל', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
  };

  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const typeConfig: Record<string, { label: string; className: string }> = {
    planning: { label: 'תכנון', className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' },
    execution: { label: 'ביצוע', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  };

  const config = typeConfig[type] || { label: type, className: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}
