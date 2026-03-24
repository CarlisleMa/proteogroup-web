import { TIER_COLORS } from '@/lib/constants';

interface BadgeProps {
  tier: string;
  className?: string;
}

export default function Badge({ tier, className = '' }: BadgeProps) {
  const colorClasses = TIER_COLORS[tier] || 'bg-slate-100 text-slate-600';
  const displayLabel = tier.replace(/_/g, ' ').replace(/Tier(\d)/, 'Tier $1');

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses} ${className}`}
    >
      {displayLabel}
    </span>
  );
}
