import { describe, expect, test } from "vitest";
import { fromRow, toRow } from "./mapper";

describe("fromRow", () => {
  test("maps a database row to a trade and coerces numerics", () => {
    const trade = fromRow({
      id: "id-1",
      asset_type: "gold_fund",
      fund_id: "5989",
      manual_price: "24.5",
      manual_price_date: "2026-10-19",
      entry_date: "2026-10-01",
      exit_date: "2026-10-04",
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
      assetType: "gold_fund",
      fundId: "5989",
      manualPrice: 24.5,
      manualPriceDate: "2026-10-19",
      entryDate: "2026-10-01",
      exitDate: "2026-10-04",
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
      asset_type: "bonds",
      fund_id: null,
      manual_price: null,
      manual_price_date: null,
      entry_date: "2026-10-01",
      exit_date: null,
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
    expect(trade.assetType).toBe("stock");
    expect(trade.reason).toBe("");
  });
});

describe("toRow", () => {
  test("maps validated input to snake case columns", () => {
    expect(
      toRow({
        assetType: "stock",
        fundId: null,
        manualPrice: 12.5,
        manualPriceDate: "2026-10-20",
        entryDate: "2026-10-01",
        exitDate: null,
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
      asset_type: "stock",
      fund_id: null,
      manual_price: 12.5,
      manual_price_date: "2026-10-20",
      entry_date: "2026-10-01",
      exit_date: null,
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
