import { useEffect, useRef, useState } from "react";
import { Check, Minus, Plus, Star, X } from "lucide-react";
import type { Addon, Category, Product, Table, Variant } from "@/lib/types";
import { Dialog, Img, btn } from "@/components/ui";
import { isOrderable } from "@/lib/store";
import { cn, formatRp, prefersReducedMotion } from "@/lib/utils";

/** Keeps the last non-null value so exit animations don't flash empty content. */
export function useLast<T>(value: T | null): T | null {
  const ref = useRef<T | null>(value);
  if (value !== null) ref.current = value;
  return ref.current;
}

/* ---------------- Splash ---------------- */
export function Splash({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const reduced = prefersReducedMotion();
    const t1 = setTimeout(() => setLeaving(true), reduced ? 600 : 1600);
    const t2 = setTimeout(() => {
      setGone(true);
      onDone();
    }, reduced ? 700 : 2050);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (gone) return null;
  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-navy text-white"
      style={{ opacity: leaving ? 0 : 1, transition: "opacity 450ms var(--ease-in-out)" }}
      aria-label="ASIA Cafe"
      role="img"
    >
      <div style={{ animation: "splash-in 900ms var(--ease-out) both" }} className="flex flex-col items-center px-8 text-center">
        <h1 className="font-serif text-[64px] font-medium leading-none tracking-[0.22em] pl-[0.22em]">ASIA</h1>
        <div className="my-5 h-px w-16 bg-gold" />
        <p className="text-[11px] font-medium uppercase tracking-[0.34em] pl-[0.34em] text-white/85">Cafe &amp; Eatery</p>
        <p className="mt-8 font-serif text-base italic text-gold" style={{ animation: "fade-in 800ms 500ms var(--ease-out) both" }}>
          “Your Moment, Your Comfort.”
        </p>
      </div>
    </div>
  );
}

/* ---------------- Table selection (only when the QR link has no valid table) ---------------- */
export function TableSelect({
  tables,
  onSelect,
  invalid,
  inactiveId,
}: {
  tables: Table[];
  onSelect: (id: string) => void;
  invalid?: boolean;
  inactiveId?: string | null;
}) {
  return (
    <div className="animate-fade-up px-5 pb-16 pt-14">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-[30px] leading-none tracking-[0.2em]">ASIA</h1>
          <p className="mt-1 text-[10px] uppercase tracking-[0.24em] text-muted">Cafe &amp; Eatery</p>
        </div>
        <a
          href="#/admin/login"
          title="Login Admin Cafe"
          className="press inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-muted shadow-sm hover:border-gold hover:text-navy transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>Admin</span>
        </a>
      </div>
      <div className="my-6 h-px w-10 bg-gold" />
      <h2 className="font-serif text-2xl leading-snug">
        {inactiveId ? "Meja ini sedang tidak aktif." : invalid ? "Kode meja tidak dikenali." : "Selamat datang di ASIA."}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {inactiveId
          ? "Silakan pilih meja lain atau hubungi staf kami."
          : "Normalnya Anda masuk langsung dari QR / NFC di meja. Tautan ini belum membawa nomor meja — pilih meja Anda di bawah."}
      </p>
      <div className="mt-6 grid grid-cols-4 gap-2" role="group" aria-label="Pilih meja">
        {tables.map((t) => (
          <button
            key={t.id}
            disabled={!t.active}
            onClick={() => onSelect(t.id)}
            aria-label={t.name}
            className={cn(
              "press h-12 rounded-lg border text-sm font-semibold tabular",
              t.active ? "border-line bg-white text-ink hover:border-navy hover:bg-navy hover:text-white" : "border-line bg-paper text-[#bbb6ac] line-through"
            )}
          >
            {t.id}
          </button>
        ))}
      </div>
      <p className="mt-6 text-xs text-muted">
        URL meja: <span className="font-medium text-ink">?table=10</span> · <span className="font-medium text-ink">?table=VIP</span>
      </p>
    </div>
  );
}

/* ---------------- Category bar ---------------- */
export function CategoryBar({ categories, active, onChange }: { categories: Category[]; active: string; onChange: (id: string) => void }) {
  const items = [{ id: "all", name: "All" }, ...categories];
  const wrap = useRef<HTMLDivElement>(null);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [ind, setInd] = useState({ x: 0, w: 0, ready: false });

  useEffect(() => {
    const el = refs.current[active];
    if (!el) return;
    setInd({ x: el.offsetLeft, w: el.offsetWidth, ready: true });
    const w = wrap.current;
    if (w) w.scrollTo({ left: el.offsetLeft - 24, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [active, categories]);

  return (
    <nav aria-label="Kategori menu" className="sticky top-0 z-30 border-b border-line bg-paper">
      <div ref={wrap} className="no-scrollbar overflow-x-auto px-5">
        <div className="relative flex w-max gap-1" role="tablist">
          {items.map((c) => (
            <button
              key={c.id}
              ref={(el) => {
                refs.current[c.id] = el;
              }}
              role="tab"
              aria-selected={active === c.id}
              onClick={() => onChange(c.id)}
              className={cn("press h-12 whitespace-nowrap px-3.5 text-sm font-medium transition-colors", active === c.id ? "text-navy" : "text-muted hover:text-ink")}
            >
              {c.name}
            </button>
          ))}
          <span
            aria-hidden
            className="absolute bottom-0 left-0 h-[2px] bg-gold"
            style={{
              width: ind.w,
              transform: `translateX(${ind.x}px)`,
              transition: ind.ready ? "transform 300ms var(--ease-out), width 300ms var(--ease-out)" : "none",
            }}
          />
        </div>
      </div>
    </nav>
  );
}

/* ---------------- Product card ---------------- */
export function ProductCard({
  product,
  index,
  qty,
  ready,
  onOpen,
  onAdd,
}: {
  product: Product;
  index: number;
  qty: number;
  ready: boolean;
  onOpen: () => void;
  onAdd: () => void;
}) {
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(false), 900);
    return () => clearTimeout(t);
  }, [flash]);
  const orderable = isOrderable(product);
  const low = product.trackStock && orderable && product.stock <= product.lowStockThreshold;

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-line bg-white transition-colors duration-200 hover:border-navy/25",
        ready ? "animate-fade-up" : "opacity-0"
      )}
      style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
    >
      <button onClick={onOpen} className="press flex flex-1 flex-col text-left" aria-label={`Lihat detail ${product.name}`}>
        <div className="relative overflow-hidden">
          <Img
            src={product.image}
            alt={product.name}
            className={cn("aspect-[4/3] [&_img]:transition-transform [&_img]:duration-500 group-hover:[&_img]:scale-105", !orderable && "[&_img]:grayscale")}
          />
          {!orderable ? (
            <span className="absolute left-2 top-2 rounded bg-ink/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">Habis</span>
          ) : (
            product.featured && (
              <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded bg-white/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-navy">
                <Star size={10} className="fill-gold text-gold" /> Signature
              </span>
            )
          )}
          {low && (
            <span className="absolute right-2 top-2 rounded bg-warning/90 px-2 py-0.5 text-[10px] font-semibold text-white">Sisa {product.stock}</span>
          )}
        </div>
        <div className="flex-1 px-3 pb-1 pt-3">
          <h3 className="text-[15px] font-semibold leading-snug text-ink">{product.name}</h3>
          <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-muted">{product.description}</p>
        </div>
      </button>
      <div className="flex items-center justify-between px-3 pb-3 pt-1.5">
        <span className="text-sm font-semibold tabular text-navy">{formatRp(product.price)}</span>
        <button
          onClick={() => {
            onAdd();
            setFlash(true);
          }}
          disabled={!orderable}
          aria-label={`Tambah ${product.name} ke keranjang`}
          className={cn(
            "press relative flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors",
            flash ? "bg-success" : "bg-navy hover:bg-[#0d3057]",
            !orderable && "!bg-[#d8d4cb]"
          )}
        >
          {flash ? <Check size={16} strokeWidth={2.5} /> : <Plus size={16} strokeWidth={2.5} />}
          {qty > 0 && (
            <span key={qty} className="animate-badge absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-navy">
              {qty}
            </span>
          )}
        </button>
      </div>
    </article>
  );
}

export function ProductSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white" aria-hidden>
      <div className="skeleton aspect-[4/3]" />
      <div className="space-y-2 p-3">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-2/3 rounded" />
        <div className="flex items-center justify-between pt-2">
          <div className="skeleton h-4 w-16 rounded" />
          <div className="skeleton h-9 w-9 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/* ---------------- Quantity stepper ---------------- */
export function Stepper({ qty, onChange, small }: { qty: number; onChange: (n: number) => void; small?: boolean }) {
  const size = small ? "h-8 w-8" : "h-11 w-11";
  return (
    <div className="inline-flex items-center rounded-full border border-line bg-white">
      <button onClick={() => onChange(qty - 1)} aria-label="Kurangi jumlah" className={cn("press flex items-center justify-center rounded-full text-ink hover:bg-ink/5", size)}>
        <Minus size={small ? 14 : 16} />
      </button>
      <span className={cn("text-center text-sm font-semibold tabular", small ? "w-6" : "w-8")} aria-live="polite">
        {qty}
      </span>
      <button onClick={() => onChange(qty + 1)} aria-label="Tambah jumlah" className={cn("press flex items-center justify-center rounded-full text-ink hover:bg-ink/5", size)}>
        <Plus size={small ? 14 : 16} />
      </button>
    </div>
  );
}

/* ---------------- Product detail (bottom sheet on mobile, modal on desktop) ---------------- */
export interface ProductChoice {
  qty: number;
  variant?: Variant;
  addons: Addon[];
  instructions: string;
}

export function ProductSheet({
  product,
  categoryName,
  onClose,
  onAdd,
}: {
  product: Product | null;
  categoryName?: string;
  onClose: () => void;
  onAdd: (p: Product, choice: ProductChoice) => void;
}) {
  const p = useLast(product);
  const [qty, setQty] = useState(1);
  const [variantId, setVariantId] = useState<string | undefined>(undefined);
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [instructions, setInstructions] = useState("");

  useEffect(() => {
    if (!product) return;
    setQty(1);
    setVariantId(product.variants.find((v) => v.available)?.id);
    setAddonIds([]);
    setInstructions("");
  }, [product]);

  const variant = p?.variants.find((v) => v.id === variantId && v.available);
  const addons = p?.addons.filter((a) => addonIds.includes(a.id) && a.available) ?? [];
  const unit = (p?.price ?? 0) + (variant?.priceDelta ?? 0) + addons.reduce((s, a) => s + a.price, 0);
  const total = unit * qty;
  const orderable = p ? isOrderable(p) : false;

  const toggleAddon = (id: string) => setAddonIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  return (
    <Dialog open={!!product} onClose={onClose} variant="responsive" label={p ? `Detail ${p.name}` : "Detail produk"}>
      {p && (
        <>
          <div className="relative shrink-0 overflow-hidden rounded-t-2xl sm:rounded-t-xl">
            <Img src={p.image} alt={p.name} className="aspect-[4/3] w-full animate-fade-in [&_img]:animate-fade-in" />
            <button onClick={onClose} aria-label="Tutup" className="press absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-ink shadow-sm backdrop-blur">
              <X size={18} />
            </button>
            {p.featured && (
              <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-navy">
                <Star size={11} className="fill-gold text-gold" /> Signature
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-2 pt-4">
            <div className="animate-fade-up" style={{ animationDuration: "260ms" }}>
              {categoryName && <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">{categoryName}</p>}
              <h2 className="mt-1 font-serif text-[26px] leading-tight sm:text-[28px]">{p.name}</h2>
              <p className="mt-2.5 text-sm leading-relaxed text-muted">{p.description}</p>
              <p className="mt-3 text-xl font-semibold tabular text-navy">{formatRp(p.price)}</p>
            </div>

            {p.variants.length > 0 && (
              <fieldset className="mt-5">
                <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Pilihan</legend>
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(p.variants.length, 3)}, minmax(0,1fr))` }} role="radiogroup">
                  {p.variants.map((v) => (
                    <button
                      key={v.id}
                      role="radio"
                      aria-checked={variantId === v.id}
                      disabled={!v.available}
                      onClick={() => setVariantId(v.id)}
                      className={cn(
                        "press rounded-lg border p-2.5 text-left transition-colors",
                        variantId === v.id ? "border-navy bg-navy/[0.04] ring-1 ring-navy" : "border-line bg-white hover:border-navy/30",
                        !v.available && "opacity-40"
                      )}
                    >
                      <span className="block text-sm font-semibold">{v.name}</span>
                      <span className="mt-0.5 block text-[11px] text-muted tabular">{v.priceDelta ? `+${formatRp(v.priceDelta)}` : "Harga dasar"}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {p.addons.length > 0 && (
              <fieldset className="mt-5">
                <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Tambahan</legend>
                <div className="space-y-1.5">
                  {p.addons.map((a) => {
                    const checked = addonIds.includes(a.id);
                    return (
                      <label
                        key={a.id}
                        className={cn(
                          "press flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                          checked ? "border-navy bg-navy/[0.04]" : "border-line bg-white hover:border-navy/30",
                          !a.available && "pointer-events-none opacity-40"
                        )}
                      >
                        <span className="flex items-center gap-2.5">
                          <input type="checkbox" checked={checked} onChange={() => toggleAddon(a.id)} className="sr-only" />
                          <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded border", checked ? "border-navy bg-navy text-white" : "border-line bg-white")}>
                            {checked && <Check size={13} strokeWidth={3} />}
                          </span>
                          <span className="text-sm font-medium">{a.name}</span>
                        </span>
                        <span className="text-xs font-semibold tabular text-muted">{a.price ? `+${formatRp(a.price)}` : "Gratis"}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}

            <div className="mt-5">
              <label htmlFor="item-instructions" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
                Catatan untuk item ini <span className="font-normal normal-case tracking-normal">(opsional)</span>
              </label>
              <input
                id="item-instructions"
                value={instructions}
                maxLength={120}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Contoh: gula sedikit, tanpa es, alergi kacang…"
                className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm placeholder:text-[#aaa59c] focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/10"
              />
            </div>

            {p.trackStock && (
              <p className={cn("mt-4 text-xs", p.stock <= p.lowStockThreshold ? "font-semibold text-warning" : "text-muted")}>
                {p.stock > 0 ? `Tersedia ${p.stock} ${p.unit}` : "Sedang habis"}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 border-t border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Stepper qty={qty} onChange={(n) => setQty(Math.max(1, Math.min(20, n)))} />
            <button
              disabled={!orderable}
              onClick={() => onAdd(p, { qty, variant, addons, instructions })}
              className={cn(btn.base, btn.primary, "h-11 flex-1")}
            >
              {orderable ? (
                <>
                  Tambah <span className="opacity-60">·</span> <span className="tabular">{formatRp(total)}</span>
                </>
              ) : (
                "Sedang habis"
              )}
            </button>
          </div>
        </>
      )}
    </Dialog>
  );
}
