import { Duffel } from "@duffel/api";
import { logger } from "../../lib/logger";

let _client: Duffel | null = null;

export function getDuffelClient(): Duffel {
  if (!_client) {
    const token = process.env.DUFFEL_API_KEY;
    if (!token) throw new Error("DUFFEL_API_KEY environment variable is required");
    _client = new Duffel({ token });
  }
  return _client;
}

export function hasDuffelCredentials(): boolean {
  return !!process.env.DUFFEL_API_KEY;
}

// Re-export for convenience so callers don't need to import Duffel directly
export type { Duffel };

export { logger };
