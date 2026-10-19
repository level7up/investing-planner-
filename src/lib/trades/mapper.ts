import type { TradeInput } from "./schema";
import { TRADE_STATUSES, type Trade, type TradeStatus } from "./types";

type Numeric = number | string;

export type TradeRow = {
  id: string;
  entry_date: string;
  symbol: string;
  status: string;
  buy_price: Numeric;
  quantity: Numeric;
  stop_loss: Numeric | null;
  target_price: Numeric | null;
  sell_price: Numeric | null;
  fees: Numeric;
  reason: string | null;
  updated_at: string;
};

export type TradeWriteRow = Omit<TradeRow, "id" | "updated_at" | "reason" | "status"> & {
  status: TradeStatus;
  reason: string;
};

export const TRADE_COLUMNS =
  "id, entry_date, symbol, status, buy_price, quantity, stop_loss, target_price, sell_price, fees, reason, updated_at";

const toNullableNumber = (value: Numeric | null): number | null => (value === null ? null : Number(value));

const toStatus = (value: string): TradeStatus =>
  (TRADE_STATUSES as readonly string[]).includes(value) ? (value as TradeStatus) : "open";

export function fromRow(row: TradeRow): Trade {
  return {
    id: row.id,
    entryDate: row.entry_date,
    symbol: row.symbol,
    status: toStatus(row.status),
    buyPrice: Number(row.buy_price),
    quantity: Number(row.quantity),
    stopLoss: toNullableNumber(row.stop_loss),
    targetPrice: toNullableNumber(row.target_price),
    sellPrice: toNullableNumber(row.sell_price),
    fees: Number(row.fees),
    reason: row.reason ?? "",
    updatedAt: row.updated_at,
  };
}

export function toRow(input: TradeInput): TradeWriteRow {
  return {
    entry_date: input.entryDate,
    symbol: input.symbol,
    status: input.status,
    buy_price: input.buyPrice,
    quantity: input.quantity,
    stop_loss: input.stopLoss,
    target_price: input.targetPrice,
    sell_price: input.sellPrice,
    fees: input.fees,
    reason: input.reason,
  };
}
