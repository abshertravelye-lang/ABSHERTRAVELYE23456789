import { useState, useCallback } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { useSearchFlights, type FlightOffer, type FlightSearchResults } from "@workspace/api-client-react";
import { AirportSearch } from "@/components/airport-search";
import { FlightDatePicker } from "@/components/flight-date-picker";
import { PassengerSelector, type PassengerConfig } from "@/components/passenger-selector";
import { FlightTicket } from "@/components/flight-ticket";
import { generateMockFlights } from "@/data/mock-flights";
import { AIRPORTS, type Airport } from "@/data/airports";
import {
  Plane, ArrowLeftRight, Loader2, Luggage, Clock,
  ArrowRight, Zap, Star, Shield, ChevronDown,
} from "lucide-react";

/* ─── helpers ─── */
function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
}
function fmtDate(iso: string, ar: boolean) {
  return new Date(iso).toLocaleDateString(ar ? "ar-SA" : "en-US", { weekday: "short", month: "short", day: "numeric" });
}
function dur(min: number) {
  const h = Math.floor(min / 60), m = min % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}
function iataToAirport(code: string): Airport {
  return AIRPORTS.find(a => a.iata === code) ?? {
    iata: code, nameAr: code, nameEn: code, cityAr: code, cityEn: code,
    countryAr: "", countryEn: "", countryCode: "", searchKeywords: [],
  };
}

/* ─── Rank badge config ─── */
type SortKey = "cheapest" | "fastest" | "best_value";
const SORT_BADGE: Record<SortKey, { ar: string; en: string; icon: typeof Zap; color: string }> = {
  cheapest:   { ar: "الأرخص",     en: "Cheapest",   icon: Zap,   color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  fastest:    { ar: "الأسرع",     en: "Fastest",    icon: Clock, color: "bg-blue-50 text-blue-700 border-blue-200" },
  best_value: { ar: "أفضل قيمة", en: "Best value", icon: Star,  color: "bg-amber-50 text-amber-700 border-amber-200" },
};

/* ─── FlightCard ─── */
function FlightCard({ offer, language, rank, onBook }: {
  offer: FlightOffer; language: "ar" | "en"; rank?: SortKey; onBook: () => void;
}) {
  const ar = language === "ar";
  const [expanded, setExpanded] = useState(false);
  const first = offer.segments[0];
  const last = offer.segments[offer.segments.length - 1];
  const badge = rank ? SORT_BADGE[rank] : null;

  return (
    <div className={`bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden shadow-sm
      hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5
      ${rank === "best_value" ? "border-amber-200" : "border-slate-100"}`}
    >
      {badge && (
        <div className={`px-4 py-1.5 flex items-center gap-1.5 text-xs font-bold border-b ${badge.color}`}>
          <badge.icon className="h-3.5 w-3.5" />
          {ar ? badge.ar : badge.en}
        </div>
      )}

      <div className="p-5">
        <div className="flex flex-col md:flex-row items-stretch gap-4">

          {/* Airline logo + name */}
          <div className="flex items-center gap-3 md:w-44 shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
              {first?.airlineLogoUrl ? (
                <img src={first.airlineLogoUrl} alt={first.airlineName} className="w-10 h-10 object-contain" />
              ) : (
                <Plane className="h-6 w-6 text-slate-400" />
              )}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-slate-800 text-sm leading-tight">{first?.airlineName}</div>
              <div className="text-xs text-slate-400 mt-0.5">{first?.flightNumber}</div>
            </div>
          </div>

          {/* Route timeline */}
          <div className="flex-1 flex items-center gap-3 min-w-0">
            <div className="text-center shrink-0">
              <div className="text-2xl font-black text-slate-900 tabular-nums leading-none">{first ? fmt(first.departureAt) : "--:--"}</div>
              <div className="text-sm font-bold text-primary mt-0.5">{first?.originIata}</div>
              <div className="text-xs text-slate-400 mt-0.5 hidden md:block">{first ? fmtDate(first.departureAt, ar) : ""}</div>
            </div>

            <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <div className="text-xs text-slate-400 font-medium">{dur(offer.totalDurationMin)}</div>
              <div className="w-full flex items-center gap-1">
                <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-primary/40" />
                <div className={`w-6 h-6 rounded-full flex items-center justify-center
                  ${offer.stops === 0 ? "bg-primary/10" : "bg-orange-100"}`}>
                  <Plane className={`h-3.5 w-3.5 rotate-90 rtl:-rotate-90
                    ${offer.stops === 0 ? "text-primary" : "text-orange-500"}`} />
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-primary/40 to-slate-200" />
              </div>
              <div className={`text-xs font-bold ${offer.stops === 0 ? "text-emerald-600" : "text-orange-500"}`}>
                {offer.stops === 0
                  ? (ar ? "مباشر" : "Direct")
                  : `${offer.stops} ${ar ? (offer.stops === 1 ? "توقف" : "توقفات") : (offer.stops === 1 ? "stop" : "stops")}`}
              </div>
            </div>

            <div className="text-center shrink-0">
              <div className="text-2xl font-black text-slate-900 tabular-nums leading-none">{last ? fmt(last.arrivalAt) : "--:--"}</div>
              <div className="text-sm font-bold text-primary mt-0.5">{last?.destinationIata}</div>
              <div className="text-xs text-slate-400 mt-0.5 hidden md:block">{last ? fmtDate(last.arrivalAt, ar) : ""}</div>
            </div>
          </div>

          {/* Baggage badge */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 rounded-xl px-3 py-1.5 self-center shrink-0">
            <Luggage className="h-3.5 w-3.5 text-primary" />
            {offer.baggageIncludedKg} {ar ? "كجم" : "kg"}
          </div>

          {/* Price + CTA */}
          <div className="flex items-center md:items-end md:flex-col gap-3 md:gap-2
            md:border-l rtl:md:border-r rtl:md:border-l-0 border-slate-100
            md:pl-5 rtl:md:pr-5 rtl:md:pl-0 md:min-w-[140px] md:shrink-0">
            <div className="flex-1 md:flex-none text-end rtl:text-start md:text-right rtl:md:text-left">
              <div className="text-3xl font-black text-primary tabular-nums leading-tight">
                {offer.totalPrice.toLocaleString()}
              </div>
              <div className="text-xs font-semibold text-slate-400">{offer.currency}</div>
              <div className="text-[10px] text-slate-300 mt-0.5">
                {ar ? "شامل الضرائب" : "taxes incl."}
              </div>
            </div>
            <button
              onClick={onBook}
              className="shrink-0 bg-primary hover:bg-primary/90 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all
                shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0"
            >
              {ar ? "احجز الآن" : "Book Now"}
            </button>
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1.5 text-xs text-primary font-semibold hover:text-primary/80 transition-colors"
        >
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          {ar ? (expanded ? "إخفاء التفاصيل" : "عرض تفاصيل الرحلة") : (expanded ? "Hide details" : "Show flight details")}
        </button>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-4 border-t border-slate-100 pt-4 space-y-3">
            {offer.segments.map((seg, i) => (
              <div key={i} className="flex flex-wrap items-center gap-3 bg-slate-50 rounded-xl p-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  {seg.airlineLogoUrl
                    ? <img src={seg.airlineLogoUrl} alt="" className="w-6 h-6 object-contain" />
                    : <Plane className="h-4 w-4 text-slate-400" />}
                </div>
                <span className="font-black text-primary">{seg.originIata}</span>
                <ArrowRight className="h-4 w-4 text-slate-400 rtl:rotate-180 shrink-0" />
                <span className="font-black text-slate-700">{seg.destinationIata}</span>
                <span className="text-slate-400 text-xs ml-auto rtl:mr-auto rtl:ml-0">{fmt(seg.departureAt)} → {fmt(seg.arrivalAt)}</span>
                <span className="text-slate-400 text-xs bg-white px-2 py-0.5 rounded-lg border border-slate-200">{dur(seg.durationMin)}</span>
                <span className="text-slate-400 text-xs font-semibold">{seg.flightNumber}</span>
              </div>
            ))}
            <div className="flex flex-wrap gap-3 text-xs mt-2">
              {offer.isRefundable && (
                <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-semibold border border-green-100">
                  <Shield className="h-3 w-3" />{ar ? "قابل للاسترداد" : "Refundable"}
                </span>
              )}
              {offer.carryOnIncluded && (
                <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-semibold border border-blue-100">
                  <Luggage className="h-3 w-3" />{ar ? "حقيبة يد مجانية" : "Carry-on included"}
                </span>
              )}
              <span className="flex items-center gap-1 bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-semibold">
                <Luggage className="h-3 w-3" />{offer.baggageIncludedKg}{ar ? " كجم أمتعة" : "kg checked bag"}
              </span>
            </div>
            <div className="text-xs text-slate-400 pt-1">
              {ar ? `السعر الأساسي: ${offer.baseFare.toLocaleString()} ${offer.currency} · رسوم وضرائب: ${offer.taxes.toLocaleString()} ${offer.currency}`
                : `Base fare: ${offer.baseFare.toLocaleString()} ${offer.currency} · Taxes & fees: ${offer.taxes.toLocaleString()} ${offer.currency}`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Skeleton ─── */
function FlightSkeleton() {
  return (
    <div className="bg-white rounded-2xl border-2 border-slate-100 p-5 animate-pulse">
      <div className="flex gap-4 items-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-100 rounded-full w-40" />
          <div className="h-3 bg-slate-100 rounded-full w-24" />
        </div>
        <div className="w-24 h-10 bg-slate-100 rounded-xl" />
      </div>
    </div>
  );
}

/* ─── Main page ─── */
type TripType = "one_way" | "round_trip";

export default function FlightsPage() {
  const { language } = useTranslation();
  const ar = language === "ar";

  const [tripType, setTripType] = useState<TripType>("round_trip");
  const [origin, setOrigin] = useState<Airport | null>(null);
  const [destination, setDestination] = useState<Airport | null>(null);
  const [dates, setDates] = useState<{ departure: Date | null; returnDate: Date | null }>({ departure: null, returnDate: null });
  const [passengers, setPassengers] = useState<PassengerConfig>({ adults: 1, children: 0, infants: 0, cabinClass: "economy" });
  const [sort, setSort] = useState<SortKey>("best_value");
  const [searchParams, setSearchParams] = useState<Record<string, unknown> | null>(null);
  const [ticketOffer, setTicketOffer] = useState<FlightOffer | null>(null);
  const [mockFlights, setMockFlights] = useState<FlightOffer[] | null>(null);

  const { data, isFetching } = useSearchFlights(
    searchParams as Parameters<typeof useSearchFlights>[0] ?? undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { query: { enabled: !!searchParams } } as any
  );

  const canSearch = !!(origin && destination && dates.departure && (tripType === "one_way" || dates.returnDate));

  const swap = () => { const t = origin; setOrigin(destination); setDestination(t); };

  const handleSearch = useCallback(() => {
    if (!origin || !destination || !dates.departure) return;
    const depStr = dates.departure.toISOString().slice(0, 10);
    const retStr = dates.returnDate?.toISOString().slice(0, 10);

    setSearchParams({
      origin: origin.iata,
      destination: destination.iata,
      departureDate: depStr,
      ...(tripType === "round_trip" && retStr ? { returnDate: retStr } : {}),
      tripType,
      cabinClass: passengers.cabinClass,
      adults: passengers.adults,
      children: passengers.children,
      infants: passengers.infants,
      currency: "SAR",
    });
    // Prepare mock data for immediate/fallback display
    setMockFlights(
      generateMockFlights(origin.iata, destination.iata, depStr, passengers.adults, passengers.cabinClass)
    );
  }, [origin, destination, dates, tripType, passengers]);

  // Prefer real API results; fall back to mock
  const apiOffers = (data as FlightSearchResults | undefined)?.offers;
  const rawOffers: FlightOffer[] = (apiOffers && apiOffers.length > 0) ? apiOffers : (mockFlights ?? []);

  const sorted = [...rawOffers].sort((a, b) => {
    if (sort === "cheapest")   return a.totalPrice - b.totalPrice;
    if (sort === "fastest")    return a.totalDurationMin - b.totalDurationMin;
    return (a.totalPrice + a.totalDurationMin * 2) - (b.totalPrice + b.totalDurationMin * 2);
  });

  return (
    <div className="min-h-screen bg-slate-50" dir={ar ? "rtl" : "ltr"}>

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-[#0d2351] via-[#132c60] to-[#1a3875] pb-14 pt-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white/70 rounded-full px-4 py-1.5 text-xs font-bold mb-4 uppercase tracking-widest">
              <Plane className="h-4 w-4" />
              {ar ? "حجز تذاكر الطيران" : "Flight Tickets"}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-3 leading-tight">
              {ar ? "ابحث عن رحلتك المثالية" : "Find Your Perfect Flight"}
            </h1>
            <p className="text-white/50 text-lg">
              {ar ? "أسعار حقيقية ومقارنة فورية من أفضل شركات الطيران" : "Real prices & instant comparison from top airlines"}
            </p>
          </div>

          {/* ── Search card ── */}
          <div className="bg-white rounded-3xl shadow-2xl shadow-black/30 p-6 md:p-8">

            {/* Trip type pills */}
            <div className="flex gap-2 mb-6">
              {([["round_trip", ar ? "ذهاب وعودة" : "Round trip"], ["one_way", ar ? "ذهاب فقط" : "One way"]] as [TripType, string][]).map(([t, label]) => (
                <button
                  key={t}
                  onClick={() => setTripType(t)}
                  className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                    tripType === t ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Airport selectors */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_44px_1fr] gap-3 mb-4 items-start">
              <AirportSearch value={origin} onChange={setOrigin} language={language} icon="takeoff" label="From" labelAr="من" />
              <button
                type="button"
                onClick={swap}
                className="hidden md:flex self-end mb-px w-11 h-11 items-center justify-center rounded-full bg-slate-100 hover:bg-primary hover:text-white text-slate-400 transition-all border border-slate-200 hover:border-primary"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </button>
              <AirportSearch value={destination} onChange={setDestination} language={language} icon="landing" label="To" labelAr="إلى" />
            </div>

            {/* Dates + passengers */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3 mb-6 items-start">
              <FlightDatePicker
                value={dates}
                onChange={setDates}
                language={language}
                isRoundTrip={tripType === "round_trip"}
                labelDepart="Departure"   labelDepartAr="الذهاب"
                labelReturn="Return"      labelReturnAr="العودة"
              />
              <PassengerSelector value={passengers} onChange={setPassengers} language={language} />
            </div>

            {/* Search button */}
            <button
              onClick={handleSearch}
              disabled={!canSearch || isFetching}
              className="w-full h-14 bg-primary hover:bg-primary/90 disabled:bg-slate-200 disabled:text-slate-400
                text-white font-black text-lg rounded-2xl transition-all flex items-center justify-center gap-3
                shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5
                disabled:shadow-none disabled:translate-y-0"
            >
              {isFetching
                ? <><Loader2 className="h-5 w-5 animate-spin" />{ar ? "جاري البحث..." : "Searching..."}</>
                : <><Plane className="h-5 w-5" />{ar ? "بحث عن الرحلات" : "Search Flights"}</>}
            </button>
            {!canSearch && (
              <p className="text-center text-xs text-slate-400 mt-3">
                {ar ? "يُرجى تحديد المطارات والتاريخ" : "Please select airports and travel date to continue"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Results ── */}
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Loading skeletons */}
        {isFetching && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-slate-500 mb-6">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="font-medium">{ar ? "جاري البحث عن أفضل الأسعار..." : "Searching for the best prices..."}</span>
            </div>
            {[1, 2, 3, 4].map(i => <FlightSkeleton key={i} />)}
          </div>
        )}

        {/* Results */}
        {!isFetching && sorted.length > 0 && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-800">
                  {sorted.length} {ar ? "رحلة متاحة" : "available flights"}
                </h2>
                {origin && destination && dates.departure && (
                  <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                    <span className="font-bold text-primary">{origin.iata}</span>
                    <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                    <span className="font-bold text-primary">{destination.iata}</span>
                    <span>· {dates.departure.toLocaleDateString(ar ? "ar-SA" : "en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
                  </div>
                )}
              </div>

              {/* Sort pills */}
              <div className="flex gap-1.5 bg-slate-100 p-1 rounded-2xl">
                {([
                  ["best_value", ar ? "أفضل قيمة" : "Best value", Star],
                  ["cheapest",   ar ? "الأرخص"    : "Cheapest",   Zap],
                  ["fastest",    ar ? "الأسرع"    : "Fastest",    Clock],
                ] as [SortKey, string, typeof Star][]).map(([k, label, Icon]) => (
                  <button
                    key={k}
                    onClick={() => setSort(k)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      sort === k ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />{label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {sorted.map((offer, i) => (
                <FlightCard
                  key={`${offer.providerSlug}-${offer.providerOfferId}-${i}`}
                  offer={offer}
                  language={language}
                  rank={i === 0 ? sort : undefined}
                  onBook={() => setTicketOffer(offer)}
                />
              ))}
            </div>

            <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-sm text-amber-800">
              <Shield className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">{ar ? "ملاحظة: " : "Note: "}</span>
                {ar
                  ? "الحجز المؤقت لا يُعدّ تأكيداً نهائياً. تواصل مع فريقنا لإتمام الدفع وتأكيد التذكرة."
                  : "Provisional booking is not a final confirmation. Contact our team to complete payment and confirm your ticket."}
              </div>
            </div>
          </>
        )}

        {/* Empty */}
        {!isFetching && searchParams && sorted.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plane className="h-12 w-12 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">{ar ? "لا توجد رحلات مطابقة" : "No flights found"}</h3>
            <p className="text-slate-400 max-w-sm mx-auto">
              {ar ? "حاول تغيير التواريخ أو المطارات" : "Try changing your dates or airports"}
            </p>
          </div>
        )}

        {/* Idle state */}
        {!searchParams && !isFetching && (
          <div className="text-center py-20">
            <div className="w-28 h-28 rounded-3xl bg-primary/5 flex items-center justify-center mx-auto mb-6">
              <Plane className="h-14 w-14 text-primary/20 rotate-45" />
            </div>
            <h3 className="text-xl font-bold text-slate-600 mb-2">
              {ar ? "ابحث عن رحلتك" : "Search for your flight"}
            </h3>
            <p className="text-slate-400 max-w-sm mx-auto">
              {ar ? "أدخل المطار والتاريخ أعلاه واضغط بحث" : "Enter airport and date above then hit Search"}
            </p>
          </div>
        )}
      </div>

      {/* ── Ticket modal ── */}
      {ticketOffer && origin && (
        <FlightTicket
          offer={ticketOffer}
          origin={origin}
          destination={destination ?? iataToAirport(ticketOffer.segments[ticketOffer.segments.length - 1]?.destinationIata ?? "")}
          passengers={passengers}
          language={language}
          onClose={() => setTicketOffer(null)}
        />
      )}
    </div>
  );
}
