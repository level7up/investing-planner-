export const CASH_KINDS = ["deposit", "withdrawal"] as const;

export type CashKind = (typeof CASH_KINDS)[number];

export type CashEntry = {
  id: string;
  occurredOn: string;
  kind: CashKind;
  amount: number;
  note: string;
};

export type CashFormValues = {
  occurredOn: string;
  kind: CashKind;
  amount: string;
  note: string;
};

export type MovementKind = CashKind | "buy" | "sell" | "gold-buy" | "gold-sell";

export type Movement = {
  id: string;
  refId: string;
  date: string;
  kind: MovementKind;
  subject: string;
  amount: number;
  balance: number;
  isManual: boolean;
};

export const CASH_KIND_LABELS: Record<CashKind, string> = {
  deposit: "إيداع",
  withdrawal: "سحب",
};
