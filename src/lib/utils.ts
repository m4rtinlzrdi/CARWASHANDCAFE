import { useEffect, useRef, useState } from "react";
import type { OrderStatus, PaymentStatus } from "./types";

export { cn } from "@/utils/cn";

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

const rp = new Intl.NumberFormat("id-ID");
export const formatRp = (n: number) => `Rp ${rp.format(Math.round(n))}`;

export const formatTime = (ts: number) =>
  new Date(ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }).replace(".", ":");

export const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export function timeAgo(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return formatDate(ts);
}

export const startOfDay = (ts = Date.now()) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** "1" -> "01", "vip" -> "VIP". Returns null if it isn't a plausible table id. */
export function normalizeTable(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const v = raw.trim().toUpperCase();
  if (v === "VIP") return "VIP";
  if (/^\d{1,2}$/.test(v)) return v.padStart(2, "0");
  return null;
}

export const tableLabel = (id: string) => (id === "VIP" ? "VIP" : `MEJA ${id}`);

export function tableUrl(id: string, extra = ""): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}?table=${id}${extra}`;
}

export const STATUS_META: Record<OrderStatus, { label: string; cls: string; dot: string }> = {
  PENDING: { label: "Pending", cls: "bg-warning/10 text-warning border-warning/30", dot: "bg-warning" },
  CONFIRMED: { label: "Confirmed", cls: "bg-navy/8 text-navy border-navy/20", dot: "bg-navy" },
  PREPARING: { label: "Preparing", cls: "bg-gold/15 text-[#8a6b2c] border-gold/40", dot: "bg-gold" },
  READY: { label: "Ready", cls: "bg-success/10 text-success border-success/30", dot: "bg-success" },
  COMPLETED: { label: "Completed", cls: "bg-ink/5 text-muted border-line", dot: "bg-muted" },
  CANCELLED: { label: "Cancelled", cls: "bg-danger/10 text-danger border-danger/30", dot: "bg-danger" },
};

export const PAYMENT_META: Record<PaymentStatus, { label: string; cls: string }> = {
  UNPAID: { label: "Unpaid", cls: "bg-danger/10 text-danger border-danger/30" },
  PAID: { label: "Paid", cls: "bg-success/10 text-success border-success/30" },
};

/* ---------- Hooks ---------- */

/** Smoothly tweens a number (rAF, ~320ms). Falls back to instant under reduced motion. */
export function useAnimatedNumber(target: number, duration = 320) {
  const [val, setVal] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (prefersReducedMotion()) {
      setVal(target);
      from.current = target;
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = origin + (target - origin) * eased;
      from.current = v;
      setVal(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

/** Re-renders every `ms` — keeps relative timestamps fresh. */
export function useTick(ms = 30000) {
  const [, set] = useState(0);
  useEffect(() => {
    const id = setInterval(() => set((n) => n + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
}

/* ---------- Notification sound (WebAudio synth, no asset needed) ---------- */
let audioCtx: AudioContext | null = null;
export function playChime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    audioCtx = audioCtx ?? new Ctx();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    const ctx = audioCtx;
    const now = ctx.currentTime;
    [880, 1318.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const t0 = now + i * 0.16;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.7);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.75);
    });
  } catch {
    /* audio unavailable */
  }
}

/** Downscale an image file to a compact JPEG data URL (keeps localStorage small). */
export function fileToDataUrl(file: File, max = 720): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode"));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
