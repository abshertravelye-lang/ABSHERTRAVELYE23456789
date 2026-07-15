import type { NormalizedFlightOffer, NormalizedSegment } from "../_base/IFlightProvider";

interface DuffelPlace {
  iata_code: string;
  name: string;
  city_name?: string;
}

interface DuffelCarrier {
  iata_code: string;
  name: string;
  logo_symbol_url?: string | null;
}

interface DuffelBaggage {
  type: "checked" | "carry_on";
  quantity: number;
}

interface DuffelSegmentPassenger {
  cabin_class?: string;
  baggages?: DuffelBaggage[];
}

interface DuffelSegment {
  marketing_carrier: DuffelCarrier;
  operating_carrier?: DuffelCarrier;
  marketing_carrier_flight_number: string;
  origin: DuffelPlace;
  destination: DuffelPlace;
  departing_at: string;
  arriving_at: string;
  duration: string; // ISO 8601 duration, e.g. PT5H30M
  aircraft?: { name?: string } | null;
  passengers?: DuffelSegmentPassenger[];
}

interface DuffelSlice {
  duration: string;
  segments: DuffelSegment[];
}

export interface DuffelOffer {
  id: string;
  total_amount: string;
  total_currency: string;
  base_amount: string | null;
  tax_amount: string | null;
  slices: DuffelSlice[];
  owner: DuffelCarrier;
  conditions?: {
    refund_before_departure?: { allowed: boolean } | null;
  };
}

// Parses an ISO 8601 duration like "PT5H30M" into whole minutes.
function parseIsoDurationMinutes(duration: string): number {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?/.exec(duration);
  if (!match) return 0;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  return hours * 60 + minutes;
}

export function mapDuffelOffer(offer: DuffelOffer): NormalizedFlightOffer {
  const segments: NormalizedSegment[] = [];
  let stops = 0;
  let hasCarryOn = false;
  let checkedBagCount = 0;

  offer.slices.forEach((slice, legOrder) => {
    stops += Math.max(0, slice.segments.length - 1);
    slice.segments.forEach((seg, segmentOrder) => {
      const passenger = seg.passengers?.[0];
      for (const bag of passenger?.baggages ?? []) {
        if (bag.type === "carry_on" && bag.quantity > 0) hasCarryOn = true;
        if (bag.type === "checked") checkedBagCount += bag.quantity;
      }
      segments.push({
        legOrder,
        segmentOrder,
        flightNumber: `${seg.marketing_carrier.iata_code}${seg.marketing_carrier_flight_number}`,
        airlineIata: seg.marketing_carrier.iata_code,
        airlineName: seg.marketing_carrier.name,
        airlineLogoUrl: seg.marketing_carrier.logo_symbol_url ?? undefined,
        operatingAirlineIata: seg.operating_carrier?.iata_code,
        originIata: seg.origin.iata_code,
        originCity: seg.origin.city_name ?? seg.origin.name,
        destinationIata: seg.destination.iata_code,
        destinationCity: seg.destination.city_name ?? seg.destination.name,
        departureAt: seg.departing_at,
        arrivalAt: seg.arriving_at,
        durationMin: parseIsoDurationMinutes(seg.duration),
        aircraftType: seg.aircraft?.name ?? undefined,
        cabinClass: passenger?.cabin_class ?? "economy",
      });
    });
  });

  const totalDurationMin = offer.slices.reduce(
    (sum, slice) => sum + parseIsoDurationMinutes(slice.duration),
    0,
  );

  const totalPrice = Number(offer.total_amount);
  const baseFare = offer.base_amount ? Number(offer.base_amount) : totalPrice * 0.85;
  const taxes = offer.tax_amount ? Number(offer.tax_amount) : totalPrice - baseFare;

  return {
    providerSlug: "duffel",
    providerOfferId: offer.id,
    totalPrice,
    baseFare,
    taxes,
    currency: offer.total_currency,
    stops,
    totalDurationMin,
    isRefundable: offer.conditions?.refund_before_departure?.allowed ?? false,
    // Duffel reports baggage as piece counts, not kg; 23kg/checked bag is the
    // typical international allowance and is used here as a display estimate.
    baggageIncludedKg: checkedBagCount * 23,
    carryOnIncluded: hasCarryOn,
    segments,
    rawData: offer,
  };
}
