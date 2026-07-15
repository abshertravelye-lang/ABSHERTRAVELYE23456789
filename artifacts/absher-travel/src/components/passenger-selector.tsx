import { useState, useRef, useEffect } from "react";
import { Users, Plus, Minus, ChevronDown } from "lucide-react";

export interface PassengerConfig {
  adults: number;
  children: number;
  infants: number;
  cabinClass: "economy" | "premium_economy" | "business" | "first";
}

const CABIN_LABELS: Record<PassengerConfig["cabinClass"], { ar: string; en: string }> = {
  economy:         { ar: "درجة اقتصادية",      en: "Economy" },
  premium_economy: { ar: "اقتصادية مميزة",      en: "Premium Economy" },
  business:        { ar: "درجة رجال الأعمال",   en: "Business Class" },
  first:           { ar: "الدرجة الأولى",       en: "First Class" },
};

interface Props {
  value: PassengerConfig;
  onChange: (v: PassengerConfig) => void;
  language: "ar" | "en";
}

function Counter({ label, labelAr, sub, subAr, value, min, max, onChange, language }: { label: string; labelAr: string; sub?: string; subAr?: string; value: number; min: number; max: number; onChange: (v: number) => void; language: "ar" | "en" }) {
  const ar = language === "ar";
  return (
    <div className="flex items-center justify-between py-3.5">
      <div>
        <div className="font-semibold text-slate-700 text-sm">{ar ? labelAr : label}</div>
        {(sub || subAr) && <div className="text-xs text-slate-400 mt-0.5">{ar ? subAr : sub}</div>}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => value > min && onChange(value - 1)}
          disabled={value <= min}
          className="w-8 h-8 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-600 hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-6 text-center font-bold text-slate-800 text-base tabular-nums">{value}</span>
        <button
          type="button"
          onClick={() => value < max && onChange(value + 1)}
          disabled={value >= max}
          className="w-8 h-8 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-600 hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function PassengerSelector({ value, onChange, language }: Props) {
  const ar = language === "ar";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const totalPassengers = value.adults + value.children + value.infants;
  const cabin = CABIN_LABELS[value.cabinClass];

  return (
    <div ref={ref} className="relative w-full">
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
        {ar ? "المسافرون والدرجة" : "Passengers & Class"}
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 bg-white transition-all text-left rtl:text-right ${
          open ? "border-primary shadow-lg shadow-primary/10" : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <Users className={`h-5 w-5 shrink-0 ${open ? "text-primary" : "text-slate-400"} transition-colors`} />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-800 text-sm">
            {totalPassengers} {ar ? (totalPassengers === 1 ? "مسافر" : "مسافرين") : (totalPassengers === 1 ? "passenger" : "passengers")}
          </div>
          <div className="text-xs text-slate-400 truncate">{ar ? cabin.ar : cabin.en}</div>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-3 left-0 right-0 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/60 p-5 min-w-[300px]">
          <div className="divide-y divide-slate-100">
            <Counter label="Adults" labelAr="البالغون" sub="12+ years" subAr="12 سنة فأكثر" value={value.adults} min={1} max={9} onChange={v => onChange({ ...value, adults: v })} language={language} />
            <Counter label="Children" labelAr="الأطفال" sub="2–11 years" subAr="2–11 سنة" value={value.children} min={0} max={8} onChange={v => onChange({ ...value, children: v })} language={language} />
            <Counter label="Infants" labelAr="الرضع" sub="Under 2 years" subAr="أقل من سنتين" value={value.infants} min={0} max={4} onChange={v => onChange({ ...value, infants: v })} language={language} />
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{ar ? "درجة السفر" : "Cabin Class"}</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(CABIN_LABELS) as PassengerConfig["cabinClass"][]).map(cls => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => onChange({ ...value, cabinClass: cls })}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all text-center ${
                    value.cabinClass === cls
                      ? "bg-primary text-white shadow-sm"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {ar ? CABIN_LABELS[cls].ar : CABIN_LABELS[cls].en}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-4 w-full py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            {ar ? "تأكيد" : "Done"}
          </button>
        </div>
      )}
    </div>
  );
}
