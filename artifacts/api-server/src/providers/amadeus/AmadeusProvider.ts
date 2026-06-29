import type { IFlightProvider, FlightSearchParams, NormalizedFlightOffer } from "../_base/IFlightProvider";
import { amadeusGet, hasAmadeusCredentials } from "./AmadeusClient";
import { mapAmadeusOffer, type AmadeusFlightOffer } from "./AmadeusMapper";
import { logger } from "../../lib/logger";

interface AmadeusSearchResponse {
  data: AmadeusFlightOffer[];
  dictionaries?: {
    carriers?: Record<string, string>;
    aircraft?: Record<string, string>;
    locations?: Record<string, { cityCode: string; countryCode: string }>;
  };
  meta?: { count: number };
}

export class AmadeusProvider implements IFlightProvider {
  readonly slug = "amadeus";
  readonly name = "Amadeus";
  readonly supportsBooking = false; // true in production with signed agreement

  isAvailable(): boolean {
    return hasAmadeusCredentials();
  }

  async searchFlights(params: FlightSearchParams): Promise<NormalizedFlightOffer[]> {
    if (!this.isAvailable()) {
      logger.warn("AmadeusProvider: credentials not configured, returning mock data");
      return getMockFlights(params);
    }

    try {
      const queryParams: Record<string, string> = {
        originLocationCode: params.legs[0].originIata,
        destinationLocationCode: params.legs[0].destinationIata,
        departureDate: params.legs[0].departureDate,
        adults: String(params.adults),
        currencyCode: params.currency,
        max: "10",
      };

      if (params.children > 0) queryParams.children = String(params.children);
      if (params.infants > 0) queryParams.infants = String(params.infants);
      if (params.cabinClass !== "economy") {
        queryParams.travelClass = params.cabinClass.toUpperCase().replace("_", "");
      }
      if (params.tripType === "round_trip" && params.legs[1]) {
        queryParams.returnDate = params.legs[1].departureDate;
      }

      const response = await amadeusGet<AmadeusSearchResponse>(
        "/v2/shopping/flight-offers",
        queryParams,
      );

      return (response.data ?? []).map((offer) =>
        mapAmadeusOffer(offer, response.dictionaries),
      );
    } catch (err) {
      logger.error({ err }, "AmadeusProvider.searchFlights error, falling back to mock");
      return getMockFlights(params);
    }
  }
}

// ── Mock data ─────────────────────────────────────────────────────────────────
// Used during development / when credentials are not yet configured
function getMockFlights(params: FlightSearchParams): NormalizedFlightOffer[] {
  const origin = params.legs[0].originIata;
  const dest = params.legs[0].destinationIata;
  const date = params.legs[0].departureDate;

  const makeOffer = (
    id: string,
    airline: string,
    airlineName: string,
    price: number,
    durationMin: number,
    stops: number,
    depHour: number,
    baggage: number,
  ): NormalizedFlightOffer => ({
    providerSlug: "amadeus",
    providerOfferId: `MOCK-${id}`,
    totalPrice: price,
    baseFare: price * 0.78,
    taxes: price * 0.22,
    currency: params.currency,
    stops,
    totalDurationMin: durationMin,
    isRefundable: stops === 0,
    baggageIncludedKg: baggage,
    carryOnIncluded: true,
    segments: [
      {
        legOrder: 0,
        segmentOrder: 0,
        flightNumber: `${airline}${Math.floor(Math.random() * 900) + 100}`,
        airlineIata: airline,
        airlineName,
        originIata: origin,
        originCity: origin,
        destinationIata: dest,
        destinationCity: dest,
        departureAt: `${date}T${String(depHour).padStart(2, "0")}:00:00`,
        arrivalAt: `${date}T${String((depHour + Math.floor(durationMin / 60)) % 24).padStart(2, "0")}:${String(durationMin % 60).padStart(2, "0")}:00`,
        durationMin,
        aircraftType: "B737",
        cabinClass: params.cabinClass,
      },
    ],
  });

  return [
    makeOffer("1", "EK", "Emirates", 420, 185, 0, 8, 30),
    makeOffer("2", "QR", "Qatar Airways", 380, 210, 1, 6, 23),
    makeOffer("3", "EY", "Etihad Airways", 355, 220, 1, 10, 20),
    makeOffer("4", "SV", "Saudi Arabian Airlines", 290, 240, 1, 14, 25),
    makeOffer("5", "MS", "EgyptAir", 265, 275, 2, 7, 20),
    makeOffer("6", "FZ", "Flydubai", 199, 200, 0, 22, 0),
  ];
}
