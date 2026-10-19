import type { ToastState } from "./useToast";

interface ToastProps {
  toast: ToastState;
  onDismiss: () => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const handleUndo = () => {
    toast?.onUndo?.();
    onDismiss();
  };

  return (
    <div className="toast" role="status" aria-live="polite" hidden={!toast}>
      <span>{toast?.message}</span>
      {toast?.onUndo && (
        <button type="button" onClick={handleUndo}>
          تراجع
        </button>
      )}
    </div>
  );
}
