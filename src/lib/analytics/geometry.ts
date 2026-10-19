const MAX_CORNER_RADIUS = 4;

export type Scale = (value: number) => number;

export function linearScale([d0, d1]: [number, number], [r0, r1]: [number, number]): Scale {
  if (d0 === d1) return () => (r0 + r1) / 2;
  return (value) => r0 + ((value - d0) / (d1 - d0)) * (r1 - r0);
}

export function nearestIndex(positions: readonly number[], target: number): number {
  return positions.reduce((best, position, index) => {
    if (best === -1) return index;
    return Math.abs(position - target) < Math.abs(positions[best] - target) ? index : best;
  }, -1);
}

const round = (value: number): number => Math.round(value * 100) / 100;

export function roundedColumnPath(x: number, width: number, baseline: number, end: number): string {
  const height = Math.abs(end - baseline);
  if (height === 0) return "";
  const r = round(Math.min(MAX_CORNER_RADIUS, height, width / 2));
  const dir = end < baseline ? 1 : -1;
  const right = round(x + width);
  return [
    `M${x},${baseline}`,
    `L${x},${round(end + dir * r)}`,
    `Q${x},${end} ${round(x + r)},${end}`,
    `L${round(right - r)},${end}`,
    `Q${right},${end} ${right},${round(end + dir * r)}`,
    `L${right},${baseline}`,
    "Z",
  ].join(" ");
}

export function roundedRowPath(baseline: number, y: number, thickness: number, end: number): string {
  const length = Math.abs(end - baseline);
  if (length === 0) return "";
  const r = round(Math.min(MAX_CORNER_RADIUS, length, thickness / 2));
  const dir = end > baseline ? -1 : 1;
  const bottom = round(y + thickness);
  return [
    `M${baseline},${y}`,
    `L${round(end + dir * r)},${y}`,
    `Q${end},${y} ${end},${round(y + r)}`,
    `L${end},${round(bottom - r)}`,
    `Q${end},${bottom} ${round(end + dir * r)},${bottom}`,
    `L${baseline},${bottom}`,
    "Z",
  ].join(" ");
}
