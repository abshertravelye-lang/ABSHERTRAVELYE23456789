import { ProviderRegistry } from "../providers/ProviderRegistry";
import { compareOffers, type ComparedResults } from "./PriceComparisonEngine";
import { cache, makeSearchHash, TTL } from "../lib/cache";
import { logger } from "../lib/logger";
import type { FlightSearchParams } from "../providers/_base/IFlightProvider";

export type { FlightSearchParams };

export async function searchFlights(params: FlightSearchParams): Promise<ComparedResults & { searchHash: string; cachedAt?: string }> {
  const hash = makeSearchHash(params);
  const cacheKey = `flights:${hash}`;

  // 1. Check cache
  const cached = await cache.get<ComparedResults>(cacheKey);
  if (cached) {
    logger.info({ hash }, "FlightSearch: cache HIT");
    return { ...cached, searchHash: hash, cachedAt: new Date().toISOString() };
  }

  // 2. Fan-out to all active providers (partial failures are tolerated)
  const providers = ProviderRegistry.getActiveFlightProviders();
  if (providers.length === 0) {
    // Fall back to Amadeus mock even if no credentials
    const allProviders = ProviderRegistry.getAllFlightProviders();
    if (allProviders.length === 0) {
      return { cheapest: [], fastest: [], bestValue: [], allOffers: [], providerSummary: [], searchHash: hash };
    }
    const mockResults = await allProviders[0].searchFlights(params);
    const result = compareOffers(mockResults);
    await cache.set(cacheKey, result, TTL.FLIGHT_RESULTS);
    return { ...result, searchHash: hash };
  }

  logger.info({ hash, providerCount: providers.length }, "FlightSearch: fanning out to providers");

  const results = await Promise.allSettled(
    providers.map((p) => p.searchFlights(params)),
  );

  const allOffers = results
    .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof providers[0]["searchFlights"]>>> => r.status === "fulfilled")
    .flatMap((r) => r.value);

  results.forEach((r, i) => {
    if (r.status === "rejected") {
      logger.error({ provider: providers[i].slug, err: r.reason }, "Provider error during fan-out");
    }
  });

  // 3. Compare and rank
  const compared = compareOffers(allOffers);

  // 4. Cache result
  await cache.set(cacheKey, compared, TTL.FLIGHT_RESULTS);

  return { ...compared, searchHash: hash };
}
