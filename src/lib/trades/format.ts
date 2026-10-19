const LOCALE = "ar-EG";
const CURRENCY = " ج.م";

const makeFormatter = (maxDigits: number, extra: Intl.NumberFormatOptions = {}) =>
  new Intl.NumberFormat(LOCALE, { maximumFractionDigits: maxDigits, ...extra });

const moneyFormatter = makeFormatter(2);
const priceFormatter = makeFormatter(4);
const intFormatter = makeFormatter(0);
const signedFormatter = makeFormatter(2, { signDisplay: "exceptZero" });
const dateFormatter = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", year: "numeric" });

const ISO_DATE_PARTS = /^(\d{4})-(\d{2})-(\d{2})$/;

export type Tone = "gain" | "loss" | "";

export const formatAmount = (value: number): string => moneyFormatter.format(value);
export const formatMoney = (value: number): string => moneyFormatter.format(value) + CURRENCY;
export const formatSignedMoney = (value: number): string => signedFormatter.format(value) + CURRENCY;
export const formatPrice = (value: number): string => priceFormatter.format(value);
export const formatInt = (value: number): string => intFormatter.format(value);
export const formatOptionalPrice = (value: number | null): string => (value === null ? "—" : formatPrice(value));

export function formatDate(iso: string): string {
  const match = ISO_DATE_PARTS.exec(iso);
  if (!match) return "—";
  return dateFormatter.format(new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

export function toneOf(value: number): Tone {
  if (value > 0) return "gain";
  if (value < 0) return "loss";
  return "";
}

export function todayISO(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export const formatPercent = (value: number): string => `${moneyFormatter.format(value)}٪`;
export const formatRatio = (value: number): string => `${moneyFormatter.format(value)}×`;
export const formatRMultiple = (value: number): string => `${signedFormatter.format(value)}R`;
