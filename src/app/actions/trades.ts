"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { tradeToFormValues } from "@/lib/trades/form";
import { toRow } from "@/lib/trades/mapper";
import { parseTradeId, parseTradeInput } from "@/lib/trades/schema";
import type { ActionResult, Trade } from "@/lib/trades/types";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

type Session = { supabase: SupabaseClient; userId: string };

const SIGNED_OUT: ActionResult = { ok: false, error: "انتهت الجلسة. سجّل الدخول مرة أخرى." };
const INVALID_ID: ActionResult = { ok: false, error: "معرّف الصفقة غير صالح" };
const NOT_FOUND: ActionResult = { ok: false, error: "الصفقة غير موجودة" };
const SAVE_FAILED: ActionResult = { ok: false, error: "تعذّر الحفظ. حاول مرة أخرى." };
const OK: ActionResult = { ok: true };

async function getSession(): Promise<Session | null> {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  return user ? { supabase, userId: user.id } : null;
}

function failed(operation: string, error: { code?: string; message: string }): ActionResult {
  console.error(`Trade ${operation} failed`, { code: error.code, message: error.message });
  return SAVE_FAILED;
}

function done(): ActionResult {
  revalidatePath("/");
  return OK;
}

export async function saveTrade(id: string | null, values: unknown): Promise<ActionResult> {
  const parsed = parseTradeInput(values);
  if (!parsed.ok) return parsed;
  const tradeId = id === null ? null : parseTradeId(id);
  if (id !== null && tradeId === null) return INVALID_ID;

  const session = await getSession();
  if (!session) return SIGNED_OUT;
  const row = toRow(parsed.data);

  if (tradeId === null) {
    const { error } = await session.supabase.from("trades").insert({ ...row, user_id: session.userId });
    return error ? failed("insert", error) : done();
  }

  const { data, error } = await session.supabase
    .from("trades")
    .update(row)
    .eq("id", tradeId)
    .eq("user_id", session.userId)
    .select("id");
  if (error) return failed("update", error);
  return data.length ? done() : NOT_FOUND;
}

export async function deleteTrade(id: string): Promise<ActionResult> {
  const tradeId = parseTradeId(id);
  if (!tradeId) return INVALID_ID;
  const session = await getSession();
  if (!session) return SIGNED_OUT;

  const { error } = await session.supabase.from("trades").delete().eq("id", tradeId).eq("user_id", session.userId);
  return error ? failed("delete", error) : done();
}

export async function restoreTrade(trade: Trade): Promise<ActionResult> {
  const tradeId = parseTradeId(trade?.id);
  if (!tradeId) return INVALID_ID;
  const parsed = parseTradeInput(tradeToFormValues(trade));
  if (!parsed.ok) return parsed;
  const session = await getSession();
  if (!session) return SIGNED_OUT;

  const { error } = await session.supabase
    .from("trades")
    .insert({ ...toRow(parsed.data), id: tradeId, user_id: session.userId });
  return error ? failed("restore", error) : done();
}
