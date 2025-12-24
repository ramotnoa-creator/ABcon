import { useState, useEffect, useMemo } from 'react';
import {
  getSpecialIssues,
  getAllSpecialIssues,
  saveSpecialIssues,
  addSpecialIssue,
  updateSpecialIssue,
  deleteSpecialIssue,
} from '../../../data/specialIssuesStorage';
import { seedSpecialIssues } from '../../../data/specialIssuesData';
import { useAuth } from '../../../contexts/AuthContext';
import {
  canCreateSpecialIssue,
  canEditSpecialIssue,
  canDeleteSpecialIssue,
} from '../../../utils/permissions';
import type { Project, SpecialIssue, SpecialIssueStatus } from '../../../types';

interface SpecialIssuesTabProps {
  project: Project;
}

const statusLabels: Record<SpecialIssueStatus, string> = {
  open: 'פתוח',
  in_progress: 'בטיפול',
  resolved: 'נפתר',
};

const statusColors: Record<SpecialIssueStatus, string> = {
  open: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
  in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
};

const formatDateForDisplay = (isoDate: string): string => {
  try {
    const date = new Date(isoDate);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return isoDate;
  }
};

const formatDateForInput = (isoDate: string): string => {
  try {
    const date = new Date(isoDate);
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

const getTodayISO = (): string => {
  return new Date().toISOString().split('T')[0];
};

export default function SpecialIssuesTab({ project }: SpecialIssuesTabProps) {
  const { user } = useAuth();
  const [issues, setIssues] = useState<SpecialIssue[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<SpecialIssue | null>(null);
  const [statusFilter, setStatusFilter] = useState<SpecialIssueStatus | 'all'>('all');
  const [formData, setFormData] = useState({
    date: getTodayISO(),
    description: '',
    status: 'open' as SpecialIssueStatus,
    resolution: '',
  });

  // Allow actions if user has permission OR if no user (dev mode)
  const canCreate = !user || canCreateSpecialIssue(user, project.id);
  const canEdit = !user || canEditSpecialIssue(user, project.id);
  const canDelete = !user || canDeleteSpecialIssue(user, project.id);

  useEffect(() => {
    loadIssues();
  }, [project.id]);

  const loadIssues = () => {
    let loaded = getSpecialIssues(project.id);

    // Seed if empty
    if (loaded.length === 0) {
      const projectIssues = seedSpecialIssues.filter((si) => si.project_id === project.id);
      if (projectIssues.length > 0) {
        const all = getAllSpecialIssues();
        projectIssues.forEach((issue) => all.push(issue));
        saveSpecialIssues(all);
        loaded = projectIssues.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
    }

    setIssues(loaded);
  };

  const filteredIssues = useMemo(() => {
    if (statusFilter === 'all') return issues;
    return issues.filter((issue) => issue.status === statusFilter);
  }, [issues, statusFilter]);

  const openIssuesCount = useMemo(() => {
    return issues.filter((issue) => issue.status === 'open').length;
  }, [issues]);

  const resetForm = () => {
    setFormData({
      date: getTodayISO(),
      description: '',
      status: 'open',
      resolution: '',
    });
    setEditingIssue(null);
  };

  const handleOpenModal = (issue?: SpecialIssue) => {
    if (issue) {
      setEditingIssue(issue);
      setFormData({
        date: formatDateForInput(issue.date),
        description: issue.description,
        status: issue.status,
        resolution: issue.resolution || '',
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
    if (!formData.description.trim() || !formData.date) return;

    if (editingIssue) {
      updateSpecialIssue(editingIssue.id, {
        date: new Date(formData.date).toISOString(),
        description: formData.description.trim(),
        status: formData.status,
        resolution: formData.resolution.trim() || undefined,
      });
    } else {
      const newIssue: SpecialIssue = {
        id: `si-${Date.now()}`,
        project_id: project.id,
        date: new Date(formData.date).toISOString(),
        description: formData.description.trim(),
        status: formData.status,
        resolution: formData.resolution.trim() || undefined,
        created_by: user?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      addSpecialIssue(newIssue);
    }

    loadIssues();
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק בעיה זו?')) return;
    deleteSpecialIssue(id);
    loadIssues();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold">בעיות מיוחדות</h3>
          {openIssuesCount > 0 && (
            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">
              {openIssuesCount} פתוחות
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <select
            className="h-10 px-3 rounded-lg bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SpecialIssueStatus | 'all')}
          >
            <option value="all">כל הסטטוסים</option>
            <option value="open">פתוח</option>
            <option value="in_progress">בטיפול</option>
            <option value="resolved">נפתר</option>
          </select>
          {canCreate && (
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center justify-center h-10 px-5 rounded-lg bg-primary text-white hover:bg-primary-hover transition text-sm font-bold tracking-[0.015em] shadow-sm"
            >
              <span className="material-symbols-outlined me-2 text-[20px]">add</span>
              הוסף בעיה
            </button>
          )}
        </div>
      </div>

      {/* Issues Table - Desktop */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-background-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark">
              <tr>
                <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  תאריך
                </th>
                <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  תיאור הבעיה
                </th>
                <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  סטטוס
                </th>
                <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  פתרון
                </th>
                {(canEdit || canDelete) && (
                  <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                    פעולות
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {filteredIssues.length === 0 ? (
                <tr>
                  <td
                    colSpan={canEdit || canDelete ? 5 : 4}
                    className="px-6 py-12 text-center text-text-secondary-light dark:text-text-secondary-dark"
                  >
                    אין בעיות מיוחדות
                  </td>
                </tr>
              ) : (
                filteredIssues.map((issue) => (
                  <tr
                    key={issue.id}
                    className="group hover:bg-background-light dark:hover:bg-background-dark/50 transition-colors"
                  >
                    <td className="px-6 py-4 align-middle font-medium whitespace-nowrap">
                      {formatDateForDisplay(issue.date)}
                    </td>
                    <td className="px-6 py-4 align-middle max-w-[300px]">
                      <p className="line-clamp-2">{issue.description}</p>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${statusColors[issue.status]}`}
                      >
                        {statusLabels[issue.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-middle text-text-secondary-light dark:text-text-secondary-dark max-w-[250px]">
                      {issue.resolution ? (
                        <p className="line-clamp-2">{issue.resolution}</p>
                      ) : (
                        <span className="text-text-secondary-light/50">-</span>
                      )}
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center gap-2 opacity-100 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          {canEdit && (
                            <button
                              onClick={() => handleOpenModal(issue)}
                              className="p-1.5 rounded-lg text-text-secondary-light hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="עריכה"
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(issue.id)}
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
          {filteredIssues.length === 0 ? (
            <div className="p-4 text-center text-text-secondary-light dark:text-text-secondary-dark">
              אין בעיות מיוחדות
            </div>
          ) : (
            filteredIssues.map((issue) => (
              <div key={issue.id} className="p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${statusColors[issue.status]}`}
                    >
                      {statusLabels[issue.status]}
                    </span>
                  </div>
                  <span className="text-xs text-text-secondary-light font-medium">
                    {formatDateForDisplay(issue.date)}
                  </span>
                </div>

                <p className="text-sm font-medium">{issue.description}</p>

                {issue.resolution && (
                  <div className="text-sm">
                    <span className="text-text-secondary-light dark:text-text-secondary-dark">
                      פתרון:{' '}
                    </span>
                    <span className="font-medium">{issue.resolution}</span>
                  </div>
                )}

                {(canEdit || canDelete) && (
                  <div className="flex items-center gap-2 pt-2 border-t border-border-light dark:border-border-dark">
                    {canEdit && (
                      <button
                        onClick={() => handleOpenModal(issue)}
                        className="flex items-center justify-center size-8 rounded-full bg-background-light dark:bg-surface-dark border border-border-light text-primary hover:bg-primary hover:text-white transition-colors"
                        title="עריכה"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(issue.id)}
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
                {editingIssue ? 'עריכת בעיה' : 'הוספת בעיה חדשה'}
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
                  תאריך <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">
                  תיאור הבעיה <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full p-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary resize-none h-24"
                  placeholder="תאר את הבעיה..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">סטטוס</label>
                <select
                  className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as SpecialIssueStatus })
                  }
                >
                  <option value="open">פתוח</option>
                  <option value="in_progress">בטיפול</option>
                  <option value="resolved">נפתר</option>
                </select>
              </div>
              {formData.status === 'resolved' && (
                <div>
                  <label className="block text-sm font-bold mb-2">פתרון</label>
                  <textarea
                    className="w-full p-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary resize-none h-24"
                    placeholder="תאר את הפתרון..."
                    value={formData.resolution}
                    onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                  />
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold text-sm transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!formData.description.trim() || !formData.date}
                  className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingIssue ? 'שמור שינויים' : 'הוסף בעיה'}
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
            הוסף בעיה
          </button>
        </div>
      )}
    </div>
  );
}
