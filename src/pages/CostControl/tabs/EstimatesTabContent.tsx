import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllEstimates } from '../../../services/estimatesService';
import { getProjects } from '../../../services/projectsService';
import { getAllTenders } from '../../../services/tendersService';
import * as XLSX from 'xlsx';
import type { Estimate, Project, EstimateType, EstimateStatus, Tender } from '../../../types';
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

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('he-IL', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

const estimateTypeLabels: Record<EstimateType, string> = {
  planning: 'תכנון',
  execution: 'ביצוע',
};

const statusLabels: Record<EstimateStatus, string> = {
  draft: 'טיוטה',
  active: 'פעיל',
  exported_to_tender: 'יוצא למכרז',
  locked: 'נעול',
};

const statusColors: Record<EstimateStatus, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200',
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  exported_to_tender: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
  locked: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
};

interface KPICardProps {
  icon: string;
  label: string;
  value: string;
  subValue?: string;
  color: 'blue' | 'green' | 'orange' | 'purple';
}

function KPICard({ icon, label, value, subValue, color }: KPICardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
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
    </div>
  );
}

type EstimateWithProject = Estimate & { project?: Project; tender?: Tender };

export default function EstimatesTabContent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<EstimateType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<EstimateStatus | 'all'>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [allEstimates, allProjects, allTenders] = await Promise.all([
          getAllEstimates(),
          getProjects(),
          getAllTenders(),
        ]);

        // Filter estimates based on user permissions
        const accessibleEstimates = allEstimates.filter((estimate) => {
          if (!user) return false;
          if (canViewAllProjects(user)) return true;
          return canAccessProject(user, estimate.project_id);
        });

        setEstimates(accessibleEstimates);
        setProjects(allProjects);
        setTenders(allTenders);
      } catch (error) {
        console.error('Error loading estimates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Combine estimates with project and tender data
  const estimatesWithProjects: EstimateWithProject[] = useMemo(() => {
    return estimates.map((estimate) => ({
      ...estimate,
      project: projects.find((p) => p.id === estimate.project_id),
      tender: estimate.tender_id ? tenders.find((t) => t.id === estimate.tender_id) : undefined,
    }));
  }, [estimates, projects, tenders]);

  // Calculate KPIs
  const kpiData = useMemo(() => {
    const total = estimates.length;
    const planningCount = estimates.filter((e) => e.estimate_type === 'planning').length;
    const executionCount = estimates.filter((e) => e.estimate_type === 'execution').length;
    const totalValue = estimates.reduce((sum, e) => sum + e.total_amount, 0);
    const avgValue = total > 0 ? totalValue / total : 0;

    return {
      total,
      planningCount,
      executionCount,
      totalValue,
      avgValue,
    };
  }, [estimates]);

  // Filter and sort estimates
  const filteredEstimates = useMemo(() => {
    let filtered = estimatesWithProjects;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.name.toLowerCase().includes(query) ||
          e.description?.toLowerCase().includes(query) ||
          e.project?.project_name.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((e) => e.estimate_type === typeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((e) => e.status === statusFilter);
    }

    // Project filter
    if (projectFilter !== 'all') {
      filtered = filtered.filter((e) => e.project_id === projectFilter);
    }

    // Sort (default by updated_at DESC - latest on top)
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          // Sort by updated_at instead of created_at (latest first by default)
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
        case 'amount':
          comparison = a.total_amount - b.total_amount;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name, 'he');
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [estimatesWithProjects, searchQuery, typeFilter, statusFilter, projectFilter, sortBy, sortOrder]);

  // Export to Excel
  const handleExport = useCallback(() => {
    const data = filteredEstimates.map((estimate) => ({
      'שם האומדן': estimate.name,
      'פרויקט': estimate.project?.project_name || '',
      'סוג': estimateTypeLabels[estimate.estimate_type],
      'סכום כולל': estimate.total_amount,
      'סטטוס': statusLabels[estimate.status],
      'תיאור': estimate.description || '',
      'תאריך יצירה': formatDate(estimate.created_at),
      'הערות': estimate.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'אומדנים');

    ws['!dir'] = 'rtl';

    XLSX.writeFile(wb, `estimates-${new Date().toISOString().split('T')[0]}.xlsx`);
  }, [filteredEstimates]);

  // Navigate to project Financial tab
  const handleRowClick = useCallback(
    (projectId: string) => {
      navigate(`/projects/${projectId}?tab=financial`);
    },
    [navigate]
  );

  // Toggle sort
  const handleSort = (column: 'date' | 'amount' | 'name') => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
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
          icon="assessment"
          label="סה״כ אומדנים"
          value={kpiData.total.toString()}
          subValue="בכל הפרויקטים"
          color="blue"
        />
        <KPICard
          icon="architecture"
          label="תכנון"
          value={kpiData.planningCount.toString()}
          subValue={`${((kpiData.planningCount / kpiData.total) * 100 || 0).toFixed(0)}% מהאומדנים`}
          color="purple"
        />
        <KPICard
          icon="construction"
          label="ביצוע"
          value={kpiData.executionCount.toString()}
          subValue={`${((kpiData.executionCount / kpiData.total) * 100 || 0).toFixed(0)}% מהאומדנים`}
          color="orange"
        />
        <KPICard
          icon="payments"
          label="שווי כולל"
          value={formatCurrency(kpiData.totalValue)}
          subValue={`ממוצע: ${formatCurrency(kpiData.avgValue)}`}
          color="green"
        />
      </div>

      {/* Filters and Export */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary-light text-[20px]">
            search
          </span>
          <input
            className="w-full h-10 pr-10 pl-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
            placeholder="חיפוש לפי שם, תיאור או פרויקט..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Project Filter */}
        <select
          className="w-full md:w-48 h-10 px-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          aria-label="סינון לפי פרויקט"
        >
          <option value="all">כל הפרויקטים</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.project_name}
            </option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          className="w-full md:w-32 h-10 px-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as EstimateType | 'all')}
          aria-label="סינון לפי סוג"
        >
          <option value="all">כל הסוגים</option>
          <option value="planning">תכנון</option>
          <option value="execution">ביצוע</option>
        </select>

        {/* Status Filter */}
        <select
          className="w-full md:w-32 h-10 px-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as EstimateStatus | 'all')}
          aria-label="סינון לפי סטטוס"
        >
          <option value="all">כל הסטטוסים</option>
          <option value="draft">טיוטה</option>
          <option value="active">פעיל</option>
          <option value="exported_to_tender">יוצא למכרז</option>
          <option value="locked">נעול</option>
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

      {/* Estimates Table */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-background-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark">
              <tr>
                <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    שם האומדן
                    {sortBy === 'name' && (
                      <span className="material-symbols-outlined text-[16px]">
                        {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  פרויקט
                </th>
                <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  סוג
                </th>
                <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  <button
                    onClick={() => handleSort('amount')}
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    סכום כולל
                    {sortBy === 'amount' && (
                      <span className="material-symbols-outlined text-[16px]">
                        {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  סטטוס
                </th>
                <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  מכרז
                </th>
                <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  <button
                    onClick={() => handleSort('date')}
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    עדכון אחרון
                    {sortBy === 'date' && (
                      <span className="material-symbols-outlined text-[16px]">
                        {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                    )}
                  </button>
                </th>
                <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {filteredEstimates.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-text-secondary-light dark:text-text-secondary-dark"
                  >
                    <span className="material-symbols-outlined text-[48px] mb-4 opacity-50 block">assessment</span>
                    אין אומדנים
                  </td>
                </tr>
              ) : (
                filteredEstimates.map((estimate) => (
                  <tr
                    key={estimate.id}
                    className="group hover:bg-background-light dark:hover:bg-background-dark/50 transition-colors cursor-pointer"
                    onClick={() => handleRowClick(estimate.project_id)}
                  >
                    <td className="px-6 py-4 align-middle">
                      <div className="font-bold text-text-main-light dark:text-text-main-dark">
                        {estimate.name}
                      </div>
                      {estimate.description && (
                        <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                          {estimate.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <span className="text-sm">{estimate.project?.project_name || 'לא ידוע'}</span>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {estimateTypeLabels[estimate.estimate_type]}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-middle font-bold text-primary">
                      {formatCurrency(estimate.total_amount)}
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${statusColors[estimate.status]}`}
                      >
                        {estimate.status === 'locked' && (
                          <span className="material-symbols-outlined text-[14px] ml-1">lock</span>
                        )}
                        {statusLabels[estimate.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      {estimate.tender ? (
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/projects/${estimate.project_id}?tab=tenders`);
                            }}
                            className="text-sm font-medium text-primary hover:underline text-right"
                          >
                            {estimate.tender.tender_name}
                          </button>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold w-fit ${
                              estimate.tender.status === 'WinnerSelected'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                                : estimate.tender.status === 'Open'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                                : estimate.tender.status === 'Draft'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                            }`}
                          >
                            {estimate.tender.status === 'WinnerSelected' && '🏆 זוכה נבחר'}
                            {estimate.tender.status === 'Open' && '📋 פתוח'}
                            {estimate.tender.status === 'Draft' && '✏️ טיוטה'}
                            {estimate.tender.status === 'Canceled' && '❌ בוטל'}
                            {estimate.tender.is_estimate_outdated && (
                              <span className="mr-1" title="האומדן השתנה מאז הייצוא">⚠️</span>
                            )}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 align-middle text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {formatDate(estimate.updated_at)}
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(estimate.project_id);
                        }}
                        className="flex items-center gap-1 text-primary hover:text-primary-hover font-bold text-sm transition-colors"
                        aria-label={`צפה באומדן ${estimate.name}`}
                      >
                        צפה
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
          {filteredEstimates.length === 0 ? (
            <div className="p-12 text-center">
              <span className="material-symbols-outlined text-[48px] mb-4 opacity-50 block">assessment</span>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">אין אומדנים</p>
            </div>
          ) : (
            filteredEstimates.map((estimate) => (
              <div
                key={estimate.id}
                className="p-4 flex flex-col gap-3 cursor-pointer hover:bg-background-light dark:hover:bg-background-dark/50 transition-colors"
                onClick={() => handleRowClick(estimate.project_id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-sm text-text-main-light dark:text-text-main-dark mb-1">
                      {estimate.name}
                    </h3>
                    <p className="text-xs text-text-secondary-light">{estimate.project?.project_name}</p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[estimate.status]}`}
                  >
                    {statusLabels[estimate.status]}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {estimateTypeLabels[estimate.estimate_type]}
                  </span>
                  <span className="font-bold text-primary">{formatCurrency(estimate.total_amount)}</span>
                </div>

                <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  {formatDate(estimate.created_at)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Results count */}
      {filteredEstimates.length > 0 && (
        <div className="mt-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
          מציג {filteredEstimates.length} אומדנים
        </div>
      )}
    </div>
  );
}
