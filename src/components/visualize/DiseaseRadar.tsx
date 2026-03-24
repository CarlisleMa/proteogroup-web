'use client';

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { DISEASE_DISPLAY_NAMES } from '@/lib/constants';
import { formatNumber } from '@/lib/formatters';

interface DiseaseAssoc {
  outcome: string;
  cohens_d: number;
  p_value?: number;
  p_value_adjusted?: number;
}

interface DiseaseRadarProps {
  diseases: DiseaseAssoc[];
}

export default function DiseaseRadar({ diseases }: DiseaseRadarProps) {
  if (!diseases || diseases.length === 0) return null;

  const data = Object.keys(DISEASE_DISPLAY_NAMES).map((outcome) => {
    const assoc = diseases.find((d) => d.outcome === outcome);
    return {
      disease: DISEASE_DISPLAY_NAMES[outcome],
      absEffect: assoc ? Math.abs(assoc.cohens_d) : 0,
      rawEffect: assoc?.cohens_d ?? 0,
      significant: assoc ? (assoc.p_value_adjusted ?? assoc.p_value ?? 1) < 0.05 : false,
    };
  });

  const maxEffect = Math.max(...data.map((d) => d.absEffect), 0.1);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-sm font-medium text-slate-700 mb-1">Disease Fingerprint</h3>
      <p className="text-xs text-slate-400 mb-3">Absolute Cohen&apos;s d across 12 disease outcomes</p>
      <ResponsiveContainer width="100%" height={350}>
        <RadarChart data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis
            dataKey="disease"
            tick={{ fontSize: 10, fill: '#64748b' }}
          />
          <PolarRadiusAxis
            domain={[0, Math.ceil(maxEffect * 10) / 10]}
            tick={{ fontSize: 9 }}
            tickCount={4}
          />
          <Radar
            name="Effect Size"
            dataKey="absEffect"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          <Tooltip
            formatter={(value: any, _name: any, props: any) => {
              const raw = props?.payload?.rawEffect as number;
              const sig = props?.payload?.significant as boolean;
              return [
                `|d| = ${formatNumber(Number(value), 3)}${raw < 0 ? ' (protective)' : ''} ${sig ? '*' : ''}`,
                'Effect Size',
              ];
            }}
            contentStyle={{ fontSize: '12px' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
