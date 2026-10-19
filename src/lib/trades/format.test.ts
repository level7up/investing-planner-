import { describe, expect, test } from "vitest";
import { emptyFormValues, tradeToFormValues } from "./form";
import { formatDate, formatOptionalPrice, formatSignedMoney, todayISO, toneOf } from "./format";
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

  test("formatSignedMoney includes the currency", () => {
    expect(formatSignedMoney(5)).toContain("ج.م");
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
