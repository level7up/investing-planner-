import { describe, expect, test } from "vitest";
import { makeCash, makeGold, makeTrade, NO_GOLD_PRICES } from "@/lib/testing/fixtures";
import { portfolioSummary, riskCapital } from "./calc";

describe("portfolioSummary", () => {
  test("adds cash, open positions at cost and gold at market value", () => {
    const summary = portfolioSummary({
      entries: [makeCash({ amount: 50_000 })],
      trades: [
        makeTrade({ id: "stock" }),
        makeTrade({ id: "fund", assetType: "gold_fund", buyPrice: 5, quantity: 200 }),
        makeTrade({ id: "closed", status: "closed", sellPrice: 12, exitDate: "2026-10-02" }),
      ],
      gold: [makeGold()],
      prices: { ...NO_GOLD_PRICES, price21: 3500 },
    });
    expect(summary).toEqual({ cash: 17700, positions: 2000, gold: 35000, total: 54700 });
  });
});

describe("portfolioSummary with quotes", () => {
  test("values open positions at market price when a quote exists", () => {
    const summary = portfolioSummary({
      entries: [makeCash({ amount: 5000 })],
      trades: [makeTrade(), makeTrade({ id: "fund", symbol: "AZG", buyPrice: 5, quantity: 100 })],
      gold: [],
      prices: NO_GOLD_PRICES,
      quotes: { COMI: { symbol: "COMI", price: 12, changePercent: null } },
    });
    expect(summary).toEqual({ cash: 3500, positions: 1700, gold: 0, total: 5200 });
  });
});

describe("riskCapital", () => {
  test("uses the portfolio total when positive", () => {
    expect(riskCapital({ cash: 0, positions: 0, gold: 0, total: 1000 })).toBe(1000);
    expect(riskCapital({ cash: -10, positions: 0, gold: 0, total: -10 })).toBeNull();
  });
});
