import type { TradeMetrics } from "@/lib/trades/calc";
import { formatInt, formatMoney, formatSignedMoney, toneOf } from "@/lib/trades/format";

interface MetricsProps {
  metrics: TradeMetrics;
}

interface MetricProps {
  label: string;
  value: string;
  hint: string;
  isWide?: boolean;
  tone?: string;
}

function Metric({ label, value, hint, isWide = false, tone = "" }: MetricProps) {
  return (
    <article className={isWide ? "metric metric--wide" : "metric"}>
      <p className="label">{label}</p>
      <p className={`value ${tone}`}>{value}</p>
      <p className="hint">{hint}</p>
    </article>
  );
}

export function Metrics({ metrics }: MetricsProps) {
  const winRate = metrics.winRate === null ? "—" : `${formatInt(metrics.winRate)}٪`;
  return (
    <section className="metrics" aria-label="ملخص الصفقات">
      <Metric label="صافي النتائج المحققة" value={formatSignedMoney(metrics.net)} hint="للصفقات المغلقة فقط" tone={toneOf(metrics.net)} isWide />
      <Metric label="نسبة الصفقات الرابحة" value={winRate} hint="من الصفقات المغلقة" />
      <Metric label="عدد الصفقات" value={formatInt(metrics.total)} hint="كل الصفقات المسجلة" />
      <Metric label="رأس المال المفتوح" value={formatMoney(metrics.openCapital)} hint="قيمة الشراء للصفقات المفتوحة" isWide />
    </section>
  );
}
