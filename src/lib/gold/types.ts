export const GOLD_KINDS = ["bar", "coin", "jewelry"] as const;
export const GOLD_KARATS = [24, 21, 18] as const;
export const GOLD_STATUSES = ["held", "sold"] as const;

export type GoldKind = (typeof GOLD_KINDS)[number];
export type GoldKarat = (typeof GOLD_KARATS)[number];
export type GoldStatus = (typeof GOLD_STATUSES)[number];

export type GoldHolding = {
  id: string;
  purchaseDate: string;
  kind: GoldKind;
  karat: GoldKarat;
  grams: number;
  pricePerGram: number;
  makingFee: number;
  status: GoldStatus;
  soldDate: string | null;
  salePricePerGram: number | null;
  saleFees: number;
  notes: string;
  updatedAt: string;
};

export type GoldFormValues = {
  purchaseDate: string;
  kind: GoldKind;
  karat: string;
  grams: string;
  pricePerGram: string;
  makingFee: string;
  status: GoldStatus;
  soldDate: string;
  salePricePerGram: string;
  saleFees: string;
  notes: string;
};

export type GoldPrices = {
  price24: number | null;
  price21: number | null;
  price18: number | null;
  updatedAt: string | null;
};

export type GoldPriceFormValues = { price24: string; price21: string; price18: string };

export const GOLD_KIND_LABELS: Record<GoldKind, string> = {
  bar: "سبيكة",
  coin: "عملة ذهب",
  jewelry: "مشغولات",
};

export const GOLD_STATUS_LABELS: Record<GoldStatus, string> = {
  held: "محتفظ به",
  sold: "مُباع",
};
