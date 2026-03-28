'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import {
  DISEASE_DISPLAY_NAMES,
  DISEASE_COLORS,
  NO_DISEASE_COLOR,
} from '@/lib/constants';
import NetworkTooltip from './NetworkTooltip';
import GroupDetailPanel from './GroupDetailPanel';
import NetworkCanvas from './network/NetworkCanvas';
import NetworkControls from './network/NetworkControls';
import useNetworkSimulation from './network/useNetworkSimulation';
import type { NetworkGraphData, NetworkNode, ProteinSimNode } from '@/lib/types';

interface ProteogroupNetworkProps {
  onMethodChange?: (method: string) => void;
}

export default function ProteogroupNetwork({ onMethodChange }: ProteogroupNetworkProps) {
  const [method, setMethod] = useState('PG_Coef_k50');
  const [topN, setTopN] = useState(20);
  const [hiddenGroups, setHiddenGroups] = useState<Set<number>>(new Set());

  const { data, isLoading } = useSWR<NetworkGraphData>(
    `/api/dashboard/network?method=${encodeURIComponent(method)}&top_n=${topN}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  // Notify parent of method changes
  const handleMethodChange = useCallback(
    (m: string) => {
      setMethod(m);
      setHiddenGroups(new Set());
      onMethodChange?.(m);
    },
    [onMethodChange],
  );

  const handleTopNChange = useCallback((n: number) => {
    setTopN(n);
    setHiddenGroups(new Set());
  }, []);

  // Responsive sizing
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 900, height: 500 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setDims({ width, height: Math.max(400, Math.min(550, width * 0.5)) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Simulation
  const { proteinNodes, groupCentroids, groupEdges, isSimulating } =
    useNetworkSimulation({ data, dims, hiddenGroups });

  // Interaction state
  const [hoveredGroupId, setHoveredGroupId] = useState<number | null>(null);
  const [hoveredProtein, setHoveredProtein] = useState<ProteinSimNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Group toggle handlers
  const handleToggleGroup = useCallback((groupId: number) => {
    setHiddenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  const handleShowAll = useCallback(() => setHiddenGroups(new Set()), []);

  const handleHideAll = useCallback(() => {
    if (!data) return;
    setHiddenGroups(new Set(data.nodes.map((n) => n.group_id)));
  }, [data]);

  // Mouse handlers — protein hover
  const handleProteinEnter = useCallback(
    (node: ProteinSimNode, e: React.MouseEvent) => {
      setHoveredProtein(node);
      setHoveredGroupId(node.group_id);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
    },
    [],
  );

  const handleProteinMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }, []);

  const handleProteinLeave = useCallback(() => {
    setHoveredProtein(null);
    setHoveredGroupId(null);
    setTooltipPos(null);
  }, []);

  // Mouse handlers — hull hover
  const handleHullEnter = useCallback(
    (groupId: number, e: React.MouseEvent) => {
      setHoveredGroupId(groupId);
      setHoveredProtein(null);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
    },
    [],
  );

  const handleHullLeave = useCallback(() => {
    setHoveredGroupId(null);
    setTooltipPos(null);
  }, []);

  // Click: open detail panel
  const handleProteinClick = useCallback(
    (protein: ProteinSimNode) => {
      const centroid = groupCentroids.get(protein.group_id);
      if (centroid) {
        setSelectedNode(centroid.node);
        setDetailOpen(true);
      }
    },
    [groupCentroids],
  );

  // Resolve hovered group node for tooltip
  const hoveredGroupNode: NetworkNode | null =
    hoveredGroupId != null && !hoveredProtein
      ? groupCentroids.get(hoveredGroupId)?.node ?? null
      : null;

  // Unique diseases for legend
  const uniqueDiseases = Array.from(
    new Set(
      (data?.nodes ?? [])
        .map((n) => n.strongest_disease)
        .filter(Boolean) as string[],
    ),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-xl" style={{ height: 400 }}>
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-5 w-5 text-blue-300" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4" fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-blue-200/80 text-sm">Building proteogroup network...</span>
        </div>
      </div>
    );
  }

  if (!data || !data.nodes.length) {
    return (
      <div className="flex items-center justify-center rounded-xl" style={{ height: 400 }}>
        <span className="text-blue-200/60 text-sm">No network data available.</span>
      </div>
    );
  }

  return (
    <>
      <div ref={containerRef} className="relative w-full select-none">
        {/* Controls */}
        <NetworkControls
          method={method}
          topN={topN}
          onMethodChange={handleMethodChange}
          onTopNChange={handleTopNChange}
          hiddenGroups={hiddenGroups}
          onToggleGroup={handleToggleGroup}
          onShowAll={handleShowAll}
          onHideAll={handleHideAll}
          groupCentroids={groupCentroids}
        />

        {/* Simulation active indicator */}
        {isSimulating && (
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[10px] text-blue-300/60">Simulating</span>
          </div>
        )}

        {/* Canvas */}
        <NetworkCanvas
          width={dims.width}
          height={dims.height}
          proteinNodes={proteinNodes}
          groupCentroids={groupCentroids}
          groupEdges={groupEdges}
          hoveredGroupId={hoveredGroupId}
          hoveredProteinId={hoveredProtein?.id ?? null}
          onProteinEnter={handleProteinEnter}
          onProteinMove={handleProteinMove}
          onProteinLeave={handleProteinLeave}
          onHullEnter={handleHullEnter}
          onHullLeave={handleHullLeave}
          onProteinClick={handleProteinClick}
        />

        {/* Tooltip */}
        <NetworkTooltip
          protein={hoveredProtein}
          node={hoveredGroupNode}
          position={tooltipPos}
          containerWidth={dims.width}
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 px-1">
        {uniqueDiseases.map((disease) => (
          <div key={disease} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: DISEASE_COLORS[disease] ?? NO_DISEASE_COLOR }}
            />
            <span className="text-[11px] text-blue-200/70">
              {DISEASE_DISPLAY_NAMES[disease] ?? disease}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: NO_DISEASE_COLOR }}
          />
          <span className="text-[11px] text-blue-200/70">No sig. association</span>
        </div>
        <span className="text-[11px] text-blue-200/40 ml-2">
          Each dot = protein &middot; Bubble = proteogroup cluster &middot; Dashed lines = shared pathway theme
        </span>
      </div>

      {/* Detail panel */}
      <GroupDetailPanel
        node={selectedNode}
        methodName={data.method_name}
        isOpen={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedNode(null);
        }}
      />
    </>
  );
}
