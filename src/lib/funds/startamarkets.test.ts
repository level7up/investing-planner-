import { describe, expect, test } from "vitest";
import { fundQuoteKey, isFundId, parseFundDetail, parseFundList, searchFunds } from "./startamarkets";

const azgDetail = {
  fund_id: "5989",
  fund_name: "صندوق أزيموت للمعادن النفيسة الإسلامي - الإصدار الأول - جولد - AZ",
  fund_name_en: "Azimut Gold Islamic 1 fund Gold AZ",
  display_name_ar: "صندوق أزيموت جولد",
  display_name_en: "Azimut Gold AZ Fund",
  manager_name_en: "Azimut Egypt Asset Management S.A.E",
  currency: "EGP",
  latest_nav: "24.0448",
  last_updated: "2026-05-23T11:25:44.858Z",
  last_nav_date: "2026-10-18T00:00:00.000Z",
  classification: "Gold Fund",
  is_stale: false,
};

describe("isFundId and fundQuoteKey", () => {
  test("accept only numeric ids", () => {
    expect(isFundId("5989")).toBe(true);
    expect(isFundId("59a")).toBe(false);
    expect(isFundId("../x")).toBe(false);
    expect(fundQuoteKey("5989")).toBe("FUND:5989");
  });
});

describe("parseFundDetail", () => {
  test("reads the unit price and the NAV date", () => {
    expect(parseFundDetail(azgDetail)).toEqual({ symbol: "FUND:5989", price: 24.0448, changePercent: null, asOf: "2026-10-18" });
  });

  test("falls back to last_updated when there is no NAV date", () => {
    expect(parseFundDetail({ ...azgDetail, last_nav_date: null })?.asOf).toBe("2026-05-23");
  });

  test("rejects non-EGP funds, missing prices and malformed payloads", () => {
    expect(parseFundDetail({ ...azgDetail, currency: "USD" })).toBeNull();
    expect(parseFundDetail({ ...azgDetail, latest_nav: "0" })).toBeNull();
    expect(parseFundDetail({ ...azgDetail, latest_nav: "abc" })).toBeNull();
    expect(parseFundDetail({ ...azgDetail, fund_id: "x1" })).toBeNull();
    expect(parseFundDetail(null)).toBeNull();
  });
});

describe("parseFundList", () => {
  test("keeps valid EGP funds as compact summaries", () => {
    const list = parseFundList([
      azgDetail,
      { ...azgDetail, fund_id: "1", currency: "USD" },
      { ...azgDetail, fund_id: "2", latest_nav: null },
      "garbage",
      { ...azgDetail, fund_id: "6422", display_name_ar: null, display_name_en: null, fund_name_en: "Azimut Equity Opportunities Fund Az LV", classification: "Equity Fund", last_nav_date: null, last_updated: "2026-10-18T00:00:00.000Z" },
    ]);
    expect(list).toEqual([
      { id: "5989", nameAr: "صندوق أزيموت جولد", nameEn: "Azimut Gold AZ Fund", manager: "Azimut Egypt Asset Management S.A.E", classification: "Gold Fund", nav: 24.0448, navDate: "2026-10-18" },
      { id: "6422", nameAr: "صندوق أزيموت للمعادن النفيسة الإسلامي - الإصدار الأول - جولد - AZ", nameEn: "Azimut Equity Opportunities Fund Az LV", manager: "Azimut Egypt Asset Management S.A.E", classification: "Equity Fund", nav: 24.0448, navDate: "2026-10-18" },
    ]);
  });

  test("returns an empty list for a non-array payload", () => {
    expect(parseFundList({ data: [] })).toEqual([]);
  });
});

describe("searchFunds", () => {
  const funds = parseFundList([
    azgDetail,
    { ...azgDetail, fund_id: "5753", display_name_ar: "صندوق أزيموت فرص", display_name_en: "Azimut Opportunities AZ", classification: "Equity Fund" },
    { ...azgDetail, fund_id: "2686", display_name_ar: "صندوق أسهم البنك العربي", display_name_en: "ABC Bank Equity Fund 1", manager_name_en: "CFH", classification: "Equity Fund" },
  ]);

  test("matches English and Arabic names case-insensitively", () => {
    expect(searchFunds(funds, "gold", 10).map((f) => f.id)).toEqual(["5989"]);
    expect(searchFunds(funds, "فرص", 10).map((f) => f.id)).toEqual(["5753"]);
  });

  test("returns everything for an empty query and respects the limit", () => {
    expect(searchFunds(funds, " ", 10).map((f) => f.id)).toEqual(["5989", "5753", "2686"]);
    expect(searchFunds(funds, "azimut", 1)).toHaveLength(1);
  });

  test("matches every word of the query", () => {
    expect(searchFunds(funds, "abc equity", 10).map((f) => f.id)).toEqual(["2686"]);
    expect(searchFunds(funds, "abc gold", 10)).toEqual([]);
  });
});
