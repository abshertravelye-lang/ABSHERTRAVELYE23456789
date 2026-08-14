import { useTranslation } from "@/hooks/use-translation";
import { Building2, Clock } from "lucide-react";
import { Link } from "wouter";

export default function Hotels() {
  const { language } = useTranslation();
  const ar = language === "ar";

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#071525] via-[#0A2342] to-[#1E3A5F] flex flex-col items-center justify-center text-center px-6"
      dir={ar ? "rtl" : "ltr"}
    >
      <div className="w-28 h-28 rounded-full bg-[#D4AF37]/15 border-2 border-[#D4AF37]/30 flex items-center justify-center mb-8">
        <Building2 className="w-14 h-14 text-[#D4AF37]" />
      </div>

      <h1 className="text-3xl md:text-4xl font-black text-white mb-3">
        {ar ? "ستتوفر هذه الخدمة قريباً" : "Coming Soon"}
      </h1>
      <p className="text-[#D4AF37] font-bold text-lg mb-4 tracking-widest uppercase">
        {ar ? "حجز الفنادق" : "Hotel Booking"}
      </p>
      <p className="text-slate-300 text-base leading-relaxed max-w-md mb-10">
        {ar
          ? "نعمل على إطلاق خدمة حجز الفنادق لتوفير أفضل الخيارات والأسعار في مختلف الوجهات. ترقبوا إطلاقها قريباً."
          : "We're working on bringing you the best hotel booking experience. Stay tuned for the launch."}
      </p>

      <div className="inline-flex items-center gap-2 bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] font-bold px-5 py-2.5 rounded-full mb-8">
        <Clock className="w-4 h-4" />
        {ar ? "قريباً" : "Coming Soon"}
      </div>

      <Link href="/">
        <button className="inline-flex items-center gap-2 bg-[#D4AF37] text-[#052B5B] font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-[#D4AF37]/20 hover:bg-[#D4AF37]/90 hover:-translate-y-0.5 transition-all">
          {ar ? "العودة للرئيسية" : "Back to Home"}
        </button>
      </Link>
    </div>
  );
}
