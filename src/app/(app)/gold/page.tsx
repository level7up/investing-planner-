import type { Metadata } from "next";
import { Suspense } from "react";
import { GoldBoard } from "@/components/gold/GoldBoard";
import { PageSkeleton } from "@/components/PageSkeleton";
import { loadPortfolioData } from "@/lib/data/portfolio";
import { requirePageSession } from "@/lib/data/session";

export const metadata: Metadata = { title: "الذهب · سجل الصفقات" };

async function GoldLoader() {
  const { supabase, user } = await requirePageSession();
  const data = await loadPortfolioData(supabase, user.id);
  return <GoldBoard data={data} email={user.email} />;
}

export default function GoldPage() {
  return (
    <Suspense fallback={<PageSkeleton title="الذهب" />}>
      <GoldLoader />
    </Suspense>
  );
}
