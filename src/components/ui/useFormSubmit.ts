"use client";

import { useCallback, useState, useTransition } from "react";
import type { ActionResult } from "@/lib/trades/types";

export function useFormState<T extends object>(initial: () => T) {
  const [values, setValues] = useState<T>(initial);
  const update = useCallback(<K extends keyof T>(name: K, value: T[K]) => setValues((current) => ({ ...current, [name]: value })), []);
  return { values, setValues, update };
}

export function useFormSubmit(action: () => Promise<ActionResult>, onSuccess: () => void) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) onSuccess();
      else setError(result.error);
    });
  };

  return { error, isPending, submit };
}
