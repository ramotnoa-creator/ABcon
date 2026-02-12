/**
 * Unified Costs Tab - עלויות
 * Replaces: Planning Estimate + Execution Estimate + Budget
 */

import { useState, useEffect, useMemo, Fragment } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getCostItems, exportCostItemToTender } from '../../../services/costsService';
import { getTenders } from '../../../services/tendersService';
import { getSchedulesByProject, getScheduleItemsByProject } from '../../../services/paymentSchedulesService';
import { getMilestones } from '../../../services/milestonesService';
import AddCostItemForm from '../../../components/Costs/AddCostItemForm';
import PaymentScheduleView from '../../../components/Costs/PaymentScheduleView';
import PaymentScheduleModal from '../../../components/Costs/PaymentScheduleModal';
import type { CostItem, Project, CostCategory, PaymentSchedule, ScheduleItem, ProjectMilestone, Tender } from '../../../types';

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

export default function CostsTab({ project }: CostsTabProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<CostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<CostCategory | 'all'>('all');
  const [exportingItemId, setExportingItemId] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [scheduleModalItem, setScheduleModalItem] = useState<CostItem | null>(null);
  const [tendersMap, setTendersMap] = useState<Record<string, Tender>>({});

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
      // Load cost items first (critical), then schedule data (non-critical)
      const data = await getCostItems(project.id);
      setItems(data);

      // Load schedule data and tenders in parallel - failures here shouldn't block cost items
      const [scheds, sItems, ms, loadedTenders] = await Promise.all([
        getSchedulesByProject(project.id).catch(() => [] as PaymentSchedule[]),
        getScheduleItemsByProject(project.id).catch(() => [] as ScheduleItem[]),
        getMilestones(project.id).catch(() => [] as ProjectMilestone[]),
        getTenders(project.id).catch(() => [] as Tender[]),
      ]);
      setSchedules(scheds);
      setScheduleItems(sItems);
      setMilestones(ms);
      // Build tenders map indexed by tender ID
      const tMap: Record<string, Tender> = {};
      loadedTenders.forEach(t => { tMap[t.id] = t; });
      setTendersMap(tMap);
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
    const generalEstimate = project.general_estimate || 0;
    const totalEstimated = items.reduce((sum, item) => sum + (item.estimated_amount || 0), 0);
    const totalActual = items.reduce((sum, item) => sum + (item.actual_amount || 0), 0);
    const variance = totalActual - totalEstimated;
    const variancePercent = totalEstimated > 0 ? (variance / totalEstimated) * 100 : 0;

    // Items with/without actual amounts
    const itemsWithActual = items.filter(i => i.actual_amount != null && i.actual_amount > 0);
    const itemsWithoutActual = items.filter(i => i.actual_amount == null || i.actual_amount === 0);
    const totalWithoutActual = itemsWithoutActual.reduce((s, i) => s + (i.estimated_amount || 0), 0);
    const totalContracted = itemsWithActual.reduce((s, i) => s + (i.actual_amount ?? 0), 0);
    const bestEstimateTotal = totalContracted + totalWithoutActual;

    // Gap percentages vs general estimate
    const gapEstimatedVsGeneral = generalEstimate > 0
      ? ((totalEstimated - generalEstimate) / generalEstimate) * 100 : 0;
    const gapBestVsGeneral = generalEstimate > 0
      ? ((bestEstimateTotal - generalEstimate) / generalEstimate) * 100 : 0;

    // Square meter calculations
    const costPerBuiltSqm = project.built_sqm && project.built_sqm > 0
      ? totalActual / project.built_sqm
      : 0;
    const costPerSalesSqm = project.sales_sqm && project.sales_sqm > 0
      ? totalActual / project.sales_sqm
      : 0;

    // Category breakdown
    const byCategory = (['consultant', 'supplier', 'contractor'] as const).map(cat => {
      const catItems = items.filter(i => i.category === cat);
      const estimated = catItems.reduce((s, i) => s + (i.estimated_amount || 0), 0);
      const actual = catItems.reduce((s, i) => s + (i.actual_amount || 0), 0);
      return { category: cat, count: catItems.length, estimated, actual };
    });

    return {
      generalEstimate,
      totalEstimated,
      totalActual,
      variance,
      variancePercent,
      costPerBuiltSqm,
      costPerSalesSqm,
      itemsWithActualCount: itemsWithActual.length,
      itemsWithoutActualCount: itemsWithoutActual.length,
      totalWithoutActual,
      totalContracted,
      bestEstimateTotal,
      gapEstimatedVsGeneral,
      gapBestVsGeneral,
      byCategory,
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

  // Helper: get schedule for a cost item
  const getScheduleForItem = (costItemId: string) =>
    schedules.find((s) => s.cost_item_id === costItemId);

  const getScheduleItemsForSchedule = (scheduleId: string) =>
    scheduleItems.filter((si) => si.schedule_id === scheduleId).sort((a, b) => a.order - b.order);

  // Helper: get winner row border color based on schedule status
  const getWinnerBorderColor = (item: CostItem): string => {
    if (item.status !== 'tender_winner') return statusRowColors[item.status] || '';
    const schedule = getScheduleForItem(item.id);
    if (!schedule) return 'border-r-4 border-r-red-500'; // No schedule
    const sItems = getScheduleItemsForSchedule(schedule.id);
    const allLinked = sItems.length > 0 && sItems.every((si) => !!si.milestone_id);
    if (allLinked) return 'border-r-4 border-r-emerald-500'; // All linked to milestones
    return 'border-r-4 border-r-amber-400'; // Manual dates
  };

  // Helper: mini progress for status column
  const getScheduleProgress = (costItemId: string) => {
    const schedule = getScheduleForItem(costItemId);
    if (!schedule) return null;
    const sItems = getScheduleItemsForSchedule(schedule.id);
    if (sItems.length === 0) return null;
    const paidCount = sItems.filter((si) => si.status === 'paid').length;
    const paidAmount = sItems.filter((si) => si.status === 'paid').reduce((s, i) => s + (i.paid_amount || i.amount), 0);
    return { paidCount, total: sItems.length, paidAmount, totalAmount: schedule.total_amount };
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
      {/* Summary Cards — 3 cards: Estimate, Current State, Difference */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Total Estimate (אומדן) */}
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800/40">
          <div className="text-xs text-blue-600 dark:text-blue-400 mb-1 font-medium">
            אומדן
          </div>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {formatCurrency(summary.totalEstimated)}
          </div>
          <div className="text-xs text-blue-500 dark:text-blue-400 mt-1">
            {items.length} פריטים
          </div>
        </div>

        {/* 2. Current State = actual where available + estimate where not */}
        <div className="bg-white dark:bg-surface-dark rounded-lg p-4 border border-border-light dark:border-border-dark">
          <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-1 font-medium">
            מצב נוכחי
          </div>
          <div className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">
            {formatCurrency(summary.bestEstimateTotal)}
          </div>
          <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1 flex items-center gap-2 flex-wrap">
            <span className="text-emerald-600 dark:text-emerald-400">{summary.itemsWithActualCount} בפועל</span>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span className="text-amber-600 dark:text-amber-400">{summary.itemsWithoutActualCount} באומדן</span>
          </div>
        </div>

        {/* 3. Difference (הפרש) */}
        {(() => {
          const diff = summary.bestEstimateTotal - summary.totalEstimated;
          const diffPercent = summary.totalEstimated > 0 ? (diff / summary.totalEstimated) * 100 : 0;
          const isOver = diff > 0;
          const isExact = diff === 0;
          return (
            <div className={`rounded-lg p-4 border ${
              isExact
                ? 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700'
                : isOver
                ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/40'
                : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40'
            }`}>
              <div className={`text-xs mb-1 font-medium ${
                isExact ? 'text-gray-500' : isOver ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                הפרש מאומדן
              </div>
              <div className={`text-2xl font-bold ${
                isExact ? 'text-gray-600 dark:text-gray-400' : isOver ? 'text-red-700 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300'
              }`}>
                {diff > 0 ? '+' : ''}{formatCurrency(diff)}
              </div>
              <div className={`text-xs font-semibold mt-1 ${
                isExact ? 'text-gray-500' : isOver ? 'text-red-500 dark:text-red-400' : 'text-emerald-500 dark:text-emerald-400'
              }`}>
                {isExact ? 'בדיוק על האומדן' : `${diff > 0 ? '+' : ''}${diffPercent.toFixed(1)}%`}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Category breakdown */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {summary.byCategory.filter(c => c.count > 0).map(({ category, count, estimated, actual }) => {
            const colors = {
              consultant: { bg: 'bg-purple-50 dark:bg-purple-950/20', border: 'border-purple-200 dark:border-purple-800/40', dot: 'bg-purple-500', text: 'text-purple-700 dark:text-purple-300', sub: 'text-purple-500 dark:text-purple-400' },
              supplier: { bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-200 dark:border-blue-800/40', dot: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-300', sub: 'text-blue-500 dark:text-blue-400' },
              contractor: { bg: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-orange-200 dark:border-orange-800/40', dot: 'bg-orange-500', text: 'text-orange-700 dark:text-orange-300', sub: 'text-orange-500 dark:text-orange-400' },
            }[category];
            const pct = summary.totalEstimated > 0 ? (estimated / summary.totalEstimated) * 100 : 0;
            return (
              <div key={category} className={`${colors.bg} rounded-lg px-4 py-3 border ${colors.border}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`size-2 rounded-full ${colors.dot}`} />
                  <span className={`text-xs font-bold ${colors.sub}`}>{categoryLabels[category]}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{count} פריטים</span>
                </div>
                <div className={`text-lg font-bold ${colors.text}`}>
                  {formatCurrency(estimated)}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full ${colors.dot} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{pct.toFixed(0)}%</span>
                </div>
                {actual > 0 && (
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                    בפועל: {formatCurrency(actual)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* SQM compact row */}
      {(project.built_sqm || project.sales_sqm) && (
        <div className="grid grid-cols-2 gap-4">
          {project.built_sqm && project.built_sqm > 0 && (
            <div className="bg-white dark:bg-surface-dark rounded-lg px-4 py-2.5 border border-border-light dark:border-border-dark flex items-center justify-between">
              <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                מ"ר בנוי: {project.built_sqm.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-text-main-light dark:text-text-main-dark">
                {formatCurrency(summary.costPerBuiltSqm)} / מ"ר
              </span>
            </div>
          )}
          {project.sales_sqm && project.sales_sqm > 0 && (
            <div className="bg-white dark:bg-surface-dark rounded-lg px-4 py-2.5 border border-border-light dark:border-border-dark flex items-center justify-between">
              <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                מ"ר מכר: {project.sales_sqm.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-text-main-light dark:text-text-main-dark">
                {formatCurrency(summary.costPerSalesSqm)} / מ"ר
              </span>
            </div>
          )}
        </div>
      )}

      {/* Budget Bridge Bar */}
      {summary.generalEstimate > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 space-y-3">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
            גשר תקציבי
          </div>
          {(() => {
            const maxVal = Math.max(summary.generalEstimate, summary.totalEstimated, summary.bestEstimateTotal) || 1;
            const pctGeneral = (summary.generalEstimate / maxVal) * 100;
            const pctEstimated = (summary.totalEstimated / maxVal) * 100;
            const pctContracted = (summary.totalContracted / maxVal) * 100;
            const pctUncontracted = (summary.totalWithoutActual / maxVal) * 100;
            return (
              <div className="space-y-2">
                {/* Bar 1: General Estimate */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-300 dark:bg-gray-600 rounded-full"
                      style={{ width: `${pctGeneral}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap min-w-0 sm:min-w-[160px] text-left">
                    אומדן כללי: {formatCurrency(summary.generalEstimate)}
                  </div>
                </div>

                {/* Bar 2: Total Estimated */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-400 dark:bg-blue-500 rounded-full"
                      style={{ width: `${pctEstimated}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap min-w-0 sm:min-w-[160px] text-left">
                    סה"כ אומדנים: {formatCurrency(summary.totalEstimated)}
                    {summary.gapEstimatedVsGeneral !== 0 && (
                      <span className={`mr-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        summary.gapEstimatedVsGeneral > 0
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {summary.gapEstimatedVsGeneral > 0 ? '+' : ''}{summary.gapEstimatedVsGeneral.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Bar 3: Actual + Uncontracted (split bar) */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-400 dark:bg-emerald-500"
                      style={{ width: `${pctContracted}%` }}
                    />
                    <div
                      className="h-full bg-amber-300 dark:bg-amber-500"
                      style={{ width: `${pctUncontracted}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap min-w-0 sm:min-w-[160px] text-left">
                    <span className="text-emerald-600 dark:text-emerald-400">בפועל: {formatCurrency(summary.totalContracted)}</span>
                    <span className="text-gray-400 mx-1">+</span>
                    <span className="text-amber-600 dark:text-amber-400">ללא מחיר: {formatCurrency(summary.totalWithoutActual)}</span>
                    {summary.gapBestVsGeneral !== 0 && (
                      <span className={`mr-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        summary.gapBestVsGeneral > 0
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {summary.gapBestVsGeneral > 0 ? '+' : ''}{summary.gapBestVsGeneral.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

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
                  const hasSchedule = item.status === 'tender_winner' && !!getScheduleForItem(item.id);
                  const hasExpandableContent = !!(item.description || item.notes || item.created_at || hasSchedule);

                  return (
                    <Fragment key={item.id}>
                    <tr
                      id={`cost-item-${item.id}`}
                      className={`
                        group
                        transition-all duration-200 ease-out
                        border-b border-slate-100 dark:border-slate-800/50
                        ${item.status === 'tender_winner' ? getWinnerBorderColor(item) : (statusRowColors[item.status] || '')}
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
                          <div className="flex flex-col gap-2 min-w-0 sm:min-w-[140px]">
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
                        {/* Mini progress bar for winner items with schedule */}
                        {item.status === 'tender_winner' && (() => {
                          const progress = getScheduleProgress(item.id);
                          if (!progress) return null;
                          const pct = progress.totalAmount > 0 ? (progress.paidAmount / progress.totalAmount) * 100 : 0;
                          return (
                            <div className="mt-2 space-y-1">
                              <div className="w-20 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full transition-all"
                                  style={{ width: `${Math.min(100, pct)}%` }}
                                />
                              </div>
                              <span className="text-[9px] text-slate-500">{progress.paidCount}/{progress.total} שולמו</span>
                            </div>
                          );
                        })()}
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

                          {/* Payment Schedule Button - for tender winners */}
                          {item.status === 'tender_winner' && (
                            <button
                              onClick={() => setScheduleModalItem(item)}
                              className={`relative group p-2 rounded-lg border transition-all hover:scale-105 active:scale-95 ${
                                getScheduleForItem(item.id)
                                  ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800/50 text-amber-600 dark:text-amber-400'
                              }`}
                              title={getScheduleForItem(item.id) ? 'ערוך לוח תשלומים' : 'צור לוח תשלומים'}
                            >
                              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                              <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
                                {getScheduleForItem(item.id) ? 'ערוך לוח תשלומים' : 'צור לוח תשלומים'}
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

                                {/* Tender Winner Info */}
                                {item.status === 'tender_winner' && item.tender_id && tendersMap[item.tender_id] && (() => {
                                  const tender = tendersMap[item.tender_id!];
                                  return (
                                    <div className="md:col-span-2 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800/40">
                                      <div className="flex items-center gap-2 mb-3">
                                        <span className="material-symbols-outlined text-[18px] text-emerald-600 dark:text-emerald-400">emoji_events</span>
                                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">זוכה במכרז</span>
                                        <button
                                          onClick={() => navigate(`/projects/${project.id}?tab=financial&subtab=tenders&tender=${item.tender_id}`)}
                                          className="mr-auto text-[10px] text-purple-600 dark:text-purple-400 font-semibold hover:underline flex items-center gap-1"
                                        >
                                          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                          צפה במכרז
                                        </button>
                                      </div>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {tender.winner_professional_name && (
                                          <div>
                                            <div className="text-[10px] text-emerald-600 dark:text-emerald-500 font-medium mb-0.5">זוכה</div>
                                            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{tender.winner_professional_name}</div>
                                          </div>
                                        )}
                                        {tender.contract_amount != null && (
                                          <div>
                                            <div className="text-[10px] text-emerald-600 dark:text-emerald-500 font-medium mb-0.5">סכום חוזה</div>
                                            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatCurrency(tender.contract_amount)}</div>
                                          </div>
                                        )}
                                        {tender.estimated_budget != null && (
                                          <div>
                                            <div className="text-[10px] text-emerald-600 dark:text-emerald-500 font-medium mb-0.5">אומדן מכרז</div>
                                            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatCurrency(tender.estimated_budget)}</div>
                                          </div>
                                        )}
                                        {tender.winner_selected_date && (
                                          <div>
                                            <div className="text-[10px] text-emerald-600 dark:text-emerald-500 font-medium mb-0.5">תאריך בחירה</div>
                                            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                              {new Date(tender.winner_selected_date).toLocaleDateString('he-IL')}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      {(tender.management_remarks || tender.notes) && (
                                        <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800/40 space-y-2">
                                          {tender.management_remarks && (
                                            <div>
                                              <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-medium">הערות ניהול: </span>
                                              <span className="text-xs text-slate-600 dark:text-slate-400">{tender.management_remarks}</span>
                                            </div>
                                          )}
                                          {tender.notes && (
                                            <div>
                                              <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-medium">הערות מכרז: </span>
                                              <span className="text-xs text-slate-600 dark:text-slate-400">{tender.notes}</span>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}

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

                                {/* Payment Schedule View - for winner items */}
                                {item.status === 'tender_winner' && (() => {
                                  const schedule = getScheduleForItem(item.id);
                                  if (!schedule) return null;
                                  const sItems = getScheduleItemsForSchedule(schedule.id);
                                  if (sItems.length === 0) return null;
                                  return (
                                    <div className="md:col-span-2 bg-white dark:bg-slate-950/30 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                                      <PaymentScheduleView
                                        schedule={schedule}
                                        items={sItems}
                                        milestones={milestones}
                                      />
                                    </div>
                                  );
                                })()}

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
          vatRate={project.current_vat_rate ?? 17}
          onSave={(newItem) => {
            setItems([newItem, ...items]);
            setShowAddForm(false);
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Payment Schedule Modal */}
      {scheduleModalItem && (
        <PaymentScheduleModal
          costItem={scheduleModalItem}
          projectId={project.id}
          milestones={milestones}
          existingSchedule={getScheduleForItem(scheduleModalItem.id) || null}
          existingItems={
            getScheduleForItem(scheduleModalItem.id)
              ? getScheduleItemsForSchedule(getScheduleForItem(scheduleModalItem.id)!.id)
              : undefined
          }
          onSave={() => {
            setScheduleModalItem(null);
            loadItems();
          }}
          onCancel={() => setScheduleModalItem(null)}
        />
      )}
    </div>
  );
}
