import type { CashInput } from "./schema";
import type { CashEntry } from "./types";

export type CashRow = {
  id: string;
  occurred_on: string;
  kind: string;
  amount: number | string;
  note: string | null;
};

export const CASH_COLUMNS = "id, occurred_on, kind, amount, note";

export function cashFromRow(row: CashRow): CashEntry {
  return {
    id: row.id,
    occurredOn: row.occurred_on,
    kind: row.kind === "withdrawal" ? "withdrawal" : "deposit",
    amount: Number(row.amount),
    note: row.note ?? "",
  };
}

export function cashToRow(input: CashInput) {
  return { occurred_on: input.occurredOn, kind: input.kind, amount: input.amount, note: input.note };
}
