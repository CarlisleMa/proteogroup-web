import Link from 'next/link';

interface Breadcrumb {
  label: string;
  href: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
}

export default function PageHeader({
  title,
  description,
  breadcrumbs,
}: PageHeaderProps) {
  return (
    <div className="mb-8">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-sm text-slate-500 mb-3">
          {breadcrumbs.map((crumb, idx) => (
            <span key={crumb.href} className="flex items-center gap-1.5">
              {idx > 0 && (
                <span className="text-slate-300" aria-hidden="true">
                  /
                </span>
              )}
              <Link
                href={crumb.href}
                className="hover:text-slate-700 transition-colors"
              >
                {crumb.label}
              </Link>
            </span>
          ))}
          <span className="text-slate-300" aria-hidden="true">
            /
          </span>
          <span className="text-slate-900 font-medium">{title}</span>
        </nav>
      )}
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      {description && (
        <p className="mt-1 text-slate-500">{description}</p>
      )}
    </div>
  );
}
