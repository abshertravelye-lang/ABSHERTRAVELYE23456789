import { logger } from "../../lib/logger";

const DUFFEL_BASE_URL = "https://api.duffel.com";
const DUFFEL_VERSION = "v2";

export function hasDuffelCredentials(): boolean {
  return !!process.env.DUFFEL_API_KEY;
}

async function duffelRequest<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<T> {
  const token = process.env.DUFFEL_API_KEY;
  if (!token) throw new Error("DUFFEL_API_KEY environment variable is required");

  const start = Date.now();
  const resp = await fetch(`${DUFFEL_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Duffel-Version": DUFFEL_VERSION,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const ms = Date.now() - start;

  if (!resp.ok) {
    const errBody = await resp.text();
    logger.error({ status: resp.status, ms, path }, `Duffel API error: ${errBody}`);
    throw new Error(`Duffel ${resp.status}: ${errBody}`);
  }

  logger.info({ path, ms }, "Duffel request completed");
  return resp.json() as Promise<T>;
}

export function duffelGet<T>(path: string): Promise<T> {
  return duffelRequest<T>("GET", path);
}

export function duffelPost<T>(path: string, body: unknown): Promise<T> {
  return duffelRequest<T>("POST", path, body);
}
