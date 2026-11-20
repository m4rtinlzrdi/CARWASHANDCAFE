import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Banknote,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  Download,
  Lock,
  Search,
  SunMedium,
  X,
} from "lucide-react";
import type { Closing, Order, OrderStatus } from "@/lib/types";
import { closeBusinessDay, getDaySummary, setOrderPaid, updateOrderStatus, useStore, type DaySummary } from "@/lib/store";
import { useSession } from "@/lib/auth";
import { Dialog, DialogHeader, Img, btn, inputCls, useFeedback } from "@/components/ui";
import { STATUS_META, cn, formatDate, formatRp, formatTime, startOfDay, tableLabel, timeAgo, useTick } from "@/lib/utils";
import { Card, CardHeader, EmptyState, MethodTag, PageIntro, StatusChip } from "./shared";

const STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "READY", "COMPLETED", "CANCELLED"];

export function PaymentBadge({ status, size = "sm" }: { status: Order["paymentStatus"]; size?: "sm" | "md" }) {
  const paid = status === "PAID";
  return (
    <span
      className={cn(
        "chip inline-flex items-center gap-1.5 rounded-full border font-bold uppercase tracking-wide",
        size === "sm" ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-xs",
        paid ? "border-success/30 bg-success/10 text-success" : "border-danger/30 bg-danger/10 text-danger"
      )}
    >
      {paid ? <BadgeCheck size={size === "sm" ? 12 : 14} /> : <AlertTriangle size={size === "sm" ? 12 : 14} />}
      {paid ? "Paid" : "Unpaid"}
    </span>
  );
}

/** Stage-aware actions. Only valid transitions from the store are offered. */
function QuickActions({ order, actor }: { order: Order; actor: string }) {
  const { toast, confirm } = useFeedback();
  const locked = !!order.closingId;

  const move = (to: OrderStatus, label: string) => {
    const res = updateOrderStatus(order.id, to, actor);
    if (!res.ok) return toast(res.error, "error");
    toast(`${order.number} · ${label}`, "success");
  };
  const reject = async () => {
    const ok = await confirm({
      title: "Reject this order?",
      message: `${order.number} from ${tableLabel(order.table)} will be marked as cancelled. Tracked stock is returned to inventory.`,
      confirmLabel: "Reject order",
      danger: true,
    });
    if (ok) move("CANCELLED", "rejected");
  };
  const markPaid = async () => {
    const ok = await confirm({
      title: "Mark cash payment as paid?",
      message: `Confirm the cash for ${order.number} (${formatRp(order.total)}) has been received at the register. This is recorded with your name and a timestamp.`,
      confirmLabel: "Yes, cash received",
    });
    if (!ok) return;
    const res = setOrderPaid(order.id, true, actor);
    if (!res.ok) return toast(res.error, "error");
    toast(`${order.number} · payment marked PAID`, "success");
  };

  if (locked)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted" title="This order belongs to a closed business day">
        <Lock size={11} /> Closed
      </span>
    );

  return (
    <div className="flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      {order.paymentStatus === "UNPAID" && order.status !== "CANCELLED" && (
        <button className={cn(btn.base, btn.outline, btn.sm, "!border-success/40 !text-success hover:!bg-success/5")} onClick={markPaid}>
          <Banknote size={13} /> Mark paid
        </button>
      )}
      {order.status === "PENDING" && (
        <>
          <button className={cn(btn.base, btn.primary, btn.sm)} onClick={() => move("CONFIRMED", "confirmed")}>
            <Check size={13} /> Confirm
          </button>
          <button className={cn(btn.base, btn.ghost, btn.sm, "!text-danger")} onClick={reject} aria-label={`Reject ${order.number}`}>
            <X size={13} aria-hidden />
            <span className="sr-only">Reject</span>
          </button>
        </>
      )}
      {order.status === "CONFIRMED" && (
        <button className={cn(btn.base, btn.primary, btn.sm)} onClick={() => move("PREPARING", "preparing")}>
          Start preparing
        </button>
      )}
      {order.status === "PREPARING" && (
        <button className={cn(btn.base, btn.gold, btn.sm)} onClick={() => move("READY", "ready to serve")}>
          Mark ready
        </button>
      )}
      {order.status === "READY" && (
        <button className={cn(btn.base, btn.primary, btn.sm)} onClick={() => move("COMPLETED", "completed")}>
          <Check size={13} /> Complete
        </button>
      )}
    </div>
  );
}

/* ---------------- Order detail ---------------- */
function OrderDetail({ orderId, onClose }: { orderId: string | null; onClose: () => void }) {
  const orders = useStore("orders");
  const session = useSession();
  const actor = session?.username ?? "admin";
  const { toast, confirm } = useFeedback();
  const order = orders.find((o) => o.id === orderId) ?? null;
  const [last, setLast] = useState<Order | null>(null);
  if (order && order !== last) setLast(order);
  const o = order ?? last;

  const reopen = async () => {
    if (!o) return;
    const ok = await confirm({
      title: "Reopen this payment?",
      message: "The order will return to UNPAID and the payment timestamp is cleared. This correction is written to the audit log.",
      confirmLabel: "Mark as unpaid",
      danger: true,
    });
    if (!ok) return;
    const res = setOrderPaid(o.id, false, actor);
    if (!res.ok) return toast(res.error, "error");
    toast(`${o.number} · payment marked UNPAID`, "info");
  };

  return (
    <Dialog open={!!order} onClose={onClose} label="Order details" panelClassName="!max-w-lg">
      {o && (
        <>
          <DialogHeader title={o.number} subtitle={`${tableLabel(o.table)} · ${formatDate(o.createdAt)} ${formatTime(o.createdAt)}`} onClose={onClose} />
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-line p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Order status</p>
                <div className="mt-1.5">
                  <StatusChip status={o.status} />
                </div>
              </div>
              <div className="rounded-lg border border-line p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Payment · Cash</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <PaymentBadge status={o.paymentStatus} size="md" />
                </div>
              </div>
            </div>

            <ul className="divide-y divide-line rounded-lg border border-line">
              {o.items.map((it, i) => (
                <li key={`${it.productId}-${i}`} className="flex gap-3 p-3">
                  <Img src={it.image} alt={it.name} className="h-12 w-12 shrink-0 rounded-md" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{it.name}</p>
                    {(it.variant || it.addons.length > 0) && (
                      <p className="text-[11px] leading-snug text-muted">{[it.variant, ...it.addons.map((a) => a.name)].filter(Boolean).join(" · ")}</p>
                    )}
                    {it.instructions && <p className="mt-0.5 text-[11px] italic text-[#8a6b2c]">“{it.instructions}”</p>}
                    <p className="mt-0.5 text-xs tabular text-muted">
                      {it.qty} × {formatRp(it.unitPrice)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold tabular">{formatRp(it.lineTotal)}</p>
                </li>
              ))}
              <li className="flex items-center justify-between px-3 py-2 text-sm text-muted">
                <span>Subtotal</span>
                <span className="tabular">{formatRp(o.subtotal)}</span>
              </li>
              <li className="flex items-center justify-between bg-paper px-3 py-3">
                <span className="text-sm font-semibold">Total</span>
                <span className="text-base font-semibold tabular text-navy">{formatRp(o.total)}</span>
              </li>
            </ul>

            {o.notes && (
              <div className="rounded-lg border border-gold/40 bg-gold/10 p-3 text-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8a6b2c]">Customer note</p>
                <p className="mt-1 leading-relaxed">{o.notes}</p>
              </div>
            )}

            <div className="space-y-1.5 rounded-lg bg-paper p-3 text-xs text-muted">
              <p>
                Created <span className="font-medium text-ink">{formatDate(o.createdAt)} {formatTime(o.createdAt)}</span>
              </p>
              <p>
                Payment:{" "}
                <span className="font-medium text-ink">
                  {o.paymentStatus === "PAID" ? `Verified ${o.paidAt ? `${formatDate(o.paidAt)} ${formatTime(o.paidAt)}` : ""} by ${o.paidBy ?? "—"}` : "Cash not yet received"}
                </span>
              </p>
              {o.closingId && <p className="flex items-center gap-1.5 font-medium text-ink"><Lock size={11} /> Included in a closed business day — read-only</p>}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-4">
            {o.paymentStatus === "PAID" && !o.closingId && o.status !== "CANCELLED" ? (
              <button onClick={reopen} className={cn(btn.base, btn.ghost, btn.sm)}>
                Reopen payment
              </button>
            ) : (
              <span className="text-[11px] text-muted">Updated {timeAgo(o.updatedAt)}</span>
            )}
            <QuickActions order={o} actor={actor} />
          </div>
        </>
      )}
    </Dialog>
  );
}

/* ---------------- Reset Harian ---------------- */
function DailyClosingDialog({ open, onClose, summary, actor, onClosed }: { open: boolean; onClose: () => void; summary: DaySummary; actor: string; onClosed: (c: Closing) => void }) {
  const { toast } = useFeedback();
  const [ack, setAck] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = () => {
    if (!ack || busy) return;
    setBusy(true);
    setError("");
    // Store re-checks for an existing closing for this business date (double-reset protection)
    const res = closeBusinessDay(actor, note);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setAck(false);
    setNote("");
    toast(`Daily closing saved · ${formatRp(res.closing.cashCollected)} cash recorded`, "success");
    onClosed(res.closing);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} label="Reset harian" panelClassName="!max-w-lg">
      <DialogHeader title="Reset Harian" subtitle="End-of-shift cash closing" onClose={onClose} />
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex items-center gap-2 rounded-lg bg-navy px-4 py-3 text-white">
          <CalendarDays size={16} className="text-gold" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/60">Business date</p>
            <p className="text-sm font-semibold">{formatDate(Date.now())}</p>
          </div>
          <span className="ml-auto rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide">Cash only</span>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
          {[
            ["Total orders", String(summary.totalOrders)],
            ["Paid orders", String(summary.paidOrders)],
            ["Unpaid orders", String(summary.unpaidOrders)],
            ["Completed", String(summary.completedOrders)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg border border-line px-3 py-2.5">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">{k}</dt>
              <dd className="mt-0.5 text-lg font-semibold tabular">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-2 rounded-lg border border-success/30 bg-success/5 px-4 py-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Recorded cash revenue</p>
            <p className="text-xl font-semibold tabular text-success">{formatRp(summary.cashCollected)}</p>
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-3 text-xs text-muted">
            <span>Outstanding (unpaid)</span>
            <span className="tabular">{formatRp(summary.outstandingAmount)}</span>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-muted">Unpaid orders are never erased — they stay in outstanding payments.</p>
        </div>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">Closing note (optional)</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} className={inputCls} placeholder="e.g. shift handover to Sinta" />
        </label>

        <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-lg border border-line p-3 text-sm">
          <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#0A2540]" />
          <span className="leading-relaxed">
            I have counted the cash and confirm the closing figures above. Orders stay in history; this cannot be closed twice for the same business date.
          </span>
        </label>
        {error && <p role="alert" className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{error}</p>}
      </div>
      <div className="flex justify-end gap-2 border-t border-line px-5 py-4">
        <button className={cn(btn.base, btn.outline)} onClick={onClose}>
          Cancel
        </button>
        <button className={cn(btn.base, btn.primary)} disabled={!ack || busy} onClick={submit}>
          <Lock size={15} /> Confirm daily closing
        </button>
      </div>
    </Dialog>
  );
}

/* ---------------- Page ---------------- */
type Range = "today" | "yesterday" | "custom" | "all";

export function Orders() {
  const orders = useStore("orders");
  const closings = useStore("closings");
  const session = useSession();
  const actor = session?.username ?? "admin";
  useTick(30000);

  const [status, setStatus] = useState<OrderStatus | "ALL">("ALL");
  const [range, setRange] = useState<Range>("today");
  const [customDate, setCustomDate] = useState(dateInput(Date.now()));
  const [q, setQ] = useState("");
  const [outstandingOnly, setOutstandingOnly] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [closingOpen, setClosingOpen] = useState(false);
  const [lastClosing, setLastClosing] = useState<Closing | null>(null);

  const summary = getDaySummary(orders, closings);
  const closedToday = !!summary.closedToday;

  const scoped = useMemo(() => {
    const today = startOfDay();
    if (range === "all") return orders;
    if (range === "today") return orders.filter((o) => o.createdAt >= today);
    if (range === "yesterday") return orders.filter((o) => o.createdAt >= today - 86400000 && o.createdAt < today);
    const t = new Date(`${customDate}T00:00:00`).getTime();
    return orders.filter((o) => o.createdAt >= t && o.createdAt < t + 86400000);
  }, [orders, range, customDate]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return scoped
      .filter((o) => status === "ALL" || o.status === status)
      .filter((o) => !outstandingOnly || (o.paymentStatus === "UNPAID" && o.status !== "CANCELLED"))
      .filter((o) => {
        if (!needle) return true;
        return (
          o.number.toLowerCase().includes(needle) ||
          o.table.toLowerCase().includes(needle) ||
          tableLabel(o.table).toLowerCase().includes(needle) ||
          o.items.some((i) => i.name.toLowerCase().includes(needle))
        );
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [scoped, status, q, outstandingOnly]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: scoped.length };
    STATUSES.forEach((s) => (c[s] = scoped.filter((o) => o.status === s).length));
    return c;
  }, [scoped]);

  const tabs: (OrderStatus | "ALL")[] = ["ALL", "PENDING", "CONFIRMED", "PREPARING", "READY", "COMPLETED"];

  return (
    <div>
      <PageIntro
        title="Orders"
        description="Cashier queue for all 24 tables. Cash payments are only marked paid by staff, never automatically."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setClosingOpen(true)}
              disabled={closedToday}
              title={closedToday ? "Today has already been closed" : "Close the business day"}
              className={cn(btn.base, btn.gold)}
            >
              <SunMedium size={16} /> Reset Harian
            </button>
            <a href="#/admin/closings" className={cn(btn.base, btn.outline)}>
              <Download size={15} /> Closing history
            </a>
          </div>
        }
      />

      {closedToday && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white px-4 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10 text-success">
            <Lock size={15} />
          </span>
          <p className="min-w-0 flex-1 text-xs leading-relaxed text-muted">
            <span className="font-semibold text-ink">Today&apos;s business day is closed</span> at {formatTime(summary.closedToday!.closedAt)} by {summary.closedToday!.closedBy}. The summary below shows the open period since then; all historical orders are preserved.
          </p>
          <a href="#/admin/closings" className="text-xs font-semibold text-navy hover:underline">
            View report
          </a>
        </div>
      )}

      {/* Operational summary */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {[
          { label: "Orders in period", value: String(summary.totalOrders), icon: <CircleDollarSign size={15} />, sub: `since ${formatTime(summary.periodStart)}` },
          { label: "Unpaid", value: String(summary.unpaidOrders), icon: <AlertTriangle size={15} />, sub: formatRp(summary.outstandingAmount), danger: summary.unpaidOrders > 0 },
          { label: "Paid", value: String(summary.paidOrders), icon: <BadgeCheck size={15} />, sub: "cash verified" },
          { label: "Completed", value: String(summary.completedOrders), icon: <Check size={15} />, sub: `${summary.cancelledOrders} cancelled` },
          { label: "Cash collected", value: formatRp(summary.cashCollected), icon: <Banknote size={15} />, sub: "paid orders only", wide: true },
        ].map((c) => (
          <div key={c.label} className={cn("rounded-xl border border-line bg-white p-4", c.wide && "col-span-2 md:col-span-1")}>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{c.label}</p>
              <span className={cn("flex h-7 w-7 items-center justify-center rounded-md", c.danger ? "bg-danger/10 text-danger" : "bg-navy/[0.06] text-navy")}>{c.icon}</span>
            </div>
            <p className={cn("mt-2 text-xl font-semibold leading-none tabular", c.danger ? "text-danger" : "text-ink")}>{c.value}</p>
            <p className="mt-1.5 text-[11px] text-muted">{c.sub}</p>
          </div>
        ))}
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Order queue"
          subtitle="Payment status (cash) is separate from preparation status."
          action={
            <button
              onClick={() => setOutstandingOnly((v) => !v)}
              aria-pressed={outstandingOnly}
              className={cn(btn.base, btn.sm, outstandingOnly ? btn.danger : btn.outline)}
            >
              {outstandingOnly ? "Showing unpaid only" : "Outstanding only"}
            </button>
          }
        />
        <div className="flex flex-col gap-3 border-b border-line p-4">
          <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1" role="tablist" aria-label="Filter by order status">
            {tabs.map((t) => {
              const active = status === t;
              return (
                <button
                  key={t}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setStatus(t)}
                  className={cn(
                    "press chip flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold",
                    active ? "border-navy bg-navy text-white" : "border-line bg-white text-muted hover:border-navy/40 hover:text-ink"
                  )}
                >
                  {t === "ALL" ? "All" : STATUS_META[t].label}
                  <span className={cn("tabular rounded-full px-1.5 text-[10px]", active ? "bg-white/20" : "bg-ink/5")}>{counts[t]}</span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search order number, table or product…"
                aria-label="Search orders"
                className={cn(inputCls, "!h-10 pl-9")}
              />
            </div>
            <select value={range} onChange={(e) => setRange(e.target.value as Range)} aria-label="Date range" className={cn(inputCls, "!h-10 sm:!w-40")}>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="custom">Custom date</option>
              <option value="all">All time</option>
            </select>
            {range === "custom" && (
              <input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} aria-label="Choose date" className={cn(inputCls, "!h-10 sm:!w-44")} />
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="No orders found" hint="Try another status, date or search term." />
        ) : (
          <>
            {/* Desktop / tablet table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-[10px] uppercase tracking-wider text-muted">
                    <th className="px-4 py-3 font-semibold">Order</th>
                    <th className="px-2 py-3 font-semibold">Table</th>
                    <th className="px-2 py-3 font-semibold">Items</th>
                    <th className="px-2 py-3 text-right font-semibold">Total</th>
                    <th className="px-2 py-3 font-semibold">Payment</th>
                    <th className="px-2 py-3 font-semibold">Status</th>
                    <th className="px-2 py-3 font-semibold">Time</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filtered.slice(0, 200).map((o) => (
                    <tr key={o.id} className={cn("cursor-pointer align-middle transition-colors hover:bg-paper", o.status === "PENDING" && "bg-warning/[0.04]")} onClick={() => setOpenId(o.id)}>
                      <td className="px-4 py-3">
                        <button className="font-semibold tabular text-navy hover:underline" onClick={() => setOpenId(o.id)}>
                          {o.number}
                        </button>
                        {o.closingId && <Lock size={10} className="ml-1.5 inline text-muted" aria-label="Closed" />}
                      </td>
                      <td className="px-2 py-3 font-medium">{tableLabel(o.table)}</td>
                      <td className="max-w-[210px] px-2 py-3 text-muted">
                        <p className="truncate">{o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}</p>
                      </td>
                      <td className="px-2 py-3 text-right font-semibold tabular">{formatRp(o.total)}</td>
                      <td className="px-2 py-3">
                        <div className="flex flex-col items-start gap-1">
                          <MethodTag method={o.paymentMethod} />
                          <PaymentBadge status={o.paymentStatus} />
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <StatusChip status={o.status} />
                      </td>
                      <td className="whitespace-nowrap px-2 py-3 text-muted">
                        <p className="tabular">{formatTime(o.createdAt)}</p>
                        <p className="text-[11px]">{timeAgo(o.createdAt)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <QuickActions order={o} actor={actor} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-line md:hidden">
              {filtered.slice(0, 200).map((o) => (
                <li key={o.id} className={cn("p-4", o.status === "PENDING" && "bg-warning/[0.04]")}>
                  <button onClick={() => setOpenId(o.id)} className="flex w-full items-start justify-between gap-3 text-left">
                    <div>
                      <p className="text-sm font-semibold tabular text-navy">
                        {o.number} {o.closingId && <Lock size={10} className="inline text-muted" />}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {tableLabel(o.table)} · {formatTime(o.createdAt)} · {timeAgo(o.createdAt)}
                      </p>
                    </div>
                    <StatusChip status={o.status} />
                  </button>
                  <p className="mt-2 text-sm text-muted">{o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold tabular">{formatRp(o.total)}</span>
                      <MethodTag method={o.paymentMethod} />
                      <PaymentBadge status={o.paymentStatus} />
                    </div>
                    <button className="flex items-center text-xs font-semibold text-navy" onClick={() => setOpenId(o.id)}>
                      Details <ChevronRight size={14} />
                    </button>
                  </div>
                  <div className="mt-3">
                    <QuickActions order={o} actor={actor} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <OrderDetail orderId={openId} onClose={() => setOpenId(null)} />
      <DailyClosingDialog
        open={closingOpen}
        onClose={() => setClosingOpen(false)}
        summary={summary}
        actor={actor}
        onClosed={(c) => setLastClosing(c)}
      />
      <Dialog open={!!lastClosing} onClose={() => setLastClosing(null)} label="Closing saved" panelClassName="!max-w-sm">
        {lastClosing && (
          <div className="p-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-success/10 text-success">
              <Check size={20} />
            </div>
            <h2 className="font-serif text-xl">Daily closing saved</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {formatDate(lastClosing.closedAt)} · closed by {lastClosing.closedBy}. Cash recorded: <span className="font-semibold text-ink">{formatRp(lastClosing.cashCollected)}</span>. All{" "}
              {lastClosing.totalOrders} orders remain in history.
            </p>
            <div className="mt-5 flex gap-2">
              <button className={cn(btn.base, btn.outline, "flex-1")} onClick={() => setLastClosing(null)}>
                Continue
              </button>
              <a href="#/admin/closings" className={cn(btn.base, btn.primary, "flex-1")}>
                View report
              </a>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

function dateInput(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
