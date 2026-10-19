import type { GoldHolding, GoldPrices } from "@/lib/gold/types";
import type { QuoteSnapshot } from "@/lib/quotes/types";
import type { RiskSettings } from "@/lib/settings/schema";
import type { Trade } from "@/lib/trades/types";
import type { CashEntry } from "@/lib/wallet/types";

export type PortfolioData = {
  trades: Trade[];
  gold: GoldHolding[];
  entries: CashEntry[];
  prices: GoldPrices;
  settings: RiskSettings;
  market: QuoteSnapshot;
};

export interface PortfolioPageProps {
  data: PortfolioData;
  email: string;
}
