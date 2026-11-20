import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  ClipboardList,
  Copy,
  ImagePlus,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";
import type { Addon, Product, Variant } from "@/lib/types";
import {
  adjustStock,
  bulkPatchProducts,
  deleteProduct,
  isOrderable,
  newProductId,
  patchProduct,
  uid,
  upsertProduct,
  useStore,
} from "@/lib/store";
import { useSession } from "@/lib/auth";
import { Dialog, DialogHeader, Field, Img, Switch, btn, inputCls, useFeedback } from "@/components/ui";
import { ProductCard } from "@/customer/parts";
import { cn, fileToDataUrl, formatDate, formatRp, formatTime } from "@/lib/utils";
import { Card, EmptyState, PageIntro } from "./shared";

/* ---------------- Image picker (also used by Promotions) ---------------- */
export function ImagePicker({ value, onChange, aspect = "aspect-[4/3]" }: { value: string; onChange: (v: string) => void; aspect?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const { toast } = useFeedback();
  const [busy, setBusy] = useState(false);
  const isData = value.startsWith("data:");
  return (
    <div>
      <div className={cn("relative overflow-hidden rounded-lg border border-dashed border-line bg-paper", aspect)}>
        {value ? (
          <Img src={value} alt="Product image preview" className="h-full w-full" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 text-muted">
            <ImagePlus size={24} />
            <span className="text-xs">Upload a product photo</span>
          </div>
        )}
        {busy && <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-xs font-semibold text-navy">Processing…</div>}
      </div>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          ref={input}
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label="Upload image"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setBusy(true);
            try {
              onChange(await fileToDataUrl(f));
            } catch {
              toast("Could not read that image file.", "error");
            }
            setBusy(false);
            e.target.value = "";
          }}
        />
        <button type="button" className={cn(btn.base, btn.outline, btn.sm, "shrink-0")} onClick={() => input.current?.click()} disabled={busy}>
          <Upload size={14} /> Upload image
        </button>
        <input
          type="url"
          value={isData ? "" : value}
          placeholder={isData ? "Local preview image" : "or paste an image URL"}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Image URL"
          className={cn(inputCls, "!h-9 !text-xs")}
        />
      </div>
    </div>
  );
}

/* ---------------- Variant / add-on rows ---------------- */
function OptionsEditor({ draft, onChange }: { draft: Product; onChange: (patch: Partial<Product>) => void }) {
  const setVariant = (id: string, patch: Partial<Variant>) => onChange({ variants: draft.variants.map((v) => (v.id === id ? { ...v, ...patch } : v)) });
  const setAddon = (id: string, patch: Partial<Addon>) => onChange({ addons: draft.addons.map((a) => (a.id === id ? { ...a, ...patch } : a)) });

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Variants</p>
            <p className="text-xs text-muted">Optional choices such as Regular / Large.</p>
          </div>
          <button
            type="button"
            className={cn(btn.base, btn.outline, btn.sm)}
            onClick={() => onChange({ variants: [...draft.variants, { id: `v-${uid()}`, name: "", priceDelta: 0, available: true }] })}
          >
            <Plus size={13} /> Add variant
          </button>
        </div>
        {draft.variants.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line px-3 py-3 text-xs text-muted">No variants — the base price is used.</p>
        ) : (
          <div className="space-y-2">
            {draft.variants.map((v) => (
              <div key={v.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-paper/60 p-2">
                <input value={v.name} onChange={(e) => setVariant(v.id, { name: e.target.value })} placeholder="Variant name" aria-label="Variant name" className={cn(inputCls, "!h-9 flex-1 !text-xs sm:min-w-32")} />
                <div className="relative w-32">
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted">+Rp</span>
                  <input
                    inputMode="numeric"
                    value={v.priceDelta || ""}
                    onChange={(e) => setVariant(v.id, { priceDelta: Number(e.target.value.replace(/[^\d]/g, "")) })}
                    placeholder="0"
                    aria-label={`Additional price for ${v.name || "variant"}`}
                    className={cn(inputCls, "!h-9 !pl-9 !text-xs tabular")}
                  />
                </div>
                <label className="flex items-center gap-1.5 text-[11px] text-muted">
                  <input type="checkbox" checked={v.available} onChange={(e) => setVariant(v.id, { available: e.target.checked })} className="h-3.5 w-3.5 accent-[#0A2540]" />
                  Available
                </label>
                <button type="button" onClick={() => onChange({ variants: draft.variants.filter((x) => x.id !== v.id) })} aria-label="Remove variant" className="press flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-danger/10 hover:text-danger">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Add-ons</p>
            <p className="text-xs text-muted">Extras such as Extra Espresso or Oat Milk.</p>
          </div>
          <button
            type="button"
            className={cn(btn.base, btn.outline, btn.sm)}
            onClick={() => onChange({ addons: [...draft.addons, { id: `a-${uid()}`, name: "", price: 0, available: true }] })}
          >
            <Plus size={13} /> Add add-on
          </button>
        </div>
        {draft.addons.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line px-3 py-3 text-xs text-muted">No add-ons for this product.</p>
        ) : (
          <div className="space-y-2">
            {draft.addons.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-paper/60 p-2">
                <input value={a.name} onChange={(e) => setAddon(a.id, { name: e.target.value })} placeholder="Add-on name" aria-label="Add-on name" className={cn(inputCls, "!h-9 flex-1 !text-xs sm:min-w-32")} />
                <div className="relative w-32">
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted">Rp</span>
                  <input
                    inputMode="numeric"
                    value={a.price || ""}
                    onChange={(e) => setAddon(a.id, { price: Number(e.target.value.replace(/[^\d]/g, "")) })}
                    placeholder="0"
                    aria-label={`Price for ${a.name || "add-on"}`}
                    className={cn(inputCls, "!h-9 !pl-8 !text-xs tabular")}
                  />
                </div>
                <label className="flex items-center gap-1.5 text-[11px] text-muted">
                  <input type="checkbox" checked={a.available} onChange={(e) => setAddon(a.id, { available: e.target.checked })} className="h-3.5 w-3.5 accent-[#0A2540]" />
                  Available
                </label>
                <button type="button" onClick={() => onChange({ addons: draft.addons.filter((x) => x.id !== a.id) })} aria-label="Remove add-on" className="press flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-danger/10 hover:text-danger">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Product editor: form left, live preview right ---------------- */
const blankProduct = (category: string): Product => ({
  id: "",
  name: "",
  description: "",
  price: 0,
  category,
  image: "",
  available: true,
  sku: `AS-${Date.now().toString(36).toUpperCase().slice(-6)}`,
  featured: false,
  trackStock: false,
  stock: 0,
  unit: "pcs",
  lowStockThreshold: 5,
  variants: [],
  addons: [],
  archived: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

function ProductEditor({ seed, onClose }: { seed: Product | null; onClose: () => void }) {
  const categories = useStore("categories");
  const products = useStore("products");
  const session = useSession();
  const actor = session?.username ?? "admin";
  const { toast, confirm } = useFeedback();
  const [draft, setDraft] = useState<Product>(blankProduct(categories[0]?.id ?? "coffee"));
  const [original, setOriginal] = useState<Product>(blankProduct(categories[0]?.id ?? "coffee"));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewOpen, setPreviewOpen] = useState(false);

  const isNew = !!seed && !seed.id;

  useEffect(() => {
    if (!seed) return;
    const base = seed.id ? seed : blankProduct(categories[0]?.id ?? seed.category);
    setDraft(structuredClone(base));
    setOriginal(structuredClone(base));
    setErrors({});
    setPreviewOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(original);
  const set = (patch: Partial<Product>) => setDraft((d) => ({ ...d, ...patch }));

  const close = async () => {
    if (dirty) {
      const ok = await confirm({ title: "Discard unsaved changes?", message: "Your edits have not been published to the customer menu.", confirmLabel: "Discard changes", danger: true });
      if (!ok) return;
    }
    onClose();
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!draft.name.trim()) err.name = "Product name is required.";
    if (!draft.price || draft.price < 500) err.price = "Enter a valid price (min. Rp 500).";
    if (!draft.category) err.category = "Choose a category.";
    const sku = draft.sku.trim().toUpperCase();
    if (!sku) err.sku = "SKU is required.";
    else if (products.some((p) => p.sku.toUpperCase() === sku && p.id !== draft.id)) err.sku = "This SKU is already used by another product.";
    if (draft.variants.some((v) => !v.name.trim())) err.variants = "Every variant needs a name.";
    if (draft.addons.some((a) => !a.name.trim())) err.addons = "Every add-on needs a name.";
    setErrors(err);
    if (Object.keys(err).length) return;

    const next: Product = {
      ...draft,
      id: draft.id || newProductId(),
      name: draft.name.trim(),
      sku,
      description: draft.description.trim(),
    };
    upsertProduct(next, actor);
    toast(isNew ? `“${next.name}” added to the menu` : `“${next.name}” updated`, "success");
    onClose();
  };

  return (
    <Dialog open={!!seed} onClose={close} label={isNew ? "Add product" : "Edit product"} panelClassName="!max-w-5xl">
      <form onSubmit={save} className="flex min-h-0 flex-1 flex-col" noValidate>
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">{isNew ? "New product" : "Edit product"}</p>
            <h2 className="font-serif text-xl leading-tight">{draft.name || "Untitled product"}</h2>
            <p className="mt-0.5 text-xs text-muted">{dirty ? "Unsaved changes — not visible to customers yet." : "Saved values"}</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className={cn(btn.base, btn.outline, btn.sm, "lg:hidden")} onClick={() => setPreviewOpen((v) => !v)} aria-expanded={previewOpen}>
              Preview
            </button>
            <button type="button" onClick={close} aria-label="Close" className="press flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-ink/5">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)]">
            {/* Left: fields */}
            <div className="space-y-5">
              <section className="space-y-3.5">
                <Field label="Product name">
                  <input data-autofocus className={cn(inputCls, errors.name && "!border-danger")} value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Caramel Macchiato" />
                  {errors.name && <span className="mt-1 block text-xs text-danger">{errors.name}</span>}
                </Field>
                <Field label="Description">
                  <textarea rows={2} className={cn(inputCls, "!h-auto resize-none py-2.5")} value={draft.description} onChange={(e) => set({ description: e.target.value })} placeholder="Short, appetising description shown on the menu card" />
                </Field>
                <div>
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">Product image</span>
                  <ImagePicker value={draft.image} onChange={(image) => set({ image })} aspect="aspect-[16/7]" />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Price (Rp)">
                    <input
                      inputMode="numeric"
                      className={cn(inputCls, "tabular", errors.price && "!border-danger")}
                      value={draft.price || ""}
                      onChange={(e) => set({ price: Number(e.target.value.replace(/[^\d]/g, "")) })}
                      placeholder="30000"
                    />
                    {errors.price ? <span className="mt-1 block text-xs text-danger">{errors.price}</span> : <span className="mt-1 block text-xs text-muted">Base price</span>}
                  </Field>
                  <Field label="Category">
                    <select className={cn(inputCls, errors.category && "!border-danger")} value={draft.category} onChange={(e) => set({ category: e.target.value })}>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {errors.category && <span className="mt-1 block text-xs text-danger">{errors.category}</span>}
                  </Field>
                  <Field label="SKU">
                    <input className={cn(inputCls, "font-medium uppercase", errors.sku && "!border-danger")} value={draft.sku} onChange={(e) => set({ sku: e.target.value })} placeholder="AS-COF-005" />
                    {errors.sku && <span className="mt-1 block text-xs text-danger">{errors.sku}</span>}
                  </Field>
                </div>
              </section>

              <section className="rounded-lg border border-line p-3.5">
                <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted">Visibility</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2.5">
                    <span>
                      <span className="block text-sm font-medium">Available</span>
                      <span className="block text-[11px] text-muted">Customers can order</span>
                    </span>
                    <Switch checked={draft.available} onChange={(available) => set({ available })} label="Available" />
                  </label>
                  <label className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2.5">
                    <span>
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        Featured {draft.featured && <Star size={12} className="fill-gold text-gold" />}
                      </span>
                      <span className="block text-[11px] text-muted">Signature badge on menu</span>
                    </span>
                    <Switch checked={draft.featured} onChange={(featured) => set({ featured })} label="Featured" />
                  </label>
                </div>
              </section>

              <section className="rounded-lg border border-line p-3.5">
                <div className="mb-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">Inventory</p>
                    <p className="text-[11px] text-muted">Stock is deducted when an order is placed.</p>
                  </div>
                  <Switch checked={draft.trackStock} onChange={(trackStock) => set({ trackStock })} label="Track stock" />
                </div>
                {draft.trackStock && (
                  <div className="grid grid-cols-3 gap-2">
                    <Field label="Stock">
                      <input
                        inputMode="numeric"
                        disabled={!isNew}
                        value={draft.stock}
                        onChange={(e) => set({ stock: Number(e.target.value.replace(/[^\d]/g, "")) })}
                        className={cn(inputCls, "tabular disabled:bg-paper disabled:text-muted")}
                      />
                    </Field>
                    <Field label="Unit">
                      <input value={draft.unit} onChange={(e) => set({ unit: e.target.value })} className={inputCls} placeholder="cup" />
                    </Field>
                    <Field label="Low stock at">
                      <input inputMode="numeric" value={draft.lowStockThreshold} onChange={(e) => set({ lowStockThreshold: Number(e.target.value.replace(/[^\d]/g, "")) })} className={cn(inputCls, "tabular")} />
                    </Field>
                    {!isNew && <p className="col-span-3 text-[11px] leading-relaxed text-muted">Use “Adjust stock” on the product card to receive or correct inventory — every movement is recorded.</p>}
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-line p-3.5">
                <OptionsEditor draft={draft} onChange={set} />
                {(errors.variants || errors.addons) && <p className="mt-2 text-xs text-danger">{errors.variants ?? errors.addons}</p>}
              </section>
            </div>

            {/* Right: live preview */}
            <aside className={cn("lg:block", previewOpen ? "block" : "hidden")}>
              <div className="lg:sticky lg:top-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Live customer preview</p>
                  <span className="rounded-full bg-paper px-2 py-0.5 text-[10px] font-semibold text-muted">Unsaved</span>
                </div>
                <div className="pointer-events-none mx-auto max-w-[260px]">
                  <ProductCard product={{ ...draft, archived: false }} index={0} qty={0} ready onOpen={() => {}} onAdd={() => {}} />
                </div>
                <div className="mx-auto mt-3 max-w-[260px] space-y-1.5 rounded-lg border border-line p-3 text-[11px] leading-relaxed text-muted">
                  <p className="flex justify-between gap-2">
                    <span>Category</span>
                    <span className="font-medium text-ink">{categories.find((c) => c.id === draft.category)?.name ?? "—"}</span>
                  </p>
                  <p className="flex justify-between gap-2">
                    <span>SKU</span>
                    <span className="font-medium text-ink">{draft.sku || "—"}</span>
                  </p>
                  <p className="flex justify-between gap-2">
                    <span>Stock</span>
                    <span className={cn("font-medium", draft.trackStock && draft.stock <= draft.lowStockThreshold ? "text-warning" : "text-ink")}>
                      {draft.trackStock ? `${draft.stock} ${draft.unit}` : "Not tracked"}
                    </span>
                  </p>
                  <p className="flex justify-between gap-2">
                    <span>Options</span>
                    <span className="font-medium text-ink">
                      {draft.variants.length} variant{draft.variants.length === 1 ? "" : "s"} · {draft.addons.length} add-on{draft.addons.length === 1 ? "" : "s"}
                    </span>
                  </p>
                </div>
                <p className="mt-3 text-center text-[10px] leading-relaxed text-muted">This is exactly how the item appears in the customer menu. Changes are not public until saved.</p>
              </div>
            </aside>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4">
          <p className={cn("text-xs", dirty ? "font-medium text-warning" : "text-muted")}>{dirty ? "● Unsaved changes" : "No changes yet"}</p>
          <div className="flex gap-2">
            <button type="button" className={cn(btn.base, btn.outline)} onClick={close}>
              Cancel
            </button>
            <button type="submit" className={cn(btn.base, btn.gold)} disabled={!dirty && !isNew}>
              {isNew ? "Add product" : "Save changes"}
            </button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}

/* ---------------- Stock dialog ---------------- */
function StockDialog({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const stock = useStore("stock");
  const session = useSession();
  const actor = session?.username ?? "admin";
  const { toast } = useFeedback();
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"receive" | "adjust">("receive");
  const [reason, setReason] = useState("");
  const movements = stock.filter((m) => m.productId === product?.id).slice(0, 12);

  useEffect(() => {
    if (product) {
      setAmount("");
      setReason("");
      setMode("receive");
    }
  }, [product]);

  if (!product) return <Dialog open={false} onClose={onClose} label="Stock" children={null} />;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(amount.replace(/[^\d]/g, ""));
    if (!n) return toast("Enter a stock quantity.", "error");
    const delta = mode === "receive" ? n : -n;
    const res = adjustStock(product.id, delta, reason.trim() || (mode === "receive" ? "Stock received" : "Manual correction"), actor);
    if (!res.ok) return toast(res.error, "error");
    toast(`${product.name}: ${delta > 0 ? "+" : ""}${delta} ${product.unit} recorded`, "success");
    setAmount("");
    setReason("");
  };

  return (
    <Dialog open={!!product} onClose={onClose} label="Stock management" panelClassName="!max-w-md">
      <DialogHeader title="Stock" subtitle={`${product.name} · ${product.stock} ${product.unit} on hand`} onClose={onClose} />
      <div className="flex-1 overflow-y-auto p-5">
        <form onSubmit={submit} className="space-y-3 rounded-lg border border-line p-3.5">
          <div className="flex gap-1.5">
            {(["receive", "adjust"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "press rounded-md border px-3 py-1.5 text-xs font-semibold",
                  mode === m ? "border-navy bg-navy text-white" : "border-line bg-white text-muted hover:text-ink"
                )}
              >
                {m === "receive" ? "Receive stock" : "Reduce / correct"}
              </button>
            ))}
          </div>
          <Field label={`Quantity (${product.unit})`}>
            <input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))} className={cn(inputCls, "tabular")} placeholder="e.g. 24" />
          </Field>
          <Field label="Reason">
            <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={80} className={inputCls} placeholder="e.g. Morning delivery" />
          </Field>
          <button type="submit" className={cn(btn.base, btn.primary, "w-full")}>
            Save stock movement
          </button>
        </form>
        <p className="mb-2 mt-5 text-[10px] font-semibold uppercase tracking-wider text-muted">Movement history</p>
        {movements.length === 0 ? (
          <p className="text-xs text-muted">No movements recorded yet.</p>
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line">
            {movements.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{m.reason}</p>
                  <p className="text-[10px] text-muted">
                    {formatDate(m.at)} {formatTime(m.at)} · {m.by}
                  </p>
                </div>
                <span className={cn("shrink-0 text-sm font-semibold tabular", m.delta >= 0 ? "text-success" : "text-danger")}>
                  {m.delta > 0 ? "+" : ""}
                  {m.delta}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dialog>
  );
}

/* ---------------- Page ---------------- */
export function MenuMgmt() {
  const products = useStore("products");
  const categories = useStore("categories");
  const stock = useStore("stock");
  const session = useSession();
  const actor = session?.username ?? "admin";
  const { toast, confirm } = useFeedback();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [visibility, setVisibility] = useState<"all" | "active" | "unavailable" | "low" | "archived">("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [stockFor, setStockFor] = useState<Product | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [bulkCat, setBulkCat] = useState("");

  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? "—";
  const live = products.filter((p) => !p.archived);
  const lowStock = live.filter((p) => p.trackStock && p.stock <= p.lowStockThreshold);
  const stats = [
    { label: "Total products", value: live.length, icon: <Package size={15} /> },
    { label: "Active", value: live.filter((p) => isOrderable(p)).length, icon: <ClipboardList size={15} /> },
    { label: "Unavailable", value: live.filter((p) => !p.available || (p.trackStock && p.stock <= 0)).length, icon: <Archive size={15} /> },
    { label: "Categories", value: categories.length, icon: <ClipboardList size={15} /> },
    { label: "Low stock", value: lowStock.length, icon: <TriangleAlert size={15} />, warning: lowStock.length > 0 },
  ];

  const list = useMemo(
    () =>
      products.filter((p) => {
        if (visibility !== "archived" && p.archived) return false;
        if (visibility === "archived" && !p.archived) return false;
        if (visibility === "active" && !isOrderable(p)) return false;
        if (visibility === "unavailable" && (p.available && (!p.trackStock || p.stock > 0))) return false;
        if (visibility === "low" && !(p.trackStock && p.stock <= p.lowStockThreshold)) return false;
        if (cat !== "all" && p.category !== cat) return false;
        const needle = q.trim().toLowerCase();
        return !needle || (p.name + p.description + p.sku).toLowerCase().includes(needle);
      }),
    [products, q, cat, visibility]
  );

  const allSelected = list.length > 0 && list.every((p) => selected.includes(p.id));
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const remove = async (p: Product) => {
    const ok = await confirm({
      title: `Delete “${p.name}”?`,
      message: "This permanently removes the product from the catalogue. Past orders keep their own copy. Consider archiving instead to keep its history.",
      confirmLabel: "Delete permanently",
      danger: true,
    });
    if (!ok) return;
    deleteProduct(p.id, actor);
    setSelected((s) => s.filter((x) => x !== p.id));
    toast(`“${p.name}” deleted`, "success");
  };

  const archive = async (ids: string[], archived: boolean) => {
    const ok = await confirm({
      title: archived ? `Archive ${ids.length} product${ids.length === 1 ? "" : "s"}?` : `Restore ${ids.length} product${ids.length === 1 ? "" : "s"}?`,
      message: archived ? "Archived products disappear from the customer menu but keep their data and history." : "Selected products become visible in admin again (availability still applies).",
      confirmLabel: archived ? "Archive" : "Restore",
      danger: archived,
    });
    if (!ok) return;
    bulkPatchProducts(ids, { archived }, actor);
    setSelected([]);
    toast(`${ids.length} product${ids.length === 1 ? "" : "s"} ${archived ? "archived" : "restored"}`, "success");
  };

  const duplicate = (p: Product) => {
    const copy: Product = {
      ...structuredClone(p),
      id: newProductId(),
      name: `${p.name} (copy)`,
      sku: `${p.sku}-2`,
      variants: p.variants.map((v) => ({ ...v, id: `v-${uid()}` })),
      addons: p.addons.map((a) => ({ ...a, id: `a-${uid()}` })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    upsertProduct(copy, actor);
    toast(`“${p.name}” duplicated`, "success");
  };

  return (
    <div>
      <PageIntro
        title="Menu Management"
        description="Premium product catalogue for the customer menu. Eligibility, pricing and stock all live here."
        action={
          <button className={cn(btn.base, btn.gold)} onClick={() => setEditing({ ...blankProduct(categories[0]?.id ?? "coffee") })}>
            <Plus size={16} /> Add product
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-line bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{s.label}</p>
              <span className={cn("flex h-7 w-7 items-center justify-center rounded-md", s.warning ? "bg-warning/10 text-warning" : "bg-navy/[0.06] text-navy")}>{s.icon}</span>
            </div>
            <p className="mt-2 text-2xl font-semibold leading-none tabular">{s.value}</p>
          </div>
        ))}
      </div>

      <Card className="mt-4">
        <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, description or SKU…" aria-label="Search products" className={cn(inputCls, "!h-10 pl-9")} />
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filter by category" className={cn(inputCls, "!h-10 !w-auto !text-xs")}>
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select value={visibility} onChange={(e) => setVisibility(e.target.value as typeof visibility)} aria-label="Filter by availability" className={cn(inputCls, "!h-10 !w-auto !text-xs")}>
              <option value="all">All products</option>
              <option value="active">Available</option>
              <option value="unavailable">Unavailable</option>
              <option value="low">Low stock</option>
              <option value="archived">Archived</option>
            </select>
            <span className="flex items-center px-1 text-xs text-muted">{list.length} items</span>
          </div>
        </div>

        {lowStock.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-line bg-warning/[0.06] px-4 py-2.5 text-xs">
            <TriangleAlert size={14} className="text-warning" />
            <span className="font-semibold text-ink">Low stock alert:</span>
            <span className="text-muted">
              {lowStock.slice(0, 3).map((p) => `${p.name} (${p.stock} ${p.unit})`).join(", ")}
              {lowStock.length > 3 ? ` +${lowStock.length - 3} more` : ""}
            </span>
          </div>
        )}

        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-line bg-navy/[0.03] px-4 py-2.5">
            <span className="text-xs font-semibold">{selected.length} selected</span>
            <button className={cn(btn.base, btn.outline, btn.sm)} onClick={() => { bulkPatchProducts(selected, { available: true }, actor); toast(`${selected.length} products activated`, "success"); setSelected([]); }}>
              Activate
            </button>
            <button className={cn(btn.base, btn.outline, btn.sm)} onClick={() => { bulkPatchProducts(selected, { available: false }, actor); toast(`${selected.length} products deactivated`, "info"); setSelected([]); }}>
              Deactivate
            </button>
            <select value={bulkCat} onChange={(e) => setBulkCat(e.target.value)} aria-label="Change category" className={cn(inputCls, "!h-9 !w-auto !text-xs")}>
              <option value="">Change category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              className={cn(btn.base, btn.outline, btn.sm)}
              disabled={!bulkCat}
              onClick={() => { bulkPatchProducts(selected, { category: bulkCat }, actor); toast(`Category updated for ${selected.length} products`, "success"); setBulkCat(""); setSelected([]); }}
            >
              Apply
            </button>
            <button className={cn(btn.base, btn.ghost, btn.sm, "!text-danger")} onClick={() => archive(selected, true)}>
              <Archive size={13} /> Archive
            </button>
            <button className={cn(btn.base, btn.ghost, btn.sm)} onClick={() => setSelected([])}>
              Clear
            </button>
          </div>
        )}

        <div className="border-b border-line px-4 py-2">
          <label className="flex w-fit items-center gap-2 text-xs font-medium text-muted">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => setSelected(allSelected ? [] : list.map((p) => p.id))}
              className="h-3.5 w-3.5 accent-[#0A2540]"
              aria-label="Select all visible products"
            />
            Select all visible
          </label>
        </div>

        {list.length === 0 ? (
          <EmptyState title="No products match" hint="Adjust the search or filters, or add a new product." />
        ) : (
          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {list.map((p) => {
              const low = p.trackStock && p.stock <= p.lowStockThreshold;
              return (
                <article key={p.id} className={cn("group overflow-hidden rounded-xl border bg-white transition-colors", selected.includes(p.id) ? "border-navy" : "border-line hover:border-navy/30")}>
                  <div className="relative">
                    <Img src={p.image} alt={p.name} className={cn("aspect-[16/10] w-full", (!p.available || p.archived) && "[&_img]:grayscale")} />
                    <label className="absolute left-2 top-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded bg-white/95">
                      <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} aria-label={`Select ${p.name}`} className="h-3.5 w-3.5 accent-[#0A2540]" />
                    </label>
                    <div className="absolute right-2 top-2 flex gap-1">
                      {p.featured && (
                        <span className="inline-flex items-center gap-1 rounded bg-white/95 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-navy">
                          <Star size={9} className="fill-gold text-gold" /> Signature
                        </span>
                      )}
                      {p.archived ? (
                        <span className="rounded bg-ink/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">Archived</span>
                      ) : !isOrderable(p) ? (
                        <span className="rounded bg-danger px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">Unavailable</span>
                      ) : (
                        <span className="rounded bg-success px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">Active</span>
                      )}
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold">{p.name}</h3>
                        <p className="mt-0.5 text-[11px] text-muted">
                          {catName(p.category)} · {p.sku}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold tabular text-navy">{formatRp(p.price)}</p>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className={cn("rounded-full border px-2 py-0.5 font-semibold", p.trackStock ? (low ? "border-warning/40 bg-warning/10 text-warning" : "border-line bg-paper text-muted") : "border-line bg-paper text-muted")}>
                        {p.trackStock ? `${p.stock} ${p.unit} in stock` : "Stock not tracked"}
                      </span>
                      {p.variants.length > 0 && <span className="rounded-full border border-line bg-paper px-2 py-0.5 text-muted">{p.variants.length} variants</span>}
                      {p.addons.length > 0 && <span className="rounded-full border border-line bg-paper px-2 py-0.5 text-muted">{p.addons.length} add-ons</span>}
                    </div>
                    <div className="mt-3 flex items-center gap-1.5">
                      <button className={cn(btn.base, btn.outline, btn.sm, "flex-1")} onClick={() => setEditing(p)}>
                        <Pencil size={13} /> Edit
                      </button>
                      <button
                        className={cn(btn.base, btn.ghost, btn.sm, "!px-2")}
                        aria-label={`Availability for ${p.name}`}
                        title={p.available ? "Set unavailable" : "Set available"}
                        onClick={() => {
                          patchProduct(p.id, { available: !p.available }, actor);
                          toast(`${p.name} is now ${!p.available ? "available" : "unavailable"}`, "info");
                        }}
                      >
                        {p.available ? <Archive size={15} /> : <ArchiveRestore size={15} />}
                      </button>
                      <div className="relative">
                        <button className={cn(btn.base, btn.ghost, btn.sm, "!px-2")} onClick={() => setMenuOpen(menuOpen === p.id ? null : p.id)} aria-label={`More actions for ${p.name}`} aria-expanded={menuOpen === p.id}>
                          <MoreHorizontal size={16} />
                        </button>
                        {menuOpen === p.id && (
                          <>
                            <button className="fixed inset-0 z-10 cursor-default" aria-label="Close menu" onClick={() => setMenuOpen(null)} tabIndex={-1} />
                            <div className="absolute bottom-full right-0 z-20 mb-1 w-44 overflow-hidden rounded-lg border border-line bg-white py-1 shadow-lg">
                              {p.trackStock && (
                                <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-paper" onClick={() => { setMenuOpen(null); setStockFor(p); }}>
                                  <Package size={13} /> Adjust stock
                                </button>
                              )}
                              <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-paper" onClick={() => { setMenuOpen(null); duplicate(p); }}>
                                <Copy size={13} /> Duplicate
                              </button>
                              <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-paper" onClick={() => { setMenuOpen(null); archive([p.id], true); }}>
                                <Archive size={13} /> Archive
                              </button>
                              <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-danger hover:bg-danger/5" onClick={() => { setMenuOpen(null); remove(p); }}>
                                <Trash2 size={13} /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3 text-[11px] text-muted">
          <span>{stock.length} stock movements recorded</span>
          <span>Images are compressed locally in this demo; connect cloud storage for production.</span>
        </div>
      </Card>

      <ProductEditor seed={editing} onClose={() => setEditing(null)} />
      <StockDialog product={stockFor} onClose={() => setStockFor(null)} />
    </div>
  );
}

