import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Category } from "@/lib/types";
import { deleteCategory, upsertCategory, useStore } from "@/lib/store";
import { Dialog, DialogHeader, Field, btn, inputCls, useFeedback } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Card, EmptyState, PageIntro } from "./shared";

export function Categories() {
  const categories = useStore("categories");
  const products = useStore("products");
  const { toast, confirm } = useFeedback();
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const isNew = !!editing && !editing.id;

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setError("");
    }
  }, [editing]);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return setError("Category name is required.");
    if (categories.some((c) => c.name.toLowerCase() === n.toLowerCase() && c.id !== editing?.id)) return setError("That category already exists.");
    const id = editing?.id || `${n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "cat"}-${Math.random().toString(36).slice(2, 5)}`;
    upsertCategory({ id, name: n });
    toast(isNew ? `Category “${n}” created` : `Category renamed to “${n}”`, "success");
    setEditing(null);
  };

  const remove = async (c: Category) => {
    const used = products.filter((p) => p.category === c.id).length;
    if (used > 0) {
      toast(`“${c.name}” still has ${used} product${used > 1 ? "s" : ""}. Move or delete them first.`, "warning");
      return;
    }
    const ok = await confirm({ title: `Delete “${c.name}”?`, message: "This category is empty and will be removed from the customer menu bar.", confirmLabel: "Delete category", danger: true });
    if (ok) {
      deleteCategory(c.id);
      toast(`Category “${c.name}” deleted`, "success");
    }
  };

  return (
    <div>
      <PageIntro
        title="Categories"
        description="Categories become the tabs on the customer menu. “All” is always shown first."
        action={
          <button className={cn(btn.base, btn.primary)} onClick={() => setEditing({ id: "", name: "" })}>
            <Plus size={16} /> Add category
          </button>
        }
      />
      <Card>
        {categories.length === 0 ? (
          <EmptyState title="No categories yet" hint="Add one to start organising your menu." />
        ) : (
          <ul className="divide-y divide-line">
            {categories.map((c, i) => {
              const n = products.filter((p) => p.category === c.id).length;
              return (
                <li key={c.id} className="flex items-center gap-4 px-5 py-4">
                  <span className="w-6 text-xs tabular text-muted">{String(i + 1).padStart(2, "0")}</span>
                  <div className="flex-1">
                    <p className="font-serif text-lg leading-tight">{c.name}</p>
                    <p className="text-xs text-muted">
                      {n} product{n === 1 ? "" : "s"}
                    </p>
                  </div>
                  <button className={cn(btn.base, btn.ghost, "!px-2.5")} onClick={() => setEditing(c)} aria-label={`Rename ${c.name}`}>
                    <Pencil size={16} />
                  </button>
                  <button className={cn(btn.base, btn.ghost, "!px-2.5 hover:!bg-danger/10 hover:!text-danger")} onClick={() => remove(c)} aria-label={`Delete ${c.name}`}>
                    <Trash2 size={16} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Dialog open={!!editing} onClose={() => setEditing(null)} label={isNew ? "Add category" : "Rename category"} panelClassName="!max-w-sm">
        <DialogHeader title={isNew ? "Add category" : "Rename category"} onClose={() => setEditing(null)} />
        <form onSubmit={save} className="p-5" noValidate>
          <Field label="Category name">
            <input data-autofocus className={cn(inputCls, error && "!border-danger")} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Desserts" />
            {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
          </Field>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" className={cn(btn.base, btn.outline)} onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button type="submit" className={cn(btn.base, btn.primary)}>
              {isNew ? "Create" : "Save"}
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
