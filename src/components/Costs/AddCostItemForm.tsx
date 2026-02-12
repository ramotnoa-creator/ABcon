/**
 * Add/Edit Cost Item Form
 * Supports both creating new cost items and editing existing ones.
 * In edit mode: shows actual_amount field, and tender fields for tender_winner items.
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { createCostItem, updateCostItem } from '../../services/costsService';
import { updateTender } from '../../services/tendersService';
import type { CostItem, CostCategory, Tender } from '../../types';

interface AddCostItemFormProps {
  projectId: string;
  vatRate?: number;
  onSave: (item: CostItem) => void;
  onCancel: () => void;
  editItem?: CostItem;
  tendersMap?: Record<string, Tender>;
}

const categories: { value: CostCategory; label: string }[] = [
  { value: 'consultant', label: 'יועץ' },
  { value: 'supplier', label: 'ספק' },
  { value: 'contractor', label: 'קבלן' },
];

export default function AddCostItemForm({ projectId, vatRate = 17, onSave, onCancel, editItem, tendersMap }: AddCostItemFormProps) {
  const isEditMode = !!editItem;
  const linkedTender = editItem?.tender_id && tendersMap ? tendersMap[editItem.tender_id] : undefined;

  const [name, setName] = useState(editItem?.name || '');
  const [description, setDescription] = useState(editItem?.description || '');
  const [category, setCategory] = useState<CostCategory>(editItem?.category || 'contractor');
  const [amount, setAmount] = useState(editItem ? String(editItem.estimated_amount) : '');
  const [actualAmount, setActualAmount] = useState(editItem?.actual_amount ? String(editItem.actual_amount) : '');
  const [vatIncluded, setVatIncluded] = useState(editItem?.vat_included ?? true);
  const [notes, setNotes] = useState(editItem?.notes || '');
  const [contractAmount, setContractAmount] = useState(linkedTender?.contract_amount != null ? String(linkedTender.contract_amount) : '');
  const [managementRemarks, setManagementRemarks] = useState(linkedTender?.management_remarks || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('נא למלא שם פריט');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      alert('נא להזין סכום תקין');
      return;
    }

    try {
      setIsSubmitting(true);

      if (isEditMode && editItem) {
        // Update existing cost item
        const updates: Partial<CostItem> = {
          name: name.trim(),
          description: description.trim() || undefined,
          category,
          estimated_amount: parseFloat(amount),
          actual_amount: actualAmount ? parseFloat(actualAmount) : undefined,
          vat_included: vatIncluded,
          notes: notes.trim() || undefined,
        };

        await updateCostItem(editItem.id, updates);

        // Update linked tender fields if applicable
        if (linkedTender) {
          const tenderUpdates: Partial<Tender> = {};
          const newContractAmount = contractAmount ? parseFloat(contractAmount) : undefined;
          const newManagementRemarks = managementRemarks.trim() || undefined;

          if (newContractAmount !== linkedTender.contract_amount) {
            tenderUpdates.contract_amount = newContractAmount;
          }
          if (newManagementRemarks !== linkedTender.management_remarks) {
            tenderUpdates.management_remarks = newManagementRemarks;
          }

          if (Object.keys(tenderUpdates).length > 0) {
            await updateTender(linkedTender.id, tenderUpdates);
          }
        }

        // Return updated item
        const updatedItem: CostItem = {
          ...editItem,
          ...updates,
          updated_at: new Date().toISOString(),
        };
        onSave(updatedItem);
      } else {
        // Create new cost item
        const newItem = await createCostItem({
          project_id: projectId,
          name: name.trim(),
          description: description.trim() || undefined,
          category,
          estimated_amount: parseFloat(amount),
          actual_amount: undefined,
          vat_included: vatIncluded,
          vat_rate: vatRate,
          status: 'draft',
          notes: notes.trim() || undefined,
        });

        onSave(newItem);
      }
    } catch (error) {
      console.error(isEditMode ? 'Error updating cost item:' : 'Error creating cost item:', error);
      alert(isEditMode ? 'שגיאה בעדכון פריט. אנא נסה שוב.' : 'שגיאה ביצירת פריט. אנא נסה שוב.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-surface-dark border-b border-border-light dark:border-border-dark p-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">
              {isEditMode ? 'עריכת פריט עלות' : 'הוסף פריט עלות'}
            </h2>
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>

          {/* Form Fields */}
          <div className="p-6 space-y-6">
            {/* Name - REQUIRED */}
            <div>
              <label className="block text-sm font-bold text-text-main-light dark:text-text-main-dark mb-2">
                שם הפריט <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="לדוגמה: אדריכלות, קבלן עיקרי, חשמל"
                className="w-full px-4 py-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            {/* Description - OPTIONAL */}
            <div>
              <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
                תיאור (אופציונלי)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="תיאור מפורט..."
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-bold text-text-main-light dark:text-text-main-dark mb-2">
                קטגוריה <span className="text-red-600">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CostCategory)}
                className="w-full px-4 py-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount (Estimated) */}
            <div>
              <label className="block text-sm font-bold text-text-main-light dark:text-text-main-dark mb-2">
                {isEditMode ? 'סכום אומדן' : 'סכום'} <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">₪</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="w-full pr-10 pl-4 py-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-primary focus:border-transparent text-lg font-bold"
                  required
                />
              </div>
            </div>

            {/* Actual Amount - EDIT MODE ONLY */}
            {isEditMode && (
              <div>
                <label className="block text-sm font-bold text-text-main-light dark:text-text-main-dark mb-2">
                  עלות בפועל
                </label>
                <div className="relative">
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">₪</span>
                  <input
                    type="number"
                    value={actualAmount}
                    onChange={(e) => setActualAmount(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className="w-full pr-10 pl-4 py-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-primary focus:border-transparent text-lg font-bold"
                  />
                </div>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                  העלות הממשית מהקבלן/ספק
                </p>
              </div>
            )}

            {/* Tender Fields - EDIT MODE + TENDER_WINNER ONLY */}
            {isEditMode && linkedTender && (
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800/40 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600 dark:text-emerald-400">emoji_events</span>
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">נתוני מכרז</span>
                  {linkedTender.winner_professional_name && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">
                      — זוכה: {linkedTender.winner_professional_name}
                    </span>
                  )}
                </div>

                {/* Contract Amount */}
                <div>
                  <label className="block text-sm font-bold text-text-main-light dark:text-text-main-dark mb-2">
                    סכום חוזה
                  </label>
                  <div className="relative">
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">₪</span>
                    <input
                      type="number"
                      value={contractAmount}
                      onChange={(e) => setContractAmount(e.target.value)}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="w-full pr-10 pl-4 py-3 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-background-dark text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg font-bold"
                    />
                  </div>
                </div>

                {/* Management Remarks */}
                <div>
                  <label className="block text-sm font-bold text-text-main-light dark:text-text-main-dark mb-2">
                    הערות ניהול
                  </label>
                  <textarea
                    value={managementRemarks}
                    onChange={(e) => setManagementRemarks(e.target.value)}
                    placeholder="הערות ניהוליות פנימיות..."
                    rows={2}
                    className="w-full px-4 py-3 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-background-dark text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            )}

            {/* VAT Included */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={vatIncluded}
                  onChange={(e) => setVatIncluded(e.target.checked)}
                  className="size-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium">כולל מע"מ ({vatRate}%)</span>
              </label>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
                הערות
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="הערות נוספות..."
                rows={2}
                className="w-full px-4 py-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-background-dark border-t border-border-light dark:border-border-dark p-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 rounded-lg border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-surface-dark transition-colors text-sm font-medium"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isEditMode ? 'מעדכן...' : 'שומר...'}
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">check</span>
                  {isEditMode ? 'עדכן' : 'שמור'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
