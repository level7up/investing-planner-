import { livePosition, type PositionAlert } from "@/lib/quotes/positions";
import type { QuoteMap } from "@/lib/quotes/types";
import { pnl, purchaseValue } from "@/lib/trades/calc";
import {
  formatAmount,
  formatDate,
  formatInt,
  formatOptionalPrice,
  formatPrice,
  formatRatio,
  formatSignedPercent,
  formatRMultiple,
  formatSignedMoney,
  toneOf,
} from "@/lib/trades/format";
import { riskProfile, rMultiple } from "@/lib/trades/risk";
import { STATUS_LABELS } from "@/lib/trades/status";
import type { Trade } from "@/lib/trades/types";

export type TradeView = {
  date: string;
  statusLabel: string;
  statusClass: string;
  result: { text: string; className: string; note: string | null };
  buy: string;
  quantity: string;
  purchaseValue: string;
  current: { price: string; note: string | null; noteClass: string } | null;
  alert: PositionAlert;
  stop: string;
  target: string;
  sell: string;
  fees: string;
  risk: string;
  rewardToRisk: string;
};

export const ALERT_LABELS: Record<Exclude<PositionAlert, null>, string> = {
  stop: "ضرب الوقف",
  target: "وصل الهدف",
};

function resultOf(trade: Trade, live: ReturnType<typeof livePosition>): TradeView["result"] {
  const value = pnl(trade);
  if (value !== null) {
    const multiple = rMultiple(trade);
    return { text: formatSignedMoney(value), className: toneOf(value), note: multiple === null ? null : formatRMultiple(multiple) };
  }
  if (live) {
    const r = live.unrealisedR === null ? "" : ` · ${formatRMultiple(live.unrealisedR)}`;
    return { text: formatSignedMoney(live.unrealised), className: toneOf(live.unrealised), note: `غير محقق${r}` };
  }
  if (trade.status === "cancelled") return { text: "—", className: "muted", note: null };
  return { text: "غير محقق", className: "muted", note: null };
}

export function toTradeView(trade: Trade, quotes: QuoteMap): TradeView {
  const risk = riskProfile(trade);
  const live = livePosition(trade, quotes);
  return {
    date: formatDate(trade.entryDate),
    statusLabel: STATUS_LABELS[trade.status],
    statusClass: `pill--${trade.status}`,
    result: resultOf(trade, live),
    buy: formatPrice(trade.buyPrice),
    quantity: formatInt(trade.quantity),
    purchaseValue: formatAmount(purchaseValue(trade)),
    current: live && {
      price: formatPrice(live.price),
      note: live.changePercent !== null ? formatSignedPercent(live.changePercent) : live.asOf ? `سعر ${formatDate(live.asOf)}` : null,
      noteClass: live.changePercent === null ? "muted" : toneOf(live.changePercent),
    },
    alert: live?.alert ?? null,
    stop: formatOptionalPrice(trade.stopLoss),
    target: formatOptionalPrice(trade.targetPrice),
    sell: formatOptionalPrice(trade.sellPrice),
    fees: formatAmount(trade.fees),
    risk: risk.riskAmount === null ? "—" : formatAmount(risk.riskAmount),
    rewardToRisk: risk.rewardToRisk === null ? "—" : formatRatio(risk.rewardToRisk),
  };
}
