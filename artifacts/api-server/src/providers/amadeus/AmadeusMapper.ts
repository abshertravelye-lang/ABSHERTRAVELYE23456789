import type { NormalizedFlightOffer, NormalizedSegment } from "../_base/IFlightProvider";

// Amadeus v2/shopping/flight-offers response shapes (simplified)
interface AmadeusItinerary {
  duration: string;  // PT2H30M
  segments: AmadeusSegment[];
}

interface AmadeusSegment {
  departure: { iataCode: string; at: string; terminal?: string };
  arrival: { iataCode: string; at: string; terminal?: string };
  carrierCode: string;
  number: string;
  aircraft: { code: string };
  operating?: { carrierCode: string };
  duration: string;
  id: string;
  numberOfStops: number;
  blacklistedInEU: boolean;
}

interface AmadeusTravelerPricing {
  travelerId: string;
  fareOption: string;
  travelerType: string;
  price: { currency: string; total: string; base: string };
  fareDetailsBySegment: Array<{
    segmentId: string;
    cabin: string;
    fareBasis: string;
    brandedFare?: string;
    includedCheckedBags?: { weight?: number; quantity?: number };
  }>;
}

export interface AmadeusFlightOffer {
  id: string;
  source: string;
  instantTicketingRequired: boolean;
  nonHomogeneous: boolean;
  oneWay: boolean;
  lastTicketingDate?: string;
  numberOfBookableSeats: number;
  itineraries: AmadeusItinerary[];
  price: {
    currency: string;
    total: string;
    base: string;
    fees: Array<{ amount: string; type: string }>;
    grandTotal: string;
    additionalServices?: Array<{ amount: string; type: string }>;
  };
  pricingOptions: { fareType: string[]; includedCheckedBagsOnly: boolean };
  validatingAirlineCodes: string[];
  travelerPricings: AmadeusTravelerPricing[];
}

function parseDurationToMin(iso: string): number {
  // PT2H30M or PT45M or PT3H
  const hours = iso.match(/(\d+)H/)?.[1] ?? "0";
  const minutes = iso.match(/(\d+)M/)?.[1] ?? "0";
  return parseInt(hours) * 60 + parseInt(minutes);
}

export function mapAmadeusOffer(
  offer: AmadeusFlightOffer,
  dictionaries?: { carriers?: Record<string, string>; aircraft?: Record<string, string> },
): NormalizedFlightOffer {
  const currency = offer.price.currency;
  const totalPrice = parseFloat(offer.price.grandTotal || offer.price.total);
  const baseFare = parseFloat(offer.price.base);
  const taxes = totalPrice - baseFare;

  const segments: NormalizedSegment[] = [];
  let totalDurationMin = 0;
  let stops = 0;

  offer.itineraries.forEach((itin, legOrder) => {
    totalDurationMin += parseDurationToMin(itin.duration);
    stops += itin.segments.length - 1;

    // Find baggage from first traveler pricing for this leg
    const firstTraveler = offer.travelerPricings[0];

    itin.segments.forEach((seg, segOrder) => {
      const fareDetail = firstTraveler?.fareDetailsBySegment.find(
        (f) => f.segmentId === seg.id,
      );

      segments.push({
        legOrder,
        segmentOrder: segOrder,
        flightNumber: `${seg.carrierCode}${seg.number}`,
        airlineIata: seg.carrierCode,
        airlineName: dictionaries?.carriers?.[seg.carrierCode] ?? seg.carrierCode,
        operatingAirlineIata: seg.operating?.carrierCode,
        originIata: seg.departure.iataCode,
        originCity: seg.departure.iataCode,
        destinationIata: seg.arrival.iataCode,
        destinationCity: seg.arrival.iataCode,
        departureAt: seg.departure.at,
        arrivalAt: seg.arrival.at,
        durationMin: parseDurationToMin(seg.duration),
        aircraftType: dictionaries?.aircraft?.[seg.aircraft.code] ?? seg.aircraft.code,
        cabinClass: fareDetail?.cabin?.toLowerCase() ?? "economy",
      });
    });
  });

  // Baggage from first traveler, first segment
  const firstFare = offer.travelerPricings[0]?.fareDetailsBySegment[0];
  const baggageKg =
    firstFare?.includedCheckedBags?.weight ??
    (firstFare?.includedCheckedBags?.quantity ? firstFare.includedCheckedBags.quantity * 23 : 0);

  return {
    providerSlug: "amadeus",
    providerOfferId: offer.id,
    totalPrice,
    baseFare,
    taxes,
    currency,
    stops,
    totalDurationMin,
    isRefundable: false, // Amadeus doesn't expose refundability in v2 search
    baggageIncludedKg: baggageKg,
    carryOnIncluded: false,
    segments,
    rawData: offer,
  };
}
