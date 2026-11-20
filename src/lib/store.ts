import { useSyncExternalStore } from "react";
import { supabase } from "./supabase";
import type {
  Addon,
  AuditEntry,
  CartLine,
  Category,
  Closing,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  Settings,
  StockMovement,
  Table,
  Variant,
} from "./types";
import {
  SEED_AUDIT,
  SEED_CATEGORIES,
  SEED_PRODUCTS,
  SEED_SETTINGS,
  SEED_STOCK_MOVEMENTS,
  SEED_TABLES,
  buildSeedOrders,
  dateKey,
} from "./seed";

/**
 * Persistence layer for the prototype.
 * The UI only talks to this module, so it can be swapped for a real API/database later.
 * localStorage is used as a simulated database — it is NOT authoritative or multi-device.
 */

export const STORAGE_KEYS = {
  products: "asia_products",
  categories: "asia_categories",
  orders: "asia_orders",
  settings: "asia_settings",
  tables: "asia_tables",
  closings: "asia_closings",
  audit: "asia_audit",
  stock: "asia_stock",
} as const;
export type StoreKey = keyof typeof STORAGE_KEYS;
const SCHEMA_KEY = "asia_schema_version";
const SCHEMA_VERSION = 2;
export const CART_KEY = "asia_cart";

interface StoreShape {
  products: Product[];
  categories: Category[];
  orders: Order[];
  settings: Settings;
  tables: Table[];
  closings: Closing[];
  audit: AuditEntry[];
  stock: StockMovement[];
}

const seeded = () => buildSeedOrders();

const seedFor: { [K in StoreKey]: () => StoreShape[K] } = {
  products: () => structuredClone(SEED_PRODUCTS),
  categories: () => structuredClone(SEED_CATEGORIES),
  orders: () => seeded().orders,
  settings: () => structuredClone(SEED_SETTINGS),
  tables: () => structuredClone(SEED_TABLES),
  closings: () => seeded().closings,
  audit: () => structuredClone(SEED_AUDIT),
  stock: () => structuredClone(SEED_STOCK_MOVEMENTS),
};

const cache: Partial<StoreShape> = {};
const listeners = new Set<() => void>();
let channel: BroadcastChannel | null = null;
const TAB_ID = Math.random().toString(36).slice(2);

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

function emit() {
  listeners.forEach((l) => l());
}

/* ---------------- Migration from the earlier demo schema ---------------- */
type Loose = Record<string, unknown>;

function migrateProduct(raw: Loose, i: number): Product {
  const id = String(raw.id ?? `p-migrated-${i}`);
  return {
    id,
    name: String(raw.name ?? "Untitled product"),
    description: String(raw.description ?? ""),
    price: Number(raw.price ?? 0),
    category: String(raw.category ?? "coffee"),
    image: String(raw.image ?? ""),
    available: raw.available !== false,
    sku: String(raw.sku ?? id.replace(/^p-/, "AS-").toUpperCase()),
    featured: Boolean(raw.featured),
    trackStock: Boolean(raw.trackStock),
    stock: Number(raw.stock ?? 0),
    unit: String(raw.unit ?? "pcs"),
    lowStockThreshold: Number(raw.lowStockThreshold ?? 5),
    variants: Array.isArray(raw.variants) ? (raw.variants as Variant[]) : [],
    addons: Array.isArray(raw.addons) ? (raw.addons as Addon[]) : [],
    archived: Boolean(raw.archived),
    createdAt: Number(raw.createdAt ?? Date.now()),
    updatedAt: Number(raw.updatedAt ?? Date.now()),
  };
}

function migrateOrder(raw: Loose, i: number): Order {
  const createdAt = Number(raw.createdAt ?? Date.now());
  const items = (Array.isArray(raw.items) ? raw.items : []).map((x) => {
    const it = x as Loose;
    const unitPrice = Number(it.unitPrice ?? it.price ?? 0);
    const qty = Number(it.qty ?? 1);
    return {
      productId: String(it.productId ?? `unknown-${i}`),
      sku: String(it.sku ?? ""),
      name: String(it.name ?? "Item"),
      image: String(it.image ?? ""),
      unitPrice,
      qty,
      variant: it.variant ? String(it.variant) : undefined,
      addons: Array.isArray(it.addons) ? (it.addons as OrderItem["addons"]) : [],
      instructions: it.instructions ? String(it.instructions) : undefined,
      lineTotal: Number(it.lineTotal ?? unitPrice * qty),
    } as OrderItem;
  });
  const subtotal = Number(raw.subtotal ?? items.reduce((s, it) => s + it.lineTotal, 0));
  const rawPay = String(raw.paymentStatus ?? "UNPAID");
  const paid = rawPay === "PAID";
  return {
    id: String(raw.id ?? `order-${i}`),
    number: String(raw.number ?? `ASIA-${dateKey(createdAt)}-${i}`),
    table: String(raw.table ?? "10"),
    items,
    notes: String(raw.notes ?? ""),
    subtotal,
    total: Number(raw.total ?? subtotal),
    paymentMethod: "CASH", // QRIS removed — every order is cash only
    paymentStatus: paid ? "PAID" : "UNPAID",
    paidAt: paid ? Number(raw.paidAt ?? createdAt) : undefined,
    paidBy: paid ? String(raw.paidBy ?? "admin") : undefined,
    status: (raw.status as OrderStatus) ?? "COMPLETED",
    createdAt,
    updatedAt: Number(raw.updatedAt ?? createdAt),
    businessDate: String(raw.businessDate ?? dateKey(createdAt)),
    closingId: raw.closingId ? String(raw.closingId) : undefined,
    clientToken: raw.clientToken ? String(raw.clientToken) : undefined,
  };
}

function normalize<K extends StoreKey>(key: K, value: unknown): StoreShape[K] {
  if (key === "settings") {
    const s = (value ?? {}) as Partial<Settings>;
    return { ...SEED_SETTINGS, ...s, promo: { ...SEED_SETTINGS.promo, ...(s.promo ?? {}) } } as StoreShape[K];
  }
  return value as StoreShape[K];
}

/* ---------------- Read / write ---------------- */
export function loadFromStorage<K extends StoreKey>(key: K): StoreShape[K] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[key]);
    if (raw) return normalize(key, JSON.parse(raw));
  } catch {
    /* corrupt or unavailable — reseed below */
  }
  const initial = seedFor[key]();
  saveToStorage(key, initial, false);
  return initial;
}

export function saveToStorage<K extends StoreKey>(key: K, value: StoreShape[K], broadcast = true): boolean {
  cache[key] = value;
  let ok = true;
  try {
    localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(value));
  } catch {
    ok = false; // storage full/disabled — keep working in memory
  }
  if (broadcast) {
    channel?.postMessage({ key, from: TAB_ID });
    emit();
  }
  return ok;
}

function read<K extends StoreKey>(key: K): StoreShape[K] {
  if (cache[key] === undefined) cache[key] = loadFromStorage(key);
  return cache[key] as StoreShape[K];
}

function reloadKey(key: StoreKey) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[key]);
    if (raw) (cache as Record<string, unknown>)[key] = normalize(key, JSON.parse(raw));
    else delete cache[key];
  } catch {
    /* ignore */
  }
  emit();
}

function migrateExisting() {
  const readOld = (k: string) => {
    try {
      const raw = localStorage.getItem(k);
      return raw ? JSON.parse(raw) : undefined;
    } catch {
      return undefined;
    }
  };
  const products = readOld(STORAGE_KEYS.products);
  const orders = readOld(STORAGE_KEYS.orders);
  if (Array.isArray(products)) saveToStorage("products", products.map(migrateProduct), false);
  if (Array.isArray(orders)) saveToStorage("orders", orders.map(migrateOrder), false);
  ["categories", "settings", "tables"].forEach((k) => {
    const v = readOld(STORAGE_KEYS[k as StoreKey]);
    if (v) saveToStorage(k as StoreKey, normalize(k as StoreKey, v) as never, false);
  });
  if (!Array.isArray(orders)) {
    const s = seedFor.closings();
    saveToStorage("closings", s, false);
  }
  saveToStorage("stock", seedFor.stock(), false);
  saveToStorage("audit", seedFor.audit(), false);
}

let started = false;
export function initializeStore() {
  if (started) return;
  started = true;
  let version = 0;
  try {
    version = Number(localStorage.getItem(SCHEMA_KEY) ?? 0);
  } catch {
    /* storage unavailable */
  }
  if (version !== SCHEMA_VERSION) {
    if (version === 0) {
      (Object.keys(STORAGE_KEYS) as StoreKey[]).forEach((k) => saveToStorage(k, seedFor[k](), false));
    } else {
      migrateExisting();
    }
    try {
      localStorage.setItem(SCHEMA_KEY, String(SCHEMA_VERSION));
    } catch {
      /* ignore */
    }
  }
  (Object.keys(STORAGE_KEYS) as StoreKey[]).forEach((k) => read(k));

  // Ambil data menu, kategori & settings terbaru dari Supabase app_state (id = 1)
  try {
    supabase
      .from("app_state")
      .select("state_json")
      .eq("id", 1)
      .single()
      .then(({ data, error }) => {
        if (error || !data?.state_json) return;
        const state = data.state_json as {
          categories?: { id: string; name: string }[];
          products?: { id: string; name: string; price: number; category: string; image?: string; stock?: number; sku?: string }[];
          settings?: { storeName?: string; phone?: string; address?: string };
        };

        if (Array.isArray(state.categories) && state.categories.length > 0) {
          const cats: Category[] = state.categories.map((c) => ({
            id: String(c.id),
            name: c.name,
            sort: 0,
          }));
          saveToStorage("categories", cats, false);
        }

        if (Array.isArray(state.products) && state.products.length > 0) {
          const prods: Product[] = state.products.map((p) => ({
            id: String(p.id),
            name: p.name,
            price: Number(p.price) || 0,
            category: String(p.category || ""),
            image: p.image || "",
            sku: p.sku || p.id,
            description: "",
            trackStock: true,
            stock: Number(p.stock) || 0,
            unit: "item",
            lowStockThreshold: 5,
            archived: false,
            variants: [],
            addons: [],
            available: p.stock === undefined || p.stock > 0,
          }));
          saveToStorage("products", prods, false);
        }

        if (state.settings?.storeName) {
          const currentSettings = read("settings");
          saveToStorage("settings", {
            ...currentSettings,
            businessName: state.settings.storeName,
          }, false);
        }
      });
  } catch (e) {
    console.warn("Gagal fetch Supabase app_state:", e);
  }
  if (typeof BroadcastChannel !== "undefined") {
    channel = new BroadcastChannel("asia_sync");
    channel.onmessage = (e) => {
      if (e.data?.from === TAB_ID) return;
      if (e.data?.key === "all") (Object.keys(STORAGE_KEYS) as StoreKey[]).forEach(reloadKey);
      else if (e.data?.key in STORAGE_KEYS) reloadKey(e.data.key);
    };
  }
  window.addEventListener("storage", (e) => {
    const entry = (Object.entries(STORAGE_KEYS) as [StoreKey, string][]).find(([, v]) => v === e.key);
    if (entry) reloadKey(entry[0]);
    else if (e.key === null) (Object.keys(STORAGE_KEYS) as StoreKey[]).forEach(reloadKey);
    else if (e.key === CART_KEY) emit();
  });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useStore<K extends StoreKey>(key: K): StoreShape[K] {
  return useSyncExternalStore(subscribe, () => read(key), () => read(key));
}

/* ---------------- Pricing (single source of truth, mirrors server validation) ---------------- */
export interface PricedLine {
  lineKey: string;
  product: Product;
  variant?: Variant;
  addons: Addon[];
  unitPrice: number;
  lineTotal: number;
  qty: number;
  instructions?: string;
}

export function priceCartLine(product: Product, line: CartLine): PricedLine {
  const variant = product.variants.find((v) => v.id === line.variantId && v.available);
  const addons = product.addons.filter((a) => line.addonIds.includes(a.id) && a.available);
  const unitPrice = product.price + (variant?.priceDelta ?? 0) + addons.reduce((s, a) => s + a.price, 0);
  return { lineKey: line.key, product, variant, addons, unitPrice, lineTotal: unitPrice * line.qty, qty: line.qty, instructions: line.instructions };
}

export function priceCart(lines: CartLine[], products: Product[]): PricedLine[] {
  return lines
    .map((l) => {
      const p = products.find((x) => x.id === l.productId);
      return p ? priceCartLine(p, l) : null;
    })
    .filter((x): x is PricedLine => !!x);
}

export const cartTotal = (lines: CartLine[], products: Product[]) => priceCart(lines, products).reduce((s, l) => s + l.lineTotal, 0);

export const isOrderable = (p: Product) => !p.archived && p.available && (!p.trackStock || p.stock > 0);

export function lineKey(productId: string, variantId?: string, addonIds: string[] = [], instructions = "") {
  return [productId, variantId ?? "", [...addonIds].sort().join("+"), instructions.trim().toLowerCase()].join("|");
}

/* ---------------- Audit ---------------- */
export function appendAudit(actor: string, action: string, detail: string, orderNumber?: string) {
  const entry: AuditEntry = { id: `audit-${uid()}`, at: Date.now(), actor, action, detail, orderNumber };
  saveToStorage("audit", [entry, ...read("audit")].slice(0, 500));
  return entry;
}

/* ---------------- Orders ---------------- */
export interface CheckoutInput {
  table: string | null;
  lines: CartLine[];
  notes: string;
  clientToken?: string;
  customerName?: string;
  paymentMethod?: string;
}
export type CheckoutResult = { ok: true; order: Order } | { ok: false; error: string };

export function generateOrderNumber(orders: Order[], now = new Date()): string {
  const d = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const used = new Set(orders.map((o) => o.number));
  let seq = orders.filter((o) => o.number.startsWith(`ASIA-${d}-`)).length + 1;
  while (used.has(`ASIA-${d}-${String(seq).padStart(3, "0")}`)) seq++;
  return `ASIA-${d}-${String(seq).padStart(3, "0")}`;
}

/** Validates cart + table, recomputes every price from the product catalogue, then persists the order. */
export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const products = read("products");
  const tables = read("tables");
  const orders = read("orders");

  if (!input.table) return { ok: false, error: "Nomor meja tidak valid. Pindai ulang QR di meja Anda." };
  const table = tables.find((t) => t.id === input.table);
  if (!table || !table.active) return { ok: false, error: "Meja ini sedang tidak aktif. Silakan hubungi staf kami." };
  if (!input.lines.length) return { ok: false, error: "Keranjang masih kosong." };
  if (input.clientToken) {
    const dup = orders.find((o) => o.clientToken === input.clientToken);
    if (dup) return { ok: true, order: dup }; // idempotent: never create two orders for one checkout
  }

  const items: OrderItem[] = [];
  for (const line of input.lines) {
    const p = products.find((x) => x.id === line.productId);
    if (!p || !isOrderable(p)) return { ok: false, error: `"${p?.name ?? "Menu"}" sudah tidak tersedia. Mohon periksa keranjang.` };
    const { unitPrice, variant, addons } = priceCartLine(p, line);
    const qty = Math.max(1, Math.min(20, Math.floor(line.qty)));
    if (qty !== line.qty) return { ok: false, error: "Jumlah item tidak valid." };
    if (p.trackStock && p.stock < qty) return { ok: false, error: `Stok "${p.name}" tersisa ${p.stock} ${p.unit}. Mohon kurangi jumlah.` };
    items.push({
      productId: p.id,
      sku: p.sku,
      name: p.name,
      image: p.image,
      unitPrice,
      qty,
      variant: variant?.name,
      addons: addons.map((a) => ({ name: a.name, price: a.price })),
      instructions: line.instructions?.trim() || undefined,
      lineTotal: unitPrice * qty,
    });
  }

  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const now = Date.now();
  const orderId = "ORD-" + Date.now().toString(36).toUpperCase();
  const custName = input.customerName?.trim() || "Pelanggan";
  const payMethod = input.paymentMethod || "Tunai";

  const order: Order = {
    id: orderId,
    number: generateOrderNumber(orders),
    table: table.id,
    items,
    notes: input.notes.trim().slice(0, 200),
    subtotal,
    total: subtotal,
    paymentMethod: payMethod === "QRIS" ? "QRIS" : "CASH",
    paymentStatus: "UNPAID", // cash is never auto-paid
    status: "PENDING",
    createdAt: now,
    updatedAt: now,
    businessDate: dateKey(now),
    clientToken: input.clientToken,
  };

  // Deduct tracked stock and keep a movement trail
  let nextProducts = products;
  const movements: StockMovement[] = [];
  items.forEach((it) => {
    const p = products.find((x) => x.id === it.productId);
    if (!p?.trackStock) return;
    nextProducts = nextProducts.map((x) => (x.id === p.id ? { ...x, stock: Math.max(0, x.stock - it.qty), updatedAt: now } : x));
    movements.push({
      id: `sm-${uid()}`,
      productId: p.id,
      productName: p.name,
      delta: -it.qty,
      type: "sale",
      reason: `Order ${order.number}`,
      at: now,
      by: "customer",
    });
  });
  if (movements.length) {
    saveToStorage("products", nextProducts, false);
    saveToStorage("stock", [...movements, ...read("stock")].slice(0, 500));
  }
  saveToStorage("orders", [order, ...orders]);
  appendAudit("customer", "order.create", `New order at table ${table.id} · ${formatItems(items)}`, order.number);

  // 1. Simpan ke Supabase Cloud (Tabel orders sesuai format KasirPro)
  try {
    const orderPayload = {
      id: order.id,
      customer_name: custName,
      table_number: table.name || `Meja ${table.id}`,
      items: items.map((it) => ({
        id: it.productId,
        name: it.name,
        price: Number(it.unitPrice),
        qty: Number(it.qty),
      })),
      total: Number(order.total),
      status: "pending",
      payment_method: payMethod,
      notes: order.notes.trim() || null,
    };

    console.log("Mengirim payload pesanan ke Supabase:", orderPayload);

    const { data, error } = await supabase
      .from("orders")
      .insert([orderPayload])
      .select();

    if (error) {
      console.error("Supabase insert error:", error);
      return { ok: false, error: "Gagal kirim ke kasir: " + error.message };
    }

    console.log("Pesanan berhasil masuk Supabase:", data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Gagal insert ke Supabase:", err);
    return { ok: false, error: "Gagal koneksi ke server kasir: " + msg };
  }

  // 2. Sync pesanan ke KasirPro API lokal jika ada
  try {
    fetch("http://localhost/KasirPro/api/incoming_order.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderNumber: order.number,
        customerName: "Pelanggan Cafe",
        tableName: table.name || `Meja ${table.id}`,
        notes: order.notes,
        paymentMethod: order.paymentMethod,
        items: items.map((it) => ({
          productId: it.productId,
          name: it.name,
          price: it.unitPrice,
          qty: it.qty,
          notes: it.instructions,
        })),
      }),
    }).catch(() => {});
  } catch (e) {}

  return { ok: true, order };
}

const ORDER_FLOW: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

export const canTransition = (from: OrderStatus, to: OrderStatus) => ORDER_FLOW[from].includes(to);

export type ActionResult = { ok: true } | { ok: false; error: string };

export function updateOrderStatus(id: string, to: OrderStatus, actor: string): ActionResult {
  const orders = read("orders");
  const order = orders.find((o) => o.id === id);
  if (!order) return { ok: false, error: "Order not found." };
  if (order.closingId) return { ok: false, error: "This order belongs to a closed business day and is read-only." };
  if (order.status === to) return { ok: true };
  if (!canTransition(order.status, to)) return { ok: false, error: `Cannot move ${order.status} → ${to}.` };

  saveToStorage(
    "orders",
    orders.map((o) => (o.id === id ? { ...o, status: to, updatedAt: Date.now() } : o))
  );

  if (to === "CANCELLED") {
    // restore tracked stock and record the reversal
    const products = read("products");
    const movements: StockMovement[] = [];
    products.forEach((p) => {
      const sold = order.items.filter((i) => i.productId === p.id).reduce((s, i) => s + i.qty, 0);
      if (!p.trackStock || !sold) return;
      movements.push({ id: `sm-${uid()}`, productId: p.id, productName: p.name, delta: sold, type: "restore", reason: `Cancelled ${order.number}`, at: Date.now(), by: actor });
    });
    if (movements.length) {
      saveToStorage("products", products.map((p) => {
        const back = movements.filter((m) => m.productId === p.id).reduce((s, m) => s + m.delta, 0);
        return back ? { ...p, stock: p.stock + back } : p;
      }), false);
      saveToStorage("stock", [...movements, ...read("stock")].slice(0, 500));
    }
  }
  appendAudit(actor, "order.status", `Order status ${order.status} → ${to}`, order.number);

  // Sync perubahan status admin ke Supabase Cloud secara realtime
  try {
    supabase
      .from("orders")
      .update({ status: to, updated_at: new Date().toISOString() })
      .eq("order_number", order.number)
      .then(({ error }) => {
        if (error) console.error("Supabase status sync error:", error);
      });
  } catch (e) {}

  return { ok: true };
}

export function setOrderPaid(id: string, paid: boolean, actor: string): ActionResult {
  const orders = read("orders");
  const order = orders.find((o) => o.id === id);
  if (!order) return { ok: false, error: "Order not found." };
  if (order.closingId) return { ok: false, error: "This order belongs to a closed business day and is read-only." };
  if (order.status === "CANCELLED") return { ok: false, error: "Cancelled orders cannot take a payment." };
  if (order.paymentStatus === (paid ? "PAID" : "UNPAID")) return { ok: true };
  saveToStorage(
    "orders",
    orders.map((o) =>
      o.id === id
        ? { ...o, paymentStatus: paid ? "PAID" : "UNPAID", paidAt: paid ? Date.now() : undefined, paidBy: paid ? actor : undefined, updatedAt: Date.now() }
        : o
    )
  );
  appendAudit(actor, paid ? "payment.cash.paid" : "payment.cash.reopened", `${paid ? "Cash payment verified" : "Cash payment reopened"} · ${formatItems(order.items)}`, order.number);

  // Sync pembayaran admin ke Supabase Cloud secara realtime
  try {
    supabase
      .from("orders")
      .update({ payment_status: paid ? "PAID" : "UNPAID", updated_at: new Date().toISOString() })
      .eq("order_number", order.number)
      .then(({ error }) => {
        if (error) console.error("Supabase payment sync error:", error);
      });
  } catch (e) {}

  return { ok: true };
}

export const formatItems = (items: OrderItem[]) => items.map((i) => `${i.qty}× ${i.name}`).join(", ").slice(0, 160);

/* ---------------- Closing (Reset Harian) ---------------- */
export interface DaySummary {
  periodStart: number;
  totalOrders: number;
  paidOrders: number;
  unpaidOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  grossRevenue: number;
  cashCollected: number;
  outstandingAmount: number;
  orders: Order[];
  closedToday?: Closing;
}

/** Operational period = orders created after the last closing. Closed order records are never deleted. */
export function getDaySummary(orders: Order[], closings: Closing[], now = Date.now()): DaySummary {
  const last = [...closings].sort((a, b) => b.closedAt - a.closedAt)[0];
  const periodStart = last ? last.closedAt : new Date(new Date(now).setHours(0, 0, 0, 0)).getTime();
  const inPeriod = orders.filter((o) => o.createdAt >= periodStart);
  const live = inPeriod.filter((o) => o.status !== "CANCELLED");
  const paid = live.filter((o) => o.paymentStatus === "PAID");
  return {
    periodStart,
    totalOrders: inPeriod.length,
    paidOrders: paid.length,
    unpaidOrders: live.filter((o) => o.paymentStatus === "UNPAID").length,
    completedOrders: inPeriod.filter((o) => o.status === "COMPLETED").length,
    cancelledOrders: inPeriod.filter((o) => o.status === "CANCELLED").length,
    grossRevenue: live.reduce((s, o) => s + o.total, 0),
    cashCollected: paid.reduce((s, o) => s + o.total, 0),
    outstandingAmount: live.filter((o) => o.paymentStatus === "UNPAID").reduce((s, o) => s + o.total, 0),
    orders: inPeriod,
    closedToday: closings.find((c) => c.businessDate === dateKey(now)),
  };
}

export type CloseResult = { ok: true; closing: Closing } | { ok: false; error: string };

export function closeBusinessDay(actor: string, note = ""): CloseResult {
  const orders = read("orders");
  const closings = read("closings");
  const now = Date.now();
  const businessDate = dateKey(now);
  if (closings.some((c) => c.businessDate === businessDate)) {
    return { ok: false, error: "This business date has already been closed. A closing cannot be created twice." };
  }
  const summary = getDaySummary(orders, closings, now);
  const orderIds = summary.orders.map((o) => o.id);
  const closing: Closing = {
    id: `closing-${businessDate}-${uid()}`,
    businessDate,
    periodStart: summary.periodStart,
    periodEnd: now,
    closedAt: now,
    closedBy: actor,
    totalOrders: summary.totalOrders,
    paidOrders: summary.paidOrders,
    unpaidOrders: summary.unpaidOrders,
    completedOrders: summary.completedOrders,
    cancelledOrders: summary.cancelledOrders,
    grossRevenue: summary.grossRevenue,
    cashCollected: summary.cashCollected,
    outstandingAmount: summary.outstandingAmount,
    orderIds,
    note: note.trim() || undefined,
  };
  // Snapshot only: orders are retained (not deleted) and marked as belonging to this closing.
  saveToStorage(
    "orders",
    orders.map((o) => (orderIds.includes(o.id) ? { ...o, closingId: closing.id } : o))
  );
  saveToStorage("closings", [closing, ...closings]);
  appendAudit(actor, "day.close", `Daily closing ${businessDate}: ${closing.totalOrders} orders, ${closing.paidOrders} paid, ${closing.unpaidOrders} unpaid, ${closing.cashCollected} cash collected`);
  return { ok: true, closing };
}

/* ---------------- Products ---------------- */
export function upsertProduct(p: Product, actor: string) {
  const list = read("products");
  const existing = list.find((x) => x.id === p.id);
  const next: Product = { ...p, updatedAt: Date.now() };
  saveToStorage("products", existing ? list.map((x) => (x.id === p.id ? next : x)) : [{ ...next, createdAt: Date.now() }, ...list]);
  appendAudit(actor, existing ? "menu.update" : "menu.create", `${existing ? "Updated" : "Created"} product ${p.name} (${p.sku}) at Rp ${p.price}`, undefined);
}

export function patchProduct(id: string, patch: Partial<Product>, actor: string) {
  const list = read("products");
  const p = list.find((x) => x.id === id);
  saveToStorage("products", list.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: Date.now() } : x)));
  if (p) appendAudit(actor, "menu.update", `Updated ${p.name}: ${Object.keys(patch).join(", ")}`);
  return p;
}

export function bulkPatchProducts(ids: string[], patch: Partial<Product>, actor: string) {
  const list = read("products");
  saveToStorage("products", list.map((p) => (ids.includes(p.id) ? { ...p, ...patch, updatedAt: Date.now() } : p)));
  appendAudit(actor, "menu.bulk", `Bulk update ${ids.length} products: ${Object.keys(patch).join(", ")}`);
}

export function deleteProduct(id: string, actor: string) {
  const list = read("products");
  const p = list.find((x) => x.id === id);
  saveToStorage("products", list.filter((x) => x.id !== id));
  if (p) appendAudit(actor, "menu.delete", `Deleted product ${p.name} (${p.sku})`);
}

export function newProductId() {
  return `p-${uid()}`;
}

export function adjustStock(productId: string, delta: number, reason: string, actor: string): ActionResult {
  const products = read("products");
  const p = products.find((x) => x.id === productId);
  if (!p) return { ok: false, error: "Product not found." };
  if (!Number.isFinite(delta) || delta === 0) return { ok: false, error: "Enter a stock adjustment." };
  const nextStock = Math.max(0, p.stock + delta);
  if (delta < 0 && p.stock + delta < 0) return { ok: false, error: `Only ${p.stock} ${p.unit} in stock.` };
  saveToStorage("products", products.map((x) => (x.id === productId ? { ...x, stock: nextStock, updatedAt: Date.now() } : x)));
  const movement: StockMovement = {
    id: `sm-${uid()}`,
    productId,
    productName: p.name,
    delta,
    type: delta > 0 ? "receive" : "adjust",
    reason,
    at: Date.now(),
    by: actor,
  };
  saveToStorage("stock", [movement, ...read("stock")].slice(0, 500));
  appendAudit(actor, "inventory.adjust", `${p.name} stock ${p.stock} → ${nextStock} ${p.unit} (${reason})`);
  return { ok: true };
}

/* ---------------- Categories / tables / settings ---------------- */
export function upsertCategory(c: Category, actor = "admin") {
  const list = read("categories");
  saveToStorage("categories", list.some((x) => x.id === c.id) ? list.map((x) => (x.id === c.id ? c : x)) : [...list, c]);
  appendAudit(actor, "category.upsert", `Category ${c.name}`);
}
export function deleteCategory(id: string, actor = "admin") {
  const c = read("categories").find((x) => x.id === id);
  saveToStorage("categories", read("categories").filter((x) => x.id !== id));
  if (c) appendAudit(actor, "category.delete", `Deleted category ${c.name}`);
}
export function updateTable(id: string, patch: Partial<Table>, actor = "admin") {
  saveToStorage("tables", read("tables").map((t) => (t.id === id ? { ...t, ...patch } : t)));
  appendAudit(actor, "table.update", `Table ${id}: ${Object.keys(patch).join(", ")}`);
}
export function updateSettings(patch: Partial<Settings>, actor = "admin") {
  const s = read("settings");
  saveToStorage("settings", { ...s, ...patch, promo: { ...s.promo, ...(patch.promo ?? {}) } });
  appendAudit(actor, "settings.update", `Settings updated: ${Object.keys(patch).join(", ")}`);
}

export function resetDemoData() {
  (Object.keys(STORAGE_KEYS) as StoreKey[]).forEach((k) => saveToStorage(k, seedFor[k](), false));
  try {
    localStorage.removeItem(CART_KEY);
    localStorage.setItem(SCHEMA_KEY, String(SCHEMA_VERSION));
  } catch {
    /* ignore */
  }
  channel?.postMessage({ key: "all", from: TAB_ID });
  emit();
}

export function simulateIncomingOrder(): Order | null {
  const products = read("products").filter(isOrderable);
  const tables = read("tables").filter((t) => t.active);
  if (!products.length || !tables.length) return null;
  const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
  const lines: CartLine[] = [];
  for (let i = 0; i < 1 + Math.floor(Math.random() * 3); i++) {
    const p = pick(products);
    if (lines.find((l) => l.productId === p.id)) continue;
    lines.push({ key: lineKey(p.id, p.variants[0]?.id), productId: p.id, qty: 1 + Math.floor(Math.random() * 2), variantId: p.variants[0]?.id, addonIds: [] });
  }
  const res = placeOrder({ table: pick(tables).id, lines, notes: "" });
  return res.ok ? res.order : null;
}

/* ---------------- Cart persistence ---------------- */
export function loadCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((l) => l && typeof l.productId === "string")
      .map((l) => ({
        key: String(l.key ?? lineKey(l.productId, l.variantId, l.addonIds ?? [])),
        productId: String(l.productId),
        qty: Math.max(1, Math.min(20, Number(l.qty ?? 1))),
        variantId: l.variantId ? String(l.variantId) : undefined,
        addonIds: Array.isArray(l.addonIds) ? l.addonIds.map(String) : [],
        instructions: l.instructions ? String(l.instructions) : undefined,
      }));
  } catch {
    return [];
  }
}
export function saveCart(lines: CartLine[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(lines));
  } catch {
    /* ignore */
  }
}
