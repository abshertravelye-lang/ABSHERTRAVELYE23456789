/**
 * ProgramDatePicker — travel/return range picker for tourism-program booking.
 *
 * Follows the FlightDatePicker pattern (portal panel, two months on desktop,
 * one on mobile, RTL-aware, past dates disabled) but works with ISO strings
 * (YYYY-MM-DD) and an OPTIONAL return date, matching the program booking form.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react";

interface ProgramDatePickerProps {
  travelDate: string;  // "" or YYYY-MM-DD
  returnDate: string;  // "" or YYYY-MM-DD (optional field)
  onChange: (patch: { travelDate?: string; returnDate?: string }) => void;
  language: "ar" | "en";
}

/* ─── i18n data ─── */
const AR_MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const EN_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
// Sunday-first order
const AR_DAYS = ["أحد","اثن","ثلا","أرب","خمي","جمع","سبت"];
const EN_DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

/* ─── helpers ─── */
const pad = (n: number) => String(n).padStart(2, "0");
/** Local-timezone ISO date (avoids the UTC shift of toISOString). */
function toISO(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function fromISO(s: string): Date | null {
  if (!s || s.length < 10) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function isInRange(date: Date, from: Date | null, to: Date | null) {
  if (!from || !to) return false;
  const lo = from < to ? from : to;
  const hi = from < to ? to : from;
  return date > lo && date < hi;
}
function fmtDisplay(iso: string, language: "ar" | "en") {
  const date = fromISO(iso);
  if (!date) return null;
  return date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
    day: "numeric", month: "short", year: "numeric",
  });
}

/* ─── CalendarMonth ─── */
interface CalendarMonthProps {
  year: number; month: number;
  language: "ar" | "en";
  travel: Date | null; ret: Date | null;
  hovered: Date | null;
  selecting: "travel" | "return";
  minForReturn: Date | null;
  onSelectDay: (d: Date) => void;
  onHover: (d: Date | null) => void;
}

function CalendarMonth({ year, month, language, travel, ret, hovered, selecting, minForReturn, onSelectDay, onHover }: CalendarMonthProps) {
  const ar = language === "ar";
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay(); // 0=Sun

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(year, month, d));

  // range end for hover preview
  const rangeEnd = ret ?? (selecting === "return" ? hovered : null);

  return (
    <div className="w-full select-none">
      <div className="text-center font-bold text-slate-700 mb-3 text-sm">
        {ar ? AR_MONTHS[month] : EN_MONTHS[month]} {year}
      </div>
      <div className="grid grid-cols-7 mb-1">
        {(ar ? AR_DAYS : EN_DAYS).map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const beforeMin = selecting === "return" && minForReturn ? date < minForReturn : false;
          const disabled = date < today || beforeMin;
          const isTravel = !!(travel && sameDay(date, travel));
          const isReturn = !!(ret && sameDay(date, ret));
          const isToday = sameDay(date, today);
          const inRange = isInRange(date, travel, rangeEnd);

          return (
            <div
              key={i}
              className={`flex items-center justify-center ${inRange ? "bg-[#0A2342]/10" : ""} ${isTravel ? "rounded-s-full" : ""} ${isReturn ? "rounded-e-full" : ""}`}
            >
              <button
                type="button"
                onClick={() => !disabled && onSelectDay(date)}
                onMouseEnter={() => !disabled && onHover(date)}
                onMouseLeave={() => onHover(null)}
                disabled={disabled}
                className={[
                  "w-9 h-9 flex items-center justify-center text-sm font-medium rounded-full my-0.5 transition-all",
                  disabled ? "text-slate-300 cursor-not-allowed" : "cursor-pointer",
                  isTravel || isReturn
                    ? "bg-[#0A2342] text-white font-bold shadow-md shadow-[#0A2342]/30"
                    : !disabled
                    ? `hover:bg-[#0A2342]/20 hover:text-[#0A2342] text-slate-700 ${isToday ? "ring-1 ring-[#D4AF37]" : ""}`
                    : "",
                ].join(" ")}
              >
                {date.getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── usePortalPosition ─── */
function usePortalPosition(triggerRef: React.RefObject<HTMLDivElement | null>, open: boolean) {
  const [style, setStyle] = useState<React.CSSProperties>({});

  const recalc = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const calW = Math.min(640, vw - 24);
    const spaceBelow = vh - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const top = spaceBelow > 340 || spaceBelow >= spaceAbove
      ? rect.bottom + window.scrollY + 8
      : rect.top + window.scrollY - 8;
    const translateY = spaceBelow > 340 || spaceBelow >= spaceAbove ? "0" : "-100%";
    const rawLeft = rect.left + window.scrollX;
    const left = Math.min(rawLeft, window.scrollX + vw - calW - 8);
    setStyle({ position: "absolute", top, left, width: calW, transform: `translateY(${translateY})`, zIndex: 9999 });
  }, [triggerRef]);

  useEffect(() => {
    if (!open) return;
    recalc();
    window.addEventListener("scroll", recalc, true);
    window.addEventListener("resize", recalc);
    return () => { window.removeEventListener("scroll", recalc, true); window.removeEventListener("resize", recalc); };
  }, [open, recalc]);

  return style;
}

/* ─── Main component ─── */
export function ProgramDatePicker({ travelDate, returnDate, onChange, language }: ProgramDatePickerProps) {
  const ar = language === "ar";
  const [open, setOpen] = useState(false);
  const [selecting, setSelecting] = useState<"travel" | "return">("travel");
  const [hovered, setHovered] = useState<Date | null>(null);
  const [viewDate, setViewDate] = useState(() => {
    const d = fromISO(travelDate) ?? new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const travel = fromISO(travelDate);
  const ret = fromISO(returnDate);

  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const portalStyle = usePortalPosition(triggerRef, open);

  /* close on outside click */
  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  /* nav */
  const prev = () => setViewDate(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 });
  const next = () => setViewDate(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 });
  const nextView = { year: viewDate.month === 11 ? viewDate.year + 1 : viewDate.year, month: viewDate.month === 11 ? 0 : viewDate.month + 1 };

  /* selection logic */
  const handleSelectDay = (date: Date) => {
    if (selecting === "travel") {
      const clearReturn = ret && date > ret;
      onChange({ travelDate: toISO(date), ...(clearReturn ? { returnDate: "" } : {}) });
      setSelecting("return");
    } else {
      if (travel && date < travel) {
        // picked before the travel date → treat as the new travel date
        onChange({ travelDate: toISO(date), returnDate: "" });
        setSelecting("return");
      } else {
        onChange({ returnDate: toISO(date) });
        setOpen(false);
      }
    }
  };

  const openFor = (mode: "travel" | "return") => {
    const base = fromISO(mode === "return" ? (travelDate || "") : travelDate) ?? new Date();
    setViewDate({ year: base.getFullYear(), month: base.getMonth() });
    setSelecting(mode);
    setOpen(true);
  };

  const clearReturn = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ returnDate: "" });
  };

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  const panel = open && createPortal(
    <>
      {isMobile && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
          onMouseDown={() => setOpen(false)}
        />
      )}

      <div
        ref={panelRef}
        dir={ar ? "rtl" : "ltr"}
        style={isMobile
          ? { position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999, borderRadius: "24px 24px 0 0", maxHeight: "90vh", overflowY: "auto" }
          : portalStyle}
        className="bg-white border border-slate-200 shadow-2xl shadow-slate-300/40 rounded-3xl p-5"
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <button type="button" onClick={prev} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors">
            {ar ? <ChevronRight className="h-4 w-4 text-slate-500" /> : <ChevronLeft className="h-4 w-4 text-slate-500" />}
          </button>

          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-full text-xs">
            <button
              type="button"
              onClick={() => setSelecting("travel")}
              className={`px-3 py-1 rounded-full font-bold transition-all ${selecting === "travel" ? "bg-[#0A2342] text-white shadow" : "text-slate-500"}`}
            >
              {ar ? "السفر" : "Travel"}
            </button>
            <button
              type="button"
              onClick={() => setSelecting("return")}
              className={`px-3 py-1 rounded-full font-bold transition-all ${selecting === "return" ? "bg-[#0A2342] text-white shadow" : "text-slate-500"}`}
            >
              {ar ? "العودة" : "Return"}
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button type="button" onClick={next} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors">
              {ar ? <ChevronLeft className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors ms-1">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Two-month grid (single on mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <CalendarMonth
            {...viewDate} language={language}
            travel={travel} ret={ret}
            hovered={hovered} selecting={selecting}
            minForReturn={travel}
            onSelectDay={handleSelectDay} onHover={setHovered}
          />
          <div className="hidden sm:block border-l border-slate-100 pl-6 rtl:border-r rtl:border-l-0 rtl:pr-6 rtl:pl-0">
            <CalendarMonth
              {...nextView} language={language}
              travel={travel} ret={ret}
              hovered={hovered} selecting={selecting}
              minForReturn={travel}
              onSelectDay={handleSelectDay} onHover={setHovered}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-4 text-sm text-slate-500">
            {travelDate && (
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#0A2342]" />
                <span>{fmtDisplay(travelDate, language)}</span>
              </div>
            )}
            {returnDate && (
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#0A2342]/40" />
                <span>{fmtDisplay(returnDate, language)}</span>
              </div>
            )}
            {!returnDate && (
              <span className="text-xs text-slate-400 self-center">
                {ar ? "تاريخ العودة اختياري" : "Return date is optional"}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="bg-[#0A2342] hover:bg-[#0A2342]/90 text-white text-sm font-bold px-5 py-2 rounded-xl transition-colors"
          >
            {ar ? "تأكيد" : "Done"}
          </button>
        </div>
      </div>
    </>,
    document.body
  );

  /* ── Trigger UI (joined dual trigger, like the flight picker) ── */
  return (
    <div ref={triggerRef} className="relative w-full">
      <div className="flex divide-x rtl:divide-x-reverse divide-slate-200">
        {/* Travel trigger */}
        <button
          type="button"
          onClick={() => openFor("travel")}
          className={[
            "flex-1 flex items-center gap-3 px-4 py-3.5 bg-slate-50 border-2 transition-all text-start rounded-s-2xl border-e-0 min-w-0",
            open && selecting === "travel"
              ? "border-[#0A2342] bg-white shadow-lg shadow-[#0A2342]/10"
              : "border-slate-200 hover:border-slate-300",
          ].join(" ")}
        >
          <Calendar className={`h-5 w-5 shrink-0 ${open && selecting === "travel" ? "text-[#0A2342]" : "text-slate-400"}`} />
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
              {ar ? "تاريخ السفر *" : "Travel Date *"}
            </div>
            {travelDate
              ? <div className="font-bold text-slate-800 text-sm leading-tight mt-0.5">{fmtDisplay(travelDate, language)}</div>
              : <div className="text-slate-300 text-sm mt-0.5">{ar ? "اختر تاريخ" : "Select date"}</div>}
          </div>
        </button>

        {/* Return trigger */}
        <button
          type="button"
          onClick={() => openFor("return")}
          className={[
            "flex-1 flex items-center gap-3 px-4 py-3.5 bg-slate-50 border-2 transition-all text-start rounded-e-2xl min-w-0",
            open && selecting === "return"
              ? "border-[#0A2342] bg-white shadow-lg shadow-[#0A2342]/10"
              : "border-slate-200 hover:border-slate-300",
          ].join(" ")}
        >
          <Calendar className={`h-5 w-5 shrink-0 ${open && selecting === "return" ? "text-[#0A2342]" : "text-slate-400"}`} />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
              {ar ? "تاريخ العودة (اختياري)" : "Return (optional)"}
            </div>
            {returnDate
              ? <div className="font-bold text-slate-800 text-sm leading-tight mt-0.5">{fmtDisplay(returnDate, language)}</div>
              : <div className="text-slate-300 text-sm mt-0.5">{ar ? "اختر تاريخ العودة" : "Select return"}</div>}
          </div>
          {returnDate && (
            <span
              role="button"
              tabIndex={0}
              onClick={clearReturn}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") clearReturn(e as unknown as React.MouseEvent); }}
              className="w-7 h-7 shrink-0 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              aria-label={ar ? "مسح تاريخ العودة" : "Clear return date"}
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </button>
      </div>

      {panel}
    </div>
  );
}
