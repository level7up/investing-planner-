"use server";

import { revalidatePath } from "next/cache";
import { parseRiskSettings } from "@/lib/settings/schema";
import type { ActionResult } from "@/lib/trades/types";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export async function saveRiskSettings(values: unknown): Promise<ActionResult> {
  const parsed = parseRiskSettings(values);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) return { ok: false, error: "انتهت الجلسة. سجّل الدخول مرة أخرى." };

  const { error } = await supabase
    .from("risk_settings")
    .upsert({ user_id: user.id, capital: parsed.data.capital, risk_percent: parsed.data.riskPercent });
  if (error) {
    console.error("Saving risk settings failed", { code: error.code, message: error.message });
    return { ok: false, error: "تعذّر حفظ الإعدادات. حاول مرة أخرى." };
  }
  revalidatePath("/");
  return { ok: true };
}
