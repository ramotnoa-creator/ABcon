import { useState, useCallback, useEffect } from 'react';
import type { Project } from '../../../types';
import { formatDateForDisplay } from '../../../utils/dateUtils';

// Developer Approval types
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'revision_requested';
export type ApprovalCategory = 'design' | 'budget' | 'materials' | 'schedule' | 'contractor' | 'other';

export interface DeveloperApproval {
  id: string;
  project_id: string;
  approval_number: number;
  title: string;
  description: string;
  category: ApprovalCategory;
  status: ApprovalStatus;
  requested_date: string;
  response_date?: string;
  response_notes?: string;
  requested_by?: string;
  attachments?: string[];
  created_at: string;
  updated_at: string;
}

// Storage key
const STORAGE_KEY = 'developer_approvals';

// Storage functions
const getApprovals = (projectId: string): DeveloperApproval[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  const all: DeveloperApproval[] = JSON.parse(data);
  return all.filter(a => a.project_id === projectId);
};

const saveApprovals = (approvals: DeveloperApproval[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(approvals));
};

const getAllApprovals = (): DeveloperApproval[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  return JSON.parse(data);
};

interface DeveloperApprovalTabProps {
  project: Project;
}

const categoryLabels: Record<ApprovalCategory, string> = {
  design: 'עיצוב',
  budget: 'תקציב',
  materials: 'חומרים',
  schedule: 'לו"ז',
  contractor: 'קבלן',
  other: 'אחר',
};

const categoryIcons: Record<ApprovalCategory, string> = {
  design: 'palette',
  budget: 'payments',
  materials: 'inventory_2',
  schedule: 'schedule',
  contractor: 'engineering',
  other: 'more_horiz',
};

const statusLabels: Record<ApprovalStatus, string> = {
  pending: 'ממתין לאישור',
  approved: 'מאושר',
  rejected: 'נדחה',
  revision_requested: 'נדרשת תיקון',
};

const statusColors: Record<ApprovalStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
  revision_requested: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
};

export default function DeveloperApprovalTab({ project }: DeveloperApprovalTabProps) {
  const [approvals, setApprovals] = useState<DeveloperApproval[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApproval, setEditingApproval] = useState<DeveloperApproval | null>(null);
  const [filterStatus, setFilterStatus] = useState<ApprovalStatus | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'design' as ApprovalCategory,
    requested_by: '',
  });

  const loadApprovals = useCallback(() => {
    const loaded = getApprovals(project.id);
    setApprovals(loaded.sort((a, b) => b.approval_number - a.approval_number));
  }, [project.id]);

  useEffect(() => {
    loadApprovals();
  }, [loadApprovals]);

  const getNextApprovalNumber = (): number => {
    if (approvals.length === 0) return 1;
    return Math.max(...approvals.map(a => a.approval_number)) + 1;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();

    if (editingApproval) {
      // Update existing
      const all = getAllApprovals();
      const updated = all.map(a =>
        a.id === editingApproval.id
          ? { ...a, ...formData, updated_at: now }
          : a
      );
      saveApprovals(updated);
    } else {
      // Create new
      const newApproval: DeveloperApproval = {
        id: `approval-${Date.now()}`,
        project_id: project.id,
        approval_number: getNextApprovalNumber(),
        title: formData.title,
        description: formData.description,
        category: formData.category,
        status: 'pending',
        requested_date: now,
        requested_by: formData.requested_by,
        created_at: now,
        updated_at: now,
      };
      const all = getAllApprovals();
      all.push(newApproval);
      saveApprovals(all);
    }

    setIsModalOpen(false);
    setEditingApproval(null);
    setFormData({ title: '', description: '', category: 'design', requested_by: '' });
    loadApprovals();
  };

  const handleStatusChange = (approval: DeveloperApproval, newStatus: ApprovalStatus, notes?: string) => {
    const now = new Date().toISOString();
    const all = getAllApprovals();
    const updated = all.map(a =>
      a.id === approval.id
        ? {
            ...a,
            status: newStatus,
            response_date: now,
            response_notes: notes || a.response_notes,
            updated_at: now
          }
        : a
    );
    saveApprovals(updated);
    loadApprovals();
  };

  const handleDelete = (approvalId: string) => {
    if (!confirm('האם למחוק את הבקשה?')) return;
    const all = getAllApprovals();
    const filtered = all.filter(a => a.id !== approvalId);
    saveApprovals(filtered);
    loadApprovals();
  };

  const openEditModal = (approval: DeveloperApproval) => {
    setEditingApproval(approval);
    setFormData({
      title: approval.title,
      description: approval.description,
      category: approval.category,
      requested_by: approval.requested_by || '',
    });
    setIsModalOpen(true);
  };

  const filteredApprovals = filterStatus === 'all'
    ? approvals
    : approvals.filter(a => a.status === filterStatus);

  const pendingCount = approvals.filter(a => a.status === 'pending').length;
  const approvedCount = approvals.filter(a => a.status === 'approved').length;
  const rejectedCount = approvals.filter(a => a.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">אישורי יזם</h2>
          <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mt-1">
            ניהול בקשות ואישורים מהיזם
          </p>
        </div>
        <button
          onClick={() => {
            setEditingApproval(null);
            setFormData({ title: '', description: '', category: 'design', requested_by: '' });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-white hover:bg-primary-hover transition-all duration-200 text-sm font-bold btn-press"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          בקשה חדשה
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-4 border border-border-light dark:border-border-dark">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">list_alt</span>
            </div>
            <div>
              <p className="text-2xl font-bold">{approvals.length}</p>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">סה"כ בקשות</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-4 border border-border-light dark:border-border-dark">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">pending</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingCount}</p>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">ממתינים</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-4 border border-border-light dark:border-border-dark">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{approvedCount}</p>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">מאושרים</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-4 border border-border-light dark:border-border-dark">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-red-600 dark:text-red-400">cancel</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{rejectedCount}</p>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">נדחו</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['all', 'pending', 'approved', 'rejected', 'revision_requested'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              filterStatus === status
                ? 'bg-primary text-white'
                : 'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {status === 'all' ? 'הכל' : statusLabels[status]}
          </button>
        ))}
      </div>

      {/* Approvals list */}
      <div className="space-y-4">
        {filteredApprovals.length === 0 ? (
          <div className="text-center py-12 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark">
            <span className="material-symbols-outlined text-[48px] text-text-secondary-light dark:text-text-secondary-dark mb-3">
              inbox
            </span>
            <p className="text-text-secondary-light dark:text-text-secondary-dark">
              {filterStatus === 'all' ? 'אין בקשות לאישור' : 'אין בקשות בסטטוס זה'}
            </p>
          </div>
        ) : (
          filteredApprovals.map((approval) => (
            <div
              key={approval.id}
              className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark overflow-hidden transition-all duration-200 hover:shadow-md"
            >
              {/* Main row */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedId(expandedId === approval.id ? null : approval.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`size-10 rounded-lg flex items-center justify-center ${
                      approval.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30' :
                      approval.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30' :
                      approval.status === 'revision_requested' ? 'bg-blue-100 dark:bg-blue-900/30' :
                      'bg-amber-100 dark:bg-amber-900/30'
                    }`}>
                      <span className={`material-symbols-outlined ${
                        approval.status === 'approved' ? 'text-green-600 dark:text-green-400' :
                        approval.status === 'rejected' ? 'text-red-600 dark:text-red-400' :
                        approval.status === 'revision_requested' ? 'text-blue-600 dark:text-blue-400' :
                        'text-amber-600 dark:text-amber-400'
                      }`}>
                        {categoryIcons[approval.category]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                          #{approval.approval_number}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[approval.status]}`}>
                          {statusLabels[approval.status]}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                          {categoryLabels[approval.category]}
                        </span>
                      </div>
                      <h3 className="font-bold mt-1">{approval.title}</h3>
                      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1 line-clamp-2">
                        {approval.description}
                      </p>
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-2">
                        נוצר: {formatDateForDisplay(approval.requested_date)}
                        {approval.requested_by && ` • ע"י ${approval.requested_by}`}
                      </p>
                    </div>
                  </div>
                  <span className={`material-symbols-outlined text-text-secondary-light dark:text-text-secondary-dark transition-transform duration-200 ${
                    expandedId === approval.id ? 'rotate-180' : ''
                  }`}>
                    expand_more
                  </span>
                </div>
              </div>

              {/* Expanded content */}
              {expandedId === approval.id && (
                <div className="px-4 pb-4 pt-2 border-t border-border-light dark:border-border-dark">
                  {approval.response_notes && (
                    <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                        הערות תגובה:
                      </p>
                      <p className="text-sm">{approval.response_notes}</p>
                      {approval.response_date && (
                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-2">
                          תאריך תגובה: {formatDateForDisplay(approval.response_date)}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {approval.status === 'pending' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(approval, 'approved');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">check</span>
                          אשר
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const notes = prompt('הערות לדחייה:');
                            if (notes !== null) {
                              handleStatusChange(approval, 'rejected', notes);
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                          דחה
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const notes = prompt('מה נדרש לתקן?');
                            if (notes !== null) {
                              handleStatusChange(approval, 'revision_requested', notes);
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit_note</span>
                          בקש תיקון
                        </button>
                      </>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(approval);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      ערוך
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(approval.id);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      מחק
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 modal-overlay"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-surface-light dark:bg-surface-dark rounded-2xl w-full max-w-lg mx-4 modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
              <h3 className="text-lg font-bold">
                {editingApproval ? 'עריכת בקשה' : 'בקשה חדשה לאישור יזם'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="size-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">כותרת *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full h-10 px-3 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="לדוגמה: אישור שינוי בחזית"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">תיאור *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  placeholder="תאר את הבקשה בפירוט..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">קטגוריה</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ApprovalCategory })}
                  className="w-full h-10 px-3 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">מבקש</label>
                <input
                  type="text"
                  value={formData.requested_by}
                  onChange={(e) => setFormData({ ...formData, requested_by: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="שם המבקש"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-10 rounded-lg border border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-lg bg-primary text-white hover:bg-primary-hover font-medium transition-colors"
                >
                  {editingApproval ? 'שמור שינויים' : 'צור בקשה'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
