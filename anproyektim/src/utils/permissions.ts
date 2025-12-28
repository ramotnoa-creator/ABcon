import type { User, UserRole } from '../types/auth';

// Permission map (single source of truth)
// This defines what each role can do in the system
const PERMISSIONS = {
  admin: {
    viewAllProjects: true,
    editProjects: true,
    deleteProjects: true,
    createProjects: true,
    manageProfessionals: true,
    viewBudgets: true,
    editBudgets: true,
    viewTasks: true,
    editTasks: true,
    deleteTasks: true,
    createTasks: true,
    viewTenders: true,
    editTenders: true,
    deleteTenders: true,
    createTenders: true,
    viewFiles: true,
    uploadFiles: true,
    deleteFiles: true,
    manageUsers: true,
    viewPlanningChanges: true,
    editPlanningChanges: true,
    deletePlanningChanges: true,
    createPlanningChanges: true,
    viewSpecialIssues: true,
    editSpecialIssues: true,
    deleteSpecialIssues: true,
    createSpecialIssues: true,
  },
  project_manager: {
    viewAllProjects: false, // only assigned
    editProjects: true, // only assigned
    deleteProjects: false,
    createProjects: true,
    manageProfessionals: true,
    viewBudgets: true,
    editBudgets: true,
    viewTasks: true,
    editTasks: true,
    deleteTasks: false,
    createTasks: true,
    viewTenders: true,
    editTenders: true,
    deleteTenders: false,
    createTenders: true,
    viewFiles: true,
    uploadFiles: true,
    deleteFiles: false,
    manageUsers: false,
    viewPlanningChanges: true,
    editPlanningChanges: true,
    deletePlanningChanges: true,
    createPlanningChanges: true,
    viewSpecialIssues: true,
    editSpecialIssues: true,
    deleteSpecialIssues: true,
    createSpecialIssues: true,
  },
  entrepreneur: {
    viewAllProjects: false, // only assigned
    editProjects: false, // read-only
    deleteProjects: false,
    createProjects: false,
    manageProfessionals: false,
    viewBudgets: true,
    editBudgets: false,
    viewTasks: true,
    editTasks: false,
    deleteTasks: false,
    createTasks: false,
    viewTenders: true,
    editTenders: false,
    deleteTenders: false,
    createTenders: false,
    viewFiles: true,
    uploadFiles: false,
    deleteFiles: false,
    manageUsers: false,
    viewPlanningChanges: true,
    editPlanningChanges: false,
    deletePlanningChanges: false,
    createPlanningChanges: false,
    viewSpecialIssues: true,
    editSpecialIssues: false,
    deleteSpecialIssues: false,
    createSpecialIssues: false,
  },
  accountant: {
    viewAllProjects: true,
    editProjects: false, // read-only
    deleteProjects: false,
    createProjects: false,
    manageProfessionals: false,
    viewBudgets: true,
    editBudgets: false,
    viewTasks: true,
    editTasks: false,
    deleteTasks: false,
    createTasks: false,
    viewTenders: true,
    editTenders: false,
    deleteTenders: false,
    createTenders: false,
    viewFiles: true,
    uploadFiles: false,
    deleteFiles: false,
    manageUsers: false,
    viewPlanningChanges: true,
    editPlanningChanges: false,
    deletePlanningChanges: false,
    createPlanningChanges: false,
    viewSpecialIssues: true,
    editSpecialIssues: false,
    deleteSpecialIssues: false,
    createSpecialIssues: false,
  },
} as const;

// Generic permission check
export function hasPermission(
  user: User | null,
  permission: keyof typeof PERMISSIONS.admin
): boolean {
  if (!user) return false;
  return PERMISSIONS[user.role][permission] ?? false;
}

// Project permissions
export function canViewAllProjects(user: User | null): boolean {
  if (!user) return false;
  return PERMISSIONS[user.role].viewAllProjects;
}

export function canEditProject(user: User | null, projectId: string): boolean {
  if (!user) return false;
  if (!PERMISSIONS[user.role].editProjects) return false;

  // Admin can edit all
  if (user.role === 'admin') return true;

  // PM can edit only assigned projects
  if (user.role === 'project_manager') {
    return user.assignedProjects?.includes(projectId) ?? false;
  }

  return false;
}

export function canCreateProject(user: User | null): boolean {
  if (!user) return false;
  return PERMISSIONS[user.role].createProjects;
}

export function canDeleteProject(user: User | null): boolean {
  if (!user) return false;
  return PERMISSIONS[user.role].deleteProjects;
}

// Task permissions
export function canViewTasks(user: User | null): boolean {
  if (!user) return false;
  return PERMISSIONS[user.role].viewTasks;
}

export function canEditTask(user: User | null, projectId: string): boolean {
  if (!user) return false;
  if (!PERMISSIONS[user.role].editTasks) return false;

  // Admin can edit all
  if (user.role === 'admin') return true;

  // PM can edit tasks in assigned projects
  if (user.role === 'project_manager') {
    return user.assignedProjects?.includes(projectId) ?? false;
  }

  return false;
}

export function canCreateTask(user: User | null, projectId: string): boolean {
  if (!user) return false;
  if (!PERMISSIONS[user.role].createTasks) return false;

  // Admin can create tasks in all projects
  if (user.role === 'admin') return true;

  // PM can create tasks in assigned projects
  if (user.role === 'project_manager') {
    return user.assignedProjects?.includes(projectId) ?? false;
  }

  return false;
}

export function canDeleteTask(user: User | null): boolean {
  if (!user) return false;
  return PERMISSIONS[user.role].deleteTasks;
}

// Budget permissions
export function canViewBudgets(user: User | null): boolean {
  if (!user) return false;
  return PERMISSIONS[user.role].viewBudgets;
}

export function canEditBudget(user: User | null, projectId: string): boolean {
  if (!user) return false;
  if (!PERMISSIONS[user.role].editBudgets) return false;

  // Admin can edit all
  if (user.role === 'admin') return true;

  // PM can edit budgets in assigned projects
  if (user.role === 'project_manager') {
    return user.assignedProjects?.includes(projectId) ?? false;
  }

  return false;
}

// Tender permissions
export function canViewTenders(user: User | null): boolean {
  if (!user) return false;
  return PERMISSIONS[user.role].viewTenders;
}

export function canEditTender(user: User | null, projectId: string): boolean {
  if (!user) return false;
  if (!PERMISSIONS[user.role].editTenders) return false;

  // Admin can edit all
  if (user.role === 'admin') return true;

  // PM can edit tenders in assigned projects
  if (user.role === 'project_manager') {
    return user.assignedProjects?.includes(projectId) ?? false;
  }

  return false;
}

export function canCreateTender(user: User | null, projectId: string): boolean {
  if (!user) return false;
  if (!PERMISSIONS[user.role].createTenders) return false;

  // Admin can create tenders in all projects
  if (user.role === 'admin') return true;

  // PM can create tenders in assigned projects
  if (user.role === 'project_manager') {
    return user.assignedProjects?.includes(projectId) ?? false;
  }

  return false;
}

export function canDeleteTender(user: User | null): boolean {
  if (!user) return false;
  return PERMISSIONS[user.role].deleteTenders;
}

// File permissions
export function canViewFiles(user: User | null): boolean {
  if (!user) return false;
  return PERMISSIONS[user.role].viewFiles;
}

export function canUploadFile(user: User | null, projectId: string): boolean {
  if (!user) return false;
  if (!PERMISSIONS[user.role].uploadFiles) return false;

  // Admin can upload to all projects
  if (user.role === 'admin') return true;

  // PM can upload to assigned projects
  if (user.role === 'project_manager') {
    return user.assignedProjects?.includes(projectId) ?? false;
  }

  return false;
}

export function canDeleteFile(user: User | null): boolean {
  if (!user) return false;
  return PERMISSIONS[user.role].deleteFiles;
}

// Professional permissions
export function canManageProfessionals(user: User | null): boolean {
  if (!user) return false;
  return PERMISSIONS[user.role].manageProfessionals;
}

// User management permissions
export function canManageUsers(user: User | null): boolean {
  if (!user) return false;
  return PERMISSIONS[user.role].manageUsers;
}

// Check if user is in read-only mode
export function isReadOnly(user: User | null): boolean {
  if (!user) return true;
  return user.role === 'entrepreneur' || user.role === 'accountant';
}

// Check if user can access a specific project
export function canAccessProject(user: User | null, projectId: string): boolean {
  if (!user) return false;

  // Admin and Accountant can access all projects
  if (user.role === 'admin' || user.role === 'accountant') {
    return true;
  }

  // PM and Entrepreneur can access only assigned projects
  if (user.role === 'project_manager' || user.role === 'entrepreneur') {
    return user.assignedProjects?.includes(projectId) ?? false;
  }

  return false;
}

// Get role display name in Hebrew
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    admin: 'מנהל ראשי',
    project_manager: 'מנהל פרויקט',
    entrepreneur: 'יזם',
    accountant: 'רואה חשבון',
  };
  return roleNames[role];
}

// Get available roles for user creation (only admins can create users)
export function getAvailableRoles(): { value: UserRole; label: string }[] {
  return [
    { value: 'admin', label: getRoleDisplayName('admin') },
    { value: 'project_manager', label: getRoleDisplayName('project_manager') },
    { value: 'entrepreneur', label: getRoleDisplayName('entrepreneur') },
    { value: 'accountant', label: getRoleDisplayName('accountant') },
  ];
}

// Planning Changes permissions
export function canViewPlanningChanges(user: User | null): boolean {
  if (!user) return false;
  return PERMISSIONS[user.role].viewPlanningChanges;
}

export function canEditPlanningChange(user: User | null, projectId: string): boolean {
  if (!user) return false;
  if (!PERMISSIONS[user.role].editPlanningChanges) return false;

  // Admin can edit all
  if (user.role === 'admin') return true;

  // PM can edit planning changes in assigned projects
  if (user.role === 'project_manager') {
    return user.assignedProjects?.includes(projectId) ?? false;
  }

  return false;
}

export function canCreatePlanningChange(user: User | null, projectId: string): boolean {
  if (!user) return false;
  if (!PERMISSIONS[user.role].createPlanningChanges) return false;

  // Admin can create planning changes in all projects
  if (user.role === 'admin') return true;

  // PM can create planning changes in assigned projects
  if (user.role === 'project_manager') {
    return user.assignedProjects?.includes(projectId) ?? false;
  }

  return false;
}

export function canDeletePlanningChange(user: User | null, projectId: string): boolean {
  if (!user) return false;
  if (!PERMISSIONS[user.role].deletePlanningChanges) return false;

  // Admin can delete all
  if (user.role === 'admin') return true;

  // PM can delete planning changes in assigned projects
  if (user.role === 'project_manager') {
    return user.assignedProjects?.includes(projectId) ?? false;
  }

  return false;
}

// Special Issues permissions
export function canViewSpecialIssues(user: User | null): boolean {
  if (!user) return false;
  return PERMISSIONS[user.role].viewSpecialIssues;
}

export function canEditSpecialIssue(
  user: User | null,
  projectId: string
): boolean {
  if (!user) return false;
  if (!PERMISSIONS[user.role].editSpecialIssues) return false;

  // Admin can edit all
  if (user.role === 'admin') return true;

  // PM can edit special issues in assigned projects
  if (user.role === 'project_manager') {
    return user.assignedProjects?.includes(projectId) ?? false;
  }

  return false;
}

export function canCreateSpecialIssue(user: User | null, projectId: string): boolean {
  if (!user) return false;
  if (!PERMISSIONS[user.role].createSpecialIssues) return false;

  // Admin can create special issues in all projects
  if (user.role === 'admin') return true;

  // PM can create special issues in assigned projects
  if (user.role === 'project_manager') {
    return user.assignedProjects?.includes(projectId) ?? false;
  }

  return false;
}

export function canDeleteSpecialIssue(user: User | null, projectId: string): boolean {
  if (!user) return false;
  if (!PERMISSIONS[user.role].deleteSpecialIssues) return false;

  // Admin can delete all
  if (user.role === 'admin') return true;

  // PM can delete special issues in assigned projects
  if (user.role === 'project_manager') {
    return user.assignedProjects?.includes(projectId) ?? false;
  }

  return false;
}
