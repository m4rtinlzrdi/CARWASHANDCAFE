import { useEffect, useState } from "react";
import { Database, FlaskConical, KeyRound, Loader2, RotateCcw, ScrollText, Send, ShieldAlert, Volume2 } from "lucide-react";
import { STORAGE_KEYS, resetDemoData, simulateIncomingOrder, updateSettings, useStore } from "@/lib/store";
import { changePassword, getAuthRecord, sessionExpiryLabel, updateDisplayName, useSession, validatePasswordStrength } from "@/lib/auth";
import { Field, Switch, btn, inputCls, useFeedback } from "@/components/ui";
import { cn, formatDate, formatTime, playChime } from "@/lib/utils";
import { Card, CardHeader, PageIntro } from "./shared";

export function PasswordChangeCard() {
  const { toast } = useFeedback();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const strength = validatePasswordStrength(next);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    setBusy(true);
    const res = await changePassword(current, next, confirm);
    setBusy(false);
    if (!res.ok) return setError(res.error ?? "Could not change password.");
    setCurrent("");
    setNext("");
    setConfirm("");
    setSaved(true);
    toast("Password updated", "success");
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Current password">
          <input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputCls} required />
        </Field>
        <Field label="New password">
          <input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={inputCls} required />
          {next && <span className={cn("mt-1 block text-[11px]", strength ? "text-warning" : "text-success")}>{strength ?? "Strong enough"}</span>}
        </Field>
        <Field label="Confirm new password">
          <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} required />
          {confirm && confirm !== next && <span className="mt-1 block text-[11px] text-danger">Passwords do not match.</span>}
        </Field>
      </div>
      {error && <p role="alert" className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{error}</p>}
      {saved && <p className="mt-3 rounded-lg bg-success/10 px-3 py-2 text-xs font-medium text-success">Password changed. Use it next time you sign in.</p>}
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[11px] text-muted">At least 8 characters with a letter and a number.</p>
        <button type="submit" disabled={busy || !current || !!strength || next !== confirm} className={cn(btn.base, btn.primary, btn.sm)}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />} Update password
        </button>
      </div>
    </form>
  );
}

const ACTION_LABELS: Record<string, string> = {
  "auth.login": "Signed in",
  "auth.logout": "Signed out",
  "auth.password": "Password changed",
  "order.create": "New order",
  "order.status": "Order status changed",
  "payment.cash.paid": "Cash payment verified",
  "payment.cash.reopened": "Payment reopened",
  "day.close": "Daily closing",
  "menu.create": "Product created",
  "menu.update": "Product updated",
  "menu.delete": "Product deleted",
  "menu.bulk": "Bulk product update",
  "inventory.adjust": "Stock adjusted",
  "settings.update": "Settings updated",
  "table.update": "Table updated",
  "category.upsert": "Category saved",
  "category.delete": "Category deleted",
};

export function SettingsPage() {
  const settings = useStore("settings");
  const audit = useStore("audit");
  const session = useSession();
  const { toast, confirm } = useFeedback();
  const [name, setName] = useState(settings.businessName);
  const [display, setDisplay] = useState(session?.displayName ?? "");
  const [showAllAudit, setShowAllAudit] = useState(false);
  const record = getAuthRecord();

  useEffect(() => setName(settings.businessName), [settings.businessName]);
  useEffect(() => setDisplay(session?.displayName ?? ""), [session?.displayName]);

  const reset = async () => {
    const ok = await confirm({
      title: "Reset all demo data?",
      message: "Products, categories, tables, promotions, orders and closings return to seed data. Your admin password is kept. This affects only this browser.",
      confirmLabel: "Reset demo data",
      danger: true,
    });
    if (ok) {
      resetDemoData();
      toast("Demo data restored to seed values", "success");
    }
  };

  return (
    <div className="max-w-4xl">
      <PageIntro title="Settings" description="Business profile, staff account, notifications and the local audit trail." />

      <div className="space-y-4">
        <Card>
          <CardHeader title="Business" subtitle="Cash only · prices in Indonesian Rupiah" />
          <div className="space-y-4 p-5">
            <Field label="Business name">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
                <button className={cn(btn.base, btn.primary)} disabled={!name.trim() || name.trim() === settings.businessName} onClick={() => { updateSettings({ businessName: name.trim() }); toast("Business name saved", "success"); }}>
                  Save
                </button>
              </div>
            </Field>
            <Field label="Staff display name" hint="Shown on your account and attached to daily closings.">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input className={inputCls} value={display} onChange={(e) => setDisplay(e.target.value)} maxLength={60} />
                <button className={cn(btn.base, btn.primary)} disabled={!display.trim() || display.trim() === session?.displayName} onClick={() => { updateDisplayName(display.trim()); toast("Display name updated", "success"); }}>
                  Save
                </button>
              </div>
            </Field>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line p-4">
              <div className="flex items-start gap-3">
                <Volume2 size={18} className="mt-0.5 shrink-0 text-navy" />
                <div>
                  <p className="text-sm font-semibold">New-order notification sound</p>
                  <p className="text-xs text-muted">Plays a soft chime when a new cash order arrives while you are signed in.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className={cn(btn.base, btn.ghost, btn.sm)} onClick={playChime}>
                  Test
                </button>
                <Switch checked={settings.soundEnabled} onChange={(v) => updateSettings({ soundEnabled: v })} label="Notification sound" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Admin password" subtitle={`Signed in as ${record.username} · session ends ${session ? sessionExpiryLabel(session) : "—"}`} />
          <div className="p-5">
            <PasswordChangeCard />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Audit log"
            subtitle="Cash verification, order status changes and closings are recorded."
            action={
              <button className="text-xs font-semibold text-navy hover:underline" onClick={() => setShowAllAudit((v) => !v)}>
                {showAllAudit ? "Show latest 12" : `Show all ${audit.length}`}
              </button>
            }
          />
          <ul className="divide-y divide-line">
            {audit.slice(0, showAllAudit ? audit.length : 12).map((a) => (
              <li key={a.id} className="flex items-start gap-3 px-5 py-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-paper text-muted">
                  <ScrollText size={13} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-ink">
                    {ACTION_LABELS[a.action] ?? a.action}
                    {a.orderNumber && <span className="ml-1.5 font-medium tabular text-navy">{a.orderNumber}</span>}
                  </p>
                  <p className="truncate text-[11px] text-muted">{a.detail}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide text-[#aaa59c]">
                    {a.actor} · {formatDate(a.at)} {formatTime(a.at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Demo tools" subtitle="Helpers for walkthroughs and handover." />
          <div className="divide-y divide-line">
            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div className="flex items-start gap-3">
                <FlaskConical size={18} className="mt-0.5 text-navy" />
                <div>
                  <p className="text-sm font-semibold">Simulate an incoming order</p>
                  <p className="text-xs text-muted">Creates a random unpaid cash order as if a customer just submitted one.</p>
                </div>
              </div>
              <button className={cn(btn.base, btn.outline)} onClick={() => { const o = simulateIncomingOrder(); if (!o) toast("Add an available product and an active table first.", "warning"); }}>
                <Send size={15} /> Simulate order
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div className="flex items-start gap-3">
                <RotateCcw size={18} className="mt-0.5 shrink-0 text-danger" />
                <div>
                  <p className="text-sm font-semibold">Reset demo data</p>
                  <p className="text-xs text-muted">Restores seed data in this browser. Does not change your admin password.</p>
                </div>
              </div>
              <button className={cn(btn.base, btn.outline, "!text-danger")} onClick={reset}>
                Reset
              </button>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Data &amp; security" />
          <div className="space-y-4 p-5 text-sm leading-relaxed text-muted">
            <div className="flex items-start gap-3">
              <Database size={18} className="mt-0.5 shrink-0 text-navy" />
              <ul className="list-disc space-y-1.5 pl-4">
                <li>Cash only — no card or QRIS integration exists in this application.</li>
                <li>Orders, inventory and closings are stored in this browser (localStorage) as a working prototype store.</li>
                <li>Orders sync only between tabs of the same browser. Cross-device operation needs the planned database backend.</li>
                <li>Daily closing snapshots never delete order history; unpaid orders remain outstanding.</li>
              </ul>
            </div>
            <div className="flex items-start gap-3 border-t border-line pt-4">
              <ShieldAlert size={18} className="mt-0.5 shrink-0 text-warning" />
              <div>
                <p className="font-semibold text-ink">Admin authentication is a client-side implementation</p>
                <p className="mt-1">
                  Passwords are hashed with PBKDF2-SHA256 (never stored in plaintext), sessions expire after 8 hours, and the initial password must be changed. This is
                  sufficient for a demonstration, but there is no server to enforce route protection. Before production, move authentication and data to a backend
                  (e.g. Supabase/Postgres) with server-side validation, row-level security and multi-device realtime.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 border-t border-line pt-4">
              {Object.values(STORAGE_KEYS).map((k) => (
                <code key={k} className="rounded bg-paper px-2 py-1 text-[11px] text-ink">
                  {k}
                </code>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
