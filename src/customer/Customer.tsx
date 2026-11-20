import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, ShoppingBag } from "lucide-react";
import type { CartLine, Order, Product } from "@/lib/types";
import { cartTotal, isOrderable, lineKey, loadCart, placeOrder, priceCart, saveCart, useStore } from "@/lib/store";
import { useTableParam } from "@/lib/router";
import { Dialog, DialogHeader, Img, useFeedback } from "@/components/ui";
import { cn, formatRp, useAnimatedNumber } from "@/lib/utils";
import { CategoryBar, ProductCard, ProductSheet, ProductSkeleton, Splash, TableSelect, type ProductChoice } from "./parts";
import { CartSheet } from "./CartSheet";
import { OrderSuccess } from "./OrderSuccess";

export function Customer() {
  const products = useStore("products");
  const categories = useStore("categories");
  const tables = useStore("tables");
  const settings = useStore("settings");
  const { table: tableId, setTable, rawProvided } = useTableParam();
  const { toast } = useFeedback();

  const [splashDone, setSplashDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartLine[]>(loadCart);
  const [placed, setPlaced] = useState<Order | null>(null);
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 850);
    return () => clearTimeout(t);
  }, []);

  // Cart survives category switches, table changes and refresh
  useEffect(() => saveCart(cart), [cart]);
  useEffect(() => {
    const on = (e: StorageEvent) => {
      if (e.key === "asia_cart") setCart(loadCart());
    };
    window.addEventListener("storage", on);
    return () => window.removeEventListener("storage", on);
  }, []);

  const table = tableId ? tables.find((t) => t.id === tableId) : undefined;

  /** Drop lines whose product was deleted, archived or made unavailable. */
  const lines = useMemo(
    () =>
      cart
        .filter((l) => {
          const p = products.find((x) => x.id === l.productId);
          return !!p && !p.archived && l.qty > 0;
        })
        .map((l) => ({ ...l, qty: Math.min(20, l.qty) })),
    [cart, products]
  );

  const rows = useMemo(() => priceCart(lines, products), [lines, products]);
  const count = rows.reduce((s, l) => s + l.qty, 0);
  const total = cartTotal(lines, products);
  const animatedTotal = useAnimatedNumber(total);

  const qtyOf = (id: string) => rows.filter((l) => l.product.id === id).reduce((s, l) => s + l.qty, 0);

  const setQty = (key: string, qty: number) =>
    setCart((c) => (qty <= 0 ? c.filter((l) => l.key !== key) : c.map((l) => (l.key === key ? { ...l, qty: Math.min(20, qty) } : l))));
  const removeLine = (key: string) => setCart((c) => c.filter((l) => l.key !== key));

  const addLine = (p: Product, choice: ProductChoice) => {
    const variantId = choice.variant?.id;
    const addonIds = choice.addons.map((a) => a.id);
    const instructions = choice.instructions.trim();
    const key = lineKey(p.id, variantId, addonIds, instructions);
    setCart((c) => {
      const existing = c.find((l) => l.key === key);
      if (existing) return c.map((l) => (l.key === key ? { ...l, qty: Math.min(20, l.qty + choice.qty) } : l));
      return [...c, { key, productId: p.id, qty: choice.qty, variantId, addonIds, instructions: instructions || undefined }];
    });
  };

  const handleCheckout = async ({ notes, clientToken, customerName, paymentMethod }: { notes: string; clientToken: string; customerName: string; paymentMethod: string }): Promise<string | null> => {
    const res = await placeOrder({ table: tableId, lines, notes, clientToken, customerName, paymentMethod });
    if (!res.ok) {
      toast(res.error, "error");
      return res.error;
    }
    setCart([]);
    setCartOpen(false);
    setPlaced(res.order);
    window.scrollTo({ top: 0 });
    return null;
  };

  const visible = products.filter((p) => {
    if (p.archived) return false;
    const matchesCategory = category === "all" || p.category === category;
    const matchesSearch = !search.trim() || p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name;

  const changeCategory = (id: string) => {
    setCategory(id);
    const el = gridRef.current;
    if (el && el.getBoundingClientRect().top < 56) window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - 56, behavior: "smooth" });
  };

  const ready = splashDone;

  const body = (() => {
    if (!table || !table.active)
      return <TableSelect tables={tables} onSelect={setTable} invalid={rawProvided && !table} inactiveId={table && !table.active ? table.id : null} />;
    if (placed) return <OrderSuccess order={placed} tableName={table.name} onBack={() => setPlaced(null)} />;

    return (
      <>
        <header className="px-5 pb-5 pt-7">
          <div className={cn("flex items-start justify-between", ready ? "animate-fade-up" : "opacity-0")}>
            <div>
              <h1 className="font-serif text-[30px] font-medium leading-none tracking-[0.2em]">ASIA</h1>
              <p className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.26em] text-muted">Cafe &amp; Eatery</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTableModalOpen(true)}
                title="Klik untuk mengganti meja"
                className="press inline-flex items-center gap-2 rounded-full bg-navy px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white hover:bg-navy/90 transition-all shadow-sm"
                aria-label={`Anda duduk di ${table.name}. Klik untuk ubah meja.`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                <span>{table.name}</span>
              </button>
              <a
                href="#/admin/login"
                title="Login Admin Cafe"
                className="press inline-flex items-center justify-center rounded-full border border-line bg-white/80 p-2 text-xs font-semibold text-muted shadow-sm hover:border-gold hover:text-navy transition-all"
                aria-label="Login Admin"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </a>
            </div>
          </div>
          <p className={cn("mt-5 max-w-[320px] text-[15px] leading-relaxed text-ink/80", ready ? "animate-fade-up" : "opacity-0")} style={{ animationDelay: "80ms" }}>
            Halo! Silakan nikmati waktu Anda. Pesan menu favorit Anda di bawah ini.
          </p>
        </header>

        {settings.promo.enabled && (
          <section className="px-5 pb-6" aria-label="Promosi">
            <div className={cn("relative overflow-hidden rounded-xl", ready ? "animate-fade-up" : "opacity-0")} style={{ animationDelay: "160ms" }}>
              <Img src={settings.promo.image} alt="" className="aspect-[5/4] w-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1623]/80 via-[#0b1623]/30 to-[#0b1623]/10" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">{settings.promo.eyebrow}</p>
                <h2 className="mt-1.5 font-serif text-[26px] font-medium uppercase leading-[1.1] tracking-wide">{settings.promo.title}</h2>
                <p className="mt-2 max-w-[280px] text-[13px] leading-relaxed text-white/85">{settings.promo.description}</p>
                {settings.promo.cta && (
                  <button
                    onClick={() => gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    className="press mt-4 inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-semibold text-navy hover:bg-paper"
                  >
                    {settings.promo.cta} <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        <CategoryBar categories={categories} active={category} onChange={changeCategory} />

        <div className="px-5 pt-4">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari makanan atau minuman..."
              className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-sm placeholder:text-[#aaa59c] focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/10 shadow-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-ink"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <section ref={gridRef} className="scroll-mt-14 px-5 pb-32 pt-5" aria-label="Menu">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-serif text-2xl">{category === "all" ? "Menu Kami" : categoryName(category)}</h2>
            <span className="text-xs text-muted">{visible.length} menu</span>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }, (_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line py-14 text-center text-sm text-muted">Belum ada menu di kategori ini.</p>
          ) : (
            <div key={category} className="grid grid-cols-2 gap-3">
              {visible.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  index={i}
                  ready={ready}
                  qty={qtyOf(p.id)}
                  onOpen={() => setDetail(p)}
                  onAdd={() => {
                    if (!isOrderable(p)) return;
                    addLine(p, { qty: 1, variant: p.variants.find((v) => v.available), addons: [], instructions: "" });
                  }}
                />
              ))}
            </div>
          )}
          <p className="mt-10 text-center text-[11px] uppercase tracking-[0.22em] text-[#aaa59c]">Your Moment, Your Comfort.</p>
          <p className="mt-4 text-center">
            <a href="#/admin/login" className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#b3aea5] underline-offset-4 hover:text-navy hover:underline">
              Staff access
            </a>
          </p>
        </section>
      </>
    );
  })();

  const showCart = !!table?.active && !placed;

  return (
    <div className="mx-auto min-h-dvh w-full max-w-[420px] bg-paper pb-0 md:border-x md:border-line">
      {!splashDone && <Splash onDone={() => setSplashDone(true)} />}
      {body}

      {showCart && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            disabled={count === 0}
            onClick={() => setCartOpen(true)}
            aria-label={count ? `Buka keranjang, ${count} item, total ${formatRp(total)}` : "Keranjang kosong"}
            className={cn(
              "press pointer-events-auto flex h-14 w-full max-w-[396px] items-center justify-between rounded-xl px-4 transition-all duration-300",
              count ? "bg-navy text-white shadow-lg shadow-navy/20" : "border border-line bg-white text-muted"
            )}
          >
            <span className="flex items-center gap-3">
              <span className="relative">
                <ShoppingBag size={22} />
                {count > 0 && (
                  <span key={count} className="animate-badge absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-navy">
                    {count}
                  </span>
                )}
              </span>
              <span className="text-sm font-medium">{count ? `${count} item` : "Keranjang kosong"}</span>
            </span>
            {count > 0 && (
              <span className="flex items-center gap-2.5">
                <span className="text-[15px] font-semibold tabular">{formatRp(animatedTotal)}</span>
                <span className="flex h-8 items-center gap-1 rounded-full bg-gold px-3 text-xs font-bold text-navy">
                  Checkout <ChevronRight size={14} />
                </span>
              </span>
            )}
          </button>
        </div>
      )}

      <ProductSheet
        product={detail}
        categoryName={detail ? categoryName(detail.category) : undefined}
        onClose={() => setDetail(null)}
        onAdd={(p, choice) => {
          addLine(p, choice);
          setDetail(null);
          toast(`${choice.qty}× ${p.name} ditambahkan`, "success");
        }}
      />
      <CartSheet
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        lines={lines}
        products={products}
        tableName={table?.name ?? ""}
        onQty={setQty}
        onRemove={removeLine}
        onSubmit={handleCheckout}
      />

      {/* Modal Ubah Meja */}
      <Dialog open={tableModalOpen} onClose={() => setTableModalOpen(false)} variant="responsive" label="Pilih Meja">
        <DialogHeader title="Pindah / Pilih Meja" subtitle="Pilih nomor meja tempat Anda duduk" onClose={() => setTableModalOpen(false)} />
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
            {tables.map((t) => {
              const isSelected = table?.id === t.id;
              return (
                <button
                  key={t.id}
                  disabled={!t.active}
                  onClick={() => {
                    setTable(t.id);
                    setTableModalOpen(false);
                    toast(`Beralih ke ${t.name}`, "info");
                  }}
                  className={cn(
                    "press flex flex-col items-center justify-center rounded-xl p-3 text-center border transition-all",
                    isSelected
                      ? "border-navy bg-navy text-white font-bold shadow-md"
                      : t.active
                      ? "border-line bg-white hover:border-gold hover:bg-paper text-ink"
                      : "opacity-40 border-line bg-paper cursor-not-allowed text-muted"
                  )}
                >
                  <span className="text-sm font-semibold">{t.name}</span>
                  <span className="text-[10px] mt-0.5 opacity-70">{isSelected ? "Aktif" : t.active ? "Tersedia" : "Tutup"}</span>
                </button>
              );
            })}
          </div>
        </div>
      </Dialog>
    </div>
  );
}
