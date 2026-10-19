import { describe, expect, test } from "vitest";
import { DEFAULT_RISK_SETTINGS, parseRiskSettings, settingsToFormValues } from "./schema";

describe("parseRiskSettings", () => {
  test("parses the risk percent", () => {
    expect(parseRiskSettings({ riskPercent: "1.5" })).toEqual({ ok: true, data: { riskPercent: 1.5 } });
  });

  test.each([
    ["zero risk", { riskPercent: "0" }],
    ["risk above 100", { riskPercent: "101" }],
    ["non numeric", { riskPercent: "abc" }],
    ["missing field", {}],
  ])("rejects %s", (_label, input) => {
    expect(parseRiskSettings(input).ok).toBe(false);
  });
});

describe("settingsToFormValues", () => {
  test("renders settings as form strings", () => {
    expect(settingsToFormValues(DEFAULT_RISK_SETTINGS)).toEqual({ riskPercent: "1" });
    expect(settingsToFormValues({ riskPercent: 2 })).toEqual({ riskPercent: "2" });
  });
});
