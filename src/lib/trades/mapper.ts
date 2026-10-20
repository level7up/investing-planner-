import type { TradeInput } from "./schema";
import { ASSET_TYPES, TRADE_STATUSES, type AssetType, type Trade, type TradeStatus } from "./types";

type Numeric = number | string;

export type TradeRow = {
  id: string;
  asset_type: string;
  fund_id: string | null;
  manual_price: Numeric | null;
  manual_price_date: string | null;
  entry_date: string;
  exit_date: string | null;
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

export type TradeWriteRow = Omit<TradeRow, "id" | "updated_at" | "reason" | "status" | "asset_type"> & {
  asset_type: AssetType;
  status: TradeStatus;
  reason: string;
};

export const TRADE_COLUMNS =
  "id, asset_type, fund_id, manual_price, manual_price_date, entry_date, exit_date, symbol, status, buy_price, quantity, stop_loss, target_price, sell_price, fees, reason, updated_at";

const toNullableNumber = (value: Numeric | null): number | null => (value === null ? null : Number(value));

const oneOf = <T extends string>(options: readonly T[], value: string, fallback: T): T =>
  (options as readonly string[]).includes(value) ? (value as T) : fallback;

export function fromRow(row: TradeRow): Trade {
  return {
    id: row.id,
    assetType: oneOf(ASSET_TYPES, row.asset_type, "stock"),
    fundId: row.fund_id,
    manualPrice: toNullableNumber(row.manual_price),
    manualPriceDate: row.manual_price_date,
    entryDate: row.entry_date,
    exitDate: row.exit_date,
    symbol: row.symbol,
    status: oneOf(TRADE_STATUSES, row.status, "open"),
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
    asset_type: input.assetType,
    fund_id: input.fundId,
    manual_price: input.manualPrice,
    manual_price_date: input.manualPriceDate,
    entry_date: input.entryDate,
    exit_date: input.exitDate,
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
