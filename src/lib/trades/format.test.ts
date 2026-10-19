import { describe, expect, test } from "vitest";
import { emptyFormValues, tradeToFormValues } from "./form";
import {
  formatAmount,
  formatCompact,
  formatDate,
  formatInt,
  formatMoney,
  formatOptionalPrice,
  formatPercent,
  formatPrice,
  formatRatio,
  formatSignedPercent,
  formatRMultiple,
  formatSignedMoney,
  isolateLtr,
  todayISO,
  toneOf,
} from "./format";
import { parseTradeInput } from "./schema";
import type { Trade } from "./types";

describe("format helpers", () => {
  test("todayISO pads month and day", () => {
    expect(todayISO(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  test("formatDate returns a dash for invalid input", () => {
    expect(formatDate("not-a-date")).toBe("—");
    expect(formatDate("2026-10-01")).not.toBe("—");
  });

  test("formatOptionalPrice returns a dash for null", () => {
    expect(formatOptionalPrice(null)).toBe("—");
  });

  test("money uses western digits, two decimals and the currency after", () => {
    expect(formatMoney(152300)).toBe(`${isolateLtr("152,300.00")} ج.م`);
    expect(formatAmount(14.3)).toBe(isolateLtr("14.30"));
  });

  test("signed money keeps the sign attached to the number", () => {
    expect(formatSignedMoney(1234.5)).toBe(`${isolateLtr("+1,234.50")} ج.م`);
    expect(formatSignedMoney(-52.25)).toBe(`${isolateLtr("-52.25")} ج.م`);
    expect(formatSignedMoney(0)).toBe(`${isolateLtr("0.00")} ج.م`);
  });

  test("prices show two to four decimals", () => {
    expect(formatPrice(1.43)).toBe(isolateLtr("1.43"));
    expect(formatPrice(1.4375)).toBe(isolateLtr("1.4375"));
    expect(formatPrice(124)).toBe(isolateLtr("124.00"));
  });

  test("integers, percents, ratios and R multiples use western digits", () => {
    expect(formatInt(12500)).toBe(isolateLtr("12,500"));
    expect(formatPercent(47.619)).toBe(isolateLtr("47.62%"));
    expect(formatSignedPercent(2.247)).toBe(isolateLtr("+2.25%"));
    expect(formatRatio(2.6)).toBe(isolateLtr("2.6×"));
    expect(formatRMultiple(-0.5)).toBe(isolateLtr("-0.5R"));
  });

  test("compact axis labels", () => {
    expect(formatCompact(1500)).toBe(isolateLtr("1.5K"));
    expect(formatCompact(-500)).toBe(isolateLtr("-500"));
  });

  test("dates use Arabic months with western digits", () => {
    expect(formatDate("2026-10-19")).toMatch(/^19 .+ 2026$/);
  });

  test("toneOf classifies results", () => {
    expect(toneOf(1)).toBe("gain");
    expect(toneOf(-1)).toBe("loss");
    expect(toneOf(0)).toBe("");
  });
});

describe("form values", () => {
  test("emptyFormValues defaults to an open trade on the given day", () => {
    expect(emptyFormValues("2026-10-19")).toMatchObject({ entryDate: "2026-10-19", status: "open", fees: "0" });
  });

  test("tradeToFormValues round-trips through parseTradeInput", () => {
    const trade: Trade = {
      id: "6f1c2b8e-3d4a-4c5b-9e6f-7a8b9c0d1e2f",
      entryDate: "2026-10-01",
      assetType: "gold_fund",
      fundId: "5989",
      exitDate: "2026-10-05",
      symbol: "COMI",
      status: "closed",
      buyPrice: 10.25,
      quantity: 40,
      stopLoss: null,
      targetPrice: 12,
      sellPrice: 11,
      fees: 3.5,
      reason: "note",
      updatedAt: "2026-10-01T10:00:00Z",
    };
    const result = parseTradeInput(tradeToFormValues(trade));
    expect(result).toEqual({ ok: true, data: expect.objectContaining({ symbol: "COMI", buyPrice: 10.25, stopLoss: null, sellPrice: 11, fees: 3.5 }) });
  });
});

