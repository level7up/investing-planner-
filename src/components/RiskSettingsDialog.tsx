"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { saveRiskSettings } from "@/app/actions/settings";
import { settingsToFormValues, type RiskSettings, type RiskSettingsFormValues } from "@/lib/settings/schema";

interface RiskSettingsDialogProps {
  settings: RiskSettings;
  onClose: () => void;
  onSaved: () => void;
}

export function RiskSettingsDialog({ settings, onClose, onSaved }: RiskSettingsDialogProps) {
  const [values, setValues] = useState<RiskSettingsFormValues>(() => settingsToFormValues(settings));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    document.body.classList.add("modal-open");
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("modal-open");
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveRiskSettings(values);
      if (result.ok) onSaved();
      else setError(result.error);
    });
  };

  return (
    <div className="overlay">
      <div className="sheet sheet--narrow" role="dialog" aria-modal="true" aria-labelledby="riskSettingsTitle">
        <form className="trade-form" onSubmit={handleSubmit}>
          <div className="sheet-head">
            <h2 id="riskSettingsTitle">إعدادات المخاطرة</h2>
            <button className="icon-btn" type="button" aria-label="إغلاق" onClick={onClose}>✕</button>
          </div>
          <div className="sheet-body">
            {error && <p className="alert alert--error" role="alert">{error}</p>}
            <div className="grid">
              <label className="f span2">رأس المال المخصص للمضاربة (ج.م)
                <input type="number" inputMode="decimal" min="0" step="any" placeholder="مثال: 100000" value={values.capital} onChange={(e) => setValues((v) => ({ ...v, capital: e.target.value }))} />
                <span className="hint">يُستخدم لحساب نسبة المخاطرة والكمية المقترحة.</span>
              </label>
              <label className="f span2">أقصى مخاطرة في الصفقة الواحدة (٪)
                <input type="number" inputMode="decimal" min="0.01" max="100" step="any" required value={values.riskPercent} onChange={(e) => setValues((v) => ({ ...v, riskPercent: e.target.value }))} />
                <span className="hint">الشائع بين ١٪ و٢٪ من رأس المال.</span>
              </label>
            </div>
          </div>
          <div className="sheet-foot">
            <div className="foot-actions foot-actions--end">
              <button type="button" className="btn btn-secondary" onClick={onClose}>إلغاء</button>
              <button type="submit" className="btn btn-primary" disabled={isPending}>{isPending ? "جارٍ الحفظ…" : "حفظ الإعدادات"}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
