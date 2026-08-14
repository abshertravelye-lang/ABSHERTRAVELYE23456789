import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useTranslation } from "@/hooks/use-translation";
import { useListVisas, useListVisaCountries, type Visa } from "@workspace/api-client-react";
import {
  Search, Globe, Clock, ChevronRight, Zap, Star, TrendingUp, Sparkles,
  Filter, X, ChevronDown, DollarSign, Calendar, BadgeCheck, Plane
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ── helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { value: "", ar: "الكل", en: "All" },
  { value: "tourist", ar: "سياحية", en: "Tourist" },
  { value: "business", ar: "تجارية", en: "Business" },
  { value: "visit", ar: "زيارة", en: "Visit" },
  { value: "medical", ar: "طبية", en: "Medical" },
  { value: "study", ar: "دراسية", en: "Study" },
  { value: "umrah", ar: "عمرة", en: "Umrah" },
];

const ENTRY_OPTIONS = [
  { value: "", ar: "أي نوع", en: "Any Entry" },
  { value: "single", ar: "دخول واحد", en: "Single Entry" },
  { value: "multiple", ar: "دخول متعدد", en: "Multiple Entry" },
  { value: "transit", ar: "عبور", en: "Transit" },
];

const SORT_OPTIONS = [
  { value: "recommended", ar: "الموصى بها", en: "Recommended" },
  { value: "price_asc", ar: "الأقل سعراً", en: "Lowest Price" },
  { value: "price_desc", ar: "الأعلى سعراً", en: "Highest Price" },
  { value: "fastest", ar: "الأسرع معالجة", en: "Fastest Processing" },
  { value: "newest", ar: "الأحدث", en: "Newest" },
];

const PROCESSING_OPTIONS = [
  { value: "", ar: "أي مدة", en: "Any Time" },
  { value: "express", ar: "سريعة (1-3 أيام)", en: "Express (1-3 days)" },
  { value: "standard", ar: "عادية (4-7 أيام)", en: "Standard (4-7 days)" },
  { value: "long", ar: "أكثر من أسبوع", en: "Long (>7 days)" },
];

function categoryLabel(cat: string, ar: boolean) {
  const found = CATEGORY_OPTIONS.find(c => c.value === cat);
  return found ? (ar ? found.ar : found.en) : cat;
}

function entryLabel(entry: string, ar: boolean) {
  if (entry === "single") return ar ? "دخول واحد" : "Single";
  if (entry === "multiple") return ar ? "دخول متعدد" : "Multiple";
  if (entry === "transit") return ar ? "عبور" : "Transit";
  return entry;
}

function countryImage(visa: Visa): string {
  if (visa.imageUrl) return visa.imageUrl;
  const code = (visa.countryCode || "").toUpperCase();
  const DEFAULTS: Record<string, string> = {
    SA: "https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=800",
    AE: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800",
    TR: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800",
    TH: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800",
    MY: "https://images.unsplash.com/photo-1508050919630-b135583b29ab?w=800",
    EG: "https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=800",
    OM: "https://images.unsplash.com/photo-1586686507413-3bd73a16eb01?w=800",
    QA: "https://images.unsplash.com/photo-1577475038887-f5b84e77d9c3?w=800",
    JO: "https://images.unsplash.com/photo-1580834341580-8c17a3a630ca?w=800",
    ID: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800",
    SG: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800",
    IN: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800",
    GB: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800",
    FR: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800",
    DE: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800",
    IT: "https://images.unsplash.com/photo-1529260830199-42c24126f198?w=800",
    US: "https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=800",
    CN: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800",
    JP: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800",
    AU: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
  };
  return DEFAULTS[code] || `https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800`;
}

function flagEmoji(code: string): string {
  const c = (code || "").toUpperCase();
  if (c.length !== 2) return "🌍";
  return String.fromCodePoint(...[...c].map(x => 0x1F1E6 + x.charCodeAt(0) - 65));
}

// ── Visa Card ────────────────────────────────────────────────────────────────

function VisaCenterCard({ visa, ar, compact }: { visa: Visa; ar: boolean; compact?: boolean }) {
  const img = countryImage(visa);
  const flag = visa.countryCode ? flagEmoji(visa.countryCode) : "🌍";

  return (
    <div className={`group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col ${compact ? "" : ""}`}>
      {/* Image Header */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={img}
          alt={ar ? visa.countryAr : visa.countryEn}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Flag + Country */}
        <div className="absolute bottom-3 start-3 flex items-center gap-2">
          <span className="text-2xl drop-shadow">{flag}</span>
          <div>
            <div className="text-white font-bold text-sm leading-tight drop-shadow">
              {ar ? visa.countryAr : visa.countryEn}
            </div>
            <div className="text-white/75 text-xs">{categoryLabel(visa.category || "", ar)}</div>
          </div>
        </div>

        {/* Status + Badges */}
        <div className="absolute top-3 start-3 flex flex-col gap-1.5">
          {visa.status === "available" && (
            <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {ar ? "متاحة" : "Available"}
            </span>
          )}
          {visa.entryType === "multiple" && (
            <span className="bg-[#0A2342]/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
              {ar ? "دخول متعدد" : "Multiple Entry"}
            </span>
          )}
        </div>

        {/* Price Badge */}
        <div className="absolute top-3 end-3 bg-[#D4AF37] text-[#0A2342] font-black text-sm px-3 py-1 rounded-xl shadow-lg">
          {Number(visa.fee).toLocaleString()} {visa.currency}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Visa Type */}
        <div className="text-[#0A2342] font-bold text-base leading-tight">
          {ar ? `تأشيرة ${visa.countryAr}` : `${visa.countryEn} Visa`}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-50 rounded-xl p-2 text-center">
            <Clock className="w-4 h-4 text-[#0A2342] mx-auto mb-0.5" />
            <div className="text-[11px] text-slate-500">{ar ? "المعالجة" : "Processing"}</div>
            <div className="text-xs font-bold text-[#0A2342]">{visa.processingDays} {ar ? "يوم" : "days"}</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-2 text-center">
            <Calendar className="w-4 h-4 text-[#0A2342] mx-auto mb-0.5" />
            <div className="text-[11px] text-slate-500">{ar ? "المكوث" : "Stay"}</div>
            <div className="text-xs font-bold text-[#0A2342]">
              {visa.stayDuration ? `${visa.stayDuration} ${ar ? "يوم" : "days"}` : "—"}
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-2 text-center">
            <Plane className="w-4 h-4 text-[#0A2342] mx-auto mb-0.5" />
            <div className="text-[11px] text-slate-500">{ar ? "الدخول" : "Entry"}</div>
            <div className="text-xs font-bold text-[#0A2342]">{entryLabel(visa.entryType, ar)}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-auto">
          <Link href={visa.countryId ? `/visas/${visa.countryId}/${visa.id}` : `/visas/view/${visa.id}`} className="flex-1">
            <button className="w-full text-sm font-semibold py-2.5 rounded-xl border-2 border-[#0A2342] text-[#0A2342] hover:bg-[#0A2342] hover:text-white transition-colors">
              {ar ? "التفاصيل" : "Details"}
            </button>
          </Link>
          <Link href={`/visas/apply/${visa.id}`} className="flex-1">
            <button className="w-full text-sm font-semibold py-2.5 rounded-xl bg-[#D4AF37] text-[#0A2342] hover:bg-[#c9a632] transition-colors">
              {ar ? "تقدم الآن" : "Apply Now"}
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Section ──────────────────────────────────────────────────────────────────

function Section({
  title, icon, visas, ar, viewAllHref,
}: {
  title: string; icon: React.ReactNode; visas: Visa[]; ar: boolean; viewAllHref?: string;
}) {
  if (!visas.length) return null;
  return (
    <div className="mb-14">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0A2342]/5 flex items-center justify-center text-[#0A2342]">
            {icon}
          </div>
          <h2 className="text-xl font-black text-[#0A2342]">{title}</h2>
        </div>
        {viewAllHref && (
          <Link href={viewAllHref} className="text-sm font-semibold text-[#D4AF37] flex items-center gap-1 hover:underline">
            {ar ? "عرض الكل" : "View All"} <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {visas.slice(0, 4).map(v => <VisaCenterCard key={v.id} visa={v} ar={ar} />)}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function Visas() {
  const { language } = useTranslation();
  const ar = language === "ar";

  const { data: visas, isLoading } = useListVisas();
  const { data: countries } = useListVisaCountries({});

  // Allow deep-linking to a pre-selected category, e.g. /visas?category=umrah
  const initialCategory = (() => {
    if (typeof window === "undefined") return "";
    const c = new URLSearchParams(window.location.search).get("category") || "";
    return CATEGORY_OPTIONS.some(o => o.value === c) ? c : "";
  })();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [entryType, setEntryType] = useState("");
  const [processing, setProcessing] = useState("");
  const [sortBy, setSortBy] = useState("recommended");
  const [showAllFilters, setShowAllFilters] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const active = useMemo(() => (visas || []).filter(v => v.isActive && v.status === "available"), [visas]);

  const filtered = useMemo(() => {
    let list = active.filter(v => {
      const name = ar ? v.countryAr : (v.countryEn || v.countryAr);
      const matchSearch = !search ||
        name.toLowerCase().includes(search.toLowerCase()) ||
        (v.visaType || "").toLowerCase().includes(search.toLowerCase());
      const matchCat = !category || v.category === category;
      const matchEntry = !entryType || v.entryType === entryType;
      const matchProc = !processing ||
        (processing === "express" && v.processingDays <= 3) ||
        (processing === "standard" && v.processingDays >= 4 && v.processingDays <= 7) ||
        (processing === "long" && v.processingDays > 7);
      return matchSearch && matchCat && matchEntry && matchProc;
    });

    if (sortBy === "price_asc") list = [...list].sort((a, b) => Number(a.fee) - Number(b.fee));
    else if (sortBy === "price_desc") list = [...list].sort((a, b) => Number(b.fee) - Number(a.fee));
    else if (sortBy === "fastest") list = [...list].sort((a, b) => a.processingDays - b.processingDays);
    else if (sortBy === "newest") list = [...list].sort((a, b) => b.id - a.id);
    return list;
  }, [active, search, category, entryType, processing, sortBy, ar]);

  const featured = useMemo(() => [...active].sort((a, b) => Number(a.fee) - Number(b.fee)).slice(0, 8), [active]);
  const fastApproval = useMemo(() => active.filter(v => v.processingDays <= 3), [active]);
  const multipleEntry = useMemo(() => active.filter(v => v.entryType === "multiple"), [active]);
  const recentlyAdded = useMemo(() => [...active].sort((a, b) => b.id - a.id).slice(0, 4), [active]);

  const isFiltered = !!(search || category || entryType || processing);
  const displayList = showAll ? filtered : filtered.slice(0, 12);

  return (
    <div className="min-h-screen bg-[#F8FAFB]" dir={ar ? "rtl" : "ltr"}>

      {/* ── Hero ── */}
      <div className="relative bg-gradient-to-br from-[#071525] via-[#0A2342] to-[#11315c] pt-20 pb-36 overflow-hidden">
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=2000&auto=format&fit=crop')", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-gradient-to-br from-[#071525]/90 via-[#0A2342]/85 to-[#11315c]/90" />
        <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#D4AF37]/5 blur-3xl rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 px-4 py-2 rounded-full mb-6 text-sm font-bold tracking-wide">
            <Globe className="w-4 h-4" />
            {ar ? "مركز التأشيرات الذكي" : "Smart Visa Center"}
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white mb-5 leading-tight">
            {ar
              ? "تأشيرتك في أسرع وقت ممكن"
              : "Your Visa, Faster Than Ever"}
          </h1>
          <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            {ar
              ? "أكثر من 150 وجهة حول العالم. تقديم ذكي، مراجعة فورية، متابعة لحظية."
              : "150+ destinations worldwide. Smart application, instant review, real-time tracking."}
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <div className="absolute inset-0 bg-[#D4AF37]/20 blur-2xl rounded-3xl" />
            <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center gap-3 px-5 py-3 shadow-2xl focus-within:bg-white/15 transition-all">
              <Search className="w-5 h-5 text-[#D4AF37] shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={ar ? "ابحث عن دولة أو نوع تأشيرة..." : "Search by country or visa type..."}
                className="flex-1 bg-transparent border-none text-white placeholder:text-white/50 focus:outline-none text-base"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-white/60 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-8 mt-12 flex-wrap">
            {[
              { num: `${active.length}+`, label: ar ? "تأشيرة متاحة" : "Available Visas" },
              { num: `${fastApproval.length}+`, label: ar ? "موافقة سريعة" : "Fast Approval" },
              { num: `${countries?.length || 0}+`, label: ar ? "دولة" : "Countries" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-black text-[#D4AF37]">{s.num}</div>
                <div className="text-white/60 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-slate-200 shadow-sm -mt-2">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
            {/* Category Pills */}
            {CATEGORY_OPTIONS.map(c => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                  category === c.value
                    ? "bg-[#0A2342] text-white border-[#0A2342]"
                    : "bg-white text-slate-600 border-slate-200 hover:border-[#0A2342] hover:text-[#0A2342]"
                }`}
              >
                {ar ? c.ar : c.en}
              </button>
            ))}

            <div className="w-px h-6 bg-slate-200 shrink-0 mx-1" />

            {/* Entry Type */}
            <select
              value={entryType}
              onChange={e => setEntryType(e.target.value)}
              className="shrink-0 text-sm font-medium px-3 py-2 rounded-full border border-slate-200 text-slate-600 bg-white focus:outline-none focus:border-[#0A2342] cursor-pointer"
            >
              {ENTRY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{ar ? o.ar : o.en}</option>
              ))}
            </select>

            {/* Processing */}
            <select
              value={processing}
              onChange={e => setProcessing(e.target.value)}
              className="shrink-0 text-sm font-medium px-3 py-2 rounded-full border border-slate-200 text-slate-600 bg-white focus:outline-none focus:border-[#0A2342] cursor-pointer"
            >
              {PROCESSING_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{ar ? o.ar : o.en}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="shrink-0 text-sm font-medium px-3 py-2 rounded-full border border-slate-200 text-slate-600 bg-white focus:outline-none focus:border-[#0A2342] cursor-pointer"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{ar ? o.ar : o.en}</option>
              ))}
            </select>

            {/* Clear Filters */}
            {isFiltered && (
              <button
                onClick={() => { setSearch(""); setCategory(""); setEntryType(""); setProcessing(""); setSortBy("recommended"); }}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full bg-red-50 text-red-600 border border-red-100 text-sm font-medium hover:bg-red-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                {ar ? "مسح" : "Clear"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="container mx-auto px-4 pt-10 pb-24">

        {isLoading ? (
          /* Loading Skeleton */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-slate-100 animate-pulse">
                <div className="h-44 bg-slate-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-16 bg-slate-100 rounded-xl" />
                  <div className="h-10 bg-slate-200 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : isFiltered ? (
          /* Filtered Results */
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-[#0A2342]">
                {ar ? `نتائج البحث (${filtered.length})` : `Search Results (${filtered.length})`}
              </h2>
            </div>
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <Globe className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">{ar ? "لا توجد تأشيرات مطابقة" : "No matching visas found"}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {displayList.map(v => <VisaCenterCard key={v.id} visa={v} ar={ar} />)}
                </div>
                {filtered.length > 12 && (
                  <div className="text-center mt-10">
                    <Button
                      onClick={() => setShowAll(!showAll)}
                      variant="outline"
                      className="px-8 py-3 rounded-xl border-2 border-[#0A2342] text-[#0A2342] font-bold hover:bg-[#0A2342] hover:text-white"
                    >
                      {showAll
                        ? (ar ? "عرض أقل" : "Show Less")
                        : (ar ? `عرض جميع التأشيرات (${filtered.length})` : `Show All (${filtered.length})`)}
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          /* Default Sections */
          <>
            {/* Fast Approval Banner */}
            {fastApproval.length > 0 && (
              <div className="relative bg-gradient-to-r from-[#0A2342] to-[#1E3A5F] rounded-2xl p-6 mb-12 overflow-hidden">
                <div className="absolute end-0 top-0 h-full w-64 opacity-10"
                  style={{ backgroundImage: "url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600')", backgroundSize: "cover" }} />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-[#D4AF37]" />
                      <span className="text-[#D4AF37] font-bold text-sm uppercase tracking-wide">
                        {ar ? "موافقة سريعة" : "Fast Approval"}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-white mb-1">
                      {ar ? `${fastApproval.length} تأشيرة خلال 1-3 أيام` : `${fastApproval.length} Visas in 1-3 Days`}
                    </h3>
                    <p className="text-slate-300 text-sm">
                      {ar ? "ابدأ رحلتك سريعاً مع خدمات التأشيرة الفورية" : "Start your journey fast with instant visa services"}
                    </p>
                  </div>
                  <button
                    onClick={() => setProcessing("express")}
                    className="shrink-0 bg-[#D4AF37] text-[#0A2342] font-bold px-6 py-3 rounded-xl hover:bg-[#c9a632] transition-colors"
                  >
                    {ar ? "استعرض الآن" : "Browse Now"}
                  </button>
                </div>
              </div>
            )}

            {/* Sections */}
            <Section
              title={ar ? "أبرز التأشيرات" : "Featured Visas"}
              icon={<Star className="w-5 h-5" />}
              visas={featured}
              ar={ar}
            />
            <Section
              title={ar ? "موافقة سريعة" : "Fast Approval"}
              icon={<Zap className="w-5 h-5" />}
              visas={fastApproval}
              ar={ar}
            />
            <Section
              title={ar ? "دخول متعدد" : "Multiple Entry"}
              icon={<Plane className="w-5 h-5" />}
              visas={multipleEntry}
              ar={ar}
            />
            <Section
              title={ar ? "أحدث التأشيرات" : "Recently Added"}
              icon={<Sparkles className="w-5 h-5" />}
              visas={recentlyAdded}
              ar={ar}
            />

            {/* All Visas */}
            {active.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#0A2342]/5 flex items-center justify-center text-[#0A2342]">
                    <Globe className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-black text-[#0A2342]">{ar ? "جميع التأشيرات" : "All Visas"}</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {(showAll ? active : active.slice(0, 8)).map(v => <VisaCenterCard key={v.id} visa={v} ar={ar} />)}
                </div>
                {active.length > 8 && (
                  <div className="text-center mt-10">
                    <Button
                      onClick={() => setShowAll(!showAll)}
                      variant="outline"
                      className="px-8 py-3 rounded-xl border-2 border-[#0A2342] text-[#0A2342] font-bold hover:bg-[#0A2342] hover:text-white"
                    >
                      {showAll
                        ? (ar ? "عرض أقل" : "Show Less")
                        : (ar ? `عرض جميع التأشيرات (${active.length})` : `Browse All (${active.length} visas)`)}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
