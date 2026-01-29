/**
 * Tasks Service - Neon Database API
 * Handles CRUD operations for tasks
 */

import { executeQuery, executeQuerySingle, isDemoMode as isNeonDemoMode } from '../lib/neon';
import type { Task } from '../types';
import type { User } from '../types/auth';
import { canViewAllProjects } from '../utils/permissions';
import {
  getTasks as getTasksLocal,
  getAllTasks as getAllTasksLocal,
  saveTasks,
  addTask as addTaskLocal,
  updateTask as updateTaskLocal,
  deleteTask as deleteTaskLocal,
} from '../data/tasksStorage';

// Check if we're in demo mode
const isDemoMode = isNeonDemoMode;

// ============================================================
// GET TASKS BY PROJECT ID
// ============================================================

export async function getTasks(projectId: string): Promise<Task[]> {
  if (isDemoMode) {
    return getTasksLocal(projectId);
  }

  try {
    const data = await executeQuery<Record<string, unknown>>(
      `SELECT * FROM tasks
       WHERE project_id = $1
       ORDER BY created_at DESC`,
      [projectId]
    );

    return (data || []).map(transformTaskFromDB);
  } catch (error: unknown) {
    console.error('Error fetching tasks:', error);
    return getTasksLocal(projectId);
  }
}

// ============================================================
// GET ALL TASKS
// ============================================================

export async function getAllTasks(): Promise<Task[]> {
  if (isDemoMode) {
    return getAllTasksLocal();
  }

  try {
    const data = await executeQuery<Record<string, unknown>>(
      `SELECT * FROM tasks ORDER BY created_at DESC`
    );

    return (data || []).map(transformTaskFromDB);
  } catch (error: unknown) {
    console.error('Error fetching all tasks:', error);
    return getAllTasksLocal();
  }
}

// ============================================================
// GET USER TASKS (FILTERED BY PERMISSIONS)
// ============================================================

export async function getUserTasks(user: User | null): Promise<Task[]> {
  if (!user) return [];

  // Admin and accountant can see all tasks
  if (canViewAllProjects(user)) {
    return getAllTasks();
  }

  // For PM and entrepreneur, get tasks from assigned projects only
  const assignedProjects = user.assignedProjects || [];
  if (assignedProjects.length === 0) return [];

  if (isDemoMode) {
    const allTasks = getAllTasksLocal();
    return allTasks.filter((task) => assignedProjects.includes(task.project_id));
  }

  try {
    const placeholders = assignedProjects.map((_, i) => `$${i + 1}`).join(', ');
    const data = await executeQuery<Record<string, unknown>>(
      `SELECT * FROM tasks WHERE project_id IN (${placeholders}) ORDER BY created_at DESC`,
      assignedProjects
    );

    return (data || []).map(transformTaskFromDB);
  } catch (error: unknown) {
    console.error('Error fetching user tasks:', error);
    const allTasks = getAllTasksLocal();
    return allTasks.filter((task) => assignedProjects.includes(task.project_id));
  }
}

// ============================================================
// GET TASK BY ID
// ============================================================

export async function getTaskById(id: string): Promise<Task | null> {
  if (isDemoMode) {
    const all = getAllTasksLocal();
    return all.find((t) => t.id === id) || null;
  }

  try {
    const data = await executeQuerySingle<Record<string, unknown>>(
      `SELECT * FROM tasks WHERE id = $1`,
      [id]
    );

    return data ? transformTaskFromDB(data) : null;
  } catch (error: unknown) {
    console.error('Error fetching task:', error);
    const all = getAllTasksLocal();
    return all.find((t) => t.id === id) || null;
  }
}

// ============================================================
// CREATE TASK
// ============================================================

export async function createTask(
  task: Omit<Task, 'id' | 'created_at' | 'updated_at'>
): Promise<Task> {
  if (isDemoMode) {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addTaskLocal(newTask);
    return newTask;
  }

  try {
    const data = await executeQuerySingle<Record<string, unknown>>(
      `INSERT INTO tasks (
        project_id, title, description, status, priority,
        assignee_professional_id, assignee_name, due_date, start_date,
        completed_at, duration_days, percent_complete,
        external_reference_id, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        task.project_id,
        task.title,
        task.description || null,
        task.status,
        task.priority,
        task.assignee_professional_id || null,
        task.assignee_name || null,
        task.due_date || null,
        task.start_date || null,
        task.completed_at || null,
        task.duration_days || null,
        task.percent_complete || null,
        task.external_reference_id || null,
        task.notes || null,
      ]
    );

    if (!data) {
      throw new Error('Failed to create task');
    }

    return transformTaskFromDB(data);
  } catch (error: unknown) {
    console.error('Error creating task:', error);
    // Fallback to localStorage
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    addTaskLocal(newTask);
    return newTask;
  }
}

// ============================================================
// UPDATE TASK
// ============================================================

export async function updateTask(
  id: string,
  updates: Partial<Task>
): Promise<void> {
  if (isDemoMode) {
    updateTaskLocal(id, updates);
    return;
  }

  try {
    // Build SET clause dynamically
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (updates.project_id !== undefined) {
      setClauses.push(`project_id = $${paramIndex++}`);
      values.push(updates.project_id);
    }
    if (updates.title !== undefined) {
      setClauses.push(`title = $${paramIndex++}`);
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    if (updates.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }
    if (updates.priority !== undefined) {
      setClauses.push(`priority = $${paramIndex++}`);
      values.push(updates.priority);
    }
    if (updates.assignee_professional_id !== undefined) {
      setClauses.push(`assignee_professional_id = $${paramIndex++}`);
      values.push(updates.assignee_professional_id);
    }
    if (updates.assignee_name !== undefined) {
      setClauses.push(`assignee_name = $${paramIndex++}`);
      values.push(updates.assignee_name);
    }
    if (updates.due_date !== undefined) {
      setClauses.push(`due_date = $${paramIndex++}`);
      values.push(updates.due_date);
    }
    if (updates.start_date !== undefined) {
      setClauses.push(`start_date = $${paramIndex++}`);
      values.push(updates.start_date);
    }
    if (updates.completed_at !== undefined) {
      setClauses.push(`completed_at = $${paramIndex++}`);
      values.push(updates.completed_at);
    }
    if (updates.duration_days !== undefined) {
      setClauses.push(`duration_days = $${paramIndex++}`);
      values.push(updates.duration_days);
    }
    if (updates.percent_complete !== undefined) {
      setClauses.push(`percent_complete = $${paramIndex++}`);
      values.push(updates.percent_complete);
    }
    if (updates.external_reference_id !== undefined) {
      setClauses.push(`external_reference_id = $${paramIndex++}`);
      values.push(updates.external_reference_id);
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

    // Add task ID as final parameter
    values.push(id);

    const query = `UPDATE tasks SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`;

    await executeQuery(query, values);
  } catch (error: unknown) {
    console.error('Error updating task:', error);
    // Fallback to localStorage
    updateTaskLocal(id, updates);
  }
}

// ============================================================
// DELETE TASK
// ============================================================

export async function deleteTask(id: string): Promise<void> {
  if (isDemoMode) {
    deleteTaskLocal(id);
    return;
  }

  try {
    await executeQuery(`DELETE FROM tasks WHERE id = $1`, [id]);
  } catch (error: unknown) {
    console.error('Error deleting task:', error);
    // Fallback to localStorage
    deleteTaskLocal(id);
  }
}

// ============================================================
// HELPER: TRANSFORM DB TO APP FORMAT
// ============================================================

function transformTaskFromDB(dbTask: any): Task {
  return {
    id: dbTask.id,
    project_id: dbTask.project_id,
    title: dbTask.title,
    description: dbTask.description || undefined,
    status: dbTask.status,
    priority: dbTask.priority,
    assignee_professional_id: dbTask.assignee_professional_id || undefined,
    assignee_name: dbTask.assignee_name || undefined,
    due_date: dbTask.due_date || undefined,
    start_date: dbTask.start_date || undefined,
    completed_at: dbTask.completed_at || undefined,
    duration_days: dbTask.duration_days || undefined,
    percent_complete: dbTask.percent_complete || undefined,
    external_reference_id: dbTask.external_reference_id || undefined,
    notes: dbTask.notes || undefined,
    created_at: dbTask.created_at,
    updated_at: dbTask.updated_at,
  };
}

// ============================================================
// SYNC: SAVE TO LOCALSTORAGE (FOR BACKWARD COMPATIBILITY)
// ============================================================

export async function syncTasksToLocalStorage(projectId?: string): Promise<void> {
  const tasks = projectId ? await getTasks(projectId) : await getAllTasks();
  saveTasks(tasks);
}
