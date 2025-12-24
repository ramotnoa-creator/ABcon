import { useState, useEffect } from 'react';
import {
  getPlanningChanges,
  getAllPlanningChanges,
  savePlanningChanges,
  addPlanningChange,
  updatePlanningChange,
  deletePlanningChange,
} from '../../../data/planningChangesStorage';
import { seedPlanningChanges } from '../../../data/planningChangesData';
import { useAuth } from '../../../contexts/AuthContext';
import {
  canCreatePlanningChange,
  canEditPlanningChange,
  canDeletePlanningChange,
} from '../../../utils/permissions';
import type { Project, PlanningChange, PlanningChangeDecision } from '../../../types';
import { formatDateForDisplay } from '../../../utils/dateUtils';

interface PlanningChangesTabProps {
  project: Project;
}

const decisionLabels: Record<PlanningChangeDecision, string> = {
  pending: 'ממתין להחלטה',
  approved: 'אושר',
  rejected: 'נדחה',
};

const decisionColors: Record<PlanningChangeDecision, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
};

const formatCurrency = (amount?: number): string => {
  if (amount === undefined || amount === null) return '-';
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function PlanningChangesTab({ project }: PlanningChangesTabProps) {
  const { user } = useAuth();
  const [changes, setChanges] = useState<PlanningChange[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChange, setEditingChange] = useState<PlanningChange | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    schedule_impact: '',
    budget_impact: '',
    decision: 'pending' as PlanningChangeDecision,
  });

  // Allow actions if user has permission OR if no user (dev mode)
  const canCreate = !user || canCreatePlanningChange(user, project.id);
  const canEdit = !user || canEditPlanningChange(user, project.id);
  const canDelete = !user || canDeletePlanningChange(user, project.id);

  useEffect(() => {
    loadChanges();
  }, [project.id]);

  const loadChanges = () => {
    let loaded = getPlanningChanges(project.id);

    // Seed if empty
    if (loaded.length === 0) {
      const projectChanges = seedPlanningChanges.filter((pc) => pc.project_id === project.id);
      if (projectChanges.length > 0) {
        const all = getAllPlanningChanges();
        projectChanges.forEach((change) => all.push(change));
        savePlanningChanges(all);
        loaded = projectChanges;
      }
    }

    setChanges(loaded);
  };

  const resetForm = () => {
    setFormData({
      description: '',
      schedule_impact: '',
      budget_impact: '',
      decision: 'pending',
    });
    setEditingChange(null);
  };

  const handleOpenModal = (change?: PlanningChange) => {
    if (change) {
      setEditingChange(change);
      setFormData({
        description: change.description,
        schedule_impact: change.schedule_impact || '',
        budget_impact: change.budget_impact?.toString() || '',
        decision: change.decision,
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = () => {
    if (!formData.description.trim()) return;

    const budgetImpact = formData.budget_impact.trim()
      ? parseFloat(formData.budget_impact)
      : undefined;

    if (editingChange) {
      updatePlanningChange(editingChange.id, {
        description: formData.description.trim(),
        schedule_impact: formData.schedule_impact.trim() || undefined,
        budget_impact: isNaN(budgetImpact as number) ? undefined : budgetImpact,
        decision: formData.decision,
      });
    } else {
      addPlanningChange({
        id: `pc-${Date.now()}`,
        project_id: project.id,
        description: formData.description.trim(),
        schedule_impact: formData.schedule_impact.trim() || undefined,
        budget_impact: isNaN(budgetImpact as number) ? undefined : budgetImpact,
        decision: formData.decision,
        created_by: user?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    loadChanges();
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק שינוי זה?')) return;
    deletePlanningChange(id);
    loadChanges();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h3 className="text-xl font-bold">שינויים בתכנון</h3>
        {canCreate && (
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center h-10 px-5 rounded-lg bg-primary text-white hover:bg-primary-hover transition text-sm font-bold tracking-[0.015em] shadow-sm"
          >
            <span className="material-symbols-outlined me-2 text-[20px]">add</span>
            הוסף שינוי
          </button>
        )}
      </div>

      {/* Changes Table - Desktop */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-background-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark">
              <tr>
                <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  מס'
                </th>
                <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  תיאור השינוי
                </th>
                <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  השפעה על לו"ז
                </th>
                <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  השפעה על תקציב
                </th>
                <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  החלטה
                </th>
                <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  תאריך יצירה
                </th>
                {(canEdit || canDelete) && (
                  <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                    פעולות
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {changes.length === 0 ? (
                <tr>
                  <td
                    colSpan={canEdit || canDelete ? 7 : 6}
                    className="px-6 py-12 text-center text-text-secondary-light dark:text-text-secondary-dark"
                  >
                    אין שינויים בתכנון
                  </td>
                </tr>
              ) : (
                changes.map((change) => (
                  <tr
                    key={change.id}
                    className="group hover:bg-background-light dark:hover:bg-background-dark/50 transition-colors"
                  >
                    <td className="px-6 py-4 align-middle font-bold text-primary">
                      {change.change_number}
                    </td>
                    <td className="px-6 py-4 align-middle max-w-[300px]">
                      <p className="line-clamp-2">{change.description}</p>
                    </td>
                    <td className="px-6 py-4 align-middle text-text-secondary-light dark:text-text-secondary-dark">
                      {change.schedule_impact || '-'}
                    </td>
                    <td className="px-6 py-4 align-middle font-medium">
                      {formatCurrency(change.budget_impact)}
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${decisionColors[change.decision]}`}
                      >
                        {decisionLabels[change.decision]}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-middle text-text-secondary-light dark:text-text-secondary-dark">
                      {formatDateForDisplay(change.created_at)}
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center gap-2 opacity-100 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          {canEdit && (
                            <button
                              onClick={() => handleOpenModal(change)}
                              className="p-1.5 rounded-lg text-text-secondary-light hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="עריכה"
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(change.id)}
                              className="p-1.5 rounded-lg text-text-secondary-light hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="מחיקה"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="block md:hidden divide-y divide-border-light dark:divide-border-dark">
          {changes.length === 0 ? (
            <div className="p-4 text-center text-text-secondary-light dark:text-text-secondary-dark">
              אין שינויים בתכנון
            </div>
          ) : (
            changes.map((change) => (
              <div key={change.id} className="p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {change.change_number}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${decisionColors[change.decision]}`}
                    >
                      {decisionLabels[change.decision]}
                    </span>
                  </div>
                  <span className="text-xs text-text-secondary-light">
                    {formatDateForDisplay(change.created_at)}
                  </span>
                </div>

                <p className="text-sm font-medium">{change.description}</p>

                <div className="flex flex-wrap gap-4 text-sm">
                  {change.schedule_impact && (
                    <div>
                      <span className="text-text-secondary-light dark:text-text-secondary-dark">
                        השפעה על לו"ז:{' '}
                      </span>
                      <span className="font-medium">{change.schedule_impact}</span>
                    </div>
                  )}
                  {change.budget_impact !== undefined && (
                    <div>
                      <span className="text-text-secondary-light dark:text-text-secondary-dark">
                        השפעה על תקציב:{' '}
                      </span>
                      <span className="font-medium">{formatCurrency(change.budget_impact)}</span>
                    </div>
                  )}
                </div>

                {(canEdit || canDelete) && (
                  <div className="flex items-center gap-2 pt-2 border-t border-border-light dark:border-border-dark">
                    {canEdit && (
                      <button
                        onClick={() => handleOpenModal(change)}
                        className="flex items-center justify-center size-8 rounded-full bg-background-light dark:bg-surface-dark border border-border-light text-primary hover:bg-primary hover:text-white transition-colors"
                        title="עריכה"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(change.id)}
                        className="flex items-center justify-center size-8 rounded-full bg-background-light dark:bg-surface-dark border border-border-light text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                        title="מחיקה"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg border border-border-light dark:border-border-dark w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border-light dark:border-border-dark sticky top-0 bg-surface-light dark:bg-surface-dark">
              <h3 className="text-lg font-bold">
                {editingChange ? 'עריכת שינוי' : 'הוספת שינוי חדש'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="size-8 flex items-center justify-center hover:bg-background-light dark:hover:bg-background-dark rounded transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">
                  תיאור השינוי <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full p-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary resize-none h-24"
                  placeholder="תאר את השינוי..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">השפעה על לו"ז</label>
                <input
                  className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder='לדוגמה: עיכוב של 2 שבועות'
                  value={formData.schedule_impact}
                  onChange={(e) => setFormData({ ...formData, schedule_impact: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">השפעה על תקציב (₪)</label>
                <input
                  className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="הזן סכום בשקלים"
                  type="number"
                  value={formData.budget_impact}
                  onChange={(e) => setFormData({ ...formData, budget_impact: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">החלטה</label>
                <select
                  className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                  value={formData.decision}
                  onChange={(e) =>
                    setFormData({ ...formData, decision: e.target.value as PlanningChangeDecision })
                  }
                >
                  <option value="pending">ממתין להחלטה</option>
                  <option value="approved">אושר</option>
                  <option value="rejected">נדחה</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold text-sm transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!formData.description.trim()}
                  className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingChange ? 'שמור שינויים' : 'הוסף שינוי'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Footer - Add Button */}
      {canCreate && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark md:hidden z-50 flex gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button
            onClick={() => handleOpenModal()}
            className="flex-1 flex items-center justify-center h-12 px-4 rounded-lg bg-primary text-white font-bold text-sm shadow-md hover:bg-primary-hover transition-colors"
          >
            <span className="material-symbols-outlined me-2 text-[20px]">add</span>
            הוסף שינוי
          </button>
        </div>
      )}
    </div>
  );
}
