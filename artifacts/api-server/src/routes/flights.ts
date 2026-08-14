import { Router } from "express";
import { z } from "zod";
import { searchFlights } from "../services/FlightSearchService";
import { ProviderRegistry } from "../providers/ProviderRegistry";
import { db } from "@workspace/db";
import { flightSearchesTable, flightSearchLegsTable, bookingsTable } from "@workspace/db";
import { getDuffelClient, hasDuffelCredentials } from "../providers/duffel/DuffelClient";
import { optionalAuth } from "../middleware/auth";

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

interface BookPassenger {
  givenName: string;
  familyName: string;
  title?: string;
  gender?: string;
  dob: string;
  email: string;
  phone: string;
  passport?: string;
  nationality?: string;
}

// POST /api/flights/book — create a real Duffel order or a pending booking request
router.post("/flights/book", optionalAuth, async (req, res) => {
  try {
    const {
      providerSlug, providerOfferId, passengers,
      adults = 1, children = 0, infants = 0,
      totalPrice, destination, travelDate,
    } = req.body as {
      providerSlug: string;
      providerOfferId: string;
      passengers: BookPassenger[];
      adults?: number;
      children?: number;
      infants?: number;
      totalPrice?: number;
      destination?: string;
      travelDate?: string;
    };

    if (!providerOfferId || !Array.isArray(passengers) || passengers.length === 0) {
      return res.status(400).json({ error: "providerOfferId and passengers[] are required" });
    }

    const userId = (req as any).user?.sub ?? null;
    const p0 = passengers[0];
    const clientName = `${p0.givenName ?? ""} ${p0.familyName ?? ""}`.trim() || "—";

    // ── Real Duffel booking via official SDK ────────────────────────────────
    const isDuffelOffer = providerSlug === "duffel" && providerOfferId.startsWith("off_") && hasDuffelCredentials();

    if (isDuffelOffer) {
      const duffel = getDuffelClient();

      // 1. Fetch fresh offer — gets current price + offer.passengers[] with IDs
      //    (equivalent to: duffel.offers.get(OFFER_ID))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const offerResp = await (duffel.offers as any).get(providerOfferId);
      const offer = offerResp.data;

      // offer.passengers is ordered: adults first, then children, then infants
      const offerPax: Array<{ id: string; type: string }> = offer.passengers ?? [];

      if (offerPax.length === 0) {
        return res.status(400).json({ error: "Offer has no passengers — it may have expired" });
      }

      // Separate offer passenger IDs by type (preserving Duffel's order)
      const adultIds   = offerPax.filter(p => p.type === "adult").map(p => p.id);
      const childIds   = offerPax.filter(p => p.type === "child").map(p => p.id);
      const infantIds  = offerPax.filter(p => p.type === "infant_without_seat").map(p => p.id);

      // Our flat passengers[] order: adults → children → infants
      const adultPax   = passengers.slice(0, adults);
      const childPax   = passengers.slice(adults, adults + children);
      const infantPax  = passengers.slice(adults + children, adults + children + infants);

      // 2. Build Duffel passengers array
      //    Adults who travel with infants receive infant_passenger_id
      //    (duffel.orders.create format)
      const duffelPassengers = [
        // Adults
        ...adultPax.map((p, i) => {
          const id = adultIds[i];
          if (!id) return null;
          const infantId = infantIds[i]; // pair adult[i] ↔ infant[i]
          return {
            id,
            given_name: p.givenName,
            family_name: p.familyName,
            born_on: p.dob,
            title: (p.title || "mr") as string,
            gender: (p.gender || "m") as string,
            email: p.email,
            phone_number: p.phone,
            ...(infantId ? { infant_passenger_id: infantId } : {}),
          };
        }).filter(Boolean),
        // Children
        ...childPax.map((p, i) => {
          const id = childIds[i];
          if (!id) return null;
          return {
            id,
            given_name: p.givenName,
            family_name: p.familyName,
            born_on: p.dob,
            title: (p.title || "mr") as string,
            gender: (p.gender || "m") as string,
            email: p.email,
            phone_number: p.phone,
          };
        }).filter(Boolean),
        // Infants
        ...infantPax.map((p, i) => {
          const id = infantIds[i];
          if (!id) return null;
          return {
            id,
            given_name: p.givenName,
            family_name: p.familyName,
            born_on: p.dob,
            title: (p.title || "miss") as string,
            gender: (p.gender || "f") as string,
            email: p.email,
            phone_number: p.phone,
          };
        }).filter(Boolean),
      ];

      if (duffelPassengers.length === 0) {
        return res.status(400).json({ error: "Could not map passenger IDs — offer may have expired" });
      }

      // 3. Create the Duffel order
      //    (equivalent to: duffel.orders.create({ selected_offers, payments, passengers }))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orderResp = await (duffel.orders as any).create({
        selected_offers: [providerOfferId],
        payments: [
          {
            type: "balance",
            currency: offer.total_currency,
            amount: offer.total_amount,
          },
        ],
        passengers: duffelPassengers,
        metadata: { source: "absher-travel" },
      });
      const order = orderResp.data;

      // 4. Derive route string from offer slices
      const firstSeg = offer.slices?.[0]?.segments?.[0];
      const lastSlice = offer.slices?.[offer.slices.length - 1];
      const lastSeg   = lastSlice?.segments?.[lastSlice.segments.length - 1];
      const routeStr  = firstSeg && lastSeg
        ? `${firstSeg.origin?.city_name ?? firstSeg.origin?.iata_code} → ${lastSeg.destination?.city_name ?? lastSeg.destination?.iata_code}`
        : destination;

      // 5. Persist confirmed booking to DB
      const [dbRow] = await db.insert(bookingsTable).values({
        type: "flight",
        userId,
        clientName,
        clientPhone: p0.phone ?? "—",
        clientEmail: p0.email,
        destination: routeStr,
        travelDate: firstSeg?.departing_at?.slice(0, 10) ?? travelDate,
        adults,
        children,
        totalPrice: String(order.total_amount),
        notes: `Duffel Order: ${order.id} | PNR: ${order.booking_reference}`,
        status: "confirmed",
      }).returning();

      return res.json({
        bookingId: dbRow.id,
        orderId: order.id,
        bookingReference: order.booking_reference,
        totalAmount: order.total_amount,
        totalCurrency: order.total_currency,
      });
    }

    // ── Fallback: save pending booking request (non-Duffel offers) ───────────
    const [dbRow] = await db.insert(bookingsTable).values({
      type: "flight",
      userId,
      clientName,
      clientPhone: p0.phone ?? "—",
      clientEmail: p0.email,
      destination,
      travelDate,
      adults,
      children,
      totalPrice: totalPrice ? String(totalPrice) : undefined,
      notes: `Offer: ${providerSlug}:${providerOfferId}`,
      status: "pending",
    }).returning();

    return res.json({
      bookingId: dbRow.id,
      orderId: null,
      bookingReference: `ABT${String(dbRow.id).padStart(6, "0")}`,
    });
  } catch (err) {
    req.log.error({ err }, "POST /flights/book error");
    res.status(500).json({ error: "Booking failed", details: err instanceof Error ? err.message : String(err) });
  }
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
