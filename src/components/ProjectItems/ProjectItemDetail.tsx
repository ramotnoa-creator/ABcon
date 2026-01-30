/**
 * Project Item Detail Component
 * Shows complete information about a project item including:
 * - Basic info
 * - Current estimate
 * - Estimate history
 * - Linked tender
 * - Status timeline
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getProjectItemById,
  getItemLifecycle,
  getItemHistory,
  type ProjectItem
} from '../../services/projectItemsService';
import { getCurrentEstimate, type ProjectItemEstimate } from '../../services/projectItemEstimatesService';
import EstimateVersionHistory from './EstimateVersionHistory';

interface ProjectItemDetailProps {
  itemId: string;
  onClose?: () => void;
}

export default function ProjectItemDetail({ itemId, onClose }: ProjectItemDetailProps) {
  const navigate = useNavigate();
  const [item, setItem] = useState<ProjectItem | null>(null);
  const [currentEstimate, setCurrentEstimate] = useState<ProjectItemEstimate | null>(null);
  const [lifecycle, setLifecycle] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'timeline'>('overview');

  useEffect(() => {
    loadItemDetails();
  }, [itemId]);

  const loadItemDetails = async () => {
    try {
      setIsLoading(true);

      const [itemData, estimateData, lifecycleData, historyData] = await Promise.all([
        getProjectItemById(itemId),
        getCurrentEstimate(itemId),
        getItemLifecycle(itemId),
        getItemHistory(itemId)
      ]);

      setItem(itemData);
      setCurrentEstimate(estimateData);
      setLifecycle(lifecycleData);
      setHistory(historyData);
    } catch (error) {
      console.error('Error loading item details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="p-6 text-center text-gray-500">
        פריט לא נמצא
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-surface-dark rounded-lg shadow-lg max-w-6xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {item.name}
            </h2>
            {item.description && (
              <p className="text-gray-600 dark:text-gray-400">
                {item.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-3">
              <TypeBadge type={item.type} />
              <StatusBadge status={item.current_status} />
              {item.category && (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded">
                  {item.category}
                </span>
              )}
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            סקירה כללית
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            היסטוריית אומדנים
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'timeline'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            ציר זמן
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Current Estimate */}
            {currentEstimate && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4">
                  אומדן נוכחי (גרסה {currentEstimate.version})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-green-700 dark:text-green-300 mb-1">עלות משוערת</div>
                    <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                      ₪{currentEstimate.estimated_cost.toLocaleString('he-IL')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-green-700 dark:text-green-300 mb-1">מע"מ ({currentEstimate.vat_rate}%)</div>
                    <div className="text-xl font-semibold text-green-800 dark:text-green-200">
                      ₪{(currentEstimate.total_with_vat - currentEstimate.estimated_cost).toLocaleString('he-IL')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-green-700 dark:text-green-300 mb-1">סה"כ כולל מע"מ</div>
                    <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                      ₪{currentEstimate.total_with_vat.toLocaleString('he-IL')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-green-700 dark:text-green-300 mb-1">תאריך עדכון</div>
                    <div className="text-sm font-semibold text-green-800 dark:text-green-200">
                      {new Date(currentEstimate.created_at).toLocaleDateString('he-IL')}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Lifecycle Info */}
            {lifecycle && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tender Info */}
                {lifecycle.tender_name && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">מכרז מקושר</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-blue-700 dark:text-blue-300">שם המכרז:</span>{' '}
                        <span className="font-semibold">{lifecycle.tender_name}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Contract Info */}
                {lifecycle.current_contract_amount && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                    <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-3">פרטי חוזה</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-purple-700 dark:text-purple-300">סכום חוזה:</span>{' '}
                        <span className="font-semibold">₪{parseFloat(lifecycle.current_contract_amount).toLocaleString('he-IL')}</span>
                      </div>
                      {lifecycle.variance_amount && (
                        <div>
                          <span className="text-purple-700 dark:text-purple-300">חיסכון/חריגה:</span>{' '}
                          <span className={`font-semibold ${parseFloat(lifecycle.variance_amount) < 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₪{Math.abs(parseFloat(lifecycle.variance_amount)).toLocaleString('he-IL')}
                            {parseFloat(lifecycle.variance_amount) < 0 ? ' (חיסכון)' : ' (חריגה)'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Metadata */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">מידע נוסף</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">נוצר:</span>{' '}
                  <span className="font-semibold">{new Date(item.created_at).toLocaleDateString('he-IL')}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">עודכן:</span>{' '}
                  <span className="font-semibold">{new Date(item.updated_at).toLocaleDateString('he-IL')}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">גרסה:</span>{' '}
                  <span className="font-semibold">{item.version}</span>
                </div>
                {item.created_by && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">נוצר על ידי:</span>{' '}
                    <span className="font-semibold">{item.created_by}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <EstimateVersionHistory projectItemId={itemId} projectItemName={item.name} />
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">ציר זמן - אירועים</h3>
            {history.length === 0 ? (
              <p className="text-center text-gray-500 py-8">אין היסטוריה זמינה</p>
            ) : (
              <div className="space-y-3">
                {history.map((event: any, index: number) => (
                  <div key={index} className="flex gap-4 border-r-2 border-blue-500 pr-4 pb-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100">
                            {event.event_type}
                          </div>
                          {event.event_description && (
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {event.event_description}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(event.event_timestamp).toLocaleString('he-IL')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    estimation: { label: 'אומדן', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    tender_draft: { label: 'טיוטת מכרז', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    tender_open: { label: 'מכרז פתוח', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
    tender_closed: { label: 'מכרז סגור', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
    contracted: { label: 'חוזה', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    in_progress: { label: 'בביצוע', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
    completed: { label: 'הושלם', className: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400' },
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
