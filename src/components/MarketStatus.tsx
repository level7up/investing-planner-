"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { QuoteSnapshot } from "@/lib/quotes/types";

const timeFormatter = new Intl.DateTimeFormat("ar-EG", { timeStyle: "short", timeZone: "Africa/Cairo" });

interface MarketStatusProps {
  market: QuoteSnapshot;
}

function statusText(market: QuoteSnapshot): string {
  if (!market.isAvailable) return "تعذّر جلب أسعار البورصة الآن — القيم المعروضة بسعر الشراء.";
  if (!market.fetchedAt) return "لا توجد صفقات مفتوحة لجلب أسعارها.";
  return `أسعار البورصة متأخرة ١٥ دقيقة · آخر تحديث ${timeFormatter.format(new Date(market.fetchedAt))}`;
}

export function MarketStatus({ market }: MarketStatusProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <div className={market.isAvailable ? "market-status" : "market-status market-status--down"} role="status">
      <span>{statusText(market)}</span>
      <button className="btn btn-secondary btn-sm" type="button" disabled={isPending} onClick={() => startTransition(() => router.refresh())}>
        {isPending ? "جارٍ التحديث…" : "تحديث الأسعار"}
      </button>
    </div>
  );
}
