import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "@/hooks/use-translation";
import { useTrackVisaApplication } from "@workspace/api-client-react";
import { Search, ArrowRight, Package, CheckCircle2, Clock, MapPin, Building2, User, FileText, AlertCircle, RefreshCw } from "lucide-react";

const STATUS_META: Record<string, { ar: string; en: string; color: string; icon: React.ReactNode; bg: string }> = {
  received: { ar: "تم الاستلام", en: "Received", color: "text-slate-600", bg: "bg-slate-100", icon: <Package className="w-5 h-5" /> },
  under_review: { ar: "قيد المراجعة", en: "Under Review", color: "text-blue-600", bg: "bg-blue-100", icon: <Search className="w-5 h-5" /> },
  awaiting_documents: { ar: "بانتظار المستندات", en: "Awaiting Documents", color: "text-amber-600", bg: "bg-amber-100", icon: <FileText className="w-5 h-5" /> },
  documents_uploaded: { ar: "تم رفع المستندات", en: "Documents Uploaded", color: "text-blue-600", bg: "bg-blue-100", icon: <CheckCircle2 className="w-5 h-5" /> },
  sent_to_embassy: { ar: "أرسلت للسفارة", en: "Sent to Embassy", color: "text-indigo-600", bg: "bg-indigo-100", icon: <Building2 className="w-5 h-5" /> },
  processing: { ar: "قيد المعالجة", en: "Processing", color: "text-purple-600", bg: "bg-purple-100", icon: <RefreshCw className="w-5 h-5" /> },
  issued: { ar: "تم الإصدار", en: "Issued", color: "text-emerald-600", bg: "bg-emerald-100", icon: <CheckCircle2 className="w-5 h-5" /> },
  completed: { ar: "مكتمل", en: "Completed", color: "text-emerald-600", bg: "bg-emerald-100", icon: <CheckCircle2 className="w-5 h-5" /> },
  rejected: { ar: "مرفوض", en: "Rejected", color: "text-red-600", bg: "bg-red-100", icon: <AlertCircle className="w-5 h-5" /> },
  cancelled: { ar: "ملغي", en: "Cancelled", color: "text-slate-600", bg: "bg-slate-100", icon: <AlertCircle className="w-5 h-5" /> },
};

const TIMELINE_ORDER = [
  "received",
  "under_review",
  "sent_to_embassy",
  "processing",
  "completed"
];

export default function VisaTrack() {
  const { language } = useTranslation();
  const ar = language === "ar";
  const [loc] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialQ = searchParams.get("q") || "";
  
  const [q, setQ] = useState(initialQ);
  const [submittedQ, setSubmittedQ] = useState(initialQ);

  const { data: trackData, isLoading, isError, error } = useTrackVisaApplication(submittedQ, {
    query: {
      enabled: !!submittedQ,
      queryKey: ["track-visa", submittedQ],
      retry: false
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) setSubmittedQ(q.trim());
  };

  const getTimelineIndex = (status: string) => {
    if (status === 'issued') return TIMELINE_ORDER.indexOf('completed');
    if (status === 'awaiting_documents' || status === 'documents_uploaded') return TIMELINE_ORDER.indexOf('under_review');
    if (status === 'rejected' || status === 'cancelled') return -1;
    return TIMELINE_ORDER.indexOf(status);
  };

  return (
    <div className="min-h-screen bg-slate-50" dir={ar ? "rtl" : "ltr"}>
      {/* Hero */}
      <div className="bg-[#0A2342] pt-20 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(212,175,55,0.1)_0%,transparent_50%)]" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white border border-white/20 px-4 py-1.5 rounded-full mb-6 text-sm font-semibold uppercase tracking-wider">
            <Search className="w-4 h-4" />
            {ar ? "تتبع الطلب" : "Track Application"}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-6">
            {ar ? "تتبع حالة تأشيرتك" : "Track Your Visa Status"}
          </h1>
          
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mt-10 relative">
            <input
              type="text"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder={ar ? "أدخل رقم التتبع (مثال: VISA-2026-12345)" : "Enter tracking number (e.g. VISA-2026-12345)"}
              className="w-full bg-white rounded-2xl py-5 px-6 text-lg shadow-2xl border-4 border-white/10 focus:outline-none focus:border-[#D4AF37] transition-colors"
              dir="ltr"
            />
            <button
              type="submit"
              disabled={!q.trim() || isLoading}
              className={`absolute top-2 bottom-2 ${ar ? "left-2" : "right-2"} bg-[#D4AF37] hover:bg-[#b8973b] text-white px-8 rounded-xl font-bold transition-all flex items-center justify-center disabled:opacity-50`}
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                ar ? "بحث" : "Track"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 -mt-8 relative z-20 pb-24">
        {submittedQ && isLoading && (
          <div className="bg-white rounded-3xl p-12 text-center shadow-xl border border-slate-100 max-w-3xl mx-auto">
            <div className="w-12 h-12 border-4 border-[#0A2342] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 font-medium">{ar ? "جاري البحث عن الطلب..." : "Searching for application..."}</p>
          </div>
        )}

        {submittedQ && isError && (
          <div className="bg-white rounded-3xl p-12 text-center shadow-xl border border-slate-100 max-w-3xl mx-auto">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-red-400" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">
              {ar ? "الطلب غير موجود" : "Application Not Found"}
            </h3>
            <p className="text-slate-500 max-w-md mx-auto">
              {ar 
                ? "تأكد من إدخال رقم التتبع بشكل صحيح. يبدأ الرقم بـ VISA متبوعاً بالسنة وأرقام." 
                : "Please make sure you entered the tracking number correctly. It should start with VISA-."}
            </p>
          </div>
        )}

        {trackData && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-4xl mx-auto overflow-hidden">
            {/* Header */}
            <div className="bg-slate-50 p-8 border-b border-slate-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">
                    {ar ? "رقم التتبع" : "Tracking Number"}
                  </div>
                  <div className="text-2xl font-black text-[#0A2342] tracking-wider" dir="ltr">
                    {trackData.trackingNumber}
                  </div>
                </div>
                <div className={`px-5 py-2.5 rounded-full flex items-center gap-2.5 font-bold ${STATUS_META[trackData.status]?.bg || 'bg-slate-100'} ${STATUS_META[trackData.status]?.color || 'text-slate-600'}`}>
                  {STATUS_META[trackData.status]?.icon}
                  {ar ? STATUS_META[trackData.status]?.ar : STATUS_META[trackData.status]?.en}
                </div>
              </div>
            </div>

            <div className="p-8">
              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-500 mb-0.5">{ar ? "اسم مقدم الطلب" : "Applicant Name"}</div>
                    <div className="font-bold text-slate-800 text-lg">{trackData.fullName}</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-500 mb-0.5">{ar ? "دولة الوجهة" : "Destination"}</div>
                    <div className="font-bold text-slate-800 text-lg">
                      {ar ? trackData.countryAr : trackData.countryEn} — {trackData.visaType}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-500 mb-0.5">{ar ? "تاريخ التقديم" : "Application Date"}</div>
                    <div className="font-bold text-slate-800 text-lg" dir="ltr">
                      {new Date(trackData.createdAt).toLocaleDateString(ar ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
                    <RefreshCw className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-500 mb-0.5">{ar ? "آخر تحديث" : "Last Updated"}</div>
                    <div className="font-bold text-slate-800 text-lg" dir="ltr">
                      {new Date(trackData.updatedAt).toLocaleDateString(ar ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              {trackData.status !== 'rejected' && trackData.status !== 'cancelled' && (
                <div>
                  <h3 className="text-xl font-black text-[#0A2342] mb-8">{ar ? "مسار الطلب" : "Application Timeline"}</h3>
                  
                  <div className="relative">
                    {/* Track line */}
                    <div className={`absolute top-0 bottom-0 ${ar ? "right-6" : "left-6"} w-1 bg-slate-100 rounded-full`} />
                    
                    <div className="space-y-8 relative">
                      {TIMELINE_ORDER.map((stepStatus, idx) => {
                        const currentIndex = getTimelineIndex(trackData.status);
                        const isPast = idx < currentIndex;
                        const isCurrent = idx === currentIndex;
                        const meta = STATUS_META[stepStatus];
                        
                        // Handle mapping for alternative statuses
                        let displayMeta = meta;
                        let showAlternativeDate = false;
                        if (isCurrent && trackData.status !== stepStatus) {
                          displayMeta = STATUS_META[trackData.status] || meta;
                          showAlternativeDate = true;
                        }

                        return (
                          <div key={stepStatus} className={`flex items-start gap-6 ${!isPast && !isCurrent ? 'opacity-40' : ''}`}>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm relative z-10 ${
                              isPast ? 'bg-emerald-500 text-white' : 
                              isCurrent ? 'bg-[#D4AF37] text-white ring-4 ring-[#D4AF37]/20' : 
                              'bg-slate-200 text-slate-400'
                            }`}>
                              {isPast ? <CheckCircle2 className="w-6 h-6" /> : displayMeta.icon}
                            </div>
                            <div className="pt-2">
                              <h4 className={`text-lg font-bold ${isCurrent ? 'text-[#0A2342]' : 'text-slate-700'}`}>
                                {ar ? displayMeta.ar : displayMeta.en}
                              </h4>
                              {isCurrent && trackData.adminNotes && (
                                <div className="mt-2 p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800">
                                  {trackData.adminNotes}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {(trackData.status === 'rejected' || trackData.status === 'cancelled') && (
                <div className="bg-red-50 border border-red-100 p-6 rounded-2xl mt-8">
                  <div className="flex items-start gap-4 text-red-800">
                    <AlertCircle className="w-8 h-8 shrink-0 text-red-500" />
                    <div>
                      <h3 className="font-bold text-lg mb-1">
                        {ar ? "تم إيقاف الطلب" : "Application Stopped"}
                      </h3>
                      <p className="text-red-700/80">
                        {trackData.adminNotes || (ar ? "يرجى التواصل مع خدمة العملاء للمزيد من التفاصيل." : "Please contact customer support for more details.")}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-slate-50 p-6 border-t border-slate-100 text-center">
              <Link href="/contact" className="inline-flex items-center gap-2 text-[#0A2342] font-bold hover:text-[#D4AF37] transition-colors">
                {ar ? "تحتاج مساعدة؟ تواصل معنا" : "Need help? Contact us"}
                <ArrowRight className={`w-4 h-4 ${ar ? "rotate-180" : ""}`} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
