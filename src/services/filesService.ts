/**
 * Files Service - Neon Database API
 * Handles CRUD operations for file metadata
 */

import { executeQuery, executeQuerySingle, isDemoMode as isNeonDemoMode } from '../lib/neon';
import type { File } from '../types';
import {
  getFiles as getFilesLocal,
  getAllFiles as getAllFilesLocal,
  saveFiles,
  addFile as addFileLocal,
  updateFile as updateFileLocal,
  removeFile as removeFileLocal,
  removeFileFromProject as removeFileFromProjectLocal,
} from '../data/filesStorage';

// Check if we're in demo mode
const isDemoMode = isNeonDemoMode;

// ============================================================
// GET FILES (OPTIONALLY FILTERED BY PROJECT)
// ============================================================

export async function getFiles(projectId?: string): Promise<File[]> {
  if (isDemoMode) {
    return getFilesLocal(projectId);
  }

  try {
    let query: string;
    let params: any[];

    if (projectId) {
      query = `SELECT * FROM files
               WHERE related_entity_type = $1 AND related_entity_id = $2
               ORDER BY uploaded_at DESC`;
      params = ['Project', projectId];
    } else {
      query = `SELECT * FROM files ORDER BY uploaded_at DESC`;
      params = [];
    }

    const data = await executeQuery<any>(query, params);

    return (data || []).map(transformFileFromDB);
  } catch (error) {
    console.error('Error fetching files:', error);
    return getFilesLocal(projectId);
  }
}

// ============================================================
// GET ALL FILES
// ============================================================

export async function getAllFiles(): Promise<File[]> {
  if (isDemoMode) {
    return getAllFilesLocal();
  }

  try {
    const data = await executeQuery<any>(
      `SELECT * FROM files ORDER BY uploaded_at DESC`
    );

    return (data || []).map(transformFileFromDB);
  } catch (error) {
    console.error('Error fetching all files:', error);
    return getAllFilesLocal();
  }
}

// ============================================================
// GET FILE BY ID
// ============================================================

export async function getFileById(id: string): Promise<File | null> {
  if (isDemoMode) {
    const all = getAllFilesLocal();
    return all.find((f) => f.id === id) || null;
  }

  try {
    const data = await executeQuerySingle<any>(
      `SELECT * FROM files WHERE id = $1`,
      [id]
    );

    return data ? transformFileFromDB(data) : null;
  } catch (error) {
    console.error('Error fetching file:', error);
    const all = getAllFilesLocal();
    return all.find((f) => f.id === id) || null;
  }
}

// ============================================================
// GET FILES BY ENTITY
// ============================================================

export async function getFilesByEntity(
  entityType: string,
  entityId: string
): Promise<File[]> {
  if (isDemoMode) {
    const all = getAllFilesLocal();
    return all.filter(
      (f) => f.related_entity_type === entityType && f.related_entity_id === entityId
    );
  }

  try {
    const data = await executeQuery<any>(
      `SELECT * FROM files
       WHERE related_entity_type = $1 AND related_entity_id = $2
       ORDER BY uploaded_at DESC`,
      [entityType, entityId]
    );

    return (data || []).map(transformFileFromDB);
  } catch (error) {
    console.error('Error fetching files by entity:', error);
    const all = getAllFilesLocal();
    return all.filter(
      (f) => f.related_entity_type === entityType && f.related_entity_id === entityId
    );
  }
}

// ============================================================
// CREATE FILE
// ============================================================

export async function createFile(
  file: Omit<File, 'id' | 'created_at' | 'updated_at'>
): Promise<File> {
  if (isDemoMode) {
    const newFile: File = {
      ...file,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addFileLocal(newFile);
    return newFile;
  }

  try {
    const data = await executeQuerySingle<any>(
      `INSERT INTO files (
        file_name, file_url, file_size, file_size_display, file_type,
        description_short, related_entity_type, related_entity_id,
        related_entity_name, uploaded_at, uploaded_by, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        file.file_name,
        file.file_url,
        file.file_size || null,
        file.file_size_display || null,
        file.file_type || null,
        file.description_short || null,
        file.related_entity_type || null,
        file.related_entity_id || null,
        file.related_entity_name || null,
        file.uploaded_at,
        file.uploaded_by,
        file.notes || null,
      ]
    );

    if (!data) {
      throw new Error('Failed to create file');
    }

    return transformFileFromDB(data);
  } catch (error) {
    console.error('Error creating file:', error);
    // Fallback to localStorage
    const newFile: File = {
      ...file,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addFileLocal(newFile);
    return newFile;
  }
}

// ============================================================
// UPDATE FILE
// ============================================================

export async function updateFile(
  id: string,
  updates: Partial<File>
): Promise<void> {
  if (isDemoMode) {
    updateFileLocal(id, updates);
    return;
  }

  try {
    // Build SET clause dynamically
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.file_name !== undefined) {
      setClauses.push(`file_name = $${paramIndex++}`);
      values.push(updates.file_name);
    }
    if (updates.file_url !== undefined) {
      setClauses.push(`file_url = $${paramIndex++}`);
      values.push(updates.file_url);
    }
    if (updates.file_size !== undefined) {
      setClauses.push(`file_size = $${paramIndex++}`);
      values.push(updates.file_size);
    }
    if (updates.file_size_display !== undefined) {
      setClauses.push(`file_size_display = $${paramIndex++}`);
      values.push(updates.file_size_display);
    }
    if (updates.file_type !== undefined) {
      setClauses.push(`file_type = $${paramIndex++}`);
      values.push(updates.file_type);
    }
    if (updates.description_short !== undefined) {
      setClauses.push(`description_short = $${paramIndex++}`);
      values.push(updates.description_short);
    }
    if (updates.related_entity_type !== undefined) {
      setClauses.push(`related_entity_type = $${paramIndex++}`);
      values.push(updates.related_entity_type);
    }
    if (updates.related_entity_id !== undefined) {
      setClauses.push(`related_entity_id = $${paramIndex++}`);
      values.push(updates.related_entity_id);
    }
    if (updates.related_entity_name !== undefined) {
      setClauses.push(`related_entity_name = $${paramIndex++}`);
      values.push(updates.related_entity_name);
    }
    if (updates.uploaded_at !== undefined) {
      setClauses.push(`uploaded_at = $${paramIndex++}`);
      values.push(updates.uploaded_at);
    }
    if (updates.uploaded_by !== undefined) {
      setClauses.push(`uploaded_by = $${paramIndex++}`);
      values.push(updates.uploaded_by);
    }
    if (updates.notes !== undefined) {
      setClauses.push(`notes = $${paramIndex++}`);
      values.push(updates.notes);
    }

    if (setClauses.length === 0) {
      return; // Nothing to update
    }

    // Always update updated_at
    setClauses.push(`updated_at = NOW()`);

    // Add file ID as final parameter
    values.push(id);

    const query = `UPDATE files SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`;

    await executeQuery(query, values);
  } catch (error) {
    console.error('Error updating file:', error);
    // Fallback to localStorage
    updateFileLocal(id, updates);
  }
}

// ============================================================
// DELETE FILE
// ============================================================

export async function deleteFile(id: string): Promise<void> {
  if (isDemoMode) {
    removeFileLocal(id);
    return;
  }

  try {
    await executeQuery(`DELETE FROM files WHERE id = $1`, [id]);
  } catch (error) {
    console.error('Error deleting file:', error);
    // Fallback to localStorage
    removeFileLocal(id);
  }
}

// ============================================================
// REMOVE FILE FROM PROJECT (UNLINK)
// ============================================================

export async function removeFileFromProject(fileId: string): Promise<void> {
  if (isDemoMode) {
    removeFileFromProjectLocal(fileId);
    return;
  }

  try {
    await updateFile(fileId, {
      related_entity_type: undefined,
      related_entity_id: undefined,
      related_entity_name: undefined,
    });
  } catch (error) {
    console.error('Error removing file from project:', error);
    // Fallback to localStorage
    removeFileFromProjectLocal(fileId);
  }
}

// ============================================================
// HELPER: TRANSFORM DB TO APP FORMAT
// ============================================================

function transformFileFromDB(dbFile: any): File {
  return {
    id: dbFile.id,
    file_name: dbFile.file_name,
    file_url: dbFile.file_url,
    file_size: dbFile.file_size || undefined,
    file_size_display: dbFile.file_size_display || undefined,
    file_type: dbFile.file_type || undefined,
    description_short: dbFile.description_short || undefined,
    related_entity_type: dbFile.related_entity_type || undefined,
    related_entity_id: dbFile.related_entity_id || undefined,
    related_entity_name: dbFile.related_entity_name || undefined,
    uploaded_at: dbFile.uploaded_at,
    uploaded_by: dbFile.uploaded_by,
    notes: dbFile.notes || undefined,
    created_at: dbFile.created_at,
    updated_at: dbFile.updated_at,
  };
}

// ============================================================
// SYNC: SAVE TO LOCALSTORAGE (FOR BACKWARD COMPATIBILITY)
// ============================================================

export async function syncFilesToLocalStorage(): Promise<void> {
  const files = await getAllFiles();
  saveFiles(files);
}
