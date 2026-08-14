import type { IFlightProvider, FlightSearchParams, NormalizedFlightOffer } from "../_base/IFlightProvider";
import { getDuffelClient, hasDuffelCredentials } from "./DuffelClient";
import { mapDuffelOffer } from "./DuffelMapper";
import { logger } from "../../lib/logger";

const CABIN_CLASS_MAP: Record<FlightSearchParams["cabinClass"], string> = {
  economy: "economy",
  premium_economy: "premium_economy",
  business: "business",
  first: "first",
};

export class DuffelProvider implements IFlightProvider {
  readonly slug = "duffel";
  readonly name = "Duffel";
  readonly supportsBooking = true;

  isAvailable(): boolean {
    return hasDuffelCredentials();
  }

  async searchFlights(params: FlightSearchParams): Promise<NormalizedFlightOffer[]> {
    if (!this.isAvailable()) {
      logger.warn("DuffelProvider: DUFFEL_API_KEY not configured, skipping");
      return [];
    }

    try {
      const duffel = getDuffelClient();

      const slices = params.legs.map((leg) => ({
        origin: leg.originIata,
        destination: leg.destinationIata,
        departure_date: leg.departureDate,
      }));

      const passengers: Array<{ type: "adult" | "child" | "infant_without_seat" }> = [
        ...Array.from({ length: params.adults }, () => ({ type: "adult" as const })),
        ...Array.from({ length: params.children }, () => ({ type: "child" as const })),
        ...Array.from({ length: params.infants }, () => ({ type: "infant_without_seat" as const })),
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (duffel.offerRequests as any).create({
        slices,
        passengers,
        cabin_class: CABIN_CLASS_MAP[params.cabinClass],
        return_offers: true,
      });

      // SDK returns { data: { offers: [...] } }
      const offers = response?.data?.offers ?? [];
      return offers.map(mapDuffelOffer);
    } catch (err) {
      logger.error({ err }, "DuffelProvider.searchFlights error");
      return [];
    }
  }
}
