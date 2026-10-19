"use client";

import { addCashEntry } from "@/app/actions/wallet";
import { formatMoney } from "@/lib/trades/format";
import { emptyCashForm } from "@/lib/wallet/schema";
import { CASH_KIND_LABELS, CASH_KINDS, type CashFormValues, type CashKind } from "@/lib/wallet/types";
import { DateField, NotesField, NumberField, Segmented } from "../ui/fields";
import { Modal } from "../ui/Modal";
import { useFormState, useFormSubmit } from "../ui/useFormSubmit";

interface CashFormProps {
  initialKind: CashKind;
  balance: number;
  onClose: () => void;
  onSaved: (kind: CashKind) => void;
}

const KIND_OPTIONS = CASH_KINDS.map((value) => ({ value, label: CASH_KIND_LABELS[value] }));

export function CashForm({ initialKind, balance, onClose, onSaved }: CashFormProps) {
  const { values, update } = useFormState<CashFormValues>(() => emptyCashForm(initialKind));
  const { error, isPending, submit } = useFormSubmit(() => addCashEntry(values), () => onSaved(values.kind));
  const amount = Number(values.amount) || 0;
  const after = values.kind === "deposit" ? balance + amount : balance - amount;

  return (
    <Modal
      title="عملية نقدية"
      error={error}
      isPending={isPending}
      submitLabel="حفظ"
      onClose={onClose}
      onSubmit={submit}
      isNarrow
      footerExtra={
        <div className="preview">
          <span>الرصيد بعد العملية</span>
          <strong className={after < 0 ? "loss" : ""}>{formatMoney(after)}</strong>
        </div>
      }
    >
      <Segmented legend="نوع العملية" name="cashKind" options={KIND_OPTIONS} value={values.kind} onChange={(v) => update("kind", v)} />
      <DateField label="التاريخ" value={values.occurredOn} onChange={(v) => update("occurredOn", v)} />
      <NumberField label="المبلغ (ج.م)" placeholder="0.00" isRequired value={values.amount} onChange={(v) => update("amount", v)} />
      <NotesField label="ملاحظة" placeholder="مثال: تحويل من البنك" maxLength={500} value={values.note} onChange={(v) => update("note", v)} />
    </Modal>
  );
}
