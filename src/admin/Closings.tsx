import { useMemo, useState } from "react";
import { AlertTriangle, CalendarCheck2, Download, FileText, Lock, Printer, Wallet } from "lucide-react";
import type { Closing, Order } from "@/lib/types";
import { useStore } from "@/lib/store";
import { Dialog, DialogHeader, btn, useFeedback } from "@/components/ui";
import { cn, formatDate, formatRp, formatTime, tableLabel } from "@/lib/utils";
import { PaymentBadge } from "./Orders";
import { Card, CardHeader, EmptyState, PageIntro, StatusChip } from "./shared";

function downloadCsv(rows: Closing[]) {
  const head = ["business_date", "closed_at", "closed_by", "total_orders", "paid_orders", "unpaid_orders", "completed", "cancelled", "gross_revenue", "cash_collected", "outstanding"];
  const body = rows.map((c) =>
    [c.businessDate, new Date(c.closedAt).toISOString(), c.closedBy, c.totalOrders, c.paidOrders, c.unpaidOrders, c.completedOrders, c.cancelledOrders, c.grossRevenue, c.cashCollected, c.outstandingAmount].join(",")
  );
  const blob = new Blob([[head.join(","), ...body].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `asia-daily-closings-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function Closings() {
  const closings = useStore("closings");
  const orders = useStore("orders");
  const { toast } = useFeedback();
  const [detail, setDetail] = useState<Closing | null>(null);

  const sorted = useMemo(() => [...closings].sort((a, b) => b.closedAt - a.closedAt), [closings]);
  const totalCash = sorted.reduce((s, c) => s + c.cashCollected, 0);
  const outstanding = orders.filter((o) => o.paymentStatus === "UNPAID" && o.status !== "CANCELLED");
  const outstandingTotal = outstanding.reduce((s, o) => s + o.total, 0);
  const detailOrders: Order[] = detail ? orders.filter((o) => detail.orderIds.includes(o.id)) : [];

  return (
    <div>
      <PageIntro
        title="Daily Closing"
        description="History of Reset Harian snapshots. Closing ends the operational day but never deletes orders, unpaid bills or audit records."
        action={
          <button className={cn(btn.base, btn.outline)} onClick={() => { downloadCsv(sorted); toast("Closing report exported as CSV", "success"); }}>
            <Download size={15} /> Export CSV
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Closings recorded", value: String(sorted.length), sub: "One per business date", icon: <CalendarCheck2 size={15} /> },
          { label: "Cash collected", value: formatRp(totalCash), sub: "Across all closings", icon: <Wallet size={15} /> },
          { label: "Historical orders", value: String(orders.filter((o) => o.closingId).length), sub: "Preserved, never deleted", icon: <FileText size={15} /> },
          { label: "Outstanding payments", value: formatRp(outstandingTotal), sub: `${outstanding.length} unpaid order${outstanding.length === 1 ? "" : "s"}`, icon: <AlertTriangle size={15} />, danger: outstanding.length > 0 },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-line bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{c.label}</p>
              <span className={cn("flex h-7 w-7 items-center justify-center rounded-md", c.danger ? "bg-warning/10 text-warning" : "bg-navy/[0.06] text-navy")}>{c.icon}</span>
            </div>
            <p className="mt-2 truncate text-xl font-semibold leading-none tabular">{c.value}</p>
            <p className="mt-1.5 text-[11px] text-muted">{c.sub}</p>
          </div>
        ))}
      </div>

      <Card className="mt-4">
        <CardHeader title="Closing history" subtitle="Newest business day first" />
        {sorted.length === 0 ? (
          <EmptyState title="No closings yet" hint="Use Reset Harian on the Orders page to record your first daily closing." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[10px] uppercase tracking-wider text-muted">
                  <th className="px-4 py-3 font-semibold">Business date</th>
                  <th className="px-2 py-3 text-right font-semibold">Orders</th>
                  <th className="px-2 py-3 text-right font-semibold">Paid</th>
                  <th className="px-2 py-3 text-right font-semibold">Unpaid</th>
                  <th className="px-2 py-3 text-right font-semibold">Cash revenue</th>
                  <th className="px-2 py-3 font-semibold">Closed by</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {sorted.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-paper">
                    <td className="px-4 py-3">
                      <p className="font-medium">{formatDate(c.closedAt)}</p>
                      <p className="text-[11px] text-muted">{c.businessDate}</p>
                    </td>
                    <td className="px-2 py-3 text-right tabular">{c.totalOrders}</td>
                    <td className="px-2 py-3 text-right tabular text-success">{c.paidOrders}</td>
                    <td className={cn("px-2 py-3 text-right tabular", c.unpaidOrders ? "font-semibold text-danger" : "")}>{c.unpaidOrders}</td>
                    <td className="px-2 py-3 text-right font-semibold tabular">{formatRp(c.cashCollected)}</td>
                    <td className="px-2 py-3">
                      <p className="text-xs font-medium">{c.closedBy}</p>
                      <p className="text-[11px] text-muted">{formatTime(c.closedAt)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <button className={cn(btn.base, btn.outline, btn.sm)} onClick={() => setDetail(c)}>
                        View report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="mt-4">
        <CardHeader title="Outstanding cash payments" subtitle="Unpaid orders stay visible across days until cash is received." />
        {outstanding.length === 0 ? (
          <EmptyState title="All cash payments collected" />
        ) : (
          <ul className="divide-y divide-line">
            {outstanding.slice(0, 8).map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold tabular text-navy">
                    {o.number} <span className="ml-1.5 font-medium text-ink">{tableLabel(o.table)}</span>
                  </p>
                  <p className="text-[11px] text-muted">
                    {formatDate(o.createdAt)} {formatTime(o.createdAt)} · {o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold tabular">{formatRp(o.total)}</span>
                  <PaymentBadge status={o.paymentStatus} />
                  <StatusChip status={o.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Dialog open={!!detail} onClose={() => setDetail(null)} label="Closing report" panelClassName="!max-w-2xl">
        {detail && (
          <>
            <DialogHeader title={`Closing · ${formatDate(detail.closedAt)}`} subtitle={`Closed by ${detail.closedBy} at ${formatTime(detail.closedAt)}`} onClose={() => setDetail(null)} />
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ["Orders", String(detail.totalOrders)],
                  ["Paid", String(detail.paidOrders)],
                  ["Unpaid", String(detail.unpaidOrders)],
                  ["Completed", String(detail.completedOrders)],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-line p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{k}</p>
                    <p className="mt-1 text-lg font-semibold tabular">{v}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-success/30 bg-success/5 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Cash collected</p>
                <p className="mt-1 text-2xl font-semibold tabular text-success">{formatRp(detail.cashCollected)}</p>
                <p className="mt-1 text-xs text-muted">
                  Gross revenue {formatRp(detail.grossRevenue)} · Outstanding {formatRp(detail.outstandingAmount)}
                </p>
              </div>
              {detail.note && <p className="rounded-lg bg-paper p-3 text-sm text-muted">Note: {detail.note}</p>}
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                  <Lock size={11} /> Snapshot of orders ({detail.orderIds.length}) — read-only
                </p>
                <ul className="max-h-56 divide-y divide-line overflow-y-auto rounded-lg border border-line">
                  {detailOrders.map((o) => (
                    <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs">
                      <span className="font-medium tabular text-navy">{o.number}</span>
                      <span className="text-muted">
                        {tableLabel(o.table)} · {formatTime(o.createdAt)}
                      </span>
                      <span className="font-semibold tabular">{formatRp(o.total)}</span>
                      <PaymentBadge status={o.paymentStatus} />
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-[11px] leading-relaxed text-muted">
                Closing snapshots are immutable. Historical orders remain in the order list and cannot be edited or paid after closing.
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t border-line px-5 py-4">
              <button className={cn(btn.base, btn.outline)} onClick={() => window.print()}>
                <Printer size={15} /> Print
              </button>
              <button className={cn(btn.base, btn.primary)} onClick={() => setDetail(null)}>
                Close
              </button>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}
