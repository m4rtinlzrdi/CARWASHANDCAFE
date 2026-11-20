import { useEffect, useState } from "react";
import { BadgeCheck, Banknote, Clock3, BellRing } from "lucide-react";
import type { Order, OrderStatus } from "@/lib/types";
import { useStore, updateOrderStatus, setOrderPaid } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { btn } from "@/components/ui";
import { cn, formatRp, formatTime } from "@/lib/utils";

const STEPS: { id: OrderStatus; label: string }[] = [
  { id: "PENDING", label: "Diterima" },
  { id: "CONFIRMED", label: "Dikonfirmasi" },
  { id: "PREPARING", label: "Diproses" },
  { id: "READY", label: "Siap Ambil" },
  { id: "COMPLETED", label: "Selesai" },
];

export function OrderSuccess({ order: initial, tableName, onBack }: { order: Order; tableName: string; onBack: () => void }) {
  const orders = useStore("orders");
  const order = orders.find((o) => o.id === initial.id) ?? initial;
  const [remoteStatus, setRemoteStatus] = useState<OrderStatus>(order.status);
  const [remotePaid, setRemotePaid] = useState<boolean>(order.paymentStatus === "PAID");

  // Mainkan suara nada bel (bell ding) menggunakan Web Audio API + Getar HP
  const playAlert = () => {
    try {
      // 1. Getar HP (Vibration API untuk Android / Mobile)
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([250, 100, 250, 100, 400]);
      }

      // 2. Mainkan suara Audio Chime (Dua nada manis: Ding-Dong)
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const playTone = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0, ctx.currentTime + start);
        gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur);
      };

      // Nada 1 (Ding: 659 Hz / E5), Nada 2 (Dong: 880 Hz / A5)
      playTone(659.25, 0, 0.4);
      playTone(880.0, 0.35, 0.7);
    } catch (e) {
      console.warn("Audio/vibrate error:", e);
    }
  };

  // Polling & Websocket Realtime Supabase (Instan & Multi-device)
  useEffect(() => {
    // 1. Fetch data awal dari Supabase
    const loadInitialStatus = async () => {
      try {
        const { data } = await supabase
          .from("orders")
          .select("*")
          .or(`id.eq.${order.number},id.eq.${order.id}`)
          .single();

        if (data) {
          applyStatus(data.status, data.payment_status === "PAID" || data.status === "selesai");
        }
      } catch (e) {
        checkKasirProLocal();
      }
    };

    const applyStatus = (rawSt: string, isPaid: boolean) => {
      let s: OrderStatus = "PENDING";
      const st = (rawSt || "").toLowerCase().trim();
      if (st === "pending" || st === "menunggu" || st === "diterima") s = "PENDING";
      else if (st === "confirmed" || st === "dikonfirmasi" || st === "konfirmasi") s = "CONFIRMED";
      else if (st === "diproses" || st === "processing" || st === "preparing" || st === "proses") s = "PREPARING";
      else if (st === "ready" || st === "siap" || st === "siap ambil" || st === "siap diambil") s = "READY";
      else if (st === "selesai" || st === "completed" || st === "paid") s = "COMPLETED";
      else if (st === "dibatalkan" || st === "cancelled" || st === "ditolak") s = "CANCELLED";

      if (s === "READY" && remoteStatus !== "READY") {
        playAlert();
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          new Notification("Pesanan Siap Diambil!", {
            body: `Pesanan #${order.number} sudah siap diambil. Silakan menuju kasir.`,
            icon: "/favicon.ico",
          });
        }
      }

      setRemoteStatus(s);
      if (isPaid) setRemotePaid(true);

      if (order.status !== s) {
        updateOrderStatus(order.id, s, "KasirPro");
      }
      if (isPaid && order.paymentStatus !== "PAID") {
        setOrderPaid(order.id, true, "Kasir");
      }
    };

    const checkKasirProLocal = async () => {
      try {
        const res = await fetch(`http://localhost/KasirPro/api/order_status.php?order_number=${encodeURIComponent(order.number)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.ok && data.order) {
          applyStatus(data.order.status, !!data.order.paid);
        }
      } catch (e) {}
    };

    loadInitialStatus();

    // 2. Langganan Supabase Realtime Channel
    const channel = supabase
      .channel(`order-channel-${order.number}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          if (payload.new) {
            const next = payload.new as { id: string; status: string; payment_status?: string };
            if (next.id === order.number || next.id === order.id) {
              applyStatus(next.status, next.payment_status === "PAID" || next.status === "selesai");
            }
          }
        }
      )
      .subscribe();

    // 3. Fallback interval polling setiap 5 detik
    const timer = setInterval(() => {
      loadInitialStatus();
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(timer);
    };
  }, [order.id, order.number, order.status, order.paymentStatus, remoteStatus]);

  const currentStatus = remoteStatus || order.status;
  const idx = STEPS.findIndex((s) => s.id === currentStatus);
  const cancelled = currentStatus === "CANCELLED";
  const paid = remotePaid || order.paymentStatus === "PAID";
  const isReady = currentStatus === "READY";

  return (
    <div className="px-5 pb-12 pt-10">
      <div className="flex flex-col items-center text-center">
        <div className="animate-fade-in flex h-16 w-16 items-center justify-center rounded-full border border-success/30 bg-success/10">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#3F795C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path className="animate-check" d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </div>
        <p className="animate-fade-up mt-6 text-[11px] font-semibold uppercase tracking-[0.34em] pl-[0.34em] text-gold" style={{ animationDelay: "120ms" }}>
          Pesanan Diterima
        </p>
        <h1 className="animate-fade-up mt-2 font-serif text-[27px] leading-tight" style={{ animationDelay: "200ms" }}>
          Terima kasih telah
          <br />
          memesan di ASIA.
        </h1>
        <p className="mt-2 text-sm text-muted">Tunjukkan nomor pesanan ini ke kasir.</p>
      </div>

      <div className="animate-fade-up mt-7 overflow-hidden rounded-xl border border-line bg-white" style={{ animationDelay: "280ms" }}>
        <div className="grid grid-cols-2 divide-x divide-line border-b border-line">
          <div className="p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Nomor Pesanan</p>
            <p className="mt-1 text-sm font-semibold tabular text-navy">{order.number}</p>
          </div>
          <div className="p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Meja</p>
            <p className="mt-1 text-sm font-semibold">{tableName}</p>
          </div>
        </div>

        <ul className="divide-y divide-line px-4">
          {order.items.map((it, i) => (
            <li key={`${it.productId}-${i}`} className="py-3">
              <div className="flex items-start justify-between gap-3 text-sm">
                <div>
                  <p>
                    <span className="mr-2 font-semibold tabular text-muted">{it.qty}×</span>
                    {it.name}
                  </p>
                  {(it.variant || it.addons.length > 0) && (
                    <p className="mt-0.5 text-[11px] leading-snug text-muted">
                      {[it.variant, ...it.addons.map((a) => a.name)].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {it.instructions && <p className="mt-0.5 text-[11px] italic leading-snug text-muted">“{it.instructions}”</p>}
                </div>
                <span className="shrink-0 tabular text-ink">{formatRp(it.lineTotal)}</span>
              </div>
            </li>
          ))}
        </ul>
        {order.notes && (
          <p className="border-t border-line bg-paper px-4 py-3 text-xs leading-relaxed text-muted">
            <span className="font-semibold text-ink">Catatan:</span> {order.notes}
          </p>
        )}
        <div className="flex items-baseline justify-between border-t border-line px-4 py-4">
          <span className="text-sm text-muted">Total Pembayaran</span>
          <span className="text-lg font-semibold tabular text-navy">{formatRp(order.total)}</span>
        </div>

        <div className="border-t border-line bg-paper px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-xs font-semibold text-ink">
              <Banknote size={15} /> Cash · bayar di kasir
            </p>
            <span
              className={cn(
                "chip inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
                paid ? "border-success/30 bg-success/10 text-success" : "border-danger/30 bg-danger/10 text-danger"
              )}
            >
              {paid ? <BadgeCheck size={13} /> : <Clock3 size={13} />}
              {paid ? "Paid" : "Unpaid"}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
            {paid
              ? `Pembayaran tunai sudah diverifikasi kasir${order.paidBy ? ` (${order.paidBy})` : ""}. Terima kasih!`
              : "Pesanan belum dibayar. Silakan serahkan pembayaran tunai ke kasir; status akan berubah menjadi PAID setelah diverifikasi."}
          </p>
        </div>
      </div>

      {isReady && !paid && (
        <div className="animate-bounce mt-4 rounded-xl border border-success bg-success/15 p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-success font-bold text-sm">
            <BellRing size={20} />
            <span>KENDARAAN / PESANAN SUDAH SELESAI DICUCI!</span>
          </div>
          <p className="mt-1 text-xs text-ink font-medium">
            Silakan menuju ke kasir untuk mengambil kunci/pesanan dan menyelesaikan pembayaran sebesar <b>{formatRp(order.total)}</b>.
          </p>
        </div>
      )}

      <div className="animate-fade-up mt-5 rounded-xl border border-line bg-white p-4" style={{ animationDelay: "360ms" }}>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Status Pesanan</p>
          <p className="text-xs text-muted">{formatTime(order.createdAt)}</p>
        </div>
        {cancelled ? (
          <p className="rounded-lg bg-danger/10 px-3 py-2.5 text-sm font-medium text-danger">Pesanan dibatalkan oleh kasir. Silakan hubungi staf kami.</p>
        ) : (
          <ol className="flex items-start" aria-label="Progres pesanan">
            {STEPS.map((s, i) => {
              const done = i <= idx;
              return (
                <li key={s.id} className="relative flex flex-1 flex-col items-center" aria-current={i === idx ? "step" : undefined}>
                  {i > 0 && <span className={cn("absolute right-1/2 top-[7px] h-0.5 w-full transition-colors duration-500", i <= idx ? "bg-navy" : "bg-line")} aria-hidden />}
                  <span
                    className={cn(
                      "relative z-10 h-4 w-4 rounded-full border-2 transition-all duration-500",
                      done ? "border-navy bg-navy" : "border-line bg-white",
                      i === idx && i < STEPS.length - 1 && "ring-4 ring-gold/30"
                    )}
                  />
                  <span className={cn("mt-2 text-center text-[10px] leading-tight transition-colors", done ? "font-semibold text-ink" : "text-muted")}>{s.label}</span>
                </li>
              );
            })}
          </ol>
        )}
        <p className="mt-4 text-[11px] leading-relaxed text-muted">Halaman ini memperbarui status secara otomatis saat kasir memproses pesanan Anda.</p>
      </div>

      <button onClick={onBack} className={cn(btn.base, btn.outline, "mt-5 w-full")}>
        Pesan Lagi
      </button>
    </div>
  );
}
