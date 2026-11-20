import type {
  Addon,
  AuditEntry,
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

const px = (id: number, w = 640, h = 520) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=${w}&h=${h}`;

export const dateKey = (ts = Date.now()) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const SEED_CATEGORIES: Category[] = [
  { id: "coffee", name: "Coffee" },
  { id: "non-coffee", name: "Non-Coffee" },
  { id: "snacks", name: "Snacks" },
  { id: "main", name: "Main Course" },
];

const drinkVariants = (): Variant[] => [
  { id: "regular", name: "Regular", priceDelta: 0, available: true },
  { id: "large", name: "Large", priceDelta: 6000, available: true },
];
const coffeeAddons = (): Addon[] => [
  { id: "extra-shot", name: "Extra Espresso", price: 8000, available: true },
  { id: "oat", name: "Oat Milk", price: 7000, available: true },
  { id: "less-sugar", name: "Less Sugar", price: 0, available: true },
];
const foodAddons = (): Addon[] => [
  { id: "egg", name: "Add Fried Egg", price: 7000, available: true },
  { id: "cheese", name: "Extra Cheese", price: 6000, available: true },
];

let seq = 0;
const nid = () => `seed-${++seq}`;
const now = Date.now();

function product(p: Partial<Product> & Pick<Product, "id" | "name" | "description" | "price" | "category" | "image">): Product {
  return {
    available: true,
    sku: p.id.replace("p-", "AS-").toUpperCase(),
    featured: false,
    trackStock: false,
    stock: 0,
    unit: "pcs",
    lowStockThreshold: 5,
    variants: [],
    addons: [],
    archived: false,
    createdAt: now - 86400000 * 40,
    updatedAt: now - 86400000 * 40,
    ...p,
  };
}

export const SEED_PRODUCTS: Product[] = [
  product({ id: "p-cappuccino", name: "Cappuccino", description: "Double espresso, silky steamed milk and a crown of microfoam.", price: 32000, category: "coffee", image: px(6747870), featured: true, sku: "AS-COF-001", trackStock: true, stock: 48, unit: "cup", lowStockThreshold: 12, variants: drinkVariants(), addons: coffeeAddons() }),
  product({ id: "p-latte", name: "Caffè Latte", description: "Smooth, mellow and milky — finished with delicate latte art.", price: 30000, category: "coffee", image: px(459489), featured: true, sku: "AS-COF-002", trackStock: true, stock: 42, unit: "cup", lowStockThreshold: 12, variants: drinkVariants(), addons: coffeeAddons() }),
  product({ id: "p-espresso", name: "Espresso", description: "A concentrated shot of our house blend with a caramel finish.", price: 22000, category: "coffee", image: px(19873648), sku: "AS-COF-003", trackStock: true, stock: 60, unit: "cup", lowStockThreshold: 10, variants: drinkVariants(), addons: coffeeAddons() }),
  product({ id: "p-iced", name: "Iced Coffee", description: "Cold-brewed overnight, served over ice with a touch of cane sugar.", price: 28000, category: "coffee", image: px(37464365), sku: "AS-COF-004", trackStock: true, stock: 8, unit: "cup", lowStockThreshold: 12, variants: drinkVariants(), addons: coffeeAddons() }),
  product({ id: "p-matcha", name: "Matcha Latte", description: "Ceremonial-grade matcha whisked with warm oat or fresh milk.", price: 34000, category: "non-coffee", image: px(911810), sku: "AS-NCF-001", trackStock: true, stock: 30, unit: "cup", lowStockThreshold: 10, variants: drinkVariants(), addons: coffeeAddons() }),
  product({ id: "p-choco", name: "Hot Chocolate", description: "Rich Belgian chocolate topped with whipped cream.", price: 30000, category: "non-coffee", image: px(14730783), sku: "AS-NCF-002", trackStock: true, stock: 26, unit: "cup", lowStockThreshold: 10, variants: drinkVariants() }),
  product({ id: "p-orange", name: "Fresh Orange Juice", description: "Cold-pressed to order from sun-ripened oranges, no added sugar.", price: 26000, category: "non-coffee", image: px(5668181), sku: "AS-NCF-003", trackStock: true, stock: 4, unit: "glass", lowStockThreshold: 8, variants: [{ id: "regular", name: "Regular", priceDelta: 0, available: true }] }),
  product({ id: "p-fries", name: "Truffle Fries", description: "Crisp golden fries, parmesan, and a light truffle seasoning.", price: 35000, category: "snacks", image: px(5836772), featured: true, sku: "AS-SNK-001", trackStock: true, stock: 22, unit: "plate", lowStockThreshold: 6, addons: foodAddons() }),
  product({ id: "p-croissant", name: "Butter Croissant", description: "Flaky, laminated layers baked fresh every morning.", price: 28000, category: "snacks", image: px(20002837), sku: "AS-SNK-002", trackStock: true, stock: 3, unit: "pcs", lowStockThreshold: 8 }),
  product({ id: "p-nasgor", name: "Nasi Goreng Asia", description: "Wok-fried rice, fried egg, chicken satay and house acar.", price: 52000, category: "main", image: px(37171028), sku: "AS-MAI-001", trackStock: true, stock: 18, unit: "plate", lowStockThreshold: 5, addons: foodAddons() }),
  product({ id: "p-club", name: "Club Sandwich", description: "Triple-decker with grilled chicken, egg, greens, served with fries.", price: 55000, category: "main", image: px(5639682), sku: "AS-MAI-002", trackStock: true, stock: 14, unit: "plate", lowStockThreshold: 5, addons: foodAddons() }),
  product({ id: "p-carbonara", name: "Spaghetti Carbonara", description: "Al dente spaghetti, smoked beef, egg yolk and pecorino.", price: 58000, category: "main", image: px(546945), sku: "AS-MAI-003", available: false, trackStock: true, stock: 0, unit: "plate", lowStockThreshold: 5 }),
];

export const SEED_TABLES: Table[] = [
  ...Array.from({ length: 23 }, (_, i) => {
    const id = String(i + 1).padStart(2, "0");
    return { id, name: `Meja ${id}`, active: true };
  }),
  { id: "VIP", name: "VIP Room", active: true },
];

export const SEED_SETTINGS: Settings = {
  businessName: "ASIA Cafe & Eatery",
  soundEnabled: true,
  staffName: "Admin",
  promo: {
    enabled: true,
    eyebrow: "Today's Feature",
    title: "Good Food, Good Moments.",
    description: "Nikmati kopi spesial, minuman segar, dan hidangan lezat kami.",
    cta: "Lihat Menu",
    image: px(16024411, 900, 640),
  },
};

export const SEED_STOCK_MOVEMENTS: StockMovement[] = SEED_PRODUCTS.filter((p) => p.trackStock).map((p, i) => ({
  id: `sm-seed-${p.id}`,
  productId: p.id,
  productName: p.name,
  delta: p.stock,
  type: "receive",
  reason: "Opening stock",
  at: now - 86400000 * 3 + i * 60000,
  by: "admin",
}));

/* ---------- Seed orders & closing history ---------- */
function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pad = (n: number, l = 3) => String(n).padStart(l, "0");
const stamp = (d: Date) => `${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1, 2)}${pad(d.getDate(), 2)}`;

export function buildSeedOrders(): { orders: Order[]; closings: Closing[] } {
  const rand = mulberry(2026);
  const orders: Order[] = [];
  const closings: Closing[] = [];
  const menu = SEED_PRODUCTS.filter((p) => p.available);
  const tableIds = SEED_TABLES.map((t) => t.id);
  const notes = ["", "", "", "Less sugar please", "Tanpa es", "Mohon antar saat mobil selesai dicuci", "", "Extra hot"];
  let orderSeq = 0;

  const makeOrder = (createdAt: number, status: OrderStatus, paid: boolean): Order => {
    const lines = 1 + Math.floor(rand() * 3);
    const items: OrderItem[] = [];
    for (let i = 0; i < lines; i++) {
      const p = menu[Math.floor(rand() * menu.length)];
      if (items.find((it) => it.productId === p.id)) continue;
      const qty = 1 + Math.floor(rand() * 2);
      const variant = p.variants[0];
      const addon = p.addons.length && rand() > 0.6 ? p.addons[0] : undefined;
      const unitPrice = p.price + (variant?.priceDelta ?? 0) + (addon?.price ?? 0);
      items.push({
        productId: p.id,
        sku: p.sku,
        name: p.name,
        image: p.image,
        unitPrice,
        qty,
        variant: variant?.name,
        addons: addon ? [{ name: addon.name, price: addon.price }] : [],
        instructions: "",
        lineTotal: unitPrice * qty,
      });
    }
    const subtotal = items.reduce((s, it) => s + it.lineTotal, 0);
    const d = new Date(createdAt);
    const key = dateKey(createdAt);
    orderSeq++;
    return {
      id: `seed-${key}-${orderSeq}`,
      number: `ASIA-${stamp(d)}-${pad(orderSeq)}`,
      table: tableIds[Math.floor(rand() * tableIds.length)],
      items,
      notes: notes[Math.floor(rand() * notes.length)],
      subtotal,
      total: subtotal,
      paymentMethod: "CASH",
      paymentStatus: paid ? "PAID" : "UNPAID",
      paidAt: paid ? createdAt + 4 * 60000 : undefined,
      paidBy: paid ? "admin" : undefined,
      status,
      createdAt,
      updatedAt: createdAt + 6 * 60000,
      businessDate: key,
      clientToken: undefined,
    };
  };

  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);

  for (let day = 6; day >= 1; day--) {
    const dayStart = startToday.getTime() - day * 86400000;
    const key = dateKey(dayStart);
    const count = 9 + Math.floor(rand() * 8);
    const dayOrders: Order[] = [];
    const times = Array.from({ length: count }, () => dayStart + (8 * 60 + Math.floor(rand() * 13 * 60)) * 60000).sort((a, b) => a - b);
    times.forEach((t, i) => {
      const cancelled = rand() > 0.95;
      const paid = !cancelled && rand() > 0.08;
      const o = makeOrder(t, cancelled ? "CANCELLED" : "COMPLETED", paid);
      o.number = `ASIA-${stamp(new Date(t))}-${pad(i + 1)}`;
      dayOrders.push(o);
    });
    const closingId = `closing-${key}`;
    dayOrders.forEach((o) => {
      o.closingId = closingId;
      orders.push(o);
    });
    const closedAt = dayStart + 22 * 3600000;
    const paid = dayOrders.filter((o) => o.paymentStatus === "PAID" && o.status !== "CANCELLED");
    closings.push({
      id: closingId,
      businessDate: key,
      periodStart: dayStart,
      periodEnd: closedAt,
      closedAt,
      closedBy: "admin",
      totalOrders: dayOrders.length,
      paidOrders: paid.length,
      unpaidOrders: dayOrders.filter((o) => o.paymentStatus === "UNPAID" && o.status !== "CANCELLED").length,
      completedOrders: dayOrders.filter((o) => o.status === "COMPLETED").length,
      cancelledOrders: dayOrders.filter((o) => o.status === "CANCELLED").length,
      grossRevenue: dayOrders.filter((o) => o.status !== "CANCELLED").reduce((s, o) => s + o.total, 0),
      cashCollected: paid.reduce((s, o) => s + o.total, 0),
      outstandingAmount: dayOrders.filter((o) => o.paymentStatus === "UNPAID" && o.status !== "CANCELLED").reduce((s, o) => s + o.total, 0),
      orderIds: dayOrders.map((o) => o.id),
    });
  }

  // Today — a live mix of statuses/payment states, all cash.
  const todayPlan: { minAgo: number; status: OrderStatus; paid: boolean }[] = [
    { minAgo: 290, status: "COMPLETED", paid: true },
    { minAgo: 240, status: "COMPLETED", paid: true },
    { minAgo: 205, status: "COMPLETED", paid: true },
    { minAgo: 170, status: "COMPLETED", paid: true },
    { minAgo: 120, status: "COMPLETED", paid: false },
    { minAgo: 75, status: "COMPLETED", paid: true },
    { minAgo: 42, status: "CANCELLED", paid: false },
    { minAgo: 28, status: "READY", paid: true },
    { minAgo: 17, status: "PREPARING", paid: false },
    { minAgo: 9, status: "CONFIRMED", paid: false },
    { minAgo: 4, status: "PENDING", paid: false },
    { minAgo: 2, status: "PENDING", paid: false },
  ];
  todayPlan.forEach((p, i) => {
    const t = Math.max(startToday.getTime() + 60000 * (i + 1), Date.now() - p.minAgo * 60000);
    const o = makeOrder(t, p.status, p.paid);
    o.number = `ASIA-${stamp(new Date(t))}-${pad(i + 1)}`;
    orders.push(o);
  });

  return { orders: orders.sort((a, b) => b.createdAt - a.createdAt), closings: closings.sort((a, b) => b.closedAt - a.closedAt) };
}

export const SEED_AUDIT: AuditEntry[] = [
  {
    id: "audit-seed-1",
    at: Date.now() - 3600000,
    actor: "admin",
    action: "menu.update",
    detail: "Updated price of Truffle Fries to Rp 35.000",
  },
  {
    id: "audit-seed-2",
    at: Date.now() - 5400000,
    actor: "admin",
    action: "order.paid",
    detail: "Cash payment verified for ASIA order",
    orderNumber: "ASIA-260101-001",
  },
];

let s2 = 0;
export const seedId = () => `seed-${++s2}`;
export const nidSafe = nid;
