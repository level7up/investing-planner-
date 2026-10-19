"use client";

import { useEffect, useId, type FormEvent, type ReactNode } from "react";

interface ModalProps {
  title: string;
  error: string | null;
  isPending: boolean;
  submitLabel: string;
  onClose: () => void;
  onSubmit: () => void;
  footerExtra?: ReactNode;
  isNarrow?: boolean;
  children: ReactNode;
}

export function Modal({ title, error, isPending, submitLabel, onClose, onSubmit, footerExtra, isNarrow = false, children }: ModalProps) {
  const titleId = useId();

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
    onSubmit();
  };

  return (
    <div className="overlay">
      <div className={isNarrow ? "sheet sheet--narrow" : "sheet"} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <form className="trade-form" onSubmit={handleSubmit}>
          <div className="sheet-head">
            <h2 id={titleId}>{title}</h2>
            <button className="icon-btn" type="button" aria-label="إغلاق" onClick={onClose}>✕</button>
          </div>
          <div className="sheet-body">
            {error && <p className="alert alert--error" role="alert">{error}</p>}
            <div className="grid">{children}</div>
          </div>
          <div className="sheet-foot">
            {footerExtra}
            <div className={footerExtra ? "foot-actions" : "foot-actions foot-actions--end"}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>إلغاء</button>
              <button type="submit" className="btn btn-primary" disabled={isPending}>{isPending ? "جارٍ الحفظ…" : submitLabel}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
