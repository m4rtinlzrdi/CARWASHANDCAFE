import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------- Button style tokens ---------- */
export const btn = {
  base: "press inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold disabled:opacity-45 disabled:pointer-events-none select-none",
  primary: "bg-navy text-white hover:bg-[#0d3057] px-4 h-11",
  gold: "bg-gold text-navy hover:bg-[#b98f4b] px-4 h-11",
  outline: "border border-line bg-white text-ink hover:border-navy/40 hover:bg-paper px-4 h-11",
  ghost: "text-muted hover:text-ink hover:bg-ink/5 px-3 h-10",
  danger: "bg-danger text-white hover:bg-[#a3403e] px-4 h-11",
  sm: "!h-9 !px-3 !text-xs",
};

/* ---------- Image with skeleton + fallback ---------- */
const FALLBACK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 320'><rect width='400' height='320' fill='#efe9dd'/><g fill='none' stroke='#c5a059' stroke-width='6' stroke-linecap='round' stroke-linejoin='round' opacity='.85'><path d='M150 130h100v60a40 40 0 0 1-40 40h-20a40 40 0 0 1-40-40z'/><path d='M250 148h14a18 18 0 0 1 0 36h-14'/><path d='M180 100c-8-10 8-16 0-26M220 100c-8-10 8-16 0-26'/></g></svg>`
  );

export function Img({ src, alt, className }: { src: string; alt: string; className?: string; eager?: boolean }) {
  // State is keyed by src so a changed src always restarts at "loading" (no effect race with cached images).
  const [rec, setRec] = useState<{ src: string; state: "ok" | "error" }>({ src: "", state: "ok" });
  const state: "loading" | "ok" | "error" = !src ? "error" : rec.src === src ? rec.state : "loading";
  return (
    <div className={cn("relative overflow-hidden bg-[#efece6]", className)}>
      {state === "loading" && <div className="skeleton absolute inset-0" aria-hidden />}
      <img
        ref={(el) => {
          if (el && el.complete && rec.src !== src && src) {
            queueMicrotask(() => setRec({ src, state: el.naturalWidth > 0 ? "ok" : "error" }));
          }
        }}
        src={state === "error" ? FALLBACK : src}
        alt={alt}
        decoding="async"
        onLoad={() => setRec((r) => (r.src === src && r.state === "error" ? r : { src, state: "ok" }))}
        onError={() => setRec({ src, state: "error" })}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-500",
          state === "loading" ? "opacity-0" : "opacity-100"
        )}
      />
    </div>
  );
}

/* ---------- Mount/unmount with exit animation ---------- */
function useExitTransition(open: boolean, ms = 320) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(id);
    }
    setShown(false);
    const t = setTimeout(() => setMounted(false), ms);
    return () => clearTimeout(t);
  }, [open, ms]);
  return { mounted, shown };
}

let scrollLocks = 0;
function lockScroll(lock: boolean) {
  scrollLocks += lock ? 1 : -1;
  document.body.style.overflow = scrollLocks > 0 ? "hidden" : "";
}

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/* ---------- Dialog: modal / bottom sheet / drawer ---------- */
interface DialogProps {
  open: boolean;
  onClose: () => void;
  variant?: "modal" | "sheet" | "drawer" | "responsive";
  label: string;
  children: ReactNode;
  panelClassName?: string;
  z?: string;
}

export function Dialog({ open, onClose, variant = "modal", label, children, panelClassName, z = "z-50" }: DialogProps) {
  const { mounted, shown } = useExitTransition(open, variant === "sheet" || variant === "drawer" ? 320 : 260);
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement as HTMLElement;
    lockScroll(true);
    const t = setTimeout(() => {
      const el = panelRef.current;
      if (!el) return;
      const first = el.querySelector<HTMLElement>("[data-autofocus]") ?? el.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? el).focus({ preventScroll: true });
    }, 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
      }
      if (e.key === "Tab" && panelRef.current) {
        const f = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((x) => x.offsetParent !== null);
        if (!f.length) return;
        const a = f[0];
        const z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          z.focus();
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      lockScroll(false);
      lastFocus.current?.focus?.({ preventScroll: true });
    };
  }, [open]);

  if (!mounted) return null;

  const layout =
    variant === "sheet"
      ? "items-end justify-center"
      : variant === "responsive"
        ? "items-end justify-center sm:items-center sm:p-4"
        : variant === "drawer"
          ? "items-stretch justify-start"
          : "items-center justify-center p-4";
  const panel =
    variant === "sheet"
      ? "sheet-panel w-full max-w-[420px] max-h-[92dvh] rounded-t-2xl bg-white flex flex-col"
      : variant === "responsive"
        ? "responsive-panel w-full max-w-[440px] max-h-[92dvh] rounded-t-2xl bg-white flex flex-col sm:max-h-[86dvh] sm:max-w-md sm:rounded-xl sm:shadow-xl"
      : variant === "drawer"
        ? "drawer-panel w-72 max-w-[85vw] h-full bg-white flex flex-col"
        : "modal-panel w-full max-w-lg max-h-[90dvh] rounded-xl bg-white flex flex-col shadow-xl";

  return createPortal(
    <div className={cn("fixed inset-0 flex", z, layout)} role="presentation">
      <div
        className="overlay-backdrop absolute inset-0 bg-[#0b1623]/50"
        data-open={shown}
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        data-open={shown}
        className={cn("relative outline-none", panel, panelClassName)}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

export function DialogHeader({ title, onClose, subtitle }: { title: string; subtitle?: string; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
      <div>
        <h2 className="font-serif text-xl leading-tight text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </div>
      <button
        onClick={onClose}
        aria-label="Close"
        className="press -mr-2 -mt-1 flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-ink/5 hover:text-ink"
      >
        <X size={18} />
      </button>
    </div>
  );
}

/* ---------- Toasts + confirm dialog ---------- */
type ToastKind = "success" | "error" | "info" | "warning";
interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}
interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

interface FeedbackCtx {
  toast: (message: string, kind?: ToastKind) => void;
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}
const Ctx = createContext<FeedbackCtx | null>(null);

export function useFeedback() {
  const c = useContext(Ctx);
  if (!c) throw new Error("FeedbackProvider missing");
  return c;
}

const TOAST_ICON = {
  success: <CheckCircle2 size={18} className="text-success" />,
  error: <XCircle size={18} className="text-danger" />,
  warning: <AlertTriangle size={18} className="text-warning" />,
  info: <Info size={18} className="text-navy" />,
};

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const [confirmState, setConfirmState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const toast = useCallback((message: string, kind: ToastKind = "success") => {
    const id = ++idRef.current;
    setToasts((t) => [...t.slice(-3), { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setConfirmState({ ...opts, resolve });
        setConfirmOpen(true);
      }),
    []
  );

  const settle = (v: boolean) => {
    confirmState?.resolve(v);
    setConfirmOpen(false);
  };

  return (
    <Ctx.Provider value={{ toast, confirm }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-3 top-3 z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:items-end"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="animate-toast pointer-events-auto flex max-w-sm items-center gap-3 rounded-lg border border-line bg-white px-4 py-3 text-sm text-ink shadow-md"
          >
            {TOAST_ICON[t.kind]}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
      <Dialog open={confirmOpen} onClose={() => settle(false)} label={confirmState?.title ?? "Confirm"} z="z-[90]" panelClassName="!max-w-sm">
        <div className="p-6">
          <div
            className={cn(
              "mb-4 flex h-11 w-11 items-center justify-center rounded-full",
              confirmState?.danger ? "bg-danger/10 text-danger" : "bg-navy/10 text-navy"
            )}
          >
            <AlertTriangle size={20} />
          </div>
          <h2 className="font-serif text-xl">{confirmState?.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{confirmState?.message}</p>
          <div className="mt-6 flex justify-end gap-2">
            <button className={cn(btn.base, btn.outline)} onClick={() => settle(false)}>
              Cancel
            </button>
            <button
              data-autofocus
              className={cn(btn.base, confirmState?.danger ? btn.danger : btn.primary)}
              onClick={() => settle(true)}
            >
              {confirmState?.confirmLabel ?? "Confirm"}
            </button>
          </div>
        </div>
      </Dialog>
    </Ctx.Provider>
  );
}

/* ---------- Switch ---------- */
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  const id = useId();
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
        checked ? "bg-navy" : "bg-[#d8d4cb]"
      )}
    >
      <span
        className={cn(
          "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
          checked ? "translate-x-5" : "translate-x-0"
        )}
        style={{ transitionTimingFunction: "var(--ease-out)" }}
      />
    </button>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-lg border border-line bg-white px-3.5 h-11 text-sm text-ink placeholder:text-[#aaa59c] transition-colors focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/10";
