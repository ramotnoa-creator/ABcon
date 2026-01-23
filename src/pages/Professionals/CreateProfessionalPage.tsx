import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProfessional } from '../../services/professionalsService';
import { validateIsraeliPhone, validateEmail } from '../../utils/validation';
import { useToast } from '../../contexts/ToastContext';
import type { Professional } from '../../types';

export default function CreateProfessionalPage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    professional_name: '',
    company_name: '',
    field: '',
    phone: '',
    email: '',
    rating: undefined as number | undefined,
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.professional_name.trim()) {
      newErrors.professional_name = 'שם איש מקצוע הוא שדה חובה';
    }

    if (!formData.field.trim()) {
      newErrors.field = 'תחום הוא שדה חובה';
    }

    // Phone is required and must be valid Israeli format
    if (!formData.phone.trim()) {
      newErrors.phone = 'טלפון הוא שדה חובה';
    } else if (!validateIsraeliPhone(formData.phone)) {
      newErrors.phone = 'מספר טלפון לא תקין (לדוגמה: 052-123-4567)';
    }

    // Email is required and must be valid
    if (!formData.email.trim()) {
      newErrors.email = 'אימייל הוא שדה חובה';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'כתובת אימייל לא תקינה';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const professionalData: Omit<Professional, 'id'> = {
      professional_name: formData.professional_name.trim(),
      company_name: formData.company_name.trim() || undefined,
      field: formData.field.trim(),
      phone: formData.phone.trim() || undefined,
      email: formData.email.trim() || undefined,
      rating: formData.rating || undefined,
      notes: formData.notes.trim() || undefined,
      is_active: true,
    };

    try {
      const newProfessional = await createProfessional(professionalData);
      showSuccess('איש מקצוע נוצר בהצלחה!');
      navigate(`/professionals/${newProfessional.id}`);
    } catch (error) {
      console.error('Error creating professional:', error);
      showError('שגיאה ביצירת איש מקצוע. אנא נסה שוב.');
    }
  };

  const handleCancel = () => {
    navigate('/professionals');
  };

  const fields = [
    'אדריכלות',
    'הנדסה אזרחית',
    'קונסטרוקציה',
    'חשמל',
    'אינסטלציה',
    'מיזוג אוויר',
    'ניהול פרויקטים',
    'בטיחות',
    'אחר',
  ];

  return (
    <div className="flex-1 w-full max-w-[1200px] mx-auto p-4 md:px-8 md:py-8 pb-20 lg:pb-8">
      {/* Breadcrumbs */}
      <div className="flex flex-wrap items-center gap-2 mb-6 text-sm">
        <a
          href="/professionals"
          onClick={(e) => {
            e.preventDefault();
            navigate('/professionals');
          }}
          className="text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors"
        >
          אנשי מקצוע
        </a>
        <span className="text-text-secondary-light dark:text-secondary-dark">/</span>
        <span className="font-medium">יצירת איש מקצוע חדש</span>
      </div>

      {/* Page Heading */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight">
            יצירת איש מקצוע חדש
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mt-2 text-sm md:text-base">
            מלא את הפרטים ליצירת כרטיס איש מקצוע חדש במערכת
          </p>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
        {/* Form Header Bar */}
        <div className="px-6 py-4 border-b border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark flex items-center justify-between">
          <span className="text-sm font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">person_add</span>
            פרטי איש מקצוע
          </span>
          <span className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark">
            * שדות חובה
          </span>
        </div>

        {/* The Form */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
          {/* Section 1: Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Professional Name */}
            <div className="flex flex-col gap-2">
              <label className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-bold leading-normal" htmlFor="professional-name">
                שם איש מקצוע <span className="text-red-500">*</span>
              </label>
              <input
                className={`w-full rounded-lg border bg-surface-light dark:bg-surface-dark px-4 py-3 text-text-main-light dark:text-text-main-dark focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark text-base transition-shadow ${
                  errors.professional_name
                    ? 'border-red-500'
                    : 'border-border-light dark:border-border-dark'
                }`}
                id="professional-name"
                placeholder="לדוגמה: דוד כהן"
                type="text"
                value={formData.professional_name}
                onChange={(e) => {
                  setFormData({ ...formData, professional_name: e.target.value });
                  if (errors.professional_name) {
                    setErrors({ ...errors, professional_name: '' });
                  }
                }}
              />
              {errors.professional_name && (
                <p className="text-xs text-red-500">{errors.professional_name}</p>
              )}
            </div>

            {/* Company Name */}
            <div className="flex flex-col gap-2">
              <label className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-bold leading-normal" htmlFor="company-name">
                שם חברה
              </label>
              <input
                className="w-full rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-4 py-3 text-text-main-light dark:text-text-main-dark focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark text-base transition-shadow"
                id="company-name"
                placeholder="הזן שם חברה"
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              />
            </div>

            {/* Field */}
            <div className="flex flex-col gap-2">
              <label className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-bold leading-normal" htmlFor="field">
                תחום התמחות <span className="text-red-500">*</span>
              </label>
              <select
                className={`w-full rounded-lg border bg-surface-light dark:bg-surface-dark px-4 py-3 text-text-main-light dark:text-text-main-dark focus:ring-1 focus:ring-primary focus:border-primary text-base appearance-none cursor-pointer ${
                  errors.field
                    ? 'border-red-500'
                    : 'border-border-light dark:border-border-dark'
                }`}
                id="field"
                value={formData.field}
                onChange={(e) => {
                  setFormData({ ...formData, field: e.target.value });
                  if (errors.field) {
                    setErrors({ ...errors, field: '' });
                  }
                }}
              >
                <option value="">בחר תחום...</option>
                {fields.map((field) => (
                  <option key={field} value={field}>
                    {field}
                  </option>
                ))}
              </select>
              {errors.field && <p className="text-xs text-red-500">{errors.field}</p>}
            </div>

            {/* Rating */}
            <div className="flex flex-col gap-2">
              <label className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-bold leading-normal" htmlFor="rating">
                דירוג (1-5)
              </label>
              <select
                className="w-full rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-4 py-3 text-text-main-light dark:text-text-main-dark focus:ring-1 focus:ring-primary focus:border-primary text-base appearance-none cursor-pointer"
                id="rating"
                value={formData.rating || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rating: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
              >
                <option value="">ללא דירוג</option>
                <option value="1">1 - נמוך</option>
                <option value="2">2</option>
                <option value="3">3 - בינוני</option>
                <option value="4">4</option>
                <option value="5">5 - גבוה</option>
              </select>
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-2">
              <label className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-bold leading-normal" htmlFor="phone">
                טלפון <span className="text-red-500">*</span>
              </label>
              <input
                className={`w-full rounded-lg border bg-surface-light dark:bg-surface-dark px-4 py-3 text-text-main-light dark:text-text-main-dark focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark text-base transition-shadow dir-ltr text-right ${
                  errors.phone
                    ? 'border-red-500'
                    : 'border-border-light dark:border-border-dark'
                }`}
                id="phone"
                placeholder="052-123-4567"
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  if (errors.phone) {
                    setErrors({ ...errors, phone: '' });
                  }
                }}
              />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-bold leading-normal" htmlFor="email">
                אימייל <span className="text-red-500">*</span>
              </label>
              <input
                className={`w-full rounded-lg border bg-surface-light dark:bg-surface-dark px-4 py-3 text-text-main-light dark:text-text-main-dark focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark text-base transition-shadow dir-ltr text-right ${
                  errors.email
                    ? 'border-red-500'
                    : 'border-border-light dark:border-border-dark'
                }`}
                id="email"
                placeholder="example@company.com"
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) {
                    setErrors({ ...errors, email: '' });
                  }
                }}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>
          </div>

          <div className="h-px bg-border-light dark:bg-border-dark w-full my-4"></div>

          {/* Section 2: Notes */}
          <div className="flex flex-col gap-2">
            <label className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-bold leading-normal" htmlFor="notes">
              הערות ודגשים
            </label>
            <textarea
              className="w-full rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-4 py-3 text-text-main-light dark:text-text-main-dark focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark text-base resize-none"
              id="notes"
              placeholder="הוסף הערות כלליות לגבי איש המקצוע..."
              rows={4}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Actions Footer */}
          <div className="flex flex-col-reverse md:flex-row justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="w-full md:w-auto px-8 py-3.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold text-base transition-colors focus:ring-2 focus:ring-slate-300 focus:outline-none"
            >
              ביטול
            </button>
            <button
              type="submit"
              className="w-full md:w-auto px-10 py-3.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold text-base shadow-lg shadow-slate-300/50 transition-all transform active:scale-95 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none flex items-center justify-center gap-2"
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
