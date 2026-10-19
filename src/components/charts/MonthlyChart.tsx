"use client";

import { useMemo, useState } from "react";
import { linearScale, roundedColumnPath } from "@/lib/analytics/geometry";
import { niceTicks, type MonthTotal } from "@/lib/analytics/series";
import { formatCompact, formatMonth, formatSignedMoney } from "@/lib/trades/format";
import { ChartTooltip } from "./ChartTooltip";
import { useMeasuredWidth } from "./useMeasuredWidth";

const HEIGHT = 240;
const MARGIN = { top: 16, right: 12, bottom: 28, left: 52 };
const MAX_BAR_WIDTH = 24;
const MIN_LABEL_SPACING = 64;

interface MonthlyChartProps {
  months: readonly MonthTotal[];
}

const colorFor = (value: number): string => (value < 0 ? "var(--loss)" : "var(--gain)");

export function MonthlyChart({ months }: MonthlyChartProps) {
  const { ref, width } = useMeasuredWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);

  const geometry = useMemo(() => {
    const totals = months.map((m) => m.total);
    const ticks = niceTicks(Math.min(...totals), Math.max(...totals), 5);
    const y = linearScale([ticks[0], ticks.at(-1)!], [HEIGHT - MARGIN.bottom, MARGIN.top]);
    const band = (width - MARGIN.left - MARGIN.right) / months.length;
    const barWidth = Math.min(MAX_BAR_WIDTH, band * 0.6);
    const centers = months.map((_, i) => MARGIN.left + band * i + band / 2);
    const labelEvery = Math.max(1, Math.ceil(MIN_LABEL_SPACING / band));
    return { ticks, y, band, barWidth, centers, labelEvery };
  }, [months, width]);

  const baseline = geometry.y(0);
  const activeMonth = active === null ? null : months[active];

  return (
    <div ref={ref} className="chart-plot" dir="ltr">
      <svg width={width} height={HEIGHT} role="img" aria-label="الأرباح والخسائر المحققة لكل شهر">
        {geometry.ticks.map((tick) => (
          <g key={tick}>
            <line x1={MARGIN.left} x2={width - MARGIN.right} y1={geometry.y(tick)} y2={geometry.y(tick)} className={tick === 0 ? "chart-baseline" : "chart-grid"} />
            <text x={MARGIN.left - 8} y={geometry.y(tick)} className="chart-axis-label" textAnchor="end" dominantBaseline="middle">{formatCompact(tick)}</text>
          </g>
        ))}
        {months.map((month, i) => {
          const center = geometry.centers[i];
          const isActive = active === i;
          return (
            <g key={month.month}>
              <path
                d={roundedColumnPath(center - geometry.barWidth / 2, geometry.barWidth, baseline, geometry.y(month.total))}
                fill={colorFor(month.total)}
                opacity={active === null || isActive ? 1 : 0.55}
              />
              {i % geometry.labelEvery === 0 && (
                <text x={center} y={HEIGHT - 8} className="chart-axis-label" textAnchor="middle">{formatMonth(month.month)}</text>
              )}
              <rect
                x={center - geometry.band / 2}
                y={MARGIN.top}
                width={geometry.band}
                height={HEIGHT - MARGIN.top - MARGIN.bottom}
                fill="transparent"
                tabIndex={0}
                role="img"
                aria-label={`${formatMonth(month.month)}: ${formatSignedMoney(month.total)}`}
                onPointerEnter={() => setActive(i)}
                onPointerLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
              />
            </g>
          );
        })}
      </svg>
      {activeMonth && (
        <ChartTooltip
          x={geometry.centers[active!]}
          y={Math.min(baseline, geometry.y(activeMonth.total))}
          containerWidth={width}
          title={formatMonth(activeMonth.month)}
          rows={[{ key: "total", value: formatSignedMoney(activeMonth.total), label: activeMonth.total < 0 ? "خسارة محققة" : "ربح محقق", swatch: colorFor(activeMonth.total) }]}
        />
      )}
    </div>
  );
}
