'use client';

import { useMemo } from 'react';
import { computeSmoothedHull, computeEllipsePath } from './hull-utils';
import type { ProteinSimNode, GroupCentroid } from '@/lib/types';

interface NetworkCanvasProps {
  width: number;
  height: number;
  proteinNodes: ProteinSimNode[];
  groupCentroids: Map<number, GroupCentroid>;
  groupEdges: { sourceGroupId: number; targetGroupId: number; shared_theme: string | null }[];
  hoveredGroupId: number | null;
  hoveredProteinId: string | null;
  onProteinEnter: (node: ProteinSimNode, e: React.MouseEvent) => void;
  onProteinMove: (e: React.MouseEvent) => void;
  onProteinLeave: () => void;
  onHullEnter: (groupId: number, e: React.MouseEvent) => void;
  onHullLeave: () => void;
  onProteinClick: (node: ProteinSimNode) => void;
}

export default function NetworkCanvas({
  width,
  height,
  proteinNodes,
  groupCentroids,
  groupEdges,
  hoveredGroupId,
  hoveredProteinId,
  onProteinEnter,
  onProteinMove,
  onProteinLeave,
  onHullEnter,
  onHullLeave,
  onProteinClick,
}: NetworkCanvasProps) {
  // Group protein positions for hull computation
  const hullPaths = useMemo(() => {
    const grouped = new Map<number, [number, number][]>();
    for (const p of proteinNodes) {
      const arr = grouped.get(p.group_id) ?? [];
      arr.push([p.x, p.y]);
      grouped.set(p.group_id, arr);
    }

    const paths = new Map<number, string>();
    grouped.forEach((points, gid) => {
      if (points.length >= 3) {
        const hull = computeSmoothedHull(points, 14);
        if (hull) paths.set(gid, hull);
      } else {
        const ellipse = computeEllipsePath(points, 18);
        if (ellipse) paths.set(gid, ellipse);
      }
    });
    return paths;
  }, [proteinNodes]);

  // Find the top protein per group (first in the list, highest importance)
  const topProteinPerGroup = useMemo(() => {
    const top = new Map<number, string>();
    const seen = new Set<number>();
    for (const p of proteinNodes) {
      if (!seen.has(p.group_id)) {
        top.set(p.group_id, p.id);
        seen.add(p.group_id);
      }
    }
    return top;
  }, [proteinNodes]);

  const centroidArray = Array.from(groupCentroids.values());

  return (
    <svg width={width} height={height} className="overflow-hidden">
      {/* Defs: per-group radial gradients + glow filter */}
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {centroidArray.map((c) => (
          <radialGradient
            key={`grad-${c.group_id}`}
            id={`hull-grad-${c.group_id}`}
            cx="50%"
            cy="50%"
            r="50%"
          >
            <stop offset="0%" stopColor={c.color} stopOpacity={0.18} />
            <stop offset="100%" stopColor={c.color} stopOpacity={0.04} />
          </radialGradient>
        ))}
      </defs>

      {/* Hull layer */}
      <g>
        {centroidArray.map((c) => {
          const path = hullPaths.get(c.group_id);
          if (!path) return null;
          const isHovered = hoveredGroupId === c.group_id;
          return (
            <path
              key={`hull-${c.group_id}`}
              d={path}
              fill={`url(#hull-grad-${c.group_id})`}
              stroke={c.color}
              strokeWidth={isHovered ? 1.5 : 1}
              strokeOpacity={isHovered ? 0.5 : 0.2}
              fillOpacity={isHovered ? 1.5 : 1}
              filter={isHovered ? 'url(#glow)' : undefined}
              style={{ transition: 'stroke-opacity 150ms ease, fill-opacity 150ms ease' }}
              onMouseEnter={(e) => onHullEnter(c.group_id, e)}
              onMouseLeave={onHullLeave}
              className="cursor-pointer"
            />
          );
        })}
      </g>

      {/* Edge layer: lines between group centroids */}
      <g>
        {groupEdges.map((edge, i) => {
          const s = groupCentroids.get(edge.sourceGroupId);
          const t = groupCentroids.get(edge.targetGroupId);
          if (!s || !t) return null;
          const isHighlighted =
            hoveredGroupId === edge.sourceGroupId ||
            hoveredGroupId === edge.targetGroupId;
          return (
            <line
              key={`edge-${i}`}
              x1={s.cx}
              y1={s.cy}
              x2={t.cx}
              y2={t.cy}
              stroke={isHighlighted ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)'}
              strokeWidth={isHighlighted ? 1.5 : 1}
              strokeDasharray={isHighlighted ? undefined : '4 3'}
              style={{ transition: 'stroke 150ms ease' }}
            />
          );
        })}
      </g>

      {/* Protein circles */}
      <g>
        {proteinNodes.map((p) => {
          const isTopProtein = topProteinPerGroup.get(p.group_id) === p.id;
          const baseR = isTopProtein ? 7 : 6;
          const isHovered = hoveredProteinId === p.id;
          const isGroupHovered = hoveredGroupId === p.group_id;
          const r = isHovered ? 8 : baseR;

          // Opacity scales with |ridge_coef| (0.4–0.9)
          const coefAbs = p.ridge_coef != null ? Math.abs(p.ridge_coef) : 0.5;
          const fillOpacity = isHovered
            ? 1
            : isGroupHovered
              ? 0.85
              : 0.4 + Math.min(coefAbs, 1) * 0.5;

          return (
            <circle
              key={p.id}
              cx={p.x}
              cy={p.y}
              r={r}
              fill={p.group_color}
              fillOpacity={fillOpacity}
              stroke={isHovered ? 'white' : 'rgba(255,255,255,0.4)'}
              strokeWidth={isHovered ? 2 : 1}
              style={{ transition: 'r 150ms ease, fill-opacity 150ms ease, stroke 150ms ease' }}
              onMouseEnter={(e) => onProteinEnter(p, e)}
              onMouseMove={onProteinMove}
              onMouseLeave={onProteinLeave}
              onClick={() => onProteinClick(p)}
              className="cursor-pointer"
            />
          );
        })}
      </g>

      {/* Centroid labels */}
      <g>
        {centroidArray.map((c) => (
          <text
            key={`label-${c.group_id}`}
            x={c.cx}
            y={c.cy}
            textAnchor="middle"
            dy="0.35em"
            fill="white"
            fontSize={11}
            fontWeight={700}
            pointerEvents="none"
            style={{
              textShadow: '0 1px 3px rgba(0,0,0,0.6), 0 0 8px rgba(0,0,0,0.3)',
            }}
          >
            G{c.group_id}
          </text>
        ))}
      </g>
    </svg>
  );
}
