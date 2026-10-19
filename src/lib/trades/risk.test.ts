import { describe, expect, test } from "vitest";
import { openRisk, riskFromFormValues, riskPercentOfCapital, riskProfile, rMultiple, suggestQuantity } from "./risk";
import type { Trade, TradeFormValues } from "./types";

const makeTrade = (overrides: Partial<Trade> = {}): Trade => ({
  id: "t1",
  entryDate: "2026-10-01",
  symbol: "COMI",
  status: "open",
  buyPrice: 10,
  quantity: 100,
  stopLoss: 9,
  targetPrice: 13,
  sellPrice: null,
  fees: 10,
  reason: "",
  updatedAt: "2026-10-01T10:00:00.000Z",
  ...overrides,
});

describe("riskProfile", () => {
  test("computes risk, reward and reward to risk after fees", () => {
    expect(riskProfile(makeTrade())).toEqual({ riskAmount: 110, rewardAmount: 290, rewardToRisk: 2.64 });
  });

  test("has no risk when the stop is missing", () => {
    expect(riskProfile(makeTrade({ stopLoss: null }))).toEqual({ riskAmount: null, rewardAmount: 290, rewardToRisk: null });
  });

  test("has no risk when the stop is at or above the buy price", () => {
    expect(riskProfile(makeTrade({ stopLoss: 10 })).riskAmount).toBeNull();
    expect(riskProfile(makeTrade({ stopLoss: 11 })).riskAmount).toBeNull();
  });

  test("has no reward when the target is missing or not above the buy price", () => {
    expect(riskProfile(makeTrade({ targetPrice: null })).rewardAmount).toBeNull();
    expect(riskProfile(makeTrade({ targetPrice: 10 })).rewardAmount).toBeNull();
  });

  test("has no risk when quantity is not positive", () => {
    expect(riskProfile(makeTrade({ quantity: 0 })).riskAmount).toBeNull();
  });
});

describe("riskFromFormValues", () => {
  const values: TradeFormValues = {
    entryDate: "2026-10-01",
    symbol: "COMI",
    status: "open",
    buyPrice: "10",
    quantity: "100",
    stopLoss: "9",
    targetPrice: "13",
    sellPrice: "",
    fees: "",
    reason: "",
  };

  test("reads raw form strings and treats empty fees as zero", () => {
    expect(riskFromFormValues(values)).toEqual({ riskAmount: 100, rewardAmount: 300, rewardToRisk: 3 });
  });

  test("returns empty profile for incomplete or invalid input", () => {
    expect(riskFromFormValues({ ...values, buyPrice: "" })).toEqual({ riskAmount: null, rewardAmount: null, rewardToRisk: null });
    expect(riskFromFormValues({ ...values, stopLoss: "abc" }).riskAmount).toBeNull();
  });
});

describe("riskPercentOfCapital", () => {
  test("expresses risk as a percentage of capital", () => {
    expect(riskPercentOfCapital(150, 10_000)).toBe(1.5);
  });

  test("returns null without capital or risk", () => {
    expect(riskPercentOfCapital(150, null)).toBeNull();
    expect(riskPercentOfCapital(150, 0)).toBeNull();
    expect(riskPercentOfCapital(null, 10_000)).toBeNull();
  });
});

describe("suggestQuantity", () => {
  const base = { capital: 100_000, riskPercent: 1, buyPrice: 10, stopLoss: 9 };

  test("sizes the position so a stop-out loses the chosen percentage", () => {
    expect(suggestQuantity(base)).toBe(1000);
  });

  test("is not thrown off by floating point error", () => {
    expect(suggestQuantity({ ...base, capital: 100_000, buyPrice: 10.1, stopLoss: 9.9 })).toBe(5000);
  });

  test("never suggests more shares than the capital can buy", () => {
    expect(suggestQuantity({ ...base, riskPercent: 5, stopLoss: 9.9 })).toBe(10_000);
  });

  test("returns null when inputs are incomplete or the stop is not below the buy price", () => {
    expect(suggestQuantity({ ...base, capital: null })).toBeNull();
    expect(suggestQuantity({ ...base, stopLoss: null })).toBeNull();
    expect(suggestQuantity({ ...base, stopLoss: 10 })).toBeNull();
    expect(suggestQuantity({ ...base, buyPrice: 0 })).toBeNull();
    expect(suggestQuantity({ ...base, riskPercent: 0 })).toBeNull();
  });
});

describe("rMultiple", () => {
  test("expresses a closed result in units of initial risk", () => {
    expect(rMultiple(makeTrade({ status: "closed", sellPrice: 12, fees: 0 }))).toBe(2);
    expect(rMultiple(makeTrade({ status: "closed", sellPrice: 9.5, fees: 0 }))).toBe(-0.5);
  });

  test("returns null for open trades or trades without a stop", () => {
    expect(rMultiple(makeTrade())).toBeNull();
    expect(rMultiple(makeTrade({ status: "closed", sellPrice: 12, stopLoss: null }))).toBeNull();
  });
});

describe("openRisk", () => {
  test("sums risk of open trades and counts open trades without a stop", () => {
    const trades = [
      makeTrade({ id: "a" }),
      makeTrade({ id: "b", stopLoss: 9.5, fees: 0 }),
      makeTrade({ id: "c", stopLoss: null }),
      makeTrade({ id: "d", status: "closed", sellPrice: 12 }),
    ];
    expect(openRisk(trades)).toEqual({ amount: 160, unprotectedCount: 1 });
  });
});
