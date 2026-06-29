import type { NormalizedFlightOffer } from "../providers/_base/IFlightProvider";

export type SortMode = "cheapest" | "fastest" | "best_value";

/**
 * Deduplicates offers that are the same flight from different providers,
 * keeping the cheapest version.
 */
export function deduplicateOffers(offers: NormalizedFlightOffer[]): NormalizedFlightOffer[] {
  const seen = new Map<string, NormalizedFlightOffer>();

  for (const offer of offers) {
    // Key = all flight numbers + departure times
    const key = offer.segments
      .map((s) => `${s.flightNumber}@${s.departureAt}`)
      .join("|");

    const existing = seen.get(key);
    if (!existing || offer.totalPrice < existing.totalPrice) {
      seen.set(key, offer);
    }
  }

  return [...seen.values()];
}

/**
 * Scores an offer for "best value" ranking.
 * Lower score = better value.
 */
function bestValueScore(offer: NormalizedFlightOffer): number {
  const priceNorm = offer.totalPrice;
  const durationNorm = offer.totalDurationMin / 60; // hours
  const stopsNorm = offer.stops * 100; // heavy penalty per stop
  const baggagePenalty = offer.baggageIncludedKg === 0 ? 50 : 0;
  return priceNorm * 0.5 + durationNorm * 20 + stopsNorm + baggagePenalty;
}

export function rankOffers(
  offers: NormalizedFlightOffer[],
  mode: SortMode = "cheapest",
): NormalizedFlightOffer[] {
  const copy = [...offers];

  switch (mode) {
    case "cheapest":
      return copy.sort((a, b) => a.totalPrice - b.totalPrice);
    case "fastest":
      return copy.sort((a, b) => a.totalDurationMin - b.totalDurationMin);
    case "best_value":
      return copy.sort((a, b) => bestValueScore(a) - bestValueScore(b));
    default:
      return copy;
  }
}

export interface ComparedResults {
  cheapest: NormalizedFlightOffer[];
  fastest: NormalizedFlightOffer[];
  bestValue: NormalizedFlightOffer[];
  allOffers: NormalizedFlightOffer[];
  providerSummary: Array<{ provider: string; count: number; lowestPrice: number; currency: string }>;
}

export function compareOffers(raw: NormalizedFlightOffer[]): ComparedResults {
  const deduped = deduplicateOffers(raw);

  const providerMap = new Map<string, NormalizedFlightOffer[]>();
  for (const o of deduped) {
    const list = providerMap.get(o.providerSlug) ?? [];
    list.push(o);
    providerMap.set(o.providerSlug, list);
  }

  const providerSummary = [...providerMap.entries()].map(([provider, list]) => ({
    provider,
    count: list.length,
    lowestPrice: Math.min(...list.map((o) => o.totalPrice)),
    currency: list[0]?.currency ?? "USD",
  }));

  return {
    cheapest: rankOffers(deduped, "cheapest"),
    fastest: rankOffers(deduped, "fastest"),
    bestValue: rankOffers(deduped, "best_value"),
    allOffers: deduped,
    providerSummary,
  };
}
