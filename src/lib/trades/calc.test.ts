import { describe, expect, test } from "vitest";
import { computeMetrics, countByStatus, filterTrades, pnl, previewPnl } from "./calc";
import type { Trade } from "./types";

const makeTrade = (overrides: Partial<Trade> = {}): Trade => ({
  id: "t1",
  entryDate: "2026-10-01",
  assetType: "stock",
  exitDate: null,
  symbol: "COMI",
  status: "closed",
  buyPrice: 10,
  quantity: 100,
  stopLoss: null,
  targetPrice: null,
  sellPrice: 12,
  fees: 5,
  reason: "",
  updatedAt: "2026-10-01T10:00:00.000Z",
  ...overrides,
});

describe("pnl", () => {
  test("returns profit after fees for a closed trade", () => {
    expect(pnl(makeTrade())).toBe(195);
  });

  test("returns a negative result for a losing trade", () => {
    expect(pnl(makeTrade({ sellPrice: 9.5, fees: 2.25 }))).toBe(-52.25);
  });

  test("rounds to two decimals", () => {
    expect(pnl(makeTrade({ buyPrice: 0.1, sellPrice: 0.3, quantity: 3, fees: 0 }))).toBe(0.6);
  });

  test("returns null for open trades", () => {
    expect(pnl(makeTrade({ status: "open" }))).toBeNull();
  });

  test("returns null for closed trades without a sell price", () => {
    expect(pnl(makeTrade({ sellPrice: null }))).toBeNull();
  });
});

describe("previewPnl", () => {
  const values = { status: "closed" as const, buyPrice: "10", quantity: "100", sellPrice: "12", fees: "5" };

  test("computes the result from raw form values", () => {
    expect(previewPnl(values)).toBe(195);
  });

  test("returns null when the trade is not closed", () => {
    expect(previewPnl({ ...values, status: "open" })).toBeNull();
  });

  test("returns null when the sell price is empty", () => {
    expect(previewPnl({ ...values, sellPrice: "" })).toBeNull();
  });

  test("returns null when buy price or quantity are not positive", () => {
    expect(previewPnl({ ...values, buyPrice: "0" })).toBeNull();
    expect(previewPnl({ ...values, quantity: "" })).toBeNull();
  });

  test("treats empty fees as zero", () => {
    expect(previewPnl({ ...values, fees: "" })).toBe(200);
  });
});

describe("computeMetrics", () => {
  test("returns zeroed metrics when there are no trades", () => {
    expect(computeMetrics([])).toEqual({ total: 0, net: 0, winRate: null, openCapital: 0 });
  });

  test("aggregates net result, win rate and open capital", () => {
    const trades = [
      makeTrade({ id: "a" }),
      makeTrade({ id: "b", sellPrice: 9, fees: 0 }),
      makeTrade({ id: "c", status: "open", sellPrice: null, buyPrice: 20, quantity: 10 }),
      makeTrade({ id: "d", status: "cancelled" }),
    ];
    expect(computeMetrics(trades)).toEqual({ total: 4, net: 95, winRate: 50, openCapital: 200 });
  });
});

describe("countByStatus", () => {
  test("counts every status plus the total", () => {
    const trades = [makeTrade(), makeTrade({ status: "open" }), makeTrade({ status: "open" })];
    expect(countByStatus(trades)).toEqual({ all: 3, open: 2, closed: 1, cancelled: 0 });
  });
});

describe("filterTrades", () => {
  const trades = [
    makeTrade({ id: "old", symbol: "COMI", entryDate: "2026-09-01" }),
    makeTrade({ id: "new", symbol: "HRHO", entryDate: "2026-10-05", status: "open" }),
    makeTrade({ id: "same-day-later", symbol: "ETEL", entryDate: "2026-10-05", updatedAt: "2026-10-06T00:00:00.000Z" }),
  ];

  test("sorts by entry date then last update, newest first", () => {
    expect(filterTrades(trades, "", "all").map((t) => t.id)).toEqual(["same-day-later", "new", "old"]);
  });

  test("filters by case-insensitive symbol search", () => {
    expect(filterTrades(trades, " hr ", "all").map((t) => t.id)).toEqual(["new"]);
  });

  test("filters by status", () => {
    expect(filterTrades(trades, "", "open").map((t) => t.id)).toEqual(["new"]);
  });

  test("does not mutate the input array", () => {
    const snapshot = trades.map((t) => t.id);
    filterTrades(trades, "", "all");
    expect(trades.map((t) => t.id)).toEqual(snapshot);
  });
});
