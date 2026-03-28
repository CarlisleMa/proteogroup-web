'use client';

import { useRef, useEffect, useState } from 'react';
import { DISEASE_DISPLAY_NAMES, DISEASE_COLORS, TIER_COLORS, NO_DISEASE_COLOR } from '@/lib/constants';
import { formatNumber, formatPValue } from '@/lib/formatters';
import type { NetworkNode, ProteinSimNode } from '@/lib/types';

interface NetworkTooltipProps {
  /** Protein-level hover (takes precedence when non-null) */
  protein: ProteinSimNode | null;
  /** Group-level hover (hull hover) */
  node: NetworkNode | null;
  position: { x: number; y: number } | null;
  containerWidth: number;
}

export default function NetworkTooltip({ protein, node, position, containerWidth }: NetworkTooltipProps) {
  const tipRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!tipRef.current || !position) return;
    const rect = tipRef.current.getBoundingClientRect();
    let ox = 14;
    const oy = 14;
    // Flip left if overflows right edge
    if (position.x + rect.width + 20 > containerWidth) {
      ox = -(rect.width + 14);
    }
    setOffset({ x: ox, y: oy });
  }, [position, containerWidth]);

  if ((!protein && !node) || !position) return null;

  // Protein-level tooltip
  if (protein) {
    return (
      <div
        ref={tipRef}
        className="absolute bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg p-3 text-xs pointer-events-none z-50 w-56"
        style={{
          left: position.x + offset.x,
          top: position.y + offset.y,
        }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: protein.group_color }}
          />
          <span className="text-sm font-bold text-slate-900 font-mono">
            {protein.protein_name}
          </span>
        </div>
        {protein.ridge_coef != null && (
          <div className="text-slate-500 mb-1">
            Importance score:{' '}
            <strong className="text-slate-700 font-mono">
              {formatNumber(protein.ridge_coef, 4)}
            </strong>
          </div>
        )}
        <div className="text-slate-400">
          Group <strong className="text-slate-600">{protein.group_id}</strong>
        </div>
      </div>
    );
  }

  // Group-level tooltip (hull hover)
  const diseaseColor = node!.strongest_disease
    ? DISEASE_COLORS[node!.strongest_disease] ?? NO_DISEASE_COLOR
    : NO_DISEASE_COLOR;

  return (
    <div
      ref={tipRef}
      className="absolute bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg p-4 text-xs pointer-events-none z-50 w-72"
      style={{
        left: position.x + offset.x,
        top: position.y + offset.y,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-sm font-bold text-slate-900">Group {node!.group_id}</span>
        {node!.tier && (
          <span
            className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-semibold ${
              TIER_COLORS[node!.tier] ?? 'bg-slate-100 text-slate-600'
            }`}
          >
            {node!.tier.replace(/_/g, ' ')}
          </span>
        )}
      </div>

      {/* Top proteins */}
      {node!.top_proteins.length > 0 && (
        <div className="mb-2">
          <span className="text-slate-400 font-medium">Top proteins: </span>
          <span className="font-mono text-slate-700">
            {node!.top_proteins.slice(0, 4).join(', ')}
          </span>
        </div>
      )}

      {/* Theme & pathway */}
      {node!.dominant_theme && (
        <div className="mb-1.5">
          <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-medium">
            {node!.dominant_theme.replace(/_/g, ' ')}
          </span>
          {node!.top_pathway && (
            <span className="text-slate-500 ml-1.5 truncate inline-block max-w-[180px] align-middle">
              {node!.top_pathway}
            </span>
          )}
        </div>
      )}

      {/* Strongest disease */}
      {node!.strongest_disease && (
        <div className="flex items-center gap-1.5 mb-2">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: diseaseColor }}
          />
          <span className="text-slate-700 font-medium">
            {DISEASE_DISPLAY_NAMES[node!.strongest_disease] ?? node!.strongest_disease}
          </span>
          {node!.strongest_disease_d != null && (
            <span className="text-slate-400 font-mono">
              d = {formatNumber(node!.strongest_disease_d, 3)}
            </span>
          )}
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-3 pt-2 border-t border-slate-100 text-slate-500">
        <span>
          <strong className="text-slate-700">{node!.n_proteins}</strong> proteins
        </span>
        {node!.n_enriched_terms != null && (
          <span>
            <strong className="text-slate-700">{node!.n_enriched_terms}</strong> pathways
          </span>
        )}
        {node!.composite_score != null && (
          <span>
            score <strong className="text-slate-700">{formatNumber(node!.composite_score, 3)}</strong>
          </span>
        )}
      </div>

      {/* PPI */}
      {node!.ppi_enrichment_p != null && node!.ppi_enrichment_p < 0.05 && (
        <div className="mt-1.5 text-slate-400">
          PPI enrichment p = {formatPValue(node!.ppi_enrichment_p)}
        </div>
      )}
    </div>
  );
}
