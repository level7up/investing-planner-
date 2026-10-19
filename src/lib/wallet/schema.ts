import { z } from "zod";
import { todayISO } from "@/lib/trades/format";
import { boundedText, requiredDate, requiredNumber, toParsed, type Parsed } from "@/lib/validation";
import { CASH_KINDS, type CashEntry, type CashFormValues, type CashKind } from "./types";

const MAX_NOTE_LENGTH = 500;

export type CashInput = Omit<CashEntry, "id">;

const cashInputSchema = z.object({
  occurredOn: requiredDate("التاريخ"),
  kind: z.enum(CASH_KINDS, { error: "نوع العملية غير صالح" }),
  amount: requiredNumber("المبلغ"),
  note: boundedText(MAX_NOTE_LENGTH, "الملاحظة طويلة جدًا"),
});

export function parseCashInput(input: unknown): Parsed<CashInput> {
  return toParsed(cashInputSchema.safeParse(input), "بيانات العملية غير صالحة");
}

export function emptyCashForm(kind: CashKind, today: string = todayISO()): CashFormValues {
  return { occurredOn: today, kind, amount: "", note: "" };
}
