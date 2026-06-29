import { Router } from "express";
import { z } from "zod/v4";
import { searchFlights } from "../services/FlightSearchService";
import { ProviderRegistry } from "../providers/ProviderRegistry";
import { db } from "@workspace/db";
import { flightSearchesTable, flightSearchLegsTable } from "@workspace/db";

const router = Router();

const flightSearchSchema = z.object({
  tripType: z.enum(["one_way", "round_trip", "multi_city"]).default("one_way"),
  cabinClass: z.enum(["economy", "premium_economy", "business", "first"]).default("economy"),
  adults: z.coerce.number().int().min(1).max(9).default(1),
  children: z.coerce.number().int().min(0).max(8).default(0),
  infants: z.coerce.number().int().min(0).max(4).default(0),
  currency: z.string().length(3).default("USD"),
  // Single leg (one_way / round_trip)
  origin: z.string().length(3).toUpperCase().optional(),
  destination: z.string().length(3).toUpperCase().optional(),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  // Multi-city: JSON encoded array of {origin, destination, departureDate}
  legs: z.string().optional(),
  sort: z.enum(["cheapest", "fastest", "best_value"]).default("cheapest"),
});

// GET /api/flights/search
router.get("/flights/search", async (req, res) => {
  try {
    const query = flightSearchSchema.parse(req.query);

    // Build legs array
    let legs: Array<{ originIata: string; destinationIata: string; departureDate: string }> = [];

    if (query.legs) {
      try {
        legs = JSON.parse(query.legs);
      } catch {
        return res.status(400).json({ error: "Invalid legs JSON" });
      }
    } else {
      if (!query.origin || !query.destination || !query.departureDate) {
        return res.status(400).json({
          error: "origin, destination, and departureDate are required (or use legs for multi-city)",
        });
      }
      legs = [{ originIata: query.origin, destinationIata: query.destination, departureDate: query.departureDate }];
      if (query.tripType === "round_trip" && query.returnDate) {
        legs.push({ originIata: query.destination, destinationIata: query.origin, departureDate: query.returnDate });
      }
    }

    const params = {
      tripType: query.tripType,
      cabinClass: query.cabinClass,
      adults: query.adults,
      children: query.children,
      infants: query.infants,
      currency: query.currency,
      legs,
    };

    const results = await searchFlights(params);

    // Persist search record (non-blocking)
    persistSearch(params, req.ip, results.searchHash).catch(() => {});

    // Return results sorted by requested mode
    const sortedKey = query.sort === "fastest" ? "fastest" : query.sort === "best_value" ? "bestValue" : "cheapest";
    res.json({
      searchHash: results.searchHash,
      cachedAt: results.cachedAt,
      totalResults: results.allOffers.length,
      providerSummary: results.providerSummary,
      offers: results[sortedKey],
    });
  } catch (e) {
    req.log.error(e);
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Invalid parameters", details: e.issues });
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/flights/providers — list all registered providers and their status
router.get("/flights/providers", (_req, res) => {
  const providers = ProviderRegistry.getAllFlightProviders().map((p) => ({
    slug: p.slug,
    name: p.name,
    supportsBooking: p.supportsBooking,
    isAvailable: p.isAvailable(),
  }));
  res.json(providers);
});

async function persistSearch(
  params: Parameters<typeof searchFlights>[0],
  ip: string | undefined,
  hash: string,
) {
  const [search] = await db.insert(flightSearchesTable).values({
    tripType: params.tripType,
    cabinClass: params.cabinClass,
    adults: params.adults,
    children: params.children,
    infants: params.infants,
    currency: params.currency,
    searchHash: hash,
    ipAddress: ip,
  }).returning();

  for (const [i, leg] of params.legs.entries()) {
    await db.insert(flightSearchLegsTable).values({
      searchId: search.id,
      legOrder: i,
      originIata: leg.originIata,
      destinationIata: leg.destinationIata,
      departureDate: leg.departureDate,
    });
  }
}

export default router;
