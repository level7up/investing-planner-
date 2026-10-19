"use client";

import { saveRiskSettings } from "@/app/actions/settings";
import { settingsToFormValues, type RiskSettings, type RiskSettingsFormValues } from "@/lib/settings/schema";
import { formatMoney } from "@/lib/trades/format";
import { NumberField } from "./ui/fields";
import { Modal } from "./ui/Modal";
import { useFormState, useFormSubmit } from "./ui/useFormSubmit";

interface RiskSettingsDialogProps {
  settings: RiskSettings;
  capital: number | null;
  onClose: () => void;
  onSaved: () => void;
}

export function RiskSettingsDialog({ settings, capital, onClose, onSaved }: RiskSettingsDialogProps) {
  const { values, update } = useFormState<RiskSettingsFormValues>(() => settingsToFormValues(settings));
  const { error, isPending, submit } = useFormSubmit(() => saveRiskSettings(values), onSaved);

  return (
    <Modal title="إعدادات المخاطرة" error={error} isPending={isPending} submitLabel="حفظ الإعدادات" onClose={onClose} onSubmit={submit} isNarrow>
      <NumberField
        label="أقصى مخاطرة في الصفقة الواحدة (٪)"
        isWide
        isRequired
        value={values.riskPercent}
        onChange={(v) => update("riskPercent", v)}
        hint={<span className="hint">الشائع بين ١٪ و٢٪.</span>}
      />
      <p className="f span2 settings-capital">
        رأس المال المستخدم في الحساب = إجمالي المحفظة (نقدية + مراكز مفتوحة + ذهب):{" "}
        <strong>{capital === null ? "لا يوجد رصيد بعد — سجّل إيداعًا من صفحة المحفظة" : formatMoney(capital)}</strong>
      </p>
    </Modal>
  );
}
