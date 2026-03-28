import { polygonHull } from 'd3-polygon';

/**
 * Expand each hull vertex outward from the centroid by `padding` pixels.
 */
function expandPoints(
  points: [number, number][],
  padding: number,
): [number, number][] {
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
  const cy = points.reduce((s, p) => s + p[1], 0) / points.length;

  return points.map(([x, y]) => {
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    return [x + (dx / dist) * padding, y + (dy / dist) * padding];
  });
}

/**
 * Catmull-Rom cardinal spline interpolation.
 * Converts a polygon into a smooth SVG path string.
 */
function cardinalSplinePath(
  points: [number, number][],
  tension: number = 0.7,
): string {
  const n = points.length;
  if (n < 3) return '';

  const t = 1 - tension;
  const parts: string[] = [];
  parts.push(`M${points[0][0]},${points[0][1]}`);

  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];

    const cp1x = p1[0] + (t * (p2[0] - p0[0])) / 6;
    const cp1y = p1[1] + (t * (p2[1] - p0[1])) / 6;
    const cp2x = p2[0] - (t * (p3[0] - p1[0])) / 6;
    const cp2y = p2[1] - (t * (p3[1] - p1[1])) / 6;

    parts.push(`C${cp1x},${cp1y},${cp2x},${cp2y},${p2[0]},${p2[1]}`);
  }

  parts.push('Z');
  return parts.join('');
}

/**
 * Compute a smoothed convex hull around a set of 2D points.
 * Returns an SVG path string.
 */
export function computeSmoothedHull(
  points: [number, number][],
  padding: number = 18,
): string | null {
  if (points.length < 3) return null;

  const hull = polygonHull(points);
  if (!hull) return null;

  const expanded = expandPoints(hull, padding);
  return cardinalSplinePath(expanded, 0.7);
}

/**
 * Fallback for groups with < 3 proteins (hull degenerates).
 * Returns an SVG ellipse path centered on the points.
 */
export function computeEllipsePath(
  points: [number, number][],
  padding: number = 24,
): string {
  if (points.length === 0) return '';

  const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
  const cy = points.reduce((s, p) => s + p[1], 0) / points.length;

  if (points.length === 1) {
    const r = padding;
    // SVG arc-based circle
    return `M${cx - r},${cy}a${r},${r} 0 1,0 ${r * 2},0a${r},${r} 0 1,0 ${-r * 2},0`;
  }

  // 2 points: ellipse along the axis between them
  const dx = points[1][0] - points[0][0];
  const dy = points[1][1] - points[0][1];
  const dist = Math.sqrt(dx * dx + dy * dy);
  const rx = dist / 2 + padding;
  const ry = padding;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  // Rotated ellipse as SVG path
  return `M${cx},${cy}m${-rx},0a${rx},${ry} ${angle} 1,0 ${rx * 2},0a${rx},${ry} ${angle} 1,0 ${-rx * 2},0`;
}
