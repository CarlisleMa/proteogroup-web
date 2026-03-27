interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
}

export default function StatCard({ label, value, subtitle }: StatCardProps) {
  return (
    <div className="card-accent p-6 hover:shadow-card-hover transition-all duration-300 group">
      <p className="text-sm font-medium text-slate-400 group-hover:text-slate-500 transition-colors">
        {label}
      </p>
      <p className="text-3xl font-bold text-slate-900 mt-1.5 tracking-tight">
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-slate-400 mt-1.5">{subtitle}</p>
      )}
    </div>
  );
}
