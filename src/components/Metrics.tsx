import type { TradeMetrics } from "@/lib/trades/calc";
import { formatInt, formatMoney, formatSignedMoney, toneOf } from "@/lib/trades/format";
import type { OpenUnrealised } from "@/lib/quotes/positions";
import type { OpenRisk } from "@/lib/trades/risk";

interface MetricsProps {
  metrics: TradeMetrics;
  risk: OpenRisk;
  unrealised: OpenUnrealised;
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

function openRiskHint(risk: OpenRisk): string {
  if (risk.unprotectedCount === 0) return "خسارة متوقعة لو ضربت كل الوقفات";
  return `${formatInt(risk.unprotectedCount)} صفقة مفتوحة بدون وقف خسارة`;
}

function unrealisedHint(unrealised: OpenUnrealised): string {
  if (unrealised.openCount === 0) return "لا توجد صفقات مفتوحة";
  return `بسعر السوق لـ ${formatInt(unrealised.pricedCount)} من ${formatInt(unrealised.openCount)} صفقة مفتوحة`;
}

export function Metrics({ metrics, risk, unrealised }: MetricsProps) {
  const winRate = metrics.winRate === null ? "—" : `${formatInt(metrics.winRate)}٪`;
  return (
    <section className="metrics" aria-label="ملخص الصفقات">
      <Metric label="صافي النتائج المحققة" value={formatSignedMoney(metrics.net)} hint="للصفقات المغلقة فقط" tone={toneOf(metrics.net)} isWide />
      <Metric label="نسبة الصفقات الرابحة" value={winRate} hint="من الصفقات المغلقة" />
      <Metric label="عدد الصفقات" value={formatInt(metrics.total)} hint="كل الصفقات المسجلة" />
      <Metric label="رأس المال المفتوح" value={formatMoney(metrics.openCapital)} hint="قيمة الشراء للصفقات المفتوحة" />
      <Metric label="ربح/خسارة غير محققة" value={formatSignedMoney(unrealised.amount)} hint={unrealisedHint(unrealised)} tone={toneOf(unrealised.amount)} />
      <Metric label="المخاطرة المفتوحة" value={formatMoney(risk.amount)} hint={openRiskHint(risk)} tone={risk.unprotectedCount > 0 ? "loss" : ""} />
    </section>
  );
}
