export function formatPValue(p: number | null): string {
  if (p === null || p === undefined) return '\u2014';
  if (p === 0) return '< 1e-300';
  if (p < 0.001) return p.toExponential(1);
  return p.toFixed(3);
}

export function formatNumber(n: number | null, decimals = 2): string {
  if (n === null || n === undefined) return '\u2014';
  return n.toFixed(decimals);
}

export function formatCohensD(d: number | null): string {
  if (d === null || d === undefined) return '\u2014';
  const abs = Math.abs(d);
  const formatted = abs.toFixed(2);
  return d < 0 ? `\u2212${formatted}` : formatted;
}
