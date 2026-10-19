import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_RISK_SETTINGS, type RiskSettings } from "./schema";

type RiskSettingsRow = { capital: number | string | null; risk_percent: number | string };

export async function loadRiskSettings(supabase: SupabaseClient, userId: string): Promise<RiskSettings> {
  const { data, error } = await supabase
    .from("risk_settings")
    .select("capital, risk_percent")
    .eq("user_id", userId)
    .maybeSingle<RiskSettingsRow>();
  if (error) {
    console.error("Loading risk settings failed", { code: error.code, message: error.message });
    return DEFAULT_RISK_SETTINGS;
  }
  if (!data) return DEFAULT_RISK_SETTINGS;
  return {
    capital: data.capital === null ? null : Number(data.capital),
    riskPercent: Number(data.risk_percent),
  };
}
