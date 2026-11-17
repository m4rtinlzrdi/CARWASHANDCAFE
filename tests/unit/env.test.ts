import { describe, expect, it } from "vitest";
import { parseServerEnvironment } from "../../lib/env-schema";

describe("server environment validation", () => {
  it("defaults to development with cashier integration disabled", () => {
    const environment = parseServerEnvironment();

    expect(environment.NODE_ENV).toBe("development");
    expect(environment.KASIR_MODE).toBe("disabled");
    expect(environment.DATABASE_URL).toBeUndefined();
  });

  it("treats blank optional values as unset", () => {
    const environment = parseServerEnvironment({
      DATABASE_URL: "  ",
      SUPABASE_URL: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
      KASIR_MODE: "",
    });

    expect(environment.DATABASE_URL).toBeUndefined();
    expect(environment.SUPABASE_URL).toBeUndefined();
    expect(environment.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
    expect(environment.KASIR_MODE).toBe("disabled");
  });

  it("accepts a PostgreSQL URL and rejects other database protocols", () => {
    expect(
      parseServerEnvironment({
        DATABASE_URL: "postgresql://user:pass@localhost:5432/asia_dev",
      }).DATABASE_URL,
    ).toBe("postgresql://user:pass@localhost:5432/asia_dev");

    expect(() =>
      parseServerEnvironment({ DATABASE_URL: "mysql://localhost/asia_dev" }),
    ).toThrow(/DATABASE_URL: must be a valid postgres/);
  });

  it("requires production configuration and reports field names, not values", () => {
    let message = "";

    try {
      parseServerEnvironment({
        NODE_ENV: "production",
        SESSION_SECRET: "too-short-test-value",
      });
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }

    expect(message).toContain("DATABASE_URL: is required when NODE_ENV=production");
    expect(message).toContain("SUPABASE_SERVICE_ROLE_KEY: is required when NODE_ENV=production");
    expect(message).toContain("SESSION_SECRET: must contain at least 32 characters");
    expect(message).not.toContain("too-short-test-value");
  });

  it("accepts a complete production contract with secure URLs and disabled cashier mode", () => {
    const environment = parseServerEnvironment({
      NODE_ENV: "production",
      NEXT_PUBLIC_SITE_URL: "https://asia.example.test",
      DATABASE_URL: "postgresql://db-user:db-pass@db.example.test:5432/asia",
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
      SESSION_SECRET: "s".repeat(32),
      TOTP_ENCRYPTION_KEY: "t".repeat(32),
      OWNER_EMAIL: "owner@example.test",
      OWNER_INITIAL_PASSWORD: "change-this-initial-password",
      CRON_SECRET: "c".repeat(32),
    });

    expect(environment.NODE_ENV).toBe("production");
    expect(environment.KASIR_MODE).toBe("disabled");
  });

  it("rejects a short production Owner password without echoing its value", () => {
    let message = "";
    const shortPassword = "12345678901";

    try {
      parseServerEnvironment({
        NODE_ENV: "production",
        OWNER_INITIAL_PASSWORD: shortPassword,
      });
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }

    expect(message).toContain(
      "OWNER_INITIAL_PASSWORD: must contain at least 12 characters in production",
    );
    expect(message).not.toContain(shortPassword);
  });

  it("requires Supabase and Upstash settings in complete pairs", () => {
    expect(() =>
      parseServerEnvironment({ SUPABASE_URL: "https://project.supabase.co" }),
    ).toThrow(/SUPABASE_SERVICE_ROLE_KEY: must be configured together/);

    expect(() =>
      parseServerEnvironment({ UPSTASH_REDIS_REST_URL: "https://redis.example.test" }),
    ).toThrow(/UPSTASH_REDIS_REST_TOKEN: must be configured together/);
  });

  it("requires documented adapter settings only for webhook mode", () => {
    expect(parseServerEnvironment({ KASIR_MODE: "disabled" }).KASIR_MODE).toBe(
      "disabled",
    );
    expect(() =>
      parseServerEnvironment({ KASIR_MODE: "webhook" }),
    ).toThrow(/KASIR_API_URL: is required when KASIR_MODE=webhook/);
  });

  it("does not allow the development cashier stub in production", () => {
    expect(() =>
      parseServerEnvironment({
        NODE_ENV: "production",
        KASIR_MODE: "stub",
      }),
    ).toThrow(/KASIR_MODE: stub mode is not allowed in production/);
  });

  it("requires HTTPS for production public service URLs", () => {
    expect(() =>
      parseServerEnvironment({
        NODE_ENV: "production",
        NEXT_PUBLIC_SITE_URL: "http://asia.example.test",
      }),
    ).toThrow(/NEXT_PUBLIC_SITE_URL: must use HTTPS in production/);
  });
});
