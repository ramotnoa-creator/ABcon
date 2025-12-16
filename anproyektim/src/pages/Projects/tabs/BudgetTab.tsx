import { useState, useEffect } from 'react';
import { getBudget, updateBudget, getAllBudgets, saveBudgets } from '../../../data/budgetStorage';
import { seedBudgets } from '../../../data/budgetData';
import type { Project } from '../../../types';
import type { Budget, BudgetStatus } from '../../../types';

interface BudgetTabProps {
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

const getStatusColor = (status: BudgetStatus): string => {
  const colors: Record<BudgetStatus, string> = {
    'On Track': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
    'Deviation': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
    'At Risk': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
    'Completed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  };
  return colors[status];
};

const getStatusLabel = (status: BudgetStatus): string => {
  const labels: Record<BudgetStatus, string> = {
    'On Track': 'במסלול',
    'Deviation': 'חריגה',
    'At Risk': 'בסיכון',
    'Completed': 'הושלם',
  };
  return labels[status];
};

export default function BudgetTab({ project }: BudgetTabProps) {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    planned_budget: 0,
    actual_budget: 0,
    status: 'On Track' as BudgetStatus,
    notes: '',
  });

  useEffect(() => {
    loadBudget();
  }, [project.id]);

  const loadBudget = () => {
    let loaded = getBudget(project.id);
    
    // Seed if empty
    if (!loaded) {
      const seedBudget = seedBudgets.find((b) => b.project_id === project.id);
      if (seedBudget) {
        const all = getAllBudgets();
        all.push(seedBudget);
        saveBudgets(all);
        loaded = seedBudget;
      }
    }
    
    if (loaded) {
      setBudget(loaded);
      setEditForm({
        planned_budget: loaded.planned_budget,
        actual_budget: loaded.actual_budget,
        status: loaded.status,
        notes: loaded.notes || '',
      });
    } else {
      // Create empty budget
      const emptyBudget: Budget = {
        id: `budget-${Date.now()}`,
        project_id: project.id,
        planned_budget: 0,
        actual_budget: 0,
        variance: 0,
        status: 'On Track',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setBudget(emptyBudget);
      setEditForm({
        planned_budget: 0,
        actual_budget: 0,
        status: 'On Track',
        notes: '',
      });
    }
  };

  const handleSave = () => {
    if (!budget) return;

    const variance = editForm.planned_budget > 0
      ? ((editForm.actual_budget - editForm.planned_budget) / editForm.planned_budget) * 100
      : 0;

    updateBudget(project.id, {
      planned_budget: editForm.planned_budget,
      actual_budget: editForm.actual_budget,
      variance,
      status: editForm.status,
      notes: editForm.notes.trim() || undefined,
    });

    loadBudget();
    setIsEditMode(false);
  };

  const handleCancel = () => {
    if (budget) {
      setEditForm({
        planned_budget: budget.planned_budget,
        actual_budget: budget.actual_budget,
        status: budget.status,
        notes: budget.notes || '',
      });
    }
    setIsEditMode(false);
  };

  if (!budget) {
    return (
      <div className="text-center py-12 text-text-secondary-light dark:text-text-secondary-dark">
        טוען...
      </div>
    );
  }

  const variance = budget.variance || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h3 className="text-xl font-bold">תקציב פרויקט</h3>
        {!isEditMode && (
          <button
            onClick={() => setIsEditMode(true)}
            className="flex items-center justify-center h-10 px-4 rounded-lg bg-primary text-white hover:bg-primary-hover transition text-sm font-bold"
          >
            <span className="material-symbols-outlined me-2 text-[18px]">edit</span>
            עריכת תקציב
          </button>
        )}
      </div>

      {/* Budget Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Planned Budget */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
              תקציב מתוכנן
            </h4>
            <span className="material-symbols-outlined text-primary text-[24px]">account_balance</span>
          </div>
          {isEditMode ? (
            <input
              type="number"
              className="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-2xl font-bold focus:ring-1 focus:ring-primary focus:border-primary"
              value={editForm.planned_budget}
              onChange={(e) =>
                setEditForm({ ...editForm, planned_budget: parseFloat(e.target.value) || 0 })
              }
            />
          ) : (
            <p className="text-3xl font-black text-text-main-light dark:text-text-main-dark">
              {formatCurrency(budget.planned_budget)}
            </p>
          )}
        </div>

        {/* Actual Budget */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
              תקציב בפועל
            </h4>
            <span className="material-symbols-outlined text-primary text-[24px]">payments</span>
          </div>
          {isEditMode ? (
            <input
              type="number"
              className="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-2xl font-bold focus:ring-1 focus:ring-primary focus:border-primary"
              value={editForm.actual_budget}
              onChange={(e) =>
                setEditForm({ ...editForm, actual_budget: parseFloat(e.target.value) || 0 })
              }
            />
          ) : (
            <p className="text-3xl font-black text-text-main-light dark:text-text-main-dark">
              {formatCurrency(budget.actual_budget)}
            </p>
          )}
        </div>

        {/* Status */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
              סטטוס
            </h4>
            <span className="material-symbols-outlined text-primary text-[24px]">flag</span>
          </div>
          {isEditMode ? (
            <select
              className="w-full h-12 px-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-lg font-bold focus:ring-1 focus:ring-primary focus:border-primary"
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value as BudgetStatus })}
            >
              <option value="On Track">במסלול</option>
              <option value="Deviation">חריגה</option>
              <option value="At Risk">בסיכון</option>
              <option value="Completed">הושלם</option>
            </select>
          ) : (
            <span
              className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold ${getStatusColor(
                budget.status
              )}`}
            >
              {getStatusLabel(budget.status)}
            </span>
          )}
        </div>
      </div>

      {/* Variance Display */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider mb-2">
              חריגה
            </h4>
            <p className={`text-4xl font-black ${getVarianceColor(variance)}`}>
              {formatVariance(variance)}
            </p>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2">
              {variance > 0
                ? 'עליה על התקציב המתוכנן'
                : variance < 0
                ? 'חיסכון מהתקציב המתוכנן'
                : 'בדיוק על התקציב המתוכנן'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">
              הבדל כספי
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(budget.actual_budget - budget.planned_budget)}
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-6">
        <h4 className="text-sm font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider mb-4">
          הערות
        </h4>
        {isEditMode ? (
          <textarea
            className="w-full p-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary resize-none h-32"
            value={editForm.notes}
            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
            placeholder="הערות על התקציב..."
          />
        ) : (
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            {budget.notes || 'אין הערות'}
          </p>
        )}
      </div>

      {/* Edit Actions */}
      {isEditMode && (
        <div className="flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold text-sm transition-colors"
          >
            ביטול
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover font-bold text-sm transition-colors"
          >
            שמירה
          </button>
        </div>
      )}
    </div>
  );
}
