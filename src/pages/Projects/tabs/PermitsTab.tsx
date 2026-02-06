import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  loadInitialPermits,
  createPermit,
  updatePermit,
  deletePermit,
} from '../../../services/permitsService';
import type { Project, Permit, PermitType, PermitStatus } from '../../../types';

interface PermitsTabProps {
  project: Project;
}

const permitTypeLabels: Record<PermitType, string> = {
  building: 'היתר בנייה',
  fire: 'כיבוי אש',
  electricity: 'חשמל',
  water: 'מים וביוב',
  form4: 'טופס 4',
  municipality: 'עירייה',
  environment: 'איכות סביבה',
  other: 'אחר',
};

const permitTypeIcons: Record<PermitType, string> = {
  building: 'apartment',
  fire: 'local_fire_department',
  electricity: 'bolt',
  water: 'water_drop',
  form4: 'description',
  municipality: 'account_balance',
  environment: 'eco',
  other: 'more_horiz',
};

const permitStatusLabels: Record<PermitStatus, string> = {
  not_submitted: 'טרם הוגש',
  submitted: 'הוגש',
  in_review: 'בבדיקה',
  approved: 'אושר',
  rejected: 'נדחה',
  expired: 'פג תוקף',
};

const permitStatusColors: Record<PermitStatus, string> = {
  not_submitted: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
  in_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
  expired: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
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

const isNearExpiry = (expiryDate: string): boolean => {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > 0 && diffDays <= 90;
};

const isExpired = (expiryDate: string): boolean => {
  return new Date(expiryDate) < new Date();
};

export default function PermitsTab({ project }: PermitsTabProps) {
  const [permits, setPermits] = useState<Permit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<PermitStatus | 'all'>('all');

  // Form state for inline editing
  const [editFormData, setEditFormData] = useState({
    permit_type: 'building' as PermitType,
    permit_name: '',
    authority: '',
    application_reference: '',
    application_date: '',
    approval_date: '',
    expiry_date: '',
    permit_number: '',
    status: 'not_submitted' as PermitStatus,
    notes: '',
  });

  // Form state for new permit
  const [newFormData, setNewFormData] = useState({
    permit_type: 'building' as PermitType,
    permit_name: '',
    authority: '',
    application_reference: '',
    application_date: '',
    status: 'not_submitted' as PermitStatus,
    notes: '',
  });

  const loadPermits = useCallback(async () => {
    try {
      setIsLoading(true);
      const loaded = await loadInitialPermits(project.id);
      setPermits(loaded);
    } catch (error) {
      console.error('Error loading permits:', error);
    } finally {
      setIsLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    loadPermits();
  }, [loadPermits]);

  // Filter permits
  const filteredPermits = useMemo(() => {
    return statusFilter === 'all'
      ? permits
      : permits.filter((p) => p.status === statusFilter);
  }, [permits, statusFilter]);

  // Status summary
  const statusSummary = useMemo(() => {
    const counts: Partial<Record<PermitStatus, number>> = {};
    for (const p of permits) {
      counts[p.status] = (counts[p.status] || 0) + 1;
    }
    return counts;
  }, [permits]);

  const startEditing = (permit: Permit) => {
    setEditingId(permit.id);
    setEditFormData({
      permit_type: permit.permit_type,
      permit_name: permit.permit_name,
      authority: permit.authority || '',
      application_reference: permit.application_reference || '',
      application_date: permit.application_date ? formatDateForInput(permit.application_date) : '',
      approval_date: permit.approval_date ? formatDateForInput(permit.approval_date) : '',
      expiry_date: permit.expiry_date ? formatDateForInput(permit.expiry_date) : '',
      permit_number: permit.permit_number || '',
      status: permit.status,
      notes: permit.notes || '',
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveEditing = async () => {
    if (!editingId || !editFormData.permit_name.trim()) return;

    try {
      await updatePermit(editingId, {
        permit_type: editFormData.permit_type,
        permit_name: editFormData.permit_name.trim(),
        authority: editFormData.authority.trim() || undefined,
        application_reference: editFormData.application_reference.trim() || undefined,
        application_date: editFormData.application_date ? new Date(editFormData.application_date).toISOString() : undefined,
        approval_date: editFormData.approval_date ? new Date(editFormData.approval_date).toISOString() : undefined,
        expiry_date: editFormData.expiry_date ? new Date(editFormData.expiry_date).toISOString() : undefined,
        permit_number: editFormData.permit_number.trim() || undefined,
        status: editFormData.status,
        notes: editFormData.notes.trim() || undefined,
      });

      await loadPermits();
      setEditingId(null);
    } catch (error) {
      console.error('Error updating permit:', error);
    }
  };

  const handleAddNew = async () => {
    if (!newFormData.permit_name.trim()) return;

    try {
      await createPermit({
        project_id: project.id,
        permit_type: newFormData.permit_type,
        permit_name: newFormData.permit_name.trim(),
        authority: newFormData.authority.trim() || undefined,
        application_reference: newFormData.application_reference.trim() || undefined,
        application_date: newFormData.application_date ? new Date(newFormData.application_date).toISOString() : undefined,
        status: newFormData.status,
        notes: newFormData.notes.trim() || undefined,
      });

      await loadPermits();
      setIsAddModalOpen(false);
      setNewFormData({
        permit_type: 'building',
        permit_name: '',
        authority: '',
        application_reference: '',
        application_date: '',
        status: 'not_submitted',
        notes: '',
      });
    } catch (error) {
      console.error('Error creating permit:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק היתר זה?')) return;
    try {
      await deletePermit(id);
      await loadPermits();
    } catch (error) {
      console.error('Error deleting permit:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        {/* Status summary chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(statusSummary).map(([status, count]) => (
            <span
              key={status}
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${permitStatusColors[status as PermitStatus]}`}
            >
              {count} {permitStatusLabels[status as PermitStatus]}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <select
            className="h-10 px-3 rounded-lg bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PermitStatus | 'all')}
          >
            <option value="all">כל הסטטוסים</option>
            {Object.entries(permitStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center h-10 px-5 rounded-lg bg-primary text-white hover:bg-primary-hover transition text-sm font-bold"
          >
            <span className="material-symbols-outlined me-2 text-[20px]">add</span>
            הוסף היתר
          </button>
        </div>
      </div>

      {/* Permits List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredPermits.length === 0 ? (
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-12 text-center border border-border-light dark:border-border-dark">
            <span className="material-symbols-outlined text-[48px] text-text-secondary-light dark:text-text-secondary-dark opacity-40 mb-3 block">
              gavel
            </span>
            <p className="text-text-secondary-light dark:text-text-secondary-dark font-medium">
              {permits.length === 0 ? 'אין היתרים עדיין' : 'לא נמצאו היתרים מתאימים'}
            </p>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
              {permits.length === 0 ? 'לחץ על "הוסף היתר" כדי להתחיל' : 'נסה לשנות את הפילטר'}
            </p>
          </div>
        ) : (
          filteredPermits.map((permit) => {
            const isEditing = editingId === permit.id;

            return (
              <div
                key={permit.id}
                className={`rounded-xl border overflow-hidden transition-all ${
                  permit.status === 'approved'
                    ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                    : permit.status === 'rejected'
                    ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                    : permit.status === 'expired'
                    ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800'
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
                          {/* Type icon + name */}
                          <span className="material-symbols-outlined text-[20px] text-text-secondary-light dark:text-text-secondary-dark">
                            {permitTypeIcons[permit.permit_type]}
                          </span>
                          <span className="text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wide">
                            {permitTypeLabels[permit.permit_type]}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${permitStatusColors[permit.status]}`}>
                            {permitStatusLabels[permit.status]}
                          </span>
                          {/* Expiry warning */}
                          {permit.expiry_date && permit.status === 'approved' && isNearExpiry(permit.expiry_date) && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                              <span className="material-symbols-outlined text-[14px]">warning</span>
                              פג תוקף בקרוב
                            </span>
                          )}
                          {permit.expiry_date && isExpired(permit.expiry_date) && permit.status !== 'expired' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">
                              <span className="material-symbols-outlined text-[14px]">error</span>
                              פג תוקף
                            </span>
                          )}
                        </div>

                        <p className="font-bold text-text-main-light dark:text-text-main-dark mb-2">
                          {permit.permit_name}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                          {permit.authority && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">business</span>
                              {permit.authority}
                            </span>
                          )}
                          {permit.application_date && (
                            <span>
                              הגשה: <span className="font-medium text-text-main-light dark:text-text-main-dark">{formatDateForDisplay(permit.application_date)}</span>
                            </span>
                          )}
                          {permit.approval_date ? (
                            <span>
                              אישור: <span className="font-medium text-green-700 dark:text-green-400">{formatDateForDisplay(permit.approval_date)}</span>
                            </span>
                          ) : permit.status !== 'not_submitted' && permit.status !== 'rejected' ? (
                            <span className="text-amber-600 dark:text-amber-400 italic">ממתין לאישור</span>
                          ) : null}
                          {permit.permit_number && (
                            <span>
                              מס׳ היתר: <span className="font-mono font-bold text-text-main-light dark:text-text-main-dark">{permit.permit_number}</span>
                            </span>
                          )}
                          {permit.expiry_date && (
                            <span>
                              תוקף עד: <span className={`font-medium ${
                                isExpired(permit.expiry_date) ? 'text-red-600 dark:text-red-400' :
                                isNearExpiry(permit.expiry_date) ? 'text-amber-600 dark:text-amber-400' :
                                'text-text-main-light dark:text-text-main-dark'
                              }`}>{formatDateForDisplay(permit.expiry_date)}</span>
                            </span>
                          )}
                          {permit.application_reference && (
                            <span className="text-xs">
                              מס׳ בקשה: <span className="font-mono">{permit.application_reference}</span>
                            </span>
                          )}
                        </div>

                        {permit.notes && (
                          <p className="mt-2 text-sm text-text-secondary-light dark:text-text-secondary-dark italic">
                            {permit.notes}
                          </p>
                        )}
                      </div>

                      {/* Right side - actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEditing(permit)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary-light hover:text-primary transition-colors"
                          title="עריכה"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(permit.id)}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-text-secondary-light hover:text-red-600 transition-colors"
                          title="מחיקה"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Inline Edit Form */}
                {isEditing && (
                  <div className="p-4 space-y-4 bg-blue-50 dark:bg-blue-900/20">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-bold mb-1">סוג היתר</label>
                        <select
                          className="w-full h-9 px-2 rounded-lg bg-white dark:bg-gray-900 border border-border-light dark:border-border-dark text-sm"
                          value={editFormData.permit_type}
                          onChange={(e) => setEditFormData({ ...editFormData, permit_type: e.target.value as PermitType })}
                        >
                          {Object.entries(permitTypeLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1">סטטוס</label>
                        <select
                          className="w-full h-9 px-2 rounded-lg bg-white dark:bg-gray-900 border border-border-light dark:border-border-dark text-sm"
                          value={editFormData.status}
                          onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as PermitStatus })}
                        >
                          {Object.entries(permitStatusLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1">תאריך הגשה</label>
                        <input
                          type="date"
                          className="w-full h-9 px-2 rounded-lg bg-white dark:bg-gray-900 border border-border-light dark:border-border-dark text-sm"
                          value={editFormData.application_date}
                          onChange={(e) => setEditFormData({ ...editFormData, application_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1">תאריך אישור</label>
                        <input
                          type="date"
                          className="w-full h-9 px-2 rounded-lg bg-white dark:bg-gray-900 border border-border-light dark:border-border-dark text-sm"
                          value={editFormData.approval_date}
                          onChange={(e) => setEditFormData({ ...editFormData, approval_date: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold mb-1">שם ההיתר *</label>
                        <input
                          type="text"
                          className="w-full h-9 px-2 rounded-lg bg-white dark:bg-gray-900 border border-border-light dark:border-border-dark text-sm"
                          value={editFormData.permit_name}
                          onChange={(e) => setEditFormData({ ...editFormData, permit_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1">רשות מאשרת</label>
                        <input
                          type="text"
                          className="w-full h-9 px-2 rounded-lg bg-white dark:bg-gray-900 border border-border-light dark:border-border-dark text-sm"
                          value={editFormData.authority}
                          onChange={(e) => setEditFormData({ ...editFormData, authority: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-bold mb-1">מספר בקשה</label>
                        <input
                          type="text"
                          className="w-full h-9 px-2 rounded-lg bg-white dark:bg-gray-900 border border-border-light dark:border-border-dark text-sm"
                          value={editFormData.application_reference}
                          onChange={(e) => setEditFormData({ ...editFormData, application_reference: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1">מספר היתר</label>
                        <input
                          type="text"
                          className="w-full h-9 px-2 rounded-lg bg-white dark:bg-gray-900 border border-border-light dark:border-border-dark text-sm"
                          value={editFormData.permit_number}
                          onChange={(e) => setEditFormData({ ...editFormData, permit_number: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1">תוקף עד</label>
                        <input
                          type="date"
                          className="w-full h-9 px-2 rounded-lg bg-white dark:bg-gray-900 border border-border-light dark:border-border-dark text-sm"
                          value={editFormData.expiry_date}
                          onChange={(e) => setEditFormData({ ...editFormData, expiry_date: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1">הערות</label>
                      <textarea
                        className="w-full p-2 rounded-lg bg-white dark:bg-gray-900 border border-border-light dark:border-border-dark text-sm resize-none h-20"
                        value={editFormData.notes}
                        onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
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
                        disabled={!editFormData.permit_name.trim()}
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

      {/* Add New Permit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg border border-border-light dark:border-border-dark w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
              <h3 className="text-lg font-bold">הוספת היתר חדש</h3>
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
                  <label className="block text-sm font-bold mb-1">סוג היתר *</label>
                  <select
                    className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm"
                    value={newFormData.permit_type}
                    onChange={(e) => setNewFormData({ ...newFormData, permit_type: e.target.value as PermitType })}
                  >
                    {Object.entries(permitTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">סטטוס</label>
                  <select
                    className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm"
                    value={newFormData.status}
                    onChange={(e) => setNewFormData({ ...newFormData, status: e.target.value as PermitStatus })}
                  >
                    {Object.entries(permitStatusLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">שם ההיתר *</label>
                <input
                  type="text"
                  className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm"
                  placeholder="לדוגמה: היתר בנייה ראשי"
                  value={newFormData.permit_name}
                  onChange={(e) => setNewFormData({ ...newFormData, permit_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">רשות מאשרת</label>
                  <input
                    type="text"
                    className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm"
                    placeholder="שם הרשות..."
                    value={newFormData.authority}
                    onChange={(e) => setNewFormData({ ...newFormData, authority: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">מספר בקשה</label>
                  <input
                    type="text"
                    className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm"
                    placeholder="BLD-2024-..."
                    value={newFormData.application_reference}
                    onChange={(e) => setNewFormData({ ...newFormData, application_reference: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">תאריך הגשה</label>
                <input
                  type="date"
                  className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm"
                  value={newFormData.application_date}
                  onChange={(e) => setNewFormData({ ...newFormData, application_date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">הערות</label>
                <textarea
                  className="w-full p-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm resize-none h-20"
                  placeholder="הערות נוספות..."
                  value={newFormData.notes}
                  onChange={(e) => setNewFormData({ ...newFormData, notes: e.target.value })}
                />
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
                  disabled={!newFormData.permit_name.trim()}
                  className="px-4 py-2 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  הוסף היתר
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark md:hidden z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full flex items-center justify-center h-12 px-4 rounded-lg bg-primary text-white font-bold text-sm shadow-md hover:bg-primary-hover transition-colors"
        >
          <span className="material-symbols-outlined me-2 text-[20px]">add</span>
          הוסף היתר
        </button>
      </div>
    </div>
  );
}
