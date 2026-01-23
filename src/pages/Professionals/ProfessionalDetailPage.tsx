import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getProfessionalById,
  updateProfessional,
} from '../../services/professionalsService';
import { getProjects } from '../../services/projectsService';
import {
  getProjectProfessionalsByProfessionalId,
  createProjectProfessional,
  removeProjectProfessional,
} from '../../services/projectProfessionalsService';
import { useToast } from '../../contexts/ToastContext';
import type { Professional, ProjectProfessional } from '../../types';
import type { Project } from '../../types';

type RelatedProject = {
  project: Project;
  projectProfessional: ProjectProfessional;
};

export default function ProfessionalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  // Initialize state - will load async
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [relatedProjects, setRelatedProjects] = useState<RelatedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [, setIsAddToProjectOpen] = useState(false);
  const [formData, setFormData] = useState({
    project_id: '',
    project_role: '',
    start_date: '',
    notes: '',
  });
  const [editFormData, setEditFormData] = useState({
    professional_name: '',
    company_name: '',
    field: '',
    phone: '',
    email: '',
    notes: '',
    rating: 0,
  });

  // Load professional and related projects on mount
  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        navigate('/professionals');
        return;
      }

      try {
        setIsLoading(true);
        const professionalData = await getProfessionalById(id);

        if (!professionalData) {
          navigate('/professionals');
          return;
        }

        setProfessional(professionalData);

        // Load related projects
        const [projectProfessionals, allProjects] = await Promise.all([
          getProjectProfessionalsByProfessionalId(id),
          getProjects(),
        ]);

        const related: RelatedProject[] = projectProfessionals
          .map((pp) => {
            const project = allProjects.find((p) => p.id === pp.project_id);
            if (project) {
              return { project, projectProfessional: pp };
            }
            return null;
          })
          .filter((item): item is RelatedProject => item !== null);

        setRelatedProjects(related);
      } catch (error) {
        console.error('Error loading professional data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, navigate]);

  const loadRelatedProjects = useCallback(async (professionalId: string) => {
    try {
      const [projectProfessionals, allProjects] = await Promise.all([
        getProjectProfessionalsByProfessionalId(professionalId),
        getProjects(),
      ]);

      const related: RelatedProject[] = projectProfessionals
        .map((pp) => {
          const project = allProjects.find((p) => p.id === pp.project_id);
          if (project) {
            return { project, projectProfessional: pp };
          }
          return null;
        })
        .filter((item): item is RelatedProject => item !== null);

      setRelatedProjects(related);
    } catch (error) {
      console.error('Error loading related projects:', error);
    }
  }, []);

  // Compute available projects (always computed, not just when modal is open)
  const [allProjects, setAllProjects] = useState<Project[]>([]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const projects = await getProjects();
        setAllProjects(projects);
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    };
    loadProjects();
  }, []);

  const availableProjects = useMemo(() => {
    const assignedProjectIds = new Set(
      relatedProjects.map((rp) => rp.projectProfessional.project_id)
    );
    return allProjects.filter((p) => !assignedProjectIds.has(p.id));
  }, [allProjects, relatedProjects]);

  const handleEdit = () => {
    if (!professional) return;
    setEditFormData({
      professional_name: professional.professional_name,
      company_name: professional.company_name || '',
      field: professional.field,
      phone: professional.phone || '',
      email: professional.email || '',
      notes: professional.notes || '',
      rating: professional.rating || 0,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!professional) return;

    const updates = {
      professional_name: editFormData.professional_name.trim(),
      company_name: editFormData.company_name.trim() || undefined,
      field: editFormData.field.trim(),
      phone: editFormData.phone.trim() || undefined,
      email: editFormData.email.trim() || undefined,
      notes: editFormData.notes.trim() || undefined,
      rating: editFormData.rating || undefined,
    };

    try {
      await updateProfessional(professional.id, updates);

      // Update local state
      setProfessional({
        ...professional,
        ...updates,
      });

      setIsEditModalOpen(false);
      showSuccess('הפרטים עודכנו בהצלחה!');
    } catch (error) {
      console.error('Error updating professional:', error);
      showError('שגיאה בעדכון הפרטים. אנא נסה שוב.');
    }
  };

  const handleDeactivate = async () => {
    if (!professional || !confirm('האם אתה בטוח שברצונך להשבית את איש המקצוע?')) return;

    try {
      await updateProfessional(professional.id, { is_active: false });
      setProfessional({ ...professional, is_active: false });
      showSuccess('איש המקצוע הושבת בהצלחה');
    } catch (error) {
      console.error('Error deactivating professional:', error);
      showError('שגיאה בהשבתת איש המקצוע. אנא נסה שוב.');
    }
  };

  const handleAddToProject = async () => {
    if (!formData.project_id || !professional) return;

    const newProjectProfessional: Omit<ProjectProfessional, 'id'> = {
      project_id: formData.project_id,
      professional_id: professional.id,
      project_role: formData.project_role || undefined,
      source: 'Manual',
      start_date: formData.start_date || undefined,
      is_active: true,
      notes: formData.notes || undefined,
    };

    try {
      await createProjectProfessional(newProjectProfessional);
      setIsAddToProjectOpen(false);
      setFormData({ project_id: '', project_role: '', start_date: '', notes: '' });
      await loadRelatedProjects(professional.id);
      showSuccess('איש המקצוע נוסף לפרויקט בהצלחה!');
    } catch (error) {
      console.error('Error adding professional to project:', error);
      showError('שגיאה בהוספה לפרויקט. אנא נסה שוב.');
    }
  };

  const handleRemoveFromProject = async (projectId: string) => {
    if (!professional || !confirm('האם אתה בטוח שברצונך להסיר את איש המקצוע מהפרויקט?')) return;

    try {
      await removeProjectProfessional(projectId, professional.id);
      await loadRelatedProjects(professional.id);
      showSuccess('איש המקצוע הוסר מהפרויקט בהצלחה');
    } catch (error) {
      console.error('Error removing professional from project:', error);
      showError('שגיאה בהסרה מהפרויקט. אנא נסה שוב.');
    }
  };

  const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
  };

  const getProjectStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      פעיל: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
      מושהה: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
      הושלם: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200',
    };
    return colors[status] || colors['פעיל'];
  };

  if (isLoading || !professional) {
    return (
      <div className="flex-1 px-4 lg:px-10 py-6 max-w-[1400px] mx-auto w-full">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 lg:px-10 py-6 max-w-[1400px] mx-auto w-full pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-lg bg-primary text-white flex items-center justify-center text-2xl font-bold shadow-sm">
            {getInitials(professional.professional_name)}
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl md:text-3xl font-bold leading-tight tracking-tight">
              {professional.professional_name}
            </h1>
            <div className="flex items-center gap-3 text-sm text-text-secondary-light dark:text-text-secondary-dark">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">badge</span>
                <span>מזהה: {professional.id.replace('prof-', '')}</span>
              </span>
              <span className="size-1 rounded-full bg-current opacity-50"></span>
              <span
                className={`flex items-center gap-1 font-medium px-1.5 py-0.5 rounded ${getStatusColor(
                  professional.is_active
                )}`}
              >
                <span className="size-1.5 rounded-full bg-current"></span>
                {professional.is_active ? 'פעיל' : 'לא פעיל'}
              </span>
            </div>
          </div>
        </div>
        <div className="hidden md:flex gap-3">
          <button
            onClick={handleEdit}
            className="flex items-center justify-center h-9 px-4 rounded-lg bg-white border border-border-light dark:bg-surface-dark dark:border-border-dark hover:bg-gray-50 transition text-sm font-bold text-text-main-light dark:text-text-main-dark shadow-sm"
          >
            <span className="material-symbols-outlined me-2 text-[18px]">edit</span>
            עריכת פרטים
          </button>
          <button
            onClick={handleDeactivate}
            className="flex items-center justify-center h-9 px-4 rounded-lg bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition text-sm font-bold dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-300"
          >
            <span className="material-symbols-outlined me-2 text-[18px]">block</span>
            השבתת משתמש
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Professional Details & Manual Assignment */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Professional Details Card */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
            <div className="px-5 py-4 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
              <h3 className="font-bold text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">person</span>
                פרטי איש מקצוע
              </h3>
              <button
                onClick={handleEdit}
                className="md:hidden text-primary text-sm font-bold"
              >
                עריכה
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wide mb-1">
                    שם מלא
                  </label>
                  <div className="text-sm font-medium">{professional.professional_name}</div>
                </div>
                {professional.company_name && (
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wide mb-1">
                      שם חברה
                    </label>
                    <div className="text-sm font-medium">{professional.company_name}</div>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wide mb-1">
                    תחום התמחות
                  </label>
                  <div className="inline-flex items-center px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                    {professional.field}
                  </div>
                </div>
                {professional.rating !== undefined && professional.rating > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wide mb-1">
                      דירוג
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`material-symbols-outlined text-[20px] ${
                            star <= (professional.rating || 0)
                              ? 'text-amber-400'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        >
                          star
                        </span>
                      ))}
                      <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mr-1">
                        ({professional.rating}/5)
                      </span>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {professional.phone && (
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wide mb-1">
                        טלפון
                      </label>
                      <div className="text-sm font-medium font-mono dir-ltr text-right">
                        {professional.phone}
                      </div>
                    </div>
                  )}
                  {professional.email && (
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wide mb-1">
                        אימייל
                      </label>
                      <div className="text-sm font-medium truncate" title={professional.email}>
                        {professional.email}
                      </div>
                    </div>
                  )}
                </div>
                {professional.notes && (
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wide mb-1">
                      הערות
                    </label>
                    <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark leading-relaxed bg-background-light dark:bg-background-dark p-3 rounded border border-border-light dark:border-border-dark">
                      {professional.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Manual Assignment Card */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
            <div className="px-5 py-4 border-b border-border-light dark:border-border-dark bg-gray-50/50 dark:bg-white/5">
              <h3 className="font-bold text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">assignment_add</span>
                שיוך ידני לפרויקט
              </h3>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark mb-1.5">
                  בחירת פרויקט
                </label>
                <select
                  className="w-full h-10 px-3 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-shadow"
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                >
                  <option disabled value="">
                    בחר פרויקט מהרשימה...
                  </option>
                  {availableProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.project_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark mb-1.5">
                    תפקיד בפרויקט
                  </label>
                  <input
                    className="w-full h-10 px-3 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-shadow"
                    placeholder="לדוג': יועץ שלד"
                    type="text"
                    value={formData.project_role}
                    onChange={(e) => setFormData({ ...formData, project_role: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark mb-1.5">
                    תאריך התחלה
                  </label>
                  <input
                    className="w-full h-10 px-3 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-shadow text-text-secondary-light"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary-light dark:text-text-secondary-dark mb-1.5">
                  הערות לשיוך
                </label>
                <textarea
                  className="w-full p-3 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-shadow resize-none h-20"
                  placeholder="הערות מיוחדות לשיוך זה..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <button
                onClick={handleAddToProject}
                disabled={!formData.project_id}
                className="w-full h-10 mt-2 bg-primary hover:bg-primary-hover text-white font-bold text-sm rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                הוסף לפרויקט
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Related Projects */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-sm border border-border-light dark:border-border-dark overflow-hidden flex flex-col h-full">
            <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">folder_shared</span>
                <h3 className="font-bold text-lg">פרויקטים קשורים</h3>
                <span className="px-2 py-0.5 rounded-full bg-border-light dark:bg-border-dark text-xs font-bold">
                  {relatedProjects.length}
                </span>
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-background-light dark:bg-background-dark text-text-secondary-light dark:text-text-secondary-dark font-semibold border-b border-border-light dark:border-border-dark">
                  <tr>
                    <th className="px-6 py-3 whitespace-nowrap">שם הפרויקט</th>
                    <th className="px-4 py-3 whitespace-nowrap">תפקיד</th>
                    <th className="px-4 py-3 whitespace-nowrap">מקור</th>
                    <th className="px-4 py-3 whitespace-nowrap">סטטוס</th>
                    <th className="px-4 py-3 whitespace-nowrap">הערות</th>
                    <th className="px-4 py-3 w-[100px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                  {relatedProjects.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-text-secondary-light dark:text-text-secondary-dark">
                        אין פרויקטים קשורים
                      </td>
                    </tr>
                  ) : (
                    relatedProjects.map((item) => (
                      <tr
                        key={item.projectProfessional.id}
                        className="group hover:bg-background-light/50 dark:hover:bg-background-dark/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-text-main-light dark:text-text-main-dark">
                            {item.project.project_name}
                          </div>
                          <div className="text-xs text-text-secondary-light mt-0.5">
                            #{item.project.id.replace('project-', '')}
                          </div>
                        </td>
                        <td className="px-4 py-4">{item.projectProfessional.project_role || '-'}</td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark text-xs font-medium">
                            {item.projectProfessional.source === 'Tender' ? 'מכרז פנימי' : 'ידני'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${getProjectStatusColor(
                              item.projectProfessional.is_active ? 'פעיל' : 'מושהה'
                            )}`}
                          >
                            <span className="size-1.5 rounded-full bg-current"></span>
                            {item.projectProfessional.is_active ? 'פעיל' : 'מושהה'}
                          </span>
                        </td>
                        <td className="px-4 py-4 max-w-xs">
                          <p
                            className="truncate text-text-secondary-light text-xs"
                            title={item.projectProfessional.notes || '-'}
                          >
                            {item.projectProfessional.notes || '-'}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-left">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => navigate(`/projects/${item.project.id}`)}
                              className="p-1.5 rounded hover:bg-white dark:hover:bg-surface-dark border border-transparent hover:border-border-light text-text-secondary-light hover:text-primary transition-all"
                              title="פתיחת פרויקט"
                            >
                              <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                            </button>
                            <button
                              onClick={() => handleRemoveFromProject(item.project.id)}
                              className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-text-secondary-light hover:text-red-600 transition-colors"
                              title="השבתת שיוך"
                            >
                              <span className="material-symbols-outlined text-[20px]">person_remove</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden flex flex-col divide-y divide-border-light dark:divide-border-dark">
              {relatedProjects.length === 0 ? (
                <div className="p-5 text-center text-text-secondary-light dark:text-text-secondary-dark">
                  אין פרויקטים קשורים
                </div>
              ) : (
                relatedProjects.map((item) => (
                  <div key={item.projectProfessional.id} className="p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm">{item.project.project_name}</h4>
                        <span className="text-xs text-text-secondary-light">
                          {item.projectProfessional.source === 'Tender'
                            ? `מכרז: ${item.projectProfessional.related_tender_name || 'מכרז פנימי 2023/4'}`
                            : 'מקור: שיוך ידני'}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${getProjectStatusColor(
                          item.projectProfessional.is_active ? 'פעיל' : 'מושהה'
                        )}`}
                      >
                        {item.projectProfessional.is_active ? 'פעיל' : 'מושהה'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs mt-1">
                      {item.projectProfessional.project_role && (
                        <div className="bg-background-light dark:bg-background-dark px-2 py-1 rounded border border-border-light dark:border-border-dark">
                          <span className="text-text-secondary-light">תפקיד:</span>
                          <span className="font-medium">{item.projectProfessional.project_role}</span>
                        </div>
                      )}
                      <div className="bg-background-light dark:bg-background-dark px-2 py-1 rounded border border-border-light dark:border-border-dark">
                        <span className="text-text-secondary-light">מקור:</span>
                        <span className="font-medium">
                          {item.projectProfessional.source === 'Tender' ? 'מכרז' : 'ידני'}
                        </span>
                      </div>
                    </div>
                    {item.projectProfessional.notes && (
                      <div className="bg-amber-50 dark:bg-amber-900/10 p-2 rounded text-xs text-amber-800 dark:text-amber-200 border border-amber-100 dark:border-amber-900/30">
                        <span className="font-bold">הערות:</span> {item.projectProfessional.notes}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <button
                        onClick={() => navigate(`/projects/${item.project.id}`)}
                        className="flex items-center justify-center py-2 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        פתיחת פרויקט
                      </button>
                      <button
                        onClick={() => handleRemoveFromProject(item.project.id)}
                        className="flex items-center justify-center py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-300"
                      >
                        השבתת שיוך
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark md:hidden z-50 flex gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button
          onClick={handleEdit}
          className="flex-1 flex items-center justify-center h-12 px-4 rounded-lg bg-white border border-border-light text-text-main-light font-bold text-sm"
        >
          <span className="material-symbols-outlined me-2 text-[20px]">edit</span>
          עריכה
        </button>
        <button
          onClick={() => setIsAddToProjectOpen(true)}
          className="flex-1 flex items-center justify-center h-12 px-4 rounded-lg bg-primary text-white font-bold text-sm shadow-md"
        >
          <span className="material-symbols-outlined me-2 text-[20px]">add</span>
          הוסף לפרויקט
        </button>
      </div>

      {/* Edit Professional Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border-light dark:border-border-dark flex items-center justify-between">
              <h2 className="text-xl font-black">עריכת פרטי איש מקצוע</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="size-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">
                  שם מלא <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                  value={editFormData.professional_name}
                  onChange={(e) => setEditFormData({ ...editFormData, professional_name: e.target.value })}
                  placeholder="שם איש המקצוע"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">שם חברה</label>
                <input
                  type="text"
                  className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                  value={editFormData.company_name}
                  onChange={(e) => setEditFormData({ ...editFormData, company_name: e.target.value })}
                  placeholder="שם החברה (אופציונלי)"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">
                  תחום התמחות <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                  value={editFormData.field}
                  onChange={(e) => setEditFormData({ ...editFormData, field: e.target.value })}
                  placeholder="לדוג': אדריכלות, הנדסה, חשמל"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">טלפון</label>
                  <input
                    type="tel"
                    className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    placeholder="050-0000000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">אימייל</label>
                  <input
                    type="email"
                    className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">דירוג</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, rating: star })}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <span
                        className={`material-symbols-outlined text-[28px] ${
                          star <= editFormData.rating
                            ? 'text-amber-400'
                            : 'text-gray-300 dark:text-gray-600 hover:text-amber-200'
                        }`}
                      >
                        star
                      </span>
                    </button>
                  ))}
                  {editFormData.rating > 0 && (
                    <button
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, rating: 0 })}
                      className="mr-2 text-xs text-text-secondary-light hover:text-red-500"
                    >
                      נקה
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">הערות</label>
                <textarea
                  className="w-full p-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary resize-none h-20"
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="הערות נוספות..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border-light dark:border-border-dark">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold text-sm transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={!editFormData.professional_name.trim() || !editFormData.field.trim()}
                  className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  שמור שינויים
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
