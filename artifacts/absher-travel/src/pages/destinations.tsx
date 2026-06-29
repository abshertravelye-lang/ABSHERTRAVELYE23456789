import { useTranslation } from "@/hooks/use-translation";
import { useListDestinations } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { MapPin } from "lucide-react";

export default function Destinations() {
  const { t, language } = useTranslation();
  const { data: destinations, isLoading } = useListDestinations();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-primary mb-4">{t("destinations")}</h1>
        <div className="w-24 h-1 bg-accent mx-auto rounded-full mb-6"></div>
        <p className="text-slate-500 max-w-2xl mx-auto">
          {language === 'ar' 
            ? 'اكتشف أجمل الوجهات السياحية حول العالم مع باقاتنا المتنوعة التي تناسب جميع الأذواق' 
            : 'Discover the most beautiful tourist destinations around the world with our diverse packages that suit all tastes'}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      ) : destinations && destinations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {destinations.map((dest) => (
            <Link key={dest.id} href={`/destinations/${dest.id}`}>
              <Card className="overflow-hidden group border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer h-full">
                <div className="h-48 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                  <img 
                    src={dest.imageUrl || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1000&auto=format&fit=crop'} 
                    alt={language === 'ar' ? dest.nameAr : dest.nameEn} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  />
                  <div className="absolute bottom-4 left-4 right-4 z-20">
                    <h3 className="text-xl font-bold text-white mb-1 drop-shadow-sm">{language === 'ar' ? dest.nameAr : dest.nameEn}</h3>
                    <div className="flex items-center text-slate-200 text-sm">
                      <MapPin size={14} className="mr-1 rtl:ml-1 rtl:mr-0" />
                      {dest.country}
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="text-slate-500 text-sm line-clamp-2">
                    {language === 'ar' ? dest.descriptionAr : dest.descriptionEn}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 text-slate-500 bg-slate-50 rounded-2xl">
          {t("noData")}
        </div>
      )}
    </div>
  );
}
