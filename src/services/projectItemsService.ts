/**
 * Project Items Service - Neon Database API
 * Handles CRUD operations for project items (work packages)
 *
 * A project item represents a work package that goes through:
 * estimation → tender → contract → execution phases
 */

import { executeQuery, executeQuerySingle } from '../lib/neon';

// ============================================================
// TYPES
// ============================================================

export interface ProjectItem {
  id: string;
  project_id: string;
  milestone_id?: string;
  parent_item_id?: string;
  is_bulk_purchase: boolean;

  name: string;
  description?: string;
  type: 'planning' | 'execution';
  category?: string;

  current_status: ProjectItemStatus;
  current_estimate_version: number;
  current_estimated_cost?: number;
  current_contract_amount?: number;

  active_tender_id?: string;
  awarded_tender_id?: string;
  winner_professional_id?: string;

  version: number;
  metadata: Record<string, any>;

  created_at: string;
  created_by?: string;
  updated_at: string;
  updated_by?: string;

  deleted_at?: string;
  deleted_by?: string;
  deletion_reason?: string;
}

export type ProjectItemStatus =
  | 'estimation'
  | 'tender_draft'
  | 'tender_open'
  | 'tender_closed'
  | 'tender_cancelled'
  | 'contracted'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface CreateProjectItemInput {
  project_id: string;
  name: string;
  description?: string;
  type: 'planning' | 'execution';
  category?: string;
  milestone_id?: string;
  parent_item_id?: string;
  is_bulk_purchase?: boolean;
  created_by?: string;
}

export interface UpdateProjectItemInput {
  name?: string;
  description?: string;
  category?: string;
  current_status?: ProjectItemStatus;
  current_estimated_cost?: number;
  current_contract_amount?: number;
  active_tender_id?: string;
  awarded_tender_id?: string;
  winner_professional_id?: string;
  metadata?: Record<string, any>;
  updated_by?: string;
}

// ============================================================
// GET PROJECT ITEMS BY PROJECT ID
// ============================================================

export async function getProjectItems(
  projectId: string,
  type?: 'planning' | 'execution'
): Promise<ProjectItem[]> {
  try {
    const query = type
      ? `SELECT * FROM project_items
         WHERE project_id = $1 AND type = $2 AND deleted_at IS NULL
         ORDER BY created_at DESC`
      : `SELECT * FROM project_items
         WHERE project_id = $1 AND deleted_at IS NULL
         ORDER BY created_at DESC`;

    const params = type ? [projectId, type] : [projectId];
    const data = await executeQuery<Record<string, unknown>>(query, params);

    return (data || []).map(transformFromDB);
  } catch (error: unknown) {
    console.error('Error fetching project items:', error);
    throw error;
  }
}

// ============================================================
// GET SINGLE PROJECT ITEM
// ============================================================

export async function getProjectItemById(itemId: string): Promise<ProjectItem | null> {
  try {
    const data = await executeQuerySingle<Record<string, unknown>>(
      `SELECT * FROM project_items WHERE id = $1 AND deleted_at IS NULL`,
      [itemId]
    );

    return data ? transformFromDB(data) : null;
  } catch (error: unknown) {
    console.error('Error fetching project item:', error);
    throw error;
  }
}

// ============================================================
// GET PROJECT ITEMS WITH CURRENT ESTIMATE (View)
// ============================================================

export async function getProjectItemsWithEstimates(
  projectId: string,
  type?: 'planning' | 'execution'
): Promise<any[]> {
  try {
    const query = type
      ? `SELECT * FROM vw_project_items_with_current_estimate
         WHERE project_id = $1 AND type = $2
         ORDER BY created_at DESC`
      : `SELECT * FROM vw_project_items_with_current_estimate
         WHERE project_id = $1
         ORDER BY created_at DESC`;

    const params = type ? [projectId, type] : [projectId];
    const data = await executeQuery<Record<string, unknown>>(query, params);

    return data || [];
  } catch (error: unknown) {
    console.error('Error fetching project items with estimates:', error);
    throw error;
  }
}

// ============================================================
// CREATE PROJECT ITEM
// ============================================================

export async function createProjectItem(
  input: CreateProjectItemInput
): Promise<ProjectItem> {
  try {
    const data = await executeQuerySingle<Record<string, unknown>>(
      `INSERT INTO project_items (
        project_id, name, description, type, category,
        milestone_id, parent_item_id, is_bulk_purchase,
        current_status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        input.project_id,
        input.name,
        input.description || null,
        input.type,
        input.category || null,
        input.milestone_id || null,
        input.parent_item_id || null,
        input.is_bulk_purchase || false,
        'estimation', // Initial status
        input.created_by || null,
      ]
    );

    if (!data) {
      throw new Error('Failed to create project item');
    }

    return transformFromDB(data);
  } catch (error: unknown) {
    console.error('Error creating project item:', error);
    throw error;
  }
}

// ============================================================
// UPDATE PROJECT ITEM (with optimistic locking)
// ============================================================

export async function updateProjectItem(
  itemId: string,
  updates: UpdateProjectItemInput,
  expectedVersion?: number
): Promise<ProjectItem> {
  try {
    // Build SET clause dynamically
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    if (updates.category !== undefined) {
      setClauses.push(`category = $${paramIndex++}`);
      values.push(updates.category);
    }
    if (updates.current_status !== undefined) {
      setClauses.push(`current_status = $${paramIndex++}`);
      values.push(updates.current_status);
    }
    if (updates.current_estimated_cost !== undefined) {
      setClauses.push(`current_estimated_cost = $${paramIndex++}`);
      values.push(updates.current_estimated_cost);
    }
    if (updates.current_contract_amount !== undefined) {
      setClauses.push(`current_contract_amount = $${paramIndex++}`);
      values.push(updates.current_contract_amount);
    }
    if (updates.active_tender_id !== undefined) {
      setClauses.push(`active_tender_id = $${paramIndex++}`);
      values.push(updates.active_tender_id);
    }
    if (updates.awarded_tender_id !== undefined) {
      setClauses.push(`awarded_tender_id = $${paramIndex++}`);
      values.push(updates.awarded_tender_id);
    }
    if (updates.winner_professional_id !== undefined) {
      setClauses.push(`winner_professional_id = $${paramIndex++}`);
      values.push(updates.winner_professional_id);
    }
    if (updates.metadata !== undefined) {
      setClauses.push(`metadata = $${paramIndex++}::jsonb`);
      values.push(JSON.stringify(updates.metadata));
    }
    if (updates.updated_by !== undefined) {
      setClauses.push(`updated_by = $${paramIndex++}`);
      values.push(updates.updated_by);
    }

    if (setClauses.length === 0) {
      throw new Error('No fields to update');
    }

    // Add item ID
    values.push(itemId);
    const itemIdParam = paramIndex++;

    // Build WHERE clause with optional version check (optimistic locking)
    let whereClause = `id = $${itemIdParam} AND deleted_at IS NULL`;
    if (expectedVersion !== undefined) {
      values.push(expectedVersion);
      whereClause += ` AND version = $${paramIndex++}`;
    }

    const query = `
      UPDATE project_items
      SET ${setClauses.join(', ')}
      WHERE ${whereClause}
      RETURNING *
    `;

    const data = await executeQuerySingle<Record<string, unknown>>(query, values);

    if (!data) {
      if (expectedVersion !== undefined) {
        throw new Error('Optimistic lock failed: Item was modified by another user. Please refresh and try again.');
      }
      throw new Error('Project item not found or was deleted');
    }

    return transformFromDB(data);
  } catch (error: unknown) {
    console.error('Error updating project item:', error);
    throw error;
  }
}

// ============================================================
// SOFT DELETE PROJECT ITEM
// ============================================================

export async function softDeleteProjectItem(
  itemId: string,
  deletedBy?: string,
  reason?: string
): Promise<void> {
  try {
    await executeQuery(
      `UPDATE project_items
       SET deleted_at = NOW(), deleted_by = $2, deletion_reason = $3
       WHERE id = $1 AND deleted_at IS NULL`,
      [itemId, deletedBy || null, reason || null]
    );
  } catch (error: unknown) {
    console.error('Error soft deleting project item:', error);
    throw error;
  }
}

// ============================================================
// RESTORE DELETED PROJECT ITEM
// ============================================================

export async function restoreProjectItem(itemId: string): Promise<void> {
  try {
    await executeQuery(
      `UPDATE project_items
       SET deleted_at = NULL, deleted_by = NULL, deletion_reason = NULL
       WHERE id = $1`,
      [itemId]
    );
  } catch (error: unknown) {
    console.error('Error restoring project item:', error);
    throw error;
  }
}

// ============================================================
// GET ITEM FULL HISTORY
// ============================================================

export async function getItemHistory(itemId: string): Promise<any[]> {
  try {
    const data = await executeQuery<Record<string, unknown>>(
      `SELECT * FROM get_item_full_history($1)`,
      [itemId]
    );

    return data || [];
  } catch (error: unknown) {
    console.error('Error fetching item history:', error);
    throw error;
  }
}

// ============================================================
// GET ITEM LIFECYCLE VIEW
// ============================================================

export async function getItemLifecycle(itemId: string): Promise<any | null> {
  try {
    const data = await executeQuerySingle<Record<string, unknown>>(
      `SELECT * FROM vw_project_item_lifecycle WHERE id = $1`,
      [itemId]
    );

    return data || null;
  } catch (error: unknown) {
    console.error('Error fetching item lifecycle:', error);
    throw error;
  }
}

// ============================================================
// HELPER: TRANSFORM DB TO APP FORMAT
// ============================================================

function transformFromDB(dbItem: any): ProjectItem {
  return {
    id: dbItem.id,
    project_id: dbItem.project_id,
    milestone_id: dbItem.milestone_id || undefined,
    parent_item_id: dbItem.parent_item_id || undefined,
    is_bulk_purchase: dbItem.is_bulk_purchase || false,

    name: dbItem.name,
    description: dbItem.description || undefined,
    type: dbItem.type,
    category: dbItem.category || undefined,

    current_status: dbItem.current_status,
    current_estimate_version: dbItem.current_estimate_version || 1,
    current_estimated_cost: dbItem.current_estimated_cost ? parseFloat(dbItem.current_estimated_cost) : undefined,
    current_contract_amount: dbItem.current_contract_amount ? parseFloat(dbItem.current_contract_amount) : undefined,

    active_tender_id: dbItem.active_tender_id || undefined,
    awarded_tender_id: dbItem.awarded_tender_id || undefined,
    winner_professional_id: dbItem.winner_professional_id || undefined,

    version: dbItem.version || 1,
    metadata: dbItem.metadata || {},

    created_at: dbItem.created_at,
    created_by: dbItem.created_by || undefined,
    updated_at: dbItem.updated_at,
    updated_by: dbItem.updated_by || undefined,

    deleted_at: dbItem.deleted_at || undefined,
    deleted_by: dbItem.deleted_by || undefined,
    deletion_reason: dbItem.deletion_reason || undefined,
  };
}
