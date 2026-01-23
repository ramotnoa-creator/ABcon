import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllBudgets } from '../../services/budgetService';
import { getProjects } from '../../services/projectsService';
import { getProjectBudgetSummary } from '../../services/budgetItemsService';
import { saveBudgets } from '../../data/budgetStorage';
import { seedBudgets } from '../../data/budgetData';
import { getLastMonthPaidAmount, getNextMonthPlannedPayments } from '../../data/budgetPaymentsQueries';
import AddBudgetItemForm from '../../components/Budget/AddBudgetItemForm';
import * as XLSX from 'xlsx';
import type { Budget, Project } from '../../types';
import type { User } from '../../types/auth';
import { useAuth } from '../../contexts/AuthContext';
import { canAccessProject, canViewAllProjects } from '../../utils/permissions';

const loadInitialData = async (user: User | null): Promise<{ budgets: Budget[]; projects: Project[] }> => {
  let loadedBudgets = await getAllBudgets();

  // Seed if empty
  if (loadedBudgets.length === 0) {
    loadedBudgets = seedBudgets;
    saveBudgets(loadedBudgets);
  }

  const projects = await getProjects();

  // Filter budgets based on user permissions
  const accessibleBudgets = loadedBudgets.filter((budget) => {
    if (!user) return false;
    if (canViewAllProjects(user)) return true;
    return canAccessProject(user, budget.project_id);
  });

  return {
    budgets: accessibleBudgets,
    projects,
  };
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatVariance = (variance: number): string => {
  const sign = variance >= 0 ? '+' : '';
  return `${sign}${variance.toFixed(1)}%`;
};

const getVarianceColor = (variance: number): string => {
  if (variance > 10) return 'text-red-600 dark:text-red-400';
  if (variance > 5) return 'text-orange-600 dark:text-orange-400';
  if (variance < -5) return 'text-green-600 dark:text-green-400';
  return 'text-gray-600 dark:text-gray-400';
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'On Track': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
    'Deviation': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
    'At Risk': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
    'Completed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  };
  return colors[status] || colors['On Track'];
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'On Track': 'בביצוע',
    'Deviation': 'חריגה',
    'At Risk': 'בסיכון',
    'Completed': 'הסתיים',
  };
  return labels[status] || status;
};

const getProjectInitials = (name: string): string => {
  const words = name.split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

interface KPICardProps {
  icon: string;
  label: string;
  value: string;
  subValue?: string;
  color: 'blue' | 'green' | 'orange' | 'red';
  progress?: number;
}

function KPICard({ icon, label, value, subValue, color, progress }: KPICardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  };

  const progressColors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
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

export default function GlobalBudgetPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [varianceFilter, setVarianceFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [lastMonthPaid, setLastMonthPaid] = useState({ totalAmount: 0, paymentCount: 0 });
  const [nextMonthPlanned, setNextMonthPlanned] = useState({ totalAmount: 0, paymentCount: 0 });
  const itemsPerPage = 10;

  // Load data on mount and when refreshKey changes
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await loadInitialData(user);
        setBudgets(data.budgets);
        setProjects(data.projects);
      } catch (error) {
        console.error('Error loading budget data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [refreshKey, user]);

  // Payment summary data - refreshKey triggers re-fetch after adding items
  useEffect(() => {
    const loadPaymentSummaries = async () => {
      try {
        const [lastMonth, nextMonth] = await Promise.all([
          getLastMonthPaidAmount(undefined, user),
          getNextMonthPlannedPayments(undefined, user),
        ]);
        setLastMonthPaid(lastMonth);
        setNextMonthPlanned(nextMonth);
      } catch (error) {
        console.error('Error loading payment summaries:', error);
      }
    };
    loadPaymentSummaries();
  }, [refreshKey, user]);

  // Handle item added
  const handleItemAdded = useCallback(() => {
    setShowAddItemModal(false);
    setRefreshKey((k) => k + 1);
  }, []);


  const projectsWithBudget = useMemo(() => {
    return projects
      .map((project) => {
        const budget = budgets.find((b) => b.project_id === project.id);
        // Get detailed budget summary from budget items
        const budgetSummary = getProjectBudgetSummary(project.id);
        return budget ? { project, budget, budgetSummary } : null;
      })
      .filter(
        (item): item is { project: Project; budget: Budget; budgetSummary: ReturnType<typeof getProjectBudgetSummary> } =>
          item !== null
      );
  }, [projects, budgets]);

  // Calculate KPI values from budget data
  const kpiData = useMemo(() => {
    const totalBudget = budgets.reduce((sum, b) => sum + b.planned_budget, 0);
    const totalActual = budgets.reduce((sum, b) => sum + b.actual_budget, 0);
    const remaining = totalBudget - totalActual;
    const overBudgetCount = budgets.filter((b) => (b.variance || 0) > 5).length;
    const spentPercentage = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

    return {
      totalBudget,
      totalActual,
      remaining,
      projectCount: budgets.length,
      overBudgetCount,
      spentPercentage,
    };
  }, [budgets]);

  const filteredProjects = useMemo(() => {
    let filtered = projectsWithBudget;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.project.project_name.toLowerCase().includes(query) ||
          item.project.id.toLowerCase().includes(query) ||
          item.project.client_name.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((item) => item.budget.status === statusFilter);
    }

    // Variance filter
    if (varianceFilter !== 'all') {
      const threshold = parseInt(varianceFilter);
      filtered = filtered.filter((item) => (item.budget.variance || 0) > threshold);
    }

    return filtered;
  }, [projectsWithBudget, searchQuery, statusFilter, varianceFilter]);

  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProjects.slice(start, start + itemsPerPage);
  }, [filteredProjects, currentPage]);

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  // Export to Excel
  const handleExport = useCallback(() => {
    const data = filteredProjects.map((item) => ({
      'שם הפרויקט': item.project.project_name,
      'מזהה': item.project.id,
      'לקוח': item.project.client_name,
      'סטטוס': getStatusLabel(item.budget.status),
      'תקציב מתוכנן': item.budget.planned_budget,
      'תקציב בפועל': item.budget.actual_budget,
      'חריגה %': item.budget.variance || 0,
      'הערות': item.budget.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'תקציב פרויקטים');

    // Set RTL for Hebrew
    ws['!dir'] = 'rtl';

    XLSX.writeFile(wb, `budget-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  }, [filteredProjects]);

  // Navigate to project budget tab
  const handleProjectClick = useCallback(
    (projectId: string) => {
      navigate(`/projects/${projectId}?tab=budget`);
    },
    [navigate]
  );

  if (isLoading) {
    return (
      <div className="flex-1 px-4 lg:px-10 py-6 max-w-[1400px] mx-auto w-full">
        <div className="flex items-center justify-center py-12">
          <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 lg:px-10 py-6 max-w-[1400px] mx-auto w-full pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
          תקציב פרויקטים - סקירה גלובלית
        </h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddItemModal(true)}
            className="flex items-center justify-center h-10 px-4 rounded-lg bg-green-600 text-white hover:bg-green-700 transition text-sm font-bold"
          >
            <span className="material-symbols-outlined me-2 text-[18px]">add</span>
            הוסף פריט תקציב
          </button>
          <button
            onClick={handleExport}
            aria-label="ייצוא לאקסל"
            className="flex items-center justify-center h-10 px-4 rounded-lg bg-primary text-white hover:bg-primary-hover transition text-sm font-bold"
          >
            <span className="material-symbols-outlined me-2 text-[18px]">download</span>
            ייצוא לאקסל
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          icon="account_balance"
          label="תקציב כולל"
          value={formatCurrency(kpiData.totalBudget)}
          subValue={`${budgets.length} פרויקטים`}
          color="blue"
        />
        <KPICard
          icon="payments"
          label="שולם"
          value={formatCurrency(kpiData.totalActual)}
          subValue={`${kpiData.spentPercentage.toFixed(0)}% מהתקציב`}
          color="orange"
          progress={kpiData.spentPercentage}
        />
        <KPICard
          icon="savings"
          label="יתרה"
          value={formatCurrency(kpiData.remaining)}
          subValue={kpiData.remaining >= 0 ? 'במסגרת התקציב' : 'חריגה מהתקציב'}
          color={kpiData.remaining >= 0 ? 'green' : 'red'}
        />
        <KPICard
          icon="warning"
          label="פרויקטים בחריגה"
          value={kpiData.overBudgetCount.toString()}
          subValue={`מתוך ${budgets.length} פרויקטים`}
          color={kpiData.overBudgetCount > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Payment Timeline KPI Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <KPICard
          icon="history"
          label="שולם בחודש האחרון"
          value={formatCurrency(lastMonthPaid.totalAmount)}
          subValue={`${lastMonthPaid.paymentCount} תשלומים`}
          color="green"
        />
        <KPICard
          icon="schedule"
          label="מתוכנן לחודש הבא"
          value={formatCurrency(nextMonthPlanned.totalAmount)}
          subValue={`${nextMonthPlanned.paymentCount} תשלומים`}
          color="orange"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary-light text-[20px]">
            search
          </span>
          <input
            className="w-full h-10 pr-10 pl-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
            placeholder="חיפוש פרויקט לפי שם או מזהה..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="relative">
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary-light text-[18px]">
            filter_list
          </span>
          <select
            className="w-full md:w-40 h-10 pr-10 pl-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary appearance-none"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="סינון לפי סטטוס"
          >
            <option value="all">כל הסטטוסים</option>
            <option value="On Track">בביצוע</option>
            <option value="Deviation">חריגה</option>
            <option value="At Risk">בסיכון</option>
            <option value="Completed">הסתיים</option>
          </select>
        </div>
        <div className="relative">
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary-light text-[18px]">
            trending_up
          </span>
          <select
            className="w-full md:w-40 h-10 pr-10 pl-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary appearance-none"
            value={varianceFilter}
            onChange={(e) => {
              setVarianceFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="סינון לפי חריגה"
          >
            <option value="all">כל החריגות</option>
            <option value="0">חריגה {'>'} 0%</option>
            <option value="5">חריגה {'>'} 5%</option>
            <option value="10">חריגה {'>'} 10%</option>
            <option value="20">חריגה {'>'} 20%</option>
          </select>
        </div>
      </div>

      {/* Budget Table */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-background-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark">
              <tr>
                <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  שם הפרויקט
                </th>
                <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  סטטוס
                </th>
                <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  תקציב
                </th>
                <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  בפועל
                </th>
                <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs w-40">
                  התקדמות
                </th>
                <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  חריגה
                </th>
                <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {paginatedProjects.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-text-secondary-light dark:text-text-secondary-dark"
                  >
                    אין פרויקטים
                  </td>
                </tr>
              ) : (
                paginatedProjects.map((item) => {
                  const progressPercent =
                    item.budget.planned_budget > 0
                      ? (item.budget.actual_budget / item.budget.planned_budget) * 100
                      : 0;
                  const isOverBudget = progressPercent > 100;

                  return (
                    <tr
                      key={item.project.id}
                      className="group hover:bg-background-light dark:hover:bg-background-dark/50 transition-colors cursor-pointer"
                      onClick={() => handleProjectClick(item.project.id)}
                    >
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                            {getProjectInitials(item.project.project_name)}
                          </div>
                          <div>
                            <div className="font-bold text-text-main-light dark:text-text-main-dark">
                              {item.project.project_name}
                            </div>
                            <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                              {item.project.client_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(
                            item.budget.status
                          )}`}
                        >
                          {getStatusLabel(item.budget.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-middle font-medium">
                        {formatCurrency(item.budget.planned_budget)}
                      </td>
                      <td className="px-6 py-4 align-middle font-medium">
                        {formatCurrency(item.budget.actual_budget)}
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isOverBudget
                                  ? 'bg-red-500'
                                  : progressPercent > 80
                                    ? 'bg-orange-500'
                                    : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(progressPercent, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark w-10 text-left">
                            {progressPercent.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <span className={`font-bold ${getVarianceColor(item.budget.variance || 0)}`}>
                          {formatVariance(item.budget.variance || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProjectClick(item.project.id);
                          }}
                          className="flex items-center gap-1 text-primary hover:text-primary-hover font-bold text-sm transition-colors"
                          aria-label={`פתח תקציב ${item.project.project_name}`}
                        >
                          צפה בתקציב
                          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        </button>
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
          {paginatedProjects.length === 0 ? (
            <div className="p-4 text-center text-text-secondary-light dark:text-text-secondary-dark">
              אין פרויקטים
            </div>
          ) : (
            paginatedProjects.map((item) => {
              const progressPercent =
                item.budget.planned_budget > 0
                  ? (item.budget.actual_budget / item.budget.planned_budget) * 100
                  : 0;
              const isOverBudget = progressPercent > 100;

              return (
                <div
                  key={item.project.id}
                  className="p-4 flex flex-col gap-3"
                  onClick={() => handleProjectClick(item.project.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                        {getProjectInitials(item.project.project_name)}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-text-main-light dark:text-text-main-dark">
                          {item.project.project_name}
                        </h3>
                        <p className="text-xs text-text-secondary-light">{item.project.client_name}</p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(
                        item.budget.status
                      )}`}
                    >
                      {getStatusLabel(item.budget.status)}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full">
                    <div className="flex justify-between text-xs text-text-secondary-light mb-1">
                      <span>התקדמות</span>
                      <span>{progressPercent.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOverBudget
                            ? 'bg-red-500'
                            : progressPercent > 80
                              ? 'bg-orange-500'
                              : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(progressPercent, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-text-secondary-light mb-1">תקציב</p>
                      <p className="font-bold">{formatCurrency(item.budget.planned_budget)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary-light mb-1">בפועל</p>
                      <p className="font-bold">{formatCurrency(item.budget.actual_budget)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary-light mb-1">חריגה</p>
                      <p className={`font-bold ${getVarianceColor(item.budget.variance || 0)}`}>
                        {formatVariance(item.budget.variance || 0)}
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
      {filteredProjects.length > 0 && (
        <div className="flex items-center justify-between border-t border-border-light dark:border-border-dark pt-4 mt-6">
          <p className="text-sm text-text-secondary-light">
            מציג {Math.min((currentPage - 1) * itemsPerPage + 1, filteredProjects.length)}-
            {Math.min(currentPage * itemsPerPage, filteredProjects.length)} מתוך {filteredProjects.length}{' '}
            פרויקטים
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

      {/* Add Budget Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border-light dark:border-border-dark flex items-center justify-between">
              <h2 className="text-xl font-black">הוסף פריט תקציב חדש</h2>
              <button
                onClick={() => setShowAddItemModal(false)}
                className="size-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-6">
              <AddBudgetItemForm
                onSuccess={handleItemAdded}
                onCancel={() => setShowAddItemModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
