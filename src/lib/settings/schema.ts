import { z } from "zod";
import { toParsed, type Parsed } from "@/lib/validation";

const MAX_RISK_PERCENT = 100;

export type RiskSettings = { riskPercent: number };

export type RiskSettingsFormValues = { riskPercent: string };

export const DEFAULT_RISK_SETTINGS: RiskSettings = { riskPercent: 1 };

const riskSettingsSchema = z.object({
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

export function parseRiskSettings(input: unknown): Parsed<RiskSettings> {
  return toParsed(riskSettingsSchema.safeParse(input), "إعدادات غير صالحة");
}

export function settingsToFormValues(settings: RiskSettings): RiskSettingsFormValues {
  return { riskPercent: String(settings.riskPercent) };
}
