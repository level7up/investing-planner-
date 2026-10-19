import { z } from "zod";
import { TRADE_STATUSES, type Trade } from "./types";

const MAX_AMOUNT = 1_000_000_000_000;
const MAX_SYMBOL_LENGTH = 30;
const MAX_REASON_LENGTH = 2000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type TradeInput = Omit<Trade, "id" | "updatedAt">;

export type ParseResult = { ok: true; data: TradeInput } | { ok: false; error: string };

const isRealDate = (value: string): boolean => {
  if (!ISO_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
};

const requiredNumber = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} مطلوب`)
    .transform(Number)
    .pipe(z.number({ error: `${label} غير صالح` }).positive(`${label} لازم يكون أكبر من صفر`).max(MAX_AMOUNT));

const optionalNumber = (label: string) =>
  z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : Number(value)))
    .pipe(z.number({ error: `${label} غير صالح` }).positive(`${label} لازم يكون أكبر من صفر`).max(MAX_AMOUNT).nullable());

const tradeInputSchema = z
  .object({
    entryDate: z.string().refine(isRealDate, "تاريخ الدخول غير صالح"),
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
    fees: z
      .string()
      .trim()
      .transform((value) => (value === "" ? 0 : Number(value)))
      .pipe(z.number({ error: "الرسوم غير صالحة" }).min(0, "الرسوم لا يمكن أن تكون سالبة").max(MAX_AMOUNT)),
    reason: z.string().trim().max(MAX_REASON_LENGTH, "الملاحظات طويلة جدًا"),
  })
  .refine((trade) => trade.status !== "closed" || trade.sellPrice !== null, {
    message: "سعر البيع مطلوب للصفقة المغلقة",
    path: ["sellPrice"],
  });

export function parseTradeInput(input: unknown): ParseResult {
  const result = tradeInputSchema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, error: result.error.issues[0]?.message ?? "بيانات الصفقة غير صالحة" };
}

export function parseTradeId(input: unknown): string | null {
  const result = z.uuid().safeParse(input);
  return result.success ? result.data : null;
}
