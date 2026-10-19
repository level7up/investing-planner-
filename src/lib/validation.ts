import { z } from "zod";

export const MAX_AMOUNT = 1_000_000_000_000;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type Parsed<T> = { ok: true; data: T } | { ok: false; error: string };

export const isRealDate = (value: string): boolean => {
  if (!ISO_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
};

export const requiredDate = (label: string) => z.string().refine(isRealDate, `${label} غير صالح`);

export const optionalDate = (label: string) =>
  z
    .string()
    .trim()
    .refine((value) => value === "" || isRealDate(value), `${label} غير صالح`)
    .transform((value) => (value === "" ? null : value));

export const requiredNumber = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} مطلوب`)
    .transform(Number)
    .pipe(z.number({ error: `${label} غير صالح` }).positive(`${label} لازم يكون أكبر من صفر`).max(MAX_AMOUNT));

export const optionalNumber = (label: string) =>
  z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : Number(value)))
    .pipe(z.number({ error: `${label} غير صالح` }).positive(`${label} لازم يكون أكبر من صفر`).max(MAX_AMOUNT).nullable());

export const nonNegativeNumber = (label: string) =>
  z
    .string()
    .trim()
    .transform((value) => (value === "" ? 0 : Number(value)))
    .pipe(z.number({ error: `${label} غير صالح` }).min(0, `${label} لا يمكن أن تكون سالبة`).max(MAX_AMOUNT));

export const boundedText = (maxLength: number, message: string) => z.string().trim().max(maxLength, message);

export function toParsed<T>(result: z.ZodSafeParseResult<T>, fallback: string): Parsed<T> {
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, error: result.error.issues[0]?.message ?? fallback };
}

export function parseUuid(input: unknown): string | null {
  const result = z.uuid().safeParse(input);
  return result.success ? result.data : null;
}
