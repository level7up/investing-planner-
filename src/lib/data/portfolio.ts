import "server-only";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { GOLD_COLUMNS, GOLD_PRICE_COLUMNS, goldFromRow, pricesFromRow, type GoldPricesRow, type GoldRow } from "@/lib/gold/mapper";
import { loadQuotes } from "@/lib/quotes/fetch";
import { loadRiskSettings } from "@/lib/settings/repository";
import { fromRow, TRADE_COLUMNS, type TradeRow } from "@/lib/trades/mapper";
import { CASH_COLUMNS, cashFromRow, type CashRow } from "@/lib/wallet/mapper";
import type { PortfolioData } from "@/lib/portfolio/types";

function ensure<T>(label: string, result: { data: T | null; error: PostgrestError | null }): T {
  if (result.error) {
    console.error(`Loading ${label} failed: [${result.error.code}] ${result.error.message}`);
    throw new Error("تعذّر تحميل البيانات");
  }
  return result.data as T;
}

export async function loadPortfolioData(supabase: SupabaseClient, userId: string): Promise<PortfolioData> {
  const [trades, gold, entries, prices, settings] = await Promise.all([
    supabase.from("trades").select(TRADE_COLUMNS).order("entry_date", { ascending: false }).returns<TradeRow[]>(),
    supabase.from("gold_holdings").select(GOLD_COLUMNS).order("purchase_date", { ascending: false }).returns<GoldRow[]>(),
    supabase.from("cash_transactions").select(CASH_COLUMNS).order("occurred_on", { ascending: false }).returns<CashRow[]>(),
    supabase.from("gold_prices").select(GOLD_PRICE_COLUMNS).eq("user_id", userId).maybeSingle<GoldPricesRow>(),
    loadRiskSettings(supabase, userId),
  ]);
  const loadedTrades = ensure("trades", trades).map(fromRow);
  const openSymbols = loadedTrades.filter((t) => t.status === "open").map((t) => t.symbol);
  return {
    trades: loadedTrades,
    gold: ensure("gold", gold).map(goldFromRow),
    entries: ensure("cash", entries).map(cashFromRow),
    prices: pricesFromRow(ensure("gold prices", prices)),
    settings,
    market: await loadQuotes(openSymbols),
  };
}
