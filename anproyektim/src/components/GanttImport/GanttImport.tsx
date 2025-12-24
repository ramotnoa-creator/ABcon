import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import type { Project, Task } from '../../types';
import { getAllTasks, saveTasks } from '../../data/tasksStorage';
import { formatDateForDisplay } from '../../utils/dateUtils';

interface GanttImportProps {
  project: Project;
  onClose: () => void;
}

type SystemField =
  | 'ignore'
  | 'task_name'
  | 'planned_start_date'
  | 'planned_end_date'
  | 'duration'
  | 'percent_complete'
  | 'status'
  | 'task_id_wbs'
  | 'predecessors'
  | 'milestone_link'
  | 'notes'
  | 'assignee';

interface ColumnMapping {
  columnIndex: number;
  columnName: string;
  sampleValue: string;
  mappedTo: SystemField;
}

interface ParsedRow {
  [key: string]: any;
}

interface ValidatedRow {
  taskName: string;
  plannedStart: string;
  plannedEnd: string;
  duration?: number;
  percentComplete?: number;
  milestone?: string;
  milestoneLink?: string;
  taskId?: string;
  notes?: string;
  assignee?: string;
  status?: Task['status'];
  errors: string[];
  warnings: string[];
}

const SYSTEM_FIELD_OPTIONS: { value: SystemField; label: string }[] = [
  { value: 'ignore', label: 'התעלם' },
  // Required fields
  { value: 'task_name', label: 'שם משימה (חובה)' },
  { value: 'planned_start_date', label: 'תאריך התחלה מתוכנן (חובה)' },
  { value: 'planned_end_date', label: 'תאריך סיום מתוכנן (חובה)' },
  // Optional fields
  { value: 'status', label: 'מצב פעילות (אופציונלי)' },
  { value: 'duration', label: 'משך (אופציונלי)' },
  { value: 'predecessors', label: 'תלות (קריאה בלבד)' },
  { value: 'task_id_wbs', label: 'רמת חלוקה / WBS (אופציונלי)' },
  { value: 'notes', label: 'הערות (אופציונלי)' },
  { value: 'percent_complete', label: '% התקדמות (אם קיים)' },
  { value: 'assignee', label: 'אחראי (אם קיים)' },
  { value: 'milestone_link', label: 'אבן דרך / ציון דרך (אופציונלי)' },
];

export default function GanttImport({ project, onClose }: GanttImportProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([]);
  const [importResults, setImportResults] = useState<{ success: number; errors: number; updated?: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 1: File Upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    const ext = uploadedFile.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls') {
      alert('קובץ לא נתמך. אנא העלה קובץ .xlsx או .xls');
      return;
    }

    setFile(uploadedFile);

    try {
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];

      if (jsonData.length === 0) {
        alert('הקובץ ריק');
        return;
      }

      // First row is headers
      const fileHeaders = (jsonData[0] || []).map((h) => String(h || '').trim());
      setHeaders(fileHeaders);

      // Get sample rows (first 20, excluding header)
      const sampleRows = jsonData.slice(1, 21).map((row) => {
        const rowObj: ParsedRow = {};
        fileHeaders.forEach((header, idx) => {
          rowObj[header] = row[idx] ?? '';
        });
        return rowObj;
      });

      // Initialize mappings
      const initialMappings: ColumnMapping[] = fileHeaders.map((header, idx) => {
        const sampleValue = sampleRows[0]?.[header] ?? '';
        return {
          columnIndex: idx,
          columnName: header,
          sampleValue: String(sampleValue).substring(0, 50),
          mappedTo: 'ignore',
        };
      });

      setMappings(initialMappings);
      setStep(2);
    } catch (error) {
      console.error('Error parsing file:', error);
      alert('שגיאה בקריאת הקובץ. אנא ודא שהקובץ תקין.');
    }
  };

  // Step 2: Column Mapping
  const handleMappingChange = (columnIndex: number, mappedTo: SystemField) => {
    setMappings((prev) =>
      prev.map((m) => (m.columnIndex === columnIndex ? { ...m, mappedTo } : m))
    );
  };

  const canProceedToPreview = () => {
    const hasTaskName = mappings.some((m) => m.mappedTo === 'task_name');
    const hasStartDate = mappings.some((m) => m.mappedTo === 'planned_start_date');
    const hasEndDate = mappings.some((m) => m.mappedTo === 'planned_end_date');
    return hasTaskName && hasStartDate && hasEndDate;
  };

  const handleProceedToPreview = async () => {
    if (!canProceedToPreview()) {
      alert('אנא מפה את כל השדות החובה: שם משימה, תאריך התחלה, תאריך סיום');
      return;
    }

    if (!file) return;

    try {
      // Parse all rows (not just sample)
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];

      const allRows: ParsedRow[] = jsonData.slice(1).map((row) => {
        const rowObj: ParsedRow = {};
        headers.forEach((header, idx) => {
          rowObj[header] = row[idx] ?? '';
        });
        return rowObj;
      });

      // Validate and map rows
      const validated: ValidatedRow[] = allRows.map((row) => {
        const result: ValidatedRow = {
          taskName: '',
          plannedStart: '',
          plannedEnd: '',
          errors: [],
          warnings: [],
        };

        // Map columns
        mappings.forEach((mapping) => {
          if (mapping.mappedTo === 'ignore') return;

          const value = String(row[mapping.columnName] ?? '').trim();

          switch (mapping.mappedTo) {
            case 'task_name':
              result.taskName = value;
              break;
            case 'planned_start_date':
              result.plannedStart = value;
              break;
            case 'planned_end_date':
              result.plannedEnd = value;
              break;
            case 'duration':
              const duration = parseFloat(value);
              if (!isNaN(duration) && duration > 0) {
                result.duration = Math.round(duration);
              }
              break;
            case 'percent_complete':
              const percent = parseFloat(value);
              if (!isNaN(percent) && percent >= 0 && percent <= 100) {
                result.percentComplete = Math.round(percent);
              }
              break;
            case 'task_id_wbs':
              result.taskId = value;
              break;
            case 'milestone_link':
              result.milestoneLink = value;
              break;
            case 'notes':
              result.notes = value;
              break;
            case 'assignee':
              result.assignee = value;
              break;
            case 'status':
              // Map status values - try to match Hebrew or English
              const statusLower = value.toLowerCase();
              if (statusLower.includes('backlog') || statusLower.includes('ממתין')) {
                result.status = 'Backlog';
              } else if (statusLower.includes('ready') || statusLower.includes('מוכן')) {
                result.status = 'Ready';
              } else if (statusLower.includes('in progress') || statusLower.includes('ביצוע') || statusLower.includes('בביצוע')) {
                result.status = 'In Progress';
              } else if (statusLower.includes('blocked') || statusLower.includes('חסום')) {
                result.status = 'Blocked';
              } else if (statusLower.includes('done') || statusLower.includes('הושלם')) {
                result.status = 'Done';
              } else if (statusLower.includes('canceled') || statusLower.includes('בוטל')) {
                result.status = 'Canceled';
              }
              break;
          }
        });

        // Validation
        if (!result.taskName) {
          result.errors.push('שם משימה חסר');
        }

        if (!result.plannedStart) {
          result.errors.push('תאריך התחלה חסר');
        } else {
          const startDate = parseDate(result.plannedStart);
          if (!startDate) {
            result.errors.push('תאריך התחלה לא תקין');
          } else {
            result.plannedStart = startDate;
          }
        }

        if (!result.plannedEnd) {
          result.errors.push('תאריך סיום חסר');
        } else {
          const endDate = parseDate(result.plannedEnd);
          if (!endDate) {
            result.errors.push('תאריך סיום לא תקין');
          } else {
            result.plannedEnd = endDate;
          }
        }

        // Check if end date is before start date
        if (result.plannedStart && result.plannedEnd && result.plannedStart > result.plannedEnd) {
          result.warnings.push('תאריך סיום לפני תאריך התחלה');
        }

        return result;
      });

      // Check for duplicate task IDs
      const taskIdMap = new Map<string, number[]>();
      validated.forEach((row, idx) => {
        if (row.taskId) {
          if (!taskIdMap.has(row.taskId)) {
            taskIdMap.set(row.taskId, []);
          }
          taskIdMap.get(row.taskId)!.push(idx);
        }
      });

      taskIdMap.forEach((indices, taskId) => {
        if (indices.length > 1) {
          indices.forEach((idx) => {
            validated[idx].warnings.push(`מזהה משימה כפול: ${taskId}`);
          });
        }
      });

      setValidatedRows(validated);
      setStep(3);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('שגיאה בעיבוד הקובץ. אנא נסה שוב.');
    }
  };

  const parseDate = (value: string): string | null => {
    if (!value) return null;

    const strValue = String(value).trim();
    if (!strValue) return null;

    // Try Excel date serial number (days since 1900-01-01)
    const numValue = Number(strValue);
    if (!isNaN(numValue) && numValue > 0 && numValue < 100000) {
      try {
        // Excel epoch is 1900-01-01, but Excel incorrectly treats 1900 as a leap year
        // So we need to adjust: Excel date 1 = 1900-01-01
        const excelEpoch = new Date(1899, 11, 30); // Dec 30, 1899 (Excel's epoch)
        const date = new Date(excelEpoch.getTime() + numValue * 24 * 60 * 60 * 1000);
        if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
          return date.toISOString().split('T')[0];
        }
      } catch {}
    }

    // Try various date formats
    const formats = [
      /^(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
      /^(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
      /^(\d{2})\/(\d{2})\/(\d{2})/, // DD/MM/YY
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})/, // D/M/YYYY
    ];

    for (const format of formats) {
      const match = strValue.match(format);
      if (match) {
        let year: number, month: number, day: number;
        if (format === formats[0]) {
          // YYYY-MM-DD
          year = parseInt(match[1]);
          month = parseInt(match[2]);
          day = parseInt(match[3]);
        } else {
          // DD/MM/YYYY or DD/MM/YY
          day = parseInt(match[1]);
          month = parseInt(match[2]);
          year = parseInt(match[3]);
          if (year < 100) {
            year += 2000;
          }
        }

        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          const date = new Date(year, month - 1, day);
          if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
            return date.toISOString().split('T')[0];
          }
        }
      }
    }

    // Try native Date parsing (handles ISO and other formats)
    const date = new Date(strValue);
    if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
      return date.toISOString().split('T')[0];
    }

    return null;
  };

  // Step 3: Preview & Validation
  const handleConfirmImport = () => {
    const validRows = validatedRows.filter((row) => row.errors.length === 0);
    const invalidCount = validatedRows.length - validRows.length;

    if (validRows.length === 0) {
      alert('אין שורות תקינות לייבא');
      return;
    }

    // Step 4: Import Logic
    const allTasks = getAllTasks();
    const projectTasks = allTasks.filter((t) => t.project_id === project.id);
    let successCount = 0;
    let updateCount = 0;
    let errorCount = invalidCount;

    validRows.forEach((row) => {
      try {
        // Generate external_reference_id: use taskId if mapped, otherwise generate from name + start date
        let externalReferenceId: string | undefined = row.taskId;
        if (!externalReferenceId) {
          // Generate internal key: task name + planned start date
          externalReferenceId = `${row.taskName}|${row.plannedStart}`;
        }

        // Derive status: use imported status if available, otherwise from percent_complete
        let status: Task['status'] = row.status || 'Backlog';
        if (!row.status && row.percentComplete !== undefined) {
          if (row.percentComplete === 0) {
            status = 'Backlog';
          } else if (row.percentComplete >= 1 && row.percentComplete < 100) {
            status = 'In Progress';
          } else if (row.percentComplete === 100) {
            status = 'Done';
          }
        }

        // Build notes field
        const notesParts: string[] = [];
        if (row.notes) {
          notesParts.push(row.notes);
        }
        if (row.milestoneLink) {
          notesParts.push(`אבן דרך: ${row.milestoneLink}`);
        }
        const combinedNotes = notesParts.length > 0 ? notesParts.join('\n') : undefined;

        // Find existing task for re-import matching:
        // 1. First try to match by external_reference_id (if we have an identifier)
        // 2. Otherwise match by task name + planned start date
        let existingTask: Task | undefined;
        
        if (row.taskId) {
          // Prefer identifier if exists
          existingTask = projectTasks.find(
            (t) => t.external_reference_id === row.taskId
          );
        }
        
        // If no match by identifier, try name + start date
        if (!existingTask) {
          existingTask = projectTasks.find(
            (t) => t.title === row.taskName && t.start_date === row.plannedStart
          );
        }

        if (existingTask) {
          // Update existing task
          const taskIndex = allTasks.findIndex((t) => t.id === existingTask!.id);
          if (taskIndex !== -1) {
            allTasks[taskIndex] = {
              ...existingTask,
              title: row.taskName,
              status,
              start_date: row.plannedStart,
              due_date: row.plannedEnd,
              duration_days: row.duration,
              percent_complete: row.percentComplete,
              external_reference_id: externalReferenceId,
              assignee_name: row.assignee,
              notes: combinedNotes,
              updated_at: new Date().toISOString(),
            };
            updateCount++;
          }
        } else {
          // Create new task
          const newTask: Task = {
            id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            project_id: project.id,
            title: row.taskName,
            status,
            priority: 'Medium',
            start_date: row.plannedStart,
            due_date: row.plannedEnd,
            duration_days: row.duration,
            percent_complete: row.percentComplete,
            external_reference_id: externalReferenceId,
            assignee_name: row.assignee,
            notes: combinedNotes,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          allTasks.push(newTask);
          successCount++;
        }
      } catch (error) {
        console.error('Error processing task:', error);
        errorCount++;
      }
    });

    saveTasks(allTasks);
    setImportResults({ success: successCount, errors: errorCount, updated: updateCount });
    setStep(4);
  };

  const handleReset = () => {
    setFile(null);
    setHeaders([]);
    setMappings([]);
    setValidatedRows([]);
    setImportResults(null);
    setStep(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg border border-border-light dark:border-border-dark w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border-light dark:border-border-dark sticky top-0 bg-surface-light dark:bg-surface-dark z-10">
          <h3 className="text-lg font-bold">ייבוא גאנט</h3>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center hover:bg-background-light dark:hover:bg-background-dark rounded transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: File Upload */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">העלאת קובץ</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm"
                />
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-2">
                  תמיכה בקבצי .xlsx ו-.xls. קובצי MPP ייתמכו בעתיד.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-bold mb-2">מיפוי עמודות</h4>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
                  מפה את עמודות הקובץ לשדות המערכת. שדות המסומנים ב-<span className="font-bold text-red-600 dark:text-red-400">(חובה)</span> חייבים להיות ממופים.
                </p>
              </div>

              {/* Error message at top */}
              {!canProceedToPreview() && (
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-xl">error</span>
                    <p className="text-red-800 dark:text-red-300 font-bold">חסרים שדות חובה למיפוי</p>
                  </div>
                  <p className="text-red-700 dark:text-red-400 text-sm mt-1">
                    יש למפות את כל השדות החובה: שם משימה (חובה), תאריך התחלה מתוכנן (חובה), תאריך סיום מתוכנן (חובה)
                  </p>
                </div>
              )}

              <div className="bg-white dark:bg-background-dark rounded-lg border border-border-light dark:border-border-dark shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-background-light dark:bg-surface-dark">
                      <tr className="border-b-2 border-border-light dark:border-border-dark">
                        <th className="text-right p-3 font-bold text-text-secondary-light dark:text-text-secondary-dark">שם עמודה</th>
                        <th className="text-right p-3 font-bold text-text-secondary-light dark:text-text-secondary-dark">דוגמה</th>
                        <th className="text-right p-3 font-bold text-text-secondary-light dark:text-text-secondary-dark">מפה לשדה מערכת</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mappings.map((mapping, idx) => {
                        const isRequired = mapping.mappedTo === 'task_name' ||
                                          mapping.mappedTo === 'planned_start_date' ||
                                          mapping.mappedTo === 'planned_end_date';
                        // isMappedToRequired is used for styling purposes
                        void (mappings.some(m =>
                          (m.mappedTo === 'task_name' || m.mappedTo === 'planned_start_date' || m.mappedTo === 'planned_end_date') &&
                          m.columnIndex !== mapping.columnIndex
                        ));
                        
                        return (
                          <tr
                            key={mapping.columnIndex}
                            className={`border-b border-border-light dark:border-border-dark hover:bg-background-light dark:hover:bg-surface-dark transition-colors ${
                              idx % 2 === 0 ? 'bg-white dark:bg-background-dark' : 'bg-gray-50/50 dark:bg-surface-dark/50'
                            }`}
                          >
                            <td className="p-3 font-medium">{mapping.columnName}</td>
                            <td className="p-3 text-text-secondary-light dark:text-text-secondary-dark text-xs max-w-xs truncate">
                              {mapping.sampleValue || <span className="italic text-gray-400">(ריק)</span>}
                            </td>
                            <td className="p-3">
                              <select
                                className={`w-full h-9 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                                  isRequired && mapping.mappedTo !== 'ignore' 
                                    ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10' 
                                    : ''
                                }`}
                                value={mapping.mappedTo}
                                onChange={(e) =>
                                  handleMappingChange(mapping.columnIndex, e.target.value as SystemField)
                                }
                              >
                                {SYSTEM_FIELD_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 font-bold text-sm transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={handleProceedToPreview}
                  disabled={!canProceedToPreview()}
                  className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
                >
                  המשך לתצוגה מקדימה
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Preview & Validation */}
          {step === 3 && (
            <div className="space-y-4">
              <h4 className="text-md font-bold">תצוגה מקדימה ואימות</h4>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                מציג {Math.min(10, validatedRows.length)} שורות ראשונות מתוך {validatedRows.length} שורות
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border-light dark:border-border-dark">
                      <th className="text-right p-2 font-bold">שם משימה</th>
                      <th className="text-right p-2 font-bold">תאריך התחלה</th>
                      <th className="text-right p-2 font-bold">תאריך סיום</th>
                      <th className="text-right p-2 font-bold">מצב פעילות</th>
                      <th className="text-right p-2 font-bold">משך</th>
                      <th className="text-right p-2 font-bold">% השלמה</th>
                      <th className="text-right p-2 font-bold">אחראי</th>
                      <th className="text-right p-2 font-bold">אבן דרך</th>
                      <th className="text-right p-2 font-bold">סטטוס אימות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validatedRows.slice(0, 10).map((row, idx) => (
                      <tr
                        key={idx}
                        className={`border-b border-border-light dark:border-border-dark ${
                          row.errors.length > 0 ? 'bg-red-50 dark:bg-red-900/20' : ''
                        }`}
                      >
                        <td className="p-2">{row.taskName || '(חסר)'}</td>
                        <td className="p-2">{formatDateForDisplay(row.plannedStart)}</td>
                        <td className="p-2">{formatDateForDisplay(row.plannedEnd)}</td>
                        <td className="p-2">
                          {row.status ? (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                              {row.status === 'Backlog' ? 'ממתין' :
                               row.status === 'Ready' ? 'מוכן' :
                               row.status === 'In Progress' ? 'בביצוע' :
                               row.status === 'Blocked' ? 'חסום' :
                               row.status === 'Done' ? 'הושלם' :
                               row.status === 'Canceled' ? 'בוטל' : row.status}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="p-2">{row.duration ? `${row.duration} ימים` : '-'}</td>
                        <td className="p-2">{row.percentComplete !== undefined ? `${row.percentComplete}%` : '-'}</td>
                        <td className="p-2">{row.assignee || '-'}</td>
                        <td className="p-2">{row.milestoneLink || '-'}</td>
                        <td className="p-2">
                          {row.errors.length > 0 && (
                            <span className="text-red-600 dark:text-red-400 text-xs">
                              שגיאות: {row.errors.join(', ')}
                            </span>
                          )}
                          {row.warnings.length > 0 && row.errors.length === 0 && (
                            <span className="text-yellow-600 dark:text-yellow-400 text-xs">
                              אזהרות: {row.warnings.join(', ')}
                            </span>
                          )}
                          {row.errors.length === 0 && row.warnings.length === 0 && (
                            <span className="text-green-600 dark:text-green-400 text-xs">✓ תקין</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm">
                <p>
                  שורות תקינות: {validatedRows.filter((r) => r.errors.length === 0).length} /{' '}
                  {validatedRows.length}
                </p>
                <p>
                  שורות עם שגיאות: {validatedRows.filter((r) => r.errors.length > 0).length}
                </p>
                <p>
                  שורות עם אזהרות: {validatedRows.filter((r) => r.warnings.length > 0).length}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold text-sm transition-colors"
                >
                  חזור
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover font-bold text-sm transition-colors"
                >
                  אישור ייבוא
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Import Results */}
          {step === 4 && importResults && (
            <div className="space-y-4">
              <h4 className="text-md font-bold">תוצאות ייבוא</h4>
              <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                <p className="font-bold">הייבוא הושלם בהצלחה!</p>
                <p className="mt-2">
                  משימות חדשות: {importResults.success}
                  {importResults.updated !== undefined && importResults.updated > 0 && (
                    <span> | משימות מעודכנות: {importResults.updated}</span>
                  )}
                  {importResults.errors > 0 && <span> | שגיאות: {importResults.errors}</span>}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    onClose();
                  }}
                  className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover font-bold text-sm transition-colors"
                >
                  סגור
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
