import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllSchedules, getAllScheduleItems } from '../../../services/paymentSchedulesService';
import { getAllCostItems } from '../../../services/costsService';
import { getProjects } from '../../../services/projectsService';
import * as ExcelJS from 'exceljs';
import type { PaymentSchedule, ScheduleItem, CostItem, Project, ScheduleItemStatus } from '../../../types';
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

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  return new Intl.DateTimeFormat('he-IL', { year: 'numeric', month: 'short', day: 'numeric' }).format(
    new Date(dateStr)
  );
};

const statusLabels: Record<ScheduleItemStatus, string> = {
  pending: 'ממתין',
  milestone_confirmed: 'אבן דרך אושרה',
  invoice_received: 'חשבונית התקבלה',
  approved: 'מאושר לתשלום',
  paid: 'שולם',
};

const statusColors: Record<ScheduleItemStatus, string> = {
  pending: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  milestone_confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  invoice_received: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  approved: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
};

const statusDotColors: Record<ScheduleItemStatus, string> = {
  pending: 'bg-gray-400',
  milestone_confirmed: 'bg-blue-500',
  invoice_received: 'bg-amber-500',
  approved: 'bg-purple-500',
  paid: 'bg-emerald-500',
};

interface KPICardProps {
  icon: string;
  label: string;
  value: string;
  subValue?: string;
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  progress?: number;
}

function KPICard({ icon, label, value, subValue, color, progress }: KPICardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  };

  const progressColors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-4 flex flex-col">
      <div className="flex items-center gap-3 mb-3">
        <div className={`size-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
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
              className={`h-full ${progressColors[color]} rounded-full transition-all`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

type EnrichedScheduleItem = ScheduleItem & {
  project?: Project;
  costItem?: CostItem;
  schedule?: PaymentSchedule;
};

export default function PaymentsTabContent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [costItems, setCostItems] = useState<CostItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ScheduleItemStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [allScheduleItems, allSchedules, allCostItems, allProjects] = await Promise.all([
          getAllScheduleItems(),
          getAllSchedules(),
          getAllCostItems(),
          getProjects(),
        ]);

        // Filter by user permissions
        const accessibleProjectIds = new Set(
          allProjects
            .filter((p) => {
              if (!user) return false;
              if (canViewAllProjects(user)) return true;
              return canAccessProject(user, p.id);
            })
            .map((p) => p.id)
        );

        setScheduleItems(allScheduleItems.filter((si) => accessibleProjectIds.has(si.project_id)));
        setSchedules(allSchedules.filter((s) => accessibleProjectIds.has(s.project_id)));
        setCostItems(allCostItems.filter((ci) => accessibleProjectIds.has(ci.project_id)));
        setProjects(allProjects);
      } catch (error) {
        console.error('Error loading payments data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Enrich schedule items with related data
  const enrichedItems: EnrichedScheduleItem[] = useMemo(() => {
    return scheduleItems.map((si) => {
      const schedule = schedules.find((s) => s.id === si.schedule_id);
      const costItem = costItems.find((ci) => ci.id === si.cost_item_id);
      const project = projects.find((p) => p.id === si.project_id);
      return { ...si, schedule, costItem, project };
    });
  }, [scheduleItems, schedules, costItems, projects]);

  // Filter
  const filteredItems = useMemo(() => {
    let filtered = enrichedItems;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.description.toLowerCase().includes(query) ||
          item.project?.project_name.toLowerCase().includes(query) ||
          item.costItem?.name.toLowerCase().includes(query) ||
          item.milestone_name?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    // Sort: pending/actionable first, then by target_date
    const statusOrder: Record<ScheduleItemStatus, number> = {
      approved: 0,
      invoice_received: 1,
      milestone_confirmed: 2,
      pending: 3,
      paid: 4,
    };

    filtered.sort((a, b) => {
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      if (a.target_date && b.target_date) return new Date(a.target_date).getTime() - new Date(b.target_date).getTime();
      if (a.target_date) return -1;
      if (b.target_date) return 1;
      return 0;
    });

    return filtered;
  }, [enrichedItems, searchQuery, statusFilter]);

  // KPIs
  const kpiData = useMemo(() => {
    const totalScheduled = scheduleItems.reduce((s, i) => s + i.amount, 0);
    const paidItems = scheduleItems.filter((i) => i.status === 'paid');
    const totalPaid = paidItems.reduce((s, i) => s + (i.paid_amount || i.amount), 0);
    const approvedItems = scheduleItems.filter((i) => i.status === 'approved');
    const totalApproved = approvedItems.reduce((s, i) => s + i.amount, 0);
    const pendingItems = scheduleItems.filter(
      (i) => i.status === 'pending' || i.status === 'milestone_confirmed' || i.status === 'invoice_received'
    );
    const totalPending = pendingItems.reduce((s, i) => s + i.amount, 0);
    const paidPct = totalScheduled > 0 ? (totalPaid / totalScheduled) * 100 : 0;

    // Overdue: pending/confirmed items with target_date in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdueItems = scheduleItems.filter(
      (i) =>
        i.status !== 'paid' &&
        i.status !== 'approved' &&
        i.target_date &&
        new Date(i.target_date) < today
    );

    return {
      totalScheduled,
      totalPaid,
      totalApproved,
      totalPending,
      paidPct,
      totalItems: scheduleItems.length,
      paidCount: paidItems.length,
      approvedCount: approvedItems.length,
      pendingCount: pendingItems.length,
      overdueCount: overdueItems.length,
    };
  }, [scheduleItems]);

  // Status breakdown for visual pipeline
  const statusBreakdown = useMemo(() => {
    const statuses: ScheduleItemStatus[] = ['pending', 'milestone_confirmed', 'invoice_received', 'approved', 'paid'];
    return statuses.map((status) => {
      const items = scheduleItems.filter((i) => i.status === status);
      return {
        status,
        count: items.length,
        amount: items.reduce((s, i) => s + (status === 'paid' ? (i.paid_amount || i.amount) : i.amount), 0),
      };
    });
  }, [scheduleItems]);

  // Pagination
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  // Export
  const handleExport = useCallback(async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('תשלומים');
    sheet.views = [{ rightToLeft: true }];

    sheet.columns = [
      { header: 'פרויקט', key: 'project', width: 20 },
      { header: 'פריט עלות', key: 'costItem', width: 20 },
      { header: 'תיאור תשלום', key: 'description', width: 25 },
      { header: 'סכום', key: 'amount', width: 15 },
      { header: '%', key: 'percentage', width: 8 },
      { header: 'אבן דרך', key: 'milestone', width: 15 },
      { header: 'תאריך יעד', key: 'targetDate', width: 12 },
      { header: 'סטטוס', key: 'status', width: 15 },
      { header: 'שולם', key: 'paidAmount', width: 15 },
      { header: 'תאריך תשלום', key: 'paidDate', width: 12 },
    ];

    filteredItems.forEach((item) => {
      sheet.addRow({
        project: item.project?.project_name || '',
        costItem: item.costItem?.name || '',
        description: item.description,
        amount: item.amount,
        percentage: `${item.percentage.toFixed(1)}%`,
        milestone: item.milestone_name || 'ידני',
        targetDate: item.target_date ? formatDate(item.target_date) : '-',
        status: statusLabels[item.status],
        paidAmount: item.paid_amount || '-',
        paidDate: item.paid_date ? formatDate(item.paid_date) : '-',
      });
    });

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredItems]);

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
          icon="account_balance"
          label="סה״כ מתוזמן"
          value={formatCurrency(kpiData.totalScheduled)}
          subValue={`${kpiData.totalItems} תשלומים`}
          color="blue"
        />
        <KPICard
          icon="check_circle"
          label="שולם"
          value={formatCurrency(kpiData.totalPaid)}
          subValue={`${kpiData.paidCount} תשלומים (${kpiData.paidPct.toFixed(0)}%)`}
          color="green"
          progress={kpiData.paidPct}
        />
        <KPICard
          icon="thumb_up"
          label="מאושר לתשלום"
          value={formatCurrency(kpiData.totalApproved)}
          subValue={`${kpiData.approvedCount} תשלומים ממתינים להעברה`}
          color="purple"
        />
        <KPICard
          icon="hourglass_top"
          label="בהמתנה"
          value={formatCurrency(kpiData.totalPending)}
          subValue={
            kpiData.overdueCount > 0
              ? `${kpiData.pendingCount} תשלומים, ${kpiData.overdueCount} באיחור!`
              : `${kpiData.pendingCount} תשלומים`
          }
          color={kpiData.overdueCount > 0 ? 'red' : 'orange'}
        />
      </div>

      {/* Payment Pipeline */}
      {scheduleItems.length > 0 && (
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-4 mb-6">
          <div className="text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider mb-3">
            צינור תשלומים
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {statusBreakdown.map(({ status, count, amount }) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(statusFilter === status ? 'all' : status);
                  setCurrentPage(1);
                }}
                className={`flex-1 min-w-0 sm:min-w-[120px] rounded-lg p-3 border transition-all text-right ${
                  statusFilter === status
                    ? 'border-primary ring-1 ring-primary bg-primary/5'
                    : 'border-border-light dark:border-border-dark hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`size-2 rounded-full ${statusDotColors[status]}`} />
                  <span className="text-[10px] font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase">
                    {statusLabels[status]}
                  </span>
                </div>
                <div className="text-lg font-black text-text-main-light dark:text-text-main-dark">
                  {count}
                </div>
                <div className="text-[10px] text-text-secondary-light dark:text-text-secondary-dark">
                  {formatCurrency(amount)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters and Export */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary-light text-[20px]">
            search
          </span>
          <input
            className="w-full h-10 pr-10 pl-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
            placeholder="חיפוש לפי פרויקט, פריט עלות, תיאור..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <select
          className="w-full md:w-44 h-10 px-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as ScheduleItemStatus | 'all');
            setCurrentPage(1);
          }}
          aria-label="סינון לפי סטטוס"
        >
          <option value="all">כל הסטטוסים</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-green-600 text-white hover:bg-green-700 transition text-sm font-bold whitespace-nowrap"
          aria-label="ייצוא לאקסל"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          ייצוא
        </button>
      </div>

      {/* Payments Table */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-background-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark">
              <tr>
                <th className="px-4 py-3 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  פרויקט
                </th>
                <th className="px-4 py-3 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  פריט עלות
                </th>
                <th className="px-4 py-3 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  תיאור תשלום
                </th>
                <th className="px-4 py-3 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  סכום
                </th>
                <th className="px-4 py-3 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  אבן דרך
                </th>
                <th className="px-4 py-3 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  תאריך יעד
                </th>
                <th className="px-4 py-3 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  סטטוס
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-text-secondary-light dark:text-text-secondary-dark"
                  >
                    <span className="material-symbols-outlined text-[48px] mb-4 opacity-50 block">
                      calendar_month
                    </span>
                    אין תשלומים מתוזמנים
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const isOverdue =
                    item.status !== 'paid' &&
                    item.status !== 'approved' &&
                    item.target_date &&
                    new Date(item.target_date) < new Date();

                  return (
                    <tr
                      key={item.id}
                      className={`group hover:bg-background-light dark:hover:bg-background-dark/50 transition-colors cursor-pointer ${
                        isOverdue ? 'bg-red-50/30 dark:bg-red-950/10' : ''
                      }`}
                      onClick={() => navigate(`/projects/${item.project_id}?tab=costs`)}
                    >
                      {/* Project */}
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-primary">
                            folder
                          </span>
                          <span className="text-sm font-black text-text-main-light dark:text-text-main-dark group-hover:text-primary transition-colors">
                            {item.project?.project_name || 'לא ידוע'}
                          </span>
                        </div>
                      </td>

                      {/* Cost Item */}
                      <td className="px-4 py-3 align-middle">
                        <span className="text-xs font-medium text-text-main-light dark:text-text-main-dark">
                          {item.costItem?.name || '-'}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="px-4 py-3 align-middle">
                        <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                          {item.description}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 align-middle">
                        <div className="flex flex-col">
                          <span className="font-bold text-text-main-light dark:text-text-main-dark">
                            {formatCurrency(item.status === 'paid' ? (item.paid_amount || item.amount) : item.amount)}
                          </span>
                          <span className="text-[10px] text-text-secondary-light">
                            {item.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>

                      {/* Milestone */}
                      <td className="px-4 py-3 align-middle">
                        {item.milestone_name ? (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">flag</span>
                            {item.milestone_name}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">ידני</span>
                        )}
                      </td>

                      {/* Target Date */}
                      <td className="px-4 py-3 align-middle">
                        <span
                          className={`text-xs ${
                            isOverdue
                              ? 'text-red-600 dark:text-red-400 font-bold'
                              : 'text-text-secondary-light dark:text-text-secondary-dark'
                          }`}
                        >
                          {formatDate(item.status === 'paid' ? item.paid_date : item.target_date)}
                          {isOverdue && (
                            <span className="material-symbols-outlined text-[12px] mr-1 align-middle">
                              warning
                            </span>
                          )}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 align-middle">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${statusColors[item.status]}`}
                        >
                          <span className={`size-1.5 rounded-full ${statusDotColors[item.status]}`} />
                          {statusLabels[item.status]}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="block md:hidden divide-y divide-border-light dark:divide-border-dark">
          {paginatedItems.length === 0 ? (
            <div className="p-12 text-center">
              <span className="material-symbols-outlined text-[48px] mb-4 opacity-50 block">
                calendar_month
              </span>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">
                אין תשלומים מתוזמנים
              </p>
            </div>
          ) : (
            paginatedItems.map((item) => {
              const isOverdue =
                item.status !== 'paid' &&
                item.status !== 'approved' &&
                item.target_date &&
                new Date(item.target_date) < new Date();

              return (
                <div
                  key={item.id}
                  className={`p-4 flex flex-col gap-3 cursor-pointer hover:bg-background-light dark:hover:bg-background-dark/50 transition-colors ${
                    isOverdue ? 'bg-red-50/30 dark:bg-red-950/10' : ''
                  }`}
                  onClick={() => navigate(`/projects/${item.project_id}?tab=costs`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-primary">folder</span>
                      <span className="font-black text-sm text-text-main-light dark:text-text-main-dark">
                        {item.project?.project_name || 'לא ידוע'}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[item.status]}`}
                    >
                      <span className={`size-1.5 rounded-full ${statusDotColors[item.status]}`} />
                      {statusLabels[item.status]}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-text-main-light dark:text-text-main-dark">
                      {item.costItem?.name || '-'}
                    </p>
                    <p className="text-xs text-text-secondary-light">{item.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-text-secondary-light mb-1">סכום</p>
                      <p className="font-bold">
                        {formatCurrency(item.status === 'paid' ? (item.paid_amount || item.amount) : item.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary-light mb-1">תאריך</p>
                      <p
                        className={`text-xs font-medium ${
                          isOverdue ? 'text-red-600 font-bold' : ''
                        }`}
                      >
                        {formatDate(item.status === 'paid' ? item.paid_date : item.target_date)}
                        {isOverdue && ' !'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pagination */}
      {filteredItems.length > itemsPerPage && (
        <div className="flex items-center justify-between border-t border-border-light dark:border-border-dark pt-4 mt-6">
          <p className="text-sm text-text-secondary-light">
            מציג {Math.min((currentPage - 1) * itemsPerPage + 1, filteredItems.length)}-
            {Math.min(currentPage * itemsPerPage, filteredItems.length)} מתוך {filteredItems.length}{' '}
            תשלומים
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
