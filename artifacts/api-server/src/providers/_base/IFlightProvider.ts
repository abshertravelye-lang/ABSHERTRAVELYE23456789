// -------------------------------------------------------
// Normalised types used across all flight providers
// -------------------------------------------------------

export interface FlightSearchParams {
  tripType: "one_way" | "round_trip" | "multi_city";
  cabinClass: "economy" | "premium_economy" | "business" | "first";
  adults: number;
  children: number;
  infants: number;
  currency: string;
  legs: Array<{
    originIata: string;
    destinationIata: string;
    departureDate: string; // YYYY-MM-DD
  }>;
}

export interface NormalizedSegment {
  legOrder: number;
  segmentOrder: number;
  flightNumber: string;
  airlineIata: string;
  airlineName: string;
  airlineLogoUrl?: string;
  operatingAirlineIata?: string;
  originIata: string;
  originCity: string;
  destinationIata: string;
  destinationCity: string;
  departureAt: string;  // ISO 8601
  arrivalAt: string;
  durationMin: number;
  aircraftType?: string;
  cabinClass: string;
}

export interface NormalizedFlightOffer {
  providerSlug: string;
  providerOfferId: string;
  totalPrice: number;
  baseFare: number;
  taxes: number;
  currency: string;
  stops: number;
  totalDurationMin: number;
  isRefundable: boolean;
  baggageIncludedKg: number;
  carryOnIncluded: boolean;
  deeplinkUrl?: string;
  segments: NormalizedSegment[];
  rawData?: unknown;
}

// -------------------------------------------------------
// Provider interface
// -------------------------------------------------------

export interface IFlightProvider {
  readonly slug: string;
  readonly name: string;
  readonly supportsBooking: boolean;

  isAvailable(): boolean;
  searchFlights(params: FlightSearchParams): Promise<NormalizedFlightOffer[]>;
}
