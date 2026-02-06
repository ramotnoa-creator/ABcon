import { useState, useMemo, useCallback, useEffect } from 'react';
import { getBudgetCategories } from '../../../../services/budgetCategoriesService';
import { getBudgetChapters } from '../../../../services/budgetChaptersService';
import { getBudgetItems } from '../../../../services/budgetItemsService';
import { getAllBudgetPayments } from '../../../../services/budgetPaymentsService';
import { saveBudgetCategories } from '../../../../data/budgetCategoriesStorage';
import { saveBudgetChapters } from '../../../../data/budgetChaptersStorage';
import { saveBudgetItems } from '../../../../data/budgetItemsStorage';
import { saveBudgetPayments } from '../../../../data/budgetPaymentsStorage';
import { seedBudgetCategories, seedBudgetChapters, seedBudgetItems, seedBudgetPayments } from '../../../../data/budgetData';
import AddBudgetItemForm from '../../../../components/Budget/AddBudgetItemForm';
import VarianceCell from '../../../../components/Budget/VarianceCell';
import type { Project, BudgetCategory, BudgetChapter, BudgetItem, BudgetPayment, BudgetItemStatus } from '../../../../types';

interface BudgetSubTabProps {
  project: Project;
}

type ViewMode = 'tree' | 'table' | 'cashflow';

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatCompactCurrency = (amount: number): string => {
  // Handle invalid numbers
  if (!amount || isNaN(amount) || !isFinite(amount)) {
    return '₪0';
  }

  if (amount >= 1000000) {
    return `₪${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `₪${(amount / 1000).toFixed(0)}K`;
  }
  return formatCurrency(amount);
};

const getStatusColor = (status: BudgetItemStatus): string => {
  const colors: Record<BudgetItemStatus, string> = {
    'pending': 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    'tender': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    'contracted': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    'in-progress': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    'completed': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  };
  return colors[status];
};

const getStatusLabel = (status: BudgetItemStatus): string => {
  const labels: Record<BudgetItemStatus, string> = {
    'pending': 'ממתין',
    'tender': 'במכרז',
    'contracted': 'בהתקשרות',
    'in-progress': 'בביצוע',
    'completed': 'הושלם',
  };
  return labels[status];
};

const getCategoryColor = (type: string): { bg: string; text: string; border: string } => {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    'consultants': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    'suppliers': { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
    'contractors': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  };
  return colors[type] || colors['contractors'];
};

// ============================================================
// SUMMARY CARDS
// ============================================================
const SummaryCards = ({ items }: {
  chapters: BudgetChapter[];
  items: BudgetItem[];
}) => {
  const summary = useMemo(() => {
    // Calculate everything from items, not chapters - with safety checks
    const totalBudget = items.reduce((sum, i) => {
      const val = Number(i.total_with_vat) || 0;
      return sum + (isFinite(val) ? val : 0);
    }, 0);

    const totalContract = items.reduce((sum, i) => {
      const val = Number(i.total_with_vat) || 0;
      return sum + (isFinite(val) ? val : 0);
    }, 0);

    const totalPaid = items.reduce((sum, i) => {
      const val = Number(i.paid_amount) || 0;
      return sum + (isFinite(val) ? val : 0);
    }, 0);

    const totalWithVat = totalBudget;
    const remainingToPay = totalWithVat - totalPaid;
    const completedItems = items.filter(i => i.status === 'completed').length;
    const inProgressItems = items.filter(i => i.status === 'in-progress').length;

    return {
      totalBudget: isFinite(totalBudget) ? totalBudget : 0,
      totalContract: isFinite(totalContract) ? totalContract : 0,
      totalPaid: isFinite(totalPaid) ? totalPaid : 0,
      totalWithVat: isFinite(totalWithVat) ? totalWithVat : 0,
      remainingToPay: isFinite(remainingToPay) ? remainingToPay : 0,
      completedItems,
      inProgressItems,
      totalItems: items.length,
      progress: totalWithVat > 0 ? Math.round((totalPaid / totalWithVat) * 100) : 0,
    };
  }, [items]);

  const stats = [
    {
      value: formatCompactCurrency(summary.totalBudget),
      label: 'תקציב כולל',
      icon: 'account_balance',
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      value: formatCompactCurrency(summary.totalContract),
      label: 'חוזים',
      icon: 'description',
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      value: formatCompactCurrency(summary.totalPaid),
      label: 'שולם',
      icon: 'payments',
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      value: formatCompactCurrency(summary.remainingToPay),
      label: 'יתרה לתשלום',
      icon: 'pending',
      color: 'text-orange-600',
      bg: 'bg-orange-50'
    },
    {
      value: `${summary.progress}%`,
      label: 'התקדמות תשלום',
      icon: 'trending_up',
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-3 mb-6">
      {stats.map((stat, i) => (
        <div key={i} className={`${stat.bg} rounded-xl p-4 border border-gray-200 dark:border-border-dark`}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`material-symbols-outlined text-[18px] ${stat.color}`}>{stat.icon}</span>
          </div>
          <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">{stat.label}</div>
        </div>
      ))}
    </div>
  );
};

// ============================================================
// TREE VIEW
// ============================================================
const TreeView = ({
  categories,
  chapters,
  items
}: {
  categories: BudgetCategory[];
  chapters: BudgetChapter[];
  items: BudgetItem[];
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set([categories[0]?.id || '']));
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  const toggleCategory = (id: string) => {
    const newSet = new Set(expandedCategories);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedCategories(newSet);
  };

  const toggleChapter = (id: string) => {
    const newSet = new Set(expandedChapters);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedChapters(newSet);
  };

  const getCategoryTotals = (categoryId: string) => {
    const categoryChapters = chapters.filter(c => c.category_id === categoryId);
    const chapterIds = categoryChapters.map(c => c.id);
    const categoryItems = items.filter(i => chapterIds.includes(i.chapter_id));

    return {
      budget: categoryItems.reduce((sum, i) => sum + (Number(i.total_with_vat) || 0), 0),
      contract: categoryItems.reduce((sum, i) => sum + (Number(i.total_with_vat) || 0), 0),
      paid: categoryItems.reduce((sum, i) => sum + (Number(i.paid_amount) || 0), 0),
      total: categoryItems.reduce((sum, i) => sum + (Number(i.total_with_vat) || 0), 0),
    };
  };

  const getChapterTotals = (chapterId: string) => {
    const chapterItems = items.filter(i => i.chapter_id === chapterId);
    return {
      paid: chapterItems.reduce((sum, i) => sum + (Number(i.paid_amount) || 0), 0),
      total: chapterItems.reduce((sum, i) => sum + (Number(i.total_with_vat) || 0), 0),
      count: chapterItems.length,
    };
  };

  return (
    <div className="space-y-3">
      {categories.map((category) => {
        const isExpanded = expandedCategories.has(category.id);
        const colors = getCategoryColor(category.type);
        const totals = getCategoryTotals(category.id);
        const categoryChapters = chapters.filter(c => c.category_id === category.id);

        return (
          <div key={category.id} className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-border-dark overflow-hidden">
            {/* Category Header */}
            <button
              className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-background-dark ${colors.bg} w-full text-right`}
              onClick={() => toggleCategory(category.id)}
              aria-expanded={isExpanded}
              aria-label={`קטגוריה ${category.name}, ${isExpanded ? 'פתוח' : 'סגור'}`}
            >
              <div className={`w-10 h-10 rounded-xl bg-white dark:bg-surface-dark ${colors.border} border-2 flex items-center justify-center shadow-sm`}>
                <span className={`material-symbols-outlined ${colors.text} text-[20px]`} aria-hidden="true">{category.icon}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 dark:text-white">{category.name}</h3>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {categoryChapters.length} פרקים
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6 text-left">
                <div>
                  <div className="text-xs text-gray-500">תקציב</div>
                  <div className="font-bold text-gray-800 dark:text-white">{formatCompactCurrency(totals.budget)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">חוזים</div>
                  <div className="font-bold text-gray-800 dark:text-white">{formatCompactCurrency(totals.contract)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">שולם</div>
                  <div className="font-bold text-green-600">{formatCompactCurrency(totals.paid)}</div>
                </div>
              </div>
              <span className={`material-symbols-outlined text-gray-400 transition-transform ${isExpanded ? '' : '-rotate-90'}`} aria-hidden="true">
                expand_more
              </span>
            </button>

            {/* Chapters */}
            {isExpanded && (
              <div className="border-t border-gray-200 dark:border-border-dark">
                {categoryChapters.map((chapter) => {
                  const isChapterExpanded = expandedChapters.has(chapter.id);
                  const chapterTotals = getChapterTotals(chapter.id);
                  const chapterItems = items.filter(i => i.chapter_id === chapter.id);

                  return (
                    <div key={chapter.id}>
                      {/* Chapter Header */}
                      <button
                        className="flex items-center gap-3 p-3 pr-8 cursor-pointer hover:bg-gray-50 dark:hover:bg-background-dark border-b border-gray-100 dark:border-border-dark w-full text-right"
                        onClick={() => toggleChapter(chapter.id)}
                        aria-expanded={isChapterExpanded}
                        aria-label={`פרק ${chapter.name}, ${isChapterExpanded ? 'פתוח' : 'סגור'}`}
                      >
                        <span className={`material-symbols-outlined text-gray-400 transition-transform text-[18px] ${isChapterExpanded ? '' : '-rotate-90'}`} aria-hidden="true">
                          expand_more
                        </span>
                        <span className="text-sm font-mono text-gray-400">{chapter.code}</span>
                        <div className="flex-1">
                          <span className="font-medium text-gray-700 dark:text-gray-200">{chapter.name}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-6 text-left text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-300">{formatCompactCurrency(chapter.budget_amount)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-300">{chapter.contract_amount ? formatCompactCurrency(chapter.contract_amount) : '-'}</span>
                          </div>
                          <div>
                            <span className="text-green-600">{formatCompactCurrency(chapterTotals.paid)}</span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 w-8">{chapterTotals.count}</span>
                      </button>

                      {/* Items */}
                      {isChapterExpanded && chapterItems.length > 0 && (
                        <div className="bg-gray-50 dark:bg-background-dark">
                          {chapterItems.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-3 py-2 px-4 pr-16 border-b border-gray-100 dark:border-border-dark hover:bg-white dark:hover:bg-surface-dark"
                            >
                              <span className="text-xs font-mono text-gray-400 w-12">{item.code}</span>
                              <div className="flex-1 min-w-0">
                                <span className="text-sm text-gray-700 dark:text-gray-200">{item.description}</span>
                                {item.supplier_name && (
                                  <span className="text-xs text-gray-400 mr-2">• {item.supplier_name}</span>
                                )}
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(item.status)}`}>
                                {getStatusLabel(item.status)}
                              </span>
                              <div className="text-left w-24">
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{formatCurrency(item.total_with_vat)}</div>
                                {item.paid_amount > 0 && (
                                  <div className="text-xs text-green-600">שולם: {formatCurrency(item.paid_amount)}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ============================================================
// TABLE VIEW
// ============================================================
const TableView = ({ items, chapters }: { items: BudgetItem[]; chapters: BudgetChapter[] }) => {
  const [sortBy, setSortBy] = useState<'code' | 'description' | 'total' | 'paid' | 'status'>('code');
  const [sortAsc, setSortAsc] = useState(true);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'code': cmp = (a.code || '').localeCompare(b.code || ''); break;
        case 'description': cmp = a.description.localeCompare(b.description); break;
        case 'total': cmp = a.total_with_vat - b.total_with_vat; break;
        case 'paid': cmp = a.paid_amount - b.paid_amount; break;
        case 'status': cmp = a.status.localeCompare(b.status); break;
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [items, sortBy, sortAsc]);

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(col);
      setSortAsc(true);
    }
  };

  const getChapterName = (chapterId: string) => {
    const chapter = chapters.find(c => c.id === chapterId);
    return chapter ? `${chapter.code} - ${chapter.name}` : '';
  };

  return (
    <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-border-dark overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-background-dark border-b border-gray-200 dark:border-border-dark">
            <tr>
              <th
                className="px-4 py-3 text-right font-bold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('code')}
              >
                קוד {sortBy === 'code' && (sortAsc ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-3 text-right font-bold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('description')}
              >
                תיאור {sortBy === 'description' && (sortAsc ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-right font-bold text-gray-600 dark:text-gray-300">פרק</th>
              <th className="px-4 py-3 text-right font-bold text-gray-600 dark:text-gray-300">כמות</th>
              <th className="px-4 py-3 text-right font-bold text-gray-600 dark:text-gray-300">מחיר ליח'</th>
              <th className="px-4 py-3 text-right font-bold text-gray-600 dark:text-gray-300">אומדן</th>
              <th
                className="px-4 py-3 text-right font-bold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('total')}
              >
                תקציב {sortBy === 'total' && (sortAsc ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-right font-bold text-gray-600 dark:text-gray-300">חריגה ₪</th>
              <th className="px-4 py-3 text-right font-bold text-gray-600 dark:text-gray-300">חריגה %</th>
              <th
                className="px-4 py-3 text-right font-bold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('paid')}
              >
                שולם {sortBy === 'paid' && (sortAsc ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-3 text-right font-bold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('status')}
              >
                סטטוס {sortBy === 'status' && (sortAsc ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((item, idx) => (
              <tr key={item.id} className={`border-b border-gray-100 dark:border-border-dark hover:bg-gray-50 dark:hover:bg-background-dark ${idx % 2 === 0 ? 'bg-white dark:bg-surface-dark' : 'bg-gray-50/50 dark:bg-background-dark/50'}`}>
                <td className="px-4 py-3 font-mono text-gray-500">{item.code}</td>
                <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{item.description}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{getChapterName(item.chapter_id)}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.quantity} {item.unit}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.unit_price ? formatCurrency(item.unit_price) : '-'}</td>
                <td className="px-4 py-3 text-blue-600 dark:text-blue-400 font-medium">
                  {item.estimate_amount ? formatCurrency(item.estimate_amount) : '-'}
                </td>
                <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{formatCurrency(item.total_with_vat)}</td>
                <td className="px-4 py-3">
                  <VarianceCell
                    estimateAmount={item.estimate_amount}
                    varianceAmount={item.variance_amount}
                    variancePercent={item.variance_percent}
                  />
                </td>
                <td className="px-4 py-3">
                  <VarianceCell
                    estimateAmount={item.estimate_amount}
                    varianceAmount={item.variance_amount}
                    variancePercent={item.variance_percent}
                    showPercent
                  />
                </td>
                <td className="px-4 py-3 text-green-600 font-medium">{formatCurrency(item.paid_amount)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    {getStatusLabel(item.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-100 dark:bg-background-dark font-bold">
            <tr>
              <td colSpan={5} className="px-4 py-3 text-gray-700 dark:text-gray-200">סה"כ</td>
              <td className="px-4 py-3 text-blue-600 dark:text-blue-400">
                {formatCurrency(items.reduce((s, i) => s + (i.estimate_amount || 0), 0))}
              </td>
              <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{formatCurrency(items.reduce((s, i) => s + i.total_with_vat, 0))}</td>
              <td className="px-4 py-3"></td>
              <td className="px-4 py-3"></td>
              <td className="px-4 py-3 text-green-600">{formatCurrency(items.reduce((s, i) => s + i.paid_amount, 0))}</td>
              <td className="px-4 py-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

// ============================================================
// CASH FLOW VIEW
// ============================================================
const CashFlowView = ({ payments, items }: { payments: BudgetPayment[]; items: BudgetItem[] }) => {
  const monthlyData = useMemo(() => {
    const months: Record<string, { paid: number; pending: number; label: string }> = {};

    payments.forEach(p => {
      const date = new Date(p.invoice_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthNames = ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];
      const label = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

      if (!months[key]) {
        months[key] = { paid: 0, pending: 0, label };
      }

      if (p.status === 'paid') {
        months[key].paid += p.total_amount;
      } else {
        months[key].pending += p.total_amount;
      }
    });

    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, data]) => ({ ...data, key }));
  }, [payments]);

  const maxAmount = Math.max(...monthlyData.map(m => m.paid + m.pending), 1);

  const getItemDescription = (budgetItemId: string) => {
    const item = items.find(i => i.id === budgetItemId);
    return item?.description || '';
  };

  return (
    <div className="space-y-6">
      {/* Monthly Chart */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-border-dark p-6">
        <h4 className="font-bold text-gray-800 dark:text-white mb-4">תזרים מזומנים חודשי</h4>
        <div className="flex items-end gap-2 h-48">
          {monthlyData.map((month) => (
            <div key={month.key} className="flex-1 flex flex-col items-center">
              <div className="w-full flex flex-col-reverse h-36">
                <div
                  className="w-full bg-green-400 rounded-t"
                  style={{ height: `${(month.paid / maxAmount) * 100}%` }}
                  title={`שולם: ${formatCurrency(month.paid)}`}
                />
                <div
                  className="w-full bg-orange-300 rounded-t"
                  style={{ height: `${(month.pending / maxAmount) * 100}%` }}
                  title={`ממתין: ${formatCurrency(month.pending)}`}
                />
              </div>
              <div className="text-xs text-gray-500 mt-2 text-center">{month.label}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-4 justify-center text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded" />
            <span className="text-gray-600 dark:text-gray-300">שולם</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-300 rounded" />
            <span className="text-gray-600 dark:text-gray-300">ממתין</span>
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-border-dark overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-border-dark">
          <h4 className="font-bold text-gray-800 dark:text-white">תשלומים אחרונים</h4>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-border-dark">
          {payments.slice(0, 10).map((payment) => (
            <div key={payment.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-background-dark">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${payment.status === 'paid' ? 'bg-green-100' : 'bg-orange-100'}`}>
                <span className={`material-symbols-outlined text-[20px] ${payment.status === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>
                  {payment.status === 'paid' ? 'check_circle' : 'schedule'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-800 dark:text-gray-200">{payment.invoice_number}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{getItemDescription(payment.budget_item_id)}</div>
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-800 dark:text-white">{formatCurrency(payment.total_amount)}</div>
                <div className="text-xs text-gray-500">{new Date(payment.invoice_date).toLocaleDateString('he-IL')}</div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${payment.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {payment.status === 'paid' ? 'שולם' : 'ממתין'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// DATA INITIALIZATION HELPERS
// ============================================================
interface BudgetData {
  categories: BudgetCategory[];
  chapters: BudgetChapter[];
  items: BudgetItem[];
  payments: BudgetPayment[];
}

const loadInitialBudgetData = async (projectId: string): Promise<BudgetData> => {
  // Load categories
  let loadedCategories = await getBudgetCategories(projectId);
  if (loadedCategories.length === 0) {
    const seedCats = seedBudgetCategories.filter(c => c.project_id === projectId);
    if (seedCats.length > 0) {
      saveBudgetCategories([...loadedCategories, ...seedCats]);
      loadedCategories = seedCats;
    }
  }

  // Load chapters
  let loadedChapters = await getBudgetChapters(projectId);
  if (loadedChapters.length === 0) {
    const seedChaps = seedBudgetChapters.filter(c => c.project_id === projectId);
    if (seedChaps.length > 0) {
      saveBudgetChapters([...loadedChapters, ...seedChaps]);
      loadedChapters = seedChaps;
    }
  }

  // Load items
  let loadedItems = await getBudgetItems(projectId);
  if (loadedItems.length === 0) {
    const seedItms = seedBudgetItems.filter(i => i.project_id === projectId);
    if (seedItms.length > 0) {
      saveBudgetItems([...loadedItems, ...seedItms]);
      loadedItems = seedItms;
    }
  }

  // Load payments
  let loadedPayments = await getAllBudgetPayments();
  const itemIds = loadedItems.map(i => i.id);
  loadedPayments = loadedPayments.filter(p => itemIds.includes(p.budget_item_id));

  if (loadedPayments.length === 0) {
    const seedPays = seedBudgetPayments.filter(p => itemIds.includes(p.budget_item_id));
    if (seedPays.length > 0) {
      saveBudgetPayments([...loadedPayments, ...seedPays]);
      loadedPayments = seedPays;
    }
  }

  return {
    categories: loadedCategories,
    chapters: loadedChapters,
    items: loadedItems,
    payments: loadedPayments,
  };
};

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function BudgetSubTab({ project }: BudgetSubTabProps) {
  const [view, setView] = useState<ViewMode>('tree');
  const [budgetData, setBudgetData] = useState<BudgetData>({
    categories: [],
    chapters: [],
    items: [],
    payments: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [varianceOnlyFilter, setVarianceOnlyFilter] = useState(false);

  const { categories, chapters, items, payments } = budgetData;

  // Filter items based on variance filter
  const filteredItems = useMemo(() => {
    if (varianceOnlyFilter) {
      return items.filter((item) => item.estimate_amount && item.estimate_amount > 0);
    }
    return items;
  }, [items, varianceOnlyFilter]);

  // Load budget data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await loadInitialBudgetData(project.id);
        setBudgetData(data);
      } catch (error) {
        console.error('Error loading budget data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [project.id]);

  // Reload budget data after adding an item
  const handleItemAdded = useCallback(async () => {
    try {
      const data = await loadInitialBudgetData(project.id);
      setBudgetData(data);
      setShowAddItemModal(false);
    } catch (error) {
      console.error('Error reloading budget data:', error);
    }
  }, [project.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-border-dark p-4">
        <div className="flex items-center justify-end mb-4">
          <button
            onClick={() => setShowAddItemModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover text-sm shadow-sm"
            aria-label="הוסף פריט תקציב חדש"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
            הוסף פריט
          </button>
        </div>

        {/* View Toggle and Filter */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex bg-gray-100 dark:bg-background-dark rounded-lg p-1">
            {[
              { id: 'tree' as const, icon: 'account_tree', label: 'עץ' },
              { id: 'table' as const, icon: 'table', label: 'טבלה' },
              { id: 'cashflow' as const, icon: 'trending_up', label: 'תזרים' },
            ].map((v) => (
              <button
                key={v.id}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${
                  view === v.id
                    ? 'bg-white dark:bg-surface-dark shadow text-gray-800 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
                onClick={() => setView(v.id)}
                aria-pressed={view === v.id}
                aria-label={`תצוגת ${v.label}`}
              >
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">{v.icon}</span>
                {v.label}
              </button>
            ))}
          </div>

          {/* Variance Filter */}
          <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-border-dark bg-white dark:bg-surface-dark text-sm cursor-pointer hover:border-primary transition-colors">
            <input
              type="checkbox"
              checked={varianceOnlyFilter}
              onChange={(e) => setVarianceOnlyFilter(e.target.checked)}
              className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="whitespace-nowrap">רק עם חריגה</span>
          </label>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards chapters={chapters} items={filteredItems} />

      {/* Views */}
      {view === 'tree' && (
        <TreeView categories={categories} chapters={chapters} items={filteredItems} />
      )}
      {view === 'table' && (
        <TableView items={filteredItems} chapters={chapters} />
      )}
      {view === 'cashflow' && (
        <CashFlowView payments={payments} items={filteredItems} />
      )}

      {/* Add Budget Item Modal */}
      {showAddItemModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddItemModal(false);
          }}
        >
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
              <h3 className="text-lg font-bold">הוספת פריט תקציב</h3>
              <button
                onClick={() => setShowAddItemModal(false)}
                className="size-8 flex items-center justify-center hover:bg-background-light dark:hover:bg-background-dark rounded transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-60px)]">
              <AddBudgetItemForm
                projectId={project.id}
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
