import { useState, useEffect, useMemo } from 'react';
import type { BudgetItem } from '../../types';
import { getBudgetCategories } from '../../services/budgetCategoriesService';
import { getBudgetChapters } from '../../services/budgetChaptersService';
import { createBudgetItem, getNextBudgetItemOrder, calculateBudgetItemTotals } from '../../services/budgetItemsService';
import { getProfessionals } from '../../services/professionalsService';
import { getTenders } from '../../services/tendersService';
import { getMilestones } from '../../services/milestonesService';
import { getProjects } from '../../services/projectsService';

interface AddBudgetItemFormProps {
  projectId?: string; // Optional - if not provided, show project selector
  onSuccess?: () => void;
  onCancel?: () => void;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function AddBudgetItemForm({ projectId: initialProjectId, onSuccess, onCancel }: AddBudgetItemFormProps) {
  // Project selection (for global budget page)
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || '');
  const [projects, setProjects] = useState<any[]>([]);

  const effectiveProjectId = initialProjectId || selectedProjectId;

  // Load data based on selected project
  const [categories, setCategories] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [tenders, setTenders] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);

  // Load projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      const loadedProjects = await getProjects();
      setProjects(loadedProjects);
    };
    loadProjects();
  }, []);

  // Load professionals on mount
  useEffect(() => {
    const loadProfessionals = async () => {
      const loadedProfessionals = await getProfessionals();
      setProfessionals(loadedProfessionals.filter((p) => p.is_active));
    };
    loadProfessionals();
  }, []);

  // Load project-specific data when project changes
  useEffect(() => {
    const loadProjectData = async () => {
      if (!effectiveProjectId) {
        setCategories([]);
        setChapters([]);
        setTenders([]);
        setMilestones([]);
        return;
      }

      const [loadedCategories, loadedChapters, loadedTenders, loadedMilestones] = await Promise.all([
        getBudgetCategories(effectiveProjectId),
        getBudgetChapters(effectiveProjectId),
        getTenders(effectiveProjectId),
        getMilestones(effectiveProjectId),
      ]);

      setCategories(loadedCategories);
      setChapters(loadedChapters);
      setTenders(loadedTenders);
      setMilestones(loadedMilestones);
    };

    loadProjectData();
  }, [effectiveProjectId]);

  // Form state
  const [form, setForm] = useState({
    chapter_id: '',
    description: '',
    unit: 'קומפלט',
    quantity: 1,
    unit_price: 0,
    vat_rate: 0.17,
    supplier_id: '',
    tender_id: '',
    expected_payment_date: '',
    notes: '',
  });

  // Category filter state
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  // Calculated values
  const totals = useMemo(
    () =>
      calculateBudgetItemTotals({
        quantity: form.quantity,
        unit_price: form.unit_price,
        vat_rate: form.vat_rate,
      }),
    [form.quantity, form.unit_price, form.vat_rate]
  );

  // Get chapters filtered by selected category
  const filteredChapters = useMemo(
    () => (selectedCategoryId ? chapters.filter((ch) => ch.category_id === selectedCategoryId) : chapters),
    [chapters, selectedCategoryId]
  );

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!effectiveProjectId || !form.chapter_id || !form.description.trim()) {
      alert('נא למלא את כל השדות הנדרשים');
      return;
    }

    const supplier = professionals.find((p) => p.id === form.supplier_id);
    const order = await getNextBudgetItemOrder(effectiveProjectId, form.chapter_id);

    const newItemData: Omit<BudgetItem, 'id' | 'created_at' | 'updated_at'> = {
      project_id: effectiveProjectId,
      chapter_id: form.chapter_id,
      code: undefined,
      description: form.description.trim(),
      unit: form.unit,
      quantity: form.quantity,
      unit_price: form.unit_price,
      total_price: totals.total_price,
      vat_rate: form.vat_rate,
      vat_amount: totals.vat_amount,
      total_with_vat: totals.total_with_vat,
      status: form.tender_id ? 'contracted' : 'pending',
      supplier_id: form.supplier_id || undefined,
      supplier_name: supplier?.professional_name,
      tender_id: form.tender_id || undefined,
      paid_amount: 0,
      expected_payment_date: form.expected_payment_date || undefined,
      order,
      notes: form.notes.trim() || undefined,
    };

    try {
      await createBudgetItem(newItemData);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating budget item:', error);
      alert('שגיאה ביצירת פריט תקציב');
    }
  };

  // Reset form when project changes
  const handleProjectChange = (newProjectId: string) => {
    setSelectedProjectId(newProjectId);
    setForm((prev) => ({ ...prev, chapter_id: '', tender_id: '' }));
    setSelectedCategoryId('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Project Selector (only for global budget page) */}
      {!initialProjectId && (
        <div>
          <label className="block text-sm font-bold mb-2">
            פרויקט <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
            value={selectedProjectId}
            onChange={(e) => handleProjectChange(e.target.value)}
            required
          >
            <option value="">בחר פרויקט</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.project_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Category Selector (for filtering chapters) */}
      <div>
        <label className="block text-sm font-bold mb-2">קטגוריה (לסינון)</label>
        <select
          className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
          value={selectedCategoryId}
          onChange={(e) => {
            setSelectedCategoryId(e.target.value);
            setForm((prev) => ({ ...prev, chapter_id: '' }));
          }}
          disabled={!effectiveProjectId}
        >
          <option value="">הכל</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Chapter Selector */}
      <div>
        <label className="block text-sm font-bold mb-2">
          פרק <span className="text-red-500">*</span>
        </label>
        <select
          className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
          value={form.chapter_id}
          onChange={(e) => setForm((prev) => ({ ...prev, chapter_id: e.target.value }))}
          required
          disabled={!effectiveProjectId}
        >
          <option value="">בחר פרק</option>
          {filteredChapters.map((ch) => (
            <option key={ch.id} value={ch.id}>
              {ch.code ? `${ch.code} - ` : ''}
              {ch.name}
            </option>
          ))}
        </select>
        {effectiveProjectId && filteredChapters.length === 0 && (
          <p className="text-xs text-orange-600 mt-1">אין פרקים מוגדרים לפרויקט זה</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-bold mb-2">
          תיאור <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="לדוגמה: ריצוף סלון"
          required
        />
      </div>

      {/* Quantity & Unit */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold mb-2">כמות</label>
          <input
            type="number"
            className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
            value={form.quantity}
            onChange={(e) => setForm((prev) => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
            min="0"
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2">יחידה</label>
          <select
            className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
            value={form.unit}
            onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))}
          >
            <option value="קומפלט">קומפלט</option>
            <option value='מ"ר'>מ"ר</option>
            <option value='מ"א'>מ"א</option>
            <option value="יחידות">יחידות</option>
            <option value="שעות">שעות</option>
          </select>
        </div>
      </div>

      {/* Unit Price & VAT */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold mb-2">מחיר ליחידה (לפני מע"מ)</label>
          <input
            type="number"
            className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
            value={form.unit_price}
            onChange={(e) => setForm((prev) => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2">שיעור מע"מ</label>
          <select
            className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
            value={form.vat_rate.toString()}
            onChange={(e) => setForm((prev) => ({ ...prev, vat_rate: parseFloat(e.target.value) }))}
          >
            <option value="0.17">17%</option>
            <option value="0">פטור ממע"מ</option>
          </select>
        </div>
      </div>

      {/* Calculated Totals */}
      <div className="bg-gray-50 dark:bg-background-dark p-4 rounded-lg border border-border-light dark:border-border-dark">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-text-secondary-light dark:text-text-secondary-dark block text-xs mb-1">
              סה"כ לפני מע"מ
            </span>
            <p className="font-bold">{formatCurrency(totals.total_price)}</p>
          </div>
          <div>
            <span className="text-text-secondary-light dark:text-text-secondary-dark block text-xs mb-1">מע"מ</span>
            <p className="font-bold">{formatCurrency(totals.vat_amount)}</p>
          </div>
          <div>
            <span className="text-text-secondary-light dark:text-text-secondary-dark block text-xs mb-1">
              סה"כ כולל מע"מ
            </span>
            <p className="font-bold text-primary">{formatCurrency(totals.total_with_vat)}</p>
          </div>
        </div>
      </div>

      {/* Supplier & Expected Payment Date */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold mb-2">ספק / קבלן</label>
          <select
            className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
            value={form.supplier_id}
            onChange={(e) => setForm((prev) => ({ ...prev, supplier_id: e.target.value }))}
          >
            <option value="">ללא ספק</option>
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.professional_name}
                {p.company_name && ` (${p.company_name})`}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold mb-2">תאריך משוער לתשלום</label>
          <input
            type="date"
            className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
            value={form.expected_payment_date}
            onChange={(e) => setForm((prev) => ({ ...prev, expected_payment_date: e.target.value }))}
          />
        </div>
      </div>

      {/* Optional Links */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold mb-2">קישור למכרז</label>
          <select
            className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
            value={form.tender_id}
            onChange={(e) => setForm((prev) => ({ ...prev, tender_id: e.target.value }))}
            disabled={!effectiveProjectId}
          >
            <option value="">ללא קישור</option>
            {tenders
              .filter((t) => t.status !== 'Canceled')
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.tender_name} ({t.status === 'Open' ? 'פתוח' : t.status === 'WinnerSelected' ? 'נבחר זוכה' : t.status === 'Closed' ? 'סגור' : 'טיוטה'})
                </option>
              ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold mb-2">קישור לאבן דרך</label>
          <select
            className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
            disabled={!effectiveProjectId}
            defaultValue=""
          >
            <option value="">ללא קישור</option>
            {milestones.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-bold mb-2">הערות</label>
        <textarea
          className="w-full p-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary resize-none h-20"
          value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="הערות נוספות..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border-light dark:border-border-dark">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold text-sm transition-colors"
          >
            ביטול
          </button>
        )}
        <button
          type="submit"
          disabled={!effectiveProjectId || !form.chapter_id || !form.description.trim()}
          className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          הוסף פריט תקציב
        </button>
      </div>
    </form>
  );
}
