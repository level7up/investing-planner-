"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { deleteCashEntry } from "@/app/actions/wallet";
import { portfolioSummary } from "@/lib/portfolio/calc";
import type { PortfolioPageProps } from "@/lib/portfolio/types";
import { formatMoney } from "@/lib/trades/format";
import { walletMovements } from "@/lib/wallet/calc";
import { CASH_KIND_LABELS, type CashKind, type Movement } from "@/lib/wallet/types";
import { AppHeader } from "../AppHeader";
import { Toast } from "../Toast";
import { useToast } from "../useToast";
import { CashForm } from "./CashForm";
import { MovementList } from "./MovementList";

export function WalletBoard({ data, email }: PortfolioPageProps) {
  const [formKind, setFormKind] = useState<CashKind | null>(null);
  const [, startTransition] = useTransition();
  const { toast, showToast, hideToast } = useToast();
  const summary = useMemo(() => portfolioSummary(data), [data]);
  const movements = useMemo(() => walletMovements(data), [data]);

  const closeForm = useCallback(() => setFormKind(null), []);
  const handleSaved = (kind: CashKind) => {
    closeForm();
    showToast(`تم تسجيل ${CASH_KIND_LABELS[kind]}`);
  };

  const handleDelete = (movement: Movement) => {
    if (!window.confirm("حذف هذه العملية النقدية؟")) return;
    startTransition(async () => {
      const result = await deleteCashEntry(movement.refId);
      showToast(result.ok ? "تم حذف العملية" : result.error);
    });
  };

  return (
    <>
      <main className="app">
        <AppHeader email={email} />
        <header className="top">
          <div>
            <h1>المحفظة</h1>
            <p>رصيدك النقدي بالجنيه. الإيداع والسحب تسجّلهم بنفسك، وعمليات الشراء والبيع للأسهم والذهب تُخصم وتُضاف تلقائيًا.</p>
          </div>
          <div className="top-actions">
            <button className="btn btn-secondary" type="button" onClick={() => setFormKind("withdrawal")}>سحب</button>
            <button className="btn btn-primary" type="button" onClick={() => setFormKind("deposit")}>＋ إيداع</button>
          </div>
        </header>

        {summary.cash < 0 && (
          <p className="alert alert--error" role="alert">
            الرصيد النقدي بالسالب: مشترياتك المسجّلة أكبر من الإيداعات. سجّل إيداعًا برأس المال الذي بدأت به.
          </p>
        )}

        <section className="metrics" aria-label="ملخص المحفظة">
          <article className="metric metric--wide"><p className="label">الرصيد النقدي</p><p className={`value ${summary.cash < 0 ? "loss" : ""}`}>{formatMoney(summary.cash)}</p><p className="hint">متاح للشراء</p></article>
          <article className="metric"><p className="label">مراكز مفتوحة</p><p className="value">{formatMoney(summary.positions)}</p><p className="hint">أسهم وصناديق بسعر الشراء</p></article>
          <article className="metric"><p className="label">الذهب</p><p className="value">{formatMoney(summary.gold)}</p><p className="hint">بسعر الجرام المسجّل</p></article>
          <article className="metric metric--wide"><p className="label">إجمالي المحفظة</p><p className="value">{formatMoney(summary.total)}</p><p className="hint">يُستخدم كرأس مال لحساب المخاطرة</p></article>
        </section>

        <section className={movements.length === 0 ? "log is-empty" : "log"} aria-label="حركات المحفظة">
          <div className="log-head"><div><h2>الحركات</h2><p>{`${movements.length} حركة`}</p></div></div>
          <MovementList movements={movements} onDelete={handleDelete} />
          <div className="empty">
            <h3>لا توجد حركات بعد</h3>
            <p>ابدأ بتسجيل رأس المال الذي تستثمر به كإيداع.</p>
            <button className="btn btn-primary" type="button" onClick={() => setFormKind("deposit")}>تسجيل إيداع</button>
          </div>
        </section>
      </main>

      <button className="btn btn-primary fab" type="button" onClick={() => setFormKind("deposit")}>＋ إيداع</button>
      <Toast toast={toast} onDismiss={hideToast} />
      {formKind && <CashForm initialKind={formKind} balance={summary.cash} onClose={closeForm} onSaved={handleSaved} />}
    </>
  );
}
