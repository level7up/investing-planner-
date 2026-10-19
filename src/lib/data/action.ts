import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/trades/types";

export type ActionSession = { supabase: SupabaseClient; userId: string };

export const SIGNED_OUT: ActionResult = { ok: false, error: "انتهت الجلسة. سجّل الدخول مرة أخرى." };
export const INVALID_ID: ActionResult = { ok: false, error: "المعرّف غير صالح" };
export const NOT_FOUND: ActionResult = { ok: false, error: "العنصر غير موجود" };
const SAVE_FAILED: ActionResult = { ok: false, error: "تعذّر الحفظ. حاول مرة أخرى." };

export async function getActionSession(): Promise<ActionSession | null> {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  return user ? { supabase, userId: user.id } : null;
}

export function failed(operation: string, error: { code?: string; message: string }): ActionResult {
  console.error(`${operation} failed: [${error.code}] ${error.message}`);
  return SAVE_FAILED;
}

export function done(): ActionResult {
  revalidatePath("/", "layout");
  return { ok: true };
}

export function doneIfFound(rows: readonly unknown[]): ActionResult {
  return rows.length ? done() : NOT_FOUND;
}
