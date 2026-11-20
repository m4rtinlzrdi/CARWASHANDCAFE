import type { ReactNode } from "react";
import type { Order, OrderStatus } from "@/lib/types";
import { PAYMENT_META, STATUS_META, cn } from "@/lib/utils";

export function StatusChip({ status }: { status: OrderStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={cn("chip inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold", m.cls)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot, status === "PENDING" && "animate-pulse-dot")} />
      {m.label}
    </span>
  );
}

export function PaymentChip({ order }: { order: Order }) {
  const m = PAYMENT_META[order.paymentStatus];
  return <span className={cn("chip inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", m.cls)}>{m.label}</span>;
}

export function MethodTag({ method }: { method: Order["paymentMethod"] }) {
  return (
    <span className="inline-flex rounded border border-line bg-paper px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-muted">
      {method}
    </span>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-xl border border-line bg-white", className)}>{children}</section>;
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
      <div>
        <h2 className="font-serif text-lg leading-tight">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageIntro({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-serif text-[28px] leading-tight">{title}</h1>
        <p className="mt-1 max-w-xl text-sm text-muted">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="font-serif text-lg">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
    </div>
  );
}
