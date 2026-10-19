import { z } from "zod";
import {
  boundedText,
  nonNegativeNumber,
  optionalDate,
  optionalNumber,
  parseUuid,
  requiredDate,
  requiredNumber,
  toParsed,
  type Parsed,
} from "@/lib/validation";
import { ASSET_TYPES, TRADE_STATUSES, type Trade } from "./types";

const MAX_SYMBOL_LENGTH = 30;
const MAX_REASON_LENGTH = 2000;

export type TradeInput = Omit<Trade, "id" | "updatedAt">;

export type ParseResult = Parsed<TradeInput>;

const tradeInputSchema = z
  .object({
    assetType: z.enum(ASSET_TYPES, { error: "نوع الأصل غير صالح" }),
    entryDate: requiredDate("تاريخ الدخول"),
    exitDate: optionalDate("تاريخ الخروج"),
    symbol: z
      .string()
      .trim()
      .min(1, "رمز السهم مطلوب")
      .max(MAX_SYMBOL_LENGTH, "رمز السهم طويل جدًا")
      .transform((value) => value.toUpperCase()),
    status: z.enum(TRADE_STATUSES, { error: "حالة الصفقة غير صالحة" }),
    buyPrice: requiredNumber("سعر الشراء"),
    quantity: requiredNumber("عدد الأسهم").pipe(z.number().int("عدد الأسهم لازم يكون رقم صحيح")),
    stopLoss: optionalNumber("وقف الخسارة"),
    targetPrice: optionalNumber("الهدف السعري"),
    sellPrice: optionalNumber("سعر البيع"),
    fees: nonNegativeNumber("الرسوم"),
    reason: boundedText(MAX_REASON_LENGTH, "الملاحظات طويلة جدًا"),
  })
  .refine((trade) => trade.status !== "closed" || trade.sellPrice !== null, {
    message: "سعر البيع مطلوب للصفقة المغلقة",
    path: ["sellPrice"],
  })
  .refine((trade) => trade.status !== "closed" || trade.exitDate !== null, {
    message: "تاريخ الخروج مطلوب للصفقة المغلقة",
    path: ["exitDate"],
  })
  .refine((trade) => trade.status !== "closed" || trade.exitDate === null || trade.exitDate >= trade.entryDate, {
    message: "تاريخ الخروج لا يمكن أن يسبق تاريخ الدخول",
    path: ["exitDate"],
  })
  .transform((trade) => (trade.status === "closed" ? trade : { ...trade, exitDate: null }));

export function parseTradeInput(input: unknown): ParseResult {
  return toParsed(tradeInputSchema.safeParse(input), "بيانات الصفقة غير صالحة");
}

export const parseTradeId = parseUuid;
