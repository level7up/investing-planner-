import { z } from "zod";

const MAX_CAPITAL = 1_000_000_000_000;
const MAX_RISK_PERCENT = 100;

export type RiskSettings = { capital: number | null; riskPercent: number };

export type RiskSettingsFormValues = { capital: string; riskPercent: string };

export type SettingsParseResult = { ok: true; data: RiskSettings } | { ok: false; error: string };

export const DEFAULT_RISK_SETTINGS: RiskSettings = { capital: null, riskPercent: 1 };

const riskSettingsSchema = z.object({
  capital: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : Number(value)))
    .pipe(z.number({ error: "رأس المال غير صالح" }).positive("رأس المال لازم يكون أكبر من صفر").max(MAX_CAPITAL).nullable()),
  riskPercent: z
    .string({ error: "نسبة المخاطرة مطلوبة" })
    .trim()
    .min(1, "نسبة المخاطرة مطلوبة")
    .transform(Number)
    .pipe(
      z
        .number({ error: "نسبة المخاطرة غير صالحة" })
        .positive("نسبة المخاطرة لازم تكون أكبر من صفر")
        .max(MAX_RISK_PERCENT, "نسبة المخاطرة لا تتعدى 100٪"),
    ),
});

export function parseRiskSettings(input: unknown): SettingsParseResult {
  const result = riskSettingsSchema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, error: result.error.issues[0]?.message ?? "إعدادات غير صالحة" };
}

export function settingsToFormValues(settings: RiskSettings): RiskSettingsFormValues {
  return {
    capital: settings.capital === null ? "" : String(settings.capital),
    riskPercent: String(settings.riskPercent),
  };
}
