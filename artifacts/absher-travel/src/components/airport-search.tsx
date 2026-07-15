import { useState, useRef, useEffect, useCallback } from "react";
import { searchAirports, Airport } from "@/data/airports";
import { PlaneTakeoff, PlaneLanding, MapPin } from "lucide-react";

interface AirportSearchProps {
  value: Airport | null;
  onChange: (airport: Airport) => void;
  placeholder?: string;
  placeholderAr?: string;
  language: "ar" | "en";
  icon?: "takeoff" | "landing";
  label?: string;
  labelAr?: string;
}

const COUNTRY_FLAGS: Record<string, string> = {
  EG: "🇪🇬", SA: "🇸🇦", AE: "🇦🇪", KW: "🇰🇼", BH: "🇧🇭", QA: "🇶🇦", OM: "🇴🇲",
  TR: "🇹🇷", MA: "🇲🇦", TN: "🇹🇳", LY: "🇱🇾", JO: "🇯🇴", LB: "🇱🇧", IQ: "🇮🇶",
  GB: "🇬🇧", FR: "🇫🇷", DE: "🇩🇪", IT: "🇮🇹", ES: "🇪🇸", NL: "🇳🇱",
  TH: "🇹🇭", MY: "🇲🇾", SG: "🇸🇬", IN: "🇮🇳", MV: "🇲🇻", JP: "🇯🇵", ID: "🇮🇩",
};

export function AirportSearch({ value, onChange, language, icon = "takeoff", label, labelAr }: AirportSearchProps) {
  const ar = language === "ar";
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Airport[]>([]);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleQuery = useCallback((q: string) => {
    setQuery(q);
    if (q.length >= 1) {
      setResults(searchAirports(q));
      setOpen(true);
    } else {
      setResults([]);
      setOpen(false);
    }
  }, []);

  const handleSelect = (airport: Airport) => {
    onChange(airport);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setOpen(false);
      setFocused(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const Icon = icon === "takeoff" ? PlaneTakeoff : PlaneLanding;
  const flag = value ? COUNTRY_FLAGS[value.countryCode] ?? "✈️" : null;

  return (
    <div ref={containerRef} className="relative w-full">
      {(label || labelAr) && (
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
          {ar ? labelAr : label}
        </label>
      )}
      <div
        className={`relative flex items-center rounded-2xl border-2 transition-all bg-white cursor-text ${
          focused ? "border-primary shadow-lg shadow-primary/10" : "border-slate-200 hover:border-slate-300"
        }`}
        onClick={() => { inputRef.current?.focus(); setFocused(true); }}
      >
        <div className="flex items-center pl-4 rtl:pr-4 rtl:pl-0 shrink-0 gap-2">
          <Icon className={`h-5 w-5 ${focused ? "text-primary" : "text-slate-400"} transition-colors`} />
        </div>

        <div className="flex-1 min-w-0 py-3.5 px-3">
          {value && !focused && !query ? (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-2xl text-primary tracking-wider">{value.iata}</span>
                {flag && <span className="text-base">{flag}</span>}
              </div>
              <div className="text-xs text-slate-500 truncate leading-tight">
                {ar ? value.cityAr : value.cityEn} · {ar ? value.countryAr : value.countryEn}
              </div>
            </div>
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => handleQuery(e.target.value)}
              onFocus={() => { setFocused(true); if (query.length >= 1) setOpen(true); }}
              placeholder={ar ? (value ? `${value.iata} — ${value.cityAr}` : "المدينة أو المطار أو IATA") : (value ? `${value.iata} — ${value.cityEn}` : "City, airport or IATA code")}
              className="w-full bg-transparent outline-none text-slate-800 placeholder:text-slate-300 text-sm font-medium"
              dir="auto"
              autoComplete="off"
            />
          )}
        </div>

        {value && (
          <div className="pr-4 rtl:pl-4 rtl:pr-0 shrink-0 text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-xl m-1.5">
            {value.iata}
          </div>
        )}
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/60 overflow-hidden max-h-72 overflow-y-auto">
          {results.map((airport, i) => {
            const f = COUNTRY_FLAGS[airport.countryCode] ?? "✈️";
            return (
              <button
                key={airport.iata}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(airport); }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-primary/5 transition-colors text-left rtl:text-right ${i !== 0 ? "border-t border-slate-50" : ""}`}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                  <span className="text-xl">{f}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-primary text-base">{airport.iata}</span>
                    <span className="text-sm font-semibold text-slate-800 truncate">
                      {ar ? airport.cityAr : airport.cityEn}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 truncate">
                    {ar ? airport.nameAr : airport.nameEn} · {ar ? airport.countryAr : airport.countryEn}
                  </div>
                </div>
                <div className="shrink-0">
                  <MapPin className="h-4 w-4 text-slate-300" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {open && query.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-6 text-center text-sm text-slate-400">
          {ar ? `لا توجد مطارات مطابقة لـ "${query}"` : `No airports found for "${query}"`}
        </div>
      )}
    </div>
  );
}
