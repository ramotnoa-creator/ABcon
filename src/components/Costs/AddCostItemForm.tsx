/**
 * Add Cost Item Form - Simplified
 * Just name, type, category, and ONE amount
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { createCostItem } from '../../services/costsService';
import type { CostItem, CostCategory } from '../../types';

interface AddCostItemFormProps {
  projectId: string;
  onSave: (item: CostItem) => void;
  onCancel: () => void;
}

const categories: { value: CostCategory; label: string }[] = [
  { value: 'consultant', label: 'יועץ' },
  { value: 'supplier', label: 'ספק' },
  { value: 'contractor', label: 'קבלן' },
];

export default function AddCostItemForm({ projectId, onSave, onCancel }: AddCostItemFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CostCategory>('contractor');
  const [amount, setAmount] = useState('');
  const [vatIncluded, setVatIncluded] = useState(true);
  const [notes, setNotes] = useState('');
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

      const newItem = await createCostItem({
        project_id: projectId,
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        estimated_amount: parseFloat(amount),
        actual_amount: undefined,
        vat_included: vatIncluded,
        vat_rate: 17, // TODO: Get from project settings
        status: 'draft',
        notes: notes.trim() || undefined,
      });

      onSave(newItem);
    } catch (error) {
      console.error('Error creating cost item:', error);
      alert('שגיאה ביצירת פריט. אנא נסה שוב.');
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
              הוסף פריט עלות
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

            {/* Amount - THE ONE FIELD */}
            <div>
              <label className="block text-sm font-bold text-text-main-light dark:text-text-main-dark mb-2">
                סכום <span className="text-red-600">*</span>
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

            {/* VAT Included */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={vatIncluded}
                  onChange={(e) => setVatIncluded(e.target.checked)}
                  className="size-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium">כולל מע"מ (17%)</span>
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
                  שומר...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">check</span>
                  שמור
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
