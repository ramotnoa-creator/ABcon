/**
 * Add/Edit Project Item Form
 * Creates project item with initial estimate
 * Type (planning/execution) is auto-set by parent tab
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { createProjectItem, updateProjectItem, type ProjectItem } from '../../services/projectItemsService';
import { createEstimate } from '../../services/projectItemEstimatesService';
import { useAuth } from '../../contexts/AuthContext';

interface AddProjectItemFormProps {
  projectId: string;
  itemType: 'planning' | 'execution'; // Auto-set by parent tab
  item?: ProjectItem;
  onSave: (item: ProjectItem) => void;
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

export default function AddProjectItemForm({
  projectId,
  itemType,
  item,
  onSave,
  onCancel
}: AddProjectItemFormProps) {
  const { user } = useAuth();

  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [category, setCategory] = useState(item?.category || 'contractors');
  const [subcategory, setSubcategory] = useState('');
  const [unit, setUnit] = useState('unit');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculated fields
  const [totalPrice, setTotalPrice] = useState(0);
  const [vatRate] = useState(17);
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
    const subs = subcategoriesByCategory[category];
    if (subs && !subs.includes(subcategory)) {
      setSubcategory(subs[0] || '');
    }
  }, [category, subcategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (item) {
        // Edit existing item
        const updatedItem = await updateProjectItem(
          item.id,
          {
            name,
            description: description || undefined,
            category: `${category}:${subcategory}`,
            current_estimated_cost: totalWithVat,
            updated_by: user?.id || 'unknown'
          },
          item.version // Optimistic locking
        );

        // Create new estimate version if cost changed
        if (totalWithVat !== item.current_estimated_cost) {
          await createEstimate({
            project_item_id: item.id,
            estimated_cost: totalPrice,
            vat_rate: vatRate,
            revision_reason: 'Cost updated via edit form',
            created_by: user?.id || 'unknown'
          });
        }

        onSave(updatedItem);
      } else {
        // Create new item
        const newItem = await createProjectItem({
          project_id: projectId,
          name,
          description: description || undefined,
          type: itemType, // Auto-set from parent tab
          category: `${category}:${subcategory}`,
          created_by: user?.id || 'unknown'
        });

        // Create initial estimate
        await createEstimate({
          project_item_id: newItem.id,
          estimated_cost: totalPrice,
          vat_rate: vatRate,
          notes: `כמות: ${quantity} ${units.find(u => u.value === unit)?.label}, מחיר יחידה: ₪${unitPrice}`,
          created_by: user?.id || 'unknown'
        });

        onSave(newItem);
      }
    } catch (err) {
      console.error('Error saving project item:', err);
      setError(err instanceof Error ? err.message : 'Failed to save project item');
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-surface-dark rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-surface-dark border-b border-border-light dark:border-border-dark px-6 py-4">
          <h2 className="text-2xl font-bold">
            {item ? 'עריכת פריט' : `הוסף פריט ${itemType === 'planning' ? 'תכנון' : 'ביצוע'}`}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1">
                שם הפריט <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
                placeholder="עבודות בטון ליסודות, ייעוץ הנדסי..."
                required
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
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                תת-קטגוריה
              </label>
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
              >
                {subcategoriesByCategory[category]?.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1">
                תיאור (אופציונלי)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
                placeholder="פרטים נוספים..."
                rows={3}
              />
            </div>

            {/* Unit */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                יחידה <span className="text-red-500">*</span>
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
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
                value={quantity === 0 ? '' : quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
                placeholder="0"
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
                value={unitPrice === 0 ? '' : unitPrice}
                onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800"
                placeholder="0"
                required
              />
            </div>

            {/* Calculated Fields */}
            <div className="md:col-span-2 border-t border-border-light dark:border-border-dark pt-4 mt-2">
              <h3 className="font-semibold mb-3">חישובים אוטומטיים</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    סה"כ לפני מע"מ
                  </label>
                  <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg font-semibold">
                    ₪{totalPrice.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    מע"מ ({vatRate}%)
                  </label>
                  <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg font-semibold">
                    ₪{vatAmount.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                    סה"כ כולל מע"מ
                  </label>
                  <div className="px-3 py-2 bg-green-100 dark:bg-green-900/30 rounded-lg font-bold text-green-700 dark:text-green-400">
                    ₪{totalWithVat.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6 justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  שומר...
                </>
              ) : (
                'שמור'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
