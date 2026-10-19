"use client";

import { useMemo, useState } from "react";
import { linearScale, roundedRowPath } from "@/lib/analytics/geometry";
import { niceTicks, type SymbolTotal } from "@/lib/analytics/series";
import { formatInt, formatSignedMoney } from "@/lib/trades/format";
import { ChartTooltip } from "./ChartTooltip";
import { useMeasuredWidth } from "./useMeasuredWidth";

const ROW_HEIGHT = 32;
const BAR_THICKNESS = 16;
const LABEL_WIDTH = 72;
const VALUE_ROOM = 96;
const PADDING_Y = 8;

interface SymbolChartProps {
  symbols: readonly SymbolTotal[];
}

const colorFor = (value: number): string => (value < 0 ? "var(--loss)" : "var(--gain)");

export function SymbolChart({ symbols }: SymbolChartProps) {
  const { ref, width } = useMeasuredWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const height = symbols.length * ROW_HEIGHT + PADDING_Y * 2;

  const x = useMemo(() => {
    const totals = symbols.map((s) => s.total);
    const ticks = niceTicks(Math.min(...totals), Math.max(...totals), 4);
    const hasNegative = ticks[0] < 0;
    return linearScale([ticks[0], ticks.at(-1)!], [LABEL_WIDTH + (hasNegative ? VALUE_ROOM : 0), width - VALUE_ROOM]);
  }, [symbols, width]);

  const zero = x(0);
  const activeSymbol = active === null ? null : symbols[active];

  return (
    <div ref={ref} className="chart-plot" dir="ltr">
      <svg width={width} height={height} role="img" aria-label="صافي الربح المحقق لكل سهم">
        <line x1={zero} x2={zero} y1={PADDING_Y / 2} y2={height - PADDING_Y / 2} className="chart-baseline" />
        {symbols.map((symbol, i) => {
          const top = PADDING_Y + i * ROW_HEIGHT + (ROW_HEIGHT - BAR_THICKNESS) / 2;
          const end = x(symbol.total);
          const isNegative = symbol.total < 0;
          return (
            <g key={symbol.label}>
              <text x={8} y={top + BAR_THICKNESS / 2} className="chart-category-label" dominantBaseline="middle">{symbol.label}</text>
              <path d={roundedRowPath(zero, top, BAR_THICKNESS, end)} fill={colorFor(symbol.total)} opacity={active === null || active === i ? 1 : 0.55} />
              <text
                x={isNegative ? end - 6 : end + 6}
                y={top + BAR_THICKNESS / 2}
                className="chart-value-label"
                textAnchor={isNegative ? "end" : "start"}
                dominantBaseline="middle"
              >
                {formatSignedMoney(symbol.total)}
              </text>
              <rect
                x={0}
                y={PADDING_Y + i * ROW_HEIGHT}
                width={width}
                height={ROW_HEIGHT}
                fill="transparent"
                tabIndex={0}
                role="img"
                aria-label={`${symbol.label}: ${formatSignedMoney(symbol.total)}`}
                onPointerEnter={() => setActive(i)}
                onPointerLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
              />
            </g>
          );
        })}
      </svg>
      {activeSymbol && (
        <ChartTooltip
          x={x(activeSymbol.total)}
          y={PADDING_Y + active! * ROW_HEIGHT}
          containerWidth={width}
          title={activeSymbol.label}
          rows={[
            { key: "total", value: formatSignedMoney(activeSymbol.total), label: "صافي محقق", swatch: colorFor(activeSymbol.total) },
            { key: "count", value: formatInt(activeSymbol.count), label: "صفقات مغلقة" },
          ]}
        />
      )}
    </div>
  );
}
