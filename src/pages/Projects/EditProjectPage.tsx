import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Project, ProjectStatus } from '../../types';
import { getProjectById, updateProject } from '../../services/projectsService';
import { useToast } from '../../contexts/ToastContext';
import { calculateTargetDate, formatDateForDisplay, formatDateHebrew } from '../../utils/dateUtils';

const statusOptions: { value: ProjectStatus; label: string }[] = [
  { value: 'תכנון', label: 'בתכנון' },
  { value: 'היתרים', label: 'בהליך רישוי' },
  { value: 'מכרזים', label: 'מכרזים' },
  { value: 'ביצוע', label: 'בביצוע' },
  { value: 'מסירה', label: 'מסירה' },
  { value: 'ארכיון', label: 'ארכיון' },
];

export default function EditProjectPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);

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

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load project data
  useEffect(() => {
    const loadProject = async () => {
      if (!id) {
        navigate('/projects');
        return;
      }

      try {
        const loadedProject = await getProjectById(id);
        if (!loadedProject) {
          showError('הפרויקט לא נמצא');
          navigate('/projects');
          return;
        }

        setProject(loadedProject);
        setFormData({
          project_name: loadedProject.project_name,
      client_name: loadedProject.client_name,
      address: loadedProject.address || '',
      status: loadedProject.status,
      permit_start_date: loadedProject.permit_start_date || '',
      permit_duration_months: loadedProject.permit_duration_months || 12,
      permit_approval_date: loadedProject.permit_approval_date || '',
      notes: loadedProject.notes || '',
        });
        setLoading(false);
      } catch (error) {
        console.error('Error loading project:', error);
        showError('שגיאה בטעינת הפרויקט');
        navigate('/projects');
      }
    };
    loadProject();
  }, [id, navigate, showError]);

  // Calculate target date when start date or duration changes
  const targetDate = useMemo(() => {
    if (formData.permit_start_date && formData.permit_duration_months) {
      return calculateTargetDate(
        formData.permit_start_date,
        formData.permit_duration_months
      );
    }
    return null;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate() || !project) {
      return;
    }

    try {
      await updateProject(project.id, {
        project_name: formData.project_name.trim(),
        client_name: formData.client_name.trim(),
        address: formData.address.trim() || undefined,
        status: formData.status,
        permit_start_date: formData.permit_start_date || undefined,
        permit_duration_months: formData.permit_duration_months || undefined,
        permit_target_date: targetDate || undefined,
        permit_approval_date: formData.permit_approval_date || undefined,
        updated_at_text: formatDateHebrew(new Date().toISOString()),
        notes: formData.notes.trim() || undefined,
      });

      showSuccess('הפרויקט עודכן בהצלחה!');
      navigate(`/projects/${id}`);
    } catch (error) {
      console.error('Error updating project:', error);
      showError('שגיאה בעדכון הפרויקט. אנא נסה שוב.');
    }
  };

  const handleCancel = () => {
    navigate(`/projects/${id}`);
  };

  if (loading) {
    return (
      <div className="flex-1 w-full max-w-[1200px] mx-auto p-4 md:px-8 md:py-8">
        <div className="flex items-center justify-center h-64">
          <span className="text-text-secondary-light">טוען...</span>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="flex-1 w-full max-w-[1200px] mx-auto p-4 md:px-8 md:py-8">
      {/* Page Heading */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-royal-gray-dark dark:text-text-main-dark text-3xl md:text-4xl font-black leading-tight tracking-tight">
            עריכת פרויקט
          </h1>
          <p className="text-slate-500 dark:text-text-secondary-dark mt-2 text-sm md:text-base">
            {project.project_name}
          </p>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white dark:bg-surface-dark rounded shadow-sm border border-slate-200 dark:border-border-dark overflow-hidden">
        {/* Form Header Bar */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-border-dark bg-slate-50/50 dark:bg-background-dark flex items-center justify-between">
          <span className="text-sm font-bold text-royal-gray dark:text-text-main-dark uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">edit</span>
            פרטי פרויקט
          </span>
          <span className="text-xs font-medium text-slate-400 dark:text-text-secondary-dark">* שדות חובה</span>
        </div>

        {/* The Form */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
          {/* Section 1: Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Name */}
            <div className="flex flex-col gap-2">
              <label className="text-royal-gray dark:text-text-main-dark text-sm font-bold leading-normal" htmlFor="project-name">
                שם הפרויקט <span className="text-red-500">*</span>
              </label>
              <input
                className={`form-input w-full rounded border px-4 py-3 text-slate-900 dark:text-text-main-dark dark:bg-background-dark focus:ring-1 placeholder:text-slate-400 text-base transition-shadow ${
                  errors.project_name
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-slate-300 dark:border-border-dark bg-white focus:border-royal-gray focus:ring-royal-gray'
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
              <label className="text-royal-gray dark:text-text-main-dark text-sm font-bold leading-normal" htmlFor="client-name">
                שם הלקוח <span className="text-red-500">*</span>
              </label>
              <input
                className={`form-input w-full rounded border px-4 py-3 text-slate-900 dark:text-text-main-dark dark:bg-background-dark focus:ring-1 placeholder:text-slate-400 text-base transition-shadow ${
                  errors.client_name
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-slate-300 dark:border-border-dark bg-white focus:border-royal-gray focus:ring-royal-gray'
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
              <label className="text-royal-gray dark:text-text-main-dark text-sm font-bold leading-normal" htmlFor="address">
                כתובת הפרויקט
              </label>
              <div className="relative">
                <input
                  className="form-input w-full rounded border border-slate-300 dark:border-border-dark bg-white dark:bg-background-dark px-4 py-3 text-slate-900 dark:text-text-main-dark focus:border-royal-gray focus:ring-1 focus:ring-royal-gray placeholder:text-slate-400 text-base transition-shadow pl-10"
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
              <label className="text-royal-gray dark:text-text-main-dark text-sm font-bold leading-normal" htmlFor="status">
                סטטוס פרויקט
              </label>
              <div className="relative">
                <select
                  className="form-select w-full rounded border border-slate-300 dark:border-border-dark bg-white dark:bg-background-dark px-4 py-3 text-slate-900 dark:text-text-main-dark focus:border-royal-gray focus:ring-1 focus:ring-royal-gray text-base appearance-none cursor-pointer"
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
              <label className="text-slate-500 dark:text-text-secondary-dark text-sm font-bold leading-normal" htmlFor="created-at">
                נוצר ב- (אוטומטי)
              </label>
              <input
                className="form-input w-full rounded border border-slate-200 dark:border-border-dark bg-slate-100 dark:bg-background-dark px-4 py-3 text-slate-500 dark:text-text-secondary-dark focus:outline-none cursor-not-allowed text-base"
                id="created-at"
                readOnly
                type="text"
                value={formatDateForDisplay(project.created_at)}
              />
            </div>
          </div>

          <div className="h-px bg-slate-200 dark:bg-border-dark w-full my-4"></div>

          {/* Section 2: Permit Timeline */}
          <div>
            <h3 className="text-royal-gray dark:text-text-main-dark font-bold text-lg flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">calendar_clock</span>
              לוחות זמנים להיתר
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Permit Start Date */}
              <div className="flex flex-col gap-2">
                <label className="text-royal-gray dark:text-text-main-dark text-sm font-bold leading-normal" htmlFor="permit-start">
                  תאריך התחלת היתר
                </label>
                <input
                  className="form-input w-full rounded border border-slate-300 dark:border-border-dark bg-white dark:bg-background-dark px-4 py-3 text-slate-900 dark:text-text-main-dark focus:border-royal-gray focus:ring-1 focus:ring-royal-gray text-base"
                  id="permit-start"
                  name="permit_start_date"
                  type="date"
                  value={formData.permit_start_date}
                  onChange={handleChange}
                />
              </div>

              {/* Duration */}
              <div className="flex flex-col gap-2">
                <label className="text-royal-gray dark:text-text-main-dark text-sm font-bold leading-normal" htmlFor="permit-duration">
                  משך היתר (חודשים)
                </label>
                <input
                  className="form-input w-full rounded border border-slate-300 dark:border-border-dark bg-white dark:bg-background-dark px-4 py-3 text-slate-900 dark:text-text-main-dark focus:border-royal-gray focus:ring-1 focus:ring-royal-gray placeholder:text-slate-400 text-base"
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
                <label className="text-slate-500 dark:text-text-secondary-dark text-sm font-bold leading-normal flex justify-between" htmlFor="target-date">
                  <span>תאריך יעד להיתר</span>
                  <span className="text-xs font-normal text-primary bg-blue-50 dark:bg-blue-900/30 px-2 rounded-full">מחושב</span>
                </label>
                <input
                  className="form-input w-full rounded border border-slate-200 dark:border-border-dark bg-slate-100 dark:bg-background-dark px-4 py-3 text-slate-600 dark:text-text-secondary-dark focus:outline-none cursor-not-allowed font-medium text-base"
                  id="target-date"
                  readOnly
                  type="text"
                  value={formatDateForDisplay(targetDate)}
                />
              </div>

              {/* Approval Date (Optional) */}
              <div className="flex flex-col gap-2">
                <label className="text-royal-gray dark:text-text-main-dark text-sm font-bold leading-normal" htmlFor="approval-date">
                  תאריך קבלת היתר <span className="text-slate-400 dark:text-text-secondary-dark font-normal text-xs">(אופציונלי)</span>
                </label>
                <input
                  className="form-input w-full rounded border border-slate-300 dark:border-border-dark bg-white dark:bg-background-dark px-4 py-3 text-slate-900 dark:text-text-main-dark focus:border-royal-gray focus:ring-1 focus:ring-royal-gray text-base"
                  id="approval-date"
                  name="permit_approval_date"
                  type="date"
                  value={formData.permit_approval_date}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-200 dark:bg-border-dark w-full my-4"></div>

          {/* Section 3: Notes */}
          <div className="flex flex-col gap-2">
            <label className="text-royal-gray dark:text-text-main-dark text-sm font-bold leading-normal" htmlFor="notes">
              הערות ודגשים
            </label>
            <textarea
              className="form-textarea w-full rounded border border-slate-300 dark:border-border-dark bg-white dark:bg-background-dark px-4 py-3 text-slate-900 dark:text-text-main-dark focus:border-royal-gray focus:ring-1 focus:ring-royal-gray placeholder:text-slate-400 text-base resize-none"
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
              className="w-full md:w-auto px-8 py-3.5 rounded bg-slate-200 dark:bg-gray-700 text-slate-700 dark:text-text-main-dark hover:bg-slate-300 dark:hover:bg-gray-600 font-bold text-base transition-colors focus:ring-2 focus:ring-slate-300 focus:outline-none"
              type="button"
              onClick={handleCancel}
            >
              ביטול
            </button>
            <button
              className="w-full md:w-auto px-10 py-3.5 rounded bg-primary hover:bg-primary-hover text-white font-bold text-base shadow-lg shadow-slate-300/50 dark:shadow-none transition-all transform active:scale-95 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none flex items-center justify-center gap-2"
              type="submit"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              שמור שינויים
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
