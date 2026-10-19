import { z } from "zod";
import { todayISO } from "@/lib/trades/format";
import {
  boundedText,
  nonNegativeNumber,
  optionalDate,
  optionalNumber,
  requiredDate,
  requiredNumber,
  toParsed,
  type Parsed,
} from "@/lib/validation";
import {
  GOLD_KARATS,
  GOLD_KINDS,
  GOLD_STATUSES,
  type GoldFormValues,
  type GoldHolding,
  type GoldPriceFormValues,
  type GoldPrices,
} from "./types";

const MAX_NOTES_LENGTH = 2000;
const KARAT_VALUES = GOLD_KARATS.map(String) as [string, ...string[]];

export type GoldInput = Omit<GoldHolding, "id" | "updatedAt">;
export type GoldPricesInput = Omit<GoldPrices, "updatedAt">;

const goldInputSchema = z
  .object({
    purchaseDate: requiredDate("تاريخ الشراء"),
    kind: z.enum(GOLD_KINDS, { error: "نوع الذهب غير صالح" }),
    karat: z.enum(KARAT_VALUES, { error: "العيار غير مدعوم" }).transform((value) => Number(value) as GoldHolding["karat"]),
    grams: requiredNumber("الوزن بالجرام"),
    pricePerGram: requiredNumber("سعر الجرام"),
    makingFee: nonNegativeNumber("المصنعية"),
    status: z.enum(GOLD_STATUSES, { error: "الحالة غير صالحة" }),
    soldDate: optionalDate("تاريخ البيع"),
    salePricePerGram: optionalNumber("سعر بيع الجرام"),
    saleFees: nonNegativeNumber("خصومات البيع"),
    notes: boundedText(MAX_NOTES_LENGTH, "الملاحظات طويلة جدًا"),
  })
  .refine((gold) => gold.status !== "sold" || gold.soldDate !== null, { message: "تاريخ البيع مطلوب", path: ["soldDate"] })
  .refine((gold) => gold.status !== "sold" || gold.salePricePerGram !== null, {
    message: "سعر بيع الجرام مطلوب",
    path: ["salePricePerGram"],
  })
  .refine((gold) => gold.status !== "sold" || gold.soldDate === null || gold.soldDate >= gold.purchaseDate, {
    message: "تاريخ البيع لا يمكن أن يسبق تاريخ الشراء",
    path: ["soldDate"],
  })
  .transform((gold) => (gold.status === "sold" ? gold : { ...gold, soldDate: null, salePricePerGram: null, saleFees: 0 }));

const goldPricesSchema = z.object({
  price24: optionalNumber("سعر عيار 24"),
  price21: optionalNumber("سعر عيار 21"),
  price18: optionalNumber("سعر عيار 18"),
});

const toField = (value: number | null): string => (value === null ? "" : String(value));

export function parseGoldInput(input: unknown): Parsed<GoldInput> {
  return toParsed(goldInputSchema.safeParse(input), "بيانات الذهب غير صالحة");
}

export function parseGoldPrices(input: unknown): Parsed<GoldPricesInput> {
  return toParsed(goldPricesSchema.safeParse(input), "الأسعار غير صالحة");
}

export function emptyGoldForm(today: string = todayISO()): GoldFormValues {
  return {
    purchaseDate: today,
    kind: "bar",
    karat: "21",
    grams: "",
    pricePerGram: "",
    makingFee: "0",
    status: "held",
    soldDate: "",
    salePricePerGram: "",
    saleFees: "0",
    notes: "",
  };
}

export function goldToFormValues(holding: GoldHolding): GoldFormValues {
  return {
    purchaseDate: holding.purchaseDate,
    kind: holding.kind,
    karat: String(holding.karat),
    grams: String(holding.grams),
    pricePerGram: String(holding.pricePerGram),
    makingFee: String(holding.makingFee),
    status: holding.status,
    soldDate: holding.soldDate ?? "",
    salePricePerGram: toField(holding.salePricePerGram),
    saleFees: String(holding.saleFees),
    notes: holding.notes,
  };
}

export function pricesToFormValues(prices: GoldPrices): GoldPriceFormValues {
  return { price24: toField(prices.price24), price21: toField(prices.price21), price18: toField(prices.price18) };
}
