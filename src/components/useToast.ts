"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const TOAST_MS = 3000;
const UNDO_TOAST_MS = 7000;

export type ToastState = { message: string; onUndo?: () => void } | null;

export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const hideToast = useCallback(() => setToast(null), []);

  const showToast = useCallback((message: string, onUndo?: () => void) => {
    clearTimeout(timer.current);
    setToast({ message, onUndo });
    timer.current = setTimeout(() => setToast(null), onUndo ? UNDO_TOAST_MS : TOAST_MS);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return { toast, showToast, hideToast };
}
