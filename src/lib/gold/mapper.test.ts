import { describe, expect, test } from "vitest";
import { cashFromRow, cashToRow } from "@/lib/wallet/mapper";
import { goldFromRow, goldToRow, pricesFromRow, pricesToRow } from "./mapper";

const row = {
  id: "g1",
  purchase_date: "2026-10-04",
  kind: "coin",
  karat: "24",
  grams: "8.000",
  price_per_gram: "4000.00",
  making_fee: "150",
  status: "sold",
  sold_date: "2026-10-10",
  sale_price_per_gram: "4100",
  sale_fees: "0",
  notes: null,
  updated_at: "2026-10-10T00:00:00Z",
};

describe("gold mappers", () => {
  test("maps a row and coerces numerics", () => {
    expect(goldFromRow(row)).toEqual({
      id: "g1",
      purchaseDate: "2026-10-04",
      kind: "coin",
      karat: 24,
      grams: 8,
      pricePerGram: 4000,
      makingFee: 150,
      status: "sold",
      soldDate: "2026-10-10",
      salePricePerGram: 4100,
      saleFees: 0,
      notes: "",
      updatedAt: "2026-10-10T00:00:00Z",
    });
  });

  test("falls back to safe values for unknown kind, karat and status", () => {
    expect(goldFromRow({ ...row, kind: "nugget", karat: 22, status: "lost", sale_price_per_gram: null })).toMatchObject({
      kind: "bar",
      karat: 21,
      status: "held",
      salePricePerGram: null,
    });
  });

  test("maps input to columns", () => {
    const { id: _id, updatedAt: _updatedAt, ...input } = goldFromRow(row);
    expect(goldToRow(input)).toMatchObject({ purchase_date: "2026-10-04", karat: 24, sale_price_per_gram: 4100 });
  });

  test("maps prices with and without a row", () => {
    expect(pricesFromRow(null)).toEqual({ price24: null, price21: null, price18: null, updatedAt: null });
    expect(pricesFromRow({ price_24: "4000", price_21: null, price_18: 3000, updated_at: "x" })).toEqual({
      price24: 4000,
      price21: null,
      price18: 3000,
      updatedAt: "x",
    });
    expect(pricesToRow({ price24: 1, price21: null, price18: 2 })).toEqual({ price_24: 1, price_21: null, price_18: 2 });
  });
});

describe("cash mappers", () => {
  test("round-trips a cash entry", () => {
    const entry = cashFromRow({ id: "c1", occurred_on: "2026-10-01", kind: "withdrawal", amount: "250.5", note: null });
    expect(entry).toEqual({ id: "c1", occurredOn: "2026-10-01", kind: "withdrawal", amount: 250.5, note: "" });
    expect(cashToRow(entry)).toEqual({ occurred_on: "2026-10-01", kind: "withdrawal", amount: 250.5, note: "" });
    expect(cashFromRow({ id: "c2", occurred_on: "2026-10-01", kind: "?", amount: 1, note: "n" }).kind).toBe("deposit");
  });
});
