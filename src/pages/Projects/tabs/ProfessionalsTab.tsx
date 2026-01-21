import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfessionals } from '../../../services/professionalsService';
import {
  getProjectProfessionalsByProjectId,
  createProjectProfessional,
  removeProjectProfessional,
} from '../../../services/projectProfessionalsService';
import { Toast } from '../../../components/Toast';
import type { Project, Professional, ProjectProfessionalSource } from '../../../types';

interface ProfessionalsTabProps {
  project: Project;
}

type ProjectProfessionalItem = { professional: Professional; projectRole: string | undefined; source: ProjectProfessionalSource };

const loadInitialProjectProfessionals = async (projectId: string): Promise<ProjectProfessionalItem[]> => {
  const [projectProfessionals, professionals] = await Promise.all([
    getProjectProfessionalsByProjectId(projectId),
    getProfessionals(),
  ]);

  return projectProfessionals
    .map((pp) => {
      const professional = professionals.find((p) => p.id === pp.professional_id);
      if (professional) {
        return {
          professional,
          projectRole: pp.project_role,
          source: pp.source,
        };
      }
      return null;
    })
    .filter((item): item is ProjectProfessionalItem => item !== null);
};

export default function ProfessionalsTab({ project }: ProfessionalsTabProps) {
  const navigate = useNavigate();
  const [projectProfessionals, setProjectProfessionals] = useState<ProjectProfessionalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [availableProfessionals, setAvailableProfessionals] = useState<Professional[]>([]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadProjectProfessionals = useCallback(async () => {
    try {
      setIsLoading(true);
      const loaded = await loadInitialProjectProfessionals(project.id);
      setProjectProfessionals(loaded);
    } catch (error) {
      console.error('Error loading project professionals:', error);
    } finally {
      setIsLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    loadProjectProfessionals();
  }, [loadProjectProfessionals]);

  const handleAddClick = async () => {
    try {
      const allProfessionals = await getProfessionals();
      const assignedIds = new Set(projectProfessionals.map((pp) => pp.professional.id));
      const available = allProfessionals.filter((p) => p.is_active && !assignedIds.has(p.id));
      setAvailableProfessionals(available);
      setIsAddModalOpen(true);
    } catch (error) {
      console.error('Error loading professionals:', error);
    }
  };

  const handleAddProfessional = async () => {
    if (!selectedProfessionalId) return;

    try {
      await createProjectProfessional({
        project_id: project.id,
        professional_id: selectedProfessionalId,
        project_role: undefined,
        source: 'Manual' as const,
        is_active: true,
      });

      await loadProjectProfessionals();
      setIsAddModalOpen(false);
      setSelectedProfessionalId('');
      setToast({ message: 'איש מקצוע נוסף לפרויקט בהצלחה', type: 'success' });
    } catch (error) {
      console.error('Error adding professional to project:', error);
      setToast({ message: 'שגיאה בהוספת איש מקצוע לפרויקט', type: 'error' });
    }
  };

  const handleRemoveProfessional = async (professionalId: string) => {
    if (confirm('האם אתה בטוח שברצונך להסיר את איש המקצוע מהפרויקט?')) {
      try {
        await removeProjectProfessional(project.id, professionalId);
        await loadProjectProfessionals();
        setToast({ message: 'איש מקצוע הוסר מהפרויקט', type: 'success' });
      } catch (error) {
        console.error('Error removing professional from project:', error);
        setToast({ message: 'שגיאה בהסרת איש מקצוע מהפרויקט', type: 'error' });
      }
    }
  };

  const handleProfessionalClick = (professionalId: string) => {
    navigate(`/professionals/${professionalId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-end">
        <button
          onClick={handleAddClick}
          className="flex items-center justify-center h-10 px-4 rounded-lg bg-primary text-white hover:bg-primary-hover transition text-sm font-bold"
        >
          <span className="material-symbols-outlined me-2 text-[18px]">add</span>
          הוספה מהמאגר
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background-light dark:bg-background-dark border-b border-border-light dark:border-border-dark">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                    שם איש מקצוע
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                    חברה
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                    תחום
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                    טלפון
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                    אימייל
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                    תפקיד בפרויקט
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                    מקור
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
                    פעולות
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {projectProfessionals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-text-secondary-light dark:text-text-secondary-dark">
                    אין אנשי מקצוע משויכים לפרויקט זה
                  </td>
                </tr>
              ) : (
                projectProfessionals.map((item) => (
                  <tr
                    key={item.professional.id}
                    className="hover:bg-background-light dark:hover:bg-background-dark transition-colors"
                  >
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleProfessionalClick(item.professional.id)}
                        className="text-sm font-medium hover:text-primary transition-colors text-start"
                      >
                        {item.professional.professional_name}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm">{item.professional.company_name || '-'}</td>
                    <td className="px-6 py-4 text-sm">{item.professional.field}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {item.professional.phone || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {item.professional.email || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">{item.projectRole || '-'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                          item.source === 'Tender'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200'
                        }`}
                      >
                        {item.source === 'Tender' ? '🏆 מכרז' : '✋ ידני'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleRemoveProfessional(item.professional.id)}
                        className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                      >
                        הסרה
                      </button>
                    </td>
                  </tr>
                ))
              )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden flex flex-col gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : projectProfessionals.length === 0 ? (
          <div className="text-center py-12 text-text-secondary-light dark:text-text-secondary-dark">
            אין אנשי מקצוע משויכים לפרויקט זה
          </div>
        ) : (
          projectProfessionals.map((item) => (
            <div
              key={item.professional.id}
              className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-4"
            >
              <div className="flex justify-between items-start mb-3">
                <button
                  onClick={() => handleProfessionalClick(item.professional.id)}
                  className="text-lg font-bold hover:text-primary transition-colors text-start flex-1"
                >
                  {item.professional.professional_name}
                </button>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ms-2 ${
                    item.source === 'Tender'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200'
                  }`}
                >
                  {item.source === 'Tender' ? '🏆 מכרז' : '✋ ידני'}
                </span>
              </div>
              <div className="space-y-2 text-sm mb-3">
                {item.professional.company_name && (
                  <div>
                    <span className="text-text-secondary-light dark:text-text-secondary-dark">חברה: </span>
                    <span>{item.professional.company_name}</span>
                  </div>
                )}
                <div>
                  <span className="text-text-secondary-light dark:text-text-secondary-dark">תחום: </span>
                  <span>{item.professional.field}</span>
                </div>
                {item.professional.phone && (
                  <div>
                    <span className="text-text-secondary-light dark:text-text-secondary-dark">טלפון: </span>
                    <span>{item.professional.phone}</span>
                  </div>
                )}
                {item.professional.email && (
                  <div>
                    <span className="text-text-secondary-light dark:text-text-secondary-dark">אימייל: </span>
                    <span>{item.professional.email}</span>
                  </div>
                )}
                {item.projectRole && (
                  <div>
                    <span className="text-text-secondary-light dark:text-text-secondary-dark">תפקיד בפרויקט: </span>
                    <span>{item.projectRole}</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => handleRemoveProfessional(item.professional.id)}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
              >
                הסרה מהפרויקט
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add Professional Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg border border-border-light dark:border-border-dark w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border-light dark:border-border-dark">
              <h3 className="text-lg font-bold">הוספת איש מקצוע מהמאגר</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="size-8 flex items-center justify-center hover:bg-background-light dark:hover:bg-background-dark rounded transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">בחר איש מקצוע</label>
                <select
                  className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  value={selectedProfessionalId}
                  onChange={(e) => setSelectedProfessionalId(e.target.value)}
                >
                  <option value="">בחר איש מקצוע...</option>
                  {availableProfessionals.map((prof) => (
                    <option key={prof.id} value={prof.id}>
                      {prof.professional_name} - {prof.field}
                      {prof.company_name ? ` (${prof.company_name})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              {availableProfessionals.length === 0 && (
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
                  כל אנשי המקצוע כבר משויכים לפרויקט זה, או שאין אנשי מקצוע פעילים במאגר.
                </p>
              )}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold text-sm transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={handleAddProfessional}
                  disabled={!selectedProfessionalId || availableProfessionals.length === 0}
                  className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  הוספה
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
