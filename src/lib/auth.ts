import { useSyncExternalStore } from "react";
import type { AuthRecord, Session } from "./types";
import { appendAudit, uid } from "./store";

/**
 * Demo admin authentication.
 *
 * What this does: salts + PBKDF2-SHA256 hashes the password with Web Crypto, compares it in
 * constant time, keeps a session with an expiry, and forces a password change on first login.
 * The bootstrap credential is stored only as a hash — no plaintext password exists in the bundle.
 *
 * What this is NOT: server-side authentication. Anything running in the browser can be bypassed by
 * a determined user, so this prototype must be moved to a server-side auth provider (Supabase Auth,
 * etc.) before real use. See README. This limitation is also shown in the admin UI.
 */

const AUTH_KEY = "asia_admin_auth";
const SESSION_KEY = "asia_admin_session";
const ATTEMPTS_KEY = "asia_admin_attempts";
const SESSION_TTL = 8 * 60 * 60 * 1000; // 8 hours
const MAX_ATTEMPTS = 5;
const LOCK_MS = 30 * 1000;

/** Pre-computed PBKDF2-SHA256("asia123", salt, 150000). Initial dev credential, change on first login. */
const BOOTSTRAP = {
  username: "admin",
  displayName: "Restaurant Admin",
  salt: "FCBfbUNhTefHquNzoC4YhQ==",
  hash: "+AOM8GFXmeUaU5P2KGa27t8ol7sz38uJEHbjxiO2ghA=",
  iterations: 150000,
  mustChangePassword: true,
};

const listeners = new Set<() => void>();
let cachedSession: Session | null | undefined;

const notify = () => listeners.forEach((l) => l());

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
const bytesToB64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...Array.from(bytes)));

function cryptoAvailable() {
  return typeof crypto !== "undefined" && !!crypto.subtle;
}

export async function deriveHash(password: string, saltB64: string, iterations: number): Promise<string> {
  if (!cryptoAvailable()) throw new Error("Web Crypto is unavailable in this browser, so sign-in cannot be completed securely.");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: b64ToBytes(saltB64) as BufferSource, iterations, hash: "SHA-256" }, key, 256);
  return bytesToB64(new Uint8Array(bits));
}

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function getAuthRecord(): AuthRecord {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AuthRecord;
      if (parsed?.username && parsed.salt && parsed.hash) return parsed;
    }
  } catch {
    /* ignore */
  }
  const record: AuthRecord = { ...BOOTSTRAP, updatedAt: Date.now() };
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(record));
  } catch {
    /* ignore */
  }
  return record;
}

function saveAuthRecord(record: AuthRecord) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(record));
  notify();
}

/* ---------------- Session ---------------- */
export function getSession(): Session | null {
  if (cachedSession !== undefined) return cachedSession;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return (cachedSession = null);
    const s = JSON.parse(raw) as Session;
    if (!s?.username || s.expiresAt < Date.now()) {
      sessionStorage.removeItem(SESSION_KEY);
      return (cachedSession = null);
    }
    const record = getAuthRecord();
    if (record.username !== s.username) {
      sessionStorage.removeItem(SESSION_KEY);
      return (cachedSession = null);
    }
    // Force-password-change flag always follows the authoritative record
    const session = { ...s, mustChangePassword: record.mustChangePassword };
    cachedSession = session;
    return session;
  } catch {
    return (cachedSession = null);
  }
}

function writeSession(session: Session | null) {
  cachedSession = session;
  try {
    if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
  notify();
}

const authListeners = new Set<() => void>();
function subscribeAuth(cb: () => void) {
  authListeners.add(cb);
  return () => authListeners.delete(cb);
}
function notifyAuth() {
  authListeners.forEach((l) => l());
}

export function useSession(): Session | null {
  return useSyncExternalStore(subscribeAuth, getSession, getSession);
}

/* ---------------- Attempt throttling ---------------- */
function attempts(): { count: number; lockedUntil: number } {
  try {
    return JSON.parse(sessionStorage.getItem(ATTEMPTS_KEY) ?? "") ?? { count: 0, lockedUntil: 0 };
  } catch {
    return { count: 0, lockedUntil: 0 };
  }
}
function saveAttempts(a: { count: number; lockedUntil: number }) {
  try {
    sessionStorage.setItem(ATTEMPTS_KEY, JSON.stringify(a));
  } catch {
    /* ignore */
  }
}

export type LoginResult = { ok: true; session: Session } | { ok: false; error: string };

export async function login(username: string, password: string): Promise<LoginResult> {
  const a = attempts();
  if (a.lockedUntil > Date.now()) {
    const secs = Math.ceil((a.lockedUntil - Date.now()) / 1000);
    return { ok: false, error: `Too many attempts. Try again in ${secs}s.` };
  }
  if (!cryptoAvailable()) return { ok: false, error: "This browser cannot run secure hashing (Web Crypto unavailable)." };

  const record = getAuthRecord();
  const name = username.trim().toLowerCase();
  let match = false;
  if (name === record.username.toLowerCase()) {
    try {
      const hash = await deriveHash(password, record.salt, record.iterations);
      match = constantTimeEqual(hash, record.hash);
    } catch {
      return { ok: false, error: "Sign-in failed. Please try again." };
    }
  } else {
    // Still do a hash so timing doesn't reveal whether the username exists
    await deriveHash(password, record.salt, record.iterations).catch(() => "");
  }

  if (!match) {
    const count = a.count + 1;
    const lockedUntil = count >= MAX_ATTEMPTS ? Date.now() + LOCK_MS : 0;
    saveAttempts({ count: lockedUntil ? 0 : count, lockedUntil });
    return { ok: false, error: lockedUntil ? "Too many failed attempts. Locked for 30 seconds." : "Username or password is incorrect." };
  }

  saveAttempts({ count: 0, lockedUntil: 0 });
  const session: Session = {
    username: record.username,
    displayName: record.displayName,
    issuedAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL,
    mustChangePassword: record.mustChangePassword,
  };
  writeSession(session);
  appendAudit(record.username, "auth.login", "Admin signed in");
  notifyAuth();
  return { ok: true, session };
}

export function logout() {
  const s = getSession();
  if (s) appendAudit(s.username, "auth.logout", "Admin signed out");
  writeSession(null);
  notifyAuth();
}

export interface PasswordResult {
  ok: boolean;
  error?: string;
}

export function validatePasswordStrength(pw: string): string | null {
  if (pw.length < 8) return "Use at least 8 characters.";
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return "Include at least one letter and one number.";
  return null;
}

export async function changePassword(current: string, next: string, confirm: string): Promise<PasswordResult> {
  const session = getSession();
  if (!session) return { ok: false, error: "Your session has expired. Please sign in again." };
  const record = getAuthRecord();
  const currentHash = await deriveHash(current, record.salt, record.iterations);
  if (!constantTimeEqual(currentHash, record.hash)) return { ok: false, error: "Your current password is incorrect." };
  const strength = validatePasswordStrength(next);
  if (strength) return { ok: false, error: strength };
  if (next !== confirm) return { ok: false, error: "The new passwords do not match." };
  if (next === current) return { ok: false, error: "Choose a password different from the current one." };

  const salt = bytesToB64(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await deriveHash(next, salt, record.iterations);
  saveAuthRecord({ ...record, salt, hash, iterations: record.iterations, mustChangePassword: false, updatedAt: Date.now() });
  writeSession({ ...session, mustChangePassword: false });
  appendAudit(session.username, "auth.password", "Admin password changed");
  notifyAuth();
  return { ok: true };
}

export function updateDisplayName(displayName: string) {
  const record = getAuthRecord();
  saveAuthRecord({ ...record, displayName: displayName.trim().slice(0, 60) || record.username });
  const session = getSession();
  if (session) writeSession({ ...session, displayName: getAuthRecord().displayName });
  notifyAuth();
}

export const sessionExpiryLabel = (s: Session) => new Date(s.expiresAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

// Housekeeping export used by the demo reset (auth is intentionally not reset with demo data)
export const AUTH_STORAGE_KEY = AUTH_KEY;
export const makeAuditId = uid;
