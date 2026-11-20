export interface Category {
  id: string;
  name: string;
}

export interface Variant {
  id: string;
  name: string;
  priceDelta: number;
  available: boolean;
}

export interface Addon {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  delta: number;
  type: "receive" | "adjust" | "sale" | "restore";
  reason: string;
  at: number;
  by: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
  sku: string;
  featured: boolean;
  trackStock: boolean;
  stock: number;
  unit: string;
  lowStockThreshold: number;
  variants: Variant[];
  addons: Addon[];
  archived: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Table {
  id: string; // "01".."23" | "VIP"
  name: string;
  active: boolean;
}

export type OrderStatus = "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";
export type PaymentMethod = "CASH";
export type PaymentStatus = "UNPAID" | "PAID";

export interface OrderItemAddon {
  name: string;
  price: number;
}

export interface OrderItem {
  productId: string;
  sku: string;
  name: string;
  image: string;
  unitPrice: number;
  qty: number;
  variant?: string;
  addons: OrderItemAddon[];
  instructions?: string;
  lineTotal: number;
}

export interface Order {
  id: string;
  number: string;
  table: string;
  items: OrderItem[];
  notes: string;
  subtotal: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAt?: number;
  paidBy?: string;
  status: OrderStatus;
  createdAt: number;
  updatedAt: number;
  businessDate: string;
  closingId?: string;
  clientToken?: string;
}

export interface Closing {
  id: string;
  businessDate: string;
  periodStart: number;
  periodEnd: number;
  closedAt: number;
  closedBy: string;
  totalOrders: number;
  paidOrders: number;
  unpaidOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  grossRevenue: number;
  cashCollected: number;
  outstandingAmount: number;
  orderIds: string[];
  note?: string;
}

export interface AuditEntry {
  id: string;
  at: number;
  actor: string;
  action: string;
  detail: string;
  orderNumber?: string;
}

export interface Promo {
  enabled: boolean;
  eyebrow: string;
  title: string;
  description: string;
  cta: string;
  image: string;
}

export interface Settings {
  businessName: string;
  soundEnabled: boolean;
  promo: Promo;
  staffName: string;
}

/* ---------- Auth (client-side demo implementation) ---------- */
export interface AuthRecord {
  username: string;
  displayName: string;
  salt: string; // base64
  hash: string; // base64, PBKDF2-SHA256
  iterations: number;
  mustChangePassword: boolean;
  updatedAt: number;
}

export interface Session {
  username: string;
  displayName: string;
  issuedAt: number;
  expiresAt: number;
  mustChangePassword: boolean;
}

/* ---------- Cart ---------- */
export interface CartLine {
  key: string;
  productId: string;
  qty: number;
  variantId?: string;
  addonIds: string[];
  instructions?: string;
}
