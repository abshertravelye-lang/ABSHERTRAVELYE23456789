import { useTranslation } from "@/hooks/use-translation";
import { useListVisas } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, FileText, CreditCard, CheckCircle } from "lucide-react";

export default function Visas() {
  const { t, language } = useTranslation();
  const { data: visas, isLoading } = useListVisas();

  const handleWhatsAppBook = (country: string, visaType: string) => {
    const text = encodeURIComponent(`أرغب في الاستفسار عن تأشيرة ${country} - نوع التأشيرة: ${visaType}`);
    window.open(`https://wa.me/967779055511?text=${text}`, "_blank");
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      <div className="bg-primary text-primary-foreground py-16 mb-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">{t("visas")}</h1>
          <p className="text-slate-300 max-w-2xl mx-auto">
            {language === 'ar' 
              ? 'خدمات استخراج التأشيرات بسرعة واحترافية لمختلف دول العالم' 
              : 'Fast and professional visa processing services for various countries around the world'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-80 bg-white animate-pulse rounded-2xl shadow-sm"></div>
            ))}
          </div>
        ) : visas && visas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visas.map((visa) => (
              <Card key={visa.id} className="border-0 shadow-md hover:shadow-lg transition-all duration-300 flex flex-col">
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100">
                    {visa.imageUrl ? (
                      <img src={visa.imageUrl} alt={language === 'ar' ? visa.countryAr : visa.countryEn} className="w-16 h-16 rounded-full object-cover border-2 border-slate-100 shadow-sm" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl border-2 border-primary/20 shadow-sm">
                        {visa.countryCode ? (
                          <span className={`fi fi-${visa.countryCode.toLowerCase()}`}></span>
                        ) : (
                          "🌍"
                        )}
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">{language === 'ar' ? visa.countryAr : visa.countryEn}</h3>
                      <div className="text-sm font-medium text-secondary">{visa.visaType}</div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6 flex-1">
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">{language === 'ar' ? 'مدة المعالجة' : 'Processing Time'}</div>
                        <div className="text-sm font-semibold text-slate-700">{visa.processingDays} {language === 'ar' ? 'أيام عمل' : 'Working Days'}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CreditCard className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">{language === 'ar' ? 'الرسوم' : 'Fees'}</div>
                        <div className="text-sm font-semibold text-slate-700">{visa.fee} {visa.currency}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">{language === 'ar' ? 'المتطلبات' : 'Requirements'}</div>
                        <p className="text-sm text-slate-600 line-clamp-3">{visa.requirements}</p>
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-[#25D366] hover:bg-[#1ebd5a] text-white"
                    onClick={() => handleWhatsAppBook(language === 'ar' ? visa.countryAr : visa.countryEn, visa.visaType)}
                  >
                    <svg xmlns="http://www.0000.com/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 rtl:ml-2 rtl:mr-0"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                    {language === 'ar' ? 'استفسار عبر واتساب' : 'Inquire via WhatsApp'}
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
