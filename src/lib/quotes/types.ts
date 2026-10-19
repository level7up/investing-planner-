export type Quote = {
  symbol: string;
  price: number;
  changePercent: number | null;
};

export type QuoteMap = Readonly<Record<string, Quote>>;

export type QuoteSnapshot = {
  quotes: QuoteMap;
  fetchedAt: string | null;
  isAvailable: boolean;
};

export const EMPTY_SNAPSHOT: QuoteSnapshot = { quotes: {}, fetchedAt: null, isAvailable: true };
