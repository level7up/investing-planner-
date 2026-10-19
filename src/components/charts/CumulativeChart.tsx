"use client";

import { useMemo, useState, type KeyboardEvent, type PointerEvent } from "react";
import { linearScale, nearestIndex } from "@/lib/analytics/geometry";
import { niceTicks, type CumulativePoint } from "@/lib/analytics/series";
import { formatCompact, formatDate, formatSignedMoney } from "@/lib/trades/format";
import { ChartTooltip } from "./ChartTooltip";
import { useMeasuredWidth } from "./useMeasuredWidth";

const HEIGHT = 240;
const MARGIN = { top: 16, right: 20, bottom: 28, left: 52 };
const LINE_COLOR = "var(--series-1)";

interface CumulativeChartProps {
  points: readonly CumulativePoint[];
}

const dayMs = (iso: string): number => Date.parse(`${iso}T00:00:00Z`);

export function CumulativeChart({ points }: CumulativeChartProps) {
  const { ref, width } = useMeasuredWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);

  const geometry = useMemo(() => {
    const values = points.map((p) => p.value);
    const ticks = niceTicks(Math.min(...values), Math.max(...values), 5);
    const x = linearScale([dayMs(points[0].date), dayMs(points.at(-1)!.date)], [MARGIN.left, width - MARGIN.right]);
    const y = linearScale([ticks[0], ticks.at(-1)!], [HEIGHT - MARGIN.bottom, MARGIN.top]);
    const xs = points.map((p) => x(dayMs(p.date)));
    const ys = points.map((p) => y(p.value));
    const line = xs.map((px, i) => `${i ? "L" : "M"}${px},${ys[i]}`).join(" ");
    const area = `${line} L${xs.at(-1)},${y(0)} L${xs[0]},${y(0)} Z`;
    return { ticks, y, xs, ys, line, area };
  }, [points, width]);

  const onPointerMove = (event: PointerEvent<SVGRectElement>) => {
    const bounds = event.currentTarget.ownerSVGElement!.getBoundingClientRect();
    setActive(nearestIndex(geometry.xs, event.clientX - bounds.left));
  };

  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    setActive((current) => Math.min(points.length - 1, Math.max(0, (current ?? points.length - 1) + step)));
  };

  const last = points.length - 1;
  const activePoint = active === null ? null : points[active];

  return (
    <div ref={ref} className="chart-plot" dir="ltr">
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label="منحنى الأرباح المحققة التراكمية. استخدم الأسهم يمينًا ويسارًا للتنقل بين النقاط."
        tabIndex={0}
        onKeyDown={onKeyDown}
        onFocus={() => setActive((current) => current ?? last)}
        onBlur={() => setActive(null)}
      >
        {geometry.ticks.map((tick) => (
          <g key={tick}>
            <line x1={MARGIN.left} x2={width - MARGIN.right} y1={geometry.y(tick)} y2={geometry.y(tick)} className={tick === 0 ? "chart-baseline" : "chart-grid"} />
            <text x={MARGIN.left - 8} y={geometry.y(tick)} className="chart-axis-label" textAnchor="end" dominantBaseline="middle">{formatCompact(tick)}</text>
          </g>
        ))}
        <text x={MARGIN.left} y={HEIGHT - 8} className="chart-axis-label" textAnchor="start">{formatDate(points[0].date)}</text>
        {last > 0 && <text x={width - MARGIN.right} y={HEIGHT - 8} className="chart-axis-label" textAnchor="end">{formatDate(points[last].date)}</text>}
        <path d={geometry.area} fill={LINE_COLOR} opacity={0.1} />
        <path d={geometry.line} fill="none" stroke={LINE_COLOR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {active === null && (
          <text x={geometry.xs[last] - 8} y={geometry.ys[last] - 12} className="chart-value-label" textAnchor="end">{formatSignedMoney(points[last].value)}</text>
        )}
        {active !== null && <line x1={geometry.xs[active]} x2={geometry.xs[active]} y1={MARGIN.top} y2={HEIGHT - MARGIN.bottom} className="chart-crosshair" />}
        <circle cx={geometry.xs[active ?? last]} cy={geometry.ys[active ?? last]} r={4} fill={LINE_COLOR} stroke="var(--chart-surface)" strokeWidth={2} />
        <rect x={MARGIN.left} y={MARGIN.top} width={Math.max(0, width - MARGIN.left - MARGIN.right)} height={HEIGHT - MARGIN.top - MARGIN.bottom} fill="transparent" onPointerMove={onPointerMove} onPointerLeave={() => setActive(null)} />
      </svg>
      {activePoint && (
        <ChartTooltip
          x={geometry.xs[active!]}
          y={geometry.ys[active!]}
          containerWidth={width}
          title={formatDate(activePoint.date)}
          rows={[
            { key: "value", value: formatSignedMoney(activePoint.value), label: "الإجمالي التراكمي", swatch: LINE_COLOR },
            { key: "delta", value: formatSignedMoney(activePoint.delta), label: "في هذا اليوم" },
          ]}
        />
      )}
    </div>
  );
}
