import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Banknote, Receipt, TrendingUp, Wallet } from "lucide-react";
import { getDaySummary, useStore } from "@/lib/store";
import type { Order } from "@/lib/types";
import { cn, formatRp, formatTime, startOfDay, tableLabel, useAnimatedNumber } from "@/lib/utils";
import type { AdminPage } from "@/lib/router";
import { PaymentBadge } from "./Orders";
import { Card, CardHeader, EmptyState, PageIntro, StatusChip } from "./shared";

function Stat({ label, value, sub, icon, format = (n: number) => String(Math.round(n)), accent, warn }: {
  label: string;
  value: number;
  sub: string;
  icon: React.ReactNode;
  format?: (n: number) => string;
  accent?: boolean;
  warn?: boolean;
}) {
  const v = useAnimatedNumber(value, 600);
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</p>
        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", warn ? "bg-danger/10 text-danger" : accent ? "bg-gold/15 text-[#8a6b2c]" : "bg-navy/[0.07] text-navy")}>{icon}</span>
      </div>
      <p className="mt-3 truncate text-[24px] font-semibold leading-none tabular text-ink">{format(v)}</p>
      <p className="mt-2 text-[11px] text-muted">{sub}</p>
    </div>
  );
}

const short = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}k` : String(n));

function SalesChart({ orders }: { orders: Order[] }) {
  const [mode, setMode] = useState<"week" | "hours">("week");
  const paid = orders.filter((o) => o.paymentStatus === "PAID" && o.status !== "CANCELLED");

  const data = useMemo(() => {
    const today = startOfDay();
    if (mode === "week") {
      return Array.from({ length: 7 }, (_, i) => {
        const day = today - (6 - i) * 86400000;
        const sum = paid.filter((o) => o.createdAt >= day && o.createdAt < day + 86400000).reduce((s, o) => s + o.total, 0);
        return { label: new Date(day).toLocaleDateString("en-GB", { weekday: "short" }), value: sum, highlight: i === 6 };
      });
    }
    const nowH = new Date().getHours();
    return Array.from({ length: 15 }, (_, i) => {
      const h = 8 + i;
      const from = today + h * 3600000;
      const sum = paid.filter((o) => o.createdAt >= from && o.createdAt < from + 3600000).reduce((s, o) => s + o.total, 0);
      return { label: String(h).padStart(2, "0"), value: sum, highlight: h === nowH };
    });
  }, [paid, mode]);

  const max = Math.max(...data.map((d) => d.value), 1);
  const nice = Math.ceil(max / 100000) * 100000 || 100000;
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="lg:col-span-2">
      <CardHeader
        title="Cash sales"
        subtitle={`${formatRp(total)} verified · ${mode === "week" ? "last 7 days" : "today by hour"}`}
        action={
          <div className="relative flex rounded-lg border border-line bg-paper p-0.5" role="tablist">
            <span
              aria-hidden
              className="absolute bottom-0.5 left-0.5 top-0.5 w-[calc(50%-2px)] rounded-md bg-white shadow-sm"
              style={{ transform: mode === "week" ? "translateX(0)" : "translateX(100%)", transition: "transform 280ms var(--ease-out)" }}
            />
            {(["week", "hours"] as const).map((m) => (
              <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className={cn("relative z-10 px-3 py-1.5 text-xs font-semibold transition-colors", mode === m ? "text-navy" : "text-muted")}>
                {m === "week" ? "7 days" : "Today"}
              </button>
            ))}
          </div>
        }
      />
      <div className="p-5">
        <div className="flex">
          <div className="relative h-52 w-10 shrink-0" aria-hidden>
            {[1, 0.5, 0].map((f) => (
              <span key={f} className="absolute right-2 translate-y-1/2 text-[10px] tabular text-muted" style={{ bottom: `${f * 100}%` }}>
                {short(nice * f)}
              </span>
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <div className="relative h-52">
              {[0, 0.5, 1].map((f) => (
                <span key={f} className="absolute inset-x-0 h-px bg-line" style={{ bottom: `${f * 100}%` }} aria-hidden />
              ))}
              <div className="absolute inset-0 flex items-end gap-2 sm:gap-3">
                {data.map((d, i) => (
                  <div key={`${mode}-${i}`} className="group relative flex h-full flex-1 items-end justify-center">
                    <span
                      className="pointer-events-none absolute z-20 mb-1.5 whitespace-nowrap rounded bg-ink px-2 py-1 text-[10px] font-semibold tabular text-white opacity-0 transition-opacity group-hover:opacity-100"
                      style={{ bottom: `${(d.value / nice) * 100}%` }}
                    >
                      {formatRp(d.value)}
                    </span>
                    <div
                      className={cn("animate-bar w-full max-w-9 rounded-t-[3px] transition-colors", d.highlight ? "bg-gold" : "bg-navy/85 group-hover:bg-navy")}
                      style={{ height: `${Math.max((d.value / nice) * 100, d.value ? 2 : 0)}%`, animationDelay: `${i * 40}ms` }}
                      title={`${d.label}: ${formatRp(d.value)}`}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-2 flex gap-2 sm:gap-3" aria-hidden>
              {data.map((d, i) => (
                <span key={i} className={cn("flex-1 text-center text-[10px] tabular", d.highlight ? "font-bold text-ink" : "text-muted")}>
                  {d.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function Overview({ go }: { go: (view: "customer" | "admin", page?: AdminPage) => void }) {
  const orders = useStore("orders");
  const closings = useStore("closings");
  const today = startOfDay();
  const summary = getDaySummary(orders, closings);
  const periodOrders = summary.orders;
  const cancelled = summary.cancelledOrders;
  const avg = summary.totalOrders - cancelled > 0 ? summary.grossRevenue / (summary.totalOrders - cancelled) : 0;

  const top = useMemo(() => {
    const week = today - 6 * 86400000;
    const map = new Map<string, { name: string; qty: number }>();
    orders
      .filter((o) => o.createdAt >= week && o.status !== "CANCELLED")
      .forEach((o) => o.items.forEach((i) => map.set(i.productId, { name: i.name, qty: (map.get(i.productId)?.qty ?? 0) + i.qty })));
    return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [orders, today]);
  const topMax = Math.max(...top.map((t) => t.qty), 1);
  const recent = [...periodOrders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);

  return (
    <div>
      <PageIntro
        title="Overview"
        description={`Current operating period since ${formatTime(summary.periodStart)} · cash payments verified by staff only.`}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <div className="col-span-2 lg:col-span-1">
          <Stat label="Cash collected" value={summary.cashCollected} format={(n) => formatRp(n)} sub="Verified paid orders" icon={<Wallet size={16} />} accent />
        </div>
        <Stat label="Orders" value={summary.totalOrders} sub={`${cancelled} cancelled`} icon={<Receipt size={16} />} />
        <Stat label="Unpaid" value={summary.unpaidOrders} sub={formatRp(summary.outstandingAmount)} icon={<AlertTriangle size={16} />} warn={summary.unpaidOrders > 0} />
        <Stat label="Completed" value={summary.completedOrders} sub="Served this period" icon={<CheckCircle2 size={16} />} />
        <Stat label="Avg. order" value={avg} format={(n) => formatRp(n)} sub="Excl. cancelled" icon={<TrendingUp size={16} />} />
        <Stat label="Cash bookings" value={summary.paidOrders} sub={`${summary.totalOrders ? Math.round((summary.paidOrders / Math.max(1, summary.totalOrders)) * 100) : 0}% of orders paid`} icon={<Banknote size={16} />} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <SalesChart orders={orders} />
        <Card>
          <CardHeader title="Top sellers" subtitle="Items sold · last 7 days" />
          <ul className="space-y-4 p-5">
            {top.map((t, i) => (
              <li key={t.name}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium">
                    <span className="mr-2 text-xs tabular text-muted">{i + 1}</span>
                    {t.name}
                  </span>
                  <span className="tabular text-muted">{t.qty}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-paper">
                  <div className="h-full rounded-full bg-navy" style={{ width: `${(t.qty / topMax) * 100}%`, transition: "width 700ms var(--ease-out)" }} />
                </div>
              </li>
            ))}
            {!top.length && <li className="text-sm text-muted">No sales yet.</li>}
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Latest orders"
            subtitle="Cash payment status is separate from preparation status"
            action={
              <button onClick={() => go("admin", "orders")} className="text-xs font-semibold text-navy hover:underline">
                Open orders →
              </button>
            }
          />
          {recent.length === 0 ? (
            <EmptyState title="No orders yet in this period" hint="New table orders will appear here automatically." />
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((o) => (
                <li key={o.id}>
                  <button onClick={() => go("admin", "orders")} className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors hover:bg-paper">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold tabular text-navy">
                        {o.number} <span className="ml-1.5 font-medium text-ink">{tableLabel(o.table)}</span>
                      </p>
                      <p className="mt-0.5 max-w-[44ch] truncate text-xs text-muted">{o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}</p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="hidden text-[11px] text-muted sm:block">{formatTime(o.createdAt)}</span>
                      <span className="text-sm font-semibold tabular">{formatRp(o.total)}</span>
                      <PaymentBadge status={o.paymentStatus} />
                      <StatusChip status={o.status} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <CardHeader title="Operational notes" subtitle="Cashier checklist" />
          <ul className="space-y-3 p-5 text-sm">
            {[
              { icon: <Clock size={15} />, text: summary.unpaidOrders ? `${summary.unpaidOrders} unpaid order${summary.unpaidOrders === 1 ? "" : "s"} awaiting cash — collect at the register.` : "No outstanding cash payments in this period." },
              { icon: <Banknote size={15} />, text: "Cash only. Verify the amount before pressing Mark paid." },
              { icon: <CheckCircle2 size={15} />, text: summary.closedToday ? `Business day closed at ${formatTime(summary.closedToday.closedAt)} by ${summary.closedToday.closedBy}.` : "Use Reset Harian after counting the register to save a closing snapshot." },
            ].map((n, i) => (
              <li key={i} className="flex items-start gap-2.5 text-muted">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-paper text-navy">{n.icon}</span>
                <span className="leading-relaxed">{n.text}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-line px-5 py-3">
            <button onClick={() => go("admin", "closings")} className="text-xs font-semibold text-navy hover:underline">
              Daily closing history →
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
