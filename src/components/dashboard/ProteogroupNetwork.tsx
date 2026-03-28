'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import useSWR from 'swr';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';
import { fetcher } from '@/lib/api';
import {
  DISEASE_DISPLAY_NAMES,
  DISEASE_COLORS,
  NO_DISEASE_COLOR,
} from '@/lib/constants';
import NetworkTooltip from './NetworkTooltip';
import GroupDetailPanel from './GroupDetailPanel';
import type { NetworkGraphData, NetworkNode, NetworkEdge } from '@/lib/types';

type SimNode = NetworkNode & SimulationNodeDatum;
type SimLink = SimulationLinkDatum<SimNode> & {
  shared_theme: string | null;
  weight: number;
};

export default function ProteogroupNetwork() {
  const { data, isLoading } = useSWR<NetworkGraphData>(
    '/api/dashboard/network?method=PG_Coef_k50&top_n=20',
    fetcher,
    { revalidateOnFocus: false },
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<ReturnType<typeof forceSimulation<SimNode>> | null>(null);

  const [nodes, setNodes] = useState<SimNode[]>([]);
  const [links, setLinks] = useState<SimLink[]>([]);
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [dims, setDims] = useState({ width: 900, height: 500 });

  // Responsive sizing
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

  // Radius scale: map n_proteins to radius
  const radius = useCallback((n: number) => {
    const min = 14, max = 42;
    return min + (Math.min(n, 120) / 120) * (max - min);
  }, []);

  // Color by strongest disease
  const color = useCallback((node: NetworkNode) => {
    return node.strongest_disease
      ? DISEASE_COLORS[node.strongest_disease] ?? NO_DISEASE_COLOR
      : NO_DISEASE_COLOR;
  }, []);

  // D3 force simulation
  useEffect(() => {
    if (!data || !data.nodes.length) return;

    // Deep clone
    const simNodes: SimNode[] = data.nodes.map((n) => ({ ...n }));
    const simLinks: SimLink[] = data.edges.map((e) => ({
      source: simNodes.find((n) => n.group_id === (e.source as number))!,
      target: simNodes.find((n) => n.group_id === (e.target as number))!,
      shared_theme: e.shared_theme,
      weight: e.weight,
    })).filter((l) => l.source && l.target);

    const sim = forceSimulation<SimNode>(simNodes)
      .force(
        'charge',
        forceManyBody<SimNode>().strength(-250).distanceMax(dims.width * 0.4),
      )
      .force('center', forceCenter(dims.width / 2, dims.height / 2))
      .force(
        'collision',
        forceCollide<SimNode>()
          .radius((d) => radius(d.n_proteins) + 6)
          .strength(0.8),
      )
      .force(
        'link',
        forceLink<SimNode, SimLink>(simLinks)
          .id((d) => String(d.group_id))
          .distance(130)
          .strength(0.25),
      )
      .alpha(1)
      .alphaDecay(0.025)
      .on('tick', () => {
        setNodes([...simNodes]);
        setLinks([...simLinks]);
      });

    simulationRef.current = sim;
    return () => {
      sim.stop();
    };
  }, [data, dims, radius]);

  // Mouse handlers
  const handleMouseEnter = useCallback(
    (node: SimNode, e: React.MouseEvent) => {
      setHoveredNode(node);
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setTooltipPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    },
    [],
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredNode(null);
    setTooltipPos(null);
  }, []);

  const handleClick = useCallback((node: SimNode) => {
    setSelectedNode(node);
    setDetailOpen(true);
  }, []);

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
      <div
        className="flex items-center justify-center rounded-xl"
        style={{ height: 400 }}
      >
        <div className="flex items-center gap-3">
          <svg
            className="animate-spin h-5 w-5 text-blue-300"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-blue-200/80 text-sm">
            Building proteogroup network...
          </span>
        </div>
      </div>
    );
  }

  if (!data || !data.nodes.length) {
    return (
      <div
        className="flex items-center justify-center rounded-xl"
        style={{ height: 400 }}
      >
        <span className="text-blue-200/60 text-sm">No network data available.</span>
      </div>
    );
  }

  return (
    <>
      <div ref={containerRef} className="relative w-full select-none">
        <svg
          width={dims.width}
          height={dims.height}
          className="overflow-visible"
        >
          {/* Edges */}
          <g>
            {links.map((link, i) => {
              const s = link.source as SimNode;
              const t = link.target as SimNode;
              if (s.x == null || t.x == null) return null;
              const isHighlighted =
                hoveredNode &&
                (s.group_id === hoveredNode.group_id ||
                  t.group_id === hoveredNode.group_id);
              return (
                <line
                  key={`e-${i}`}
                  x1={s.x}
                  y1={s.y}
                  x2={t.x}
                  y2={t.y}
                  stroke={isHighlighted ? '#93c5fd' : '#475569'}
                  strokeWidth={isHighlighted ? 2 : 1}
                  strokeOpacity={isHighlighted ? 0.8 : 0.25}
                  strokeDasharray={isHighlighted ? undefined : '4 3'}
                />
              );
            })}
          </g>

          {/* Nodes */}
          <g>
            {nodes.map((node) => {
              const r = radius(node.n_proteins);
              const isHovered = hoveredNode?.group_id === node.group_id;
              const isSelected = selectedNode?.group_id === node.group_id;
              const fill = color(node);

              return (
                <g
                  key={node.group_id}
                  transform={`translate(${node.x ?? 0}, ${node.y ?? 0})`}
                  onMouseEnter={(e) => handleMouseEnter(node, e)}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => handleClick(node)}
                  className="cursor-pointer"
                >
                  {/* Selection / hover ring */}
                  {(isHovered || isSelected) && (
                    <circle
                      r={r + 5}
                      fill="none"
                      stroke={fill}
                      strokeWidth={2}
                      strokeOpacity={0.4}
                    />
                  )}

                  {/* Main circle */}
                  <circle
                    r={r}
                    fill={fill}
                    fillOpacity={isHovered ? 0.95 : 0.7}
                    stroke="rgba(255,255,255,0.8)"
                    strokeWidth={2}
                    style={{ transition: 'fill-opacity 150ms ease' }}
                  />

                  {/* Label: Group ID */}
                  <text
                    textAnchor="middle"
                    dy={r > 24 && node.top_proteins[0] ? '-0.2em' : '0.35em'}
                    fill="white"
                    fontSize={r > 28 ? 12 : r > 20 ? 11 : 9}
                    fontWeight={700}
                    pointerEvents="none"
                  >
                    G{node.group_id}
                  </text>

                  {/* Sub-label: top protein */}
                  {r > 24 && node.top_proteins[0] && (
                    <text
                      textAnchor="middle"
                      dy="1.15em"
                      fill="white"
                      fontSize={9}
                      fillOpacity={0.75}
                      pointerEvents="none"
                    >
                      {node.top_proteins[0]}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Tooltip */}
        <NetworkTooltip
          node={hoveredNode}
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
              style={{
                backgroundColor: DISEASE_COLORS[disease] ?? NO_DISEASE_COLOR,
              }}
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
          Node size = # proteins &middot; Dashed lines = shared pathway theme
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
