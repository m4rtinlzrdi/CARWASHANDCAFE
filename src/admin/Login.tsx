import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2, Lock, LogOut, ShieldAlert, User } from "lucide-react";
import { changePassword, login, logout, useSession, validatePasswordStrength } from "@/lib/auth";
import { btn, inputCls, useFeedback } from "@/components/ui";
import { cn } from "@/lib/utils";

function BrandPanel() {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-navy p-10 text-white lg:flex">
      <div>
        <p className="font-serif text-[34px] font-medium leading-none tracking-[0.22em]">ASIA</p>
        <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.32em] text-white/50">Car Wash &amp; Cafe</p>
      </div>
      <div className="relative z-10 max-w-sm">
        <div className="mb-5 h-px w-10 bg-gold" />
        <h1 className="font-serif text-[34px] leading-tight">Cashier &amp; operations, kept simple.</h1>
        <p className="mt-4 text-sm leading-relaxed text-white/60">
          Take orders from all 24 tables, verify cash payments and close the business day — with a clean record of everything that happened.
        </p>
        <ul className="mt-8 space-y-3 text-sm text-white/70">
          {["Table QR / NFC orders in one queue", "Manual cash verification with audit trail", "Daily closing snapshots — orders are never deleted"].map((t) => (
            <li key={t} className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" />
              {t}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-[11px] text-white/35">Admin area · Authorised staff only</p>
      <div aria-hidden className="pointer-events-none absolute -right-24 top-1/4 h-72 w-72 rounded-full border border-white/5" />
      <div aria-hidden className="pointer-events-none absolute -right-10 top-1/3 h-48 w-48 rounded-full border border-gold/20" />
    </div>
  );
}

export function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { toast } = useFeedback();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    const res = await login(username, password);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    toast("Signed in", "success");
    onSuccess();
  };

  return (
    <div className="grid min-h-dvh bg-paper lg:grid-cols-2">
      <BrandPanel />
      <div className="flex flex-col">
        <div className="flex items-center justify-between border-b border-line px-5 py-4 lg:hidden">
          <div>
            <p className="font-serif text-xl tracking-[0.2em]">ASIA</p>
            <p className="text-[9px] uppercase tracking-[0.22em] text-muted">Car Wash &amp; Cafe</p>
          </div>
          <span className="rounded-full border border-line px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted">Admin</span>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10">
          <form onSubmit={submit} className="w-full max-w-sm" noValidate>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">ASIA Admin</p>
            <h1 className="mt-2 font-serif text-[30px] leading-tight">Sign in</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">Use your staff account to access orders and menu management.</p>

            <div className="mt-7 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">Username</span>
                <div className="relative">
                  <User size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    data-autofocus
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={cn(inputCls, "h-12 pl-10")}
                    placeholder="admin"
                    required
                  />
                </div>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">Password</span>
                <div className="relative">
                  <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type={show ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={cn(inputCls, "h-12 px-10")}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    aria-label={show ? "Hide password" : "Show password"}
                    className="press absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-md text-muted hover:bg-ink/5"
                  >
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
            </div>

            {error && (
              <p role="alert" className="mt-4 rounded-lg border border-danger/20 bg-danger/10 px-3 py-2.5 text-xs font-medium leading-relaxed text-danger">
                {error}
              </p>
            )}

            <button type="submit" disabled={busy || !username || !password} className={cn(btn.base, btn.primary, "mt-5 w-full !h-12")}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
              {busy ? "Signing in…" : "Sign in to admin"}
            </button>

            <a href="?table=10#/menu" className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-navy hover:underline">
              <ArrowLeft size={13} /> Back to customer menu
            </a>
          </form>
        </div>
      </div>
    </div>
  );
}

export function ForcePasswordChange({ onDone }: { onDone: () => void }) {
  const session = useSession();
  const { toast } = useFeedback();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const strength = validatePasswordStrength(next);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await changePassword(current, next, confirm);
    setBusy(false);
    if (!res.ok) return setError(res.error ?? "Could not change the password.");
    toast("Password updated. Welcome to ASIA Admin.", "success");
    onDone();
  };

  return (
    <div className="grid min-h-dvh bg-paper lg:grid-cols-2">
      <BrandPanel />
      <div className="flex items-center justify-center px-5 py-10">
        <form onSubmit={submit} className="w-full max-w-md rounded-xl border border-line bg-white p-6" noValidate>
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-gold/15 text-[#8a6b2c]">
            <ShieldAlert size={20} />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">First sign-in</p>
          <h1 className="mt-1 font-serif text-2xl leading-tight">Set a new admin password</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            The initial setup password must be replaced before the admin area can be used. Signed in as <span className="font-semibold text-ink">{session?.username}</span>.
          </p>
          <div className="mt-5 space-y-3.5">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">Current password</span>
              <input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputCls} required />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">New password</span>
              <input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={inputCls} required />
              <span className={cn("mt-1 block text-[11px]", next && strength ? "text-warning" : "text-muted")}>
                {next ? strength ?? "Strong enough — at least 8 characters." : "Minimum 8 characters, with at least one letter and one number."}
              </span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">Confirm new password</span>
              <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} required />
              {confirm && confirm !== next && <span className="mt-1 block text-[11px] text-danger">Passwords do not match.</span>}
            </label>
          </div>
          {error && (
            <p role="alert" className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy || !!strength || next !== confirm || !current} className={cn(btn.base, btn.primary, "mt-5 w-full !h-11")}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />} Save new password
          </button>
          <button
            type="button"
            onClick={() => logout()}
            className="press mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink"
          >
            <LogOut size={13} /> Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
