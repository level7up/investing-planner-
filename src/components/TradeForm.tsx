"use client";

import { useEffect, useRef } from "react";
import { saveTrade } from "@/app/actions/trades";
import { previewPnl } from "@/lib/trades/calc";
import { emptyFormValues, tradeToFormValues } from "@/lib/trades/form";
import { formatDate, formatSignedMoney, todayISO, toneOf } from "@/lib/trades/format";
import { ASSET_LABELS, STATUS_LABELS } from "@/lib/trades/status";
import type { FundSummary } from "@/lib/funds/startamarkets";
import { ASSET_TYPES, isFundAsset, TRADE_STATUSES, type AssetType, type Trade, type TradeFormValues, type TradeStatus } from "@/lib/trades/types";
import { tradeCashOutflow } from "@/lib/wallet/calc";
import { fundDisplayName, FundPicker } from "./FundPicker";
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

function manualPriceHint(values: TradeFormValues): string {
  if (values.manualPrice.trim() === "") return "اتركه فارغًا لاستخدام السعر التلقائي.";
  return values.manualPriceDate ? `يحلّ محل السعر التلقائي · ${formatDate(values.manualPriceDate)}` : "يحلّ محل السعر التلقائي.";
}

export function TradeForm({ trade, sizing, onClose, onSaved }: TradeFormProps) {
  const { values, update, setValues } = useFormState<TradeFormValues>(() => (trade ? tradeToFormValues(trade) : emptyFormValues()));
  const { error, isPending, submit } = useFormSubmit(
    () => saveTrade(trade?.id ?? null, values),
    () => onSaved(values.symbol.trim().toUpperCase()),
  );
  const symbolRef = useRef<HTMLInputElement>(null);
  const isClosed = values.status === "closed";
  const isFund = isFundAsset(values.assetType);
  const availableCash = sizing.cash + (trade ? tradeCashOutflow(trade) : 0);

  useEffect(() => {
    if (!trade && matchMedia("(pointer: fine)").matches) symbolRef.current?.focus();
  }, [trade]);

  const changeAssetType = (assetType: AssetType) =>
    setValues((current) => ({
      ...current,
      assetType,
      fundId: isFundAsset(assetType) && isFundAsset(current.assetType) ? current.fundId : "",
      symbol: isFundAsset(assetType) === isFundAsset(current.assetType) ? current.symbol : "",
    }));

  const pickFund = (fund: FundSummary) =>
    setValues((current) => ({
      ...current,
      fundId: fund.id,
      symbol: fundDisplayName(fund),
      buyPrice: current.buyPrice === "" ? String(fund.nav) : current.buyPrice,
    }));

  const renameFund = (symbol: string) => setValues((current) => ({ ...current, symbol, fundId: "" }));

  const changeManualPrice = (manualPrice: string) =>
    setValues((current) => ({ ...current, manualPrice, manualPriceDate: manualPrice.trim() === "" ? "" : todayISO() }));

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
      <Segmented legend="نوع الأصل" name="assetType" options={ASSET_OPTIONS} value={values.assetType} onChange={changeAssetType} />
      <DateField label="تاريخ الدخول" value={values.entryDate} onChange={(v) => update("entryDate", v)} />
      {isFund ? (
        <FundPicker name={values.symbol} fundId={values.fundId} onNameChange={renameFund} onPick={pickFund} />
      ) : (
        <label className="f">رمز / اسم السهم
          <input ref={symbolRef} maxLength={30} required placeholder="مثال: COMI" autoComplete="off" autoCapitalize="characters" value={values.symbol} onChange={(e) => update("symbol", e.target.value)} />
        </label>
      )}
      <Segmented legend="حالة الصفقة" name="status" options={STATUS_OPTIONS} value={values.status} onChange={changeStatus} />
      <NumberField label={isFund ? "سعر شراء الوثيقة" : "سعر الشراء (ج.م)"} placeholder="0.00" isRequired value={values.buyPrice} onChange={(v) => update("buyPrice", v)} />
      <NumberField label={isFund ? "عدد الوثائق" : "عدد الأسهم"} isInteger={!isFund} isRequired value={values.quantity} onChange={(v) => update("quantity", v)} />
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
      {isClosed && <DateField label="تاريخ الخروج" min={values.entryDate} value={values.exitDate} onChange={(v) => update("exitDate", v)} />}
      {values.status === "open" && (
        <NumberField
          label="السعر الحالي (يدوي)"
          placeholder="اختياري"
          value={values.manualPrice}
          onChange={changeManualPrice}
          hint={<span className="hint">{manualPriceHint(values)}</span>}
        />
      )}
      {values.status === "cancelled" && <span className="grid-spacer" aria-hidden="true" />}
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
