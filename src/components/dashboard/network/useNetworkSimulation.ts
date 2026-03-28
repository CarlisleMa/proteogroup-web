'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';
import { DISEASE_COLORS, NO_DISEASE_COLOR } from '@/lib/constants';
import type {
  NetworkGraphData,
  NetworkNode,
  ProteinSimNode,
  GroupCentroid,
} from '@/lib/types';

/* ---------- Simulation node type (extends d3 datum) ---------- */
type SimProtein = ProteinSimNode & SimulationNodeDatum;

interface GroupEdge {
  sourceGroupId: number;
  targetGroupId: number;
  shared_theme: string | null;
}

/* ---------- Custom cluster force ---------- */
function forceCluster(
  nodes: SimProtein[],
  centroids: Map<number, { cx: number; cy: number }>,
  strength: number = 0.12,
) {
  return () => {
    for (const node of nodes) {
      const c = centroids.get(node.group_id);
      if (!c) continue;
      node.vx = (node.vx ?? 0) + (c.cx - node.x) * strength;
      node.vy = (node.vy ?? 0) + (c.cy - node.y) * strength;
    }
  };
}

/* ---------- Hook interface ---------- */
interface UseNetworkSimulationInput {
  data: NetworkGraphData | undefined;
  dims: { width: number; height: number };
  hiddenGroups: Set<number>;
}

interface UseNetworkSimulationOutput {
  proteinNodes: SimProtein[];
  groupCentroids: Map<number, GroupCentroid>;
  groupEdges: GroupEdge[];
  isSimulating: boolean;
}

function getNodeColor(node: NetworkNode): string {
  return node.strongest_disease
    ? DISEASE_COLORS[node.strongest_disease] ?? NO_DISEASE_COLOR
    : NO_DISEASE_COLOR;
}

export default function useNetworkSimulation({
  data,
  dims,
  hiddenGroups,
}: UseNetworkSimulationInput): UseNetworkSimulationOutput {
  const simulationRef = useRef<Simulation<SimProtein, never> | null>(null);
  const [proteinNodes, setProteinNodes] = useState<SimProtein[]>([]);
  const [groupCentroids, setGroupCentroids] = useState<Map<number, GroupCentroid>>(new Map());
  const [isSimulating, setIsSimulating] = useState(false);

  // Compute group edges from data (stable reference)
  const groupEdges = useMemo<GroupEdge[]>(() => {
    if (!data) return [];
    return data.edges.map((e) => ({
      sourceGroupId: typeof e.source === 'number' ? e.source : e.source.group_id,
      targetGroupId: typeof e.target === 'number' ? e.target : e.target.group_id,
      shared_theme: e.shared_theme,
    }));
  }, [data]);

  useEffect(() => {
    if (!data || !data.nodes.length) {
      setProteinNodes([]);
      setGroupCentroids(new Map());
      return;
    }

    const visibleNodes = data.nodes.filter((n) => !hiddenGroups.has(n.group_id));
    if (!visibleNodes.length) {
      setProteinNodes([]);
      setGroupCentroids(new Map());
      return;
    }

    // Pre-position group centroids in a circle
    const cx = dims.width / 2;
    const cy = dims.height / 2;
    const baseRadius = Math.min(dims.width, dims.height) * 0.3;
    const angleStep = (2 * Math.PI) / visibleNodes.length;

    const initialCentroids = new Map<number, { cx: number; cy: number }>();
    visibleNodes.forEach((node, i) => {
      const angle = angleStep * i - Math.PI / 2;
      initialCentroids.set(node.group_id, {
        cx: cx + Math.cos(angle) * baseRadius,
        cy: cy + Math.sin(angle) * baseRadius,
      });
    });

    // Create protein nodes — place around their group centroid
    const simProteins: SimProtein[] = [];
    visibleNodes.forEach((node) => {
      const proteins = node.proteins && node.proteins.length > 0
        ? node.proteins
        : node.top_proteins.slice(0, 5).map((name) => ({ name, ridge_coef: null }));
      const groupColor = getNodeColor(node);
      const gc = initialCentroids.get(node.group_id)!;
      const nProteins = proteins.length;

      proteins.forEach((p, pi) => {
        const angle = ((2 * Math.PI) / nProteins) * pi;
        const spread = 15 + Math.random() * 10;
        simProteins.push({
          id: `${node.group_id}-${p.name}`,
          protein_name: p.name,
          ridge_coef: p.ridge_coef,
          group_id: node.group_id,
          group_color: groupColor,
          x: gc.cx + Math.cos(angle) * spread,
          y: gc.cy + Math.sin(angle) * spread,
        });
      });
    });

    // Track live centroids (mutated in tick)
    const liveCentroids = new Map(initialCentroids);

    // Build centroid-level links for inter-group forces
    type CentroidNode = SimulationNodeDatum & { group_id: number; x: number; y: number };
    const centroidNodes: CentroidNode[] = visibleNodes.map((n) => {
      const gc = initialCentroids.get(n.group_id)!;
      return { group_id: n.group_id, x: gc.cx, y: gc.cy };
    });
    const centroidMap = new Map(centroidNodes.map((c) => [c.group_id, c]));

    type CentroidLink = SimulationLinkDatum<CentroidNode>;
    const centroidLinks: CentroidLink[] = [];
    for (const edge of groupEdges) {
      const s = centroidMap.get(edge.sourceGroupId);
      const t = centroidMap.get(edge.targetGroupId);
      if (s && t) {
        centroidLinks.push({ source: s, target: t });
      }
    }

    // Build simulation
    const sim = forceSimulation<SimProtein>(simProteins)
      .force('cluster', forceCluster(simProteins, liveCentroids, 0.12))
      .force('charge', forceManyBody<SimProtein>().strength(-25).distanceMax(120))
      .force('collide', forceCollide<SimProtein>().radius(8).strength(0.7))
      .force('center', forceCenter(cx, cy).strength(0.05))
      .alpha(1)
      .alphaDecay(0.028)
      .velocityDecay(0.35);

    // Inter-group centroid force (run as separate sim tick manually)
    const centroidSim = forceSimulation<CentroidNode>(centroidNodes)
      .force(
        'link',
        forceLink<CentroidNode, CentroidLink>(centroidLinks)
          .id((d) => String(d.group_id))
          .distance(180)
          .strength(0.15),
      )
      .force('charge', forceManyBody<CentroidNode>().strength(-300).distanceMax(dims.width * 0.5))
      .force('center', forceCenter(cx, cy).strength(0.1))
      .alpha(1)
      .alphaDecay(0.03)
      .stop(); // We'll tick manually

    setIsSimulating(true);
    let rafId: number;

    sim.on('tick', () => {
      // Tick centroid sim
      centroidSim.tick();

      // Update live centroids from centroid nodes
      for (const cn of centroidNodes) {
        liveCentroids.set(cn.group_id, { cx: cn.x, cy: cn.y });
      }

      // Also recompute centroids from actual protein positions (blend)
      const groupPositions = new Map<number, { sx: number; sy: number; count: number }>();
      for (const pn of simProteins) {
        const existing = groupPositions.get(pn.group_id) ?? { sx: 0, sy: 0, count: 0 };
        existing.sx += pn.x;
        existing.sy += pn.y;
        existing.count += 1;
        groupPositions.set(pn.group_id, existing);
      }

      // Blend centroid sim positions with actual protein mean positions
      groupPositions.forEach((pos, gid) => {
        const cn = centroidMap.get(gid);
        if (cn && pos.count > 0) {
          const meanX = pos.sx / pos.count;
          const meanY = pos.sy / pos.count;
          // Blend: 60% centroid sim, 40% protein mean
          const blendedX = cn.x * 0.6 + meanX * 0.4;
          const blendedY = cn.y * 0.6 + meanY * 0.4;
          liveCentroids.set(gid, { cx: blendedX, cy: blendedY });
        }
      });

      // Build GroupCentroid map for rendering
      const newCentroids = new Map<number, GroupCentroid>();
      for (const node of visibleNodes) {
        const lc = liveCentroids.get(node.group_id);
        if (!lc) continue;
        const proteinIds = simProteins
          .filter((p) => p.group_id === node.group_id)
          .map((p) => p.id);
        newCentroids.set(node.group_id, {
          group_id: node.group_id,
          cx: lc.cx,
          cy: lc.cy,
          color: getNodeColor(node),
          node,
          proteinIds,
        });
      }

      rafId = requestAnimationFrame(() => {
        setProteinNodes([...simProteins]);
        setGroupCentroids(newCentroids);
      });
    });

    sim.on('end', () => {
      setIsSimulating(false);
    });

    simulationRef.current = sim;

    return () => {
      sim.stop();
      centroidSim.stop();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [data, dims, hiddenGroups, groupEdges]);

  return { proteinNodes, groupCentroids, groupEdges, isSimulating };
}
