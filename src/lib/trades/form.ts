import { todayISO } from "./format";
import type { Trade, TradeFormValues } from "./types";

const toField = (value: number | null): string => (value === null ? "" : String(value));

export function emptyFormValues(today: string = todayISO()): TradeFormValues {
  return {
    assetType: "stock",
    fundId: "",
    manualPrice: "",
    manualPriceDate: "",
    entryDate: today,
    exitDate: "",
    symbol: "",
    status: "open",
    buyPrice: "",
    quantity: "",
    stopLoss: "",
    targetPrice: "",
    sellPrice: "",
    fees: "0",
    reason: "",
  };
}

export function tradeToFormValues(trade: Trade): TradeFormValues {
  return {
    assetType: trade.assetType,
    fundId: trade.fundId ?? "",
    manualPrice: toField(trade.manualPrice),
    manualPriceDate: trade.manualPriceDate ?? "",
    entryDate: trade.entryDate,
    exitDate: trade.exitDate ?? "",
    symbol: trade.symbol,
    status: trade.status,
    buyPrice: toField(trade.buyPrice),
    quantity: toField(trade.quantity),
    stopLoss: toField(trade.stopLoss),
    targetPrice: toField(trade.targetPrice),
    sellPrice: toField(trade.sellPrice),
    fees: toField(trade.fees),
    reason: trade.reason,
  };
}
