/**
 * Excel Import Modal for Cost Items
 * 3-step wizard: Select contractor + Upload → Preview & Validate → Results
 */

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';
import { getProfessionals } from '../../services/professionalsService';
import { bulkCreateCostItems } from '../../services/costsService';
import type { Professional, CostCategory } from '../../types';

interface ExcelImportModalProps {
  projectId: string;
  vatRate: number;
  onComplete: () => void;
  onCancel: () => void;
}

interface ParsedRow {
  name: string;
  description: string;
  category: CostCategory;
  estimated_amount: number;
  actual_amount?: number;
  vat_included: boolean;
  notes: string;
  errors: string[];
}

const categoryMapHebrew: Record<string, CostCategory> = {
  'יועץ': 'consultant',
  'ספק': 'supplier',
  'קבלן': 'contractor',
  'אגרה': 'agra',
  'consultant': 'consultant',
  'supplier': 'supplier',
  'contractor': 'contractor',
  'agra': 'agra',
};

const categoryLabels: Record<CostCategory, string> = {
  consultant: 'יועץ',
  supplier: 'ספק',
  contractor: 'קבלן',
  agra: 'אגרה',
};

function parseVatValue(val: unknown): boolean {
  if (val == null || val === '') return true;
  const s = String(val).trim().toLowerCase();
  if (s === 'לא' || s === 'false' || s === '0' || s === 'no') return false;
  return true; // כן, true, 1, yes, or anything else → true
}

function parseCategory(val: unknown): CostCategory {
  if (val == null || val === '') return 'contractor';
  const s = String(val).trim();
  return categoryMapHebrew[s] || 'contractor';
}

function parseNumber(val: unknown): number | undefined {
  if (val == null || val === '') return undefined;
  const n = Number(val);
  return isNaN(n) ? undefined : n;
}

export default function ExcelImportModal({ projectId, vatRate, onComplete, onCancel }: ExcelImportModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 state
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [parseError, setParseError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2 state
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);

  // Step 3 state
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: number;
    errors: { index: number; name: string; error: string }[];
  } | null>(null);

  // Load professionals
  useEffect(() => {
    getProfessionals().then(setProfessionals);
  }, []);

  // Template column definitions
  const templateColumns = [
    { header: 'שם פריט', key: 'name', width: 25 },
    { header: 'תיאור', key: 'description', width: 30 },
    { header: 'קטגוריה', key: 'category', width: 15 },
    { header: 'סכום מוערך', key: 'estimated_amount', width: 15 },
    { header: 'עלות בפועל', key: 'actual_amount', width: 15 },
    { header: 'כולל מעמ', key: 'vat_included', width: 12 },
    { header: 'הערות', key: 'notes', width: 30 },
  ];

  // Download template
  const handleDownloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('תבנית פריטי עלות');
    sheet.views = [{ rightToLeft: true }];

    sheet.columns = templateColumns;

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, size: 12 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' },
    };
    headerRow.alignment = { horizontal: 'right' };

    // Add example row
    sheet.addRow({
      name: 'לדוגמה: חשמל',
      description: 'עבודות חשמל כלליות',
      category: 'קבלן',
      estimated_amount: 50000,
      actual_amount: '',
      vat_included: 'כן',
      notes: '',
    });

    // Style example row as light gray italic
    const exampleRow = sheet.getRow(2);
    exampleRow.font = { italic: true, color: { argb: 'FF999999' } };

    // Add data validation for category column
    sheet.getColumn('category').eachCell((cell, rowNumber) => {
      if (rowNumber > 1) {
        cell.dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: ['"יועץ,ספק,קבלן,אגרה"'],
        };
      }
    });
    // Also add to rows 3-100 for future data entry
    for (let i = 3; i <= 100; i++) {
      sheet.getCell(`C${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"יועץ,ספק,קבלן,אגרה"'],
      };
    }

    // Add data validation for vat column
    for (let i = 2; i <= 100; i++) {
      sheet.getCell(`F${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"כן,לא"'],
      };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cost-items-template.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Parse uploaded file
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setParseError('');

    try {
      const data = await selected.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
        defval: '',
      });

      if (jsonData.length === 0) {
        setParseError('הקובץ ריק או שלא נמצאו שורות נתונים');
        return;
      }

      // Map the expected Hebrew headers to our fields
      const headerMap: Record<string, string> = {
        'שם פריט': 'name',
        'תיאור': 'description',
        'קטגוריה': 'category',
        'סכום מוערך': 'estimated_amount',
        'עלות בפועל': 'actual_amount',
        'כולל מעמ': 'vat_included',
        'הערות': 'notes',
      };

      const rows: ParsedRow[] = jsonData
        .filter(row => {
          // Skip completely empty rows and the example row
          const name = String(row['שם פריט'] ?? row['name'] ?? '').trim();
          if (!name) return false;
          if (name.startsWith('לדוגמה:')) return false;
          return true;
        })
        .map(row => {
          const errors: string[] = [];

          // Try to resolve field values from Hebrew or English headers
          const getValue = (hebrewKey: string, englishKey: string) =>
            row[hebrewKey] ?? row[englishKey] ?? '';

          const name = String(getValue('שם פריט', 'name')).trim();
          const description = String(getValue('תיאור', 'description')).trim();
          const categoryRaw = getValue('קטגוריה', 'category');
          const estimatedRaw = getValue('סכום מוערך', 'estimated_amount');
          const actualRaw = getValue('עלות בפועל', 'actual_amount');
          const vatRaw = getValue('כולל מעמ', 'vat_included');
          const notes = String(getValue('הערות', 'notes')).trim();

          // Validate required fields
          if (!name) errors.push('שם פריט חסר');

          const estimated = parseNumber(estimatedRaw);
          if (estimated == null || estimated <= 0) {
            errors.push('סכום מוערך חסר או לא תקין');
          }

          const actual = parseNumber(actualRaw);
          const category = parseCategory(categoryRaw);
          const vatIncluded = parseVatValue(vatRaw);

          return {
            name,
            description,
            category,
            estimated_amount: estimated ?? 0,
            actual_amount: actual || undefined,
            vat_included: vatIncluded,
            notes,
            errors,
          };
        });

      if (rows.length === 0) {
        setParseError('לא נמצאו שורות תקינות בקובץ');
        return;
      }

      setParsedRows(rows);
      setStep(2);
    } catch (err) {
      console.error('Error parsing Excel file:', err);
      setParseError('שגיאה בקריאת הקובץ. ודא שזהו קובץ Excel תקין (.xlsx/.xls)');
    }
  };

  // Import valid rows
  const handleImport = async () => {
    const validRows = parsedRows.filter(r => r.errors.length === 0);
    if (validRows.length === 0) return;

    setImporting(true);
    setStep(3);

    try {
      const items = validRows.map(row => ({
        project_id: projectId,
        name: row.name,
        description: row.description || undefined,
        category: row.category,
        estimated_amount: row.estimated_amount,
        actual_amount: row.actual_amount,
        vat_included: row.vat_included,
        vat_rate: vatRate,
        status: 'draft' as const,
        notes: row.notes || undefined,
      }));

      const results = await bulkCreateCostItems(items);
      setImportResults(results);
    } catch (error) {
      console.error('Error importing cost items:', error);
      setImportResults({
        success: 0,
        errors: [{ index: 0, name: 'כללי', error: (error as Error).message }],
      });
    } finally {
      setImporting(false);
    }
  };

  const validCount = parsedRows.filter(r => r.errors.length === 0).length;
  const errorCount = parsedRows.filter(r => r.errors.length > 0).length;

  const selectedProfessionalName = professionals.find(p => p.id === selectedProfessionalId)?.professional_name;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-surface-dark border-b border-border-light dark:border-border-dark p-6 flex items-center justify-between rounded-t-xl">
          <div>
            <h2 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">
              ייבוא פריטי עלות מאקסל
            </h2>
            {/* Step indicator */}
            <div className="flex items-center gap-2 mt-2">
              {[1, 2, 3].map(s => (
                <div key={s} className="flex items-center gap-1">
                  <div className={`size-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    s === step
                      ? 'bg-primary text-white'
                      : s < step
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }`}>
                    {s < step ? (
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    ) : s}
                  </div>
                  <span className={`text-xs ${s === step ? 'font-bold text-primary' : 'text-gray-400'}`}>
                    {s === 1 ? 'העלאה' : s === 2 ? 'תצוגה מקדימה' : 'תוצאות'}
                  </span>
                  {s < 3 && <span className="text-gray-300 mx-1">›</span>}
                </div>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1: Select & Upload */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Professional dropdown */}
              <div>
                <label className="block text-sm font-bold text-text-main-light dark:text-text-main-dark mb-2">
                  בחר קבלן / בעל מקצוע
                </label>
                <select
                  value={selectedProfessionalId}
                  onChange={(e) => setSelectedProfessionalId(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">-- לא משויך --</option>
                  {professionals.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.professional_name}{p.company_name ? ` (${p.company_name})` : ''} — {p.field}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                  אופציונלי — לסימון מאיפה הגיע הפירוט
                </p>
              </div>

              {/* Download template */}
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800/40">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[24px] text-blue-600 dark:text-blue-400">
                    description
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-blue-700 dark:text-blue-300">
                      תבנית אקסל
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                      הורד את התבנית, מלא את הנתונים, והעלה בחזרה
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    הורד תבנית
                  </button>
                </div>
              </div>

              {/* File upload */}
              <div>
                <label className="block text-sm font-bold text-text-main-light dark:text-text-main-dark mb-2">
                  העלאת קובץ אקסל
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    file
                      ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      <span className="material-symbols-outlined text-[32px] text-emerald-600">
                        check_circle
                      </span>
                      <div>
                        <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                          {file.name}
                        </div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400">
                          {(file.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[48px] text-gray-400 mb-2">
                        upload_file
                      </span>
                      <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        לחץ לבחירת קובץ או גרור לכאן
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        .xlsx או .xls
                      </div>
                    </>
                  )}
                </div>
                {parseError && (
                  <div className="mt-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    {parseError}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark space-y-1">
                <p><strong>עמודות נדרשות:</strong> שם פריט, סכום מוערך</p>
                <p><strong>עמודות אופציונליות:</strong> תיאור, קטגוריה (יועץ/ספק/קבלן/אגרה), עלות בפועל, כולל מע"מ (כן/לא), הערות</p>
              </div>
            </div>
          )}

          {/* STEP 2: Preview & Validate */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{validCount} תקינים</span>
                </div>
                {errorCount > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                    <span className="material-symbols-outlined text-[16px] text-red-600">error</span>
                    <span className="text-sm font-bold text-red-700 dark:text-red-300">{errorCount} שגיאות</span>
                  </div>
                )}
                {selectedProfessionalName && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                    <span className="material-symbols-outlined text-[16px] text-blue-600">person</span>
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{selectedProfessionalName}</span>
                  </div>
                )}
                <div className="text-xs text-gray-400 mr-auto">
                  {parsedRows.length} שורות סה"כ
                </div>
              </div>

              {/* Preview table */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-500 uppercase">#</th>
                        <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-500 uppercase">שם פריט</th>
                        <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-500 uppercase">קטגוריה</th>
                        <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-500 uppercase">סכום מוערך</th>
                        <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-500 uppercase">בפועל</th>
                        <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-500 uppercase">מע"מ</th>
                        <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-500 uppercase">סטטוס</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {parsedRows.map((row, i) => {
                        const hasError = row.errors.length > 0;
                        return (
                          <tr
                            key={i}
                            className={hasError
                              ? 'bg-red-50/50 dark:bg-red-950/10'
                              : i % 2 === 0
                              ? 'bg-white dark:bg-gray-900'
                              : 'bg-gray-50/50 dark:bg-gray-900/50'
                            }
                          >
                            <td className="px-3 py-2 text-xs text-gray-400">{i + 1}</td>
                            <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">
                              {row.name || <span className="text-red-400 italic">חסר</span>}
                            </td>
                            <td className="px-3 py-2 text-xs">{categoryLabels[row.category]}</td>
                            <td className="px-3 py-2 tabular-nums font-bold">
                              {row.estimated_amount > 0
                                ? `${row.estimated_amount.toLocaleString('he-IL')} ₪`
                                : <span className="text-red-400">—</span>
                              }
                            </td>
                            <td className="px-3 py-2 tabular-nums text-gray-600 dark:text-gray-400">
                              {row.actual_amount
                                ? `${row.actual_amount.toLocaleString('he-IL')} ₪`
                                : '—'
                              }
                            </td>
                            <td className="px-3 py-2 text-xs">
                              {row.vat_included ? 'כן' : 'לא'}
                            </td>
                            <td className="px-3 py-2">
                              {hasError ? (
                                <div className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[14px] text-red-500">error</span>
                                  <span className="text-xs text-red-600 dark:text-red-400">
                                    {row.errors.join(', ')}
                                  </span>
                                </div>
                              ) : (
                                <span className="material-symbols-outlined text-[14px] text-emerald-500">check_circle</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Results */}
          {step === 3 && (
            <div className="flex flex-col items-center justify-center py-8 space-y-6">
              {importing ? (
                <>
                  <div className="size-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <div className="text-lg font-bold text-text-main-light dark:text-text-main-dark">
                    מייבא פריטי עלות...
                  </div>
                  <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    אנא המתן
                  </div>
                </>
              ) : importResults ? (
                <>
                  <span className={`material-symbols-outlined text-[64px] ${
                    importResults.errors.length === 0 ? 'text-emerald-500' : 'text-amber-500'
                  }`}>
                    {importResults.errors.length === 0 ? 'check_circle' : 'warning'}
                  </span>
                  <div className="text-center space-y-2">
                    <div className="text-xl font-bold text-text-main-light dark:text-text-main-dark">
                      הייבוא הושלם
                    </div>
                    <div className="flex items-center justify-center gap-4">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                        <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                          {importResults.success} נוצרו בהצלחה
                        </span>
                      </div>
                      {importResults.errors.length > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                          <span className="material-symbols-outlined text-[16px] text-red-600">error</span>
                          <span className="text-sm font-bold text-red-700 dark:text-red-300">
                            {importResults.errors.length} שגיאות
                          </span>
                        </div>
                      )}
                    </div>
                    {importResults.errors.length > 0 && (
                      <div className="mt-4 border border-red-200 dark:border-red-800 rounded-lg overflow-hidden max-w-md">
                        <div className="bg-red-50 dark:bg-red-950/20 px-3 py-2 text-xs font-bold text-red-700 dark:text-red-300">
                          פרטי שגיאות
                        </div>
                        <div className="divide-y divide-red-100 dark:divide-red-900">
                          {importResults.errors.map((err, i) => (
                            <div key={i} className="px-3 py-2 text-xs text-red-600 dark:text-red-400">
                              שורה {err.index + 1}: {err.name} — {err.error}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-background-dark border-t border-border-light dark:border-border-dark p-4 flex items-center justify-between rounded-b-xl">
          <div>
            {step === 2 && (
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setParsedRows([]);
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="px-4 py-2 rounded-lg border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-surface-dark transition-colors text-sm font-medium flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                חזרה
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={step === 3 && !importing ? onComplete : onCancel}
              className="px-6 py-2.5 rounded-lg border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-surface-dark transition-colors text-sm font-medium"
            >
              {step === 3 && !importing ? 'סגור' : 'ביטול'}
            </button>
            {step === 2 && validCount > 0 && (
              <button
                type="button"
                onClick={handleImport}
                className="px-6 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors text-sm font-bold flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">upload</span>
                ייבא {validCount} פריטים
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
