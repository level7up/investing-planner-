import type { AllocationKey, AllocationPart } from "@/lib/analytics/series";
import { formatMoney, formatPercent } from "@/lib/trades/format";

const SLOT_COLORS: Record<AllocationKey, string> = {
  cash: "var(--series-1)",
  stocks: "var(--series-2)",
  equityFunds: "var(--series-3)",
  goldFunds: "var(--series-4)",
  gold: "var(--series-5)",
};

interface AllocationChartProps {
  parts: readonly AllocationPart[];
}

export function AllocationChart({ parts }: AllocationChartProps) {
  return (
    <div className="allocation">
      <div className="allocation-bar" role="img" aria-label={parts.map((p) => `${p.label} ${formatPercent(p.share)}`).join("، ")}>
        {parts.map((part) => (
          <span
            key={part.key}
            className="allocation-segment"
            style={{ flexGrow: part.value, background: SLOT_COLORS[part.key] }}
            title={`${part.label}: ${formatMoney(part.value)} (${formatPercent(part.share)})`}
          />
        ))}
      </div>
      <ul className="allocation-legend">
        {parts.map((part) => (
          <li key={part.key}>
            <span className="allocation-swatch" style={{ background: SLOT_COLORS[part.key] }} aria-hidden="true" />
            <span className="allocation-label">{part.label}</span>
            <strong>{formatMoney(part.value)}</strong>
            <span className="allocation-share">{formatPercent(part.share)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
