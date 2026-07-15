import { useTranslation } from "@/hooks/use-translation";
import { useListDestinations } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { MapPin } from "lucide-react";

export default function Destinations() {
  const { t, language } = useTranslation();
  const { data: destinations, isLoading } = useListDestinations();

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      <div className="bg-primary text-primary-foreground py-16 mb-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">{t("destinations")}</h1>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto text-lg font-medium">
            {language === 'ar' 
              ? 'اكتشف أجمل الوجهات السياحية حول العالم مع باقاتنا المتنوعة التي تناسب جميع الأذواق' 
              : 'Discover the most beautiful tourist destinations around the world with our diverse packages that suit all tastes'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="h-72 bg-slate-200 animate-pulse rounded-2xl"></div>
            ))}
          </div>
        ) : destinations && destinations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {destinations.map((dest) => (
              <Link key={dest.id} href={`/destinations/${dest.id}`}>
                <Card className="overflow-hidden group border border-slate-100 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer h-full rounded-2xl flex flex-col bg-white">
                  <div className="h-56 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10 transition-opacity duration-300 group-hover:opacity-90"></div>
                    <img 
                      src={dest.imageUrl || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1000&auto=format&fit=crop'} 
                      alt={language === 'ar' ? dest.nameAr : dest.nameEn} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                    <div className="absolute bottom-5 left-5 right-5 z-20 transform transition-transform duration-300 group-hover:-translate-y-1">
                      <h3 className="text-xl font-bold text-white mb-1.5 drop-shadow-md">{language === 'ar' ? dest.nameAr : dest.nameEn}</h3>
                      <div className="flex items-center text-white/90 text-sm font-medium">
                        <MapPin size={16} className="mr-1.5 rtl:ml-1.5 rtl:mr-0 text-accent" />
                        {dest.country}
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-5 flex-1">
                    <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed">
                      {language === 'ar' ? dest.descriptionAr : dest.descriptionEn}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 text-slate-500 bg-white rounded-2xl shadow-sm border border-slate-100 font-medium text-lg">
            {t("noData")}
          </div>
        )}
      </div>
    </div>
  );
}
