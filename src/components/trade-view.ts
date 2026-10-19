import { pnl } from "@/lib/trades/calc";
import {
  formatAmount,
  formatDate,
  formatInt,
  formatOptionalPrice,
  formatPrice,
  formatSignedMoney,
  toneOf,
} from "@/lib/trades/format";
import { STATUS_LABELS } from "@/lib/trades/status";
import type { Trade } from "@/lib/trades/types";

export type TradeView = {
  date: string;
  statusLabel: string;
  statusClass: string;
  result: { text: string; className: string };
  buy: string;
  quantity: string;
  stop: string;
  target: string;
  sell: string;
  fees: string;
};

function resultOf(trade: Trade): TradeView["result"] {
  const value = pnl(trade);
  if (value !== null) return { text: formatSignedMoney(value), className: toneOf(value) };
  if (trade.status === "cancelled") return { text: "—", className: "muted" };
  return { text: "غير محقق", className: "muted" };
}

export function toTradeView(trade: Trade): TradeView {
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
  };
}
