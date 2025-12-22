import type { Project } from '../../types';

interface GanttImportProps {
  project: Project;
  onClose: () => void;
}

export default function GanttImport({ project, onClose }: GanttImportProps) {
  return (
    <div>
      {/* Gantt Import component - placeholder */}
      <p>Gantt Import for {project.project_name}</p>
      <button onClick={onClose}>Close</button>
    </div>
  );
}
