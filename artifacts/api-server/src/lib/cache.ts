import { createHash } from "crypto";

// In-memory cache fallback — Redis optional
interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();

// Clean expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const entry = store.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      store.delete(key);
      return null;
    }
    return entry.value as T;
  },

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  },

  async del(key: string): Promise<void> {
    store.delete(key);
  },

  async flush(): Promise<void> {
    store.clear();
  },
};

export function makeSearchHash(params: object): string {
  const canonical = JSON.stringify(params, Object.keys(params).sort());
  return createHash("sha256").update(canonical).digest("hex");
}

// TTL constants (seconds)
export const TTL = {
  FLIGHT_RESULTS: 15 * 60,   // 15 minutes
  HOTEL_RESULTS: 30 * 60,    // 30 minutes
  AIRPORT_LIST: 24 * 60 * 60, // 24 hours
};
