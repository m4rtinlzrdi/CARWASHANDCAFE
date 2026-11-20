import { useEffect, useRef, useState } from "react";
import { Banknote, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import type { CartLine, Product } from "@/lib/types";
import { Dialog, DialogHeader, Img } from "@/components/ui";
import { priceCart } from "@/lib/store";
import { Stepper } from "./parts";
import { cn, formatRp, uid } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  lines: CartLine[];
  products: Product[];
  tableName: string;
  onQty: (key: string, qty: number) => void;
  onRemove: (key: string) => void;
  onSubmit: (input: { notes: string; clientToken: string; customerName: string; paymentMethod: string }) => Promise<string | null> | string | null;
}

export function CartSheet({ open, onClose, lines, products, tableName, onQty, onRemove, onSubmit }: Props) {
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Tunai");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const tokenRef = useRef<string>("");
  const busyRef = useRef(false);

  const rows = priceCart(lines, products);
  const total = rows.reduce((s, r) => s + r.lineTotal, 0);
  const count = rows.reduce((s, r) => s + r.qty, 0);

  useEffect(() => {
    if (!open) return;
    setSubmitting(false);
    busyRef.current = false;
    setError(null);
    // One idempotency token per checkout attempt session → duplicate taps can never create two orders
    if (!tokenRef.current) tokenRef.current = uid();
  }, [open]);

  const submit = async () => {
    if (busyRef.current) return;
    if (!rows.length) {
      setError("Keranjang masih kosong.");
      return;
    }
    if (!customerName.trim()) {
      setError("Mohon isi nama pemesan terlebih dahulu.");
      return;
    }

    // Minta izin notifikasi tepat saat klik tombol konfirmasi pesanan
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        try {
          await Notification.requestPermission();
        } catch (e) {
          // ignore
        }
      }
    }

    busyRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const err = await onSubmit({ notes, clientToken: tokenRef.current, customerName, paymentMethod });
      if (err) {
        setError(err);
        setSubmitting(false);
        busyRef.current = false;
      } else {
        tokenRef.current = "";
        setNotes("");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setSubmitting(false);
      busyRef.current = false;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} variant="responsive" label="Keranjang dan checkout">
      <DialogHeader title="Pesanan Anda" subtitle={`${tableName} · ${count} item`} onClose={onClose} />
      <div className="flex-1 overflow-y-auto px-5 py-3">
        {rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">Keranjang Anda masih kosong.</p>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((row) => (
              <li key={row.product.id + row.product.id} className="py-3.5">
                <div className="flex gap-3">
                  <Img src={row.product.image} alt={row.product.name} className="h-16 w-16 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold leading-snug">{row.product.name}</h3>
                      <span className="shrink-0 text-sm font-semibold tabular">{formatRp(row.lineTotal)}</span>
                    </div>
                    <p className="text-xs text-muted tabular">
                      {row.variant ? `${row.variant.name} · ` : ""}
                      {formatRp(row.unitPrice)} / item
                    </p>
                    {row.addons.length > 0 && (
                      <p className="mt-0.5 text-[11px] leading-snug text-[#8a6b2c]">+ {row.addons.map((a) => a.name).join(", ")}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <Stepper small qty={row.qty} onChange={(n) => onQty(row.lineKey, n)} />
                      <button
                        onClick={() => onRemove(row.lineKey)}
                        aria-label={`Hapus ${row.product.name}`}
                        className="press flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {row.instructions && <p className="mt-2 rounded bg-paper px-2 py-1 text-[11px] leading-snug text-muted">Catatan: {row.instructions}</p>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {rows.length > 0 && (
          <>
            <div className="mt-3 space-y-3">
              <div>
                <label htmlFor="customer-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
                  Nama Pemesan <span className="text-danger">*</span>
                </label>
                <input
                  id="customer-name"
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Masukkan nama Anda (misal: Budi)"
                  className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm placeholder:text-[#aaa59c] focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/10"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["Tunai", "QRIS"].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-xs font-semibold transition-all",
                        paymentMethod === method
                          ? "border-navy bg-navy text-white shadow-sm"
                          : "border-line bg-white text-muted hover:border-navy/40 hover:text-ink"
                      )}
                    >
                      {method === "Tunai" ? "💵 Tunai di Kasir" : "📱 QRIS"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="order-notes" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
                  Catatan pesanan <span className="font-normal normal-case tracking-normal">(opsional)</span>
                </label>
                <textarea
                  id="order-notes"
                  value={notes}
                  maxLength={200}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Contoh: pedas, sedikit gula, tanpa es…"
                  className="w-full resize-none rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm placeholder:text-[#aaa59c] focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/10"
                />
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-line bg-paper p-3.5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-navy">
                  <Banknote size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">Pembayaran {paymentMethod} di kasir</p>
                  <p className="text-xs text-muted">Pesanan langsung masuk ke antrean kasir toko.</p>
                </div>
              </div>
            </div>

            <dl className="mt-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-muted">
                <dt>Subtotal</dt>
                <dd className="tabular">{formatRp(total)}</dd>
              </div>
              <div className="flex justify-between text-muted">
                <dt>Biaya layanan</dt>
                <dd className="tabular">Rp 0</dd>
              </div>
            </dl>
          </>
        )}
      </div>

      <div className="border-t border-line px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
        {error && (
          <p role="alert" className="mb-3 rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
            {error}
          </p>
        )}
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-sm text-muted">Total Pembayaran</span>
          <span className="text-xl font-semibold tabular text-navy">{formatRp(total)}</span>
        </div>
        <button disabled={!rows.length || submitting} onClick={submit} className={cn("press flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-navy text-sm font-semibold text-white hover:bg-[#0d3057] disabled:opacity-45")}>
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Mengirim pesanan…
            </>
          ) : (
            <>
              <ShieldCheck size={16} /> Kirim Pesanan ke Kasir
            </>
          )}
        </button>
        <p className="mt-2 text-center text-[11px] leading-relaxed text-muted">Pesanan diteruskan ke kasir. Pembayaran dilakukan tunai di kasir.</p>
      </div>
    </Dialog>
  );
}
