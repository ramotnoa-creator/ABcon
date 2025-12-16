interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6 text-sm">
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-2">
          {index > 0 && (
            <span className="text-text-secondary-light dark:text-text-secondary-dark">/</span>
          )}
          {item.href ? (
            <a
              className="text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors"
              href={item.href}
            >
              {item.label}
            </a>
          ) : (
            <span className="font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}
