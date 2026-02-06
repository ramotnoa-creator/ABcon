/**
 * BOM Files Service - Neon Database API
 * Handles BOM (Bill of Materials) file management
 */

import { executeQuery, executeQuerySingle, isDemoMode as isNeonDemoMode } from '../lib/neon';
import type { BOMFile } from '../types';

// Check if we're in demo mode
const isDemoMode = isNeonDemoMode;

// Demo mode storage
const STORAGE_KEY = 'abcon_bom_files';

// File size limit: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Supported MIME types
const SUPPORTED_MIME_TYPES = [
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];

function getFilesFromStorage(): BOMFile[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveFilesToStorage(files: BOMFile[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
}

// ============================================================
// UPLOAD BOM FILE
// ============================================================

export async function uploadBOMFile(
  tenderId: string,
  file: File
): Promise<BOMFile> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 10MB limit');
  }

  // Validate file type
  if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
    throw new Error('Only .doc and .docx files are supported');
  }

  // Convert file to base64 for storage
  const base64Data = await fileToBase64(file);

  const bomFile: Omit<BOMFile, 'id' | 'uploaded_at'> = {
    tender_id: tenderId,
    file_name: file.name,
    file_path: base64Data, // Store as base64 in Phase 1
    file_size: file.size,
    mime_type: file.type,
    uploaded_by: undefined, // No auth system in MVP
  };

  if (isDemoMode) {
    const newFile: BOMFile = {
      ...bomFile,
      id: crypto.randomUUID(),
      uploaded_at: new Date().toISOString(),
    };
    const files = getFilesFromStorage();
    files.push(newFile);
    saveFilesToStorage(files);
    return newFile;
  }

  try {
    const data = await executeQuerySingle<Record<string, unknown>>(
      `INSERT INTO bom_files (
        tender_id, file_name, file_path, file_size, mime_type, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        bomFile.tender_id,
        bomFile.file_name,
        bomFile.file_path,
        bomFile.file_size,
        bomFile.mime_type,
        bomFile.uploaded_by || null,
      ]
    );

    if (!data) {
      throw new Error('Failed to upload BOM file');
    }

    return transformBOMFileFromDB(data);
  } catch (error: unknown) {
    console.error('Error uploading BOM file:', error);
    // Fallback to localStorage
    const newFile: BOMFile = {
      ...bomFile,
      id: crypto.randomUUID(),
      uploaded_at: new Date().toISOString(),
    };
    const files = getFilesFromStorage();
    files.push(newFile);
    saveFilesToStorage(files);
    return newFile;
  }
}

// ============================================================
// GET BOM FILE BY ID
// ============================================================

export async function getBOMFile(bomFileId: string): Promise<BOMFile | null> {
  if (isDemoMode) {
    const files = getFilesFromStorage();
    return files.find((f) => f.id === bomFileId) || null;
  }

  try {
    const data = await executeQuerySingle<Record<string, unknown>>(
      `SELECT * FROM bom_files WHERE id = $1`,
      [bomFileId]
    );

    return data ? transformBOMFileFromDB(data) : null;
  } catch (error: unknown) {
    console.error('Error fetching BOM file:', error);
    const files = getFilesFromStorage();
    return files.find((f) => f.id === bomFileId) || null;
  }
}

// ============================================================
// GET BOM FILES BY TENDER
// ============================================================

export async function getBOMFilesByTender(tenderId: string): Promise<BOMFile[]> {
  if (isDemoMode) {
    const files = getFilesFromStorage();
    return files.filter((f) => f.tender_id === tenderId);
  }

  try {
    const data = await executeQuery<Record<string, unknown>>(
      `SELECT * FROM bom_files WHERE tender_id = $1 ORDER BY uploaded_at DESC`,
      [tenderId]
    );

    return (data || []).map(transformBOMFileFromDB);
  } catch (error: unknown) {
    console.error('Error fetching BOM files by tender:', error);
    const files = getFilesFromStorage();
    return files.filter((f) => f.tender_id === tenderId);
  }
}

// ============================================================
// DOWNLOAD BOM FILE
// ============================================================

export async function downloadBOMFile(bomFileId: string): Promise<Blob> {
  const bomFile = await getBOMFile(bomFileId);

  if (!bomFile) {
    throw new Error('BOM file not found');
  }

  // Convert base64 back to Blob
  const blob = base64ToBlob(bomFile.file_path, bomFile.mime_type);

  return blob;
}

// ============================================================
// DELETE BOM FILE
// ============================================================

export async function deleteBOMFile(bomFileId: string): Promise<void> {
  if (isDemoMode) {
    const files = getFilesFromStorage();
    const filtered = files.filter((f) => f.id !== bomFileId);
    saveFilesToStorage(filtered);
    return;
  }

  try {
    await executeQuery(`DELETE FROM bom_files WHERE id = $1`, [bomFileId]);
  } catch (error: unknown) {
    console.error('Error deleting BOM file:', error);
    // Fallback to localStorage
    const files = getFilesFromStorage();
    const filtered = files.filter((f) => f.id !== bomFileId);
    saveFilesToStorage(filtered);
  }
}

// ============================================================
// HELPER: FILE TO BASE64
// ============================================================

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      resolve(base64);
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
}

// ============================================================
// HELPER: BASE64 TO BLOB
// ============================================================

function base64ToBlob(base64: string, mimeType: string): Blob {
  // Remove data URL prefix if present
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;

  // Convert base64 to binary
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

// ============================================================
// HELPER: TRANSFORM DB TO APP FORMAT
// ============================================================

function transformBOMFileFromDB(dbFile: any): BOMFile {
  return {
    id: dbFile.id,
    tender_id: dbFile.tender_id,
    file_name: dbFile.file_name,
    file_path: dbFile.file_path,
    file_size: parseInt(dbFile.file_size) || 0,
    mime_type: dbFile.mime_type,
    uploaded_by: dbFile.uploaded_by || undefined,
    uploaded_at: dbFile.uploaded_at,
  };
}
