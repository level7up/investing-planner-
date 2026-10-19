import { pnl, roundMoney } from "./calc";
import type { Trade, TradeFormValues } from "./types";

const FLOAT_TOLERANCE = 1e-9;

export type RiskInputs = Pick<Trade, "buyPrice" | "quantity" | "stopLoss" | "targetPrice" | "fees">;

export type RiskProfile = {
  riskAmount: number | null;
  rewardAmount: number | null;
  rewardToRisk: number | null;
};

export type SizingInputs = {
  capital: number | null;
  riskPercent: number;
  buyPrice: number;
  stopLoss: number | null;
};

export type OpenRisk = { amount: number; unprotectedCount: number };

const EMPTY_PROFILE: RiskProfile = { riskAmount: null, rewardAmount: null, rewardToRisk: null };

const isPositive = (value: number | null): value is number => value !== null && Number.isFinite(value) && value > 0;

const optionalField = (value: string): number | null => (value.trim() === "" ? null : Number(value));

export function riskProfile(trade: RiskInputs): RiskProfile {
  const { buyPrice, quantity, stopLoss, targetPrice, fees } = trade;
  if (!isPositive(buyPrice) || !isPositive(quantity)) return EMPTY_PROFILE;

  const riskAmount = isPositive(stopLoss) && stopLoss < buyPrice ? roundMoney((buyPrice - stopLoss) * quantity + fees) : null;
  const rewardAmount = isPositive(targetPrice) && targetPrice > buyPrice ? roundMoney((targetPrice - buyPrice) * quantity - fees) : null;
  const rewardToRisk = riskAmount !== null && rewardAmount !== null ? roundMoney(rewardAmount / riskAmount) : null;
  return { riskAmount, rewardAmount, rewardToRisk };
}

export function riskFromFormValues(values: TradeFormValues): RiskProfile {
  return riskProfile({
    buyPrice: Number(values.buyPrice) || 0,
    quantity: Number(values.quantity) || 0,
    stopLoss: optionalField(values.stopLoss),
    targetPrice: optionalField(values.targetPrice),
    fees: Number(values.fees) || 0,
  });
}

export function riskPercentOfCapital(riskAmount: number | null, capital: number | null): number | null {
  if (riskAmount === null || !isPositive(capital)) return null;
  return roundMoney((riskAmount / capital) * 100);
}

export function suggestQuantity({ capital, riskPercent, buyPrice, stopLoss }: SizingInputs): number | null {
  if (!isPositive(capital) || !isPositive(riskPercent) || !isPositive(buyPrice) || !isPositive(stopLoss)) return null;
  if (stopLoss >= buyPrice) return null;
  const riskBudget = (capital * riskPercent) / 100;
  const byRisk = Math.floor(riskBudget / (buyPrice - stopLoss) + FLOAT_TOLERANCE);
  const byCapital = Math.floor(capital / buyPrice + FLOAT_TOLERANCE);
  return Math.min(byRisk, byCapital);
}

export function rMultiple(trade: Trade): number | null {
  const result = pnl(trade);
  const { riskAmount } = riskProfile(trade);
  if (result === null || riskAmount === null) return null;
  return roundMoney(result / riskAmount);
}

export function openRisk(trades: readonly Trade[]): OpenRisk {
  const open = trades.filter((trade) => trade.status === "open");
  const risks = open.map((trade) => riskProfile(trade).riskAmount);
  return {
    amount: roundMoney(risks.reduce<number>((sum, risk) => sum + (risk ?? 0), 0)),
    unprotectedCount: risks.filter((risk) => risk === null).length,
  };
}
