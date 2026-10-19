"use server";

import { done, doneIfFound, failed, getActionSession, INVALID_ID, SIGNED_OUT } from "@/lib/data/action";
import { tradeToFormValues } from "@/lib/trades/form";
import { toRow } from "@/lib/trades/mapper";
import { parseTradeId, parseTradeInput } from "@/lib/trades/schema";
import type { ActionResult, Trade } from "@/lib/trades/types";

export async function saveTrade(id: string | null, values: unknown): Promise<ActionResult> {
  const parsed = parseTradeInput(values);
  if (!parsed.ok) return parsed;
  const tradeId = id === null ? null : parseTradeId(id);
  if (id !== null && tradeId === null) return INVALID_ID;

  const session = await getActionSession();
  if (!session) return SIGNED_OUT;
  const row = toRow(parsed.data);

  if (tradeId === null) {
    const { error } = await session.supabase.from("trades").insert({ ...row, user_id: session.userId });
    return error ? failed("Trade insert", error) : done();
  }

  const { data, error } = await session.supabase
    .from("trades")
    .update(row)
    .eq("id", tradeId)
    .eq("user_id", session.userId)
    .select("id");
  return error ? failed("Trade update", error) : doneIfFound(data);
}

export async function deleteTrade(id: string): Promise<ActionResult> {
  const tradeId = parseTradeId(id);
  if (!tradeId) return INVALID_ID;
  const session = await getActionSession();
  if (!session) return SIGNED_OUT;

  const { error } = await session.supabase.from("trades").delete().eq("id", tradeId).eq("user_id", session.userId);
  return error ? failed("Trade delete", error) : done();
}

export async function restoreTrade(trade: Trade): Promise<ActionResult> {
  const tradeId = parseTradeId(trade?.id);
  if (!tradeId) return INVALID_ID;
  const parsed = parseTradeInput(tradeToFormValues(trade));
  if (!parsed.ok) return parsed;
  const session = await getActionSession();
  if (!session) return SIGNED_OUT;

  const { error } = await session.supabase
    .from("trades")
    .insert({ ...toRow(parsed.data), id: tradeId, user_id: session.userId });
  return error ? failed("Trade restore", error) : done();
}
