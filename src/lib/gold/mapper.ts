import type { GoldInput, GoldPricesInput } from "./schema";
import { GOLD_KARATS, GOLD_KINDS, type GoldHolding, type GoldKarat, type GoldPrices } from "./types";

type Numeric = number | string;

export type GoldRow = {
  id: string;
  purchase_date: string;
  kind: string;
  karat: Numeric;
  grams: Numeric;
  price_per_gram: Numeric;
  making_fee: Numeric;
  status: string;
  sold_date: string | null;
  sale_price_per_gram: Numeric | null;
  sale_fees: Numeric;
  notes: string | null;
  updated_at: string;
};

export type GoldPricesRow = {
  price_24: Numeric | null;
  price_21: Numeric | null;
  price_18: Numeric | null;
  updated_at: string;
};

export const GOLD_COLUMNS =
  "id, purchase_date, kind, karat, grams, price_per_gram, making_fee, status, sold_date, sale_price_per_gram, sale_fees, notes, updated_at";

export const GOLD_PRICE_COLUMNS = "price_24, price_21, price_18, updated_at";

const toNullableNumber = (value: Numeric | null): number | null => (value === null ? null : Number(value));

const toKarat = (value: Numeric): GoldKarat => {
  const karat = Number(value);
  return (GOLD_KARATS as readonly number[]).includes(karat) ? (karat as GoldKarat) : 21;
};

export function goldFromRow(row: GoldRow): GoldHolding {
  return {
    id: row.id,
    purchaseDate: row.purchase_date,
    kind: (GOLD_KINDS as readonly string[]).includes(row.kind) ? (row.kind as GoldHolding["kind"]) : "bar",
    karat: toKarat(row.karat),
    grams: Number(row.grams),
    pricePerGram: Number(row.price_per_gram),
    makingFee: Number(row.making_fee),
    status: row.status === "sold" ? "sold" : "held",
    soldDate: row.sold_date,
    salePricePerGram: toNullableNumber(row.sale_price_per_gram),
    saleFees: Number(row.sale_fees),
    notes: row.notes ?? "",
    updatedAt: row.updated_at,
  };
}

export function goldToRow(input: GoldInput) {
  return {
    purchase_date: input.purchaseDate,
    kind: input.kind,
    karat: input.karat,
    grams: input.grams,
    price_per_gram: input.pricePerGram,
    making_fee: input.makingFee,
    status: input.status,
    sold_date: input.soldDate,
    sale_price_per_gram: input.salePricePerGram,
    sale_fees: input.saleFees,
    notes: input.notes,
  };
}

export function pricesFromRow(row: GoldPricesRow | null): GoldPrices {
  if (!row) return { price24: null, price21: null, price18: null, updatedAt: null };
  return {
    price24: toNullableNumber(row.price_24),
    price21: toNullableNumber(row.price_21),
    price18: toNullableNumber(row.price_18),
    updatedAt: row.updated_at,
  };
}

export function pricesToRow(input: GoldPricesInput) {
  return { price_24: input.price24, price_21: input.price21, price_18: input.price18 };
}
