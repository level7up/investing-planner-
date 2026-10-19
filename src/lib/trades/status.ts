import type { TradeFilter, TradeStatus } from "./types";

export const STATUS_LABELS: Record<TradeStatus, string> = {
  open: "مفتوحة",
  closed: "مغلقة",
  cancelled: "ملغاة",
};

export const FILTER_OPTIONS: readonly { value: TradeFilter; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "open", label: STATUS_LABELS.open },
  { value: "closed", label: STATUS_LABELS.closed },
  { value: "cancelled", label: STATUS_LABELS.cancelled },
];
