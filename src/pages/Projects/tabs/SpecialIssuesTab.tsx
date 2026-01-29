import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  getSpecialIssues,
  createSpecialIssue,
  updateSpecialIssue,
  deleteSpecialIssue,
} from '../../../services/specialIssuesService';
import { saveSpecialIssues } from '../../../data/specialIssuesStorage';
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

const loadInitialIssues = async (projectId: string): Promise<SpecialIssue[]> => {
  let loaded = await getSpecialIssues(projectId);

  if (loaded.length === 0) {
    const projectIssues = seedSpecialIssues.filter((si) => si.project_id === projectId);
    if (projectIssues.length > 0) {
      saveSpecialIssues([...loaded, ...projectIssues]);
      loaded = projectIssues;
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
  const [issues, setIssues] = useState<SpecialIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<SpecialIssueStatus | 'all'>('all');
  const [galleryImages, setGalleryImages] = useState<string[] | null>(null);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);

  // Form state for inline editing
  const [editFormData, setEditFormData] = useState({
    date: '',
    description: '',
    status: 'open' as SpecialIssueStatus,
    priority: 'medium' as SpecialIssuePriority,
    category: 'other' as SpecialIssueCategory,
    responsible: '',
    resolution: '',
    image_urls: [] as string[],
  });

  // Form state for new issue modal
  const [newFormData, setNewFormData] = useState({
    date: getTodayISO(),
    description: '',
    status: 'open' as SpecialIssueStatus,
    priority: 'medium' as SpecialIssuePriority,
    category: 'other' as SpecialIssueCategory,
    responsible: '',
    resolution: '',
    image_urls: [] as string[],
  });

  const canCreate = !user || canCreateSpecialIssue(user, project.id);
  const canEdit = !user || canEditSpecialIssue(user, project.id);
  const canDelete = !user || canDeleteSpecialIssue(user, project.id);

  const loadIssues = useCallback(async () => {
    try {
      setIsLoading(true);
      const loaded = await loadInitialIssues(project.id);
      setIssues(loaded);
    } catch (error) {
      console.error('Error loading special issues:', error);
    } finally {
      setIsLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  // Sort: non-resolved first (by date desc), then resolved at the bottom (by date desc)
  const sortedAndFilteredIssues = useMemo(() => {
    const filtered = statusFilter === 'all' ? issues : issues.filter((issue) => issue.status === statusFilter);

    // Separate resolved and non-resolved
    const nonResolved = filtered.filter(i => i.status !== 'resolved');
    const resolved = filtered.filter(i => i.status === 'resolved');

    // Sort each group by date descending
    nonResolved.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    resolved.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return [...nonResolved, ...resolved];
  }, [issues, statusFilter]);

  const openIssuesCount = useMemo(() => {
    return issues.filter((issue) => issue.status === 'open').length;
  }, [issues]);

  const startEditing = (issue: SpecialIssue) => {
    setEditingId(issue.id);
    setEditFormData({
      date: formatDateForInput(issue.date),
      description: issue.description,
      status: issue.status,
      priority: issue.priority || 'medium',
      category: issue.category || 'other',
      responsible: issue.responsible || '',
      resolution: issue.resolution || '',
      image_urls: issue.image_urls || [],
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveEditing = async () => {
    if (!editingId || !editFormData.description.trim() || !editFormData.date) return;

    try {
      await updateSpecialIssue(editingId, {
        date: new Date(editFormData.date).toISOString(),
        description: editFormData.description.trim(),
        status: editFormData.status,
        priority: editFormData.priority,
        category: editFormData.category,
        responsible: editFormData.responsible.trim() || undefined,
        resolution: editFormData.resolution.trim() || undefined,
        image_urls: editFormData.image_urls.length > 0 ? editFormData.image_urls : undefined,
      });

      await loadIssues();
      setEditingId(null);
    } catch (error) {
      console.error('Error updating special issue:', error);
    }
  };

  const handleAddNew = async () => {
    if (!newFormData.description.trim() || !newFormData.date) return;

    try {
      await createSpecialIssue({
        project_id: project.id,
        date: new Date(newFormData.date).toISOString(),
        description: newFormData.description.trim(),
        status: newFormData.status,
        priority: newFormData.priority,
        category: newFormData.category,
        responsible: newFormData.responsible.trim() || undefined,
        resolution: newFormData.resolution.trim() || undefined,
        image_urls: newFormData.image_urls.length > 0 ? newFormData.image_urls : undefined,
        created_by: user?.id,
      });

      await loadIssues();
      setIsAddModalOpen(false);
      setNewFormData({
        date: getTodayISO(),
        description: '',
        status: 'open',
        priority: 'medium',
        category: 'other',
        responsible: '',
        resolution: '',
        image_urls: [],
      });
    } catch (error) {
      console.error('Error creating special issue:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק בעיה זו?')) return;
    try {
      await deleteSpecialIssue(id);
      await loadIssues();
    } catch (error) {
      console.error('Error deleting special issue:', error);
    }
  };

  const handleAddImageUrl = (isEdit: boolean) => {
    const url = prompt('הכנס קישור לתמונה:');
    if (url && url.trim()) {
      if (isEdit) {
        setEditFormData({ ...editFormData, image_urls: [...editFormData.image_urls, url.trim()] });
      } else {
        setNewFormData({ ...newFormData, image_urls: [...newFormData.image_urls, url.trim()] });
      }
    }
  };

  const handleRemoveImage = (index: number, isEdit: boolean) => {
    if (isEdit) {
      setEditFormData({
        ...editFormData,
        image_urls: editFormData.image_urls.filter((_, i) => i !== index),
      });
    } else {
      setNewFormData({
        ...newFormData,
        image_urls: newFormData.image_urls.filter((_, i) => i !== index),
      });
    }
  };

  const openGallery = (images: string[], index: number = 0) => {
    setGalleryImages(images);
    setGalleryInitialIndex(index);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        {openIssuesCount > 0 && (
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">
            {openIssuesCount} פתוחות
          </span>
        )}
        <div className="flex items-center gap-3 flex-1 justify-end">
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
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center justify-center h-10 px-5 rounded-lg bg-primary text-white hover:bg-primary-hover transition text-sm font-bold"
            >
              <span className="material-symbols-outlined me-2 text-[20px]">add</span>
              הוסף בעיה
            </button>
          )}
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : sortedAndFilteredIssues.length === 0 ? (
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-12 text-center text-text-secondary-light dark:text-text-secondary-dark border border-border-light dark:border-border-dark">
            אין בעיות מיוחדות
          </div>
        ) : (
          sortedAndFilteredIssues.map((issue) => {
            const isEditing = editingId === issue.id;
            const isResolved = issue.status === 'resolved';

            return (
              <div
                key={issue.id}
                className={`rounded-xl border overflow-hidden transition-all ${
                  isResolved
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark'
                }`}
              >
                {/* Display Row */}
                {!isEditing && (
                  <div className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      {/* Left side - main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${statusColors[issue.status]}`}>
                            {statusLabels[issue.status]}
                          </span>
                          {issue.priority && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${priorityColors[issue.priority]}`}>
                              {priorityLabels[issue.priority]}
                            </span>
                          )}
                          {issue.category && (
                            <span className="inline-flex items-center gap-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                              <span className="material-symbols-outlined text-[14px]">{categoryIcons[issue.category]}</span>
                              {categoryLabels[issue.category]}
                            </span>
                          )}
                          <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                            {formatDateForDisplay(issue.date)}
                          </span>
                        </div>

                        <p className="font-medium mb-2">{issue.description}</p>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                          {issue.responsible && (
                            <span>אחראי: <span className="font-medium text-text-main-light dark:text-text-main-dark">{issue.responsible}</span></span>
                          )}
                          {issue.image_urls && issue.image_urls.length > 0 && (
                            <button
                              onClick={() => openGallery(issue.image_urls!, 0)}
                              className="flex items-center gap-1 text-primary hover:text-primary-hover"
                            >
                              <span className="material-symbols-outlined text-[16px]">photo_library</span>
                              {issue.image_urls.length} תמונות
                            </button>
                          )}
                        </div>

                        {issue.resolution && (
                          <div className="mt-3 p-3 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
                            <p className="text-xs font-bold text-green-800 dark:text-green-200 mb-1">פתרון:</p>
                            <p className="text-sm text-green-900 dark:text-green-100">{issue.resolution}</p>
                          </div>
                        )}
                      </div>

                      {/* Right side - actions */}
                      {(canEdit || canDelete) && (
                        <div className="flex items-center gap-2">
                          {canEdit && (
                            <button
                              onClick={() => startEditing(issue)}
                              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary-light hover:text-primary transition-colors"
                              title="עריכה"
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(issue.id)}
                              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-text-secondary-light hover:text-red-600 transition-colors"
                              title="מחיקה"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Inline Edit Form */}
                {isEditing && (
                  <div className="p-4 space-y-4 bg-blue-50 dark:bg-blue-900/20">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-bold mb-1">תאריך</label>
                        <input
                          type="date"
                          className="w-full h-9 px-2 rounded-lg bg-white dark:bg-gray-900 border border-border-light dark:border-border-dark text-sm"
                          value={editFormData.date}
                          onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1">קטגוריה</label>
                        <select
                          className="w-full h-9 px-2 rounded-lg bg-white dark:bg-gray-900 border border-border-light dark:border-border-dark text-sm"
                          value={editFormData.category}
                          onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value as SpecialIssueCategory })}
                        >
                          {Object.entries(categoryLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1">עדיפות</label>
                        <select
                          className="w-full h-9 px-2 rounded-lg bg-white dark:bg-gray-900 border border-border-light dark:border-border-dark text-sm"
                          value={editFormData.priority}
                          onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value as SpecialIssuePriority })}
                        >
                          {Object.entries(priorityLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1">סטטוס</label>
                        <select
                          className="w-full h-9 px-2 rounded-lg bg-white dark:bg-gray-900 border border-border-light dark:border-border-dark text-sm"
                          value={editFormData.status}
                          onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as SpecialIssueStatus })}
                        >
                          <option value="open">פתוח</option>
                          <option value="in_progress">בטיפול</option>
                          <option value="resolved">נפתר</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1">תיאור הבעיה</label>
                      <textarea
                        className="w-full p-2 rounded-lg bg-white dark:bg-gray-900 border border-border-light dark:border-border-dark text-sm resize-none h-20"
                        value={editFormData.description}
                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold mb-1">אחראי</label>
                        <input
                          type="text"
                          className="w-full h-9 px-2 rounded-lg bg-white dark:bg-gray-900 border border-border-light dark:border-border-dark text-sm"
                          placeholder="שם האחראי..."
                          value={editFormData.responsible}
                          onChange={(e) => setEditFormData({ ...editFormData, responsible: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1">תמונות</label>
                        <div className="flex items-center gap-2">
                          {editFormData.image_urls.length > 0 && (
                            <div className="flex gap-1">
                              {editFormData.image_urls.map((img, idx) => (
                                <div key={idx} className="relative group">
                                  <img src={img} alt="" className="size-9 rounded object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveImage(idx, true)}
                                    className="absolute -top-1 -right-1 size-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 text-[10px]"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => handleAddImageUrl(true)}
                            className="h-9 px-2 rounded-lg border border-dashed border-border-light dark:border-border-dark text-text-secondary-light hover:border-primary hover:text-primary text-xs"
                          >
                            + תמונה
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1">פתרון</label>
                      <textarea
                        className="w-full p-2 rounded-lg bg-white dark:bg-gray-900 border border-border-light dark:border-border-dark text-sm resize-none h-20"
                        placeholder="תאר את הפתרון..."
                        value={editFormData.resolution}
                        onChange={(e) => setEditFormData({ ...editFormData, resolution: e.target.value })}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={cancelEditing}
                        className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        ביטול
                      </button>
                      <button
                        onClick={saveEditing}
                        disabled={!editFormData.description.trim() || !editFormData.date}
                        className="px-4 py-2 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors disabled:opacity-50"
                      >
                        שמור
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add New Issue Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg border border-border-light dark:border-border-dark w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
              <h3 className="text-lg font-bold">הוספת בעיה חדשה</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="size-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">תאריך *</label>
                  <input
                    type="date"
                    className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm"
                    value={newFormData.date}
                    onChange={(e) => setNewFormData({ ...newFormData, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">קטגוריה</label>
                  <select
                    className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm"
                    value={newFormData.category}
                    onChange={(e) => setNewFormData({ ...newFormData, category: e.target.value as SpecialIssueCategory })}
                  >
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">תיאור הבעיה *</label>
                <textarea
                  className="w-full p-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm resize-none h-24"
                  placeholder="תאר את הבעיה..."
                  value={newFormData.description}
                  onChange={(e) => setNewFormData({ ...newFormData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">עדיפות</label>
                  <select
                    className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm"
                    value={newFormData.priority}
                    onChange={(e) => setNewFormData({ ...newFormData, priority: e.target.value as SpecialIssuePriority })}
                  >
                    {Object.entries(priorityLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">אחראי</label>
                  <input
                    type="text"
                    className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm"
                    placeholder="שם האחראי..."
                    value={newFormData.responsible}
                    onChange={(e) => setNewFormData({ ...newFormData, responsible: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">תמונות</label>
                {newFormData.image_urls.length > 0 && (
                  <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
                    {newFormData.image_urls.map((img, idx) => (
                      <div key={idx} className="relative group flex-shrink-0">
                        <img src={img} alt="" className="size-16 rounded-lg object-cover border" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx, false)}
                          className="absolute -top-2 -right-2 size-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleAddImageUrl(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border-light dark:border-border-dark text-text-secondary-light hover:border-primary hover:text-primary text-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
                  הוסף תמונה
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-300 transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={handleAddNew}
                  disabled={!newFormData.description.trim() || !newFormData.date}
                  className="px-4 py-2 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  הוסף בעיה
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

      {/* Mobile Footer */}
      {canCreate && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark md:hidden z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full flex items-center justify-center h-12 px-4 rounded-lg bg-primary text-white font-bold text-sm shadow-md hover:bg-primary-hover transition-colors"
          >
            <span className="material-symbols-outlined me-2 text-[20px]">add</span>
            הוסף בעיה
          </button>
        </div>
      )}
    </div>
  );
}
