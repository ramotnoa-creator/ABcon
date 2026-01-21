/**
 * Gantt Tasks Service - Neon Database API
 * Handles CRUD operations for gantt tasks (milestone-level tasks)
 */

import { executeQuery, executeQuerySingle, isDemoMode as isNeonDemoMode } from '../lib/neon';
import type { GanttTask } from '../types';
import {
  getGanttTasks as getGanttTasksLocal,
  getGanttTasksByMilestone as getGanttTasksByMilestoneLocal,
  getAllGanttTasks as getAllGanttTasksLocal,
  saveGanttTasks,
  addGanttTask as addGanttTaskLocal,
  updateGanttTask as updateGanttTaskLocal,
  deleteGanttTask as deleteGanttTaskLocal,
  getGanttTaskById as getGanttTaskByIdLocal,
  getNextGanttTaskOrder as getNextGanttTaskOrderLocal,
  getGanttTaskStats as getGanttTaskStatsLocal,
  deleteGanttTasksByMilestone as deleteGanttTasksByMilestoneLocal,
} from '../data/ganttTasksStorage';

// Check if we're in demo mode
const isDemoMode = isNeonDemoMode;

// ============================================================
// GET GANTT TASKS BY PROJECT
// ============================================================

export async function getGanttTasks(projectId: string): Promise<GanttTask[]> {
  if (isDemoMode) {
    return getGanttTasksLocal(projectId);
  }

  try {
    const data = await executeQuery<any>(
      `SELECT * FROM gantt_tasks WHERE project_id = $1 ORDER BY "order" ASC`,
      [projectId]
    );

    return (data || []).map(transformGanttTaskFromDB);
  } catch (error) {
    console.error('Error fetching gantt tasks:', error);
    return getGanttTasksLocal(projectId);
  }
}

// ============================================================
// GET GANTT TASKS BY MILESTONE
// ============================================================

export async function getGanttTasksByMilestone(
  projectId: string,
  milestoneId: string
): Promise<GanttTask[]> {
  if (isDemoMode) {
    return getGanttTasksByMilestoneLocal(projectId, milestoneId);
  }

  try {
    const data = await executeQuery<any>(
      `SELECT * FROM gantt_tasks
       WHERE project_id = $1 AND milestone_id = $2
       ORDER BY "order" ASC`,
      [projectId, milestoneId]
    );

    return (data || []).map(transformGanttTaskFromDB);
  } catch (error) {
    console.error('Error fetching gantt tasks by milestone:', error);
    return getGanttTasksByMilestoneLocal(projectId, milestoneId);
  }
}

// ============================================================
// GET ALL GANTT TASKS
// ============================================================

export async function getAllGanttTasks(): Promise<GanttTask[]> {
  if (isDemoMode) {
    return getAllGanttTasksLocal();
  }

  try {
    const data = await executeQuery<any>(`SELECT * FROM gantt_tasks ORDER BY "order" ASC`);

    return (data || []).map(transformGanttTaskFromDB);
  } catch (error) {
    console.error('Error fetching all gantt tasks:', error);
    return getAllGanttTasksLocal();
  }
}

// ============================================================
// GET GANTT TASK BY ID
// ============================================================

export async function getGanttTaskById(id: string): Promise<GanttTask | null> {
  if (isDemoMode) {
    return getGanttTaskByIdLocal(id);
  }

  try {
    const data = await executeQuerySingle<any>(
      `SELECT * FROM gantt_tasks WHERE id = $1`,
      [id]
    );

    return data ? transformGanttTaskFromDB(data) : null;
  } catch (error) {
    console.error('Error fetching gantt task by id:', error);
    return getGanttTaskByIdLocal(id);
  }
}

// ============================================================
// CREATE GANTT TASK
// ============================================================

export async function createGanttTask(
  task: Omit<GanttTask, 'id' | 'created_at' | 'updated_at'>
): Promise<GanttTask> {
  if (isDemoMode) {
    const newTask: GanttTask = {
      ...task,
      id: `gantt-task-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addGanttTaskLocal(newTask);
    return newTask;
  }

  try {
    const data = await executeQuerySingle<any>(
      `INSERT INTO gantt_tasks (
        project_id, milestone_id, name, description, start_date, end_date, duration,
        status, priority, progress, assigned_to_id, resource_name, predecessors,
        type, wbs, outline_level, ms_project_id, "order", notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        task.project_id,
        task.milestone_id,
        task.name,
        task.description || null,
        task.start_date,
        task.end_date,
        task.duration,
        task.status,
        task.priority,
        task.progress,
        task.assigned_to_id || null,
        task.resource_name || null,
        task.predecessors || null,
        task.type,
        task.wbs || null,
        task.outline_level || null,
        task.ms_project_id || null,
        task.order,
        task.notes || null,
      ]
    );

    if (!data) {
      throw new Error('Failed to create gantt task');
    }

    return transformGanttTaskFromDB(data);
  } catch (error) {
    console.error('Error creating gantt task:', error);
    // Fallback to localStorage
    const newTask: GanttTask = {
      ...task,
      id: `gantt-task-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addGanttTaskLocal(newTask);
    return newTask;
  }
}

// ============================================================
// UPDATE GANTT TASK
// ============================================================

export async function updateGanttTask(
  id: string,
  updates: Partial<GanttTask>
): Promise<void> {
  if (isDemoMode) {
    updateGanttTaskLocal(id, updates);
    return;
  }

  try {
    // Build SET clause dynamically
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    if (updates.start_date !== undefined) {
      setClauses.push(`start_date = $${paramIndex++}`);
      values.push(updates.start_date);
    }
    if (updates.end_date !== undefined) {
      setClauses.push(`end_date = $${paramIndex++}`);
      values.push(updates.end_date);
    }
    if (updates.duration !== undefined) {
      setClauses.push(`duration = $${paramIndex++}`);
      values.push(updates.duration);
    }
    if (updates.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }
    if (updates.priority !== undefined) {
      setClauses.push(`priority = $${paramIndex++}`);
      values.push(updates.priority);
    }
    if (updates.progress !== undefined) {
      setClauses.push(`progress = $${paramIndex++}`);
      values.push(updates.progress);
    }
    if (updates.assigned_to_id !== undefined) {
      setClauses.push(`assigned_to_id = $${paramIndex++}`);
      values.push(updates.assigned_to_id);
    }
    if (updates.resource_name !== undefined) {
      setClauses.push(`resource_name = $${paramIndex++}`);
      values.push(updates.resource_name);
    }
    if (updates.predecessors !== undefined) {
      setClauses.push(`predecessors = $${paramIndex++}`);
      values.push(updates.predecessors);
    }
    if (updates.type !== undefined) {
      setClauses.push(`type = $${paramIndex++}`);
      values.push(updates.type);
    }
    if (updates.wbs !== undefined) {
      setClauses.push(`wbs = $${paramIndex++}`);
      values.push(updates.wbs);
    }
    if (updates.outline_level !== undefined) {
      setClauses.push(`outline_level = $${paramIndex++}`);
      values.push(updates.outline_level);
    }
    if (updates.ms_project_id !== undefined) {
      setClauses.push(`ms_project_id = $${paramIndex++}`);
      values.push(updates.ms_project_id);
    }
    if (updates.order !== undefined) {
      setClauses.push(`"order" = $${paramIndex++}`);
      values.push(updates.order);
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

    // Add id as final parameter
    values.push(id);

    const query = `UPDATE gantt_tasks SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`;

    await executeQuery(query, values);
  } catch (error) {
    console.error('Error updating gantt task:', error);
    // Fallback to localStorage
    updateGanttTaskLocal(id, updates);
  }
}

// ============================================================
// DELETE GANTT TASK
// ============================================================

export async function deleteGanttTask(id: string): Promise<void> {
  if (isDemoMode) {
    deleteGanttTaskLocal(id);
    return;
  }

  try {
    await executeQuery(`DELETE FROM gantt_tasks WHERE id = $1`, [id]);
  } catch (error) {
    console.error('Error deleting gantt task:', error);
    // Fallback to localStorage
    deleteGanttTaskLocal(id);
  }
}

// ============================================================
// DELETE GANTT TASKS BY MILESTONE
// ============================================================

export async function deleteGanttTasksByMilestone(milestoneId: string): Promise<void> {
  if (isDemoMode) {
    deleteGanttTasksByMilestoneLocal(milestoneId);
    return;
  }

  try {
    await executeQuery(`DELETE FROM gantt_tasks WHERE milestone_id = $1`, [milestoneId]);
  } catch (error) {
    console.error('Error deleting gantt tasks by milestone:', error);
    // Fallback to localStorage
    deleteGanttTasksByMilestoneLocal(milestoneId);
  }
}

// ============================================================
// GET NEXT GANTT TASK ORDER
// ============================================================

export async function getNextGanttTaskOrder(projectId: string): Promise<number> {
  if (isDemoMode) {
    return getNextGanttTaskOrderLocal(projectId);
  }

  try {
    const data = await executeQuerySingle<any>(
      `SELECT MAX("order") as max_order FROM gantt_tasks WHERE project_id = $1`,
      [projectId]
    );
    const maxOrder = data?.max_order || 0;
    return maxOrder + 1;
  } catch (error) {
    console.error('Error getting next gantt task order:', error);
    return getNextGanttTaskOrderLocal(projectId);
  }
}

// ============================================================
// GET GANTT TASK STATS
// ============================================================

export async function getGanttTaskStats(projectId: string): Promise<{
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  averageProgress: number;
}> {
  if (isDemoMode) {
    return getGanttTaskStatsLocal(projectId);
  }

  try {
    const tasks = await getGanttTasks(projectId);
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
    const averageProgress = total > 0
      ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / total)
      : 0;

    return { total, completed, pending, inProgress, averageProgress };
  } catch (error) {
    console.error('Error getting gantt task stats:', error);
    return getGanttTaskStatsLocal(projectId);
  }
}

// ============================================================
// HELPER: TRANSFORM DB TO APP FORMAT
// ============================================================

function transformGanttTaskFromDB(dbTask: any): GanttTask {
  return {
    id: dbTask.id,
    project_id: dbTask.project_id,
    milestone_id: dbTask.milestone_id,
    name: dbTask.name,
    description: dbTask.description || undefined,
    start_date: dbTask.start_date,
    end_date: dbTask.end_date,
    duration: dbTask.duration,
    status: dbTask.status,
    priority: dbTask.priority,
    progress: dbTask.progress,
    assigned_to_id: dbTask.assigned_to_id || undefined,
    resource_name: dbTask.resource_name || undefined,
    predecessors: dbTask.predecessors || undefined,
    type: dbTask.type,
    wbs: dbTask.wbs || undefined,
    outline_level: dbTask.outline_level || undefined,
    ms_project_id: dbTask.ms_project_id || undefined,
    order: dbTask.order,
    notes: dbTask.notes || undefined,
    created_at: dbTask.created_at,
    updated_at: dbTask.updated_at,
  };
}

// ============================================================
// SYNC: SAVE TO LOCALSTORAGE (FOR BACKWARD COMPATIBILITY)
// ============================================================

export async function syncGanttTasksToLocalStorage(): Promise<void> {
  const tasks = await getAllGanttTasks();
  saveGanttTasks(tasks);
}
