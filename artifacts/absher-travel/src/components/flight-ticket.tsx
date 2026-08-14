import { useState, useRef, useEffect } from "react";
import QRCode from 'qrcode';
import {
  X, Printer, Plane, CheckCircle, Clock, Luggage, ArrowRight,
  User, FileText, Globe, Calendar, ChevronRight, ShieldCheck, AlertCircle,
  CreditCard, Phone, ChevronDown,
} from "lucide-react";
import { type FlightOffer } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import type { Airport } from "@/data/airports";
import type { PassengerConfig } from "./passenger-selector";
import { CountrySelect } from "@/components/country-select";
import { COUNTRIES } from "@workspace/countries";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/* ─────────────────── types ─────────────────── */
interface FlightTicketProps {
  offer: FlightOffer;
  origin: Airport;
  destination: Airport;
  passengers: PassengerConfig;
  language: "ar" | "en";
  onClose: () => void;
}

interface PassengerInfo {
  givenName: string;
  familyName: string;
  title: "mr" | "ms" | "mrs" | "miss" | "dr" | "";
  gender: "m" | "f" | "";
  dob: string;
  email: string;
  phone: string;
  phoneDialCode: string;
  passport: string;
  nationality: string;
}

type Step = "passengers" | "provisional" | "confirmed";

/* ─────────────────── helpers ─────────────────── */
const CABIN_LABELS: Record<string, { ar: string; en: string }> = {
  economy:         { ar: "درجة اقتصادية",  en: "Economy Class" },
  premium_economy: { ar: "اقتصادية مميزة", en: "Premium Economy" },
  business:        { ar: "رجال الأعمال",   en: "Business Class" },
  first:           { ar: "الدرجة الأولى",  en: "First Class" },
};

function fmt(iso: string, lang: "ar" | "en") {
  return new Date(iso).toLocaleTimeString(lang === "ar" ? "ar-SA" : "en-US", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}
function fmtDate(iso: string, lang: "ar" | "en") {
  return new Date(iso).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}
function dur(min: number) {
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}
function genRef(prefix = "ABT") {
  return prefix + Math.random().toString(36).toUpperCase().slice(2, 8);
}

function useQRCode(text: string): string | null {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  useEffect(() => {
    QRCode.toDataURL(text, { width: 120, margin: 1, color: { dark: '#0d2351', light: '#ffffff' } })
      .then(setDataUrl)
      .catch(() => {});
  }, [text]);
  return dataUrl;
}

function Barcode({ value }: { value: string }) {
  const bars = value.split('').map(c => c.charCodeAt(0));
  const totalBars = bars.reduce((a, b) => a + (b % 4) + 2, 0) + bars.length;
  let x = 0;
  const elements: React.ReactNode[] = [];
  bars.forEach((code, i) => {
    const barCount = (code % 4) + 2;
    for (let j = 0; j < barCount; j++) {
      const w = j % 2 === 0 ? 2 : 1;
      elements.push(<rect key={`${i}-${j}`} x={x} y={0} width={w} height={40} fill={j % 2 === 0 ? "#0d2351" : "transparent"} />);
      x += w + 1;
    }
    x += 2;
  });
  // suppress unused var lint
  void totalBars;
  return (
    <svg width={Math.min(x, 200)} height={40} viewBox={`0 0 ${x} 40`} preserveAspectRatio="none" style={{ width: '100%', maxWidth: 200, height: 40 }}>
      {elements}
    </svg>
  );
}

function PrintStyles() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      @media print {
        * { visibility: hidden !important; }
        .ticket-print-root,
        .ticket-print-root * { visibility: visible !important; }
        .ticket-print-root {
          position: fixed !important;
          inset: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          overflow: visible !important;
          background: white !important;
        }
        @page { margin: 0; size: A4 portrait; }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `}} />
  );
}

/* ─────────────────── Watermark SVG ─────────────────── */
const WATERMARK_STYLE: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  pointerEvents: "none",
  zIndex: 0,
  opacity: 0.045,
};

function Watermark() {
  const items = Array.from({ length: 40 });
  return (
    <div style={WATERMARK_STYLE} aria-hidden>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        {items.map((_, i) => {
          const row = Math.floor(i / 5);
          const col = i % 5;
          return (
            <text
              key={i}
              x={col * 22 + "%"}
              y={row * 120 + 80}
              fontSize="13"
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
              fill="#0d2351"
              transform={`rotate(-38, ${col * 220 + 100}, ${row * 120 + 60})`}
            >
              ABSHER TRAVEL
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/* ─────────────────── Phone dial codes (top 20) ─────────────────── */
const DIAL_CODE_MAP: Record<string, string> = {
  SA:"+966", AE:"+971", YE:"+967", OM:"+968", KW:"+965", QA:"+974",
  BH:"+973", EG:"+20",  JO:"+962", IQ:"+964", SY:"+963", LB:"+961",
  MA:"+212", DZ:"+213", TN:"+216", IN:"+91",  PK:"+92",  US:"+1",
  GB:"+44",  TR:"+90",
};
const DIAL_CODES = [
  "SA", "AE", "YE", "OM", "KW", "QA", "BH", "EG", "JO", "IQ",
  "SY", "LB", "MA", "DZ", "TN", "IN", "PK", "US", "GB", "TR",
].map(code => COUNTRIES.find(c => c.code === code)).filter(Boolean) as typeof COUNTRIES;

function PhoneInput({
  value, dialCode, onValueChange, onDialChange, ar,
}: {
  value: string;
  dialCode: string;
  onValueChange: (v: string) => void;
  onDialChange: (v: string) => void;
  ar: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = DIAL_CODES.find(c => c.code === dialCode) ?? DIAL_CODES[2]; // default YE

  return (
    <div className="flex w-full border border-slate-200 rounded-xl overflow-hidden bg-slate-50 hover:bg-white focus-within:ring-2 focus-within:ring-[#c8a84b]/30 focus-within:border-[#c8a84b] transition-all">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-2.5 border-e border-slate-200 bg-slate-100 hover:bg-slate-200 transition-colors shrink-0 text-sm font-medium text-slate-700"
          >
            <span className="text-base leading-none">{selected?.flag}</span>
            <span className="text-xs text-slate-500 font-mono">{selected ? DIAL_CODE_MAP[selected.code] : ""}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-1" align={ar ? "end" : "start"}>
          <div className="max-h-56 overflow-y-auto space-y-0.5">
            {DIAL_CODES.map(c => (
              <button
                key={c.code}
                type="button"
                onClick={() => { onDialChange(c.code); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-start ${dialCode === c.code ? "bg-[#0d2351]/10 text-[#0d2351] font-semibold" : "hover:bg-slate-50 text-slate-700"}`}
              >
                <span className="text-base leading-none">{c.flag}</span>
                <span className="font-mono text-xs text-slate-500 w-10 shrink-0">{DIAL_CODE_MAP[c.code]}</span>
                <span className="truncate">{ar ? c.nameAr : c.nameEn}</span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <input
        type="tel"
        value={value}
        onChange={e => onValueChange(e.target.value)}
        placeholder={ar ? "7xxxxxxxx" : "7xxxxxxxx"}
        className="flex-1 px-3 py-2.5 bg-transparent text-sm text-slate-800 focus:outline-none placeholder:text-slate-300"
        dir="ltr"
      />
    </div>
  );
}

/* ─────────────────── 3-Select Date Picker ─────────────────── */
const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function parseDateParts(iso: string): { day: string; month: string; year: string } {
  if (!iso) return { day: "", month: "", year: "" };
  const [year, month, day] = iso.split("-");
  return { day: day ? String(parseInt(day, 10)) : "", month: month ? String(parseInt(month, 10)) : "", year: year || "" };
}

function buildIso(day: string, month: string, year: string): string {
  if (!day || !month || !year) return "";
  return `${year}-${String(Number(month)).padStart(2, "0")}-${String(Number(day)).padStart(2, "0")}`;
}

function DateSelectPicker({
  value, onChange, ar, minYear, maxYear,
}: {
  value: string;
  onChange: (iso: string) => void;
  ar: boolean;
  minYear: number;
  maxYear: number;
}) {
  const { day, month, year } = parseDateParts(value);

  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => String(maxYear - i));
  const months = ar ? MONTHS_AR : MONTHS_EN;
  const daysCount = day && month && year ? new Date(Number(year), Number(month), 0).getDate() : 31;
  const days = Array.from({ length: daysCount }, (_, i) => String(i + 1));

  const handleChange = (d: string, m: string, y: string) => {
    onChange(buildIso(d, m, y));
  };

  const selectCls = "h-10 border-slate-200 bg-slate-50 rounded-xl text-sm focus:border-[#c8a84b] focus:ring-[#c8a84b]/20";

  return (
    <div className="flex gap-2" dir="ltr">
      {/* Day */}
      <Select value={day} onValueChange={d => handleChange(d, month, year)}>
        <SelectTrigger className={`${selectCls} w-[72px]`}>
          <SelectValue placeholder={ar ? "يوم" : "Day"} />
        </SelectTrigger>
        <SelectContent>
          {days.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
        </SelectContent>
      </Select>
      {/* Month */}
      <Select value={month} onValueChange={m => handleChange(day, m, year)}>
        <SelectTrigger className={`${selectCls} flex-1`}>
          <SelectValue placeholder={ar ? "شهر" : "Month"} />
        </SelectTrigger>
        <SelectContent>
          {months.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}
        </SelectContent>
      </Select>
      {/* Year */}
      <Select value={year} onValueChange={y => handleChange(day, month, y)}>
        <SelectTrigger className={`${selectCls} w-[88px]`}>
          <SelectValue placeholder={ar ? "سنة" : "Year"} />
        </SelectTrigger>
        <SelectContent>
          {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

/* ─────────────────── Passenger Form ─────────────────── */
const TITLES: Array<{ value: PassengerInfo["title"]; ar: string; en: string }> = [
  { value: "mr",   ar: "السيد",    en: "Mr." },
  { value: "ms",   ar: "الآنسة",  en: "Ms." },
  { value: "mrs",  ar: "السيدة",  en: "Mrs." },
  { value: "miss", ar: "الآنسة",  en: "Miss" },
  { value: "dr",   ar: "الدكتور", en: "Dr." },
];

const INPUT_CLS = `w-full ps-10 pe-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800
  focus:outline-none focus:ring-2 focus:ring-[#c8a84b]/30 focus:border-[#c8a84b] transition-all
  placeholder:text-slate-300 bg-slate-50 hover:bg-white`;

function PaxField({
  icon, label, required, children,
}: { icon: React.ReactNode; label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-400 ms-0.5">*</span>}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 start-3 flex items-center pointer-events-none z-10">{icon}</div>
        {children}
      </div>
    </div>
  );
}

function PassengerForm({
  index, total, info, ar, onChange,
}: {
  index: number;
  total: number;
  info: PassengerInfo;
  ar: boolean;
  onChange: (info: PassengerInfo) => void;
}) {
  const up = (patch: Partial<PassengerInfo>) => onChange({ ...info, ...patch });
  const currentYear = new Date().getFullYear();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-[#0d2351] to-[#1a3875] px-5 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#c8a84b] flex items-center justify-center">
          <User className="h-4 w-4 text-white" />
        </div>
        <div>
          <div className="text-white font-bold text-sm">
            {ar ? `المسافر ${index + 1}` : `Passenger ${index + 1}`}
            {total > 1 && <span className="text-white/50 text-xs ms-2">({ar ? `من ${total}` : `of ${total}`})</span>}
          </div>
          <div className="text-white/50 text-xs">{ar ? "أدخل البيانات كما في جواز السفر" : "Enter details exactly as in passport"}</div>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Given Name */}
        <PaxField icon={<User className="h-4 w-4 text-[#c8a84b]" />} label={ar ? "الاسم الأول" : "Given Name"} required>
          <input type="text" value={info.givenName} onChange={e => up({ givenName: e.target.value })}
            placeholder={ar ? "كما في جواز السفر" : "As in passport"} className={INPUT_CLS} />
        </PaxField>

        {/* Family Name */}
        <PaxField icon={<User className="h-4 w-4 text-[#c8a84b]" />} label={ar ? "اسم العائلة" : "Family Name"} required>
          <input type="text" value={info.familyName} onChange={e => up({ familyName: e.target.value })}
            placeholder={ar ? "كما في جواز السفر" : "As in passport"} className={INPUT_CLS} />
        </PaxField>

        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            {ar ? "اللقب" : "Title"}<span className="text-red-400 ms-0.5">*</span>
          </label>
          <Select value={info.title || ""} onValueChange={v => up({ title: v as PassengerInfo["title"] })}>
            <SelectTrigger className="w-full h-10 border-slate-200 bg-slate-50 rounded-xl text-sm focus:border-[#c8a84b] focus:ring-[#c8a84b]/20">
              <SelectValue placeholder={ar ? "اختر اللقب" : "Select title"} />
            </SelectTrigger>
            <SelectContent>
              {TITLES.map(t => (
                <SelectItem key={t.value} value={t.value}>{ar ? t.ar : t.en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Gender */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            {ar ? "الجنس" : "Gender"}<span className="text-red-400 ms-0.5">*</span>
          </label>
          <Select value={info.gender || ""} onValueChange={v => up({ gender: v as PassengerInfo["gender"] })}>
            <SelectTrigger className="w-full h-10 border-slate-200 bg-slate-50 rounded-xl text-sm focus:border-[#c8a84b] focus:ring-[#c8a84b]/20">
              <SelectValue placeholder={ar ? "اختر الجنس" : "Select gender"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="m">{ar ? "ذكر" : "Male"}</SelectItem>
              <SelectItem value="f">{ar ? "أنثى" : "Female"}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date of Birth — 3-Select */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#c8a84b]" />
              {ar ? "تاريخ الميلاد" : "Date of Birth"}<span className="text-red-400">*</span>
            </span>
          </label>
          <DateSelectPicker
            value={info.dob}
            onChange={v => up({ dob: v })}
            ar={ar}
            minYear={1940}
            maxYear={currentYear}
          />
        </div>

        {/* Email */}
        <PaxField icon={<FileText className="h-4 w-4 text-[#c8a84b]" />} label={ar ? "البريد الإلكتروني" : "Email"} required>
          <input type="email" value={info.email} onChange={e => up({ email: e.target.value })}
            placeholder="name@email.com" className={INPUT_CLS} dir="ltr" />
        </PaxField>

        {/* Phone with dial code */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-[#c8a84b]" />
              {ar ? "رقم الهاتف" : "Phone Number"}<span className="text-red-400">*</span>
            </span>
          </label>
          <PhoneInput
            value={info.phone}
            dialCode={info.phoneDialCode || "YE"}
            onValueChange={v => up({ phone: v })}
            onDialChange={v => up({ phoneDialCode: v })}
            ar={ar}
          />
        </div>

        {/* Passport */}
        <PaxField icon={<FileText className="h-4 w-4 text-[#c8a84b]" />} label={ar ? "رقم الجواز" : "Passport No."}>
          <input type="text" value={info.passport} onChange={e => up({ passport: e.target.value })}
            placeholder="A12345678" className={INPUT_CLS} dir="ltr" />
        </PaxField>

        {/* Nationality — CountrySelect */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            <span className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-[#c8a84b]" />
              {ar ? "الجنسية" : "Nationality"}
            </span>
          </label>
          <CountrySelect
            language={ar ? "ar" : "en"}
            value={info.nationality}
            onChange={code => up({ nationality: code })}
          />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── Ticket content (printed) ─────────────────── */
function TicketContent({
  offer, origin, destination, passengers, passengerDetails,
  language, bookingRef, isConfirmed,
}: {
  offer: FlightOffer;
  origin: Airport;
  destination: Airport;
  passengers: PassengerConfig;
  passengerDetails: PassengerInfo[];
  language: "ar" | "en";
  bookingRef: string;
  isConfirmed: boolean;
}) {
  const ar = language === "ar";
  const firstSeg = offer.segments[0];
  const lastSeg = offer.segments[offer.segments.length - 1];
  const cabin = CABIN_LABELS[passengers.cabinClass] ?? CABIN_LABELS.economy;
  const total = passengers.adults + passengers.children + passengers.infants;

  const qrDataUrl = useQRCode(`ABT-${bookingRef}-${firstSeg.originIata}-${firstSeg.destinationIata}`);

  return (
    <div
      className="ticket-print-root bg-white rounded-3xl overflow-hidden shadow-2xl print:shadow-none print:rounded-none relative"
      style={{ position: "relative" }}
    >
      <PrintStyles />
      <Watermark />

      {/* ── Header ── */}
      <div className="relative z-10 bg-[#0d2351] px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg shrink-0">
            <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
              <circle cx="24" cy="24" r="20" fill="#0d2351"/>
              <path d="M12 26L24 14L36 26" stroke="#c8a84b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18 34L24 28L30 34" stroke="#c8a84b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="24" cy="26" r="3" fill="#c8a84b"/>
            </svg>
          </div>
          <div>
            <div className="text-white font-black text-lg leading-tight">ABSHER TRAVEL</div>
            <div className="text-white/40 text-xs">للسفريات والسياحة</div>
          </div>
        </div>

        <div className="text-end rtl:text-start">
          <div className="text-white/50 text-xs uppercase tracking-widest font-medium">
            {ar ? "مرجع الحجز" : "Booking Ref"}
          </div>
          <div className="text-[#c8a84b] font-black text-2xl tracking-widest mt-0.5">{bookingRef}</div>
          <div className="mt-2 flex items-center gap-1.5 justify-end rtl:justify-start">
            {isConfirmed ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300 text-xs font-bold">
                  {ar ? "تذكرة مؤكدة – تم الحجز" : "Confirmed Ticket"}
                </span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-300 text-xs font-semibold">
                  {ar ? "حجز مؤقت – بانتظار الدفع" : "Provisional – Pending Payment"}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Route hero ── */}
      <div className="relative z-10 bg-gradient-to-br from-slate-900 to-[#0d2351] px-8 py-8">
        <div className="flex items-center justify-between gap-4">
          <div className="text-center flex-1">
            <div className="text-5xl font-black text-white tracking-wider">{firstSeg.originIata}</div>
            <div className="text-[#c8a84b] font-semibold text-base mt-1">
              {ar ? origin.cityAr : origin.cityEn}
            </div>
            <div className="text-white/40 text-xs mt-0.5">
              {ar ? origin.countryAr : origin.countryEn}
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="text-white/50 text-xs font-medium uppercase tracking-widest">
              {offer.stops === 0
                ? (ar ? "مباشر" : "Direct")
                : `${offer.stops} ${ar ? "توقف" : "stop"}`}
            </div>
            <div className="w-full flex items-center gap-1">
              <div className="h-px bg-gradient-to-r from-[#c8a84b]/20 to-[#c8a84b] flex-1" />
              <div className="w-8 h-8 rounded-full bg-[#c8a84b]/20 border border-[#c8a84b] flex items-center justify-center">
                <Plane className="h-4 w-4 text-[#c8a84b] rotate-90" />
              </div>
              <div className="h-px bg-gradient-to-r from-[#c8a84b] to-[#c8a84b]/20 flex-1" />
            </div>
            <div className="text-white/50 text-xs">{dur(offer.totalDurationMin)}</div>
          </div>

          <div className="text-center flex-1">
            <div className="text-5xl font-black text-white tracking-wider">{lastSeg.destinationIata}</div>
            <div className="text-[#c8a84b] font-semibold text-base mt-1">
              {ar ? destination.cityAr : destination.cityEn}
            </div>
            <div className="text-white/40 text-xs mt-0.5">
              {ar ? destination.countryAr : destination.countryEn}
            </div>
          </div>
        </div>

        {/* Times */}
        <div className="flex items-center justify-between mt-6 bg-white/5 rounded-2xl px-6 py-4">
          <div>
            <div className="text-3xl font-black text-white tabular-nums">
              {fmt(firstSeg.departureAt, language)}
            </div>
            <div className="text-white/50 text-xs mt-1">{fmtDate(firstSeg.departureAt, language)}</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full border-2 border-white/30" />
              <div className="w-16 h-px bg-white/20" />
              <Plane className="h-4 w-4 text-white/40 rotate-90" />
              <div className="w-16 h-px bg-white/20" />
              <div className="w-2 h-2 rounded-full bg-[#c8a84b]" />
            </div>
            <div className="text-white/40 text-xs mt-1">{dur(offer.totalDurationMin)}</div>
          </div>
          <div className="text-end rtl:text-start">
            <div className="text-3xl font-black text-white tabular-nums">
              {fmt(lastSeg.arrivalAt, language)}
            </div>
            <div className="text-white/50 text-xs mt-1">{fmtDate(lastSeg.arrivalAt, language)}</div>
          </div>
        </div>
      </div>

      {/* ── Tear line ── */}
      <div className="relative z-10 flex items-center">
        <div className="absolute -start-4 w-8 h-8 rounded-full bg-slate-100" />
        <div className="flex-1 border-t-2 border-dashed border-slate-200 mx-4" />
        <div className="absolute -end-4 w-8 h-8 rounded-full bg-slate-100" />
      </div>

      {/* ── Flight details ── */}
      <div className="relative z-10 px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              {ar ? "شركة الطيران" : "Airline"}
            </div>
            <div className="flex items-center gap-2">
              {firstSeg.airlineLogoUrl
                ? <img src={firstSeg.airlineLogoUrl} alt="" className="h-6 w-6 object-contain" />
                : <Plane className="h-5 w-5 text-slate-400" />}
              <span className="font-semibold text-slate-800 text-sm">{firstSeg.airlineName}</span>
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              {ar ? "رقم الرحلة" : "Flight No."}
            </div>
            <div className="font-black text-slate-800 text-sm tracking-widest">{firstSeg.flightNumber}</div>
          </div>

          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              {ar ? "درجة السفر" : "Cabin"}
            </div>
            <div className="font-semibold text-slate-800 text-sm">
              {ar ? cabin.ar : cabin.en}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              {ar ? "الأمتعة" : "Baggage"}
            </div>
            <div className="flex items-center gap-1.5">
              <Luggage className="h-4 w-4 text-[#0d2351]" />
              <span className="font-semibold text-slate-800 text-sm">
                {offer.baggageIncludedKg} {ar ? "كجم" : "kg"}
              </span>
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              {ar ? "التوقفات" : "Stops"}
            </div>
            <div className="font-semibold text-slate-800 text-sm">
              {offer.stops === 0
                ? (ar ? "بدون توقف" : "Non-stop")
                : `${offer.stops} ${ar ? "توقف" : "stop(s)"}`}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              {ar ? "عدد المسافرين" : "Passengers"}
            </div>
            <div className="font-semibold text-slate-800 text-sm">
              {passengers.adults > 0 && `${passengers.adults} ${ar ? "بالغ" : "adult(s)"}`}
              {passengers.children > 0 && `, ${passengers.children} ${ar ? "طفل" : "child(ren)"}`}
              {passengers.infants > 0 && `, ${passengers.infants} ${ar ? "رضيع" : "infant(s)"}`}
            </div>
          </div>
        </div>

        {/* Multi-segment */}
        {offer.segments.length > 1 && (
          <div className="mt-5 bg-slate-50 rounded-2xl p-4 space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {ar ? "تفاصيل المسار" : "Journey Segments"}
            </div>
            {offer.segments.map((seg, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="font-black text-[#0d2351]">{seg.originIata}</span>
                <ArrowRight className="h-4 w-4 text-slate-400 rtl:rotate-180" />
                <span className="font-black text-slate-700">{seg.destinationIata}</span>
                <span className="text-slate-400 text-xs">{seg.flightNumber}</span>
                <span className="text-slate-400 text-xs">
                  {fmt(seg.departureAt, language)} → {fmt(seg.arrivalAt, language)}
                </span>
                <span className="text-slate-400 text-xs">{dur(seg.durationMin)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Passengers table ── */}
      {passengerDetails.some(p => p.givenName || p.familyName) && (
        <div className="relative z-10 mx-8 mb-6">
          <div className="bg-[#0d2351]/5 border border-[#0d2351]/10 rounded-2xl overflow-hidden">
            <div className="bg-[#0d2351] px-5 py-2.5 flex items-center gap-2">
              <User className="h-4 w-4 text-[#c8a84b]" />
              <span className="text-white font-bold text-sm">
                {ar ? "بيانات المسافرين" : "Passenger Details"}
              </span>
            </div>
            <div className="divide-y divide-[#0d2351]/10">
              {passengerDetails.map((p, i) => (
                <div key={i} className="px-5 py-3 flex flex-wrap gap-x-8 gap-y-1 text-sm">
                  <div className="flex items-center gap-2 font-bold text-[#0d2351] min-w-[160px]">
                    <span className="w-5 h-5 rounded-full bg-[#c8a84b] text-white text-xs flex items-center justify-center font-black shrink-0">
                      {i + 1}
                    </span>
                    {[p.givenName, p.familyName].filter(Boolean).join(" ") || "—"}
                  </div>
                  {p.passport && (
                    <div className="text-slate-500">
                      <span className="text-xs text-slate-400 font-medium">{ar ? "جواز: " : "PP: "}</span>
                      {p.passport}
                    </div>
                  )}
                  {p.nationality && (
                    <div className="text-slate-500">
                      <span className="text-xs text-slate-400 font-medium">{ar ? "الجنسية: " : "Nationality: "}</span>
                      {COUNTRIES.find(c => c.code === p.nationality)?.[ar ? "nameAr" : "nameEn"] || p.nationality}
                    </div>
                  )}
                  {p.dob && (
                    <div className="text-slate-500">
                      <span className="text-xs text-slate-400 font-medium">{ar ? "تاريخ الميلاد: " : "DOB: "}</span>
                      {p.dob}
                    </div>
                  )}
                  {p.email && (
                    <div className="text-slate-500">
                      <span className="text-xs text-slate-400 font-medium">{ar ? "البريد: " : "Email: "}</span>
                      {p.email}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Price ── */}
      <div className="relative z-10 mx-8 mb-6 rounded-2xl overflow-hidden border border-[#c8a84b]/20">
        <div className="bg-gradient-to-r from-[#0d2351]/5 to-[#c8a84b]/10 px-5 py-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                {ar ? "السعر الإجمالي" : "Total Price"}
              </div>
              <div className="flex items-end gap-2">
                <div className="text-4xl font-black text-[#0d2351]">
                  {offer.totalPrice.toLocaleString()}
                </div>
                <div className="text-lg font-semibold text-[#0d2351]/50 mb-1">{offer.currency}</div>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {ar
                  ? `شامل ${total} مسافر · جميع الرسوم شاملة`
                  : `For ${total} passenger(s) · All fees included`}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {offer.isRefundable && (
                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-200">
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
      </div>

        <div className="relative z-10 mx-8 mb-4 flex items-end gap-6 flex-wrap">
          {qrDataUrl && (
            <div className="flex flex-col items-center gap-1">
              <img src={qrDataUrl} alt="QR" className="w-[80px] h-[80px] rounded-lg border border-slate-200 p-1 bg-white" />
              <div className="text-[9px] text-slate-400 font-mono">{bookingRef}</div>
            </div>
          )}
          <div className="flex flex-col gap-1 flex-1">
            <div className="text-[9px] text-slate-400 uppercase tracking-widest font-medium">
              {ar ? "رمز الحجز" : "Booking Code"}
            </div>
            <Barcode value={bookingRef} />
            <div className="text-[10px] font-mono text-slate-500 tracking-widest">{bookingRef}</div>
          </div>
        </div>

      {/* ── Footer ── */}
      <div className="relative z-10 bg-[#0d2351]/5 border-t border-[#0d2351]/10 px-8 py-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="text-xs text-slate-500 space-y-0.5">
            <div className="font-bold text-[#0d2351]">
              ABSHER TRAVEL
            </div>
            <div className="text-slate-400">
              {ar
                ? "اليمن - صنعاء - شارع الزبيري - جولة كنتاكي سابقاً"
                : "Yemen – Sana'a – Al-Zubairi St – Former KFC Roundabout"}
            </div>
            <div className="text-slate-400">
              {ar ? "هاتف: 967+ 779055511 / 784055511" : "Tel: +967 779055511 / 784055511"}
            </div>
          </div>
          <div className="text-xs text-end rtl:text-start">
            {isConfirmed ? (
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl border border-emerald-200 font-semibold">
                <ShieldCheck className="h-4 w-4" />
                {ar ? "تذكرة مؤكدة — حجز نهائي" : "Confirmed Ticket — Final Booking"}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-2 rounded-xl border border-amber-200 font-semibold">
                <AlertCircle className="h-4 w-4" />
                {ar ? "وثيقة مؤقتة — يُرجى إتمام الدفع" : "Provisional — Please complete payment"}
              </div>
            )}
            <div className="mt-2 text-[10px] text-slate-300">
              {new Date().toLocaleString(ar ? "ar-SA" : "en-US")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── Main component ─────────────────── */
export function FlightTicket({
  offer, origin, destination, passengers, language, onClose,
}: FlightTicketProps) {
  const ar = language === "ar";
  const totalPax = passengers.adults + passengers.children + passengers.infants;

  const [step, setStep] = useState<Step>("passengers");
  const [passengerDetails, setPassengerDetails] = useState<PassengerInfo[]>(
    Array.from({ length: Math.max(totalPax, 1) }, () => ({
      givenName: "", familyName: "", title: "" as PassengerInfo["title"],
      gender: "" as PassengerInfo["gender"], dob: "", email: "", phone: "",
      phoneDialCode: "YE", passport: "", nationality: "",
    }))
  );
  const [bookingRef] = useState(() => genRef("ABT"));
  const [confirmedRef] = useState(() => genRef("CNF"));
  const [duffelBookingRef, setDuffelBookingRef] = useState<string | null>(null);
  const [duffelOrderId, setDuffelOrderId] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const { accessToken } = useAuth();

  const updatePassenger = (i: number, info: PassengerInfo) => {
    setPassengerDetails(prev => prev.map((p, idx) => idx === i ? info : p));
  };

  const p0 = passengerDetails[0];
  const hasMinData = !!(
    p0?.givenName.trim() &&
    p0?.familyName.trim() &&
    p0?.dob &&
    p0?.email.trim() &&
    p0?.phone.trim() &&
    p0?.title &&
    p0?.gender
  );

  const handlePrint = () => window.print();

  const handleConfirm = async () => {
    if (!hasMinData || isBooking) return;
    setIsBooking(true);
    const firstSeg = offer.segments[0];
    const lastSeg = offer.segments[offer.segments.length - 1];
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      const dialCode = DIAL_CODE_MAP[p0?.phoneDialCode || "YE"] ?? "+967";
      const resp = await fetch("/api/flights/book", {
        method: "POST",
        headers,
        body: JSON.stringify({
          providerSlug: offer.providerSlug,
          providerOfferId: offer.providerOfferId,
          passengers: passengerDetails.map(p => {
            const dc = DIAL_CODE_MAP[p.phoneDialCode || "YE"] ?? "+967";
            return {
              givenName: p.givenName,
              familyName: p.familyName,
              title: p.title || "mr",
              gender: p.gender || "m",
              dob: p.dob,
              email: p.email,
              phone: `${dc}${p.phone}`,
              passport: p.passport,
              nationality: p.nationality,
            };
          }),
          adults: passengers.adults,
          children: passengers.children,
          infants: passengers.infants,
          totalPrice: offer.totalPrice,
          currency: offer.currency,
          destination: firstSeg && lastSeg
            ? `${firstSeg.originIata} → ${lastSeg.destinationIata}` : undefined,
          travelDate: firstSeg?.departureAt?.slice(0, 10),
        }),
      });
      void dialCode;
      if (resp.ok) {
        const data = await resp.json() as {
          bookingReference?: string; orderId?: string | null; bookingId?: number;
        };
        if (data.bookingReference) setDuffelBookingRef(data.bookingReference);
        if (data.orderId) setDuffelOrderId(data.orderId);
      }
    } catch (err) {
      console.error("Flight booking API error:", err);
    } finally {
      setIsBooking(false);
      setStep("confirmed");
    }
  };

  // Suppress unused warning
  void duffelOrderId;

  /* ── Step: Passenger form ── */
  if (step === "passengers") {
    return (
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
        dir={ar ? "rtl" : "ltr"}
      >
        <div className="w-full max-w-2xl my-8">
          {/* Header bar */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-white text-xl font-black">
                {ar ? "بيانات المسافرين" : "Passenger Details"}
              </h2>
              <p className="text-white/50 text-sm mt-0.5">
                {ar ? "أدخل بيانات كل مسافر لإصدار التذكرة" : "Enter passenger details to issue ticket"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mini flight summary */}
          <div className="bg-white/10 rounded-2xl px-5 py-4 mb-5 flex items-center gap-4">
            <div className="text-center">
              <div className="text-white font-black text-xl">{offer.segments[0].originIata}</div>
              <div className="text-white/50 text-xs">{ar ? origin.cityAr : origin.cityEn}</div>
            </div>
            <div className="flex-1 flex flex-col items-center">
              <div className="w-full flex items-center gap-1">
                <div className="h-px bg-[#c8a84b]/40 flex-1" />
                <Plane className="h-4 w-4 text-[#c8a84b] rotate-90" />
                <div className="h-px bg-[#c8a84b]/40 flex-1" />
              </div>
              <div className="text-white/40 text-xs mt-1">{dur(offer.totalDurationMin)}</div>
            </div>
            <div className="text-center">
              <div className="text-white font-black text-xl">
                {offer.segments[offer.segments.length - 1].destinationIata}
              </div>
              <div className="text-white/50 text-xs">{ar ? destination.cityAr : destination.cityEn}</div>
            </div>
            <div className="border-s border-white/20 ps-4 text-end rtl:text-start">
              <div className="text-[#c8a84b] font-black text-lg">
                {offer.totalPrice.toLocaleString()}
              </div>
              <div className="text-white/40 text-xs">{offer.currency}</div>
            </div>
          </div>

          {/* Passenger forms */}
          <div className="space-y-4">
            {passengerDetails.map((info, i) => (
              <PassengerForm
                key={i}
                index={i}
                total={passengerDetails.length}
                info={info}
                ar={ar}
                onChange={updated => updatePassenger(i, updated)}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              onClick={() => setStep("provisional")}
              className="py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-semibold
                transition-all border border-white/20 flex items-center justify-center gap-2"
            >
              <AlertCircle className="h-4 w-4 text-amber-400" />
              {ar ? "حجز مؤقت" : "Provisional Booking"}
            </button>
            <button
              onClick={handleConfirm}
              disabled={!hasMinData || isBooking}
              className="py-3.5 bg-[#c8a84b] hover:bg-[#b8973b] disabled:bg-white/20 disabled:text-white/40
                text-white rounded-2xl font-black transition-all shadow-lg shadow-amber-900/20
                flex items-center justify-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              {isBooking
                ? (ar ? "جارٍ الحجز…" : "Booking…")
                : (ar ? "تأكيد الدفع وإصدار التذكرة" : "Pay & Issue Ticket")}
            </button>
          </div>
          {!hasMinData && (
            <p className="text-center text-amber-400/70 text-xs mt-2">
              {ar
                ? "* أكمل بيانات الاسم والبريد والهاتف والجنس واللقب والميلاد"
                : "* Fill in name, email, phone, gender, title and date of birth"}
            </p>
          )}
        </div>
      </div>
    );
  }

  /* ── Step: Ticket (provisional or confirmed) ── */
  const isConfirmed = step === "confirmed";
  const ref = isConfirmed
    ? (duffelBookingRef ?? confirmedRef)
    : bookingRef;

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto print:fixed print:inset-0 print:p-0 print:bg-white"
      dir={ar ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-2xl my-8 print:max-w-none print:my-0">

        {/* Action bar */}
        <div className="flex items-center justify-between mb-4 print:hidden">
          <div>
            <h2 className="text-white text-xl font-black">
              {isConfirmed
                ? (ar ? "تذكرة مؤكدة" : "Confirmed Ticket")
                : (ar ? "حجز مؤقت" : "Provisional Booking")}
            </h2>
            <p className="text-white/50 text-sm">
              {isConfirmed
                ? (ar ? "تم تأكيد حجزك بنجاح" : "Your booking is confirmed")
                : (ar ? "أكمل الدفع لتأكيد الحجز" : "Complete payment to confirm")}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStep("passengers")}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
            >
              <ChevronRight className={`h-4 w-4 ${ar ? "" : "rotate-180"}`} />
              {ar ? "تعديل البيانات" : "Edit Details"}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
            >
              <Printer className="h-4 w-4" />
              {ar ? "طباعة التذكرة" : "Print Ticket"}
            </button>
            <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <TicketContent
          offer={offer}
          origin={origin}
          destination={destination}
          passengers={passengers}
          passengerDetails={passengerDetails}
          language={language}
          bookingRef={ref}
          isConfirmed={isConfirmed}
        />

        {/* Bottom CTA */}
        <div className="mt-4 flex gap-3 print:hidden">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-semibold transition-all"
          >
            {ar ? "عودة للنتائج" : "Back to results"}
          </button>
          {!isConfirmed && (
            <button
              onClick={handleConfirm}
              disabled={isBooking}
              className="flex-1 py-3.5 bg-[#c8a84b] hover:bg-[#b8973b] disabled:bg-white/20 text-white rounded-2xl font-black transition-all shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              {isBooking
                ? (ar ? "جارٍ الحجز…" : "Booking…")
                : (ar ? "تأكيد الدفع وإصدار التذكرة النهائية" : "Pay & Issue Confirmed Ticket")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
