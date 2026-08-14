import { useTranslation } from "@/hooks/use-translation";
import { useGetVisaCountry, useGetVisa, useListVisaCustomFields } from "@workspace/api-client-react";
import { Link, useParams, useLocation } from "wouter";
import { ArrowRight, ChevronRight, MapPin, Clock, CalendarDays, Shield, FileText, Briefcase, Building2, CheckCircle2, Globe, DollarSign } from "lucide-react";

export default function VisaDetail() {
  const { language } = useTranslation();
  const ar = language === "ar";
  const params = useParams();
  const [, setLocation] = useLocation();
  const countryId = Number(params.countryId);
  const visaId = Number(params.visaId);

  const { data: country, isLoading: isLoadingCountry } = useGetVisaCountry(countryId, { query: { enabled: !!countryId, queryKey: ["visa-country", countryId] } });
  const { data: visa, isLoading: isLoadingVisa } = useGetVisa(visaId, { query: { enabled: !!visaId, queryKey: ["visa", visaId] } });
  const { data: customFields } = useListVisaCustomFields(visaId, { query: { enabled: !!visaId, queryKey: ["visa-custom-fields", visaId] } });

  if (isLoadingVisa || (isLoadingCountry && !!countryId)) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-[#0A2342] border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!visa) return null;

  // Fall back to visa's own country fields when countryId is 0 or country not found
  const countryName = country ? (ar ? country.nameAr : country.nameEn) : (ar ? visa.countryAr : visa.countryEn);
  const description = ar ? visa.descriptionAr : visa.descriptionEn;
  const ineligibility = ar ? visa.ineligibleMessageAr : visa.ineligibleMessageEn;

  return (
    <div className="min-h-screen bg-slate-50 pb-24" dir={ar ? "rtl" : "ltr"}>
      {/* Hero */}
      <div className="relative bg-[#0A2342] pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.1)_0%,transparent_50%)]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-400 mb-8">
            <Link href="/visas" className="hover:text-white transition-colors">{ar ? "التأشيرات" : "Visas"}</Link>
            <ChevronRight className={`w-4 h-4 ${ar ? "rotate-180" : ""}`} />
            {countryId ? (
              <Link href={`/visas/${countryId}`} className="hover:text-white transition-colors">{countryName}</Link>
            ) : (
              <span className="text-slate-300">{countryName}</span>
            )}
            <ChevronRight className={`w-4 h-4 ${ar ? "rotate-180" : ""}`} />
            <span className="text-white">{visa.visaType}</span>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 px-3 py-1 rounded-full mb-4 text-xs font-bold uppercase tracking-wider">
                {visa.category === 'business' ? <Briefcase className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
                {ar ? (visa.category === 'business' ? 'تأشيرة أعمال' : 'تأشيرة سياحية') : `${visa.category} Visa`}
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">{visa.visaType}</h1>
              {description && (
                <p className="text-slate-300 text-lg leading-relaxed mb-8">{description}</p>
              )}
            </div>

            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-100 w-full md:w-80 shrink-0 transform md:-translate-y-4 relative z-20">
              <div className="text-center mb-6">
                <div className="text-sm text-slate-500 font-bold uppercase mb-1">{ar ? "رسوم التأشيرة" : "Visa Fee"}</div>
                <div className="text-4xl font-black text-[#0A2342] mb-1">{Number(visa.fee).toLocaleString()}</div>
                <div className="text-slate-500 font-bold">{visa.currency}</div>
              </div>
              <button
                onClick={() => setLocation(`/visas/apply/${visa.id}`)}
                className="w-full bg-[#D4AF37] hover:bg-[#b8973b] text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {ar ? "قدم طلبك الآن" : "Apply Now"}
                <ArrowRight className={`w-5 h-5 ${ar ? "rotate-180" : ""}`} />
              </button>
              {ineligibility && (
                <div className="mt-4 text-xs text-red-500 text-center flex items-start gap-1">
                  <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{ineligibility}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-16 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-8">
            {/* Quick Facts */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <h2 className="text-2xl font-black text-[#0A2342] mb-6 flex items-center gap-3">
                <FileText className="w-6 h-6 text-[#D4AF37]" />
                {ar ? "معلومات التأشيرة" : "Visa Details"}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <Clock className="w-6 h-6 text-slate-400 mb-2" />
                  <div className="text-xs text-slate-500 font-bold mb-1">{ar ? "مدة المعالجة" : "Processing Time"}</div>
                  <div className="text-lg font-black text-slate-800">{visa.processingDays} {ar ? "أيام" : "days"}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <CalendarDays className="w-6 h-6 text-slate-400 mb-2" />
                  <div className="text-xs text-slate-500 font-bold mb-1">{ar ? "فترة الإقامة" : "Stay Duration"}</div>
                  <div className="text-lg font-black text-slate-800">{visa.stayDuration || "—"} {ar ? "يوم" : "days"}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <Shield className="w-6 h-6 text-slate-400 mb-2" />
                  <div className="text-xs text-slate-500 font-bold mb-1">{ar ? "الصلاحية" : "Validity"}</div>
                  <div className="text-lg font-black text-slate-800">{visa.validityDays || "—"} {ar ? "يوم" : "days"}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <Globe className="w-6 h-6 text-slate-400 mb-2" />
                  <div className="text-xs text-slate-500 font-bold mb-1">{ar ? "نوع الدخول" : "Entry Type"}</div>
                  <div className="text-lg font-black text-slate-800 capitalize">
                    {ar ? (visa.entryType === 'single' ? 'دخول واحد' : visa.entryType === 'multiple' ? 'متعدد الدخول' : 'عبور') : visa.entryType}
                  </div>
                </div>
              </div>
            </div>

            {/* Requirements */}
            {(visa.requirements || visa.documents) && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                <h2 className="text-2xl font-black text-[#0A2342] mb-6 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#D4AF37]" />
                  {ar ? "المتطلبات والمستندات" : "Requirements & Documents"}
                </h2>
                
                <div className="space-y-6">
                  {visa.requirements && (
                    <div>
                      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">{ar ? "المتطلبات الأساسية" : "Basic Requirements"}</h3>
                      <div className="prose prose-slate max-w-none text-slate-600">
                        {visa.requirements.split('\n').map((line, i) => (
                          <div key={i} className="flex gap-3 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-2 shrink-0" />
                            <p className="m-0">{line}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {visa.documents && (
                    <div>
                      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">{ar ? "المستندات المطلوبة" : "Required Documents"}</h3>
                      <div className="prose prose-slate max-w-none text-slate-600">
                        {visa.documents.split('\n').map((line, i) => (
                          <div key={i} className="flex gap-3 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#0A2342] mt-2 shrink-0" />
                            <p className="m-0">{line}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Digital Upload Requirements */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <h2 className="text-2xl font-black text-[#0A2342] mb-6 flex items-center gap-3">
                <DollarSign className="w-6 h-6 text-[#D4AF37]" />
                {ar ? "المرفقات الرقمية المطلوبة" : "Required Digital Uploads"}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border flex items-center gap-3 ${visa.requiresPassportImage ? 'bg-blue-50 border-blue-100 text-blue-800' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                  <CheckCircle2 className={`w-5 h-5 ${visa.requiresPassportImage ? 'text-blue-500' : 'text-slate-300'}`} />
                  <span className="font-semibold">{ar ? "صورة جواز السفر" : "Passport Image"}</span>
                </div>
                <div className={`p-4 rounded-xl border flex items-center gap-3 ${visa.requiresPersonalPhoto ? 'bg-blue-50 border-blue-100 text-blue-800' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                  <CheckCircle2 className={`w-5 h-5 ${visa.requiresPersonalPhoto ? 'text-blue-500' : 'text-slate-300'}`} />
                  <span className="font-semibold">{ar ? "صورة شخصية" : "Personal Photo"}</span>
                </div>
                <div className={`p-4 rounded-xl border flex items-center gap-3 ${visa.requiresResidencyImage ? 'bg-blue-50 border-blue-100 text-blue-800' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                  <CheckCircle2 className={`w-5 h-5 ${visa.requiresResidencyImage ? 'text-blue-500' : 'text-slate-300'}`} />
                  <span className="font-semibold">{ar ? "صورة الإقامة" : "Residency Image"}</span>
                </div>
                <div className={`p-4 rounded-xl border flex items-center gap-3 ${visa.requiresVisaImage ? 'bg-blue-50 border-blue-100 text-blue-800' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                  <CheckCircle2 className={`w-5 h-5 ${visa.requiresVisaImage ? 'text-blue-500' : 'text-slate-300'}`} />
                  <span className="font-semibold">{ar ? "صورة التأشيرة السابقة" : "Previous Visa Image"}</span>
                </div>
              </div>
            </div>

            {/* Custom Fields Notice */}
            {customFields && customFields.length > 0 && (
              <div className="bg-[#0A2342]/5 rounded-3xl p-6 border border-[#0A2342]/10 flex items-start gap-4">
                <Shield className="w-6 h-6 text-[#0A2342] shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-[#0A2342] mb-1">
                    {ar ? "معلومات إضافية مطلوبة" : "Additional Information Required"}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {ar 
                      ? `هذه التأشيرة تتطلب ${customFields.length} حقول إضافية سيتم تعبئتها أثناء تقديم الطلب.` 
                      : `This visa requires ${customFields.length} additional fields to be filled during application.`}
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="w-full lg:w-80 shrink-0 hidden lg:block" />
        </div>
      </div>
    </div>
  );
}
