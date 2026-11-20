import { useEffect, useRef, useState } from "react";
import { Check, Copy, Download, ExternalLink, Link2, Pencil, Printer, QrCode } from "lucide-react";
import { updateTable, useStore } from "@/lib/store";
import { useSession } from "@/lib/auth";
import { Dialog, DialogHeader, Switch, btn, inputCls, useFeedback } from "@/components/ui";
import { QR, downloadQR } from "@/components/QR";
import { cn, tableLabel, tableUrl } from "@/lib/utils";
import { Card, CardHeader, PageIntro } from "./shared";

function LabelSheet({ tables }: { tables: { id: string; name: string }[] }) {
  return (
    <div className="print-area grid grid-cols-2 gap-4 rounded-xl border border-line bg-white p-5 sm:grid-cols-3">
      {tables.map((t) => {
        const url = tableUrl(t.id);
        return (
          <div key={t.id} className="print-label break-inside-avoid rounded-lg border border-line p-3 text-center">
            <p className="font-serif text-xl tracking-[0.2em]">ASIA</p>
            <p className="text-[7px] uppercase tracking-[0.22em] text-muted">Car Wash &amp; Cafe</p>
            <div className="mt-2 flex justify-center">
              <QR value={url} size={110} className="rounded bg-white" />
            </div>
            <p className="mt-2 rounded bg-navy px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">{tableLabel(t.id)}</p>
            <p className="mt-1 break-all text-[6px] leading-tight text-muted">{url}</p>
            <p className="mt-1 text-[7px] italic text-gold">Scan to order</p>
          </div>
        );
      })}
      <p className="print-hidden col-span-full text-[11px] text-muted">Tip: print at 100% scale on A4. Each label belongs on the back of a wooden table sign.</p>
    </div>
  );
}

export function Tables({ selected, onSelect, onOpenCustomer }: { selected: string; onSelect: (id: string) => void; onOpenCustomer: () => void }) {
  const tables = useStore("tables");
  const session = useSession();
  const actor = session?.username ?? "admin";
  const { toast } = useFeedback();
  const table = tables.find((t) => t.id === selected) ?? tables[0];
  const [name, setName] = useState(table.name);
  const [copied, setCopied] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const url = tableUrl(table.id);
  const active = tables.filter((t) => t.active).length;

  useEffect(() => setName(table.name), [table.id, table.name]);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1400);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("Table URL copied", "success");
    } catch {
      toast("Clipboard is unavailable — select the URL manually.", "warning");
    }
  };

  return (
    <div>
      <PageIntro
        title="Table Management"
        description={`${tables.length} permanent table identities (01–23 + VIP Room) · ${active} active. Each QR/NFC link always points to the same table menu.`}
        action={
          <button className={cn(btn.base, btn.outline)} onClick={() => setLabelsOpen(true)}>
            <Printer size={15} /> Print QR labels
          </button>
        }
      />
      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader title="All tables" subtitle="Select a table to see its permanent URL, QR code and customer preview." />
          <div className="grid grid-cols-3 gap-2.5 p-4 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-4 2xl:grid-cols-6">
            {tables.map((t) => (
              <button
                key={t.id}
                onClick={() => onSelect(t.id)}
                aria-pressed={selected === t.id}
                className={cn(
                  "press rounded-lg border p-3 text-left transition-colors",
                  selected === t.id ? "border-navy bg-navy text-white" : "border-line bg-white hover:border-navy/40",
                  !t.active && selected !== t.id && "bg-paper"
                )}
              >
                <span className="flex items-center justify-between">
                  <span className="font-serif text-xl leading-none tabular">{t.id}</span>
                  <span className={cn("h-2 w-2 rounded-full", t.active ? "bg-success" : "bg-[#c9c4ba]")} aria-label={t.active ? "Active" : "Inactive"} />
                </span>
                <span className={cn("mt-2 block truncate text-xs", selected === t.id ? "text-white/70" : "text-muted")}>{t.name}</span>
              </button>
            ))}
          </div>
          <div className="border-t border-line px-4 py-3 text-[11px] leading-relaxed text-muted">
            Production URLs follow the pattern <code className="rounded bg-paper px-1 py-0.5 text-ink">https://yourdomain.com/menu?table=01</code>. The prototype uses this app's
            address; the same table link is stable across menu updates, so printed QR signs stay valid.
          </div>
        </Card>

        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader
              title={table.name}
              subtitle={`Table ID: ${table.id}`}
              action={
                <label className="flex items-center gap-2 text-xs font-semibold text-muted">
                  <span className={table.active ? "text-success" : ""}>{table.active ? "Active" : "Inactive"}</span>
                  <Switch
                    checked={table.active}
                    label={`${table.name} active`}
                    onChange={(active) => {
                      updateTable(table.id, { active }, actor);
                      toast(`${table.name} ${active ? "activated" : "deactivated — guests will see a notice"}`, "info");
                    }}
                  />
                </label>
              }
            />
            <div className="space-y-4 p-5">
              <div className="relative">
                <Pencil size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  className={cn(inputCls, "pl-9")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-label="Table name"
                  onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                  onBlur={() => {
                    const n = name.trim();
                    if (!n) return setName(table.name);
                    if (n !== table.name) {
                      updateTable(table.id, { name: n }, actor);
                      toast("Table name updated", "success");
                    }
                  }}
                />
              </div>

              <div className="flex items-center gap-4 rounded-lg border border-line bg-paper p-4">
                <QR value={url} size={112} className="shrink-0 rounded bg-white" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Permanent URL</p>
                  <p className="mt-1 break-all text-xs font-medium leading-relaxed text-ink">{url}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <button className={cn(btn.base, btn.outline, btn.sm)} onClick={copy}>
                      {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy"}
                    </button>
                    <button
                      className={cn(btn.base, btn.outline, btn.sm)}
                      onClick={() => downloadQR(url, `asia-table-${table.id}.png`).then(() => toast("QR code downloaded", "success"))}
                    >
                      <Download size={13} /> PNG
                    </button>
                  </div>
                </div>
              </div>
              <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted">
                <Link2 size={13} className="mt-0.5 shrink-0" />
                Print this QR on the table sign, or write the same URL to an NFC tag. Guests are identified automatically — they never choose a table manually.
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Customer preview"
              subtitle={`What a guest at ${table.name} sees`}
              action={
                <button className={cn(btn.base, btn.outline, btn.sm)} onClick={onOpenCustomer}>
                  <ExternalLink size={13} /> Open
                </button>
              }
            />
            <div className="bg-paper p-4">
              <div className="mx-auto w-[300px] overflow-hidden rounded-[28px] border-[6px] border-ink bg-white shadow-md">
                <iframe key={table.id} title={`Customer preview for ${table.name}`} src={`${tableUrl(table.id, "&embed=1")}#/menu`} className="block h-[540px] w-[300px] border-0" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={labelsOpen} onClose={() => setLabelsOpen(false)} label="Printable QR labels" panelClassName="!max-w-3xl">
        <div className="print-hidden">
          <DialogHeader title="QR / NFC labels" subtitle="All 24 tables · scan to open each table menu" onClose={() => setLabelsOpen(false)} />
        </div>
        <div className="flex-1 overflow-y-auto p-4" ref={printRef}>
          <LabelSheet tables={tables} />
        </div>
        <div className="print-hidden flex justify-end gap-2 border-t border-line px-5 py-4">
          <button className={cn(btn.base, btn.outline)} onClick={() => setLabelsOpen(false)}>
            Close
          </button>
          <button className={cn(btn.base, btn.gold)} onClick={() => window.print()}>
            <QrCode size={15} /> Print labels
          </button>
        </div>
      </Dialog>
    </div>
  );
}
