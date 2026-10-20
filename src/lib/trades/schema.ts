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
import { ASSET_TYPES, isFundAsset, TRADE_STATUSES, type Trade } from "./types";

const MAX_SYMBOL_LENGTH = 30;
const MAX_REASON_LENGTH = 2000;
const MAX_UNIT_DECIMALS = 4;
const FUND_ID = /^\d{1,10}$/;
const DECIMAL_TOLERANCE = 1e-6;

const hasAtMostDecimals = (value: number, decimals: number): boolean => {
  const scaled = value * 10 ** decimals;
  return Math.abs(scaled - Math.round(scaled)) < DECIMAL_TOLERANCE;
};

export type TradeInput = Omit<Trade, "id" | "updatedAt">;

export type ParseResult = Parsed<TradeInput>;

const tradeInputSchema = z
  .object({
    assetType: z.enum(ASSET_TYPES, { error: "نوع الأصل غير صالح" }),
    fundId: z
      .string()
      .trim()
      .refine((value) => value === "" || FUND_ID.test(value), "معرّف الصندوق غير صالح")
      .transform((value) => (value === "" ? null : value)),
    manualPrice: optionalNumber("السعر الحالي"),
    manualPriceDate: optionalDate("تاريخ السعر اليدوي"),
    entryDate: requiredDate("تاريخ الدخول"),
    exitDate: optionalDate("تاريخ الخروج"),
    symbol: z.string().trim().min(1, "رمز السهم أو اسم الصندوق مطلوب").max(MAX_SYMBOL_LENGTH, "الاسم طويل جدًا"),
    status: z.enum(TRADE_STATUSES, { error: "حالة الصفقة غير صالحة" }),
    buyPrice: requiredNumber("سعر الشراء"),
    quantity: requiredNumber("الكمية"),
    stopLoss: optionalNumber("وقف الخسارة"),
    targetPrice: optionalNumber("الهدف السعري"),
    sellPrice: optionalNumber("سعر البيع"),
    fees: nonNegativeNumber("الرسوم"),
    reason: boundedText(MAX_REASON_LENGTH, "الملاحظات طويلة جدًا"),
  })
  .refine((trade) => isFundAsset(trade.assetType) || Number.isInteger(trade.quantity), {
    message: "عدد الأسهم لازم يكون رقم صحيح",
    path: ["quantity"],
  })
  .refine((trade) => hasAtMostDecimals(trade.quantity, MAX_UNIT_DECIMALS), {
    message: `عدد الوثائق بحد أقصى ${MAX_UNIT_DECIMALS} أرقام عشرية`,
    path: ["quantity"],
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
  .refine((trade) => trade.status !== "open" || trade.manualPrice === null || trade.manualPriceDate !== null, {
    message: "تاريخ السعر اليدوي مطلوب",
    path: ["manualPriceDate"],
  })
  .transform((trade) => ({
    ...trade,
    manualPrice: trade.status === "open" ? trade.manualPrice : null,
    manualPriceDate: trade.status === "open" && trade.manualPrice !== null ? trade.manualPriceDate : null,
    exitDate: trade.status === "closed" ? trade.exitDate : null,
    fundId: isFundAsset(trade.assetType) ? trade.fundId : null,
    symbol: isFundAsset(trade.assetType) ? trade.symbol : trade.symbol.toUpperCase(),
  }));

export function parseTradeInput(input: unknown): ParseResult {
  return toParsed(tradeInputSchema.safeParse(input), "بيانات الصفقة غير صالحة");
}

export const parseTradeId = parseUuid;
