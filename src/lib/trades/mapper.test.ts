import { describe, expect, test } from "vitest";
import { fromRow, toRow } from "./mapper";

describe("fromRow", () => {
  test("maps a database row to a trade and coerces numerics", () => {
    const trade = fromRow({
      id: "id-1",
      entry_date: "2026-10-01",
      symbol: "COMI",
      status: "closed",
      buy_price: "10.5",
      quantity: 100,
      stop_loss: null,
      target_price: "12",
      sell_price: 11,
      fees: "0",
      reason: "note",
      updated_at: "2026-10-01T10:00:00Z",
    });
    expect(trade).toEqual({
      id: "id-1",
      entryDate: "2026-10-01",
      symbol: "COMI",
      status: "closed",
      buyPrice: 10.5,
      quantity: 100,
      stopLoss: null,
      targetPrice: 12,
      sellPrice: 11,
      fees: 0,
      reason: "note",
      updatedAt: "2026-10-01T10:00:00Z",
    });
  });

  test("falls back to safe defaults for an unknown status and missing reason", () => {
    const trade = fromRow({
      id: "id-2",
      entry_date: "2026-10-01",
      symbol: "X",
      status: "weird",
      buy_price: 1,
      quantity: 1,
      stop_loss: null,
      target_price: null,
      sell_price: null,
      fees: 0,
      reason: null,
      updated_at: "2026-10-01T10:00:00Z",
    });
    expect(trade.status).toBe("open");
    expect(trade.reason).toBe("");
  });
});

describe("toRow", () => {
  test("maps validated input to snake case columns", () => {
    expect(
      toRow({
        entryDate: "2026-10-01",
        symbol: "COMI",
        status: "open",
        buyPrice: 10,
        quantity: 5,
        stopLoss: null,
        targetPrice: 12,
        sellPrice: null,
        fees: 1,
        reason: "",
      }),
    ).toEqual({
      entry_date: "2026-10-01",
      symbol: "COMI",
      status: "open",
      buy_price: 10,
      quantity: 5,
      stop_loss: null,
      target_price: 12,
      sell_price: null,
      fees: 1,
      reason: "",
    });
  });
});
