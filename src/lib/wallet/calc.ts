import { goldCost, goldProceeds } from "@/lib/gold/calc";
import type { GoldHolding } from "@/lib/gold/types";
import { roundMoney } from "@/lib/trades/calc";
import type { Trade } from "@/lib/trades/types";
import type { CashEntry, Movement, MovementKind } from "./types";

export type WalletSources = {
  entries: readonly CashEntry[];
  trades: readonly Trade[];
  gold: readonly GoldHolding[];
};

type Flow = Omit<Movement, "balance">;

const SAME_DAY_ORDER: Record<MovementKind, number> = {
  deposit: 0,
  sell: 1,
  "gold-sell": 1,
  buy: 2,
  "gold-buy": 2,
  withdrawal: 3,
};

export function tradeCashOutflow(trade: Trade): number {
  if (trade.status === "cancelled") return 0;
  return roundMoney(trade.buyPrice * trade.quantity + trade.fees);
}

function entryFlows(entry: CashEntry): Flow[] {
  const amount = entry.kind === "deposit" ? entry.amount : -entry.amount;
  return [{ id: `cash-${entry.id}`, refId: entry.id, date: entry.occurredOn, kind: entry.kind, subject: entry.note, amount, isManual: true }];
}

function tradeFlows(trade: Trade): Flow[] {
  if (trade.status === "cancelled") return [];
  const base = { refId: trade.id, subject: trade.symbol, isManual: false };
  const buy: Flow = { ...base, id: `buy-${trade.id}`, date: trade.entryDate, kind: "buy", amount: -tradeCashOutflow(trade) };
  if (trade.status !== "closed" || trade.sellPrice === null) return [buy];
  const proceeds = roundMoney(trade.sellPrice * trade.quantity);
  const sell: Flow = { ...base, id: `sell-${trade.id}`, date: trade.exitDate ?? trade.entryDate, kind: "sell", amount: proceeds };
  return [buy, sell];
}

function goldFlows(holding: GoldHolding): Flow[] {
  const base = { refId: holding.id, subject: `${holding.grams} جم عيار ${holding.karat}`, isManual: false };
  const buy: Flow = { ...base, id: `gold-buy-${holding.id}`, date: holding.purchaseDate, kind: "gold-buy", amount: -goldCost(holding) };
  const proceeds = goldProceeds(holding);
  if (proceeds === null) return [buy];
  const sell: Flow = { ...base, id: `gold-sell-${holding.id}`, date: holding.soldDate ?? holding.purchaseDate, kind: "gold-sell", amount: proceeds };
  return [buy, sell];
}

const chronological = (a: Flow, b: Flow): number =>
  a.date.localeCompare(b.date) || SAME_DAY_ORDER[a.kind] - SAME_DAY_ORDER[b.kind] || a.id.localeCompare(b.id);

function allFlows({ entries, trades, gold }: WalletSources): Flow[] {
  return [...entries.flatMap(entryFlows), ...trades.flatMap(tradeFlows), ...gold.flatMap(goldFlows)];
}

export function walletMovements(sources: WalletSources): Movement[] {
  const ordered = allFlows(sources).toSorted(chronological);
  const balances = ordered.reduce<number[]>((acc, flow) => [...acc, roundMoney((acc.at(-1) ?? 0) + flow.amount)], []);
  return ordered.map((flow, index) => ({ ...flow, balance: balances[index] })).toReversed();
}

export function cashBalance(sources: WalletSources): number {
  return roundMoney(allFlows(sources).reduce((sum, flow) => sum + flow.amount, 0));
}
