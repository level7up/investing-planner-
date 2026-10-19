"use server";

import { done, doneIfFound, failed, getActionSession, INVALID_ID, SIGNED_OUT } from "@/lib/data/action";
import { goldToRow, pricesToRow } from "@/lib/gold/mapper";
import { parseGoldInput, parseGoldPrices } from "@/lib/gold/schema";
import type { ActionResult } from "@/lib/trades/types";
import { parseUuid } from "@/lib/validation";

export async function saveGold(id: string | null, values: unknown): Promise<ActionResult> {
  const parsed = parseGoldInput(values);
  if (!parsed.ok) return parsed;
  const goldId = id === null ? null : parseUuid(id);
  if (id !== null && goldId === null) return INVALID_ID;

  const session = await getActionSession();
  if (!session) return SIGNED_OUT;
  const row = goldToRow(parsed.data);

  if (goldId === null) {
    const { error } = await session.supabase.from("gold_holdings").insert({ ...row, user_id: session.userId });
    return error ? failed("Gold insert", error) : done();
  }

  const { data, error } = await session.supabase
    .from("gold_holdings")
    .update(row)
    .eq("id", goldId)
    .eq("user_id", session.userId)
    .select("id");
  return error ? failed("Gold update", error) : doneIfFound(data);
}

export async function deleteGold(id: string): Promise<ActionResult> {
  const goldId = parseUuid(id);
  if (!goldId) return INVALID_ID;
  const session = await getActionSession();
  if (!session) return SIGNED_OUT;

  const { error } = await session.supabase.from("gold_holdings").delete().eq("id", goldId).eq("user_id", session.userId);
  return error ? failed("Gold delete", error) : done();
}

export async function saveGoldPrices(values: unknown): Promise<ActionResult> {
  const parsed = parseGoldPrices(values);
  if (!parsed.ok) return parsed;
  const session = await getActionSession();
  if (!session) return SIGNED_OUT;

  const { error } = await session.supabase
    .from("gold_prices")
    .upsert({ user_id: session.userId, ...pricesToRow(parsed.data) });
  return error ? failed("Gold prices save", error) : done();
}
