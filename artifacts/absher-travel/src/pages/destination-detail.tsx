import { useTranslation } from "@/hooks/use-translation";
import { useGetDestination } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowLeft, ArrowRight, Share2, Heart } from "lucide-react";
import { Link } from "wouter";

export default function DestinationDetail() {
  const { id } = useParams();
  const { t, language } = useTranslation();
  const { data: destination, isLoading } = useGetDestination(Number(id), { 
    query: { enabled: !!id, queryKey: ["destination", id] } 
  });

  const handleWhatsAppBook = () => {
    if (!destination) return;
    const destName = language === 'ar' ? destination.nameAr : destination.nameEn;
    const text = encodeURIComponent(`أرغب في الحجز إلى ${destName} - عدد الأشخاص: - تاريخ السفر: `);
    window.open(`https://wa.me/967779055511?text=${text}`, "_blank");
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!destination) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">{t("noData")}</div>;
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      <div className="h-[50vh] min-h-[400px] relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80 z-10"></div>
        <img 
          src={destination.imageUrl || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2000&auto=format&fit=crop'} 
          alt={language === 'ar' ? destination.nameAr : destination.nameEn} 
          className="w-full h-full object-cover" 
        />
        
        <div className="absolute top-6 left-6 right-6 z-20 flex justify-between items-center">
          <Link href="/destinations">
            <Button variant="outline" size="icon" className="bg-white/20 border-white/30 text-white hover:bg-white/40 backdrop-blur-md rounded-full">
              {language === 'ar' ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="bg-white/20 border-white/30 text-white hover:bg-white/40 backdrop-blur-md rounded-full">
              <Share2 className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" className="bg-white/20 border-white/30 text-white hover:bg-white/40 backdrop-blur-md rounded-full">
              <Heart className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-20 p-6 md:p-12 container mx-auto">
          <div className="flex items-center text-white/80 font-medium mb-3">
            <MapPin className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0" />
            {destination.country}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            {language === 'ar' ? destination.nameAr : destination.nameEn}
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white p-8 rounded-2xl shadow-sm mb-8">
              <h2 className="text-2xl font-bold text-primary mb-6 pb-4 border-b border-slate-100">
                {language === 'ar' ? 'عن الوجهة' : 'About Destination'}
              </h2>
              <div className="prose max-w-none text-slate-600 leading-relaxed">
                {(language === 'ar' ? destination.descriptionAr : destination.descriptionEn).split('\n').map((paragraph, i) => (
                  <p key={i} className="mb-4">{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
          
          <div>
            <div className="bg-white p-6 rounded-2xl shadow-md border-t-4 border-accent sticky top-24">
              <h3 className="text-xl font-bold text-primary mb-6 text-center">
                {language === 'ar' ? 'هل ترغب في السفر إلى هنا؟' : 'Want to travel here?'}
              </h3>
              <p className="text-slate-500 text-sm text-center mb-8">
                {language === 'ar' 
                  ? 'تواصل معنا لتصميم باقة سفر مخصصة لك تلبي جميع احتياجاتك وميزانيتك.' 
                  : 'Contact us to design a custom travel package that meets all your needs and budget.'}
              </p>
              
              <Button 
                className="w-full bg-[#25D366] hover:bg-[#1ebd5a] text-white text-lg h-14 rounded-xl shadow-lg shadow-[#25D366]/20"
                onClick={handleWhatsAppBook}
              >
                <svg xmlns="http://www.0000.com/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 rtl:ml-2 rtl:mr-0"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                {t("bookViaWhatsApp")}
              </Button>
              
              <Link href="/book">
                <Button variant="outline" className="w-full mt-4 h-12 rounded-xl text-primary border-primary/20 hover:bg-primary/5">
                  {language === 'ar' ? 'نموذج طلب حجز' : 'Booking Request Form'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
