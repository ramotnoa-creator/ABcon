import { useState, useMemo, useCallback, useEffect } from 'react';
import { getFiles, createFile, updateFile, getAllFiles, removeFileFromProject } from '../../../services/filesService';
import { saveFiles } from '../../../data/filesStorage';
import { seedFiles } from '../../../data/filesData';
import { openGoogleDrivePicker, isGoogleDriveConfigured } from '../../../services/googleDriveService';
import { Toast } from '../../../components/Toast';
import type { Project } from '../../../types';
import type { File } from '../../../types';
import { formatDateForDisplay } from '../../../utils/dateUtils';

interface FilesTabProps {
  project: Project;
}

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

const loadInitialFiles = async (projectId: string): Promise<File[]> => {
  let loaded = await getFiles(projectId);

  // Seed if empty
  if (loaded.length === 0) {
    const projectFiles = seedFiles.filter(
      (f) => f.related_entity_type === 'Project' && f.related_entity_id === projectId
    );
    if (projectFiles.length > 0) {
      const all = await getAllFiles();
      projectFiles.forEach((file) => all.push(file));
      saveFiles(all);
      loaded = projectFiles;
    }
  }

  return loaded;
};

export default function FilesTab({ project }: FilesTabProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      const loaded = await loadInitialFiles(project.id);
      setFiles(loaded);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setIsLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    const query = searchQuery.toLowerCase();
    return files.filter(
      (f) =>
        f.file_name.toLowerCase().includes(query) ||
        f.description_short?.toLowerCase().includes(query) ||
        f.uploaded_by.toLowerCase().includes(query)
    );
  }, [files, searchQuery]);

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
    uploaded_by: 'ישראל ישראלי', // Default or from user context
    notes: '',
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isPickingFromDrive, setIsPickingFromDrive] = useState(false);

  const handleGoogleDrivePick = async () => {
    setIsPickingFromDrive(true);
    try {
      const result = await openGoogleDrivePicker();
      if (result.success && result.file) {
        setUploadForm({
          ...uploadForm,
          file_name: result.file.name,
          file_url: result.file.webViewLink || result.file.url,
          file_size_display: result.file.size || '',
        });
        setToast({ message: 'קובץ נבחר בהצלחה מ-Google Drive', type: 'success' });
      } else if (result.error && result.error !== 'בחירה בוטלה') {
        setToast({ message: result.error, type: 'error' });
      }
    } catch (error) {
      console.error('Error picking from Google Drive:', error);
      setToast({ message: 'שגיאה בחיבור ל-Google Drive', type: 'error' });
    } finally {
      setIsPickingFromDrive(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file_name.trim() || !uploadForm.file_url.trim()) return;

    const fileData: Omit<File, 'id' | 'created_at' | 'updated_at'> = {
      file_name: uploadForm.file_name.trim(),
      file_url: uploadForm.file_url.trim(),
      file_size_display: uploadForm.file_size_display || undefined,
      description_short: uploadForm.description_short.trim() || undefined,
      related_entity_type: 'Project',
      related_entity_id: project.id,
      related_entity_name: project.project_name,
      uploaded_at: new Date().toISOString(),
      uploaded_by: uploadForm.uploaded_by.trim(),
      notes: uploadForm.notes.trim() || undefined,
    };

    try {
      await createFile(fileData);
      await loadFiles();
      setIsUploadModalOpen(false);
      setUploadForm({
        file_name: '',
        file_url: '',
        file_size_display: '',
        description_short: '',
        uploaded_by: 'ישראל ישראלי',
        notes: '',
      });
    } catch (error) {
      console.error('Error creating file:', error);
    }
  };

  const handleEdit = (file: File) => {
    setEditingFile(file);
  };

  const handleSaveEdit = async () => {
    if (!editingFile) return;

    try {
      await updateFile(editingFile.id, {
        description_short: editingFile.description_short,
        notes: editingFile.notes,
        uploaded_by: editingFile.uploaded_by,
      });

      await loadFiles();
      setEditingFile(null);
    } catch (error) {
      console.error('Error updating file:', error);
    }
  };

  const handleRemoveFromProject = async (fileId: string) => {
    if (!confirm('האם אתה בטוח שברצונך להסיר את הקובץ מהפרויקט?')) return;

    try {
      await removeFileFromProject(fileId);
      await loadFiles();
    } catch (error) {
      console.error('Error removing file from project:', error);
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    // Could show a toast notification here
  };

  const handleOpenFile = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Upload */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-80">
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
          <button className="hidden md:flex items-center justify-center size-10 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:bg-background-light text-text-secondary-light">
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
          </button>
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="hidden md:flex items-center justify-center h-10 px-5 rounded-lg bg-primary text-white hover:bg-primary-hover transition text-sm font-bold tracking-[0.015em] shadow-sm"
        >
          <span className="material-symbols-outlined me-2 text-[20px]">upload_file</span>
          העלאת קובץ חדש
        </button>
      </div>

      {/* Files Table - Desktop */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
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
                      קישור
                    </th>
                    <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                      הועלה ע״י
                    </th>
                    <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                      תאריך העלאה
                    </th>
                    <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                      הערות
                    </th>
                    <th className="px-6 py-4 font-bold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider text-xs">
                      פעולות
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                  {paginatedFiles.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-text-secondary-light dark:text-text-secondary-dark">
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
                        <div
                          className="flex items-center gap-2 group/link cursor-pointer hover:bg-background-light dark:hover:bg-background-dark p-1.5 rounded transition-colors w-fit"
                          title="העתק קישור"
                          onClick={() => handleCopyLink(file.file_url)}
                        >
                          <span className="material-symbols-outlined text-text-secondary-light group-hover/link:text-primary text-[18px]">
                            link
                          </span>
                          <span className="text-xs text-text-secondary-light group-hover/link:text-primary max-w-[100px] truncate font-mono" dir="ltr">
                            {file.file_url.length > 15 ? file.file_url.substring(0, 15) + '...' : file.file_url}
                          </span>
                        </div>
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
                        {file.notes ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 text-xs font-medium">
                            <span className="material-symbols-outlined text-[14px]">comment</span>
                            {file.notes}
                          </span>
                        ) : (
                          <span className="text-text-secondary-light dark:text-text-secondary-dark">-</span>
                        )}
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
                          <button
                            onClick={() => handleRemoveFromProject(file.id)}
                            className="p-1.5 rounded-lg text-text-secondary-light hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="הסרת שיוך"
                          >
                            <span className="material-symbols-outlined text-[20px]">link_off</span>
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
          </>
        )}
      </div>

      {/* Pagination */}
      {filteredFiles.length > 0 && (
        <div className="flex items-center justify-between border-t border-border-light dark:border-border-dark pt-4">
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
              {/* Google Drive Picker Button */}
              {isGoogleDriveConfigured() && (
                <div className="pb-4 border-b border-border-light dark:border-border-dark">
                  <button
                    type="button"
                    onClick={handleGoogleDrivePick}
                    disabled={isPickingFromDrive}
                    className="w-full flex items-center justify-center gap-3 h-12 px-4 rounded-lg border-2 border-dashed border-border-light dark:border-border-dark hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPickingFromDrive ? (
                      <>
                        <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm font-medium">מתחבר ל-Google Drive...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                          <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                          <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                          <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                          <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                          <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                          <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                        </svg>
                        <span className="text-sm font-bold">בחר קובץ מ-Google Drive</span>
                      </>
                    )}
                  </button>
                  <p className="text-center text-xs text-text-secondary-light dark:text-text-secondary-dark mt-2">
                    או הזן פרטים ידנית למטה
                  </p>
                </div>
              )}

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
