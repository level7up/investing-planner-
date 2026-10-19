"use client";

import { saveGold } from "@/app/actions/gold";
import { emptyGoldForm, goldToFormValues } from "@/lib/gold/schema";
import { GOLD_KARATS, GOLD_KIND_LABELS, GOLD_KINDS, GOLD_STATUS_LABELS, GOLD_STATUSES, type GoldFormValues, type GoldHolding, type GoldStatus } from "@/lib/gold/types";
import { formatMoney, formatSignedMoney, todayISO, toneOf } from "@/lib/trades/format";
import { DateField, NotesField, NumberField, Segmented } from "../ui/fields";
import { Modal } from "../ui/Modal";
import { useFormState, useFormSubmit } from "../ui/useFormSubmit";

interface GoldFormProps {
  holding: GoldHolding | null;
  onClose: () => void;
  onSaved: () => void;
}

const KIND_OPTIONS = GOLD_KINDS.map((value) => ({ value, label: GOLD_KIND_LABELS[value] }));
const KARAT_OPTIONS = GOLD_KARATS.map((karat) => ({ value: String(karat), label: `عيار ${karat}` }));
const STATUS_OPTIONS = GOLD_STATUSES.map((value) => ({ value, label: GOLD_STATUS_LABELS[value] }));

function Preview({ values }: { values: GoldFormValues }) {
  const grams = Number(values.grams) || 0;
  const cost = grams * (Number(values.pricePerGram) || 0) + (Number(values.makingFee) || 0);
  const proceeds = grams * (Number(values.salePricePerGram) || 0) - (Number(values.saleFees) || 0);
  const isSoldComplete = values.status === "sold" && Number(values.salePricePerGram) > 0;
  if (cost <= 0) {
    return (
      <div className="preview"><span>إجمالي التكلفة</span><strong className="is-muted">أدخل الوزن وسعر الجرام</strong></div>
    );
  }
  return (
    <div className="preview">
      <span>{isSoldComplete ? "الربح المحقق" : "إجمالي التكلفة (تُخصم من المحفظة)"}</span>
      {isSoldComplete ? <strong className={toneOf(proceeds - cost)}>{formatSignedMoney(proceeds - cost)}</strong> : <strong>{formatMoney(cost)}</strong>}
    </div>
  );
}

export function GoldForm({ holding, onClose, onSaved }: GoldFormProps) {
  const { values, update, setValues } = useFormState<GoldFormValues>(() => (holding ? goldToFormValues(holding) : emptyGoldForm()));
  const { error, isPending, submit } = useFormSubmit(() => saveGold(holding?.id ?? null, values), onSaved);
  const isSold = values.status === "sold";

  const changeStatus = (status: GoldStatus) =>
    setValues((current) => ({ ...current, status, soldDate: status === "sold" && current.soldDate === "" ? todayISO() : current.soldDate }));

  return (
    <Modal
      title={holding ? "تعديل الذهب" : "إضافة ذهب"}
      error={error}
      isPending={isPending}
      submitLabel="حفظ"
      onClose={onClose}
      onSubmit={submit}
      footerExtra={<Preview values={values} />}
    >
      <Segmented legend="النوع" name="kind" options={KIND_OPTIONS} value={values.kind} onChange={(v) => update("kind", v)} />
      <Segmented legend="العيار" name="karat" options={KARAT_OPTIONS} value={values.karat} onChange={(v) => update("karat", v)} />
      <DateField label="تاريخ الشراء" value={values.purchaseDate} onChange={(v) => update("purchaseDate", v)} />
      <NumberField label="الوزن بالجرام" placeholder="0.000" isRequired value={values.grams} onChange={(v) => update("grams", v)} />
      <NumberField label="سعر الجرام عند الشراء" placeholder="0.00" isRequired value={values.pricePerGram} onChange={(v) => update("pricePerGram", v)} />
      <NumberField
        label="المصنعية والدمغة (إجمالي)"
        value={values.makingFee}
        onChange={(v) => update("makingFee", v)}
        hint={<span className="hint">إجمالي ما دفعته فوق سعر الجرام.</span>}
      />
      <Segmented legend="الحالة" name="goldStatus" options={STATUS_OPTIONS} value={values.status} onChange={changeStatus} />
      {isSold && (
        <>
          <DateField label="تاريخ البيع" min={values.purchaseDate} value={values.soldDate} onChange={(v) => update("soldDate", v)} />
          <NumberField label="سعر بيع الجرام" placeholder="0.00" isRequired value={values.salePricePerGram} onChange={(v) => update("salePricePerGram", v)} />
          <NumberField
            label="خصومات البيع"
            isWide
            value={values.saleFees}
            onChange={(v) => update("saleFees", v)}
            hint={<span className="hint">مثل خصم المصنعية أو عمولة التاجر عند البيع.</span>}
          />
        </>
      )}
      <NotesField label="ملاحظات" placeholder="مثال: سبيكة BTC من محل ..." value={values.notes} onChange={(v) => update("notes", v)} />
    </Modal>
  );
}
