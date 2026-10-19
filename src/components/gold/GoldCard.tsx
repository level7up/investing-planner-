import { goldCost, goldMarketValue, goldProceeds, goldRealised } from "@/lib/gold/calc";
import { GOLD_KIND_LABELS, GOLD_STATUS_LABELS, type GoldHolding, type GoldPrices } from "@/lib/gold/types";
import { formatAmount, formatDate, formatSignedMoney, toneOf } from "@/lib/trades/format";

interface GoldCardProps {
  holding: GoldHolding;
  prices: GoldPrices;
  onEdit: (holding: GoldHolding) => void;
  onDelete: (holding: GoldHolding) => void;
}

function resultOf(holding: GoldHolding, prices: GoldPrices): { text: string; className: string; label: string } {
  const realised = goldRealised(holding);
  if (realised !== null) return { text: formatSignedMoney(realised), className: toneOf(realised), label: "ربح محقق" };
  const value = goldMarketValue(holding, prices);
  if (value === null) return { text: "حدّث سعر الجرام", className: "muted", label: "غير محقق" };
  const unrealised = value - goldCost(holding);
  return { text: formatSignedMoney(unrealised), className: toneOf(unrealised), label: "غير محقق" };
}

export function GoldCard({ holding, prices, onEdit, onDelete }: GoldCardProps) {
  const title = `${GOLD_KIND_LABELS[holding.kind]} عيار ${holding.karat}`;
  const result = resultOf(holding, prices);
  const isSold = holding.status === "sold";
  const value = isSold ? goldProceeds(holding) : goldMarketValue(holding, prices);
  const stats = [
    ["الوزن (جم)", formatAmount(holding.grams)],
    ["سعر الجرام", formatAmount(holding.pricePerGram)],
    ["المصنعية", formatAmount(holding.makingFee)],
    ["التكلفة", formatAmount(goldCost(holding))],
    [isSold ? "حصيلة البيع" : "القيمة الحالية", value === null ? "—" : formatAmount(value)],
    [isSold ? "تاريخ البيع" : "سعر البيع", isSold ? formatDate(holding.soldDate ?? "") : "—"],
  ];

  return (
    <article className="card">
      <div className="card-top">
        <div>
          <div className="card-meta">
            <span className="sym">{title}</span>
            <span className={`pill ${isSold ? "pill--closed" : "pill--gold"}`}>{GOLD_STATUS_LABELS[holding.status]}</span>
          </div>
          <p className="card-date">{formatDate(holding.purchaseDate)}</p>
        </div>
        <div className={`card-result ${result.className}`}>
          {result.text}
          <div className="r-multiple">{result.label}</div>
        </div>
      </div>
      <dl className="stats">
        {stats.map(([label, text]) => (
          <div key={label}><dt>{label}</dt><dd>{text}</dd></div>
        ))}
      </dl>
      {holding.notes && <p className="card-note">{holding.notes}</p>}
      <div className="card-actions">
        <button className="btn btn-secondary" type="button" onClick={() => onEdit(holding)} aria-label={`تعديل ${title}`}>تعديل</button>
        <button className="btn btn-danger" type="button" onClick={() => onDelete(holding)} aria-label={`حذف ${title}`}>حذف</button>
      </div>
    </article>
  );
}
