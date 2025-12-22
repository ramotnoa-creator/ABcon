import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getProfessionalById,
  saveProfessionals,
  getAllProjectProfessionals,
  addProjectProfessional,
  removeProjectProfessional,
  getProfessionals,
} from '../../data/professionalsStorage';
import { getProjects } from '../../data/storage';
import type { Professional, ProjectProfessional } from '../../types';
import type { Project } from '../../types';

export default function ProfessionalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [relatedProjects, setRelatedProjects] = useState<
    Array<{
      project: Project;
      projectProfessional: ProjectProfessional;
    }>
  >([]);
  const [, setIsEditMode] = useState(false);
  const [isAddToProjectOpen, setIsAddToProjectOpen] = useState(false);
  const [formData, setFormData] = useState({
    project_id: '',
    project_role: '',
    start_date: '',
    notes: '',
  });
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (id) {
      const foundProfessional = getProfessionalById(id);
      if (foundProfessional) {
        setProfessional(foundProfessional);
        loadRelatedProjects(id);
      } else {
        navigate('/professionals');
      }
    }
  }, [id, navigate]);

  useEffect(() => {
    if (isAddToProjectOpen) {
      const allProjects = getProjects();
      const assignedProjectIds = new Set(
        relatedProjects.map((rp) => rp.projectProfessional.project_id)
      );
      const available = allProjects.filter((p) => !assignedProjectIds.has(p.id));
      setAvailableProjects(available);
    }
  }, [isAddToProjectOpen, relatedProjects]);

  const loadRelatedProjects = (professionalId: string) => {
    const allProjectProfessionals = getAllProjectProfessionals();
    const projects = getProjects();

    const related = allProjectProfessionals
      .filter((pp) => pp.professional_id === professionalId && pp.is_active)
      .map((pp) => {
        const project = projects.find((p) => p.id === pp.project_id);
        if (project) {
          return { project, projectProfessional: pp };
        }
        return null;
      })
      .filter((item): item is { project: Project; projectProfessional: ProjectProfessional } => item !== null);

    setRelatedProjects(related);
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleDeactivate = () => {
    if (!professional || !confirm('האם אתה בטוח שברצונך להשבית את איש המקצוע?')) return;

    const allProfessionals = getProfessionals();
    const updated = allProfessionals.map((p) =>
      p.id === professional.id ? { ...p, is_active: false } : p
    );
    saveProfessionals(updated);
    setProfessional({ ...professional, is_active: false });
  };

  const handleAddToProject = () => {
    if (!formData.project_id || !professional) return;

    const newProjectProfessional: ProjectProfessional = {
      id: `pp-${Date.now()}`,
      project_id: formData.project_id,
      professional_id: professional.id,
      project_role: formData.project_role || undefined,
      source: 'Manual',
      start_date: formData.start_date || undefined,
      is_active: true,
      notes: formData.notes || undefined,
    };

    addProjectProfessional(newProjectProfessional);
    setIsAddToProjectOpen(false);
    setFormData({ project_id: '', project_role: '', start_date: '', notes: '' });
    loadRelatedProjects(professional.id);
  };

  const handleRemoveFromProject = (projectId: string) => {
    if (!professional || !confirm('האם אתה בטוח שברצונך להסיר את איש המקצוע מהפרויקט?')) return;

    removeProjectProfessional(projectId, professional.id);
    loadRelatedProjects(professional.id);
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

  if (!professional) {
    return (
      <div className="flex-1 px-4 lg:px-10 py-6 max-w-[1400px] mx-auto w-full">
        <p className="text-text-secondary-light dark:text-text-secondary-dark">טוען...</p>
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
    </div>
  );
}
