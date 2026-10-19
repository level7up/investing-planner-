import { redirect } from "next/navigation";
import { Suspense } from "react";
import { TradeJournal } from "@/components/TradeJournal";
import { loadRiskSettings } from "@/lib/settings/repository";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { fromRow, TRADE_COLUMNS, type TradeRow } from "@/lib/trades/mapper";

async function JournalLoader() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) redirect("/login");

  const [{ data, error }, settings] = await Promise.all([
    supabase.from("trades").select(TRADE_COLUMNS).order("entry_date", { ascending: false }).returns<TradeRow[]>(),
    loadRiskSettings(supabase, user.id),
  ]);
  if (error) {
    console.error("Loading trades failed", { code: error.code, message: error.message });
    throw new Error("تعذّر تحميل الصفقات");
  }

  return <TradeJournal trades={data.map(fromRow)} email={user.email} settings={settings} />;
}

function JournalSkeleton() {
  return (
    <main className="app" aria-busy="true">
      <header className="top">
        <div>
          <h1>سجل صفقات المضاربة</h1>
          <p>جارٍ تحميل صفقاتك…</p>
        </div>
      </header>
      <section className="metrics">
        {["a", "b", "c", "d"].map((key) => <article key={key} className="metric skeleton" />)}
      </section>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<JournalSkeleton />}>
      <JournalLoader />
    </Suspense>
  );
}
