import { describe, expect, test } from "vitest";
import { makeGold } from "@/lib/testing/fixtures";
import { emptyGoldForm, goldToFormValues, parseGoldInput, parseGoldPrices } from "./schema";
import type { GoldFormValues } from "./types";

const valid: GoldFormValues = {
  purchaseDate: "2026-10-04",
  kind: "jewelry",
  karat: "21",
  grams: "12.5",
  pricePerGram: "3000",
  makingFee: "",
  status: "held",
  soldDate: "2026-10-09",
  salePricePerGram: "3100",
  saleFees: "50",
  notes: " ring ",
};

describe("parseGoldInput", () => {
  test("parses held gold and drops sale fields", () => {
    expect(parseGoldInput(valid)).toEqual({
      ok: true,
      data: {
        purchaseDate: "2026-10-04",
        kind: "jewelry",
        karat: 21,
        grams: 12.5,
        pricePerGram: 3000,
        makingFee: 0,
        status: "held",
        soldDate: null,
        salePricePerGram: null,
        saleFees: 0,
        notes: "ring",
      },
    });
  });

  test("keeps sale fields for sold gold", () => {
    const result = parseGoldInput({ ...valid, status: "sold" });
    expect(result.ok && result.data).toMatchObject({ soldDate: "2026-10-09", salePricePerGram: 3100, saleFees: 50 });
  });

  test.each([
    ["sold without date", { status: "sold", soldDate: "" }],
    ["sold without price", { status: "sold", salePricePerGram: "" }],
    ["sold before purchase", { status: "sold", soldDate: "2026-10-01" }],
    ["unsupported karat", { karat: "22" }],
    ["zero grams", { grams: "0" }],
    ["unknown kind", { kind: "ring" }],
    ["bad date", { purchaseDate: "2026-02-30" }],
  ])("rejects %s", (_label, override) => {
    expect(parseGoldInput({ ...valid, ...override }).ok).toBe(false);
  });
});

describe("gold form values", () => {
  test("round-trips a holding through the form", () => {
    const holding = makeGold({ status: "sold", soldDate: "2026-10-06", salePricePerGram: 3300, saleFees: 20 });
    const { id: _id, updatedAt: _updatedAt, ...expected } = holding;
    expect(parseGoldInput(goldToFormValues(holding))).toEqual({ ok: true, data: expected });
  });

  test("empty form defaults to a held 21 karat purchase today", () => {
    expect(emptyGoldForm("2026-10-19")).toMatchObject({ purchaseDate: "2026-10-19", karat: "21", status: "held", kind: "bar" });
  });
});

describe("parseGoldPrices", () => {
  test("parses optional per-karat prices", () => {
    expect(parseGoldPrices({ price24: "", price21: "3500", price18: " " })).toEqual({
      ok: true,
      data: { price24: null, price21: 3500, price18: null },
    });
  });

  test("rejects negative prices", () => {
    expect(parseGoldPrices({ price24: "-1", price21: "", price18: "" }).ok).toBe(false);
  });
});
