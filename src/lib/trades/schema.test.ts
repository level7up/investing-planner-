import { describe, expect, test } from "vitest";
import { parseTradeInput, parseTradeId } from "./schema";
import type { TradeFormValues } from "./types";

const validInput: TradeFormValues = {
  entryDate: "2026-10-01",
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
        entryDate: "2026-10-01",
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

  test("accepts a closed trade with a sell price", () => {
    const result = parseTradeInput({ ...validInput, status: "closed", sellPrice: "11" });
    expect(result.ok && result.data.sellPrice).toBe(11);
  });

  test.each([
    ["empty symbol", { symbol: "  " }],
    ["long symbol", { symbol: "X".repeat(31) }],
    ["zero buy price", { buyPrice: "0" }],
    ["fractional quantity", { quantity: "1.5" }],
    ["negative fees", { fees: "-1" }],
    ["invalid date", { entryDate: "2026-13-45" }],
    ["unknown status", { status: "pending" }],
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
