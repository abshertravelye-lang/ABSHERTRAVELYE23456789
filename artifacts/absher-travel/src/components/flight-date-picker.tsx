import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react";

/* ─── types ─── */
interface DateRange {
  departure: Date | null;
  returnDate: Date | null;
}

interface FlightDatePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  language: "ar" | "en";
  isRoundTrip: boolean;
  labelDepart?: string;
  labelDepartAr?: string;
  labelReturn?: string;
  labelReturnAr?: string;
}

/* ─── i18n data ─── */
const AR_MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const EN_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
// Sunday-first order
const AR_DAYS  = ["أحد","اثن","ثلا","أرب","خمي","جمع","سبت"];
const EN_DAYS  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

/* ─── helpers ─── */
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}
function isInRange(date: Date, from: Date | null, to: Date | null) {
  if (!from || !to) return false;
  const lo = from < to ? from : to;
  const hi = from < to ? to   : from;
  return date > lo && date < hi;
}
function fmtDisplay(date: Date | null, language: "ar" | "en") {
  if (!date) return null;
  return date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
    day: "numeric", month: "short", year: "numeric",
  });
}

/* ─── CalendarMonth ─── */
interface CalendarMonthProps {
  year: number; month: number;
  language: "ar" | "en";
  departure: Date | null; returnDate: Date | null;
  hovered: Date | null;
  selecting: "departure" | "return";
  onSelectDay: (d: Date) => void;
  onHover: (d: Date | null) => void;
}

function CalendarMonth({ year, month, language, departure, returnDate, hovered, selecting, onSelectDay, onHover }: CalendarMonthProps) {
  const ar = language === "ar";
  const today = new Date(); today.setHours(0,0,0,0);

  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay(); // 0=Sun

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(year, month, d));

  // range end for hover preview
  const rangeEnd = returnDate ?? (selecting === "return" ? hovered : null);

  return (
    <div className="w-full select-none">
      <div className="text-center font-bold text-slate-700 mb-3 text-sm">
        {ar ? AR_MONTHS[month] : EN_MONTHS[month]} {year}
      </div>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {(ar ? AR_DAYS : EN_DAYS).map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</div>
        ))}
      </div>
      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const isPast  = date < today;
          const isDep   = !!(departure  && sameDay(date, departure));
          const isRet   = !!(returnDate && sameDay(date, returnDate));
          const inRange = isInRange(date, departure, rangeEnd);

          return (
            <div
              key={i}
              className={`flex items-center justify-center ${inRange ? "bg-primary/10" : ""} ${isDep ? "rounded-s-full" : ""} ${isRet ? "rounded-e-full" : ""}`}
            >
              <button
                onClick={() => !isPast && onSelectDay(date)}
                onMouseEnter={() => !isPast && onHover(date)}
                onMouseLeave={() => onHover(null)}
                disabled={isPast}
                className={[
                  "w-9 h-9 flex items-center justify-center text-sm font-medium rounded-full my-0.5 transition-all",
                  isPast  ? "text-slate-300 cursor-not-allowed" : "cursor-pointer",
                  isDep || isRet
                    ? "bg-primary text-white font-bold shadow-md shadow-primary/30"
                    : !isPast ? "hover:bg-primary/20 hover:text-primary text-slate-700" : "",
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
    // try below; if not enough room flip above
    const spaceBelow = vh - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const top = spaceBelow > 340 || spaceBelow >= spaceAbove
      ? rect.bottom + window.scrollY + 8
      : rect.top  + window.scrollY - 8; // we'll translate upward
    const translateY = spaceBelow > 340 || spaceBelow >= spaceAbove ? "0" : "-100%";
    // left alignment (cap to viewport)
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
export function FlightDatePicker({
  value, onChange, language, isRoundTrip,
  labelDepart, labelDepartAr, labelReturn, labelReturnAr,
}: FlightDatePickerProps) {
  const ar = language === "ar";
  const [open, setOpen]           = useState(false);
  const [selecting, setSelecting] = useState<"departure" | "return">("departure");
  const [hovered, setHovered]     = useState<Date | null>(null);
  const [viewDate, setViewDate]   = useState(() => {
    const d = value.departure ?? new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef   = useRef<HTMLDivElement>(null);
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
  const prev = () => setViewDate(v => v.month === 0  ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 });
  const next = () => setViewDate(v => v.month === 11 ? { year: v.year + 1, month: 0  } : { ...v, month: v.month + 1 });
  const nextView = { year: viewDate.month === 11 ? viewDate.year + 1 : viewDate.year, month: viewDate.month === 11 ? 0 : viewDate.month + 1 };

  /* selection logic */
  const handleSelectDay = (date: Date) => {
    if (selecting === "departure") {
      const newReturn = value.returnDate && date > value.returnDate ? null : value.returnDate;
      onChange({ departure: date, returnDate: newReturn });
      if (isRoundTrip) setSelecting("return");
      else setOpen(false);
    } else {
      if (value.departure && date < value.departure) {
        onChange({ departure: date, returnDate: null });
        setSelecting("return");
      } else {
        onChange({ ...value, returnDate: date });
        setOpen(false);
      }
    }
  };

  /* trigger actions */
  const openFor = (mode: "departure" | "return") => {
    setSelecting(mode);
    setOpen(true);
  };

  /* ── Calendar panel (rendered in Portal) ── */
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  const panel = open && createPortal(
    <>
      {/* Mobile: dim backdrop */}
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
          <button onClick={prev} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors">
            {ar ? <ChevronRight className="h-4 w-4 text-slate-500" /> : <ChevronLeft className="h-4 w-4 text-slate-500" />}
          </button>

          <div className="flex items-center gap-2">
            {isRoundTrip && (
              <div className="flex gap-1.5 bg-slate-100 p-1 rounded-full text-xs">
                <button
                  onClick={() => setSelecting("departure")}
                  className={`px-3 py-1 rounded-full font-bold transition-all ${selecting === "departure" ? "bg-primary text-white shadow" : "text-slate-500"}`}
                >
                  {ar ? "الذهاب" : "Depart"}
                </button>
                <button
                  onClick={() => setSelecting("return")}
                  className={`px-3 py-1 rounded-full font-bold transition-all ${selecting === "return" ? "bg-primary text-white shadow" : "text-slate-500"}`}
                >
                  {ar ? "العودة" : "Return"}
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button onClick={next} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors">
              {ar ? <ChevronLeft className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
            </button>
            <button onClick={() => setOpen(false)} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors ms-1">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Two-month grid (single on mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <CalendarMonth
            {...viewDate} language={language}
            departure={value.departure} returnDate={value.returnDate}
            hovered={hovered} selecting={selecting}
            onSelectDay={handleSelectDay} onHover={setHovered}
          />
          <div className="hidden sm:block border-l border-slate-100 pl-6 rtl:border-r rtl:border-l-0 rtl:pr-6 rtl:pl-0">
            <CalendarMonth
              {...nextView} language={language}
              departure={value.departure} returnDate={value.returnDate}
              hovered={hovered} selecting={selecting}
              onSelectDay={handleSelectDay} onHover={setHovered}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex gap-4 text-sm text-slate-500">
            {value.departure && (
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span>{fmtDisplay(value.departure, language)}</span>
              </div>
            )}
            {value.returnDate && (
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-primary/40" />
                <span>{fmtDisplay(value.returnDate, language)}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setOpen(false)}
            className="bg-primary hover:bg-primary/90 text-white text-sm font-bold px-5 py-2 rounded-xl transition-colors"
          >
            {ar ? "تأكيد" : "Done"}
          </button>
        </div>
      </div>
    </>,
    document.body
  );

  /* ── Trigger UI ── */
  return (
    <div ref={triggerRef} className="relative w-full">
      <div className={`flex ${isRoundTrip ? "divide-x rtl:divide-x-reverse divide-slate-200" : ""}`}>

        {/* Departure trigger */}
        <button
          type="button"
          onClick={() => openFor("departure")}
          className={[
            "flex-1 flex items-center gap-3 px-4 py-3.5 bg-white border-2 transition-all text-start",
            isRoundTrip
              ? "rounded-s-2xl border-e-0"
              : "rounded-2xl",
            open && selecting === "departure"
              ? "border-primary shadow-lg shadow-primary/10"
              : "border-slate-200 hover:border-slate-300",
          ].join(" ")}
        >
          <Calendar className={`h-5 w-5 shrink-0 ${open && selecting === "departure" ? "text-primary" : "text-slate-400"}`} />
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
              {ar ? labelDepartAr : labelDepart}
            </div>
            {value.departure
              ? <div className="font-bold text-slate-800 text-sm leading-tight mt-0.5">{fmtDisplay(value.departure, language)}</div>
              : <div className="text-slate-300 text-sm mt-0.5">{ar ? "اختر تاريخ" : "Select date"}</div>}
          </div>
        </button>

        {/* Return trigger */}
        {isRoundTrip && (
          <button
            type="button"
            onClick={() => openFor("return")}
            className={[
              "flex-1 flex items-center gap-3 px-4 py-3.5 bg-white border-2 transition-all text-start rounded-e-2xl",
              open && selecting === "return"
                ? "border-primary shadow-lg shadow-primary/10"
                : "border-slate-200 hover:border-slate-300",
            ].join(" ")}
          >
            <Calendar className={`h-5 w-5 shrink-0 ${open && selecting === "return" ? "text-primary" : "text-slate-400"}`} />
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
                {ar ? labelReturnAr : labelReturn}
              </div>
              {value.returnDate
                ? <div className="font-bold text-slate-800 text-sm leading-tight mt-0.5">{fmtDisplay(value.returnDate, language)}</div>
                : <div className="text-slate-300 text-sm mt-0.5">{ar ? "اختر تاريخ العودة" : "Select return"}</div>}
            </div>
          </button>
        )}
      </div>

      {panel}
    </div>
  );
}
