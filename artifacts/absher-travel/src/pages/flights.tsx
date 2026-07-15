import { useState } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { useSearchFlights, SearchFlightsTripType, SearchFlightsCabinClass, SearchFlightsSort, FlightOffer } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plane, ArrowLeftRight, Loader2, Luggage, Clock, PlaneTakeoff, PlaneLanding } from "lucide-react";

function formatDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m}m`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function OfferCard({ offer, language }: { offer: FlightOffer; language: string }) {
  const ar = language === "ar";
  const firstSeg = offer.segments[0];
  const lastSeg = offer.segments[offer.segments.length - 1];

  return (
    <Card className="border border-slate-200 hover:border-primary/40 hover:shadow-md transition-all rounded-xl">
      <CardContent className="p-5 flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-3 w-full md:w-40 shrink-0">
          {firstSeg?.airlineLogoUrl ? (
            <img src={firstSeg.airlineLogoUrl} alt={firstSeg.airlineName} className="h-8 w-8 object-contain" />
          ) : (
            <Plane className="h-8 w-8 text-primary" />
          )}
          <div className="text-sm font-medium text-slate-700 truncate">{firstSeg?.airlineName}</div>
        </div>

        <div className="flex-1 flex items-center justify-between gap-4 w-full">
          <div className="text-center">
            <div className="text-lg font-bold text-slate-800">{formatTime(firstSeg.departureAt)}</div>
            <div className="text-xs text-slate-500">{firstSeg.originIata}</div>
          </div>
          <div className="flex-1 flex flex-col items-center px-2">
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <Clock size={12} /> {formatDuration(offer.totalDurationMin)}
            </div>
            <div className="w-full h-px bg-slate-300 my-1.5 relative">
              <PlaneTakeoff size={12} className="absolute -top-1.5 text-slate-400 rtl:scale-x-[-1]" style={{ [ar ? "right" : "left"]: 0 }} />
            </div>
            <div className="text-xs font-medium text-slate-500">
              {offer.stops === 0 ? (ar ? "مباشر" : "Nonstop") : `${offer.stops} ${ar ? "توقف" : offer.stops === 1 ? "stop" : "stops"}`}
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-slate-800">{formatTime(lastSeg.arrivalAt)}</div>
            <div className="text-xs text-slate-500">{lastSeg.destinationIata}</div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-slate-500 w-full md:w-auto justify-center">
          <Luggage size={14} /> {offer.baggageIncludedKg}{ar ? " كجم" : "kg"}
        </div>

        <div className="flex flex-col items-center md:items-end gap-1 w-full md:w-40 shrink-0 border-t md:border-t-0 md:border-l rtl:md:border-l-0 rtl:md:border-r border-slate-100 pt-3 md:pt-0 md:pl-4 rtl:md:pr-4 rtl:md:pl-0">
          <div className="text-2xl font-extrabold text-primary">{offer.currency} {offer.totalPrice.toFixed(0)}</div>
          <Button size="sm" className="bg-accent text-primary hover:bg-accent/90 w-full">
            {ar ? "احجز الآن" : "Book Now"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Flights() {
  const { language } = useTranslation();
  const ar = language === "ar";

  const [tripType, setTripType] = useState<string>(SearchFlightsTripType.round_trip);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [adults, setAdults] = useState(1);
  const [cabinClass, setCabinClass] = useState<string>(SearchFlightsCabinClass.economy);
  const [sort, setSort] = useState<string>(SearchFlightsSort.best_value);
  const [searchParams, setSearchParams] = useState<Record<string, unknown> | null>(null);

  const { data, isFetching, isError } = useSearchFlights(searchParams ?? undefined, { query: { enabled: !!searchParams } });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination || !departureDate) return;
    setSearchParams({
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      departureDate,
      returnDate: tripType === SearchFlightsTripType.round_trip ? returnDate : undefined,
      tripType,
      cabinClass,
      adults,
      sort,
    });
  };

  const swap = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">{ar ? "ابحث عن رحلتك" : "Search flights"}</h1>
          <p className="text-slate-500">{ar ? "قارن أسعار الطيران الحقيقية واحجز أفضل رحلة" : "Compare real flight prices and book the best trip"}</p>
        </div>

        <Card className="border-0 shadow-lg rounded-2xl mb-8">
          <CardContent className="p-6">
            <Tabs value={tripType} onValueChange={setTripType} className="mb-4">
              <TabsList className="bg-slate-100">
                <TabsTrigger value={SearchFlightsTripType.round_trip}>{ar ? "ذهاب وعودة" : "Round trip"}</TabsTrigger>
                <TabsTrigger value={SearchFlightsTripType.one_way}>{ar ? "ذهاب فقط" : "One way"}</TabsTrigger>
              </TabsList>
            </Tabs>

            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-end">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">{ar ? "من (رمز المطار)" : "From (IATA code)"}</label>
                  <Input placeholder="JFK" dir="ltr" maxLength={3} value={origin} onChange={(e) => setOrigin(e.target.value)} className="uppercase" required />
                </div>
                <Button type="button" variant="outline" size="icon" className="hidden md:inline-flex mb-0.5" onClick={swap}>
                  <ArrowLeftRight size={16} />
                </Button>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">{ar ? "إلى (رمز المطار)" : "To (IATA code)"}</label>
                  <Input placeholder="LAX" dir="ltr" maxLength={3} value={destination} onChange={(e) => setDestination(e.target.value)} className="uppercase" required />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">{ar ? "تاريخ الذهاب" : "Depart"}</label>
                  <Input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} required />
                </div>
                {tripType === SearchFlightsTripType.round_trip && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500">{ar ? "تاريخ العودة" : "Return"}</label>
                    <Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} required />
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">{ar ? "المسافرون" : "Passengers"}</label>
                  <Input type="number" min={1} max={9} value={adults} onChange={(e) => setAdults(Number(e.target.value))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">{ar ? "الدرجة" : "Cabin"}</label>
                  <Select value={cabinClass} onValueChange={setCabinClass}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SearchFlightsCabinClass.economy}>{ar ? "اقتصادية" : "Economy"}</SelectItem>
                      <SelectItem value={SearchFlightsCabinClass.premium_economy}>{ar ? "اقتصادية مميزة" : "Premium Economy"}</SelectItem>
                      <SelectItem value={SearchFlightsCabinClass.business}>{ar ? "رجال الأعمال" : "Business"}</SelectItem>
                      <SelectItem value={SearchFlightsCabinClass.first}>{ar ? "الأولى" : "First"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-base bg-primary hover:bg-primary/90" disabled={isFetching}>
                {isFetching ? <Loader2 className="animate-spin mr-2 rtl:ml-2 rtl:mr-0" /> : <Plane className="mr-2 rtl:ml-2 rtl:mr-0 h-5 w-5" />}
                {ar ? "بحث عن الرحلات" : "Search flights"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {searchParams && (
          <div>
            {isFetching && (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Loader2 className="animate-spin h-8 w-8 mb-3" />
                {ar ? "جاري البحث عن أفضل الرحلات..." : "Searching for the best flights..."}
              </div>
            )}
            {isError && (
              <div className="text-center py-16 text-red-500">{ar ? "تعذر جلب نتائج الرحلات، حاول مرة أخرى" : "Couldn't load flight results, please try again"}</div>
            )}
            {data && !isFetching && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-slate-500">
                    {data.totalResults} {ar ? "نتيجة" : "results"}
                  </div>
                  <Select value={sort} onValueChange={setSort}>
                    <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SearchFlightsSort.best_value}>{ar ? "أفضل قيمة" : "Best value"}</SelectItem>
                      <SelectItem value={SearchFlightsSort.cheapest}>{ar ? "الأرخص" : "Cheapest"}</SelectItem>
                      <SelectItem value={SearchFlightsSort.fastest}>{ar ? "الأسرع" : "Fastest"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  {data.offers.length === 0 && (
                    <div className="text-center py-16 text-slate-400">
                      <PlaneLanding className="mx-auto h-10 w-10 mb-3" />
                      {ar ? "لا توجد رحلات مطابقة لبحثك" : "No flights match your search"}
                    </div>
                  )}
                  {data.offers.map((offer) => (
                    <OfferCard key={`${offer.providerSlug}-${offer.providerOfferId}`} offer={offer} language={language} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
