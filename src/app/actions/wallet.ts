"use server";

import { done, failed, getActionSession, INVALID_ID, SIGNED_OUT } from "@/lib/data/action";
import type { ActionResult } from "@/lib/trades/types";
import { parseUuid } from "@/lib/validation";
import { cashToRow } from "@/lib/wallet/mapper";
import { parseCashInput } from "@/lib/wallet/schema";

export async function addCashEntry(values: unknown): Promise<ActionResult> {
  const parsed = parseCashInput(values);
  if (!parsed.ok) return parsed;
  const session = await getActionSession();
  if (!session) return SIGNED_OUT;

  const { error } = await session.supabase
    .from("cash_transactions")
    .insert({ ...cashToRow(parsed.data), user_id: session.userId });
  return error ? failed("Cash insert", error) : done();
}

export async function deleteCashEntry(id: string): Promise<ActionResult> {
  const entryId = parseUuid(id);
  if (!entryId) return INVALID_ID;
  const session = await getActionSession();
  if (!session) return SIGNED_OUT;

  const { error } = await session.supabase.from("cash_transactions").delete().eq("id", entryId).eq("user_id", session.userId);
  return error ? failed("Cash delete", error) : done();
}
