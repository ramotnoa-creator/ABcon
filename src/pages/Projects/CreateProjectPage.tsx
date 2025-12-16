import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Project, ProjectStatus } from '../../types';
import { addProject } from '../../data/storage';
import { calculateTargetDate, formatDateForDisplay, formatDateHebrew } from '../../utils/dateUtils';

const statusOptions: { value: ProjectStatus; label: string }[] = [
  { value: 'תכנון', label: 'בתכנון' },
  { value: 'היתרים', label: 'בהליך רישוי' },
  { value: 'ביצוע', label: 'בביצוע' },
  { value: 'מסירה', label: 'הסתיים' },
];

export default function CreateProjectPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    project_name: '',
    client_name: '',
    address: '',
    status: 'תכנון' as ProjectStatus,
    permit_start_date: '',
    permit_duration_months: 12,
    permit_approval_date: '',
    notes: '',
  });

  const [targetDate, setTargetDate] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdAt] = useState(new Date().toISOString());

  // Calculate target date when start date or duration changes
  useEffect(() => {
    if (formData.permit_start_date && formData.permit_duration_months) {
      const calculated = calculateTargetDate(
        formData.permit_start_date,
        formData.permit_duration_months
      );
      setTargetDate(calculated);
    } else {
      setTargetDate(null);
    }
  }, [formData.permit_start_date, formData.permit_duration_months]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'permit_duration_months' ? parseInt(value) || 0 : value,
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.project_name.trim()) {
      newErrors.project_name = 'שם הפרויקט הוא שדה חובה';
    }

    if (!formData.client_name.trim()) {
      newErrors.client_name = 'שם הלקוח הוא שדה חובה';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const newProject: Project = {
      id: `project-${Date.now()}`,
      project_name: formData.project_name.trim(),
      client_name: formData.client_name.trim(),
      address: formData.address.trim() || undefined,
      status: formData.status,
      permit_start_date: formData.permit_start_date || undefined,
      permit_duration_months: formData.permit_duration_months || undefined,
      permit_target_date: targetDate || undefined,
      permit_approval_date: formData.permit_approval_date || undefined,
      created_at: createdAt,
      updated_at_text: formatDateHebrew(createdAt),
      notes: formData.notes.trim() || undefined,
    };

    addProject(newProject);
    navigate('/projects');
  };

  const handleCancel = () => {
    navigate('/projects');
  };

  return (
    <div className="flex-1 w-full max-w-[1200px] mx-auto p-4 md:px-8 md:py-8">
      {/* Page Heading */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-royal-gray-dark text-3xl md:text-4xl font-black leading-tight tracking-tight">
            יצירת פרויקט חדש
          </h1>
          <p className="text-slate-500 mt-2 text-sm md:text-base">
            מלא את הפרטים ליצירת כרטיס פרויקט חדש במערכת
          </p>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white rounded shadow-sm border border-slate-200 overflow-hidden">
        {/* Form Header Bar */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-sm font-bold text-royal-gray uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">edit_document</span>
            פרטי פרויקט
          </span>
          <span className="text-xs font-medium text-slate-400">* שדות חובה</span>
        </div>

        {/* The Form */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
          {/* Section 1: Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Name */}
            <div className="flex flex-col gap-2">
              <label className="text-royal-gray text-sm font-bold leading-normal" htmlFor="project-name">
                שם הפרויקט <span className="text-red-500">*</span>
              </label>
              <input
                className={`form-input w-full rounded border px-4 py-3 text-slate-900 focus:ring-1 placeholder:text-slate-400 text-base transition-shadow ${
                  errors.project_name
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-slate-300 bg-white focus:border-royal-gray focus:ring-royal-gray'
                }`}
                id="project-name"
                name="project_name"
                placeholder="לדוגמה: מגדלי המרכז"
                type="text"
                value={formData.project_name}
                onChange={handleChange}
              />
              {errors.project_name && (
                <span className="text-xs text-red-500">{errors.project_name}</span>
              )}
            </div>

            {/* Client Name */}
            <div className="flex flex-col gap-2">
              <label className="text-royal-gray text-sm font-bold leading-normal" htmlFor="client-name">
                שם הלקוח <span className="text-red-500">*</span>
              </label>
              <input
                className={`form-input w-full rounded border px-4 py-3 text-slate-900 focus:ring-1 placeholder:text-slate-400 text-base transition-shadow ${
                  errors.client_name
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-slate-300 bg-white focus:border-royal-gray focus:ring-royal-gray'
                }`}
                id="client-name"
                name="client_name"
                placeholder="הזן שם לקוח מלא"
                type="text"
                value={formData.client_name}
                onChange={handleChange}
              />
              {errors.client_name && (
                <span className="text-xs text-red-500">{errors.client_name}</span>
              )}
            </div>

            {/* Address */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-royal-gray text-sm font-bold leading-normal" htmlFor="address">
                כתובת הפרויקט
              </label>
              <div className="relative">
                <input
                  className="form-input w-full rounded border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-royal-gray focus:ring-1 focus:ring-royal-gray placeholder:text-slate-400 text-base transition-shadow pl-10"
                  id="address"
                  name="address"
                  placeholder="רחוב, מספר עיר"
                  type="text"
                  value={formData.address}
                  onChange={handleChange}
                />
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  location_on
                </span>
              </div>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-2">
              <label className="text-royal-gray text-sm font-bold leading-normal" htmlFor="status">
                סטטוס פרויקט
              </label>
              <div className="relative">
                <select
                  className="form-select w-full rounded border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-royal-gray focus:ring-1 focus:ring-royal-gray text-base appearance-none cursor-pointer"
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Created At (Read Only) */}
            <div className="flex flex-col gap-2">
              <label className="text-slate-500 text-sm font-bold leading-normal" htmlFor="created-at">
                נוצר ב- (אוטומטי)
              </label>
              <input
                className="form-input w-full rounded border border-slate-200 bg-slate-100 px-4 py-3 text-slate-500 focus:outline-none cursor-not-allowed text-base"
                id="created-at"
                readOnly
                type="text"
                value={formatDateForDisplay(createdAt)}
              />
            </div>
          </div>

          <div className="h-px bg-slate-200 w-full my-4"></div>

          {/* Section 2: Permit Timeline */}
          <div>
            <h3 className="text-royal-gray font-bold text-lg flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">calendar_clock</span>
              לוחות זמנים להיתר
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Permit Start Date */}
              <div className="flex flex-col gap-2">
                <label className="text-royal-gray text-sm font-bold leading-normal" htmlFor="permit-start">
                  תאריך התחלת היתר
                </label>
                <input
                  className="form-input w-full rounded border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-royal-gray focus:ring-1 focus:ring-royal-gray text-base"
                  id="permit-start"
                  name="permit_start_date"
                  type="date"
                  value={formData.permit_start_date}
                  onChange={handleChange}
                />
              </div>

              {/* Duration */}
              <div className="flex flex-col gap-2">
                <label className="text-royal-gray text-sm font-bold leading-normal" htmlFor="permit-duration">
                  משך היתר (חודשים)
                </label>
                <input
                  className="form-input w-full rounded border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-royal-gray focus:ring-1 focus:ring-royal-gray placeholder:text-slate-400 text-base"
                  id="permit-duration"
                  name="permit_duration_months"
                  max={60}
                  min={1}
                  placeholder="12"
                  type="number"
                  value={formData.permit_duration_months}
                  onChange={handleChange}
                />
              </div>

              {/* Target Permit Date (Calculated/Read Only) */}
              <div className="flex flex-col gap-2">
                <label className="text-slate-500 text-sm font-bold leading-normal flex justify-between" htmlFor="target-date">
                  <span>תאריך יעד להיתר</span>
                  <span className="text-xs font-normal text-primary bg-blue-50 px-2 rounded-full">מחושב</span>
                </label>
                <input
                  className="form-input w-full rounded border border-slate-200 bg-slate-100 px-4 py-3 text-slate-600 focus:outline-none cursor-not-allowed font-medium text-base"
                  id="target-date"
                  readOnly
                  type="text"
                  value={formatDateForDisplay(targetDate)}
                />
              </div>

              {/* Approval Date (Optional) */}
              <div className="flex flex-col gap-2">
                <label className="text-royal-gray text-sm font-bold leading-normal" htmlFor="approval-date">
                  תאריך קבלת היתר <span className="text-slate-400 font-normal text-xs">(אופציונלי)</span>
                </label>
                <input
                  className="form-input w-full rounded border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-royal-gray focus:ring-1 focus:ring-royal-gray text-base"
                  id="approval-date"
                  name="permit_approval_date"
                  type="date"
                  value={formData.permit_approval_date}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-200 w-full my-4"></div>

          {/* Section 3: Notes */}
          <div className="flex flex-col gap-2">
            <label className="text-royal-gray text-sm font-bold leading-normal" htmlFor="notes">
              הערות ודגשים
            </label>
            <textarea
              className="form-textarea w-full rounded border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-royal-gray focus:ring-1 focus:ring-royal-gray placeholder:text-slate-400 text-base resize-none"
              id="notes"
              name="notes"
              placeholder="הוסף הערות כלליות לגבי הפרויקט..."
              rows={4}
              value={formData.notes}
              onChange={handleChange}
            />
          </div>

          {/* Actions Footer */}
          <div className="flex flex-col-reverse md:flex-row justify-end gap-4 pt-4">
            <button
              className="w-full md:w-auto px-8 py-3.5 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold text-base transition-colors focus:ring-2 focus:ring-slate-300 focus:outline-none"
              type="button"
              onClick={handleCancel}
            >
              ביטול
            </button>
            <button
              className="w-full md:w-auto px-10 py-3.5 rounded bg-royal-gray hover:bg-royal-gray-dark text-white font-bold text-base shadow-lg shadow-slate-300/50 transition-all transform active:scale-95 focus:ring-2 focus:ring-royal-gray focus:ring-offset-2 focus:outline-none flex items-center justify-center gap-2"
              type="submit"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              שמירה
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
