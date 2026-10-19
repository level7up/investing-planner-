"use client";

import { useEffect, useRef } from "react";
import { saveTrade } from "@/app/actions/trades";
import { previewPnl } from "@/lib/trades/calc";
import { emptyFormValues, tradeToFormValues } from "@/lib/trades/form";
import { formatSignedMoney, todayISO, toneOf } from "@/lib/trades/format";
import { ASSET_LABELS, STATUS_LABELS } from "@/lib/trades/status";
import { ASSET_TYPES, TRADE_STATUSES, type Trade, type TradeFormValues, type TradeStatus } from "@/lib/trades/types";
import { tradeCashOutflow } from "@/lib/wallet/calc";
import { RiskPanel, type SizingContext } from "./RiskPanel";
import { DateField, NotesField, NumberField, Segmented } from "./ui/fields";
import { Modal } from "./ui/Modal";
import { useFormState, useFormSubmit } from "./ui/useFormSubmit";

interface TradeFormProps {
  trade: Trade | null;
  sizing: SizingContext;
  onClose: () => void;
  onSaved: (symbol: string) => void;
}

const STATUS_OPTIONS = TRADE_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }));
const ASSET_OPTIONS = ASSET_TYPES.map((value) => ({ value, label: ASSET_LABELS[value] }));

function Preview({ values }: { values: TradeFormValues }) {
  const result = previewPnl(values);
  return (
    <div className="preview">
      <span>النتيجة التقديرية بعد الرسوم</span>
      {result === null ? <strong className="is-muted">تظهر عند إغلاق الصفقة</strong> : <strong className={toneOf(result)}>{formatSignedMoney(result)}</strong>}
    </div>
  );
}

export function TradeForm({ trade, sizing, onClose, onSaved }: TradeFormProps) {
  const { values, update, setValues } = useFormState<TradeFormValues>(() => (trade ? tradeToFormValues(trade) : emptyFormValues()));
  const { error, isPending, submit } = useFormSubmit(
    () => saveTrade(trade?.id ?? null, values),
    () => onSaved(values.symbol.trim().toUpperCase()),
  );
  const symbolRef = useRef<HTMLInputElement>(null);
  const isClosed = values.status === "closed";
  const isFund = values.assetType === "gold_fund";
  const availableCash = sizing.cash + (trade ? tradeCashOutflow(trade) : 0);

  useEffect(() => {
    if (!trade && matchMedia("(pointer: fine)").matches) symbolRef.current?.focus();
  }, [trade]);

  const changeStatus = (status: TradeStatus) =>
    setValues((current) => ({
      ...current,
      status,
      exitDate: status === "closed" && current.exitDate === "" ? todayISO() : current.exitDate,
    }));

  return (
    <Modal
      title={trade ? "تعديل الصفقة" : "إضافة صفقة جديدة"}
      error={error}
      isPending={isPending}
      submitLabel="حفظ الصفقة"
      onClose={onClose}
      onSubmit={submit}
      footerExtra={<Preview values={values} />}
    >
      <Segmented legend="نوع الأصل" name="assetType" options={ASSET_OPTIONS} value={values.assetType} onChange={(v) => update("assetType", v)} />
      <DateField label="تاريخ الدخول" value={values.entryDate} onChange={(v) => update("entryDate", v)} />
      <label className="f">{isFund ? "رمز / اسم الصندوق" : "رمز / اسم السهم"}
        <input ref={symbolRef} maxLength={30} required placeholder={isFund ? "مثال: AZG" : "مثال: COMI"} autoComplete="off" autoCapitalize="characters" value={values.symbol} onChange={(e) => update("symbol", e.target.value)} />
      </label>
      <Segmented legend="حالة الصفقة" name="status" options={STATUS_OPTIONS} value={values.status} onChange={changeStatus} />
      <NumberField label="سعر الشراء (ج.م)" placeholder="0.00" isRequired value={values.buyPrice} onChange={(v) => update("buyPrice", v)} />
      <NumberField label={isFund ? "عدد الوحدات" : "عدد الأسهم"} isInteger isRequired value={values.quantity} onChange={(v) => update("quantity", v)} />
      <NumberField label="سعر وقف الخسارة" placeholder="اختياري" value={values.stopLoss} onChange={(v) => update("stopLoss", v)} />
      <NumberField label="الهدف السعري" placeholder="اختياري" value={values.targetPrice} onChange={(v) => update("targetPrice", v)} />
      <NumberField
        label="سعر البيع"
        placeholder="0.00"
        isRequired={isClosed}
        value={values.sellPrice}
        onChange={(v) => update("sellPrice", v)}
        hint={<span className={isClosed ? "hint need" : "hint"}>{isClosed ? "مطلوب للصفقة المغلقة" : "اتركه فارغًا لو الصفقة مفتوحة"}</span>}
      />
      {isClosed ? (
        <DateField label="تاريخ الخروج" min={values.entryDate} value={values.exitDate} onChange={(v) => update("exitDate", v)} />
      ) : (
        <span className="grid-spacer" aria-hidden="true" />
      )}
      <NumberField
        label="إجمالي الرسوم (شراء + بيع)"
        isWide
        value={values.fees}
        onChange={(v) => update("fees", v)}
        hint={<span className="hint">تُخصم من المحفظة مع الشراء.</span>}
      />
      <RiskPanel values={values} sizing={{ ...sizing, cash: availableCash }} onApplyQuantity={(quantity) => update("quantity", quantity)} />
      <NotesField label="سبب الدخول / ملاحظات" placeholder="مثال: اختراق مقاومة مع ارتفاع حجم التداول" value={values.reason} onChange={(v) => update("reason", v)} />
    </Modal>
  );
}
