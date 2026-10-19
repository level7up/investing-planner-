const NUMBER_LOCALE = "en-US";
const DATE_LOCALE = "ar-EG-u-nu-latn";
const CAIRO_TIME_ZONE = "Africa/Cairo";
const CURRENCY = "ج.م";
const LEFT_TO_RIGHT_ISOLATE = "⁦";
const POP_DIRECTIONAL_ISOLATE = "⁩";

const moneyFormatter = new Intl.NumberFormat(NUMBER_LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const signedMoneyFormatter = new Intl.NumberFormat(NUMBER_LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: "exceptZero" });
const priceFormatter = new Intl.NumberFormat(NUMBER_LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
const intFormatter = new Intl.NumberFormat(NUMBER_LOCALE, { maximumFractionDigits: 0 });
const decimalFormatter = new Intl.NumberFormat(NUMBER_LOCALE, { maximumFractionDigits: 2 });
const signedDecimalFormatter = new Intl.NumberFormat(NUMBER_LOCALE, { maximumFractionDigits: 2, signDisplay: "exceptZero" });
const compactFormatter = new Intl.NumberFormat(NUMBER_LOCALE, { notation: "compact", maximumFractionDigits: 1 });
const dateFormatter = new Intl.DateTimeFormat(DATE_LOCALE, { day: "numeric", month: "short", year: "numeric" });
const monthFormatter = new Intl.DateTimeFormat(DATE_LOCALE, { month: "short", year: "numeric" });

export const cairoTimeFormatter = new Intl.DateTimeFormat(DATE_LOCALE, { timeStyle: "short", timeZone: CAIRO_TIME_ZONE });
export const cairoDateTimeFormatter = new Intl.DateTimeFormat(DATE_LOCALE, { dateStyle: "medium", timeStyle: "short", timeZone: CAIRO_TIME_ZONE });

const ISO_DATE_PARTS = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_MONTH_PARTS = /^(\d{4})-(\d{2})$/;

export type Tone = "gain" | "loss" | "";

export const isolateLtr = (text: string): string => `${LEFT_TO_RIGHT_ISOLATE}${text}${POP_DIRECTIONAL_ISOLATE}`;

const withCurrency = (number: string): string => `${isolateLtr(number)} ${CURRENCY}`;

export const formatAmount = (value: number): string => isolateLtr(moneyFormatter.format(value));
export const formatMoney = (value: number): string => withCurrency(moneyFormatter.format(value));
export const formatSignedMoney = (value: number): string => withCurrency(signedMoneyFormatter.format(value));
export const formatPrice = (value: number): string => isolateLtr(priceFormatter.format(value));
export const formatInt = (value: number): string => isolateLtr(intFormatter.format(value));
export const formatOptionalPrice = (value: number | null): string => (value === null ? "—" : formatPrice(value));
export const formatPercent = (value: number): string => isolateLtr(`${decimalFormatter.format(value)}%`);
export const formatSignedPercent = (value: number): string => isolateLtr(`${signedDecimalFormatter.format(value)}%`);
export const formatRatio = (value: number): string => isolateLtr(`${decimalFormatter.format(value)}×`);
export const formatRMultiple = (value: number): string => isolateLtr(`${signedDecimalFormatter.format(value)}R`);
export const formatCompact = (value: number): string => isolateLtr(compactFormatter.format(value));

export function formatDate(iso: string): string {
  const match = ISO_DATE_PARTS.exec(iso);
  if (!match) return "—";
  return dateFormatter.format(new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

export function formatMonth(isoMonth: string): string {
  const match = ISO_MONTH_PARTS.exec(isoMonth);
  if (!match) return "—";
  return monthFormatter.format(new Date(Number(match[1]), Number(match[2]) - 1, 1));
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
