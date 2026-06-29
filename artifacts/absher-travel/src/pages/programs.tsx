import { useTranslation } from "@/hooks/use-translation";
import { useListPrograms } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, CheckCircle2 } from "lucide-react";

export default function Programs() {
  const { t, language } = useTranslation();
  const { data: programs, isLoading } = useListPrograms();

  const handleWhatsAppBook = (programTitle: string) => {
    const text = encodeURIComponent(`أرغب في حجز البرنامج السياحي: ${programTitle}`);
    window.open(`https://wa.me/967779055511?text=${text}`, "_blank");
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      <div className="bg-primary text-primary-foreground py-16 mb-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">{t("programs")}</h1>
          <p className="text-slate-300 max-w-2xl mx-auto">
            {language === 'ar' 
              ? 'برامج سياحية متكاملة مصممة خصيصاً لتمنحك تجربة سفر لا تُنسى' 
              : 'Comprehensive tourism programs specially designed to give you an unforgettable travel experience'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-[500px] bg-white animate-pulse rounded-2xl shadow-sm"></div>
            ))}
          </div>
        ) : programs && programs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {programs.map((program) => (
              <Card key={program.id} className="overflow-hidden group border-0 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col">
                <div className="h-56 overflow-hidden relative">
                  {program.featured && (
                    <div className="absolute top-4 left-4 z-20 bg-accent text-primary text-xs font-bold px-3 py-1 rounded-full shadow-md">
                      {language === 'ar' ? 'مميز' : 'Featured'}
                    </div>
                  )}
                  <img 
                    src={program.imageUrl || 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=1000&auto=format&fit=crop'} 
                    alt={language === 'ar' ? program.titleAr : program.titleEn} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
                    <h3 className="text-xl font-bold text-white mb-1">
                      {language === 'ar' ? program.titleAr : program.titleEn}
                    </h3>
                    {program.destination && (
                      <div className="flex items-center text-slate-200 text-sm">
                        <MapPin size={14} className="mr-1 rtl:ml-1 rtl:mr-0" />
                        {program.destination}
                      </div>
                    )}
                  </div>
                </div>
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
                    <div className="text-primary font-bold text-2xl">
                      {program.price} <span className="text-sm text-slate-500 font-normal">{program.currency || 'USD'}</span>
                    </div>
                    <div className="flex items-center text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                      <Calendar className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0 text-secondary" /> 
                      {program.days} {language === 'ar' ? 'أيام' : 'Days'} {program.nights ? `/ ${program.nights} ${language === 'ar' ? 'ليالي' : 'Nights'}` : ''}
                    </div>
                  </div>
                  
                  <p className="text-slate-600 mb-6 flex-1">
                    {language === 'ar' ? program.descriptionAr : program.descriptionEn}
                  </p>
                  
                  {program.included && (
                    <div className="mb-6 bg-slate-50 p-4 rounded-xl">
                      <h4 className="font-semibold text-sm mb-2 text-slate-800">{language === 'ar' ? 'يشمل:' : 'Included:'}</h4>
                      <ul className="space-y-2">
                        {program.included.split('\n').map((item, i) => (
                          <li key={i} className="flex items-start text-sm text-slate-600">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 mr-2 rtl:ml-2 rtl:mr-0 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <Button 
                    className="w-full bg-[#25D366] hover:bg-[#1ebd5a] text-white"
                    onClick={() => handleWhatsAppBook(language === 'ar' ? program.titleAr : program.titleEn)}
                  >
                    <svg xmlns="http://www.0000.com/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 rtl:ml-2 rtl:mr-0"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                    {t("bookViaWhatsApp")}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 text-slate-500 bg-white rounded-2xl shadow-sm">
            {t("noData")}
          </div>
        )}
      </div>
    </div>
  );
}
