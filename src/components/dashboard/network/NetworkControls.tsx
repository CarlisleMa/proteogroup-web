'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { DISEASE_COLORS, NO_DISEASE_COLOR } from '@/lib/constants';
import type { MethodFamily, GroupCentroid } from '@/lib/types';

interface NetworkControlsProps {
  method: string;
  topN: number;
  onMethodChange: (method: string) => void;
  onTopNChange: (n: number) => void;
  hiddenGroups: Set<number>;
  onToggleGroup: (groupId: number) => void;
  onShowAll: () => void;
  onHideAll: () => void;
  groupCentroids: Map<number, GroupCentroid>;
}

const TOP_N_OPTIONS = [10, 20, 30] as const;

export default function NetworkControls({
  method,
  topN,
  onMethodChange,
  onTopNChange,
  hiddenGroups,
  onToggleGroup,
  onShowAll,
  onHideAll,
  groupCentroids,
}: NetworkControlsProps) {
  const [groupsExpanded, setGroupsExpanded] = useState(false);

  const { data: methodFamilies } = useSWR<MethodFamily[]>(
    '/api/dashboard/methods-list',
    fetcher,
    { revalidateOnFocus: false },
  );

  const groups = Array.from(groupCentroids.values()).sort(
    (a, b) => a.group_id - b.group_id,
  );

  return (
    <div className="absolute top-4 right-4 z-30">
      {/* Main toolbar */}
      <div className="bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] rounded-xl px-3 py-2 flex items-center gap-3 shadow-lg">
        {/* Method selector */}
        <select
          value={method}
          onChange={(e) => onMethodChange(e.target.value)}
          className="bg-white/[0.1] border border-white/[0.15] rounded-lg px-2 py-1.5 text-xs text-white font-medium appearance-none cursor-pointer hover:bg-white/[0.15] transition-colors focus:outline-none focus:ring-1 focus:ring-blue-400/50"
          style={{ minWidth: 140 }}
        >
          {methodFamilies ? (
            methodFamilies.map((fam) => (
              <optgroup key={fam.family} label={fam.family}>
                {fam.methods.map((m) => (
                  <option key={m} value={m} className="bg-slate-900 text-white">
                    {m}
                  </option>
                ))}
              </optgroup>
            ))
          ) : (
            <option value={method} className="bg-slate-900 text-white">{method}</option>
          )}
        </select>

        {/* Top-N segmented pills */}
        <div className="flex rounded-lg overflow-hidden border border-white/[0.12]">
          {TOP_N_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => onTopNChange(n)}
              className={`px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                topN === n
                  ? 'bg-blue-500/30 text-white'
                  : 'bg-white/[0.05] text-white/60 hover:text-white hover:bg-white/[0.1]'
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Groups toggle button */}
        <button
          onClick={() => setGroupsExpanded(!groupsExpanded)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/[0.05] border border-white/[0.12] rounded-lg text-xs text-white/70 hover:text-white hover:bg-white/[0.1] transition-colors"
        >
          Groups
          <svg
            className={`w-3 h-3 transition-transform ${groupsExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Groups panel */}
      {groupsExpanded && groups.length > 0 && (
        <div className="mt-2 bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] rounded-xl p-3 shadow-lg max-h-64 overflow-y-auto">
          {/* Show/Hide all */}
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/[0.08]">
            <button
              onClick={onShowAll}
              className="text-[10px] text-blue-300 hover:text-blue-200 font-medium transition-colors"
            >
              Show All
            </button>
            <span className="text-white/20">|</span>
            <button
              onClick={onHideAll}
              className="text-[10px] text-blue-300 hover:text-blue-200 font-medium transition-colors"
            >
              Hide All
            </button>
          </div>

          {/* Group chips */}
          <div className="flex flex-wrap gap-1.5">
            {groups.map((g) => {
              const isHidden = hiddenGroups.has(g.group_id);
              const color = g.color || NO_DISEASE_COLOR;
              return (
                <button
                  key={g.group_id}
                  onClick={() => onToggleGroup(g.group_id)}
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                    isHidden
                      ? 'bg-white/[0.03] text-white/30 border border-white/[0.05]'
                      : 'bg-white/[0.1] text-white/90 border border-white/[0.15]'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: isHidden ? '#475569' : color,
                      opacity: isHidden ? 0.3 : 1,
                    }}
                  />
                  G{g.group_id}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
