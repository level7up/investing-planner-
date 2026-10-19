import { describe, expect, test } from "vitest";
import { makeCash, makeGold, makeTrade } from "@/lib/testing/fixtures";
import { cashBalance, tradeCashOutflow, walletMovements } from "./calc";

const sources = {
  entries: [makeCash(), makeCash({ id: "w1", kind: "withdrawal", amount: 500, occurredOn: "2026-10-07" })],
  trades: [
    makeTrade({ id: "open", entryDate: "2026-10-02", fees: 10 }),
    makeTrade({ id: "closed", symbol: "HRHO", entryDate: "2026-10-03", exitDate: "2026-10-05", status: "closed", buyPrice: 20, quantity: 50, sellPrice: 22 }),
    makeTrade({ id: "cancelled", status: "cancelled", buyPrice: 999 }),
  ],
  gold: [
    makeGold({ id: "held" }),
    makeGold({ id: "sold", grams: 2, makingFee: 100, status: "sold", soldDate: "2026-10-06", salePricePerGram: 3300 }),
  ],
};

describe("tradeCashOutflow", () => {
  test("is purchase value plus fees, and zero for cancelled trades", () => {
    expect(tradeCashOutflow(makeTrade({ fees: 10 }))).toBe(1010);
    expect(tradeCashOutflow(makeTrade({ status: "cancelled" }))).toBe(0);
  });
});

describe("cashBalance", () => {
  test("nets deposits, withdrawals, trades and gold", () => {
    expect(cashBalance(sources)).toBe(68590);
  });

  test("is zero with no activity", () => {
    expect(cashBalance({ entries: [], trades: [], gold: [] })).toBe(0);
  });
});

describe("walletMovements", () => {
  const movements = walletMovements(sources);

  test("lists every cash movement newest first with a running balance", () => {
    expect(movements).toHaveLength(8);
    expect(movements[0]).toMatchObject({ kind: "withdrawal", amount: -500, balance: 68590, isManual: true });
    expect(movements.at(-1)).toMatchObject({ kind: "deposit", amount: 100000, balance: 100000 });
  });

  test("records trade buys and sells on their own dates", () => {
    expect(movements.filter((m) => m.refId === "closed").map((m) => [m.kind, m.date, m.amount])).toEqual([
      ["sell", "2026-10-05", 1100],
      ["buy", "2026-10-03", -1000],
    ]);
  });

  test("records gold purchases and sales", () => {
    expect(movements.filter((m) => m.refId === "sold").map((m) => [m.kind, m.amount])).toEqual([
      ["gold-sell", 6600],
      ["gold-buy", -6100],
    ]);
  });

  test("applies same-day deposits before purchases", () => {
    const sameDay = walletMovements({
      entries: [makeCash({ amount: 2000 })],
      trades: [makeTrade({ id: "x", entryDate: "2026-10-01" })],
      gold: [],
    });
    expect(sameDay.map((m) => m.balance)).toEqual([1000, 2000]);
  });

  test("falls back to the entry date for closed trades without an exit date", () => {
    const sell = walletMovements({
      entries: [],
      trades: [makeTrade({ status: "closed", sellPrice: 11, exitDate: null })],
      gold: [],
    }).find((m) => m.kind === "sell");
    expect(sell).toMatchObject({ kind: "sell", date: "2026-10-01" });
  });
});
