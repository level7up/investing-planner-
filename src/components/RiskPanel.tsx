import type { RiskSettings } from "@/lib/settings/schema";
import { formatInt, formatMoney, formatPercent, formatRatio } from "@/lib/trades/format";
import { riskFromFormValues, riskPercentOfCapital, suggestQuantity } from "@/lib/trades/risk";
import type { TradeFormValues } from "@/lib/trades/types";

const GOOD_REWARD_TO_RISK = 2;

interface RiskPanelProps {
  values: TradeFormValues;
  settings: RiskSettings;
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
  const share = `${formatPercent(percent)} من رأس المال`;
  return percent > limit ? `${share} — أعلى من حدك (${formatPercent(limit)})` : share;
}

function Sizing({ values, settings, onApplyQuantity }: RiskPanelProps) {
  if (settings.capital === null) {
    return <p className="risk-hint">حدّد رأس المال من «إعدادات المخاطرة» لحساب الكمية المقترحة.</p>;
  }
  const suggested = suggestQuantity({
    capital: settings.capital,
    riskPercent: settings.riskPercent,
    buyPrice: Number(values.buyPrice) || 0,
    stopLoss: values.stopLoss.trim() === "" ? null : Number(values.stopLoss),
  });
  if (suggested === null) return <p className="risk-hint">أدخل سعر الشراء ووقف خسارة أقل منه لحساب الكمية المقترحة.</p>;
  if (suggested === 0) return <p className="risk-hint loss">الوقف بعيد جدًا عن سعر الشراء بالنسبة لحد المخاطرة المحدد.</p>;
  return (
    <div className="risk-sizing">
      <span>
        الكمية المقترحة لمخاطرة {formatPercent(settings.riskPercent)}: <strong>{formatInt(suggested)} سهم</strong>
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
  const { values, settings } = props;
  const risk = riskFromFormValues(values);
  const percent = riskPercentOfCapital(risk.riskAmount, settings.capital);
  const isOverLimit = percent !== null && percent > settings.riskPercent;

  return (
    <section className="risk-panel span2" aria-label="تحليل المخاطرة">
      <dl>
        <RiskRow
          label="المخاطرة عند وقف الخسارة"
          value={risk.riskAmount === null ? "أدخل وقف خسارة أقل من سعر الشراء" : formatMoney(risk.riskAmount)}
          tone={risk.riskAmount === null ? "muted" : isOverLimit ? "loss" : ""}
          note={riskNote(percent, settings.riskPercent)}
        />
        <RiskRow
          label="العائد عند الهدف"
          value={risk.rewardAmount === null ? "أدخل هدفًا أعلى من سعر الشراء" : formatMoney(risk.rewardAmount)}
          tone={risk.rewardAmount === null ? "muted" : "gain"}
        />
        <RiskRow
          label="العائد / المخاطرة"
          value={risk.rewardToRisk === null ? "—" : formatRatio(risk.rewardToRisk)}
          tone={ratioTone(risk.rewardToRisk)}
        />
      </dl>
      <Sizing {...props} />
    </section>
  );
}
