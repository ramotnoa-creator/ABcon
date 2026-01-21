import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  getPlanningChanges,
  createPlanningChange,
  updatePlanningChange,
  deletePlanningChange,
} from '../../../services/planningChangesService';
import { savePlanningChanges } from '../../../data/planningChangesStorage';
import { seedPlanningChanges } from '../../../data/planningChangesData';
import { useAuth } from '../../../contexts/AuthContext';
import {
  canCreatePlanningChange,
  canEditPlanningChange,
  canDeletePlanningChange,
} from '../../../utils/permissions';
import type { Project, PlanningChange, PlanningChangeDecision } from '../../../types';
import { formatDateForDisplay } from '../../../utils/dateUtils';

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
                className={`flex-shrink-0 size-16 rounded-lg overflow-hidden border-2 transition-all ${
                  idx === currentIndex ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

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
  if (amount === undefined || amount === null) return '';
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const loadInitialChanges = async (projectId: string): Promise<PlanningChange[]> => {
  let loaded = await getPlanningChanges(projectId);

  if (loaded.length === 0) {
    const projectChanges = seedPlanningChanges.filter((pc) => pc.project_id === projectId);
    if (projectChanges.length > 0) {
      savePlanningChanges([...loaded, ...projectChanges]);
      loaded = projectChanges;
    }
  }

  return loaded;
};

export default function PlanningChangesTab({ project }: PlanningChangesTabProps) {
  const { user } = useAuth();
  const [changes, setChanges] = useState<PlanningChange[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [decisionFilter, setDecisionFilter] = useState<PlanningChangeDecision | 'all'>('all');

  // Image gallery state
  const [galleryImages, setGalleryImages] = useState<string[] | null>(null);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);

  // Form state for inline editing
  const [editFormData, setEditFormData] = useState({
    description: '',
    schedule_impact: '',
    budget_impact: '',
    decision: 'pending' as PlanningChangeDecision,
    image_urls: [] as string[],
  });

  // Form state for new change modal
  const [newFormData, setNewFormData] = useState({
    description: '',
    schedule_impact: '',
    budget_impact: '',
    decision: 'pending' as PlanningChangeDecision,
    image_urls: [] as string[],
  });

  const canCreate = !user || canCreatePlanningChange(user, project.id);
  const canEdit = !user || canEditPlanningChange(user, project.id);
  const canDelete = !user || canDeletePlanningChange(user, project.id);

  const loadChanges = useCallback(async () => {
    try {
      setIsLoading(true);
      const loaded = await loadInitialChanges(project.id);
      setChanges(loaded);
    } catch (error) {
      console.error('Error loading planning changes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    loadChanges();
  }, [loadChanges]);

  // Sort: pending first, then in_progress, then approved at bottom
  const sortedAndFilteredChanges = useMemo(() => {
    let filtered = decisionFilter === 'all' ? changes : changes.filter((c) => c.decision === decisionFilter);

    // Separate by decision status
    const pending = filtered.filter(c => c.decision === 'pending');
    const rejected = filtered.filter(c => c.decision === 'rejected');
    const approved = filtered.filter(c => c.decision === 'approved');

    // Sort each group by change_number descending
    pending.sort((a, b) => b.change_number - a.change_number);
    rejected.sort((a, b) => b.change_number - a.change_number);
    approved.sort((a, b) => b.change_number - a.change_number);

    return [...pending, ...rejected, ...approved];
  }, [changes, decisionFilter]);

  const pendingCount = useMemo(() => {
    return changes.filter((c) => c.decision === 'pending').length;
  }, [changes]);

  const startEditing = (change: PlanningChange) => {
    setEditingId(change.id);
    setEditFormData({
      description: change.description,
      schedule_impact: change.schedule_impact || '',
      budget_impact: change.budget_impact?.toString() || '',
      decision: change.decision,
      image_urls: change.image_urls || [],
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveEditing = async () => {
    if (!editingId || !editFormData.description.trim()) return;

    const budgetImpact = editFormData.budget_impact.trim()
      ? parseFloat(editFormData.budget_impact)
      : undefined;

    try {
      await updatePlanningChange(editingId, {
        description: editFormData.description.trim(),
        schedule_impact: editFormData.schedule_impact.trim() || undefined,
        budget_impact: isNaN(budgetImpact as number) ? undefined : budgetImpact,
        decision: editFormData.decision,
        image_urls: editFormData.image_urls.length > 0 ? editFormData.image_urls : undefined,
      });

      await loadChanges();
      setEditingId(null);
    } catch (error) {
      console.error('Error updating planning change:', error);
    }
  };

  const handleAddNew = async () => {
    if (!newFormData.description.trim()) return;

    const budgetImpact = newFormData.budget_impact.trim()
      ? parseFloat(newFormData.budget_impact)
      : undefined;

    try {
      await createPlanningChange({
        project_id: project.id,
        description: newFormData.description.trim(),
        schedule_impact: newFormData.schedule_impact.trim() || undefined,
        budget_impact: isNaN(budgetImpact as number) ? undefined : budgetImpact,
        decision: newFormData.decision,
        image_urls: newFormData.image_urls.length > 0 ? newFormData.image_urls : undefined,
        created_by: user?.id,
      });

      await loadChanges();
      setIsAddModalOpen(false);
      setNewFormData({
        description: '',
        schedule_impact: '',
        budget_impact: '',
        decision: 'pending',
        image_urls: [],
      });
    } catch (error) {
      console.error('Error creating planning change:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק שינוי זה?')) return;
    try {
      await deletePlanningChange(id);
      await loadChanges();
    } catch (error) {
      console.error('Error deleting planning change:', error);
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold">שינויים בתכנון</h3>
          {pendingCount > 0 && (
            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
              {pendingCount} ממתינים
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            className="h-10 px-3 rounded-lg bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
            value={decisionFilter}
            onChange={(e) => setDecisionFilter(e.target.value as PlanningChangeDecision | 'all')}
          >
            <option value="all">כל ההחלטות</option>
            <option value="pending">ממתין להחלטה</option>
            <option value="approved">אושר</option>
            <option value="rejected">נדחה</option>
          </select>
          {canCreate && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center justify-center h-10 px-5 rounded-lg bg-primary text-white hover:bg-primary-hover transition text-sm font-bold"
            >
              <span className="material-symbols-outlined me-2 text-[20px]">add</span>
              הוסף שינוי
            </button>
          )}
        </div>
      </div>

      {/* Changes List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : sortedAndFilteredChanges.length === 0 ? (
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-12 text-center text-text-secondary-light dark:text-text-secondary-dark border border-border-light dark:border-border-dark">
            אין שינויים בתכנון
          </div>
        ) : (
          sortedAndFilteredChanges.map((change) => {
            const isEditing = editingId === change.id;
            const isApproved = change.decision === 'approved';

            return (
              <div
                key={change.id}
                className={`rounded-xl border overflow-hidden transition-all ${
                  isApproved
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
                          <span className="inline-flex items-center justify-center size-7 rounded-full bg-primary/10 text-primary font-bold text-sm">
                            {change.change_number}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${decisionColors[change.decision]}`}>
                            {decisionLabels[change.decision]}
                          </span>
                          <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                            {formatDateForDisplay(change.created_at)}
                          </span>
                        </div>

                        <p className="font-medium mb-2">{change.description}</p>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                          {change.schedule_impact && (
                            <span>
                              <span className="material-symbols-outlined text-[14px] align-middle me-1">schedule</span>
                              {change.schedule_impact}
                            </span>
                          )}
                          {change.budget_impact !== undefined && change.budget_impact !== null && (
                            <span>
                              <span className="material-symbols-outlined text-[14px] align-middle me-1">payments</span>
                              {formatCurrency(change.budget_impact)}
                            </span>
                          )}
                          {change.image_urls && change.image_urls.length > 0 && (
                            <button
                              onClick={() => openGallery(change.image_urls!, 0)}
                              className="flex items-center gap-1 text-primary hover:text-primary-hover"
                            >
                              <span className="material-symbols-outlined text-[16px]">photo_library</span>
                              {change.image_urls.length} תמונות
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Right side - actions */}
                      {(canEdit || canDelete) && (
                        <div className="flex items-center gap-2">
                          {canEdit && (
                            <button
                              onClick={() => startEditing(change)}
                              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary-light hover:text-primary transition-colors"
                              title="עריכה"
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(change.id)}
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
                    <div>
                      <label className="block text-xs font-bold mb-1">תיאור השינוי</label>
                      <textarea
                        className="w-full p-2 rounded-lg bg-white dark:bg-gray-900 border border-border-light dark:border-border-dark text-sm resize-none h-20"
                        value={editFormData.description}
                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold mb-1">השפעה על לו"ז</label>
                        <input
                          type="text"
                          className="w-full h-9 px-2 rounded-lg bg-white dark:bg-gray-900 border border-border-light dark:border-border-dark text-sm"
                          placeholder="לדוגמה: עיכוב של 2 שבועות"
                          value={editFormData.schedule_impact}
                          onChange={(e) => setEditFormData({ ...editFormData, schedule_impact: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1">השפעה על תקציב (₪)</label>
                        <input
                          type="number"
                          className="w-full h-9 px-2 rounded-lg bg-white dark:bg-gray-900 border border-border-light dark:border-border-dark text-sm"
                          placeholder="סכום בשקלים"
                          value={editFormData.budget_impact}
                          onChange={(e) => setEditFormData({ ...editFormData, budget_impact: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1">החלטה</label>
                        <select
                          className="w-full h-9 px-2 rounded-lg bg-white dark:bg-gray-900 border border-border-light dark:border-border-dark text-sm"
                          value={editFormData.decision}
                          onChange={(e) => setEditFormData({ ...editFormData, decision: e.target.value as PlanningChangeDecision })}
                        >
                          <option value="pending">ממתין להחלטה</option>
                          <option value="approved">אושר</option>
                          <option value="rejected">נדחה</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1">תמונות</label>
                      <div className="flex items-center gap-2 flex-wrap">
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

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={cancelEditing}
                        className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        ביטול
                      </button>
                      <button
                        onClick={saveEditing}
                        disabled={!editFormData.description.trim()}
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

      {/* Add New Change Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg border border-border-light dark:border-border-dark w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
              <h3 className="text-lg font-bold">הוספת שינוי חדש</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="size-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">תיאור השינוי *</label>
                <textarea
                  className="w-full p-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm resize-none h-24"
                  placeholder="תאר את השינוי..."
                  value={newFormData.description}
                  onChange={(e) => setNewFormData({ ...newFormData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">השפעה על לו"ז</label>
                  <input
                    type="text"
                    className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm"
                    placeholder="לדוגמה: עיכוב של 2 שבועות"
                    value={newFormData.schedule_impact}
                    onChange={(e) => setNewFormData({ ...newFormData, schedule_impact: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">השפעה על תקציב (₪)</label>
                  <input
                    type="number"
                    className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm"
                    placeholder="סכום בשקלים"
                    value={newFormData.budget_impact}
                    onChange={(e) => setNewFormData({ ...newFormData, budget_impact: e.target.value })}
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
                  disabled={!newFormData.description.trim()}
                  className="px-4 py-2 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  הוסף שינוי
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
            הוסף שינוי
          </button>
        </div>
      )}
    </div>
  );
}
