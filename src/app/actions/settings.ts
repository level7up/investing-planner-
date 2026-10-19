"use server";

import { done, failed, getActionSession, SIGNED_OUT } from "@/lib/data/action";
import { parseRiskSettings } from "@/lib/settings/schema";
import type { ActionResult } from "@/lib/trades/types";

export async function saveRiskSettings(values: unknown): Promise<ActionResult> {
  const parsed = parseRiskSettings(values);
  if (!parsed.ok) return parsed;
  const session = await getActionSession();
  if (!session) return SIGNED_OUT;

  const { error } = await session.supabase
    .from("risk_settings")
    .upsert({ user_id: session.userId, risk_percent: parsed.data.riskPercent });
  return error ? failed("Risk settings save", error) : done();
}
