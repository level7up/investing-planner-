import { describe, expect, test } from "vitest";
import { makeGold, NO_GOLD_PRICES } from "@/lib/testing/fixtures";
import { goldCost, goldMarketValue, goldPricePerGram, goldProceeds, goldRealised, goldSummary } from "./calc";

const prices21 = { ...NO_GOLD_PRICES, price21: 3500 };

describe("goldCost and goldProceeds", () => {
  test("cost is grams times price plus making fee", () => {
    expect(goldCost(makeGold())).toBe(30500);
  });

  test("proceeds are grams times sale price minus sale fees", () => {
    expect(goldProceeds(makeGold({ status: "sold", soldDate: "2026-10-06", salePricePerGram: 3200, saleFees: 300 }))).toBe(31700);
  });

  test("held gold has no proceeds or realised result", () => {
    expect(goldProceeds(makeGold())).toBeNull();
    expect(goldRealised(makeGold())).toBeNull();
  });

  test("realised result is proceeds minus cost", () => {
    expect(goldRealised(makeGold({ status: "sold", soldDate: "2026-10-06", salePricePerGram: 3200, saleFees: 300 }))).toBe(1200);
  });
});

describe("goldPricePerGram", () => {
  test("uses the price entered for that karat", () => {
    expect(goldPricePerGram(21, prices21)).toBe(3500);
  });

  test("derives other karats by purity from the first available price", () => {
    expect(goldPricePerGram(18, prices21)).toBe(3000);
    expect(goldPricePerGram(24, prices21)).toBe(4000);
    expect(goldPricePerGram(21, { ...NO_GOLD_PRICES, price24: 4000 })).toBe(3500);
  });

  test("returns null when no price is known", () => {
    expect(goldPricePerGram(21, NO_GOLD_PRICES)).toBeNull();
  });
});

describe("goldMarketValue", () => {
  test("values held gold at today's gram price", () => {
    expect(goldMarketValue(makeGold(), prices21)).toBe(35000);
  });

  test("returns null without a price or for sold gold", () => {
    expect(goldMarketValue(makeGold(), NO_GOLD_PRICES)).toBeNull();
    expect(goldMarketValue(makeGold({ status: "sold", soldDate: "2026-10-06", salePricePerGram: 3300 }), prices21)).toBeNull();
  });
});

describe("goldSummary", () => {
  const holdings = [
    makeGold({ id: "a" }),
    makeGold({ id: "b", karat: 24, grams: 5, pricePerGram: 4000, makingFee: 0 }),
    makeGold({ id: "c", grams: 2, makingFee: 100, status: "sold", soldDate: "2026-10-06", salePricePerGram: 3300 }),
  ];

  test("aggregates grams, cost, value and results", () => {
    expect(goldSummary(holdings, prices21)).toEqual({
      gramsByKarat: { 24: 5, 21: 10, 18: 0 },
      heldCost: 50500,
      heldValue: 55000,
      unrealised: 4500,
      realised: 500,
      hasUnpricedHoldings: false,
    });
  });

  test("falls back to cost and flags unpriced holdings when no price is set", () => {
    expect(goldSummary(holdings, NO_GOLD_PRICES)).toMatchObject({ heldValue: 50500, unrealised: 0, hasUnpricedHoldings: true });
  });
});
