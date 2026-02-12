import { useState, useEffect, useMemo, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllScheduleItems } from '../../../services/paymentSchedulesService';
import { getAllCostItems } from '../../../services/costsService';
import { getProjects } from '../../../services/projectsService';
import * as ExcelJS from 'exceljs';
import type { ScheduleItem, Project } from '../../../types';
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

const formatMonth = (key: string): string => {
  const [year, month] = key.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return new Intl.DateTimeFormat('he-IL', { year: 'numeric', month: 'short' }).format(date);
};

const scheduleStatusLabels: Record<string, string> = {
  pending: 'ממתין',
  milestone_confirmed: 'אבן דרך אושרה',
  invoice_received: 'חשבונית התקבלה',
  approved: 'מאושר',
  paid: 'שולם',
};

interface EnrichedItem extends ScheduleItem {
  costItemName: string;
  projectName: string;
  projectId: string;
}

interface MonthData {
  key: string; // YYYY-MM
  planned: number;
  actual: number;
  variance: number;
  cumulative: number;
  items: EnrichedItem[];
}

export default function CashFlowTabContent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scheduleItems, setScheduleItems] = useState<EnrichedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [sItems, cItems, projs] = await Promise.all([
          getAllScheduleItems(),
          getAllCostItems(),
          getProjects(),
        ]);

        setProjects(projs);

        // Build cost item lookup: costItemId → { name, projectId }
        const costItemMap = new Map<string, { name: string; projectId: string }>();
        for (const ci of cItems) {
          costItemMap.set(ci.id, { name: ci.name, projectId: ci.project_id });
        }

        // Build project lookup
        const projectMap = new Map<string, Project>();
        for (const p of projs) {
          projectMap.set(p.id, p);
        }

        // Enrich schedule items with cost item name and project info
        const enriched: EnrichedItem[] = sItems
          .map((si) => {
            const costInfo = costItemMap.get(si.cost_item_id);
            const projectId = costInfo?.projectId || '';
            const project = projectMap.get(projectId);
            return {
              ...si,
              costItemName: costInfo?.name || 'לא ידוע',
              projectName: project?.project_name || 'פרויקט לא ידוע',
              projectId,
            };
          })
          .filter((si) => {
            // Permission filter
            if (!user) return false;
            if (canViewAllProjects(user)) return true;
            return canAccessProject(user, si.projectId);
          });

        setScheduleItems(enriched);
      } catch (error) {
        console.error('Error loading cash flow data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user]);

  // Filter by project
  const filteredItems = useMemo(() => {
    if (projectFilter === 'all') return scheduleItems;
    return scheduleItems.filter((si) => si.projectId === projectFilter);
  }, [scheduleItems, projectFilter]);

  // Get unique projects that have schedule items
  const projectsWithItems = useMemo(() => {
    const ids = new Set(scheduleItems.map((si) => si.projectId));
    return projects.filter((p) => ids.has(p.id));
  }, [scheduleItems, projects]);

  // Aggregate by month
  const monthlyData = useMemo((): MonthData[] => {
    const months = new Map<string, { planned: number; actual: number; items: EnrichedItem[] }>();

    for (const si of filteredItems) {
      const dateStr = si.status === 'paid' && si.paid_date ? si.paid_date : si.target_date;
      if (!dateStr) continue;

      const date = new Date(dateStr);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!months.has(key)) {
        months.set(key, { planned: 0, actual: 0, items: [] });
      }
      const data = months.get(key)!;
      data.planned += si.amount;
      if (si.status === 'paid') {
        data.actual += si.paid_amount || si.amount;
      }
      data.items.push(si);
    }

    const sortedKeys = Array.from(months.keys()).sort();

    let cumulative = 0;
    return sortedKeys.map((key) => {
      const data = months.get(key)!;
      cumulative += data.actual;
      return {
        key,
        planned: data.planned,
        actual: data.actual,
        variance: data.actual - data.planned,
        cumulative,
        items: data.items,
      };
    });
  }, [filteredItems]);

  // Summary
  const totalPlanned = filteredItems.reduce((s, i) => s + i.amount, 0);
  const totalPaid = filteredItems
    .filter((i) => i.status === 'paid')
    .reduce((s, i) => s + (i.paid_amount || i.amount), 0);
  const remaining = totalPlanned - totalPaid;
  const monthsWithActual = monthlyData.filter((m) => m.actual > 0).length;
  const avgMonthly = monthsWithActual > 0
    ? monthlyData.reduce((s, m) => s + m.actual, 0) / monthsWithActual
    : 0;

  // Chart
  const chartMax = Math.max(...monthlyData.map((m) => Math.max(m.planned, m.actual)), 1);

  const handleExport = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('תזרים מזומנים');
    sheet.views = [{ rightToLeft: true }];

    sheet.columns = [
      { header: 'חודש', key: 'month', width: 15 },
      { header: 'פרויקט', key: 'project', width: 25 },
      { header: 'קבלן / ספק', key: 'contractor', width: 25 },
      { header: 'סכום', key: 'amount', width: 15 },
      { header: 'סטטוס', key: 'status', width: 15 },
      { header: 'תאריך', key: 'date', width: 15 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };

    for (const month of monthlyData) {
      for (const item of month.items) {
        const dateStr = item.status === 'paid' && item.paid_date
          ? item.paid_date
          : item.target_date || '';
        sheet.addRow({
          month: formatMonth(month.key),
          project: item.projectName,
          contractor: item.costItemName,
          amount: item.status === 'paid' ? (item.paid_amount || item.amount) : item.amount,
          status: scheduleStatusLabels[item.status] || item.status,
          date: dateStr,
        });
      }
    }

    sheet.getColumn('amount').numFmt = '₪#,##0';

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `תזרים_מזומנים_כללי_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (scheduleItems.length === 0) {
    return (
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-12 text-center">
        <span className="material-symbols-outlined text-[48px] mb-4 opacity-50">trending_up</span>
        <p className="text-lg font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
          אין נתוני תזרים מזומנים
        </p>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
          צור לוחות תשלומים בטאב "עלויות" של הפרויקטים כדי לראות תזרים מזומנים
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Filters + Export */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative">
          <select
            className="w-full md:w-56 h-10 px-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary appearance-none"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            aria-label="סינון לפי פרויקט"
          >
            <option value="all">כל הפרויקטים</option>
            {projectsWithItems.map((p) => (
              <option key={p.id} value={p.id}>
                {p.project_name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors text-sm font-bold"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          יצוא ל-Excel
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-10 rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
              <span className="material-symbols-outlined text-[20px]">account_balance</span>
            </div>
            <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
              סה"כ מתוכנן
            </span>
          </div>
          <div className="text-2xl font-black text-text-main-light dark:text-text-main-dark mb-1">
            {formatCurrency(totalPlanned)}
          </div>
          <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
            {filteredItems.length} תשלומים
          </div>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-10 rounded-lg flex items-center justify-center bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
            </div>
            <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
              שולם עד היום
            </span>
          </div>
          <div className="text-2xl font-black text-green-600 dark:text-green-400 mb-1">
            {formatCurrency(totalPaid)}
          </div>
          <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
            {filteredItems.filter((i) => i.status === 'paid').length} תשלומים
          </div>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-10 rounded-lg flex items-center justify-center bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
              <span className="material-symbols-outlined text-[20px]">pending</span>
            </div>
            <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
              יתרה לתשלום
            </span>
          </div>
          <div className="text-2xl font-black text-orange-600 dark:text-orange-400 mb-1">
            {formatCurrency(remaining)}
          </div>
          <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
            {totalPlanned > 0 ? `${((remaining / totalPlanned) * 100).toFixed(0)}% נותר` : ''}
          </div>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-10 rounded-lg flex items-center justify-center bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
              <span className="material-symbols-outlined text-[20px]">bar_chart</span>
            </div>
            <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
              ממוצע חודשי
            </span>
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mb-1">
            {formatCurrency(avgMonthly)}
          </div>
          <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
            {monthsWithActual} חודשים פעילים
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
        <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary">bar_chart</span>
          <h3 className="font-bold text-text-main-light dark:text-text-main-dark">תזרים חודשי</h3>
        </div>

        <div className="p-6">
          {/* Legend */}
          <div className="flex items-center gap-6 mb-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded bg-blue-500"></div>
              <span className="text-text-secondary-light dark:text-text-secondary-dark">מתוכנן</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-3 rounded bg-emerald-500"></div>
              <span className="text-text-secondary-light dark:text-text-secondary-dark">שולם בפועל</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-red-500"></div>
              <span className="text-text-secondary-light dark:text-text-secondary-dark">מצטבר</span>
            </div>
          </div>

          <div className="relative">
            {/* Bars */}
            <div className="flex items-end gap-2 h-64">
              {monthlyData.map((month) => {
                const plannedHeight = chartMax > 0 ? (month.planned / chartMax) * 100 : 0;
                const actualHeight = chartMax > 0 ? (month.actual / chartMax) * 100 : 0;

                return (
                  <div key={month.key} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <div className="flex items-end gap-0.5 h-52 w-full justify-center">
                      <div
                        className="w-[40%] max-w-[24px] bg-blue-400/70 dark:bg-blue-500/50 rounded-t transition-all duration-300 hover:bg-blue-500"
                        style={{ height: `${Math.max(plannedHeight, 2)}%` }}
                        title={`מתוכנן: ${formatCurrency(month.planned)}`}
                      />
                      <div
                        className="w-[40%] max-w-[24px] bg-emerald-500 dark:bg-emerald-400 rounded-t transition-all duration-300 hover:bg-emerald-600"
                        style={{ height: `${Math.max(actualHeight, month.actual > 0 ? 2 : 0)}%` }}
                        title={`שולם: ${formatCurrency(month.actual)}`}
                      />
                    </div>
                    <span className="text-[10px] text-text-secondary-light dark:text-text-secondary-dark font-medium truncate w-full text-center">
                      {formatMonth(month.key)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Cumulative line */}
            {monthlyData.length > 1 &&
              (() => {
                const maxCum = Math.max(...monthlyData.map((d) => d.cumulative), 1);
                return (
                  <svg
                    className="absolute top-0 left-0 w-full h-52 pointer-events-none"
                    viewBox={`0 0 ${monthlyData.length * 100} 100`}
                    preserveAspectRatio="none"
                    role="img"
                    aria-label="קו מצטבר"
                  >
                    <polyline
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                      points={monthlyData
                        .map((m, i) => {
                          const x = i * 100 + 50;
                          const y = 100 - (m.cumulative / maxCum) * 100;
                          return `${x},${y}`;
                        })
                        .join(' ')}
                    />
                    {monthlyData.map((m, i) => {
                      const x = i * 100 + 50;
                      const y = 100 - (m.cumulative / maxCum) * 100;
                      return (
                        <circle
                          key={i}
                          cx={x}
                          cy={y}
                          r="4"
                          fill="#ef4444"
                          vectorEffect="non-scaling-stroke"
                        />
                      );
                    })}
                  </svg>
                );
              })()}
          </div>
        </div>
      </div>

      {/* Monthly Detail Table */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
        <div className="px-6 py-4 border-b border-border-light dark:border-border-dark">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-text-secondary-light dark:text-text-secondary-dark">
              table_chart
            </span>
            <h3 className="font-bold text-text-main-light dark:text-text-main-dark">פירוט חודשי</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark w-8"></th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                  חודש
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                  מתוכנן
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                  בפועל
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                  סטיה
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                  מצטבר
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {monthlyData.map((month) => (
                <Fragment key={month.key}>
                  <tr
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                    role="button"
                    tabIndex={0}
                    aria-expanded={expandedMonth === month.key}
                    onClick={() =>
                      setExpandedMonth(expandedMonth === month.key ? null : month.key)
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setExpandedMonth(expandedMonth === month.key ? null : month.key);
                      }
                    }}
                  >
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`material-symbols-outlined text-[16px] text-text-secondary-light dark:text-text-secondary-dark transition-transform ${
                          expandedMonth === month.key ? 'rotate-180' : ''
                        }`}
                      >
                        expand_more
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold">{formatMonth(month.key)}</td>
                    <td className="px-4 py-3 text-sm font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(month.planned)}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(month.actual)}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm font-bold ${
                        month.variance === 0
                          ? 'text-gray-500'
                          : month.variance > 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}
                    >
                      {month.variance > 0 ? '+' : ''}
                      {formatCurrency(month.variance)}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold">
                      {formatCurrency(month.cumulative)}
                    </td>
                  </tr>
                  {expandedMonth === month.key && (
                    <tr key={`${month.key}-detail`} className="bg-gray-50/50 dark:bg-gray-800/30">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="space-y-2">
                          {month.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-3 bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark"
                            >
                              <div className="flex-1">
                                <p className="text-sm font-bold">{item.costItemName}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/projects/${item.projectId}?tab=financial&subtab=cashflow`);
                                    }}
                                    className="text-xs text-primary hover:underline flex items-center gap-1"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">folder</span>
                                    {item.projectName}
                                  </button>
                                </div>
                                {item.description && (
                                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-4">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    item.status === 'paid'
                                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                      : item.status === 'approved'
                                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                      : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                                  }`}
                                >
                                  {scheduleStatusLabels[item.status] || item.status}
                                </span>
                                <span className="text-sm font-bold">
                                  {formatCurrency(
                                    item.status === 'paid'
                                      ? item.paid_amount || item.amount
                                      : item.amount
                                  )}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
