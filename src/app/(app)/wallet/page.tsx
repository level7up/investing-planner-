import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/PageSkeleton";
import { WalletBoard } from "@/components/wallet/WalletBoard";
import { loadPortfolioData } from "@/lib/data/portfolio";
import { requirePageSession } from "@/lib/data/session";

export const metadata: Metadata = { title: "المحفظة · سجل الصفقات" };

async function WalletLoader() {
  const { supabase, user } = await requirePageSession();
  const data = await loadPortfolioData(supabase, user.id);
  return <WalletBoard data={data} email={user.email} />;
}

export default function WalletPage() {
  return (
    <Suspense fallback={<PageSkeleton title="المحفظة" />}>
      <WalletLoader />
    </Suspense>
  );
}
