import { describe, expect, test } from "vitest";
import { DEFAULT_RISK_SETTINGS, parseRiskSettings, settingsToFormValues } from "./schema";

describe("parseRiskSettings", () => {
  test("parses capital and risk percent", () => {
    expect(parseRiskSettings({ capital: "100000", riskPercent: "1.5" })).toEqual({
      ok: true,
      data: { capital: 100000, riskPercent: 1.5 },
    });
  });

  test("allows clearing the capital", () => {
    expect(parseRiskSettings({ capital: " ", riskPercent: "1" })).toEqual({ ok: true, data: { capital: null, riskPercent: 1 } });
  });

  test.each([
    ["negative capital", { capital: "-5", riskPercent: "1" }],
    ["zero risk", { capital: "1000", riskPercent: "0" }],
    ["risk above 100", { capital: "1000", riskPercent: "101" }],
    ["non numeric", { capital: "abc", riskPercent: "1" }],
    ["missing fields", {}],
  ])("rejects %s", (_label, input) => {
    expect(parseRiskSettings(input).ok).toBe(false);
  });
});

describe("settingsToFormValues", () => {
  test("renders defaults as form strings", () => {
    expect(settingsToFormValues(DEFAULT_RISK_SETTINGS)).toEqual({ capital: "", riskPercent: "1" });
    expect(settingsToFormValues({ capital: 5000, riskPercent: 2 })).toEqual({ capital: "5000", riskPercent: "2" });
  });
});
