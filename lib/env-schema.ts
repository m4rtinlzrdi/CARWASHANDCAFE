import { z } from "zod";

type EnvironmentSource = Record<string, string | undefined>;

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalText = z.preprocess(emptyToUndefined, z.string().optional());
const optionalTrimmedText = z.preprocess(
  (value) =>
    typeof value === "string" ? (value.trim() === "" ? undefined : value.trim()) : value,
  z.string().optional(),
);

const isHttpsUrl = (value: string) => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

const optionalHttpUrl = optionalTrimmedText.refine(
  (value) => {
    if (value === undefined) return true;

    try {
      const protocol = new URL(value).protocol;
      return protocol === "http:" || protocol === "https:";
    } catch {
      return false;
    }
  },
  "must be a valid HTTP(S) URL",
);

const optionalPostgresUrl = optionalTrimmedText.refine(
  (value) => {
    if (value === undefined) return true;

    try {
      const url = new URL(value);
      return (
        (url.protocol === "postgres:" || url.protocol === "postgresql:") &&
        url.hostname.length > 0 &&
        url.pathname.length > 1
      );
    } catch {
      return false;
    }
  },
  "must be a valid postgres:// or postgresql:// connection URL",
);

const optionalSecret = optionalText.refine(
  (value) => value === undefined || value.length >= 32,
  "must contain at least 32 characters",
);

const optionalEmail = optionalTrimmedText.refine(
  (value) => value === undefined || z.string().email().safeParse(value).success,
  "must be a valid email address",
);

const productionRequiredKeys = [
  "NEXT_PUBLIC_SITE_URL",
  "DATABASE_URL",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SESSION_SECRET",
  "TOTP_ENCRYPTION_KEY",
  "OWNER_EMAIL",
  "OWNER_INITIAL_PASSWORD",
  "CRON_SECRET",
] as const;

const environmentSchema = z
  .object({
    NODE_ENV: z.preprocess(
      emptyToUndefined,
      z.enum(["development", "test", "production"]).default("development"),
    ),
    NEXT_PUBLIC_SITE_URL: optionalHttpUrl,
    DATABASE_URL: optionalPostgresUrl,
    SUPABASE_URL: optionalHttpUrl,
    SUPABASE_SERVICE_ROLE_KEY: optionalText,
    SESSION_SECRET: optionalSecret,
    TOTP_ENCRYPTION_KEY: optionalSecret,
    OWNER_EMAIL: optionalEmail,
    OWNER_INITIAL_PASSWORD: optionalText,
    KASIR_MODE: z.preprocess(
      emptyToUndefined,
      z.enum(["disabled", "webhook", "stub"]).default("disabled"),
    ),
    KASIR_API_URL: optionalHttpUrl,
    KASIR_API_KEY: optionalText,
    KASIR_AUTH_TYPE: optionalTrimmedText,
    KASIR_WEBHOOK_SECRET: optionalSecret,
    UPSTASH_REDIS_REST_URL: optionalHttpUrl,
    UPSTASH_REDIS_REST_TOKEN: optionalText,
    CRON_SECRET: optionalSecret,
  })
  .superRefine((environment, context) => {
    if (environment.NODE_ENV === "production") {
      for (const key of productionRequiredKeys) {
        if (!environment[key]) {
          context.addIssue({
            code: "custom",
            path: [key],
            message: "is required when NODE_ENV=production",
          });
        }
      }

      if (
        environment.OWNER_INITIAL_PASSWORD &&
        environment.OWNER_INITIAL_PASSWORD.length < 12
      ) {
        context.addIssue({
          code: "custom",
          path: ["OWNER_INITIAL_PASSWORD"],
          message: "must contain at least 12 characters in production",
        });
      }

      for (const [key, value] of [
        ["NEXT_PUBLIC_SITE_URL", environment.NEXT_PUBLIC_SITE_URL],
        ["SUPABASE_URL", environment.SUPABASE_URL],
        ["UPSTASH_REDIS_REST_URL", environment.UPSTASH_REDIS_REST_URL],
      ] as const) {
        if (value && !isHttpsUrl(value)) {
          context.addIssue({
            code: "custom",
            path: [key],
            message: "must use HTTPS in production",
          });
        }
      }
    }

    if (
      Boolean(environment.SUPABASE_URL) !==
      Boolean(environment.SUPABASE_SERVICE_ROLE_KEY)
    ) {
      const missingKey = environment.SUPABASE_URL
        ? "SUPABASE_SERVICE_ROLE_KEY"
        : "SUPABASE_URL";
      context.addIssue({
        code: "custom",
        path: [missingKey],
        message: "must be configured together with its Supabase counterpart",
      });
    }

    if (
      Boolean(environment.UPSTASH_REDIS_REST_URL) !==
      Boolean(environment.UPSTASH_REDIS_REST_TOKEN)
    ) {
      const missingKey = environment.UPSTASH_REDIS_REST_URL
        ? "UPSTASH_REDIS_REST_TOKEN"
        : "UPSTASH_REDIS_REST_URL";
      context.addIssue({
        code: "custom",
        path: [missingKey],
        message: "must be configured together with its Upstash counterpart",
      });
    }

    if (environment.KASIR_MODE === "stub" && environment.NODE_ENV === "production") {
      context.addIssue({
        code: "custom",
        path: ["KASIR_MODE"],
        message: "stub mode is not allowed in production",
      });
    }

    if (environment.KASIR_MODE === "webhook") {
      for (const key of [
        "KASIR_API_URL",
        "KASIR_API_KEY",
        "KASIR_AUTH_TYPE",
        "KASIR_WEBHOOK_SECRET",
      ] as const) {
        if (!environment[key]) {
          context.addIssue({
            code: "custom",
            path: [key],
            message: "is required when KASIR_MODE=webhook",
          });
        }
      }

      if (
        environment.NODE_ENV === "production" &&
        environment.KASIR_API_URL &&
        new URL(environment.KASIR_API_URL).protocol !== "https:"
      ) {
        context.addIssue({
          code: "custom",
          path: ["KASIR_API_URL"],
          message: "must use HTTPS in production",
        });
      }
    }
  });

export type ServerEnvironment = z.infer<typeof environmentSchema>;

/**
 * Validate an environment map without including any supplied values in errors.
 * This pure function is kept separate from the server-only process.env accessor
 * so its rules can be tested without importing server-only code into Vitest.
 */
export function parseServerEnvironment(
  source: EnvironmentSource = {},
): ServerEnvironment {
  const result = environmentSchema.safeParse(source);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => {
        const field = issue.path.map(String).join(".") || "environment";
        return `- ${field}: ${issue.message}`;
      })
      .join("\n");

    const error = new Error(`Invalid server environment configuration:\n${details}`);
    error.name = "EnvironmentValidationError";
    throw error;
  }

  return result.data;
}
