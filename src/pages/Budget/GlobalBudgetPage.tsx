import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllBudgets, saveBudgets } from '../../data/budgetStorage';
import { getProjects } from '../../data/storage';
import { seedBudgets } from '../../data/budgetData';
import type { Budget, Project } from '../../types';

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
  return `${Math.abs(variance).toFixed(1)}%${sign}`;
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

export default function GlobalBudgetPage() {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    let loadedBudgets = getAllBudgets();
    
    // Seed if empty
    if (loadedBudgets.length === 0) {
      loadedBudgets = seedBudgets;
      saveBudgets(loadedBudgets);
    }
    
    setBudgets(loadedBudgets);
    setProjects(getProjects());
  };

  const projectsWithBudget = useMemo(() => {
    return projects
      .map((project) => {
        const budget = budgets.find((b) => b.project_id === project.id);
        return budget ? { project, budget } : null;
      })
      .filter((item): item is { project: Project; budget: Budget } => item !== null);
  }, [projects, budgets]);

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

    return filtered;
  }, [projectsWithBudget, searchQuery, statusFilter]);

  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProjects.slice(start, start + itemsPerPage);
  }, [filteredProjects, currentPage]);

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  return (
    <div className="flex-1 px-4 lg:px-10 py-6 max-w-[1400px] mx-auto w-full pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
          תקציב פרויקטים - סקירה גלובלית
        </h1>
        <button className="hidden md:flex items-center justify-center h-10 px-4 rounded-lg bg-primary text-white hover:bg-primary-hover transition text-sm font-bold">
          <span className="material-symbols-outlined me-2 text-[18px]">download</span>
          ייצוא לאקסל
        </button>
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
            className="w-full md:w-48 h-10 pr-10 pl-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary appearance-none"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">כל הסטטוסים</option>
            <option value="On Track">בביצוע</option>
            <option value="Deviation">חריגה</option>
            <option value="At Risk">בסיכון</option>
            <option value="Completed">הסתיים</option>
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
                  תקציב מתוכנן
                </th>
                <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  תקציב בפועל
                </th>
                <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  חריגה
                </th>
                <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  הערות
                </th>
                <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {paginatedProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-secondary-light dark:text-text-secondary-dark">
                    אין פרויקטים
                  </td>
                </tr>
              ) : (
                paginatedProjects.map((item) => (
                  <tr
                    key={item.project.id}
                    className="group hover:bg-background-light dark:hover:bg-background-dark/50 transition-colors"
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
                            #{item.project.id.replace('project-', '').replace('project', '')}
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
                      <span className={`font-bold ${getVarianceColor(item.budget.variance || 0)}`}>
                        {formatVariance(item.budget.variance || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-middle text-text-secondary-light dark:text-text-secondary-dark max-w-[200px] truncate">
                      {item.budget.notes || '-'}
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <button
                        onClick={() => navigate(`/projects/${item.project.id}`)}
                        className="flex items-center gap-1 text-primary hover:text-primary-hover font-bold text-sm transition-colors"
                      >
                        פתיחת פרויקט
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                      </button>
                    </td>
                  </tr>
                ))
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
            paginatedProjects.map((item) => (
              <div key={item.project.id} className="p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                      {getProjectInitials(item.project.project_name)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-text-main-light dark:text-text-main-dark">
                        {item.project.project_name}
                      </h3>
                      <p className="text-xs text-text-secondary-light">
                        #{item.project.id.replace('project-', '').replace('project', '')}
                      </p>
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
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-text-secondary-light mb-1">תקציב מתוכנן</p>
                    <p className="font-bold">{formatCurrency(item.budget.planned_budget)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary-light mb-1">תקציב בפועל</p>
                    <p className="font-bold">{formatCurrency(item.budget.actual_budget)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-text-secondary-light mb-1">חריגה</p>
                    <p className={`font-bold ${getVarianceColor(item.budget.variance || 0)}`}>
                      {formatVariance(item.budget.variance || 0)}
                    </p>
                  </div>
                </div>
                {item.budget.notes && (
                  <div className="text-xs text-text-secondary-light">{item.budget.notes}</div>
                )}
                <button
                  onClick={() => navigate(`/projects/${item.project.id}`)}
                  className="w-full mt-2 py-2 px-4 rounded-lg bg-primary text-white hover:bg-primary-hover font-bold text-sm transition-colors"
                >
                  פתיחת פרויקט
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {filteredProjects.length > 0 && (
        <div className="flex items-center justify-between border-t border-border-light dark:border-border-dark pt-4 mt-6">
          <p className="text-sm text-text-secondary-light">
            מציג {Math.min((currentPage - 1) * itemsPerPage + 1, filteredProjects.length)}-
            {Math.min(currentPage * itemsPerPage, filteredProjects.length)} מתוך{' '}
            {filteredProjects.length} פרויקטים
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border border-border-light dark:border-border-dark text-sm hover:bg-white dark:hover:bg-surface-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              הקודם
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1 rounded border border-border-light dark:border-border-dark text-sm hover:bg-white dark:hover:bg-surface-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              הבא
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
