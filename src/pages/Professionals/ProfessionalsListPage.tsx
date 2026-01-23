import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProfessionals } from '../../services/professionalsService';
import type { Professional } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { canManageProfessionals } from '../../utils/permissions';

export default function ProfessionalsListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [fieldFilter, setFieldFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Load professionals from database
  useEffect(() => {
    const loadProfessionals = async () => {
      try {
        setIsLoading(true);
        const data = await getProfessionals();
        setProfessionals(data);
      } catch (error) {
        console.error('Error loading professionals:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfessionals();
  }, []);

  // Get unique fields for filter
  const uniqueFields = useMemo(() => {
    const fields = new Set(professionals.map(p => p.field));
    return Array.from(fields).sort();
  }, [professionals]);

  const filteredProfessionals = useMemo(() => {
    let filtered = professionals;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.professional_name.toLowerCase().includes(query) ||
          p.company_name?.toLowerCase().includes(query) ||
          p.email?.toLowerCase().includes(query) ||
          p.field.toLowerCase().includes(query)
      );
    }

    // Field filter
    if (fieldFilter !== 'all') {
      filtered = filtered.filter((p) => p.field === fieldFilter);
    }

    // Active filter
    if (activeFilter === 'active') {
      filtered = filtered.filter((p) => p.is_active);
    } else if (activeFilter === 'inactive') {
      filtered = filtered.filter((p) => !p.is_active);
    }

    return filtered;
  }, [professionals, searchQuery, fieldFilter, activeFilter]);

  const handleProfessionalClick = (id: string) => {
    navigate(`/professionals/${id}`);
  };

  const renderRating = (rating?: number) => {
    if (!rating) return <span className="text-text-secondary-light dark:text-text-secondary-dark">-</span>;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-sm ${
              star <= rating
                ? 'text-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          >
            ★
          </span>
        ))}
        <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark ms-1">
          ({rating})
        </span>
      </div>
    );
  };

  return (
    <div className="flex-1 px-4 lg:px-10 py-6 max-w-[1400px] mx-auto w-full pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
              אנשי מקצוע - מאגר גלובלי
            </h1>
            <p className="text-text-secondary-light dark:text-text-secondary-dark mt-2 text-sm md:text-base">
              ניהול קבלנים, ספקים ומומחים חיצוניים
            </p>
          </div>
          {canManageProfessionals(user) && (
            <Link
              to="/professionals/new"
              className="flex items-center justify-center h-10 px-4 rounded-lg bg-primary text-white hover:bg-primary-hover transition text-sm font-bold"
            >
              <span className="material-symbols-outlined me-2 text-[18px]">add</span>
              יצירת איש מקצוע חדש
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-center rounded-lg bg-background-light dark:bg-background-dark h-10 px-3 border border-border-light dark:border-border-dark focus-within:border-primary">
            <span className="material-symbols-outlined text-text-secondary-light dark:text-text-secondary-dark text-[20px] me-2">
              search
            </span>
            <input
              type="text"
              className="w-full bg-transparent border-none focus:ring-0 text-sm placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark"
              placeholder="חיפוש לפי שם, חברה או אימייל..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="w-full md:w-48">
          <select
            className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            value={fieldFilter}
            onChange={(e) => setFieldFilter(e.target.value)}
          >
            <option value="all">כל התחומים</option>
            {uniqueFields.map((field) => (
              <option key={field} value={field}>
                {field}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
            <input
              type="checkbox"
              className="rounded border-border-light dark:border-border-dark"
              checked={activeFilter === 'active'}
              onChange={(e) => setActiveFilter(e.target.checked ? 'active' : 'all')}
            />
            זמין בלבד
          </label>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Desktop Table View */}
      {!isLoading && (
        <div className="hidden md:block bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background-light dark:bg-background-dark border-b border-border-light dark:border-border-dark">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                  שם
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                  תחום
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                  חברה
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                  טלפון
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                  אימייל
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                  דירוג
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                  סטטוס
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {filteredProfessionals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-secondary-light dark:text-text-secondary-dark">
                    לא נמצאו אנשי מקצוע
                  </td>
                </tr>
              ) : (
                filteredProfessionals.map((professional) => (
                  <tr
                    key={professional.id}
                    className="hover:bg-background-light dark:hover:bg-background-dark cursor-pointer transition-colors"
                    onClick={() => handleProfessionalClick(professional.id)}
                  >
                    <td className="px-6 py-4 text-sm font-medium">{professional.professional_name}</td>
                    <td className="px-6 py-4 text-sm">{professional.field}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {professional.company_name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {professional.phone || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {professional.email || '-'}
                    </td>
                    <td className="px-6 py-4">{renderRating(professional.rating)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                          professional.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200'
                        }`}
                      >
                        {professional.is_active ? 'פעיל' : 'לא פעיל'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Mobile Card View */}
      {!isLoading && (
        <div className="md:hidden flex flex-col gap-4">
        {filteredProfessionals.length === 0 ? (
          <div className="text-center py-12 text-text-secondary-light dark:text-text-secondary-dark">
            לא נמצאו אנשי מקצוע
          </div>
        ) : (
          filteredProfessionals.map((professional) => (
            <div
              key={professional.id}
              className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleProfessionalClick(professional.id)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold">{professional.professional_name}</h3>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    {professional.field}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ms-2 ${
                    professional.is_active
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200'
                  }`}
                >
                  {professional.is_active ? 'פעיל' : 'לא פעיל'}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                {professional.company_name && (
                  <div>
                    <span className="text-text-secondary-light dark:text-text-secondary-dark">חברה: </span>
                    <span>{professional.company_name}</span>
                  </div>
                )}
                {professional.phone && (
                  <div>
                    <span className="text-text-secondary-light dark:text-text-secondary-dark">טלפון: </span>
                    <span>{professional.phone}</span>
                  </div>
                )}
                {professional.email && (
                  <div>
                    <span className="text-text-secondary-light dark:text-text-secondary-dark">אימייל: </span>
                    <span>{professional.email}</span>
                  </div>
                )}
                {professional.rating && (
                  <div>
                    <span className="text-text-secondary-light dark:text-text-secondary-dark">דירוג: </span>
                    {renderRating(professional.rating)}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        </div>
      )}
    </div>
  );
}
