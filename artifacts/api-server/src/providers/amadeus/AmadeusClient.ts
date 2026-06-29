import { logger } from "../../lib/logger";

const AMADEUS_BASE_URL = "https://test.api.amadeus.com"; // use https://api.amadeus.com for production

interface AmadeusTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken(): Promise<string> {
  const clientId = process.env.AMADEUS_API_KEY;
  const clientSecret = process.env.AMADEUS_API_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("AMADEUS_API_KEY and AMADEUS_API_SECRET environment variables are required");
  }

  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const resp = await fetch(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Amadeus token error ${resp.status}: ${err}`);
  }

  const data = (await resp.json()) as AmadeusTokenResponse;
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;

  logger.info("Amadeus: access token refreshed");
  return cachedToken;
}

export async function amadeusGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const token = await getAccessToken();
  const url = new URL(`${AMADEUS_BASE_URL}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    }
  }

  const start = Date.now();
  const resp = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  const ms = Date.now() - start;

  if (!resp.ok) {
    const errBody = await resp.text();
    logger.error({ status: resp.status, ms, path }, `Amadeus API error: ${errBody}`);
    throw new Error(`Amadeus ${resp.status}: ${errBody}`);
  }

  logger.info({ path, ms }, "Amadeus request completed");
  return resp.json() as Promise<T>;
}

export function hasAmadeusCredentials(): boolean {
  return !!(process.env.AMADEUS_API_KEY && process.env.AMADEUS_API_SECRET);
}
