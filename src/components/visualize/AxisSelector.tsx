'use client';

interface AxisOption {
  key: string;
  label: string;
}

interface AxisSelectorProps {
  label: string;
  value: string;
  options: AxisOption[];
  onChange: (key: string) => void;
}

export default function AxisSelector({ label, value, options, onChange }: AxisSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {options.map((opt) => (
          <option key={opt.key} value={opt.key}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
