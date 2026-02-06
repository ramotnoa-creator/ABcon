import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllBudgetItems } from '../../../services/budgetItemsService';
import { getProjects } from '../../../services/projectsService';
import { getAllBudgetCategories } from '../../../services/budgetCategoriesService';
import { getAllBudgetChapters } from '../../../services/budgetChaptersService';
import * as ExcelJS from 'exceljs';
import type { BudgetItem, Project, BudgetCategory, BudgetChapter } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';
import { canAccessProject, canViewAllProjects } from '../../../utils/permissions';
import VarianceCell from '../../../components/Budget/VarianceCell';

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
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

type BudgetItemWithDetails = BudgetItem & {
  project?: Project;
  category?: BudgetCategory;
  chapter?: BudgetChapter;
};

export default function BudgetTabContent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [chapters, setChapters] = useState<BudgetChapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [varianceOnlyFilter, setVarianceOnlyFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [allItems, allProjects, allCategories, allChapters] = await Promise.all([
          getAllBudgetItems(),
          getProjects(),
          getAllBudgetCategories(),
          getAllBudgetChapters(),
        ]);

        // Filter budget items based on user permissions
        const accessibleItems = allItems.filter((item) => {
          if (!user) return false;
          if (canViewAllProjects(user)) return true;
          return canAccessProject(user, item.project_id);
        });

        setBudgetItems(accessibleItems);
        setProjects(allProjects);
        setCategories(allCategories);
        setChapters(allChapters);
      } catch (error) {
        console.error('Error loading budget data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Combine budget items with related data
  const budgetItemsWithDetails: BudgetItemWithDetails[] = useMemo(() => {
    return budgetItems.map((item) => ({
      ...item,
      project: projects.find((p) => p.id === item.project_id),
      chapter: chapters.find((c) => c.id === item.chapter_id),
      category: categories.find((cat) =>
        chapters.find((ch) => ch.id === item.chapter_id)?.category_id === cat.id
      ),
    }));
  }, [budgetItems, projects, chapters, categories]);

  // Calculate KPIs
  const kpiData = useMemo(() => {
    const totalBudget = budgetItems.reduce((sum, item) => sum + item.total_with_vat, 0);
    const totalPaid = budgetItems.reduce((sum, item) => sum + item.paid_amount, 0);
    const remaining = totalBudget - totalPaid;
    const spentPercentage = totalBudget > 0 ? (totalPaid / totalBudget) * 100 : 0;

    // Calculate items with estimates and variance
    const itemsWithEstimates = budgetItems.filter((item) => item.estimate_amount && item.estimate_amount > 0);
    const totalEstimate = itemsWithEstimates.reduce((sum, item) => sum + (item.estimate_amount || 0), 0);
    const totalVariance = itemsWithEstimates.reduce((sum, item) => sum + (item.variance_amount || 0), 0);

    return {
      totalBudget,
      totalPaid,
      remaining,
      spentPercentage,
      itemsCount: budgetItems.length,
      itemsWithEstimates: itemsWithEstimates.length,
      totalEstimate,
      totalVariance,
    };
  }, [budgetItems]);

  // Filter budget items
  const filteredBudgetItems = useMemo(() => {
    let filtered = budgetItemsWithDetails;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.description.toLowerCase().includes(query) ||
          item.code?.toLowerCase().includes(query) ||
          item.project?.project_name.toLowerCase().includes(query) ||
          item.category?.name.toLowerCase().includes(query) ||
          item.chapter?.name.toLowerCase().includes(query)
      );
    }

    // Project filter
    if (projectFilter !== 'all') {
      filtered = filtered.filter((item) => item.project_id === projectFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((item) => item.category?.id === categoryFilter);
    }

    // Variance only filter
    if (varianceOnlyFilter) {
      filtered = filtered.filter((item) => item.estimate_amount && item.estimate_amount > 0);
    }

    return filtered;
  }, [budgetItemsWithDetails, searchQuery, projectFilter, categoryFilter, varianceOnlyFilter]);

  // Pagination
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBudgetItems.slice(start, start + itemsPerPage);
  }, [filteredBudgetItems, currentPage]);

  const totalPages = Math.ceil(filteredBudgetItems.length / itemsPerPage);

  // Export to Excel with conditional formatting
  const handleExport = useCallback(async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('תקציב');

    // RTL direction
    sheet.views = [{ rightToLeft: true }];

    // Define columns with headers
    sheet.columns = [
      { header: 'פרויקט', key: 'project', width: 20 },
      { header: 'קטגוריה', key: 'category', width: 15 },
      { header: 'פרק', key: 'chapter', width: 15 },
      { header: 'מקור', key: 'source', width: 12 },
      { header: 'קוד', key: 'code', width: 10 },
      { header: 'תיאור', key: 'description', width: 30 },
      { header: 'חובה/אופציונלי', key: 'priority', width: 15 },
      { header: 'אומדן', key: 'estimate', width: 15 },
      { header: 'תקציב', key: 'budget', width: 15 },
      { header: 'שולם', key: 'paid', width: 15 },
      { header: 'יתרה', key: 'balance', width: 15 },
      { header: 'חריגה ₪', key: 'variance_amount', width: 15 },
      { header: 'חריגה %', key: 'variance_percent', width: 12 },
      { header: 'סטטוס', key: 'status', width: 12 },
    ];

    // Add data rows
    filteredBudgetItems.forEach(item => {
      const hasEstimate = item.estimate_amount && item.estimate_amount > 0;

      sheet.addRow({
        project: item.project?.project_name || '',
        category: item.category?.name || '',
        chapter: item.chapter?.name || '',
        code: item.code || '',
        description: item.description,
        estimate: hasEstimate ? item.estimate_amount : '-',
        budget: item.total_with_vat,
        paid: item.paid_amount || 0,
        balance: item.total_with_vat - (item.paid_amount || 0),
        variance_amount: hasEstimate ? item.variance_amount : '-',
        variance_percent: hasEstimate ? `${item.variance_percent?.toFixed(1)}%` : '-',
        status: item.status,
      });
    });

    // Apply conditional formatting to variance columns (column 10 = variance_amount)
    sheet.getColumn(10).eachCell((cell, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      const item = filteredBudgetItems[rowNumber - 2];
      const hasEstimate = item.estimate_amount && item.estimate_amount > 0;

      if (!hasEstimate) {
        // Gray for no estimate
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE5E7EB' } // gray-200
        };
        cell.font = { color: { argb: 'FF9CA3AF' } }; // gray-400
      } else if ((item.variance_amount || 0) < 0) {
        // Green for savings
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD1FAE5' } // green-100
        };
        cell.font = { color: { argb: 'FF059669' }, bold: true }; // green-600
      } else if ((item.variance_amount || 0) > 0) {
        // Red for overrun
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFEE2E2' } // red-100
        };
        cell.font = { color: { argb: 'FFDC2626' }, bold: true }; // red-600
      }
    });

    // Apply same formatting to variance percent column (column 11)
    sheet.getColumn(11).eachCell((cell, rowNumber) => {
      if (rowNumber === 1) return;

      const item = filteredBudgetItems[rowNumber - 2];
      const hasEstimate = item.estimate_amount && item.estimate_amount > 0;

      if (!hasEstimate) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
        cell.font = { color: { argb: 'FF9CA3AF' } };
      } else if ((item.variance_amount || 0) < 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
        cell.font = { color: { argb: 'FF059669' }, bold: true };
      } else if ((item.variance_amount || 0) > 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        cell.font = { color: { argb: 'FFDC2626' }, bold: true };
      }
    });

    // Style header row
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF3F4F6' } // gray-100
    };

    // Export file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-variance-${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredBudgetItems]);

  // Navigate to project budget tab
  const handleRowClick = useCallback(
    (projectId: string) => {
      navigate(`/projects/${projectId}?tab=budget`);
    },
    [navigate]
  );

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
          icon="payments"
          label="תקציב כולל"
          value={formatCurrency(kpiData.totalBudget)}
          subValue={`${kpiData.itemsCount} פריטים`}
          color="blue"
        />
        <KPICard
          icon="account_balance"
          label="שולם"
          value={formatCurrency(kpiData.totalPaid)}
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
          icon="assessment"
          label="פריטים עם אומדן"
          value={kpiData.itemsWithEstimates.toString()}
          subValue={`חריגה כוללת: ${formatCurrency(kpiData.totalVariance)}`}
          color={kpiData.totalVariance < 0 ? 'green' : kpiData.totalVariance > 0 ? 'red' : 'blue'}
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
            placeholder="חיפוש לפי תיאור, קוד, פרויקט..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Project Filter */}
        <select
          className="w-full md:w-48 h-10 px-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
          value={projectFilter}
          onChange={(e) => {
            setProjectFilter(e.target.value);
            setCurrentPage(1);
          }}
          aria-label="סינון לפי פרויקט"
        >
          <option value="all">כל הפרויקטים</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.project_name}
            </option>
          ))}
        </select>

        {/* Category Filter */}
        <select
          className="w-full md:w-40 h-10 px-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setCurrentPage(1);
          }}
          aria-label="סינון לפי קטגוריה"
        >
          <option value="all">כל הקטגוריות</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        {/* Variance Only Filter */}
        <label className="flex items-center gap-2 h-10 px-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm cursor-pointer hover:border-primary transition-colors">
          <input
            type="checkbox"
            checked={varianceOnlyFilter}
            onChange={(e) => {
              setVarianceOnlyFilter(e.target.checked);
              setCurrentPage(1);
            }}
            className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="whitespace-nowrap">רק עם חריגה</span>
        </label>

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

      {/* Budget Table */}
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
                  קטגוריה
                </th>
                <th className="px-4 py-3 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  פרק
                </th>
                <th className="px-4 py-3 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  מקור
                </th>
                <th className="px-4 py-3 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  תיאור
                </th>
                <th className="px-4 py-3 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  אומדן
                </th>
                <th className="px-4 py-3 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  תקציב
                </th>
                <th className="px-4 py-3 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  שולם
                </th>
                <th className="px-4 py-3 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  חריגה ₪
                </th>
                <th className="px-4 py-3 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  חריגה %
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-12 text-center text-text-secondary-light dark:text-text-secondary-dark"
                  >
                    <span className="material-symbols-outlined text-[48px] mb-4 opacity-50 block">payments</span>
                    אין פריטי תקציב
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const hasEstimate = item.estimate_amount !== null && item.estimate_amount !== undefined && item.estimate_amount > 0;
                  return (
                    <tr
                      key={item.id}
                      className="group hover:bg-background-light dark:hover:bg-background-dark/50 transition-colors cursor-pointer"
                      onClick={() => handleRowClick(item.project_id)}
                    >
                      <td className="px-4 py-3 align-middle text-sm">
                        {item.project?.project_name || 'לא ידוע'}
                      </td>
                      <td className="px-4 py-3 align-middle text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        {item.category?.name || '-'}
                      </td>
                      <td className="px-4 py-3 align-middle text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        {item.chapter?.name || '-'}
                      </td>
                      <td className="px-4 py-3 align-middle text-xs">
                        {item.tender_id ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/projects/${item.project_id}?tab=tenders`);
                            }}
                            className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            <span className="material-symbols-outlined text-[14px]">gavel</span>
                            מכרז
                          </button>
                        ) : item.source_estimate_id ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/projects/${item.project_id}?tab=planning-estimate`);
                            }}
                            className="flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:underline"
                          >
                            <span className="material-symbols-outlined text-[14px]">assessment</span>
                            אומדן
                          </button>
                        ) : (
                          <span className="text-text-secondary-light dark:text-text-secondary-dark">הזנה ידנית</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="font-medium text-text-main-light dark:text-text-main-dark">
                          {item.code && <span className="text-xs text-text-secondary-light mr-2">{item.code}</span>}
                          {item.description}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle font-medium text-blue-600 dark:text-blue-400">
                        {hasEstimate ? formatCurrency(item.estimate_amount!) : '-'}
                      </td>
                      <td className="px-4 py-3 align-middle font-bold">
                        {formatCurrency(item.total_with_vat)}
                      </td>
                      <td className="px-4 py-3 align-middle font-medium text-orange-600 dark:text-orange-400">
                        {formatCurrency(item.paid_amount)}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <VarianceCell
                          estimateAmount={item.estimate_amount}
                          varianceAmount={item.variance_amount}
                          variancePercent={item.variance_percent}
                        />
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <VarianceCell
                          estimateAmount={item.estimate_amount}
                          varianceAmount={item.variance_amount}
                          variancePercent={item.variance_percent}
                          showPercent
                        />
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
              <span className="material-symbols-outlined text-[48px] mb-4 opacity-50 block">payments</span>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">אין פריטי תקציב</p>
            </div>
          ) : (
            paginatedItems.map((item) => {
              const hasEstimate = item.estimate_amount !== null && item.estimate_amount !== undefined && item.estimate_amount > 0;
              return (
                <div
                  key={item.id}
                  className="p-4 flex flex-col gap-3 cursor-pointer hover:bg-background-light dark:hover:bg-background-dark/50 transition-colors"
                  onClick={() => handleRowClick(item.project_id)}
                >
                  <div>
                    <h3 className="font-bold text-sm text-text-main-light dark:text-text-main-dark mb-1">
                      {item.description}
                    </h3>
                    <p className="text-xs text-text-secondary-light">{item.project?.project_name}</p>
                    <div className="text-xs mt-1">
                      {item.tender_id ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/projects/${item.project_id}?tab=tenders`);
                          }}
                          className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <span className="material-symbols-outlined text-[12px]">gavel</span>
                          מקור: מכרז
                        </button>
                      ) : item.source_estimate_id ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/projects/${item.project_id}?tab=planning-estimate`);
                          }}
                          className="flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:underline"
                        >
                          <span className="material-symbols-outlined text-[12px]">assessment</span>
                          מקור: אומדן
                        </button>
                      ) : (
                        <span className="text-text-secondary-light dark:text-text-secondary-dark">מקור: הזנה ידנית</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-text-secondary-light mb-1">אומדן</p>
                      <p className="font-bold text-blue-600 dark:text-blue-400">
                        {hasEstimate ? formatCurrency(item.estimate_amount!) : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary-light mb-1">תקציב</p>
                      <p className="font-bold">{formatCurrency(item.total_with_vat)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary-light mb-1">חריגה ₪</p>
                      <p className="font-bold">
                        <VarianceCell
                          estimateAmount={item.estimate_amount}
                          varianceAmount={item.variance_amount}
                          variancePercent={item.variance_percent}
                        />
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary-light mb-1">חריגה %</p>
                      <p className="font-bold">
                        <VarianceCell
                          estimateAmount={item.estimate_amount}
                          varianceAmount={item.variance_amount}
                          variancePercent={item.variance_percent}
                          showPercent
                        />
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
      {filteredBudgetItems.length > 0 && (
        <div className="flex items-center justify-between border-t border-border-light dark:border-border-dark pt-4 mt-6">
          <p className="text-sm text-text-secondary-light">
            מציג {Math.min((currentPage - 1) * itemsPerPage + 1, filteredBudgetItems.length)}-
            {Math.min(currentPage * itemsPerPage, filteredBudgetItems.length)} מתוך {filteredBudgetItems.length} פריטים
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
