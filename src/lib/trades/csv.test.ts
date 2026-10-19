import { describe, expect, test } from "vitest";
import { buildCsv } from "./csv";
import type { Trade } from "./types";

const trade: Trade = {
  id: "t1",
  entryDate: "2026-10-01",
  symbol: "COMI",
  status: "closed",
  buyPrice: 10,
  quantity: 100,
  stopLoss: 9,
  targetPrice: null,
  sellPrice: 12,
  fees: 5,
  reason: 'said "go"',
  updatedAt: "2026-10-01T10:00:00.000Z",
};

describe("buildCsv", () => {
  test("starts with a BOM and an Arabic header row", () => {
    const csv = buildCsv([trade]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv.split("\r\n")[0]).toContain('"السهم"');
  });

  test("writes one row per trade with the computed result", () => {
    const [, row] = buildCsv([trade]).split("\r\n");
    expect(row).toBe('"2026-10-01","COMI","مغلقة","10","100","9","","12","5","195","said ""go"""');
  });

  test("neutralises spreadsheet formula injection in text cells", () => {
    const [, row] = buildCsv([{ ...trade, symbol: "=CMD()", reason: "+1" }]).split("\r\n");
    expect(row).toContain(`"'=CMD()"`);
    expect(row).toContain(`"'+1"`);
  });
});
