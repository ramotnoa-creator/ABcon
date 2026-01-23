import type { ProjectMilestone, Project } from '../types';
import type { User } from '../types/auth';
import { getAllMilestones, getMilestones } from '../services/milestonesService';
import { getProjects } from '../services/projectsService';
import { canAccessProject, canViewAllProjects } from '../utils/permissions';

export interface MilestoneWithProject {
  milestone: ProjectMilestone;
  project: Project;
}

/**
 * Get milestones within a date range, optionally filtered by project and user permissions
 */
export async function getMilestonesInDateRange(
  startDate: Date,
  endDate: Date,
  projectId?: string,
  user?: User | null
): Promise<MilestoneWithProject[]> {
  const [milestones, projects] = await Promise.all([
    projectId ? getMilestones(projectId) : getAllMilestones(),
    getProjects(),
  ]);
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  return milestones
    .filter((m) => {
      const date = new Date(m.date);
      return date >= startDate && date <= endDate;
    })
    .filter((m) => {
      // Filter by user permissions if user is provided
      if (!user) return true;
      if (canViewAllProjects(user)) return true;
      return canAccessProject(user, m.project_id);
    })
    .map((m) => ({
      milestone: m,
      project: projectMap.get(m.project_id)!,
    }))
    .filter((item) => item.project !== undefined)
    .sort((a, b) => new Date(a.milestone.date).getTime() - new Date(b.milestone.date).getTime());
}

/**
 * Get milestones completed in the last 30 days
 * Optionally filter by project and user permissions
 */
export async function getLastMonthCompletedMilestones(projectId?: string, user?: User | null): Promise<MilestoneWithProject[]> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const milestonesInRange = await getMilestonesInDateRange(thirtyDaysAgo, now, projectId, user);
  return milestonesInRange.filter((item) => item.milestone.status === 'completed');
}

/**
 * Get pending/in-progress milestones due in the next 30 days
 * Optionally filter by project and user permissions
 */
export async function getNextMonthPendingMilestones(projectId?: string, user?: User | null): Promise<MilestoneWithProject[]> {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const milestonesInRange = await getMilestonesInDateRange(now, thirtyDaysFromNow, projectId, user);
  return milestonesInRange.filter((item) => item.milestone.status !== 'completed');
}

/**
 * Group milestones by project for display
 */
export function groupMilestonesByProject(
  milestones: MilestoneWithProject[]
): Map<string, MilestoneWithProject[]> {
  const map = new Map<string, MilestoneWithProject[]>();

  milestones.forEach((item) => {
    const projectId = item.project.id;
    const existing = map.get(projectId) || [];
    existing.push(item);
    map.set(projectId, existing);
  });

  return map;
}

/**
 * Get milestone summary for a date range
 * Optionally filter by user permissions
 */
export async function getMilestoneSummary(
  startDate: Date,
  endDate: Date,
  projectId?: string,
  user?: User | null
): Promise<{
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
}> {
  const milestones = await getMilestonesInDateRange(startDate, endDate, projectId, user);

  return {
    total: milestones.length,
    completed: milestones.filter((m) => m.milestone.status === 'completed').length,
    pending: milestones.filter((m) => m.milestone.status === 'pending').length,
    inProgress: milestones.filter((m) => m.milestone.status === 'in-progress').length,
  };
}
