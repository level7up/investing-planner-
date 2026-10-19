import { describe, expect, test } from "vitest";
import { emptyCashForm, parseCashInput } from "./schema";

describe("parseCashInput", () => {
  test("parses a deposit", () => {
    expect(parseCashInput({ occurredOn: "2026-10-01", kind: "deposit", amount: "5000", note: " salary " })).toEqual({
      ok: true,
      data: { occurredOn: "2026-10-01", kind: "deposit", amount: 5000, note: "salary" },
    });
  });

  test.each([
    ["zero amount", { amount: "0" }],
    ["unknown kind", { kind: "transfer" }],
    ["bad date", { occurredOn: "yesterday" }],
    ["long note", { note: "x".repeat(501) }],
  ])("rejects %s", (_label, override) => {
    expect(parseCashInput({ occurredOn: "2026-10-01", kind: "deposit", amount: "1", note: "", ...override }).ok).toBe(false);
  });
});

describe("emptyCashForm", () => {
  test("defaults to the given kind today", () => {
    expect(emptyCashForm("withdrawal", "2026-10-19")).toEqual({ occurredOn: "2026-10-19", kind: "withdrawal", amount: "", note: "" });
  });
});
