"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { saveTrade } from "@/app/actions/trades";
import { previewPnl } from "@/lib/trades/calc";
import { emptyFormValues, tradeToFormValues } from "@/lib/trades/form";
import { formatSignedMoney, toneOf } from "@/lib/trades/format";
import { STATUS_LABELS } from "@/lib/trades/status";
import { TRADE_STATUSES, type Trade, type TradeFormValues } from "@/lib/trades/types";

interface TradeFormProps {
  trade: Trade | null;
  onClose: () => void;
  onSaved: (symbol: string) => void;
}

type NumberField = "buyPrice" | "quantity" | "stopLoss" | "targetPrice" | "sellPrice" | "fees";

const NUMBER_FIELDS: readonly { name: NumberField; label: string; placeholder: string; step: string; min: string }[] = [
  { name: "buyPrice", label: "سعر الشراء (ج.م)", placeholder: "0.00", step: "any", min: "0" },
  { name: "quantity", label: "عدد الأسهم", placeholder: "0", step: "1", min: "1" },
  { name: "stopLoss", label: "سعر وقف الخسارة", placeholder: "اختياري", step: "any", min: "0" },
  { name: "targetPrice", label: "الهدف السعري", placeholder: "اختياري", step: "any", min: "0" },
  { name: "sellPrice", label: "سعر البيع", placeholder: "0.00", step: "any", min: "0" },
  { name: "fees", label: "إجمالي الرسوم (شراء + بيع)", placeholder: "0", step: "any", min: "0" },
];

function Preview({ values }: { values: TradeFormValues }) {
  const result = previewPnl(values);
  return (
    <div className="preview">
      <span>النتيجة التقديرية بعد الرسوم</span>
      {result === null ? <strong className="is-muted">تظهر عند إغلاق الصفقة</strong> : <strong className={toneOf(result)}>{formatSignedMoney(result)}</strong>}
    </div>
  );
}

export function TradeForm({ trade, onClose, onSaved }: TradeFormProps) {
  const [values, setValues] = useState<TradeFormValues>(() => (trade ? tradeToFormValues(trade) : emptyFormValues()));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const symbolRef = useRef<HTMLInputElement>(null);
  const isClosed = values.status === "closed";

  useEffect(() => {
    document.body.classList.add("modal-open");
    if (!trade && matchMedia("(pointer: fine)").matches) symbolRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("modal-open");
      document.removeEventListener("keydown", onKey);
    };
  }, [trade, onClose]);

  const update = <K extends keyof TradeFormValues>(name: K, value: TradeFormValues[K]) =>
    setValues((current) => ({ ...current, [name]: value }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveTrade(trade?.id ?? null, values);
      if (result.ok) onSaved(values.symbol.trim().toUpperCase());
      else setError(result.error);
    });
  };

  return (
    <div className="overlay">
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="formTitle">
        <form className="trade-form" onSubmit={handleSubmit}>
          <div className="sheet-head">
            <h2 id="formTitle">{trade ? "تعديل الصفقة" : "إضافة صفقة جديدة"}</h2>
            <button className="icon-btn" type="button" aria-label="إغلاق" onClick={onClose}>✕</button>
          </div>
          <div className="sheet-body">
            {error && <p className="alert alert--error" role="alert">{error}</p>}
            <div className="grid">
              <label className="f">تاريخ الدخول
                <input type="date" required value={values.entryDate} onChange={(e) => update("entryDate", e.target.value)} />
              </label>
              <label className="f">رمز / اسم السهم
                <input ref={symbolRef} maxLength={30} required placeholder="مثال: COMI" autoComplete="off" autoCapitalize="characters" value={values.symbol} onChange={(e) => update("symbol", e.target.value)} />
              </label>
              <fieldset className="group span2">
                <legend>حالة الصفقة</legend>
                <div className="seg">
                  {TRADE_STATUSES.map((status) => (
                    <label key={status}>
                      <input type="radio" name="status" value={status} checked={values.status === status} onChange={() => update("status", status)} />
                      <span>{STATUS_LABELS[status]}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              {NUMBER_FIELDS.map((field) => (
                <label key={field.name} className="f">{field.label}
                  <input
                    type="number"
                    inputMode={field.step === "1" ? "numeric" : "decimal"}
                    min={field.min}
                    step={field.step}
                    placeholder={field.placeholder}
                    required={field.name === "buyPrice" || field.name === "quantity" || (field.name === "sellPrice" && isClosed)}
                    value={values[field.name]}
                    onChange={(e) => update(field.name, e.target.value)}
                  />
                  {field.name === "sellPrice" && (
                    <span className={isClosed ? "hint need" : "hint"}>{isClosed ? "مطلوب للصفقة المغلقة" : "اتركه فارغًا لو الصفقة مفتوحة"}</span>
                  )}
                </label>
              ))}
              <label className="f span2">سبب الدخول / ملاحظات
                <textarea rows={3} maxLength={2000} placeholder="مثال: اختراق مقاومة مع ارتفاع حجم التداول" value={values.reason} onChange={(e) => update("reason", e.target.value)} />
              </label>
            </div>
          </div>
          <div className="sheet-foot">
            <Preview values={values} />
            <div className="foot-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>إلغاء</button>
              <button type="submit" className="btn btn-primary" disabled={isPending}>{isPending ? "جارٍ الحفظ…" : "حفظ الصفقة"}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
