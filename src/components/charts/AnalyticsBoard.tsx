"use client";

import { useMemo } from "react";
import { allocation, cumulativeSeries, monthlyTotals, pnlBySymbol, realisedEvents } from "@/lib/analytics/series";
import type { PortfolioPageProps } from "@/lib/portfolio/types";
import { formatDate, formatInt, formatMoney, formatMonth, formatPercent, formatSignedMoney } from "@/lib/trades/format";
import { AppHeader } from "../AppHeader";
import { AllocationChart } from "./AllocationChart";
import { ChartCard } from "./ChartCard";
import { CumulativeChart } from "./CumulativeChart";
import { MonthlyChart } from "./MonthlyChart";
import { SymbolChart } from "./SymbolChart";

const SYMBOL_LIMIT = 8;
const NO_CLOSED_TEXT = "لا توجد صفقات مغلقة أو ذهب مُباع بعد.";

export function AnalyticsBoard({ data, email }: PortfolioPageProps) {
  const sources = useMemo(() => ({ ...data, quotes: data.market.quotes }), [data]);
  const events = useMemo(() => realisedEvents(data.trades, data.gold), [data]);
  const cumulative = useMemo(() => cumulativeSeries(events), [events]);
  const months = useMemo(() => monthlyTotals(events), [events]);
  const symbols = useMemo(() => pnlBySymbol(data.trades, SYMBOL_LIMIT), [data]);
  const parts = useMemo(() => allocation(sources), [sources]);

  return (
    <main className="app">
      <AppHeader email={email} />
      <header className="top">
        <div>
          <h1>التحليل</h1>
          <p>أداء صفقاتك المغلقة والذهب المُباع عبر الوقت، وتوزيع محفظتك الحالية.</p>
        </div>
      </header>

      <div className="charts">
        <ChartCard
          title="الأرباح المحققة التراكمية"
          subtitle="مجموع صافي الصفقات المغلقة والذهب المُباع حتى كل يوم"
          isEmpty={cumulative.length === 0}
          emptyText={NO_CLOSED_TEXT}
          table={{
            columns: ["التاريخ", "صافي اليوم", "الإجمالي التراكمي"],
            rows: cumulative.map((p) => [formatDate(p.date), formatSignedMoney(p.delta), formatSignedMoney(p.value)]),
          }}
        >
          {cumulative.length > 0 && <CumulativeChart points={cumulative} />}
        </ChartCard>

        <ChartCard
          title="النتيجة الشهرية"
          subtitle="صافي الربح أو الخسارة المحققة في كل شهر"
          isEmpty={months.length === 0}
          emptyText={NO_CLOSED_TEXT}
          table={{ columns: ["الشهر", "صافي محقق"], rows: months.map((m) => [formatMonth(m.month), formatSignedMoney(m.total)]) }}
        >
          {months.length > 0 && <MonthlyChart months={months} />}
        </ChartCard>

        <ChartCard
          title="الربح حسب السهم"
          subtitle={`صافي الصفقات المغلقة لكل سهم — أعلى ${SYMBOL_LIMIT} والباقي في «أخرى»`}
          isEmpty={symbols.length === 0}
          emptyText="لا توجد صفقات مغلقة بعد."
          table={{ columns: ["السهم", "عدد الصفقات", "صافي محقق"], rows: symbols.map((s) => [s.label, formatInt(s.count), formatSignedMoney(s.total)]) }}
        >
          {symbols.length > 0 && <SymbolChart symbols={symbols} />}
        </ChartCard>

        <ChartCard
          title="توزيع المحفظة"
          subtitle="النقدية والأسهم بسعر السوق والذهب بسعر الجرام المسجّل"
          isEmpty={parts.length === 0}
          emptyText="سجّل إيداعًا أو صفقة لعرض توزيع المحفظة."
          table={{ columns: ["البند", "القيمة", "النسبة"], rows: parts.map((p) => [p.label, formatMoney(p.value), formatPercent(p.share)]) }}
        >
          <AllocationChart parts={parts} />
        </ChartCard>
      </div>
    </main>
  );
}
