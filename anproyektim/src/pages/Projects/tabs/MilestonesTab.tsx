import type { Project } from '../../../types';

interface MilestonesTabProps {
  project: Project;
}

export default function MilestonesTab({ project }: MilestonesTabProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <h2 className="text-2xl font-bold mb-4">ציוני דרך</h2>
      <p className="text-text-secondary-light dark:text-text-secondary-dark">בקרוב</p>
    </div>
  );
}
