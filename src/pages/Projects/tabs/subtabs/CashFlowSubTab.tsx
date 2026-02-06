import { useState, useEffect, useMemo } from 'react';
import { getScheduleItemsByProject } from '../../../../services/paymentSchedulesService';
import { getCostItems } from '../../../../services/costsService';
import * as ExcelJS from 'exceljs';
import type { ScheduleItem, CostItem, Project } from '../../../../types';

interface CashFlowSubTabProps {
  project: Project;
}

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

interface MonthData {
  key: string; // YYYY-MM
  planned: number;
  actual: number;
  variance: number;
  cumulative: number;
  items: (ScheduleItem & { costItemName: string })[];
}

export default function CashFlowSubTab({ project }: CashFlowSubTabProps) {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [costItems, setCostItems] = useState<CostItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [sItems, cItems] = await Promise.all([
          getScheduleItemsByProject(project.id),
          getCostItems(project.id),
        ]);
        setScheduleItems(sItems);
        setCostItems(cItems);
      } catch (error) {
        console.error('Error loading cash flow data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [project.id]);

  const getCostItemName = (costItemId: string): string => {
    return costItems.find(c => c.id === costItemId)?.name || 'לא ידוע';
  };

  // Aggregate by month
  const monthlyData = useMemo((): MonthData[] => {
    const months = new Map<string, { planned: number; actual: number; items: (ScheduleItem & { costItemName: string })[] }>();

    for (const si of scheduleItems) {
      // Use paid_date for actuals, target_date for planned
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
      data.items.push({ ...si, costItemName: getCostItemName(si.cost_item_id) });
    }

    // Sort by month key
    const sortedKeys = Array.from(months.keys()).sort();

    let cumulative = 0;
    return sortedKeys.map(key => {
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
  }, [scheduleItems, costItems]);

  // Summary cards
  const totalPlanned = scheduleItems.reduce((s, i) => s + i.amount, 0);
  const totalPaid = scheduleItems.filter(i => i.status === 'paid').reduce((s, i) => s + (i.paid_amount || i.amount), 0);
  const remaining = totalPlanned - totalPaid;
  const avgMonthly = monthlyData.length > 0
    ? monthlyData.reduce((s, m) => s + m.actual, 0) / monthlyData.filter(m => m.actual > 0).length || 0
    : 0;

  // Chart max for scaling bars
  const chartMax = Math.max(
    ...monthlyData.map(m => Math.max(m.planned, m.actual)),
    1
  );

  const handleExport = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('תזרים מזומנים');

    sheet.views = [{ rightToLeft: true }];

    // Header
    sheet.columns = [
      { header: 'חודש', key: 'month', width: 15 },
      { header: 'קבלן / ספק', key: 'contractor', width: 25 },
      { header: 'סכום', key: 'amount', width: 15 },
      { header: 'סטטוס', key: 'status', width: 15 },
      { header: 'תאריך', key: 'date', width: 15 },
    ];

    const statusLabels: Record<string, string> = {
      pending: 'ממתין',
      milestone_confirmed: 'אבן דרך אושרה',
      invoice_received: 'חשבונית התקבלה',
      approved: 'מאושר',
      paid: 'שולם',
    };

    // Style header
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, size: 12 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };

    for (const month of monthlyData) {
      for (const item of month.items) {
        const dateStr = item.status === 'paid' && item.paid_date
          ? item.paid_date
          : item.target_date || '';
        sheet.addRow({
          month: formatMonth(month.key),
          contractor: item.costItemName,
          amount: item.status === 'paid' ? (item.paid_amount || item.amount) : item.amount,
          status: statusLabels[item.status] || item.status,
          date: dateStr,
        });
      }
    }

    // Format amount column as currency
    sheet.getColumn('amount').numFmt = '₪#,##0';

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `תזרים_מזומנים_${project.project_name}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 text-text-secondary-light dark:text-text-secondary-dark">
        <div className="size-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        <p>טוען תזרים...</p>
      </div>
    );
  }

  if (scheduleItems.length === 0) {
    return (
      <div className="bg-white dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark p-12 text-center">
        <span className="material-symbols-outlined text-[64px] text-text-secondary-light dark:text-text-secondary-dark mb-3 opacity-30">
          trending_up
        </span>
        <p className="text-lg font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
          אין נתוני תזרים
        </p>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
          צור לוחות תשלומים בטאב "עלויות" כדי לראות תזרים מזומנים
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg p-4">
          <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">סה"כ מתוכנן</div>
          <div className="text-2xl font-bold">{formatCurrency(totalPlanned)}</div>
          <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
            {scheduleItems.length} תשלומים
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="text-sm text-green-700 dark:text-green-300 mb-1">שולם עד היום</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalPaid)}</div>
          <div className="text-xs text-green-600 dark:text-green-400 mt-1">
            {scheduleItems.filter(i => i.status === 'paid').length} תשלומים
          </div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="text-sm text-orange-700 dark:text-orange-300 mb-1">יתרה לתשלום</div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(remaining)}</div>
          <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
            {totalPlanned > 0 ? `${((remaining / totalPlanned) * 100).toFixed(0)}% נותר` : ''}
          </div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="text-sm text-blue-700 dark:text-blue-300 mb-1">ממוצע חודשי</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(avgMonthly)}</div>
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            {monthlyData.filter(m => m.actual > 0).length} חודשים פעילים
          </div>
        </div>
      </div>

      {/* Chart + Export */}
      <div className="bg-white dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark overflow-hidden">
        <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">bar_chart</span>
            <h3 className="font-bold text-text-main-light dark:text-text-main-dark">תזרים חודשי</h3>
          </div>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            ייצא ל-Excel
          </button>
        </div>

        {/* Bar Chart - Pure CSS */}
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
                      {/* Planned bar */}
                      <div
                        className="w-[40%] max-w-[24px] bg-blue-400/70 dark:bg-blue-500/50 rounded-t transition-all duration-300 hover:bg-blue-500"
                        style={{ height: `${Math.max(plannedHeight, 2)}%` }}
                        title={`מתוכנן: ${formatCurrency(month.planned)}`}
                      />
                      {/* Actual bar */}
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

            {/* Cumulative line overlay using SVG */}
            {monthlyData.length > 1 && (
              <svg
                className="absolute top-0 left-0 w-full h-52 pointer-events-none"
                viewBox={`0 0 ${monthlyData.length * 100} 100`}
                preserveAspectRatio="none"
              >
                <polyline
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  points={monthlyData.map((m, i) => {
                    const maxCum = Math.max(...monthlyData.map(d => d.cumulative), 1);
                    const x = i * 100 + 50;
                    const y = 100 - (m.cumulative / maxCum) * 100;
                    return `${x},${y}`;
                  }).join(' ')}
                />
                {monthlyData.map((m, i) => {
                  const maxCum = Math.max(...monthlyData.map(d => d.cumulative), 1);
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
            )}
          </div>
        </div>
      </div>

      {/* Month Detail Table */}
      <div className="bg-white dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark overflow-hidden">
        <div className="px-6 py-4 border-b border-border-light dark:border-border-dark">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-text-secondary-light dark:text-text-secondary-dark">table_chart</span>
            <h3 className="font-bold text-text-main-light dark:text-text-main-dark">פירוט חודשי</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark w-8"></th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">חודש</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">מתוכנן</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">בפועל</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">סטיה</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">מצטבר</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {monthlyData.map((month) => (
                <>
                  <tr
                    key={month.key}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                    onClick={() => setExpandedMonth(expandedMonth === month.key ? null : month.key)}
                  >
                    <td className="px-4 py-3 text-center">
                      <span className={`material-symbols-outlined text-[16px] text-text-secondary-light dark:text-text-secondary-dark transition-transform ${expandedMonth === month.key ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold">{formatMonth(month.key)}</td>
                    <td className="px-4 py-3 text-sm font-bold text-blue-600 dark:text-blue-400">{formatCurrency(month.planned)}</td>
                    <td className="px-4 py-3 text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(month.actual)}</td>
                    <td className={`px-4 py-3 text-sm font-bold ${
                      month.variance === 0
                        ? 'text-gray-500'
                        : month.variance > 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {month.variance > 0 ? '+' : ''}{formatCurrency(month.variance)}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold">{formatCurrency(month.cumulative)}</td>
                  </tr>
                  {expandedMonth === month.key && (
                    <tr key={`${month.key}-detail`} className="bg-gray-50/50 dark:bg-gray-800/30">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="space-y-2">
                          {month.items.map((item) => {
                            const statusLabels: Record<string, string> = {
                              pending: 'ממתין',
                              milestone_confirmed: 'אבן דרך אושרה',
                              invoice_received: 'חשבונית',
                              approved: 'מאושר',
                              paid: 'שולם',
                            };
                            return (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-3 bg-white dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark"
                              >
                                <div className="flex-1">
                                  <p className="text-sm font-semibold">{item.costItemName}</p>
                                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">{item.description}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    item.status === 'paid'
                                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                      : item.status === 'approved'
                                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                      : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                                  }`}>
                                    {statusLabels[item.status] || item.status}
                                  </span>
                                  <span className="text-sm font-bold">{formatCurrency(item.status === 'paid' ? (item.paid_amount || item.amount) : item.amount)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
