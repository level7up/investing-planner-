import { formatInt, formatMoney, formatPercent, formatRatio } from "@/lib/trades/format";
import { riskFromFormValues, riskPercentOfCapital, suggestQuantity } from "@/lib/trades/risk";
import type { TradeFormValues } from "@/lib/trades/types";

const GOOD_REWARD_TO_RISK = 2;

export type SizingContext = {
  capital: number | null;
  riskPercent: number;
  cash: number;
};

interface RiskPanelProps {
  values: TradeFormValues;
  sizing: SizingContext;
  onApplyQuantity: (quantity: string) => void;
}

interface RiskRowProps {
  label: string;
  value: string;
  tone?: string;
  note?: string | null;
}

function RiskRow({ label, value, tone = "", note = null }: RiskRowProps) {
  return (
    <div className="risk-row">
      <dt>{label}</dt>
      <dd className={tone}>
        {value}
        {note && <span className="risk-note">{note}</span>}
      </dd>
    </div>
  );
}

function ratioTone(ratio: number | null): string {
  if (ratio === null) return "muted";
  if (ratio >= GOOD_REWARD_TO_RISK) return "gain";
  return ratio < 1 ? "loss" : "";
}

function riskNote(percent: number | null, limit: number): string | null {
  if (percent === null) return null;
  const share = `${formatPercent(percent)} من إجمالي المحفظة`;
  return percent > limit ? `${share} — أعلى من حدك (${formatPercent(limit)})` : share;
}

function purchaseCost(values: TradeFormValues): number | null {
  const cost = (Number(values.buyPrice) || 0) * (Number(values.quantity) || 0) + (Number(values.fees) || 0);
  return cost > 0 ? cost : null;
}

function Sizing({ values, sizing, onApplyQuantity }: RiskPanelProps) {
  if (sizing.capital === null) {
    return <p className="risk-hint">سجّل إيداعًا في «المحفظة» لحساب الكمية المقترحة.</p>;
  }
  const suggested = suggestQuantity({
    capital: sizing.capital,
    riskPercent: sizing.riskPercent,
    buyPrice: Number(values.buyPrice) || 0,
    stopLoss: values.stopLoss.trim() === "" ? null : Number(values.stopLoss),
    maxSpend: sizing.cash,
  });
  if (suggested === null) return <p className="risk-hint">أدخل سعر الشراء ووقف خسارة أقل منه لحساب الكمية المقترحة.</p>;
  if (suggested === 0) return <p className="risk-hint loss">الرصيد النقدي لا يكفي، أو الوقف بعيد جدًا بالنسبة لحد المخاطرة.</p>;
  return (
    <div className="risk-sizing">
      <span>
        الكمية المقترحة لمخاطرة {formatPercent(sizing.riskPercent)}: <strong>{formatInt(suggested)}</strong>
      </span>
      {String(suggested) !== values.quantity && (
        <button className="btn btn-secondary btn-sm" type="button" onClick={() => onApplyQuantity(String(suggested))}>
          استخدم
        </button>
      )}
    </div>
  );
}

export function RiskPanel(props: RiskPanelProps) {
  const { values, sizing } = props;
  const risk = riskFromFormValues(values);
  const percent = riskPercentOfCapital(risk.riskAmount, sizing.capital);
  const isOverLimit = percent !== null && percent > sizing.riskPercent;
  const cost = values.status === "cancelled" ? null : purchaseCost(values);
  const isOverCash = cost !== null && cost > sizing.cash;

  return (
    <section className="risk-panel span2" aria-label="تحليل المخاطرة">
      <dl>
        <RiskRow
          label="المخاطرة عند وقف الخسارة"
          value={risk.riskAmount === null ? "أدخل وقف خسارة أقل من سعر الشراء" : formatMoney(risk.riskAmount)}
          tone={risk.riskAmount === null ? "muted" : isOverLimit ? "loss" : ""}
          note={riskNote(percent, sizing.riskPercent)}
        />
        <RiskRow
          label="العائد عند الهدف"
          value={risk.rewardAmount === null ? "أدخل هدفًا أعلى من سعر الشراء" : formatMoney(risk.rewardAmount)}
          tone={risk.rewardAmount === null ? "muted" : "gain"}
        />
        <RiskRow label="العائد / المخاطرة" value={risk.rewardToRisk === null ? "—" : formatRatio(risk.rewardToRisk)} tone={ratioTone(risk.rewardToRisk)} />
        {cost !== null && (
          <RiskRow
            label="تكلفة الشراء شاملة الرسوم"
            value={formatMoney(cost)}
            tone={isOverCash ? "loss" : ""}
            note={`المتاح في المحفظة: ${formatMoney(sizing.cash)}${isOverCash ? " — الرصيد غير كافٍ" : ""}`}
          />
        )}
      </dl>
      <Sizing {...props} />
    </section>
  );
}
