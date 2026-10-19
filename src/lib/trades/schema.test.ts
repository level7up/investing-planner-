import { describe, expect, test } from "vitest";
import { parseTradeInput, parseTradeId } from "./schema";
import type { TradeFormValues } from "./types";

const validInput: TradeFormValues = {
  assetType: "stock",
  fundId: "",
  entryDate: "2026-10-01",
  exitDate: "2026-10-03",
  symbol: " comi ",
  status: "open",
  buyPrice: "10.5",
  quantity: "100",
  stopLoss: "",
  targetPrice: "12",
  sellPrice: "",
  fees: "",
  reason: "  breakout  ",
};

describe("parseTradeInput", () => {
  test("normalises a valid open trade", () => {
    const result = parseTradeInput(validInput);
    expect(result).toEqual({
      ok: true,
      data: {
        assetType: "stock",
        fundId: null,
        entryDate: "2026-10-01",
        exitDate: null,
        symbol: "COMI",
        status: "open",
        buyPrice: 10.5,
        quantity: 100,
        stopLoss: null,
        targetPrice: 12,
        sellPrice: null,
        fees: 0,
        reason: "breakout",
      },
    });
  });

  test("requires a sell price for closed trades", () => {
    const result = parseTradeInput({ ...validInput, status: "closed" });
    expect(result.ok).toBe(false);
  });

  test("accepts a closed trade with a sell price and keeps its exit date", () => {
    const result = parseTradeInput({ ...validInput, status: "closed", sellPrice: "11" });
    expect(result.ok && result.data).toMatchObject({ sellPrice: 11, exitDate: "2026-10-03" });
  });

  test("requires an exit date on or after entry for closed trades", () => {
    expect(parseTradeInput({ ...validInput, status: "closed", sellPrice: "11", exitDate: "" }).ok).toBe(false);
    expect(parseTradeInput({ ...validInput, status: "closed", sellPrice: "11", exitDate: "2026-09-30" }).ok).toBe(false);
  });

  test("accepts gold fund trades", () => {
    const result = parseTradeInput({ ...validInput, assetType: "gold_fund" });
    expect(result.ok && result.data.assetType).toBe("gold_fund");
  });

  test("links fund trades to a fund, keeps the name's case and allows fractional units", () => {
    const result = parseTradeInput({ ...validInput, assetType: "equity_fund", fundId: "5753", symbol: "Azimut Opportunities", quantity: "41.6235" });
    expect(result.ok && result.data).toMatchObject({ assetType: "equity_fund", fundId: "5753", symbol: "Azimut Opportunities", quantity: 41.6235 });
  });

  test("drops the fund link for stocks and rejects malformed fund ids", () => {
    const stock = parseTradeInput({ ...validInput, fundId: "5753" });
    expect(stock.ok && stock.data.fundId).toBeNull();
    expect(parseTradeInput({ ...validInput, assetType: "equity_fund", fundId: "12ab" }).ok).toBe(false);
    expect(parseTradeInput({ ...validInput, assetType: "equity_fund", quantity: "1.23456" }).ok).toBe(false);
    expect(parseTradeInput({ ...validInput, assetType: "equity_fund", quantity: "0.0007" }).ok).toBe(true);
    expect(parseTradeInput({ ...validInput, assetType: "equity_fund", quantity: "4.1003" }).ok).toBe(true);
  });

  test.each([
    ["empty symbol", { symbol: "  " }],
    ["long symbol", { symbol: "X".repeat(31) }],
    ["zero buy price", { buyPrice: "0" }],
    ["fractional quantity", { quantity: "1.5" }],
    ["negative fees", { fees: "-1" }],
    ["invalid date", { entryDate: "2026-13-45" }],
    ["unknown status", { status: "pending" }],
    ["unknown asset type", { assetType: "crypto" }],
    ["non numeric price", { stopLoss: "abc" }],
  ])("rejects %s", (_label, override) => {
    const result = parseTradeInput({ ...validInput, ...override });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.length).toBeGreaterThan(0);
  });

  test("rejects non object input", () => {
    expect(parseTradeInput(null).ok).toBe(false);
  });
});

describe("parseTradeId", () => {
  test("accepts a uuid", () => {
    expect(parseTradeId("6f1c2b8e-3d4a-4c5b-9e6f-7a8b9c0d1e2f")).toBe("6f1c2b8e-3d4a-4c5b-9e6f-7a8b9c0d1e2f");
  });

  test("rejects anything else", () => {
    expect(parseTradeId("1; drop table")).toBeNull();
    expect(parseTradeId(42)).toBeNull();
  });
});
