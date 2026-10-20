import type { CashEntry } from "@/lib/wallet/types";
import type { GoldHolding, GoldPrices } from "@/lib/gold/types";
import type { Trade } from "@/lib/trades/types";

export const makeTrade = (overrides: Partial<Trade> = {}): Trade => ({
  id: "t1",
  assetType: "stock",
  fundId: null,
  manualPrice: null,
  manualPriceDate: null,
  entryDate: "2026-10-01",
  exitDate: null,
  symbol: "COMI",
  status: "open",
  buyPrice: 10,
  quantity: 100,
  stopLoss: null,
  targetPrice: null,
  sellPrice: null,
  fees: 0,
  reason: "",
  updatedAt: "2026-10-01T10:00:00.000Z",
  ...overrides,
});

export const makeGold = (overrides: Partial<GoldHolding> = {}): GoldHolding => ({
  id: "g1",
  purchaseDate: "2026-10-04",
  kind: "bar",
  karat: 21,
  grams: 10,
  pricePerGram: 3000,
  makingFee: 500,
  status: "held",
  soldDate: null,
  salePricePerGram: null,
  saleFees: 0,
  notes: "",
  updatedAt: "2026-10-04T10:00:00.000Z",
  ...overrides,
});

export const makeCash = (overrides: Partial<CashEntry> = {}): CashEntry => ({
  id: "c1",
  occurredOn: "2026-10-01",
  kind: "deposit",
  amount: 100_000,
  note: "",
  ...overrides,
});

export const NO_GOLD_PRICES: GoldPrices = { price24: null, price21: null, price18: null, updatedAt: null };
