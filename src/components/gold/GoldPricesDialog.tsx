"use client";

import { saveGoldPrices } from "@/app/actions/gold";
import { pricesToFormValues } from "@/lib/gold/schema";
import type { GoldPriceFormValues, GoldPrices } from "@/lib/gold/types";
import { NumberField } from "../ui/fields";
import { Modal } from "../ui/Modal";
import { useFormState, useFormSubmit } from "../ui/useFormSubmit";

interface GoldPricesDialogProps {
  prices: GoldPrices;
  onClose: () => void;
  onSaved: () => void;
}

export function GoldPricesDialog({ prices, onClose, onSaved }: GoldPricesDialogProps) {
  const { values, update } = useFormState<GoldPriceFormValues>(() => pricesToFormValues(prices));
  const { error, isPending, submit } = useFormSubmit(() => saveGoldPrices(values), onSaved);

  return (
    <Modal title="سعر جرام الذهب اليوم" error={error} isPending={isPending} submitLabel="حفظ الأسعار" onClose={onClose} onSubmit={submit} isNarrow>
      <NumberField label="عيار 21" isWide placeholder="مثال: 3500" value={values.price21} onChange={(v) => update("price21", v)} />
      <NumberField label="عيار 24" placeholder="اختياري" value={values.price24} onChange={(v) => update("price24", v)} />
      <NumberField label="عيار 18" placeholder="اختياري" value={values.price18} onChange={(v) => update("price18", v)} />
      <p className="hint span2">أي عيار تتركه فارغًا يُحسب تقديريًا من العيارات الأخرى حسب النقاء.</p>
    </Modal>
  );
}
