import "server-only";

import { parseServerEnvironment } from "./env-schema";

/**
 * Read server configuration lazily when a server service needs it. This keeps
 * production builds independent of deployment secrets while failing before a
 * server-only service attempts to use missing or invalid production config.
 */
export function getServerEnv() {
  return parseServerEnvironment(process.env);
}
