/**
 * PhoneDialInput — shared web component for phone number entry with country dial-code picker.
 * Used in: register.tsx, account.tsx (phone + WhatsApp fields).
 *
 * All country/dial-code data comes from the canonical @workspace/countries
 * exports (DIAL_COUNTRIES / parseInternationalPhone / buildInternationalPhone)
 * — no local copies, so web and mobile can never diverge.
 */

import { useMemo, useState } from "react";
import {
  DIAL_COUNTRIES,
  getDialCode,
  parseInternationalPhone,
  buildInternationalPhone,
  type CountryOption,
} from "@workspace/countries";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, Search } from "lucide-react";

/* Arab/common countries shown first, then the rest alphabetically (nameEn order from source) */
const PRIORITY_CODES = ["SA","AE","OM","KW","QA","BH","EG","JO","IQ","SY","LB","MA","DZ","TN","LY","SD","SO","MR","PS","DJ","KM","YE"];
export const DIAL_CODE_OPTIONS: CountryOption[] = [
  ...PRIORITY_CODES.map((code) => DIAL_COUNTRIES.find((c) => c.code === code)).filter(
    (c): c is CountryOption => Boolean(c),
  ),
  ...DIAL_COUNTRIES.filter((c) => !PRIORITY_CODES.includes(c.code)),
];

/** Parse "+966501234567" → { dialCode: "SA", local: "501234567" } (canonical logic). */
export function parseFullPhone(full: string): { dialCode: string; local: string } {
  const { countryCode, local } = parseInternationalPhone(full);
  return { dialCode: countryCode, local };
}

/** Build "+966501234567" from parts. Returns "" when local is empty (explicit clear). */
export function buildFullPhone(dialCode: string, local: string): string {
  return buildInternationalPhone(dialCode, local);
}

export function PhoneDialInput({
  value, dialCode, onValueChange, onDialChange, ar, placeholder, className,
}: {
  value: string;
  dialCode: string;
  onValueChange: (v: string) => void;
  onDialChange: (v: string) => void;
  ar: boolean;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected =
    DIAL_CODE_OPTIONS.find((c) => c.code === dialCode) ??
    DIAL_CODE_OPTIONS.find((c) => c.code === "SA")!;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return DIAL_CODE_OPTIONS;
    return DIAL_CODE_OPTIONS.filter(
      (c) =>
        c.nameAr.toLowerCase().includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q),
    );
  }, [search]);

  return (
    <div className={`flex border border-slate-200 rounded-xl overflow-hidden bg-slate-50 focus-within:ring-2 focus-within:ring-[#0d2351]/20 focus-within:border-[#0d2351]/40 transition-all ${className ?? ""}`}>
      <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) setSearch(""); }}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-2.5 border-e border-slate-200 bg-slate-100 hover:bg-slate-200 transition-colors shrink-0 text-sm font-medium text-slate-700"
          >
            <span className="text-base leading-none">{selected.flag}</span>
            <span className="text-xs text-slate-500 font-mono">{getDialCode(selected.code)}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-1" align={ar ? "end" : "start"}>
          <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-slate-100 mb-1">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={ar ? "بحث..." : "Search..."}
              className="w-full bg-transparent text-sm focus:outline-none placeholder:text-slate-300"
            />
          </div>
          <div className="max-h-60 overflow-y-auto space-y-0.5">
            {filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => { onDialChange(c.code); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-start ${
                  dialCode === c.code
                    ? "bg-[#0d2351]/10 text-[#0d2351] font-semibold"
                    : "hover:bg-slate-100 text-slate-700"
                }`}
              >
                <span className="text-base leading-none">{c.flag}</span>
                <span className="font-mono text-xs text-slate-500 w-12 shrink-0">{c.dialCode}</span>
                <span className="truncate">{ar ? c.nameAr : c.nameEn}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-slate-400">
                {ar ? "لا نتائج" : "No results"}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
      <input
        type="tel"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder ?? "7xxxxxxxx"}
        className="flex-1 px-3 py-2.5 bg-transparent text-sm text-slate-800 focus:outline-none placeholder:text-slate-300"
        dir="ltr"
      />
    </div>
  );
}
