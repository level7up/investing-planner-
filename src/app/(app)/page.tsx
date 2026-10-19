import { Suspense } from "react";
import { PageSkeleton } from "@/components/PageSkeleton";
import { TradeJournal } from "@/components/TradeJournal";
import { loadPortfolioData } from "@/lib/data/portfolio";
import { requirePageSession } from "@/lib/data/session";

async function JournalLoader() {
  const { supabase, user } = await requirePageSession();
  const data = await loadPortfolioData(supabase, user.id);
  return <TradeJournal data={data} email={user.email} />;
}

export default function HomePage() {
  return (
    <Suspense fallback={<PageSkeleton title="سجل صفقات المضاربة" />}>
      <JournalLoader />
    </Suspense>
  );
}
