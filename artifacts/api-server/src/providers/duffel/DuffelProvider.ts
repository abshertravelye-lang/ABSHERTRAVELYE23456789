import type { IFlightProvider, FlightSearchParams, NormalizedFlightOffer } from "../_base/IFlightProvider";
import { duffelPost, hasDuffelCredentials } from "./DuffelClient";
import { mapDuffelOffer, type DuffelOffer } from "./DuffelMapper";
import { logger } from "../../lib/logger";

interface DuffelOfferRequestResponse {
  data: {
    id: string;
    offers: DuffelOffer[];
  };
}

const CABIN_CLASS_MAP: Record<FlightSearchParams["cabinClass"], string> = {
  economy: "economy",
  premium_economy: "premium_economy",
  business: "business",
  first: "first",
};

export class DuffelProvider implements IFlightProvider {
  readonly slug = "duffel";
  readonly name = "Duffel";
  // Search/compare only for now — creating a real order additionally requires
  // full passenger details (DOB, passport) and a payment step, not yet built.
  readonly supportsBooking = false;

  isAvailable(): boolean {
    return hasDuffelCredentials();
  }

  async searchFlights(params: FlightSearchParams): Promise<NormalizedFlightOffer[]> {
    if (!this.isAvailable()) {
      logger.warn("DuffelProvider: DUFFEL_API_KEY not configured, skipping");
      return [];
    }

    try {
      const slices = params.legs.map((leg) => ({
        origin: leg.originIata,
        destination: leg.destinationIata,
        departure_date: leg.departureDate,
      }));

      const passengers = [
        ...Array.from({ length: params.adults }, () => ({ type: "adult" })),
        ...Array.from({ length: params.children }, () => ({ type: "child" })),
        ...Array.from({ length: params.infants }, () => ({ type: "infant_without_seat" })),
      ];

      const response = await duffelPost<DuffelOfferRequestResponse>(
        "/air/offer_requests?return_offers=true",
        {
          data: {
            slices,
            passengers,
            cabin_class: CABIN_CLASS_MAP[params.cabinClass],
          },
        },
      );

      return (response.data.offers ?? []).map(mapDuffelOffer);
    } catch (err) {
      logger.error({ err }, "DuffelProvider.searchFlights error");
      return [];
    }
  }
}
