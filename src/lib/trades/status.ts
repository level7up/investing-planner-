import type { AssetType, TradeFilter, TradeStatus } from "./types";

export const STATUS_LABELS: Record<TradeStatus, string> = {
  open: "مفتوحة",
  closed: "مغلقة",
  cancelled: "ملغاة",
};

export const ASSET_LABELS: Record<AssetType, string> = {
  stock: "سهم",
  equity_fund: "صندوق أسهم",
  gold_fund: "صندوق ذهب",
};

export const FILTER_OPTIONS: readonly { value: TradeFilter; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "open", label: STATUS_LABELS.open },
  { value: "closed", label: STATUS_LABELS.closed },
  { value: "cancelled", label: STATUS_LABELS.cancelled },
];
