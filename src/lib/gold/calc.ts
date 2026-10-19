import { roundMoney } from "@/lib/trades/calc";
import { GOLD_KARATS, type GoldHolding, type GoldKarat, type GoldPrices } from "./types";

export type GoldSummary = {
  gramsByKarat: Record<GoldKarat, number>;
  heldCost: number;
  heldValue: number;
  unrealised: number;
  realised: number;
  hasUnpricedHoldings: boolean;
};

const roundGrams = (value: number): number => Math.round(value * 1000) / 1000;

const enteredPrice = (karat: GoldKarat, prices: GoldPrices): number | null => prices[`price${karat}`];

export function goldCost(holding: GoldHolding): number {
  return roundMoney(holding.grams * holding.pricePerGram + holding.makingFee);
}

export function goldProceeds(holding: GoldHolding): number | null {
  if (holding.status !== "sold" || holding.salePricePerGram === null) return null;
  return roundMoney(holding.grams * holding.salePricePerGram - holding.saleFees);
}

export function goldRealised(holding: GoldHolding): number | null {
  const proceeds = goldProceeds(holding);
  return proceeds === null ? null : roundMoney(proceeds - goldCost(holding));
}

export function goldPricePerGram(karat: GoldKarat, prices: GoldPrices): number | null {
  const direct = enteredPrice(karat, prices);
  if (direct !== null) return direct;
  const source = GOLD_KARATS.find((candidate) => enteredPrice(candidate, prices) !== null);
  if (source === undefined) return null;
  return roundMoney(((enteredPrice(source, prices) ?? 0) * karat) / source);
}

export function goldMarketValue(holding: GoldHolding, prices: GoldPrices): number | null {
  if (holding.status !== "held") return null;
  const price = goldPricePerGram(holding.karat, prices);
  return price === null ? null : roundMoney(holding.grams * price);
}

export function goldSummary(holdings: readonly GoldHolding[], prices: GoldPrices): GoldSummary {
  const held = holdings.filter((holding) => holding.status === "held");
  const values = held.map((holding) => goldMarketValue(holding, prices));
  const heldCost = roundMoney(held.reduce((sum, holding) => sum + goldCost(holding), 0));
  const heldValue = roundMoney(held.reduce((sum, holding, index) => sum + (values[index] ?? goldCost(holding)), 0));
  const gramsByKarat = Object.fromEntries(
    GOLD_KARATS.map((karat) => [karat, roundGrams(held.filter((h) => h.karat === karat).reduce((sum, h) => sum + h.grams, 0))]),
  ) as Record<GoldKarat, number>;
  return {
    gramsByKarat,
    heldCost,
    heldValue,
    unrealised: roundMoney(heldValue - heldCost),
    realised: roundMoney(holdings.reduce((sum, holding) => sum + (goldRealised(holding) ?? 0), 0)),
    hasUnpricedHoldings: values.some((value) => value === null),
  };
}
