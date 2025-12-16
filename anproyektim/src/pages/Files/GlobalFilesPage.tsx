import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllFiles, addFile, updateFile, saveFiles } from '../../data/filesStorage';
import { getProjects } from '../../data/storage';
import { seedFiles } from '../../data/filesData';
import type { File, FileEntityType } from '../../types';
import { formatDateForDisplay } from '../../utils/dateUtils';

const getFileIcon = (fileType?: string, fileName?: string): { icon: string; color: string } => {
  const ext = fileName?.split('.').pop()?.toLowerCase() || '';
  
  if (fileType?.includes('pdf') || ext === 'pdf') {
    return { icon: 'picture_as_pdf', color: 'bg-red-100 text-red-600' };
  }
  if (fileType?.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
    return { icon: 'image', color: 'bg-blue-100 text-blue-600' };
  }
  if (fileType?.includes('spreadsheet') || fileType?.includes('excel') || ['xlsx', 'xls'].includes(ext)) {
    return { icon: 'grid_on', color: 'bg-green-100 text-green-600' };
  }
  if (fileType?.includes('zip') || ext === 'zip' || ext === 'rar') {
    return { icon: 'folder_zip', color: 'bg-orange-100 text-orange-600' };
  }
  if (fileType?.includes('word') || ['doc', 'docx'].includes(ext)) {
    return { icon: 'description', color: 'bg-blue-100 text-blue-600' };
  }
  return { icon: 'insert_drive_file', color: 'bg-gray-100 text-gray-600' };
};

const getInitials = (name: string): string => {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export default function GlobalFilesPage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [projects, setProjects] = useState(getProjects());
  const [searchQuery, setSearchQuery] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = () => {
    let loaded = getAllFiles();
    
    // Seed if empty
    if (loaded.length === 0) {
      loaded = seedFiles;
      saveFiles(loaded);
    }
    
    setFiles(loaded);
  };

  const filteredFiles = useMemo(() => {
    let filtered = files;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.file_name.toLowerCase().includes(query) ||
          f.description_short?.toLowerCase().includes(query) ||
          f.uploaded_by.toLowerCase().includes(query) ||
          f.related_entity_name?.toLowerCase().includes(query)
      );
    }

    // Entity type filter
    if (entityTypeFilter !== 'all') {
      filtered = filtered.filter((f) => f.related_entity_type === entityTypeFilter);
    }

    return filtered;
  }, [files, searchQuery, entityTypeFilter]);

  const paginatedFiles = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredFiles.slice(start, start + itemsPerPage);
  }, [filteredFiles, currentPage]);

  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);

  const [uploadForm, setUploadForm] = useState({
    file_name: '',
    file_url: '',
    file_size_display: '',
    description_short: '',
    related_entity_type: '' as FileEntityType | '',
    related_entity_id: '',
    uploaded_by: 'ישראל ישראלי',
    notes: '',
  });

  const handleUpload = () => {
    if (!uploadForm.file_name.trim() || !uploadForm.file_url.trim()) return;

    const newFile: File = {
      id: `file-${Date.now()}`,
      file_name: uploadForm.file_name.trim(),
      file_url: uploadForm.file_url.trim(),
      file_size_display: uploadForm.file_size_display || undefined,
      description_short: uploadForm.description_short.trim() || undefined,
      related_entity_type: uploadForm.related_entity_type || undefined,
      related_entity_id: uploadForm.related_entity_id || undefined,
      related_entity_name: uploadForm.related_entity_id
        ? projects.find((p) => p.id === uploadForm.related_entity_id)?.project_name
        : undefined,
      uploaded_at: new Date().toISOString(),
      uploaded_by: uploadForm.uploaded_by.trim(),
      notes: uploadForm.notes.trim() || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addFile(newFile);
    loadFiles();
    setIsUploadModalOpen(false);
    setUploadForm({
      file_name: '',
      file_url: '',
      file_size_display: '',
      description_short: '',
      related_entity_type: '',
      related_entity_id: '',
      uploaded_by: 'ישראל ישראלי',
      notes: '',
    });
  };

  const handleEdit = (file: File) => {
    setEditingFile(file);
  };

  const handleSaveEdit = () => {
    if (!editingFile) return;

    updateFile(editingFile.id, {
      description_short: editingFile.description_short,
      notes: editingFile.notes,
      uploaded_by: editingFile.uploaded_by,
      related_entity_type: editingFile.related_entity_type,
      related_entity_id: editingFile.related_entity_id,
      related_entity_name: editingFile.related_entity_id
        ? projects.find((p) => p.id === editingFile.related_entity_id)?.project_name
        : undefined,
    });

    loadFiles();
    setEditingFile(null);
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
  };

  const handleOpenFile = (url: string) => {
    window.open(url, '_blank');
  };

  const handleNavigateToEntity = (file: File) => {
    if (file.related_entity_type === 'Project' && file.related_entity_id) {
      navigate(`/projects/${file.related_entity_id}`);
    }
  };

  return (
    <div className="flex-1 px-4 lg:px-10 py-6 max-w-[1400px] mx-auto w-full pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
          קבצים גלובליים
        </h1>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="hidden md:flex items-center justify-center h-10 px-5 rounded-lg bg-primary text-white hover:bg-primary-hover transition text-sm font-bold tracking-[0.015em] shadow-sm"
        >
          <span className="material-symbols-outlined me-2 text-[20px]">upload_file</span>
          העלאת קובץ חדש
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary-light text-[20px]">
            search
          </span>
          <input
            className="w-full h-10 pr-10 pl-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
            placeholder="חיפוש בקבצים..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="relative">
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary-light text-[18px]">
            filter_list
          </span>
          <select
            className="w-full md:w-48 h-10 pr-10 pl-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary appearance-none"
            value={entityTypeFilter}
            onChange={(e) => {
              setEntityTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">כל הקבצים</option>
            <option value="Project">קבצי פרויקטים</option>
            <option value="Task">קבצי משימות</option>
            <option value="Tender">קבצי מכרזים</option>
            <option value="Professional">קבצי אנשי מקצוע</option>
          </select>
        </div>
      </div>

      {/* Files Table - Desktop */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-background-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark">
              <tr>
                <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  שם קובץ
                </th>
                <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  תיאור קצר
                </th>
                <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  שייך ל-
                </th>
                <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  הועלה ע״י
                </th>
                <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  תאריך העלאה
                </th>
                <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {paginatedFiles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-secondary-light dark:text-text-secondary-dark">
                    אין קבצים
                  </td>
                </tr>
              ) : (
                paginatedFiles.map((file) => {
                  const fileIcon = getFileIcon(file.file_type, file.file_name);
                  return (
                    <tr
                      key={file.id}
                      className="group hover:bg-background-light dark:hover:bg-background-dark/50 transition-colors"
                    >
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className={`size-10 rounded ${fileIcon.color} flex items-center justify-center shrink-0`}>
                            <span className="material-symbols-outlined">{fileIcon.icon}</span>
                          </div>
                          <div>
                            <a
                              className="font-bold text-text-main-light dark:text-text-main-dark hover:text-primary underline decoration-transparent hover:decoration-primary transition-all cursor-pointer"
                              onClick={() => handleOpenFile(file.file_url)}
                            >
                              {file.file_name}
                            </a>
                            {file.file_size_display && (
                              <span className="block text-xs text-text-secondary-light mt-0.5">
                                {file.file_size_display}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle text-text-secondary-light dark:text-text-secondary-dark max-w-[200px] truncate">
                        {file.description_short || '-'}
                      </td>
                      <td className="px-6 py-4 align-middle">
                        {file.related_entity_name ? (
                          <button
                            onClick={() => handleNavigateToEntity(file)}
                            className="text-primary hover:text-primary-hover font-medium hover:underline transition-colors"
                          >
                            {file.related_entity_type === 'Project' && 'פרויקט: '}
                            {file.related_entity_name}
                          </button>
                        ) : (
                          <span className="text-text-secondary-light dark:text-text-secondary-dark">גלובלי</span>
                        )}
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                            {getInitials(file.uploaded_by)}
                          </div>
                          <span className="text-sm font-medium">{file.uploaded_by}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle font-medium">
                        {formatDateForDisplay(file.uploaded_at)}
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center gap-2 opacity-100 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenFile(file.file_url)}
                            className="p-1.5 rounded-lg text-text-secondary-light hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="פתיחת קובץ"
                          >
                            <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                          </button>
                          <button
                            onClick={() => handleEdit(file)}
                            className="p-1.5 rounded-lg text-text-secondary-light hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="עריכת מטא דאטה"
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="block md:hidden divide-y divide-border-light dark:divide-border-dark">
          {paginatedFiles.length === 0 ? (
            <div className="p-4 text-center text-text-secondary-light dark:text-text-secondary-dark">
              אין קבצים
            </div>
          ) : (
            paginatedFiles.map((file) => {
              const fileIcon = getFileIcon(file.file_type, file.file_name);
              return (
                <div key={file.id} className="p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`size-10 rounded ${fileIcon.color} flex items-center justify-center shrink-0`}>
                        <span className="material-symbols-outlined">{fileIcon.icon}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-text-main-light dark:text-text-main-dark line-clamp-1">
                          {file.file_name}
                        </h3>
                        <p className="text-xs text-text-secondary-light">
                          {file.description_short || '-'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-text-secondary-light bg-background-light dark:bg-surface-dark px-2 py-1 rounded border border-border-light">
                      {formatDateForDisplay(file.uploaded_at).split('/').slice(0, 2).join('/')}
                    </span>
                  </div>
                  {file.related_entity_name && (
                    <div className="text-xs text-text-secondary-light">
                      שייך ל: {file.related_entity_name}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2">
                      <div className="size-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold">
                        {getInitials(file.uploaded_by)}
                      </div>
                      <span className="text-xs text-text-secondary-light">{file.uploaded_by}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(file)}
                        className="flex items-center justify-center size-8 rounded-full bg-background-light dark:bg-surface-dark border border-border-light text-primary hover:bg-primary hover:text-white transition-colors"
                        title="עריכת מטא דאטה"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button
                        onClick={() => handleOpenFile(file.file_url)}
                        className="flex items-center justify-center size-8 rounded-full bg-primary text-white shadow-sm hover:bg-primary-hover transition-colors"
                        title="פתיחת קובץ"
                      >
                        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pagination */}
      {filteredFiles.length > 0 && (
        <div className="flex items-center justify-between border-t border-border-light dark:border-border-dark pt-4 mt-6">
          <p className="text-sm text-text-secondary-light">
            מציג {Math.min((currentPage - 1) * itemsPerPage + 1, filteredFiles.length)}-
            {Math.min(currentPage * itemsPerPage, filteredFiles.length)} מתוך {filteredFiles.length} קבצים
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border border-border-light dark:border-border-dark text-sm hover:bg-white dark:hover:bg-surface-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              הקודם
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1 rounded border border-border-light dark:border-border-dark text-sm hover:bg-white dark:hover:bg-surface-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              הבא
            </button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg border border-border-light dark:border-border-dark w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border-light dark:border-border-dark sticky top-0 bg-surface-light dark:bg-surface-dark">
              <h3 className="text-lg font-bold">העלאת קובץ חדש</h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="size-8 flex items-center justify-center hover:bg-background-light dark:hover:bg-background-dark rounded transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">
                  שם קובץ <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="שם הקובץ"
                  value={uploadForm.file_name}
                  onChange={(e) => setUploadForm({ ...uploadForm, file_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">
                  קישור לקובץ <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="https://..."
                  type="url"
                  value={uploadForm.file_url}
                  onChange={(e) => setUploadForm({ ...uploadForm, file_url: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">שייך ל-</label>
                  <select
                    className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                    value={uploadForm.related_entity_type}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, related_entity_type: e.target.value as FileEntityType | '', related_entity_id: '' })
                    }
                  >
                    <option value="">גלובלי</option>
                    <option value="Project">פרויקט</option>
                    <option value="Task">משימה</option>
                    <option value="Tender">מכרז</option>
                    <option value="Professional">איש מקצוע</option>
                  </select>
                </div>
                {uploadForm.related_entity_type === 'Project' && (
                  <div>
                    <label className="block text-sm font-bold mb-2">בחר פרויקט</label>
                    <select
                      className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                      value={uploadForm.related_entity_id}
                      onChange={(e) => setUploadForm({ ...uploadForm, related_entity_id: e.target.value })}
                    >
                      <option value="">בחר פרויקט...</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.project_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">גודל קובץ</label>
                <input
                  className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="לדוגמה: 2.4 MB"
                  value={uploadForm.file_size_display}
                  onChange={(e) => setUploadForm({ ...uploadForm, file_size_display: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">תיאור קצר</label>
                <input
                  className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="תיאור קצר של הקובץ"
                  value={uploadForm.description_short}
                  onChange={(e) => setUploadForm({ ...uploadForm, description_short: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">הועלה ע״י</label>
                <input
                  className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="שם המעלה"
                  value={uploadForm.uploaded_by}
                  onChange={(e) => setUploadForm({ ...uploadForm, uploaded_by: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">הערות</label>
                <textarea
                  className="w-full p-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary resize-none h-20"
                  placeholder="הערות..."
                  value={uploadForm.notes}
                  onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold text-sm transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!uploadForm.file_name.trim() || !uploadForm.file_url.trim()}
                  className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  העלאה
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg border border-border-light dark:border-border-dark w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border-light dark:border-border-dark sticky top-0 bg-surface-light dark:bg-surface-dark">
              <h3 className="text-lg font-bold">עריכת מטא דאטה</h3>
              <button
                onClick={() => setEditingFile(null)}
                className="size-8 flex items-center justify-center hover:bg-background-light dark:hover:bg-background-dark rounded transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">שם קובץ</label>
                <input
                  className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm cursor-not-allowed opacity-60"
                  value={editingFile.file_name}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">תיאור קצר</label>
                <input
                  className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                  value={editingFile.description_short || ''}
                  onChange={(e) =>
                    setEditingFile({ ...editingFile, description_short: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">שייך ל-</label>
                  <select
                    className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                    value={editingFile.related_entity_type || ''}
                    onChange={(e) =>
                      setEditingFile({
                        ...editingFile,
                        related_entity_type: e.target.value as FileEntityType | undefined,
                        related_entity_id: e.target.value ? editingFile.related_entity_id : undefined,
                      })
                    }
                  >
                    <option value="">גלובלי</option>
                    <option value="Project">פרויקט</option>
                    <option value="Task">משימה</option>
                    <option value="Tender">מכרז</option>
                    <option value="Professional">איש מקצוע</option>
                  </select>
                </div>
                {editingFile.related_entity_type === 'Project' && (
                  <div>
                    <label className="block text-sm font-bold mb-2">בחר פרויקט</label>
                    <select
                      className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                      value={editingFile.related_entity_id || ''}
                      onChange={(e) => setEditingFile({ ...editingFile, related_entity_id: e.target.value })}
                    >
                      <option value="">בחר פרויקט...</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.project_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">הועלה ע״י</label>
                <input
                  className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                  value={editingFile.uploaded_by}
                  onChange={(e) => setEditingFile({ ...editingFile, uploaded_by: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">הערות</label>
                <textarea
                  className="w-full p-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary resize-none h-20"
                  value={editingFile.notes || ''}
                  onChange={(e) => setEditingFile({ ...editingFile, notes: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setEditingFile(null)}
                  className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold text-sm transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover font-bold text-sm transition-colors"
                >
                  שמירה
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark md:hidden z-50 flex gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex-1 flex items-center justify-center h-12 px-4 rounded-lg bg-primary text-white font-bold text-sm shadow-md hover:bg-primary-hover transition-colors"
        >
          <span className="material-symbols-outlined me-2 text-[20px]">upload_file</span>
          העלאת קובץ חדש
        </button>
      </div>
    </div>
  );
}
