import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import type { Promo } from "@/lib/types";
import { updateSettings, useStore } from "@/lib/store";
import { Field, Img, Switch, btn, inputCls, useFeedback } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Card, CardHeader, PageIntro } from "./shared";
import { ImagePicker } from "./MenuMgmt";

const pexels = (id: number) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=900&h=640`;
const PRESETS = [
  { label: "Croissant & iced drink", src: pexels(16024411) },
  { label: "Cozy café table", src: pexels(19842817) },
  { label: "Pastry display", src: pexels(33313218) },
  { label: "Latte art", src: pexels(459489) },
];

export function Promotions() {
  const settings = useStore("settings");
  const { toast } = useFeedback();
  const [draft, setDraft] = useState<Promo>(settings.promo);
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings.promo);

  // Re-sync when another tab changes the promo and we have no unsaved edits
  useEffect(() => {
    if (!dirty) setDraft(settings.promo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.promo]);

  const set = <K extends keyof Promo>(k: K, v: Promo[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const save = () => {
    if (draft.enabled && !draft.title.trim()) {
      toast("Add a promotion title before publishing.", "error");
      return;
    }
    updateSettings({ promo: draft });
    toast(draft.enabled ? "Promotion published to the customer page" : "Promotion saved (currently hidden)", "success");
  };

  return (
    <div>
      <PageIntro title="Promotions" description="Edit the hero banner at the top of the customer menu. Publish to update the customer page immediately." />
      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader
            title="Hero banner"
            action={
              <label className="flex items-center gap-2 text-xs font-semibold text-muted">
                <span className={draft.enabled ? "text-success" : ""}>{draft.enabled ? "Enabled" : "Disabled"}</span>
                <Switch checked={draft.enabled} onChange={(v) => set("enabled", v)} label="Enable promotion" />
              </label>
            }
          />
          <div className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Eyebrow label">
                <input className={inputCls} value={draft.eyebrow} onChange={(e) => set("eyebrow", e.target.value)} maxLength={32} />
              </Field>
              <Field label="Button text" hint="Leave empty to hide the button.">
                <input className={inputCls} value={draft.cta} onChange={(e) => set("cta", e.target.value)} maxLength={24} />
              </Field>
            </div>
            <Field label="Title">
              <input className={inputCls} value={draft.title} onChange={(e) => set("title", e.target.value)} maxLength={48} />
            </Field>
            <Field label="Description">
              <textarea rows={2} className={cn(inputCls, "!h-auto resize-none py-3")} value={draft.description} onChange={(e) => set("description", e.target.value)} maxLength={140} />
            </Field>
            <div>
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">Banner image</span>
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <ImagePicker value={draft.image} onChange={(v) => set("image", v)} aspect="aspect-[16/9]" />
                <div className="flex gap-2 sm:w-28 sm:flex-col">
                  {PRESETS.map((p) => (
                    <button
                      key={p.src}
                      onClick={() => set("image", p.src)}
                      aria-label={`Use preset: ${p.label}`}
                      title={p.label}
                      className={cn("press overflow-hidden rounded-md border-2 transition-colors", draft.image === p.src ? "border-gold" : "border-transparent hover:border-line")}
                    >
                      <Img src={p.src} alt={p.label} className="aspect-[16/10] w-full" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-line px-5 py-4">
            <p className="text-xs text-muted">{dirty ? "You have unsaved changes." : "All changes published."}</p>
            <div className="flex gap-2">
              <button className={cn(btn.base, btn.outline)} disabled={!dirty} onClick={() => setDraft(settings.promo)}>
                Discard
              </button>
              <button className={cn(btn.base, btn.primary)} disabled={!dirty} onClick={save}>
                Publish changes
              </button>
            </div>
          </div>
        </Card>

        <div className="xl:col-span-2">
          <div className="xl:sticky xl:top-24">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Live preview · customer view</p>
            <div className="mx-auto max-w-[390px] rounded-xl border border-line bg-paper p-4">
              {draft.enabled ? (
                <div className="relative overflow-hidden rounded-xl">
                  <Img src={draft.image} alt="" className="aspect-[5/4] w-full" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b1623]/80 via-[#0b1623]/30 to-[#0b1623]/10" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">{draft.eyebrow}</p>
                    <h3 className="mt-1.5 font-serif text-[24px] font-medium uppercase leading-[1.1] tracking-wide">{draft.title || "Your title"}</h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-white/85">{draft.description}</p>
                    {draft.cta && (
                      <span className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-xs font-semibold text-navy">
                        {draft.cta} <ChevronRight size={14} />
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex aspect-[5/4] items-center justify-center rounded-xl border border-dashed border-line text-center text-sm text-muted">
                  Promotion is disabled.
                  <br />
                  The customer page shows no banner.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
