import type { FlightOffer, FlightSegment } from "@workspace/api-client-react";

interface MockAirline {
  name: string;
  iata: string;
  logoUrl: string;
  durationMin: number;
  stops: number;
  baggageKg: number;
  priceBase: number;
  flightNumbers: string[];
}

const AIRLINES: MockAirline[] = [
  {
    name: "الخطوط السعودية", iata: "SV", flightNumbers: ["SV456", "SV789"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Saudia_Logo.svg/200px-Saudia_Logo.svg.png",
    durationMin: 210, stops: 0, baggageKg: 30, priceBase: 1320,
  },
  {
    name: "طيران الإمارات", iata: "EK", flightNumbers: ["EK321", "EK654"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Emirates_logo.svg/200px-Emirates_logo.svg.png",
    durationMin: 240, stops: 0, baggageKg: 35, priceBase: 1680,
  },
  {
    name: "القطرية", iata: "QR", flightNumbers: ["QR501", "QR502"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Qatar_Airways_logo.svg/200px-Qatar_Airways_logo.svg.png",
    durationMin: 195, stops: 0, baggageKg: 30, priceBase: 1560,
  },
  {
    name: "طيران الخليج", iata: "GF", flightNumbers: ["GF111", "GF223"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Gulf_Air_logo.svg/200px-Gulf_Air_logo.svg.png",
    durationMin: 180, stops: 0, baggageKg: 30, priceBase: 1450,
  },
  {
    name: "فلاي ناس", iata: "XY", flightNumbers: ["XY201", "XY202"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/0/04/Flynas_Logo.svg/200px-Flynas_Logo.svg.png",
    durationMin: 250, stops: 1, baggageKg: 20, priceBase: 890,
  },
  {
    name: "الخطوط التركية", iata: "TK", flightNumbers: ["TK701", "TK702"],
    logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Turkish_Airlines_logosu.svg/200px-Turkish_Airlines_logosu.svg.png",
    durationMin: 320, stops: 1, baggageKg: 30, priceBase: 1100,
  },
];

function addMinutes(d: Date, min: number): Date {
  return new Date(d.getTime() + min * 60 * 1000);
}

const CABIN_PRICE: Record<string, number> = {
  economy: 1, premium_economy: 1.8, business: 3.2, first: 5.5,
};

const STOP_CITIES = ["DOH", "DXB", "AMM", "IST", "BAH", "KWI"];

export function generateMockFlights(
  origin: string,
  destination: string,
  departureDate: string,
  adults: number,
  cabinClass: string,
): FlightOffer[] {
  const mult = CABIN_PRICE[cabinClass] ?? 1;
  const baseDate = new Date(`${departureDate}T06:00:00`);

  return AIRLINES.map((airline, i): FlightOffer => {
    const depOffset = 60 + i * 170; // stagger throughout day
    const departureAt = addMinutes(baseDate, depOffset);
    const totalPrice = Math.round(airline.priceBase * mult * adults * (0.88 + Math.random() * 0.28));
    const baseFare = Math.round(totalPrice * 0.83);
    const taxes = totalPrice - baseFare;

    let segments: FlightSegment[];

    if (airline.stops === 0) {
      const arrivalAt = addMinutes(departureAt, airline.durationMin);
      segments = [{
        legOrder: 0, segmentOrder: 0,
        flightNumber: airline.flightNumbers[0],
        airlineIata: airline.iata,
        airlineName: airline.name,
        airlineLogoUrl: airline.logoUrl,
        originIata: origin, originCity: undefined,
        destinationIata: destination, destinationCity: undefined,
        departureAt: departureAt.toISOString(),
        arrivalAt: arrivalAt.toISOString(),
        durationMin: airline.durationMin,
        cabinClass,
      }];
    } else {
      const stopCity = STOP_CITIES.filter(c => c !== origin && c !== destination)[i % STOP_CITIES.length];
      const leg1Min = Math.floor(airline.durationMin * 0.44);
      const layoverMin = 70 + (i * 23 % 50);
      const leg2Min = airline.durationMin - leg1Min;
      const leg1Dep = departureAt;
      const leg1Arr = addMinutes(leg1Dep, leg1Min);
      const leg2Dep = addMinutes(leg1Arr, layoverMin);
      const leg2Arr = addMinutes(leg2Dep, leg2Min);

      segments = [
        {
          legOrder: 0, segmentOrder: 0,
          flightNumber: airline.flightNumbers[0],
          airlineIata: airline.iata, airlineName: airline.name, airlineLogoUrl: airline.logoUrl,
          originIata: origin, destinationIata: stopCity,
          departureAt: leg1Dep.toISOString(), arrivalAt: leg1Arr.toISOString(),
          durationMin: leg1Min, cabinClass,
        },
        {
          legOrder: 0, segmentOrder: 1,
          flightNumber: airline.flightNumbers[1] ?? airline.flightNumbers[0],
          airlineIata: airline.iata, airlineName: airline.name, airlineLogoUrl: airline.logoUrl,
          originIata: stopCity, destinationIata: destination,
          departureAt: leg2Dep.toISOString(), arrivalAt: leg2Arr.toISOString(),
          durationMin: leg2Min, cabinClass,
        },
      ];
    }

    return {
      providerSlug: "absher-mock",
      providerOfferId: `mock-${airline.iata}-${i}`,
      totalPrice,
      baseFare,
      taxes,
      currency: "SAR",
      stops: airline.stops,
      totalDurationMin: airline.durationMin,
      isRefundable: i % 2 === 0,
      baggageIncludedKg: airline.baggageKg,
      carryOnIncluded: true,
      segments,
    };
  });
}
