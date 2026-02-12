import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllCostItems } from '../../../services/costsService';
import { getProjects } from '../../../services/projectsService';
import * as ExcelJS from 'exceljs';
import type { CostItem, CostCategory, Project } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';
import { canAccessProject, canViewAllProjects } from '../../../utils/permissions';

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const categoryLabels: Record<CostCategory, string> = {
  consultant: 'יועץ',
  supplier: 'ספק',
  contractor: 'קבלן',
  agra: 'אגרה',
};

const categoryIcons: Record<CostCategory, string> = {
  consultant: 'school',
  supplier: 'inventory_2',
  contractor: 'construction',
  agra: 'account_balance',
};

const KPI_COLOR_CLASSES = {
  blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
  orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
  red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
} as const;

const KPI_PROGRESS_COLORS = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
} as const;

const CATEGORY_COLORS = {
  consultant: {
    bg: 'bg-purple-50 dark:bg-purple-950/20',
    border: 'border-purple-200 dark:border-purple-800/40',
    dot: 'bg-purple-500',
    text: 'text-purple-700 dark:text-purple-300',
    sub: 'text-purple-500 dark:text-purple-400',
  },
  supplier: {
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-200 dark:border-blue-800/40',
    dot: 'bg-blue-500',
    text: 'text-blue-700 dark:text-blue-300',
    sub: 'text-blue-500 dark:text-blue-400',
  },
  contractor: {
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    border: 'border-orange-200 dark:border-orange-800/40',
    dot: 'bg-orange-500',
    text: 'text-orange-700 dark:text-orange-300',
    sub: 'text-orange-500 dark:text-orange-400',
  },
  agra: {
    bg: 'bg-green-50 dark:bg-green-950/20',
    border: 'border-green-200 dark:border-green-800/40',
    dot: 'bg-green-500',
    text: 'text-green-700 dark:text-green-300',
    sub: 'text-green-500 dark:text-green-400',
  },
} as const;

interface KPICardProps {
  icon: string;
  label: string;
  value: string;
  subValue?: string;
  color: 'blue' | 'green' | 'orange' | 'red';
  progress?: number;
}

function KPICard({ icon, label, value, subValue, color, progress }: KPICardProps) {
  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-4 flex flex-col">
      <div className="flex items-center gap-3 mb-3">
        <div className={`size-10 rounded-lg flex items-center justify-center ${KPI_COLOR_CLASSES[color]}`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
          {label}
        </span>
      </div>
      <div className="text-2xl font-black text-text-main-light dark:text-text-main-dark mb-1">
        {value}
      </div>
      {subValue && (
        <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
          {subValue}
        </div>
      )}
      {progress !== undefined && (
        <div className="mt-3">
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${KPI_PROGRESS_COLORS[color]} rounded-full transition-all`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

type CostItemWithProject = CostItem & {
  project?: Project;
};

interface ProjectAggregation {
  project: Project;
  items: CostItem[];
  totalEstimated: number;
  totalActual: number;
  bestEstimate: number;
  variance: number;
  variancePercent: number;
  itemsWithActual: number;
}

export default function BudgetTabContent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [costItems, setCostItems] = useState<CostItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CostCategory | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [allItems, allProjects] = await Promise.all([
          getAllCostItems(),
          getProjects(),
        ]);

        // Filter cost items based on user permissions
        const accessibleItems = allItems.filter((item) => {
          if (!user) return false;
          if (canViewAllProjects(user)) return true;
          return canAccessProject(user, item.project_id);
        });

        setCostItems(accessibleItems);
        setProjects(allProjects);
      } catch (error) {
        console.error('Error loading cost data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Combine cost items with project data
  const costItemsWithProject: CostItemWithProject[] = useMemo(() => {
    return costItems.map((item) => ({
      ...item,
      project: projects.find((p) => p.id === item.project_id),
    }));
  }, [costItems, projects]);

  // Filter items based on search and category
  const filteredItems = useMemo(() => {
    let filtered = costItemsWithProject;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.project?.project_name.toLowerCase().includes(query)
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((item) => item.category === categoryFilter);
    }

    return filtered;
  }, [costItemsWithProject, searchQuery, categoryFilter]);

  // Calculate KPIs from filtered items
  const kpiData = useMemo(() => {
    const totalEstimated = filteredItems.reduce((sum, item) => sum + item.estimated_amount, 0);

    const itemsWithActual = filteredItems.filter(
      (i) => i.actual_amount != null && i.actual_amount > 0
    );
    const itemsWithoutActual = filteredItems.filter(
      (i) => i.actual_amount == null || i.actual_amount === 0
    );

    const totalActual = itemsWithActual.reduce((sum, i) => sum + (i.actual_amount ?? 0), 0);
    const totalWithoutActual = itemsWithoutActual.reduce((sum, i) => sum + i.estimated_amount, 0);
    const bestEstimate = totalActual + totalWithoutActual;
    const variance = bestEstimate - totalEstimated;
    const variancePercent = totalEstimated > 0 ? (variance / totalEstimated) * 100 : 0;

    return {
      totalEstimated,
      totalActual,
      bestEstimate,
      variance,
      variancePercent,
      itemsCount: filteredItems.length,
      itemsWithActualCount: itemsWithActual.length,
      itemsWithoutActualCount: itemsWithoutActual.length,
    };
  }, [filteredItems]);

  // Category breakdown from filtered items
  const categoryBreakdown = useMemo(() => {
    return (['consultant', 'supplier', 'contractor', 'agra'] as const).map((cat) => {
      const catItems = filteredItems.filter((i) => i.category === cat);
      const estimated = catItems.reduce((s, i) => s + i.estimated_amount, 0);
      const actual = catItems.reduce((s, i) => s + (i.actual_amount ?? 0), 0);
      const pct = kpiData.totalEstimated > 0 ? (estimated / kpiData.totalEstimated) * 100 : 0;
      return { category: cat, count: catItems.length, estimated, actual, pct };
    });
  }, [filteredItems, kpiData.totalEstimated]);

  // Per-project aggregation from filtered items
  const projectAggregations: ProjectAggregation[] = useMemo(() => {
    const byProject = new Map<string, CostItemWithProject[]>();

    filteredItems.forEach((item) => {
      const existing = byProject.get(item.project_id) || [];
      existing.push(item);
      byProject.set(item.project_id, existing);
    });

    const aggregations: ProjectAggregation[] = [];

    byProject.forEach((items, projectId) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      const totalEstimated = items.reduce((s, i) => s + i.estimated_amount, 0);
      const withActual = items.filter((i) => i.actual_amount != null && i.actual_amount > 0);
      const withoutActual = items.filter((i) => i.actual_amount == null || i.actual_amount === 0);
      const totalActual = withActual.reduce((s, i) => s + (i.actual_amount ?? 0), 0);
      const bestEstimate = totalActual + withoutActual.reduce((s, i) => s + i.estimated_amount, 0);
      const variance = bestEstimate - totalEstimated;
      const variancePercent = totalEstimated > 0 ? (variance / totalEstimated) * 100 : 0;

      aggregations.push({
        project,
        items,
        totalEstimated,
        totalActual,
        bestEstimate,
        variance,
        variancePercent,
        itemsWithActual: withActual.length,
      });
    });

    // Sort by bestEstimate descending (largest projects first)
    aggregations.sort((a, b) => b.bestEstimate - a.bestEstimate);

    return aggregations;
  }, [filteredItems, projects]);

  // Pagination
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return projectAggregations.slice(start, start + itemsPerPage);
  }, [projectAggregations, currentPage]);

  const totalPages = Math.ceil(projectAggregations.length / itemsPerPage);

  // Export to Excel
  const handleExport = useCallback(async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('עלויות');

    sheet.views = [{ rightToLeft: true }];

    sheet.columns = [
      { header: 'פרויקט', key: 'project', width: 20 },
      { header: 'שם פריט', key: 'name', width: 25 },
      { header: 'תיאור', key: 'description', width: 30 },
      { header: 'קטגוריה', key: 'category', width: 12 },
      { header: 'אומדן', key: 'estimated', width: 15 },
      { header: 'בפועל', key: 'actual', width: 15 },
      { header: 'מצב נוכחי', key: 'best_estimate', width: 15 },
      { header: 'הפרש', key: 'variance', width: 15 },
      { header: 'הפרש %', key: 'variance_pct', width: 12 },
      { header: 'סטטוס', key: 'status', width: 12 },
    ];

    filteredItems.forEach((item) => {
      const hasActual = item.actual_amount != null && item.actual_amount > 0;
      const bestEst = hasActual ? item.actual_amount! : item.estimated_amount;
      const variance = bestEst - item.estimated_amount;
      const variancePct = item.estimated_amount > 0 ? (variance / item.estimated_amount) * 100 : 0;

      sheet.addRow({
        project: item.project?.project_name || '',
        name: item.name,
        description: item.description || '',
        category: categoryLabels[item.category],
        estimated: item.estimated_amount,
        actual: hasActual ? item.actual_amount : '-',
        best_estimate: bestEst,
        variance: variance,
        variance_pct: `${variancePct.toFixed(1)}%`,
        status: item.status,
      });
    });

    // Style header row
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF3F4F6' },
    };

    // Conditional formatting for variance column
    sheet.getColumn(8).eachCell((cell, rowNumber) => {
      if (rowNumber === 1) return;
      const value = cell.value as number;
      if (typeof value !== 'number') return;

      if (value < 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
        cell.font = { color: { argb: 'FF059669' }, bold: true };
      } else if (value > 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        cell.font = { color: { argb: 'FFDC2626' }, bold: true };
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `costs-overview-${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredItems]);

  // Navigate to project costs tab
  const handleProjectClick = useCallback(
    (projectId: string) => {
      navigate(`/projects/${projectId}?tab=costs`);
    },
    [navigate]
  );

  const toggleProjectExpand = (projectId: string) => {
    setExpandedProjectId(expandedProjectId === projectId ? null : projectId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          icon="request_quote"
          label="סה״כ אומדן"
          value={formatCurrency(kpiData.totalEstimated)}
          subValue={`${kpiData.itemsCount} פריטים`}
          color="blue"
        />
        <KPICard
          icon="paid"
          label="סה״כ בפועל (חוזים)"
          value={formatCurrency(kpiData.totalActual)}
          subValue={`${kpiData.itemsWithActualCount} פריטים עם מחיר בפועל`}
          color="orange"
          progress={kpiData.totalEstimated > 0 ? (kpiData.totalActual / kpiData.totalEstimated) * 100 : 0}
        />
        <KPICard
          icon="monitoring"
          label="מצב נוכחי"
          value={formatCurrency(kpiData.bestEstimate)}
          subValue={`${kpiData.itemsWithActualCount} בפועל + ${kpiData.itemsWithoutActualCount} באומדן`}
          color="green"
        />
        <KPICard
          icon="trending_up"
          label="הפרש מאומדן"
          value={formatCurrency(kpiData.variance)}
          subValue={
            kpiData.variance === 0
              ? 'בדיוק על האומדן'
              : `${kpiData.variance > 0 ? '+' : ''}${kpiData.variancePercent.toFixed(1)}%`
          }
          color={kpiData.variance > 0 ? 'red' : kpiData.variance < 0 ? 'green' : 'blue'}
        />
      </div>

      {/* Category Breakdown */}
      {costItems.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {categoryBreakdown
            .filter((c) => c.count > 0)
            .map(({ category, count, estimated, actual, pct }) => {
              const colors = CATEGORY_COLORS[category];
              return (
                <div
                  key={category}
                  className={`${colors.bg} rounded-xl px-4 py-4 border ${colors.border}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`material-symbols-outlined text-[18px] ${colors.sub}`}>
                      {categoryIcons[category]}
                    </span>
                    <span className={`text-sm font-bold ${colors.sub}`}>
                      {categoryLabels[category]}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {count} פריטים
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">
                        אומדן
                      </div>
                      <div className={`text-lg font-bold ${colors.text}`}>
                        {formatCurrency(estimated)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">
                        בפועל
                      </div>
                      <div className={`text-lg font-bold ${colors.text}`}>
                        {actual > 0 ? formatCurrency(actual) : '-'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors.dot} rounded-full`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                      {pct.toFixed(0)}% מהאומדן
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Filters and Export */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary-light text-[20px]">
            search
          </span>
          <input
            className="w-full h-10 pr-10 pl-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
            placeholder="חיפוש לפי פרויקט, שם פריט..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Category Filter */}
        <select
          className="w-full md:w-40 h-10 px-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value as CostCategory | 'all');
            setCurrentPage(1);
          }}
          aria-label="סינון לפי קטגוריה"
        >
          <option value="all">כל הקטגוריות</option>
          <option value="consultant">יועץ</option>
          <option value="supplier">ספק</option>
          <option value="contractor">קבלן</option>
          <option value="agra">אגרה</option>
        </select>

        {/* Export Button */}
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-green-600 text-white hover:bg-green-700 transition text-sm font-bold whitespace-nowrap"
          aria-label="ייצוא לאקסל"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          ייצוא
        </button>
      </div>

      {/* Per-Project Breakdown Table */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-background-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark">
              <tr>
                <th scope="col" className="px-4 py-3 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs w-8"></th>
                <th scope="col" className="px-4 py-3 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  פרויקט
                </th>
                <th scope="col" className="px-4 py-3 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  פריטים
                </th>
                <th scope="col" className="px-4 py-3 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  אומדן
                </th>
                <th scope="col" className="px-4 py-3 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  בפועל
                </th>
                <th scope="col" className="px-4 py-3 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  מצב נוכחי
                </th>
                <th scope="col" className="px-4 py-3 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  הפרש
                </th>
                <th scope="col" className="px-4 py-3 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  סטטוס
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {paginatedProjects.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-text-secondary-light dark:text-text-secondary-dark"
                  >
                    <span className="material-symbols-outlined text-[48px] mb-4 opacity-50 block">
                      receipt_long
                    </span>
                    אין פריטי עלות
                  </td>
                </tr>
              ) : (
                paginatedProjects.map((agg) => {
                  const isExpanded = expandedProjectId === agg.project.id;
                  return (
                    <ProjectRow
                      key={agg.project.id}
                      agg={agg}
                      isExpanded={isExpanded}
                      onToggleExpand={() => toggleProjectExpand(agg.project.id)}
                      onProjectClick={() => handleProjectClick(agg.project.id)}
                      onItemClick={(projectId) => handleProjectClick(projectId)}
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="block md:hidden divide-y divide-border-light dark:divide-border-dark">
          {paginatedProjects.length === 0 ? (
            <div className="p-12 text-center">
              <span className="material-symbols-outlined text-[48px] mb-4 opacity-50 block">
                receipt_long
              </span>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">
                אין פריטי עלות
              </p>
            </div>
          ) : (
            paginatedProjects.map((agg) => (
              <div
                key={agg.project.id}
                role="button"
                tabIndex={0}
                className="p-4 flex flex-col gap-3 cursor-pointer hover:bg-background-light dark:hover:bg-background-dark/50 transition-colors"
                onClick={() => handleProjectClick(agg.project.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleProjectClick(agg.project.id); } }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-primary">folder</span>
                    <div>
                      <h3 className="text-base font-black text-text-main-light dark:text-text-main-dark">
                        {agg.project.project_name}
                      </h3>
                      {agg.project.client_name && (
                        <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark">
                          {agg.project.client_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-text-secondary-light">
                    {agg.items.length} פריטים
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-text-secondary-light mb-1">אומדן</p>
                    <p className="font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(agg.totalEstimated)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary-light mb-1">בפועל</p>
                    <p className="font-bold text-orange-600 dark:text-orange-400">
                      {agg.totalActual > 0 ? formatCurrency(agg.totalActual) : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary-light mb-1">מצב נוכחי</p>
                    <p className="font-bold">{formatCurrency(agg.bestEstimate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary-light mb-1">הפרש</p>
                    <p
                      className={`font-bold ${
                        agg.variance > 0
                          ? 'text-red-600 dark:text-red-400'
                          : agg.variance < 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : ''
                      }`}
                    >
                      {agg.variance > 0 ? '+' : ''}
                      {formatCurrency(agg.variance)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {projectAggregations.length > itemsPerPage && (
        <div className="flex items-center justify-between border-t border-border-light dark:border-border-dark pt-4 mt-6">
          <p className="text-sm text-text-secondary-light">
            מציג{' '}
            {Math.min((currentPage - 1) * itemsPerPage + 1, projectAggregations.length)}-
            {Math.min(currentPage * itemsPerPage, projectAggregations.length)} מתוך{' '}
            {projectAggregations.length} פרויקטים
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border border-border-light dark:border-border-dark text-sm hover:bg-white dark:hover:bg-surface-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="עמוד קודם"
            >
              הקודם
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1 rounded border border-border-light dark:border-border-dark text-sm hover:bg-white dark:hover:bg-surface-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="עמוד הבא"
            >
              הבא
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// PROJECT ROW COMPONENT (with expandable items)
// ============================================================

interface ProjectRowProps {
  agg: ProjectAggregation;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onProjectClick: () => void;
  onItemClick: (projectId: string) => void;
}

function ProjectRow({ agg, isExpanded, onToggleExpand, onProjectClick, onItemClick }: ProjectRowProps) {
  return (
    <>
      <tr
        className="group hover:bg-background-light dark:hover:bg-background-dark/50 transition-colors cursor-pointer"
        onClick={onToggleExpand}
      >
        {/* Expand icon */}
        <td className="px-4 py-3 align-middle">
          <span
            className={`material-symbols-outlined text-[18px] text-text-secondary-light transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          >
            expand_more
          </span>
        </td>

        {/* Project Name */}
        <td className="px-4 py-4 align-middle">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">
                folder
              </span>
              <span className="text-base font-black text-text-main-light dark:text-text-main-dark group-hover:text-primary transition-colors">
                {agg.project.project_name}
              </span>
            </div>
            <div className="flex items-center gap-3 mr-7 text-xs text-text-secondary-light dark:text-text-secondary-dark">
              <span>{agg.items.length} פריטי עלות</span>
              {agg.project.client_name && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <span>{agg.project.client_name}</span>
                </>
              )}
            </div>
          </div>
        </td>

        {/* Items Count */}
        <td className="px-4 py-4 align-middle text-text-secondary-light dark:text-text-secondary-dark">
          {agg.items.length}
        </td>

        {/* Estimated */}
        <td className="px-4 py-3 align-middle font-medium text-blue-600 dark:text-blue-400">
          {formatCurrency(agg.totalEstimated)}
        </td>

        {/* Actual */}
        <td className="px-4 py-3 align-middle font-medium text-orange-600 dark:text-orange-400">
          {agg.totalActual > 0 ? formatCurrency(agg.totalActual) : '-'}
        </td>

        {/* Best Estimate */}
        <td className="px-4 py-3 align-middle font-bold">
          {formatCurrency(agg.bestEstimate)}
        </td>

        {/* Variance */}
        <td className="px-4 py-3 align-middle">
          <div className="flex flex-col">
            <span
              className={`font-bold ${
                agg.variance > 0
                  ? 'text-red-600 dark:text-red-400'
                  : agg.variance < 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-text-secondary-light'
              }`}
            >
              {agg.variance > 0 ? '+' : ''}
              {formatCurrency(agg.variance)}
            </span>
            {agg.variance !== 0 && (
              <span
                className={`text-[10px] font-semibold ${
                  agg.variance > 0
                    ? 'text-red-500'
                    : 'text-emerald-500'
                }`}
              >
                {agg.variance > 0 ? '+' : ''}
                {agg.variancePercent.toFixed(1)}%
              </span>
            )}
          </div>
        </td>

        {/* Status */}
        <td className="px-4 py-3 align-middle">
          <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
            {agg.itemsWithActual}/{agg.items.length} בפועל
          </span>
          <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{
                width: `${agg.items.length > 0 ? (agg.itemsWithActual / agg.items.length) * 100 : 0}%`,
              }}
            />
          </div>
        </td>
      </tr>

      {/* Expanded: show cost items for this project */}
      {isExpanded && (
        <>
          {agg.items.map((item) => {
            const hasActual = item.actual_amount != null && item.actual_amount > 0;
            const itemBest = hasActual ? item.actual_amount! : item.estimated_amount;
            const itemVariance = itemBest - item.estimated_amount;

            return (
              <tr
                key={item.id}
                className="bg-background-light/50 dark:bg-background-dark/30 hover:bg-background-light dark:hover:bg-background-dark/50 transition-colors cursor-pointer border-t border-border-light/50 dark:border-border-dark/50"
                onClick={(e) => {
                  e.stopPropagation();
                  onItemClick(item.project_id);
                }}
              >
                {/* Indent */}
                <td className="px-4 py-2.5 align-middle">
                  <span className="text-xs text-gray-300 dark:text-gray-600 mr-2">
                    &mdash;
                  </span>
                </td>

                {/* Name */}
                <td className="px-4 py-2.5 align-middle">
                  <div className="flex items-center gap-2">
                    <div
                      className={`size-1.5 rounded-full ${
                        item.category === 'consultant'
                          ? 'bg-purple-500'
                          : item.category === 'supplier'
                          ? 'bg-blue-500'
                          : item.category === 'agra'
                          ? 'bg-green-500'
                          : 'bg-orange-500'
                      }`}
                    />
                    <span className="text-xs font-medium text-text-main-light dark:text-text-main-dark">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      {categoryLabels[item.category]}
                    </span>
                  </div>
                </td>

                {/* Items count - empty for sub-rows */}
                <td className="px-4 py-2.5 align-middle"></td>

                {/* Estimated */}
                <td className="px-4 py-2.5 align-middle text-xs font-medium text-blue-600 dark:text-blue-400">
                  {formatCurrency(item.estimated_amount)}
                </td>

                {/* Actual */}
                <td className="px-4 py-2.5 align-middle text-xs font-medium text-orange-600 dark:text-orange-400">
                  {hasActual ? formatCurrency(item.actual_amount!) : '-'}
                </td>

                {/* Best Estimate */}
                <td className="px-4 py-2.5 align-middle text-xs font-bold">
                  {formatCurrency(itemBest)}
                </td>

                {/* Variance */}
                <td className="px-4 py-2.5 align-middle">
                  {itemVariance !== 0 ? (
                    <span
                      className={`text-xs font-bold ${
                        itemVariance > 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {itemVariance > 0 ? '+' : ''}
                      {formatCurrency(itemVariance)}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>

                {/* Status */}
                <td className="px-4 py-2.5 align-middle">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.status === 'draft'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                        : item.status === 'tender_draft' || item.status === 'tender_open'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : item.status === 'tender_winner'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        item.status === 'draft'
                          ? 'bg-amber-500'
                          : item.status === 'tender_draft' || item.status === 'tender_open'
                          ? 'bg-blue-500'
                          : item.status === 'tender_winner'
                          ? 'bg-emerald-500'
                          : 'bg-gray-500'
                      }`}
                    />
                    {item.status === 'draft'
                      ? 'אומדן'
                      : item.status === 'tender_draft'
                      ? 'טיוטה'
                      : item.status === 'tender_open'
                      ? 'מכרז'
                      : item.status === 'tender_winner'
                      ? 'זוכה'
                      : item.status}
                  </span>
                </td>
              </tr>
            );
          })}

          {/* View Project Link */}
          <tr className="bg-background-light/30 dark:bg-background-dark/20 border-t border-border-light/50 dark:border-border-dark/50">
            <td colSpan={8} className="px-4 py-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onProjectClick();
                }}
                className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
              >
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                צפה בעלויות הפרויקט
              </button>
            </td>
          </tr>
        </>
      )}
    </>
  );
}
