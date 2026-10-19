"use client";

import { useCallback, useMemo, useOptimistic, useState, useTransition } from "react";
import { deleteTrade, restoreTrade } from "@/app/actions/trades";
import { portfolioSummary, riskCapital } from "@/lib/portfolio/calc";
import type { PortfolioPageProps } from "@/lib/portfolio/types";
import { computeMetrics, countByStatus, filterTrades } from "@/lib/trades/calc";
import { buildCsv } from "@/lib/trades/csv";
import { formatInt, todayISO } from "@/lib/trades/format";
import { openRisk } from "@/lib/trades/risk";
import { FILTER_OPTIONS } from "@/lib/trades/status";
import type { Trade, TradeFilter } from "@/lib/trades/types";
import { AppHeader } from "./AppHeader";
import { Metrics } from "./Metrics";
import { RiskSettingsDialog } from "./RiskSettingsDialog";
import { Toast } from "./Toast";
import { TradeForm } from "./TradeForm";
import { TradeList } from "./TradeList";
import { useToast } from "./useToast";

type FormState = { isOpen: false } | { isOpen: true; trade: Trade | null };

function downloadCsv(trades: readonly Trade[]): void {
  const url = URL.createObjectURL(new Blob([buildCsv(trades)], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `trade-journal-${todayISO()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function TradeJournal({ data, email }: PortfolioPageProps) {
  const { settings } = data;
  const [visibleTrades, removeOptimistically] = useOptimistic(data.trades, (state, id: string) => state.filter((t) => t.id !== id));
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TradeFilter>("all");
  const [form, setForm] = useState<FormState>({ isOpen: false });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [, startTransition] = useTransition();
  const { toast, showToast, hideToast } = useToast();

  const filtered = useMemo(() => filterTrades(visibleTrades, query, filter), [visibleTrades, query, filter]);
  const metrics = useMemo(() => computeMetrics(visibleTrades), [visibleTrades]);
  const counts = useMemo(() => countByStatus(visibleTrades), [visibleTrades]);
  const risk = useMemo(() => openRisk(visibleTrades), [visibleTrades]);
  const portfolio = useMemo(() => portfolioSummary({ ...data, trades: visibleTrades }), [data, visibleTrades]);
  const capital = riskCapital(portfolio);
  const sizing = { capital, riskPercent: settings.riskPercent, cash: portfolio.cash };
  const hasNoTrades = visibleTrades.length === 0;

  const openForm = (trade: Trade | null = null) => setForm({ isOpen: true, trade });
  const closeForm = useCallback(() => setForm({ isOpen: false }), []);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);

  const handleSettingsSaved = () => {
    closeSettings();
    showToast("تم حفظ إعدادات المخاطرة");
  };

  const handleSaved = (symbol: string) => {
    closeForm();
    showToast(`تم حفظ صفقة ${symbol}`);
  };

  const undoDelete = (trade: Trade) =>
    startTransition(async () => {
      const result = await restoreTrade(trade);
      if (!result.ok) showToast(result.error);
    });

  const handleDelete = (trade: Trade) =>
    startTransition(async () => {
      removeOptimistically(trade.id);
      const result = await deleteTrade(trade.id);
      if (!result.ok) return showToast(result.error);
      showToast(`تم حذف صفقة ${trade.symbol}`, () => undoDelete(trade));
    });

  const handleExport = () => (hasNoTrades ? showToast("لا توجد صفقات لتصديرها.") : downloadCsv(visibleTrades));
  const clearFilters = () => {
    setQuery("");
    setFilter("all");
  };

  return (
    <>
      <main className="app">
        <AppHeader
          email={email}
          actions={<button className="btn btn-secondary btn-sm" type="button" onClick={() => setIsSettingsOpen(true)}>إعدادات المخاطرة</button>}
        />

        <header className="top">
          <div>
            <h1>سجل صفقات المضاربة</h1>
            <p>سجّل الصفقة وخطة الخروج، ثم حدّثها بعد البيع لحساب النتيجة بعد الرسوم. بياناتك محفوظة في حسابك ومتاحة من أي جهاز.</p>
          </div>
          <button className="btn btn-primary btn-add-top" type="button" onClick={() => openForm()}>＋ إضافة صفقة</button>
        </header>

        <Metrics metrics={metrics} risk={risk} />

        <section className={filtered.length === 0 ? "log is-empty" : "log"} aria-label="سجل الصفقات">
          <div className="log-head">
            <div>
              <h2>سجل الصفقات</h2>
              <p>{`عرض ${formatInt(filtered.length)} من ${formatInt(visibleTrades.length)} صفقة`}</p>
            </div>
            <button className="btn btn-secondary btn-sm" type="button" onClick={handleExport}>تصدير CSV</button>
          </div>

          <div className="toolbar">
            <input className="search" type="search" placeholder="ابحث عن سهم أو صندوق..." aria-label="بحث عن سهم" autoComplete="off" enterKeyHint="search" value={query} onChange={(e) => setQuery(e.target.value)} />
            <div className="chips" role="group" aria-label="فلترة حسب الحالة">
              {FILTER_OPTIONS.map((option) => (
                <button key={option.value} className="chip" type="button" aria-pressed={filter === option.value} onClick={() => setFilter(option.value)}>
                  {option.label} <span className="count">{formatInt(counts[option.value])}</span>
                </button>
              ))}
            </div>
          </div>

          <TradeList trades={filtered} onEdit={openForm} onDelete={handleDelete} />

          <div className="empty">
            <h3>{hasNoTrades ? "لسه مفيش صفقات" : "مفيش نتائج مطابقة"}</h3>
            <p>{hasNoTrades ? "ابدأ بإضافة أول صفقة، وسجل سبب الدخول ومستويات الخروج." : "جرّب تغيير كلمة البحث أو الفلتر."}</p>
            {hasNoTrades ? (
              <button className="btn btn-primary" type="button" onClick={() => openForm()}>إضافة أول صفقة</button>
            ) : (
              <button className="btn btn-secondary" type="button" onClick={clearFilters}>مسح البحث والفلتر</button>
            )}
          </div>
        </section>

        <p className="foot-note">ملاحظة: البيانات محفوظة في حسابك على السحابة ومتزامنة بين أجهزتك. صدّر CSV للاحتفاظ بنسخة إضافية. الحساب لا يشمل أي ضرائب أو رسوم إضافية لم تُدخلها يدويًا.</p>
      </main>

      <button className="btn btn-primary fab" type="button" onClick={() => openForm()}>＋ صفقة جديدة</button>
      <Toast toast={toast} onDismiss={hideToast} />
      {form.isOpen && <TradeForm trade={form.trade} sizing={sizing} onClose={closeForm} onSaved={handleSaved} />}
      {isSettingsOpen && <RiskSettingsDialog settings={settings} capital={capital} onClose={closeSettings} onSaved={handleSettingsSaved} />}
    </>
  );
}
