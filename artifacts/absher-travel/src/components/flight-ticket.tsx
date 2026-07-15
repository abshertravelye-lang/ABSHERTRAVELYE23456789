import { useRef } from "react";
import { X, Printer, Download, Plane, CheckCircle, Clock, Luggage, ArrowRight } from "lucide-react";
import type { FlightOffer } from "@workspace/api-client-react";
import type { Airport } from "@/data/airports";
import type { PassengerConfig } from "./passenger-selector";

interface FlightTicketProps {
  offer: FlightOffer;
  origin: Airport;
  destination: Airport;
  passengers: PassengerConfig;
  language: "ar" | "en";
  onClose: () => void;
}

const CABIN_LABELS: Record<string, { ar: string; en: string }> = {
  economy:         { ar: "درجة اقتصادية",    en: "Economy Class" },
  premium_economy: { ar: "اقتصادية مميزة",   en: "Premium Economy" },
  business:        { ar: "رجال الأعمال",     en: "Business Class" },
  first:           { ar: "الدرجة الأولى",    en: "First Class" },
};

function formatTime(iso: string, lang: "ar" | "en") {
  return new Date(iso).toLocaleTimeString(lang === "ar" ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatDate(iso: string, lang: "ar" | "en") {
  return new Date(iso).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function formatDur(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m}m`;
}

function genRef() {
  return "ABT" + Math.random().toString(36).toUpperCase().slice(2, 8);
}

const BOOKING_REF = genRef();

export function FlightTicket({ offer, origin, destination, passengers, language, onClose }: FlightTicketProps) {
  const ar = language === "ar";
  const ticketRef = useRef<HTMLDivElement>(null);

  const firstSeg = offer.segments[0];
  const lastSeg = offer.segments[offer.segments.length - 1];
  const cabin = CABIN_LABELS[passengers.cabinClass] ?? CABIN_LABELS.economy;

  const handlePrint = () => {
    window.print();
  };

  const totalPassengers = passengers.adults + passengers.children + passengers.infants;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" dir={ar ? "rtl" : "ltr"}>
      <div className="w-full max-w-2xl my-8">
        {/* Action bar */}
        <div className="flex items-center justify-between mb-4 print:hidden">
          <h2 className="text-white text-xl font-bold">{ar ? "تأكيد الحجز المؤقت" : "Provisional Booking Confirmation"}</h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
            >
              <Printer className="h-4 w-4" />
              {ar ? "طباعة" : "Print"}
            </button>
            <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Ticket */}
        <div ref={ticketRef} className="bg-white rounded-3xl overflow-hidden shadow-2xl print:shadow-none print:rounded-none">

          {/* Header — Company branding */}
          <div className="bg-[#0d2351] px-8 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Logo mark */}
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
                  <circle cx="24" cy="24" r="20" fill="#0d2351"/>
                  <path d="M12 26L24 14L36 26" stroke="#c8a84b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18 34L24 28L30 34" stroke="#c8a84b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="24" cy="26" r="3" fill="#c8a84b"/>
                </svg>
              </div>
              <div>
                <div className="text-white font-black text-lg leading-tight">أبشر أعمال</div>
                <div className="text-[#c8a84b] text-xs font-medium">للسفريات والسياحة</div>
                <div className="text-white/50 text-xs">Absher Travel & Tourism</div>
              </div>
            </div>
            <div className="text-right rtl:text-left">
              <div className="text-white/60 text-xs uppercase tracking-widest font-medium">{ar ? "مرجع الحجز" : "Booking Ref"}</div>
              <div className="text-[#c8a84b] font-black text-2xl tracking-widest mt-1">{BOOKING_REF}</div>
              <div className="mt-2 flex items-center gap-1.5 justify-end rtl:justify-start">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-300 text-xs font-semibold">{ar ? "حجز مؤقت – بانتظار الدفع" : "Provisional – Pending Payment"}</span>
              </div>
            </div>
          </div>

          {/* Route hero */}
          <div className="bg-gradient-to-br from-slate-900 to-[#0d2351] px-8 py-8">
            <div className="flex items-center justify-between gap-4">
              {/* Origin */}
              <div className="text-center flex-1">
                <div className="text-5xl font-black text-white tracking-wider">{firstSeg.originIata}</div>
                <div className="text-[#c8a84b] font-semibold text-base mt-1">
                  {ar ? origin.cityAr : origin.cityEn}
                </div>
                <div className="text-white/40 text-xs mt-0.5">{ar ? origin.countryAr : origin.countryEn}</div>
              </div>

              {/* Flight path visual */}
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="text-white/50 text-xs font-medium uppercase tracking-widest">
                  {offer.stops === 0 ? (ar ? "مباشر" : "Direct") : `${offer.stops} ${ar ? "توقف" : "stop"}`}
                </div>
                <div className="w-full flex items-center gap-1">
                  <div className="h-px bg-gradient-to-r from-[#c8a84b]/20 to-[#c8a84b] flex-1" />
                  <div className="w-8 h-8 rounded-full bg-[#c8a84b]/20 border border-[#c8a84b] flex items-center justify-center">
                    <Plane className="h-4 w-4 text-[#c8a84b] rotate-90" />
                  </div>
                  <div className="h-px bg-gradient-to-r from-[#c8a84b] to-[#c8a84b]/20 flex-1" />
                </div>
                <div className="text-white/60 text-xs">{formatDur(offer.totalDurationMin)}</div>
              </div>

              {/* Destination */}
              <div className="text-center flex-1">
                <div className="text-5xl font-black text-white tracking-wider">{lastSeg.destinationIata}</div>
                <div className="text-[#c8a84b] font-semibold text-base mt-1">
                  {ar ? destination.cityAr : destination.cityEn}
                </div>
                <div className="text-white/40 text-xs mt-0.5">{ar ? destination.countryAr : destination.countryEn}</div>
              </div>
            </div>

            {/* Times */}
            <div className="flex items-center justify-between mt-6 bg-white/5 rounded-2xl px-6 py-4">
              <div>
                <div className="text-3xl font-black text-white tabular-nums">{formatTime(firstSeg.departureAt, language)}</div>
                <div className="text-white/50 text-xs mt-1">{formatDate(firstSeg.departureAt, language)}</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full border-2 border-white/30" />
                  <div className="w-16 h-px bg-white/20" />
                  <Plane className="h-4 w-4 text-white/40 rotate-90" />
                  <div className="w-16 h-px bg-white/20" />
                  <div className="w-2 h-2 rounded-full bg-[#c8a84b]" />
                </div>
                <div className="text-white/40 text-xs mt-1">{formatDur(offer.totalDurationMin)}</div>
              </div>
              <div className="text-right rtl:text-left">
                <div className="text-3xl font-black text-white tabular-nums">{formatTime(lastSeg.arrivalAt, language)}</div>
                <div className="text-white/50 text-xs mt-1">{formatDate(lastSeg.arrivalAt, language)}</div>
              </div>
            </div>
          </div>

          {/* Tear line */}
          <div className="relative flex items-center">
            <div className="absolute -left-4 w-8 h-8 rounded-full bg-slate-100" />
            <div className="flex-1 border-t-2 border-dashed border-slate-200 mx-4" />
            <div className="absolute -right-4 w-8 h-8 rounded-full bg-slate-100" />
          </div>

          {/* Flight details */}
          <div className="px-8 py-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {/* Airline */}
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">{ar ? "شركة الطيران" : "Airline"}</div>
                <div className="flex items-center gap-2">
                  {firstSeg.airlineLogoUrl ? (
                    <img src={firstSeg.airlineLogoUrl} alt="" className="h-6 w-6 object-contain" />
                  ) : (
                    <Plane className="h-5 w-5 text-slate-400" />
                  )}
                  <span className="font-semibold text-slate-800 text-sm">{firstSeg.airlineName}</span>
                </div>
              </div>

              {/* Flight No */}
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">{ar ? "رقم الرحلة" : "Flight No."}</div>
                <div className="font-black text-slate-800 text-sm tracking-widest">{firstSeg.flightNumber}</div>
              </div>

              {/* Cabin */}
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">{ar ? "درجة السفر" : "Cabin"}</div>
                <div className="font-semibold text-slate-800 text-sm">{ar ? cabin.ar : cabin.en}</div>
              </div>

              {/* Baggage */}
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">{ar ? "الأمتعة" : "Baggage"}</div>
                <div className="flex items-center gap-1.5">
                  <Luggage className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-slate-800 text-sm">{offer.baggageIncludedKg} {ar ? "كجم" : "kg"}</span>
                </div>
              </div>

              {/* Passengers */}
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">{ar ? "المسافرون" : "Passengers"}</div>
                <div className="font-semibold text-slate-800 text-sm">
                  {passengers.adults > 0 && `${passengers.adults} ${ar ? "بالغ" : "adult(s)"}`}
                  {passengers.children > 0 && `, ${passengers.children} ${ar ? "طفل" : "child(ren)"}`}
                  {passengers.infants > 0 && `, ${passengers.infants} ${ar ? "رضيع" : "infant(s)"}`}
                </div>
              </div>

              {/* Stops */}
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">{ar ? "التوقفات" : "Stops"}</div>
                <div className="font-semibold text-slate-800 text-sm">
                  {offer.stops === 0 ? (ar ? "بدون توقف" : "Non-stop") : `${offer.stops} ${ar ? "توقف" : "stop(s)"}`}
                </div>
              </div>
            </div>

            {/* Segment detail if multi-leg */}
            {offer.segments.length > 1 && (
              <div className="mt-5 bg-slate-50 rounded-2xl p-4 space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{ar ? "تفاصيل المسار" : "Journey Segments"}</div>
                {offer.segments.map((seg, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="font-black text-primary">{seg.originIata}</span>
                    <ArrowRight className="h-4 w-4 text-slate-400 rtl:rotate-180" />
                    <span className="font-black text-slate-700">{seg.destinationIata}</span>
                    <span className="text-slate-400 text-xs">{seg.flightNumber}</span>
                    <span className="text-slate-400 text-xs">{formatTime(seg.departureAt, language)} → {formatTime(seg.arrivalAt, language)}</span>
                    <span className="text-slate-400 text-xs">{formatDur(seg.durationMin)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Price section */}
          <div className="mx-8 mb-6 bg-gradient-to-r from-primary/5 to-[#c8a84b]/10 rounded-2xl p-5 border border-primary/10">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{ar ? "السعر الإجمالي" : "Total Price"}</div>
                <div className="flex items-end gap-2">
                  <div className="text-4xl font-black text-primary">{offer.totalPrice.toLocaleString()}</div>
                  <div className="text-lg font-semibold text-primary/60 mb-1">{offer.currency}</div>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {ar ? `شامل ${totalPassengers} مسافر` : `For ${totalPassengers} passenger(s)`} · {ar ? "جميع الرسوم شاملة" : "All fees included"}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {offer.isRefundable && (
                  <div className="flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-green-200">
                    <CheckCircle className="h-3.5 w-3.5" />
                    {ar ? "قابل للاسترداد" : "Refundable"}
                  </div>
                )}
                {offer.carryOnIncluded && (
                  <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-blue-200">
                    <Clock className="h-3.5 w-3.5" />
                    {ar ? "حقيبة يد مجانية" : "Carry-on included"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-8 py-5 border-t border-slate-100">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="text-xs text-slate-400 space-y-1">
                <div className="font-semibold text-slate-500">{ar ? "أبشر أعمال للسفريات والسياحة" : "Absher Travel & Tourism"}</div>
                <div>{ar ? "اليمن - صنعاء - شارع الزبيري - جولة كنتاكي سابقاً" : "Yemen – Sana'a – Al-Zubairi St – Former KFC Roundabout"}</div>
                <div>{ar ? "هاتف: 967+ 779055511 / 784055511" : "Tel: +967 779055511 / 784055511"}</div>
              </div>
              <div className="text-xs text-slate-300 text-right rtl:text-left">
                <div>{ar ? "وثيقة حجز مؤقت — تذكرة غير نهائية" : "Provisional booking — Not a confirmed ticket"}</div>
                <div>{ar ? "يُرجى إتمام الدفع لتأكيد الحجز" : "Please complete payment to confirm"}</div>
                <div className="mt-1 text-[10px]">{new Date().toLocaleString(ar ? "ar-SA" : "en-US")}</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="mt-4 flex gap-3 print:hidden">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-semibold transition-all"
          >
            {ar ? "عودة للنتائج" : "Back to results"}
          </button>
          <button
            className="flex-1 py-3.5 bg-[#c8a84b] hover:bg-[#b8973b] text-white rounded-2xl font-bold transition-all shadow-lg shadow-amber-900/20"
          >
            {ar ? "تأكيد الحجز والدفع" : "Confirm & Pay"}
          </button>
        </div>
      </div>
    </div>
  );
}
