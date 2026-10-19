export const TRADE_STATUSES = ["open", "closed", "cancelled"] as const;
export const ASSET_TYPES = ["stock", "gold_fund"] as const;

export type TradeStatus = (typeof TRADE_STATUSES)[number];
export type AssetType = (typeof ASSET_TYPES)[number];

export type Trade = {
  id: string;
  assetType: AssetType;
  entryDate: string;
  exitDate: string | null;
  symbol: string;
  status: TradeStatus;
  buyPrice: number;
  quantity: number;
  stopLoss: number | null;
  targetPrice: number | null;
  sellPrice: number | null;
  fees: number;
  reason: string;
  updatedAt: string;
};

export type TradeFormValues = {
  assetType: AssetType;
  entryDate: string;
  exitDate: string;
  symbol: string;
  status: TradeStatus;
  buyPrice: string;
  quantity: string;
  stopLoss: string;
  targetPrice: string;
  sellPrice: string;
  fees: string;
  reason: string;
};

export type TradeFilter = TradeStatus | "all";

export type ActionResult = { ok: true } | { ok: false; error: string };
