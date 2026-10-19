import { pnl } from "./calc";
import { riskProfile, rMultiple } from "./risk";
import { STATUS_LABELS } from "./status";
import type { Trade } from "./types";

const HEADERS = [
  "تاريخ الدخول",
  "السهم",
  "الحالة",
  "سعر الشراء",
  "الكمية",
  "وقف الخسارة",
  "الهدف",
  "سعر البيع",
  "الرسوم",
  "صافي الربح والخسارة",
  "المخاطرة",
  "العائد/المخاطرة",
  "مضاعف R",
  "سبب الدخول / ملاحظات",
];

const FORMULA_PREFIX = /^[=+\-@\t\r]/;

const textCell = (value: string): string => {
  const safe = FORMULA_PREFIX.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
};

const numberCell = (value: number | string | null): string => `"${value ?? ""}"`;

const tradeRow = (trade: Trade): string[] => {
  const risk = riskProfile(trade);
  return [
    numberCell(trade.entryDate),
    textCell(trade.symbol),
    textCell(STATUS_LABELS[trade.status]),
    numberCell(trade.buyPrice),
    numberCell(trade.quantity),
    numberCell(trade.stopLoss),
    numberCell(trade.targetPrice),
    numberCell(trade.sellPrice),
    numberCell(trade.fees),
    numberCell(pnl(trade)),
    numberCell(risk.riskAmount),
    numberCell(risk.rewardToRisk),
    numberCell(rMultiple(trade)),
    textCell(trade.reason),
  ];
};

export function buildCsv(trades: readonly Trade[]): string {
  const rows = [HEADERS.map(textCell), ...trades.map(tradeRow)];
  return "﻿" + rows.map((row) => row.join(",")).join("\r\n");
}
