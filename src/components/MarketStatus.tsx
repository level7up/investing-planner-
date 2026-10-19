"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { QuoteSnapshot } from "@/lib/quotes/types";
import { cairoTimeFormatter } from "@/lib/trades/format";

interface MarketStatusProps {
  market: QuoteSnapshot;
}

function statusText(market: QuoteSnapshot): string {
  if (!market.isAvailable) return "تعذّر جلب بعض الأسعار الآن — ما لم يُحدَّث يظهر بسعر الشراء.";
  if (!market.fetchedAt) return "لا توجد صفقات مفتوحة لجلب أسعارها.";
  return `أسعار الأسهم متأخرة 15 دقيقة والصناديق بآخر سعر معلن · آخر تحديث ${cairoTimeFormatter.format(new Date(market.fetchedAt))}`;
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
