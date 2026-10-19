"use client";

import { useEffect, useState } from "react";
import type { FundSummary } from "@/lib/funds/startamarkets";
import { formatDate, formatPrice } from "@/lib/trades/format";

const SEARCH_DELAY_MS = 250;
const MAX_NAME_LENGTH = 30;

interface FundPickerProps {
  name: string;
  fundId: string;
  onNameChange: (name: string) => void;
  onPick: (fund: FundSummary) => void;
}

type SearchState = { status: "idle" | "loading" } | { status: "done"; funds: FundSummary[] } | { status: "error"; message: string };

async function searchFunds(query: string, signal: AbortSignal): Promise<SearchState> {
  const response = await fetch(`/api/funds?q=${encodeURIComponent(query)}`, { signal });
  const body: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof body === "object" && body && "error" in body ? String(body.error) : "تعذّر البحث الآن";
    return { status: "error", message };
  }
  const funds = typeof body === "object" && body && "funds" in body && Array.isArray(body.funds) ? (body.funds as FundSummary[]) : [];
  return { status: "done", funds };
}

export const fundDisplayName = (fund: FundSummary): string => fund.nameAr.slice(0, MAX_NAME_LENGTH);

export function FundPicker({ name, fundId, onNameChange, onPick }: FundPickerProps) {
  const [search, setSearch] = useState<SearchState>({ status: "idle" });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setSearch({ status: "loading" });
      searchFunds(name, controller.signal)
        .then(setSearch)
        .catch((error: unknown) => {
          if (!controller.signal.aborted) setSearch({ status: "error", message: error instanceof Error ? error.message : "تعذّر البحث الآن" });
        });
    }, SEARCH_DELAY_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [name, isOpen]);

  const pick = (fund: FundSummary) => {
    onPick(fund);
    setIsOpen(false);
  };

  return (
    <div className="f span2 fund-picker">
      <label>
        اسم الصندوق
        <input
          required
          maxLength={MAX_NAME_LENGTH}
          placeholder="ابحث بالاسم: أزيموت جولد، Opportunities…"
          autoComplete="off"
          value={name}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            onNameChange(event.target.value);
            setIsOpen(true);
          }}
        />
      </label>
      <span className={fundId ? "hint fund-linked" : "hint need"}>
        {fundId ? "مرتبط بسعر الصندوق — يتحدّث تلقائيًا." : "اختر الصندوق من القائمة ليتحدّث سعره تلقائيًا."}
      </span>
      {isOpen && (
        <div className="fund-results" role="listbox" aria-label="نتائج البحث عن الصناديق">
          {search.status === "loading" && <p className="fund-results-note">جارٍ البحث…</p>}
          {search.status === "error" && <p className="fund-results-note loss">{search.message}</p>}
          {search.status === "done" && search.funds.length === 0 && <p className="fund-results-note">لا توجد نتائج مطابقة.</p>}
          {search.status === "done" &&
            search.funds.map((fund) => (
              <button key={fund.id} type="button" role="option" aria-selected={fund.id === fundId} className="fund-option" onClick={() => pick(fund)}>
                <span className="fund-option-name">{fund.nameAr}</span>
                <span className="fund-option-meta">
                  {fund.nameEn}
                  {fund.classification ? ` · ${fund.classification}` : ""}
                </span>
                <span className="fund-option-price">
                  {formatPrice(fund.nav)} ج.م{fund.navDate ? ` · ${formatDate(fund.navDate)}` : ""}
                </span>
              </button>
            ))}
          <button type="button" className="fund-results-close" onClick={() => setIsOpen(false)}>إغلاق القائمة</button>
        </div>
      )}
    </div>
  );
}
