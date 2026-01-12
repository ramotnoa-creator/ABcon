import { useState, useMemo, useCallback } from 'react';
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
import type { Project, SpecialIssue, SpecialIssueStatus, SpecialIssuePriority, SpecialIssueCategory } from '../../../types';

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

const priorityLabels: Record<SpecialIssuePriority, string> = {
  low: 'נמוכה',
  medium: 'בינונית',
  high: 'גבוהה',
  critical: 'קריטי',
};

const priorityColors: Record<SpecialIssuePriority, string> = {
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
};

const categoryLabels: Record<SpecialIssueCategory, string> = {
  safety: 'בטיחות',
  quality: 'איכות',
  schedule: 'לו"ז',
  budget: 'תקציב',
  design: 'תכנון',
  permits: 'היתרים',
  other: 'אחר',
};

const categoryIcons: Record<SpecialIssueCategory, string> = {
  safety: 'health_and_safety',
  quality: 'verified',
  schedule: 'schedule',
  budget: 'payments',
  design: 'architecture',
  permits: 'description',
  other: 'more_horiz',
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

const loadInitialIssues = (projectId: string): SpecialIssue[] => {
  let loaded = getSpecialIssues(projectId);

  // Seed if empty
  if (loaded.length === 0) {
    const projectIssues = seedSpecialIssues.filter((si) => si.project_id === projectId);
    if (projectIssues.length > 0) {
      const all = getAllSpecialIssues();
      projectIssues.forEach((issue) => all.push(issue));
      saveSpecialIssues(all);
      loaded = projectIssues.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  }

  return loaded;
};

// Image Gallery Modal Component
interface ImageGalleryModalProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

function ImageGalleryModal({ images, initialIndex = 0, onClose }: ImageGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToNext();
    if (e.key === 'ArrowRight') goToPrevious();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 modal-overlay"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div
        className="relative max-w-4xl w-full mx-4 modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-12 left-0 size-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
        >
          <span className="material-symbols-outlined text-[24px]">close</span>
        </button>

        <div className="absolute -top-12 right-0 text-white text-sm">
          {currentIndex + 1} / {images.length}
        </div>

        <div className="relative bg-black rounded-xl overflow-hidden">
          <img
            src={images[currentIndex]}
            alt={`תמונה ${currentIndex + 1}`}
            className="w-full max-h-[70vh] object-contain"
          />

          {images.length > 1 && (
            <>
              <button
                onClick={goToNext}
                className="absolute left-4 top-1/2 -translate-y-1/2 size-12 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[28px]">chevron_left</span>
              </button>
              <button
                onClick={goToPrevious}
                className="absolute right-4 top-1/2 -translate-y-1/2 size-12 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[28px]">chevron_right</span>
              </button>
            </>
          )}
        </div>

        {images.length > 1 && (
          <div className="flex justify-center gap-2 mt-4 overflow-x-auto pb-2">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`size-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                  idx === currentIndex ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`תמונה ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SpecialIssuesTab({ project }: SpecialIssuesTabProps) {
  const { user } = useAuth();
  const [issues, setIssues] = useState<SpecialIssue[]>(() => loadInitialIssues(project.id));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<SpecialIssue | null>(null);
  const [statusFilter, setStatusFilter] = useState<SpecialIssueStatus | 'all'>('all');
  const [galleryImages, setGalleryImages] = useState<string[] | null>(null);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
  const [formData, setFormData] = useState({
    date: getTodayISO(),
    description: '',
    status: 'open' as SpecialIssueStatus,
    priority: 'medium' as SpecialIssuePriority,
    category: 'other' as SpecialIssueCategory,
    responsible: '',
    resolution: '',
    image_urls: [] as string[],
  });

  // Allow actions if user has permission OR if no user (dev mode)
  const canCreate = !user || canCreateSpecialIssue(user, project.id);
  const canEdit = !user || canEditSpecialIssue(user, project.id);
  const canDelete = !user || canDeleteSpecialIssue(user, project.id);

  const loadIssues = useCallback(() => {
    setIssues(loadInitialIssues(project.id));
  }, [project.id]);

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
      priority: 'medium',
      category: 'other',
      responsible: '',
      resolution: '',
      image_urls: [],
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
        priority: issue.priority || 'medium',
        category: issue.category || 'other',
        responsible: issue.responsible || '',
        resolution: issue.resolution || '',
        image_urls: issue.image_urls || [],
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
        priority: formData.priority,
        category: formData.category,
        responsible: formData.responsible.trim() || undefined,
        resolution: formData.resolution.trim() || undefined,
        image_urls: formData.image_urls.length > 0 ? formData.image_urls : undefined,
      });
    } else {
      const newIssue: SpecialIssue = {
        id: `si-${Date.now()}`,
        project_id: project.id,
        date: new Date(formData.date).toISOString(),
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
        category: formData.category,
        responsible: formData.responsible.trim() || undefined,
        resolution: formData.resolution.trim() || undefined,
        image_urls: formData.image_urls.length > 0 ? formData.image_urls : undefined,
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

  const handleAddImageUrl = () => {
    const url = prompt('הכנס קישור לתמונה:');
    if (url && url.trim()) {
      setFormData({ ...formData, image_urls: [...formData.image_urls, url.trim()] });
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData({
      ...formData,
      image_urls: formData.image_urls.filter((_, i) => i !== index),
    });
  };

  const openGallery = (images: string[], index: number = 0) => {
    setGalleryImages(images);
    setGalleryInitialIndex(index);
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
            aria-label="סינון לפי סטטוס"
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
              aria-label="הוסף בעיה מיוחדת חדשה"
            >
              <span className="material-symbols-outlined me-2 text-[20px]" aria-hidden="true">add</span>
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
                <th className="px-4 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  תאריך
                </th>
                <th className="px-4 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  תיאור הבעיה
                </th>
                <th className="px-4 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  קטגוריה
                </th>
                <th className="px-4 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  עדיפות
                </th>
                <th className="px-4 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  אחראי
                </th>
                <th className="px-4 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  סטטוס
                </th>
                <th className="px-4 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  תמונות
                </th>
                <th className="px-4 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  פתרון
                </th>
                {(canEdit || canDelete) && (
                  <th className="px-4 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                    פעולות
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {filteredIssues.length === 0 ? (
                <tr>
                  <td
                    colSpan={canEdit || canDelete ? 9 : 8}
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
                    <td className="px-4 py-4 align-middle font-medium whitespace-nowrap">
                      {formatDateForDisplay(issue.date)}
                    </td>
                    <td className="px-4 py-4 align-middle max-w-[200px]">
                      <p className="line-clamp-2">{issue.description}</p>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      {issue.category && (
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-text-secondary-light dark:text-text-secondary-dark">
                            {categoryIcons[issue.category]}
                          </span>
                          <span className="text-sm">{categoryLabels[issue.category]}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 align-middle">
                      {issue.priority && (
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${priorityColors[issue.priority]}`}
                        >
                          {priorityLabels[issue.priority]}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 align-middle">
                      {issue.responsible ? (
                        <span className="text-sm font-medium">{issue.responsible}</span>
                      ) : (
                        <span className="text-text-secondary-light/50">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${statusColors[issue.status]}`}
                      >
                        {statusLabels[issue.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      {issue.image_urls && issue.image_urls.length > 0 ? (
                        <button
                          onClick={() => openGallery(issue.image_urls!, 0)}
                          className="flex items-center gap-1.5 text-primary hover:text-primary-hover transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">photo_library</span>
                          <span className="text-sm font-medium">{issue.image_urls.length}</span>
                        </button>
                      ) : (
                        <span className="text-text-secondary-light/50">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 align-middle text-text-secondary-light dark:text-text-secondary-dark max-w-[150px]">
                      {issue.resolution ? (
                        <p className="line-clamp-2">{issue.resolution}</p>
                      ) : (
                        <span className="text-text-secondary-light/50">-</span>
                      )}
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="px-4 py-4 align-middle">
                        <div className="flex items-center gap-2 opacity-100 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          {canEdit && (
                            <button
                              onClick={() => handleOpenModal(issue)}
                              className="p-1.5 rounded-lg text-text-secondary-light hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="עריכה"
                              aria-label="ערוך בעיה"
                            >
                              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">edit</span>
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(issue.id)}
                              className="p-1.5 rounded-lg text-text-secondary-light hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="מחיקה"
                              aria-label="מחק בעיה"
                            >
                              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">delete</span>
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${statusColors[issue.status]}`}
                    >
                      {statusLabels[issue.status]}
                    </span>
                    {issue.priority && (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${priorityColors[issue.priority]}`}
                      >
                        {priorityLabels[issue.priority]}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-text-secondary-light font-medium">
                    {formatDateForDisplay(issue.date)}
                  </span>
                </div>

                {issue.category && (
                  <div className="flex items-center gap-1.5 text-text-secondary-light dark:text-text-secondary-dark">
                    <span className="material-symbols-outlined text-[16px]">
                      {categoryIcons[issue.category]}
                    </span>
                    <span className="text-xs">{categoryLabels[issue.category]}</span>
                  </div>
                )}

                <p className="text-sm font-medium">{issue.description}</p>

                {issue.responsible && (
                  <div className="text-sm">
                    <span className="text-text-secondary-light dark:text-text-secondary-dark">
                      אחראי:{' '}
                    </span>
                    <span className="font-medium">{issue.responsible}</span>
                  </div>
                )}

                {issue.image_urls && issue.image_urls.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {issue.image_urls.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => openGallery(issue.image_urls!, idx)}
                        className="size-16 rounded-lg overflow-hidden flex-shrink-0 border border-border-light dark:border-border-dark hover:opacity-80 transition-opacity"
                      >
                        <img src={img} alt={`תמונה ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

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
                        aria-label="ערוך בעיה"
                      >
                        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">edit</span>
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(issue.id)}
                        className="flex items-center justify-center size-8 rounded-full bg-background-light dark:bg-surface-dark border border-border-light text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                        title="מחיקה"
                        aria-label="מחק בעיה"
                      >
                        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">delete</span>
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
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg border border-border-light dark:border-border-dark w-full max-w-lg max-h-[90vh] overflow-y-auto">
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
              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-sm font-bold mb-2">קטגוריה</label>
                  <select
                    className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as SpecialIssueCategory })
                    }
                  >
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">עדיפות</label>
                  <select
                    className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value as SpecialIssuePriority })
                    }
                  >
                    {Object.entries(priorityLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
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
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">אחראי</label>
                <input
                  type="text"
                  className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="שם האחראי לטיפול..."
                  value={formData.responsible}
                  onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                />
              </div>

              {/* Images section */}
              <div>
                <label className="block text-sm font-bold mb-2">תמונות</label>
                {formData.image_urls.length > 0 && (
                  <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                    {formData.image_urls.map((img, idx) => (
                      <div key={idx} className="relative group flex-shrink-0">
                        <img
                          src={img}
                          alt={`תמונה ${idx + 1}`}
                          className="size-20 rounded-lg object-cover border border-border-light dark:border-border-dark"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute -top-2 -right-2 size-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark hover:border-primary hover:text-primary transition-colors text-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
                  הוסף תמונה (קישור)
                </button>
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

      {/* Image Gallery Modal */}
      {galleryImages && (
        <ImageGalleryModal
          images={galleryImages}
          initialIndex={galleryInitialIndex}
          onClose={() => setGalleryImages(null)}
        />
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
