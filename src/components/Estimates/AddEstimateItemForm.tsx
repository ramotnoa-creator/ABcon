import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { createEstimateItem, updateEstimateItem, getEstimateItemById } from '../../services/estimateItemsService';
import type { EstimateItem } from '../../types';

interface AddEstimateItemFormProps {
  estimateId: string;
  item?: EstimateItem | null;
  onSave: (item: EstimateItem) => void;
  onCancel: () => void;
}

const categories = [
  { value: 'consultants', label: 'יועצים' },
  { value: 'suppliers', label: 'ספקים' },
  { value: 'contractors', label: 'קבלנים' },
];

const subcategoriesByCategory: Record<string, string[]> = {
  consultants: ['אדריכלות', 'הנדסה', 'ניהול פרויקט', 'אחר'],
  suppliers: ['חומרי בניין', 'ציוד', 'חשמל', 'אינסטלציה', 'אחר'],
  contractors: ['בניין', 'גמר', 'חשמל', 'אינסטלציה', 'אחר'],
};

const units = [
  { value: 'sqm', label: 'מ"ר' },
  { value: 'unit', label: 'יחידה' },
  { value: 'hours', label: 'שעות' },
  { value: 'days', label: 'ימים' },
  { value: 'lumpsum', label: 'קבוע' },
];

export default function AddEstimateItemForm({ estimateId, item, onSave, onCancel }: AddEstimateItemFormProps) {
  const [code, setCode] = useState(item?.code || '');
  const [description, setDescription] = useState(item?.description || '');
  const [category, setCategory] = useState(item?.category || 'contractors');
  const [subcategory, setSubcategory] = useState(item?.subcategory || '');
  const [unit, setUnit] = useState(item?.unit || 'unit');
  const [quantity, setQuantity] = useState(item?.quantity || 1);
  const [unitPrice, setUnitPrice] = useState(item?.unit_price || 0);
  const [notes, setNotes] = useState(item?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculated fields
  const [totalPrice, setTotalPrice] = useState(0);
  const [vatRate] = useState(17); // Fixed at 17%
  const [vatAmount, setVatAmount] = useState(0);
  const [totalWithVat, setTotalWithVat] = useState(0);

  // Real-time calculations
  useEffect(() => {
    const total = quantity * unitPrice;
    const vat = total * (vatRate / 100);
    const totalWithVatCalc = total + vat;

    setTotalPrice(total);
    setVatAmount(vat);
    setTotalWithVat(totalWithVatCalc);
  }, [quantity, unitPrice, vatRate]);

  // Update subcategory when category changes
  useEffect(() => {
    if (!subcategoriesByCategory[category]?.includes(subcategory)) {
      setSubcategory(subcategoriesByCategory[category]?.[0] || '');
    }
  }, [category, subcategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      alert('נא למלא תיאור');
      return;
    }

    if (quantity <= 0) {
      alert('כמות חייבת להיות גדולה מ-0');
      return;
    }

    if (unitPrice < 0) {
      alert('מחיר יחידה לא יכול להיות שלילי');
      return;
    }

    try {
      setIsSubmitting(true);

      const itemData = {
        estimate_id: estimateId,
        code: code || `AUTO-${Date.now()}`,
        description: description.trim(),
        category,
        subcategory,
        unit,
        quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        vat_rate: vatRate,
        vat_amount: vatAmount,
        total_with_vat: totalWithVat,
        notes: notes.trim() || undefined,
        order_index: item?.order_index || 0,
      };

      let savedItem: EstimateItem;
      if (item?.id) {
        // Update existing item
        await updateEstimateItem(item.id, itemData);
        // Fetch the updated item
        const updated = await getEstimateItemById(item.id);
        if (!updated) {
          throw new Error('Failed to fetch updated item');
        }
        savedItem = updated;
      } else {
        // Create new item
        savedItem = await createEstimateItem(itemData);
      }

      onSave(savedItem);
    } catch (error) {
      console.error('Error saving estimate item:', error);
      alert('שגיאה בשמירת פריט');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-surface-dark rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-surface-dark border-b border-border-light dark:border-border-dark px-6 py-4">
          <h2 className="text-2xl font-bold">
            {item ? 'עריכת פריט' : 'הוספת פריט חדש'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Code (optional) */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                קוד (אופציונלי)
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-800"
                placeholder="יווצר אוטומטית אם ריק"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                קטגוריה <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-800"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1">
                תיאור <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-800"
                required
              />
            </div>

            {/* Subcategory */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                תת-קטגוריה
              </label>
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-800"
              >
                {subcategoriesByCategory[category]?.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            {/* Unit */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                יחידה <span className="text-red-500">*</span>
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-800"
                required
              >
                {units.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                כמות <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-800"
                required
              />
            </div>

            {/* Unit Price */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                מחיר יחידה (₪) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-800"
                required
              />
            </div>

            {/* Calculated Fields - Read Only */}
            <div className="md:col-span-2 border-t border-border-light dark:border-border-dark pt-4 mt-2">
              <h3 className="font-semibold mb-3">חישובים אוטומטיים</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">
                    סה"כ לפני מע"מ
                  </label>
                  <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg font-semibold">
                    {new Intl.NumberFormat('he-IL', {
                      style: 'currency',
                      currency: 'ILS',
                    }).format(totalPrice)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">
                    מע"מ ({vatRate}%)
                  </label>
                  <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg font-semibold">
                    {new Intl.NumberFormat('he-IL', {
                      style: 'currency',
                      currency: 'ILS',
                    }).format(vatAmount)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">
                    סה"כ כולל מע"מ
                  </label>
                  <div className="px-3 py-2 bg-primary/10 dark:bg-primary/20 rounded-lg font-bold text-primary">
                    {new Intl.NumberFormat('he-IL', {
                      style: 'currency',
                      currency: 'ILS',
                    }).format(totalWithVat)}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1">
                הערות (אופציונלי)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-800"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 mt-6 justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-6 py-2 border border-border-light dark:border-border-dark rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-semibold"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50"
            >
              {isSubmitting ? 'שומר...' : 'שמור'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(formContent, document.body);
}
