import { useCallback, useEffect, useState } from "react";
import { normalizeTable } from "./utils";

export type View = "customer" | "admin";
export const ADMIN_NAV = ["overview", "orders", "menu", "categories", "promotions", "tables", "closings", "settings"] as const;
export type AdminPage = (typeof ADMIN_NAV)[number] | "login" | "change-password";
const ROUTABLE: AdminPage[] = [...ADMIN_NAV, "login", "change-password"];

export interface Route {
  view: View;
  page: AdminPage;
}

function parseHash(): Route {
  const hash = window.location.hash.replace(/^#\/?/, "");
  const path = window.location.pathname.replace(/\/+$/, "");
  const parts = (hash || path).split("/").filter(Boolean);
  // Admin can be addressed as #/admin/orders, /admin/orders (with server rewrites), or plain #/dashboard
  const adminIdx = parts.indexOf("admin");
  if (adminIdx !== -1 || (!hash && path.endsWith("/admin"))) {
    const candidate = parts[adminIdx + 1] as AdminPage | undefined;
    return { view: "admin", page: candidate && ROUTABLE.includes(candidate) ? candidate : "overview" };
  }
  return { view: "customer", page: "overview" };
}

export function useRoute() {
  const [route, setRoute] = useState<Route>(parseHash);
  useEffect(() => {
    const on = () => setRoute(parseHash());
    window.addEventListener("hashchange", on);
    window.addEventListener("popstate", on);
    return () => {
      window.removeEventListener("hashchange", on);
      window.removeEventListener("popstate", on);
    };
  }, []);
  const go = useCallback((view: View, page: AdminPage = "overview") => {
    window.location.hash = view === "admin" ? `#/admin/${page === "login" ? "login" : page}` : "#/menu";
  }, []);
  return { route, go };
}

/** Table identity lives in the URL (?table=10) — the single source of truth for the customer page. */
function readTable(): string | null {
  return normalizeTable(new URLSearchParams(window.location.search).get("table"));
}

export function useTableParam() {
  const [table, setTableState] = useState<string | null>(readTable);
  useEffect(() => {
    const on = () => setTableState(readTable());
    window.addEventListener("popstate", on);
    window.addEventListener("asia:table", on);
    return () => {
      window.removeEventListener("popstate", on);
      window.removeEventListener("asia:table", on);
    };
  }, []);
  const setTable = useCallback((id: string | null) => {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("table", id);
    else url.searchParams.delete("table");
    window.history.replaceState(null, "", url.toString());
    window.dispatchEvent(new Event("asia:table"));
  }, []);
  const rawProvided = new URLSearchParams(window.location.search).has("table");
  return { table, setTable, rawProvided };
}

export const isEmbedded = () => new URLSearchParams(window.location.search).get("embed") === "1";
