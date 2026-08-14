/**
 * Visa detail page that works with just a visaId (no countryId needed).
 * Used when countryId is null in the visas table.
 */
import { useState } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { useGetVisa, useListVisaCustomFields, useGetCurrentUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { Link, useParams, useLocation } from "wouter";
import {
  ArrowRight, ChevronRight, Clock, CalendarDays, Shield,
  FileText, Briefcase, Building2, CheckCircle2, Globe, Plane,
  AlertCircle, Zap, Star, Loader2, UserCheck, Lock,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const CATEGORY_LABELS: Record<string, { ar: string; en: string }> = {
  tourist:  { ar: "تأشيرة سياحية",  en: "Tourist Visa" },
  business: { ar: "تأشيرة تجارية",  en: "Business Visa" },
  medical:  { ar: "تأشيرة طبية",    en: "Medical Visa" },
  visit:    { ar: "تأشيرة زيارة",   en: "Visit Visa" },
  study:    { ar: "تأشيرة دراسية",  en: "Study Visa" },
  umrah:    { ar: "تأشيرة عمرة",    en: "Umrah Visa" },
};

function flagEmoji(code: string): string {
  const c = (code || "").toUpperCase();
  if (c.length !== 2) return "🌍";
  return String.fromCodePoint(...[...c].map(x => 0x1F1E6 + x.charCodeAt(0) - 65));
}

function countryImage(code: string): string {
  const DEFAULTS: Record<string, string> = {
    SA: "https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=1600",
    AE: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600",
    TR: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1600",
    TH: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1600",
    MY: "https://images.unsplash.com/photo-1508050919630-b135583b29ab?w=1600",
    EG: "https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=1600",
    OM: "https://images.unsplash.com/photo-1586686507413-3bd73a16eb01?w=1600",
    QA: "https://images.unsplash.com/photo-1577475038887-f5b84e77d9c3?w=1600",
    JO: "https://images.unsplash.com/photo-1580834341580-8c17a3a630ca?w=1600",
    ID: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600",
    SG: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1600",
    IN: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1600",
    GB: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1600",
    FR: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1600",
    DE: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1600",
    IT: "https://images.unsplash.com/photo-1529260830199-42c24126f198?w=1600",
    US: "https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=1600",
    CN: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=1600",
    JP: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1600",
    AU: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600",
    AZ: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600",
  };
  return DEFAULTS[(code || "").toUpperCase()] || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600";
}

const GCC_COUNTRIES = ["Saudi Arabia","UAE","Kuwait","Qatar","Bahrain","Oman"];

function isProfileComplete(user: any): boolean {
  if (!user) return false;
  return !!(user.firstName && user.lastName && user.phone && user.nationality &&
    user.dateOfBirth && user.profilePhotoUrl && user.passportNumber && user.passportExpiryDate);
}

export default function VisaView() {
  const { language } = useTranslation();
  const ar = language === "ar";
  const params = useParams();
  const [, setLocation] = useLocation();
  const visaId = Number(params.visaId);
  const { isAuthenticated } = useAuth();

  const [eligibilityState, setEligibilityState] = useState<"idle" | "checking" | "ineligible">("idle");
  const [ineligibleReason, setIneligibleReason] = useState<string>("");

  const { data: visa, isLoading } = useGetVisa(visaId, {
    query: { enabled: !!visaId, queryKey: ["visa", visaId] },
  });
  const { data: customFields } = useListVisaCustomFields(visaId, {
    query: { enabled: !!visaId, queryKey: ["visa-custom-fields", visaId] },
  });
  const { data: currentUser } = useGetCurrentUser({
    query: { staleTime: 60000, queryKey: getGetCurrentUserQueryKey(), enabled: isAuthenticated },
  });

  const handleApply = async () => {
    if (!isAuthenticated) {
      setLocation(`/login?redirect=/visas/apply/${visaId}`);
      return;
    }
    if (!isProfileComplete(currentUser)) {
      setLocation(`/account`);
      return;
    }
    // Pre-check eligibility
    setEligibilityState("checking");
    try {
      const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${BASE_URL}/api/visa-applications/eligibility/${visaId}`, {
        headers: { Authorization: `Bearer ${token}`, "x-lang": language },
      });
      const data = await res.json();
      if (data.eligible === false) {
        setIneligibleReason(data.reason || (ar ? "غير مؤهل" : "Not eligible"));
        setEligibilityState("ineligible");
        return;
      }
    } catch {
      // On error, proceed anyway — server will enforce
    }
    setEligibilityState("idle");
    setLocation(`/visas/apply/${visaId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#0A2342] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!visa) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4" dir={ar ? "rtl" : "ltr"}>
        <AlertCircle className="w-16 h-16 text-slate-300" />
        <h1 className="text-2xl font-black text-slate-700">{ar ? "التأشيرة غير موجودة" : "Visa Not Found"}</h1>
        <p className="text-slate-400">{ar ? "لم يتم العثور على التأشيرة المطلوبة" : "The requested visa could not be found"}</p>
        <Link href="/visas">
          <button className="mt-2 px-6 py-3 bg-[#0A2342] text-white font-bold rounded-xl">
            {ar ? "العودة للتأشيرات" : "Back to Visas"}
          </button>
        </Link>
      </div>
    );
  }

  const countryName = ar ? visa.countryAr : (visa.countryEn || visa.countryAr);
  const flag = flagEmoji(visa.countryCode || "");
  const img = visa.imageUrl || countryImage(visa.countryCode || "");
  const description = ar ? visa.descriptionAr : visa.descriptionEn;
  const catLabel = CATEGORY_LABELS[visa.category || ""]?.[ar ? "ar" : "en"] ?? (ar ? "تأشيرة" : "Visa");
  const isAvailable = visa.isActive && visa.status === "available";

  return (
    <div className="min-h-screen bg-slate-50 pb-24" dir={ar ? "rtl" : "ltr"}>

      {/* ── Hero ── */}
      <div className="relative bg-[#071525] pt-20 pb-40 overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src={img}
            alt={countryName}
            className="w-full h-full object-cover opacity-20"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#071525]/70 via-[#0A2342]/80 to-[#071525]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-10 flex-wrap">
            <Link href="/visas" className="hover:text-white transition-colors">
              {ar ? "التأشيرات" : "Visas"}
            </Link>
            <ChevronRight className={`w-4 h-4 ${ar ? "rotate-180" : ""}`} />
            <span className="text-slate-300">{countryName}</span>
            <ChevronRight className={`w-4 h-4 ${ar ? "rotate-180" : ""}`} />
            <span className="text-white">{catLabel}</span>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start gap-10">
            {/* Left: title */}
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-5">
                <span className="text-4xl">{flag}</span>
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-1">
                    {visa.category === "business" ? <Briefcase className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                    {catLabel}
                  </div>
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
                {visa.visaType}
              </h1>
              <h2 className="text-xl text-[#D4AF37] font-bold mb-4">{countryName}</h2>

              {description && (
                <p className="text-slate-300 text-lg leading-relaxed">{description}</p>
              )}

              {/* Status badge */}
              <div className={`inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-full text-sm font-bold border ${
                isAvailable
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                  : "bg-red-500/15 border-red-500/30 text-red-400"
              }`}>
                <div className={`w-2 h-2 rounded-full ${isAvailable ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                {isAvailable ? (ar ? "متاحة للتقديم" : "Available Now") : (ar ? "غير متاحة حالياً" : "Not Available")}
              </div>
            </div>

            {/* Right: price card (sticky on desktop) */}
            <div className="w-full md:w-80 shrink-0">
              <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative z-20">
                <div className="text-center mb-5">
                  <div className="text-sm text-slate-400 font-bold uppercase tracking-wide mb-1">
                    {ar ? "رسوم التأشيرة" : "Visa Fee"}
                  </div>
                  <div className="text-5xl font-black text-[#0A2342] leading-none mb-1">
                    {Number(visa.fee).toLocaleString()}
                  </div>
                  <div className="text-slate-400 font-bold">{visa.currency}</div>
                </div>

                {/* Quick stats in price card */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <Clock className="w-4 h-4 text-[#0A2342] mx-auto mb-1" />
                    <div className="text-xs text-slate-400">{ar ? "معالجة" : "Processing"}</div>
                    <div className="text-sm font-black text-[#0A2342]">{visa.processingDays} {ar ? "يوم" : "days"}</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <CalendarDays className="w-4 h-4 text-[#0A2342] mx-auto mb-1" />
                    <div className="text-xs text-slate-400">{ar ? "إقامة" : "Stay"}</div>
                    <div className="text-sm font-black text-[#0A2342]">
                      {visa.stayDuration ? `${visa.stayDuration} ${ar ? "يوم" : "d"}` : "—"}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <Plane className="w-4 h-4 text-[#0A2342] mx-auto mb-1" />
                    <div className="text-xs text-slate-400">{ar ? "دخول" : "Entry"}</div>
                    <div className="text-sm font-black text-[#0A2342]">
                      {visa.entryType === "single" ? (ar ? "واحد" : "Single")
                        : visa.entryType === "multiple" ? (ar ? "متعدد" : "Multiple")
                        : (ar ? "عبور" : "Transit")}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <Shield className="w-4 h-4 text-[#0A2342] mx-auto mb-1" />
                    <div className="text-xs text-slate-400">{ar ? "صلاحية" : "Validity"}</div>
                    <div className="text-sm font-black text-[#0A2342]">
                      {visa.validityDays ? `${visa.validityDays} ${ar ? "يوم" : "d"}` : "—"}
                    </div>
                  </div>
                </div>

                {isAvailable ? (
                  <button
                    onClick={handleApply}
                    disabled={eligibilityState === "checking"}
                    className="w-full bg-[#D4AF37] hover:bg-[#b8973b] disabled:opacity-70 text-[#0A2342] font-black py-4 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-base"
                  >
                    {eligibilityState === "checking" ? (
                      <><Loader2 className="w-5 h-5 animate-spin" />{ar ? "جاري التحقق..." : "Checking..."}</>
                    ) : !isAuthenticated ? (
                      <><Lock className="w-4 h-4" />{ar ? "سجل دخولك للتقديم" : "Login to Apply"}</>
                    ) : !isProfileComplete(currentUser) ? (
                      <><UserCheck className="w-4 h-4" />{ar ? "أكمل ملفك للتقديم" : "Complete Profile to Apply"}</>
                    ) : (
                      <>{ar ? "قدم طلبك الآن" : "Apply Now"}<ArrowRight className={`w-5 h-5 ${ar ? "rotate-180" : ""}`} /></>
                    )}
                  </button>
                ) : (
                  <div className="w-full bg-slate-100 text-slate-400 font-bold py-4 rounded-xl text-center">
                    {ar ? "التأشيرة غير متاحة حالياً" : "Not Available"}
                  </div>
                )}

                {/* Ineligible notice */}
                {eligibilityState === "ineligible" && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                    <div>
                      <div className="font-bold mb-0.5">{ar ? "غير مؤهل" : "Not Eligible"}</div>
                      <div>{ineligibleReason}</div>
                      <button
                        onClick={() => setEligibilityState("idle")}
                        className="mt-2 text-xs text-red-500 underline"
                      >
                        {ar ? "إغلاق" : "Dismiss"}
                      </button>
                    </div>
                  </div>
                )}

                <p className="text-xs text-slate-400 text-center mt-3">
                  {ar ? "بالتقديم توافق على الشروط والأحكام" : "By applying you agree to the terms"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="container mx-auto px-4 -mt-20 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-6">

            {/* Requirements & Documents */}
            {(visa.requirements || visa.documents) && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                <h2 className="text-2xl font-black text-[#0A2342] mb-6 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#D4AF37]" />
                  {ar ? "المتطلبات والمستندات" : "Requirements & Documents"}
                </h2>
                <div className="space-y-5">
                  {visa.requirements && (
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                        {ar ? "المتطلبات الأساسية" : "Basic Requirements"}
                      </h3>
                      <div className="space-y-2">
                        {visa.requirements.split("\n").filter(Boolean).map((line, i) => (
                          <div key={i} className="flex gap-3 items-start">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-2 shrink-0" />
                            <p className="text-slate-600 leading-relaxed">{line}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {visa.documents && (
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                        {ar ? "المستندات المطلوبة" : "Required Documents"}
                      </h3>
                      <div className="space-y-2">
                        {visa.documents.split("\n").filter(Boolean).map((line, i) => (
                          <div key={i} className="flex gap-3 items-start">
                            <FileText className="w-4 h-4 text-[#D4AF37] mt-0.5 shrink-0" />
                            <p className="text-slate-600 leading-relaxed">{line}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Eligibility Information */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <h2 className="text-2xl font-black text-[#0A2342] mb-6 flex items-center gap-3">
                <Globe className="w-6 h-6 text-[#D4AF37]" />
                {ar ? "شروط الأهلية" : "Eligibility Conditions"}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { flag: visa.acceptsGccResidency, ar: "إقامة دول الخليج (GCC)", en: "GCC Residency Accepted" },
                  { flag: visa.acceptsSchengenResidency, ar: "إقامة / تأشيرة شنغن", en: "Schengen Residency/Visa" },
                  { flag: visa.acceptsUkResidency, ar: "إقامة المملكة المتحدة", en: "UK Residency" },
                  { flag: visa.acceptsUsVisa, ar: "تأشيرة الولايات المتحدة", en: "US Visa" },
                  { flag: visa.acceptsCanadaResidency, ar: "إقامة كندا", en: "Canada Residency" },
                  { flag: visa.acceptsAustraliaResidency, ar: "إقامة أستراليا", en: "Australia Residency" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${
                      item.flag
                        ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                        : "bg-slate-50 border-slate-100 text-slate-400"
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${item.flag ? "text-emerald-500" : "text-slate-300"}`} />
                    <span className="text-sm font-semibold">{ar ? item.ar : item.en}</span>
                  </div>
                ))}
              </div>

              {((visa.allowedNationalities?.length ?? 0) > 0 || (visa.blockedNationalities?.length ?? 0) > 0) && (
                <div className="mt-6 space-y-3">
                  {(visa.allowedNationalities?.length ?? 0) > 0 && (
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        {ar ? "الجنسيات المسموح بها" : "Allowed Nationalities"}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(visa.allowedNationalities ?? []).map(n => (
                          <span key={n} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-xs font-semibold">{n}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(visa.blockedNationalities?.length ?? 0) > 0 && (
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        {ar ? "الجنسيات المحظورة" : "Blocked Nationalities"}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(visa.blockedNationalities ?? []).map(n => (
                          <span key={n} className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-100 rounded-full text-xs font-semibold">{n}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Upload Requirements */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <h2 className="text-2xl font-black text-[#0A2342] mb-6 flex items-center gap-3">
                <FileText className="w-6 h-6 text-[#D4AF37]" />
                {ar ? "المرفقات المطلوبة" : "Required Uploads"}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { flag: visa.requiresPassportImage, ar: "صورة جواز السفر", en: "Passport Image", required: true },
                  { flag: visa.requiresPersonalPhoto, ar: "صورة شخصية", en: "Personal Photo", required: true },
                  { flag: visa.requiresResidencyImage, ar: "صورة بطاقة الإقامة", en: "Residency Card Image", required: false },
                  { flag: visa.requiresVisaImage, ar: "صورة التأشيرة السابقة", en: "Previous Visa Image", required: false },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-xl border flex items-center gap-3 ${
                      item.flag
                        ? "bg-blue-50 border-blue-100 text-blue-800"
                        : "bg-slate-50 border-slate-100 text-slate-400"
                    }`}
                  >
                    <CheckCircle2 className={`w-5 h-5 shrink-0 ${item.flag ? "text-blue-500" : "text-slate-300"}`} />
                    <div>
                      <div className="font-semibold">{ar ? item.ar : item.en}</div>
                      {item.flag && (
                        <div className="text-xs mt-0.5 opacity-70">
                          {item.required ? (ar ? "إلزامي" : "Required") : (ar ? "قد يُطلب" : "May be required")}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {visa.notes && (
              <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex gap-4">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-amber-800 mb-1">{ar ? "ملاحظات مهمة" : "Important Notes"}</h3>
                  <p className="text-amber-700 text-sm leading-relaxed">{visa.notes}</p>
                </div>
              </div>
            )}

            {/* Custom Fields notice */}
            {customFields && customFields.length > 0 && (
              <div className="bg-[#0A2342]/5 rounded-3xl p-6 border border-[#0A2342]/10 flex items-start gap-4">
                <Star className="w-5 h-5 text-[#0A2342] shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-[#0A2342] mb-1">
                    {ar ? "معلومات إضافية مطلوبة" : "Additional Info Required"}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {ar
                      ? `هذه التأشيرة تتطلب ${customFields.length} حقول إضافية أثناء التقديم.`
                      : `This visa requires ${customFields.length} additional fields during application.`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sticky sidebar spacer on desktop (card is in hero) */}
          <div className="w-full lg:w-80 shrink-0 hidden lg:block" />
        </div>
      </div>

      {/* ── Fixed Bottom Apply Button ── */}
      {isAvailable && (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200 p-4 shadow-2xl lg:hidden">
          <button
            onClick={handleApply}
            disabled={eligibilityState === "checking"}
            className="w-full bg-[#D4AF37] text-[#0A2342] font-black py-4 rounded-xl flex items-center justify-center gap-2 text-base disabled:opacity-70"
          >
            {eligibilityState === "checking" ? (
              <><Loader2 className="w-5 h-5 animate-spin" />{ar ? "جاري التحقق..." : "Checking..."}</>
            ) : !isAuthenticated ? (
              <><Lock className="w-4 h-4" />{ar ? "سجل دخولك للتقديم" : "Login to Apply"}</>
            ) : (
              <>{ar ? "قدم طلبك الآن" : "Apply Now"} — {Number(visa.fee).toLocaleString()} {visa.currency}</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
