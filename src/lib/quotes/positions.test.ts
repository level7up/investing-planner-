import { describe, expect, test } from "vitest";
import { makeTrade } from "@/lib/testing/fixtures";
import { livePosition, openMarketValue, openUnrealised } from "./positions";

const quotes = {
  COMI: { symbol: "COMI", price: 12, changePercent: 1.5 },
  HRHO: { symbol: "HRHO", price: 8.5, changePercent: -2 },
};

describe("livePosition", () => {
  test("values an open trade at the market price", () => {
    const trade = makeTrade({ stopLoss: 9, targetPrice: 15, fees: 10 });
    expect(livePosition(trade, quotes)).toEqual({
      price: 12,
      changePercent: 1.5,
      marketValue: 1200,
      unrealised: 190,
      unrealisedR: 1.73,
      toStopPercent: 25,
      toTargetPercent: 25,
      alert: null,
    });
  });

  test("flags a stop that has been hit", () => {
    const trade = makeTrade({ symbol: "HRHO", stopLoss: 9 });
    expect(livePosition(trade, quotes)?.alert).toBe("stop");
  });

  test("flags a target that has been reached", () => {
    expect(livePosition(makeTrade({ targetPrice: 12 }), quotes)?.alert).toBe("target");
  });

  test("leaves distances empty without stop or target", () => {
    expect(livePosition(makeTrade(), quotes)).toMatchObject({ toStopPercent: null, toTargetPercent: null, unrealisedR: null });
  });

  test("returns null for closed trades or symbols without a quote", () => {
    expect(livePosition(makeTrade({ status: "closed", sellPrice: 11 }), quotes)).toBeNull();
    expect(livePosition(makeTrade({ symbol: "NOPE" }), quotes)).toBeNull();
  });
});

describe("openMarketValue", () => {
  test("uses the quote when available and cost otherwise", () => {
    expect(openMarketValue(makeTrade(), quotes)).toBe(1200);
    expect(openMarketValue(makeTrade({ symbol: "NOPE" }), quotes)).toBe(1000);
  });
});

describe("openUnrealised", () => {
  test("sums unrealised results of priced open trades", () => {
    const trades = [
      makeTrade({ id: "a" }),
      makeTrade({ id: "b", symbol: "HRHO" }),
      makeTrade({ id: "c", symbol: "NOPE" }),
      makeTrade({ id: "d", status: "closed", sellPrice: 20 }),
    ];
    expect(openUnrealised(trades, quotes)).toEqual({ amount: 50, pricedCount: 2, openCount: 3 });
  });
});
