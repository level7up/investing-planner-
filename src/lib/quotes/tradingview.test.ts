import { describe, expect, test } from "vitest";
import { buildScanRequest, normaliseSymbols, parseScanResponse } from "./tradingview";

describe("normaliseSymbols", () => {
  test("uppercases, trims, dedupes and sorts", () => {
    expect(normaliseSymbols([" comi", "HRHO", "COMI", "etel "])).toEqual(["COMI", "ETEL", "HRHO"]);
  });

  test("drops values that are not ticker-like", () => {
    expect(normaliseSymbols(["", "EGX:COMI", "بنك", "A B", "X".repeat(21), "ORAS.CA"])).toEqual(["ORAS.CA"]);
  });
});

describe("buildScanRequest", () => {
  test("prefixes the EGX exchange and asks for price and change", () => {
    expect(buildScanRequest(["COMI", "HRHO"])).toEqual({
      symbols: { tickers: ["EGX:COMI", "EGX:HRHO"] },
      columns: ["close", "change"],
    });
  });
});

describe("parseScanResponse", () => {
  test("maps rows to quotes keyed by symbol", () => {
    const quotes = parseScanResponse({
      totalCount: 2,
      data: [
        { s: "EGX:COMI", d: [123.87, -0.88] },
        { s: "EGX:HRHO", d: [24.43, null] },
      ],
    });
    expect(quotes).toEqual({
      COMI: { symbol: "COMI", price: 123.87, changePercent: -0.88 },
      HRHO: { symbol: "HRHO", price: 24.43, changePercent: null },
    });
  });

  test("skips rows without a usable price", () => {
    const quotes = parseScanResponse({
      data: [
        { s: "EGX:ZERO", d: [0, 1] },
        { s: "EGX:TEXT", d: ["12", 1] },
        { s: "EGX:EMPTY", d: [] },
        { s: "EGX:OK", d: [5, "x"] },
      ],
    });
    expect(Object.keys(quotes)).toEqual(["OK"]);
    expect(quotes.OK.changePercent).toBeNull();
  });

  test("returns no quotes for malformed payloads", () => {
    expect(parseScanResponse(null)).toEqual({});
    expect(parseScanResponse({ data: "nope" })).toEqual({});
    expect(parseScanResponse({ data: [{ s: 1, d: [1] }] })).toEqual({});
  });
});
