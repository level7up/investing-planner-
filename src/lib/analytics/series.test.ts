import { describe, expect, test } from "vitest";
import { makeCash, makeGold, makeTrade, NO_GOLD_PRICES } from "@/lib/testing/fixtures";
import { allocation, cumulativeSeries, monthlyTotals, niceTicks, pnlBySymbol, realisedEvents } from "./series";

const closed = (overrides: Parameters<typeof makeTrade>[0]) =>
  makeTrade({ status: "closed", exitDate: "2026-10-05", sellPrice: 11, ...overrides });

const trades = [
  closed({ id: "a", symbol: "COMI", exitDate: "2026-08-10", sellPrice: 12 }),
  closed({ id: "b", symbol: "HRHO", exitDate: "2026-08-20", sellPrice: 9 }),
  closed({ id: "c", symbol: "COMI", exitDate: "2026-10-02", sellPrice: 10.5 }),
  makeTrade({ id: "open" }),
];
const soldGold = makeGold({ id: "g", status: "sold", soldDate: "2026-10-02", salePricePerGram: 3100, makingFee: 0 });

describe("realisedEvents", () => {
  test("collects closed trades and sold gold by their exit dates", () => {
    expect(realisedEvents(trades, [soldGold, makeGold()])).toEqual([
      { date: "2026-08-10", amount: 200, label: "COMI" },
      { date: "2026-08-20", amount: -100, label: "HRHO" },
      { date: "2026-10-02", amount: 50, label: "COMI" },
      { date: "2026-10-02", amount: 1000, label: "ذهب عيار 21" },
    ]);
  });
});

describe("cumulativeSeries", () => {
  test("accumulates per day starting from zero", () => {
    expect(cumulativeSeries(realisedEvents(trades, [soldGold]))).toEqual([
      { date: "2026-08-10", value: 200, delta: 200 },
      { date: "2026-08-20", value: 100, delta: -100 },
      { date: "2026-10-02", value: 1150, delta: 1050 },
    ]);
  });

  test("is empty without events", () => {
    expect(cumulativeSeries([])).toEqual([]);
  });
});

describe("monthlyTotals", () => {
  test("sums per month and fills months without activity", () => {
    expect(monthlyTotals(realisedEvents(trades, []))).toEqual([
      { month: "2026-08", total: 100 },
      { month: "2026-09", total: 0 },
      { month: "2026-10", total: 50 },
    ]);
  });

  test("handles year boundaries", () => {
    const events = [
      { date: "2025-12-31", amount: 1, label: "x" },
      { date: "2026-01-01", amount: 2, label: "y" },
    ];
    expect(monthlyTotals(events).map((m) => m.month)).toEqual(["2025-12", "2026-01"]);
  });
});

describe("pnlBySymbol", () => {
  test("totals realised results per symbol, best first", () => {
    expect(pnlBySymbol(trades, 8)).toEqual([
      { label: "COMI", total: 250, count: 2 },
      { label: "HRHO", total: -100, count: 1 },
    ]);
  });

  test("folds the tail into أخرى beyond the limit", () => {
    const many = ["A", "B", "C", "D"].map((symbol, index) => closed({ id: symbol, symbol, sellPrice: 11 + index }));
    expect(pnlBySymbol(many, 2)).toEqual([
      { label: "D", total: 400, count: 1 },
      { label: "C", total: 300, count: 1 },
      { label: "أخرى", total: 300, count: 2 },
    ]);
  });
});

describe("allocation", () => {
  test("splits the portfolio into cash, stocks, gold funds and physical gold", () => {
    const parts = allocation({
      entries: [makeCash({ amount: 10_000 })],
      trades: [makeTrade(), makeTrade({ id: "f", assetType: "gold_fund", symbol: "AZG", buyPrice: 20, quantity: 50 })],
      gold: [makeGold({ grams: 1, pricePerGram: 3000, makingFee: 0 })],
      prices: NO_GOLD_PRICES,
      quotes: { COMI: { symbol: "COMI", price: 15, changePercent: null } },
    });
    expect(parts).toEqual([
      { key: "cash", label: "نقدية", value: 5000, share: 47.6 },
      { key: "stocks", label: "أسهم", value: 1500, share: 14.3 },
      { key: "goldFunds", label: "صناديق ذهب", value: 1000, share: 9.5 },
      { key: "gold", label: "ذهب", value: 3000, share: 28.6 },
    ]);
  });

  test("leaves out negative cash and empty parts", () => {
    const parts = allocation({ entries: [], trades: [makeTrade()], gold: [], prices: NO_GOLD_PRICES });
    expect(parts).toEqual([{ key: "stocks", label: "أسهم", value: 1000, share: 100 }]);
  });
});

describe("niceTicks", () => {
  test("produces round ticks that cover the range including zero", () => {
    expect(niceTicks(-130, 1150, 5)).toEqual([-500, 0, 500, 1000, 1500]);
    expect(niceTicks(0, 87, 4)).toEqual([0, 20, 40, 60, 80, 100]);
  });

  test("handles a flat range", () => {
    expect(niceTicks(0, 0, 4)).toEqual([0, 1]);
  });
});
