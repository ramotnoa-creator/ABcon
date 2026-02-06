/**
 * Unified Costs Tab - עלויות
 * Replaces: Planning Estimate + Execution Estimate + Budget
 */

import { useState, useEffect, useMemo, Fragment } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getCostItems, exportCostItemToTender } from '../../../services/costsService';
import AddCostItemForm from '../../../components/Costs/AddCostItemForm';
import type { CostItem, Project, CostCategory } from '../../../types';

interface CostsTabProps {
  project: Project;
  onProjectUpdate?: (updates: Partial<Project>) => void;
}


const categoryLabels: Record<CostCategory, string> = {
  consultant: 'יועץ',
  supplier: 'ספק',
  contractor: 'קבלן',
};

const statusLabels = {
  draft: 'אומדן',
  tender_draft: 'טיוטת מכרז',
  tender_open: 'מכרז נשלח',
  tender_winner: 'מכרז זוכה',
};

// Row color based on status
const statusRowColors: Record<string, string> = {
  draft: 'border-r-4 border-r-amber-400',
  tender_draft: 'border-r-4 border-r-blue-400',
  tender_open: 'border-r-4 border-r-blue-500',
  tender_winner: 'border-r-4 border-r-emerald-500',
};

export default function CostsTab({ project, onProjectUpdate }: CostsTabProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<CostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<CostCategory | 'all'>('all');
  const [exportingItemId, setExportingItemId] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Get highlight parameter from URL
  const highlightItemId = searchParams.get('highlight');

  // Toggle row expansion
  const toggleRowExpansion = (itemId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Load cost items on mount and when project changes
  useEffect(() => {
    loadItems();
  }, [project.id]);

  // Reload and scroll when navigating back with highlight (e.g. from tender winner selection)
  useEffect(() => {
    if (highlightItemId) {
      loadItems().then(() => {
        // Scroll after data loads
        setTimeout(() => {
          const element = document.getElementById(`cost-item-${highlightItemId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          // Clear highlight after 3 seconds
          setTimeout(() => {
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('highlight');
            setSearchParams(newParams, { replace: true });
          }, 3000);
        }, 100);
      });
    }
  }, [highlightItemId]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await getCostItems(project.id);
      setItems(data);
    } catch (error) {
      console.error('Error loading cost items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportToTender = async (item: CostItem) => {
    if (item.status !== 'draft') {
      alert('ניתן לייצא למכרז רק פריטים בסטטוס טיוטה');
      return;
    }

    if (item.tender_id) {
      alert('פריט זה כבר יוצא למכרז');
      return;
    }

    const confirmExport = confirm(
      `האם לייצא את "${item.name}" למכרז?\n\nיווצר מכרז חדש עם הפרטים מפריט העלות.`
    );

    if (!confirmExport) return;

    try {
      setExportingItemId(item.id);

      // Map cost category to tender type
      const tenderTypeMap: Record<CostCategory, string> = {
        consultant: 'other',
        supplier: 'other',
        contractor: 'contractor',
      };

      const tenderId = await exportCostItemToTender(item.id, project.id, {
        project_id: project.id,
        tender_name: item.name,
        description: item.description,
        tender_type: tenderTypeMap[item.category] as any,
        estimated_budget: item.estimated_amount,
      });

      // Reload items to show updated status
      await loadItems();

      // Navigate to the tender page
      navigate(`/projects/${project.id}?tab=financial&subtab=tenders&tender=${tenderId}`);
    } catch (error) {
      console.error('Error exporting to tender:', error);
      alert('שגיאה בייצוא למכרז: ' + (error as Error).message);
    } finally {
      setExportingItemId(null);
    }
  };

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Type filter removed - keeping only category filter
      if (filterCategory !== 'all' && item.category !== filterCategory) return false;
      return true;
    });
  }, [items, filterCategory]);

  // Calculate summary
  const summary = useMemo(() => {
    const totalEstimated = items.reduce((sum, item) => sum + (item.estimated_amount || 0), 0);
    const totalActual = items.reduce((sum, item) => sum + (item.actual_amount || 0), 0);
    const variance = totalActual - totalEstimated;
    const variancePercent = totalEstimated > 0 ? (variance / totalEstimated) * 100 : 0;

    // Square meter calculations
    const costPerBuiltSqm = project.built_sqm && project.built_sqm > 0
      ? totalActual / project.built_sqm
      : 0;
    const costPerSalesSqm = project.sales_sqm && project.sales_sqm > 0
      ? totalActual / project.sales_sqm
      : 0;

    return {
      generalEstimate: project.general_estimate || 0,
      totalEstimated,
      totalActual,
      variance,
      variancePercent,
      costPerBuiltSqm,
      costPerSalesSqm,
    };
  }, [items, project.general_estimate, project.built_sqm, project.sales_sqm]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getVarianceColor = (variance: number): string => {
    if (variance === 0) return 'text-gray-600 dark:text-gray-400';
    return variance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">טוען עלויות...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* General Estimate */}
        <div className="bg-white dark:bg-surface-dark rounded-lg p-4 border border-border-light dark:border-border-dark">
          <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">
            אומדן כללי
          </div>
          <div className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">
            {formatCurrency(summary.generalEstimate)}
          </div>
        </div>

        {/* Total Estimated */}
        <div className="bg-white dark:bg-surface-dark rounded-lg p-4 border border-border-light dark:border-border-dark">
          <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">
            סה"כ אומדן
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(summary.totalEstimated)}
          </div>
        </div>

        {/* Total Actual */}
        <div className="bg-white dark:bg-surface-dark rounded-lg p-4 border border-border-light dark:border-border-dark">
          <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">
            עלות בפועל
          </div>
          <div className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">
            {formatCurrency(summary.totalActual)}
          </div>
        </div>

        {/* Variance */}
        <div className="bg-white dark:bg-surface-dark rounded-lg p-4 border border-border-light dark:border-border-dark">
          <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">
            פער
          </div>
          <div className={`text-2xl font-bold ${getVarianceColor(summary.variance)}`}>
            {formatCurrency(Math.abs(summary.variance))}
            {summary.variance !== 0 && (
              <span className="text-sm mr-1">
                ({summary.variance > 0 ? '+' : '-'}{Math.abs(summary.variancePercent).toFixed(1)}%)
              </span>
            )}
          </div>
        </div>

        {/* Cost per Built SQM */}
        <div className="bg-white dark:bg-surface-dark rounded-lg p-4 border border-border-light dark:border-border-dark">
          <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">
            מ"ר בנוי
          </div>
          <div className="text-lg font-bold text-text-main-light dark:text-text-main-dark">
            {project.built_sqm || 0} מ"ר
          </div>
          {project.built_sqm && project.built_sqm > 0 && (
            <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
              {formatCurrency(summary.costPerBuiltSqm)} / מ"ר
            </div>
          )}
        </div>

        {/* Cost per Sales SQM */}
        <div className="bg-white dark:bg-surface-dark rounded-lg p-4 border border-border-light dark:border-border-dark">
          <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">
            מ"ר מכר
          </div>
          <div className="text-lg font-bold text-text-main-light dark:text-text-main-dark">
            {project.sales_sqm || 0} מ"ר
          </div>
          {project.sales_sqm && project.sales_sqm > 0 && (
            <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
              {formatCurrency(summary.costPerSalesSqm)} / מ"ר
            </div>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Filter by Category */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as CostCategory | 'all')}
            className="px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark text-sm"
          >
            <option value="all">כל הקטגוריות</option>
            <option value="consultant">יועץ</option>
            <option value="supplier">ספק</option>
            <option value="contractor">קבלן</option>
          </select>

          <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            {filteredItems.length} פריטים
          </div>
        </div>

        {/* Add Button */}
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          הוסף פריט עלות
        </button>
      </div>

      {/* Table - Financial Blueprint Design */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="relative bg-gradient-to-b from-slate-50 via-slate-100/80 to-slate-100/50 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-800/50 border-b border-slate-300 dark:border-slate-700">
                {/* Subtle blueprint grid background */}
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-[0.1em] relative">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px] text-slate-500">label</span>
                    שם פריט
                  </div>
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-[0.1em]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px] text-slate-500">description</span>
                    תיאור
                  </div>
                </th>
                <th className="px-4 py-4 text-right text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-[0.1em]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px] text-slate-500">category</span>
                    קטגוריה
                  </div>
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-[0.1em]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px] text-blue-500">request_quote</span>
                    אומדן
                  </div>
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-[0.1em]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px] text-emerald-500">paid</span>
                    בפועל
                  </div>
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-[0.1em]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px] text-amber-500">monitoring</span>
                    ביצועים
                  </div>
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-[0.1em]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px] text-slate-500">schedule</span>
                    סטטוס
                  </div>
                </th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-[0.1em]">
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
                      <span className="material-symbols-outlined text-[64px] mb-3 opacity-30">
                        receipt_long
                      </span>
                      <p className="text-lg font-medium mb-1">
                        {items.length === 0 ? 'אין עדיין פריטי עלות' : 'לא נמצאו פריטים מתאימים'}
                      </p>
                      <p className="text-sm">
                        {items.length === 0 ? 'לחץ על "הוסף פריט עלות" כדי להתחיל' : 'נסה לשנות את הפילטר'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => {
                  const variance = (item.actual_amount || 0) - item.estimated_amount;
                  const variancePercent = item.estimated_amount > 0
                    ? (variance / item.estimated_amount) * 100
                    : 0;

                  const isHighlighted = highlightItemId === item.id;
                  const isExpanded = expandedRows.has(item.id);

                  // Calculate performance score (0-100)
                  const performanceScore = item.actual_amount
                    ? Math.min(100, Math.max(0, 100 - Math.abs(variancePercent)))
                    : null;

                  // Check if item has expandable content
                  const hasExpandableContent = !!(item.description || item.notes || item.created_at);

                  return (
                    <Fragment key={item.id}>
                    <tr
                      id={`cost-item-${item.id}`}
                      className={`
                        group
                        transition-all duration-200 ease-out
                        border-b border-slate-100 dark:border-slate-800/50
                        ${statusRowColors[item.status] || ''}
                        ${isHighlighted
                          ? 'bg-gradient-to-l from-primary/15 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10 dark:to-transparent animate-pulse-subtle'
                          : item.status === 'tender_winner'
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/10'
                            : item.status === 'tender_draft' || item.status === 'tender_open'
                            ? 'bg-blue-50/20 dark:bg-blue-950/10'
                            : index % 2 === 0
                              ? 'bg-white dark:bg-gray-900'
                              : 'bg-slate-50/40 dark:bg-slate-900/20'
                        }
                      `}
                    >
                      {/* Name */}
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {item.name}
                          </span>
                          {item.tender_id && (
                            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold uppercase tracking-wide flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">link</span>
                              מקושר למכרז
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Description */}
                      <td className="px-6 py-5 max-w-xs">
                        <span className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {item.description || <span className="italic opacity-40">אין תיאור</span>}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-5">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-[11px] font-bold uppercase tracking-wide ${
                          item.category === 'consultant'
                            ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/30 dark:border-purple-800/50 dark:text-purple-400'
                            : item.category === 'supplier'
                            ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800/50 dark:text-blue-400'
                            : 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/30 dark:border-orange-800/50 dark:text-orange-400'
                        }`}>
                          <span className={`size-1.5 rounded-full ${
                            item.category === 'consultant'
                              ? 'bg-purple-500'
                              : item.category === 'supplier'
                              ? 'bg-blue-500'
                              : 'bg-orange-500'
                          }`} />
                          {categoryLabels[item.category]}
                        </div>
                      </td>

                      {/* Estimated Amount */}
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                            {formatCurrency(item.estimated_amount)}
                          </span>
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wide">
                            תקציב מאושר
                          </span>
                        </div>
                      </td>

                      {/* Actual Amount */}
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-0.5">
                          {item.actual_amount ? (
                            <>
                              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                                {formatCurrency(item.actual_amount)}
                              </span>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wide">
                                עלות ממשית
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-slate-400 dark:text-slate-600 italic">ממתין...</span>
                          )}
                        </div>
                      </td>

                      {/* Variance - Enhanced with Visual Performance Bar */}
                      <td className="px-6 py-5">
                        {item.actual_amount ? (
                          <div className="flex flex-col gap-2 min-w-[140px]">
                            {/* Numeric Variance */}
                            <div className="flex items-center gap-2">
                              <div className={`p-1 rounded ${
                                variance === 0
                                  ? 'bg-slate-100 dark:bg-slate-800'
                                  : variance > 0
                                  ? 'bg-red-100 dark:bg-red-950/30'
                                  : 'bg-emerald-100 dark:bg-emerald-950/30'
                              }`}>
                                <span className={`material-symbols-outlined text-[16px] ${
                                  variance === 0
                                    ? 'text-slate-500'
                                    : variance > 0
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-emerald-600 dark:text-emerald-400'
                                }`}>
                                  {variance === 0 ? 'check_circle' : variance > 0 ? 'trending_up' : 'trending_down'}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className={`text-sm font-black tabular-nums ${
                                  variance === 0
                                    ? 'text-slate-600 dark:text-slate-400'
                                    : variance > 0
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-emerald-600 dark:text-emerald-400'
                                }`}>
                                  {variance > 0 ? '+' : ''}{formatCurrency(variance)}
                                </span>
                                <span className={`text-[10px] font-bold tabular-nums ${
                                  variance === 0
                                    ? 'text-slate-500'
                                    : variance > 0
                                    ? 'text-red-500'
                                    : 'text-emerald-500'
                                }`}>
                                  {variance > 0 ? '+' : ''}{variancePercent.toFixed(1)}%
                                </span>
                              </div>
                            </div>

                            {/* Performance Bar */}
                            <div className="relative w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`absolute top-0 right-0 h-full rounded-full transition-all duration-500 ${
                                  variance === 0
                                    ? 'bg-gradient-to-l from-slate-400 to-slate-500'
                                    : variance > 0
                                    ? 'bg-gradient-to-l from-red-400 via-red-500 to-red-600'
                                    : 'bg-gradient-to-l from-emerald-400 via-emerald-500 to-emerald-600'
                                }`}
                                style={{
                                  width: `${performanceScore !== null ? performanceScore : 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-[9px] text-slate-500 dark:text-slate-600 font-medium uppercase tracking-wider">
                              {variance === 0
                                ? 'בתקציב מדויק'
                                : variance > 0
                                ? 'חריגה מתקציב'
                                : 'חיסכון מתקציב'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-400">
                            <span className="material-symbols-outlined text-[16px]">hourglass_empty</span>
                            <span className="text-xs italic">ממתין לנתונים</span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-5">
                        <div className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-[11px] font-bold uppercase tracking-wide w-fit ${
                          item.status === 'draft'
                            ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800/50 dark:text-amber-300'
                            : item.status === 'tender_draft' || item.status === 'tender_open'
                            ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800/50 dark:text-blue-300'
                            : item.status === 'tender_winner'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800/50 dark:text-emerald-300'
                            : 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-900/30 dark:border-slate-700 dark:text-slate-300'
                        }`}>
                          <span className={`size-2 rounded-full ${
                            item.status === 'draft'
                              ? 'bg-amber-500'
                              : item.status === 'tender_draft' || item.status === 'tender_open'
                              ? 'bg-blue-500 animate-pulse'
                              : item.status === 'tender_winner'
                              ? 'bg-emerald-500'
                              : 'bg-slate-500'
                          }`} />
                          {statusLabels[item.status as keyof typeof statusLabels] || item.status}
                        </div>
                      </td>
                      {/* Actions - Enhanced Design */}
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Expand/Collapse Button - only if there's content to show */}
                          {hasExpandableContent && (
                            <button
                              onClick={() => toggleRowExpansion(item.id)}
                              className={`relative group p-2 rounded-lg border transition-all hover:scale-105 active:scale-95 ${
                                isExpanded
                                  ? 'bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/30 dark:to-indigo-900/20 border-indigo-200 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400'
                                  : 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                              title={isExpanded ? 'סגור פרטים' : 'הצג פרטים'}
                            >
                              <span className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${
                                isExpanded ? 'rotate-180' : ''
                              }`}>
                                expand_more
                              </span>
                              <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg z-10">
                                {isExpanded ? 'סגור פרטים' : 'הצג פרטים'}
                                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-100"></span>
                              </span>
                            </button>
                          )}
                          {/* Export to Tender Button - only for draft items */}
                          {item.status === 'draft' && !item.tender_id && (
                            <button
                              onClick={() => handleExportToTender(item)}
                              disabled={exportingItemId === item.id}
                              className="relative group p-2 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800/50 text-blue-600 dark:text-blue-400 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/40 dark:hover:to-blue-800/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                              title="יצא למכרז"
                            >
                              {exportingItemId === item.id ? (
                                <div className="size-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <>
                                  <span className="material-symbols-outlined text-[18px]">send</span>
                                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
                                    יצא למכרז
                                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-100"></span>
                                  </span>
                                </>
                              )}
                            </button>
                          )}

                          {/* View Tender Button - if already exported */}
                          {item.tender_id && (
                            <button
                              onClick={() => navigate(`/projects/${project.id}?tab=financial&subtab=tenders&tender=${item.tender_id}`)}
                              className="relative group p-2 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border border-purple-200 dark:border-purple-800/50 text-purple-600 dark:text-purple-400 hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-900/40 dark:hover:to-purple-800/30 transition-all hover:scale-105 active:scale-95"
                              title="צפה במכרז"
                            >
                              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                              <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
                                צפה במכרז
                                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-100"></span>
                              </span>
                            </button>
                          )}

                          {/* Edit Button */}
                          <button
                            className="relative group p-2 rounded-lg bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary hover:border-primary/30 transition-all hover:scale-105 active:scale-95"
                            title="עריכה"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                            <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
                              עריכה
                              <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-100"></span>
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Row - Details */}
                    {isExpanded && (
                      <tr className="bg-gradient-to-b from-slate-50/80 to-white dark:from-slate-900/80 dark:to-gray-900 border-b border-slate-200 dark:border-slate-800">
                        <td colSpan={8} className="px-6 py-0">
                          <div className="expand-section expanded">
                            <div className="py-4 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Description */}
                                {item.description && (
                                  <div className="bg-white dark:bg-slate-950/30 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="material-symbols-outlined text-[18px] text-blue-600 dark:text-blue-400">description</span>
                                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">תיאור</span>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                      {item.description}
                                    </p>
                                  </div>
                                )}

                                {/* Notes */}
                                {item.notes && (
                                  <div className="bg-white dark:bg-slate-950/30 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="material-symbols-outlined text-[18px] text-amber-600 dark:text-amber-400">sticky_note_2</span>
                                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">הערות</span>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                      {item.notes}
                                    </p>
                                  </div>
                                )}

                                {/* Timestamps */}
                                <div className="bg-white dark:bg-slate-950/30 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                                  <div className="flex items-center gap-2 mb-3">
                                    <span className="material-symbols-outlined text-[18px] text-purple-600 dark:text-purple-400">schedule</span>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">מועדים</span>
                                  </div>
                                  <div className="space-y-2">
                                    {item.created_at && (
                                      <div className="flex items-center gap-2 text-xs">
                                        <span className="text-slate-500 dark:text-slate-500 font-medium">נוצר:</span>
                                        <span className="text-slate-700 dark:text-slate-300 font-semibold">
                                          {new Date(item.created_at).toLocaleDateString('he-IL', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </span>
                                      </div>
                                    )}
                                    {item.updated_at && (
                                      <div className="flex items-center gap-2 text-xs">
                                        <span className="text-slate-500 dark:text-slate-500 font-medium">עודכן:</span>
                                        <span className="text-slate-700 dark:text-slate-300 font-semibold">
                                          {new Date(item.updated_at).toLocaleDateString('he-IL', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Additional Metadata */}
                                <div className="bg-white dark:bg-slate-950/30 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                                  <div className="flex items-center gap-2 mb-3">
                                    <span className="material-symbols-outlined text-[18px] text-emerald-600 dark:text-emerald-400">info</span>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">מידע נוסף</span>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs">
                                      <span className="text-slate-500 dark:text-slate-500 font-medium">מע"מ:</span>
                                      <span className="text-slate-700 dark:text-slate-300 font-semibold">
                                        {item.vat_included ? `כלול (${item.vat_rate}%)` : 'לא כלול'}
                                      </span>
                                    </div>
                                    {item.tender_id && (
                                      <div className="flex items-center gap-2 text-xs">
                                        <span className="text-slate-500 dark:text-slate-500 font-medium">מכרז:</span>
                                        <button
                                          onClick={() => navigate(`/projects/${project.id}?tab=financial&subtab=tenders&tender=${item.tender_id}`)}
                                          className="text-purple-600 dark:text-purple-400 font-semibold hover:underline"
                                        >
                                          צפה במכרז
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <AddCostItemForm
          projectId={project.id}
          onSave={(newItem) => {
            setItems([newItem, ...items]);
            setShowAddForm(false);
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}
    </div>
  );
}
