import { useState, useCallback } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { uploadBOMFile, deleteBOMFile, downloadBOMFile } from '../../services/bomFilesService';
import { updateTender } from '../../services/tendersService';
import type { BOMFile } from '../../types';

interface BOMUploaderProps {
  tenderId: string;
  currentBOM?: BOMFile | null;
  onUploadSuccess: (bomFile: BOMFile) => void;
}

export default function BOMUploader({ tenderId, currentBOM, onUploadSuccess }: BOMUploaderProps) {
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const validateFile = (file: File): string | null => {
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return 'גודל הקובץ חורג מ-10MB';
    }

    // Validate file type
    if (!file.name.match(/\.(doc|docx)$/i)) {
      return 'ניתן להעלות רק קבצי .doc או .docx';
    }

    return null;
  };

  const handleFileSelect = async (file: File) => {
    const error = validateFile(file);
    if (error) {
      showToast(error, 'error');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Simulate upload progress (since we're using base64)
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const bomFile = await uploadBOMFile(tenderId, file);

      clearInterval(progressInterval);
      setProgress(100);

      // Update tender with BOM reference
      await updateTender(tenderId, { bom_file_id: bomFile.id });

      showToast('בל"מ הועלה בהצלחה', 'success');
      onUploadSuccess(bomFile);
    } catch (error: unknown) {
      console.error('Upload error:', error);
      showToast('שגיאה בהעלאת הקובץ', 'error');
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [tenderId]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDownload = async () => {
    if (!currentBOM) return;

    try {
      const blob = await downloadBOMFile(currentBOM.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentBOM.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('הקובץ הורד בהצלחה', 'success');
    } catch (error) {
      console.error('Download error:', error);
      showToast('שגיאה בהורדת הקובץ', 'error');
    }
  };

  const handleDelete = async () => {
    if (!currentBOM) return;

    if (!window.confirm('האם אתה בטוח שברצונך למחוק את הבל"מ?')) {
      return;
    }

    try {
      await deleteBOMFile(currentBOM.id);
      await updateTender(tenderId, { bom_file_id: undefined });
      showToast('בל"מ נמחק בהצלחה', 'success');
      onUploadSuccess(null as any);
    } catch (error) {
      console.error('Delete error:', error);
      showToast('שגיאה במחיקת הקובץ', 'error');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="bom-uploader">
      {currentBOM ? (
        <div className="current-bom p-4 bg-background-light dark:bg-background-dark rounded-lg border border-border-light dark:border-border-dark">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[28px]">
              description
            </span>
            <div className="flex-1">
              <p className="font-bold text-sm">{currentBOM.file_name}</p>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                {formatFileSize(currentBOM.file_size)}
              </p>
            </div>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-bold"
            >
              הורד
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 transition-colors text-sm font-bold"
            >
              מחק
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`upload-zone p-8 rounded-lg border-2 border-dashed transition-colors cursor-pointer ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-border-light dark:border-border-dark hover:border-primary/50 hover:bg-primary/5'
          }`}
        >
          <input
            type="file"
            accept=".doc,.docx"
            onChange={handleFileInput}
            className="hidden"
            id={`bom-upload-${tenderId}`}
            disabled={uploading}
          />
          <label
            htmlFor={`bom-upload-${tenderId}`}
            className="flex flex-col items-center gap-3 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[48px] text-text-secondary-light dark:text-text-secondary-dark">
              upload_file
            </span>
            <p className="text-sm font-bold text-center">
              גרור קובץ בל"מ לכאן או לחץ לבחירה
            </p>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark text-center">
              מקסימום 10MB, קבצי .doc או .docx בלבד
            </p>
          </label>
        </div>
      )}

      {uploading && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              מעלה קובץ...
            </span>
            <span className="text-sm font-bold text-primary">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
