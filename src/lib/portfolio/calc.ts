import { goldSummary } from "@/lib/gold/calc";
import type { GoldPrices } from "@/lib/gold/types";
import { roundMoney } from "@/lib/trades/calc";
import { cashBalance, type WalletSources } from "@/lib/wallet/calc";

export type PortfolioSources = WalletSources & { prices: GoldPrices };

export type PortfolioSummary = {
  cash: number;
  positions: number;
  gold: number;
  total: number;
};

export function portfolioSummary(sources: PortfolioSources): PortfolioSummary {
  const cash = cashBalance(sources);
  const positions = roundMoney(
    sources.trades.filter((trade) => trade.status === "open").reduce((sum, trade) => sum + trade.buyPrice * trade.quantity, 0),
  );
  const gold = goldSummary(sources.gold, sources.prices).heldValue;
  return { cash, positions, gold, total: roundMoney(cash + positions + gold) };
}

export function riskCapital(summary: PortfolioSummary): number | null {
  return summary.total > 0 ? summary.total : null;
}
