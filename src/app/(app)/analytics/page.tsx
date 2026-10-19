import type { Metadata } from "next";
import { Suspense } from "react";
import { AnalyticsBoard } from "@/components/charts/AnalyticsBoard";
import { PageSkeleton } from "@/components/PageSkeleton";
import { loadPortfolioData } from "@/lib/data/portfolio";
import { requirePageSession } from "@/lib/data/session";

export const metadata: Metadata = { title: "التحليل · سجل الصفقات" };

async function AnalyticsLoader() {
  const { supabase, user } = await requirePageSession();
  const data = await loadPortfolioData(supabase, user.id);
  return <AnalyticsBoard data={data} email={user.email} />;
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<PageSkeleton title="التحليل" />}>
      <AnalyticsLoader />
    </Suspense>
  );
}
