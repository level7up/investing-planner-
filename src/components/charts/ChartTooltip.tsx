const TOOLTIP_WIDTH = 220;
const EDGE_PADDING = 8;

export type TooltipRow = { key: string; value: string; label: string; swatch?: string };

interface ChartTooltipProps {
  x: number;
  y: number;
  containerWidth: number;
  title: string;
  rows: readonly TooltipRow[];
}

export function ChartTooltip({ x, y, containerWidth, title, rows }: ChartTooltipProps) {
  const left = Math.min(Math.max(EDGE_PADDING, x + 12), containerWidth - TOOLTIP_WIDTH - EDGE_PADDING);
  const placeLeft = x + 12 + TOOLTIP_WIDTH > containerWidth - EDGE_PADDING;
  const finalLeft = placeLeft ? Math.max(EDGE_PADDING, x - TOOLTIP_WIDTH - 12) : left;
  return (
    <div className="chart-tooltip" style={{ left: finalLeft, top: Math.max(0, y - 12), width: TOOLTIP_WIDTH }} role="status" dir="rtl">
      <p className="chart-tooltip-title">{title}</p>
      {rows.map((row) => (
        <p key={row.key} className="chart-tooltip-row">
          {row.swatch && <span className="chart-line-key" style={{ background: row.swatch }} aria-hidden="true" />}
          <strong>{row.value}</strong>
          <span>{row.label}</span>
        </p>
      ))}
    </div>
  );
}
