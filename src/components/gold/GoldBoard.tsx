"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { deleteGold } from "@/app/actions/gold";
import { goldPricePerGram, goldSummary } from "@/lib/gold/calc";
import { GOLD_KARATS, type GoldHolding, type GoldPrices } from "@/lib/gold/types";
import type { PortfolioPageProps } from "@/lib/portfolio/types";
import { formatAmount, formatMoney, formatSignedMoney, toneOf } from "@/lib/trades/format";
import { AppHeader } from "../AppHeader";
import { Toast } from "../Toast";
import { useToast } from "../useToast";
import { GoldCard } from "./GoldCard";
import { GoldForm } from "./GoldForm";
import { GoldPricesDialog } from "./GoldPricesDialog";

type Dialog = { type: "none" } | { type: "prices" } | { type: "holding"; holding: GoldHolding | null };

const dateTimeFormatter = new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" });

function PricesCard({ prices, onEdit }: { prices: GoldPrices; onEdit: () => void }) {
  return (
    <section className="prices-card" aria-label="أسعار الذهب">
      <div className="prices-head">
        <div>
          <h2>سعر الجرام اليوم</h2>
          <p>{prices.updatedAt ? `آخر تحديث: ${dateTimeFormatter.format(new Date(prices.updatedAt))}` : "لم تُسجّل أسعار بعد"}</p>
        </div>
        <button className="btn btn-secondary btn-sm" type="button" onClick={onEdit}>تحديث الأسعار</button>
      </div>
      <dl className="prices-grid">
        {GOLD_KARATS.map((karat) => {
          const price = goldPricePerGram(karat, prices);
          const isDerived = price !== null && prices[`price${karat}`] === null;
          return (
            <div key={karat}>
              <dt>عيار {karat}</dt>
              <dd className={isDerived ? "muted" : ""}>{price === null ? "—" : formatAmount(price)}{isDerived && <span className="risk-note">تقديري</span>}</dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

export function GoldBoard({ data, email }: PortfolioPageProps) {
  const { gold, prices } = data;
  const [dialog, setDialog] = useState<Dialog>({ type: "none" });
  const [, startTransition] = useTransition();
  const { toast, showToast, hideToast } = useToast();
  const summary = useMemo(() => goldSummary(gold, prices), [gold, prices]);
  const grams = GOLD_KARATS.filter((karat) => summary.gramsByKarat[karat] > 0)
    .map((karat) => `${formatAmount(summary.gramsByKarat[karat])} جم عيار ${karat}`)
    .join(" · ");

  const close = useCallback(() => setDialog({ type: "none" }), []);
  const saved = (message: string) => {
    close();
    showToast(message);
  };

  const handleDelete = (holding: GoldHolding) => {
    if (!window.confirm("حذف هذا الذهب نهائيًا؟ سيتم تعديل رصيد المحفظة تلقائيًا.")) return;
    startTransition(async () => {
      const result = await deleteGold(holding.id);
      showToast(result.ok ? "تم الحذف" : result.error);
    });
  };

  return (
    <>
      <main className="app">
        <AppHeader email={email} />
        <header className="top">
          <div>
            <h1>الذهب</h1>
            <p>سجّل السبائك والعملات والمشغولات بالوزن والعيار والمصنعية، وتابع قيمتها بسعر اليوم. صناديق الذهب تُسجّل من صفحة الصفقات.</p>
          </div>
          <button className="btn btn-primary btn-add-top" type="button" onClick={() => setDialog({ type: "holding", holding: null })}>＋ إضافة ذهب</button>
        </header>

        <PricesCard prices={prices} onEdit={() => setDialog({ type: "prices" })} />

        <section className="metrics" aria-label="ملخص الذهب">
          <article className="metric metric--wide"><p className="label">الذهب المحتفظ به</p><p className="value">{grams || "—"}</p><p className="hint">حسب العيار</p></article>
          <article className="metric"><p className="label">تكلفة الشراء</p><p className="value">{formatMoney(summary.heldCost)}</p><p className="hint">شاملة المصنعية</p></article>
          <article className="metric"><p className="label">القيمة الحالية</p><p className="value">{formatMoney(summary.heldValue)}</p><p className="hint">{summary.hasUnpricedHoldings ? "بعضها بسعر الشراء — حدّث الأسعار" : "بسعر اليوم"}</p></article>
          <article className="metric"><p className="label">ربح/خسارة غير محققة</p><p className={`value ${toneOf(summary.unrealised)}`}>{formatSignedMoney(summary.unrealised)}</p><p className="hint">للذهب المحتفظ به</p></article>
          <article className="metric"><p className="label">أرباح محققة</p><p className={`value ${toneOf(summary.realised)}`}>{formatSignedMoney(summary.realised)}</p><p className="hint">من الذهب المُباع</p></article>
        </section>

        <section className={gold.length === 0 ? "log is-empty" : "log"} aria-label="مقتنيات الذهب">
          <div className="log-head"><div><h2>المقتنيات</h2><p>{`${gold.length} عنصر`}</p></div></div>
          <div className="gold-cards">
            {gold.map((holding) => (
              <GoldCard key={holding.id} holding={holding} prices={prices} onEdit={(h) => setDialog({ type: "holding", holding: h })} onDelete={handleDelete} />
            ))}
          </div>
          <div className="empty">
            <h3>لسه مفيش ذهب مسجّل</h3>
            <p>أضف أول سبيكة أو قطعة، وحدّث سعر الجرام لمتابعة قيمتها.</p>
            <button className="btn btn-primary" type="button" onClick={() => setDialog({ type: "holding", holding: null })}>إضافة ذهب</button>
          </div>
        </section>
      </main>

      <button className="btn btn-primary fab" type="button" onClick={() => setDialog({ type: "holding", holding: null })}>＋ ذهب</button>
      <Toast toast={toast} onDismiss={hideToast} />
      {dialog.type === "holding" && <GoldForm holding={dialog.holding} onClose={close} onSaved={() => saved("تم حفظ الذهب")} />}
      {dialog.type === "prices" && <GoldPricesDialog prices={prices} onClose={close} onSaved={() => saved("تم تحديث الأسعار")} />}
    </>
  );
}
