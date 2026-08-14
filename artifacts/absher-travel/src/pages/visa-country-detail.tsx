import { useTranslation } from "@/hooks/use-translation";
import { useGetVisaCountry, useListVisasByCountry } from "@workspace/api-client-react";
import { Link, useParams } from "wouter";
import { Globe, Clock, Shield, ArrowRight, ChevronRight, CheckCircle, MapPin, Building2, Briefcase, FileText } from "lucide-react";

export default function VisaCountryDetail() {
  const { language } = useTranslation();
  const ar = language === "ar";
  const params = useParams();
  const countryId = Number(params.countryId);

  const { data: country, isLoading: isLoadingCountry } = useGetVisaCountry(countryId, { query: { enabled: !!countryId, queryKey: ["visa-country", countryId] } });
  const { data: visas, isLoading: isLoadingVisas } = useListVisasByCountry(countryId, { query: { enabled: !!countryId, queryKey: ["visas-by-country", countryId] } });

  if (isLoadingCountry) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-[#0A2342] border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!country) return null;

  const countryName = ar ? country.nameAr : country.nameEn;
  const description = ar ? country.descriptionAr : country.descriptionEn;

  return (
    <div className="min-h-screen bg-slate-50" dir={ar ? "rtl" : "ltr"}>
      {/* Hero */}
      <div className="relative bg-[#0A2342] pt-20 pb-24 overflow-hidden">
        {/* Flag background blur */}
        {country.imageUrl && (
          <div 
            className="absolute inset-0 opacity-10 mix-blend-overlay"
            style={{ backgroundImage: `url(${country.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A2342] to-transparent opacity-80" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-300 mb-8">
            <Link href="/visas" className="hover:text-white transition-colors">{ar ? "التأشيرات" : "Visas"}</Link>
            <ChevronRight className={`w-4 h-4 ${ar ? "rotate-180" : ""}`} />
            <span className="text-white">{countryName}</span>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            <div className="w-24 h-24 md:w-32 md:h-32 shrink-0 rounded-2xl bg-white flex items-center justify-center text-6xl shadow-2xl overflow-hidden border-4 border-white/10">
              {country.flagEmoji ? (
                <span>{country.flagEmoji}</span>
              ) : country.imageUrl ? (
                <img src={country.imageUrl} alt={countryName} className="w-full h-full object-cover" />
              ) : (
                <MapPin className="w-12 h-12 text-[#0A2342]" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white border border-white/20 px-3 py-1 rounded-full mb-4 text-xs font-bold uppercase tracking-wider">
                <Globe className="w-3.5 h-3.5" />
                {ar ? country.region : country.region}
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-4">{ar ? `تأشيرات ${countryName}` : `${countryName} Visas`}</h1>
              {description && (
                <p className="text-slate-300 max-w-2xl text-lg leading-relaxed">{description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Visas List */}
      <div className="container mx-auto px-4 py-16 -mt-8 relative z-20">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-800">
            {ar ? "أنواع التأشيرات المتاحة" : "Available Visa Types"}
          </h2>
          {!isLoadingVisas && visas && (
            <span className="bg-slate-200 text-slate-700 text-sm font-bold px-3 py-1 rounded-full">
              {visas.length} {ar ? "تأشيرات" : "visas"}
            </span>
          )}
        </div>

        {isLoadingVisas ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl h-48 animate-pulse border border-slate-100" />)}
          </div>
        ) : visas && visas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {visas.map(visa => (
              <Link key={visa.id} href={`/visas/${countryId}/${visa.id}`} className="group block">
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:border-[#D4AF37]/40 transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full">
                  <div className="p-6 border-b border-slate-50 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full mb-3">
                          {visa.category === 'business' ? <Briefcase className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
                          {ar ? (visa.category === 'business' ? 'أعمال' : 'سياحية') : visa.category}
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 group-hover:text-[#0A2342] transition-colors line-clamp-1">
                          {visa.visaType}
                        </h3>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-[#0A2342]">{Number(visa.fee).toLocaleString()}</div>
                        <div className="text-xs text-slate-500 font-bold uppercase">{visa.currency}</div>
                      </div>
                    </div>
                    
                    <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed mb-6">
                      {ar ? visa.descriptionAr : visa.descriptionEn}
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 font-medium">{ar ? "وقت المعالجة" : "Processing"}</div>
                          <div className="text-sm font-bold text-slate-700">{visa.processingDays} {ar ? "أيام" : "days"}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 font-medium">{ar ? "نوع الدخول" : "Entry"}</div>
                          <div className="text-sm font-bold text-slate-700 capitalize">{visa.entryType}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 px-6 py-4 flex items-center justify-between group-hover:bg-[#0A2342] transition-colors">
                    <span className="text-sm font-bold text-[#0A2342] group-hover:text-white transition-colors">
                      {ar ? "عرض التفاصيل والتقديم" : "View Details & Apply"}
                    </span>
                    <ArrowRight className={`w-5 h-5 text-[#0A2342] group-hover:text-[#D4AF37] transition-colors ${ar ? "rotate-180" : ""}`} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
            <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-2">{ar ? "لا توجد تأشيرات متاحة" : "No visas available"}</h3>
            <p className="text-slate-500">{ar ? "لا توجد تأشيرات متاحة لهذه الدولة حالياً" : "There are currently no visas available for this country."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
