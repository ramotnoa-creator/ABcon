import { createPortal } from 'react-dom';
import { useToast } from '../../contexts/ToastContext';
import { downloadBOMFile } from '../../services/bomFilesService';
import { formatDateForDisplay } from '../../utils/dateUtils';
import type { Tender, TenderParticipant, BOMFile, Professional } from '../../types';

interface SendBOMEmailModalProps {
  tender: Tender;
  participants: Array<TenderParticipant & { professional?: Professional }>;
  bomFile: BOMFile;
  onClose: () => void;
}

export default function SendBOMEmailModal({
  tender,
  participants,
  bomFile,
  onClose,
}: SendBOMEmailModalProps) {
  const { showToast } = useToast();

  const participantEmails = participants
    .map((p) => p.professional?.email)
    .filter(Boolean)
    .join(', ');

  const copyEmails = () => {
    navigator.clipboard.writeText(participantEmails);
    showToast('כתובות אימייל הועתקו ללוח', 'success');
  };

  const handleDownloadBOM = async () => {
    try {
      const blob = await downloadBOMFile(bomFile.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = bomFile.file_name;
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

  return createPortal(
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-xl border border-border-light dark:border-border-dark w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border-light dark:border-border-dark">
            <h3 className="text-lg font-bold">שליחת בל"מ למשתתפים</h3>
            <button
              onClick={onClose}
              className="size-8 flex items-center justify-center hover:bg-background-light dark:hover:bg-background-dark rounded transition-colors"
              aria-label="סגור"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Participants Section */}
            <div className="participants-section">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold">
                  נמענים ({participants.length})
                </h4>
                <button
                  onClick={copyEmails}
                  className="px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-bold"
                >
                  <span className="material-symbols-outlined text-[16px] align-middle me-1">content_copy</span>
                  העתק כל האימיילים
                </button>
              </div>
              <div className="space-y-2">
                {participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark"
                  >
                    <div>
                      <p className="font-bold text-sm">{p.professional?.professional_name}</p>
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        {p.professional?.email || 'אין כתובת אימייל'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* BOM Section */}
            <div className="bom-section">
              <h4 className="text-sm font-bold mb-3">קובץ מצורף</h4>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[28px]">
                  description
                </span>
                <div className="flex-1">
                  <p className="font-bold text-sm text-blue-900 dark:text-blue-100">{bomFile.file_name}</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {(bomFile.file_size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <button
                  onClick={handleDownloadBOM}
                  className="px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-bold"
                >
                  הורד
                </button>
              </div>
            </div>

            {/* Email Template Section */}
            <div className="template-section">
              <h4 className="text-sm font-bold mb-3">תבנית אימייל (לעיון)</h4>
              <div className="email-preview p-4 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark">
                <div className="mb-3">
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-1">
                    נושא:
                  </p>
                  <p className="font-bold text-sm">בל"מ עבור {tender.tender_name}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-1">
                    תוכן:
                  </p>
                  <div className="body-preview text-sm space-y-2 whitespace-pre-line">
                    <p>שלום {'<שם המקצוען>'},</p>
                    <p>מצורף בל"מ (Bill of Materials) עבור {tender.tender_name}.</p>
                    {tender.due_date && (
                      <p>מועד אחרון להגשה: {formatDateForDisplay(tender.due_date)}</p>
                    )}
                    <p>בברכה,<br />{'<שם מנהל הפרויקט>'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Phase 2 Notice */}
            <div className="phase-2-notice p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[24px]">
                  info
                </span>
                <div>
                  <p className="font-bold text-sm text-amber-900 dark:text-amber-100 mb-1">
                    שליחת אימייל אוטומטית תהיה זמינה בשלב 2
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    כרגע, העתק את כתובות האימייל והורד את הקובץ כדי לשלוח ידנית דרך תוכנת האימייל שלך.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
            <div className="flex gap-3 justify-end">
              <button
                disabled
                title="שליחת אימייל אוטומטית תהיה זמינה בשלב 2"
                className="px-4 py-2 rounded-lg bg-gray-300 text-gray-500 cursor-not-allowed text-sm font-bold"
              >
                <span className="material-symbols-outlined text-[16px] align-middle me-1">send</span>
                שלח אימיילים (בקרוב)
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-bold"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
