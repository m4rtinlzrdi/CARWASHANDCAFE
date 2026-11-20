import { useEffect, useRef, useState } from "react";
import {
  Bell,
  CalendarCheck2,
  ChevronDown,
  ClipboardList,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu as MenuIcon,
  QrCode,
  Settings as SettingsIcon,
  Smartphone,
  Tags,
  UtensilsCrossed,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { AdminPage, View } from "@/lib/router";
import { useTableParam } from "@/lib/router";
import { updateSettings, useStore } from "@/lib/store";
import { logout, useSession } from "@/lib/auth";
import { Dialog, btn, inputCls, useFeedback } from "@/components/ui";
import { cn, playChime, tableLabel } from "@/lib/utils";
import { Overview } from "./Overview";
import { Orders } from "./Orders";
import { MenuMgmt } from "./MenuMgmt";
import { Categories } from "./Categories";
import { Promotions } from "./Promotions";
import { Tables } from "./Tables";
import { Closings } from "./Closings";
import { PasswordChangeCard, SettingsPage } from "./SettingsPage";
import { AdminLogin, ForcePasswordChange } from "./Login";
import { Card, CardHeader, PageIntro } from "./shared";

const NAV: { id: AdminPage; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard size={18} /> },
  { id: "orders", label: "Orders", icon: <ClipboardList size={18} /> },
  { id: "menu", label: "Menu Management", icon: <UtensilsCrossed size={18} /> },
  { id: "categories", label: "Categories", icon: <Tags size={18} /> },
  { id: "promotions", label: "Promotions", icon: <Megaphone size={18} /> },
  { id: "tables", label: "Table Management", icon: <QrCode size={18} /> },
  { id: "closings", label: "Daily Closing", icon: <CalendarCheck2 size={18} /> },
  { id: "settings", label: "Settings", icon: <SettingsIcon size={18} /> },
];

function Sidebar({ page, go, pending, onNavigate }: { page: AdminPage; go: (v: View, p?: AdminPage) => void; pending: number; onNavigate?: () => void }) {
  const session = useSession();
  return (
    <div className="flex h-full flex-col bg-navy text-white">
      <div className="px-6 pb-6 pt-7">
        <p className="font-serif text-[28px] font-medium leading-none tracking-[0.22em]">ASIA</p>
        <p className="mt-1.5 text-[9px] font-medium uppercase tracking-[0.28em] text-white/55">Car Wash &amp; Cafe</p>
        <div className="mt-5 h-px w-8 bg-gold" />
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3" aria-label="Admin navigation">
        {NAV.map((n) => {
          const active = page === n.id;
          return (
            <button
              key={n.id}
              onClick={() => {
                go("admin", n.id);
                onNavigate?.();
              }}
              aria-current={active ? "page" : undefined}
              className={cn(
                "press relative flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium",
                active ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/5 hover:text-white"
              )}
            >
              <span aria-hidden className="absolute left-0 top-2.5 h-6 w-[3px] rounded-r bg-gold" style={{ transform: active ? "scaleY(1)" : "scaleY(0)", transition: "transform 280ms var(--ease-out)" }} />
              <span className={active ? "text-gold" : ""}>{n.icon}</span>
              <span className="truncate">{n.label}</span>
              {n.id === "orders" && pending > 0 && (
                <span key={pending} className="animate-badge ml-auto shrink-0 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-navy">
                  {pending}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="space-y-2 border-t border-white/10 p-4">
        <div className="flex items-center gap-2.5 rounded-lg bg-white/5 px-3 py-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold">{session?.displayName?.slice(0, 1).toUpperCase() ?? "A"}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">{session?.displayName ?? "Admin"}</p>
            <p className="truncate text-[10px] text-white/45">{session?.username ?? "admin"} · staff</p>
          </div>
          <button onClick={() => { logout(); go("admin", "login"); }} className="press rounded-md p-1.5 text-white/50 hover:bg-white/10 hover:text-white" aria-label="Sign out">
            <LogOut size={15} />
          </button>
        </div>
        <button onClick={() => { go("customer"); onNavigate?.(); }} className="press flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/15 text-xs font-semibold text-white/80 hover:bg-white/5">
          <Smartphone size={15} /> Customer menu
        </button>
        <p className="text-center text-[10px] leading-relaxed text-white/35">Prototype · cash only</p>
      </div>
    </div>
  );
}

export function Admin({ page, go }: { page: AdminPage; go: (v: View, p?: AdminPage) => void }) {
  const session = useSession();
  const orders = useStore("orders");
  const tables = useStore("tables");
  const settings = useStore("settings");
  const { toast } = useFeedback();
  const { table, setTable } = useTableParam();
  const [drawer, setDrawer] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const previewTable = table && tables.some((t) => t.id === table) ? table : "10";
  const pending = orders.filter((o) => o.status === "PENDING").length;

  // New-order detection → toast + optional chime
  const seen = useRef<Set<string> | null>(null);
  const soundRef = useRef(settings.soundEnabled);
  soundRef.current = settings.soundEnabled;
  const signedIn = !!session && !session.mustChangePassword;
  useEffect(() => {
    if (!signedIn) return;
    if (seen.current === null) {
      seen.current = new Set(orders.map((o) => o.id));
      return;
    }
    for (const o of orders) {
      if (seen.current.has(o.id)) continue;
      seen.current.add(o.id);
      if (o.status === "PENDING" && Date.now() - o.createdAt < 20000) {
        toast(`New order ${o.number} · ${tableLabel(o.table)}`, "info");
        if (soundRef.current) playChime();
      }
    }
  }, [orders, toast, signedIn]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setDrawer(false);
    setUserMenu(false);
  }, [page]);

  if (!session) return <AdminLogin onSuccess={() => go("admin", "overview")} />;
  if (session.mustChangePassword) return <ForcePasswordChange onDone={() => go("admin", "overview")} />;

  const title = NAV.find((n) => n.id === page)?.label ?? "Overview";
  const renderPage = () => {
    if (page === "change-password")
      return (
        <div className="max-w-3xl">
          <PageIntro title="Change password" description={`Signed in as ${session.username}. Update the staff password for this admin account.`} />
          <Card>
            <CardHeader title="Admin password" />
            <div className="p-5">
              <PasswordChangeCard />
            </div>
          </Card>
        </div>
      );
    if (page === "orders") return <Orders />;
    if (page === "menu") return <MenuMgmt />;
    if (page === "categories") return <Categories />;
    if (page === "promotions") return <Promotions />;
    if (page === "tables") return <Tables selected={previewTable} onSelect={setTable} onOpenCustomer={() => go("customer")} />;
    if (page === "closings") return <Closings />;
    if (page === "settings") return <SettingsPage />;
    return <Overview go={go} />;
  };

  return (
    <div className="min-h-dvh bg-paper">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <Sidebar page={page} go={go} pending={pending} />
      </aside>
      <Dialog open={drawer} onClose={() => setDrawer(false)} variant="drawer" label="Navigation menu" panelClassName="!bg-transparent !p-0">
        <Sidebar page={page} go={go} pending={pending} onNavigate={() => setDrawer(false)} />
      </Dialog>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line bg-paper/95 px-3 backdrop-blur sm:px-5">
          <button className={cn(btn.base, btn.ghost, "!px-2.5 lg:hidden")} onClick={() => setDrawer(true)} aria-label="Open navigation menu">
            <MenuIcon size={20} />
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{title === "Overview" ? "Overview" : title}</p>
            <p className="hidden truncate text-[10px] uppercase tracking-wider text-muted sm:block">ASIA Car Wash &amp; Cafe · Admin</p>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <label className="hidden items-center gap-1.5 text-[11px] font-medium text-muted xl:flex">
              Preview table
              <select
                value={previewTable}
                onChange={(e) => {
                  setTable(e.target.value);
                  toast(`Customer preview set to ${tableLabel(e.target.value)}`, "info");
                }}
                className={cn(inputCls, "!h-8 !w-auto !py-0 !text-xs")}
                aria-label="Demo table for customer preview"
              >
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.id === "VIP" ? "VIP Room" : `Table ${t.id}`}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={() => {
                updateSettings({ soundEnabled: !settings.soundEnabled });
                if (!settings.soundEnabled) playChime();
              }}
              className={cn(btn.base, btn.ghost, "!px-2.5")}
              aria-pressed={settings.soundEnabled}
              aria-label={`New-order sound ${settings.soundEnabled ? "on" : "off"}. Toggle.`}
              title={`Sound ${settings.soundEnabled ? "on" : "off"}`}
            >
              {settings.soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button onClick={() => go("admin", "orders")} className={cn(btn.base, btn.ghost, "relative !px-2.5")} aria-label={`${pending} pending orders`}>
              <Bell size={18} />
              {pending > 0 && (
                <span key={pending} className="animate-badge absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
                  {pending}
                </span>
              )}
            </button>
            <div className="relative">
              <button onClick={() => setUserMenu((v) => !v)} aria-expanded={userMenu} aria-haspopup="menu" className="press flex h-9 items-center gap-2 rounded-lg border border-line bg-white px-2 hover:border-navy/30">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy text-[10px] font-bold text-white">{session.displayName.slice(0, 1).toUpperCase()}</span>
                <span className="hidden max-w-24 truncate text-xs font-medium sm:block">{session.displayName}</span>
                <ChevronDown size={13} className="text-muted" />
              </button>
              {userMenu && (
                <>
                  <button className="fixed inset-0 z-10 cursor-default" aria-label="Close account menu" tabIndex={-1} onClick={() => setUserMenu(false)} />
                  <div role="menu" className="absolute right-0 top-11 z-20 w-60 overflow-hidden rounded-lg border border-line bg-white shadow-lg">
                    <div className="border-b border-line px-3.5 py-3">
                      <p className="truncate text-sm font-semibold">{session.displayName}</p>
                      <p className="text-[11px] text-muted">{session.username} · signed in</p>
                      <p className="mt-1 text-[10px] text-muted">Session ends {new Date(session.expiresAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <button role="menuitem" onClick={() => { setUserMenu(false); go("admin", "change-password"); }} className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-xs hover:bg-paper">
                      <KeyRound size={14} /> Change password
                    </button>
                    <button role="menuitem" onClick={() => { setUserMenu(false); go("admin", "settings"); }} className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-xs hover:bg-paper">
                      <SettingsIcon size={14} /> Settings
                    </button>
                    <button role="menuitem" onClick={() => { setUserMenu(false); go("customer"); }} className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-xs hover:bg-paper">
                      <Smartphone size={14} /> Customer menu
                    </button>
                    <button role="menuitem" onClick={() => { logout(); go("admin", "login"); }} className="flex w-full items-center gap-2 border-t border-line px-3.5 py-2.5 text-left text-xs font-medium text-danger hover:bg-danger/5">
                      <LogOut size={14} /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] p-3 sm:p-5 lg:p-6">
          <div key={page} className="animate-fade-in">
            {renderPage()}
          </div>
          <p className="mt-8 text-center text-[10px] uppercase tracking-[0.2em] text-[#b3aea5]">ASIA Car Wash &amp; Cafe · Cash only · Prototype build</p>
        </main>
      </div>
    </div>
  );
}
