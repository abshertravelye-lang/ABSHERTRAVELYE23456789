import { useTranslation } from "@/hooks/use-translation";
import { Link, useLocation } from "wouter";
import { CheckCircle, Search, ArrowRight, Home } from "lucide-react";

export default function VisaSuccess() {
  const { language } = useTranslation();
  const ar = language === "ar";
  const [loc] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const trackingNumber = searchParams.get("tracking");

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-20 px-4" dir={ar ? "rtl" : "ltr"}>
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl border border-slate-100 max-w-2xl w-full text-center relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 relative">
            <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-50" />
            <CheckCircle className="w-12 h-12 text-emerald-600 relative z-10" />
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-[#0A2342] mb-4">
            {ar ? "تم استلام طلبك بنجاح!" : "Application Received Successfully!"}
          </h1>
          
          <p className="text-slate-500 text-lg mb-8 max-w-lg mx-auto">
            {ar 
              ? "لقد قمنا باستلام طلب التأشيرة الخاص بك بنجاح. سيقوم فريقنا بمراجعة الطلب والتواصل معك قريباً." 
              : "We have successfully received your visa application. Our team will review it and get back to you shortly."}
          </p>

          {trackingNumber && (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-10">
              <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
                {ar ? "رقم تتبع الطلب" : "Application Tracking Number"}
              </div>
              <div className="text-3xl font-black text-[#0A2342] tracking-widest font-mono select-all">
                {trackingNumber}
              </div>
              <p className="text-sm text-slate-500 mt-3">
                {ar ? "يرجى الاحتفاظ بهذا الرقم لتتبع حالة طلبك" : "Please keep this number to track your application status"}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {trackingNumber && (
              <Link 
                href={`/visas/track?q=${trackingNumber}`}
                className="bg-[#0A2342] hover:bg-[#11315c] text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" />
                {ar ? "تتبع الطلب الآن" : "Track Application Now"}
              </Link>
            )}
            <Link 
              href="/visas"
              className="bg-white border-2 border-slate-200 hover:border-[#D4AF37] hover:text-[#D4AF37] text-slate-600 font-bold py-4 px-8 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              {ar ? "العودة للتأشيرات" : "Back to Visas"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
