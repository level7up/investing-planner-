import { pnl } from "@/lib/trades/calc";
import {
  formatAmount,
  formatDate,
  formatInt,
  formatOptionalPrice,
  formatPrice,
  formatRatio,
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
  result: { text: string; className: string; rMultiple: string | null };
  buy: string;
  quantity: string;
  stop: string;
  target: string;
  sell: string;
  fees: string;
  risk: string;
  rewardToRisk: string;
};

function resultOf(trade: Trade): TradeView["result"] {
  const value = pnl(trade);
  const multiple = rMultiple(trade);
  const rText = multiple === null ? null : formatRMultiple(multiple);
  if (value !== null) return { text: formatSignedMoney(value), className: toneOf(value), rMultiple: rText };
  if (trade.status === "cancelled") return { text: "—", className: "muted", rMultiple: null };
  return { text: "غير محقق", className: "muted", rMultiple: null };
}

export function toTradeView(trade: Trade): TradeView {
  const risk = riskProfile(trade);
  return {
    date: formatDate(trade.entryDate),
    statusLabel: STATUS_LABELS[trade.status],
    statusClass: `pill--${trade.status}`,
    result: resultOf(trade),
    buy: formatPrice(trade.buyPrice),
    quantity: formatInt(trade.quantity),
    stop: formatOptionalPrice(trade.stopLoss),
    target: formatOptionalPrice(trade.targetPrice),
    sell: formatOptionalPrice(trade.sellPrice),
    fees: formatAmount(trade.fees),
    risk: risk.riskAmount === null ? "—" : formatAmount(risk.riskAmount),
    rewardToRisk: risk.rewardToRisk === null ? "—" : formatRatio(risk.rewardToRisk),
  };
}
