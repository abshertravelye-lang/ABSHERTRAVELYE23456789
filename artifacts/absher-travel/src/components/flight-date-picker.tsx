import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

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

const AR_MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const EN_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const AR_DAYS = ["أح","اث","ث","أر","خ","ج","س"];
const EN_DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function isInRange(date: Date, from: Date | null, to: Date | null) {
  if (!from || !to) return false;
  return date > from && date < to;
}

interface CalendarMonthProps {
  year: number;
  month: number;
  language: "ar" | "en";
  departure: Date | null;
  returnDate: Date | null;
  hovered: Date | null;
  selecting: "departure" | "return";
  onSelectDay: (d: Date) => void;
  onHover: (d: Date | null) => void;
}

function CalendarMonth({ year, month, language, departure, returnDate, hovered, selecting, onSelectDay, onHover }: CalendarMonthProps) {
  const ar = language === "ar";
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay(); // 0=Sun

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(year, month, d));

  const rangeEnd = returnDate || (selecting === "return" ? hovered : null);

  return (
    <div className="w-full">
      <div className="text-center font-bold text-slate-700 mb-4 text-sm tracking-wide">
        {ar ? AR_MONTHS[month] : EN_MONTHS[month]} {year}
      </div>
      <div className="grid grid-cols-7 mb-2">
        {(ar ? AR_DAYS : EN_DAYS).map(d => (
          <div key={d} className="text-center text-xs font-semibold text-slate-400 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;

          const isPast = date < today;
          const isDep = departure && sameDay(date, departure);
          const isRet = returnDate && sameDay(date, returnDate);
          const inRange = isInRange(date, departure, rangeEnd);
          const isStart = isDep;
          const isEnd = isRet;

          return (
            <div
              key={i}
              className={`relative flex items-center justify-center ${inRange ? (ar ? "bg-primary/10" : "bg-primary/10") : ""} ${isStart ? "rounded-l-full rtl:rounded-r-full rtl:rounded-l-none" : ""} ${isEnd ? "rounded-r-full rtl:rounded-l-full rtl:rounded-r-none" : ""}`}
            >
              <button
                onClick={() => !isPast && onSelectDay(date)}
                onMouseEnter={() => !isPast && onHover(date)}
                onMouseLeave={() => onHover(null)}
                disabled={isPast}
                className={`
                  w-9 h-9 flex items-center justify-center text-sm font-medium rounded-full transition-all my-0.5
                  ${isPast ? "text-slate-300 cursor-not-allowed" : "cursor-pointer"}
                  ${isDep || isRet ? "bg-primary text-white font-bold shadow-md shadow-primary/30" : ""}
                  ${!isPast && !isDep && !isRet ? "hover:bg-primary/20 hover:text-primary text-slate-700" : ""}
                `}
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

function formatDate(date: Date | null, language: "ar" | "en") {
  if (!date) return null;
  return date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", { day: "numeric", month: "short", year: "numeric" });
}

export function FlightDatePicker({ value, onChange, language, isRoundTrip, labelDepart, labelDepartAr, labelReturn, labelReturnAr }: FlightDatePickerProps) {
  const ar = language === "ar";
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => {
    const d = value.departure ?? new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selecting, setSelecting] = useState<"departure" | "return">("departure");
  const [hovered, setHovered] = useState<Date | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const prevMonth = () => {
    setViewDate(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 });
  };
  const nextMonth = () => {
    setViewDate(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 });
  };
  const nextViewDate = { year: viewDate.month === 11 ? viewDate.year + 1 : viewDate.year, month: viewDate.month === 11 ? 0 : viewDate.month + 1 };

  const handleSelectDay = (date: Date) => {
    if (selecting === "departure") {
      onChange({ departure: date, returnDate: value.returnDate && date > value.returnDate ? null : value.returnDate });
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

  const openDepart = () => { setSelecting("departure"); setOpen(true); };
  const openReturn = () => { setSelecting("return"); setOpen(true); };

  return (
    <div ref={ref} className="relative w-full">
      <div className={`flex ${isRoundTrip ? "divide-x rtl:divide-x-reverse divide-slate-200" : ""}`}>
        {/* Departure */}
        <button
          type="button"
          onClick={openDepart}
          className={`flex-1 flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 bg-white transition-all text-left rtl:text-right ${
            open && selecting === "departure" ? "border-primary shadow-lg shadow-primary/10" : "border-slate-200 hover:border-slate-300"
          } ${isRoundTrip ? "rounded-r-none rtl:rounded-l-none rtl:rounded-r-2xl border-r-0 rtl:border-r-2 rtl:border-l-0" : ""}`}
        >
          <Calendar className={`h-5 w-5 shrink-0 ${open && selecting === "departure" ? "text-primary" : "text-slate-400"}`} />
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-tight">
              {ar ? labelDepartAr : labelDepart}
            </div>
            {value.departure ? (
              <div className="font-bold text-slate-800 text-sm leading-tight">{formatDate(value.departure, language)}</div>
            ) : (
              <div className="text-slate-300 text-sm">{ar ? "اختر تاريخ" : "Select date"}</div>
            )}
          </div>
        </button>

        {/* Return */}
        {isRoundTrip && (
          <button
            type="button"
            onClick={openReturn}
            className={`flex-1 flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 bg-white transition-all text-left rtl:text-right ${
              open && selecting === "return" ? "border-primary shadow-lg shadow-primary/10" : "border-slate-200 hover:border-slate-300"
            } rounded-l-none rtl:rounded-r-none rtl:rounded-l-2xl`}
          >
            <Calendar className={`h-5 w-5 shrink-0 ${open && selecting === "return" ? "text-primary" : "text-slate-400"}`} />
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-tight">
                {ar ? labelReturnAr : labelReturn}
              </div>
              {value.returnDate ? (
                <div className="font-bold text-slate-800 text-sm leading-tight">{formatDate(value.returnDate, language)}</div>
              ) : (
                <div className="text-slate-300 text-sm">{ar ? "اختر تاريخ العودة" : "Select return"}</div>
              )}
            </div>
          </button>
        )}
      </div>

      {/* Calendar popup */}
      {open && (
        <div className="absolute top-full mt-3 z-50 bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-300/40 p-6 w-full md:w-[620px] left-0 rtl:right-0 rtl:left-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
              <ChevronLeft className="h-4 w-4 text-slate-500 rtl:rotate-180" />
            </button>
            <div className="flex items-center gap-2">
              {isRoundTrip && (
                <div className="flex gap-2 text-xs">
                  <button
                    onClick={() => setSelecting("departure")}
                    className={`px-3 py-1.5 rounded-full font-semibold transition-all ${selecting === "departure" ? "bg-primary text-white" : "bg-slate-100 text-slate-500"}`}
                  >
                    {ar ? "الذهاب" : "Depart"}
                  </button>
                  <button
                    onClick={() => setSelecting("return")}
                    className={`px-3 py-1.5 rounded-full font-semibold transition-all ${selecting === "return" ? "bg-primary text-white" : "bg-slate-100 text-slate-500"}`}
                  >
                    {ar ? "العودة" : "Return"}
                  </button>
                </div>
              )}
            </div>
            <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
              <ChevronRight className="h-4 w-4 text-slate-500 rtl:rotate-180" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CalendarMonth {...viewDate} language={language} departure={value.departure} returnDate={value.returnDate} hovered={hovered} selecting={selecting} onSelectDay={handleSelectDay} onHover={setHovered} />
            <CalendarMonth {...nextViewDate} language={language} departure={value.departure} returnDate={value.returnDate} hovered={hovered} selecting={selecting} onSelectDay={handleSelectDay} onHover={setHovered} />
          </div>

          {/* Selection summary */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
            <div className="flex gap-4">
              {value.departure && (
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span>{formatDate(value.departure, language)}</span>
                </div>
              )}
              {value.returnDate && (
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-primary/50" />
                  <span>{formatDate(value.returnDate, language)}</span>
                </div>
              )}
            </div>
            <button onClick={() => setOpen(false)} className="text-primary font-semibold hover:text-primary/80 transition-colors">
              {ar ? "تأكيد" : "Done"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
