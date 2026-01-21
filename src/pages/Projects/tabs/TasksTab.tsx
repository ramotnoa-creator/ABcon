import { useState, useCallback, useEffect } from 'react';
import {
  getTasks,
  createTask,
  updateTask,
} from '../../../services/tasksService';
import { getProjectProfessionalsByProjectId } from '../../../services/projectProfessionalsService';
import { getProfessionals } from '../../../services/professionalsService';
import type { Project } from '../../../types';
import type { Task, TaskStatus, TaskPriority } from '../../../types';
import { formatDateForDisplay } from '../../../utils/dateUtils';
import GanttImport from '../../../components/GanttImport/GanttImport';

interface TasksTabProps {
  project: Project;
}

const statusColumns: { id: TaskStatus; label: string; labelHe: string }[] = [
  { id: 'Backlog', label: 'Backlog', labelHe: 'ממתין' },
  { id: 'Ready', label: 'Ready', labelHe: 'מוכן' },
  { id: 'In Progress', label: 'In Progress', labelHe: 'בביצוע' },
  { id: 'Blocked', label: 'Blocked', labelHe: 'חסום' },
  { id: 'Done', label: 'Done', labelHe: 'הושלם' },
  { id: 'Canceled', label: 'Canceled', labelHe: 'בוטל' },
];

const priorityColors: Record<TaskPriority, string> = {
  High: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
  Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
  Low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
};

const priorityIcons: Record<TaskPriority, string> = {
  High: '🔴',
  Medium: '🟡',
  Low: '🟢',
};

const loadInitialTasks = async (projectId: string): Promise<Task[]> => {
  const loaded = await getTasks(projectId);
  return loaded;
};

const loadInitialProfessionals = async (projectId: string): Promise<Array<{ id: string; name: string }>> => {
  const [projectProfessionals, allProfessionals] = await Promise.all([
    getProjectProfessionalsByProjectId(projectId),
    getProfessionals(),
  ]);

  return projectProfessionals.map((pp) => {
    const professional = allProfessionals.find((p) => p.id === pp.professional_id);
    return {
      id: pp.professional_id,
      name: professional?.professional_name || 'Unknown',
    };
  });
};

export default function TasksTab({ project }: TasksTabProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [projectProfessionals, setProjectProfessionals] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    const loaded = await loadInitialTasks(project.id);
    setTasks(loaded);
  }, [project.id]);

  const loadProjectProfessionals = useCallback(async () => {
    const loaded = await loadInitialProfessionals(project.id);
    setProjectProfessionals(loaded);
  }, [project.id]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [loadedTasks, loadedProfessionals] = await Promise.all([
          loadInitialTasks(project.id),
          loadInitialProfessionals(project.id),
        ]);
        setTasks(loadedTasks);
        setProjectProfessionals(loadedProfessionals);
      } catch (error) {
        console.error('Error loading tasks data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [project.id]);

  const refreshData = useCallback(async () => {
    await loadTasks();
    await loadProjectProfessionals();
  }, [loadTasks, loadProjectProfessionals]);
  void refreshData; // Available for refresh button

  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    description: '',
    status: 'Backlog' as TaskStatus,
    priority: 'Medium' as TaskPriority,
    assignee_professional_id: '',
    due_date: '',
    notes: '',
  });

  const handleCreateTask = async () => {
    if (!newTaskForm.title.trim()) return;

    const taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'> = {
      project_id: project.id,
      title: newTaskForm.title.trim(),
      description: newTaskForm.description.trim() || undefined,
      status: newTaskForm.status,
      priority: newTaskForm.priority,
      assignee_professional_id: newTaskForm.assignee_professional_id || undefined,
      assignee_name: projectProfessionals.find((p) => p.id === newTaskForm.assignee_professional_id)?.name,
      due_date: newTaskForm.due_date || undefined,
      notes: newTaskForm.notes.trim() || undefined,
    };

    try {
      await createTask(taskData);
      await loadTasks();
      setIsNewTaskModalOpen(false);
      setNewTaskForm({
        title: '',
        description: '',
        status: 'Backlog',
        priority: 'Medium',
        assignee_professional_id: '',
        due_date: '',
        notes: '',
      });
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
      await loadTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const getTasksByStatus = (status: TaskStatus): Task[] => {
    return tasks.filter((t) => t.status === status);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-end gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center justify-center h-10 px-4 rounded-lg bg-slate-600 text-white hover:bg-slate-700 transition text-sm font-bold"
          >
            <span className="material-symbols-outlined me-2 text-[18px]">upload</span>
            ייבוא גאנט
          </button>
          <button
            onClick={() => setIsNewTaskModalOpen(true)}
            className="flex items-center justify-center h-10 px-4 rounded-lg bg-primary text-white hover:bg-primary-hover transition text-sm font-bold"
          >
            <span className="material-symbols-outlined me-2 text-[18px]">add</span>
            משימה חדשה
          </button>
      </div>

      {/* Kanban Board - Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <div className="flex gap-4 min-w-max pb-4">
          {statusColumns.map((column) => {
            const columnTasks = getTasksByStatus(column.id);
            return (
              <div
                key={column.id}
                className="flex-shrink-0 w-64 bg-background-light dark:bg-background-dark rounded-lg p-4 border border-border-light dark:border-border-dark"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    {column.labelHe}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-border-light dark:bg-border-dark text-xs font-bold">
                    {columnTasks.length}
                  </span>
                </div>
                <div className="space-y-3 min-h-[200px]">
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-surface-light dark:bg-surface-dark rounded-lg p-3 border border-border-light dark:border-border-dark shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-bold text-sm flex-1">{task.title}</h5>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ms-2 ${priorityColors[task.priority]}`}
                        >
                          {priorityIcons[task.priority]}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-2 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs">
                        {task.assignee_name && (
                          <span className="text-text-secondary-light dark:text-text-secondary-dark">
                            👤 {task.assignee_name}
                          </span>
                        )}
                        {task.due_date && (
                          <span className="text-text-secondary-light dark:text-text-secondary-dark">
                            📅 {formatDateForDisplay(task.due_date)}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 pt-2 border-t border-border-light dark:border-border-dark">
                        <select
                          className="w-full text-xs bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded px-2 py-1"
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {statusColumns.map((col) => (
                            <option key={col.id} value={col.id}>
                              {col.labelHe}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                  {columnTasks.length === 0 && (
                    <div className="text-center py-8 text-text-secondary-light dark:text-text-secondary-dark text-xs">
                      אין משימות
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile List View */}
      <div className="md:hidden space-y-4">
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-text-secondary-light dark:text-text-secondary-dark">
            אין משימות
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="bg-surface-light dark:bg-surface-dark rounded-lg p-4 border border-border-light dark:border-border-dark shadow-sm"
            >
              <div className="flex items-start justify-between mb-2">
                <h5 className="font-bold text-sm flex-1">{task.title}</h5>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ms-2 ${priorityColors[task.priority]}`}
                >
                  {priorityIcons[task.priority]}
                </span>
              </div>
              {task.description && (
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-3">
                  {task.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-xs mb-3">
                <span className="px-2 py-1 rounded bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark">
                  {statusColumns.find((c) => c.id === task.status)?.labelHe}
                </span>
                {task.assignee_name && (
                  <span className="text-text-secondary-light dark:text-text-secondary-dark">
                    👤 {task.assignee_name}
                  </span>
                )}
                {task.due_date && (
                  <span className="text-text-secondary-light dark:text-text-secondary-dark">
                    📅 {formatDateForDisplay(task.due_date)}
                  </span>
                )}
              </div>
              <select
                className="w-full text-xs bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded px-2 py-1"
                value={task.status}
                onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
              >
                {statusColumns.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.label}
                  </option>
                ))}
              </select>
            </div>
          ))
        )}
      </div>

      {/* New Task Modal */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg border border-border-light dark:border-border-dark w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border-light dark:border-border-dark sticky top-0 bg-surface-light dark:bg-surface-dark">
              <h3 className="text-lg font-bold">משימה חדשה</h3>
              <button
                onClick={() => setIsNewTaskModalOpen(false)}
                className="size-8 flex items-center justify-center hover:bg-background-light dark:hover:bg-background-dark rounded transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">
                  כותרת <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="כותרת המשימה"
                  value={newTaskForm.title}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">תיאור</label>
                <textarea
                  className="w-full p-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary resize-none h-24"
                  placeholder="תיאור המשימה..."
                  value={newTaskForm.description}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">סטטוס</label>
                  <select
                    className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                    value={newTaskForm.status}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, status: e.target.value as TaskStatus })}
                  >
                    {statusColumns.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">עדיפות</label>
                  <select
                    className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                    value={newTaskForm.priority}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, priority: e.target.value as TaskPriority })}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">איש מקצוע</label>
                  <select
                    className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                    value={newTaskForm.assignee_professional_id}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, assignee_professional_id: e.target.value })}
                  >
                    <option value="">לא משויך</option>
                    {projectProfessionals.map((prof) => (
                      <option key={prof.id} value={prof.id}>
                        {prof.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">תאריך יעד</label>
                  <input
                    className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                    type="date"
                    value={newTaskForm.due_date}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, due_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">הערות</label>
                <textarea
                  className="w-full p-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary resize-none h-20"
                  placeholder="הערות..."
                  value={newTaskForm.notes}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, notes: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold text-sm transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={handleCreateTask}
                  disabled={!newTaskForm.title.trim()}
                  className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  יצירה
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg border border-border-light dark:border-border-dark w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border-light dark:border-border-dark sticky top-0 bg-surface-light dark:bg-surface-dark">
              <h3 className="text-lg font-bold">{selectedTask.title}</h3>
              <button
                onClick={() => setSelectedTask(null)}
                className="size-8 flex items-center justify-center hover:bg-background-light dark:hover:bg-background-dark rounded transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {selectedTask.description && (
                <div>
                  <label className="block text-sm font-bold mb-2">תיאור</label>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    {selectedTask.description}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">סטטוס</label>
                  <select
                    className="w-full h-10 px-3 rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                    value={selectedTask.status}
                    onChange={(e) => {
                      handleStatusChange(selectedTask.id, e.target.value as TaskStatus);
                      setSelectedTask({ ...selectedTask, status: e.target.value as TaskStatus });
                    }}
                  >
                    {statusColumns.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">עדיפות</label>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded text-sm font-bold ${priorityColors[selectedTask.priority]}`}
                  >
                    {priorityIcons[selectedTask.priority]} {selectedTask.priority}
                  </span>
                </div>
              </div>
              {selectedTask.assignee_name && (
                <div>
                  <label className="block text-sm font-bold mb-2">איש מקצוע</label>
                  <p className="text-sm">{selectedTask.assignee_name}</p>
                </div>
              )}
              {selectedTask.due_date && (
                <div>
                  <label className="block text-sm font-bold mb-2">תאריך יעד</label>
                  <p className="text-sm">{formatDateForDisplay(selectedTask.due_date)}</p>
                </div>
              )}
              {selectedTask.notes && (
                <div>
                  <label className="block text-sm font-bold mb-2">הערות</label>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    {selectedTask.notes}
                  </p>
                </div>
              )}
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover font-bold text-sm transition-colors"
                >
                  סגור
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gantt Import Modal */}
      {isImportModalOpen && (
        <GanttImport
          project={project}
          onClose={() => {
            setIsImportModalOpen(false);
            loadTasks(); // Reload tasks after import
          }}
        />
      )}
    </div>
  );
}
