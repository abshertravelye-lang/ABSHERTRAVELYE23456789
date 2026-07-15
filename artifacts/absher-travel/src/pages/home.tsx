import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plane, Building, FileText, Map, Star, Car, Shield, MapPin, Briefcase, Users, Calendar, Search, ArrowRight, ArrowLeft } from "lucide-react";
import { useListOffers, useListDestinations } from "@workspace/api-client-react";
import { Link } from "wouter";

export default function Home() {
  const { t, language } = useTranslation();
  
  const { data: offers, isLoading: offersLoading } = useListOffers({ featured: true });
  const { data: destinations, isLoading: destLoading } = useListDestinations();

  const services = [
    { icon: Plane, label: t("flightTicketBooking"), color: "bg-blue-50 text-blue-600" },
    { icon: Building, label: t("hotelBooking"), color: "bg-indigo-50 text-indigo-600" },
    { icon: FileText, label: t("visaServices"), color: "bg-sky-50 text-sky-600" },
    { icon: Map, label: t("tourismPrograms"), color: "bg-emerald-50 text-emerald-600" },
    { icon: Star, label: t("umrahPackages"), color: "bg-amber-50 text-amber-600" },
    { icon: Car, label: t("carRental"), color: "bg-slate-100 text-slate-600" },
    { icon: Shield, label: t("travelInsurance"), color: "bg-teal-50 text-teal-600" },
    { icon: MapPin, label: t("airportTransfer"), color: "bg-orange-50 text-orange-600" },
    { icon: Briefcase, label: t("corporateBookings"), color: "bg-violet-50 text-violet-600" },
    { icon: Users, label: t("businessServices"), color: "bg-rose-50 text-rose-600" }
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-primary/70 z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/50 to-transparent z-10" />
          <img 
            src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop" 
            alt="Aviation Background" 
            className="w-full h-full object-cover scale-105 animate-in fade-in zoom-in duration-1000"
          />
        </div>
        
        <div className="container relative z-20 px-4 text-center mt-[-4rem]">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 drop-shadow-sm tracking-tight">
            {t("heroTitle")}
          </h1>
          <p className="text-lg md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto drop-shadow-sm font-medium">
            {t("heroSub")}
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/book">
              <Button size="lg" className="bg-accent text-primary hover:bg-accent/90 text-lg px-8 py-6 rounded-xl font-bold shadow-xl shadow-accent/20 transition-all hover:-translate-y-1">
                {t("bookNow")}
              </Button>
            </Link>
            <Link href="/offers">
              <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-lg px-8 py-6 rounded-xl backdrop-blur-md transition-all hover:-translate-y-1">
                {t("exploreOffers")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Booking Engine / Search Widget */}
      <section className="relative z-30 -mt-24 container px-4 mx-auto">
        <Card className="shadow-2xl border border-slate-100 rounded-2xl overflow-hidden bg-white">
          <CardContent className="p-0">
            <Tabs defaultValue="flights" className="w-full">
              <TabsList className="w-full grid grid-cols-4 h-auto rounded-none bg-slate-50/50 p-0 border-b border-slate-100">
                <TabsTrigger value="flights" className="py-5 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none text-base font-semibold transition-all"><Plane className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0"/> <span className="hidden sm:inline">Flights</span></TabsTrigger>
                <TabsTrigger value="hotels" className="py-5 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none text-base font-semibold transition-all"><Building className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0"/> <span className="hidden sm:inline">Hotels</span></TabsTrigger>
                <TabsTrigger value="visas" className="py-5 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none text-base font-semibold transition-all"><FileText className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0"/> <span className="hidden sm:inline">Visas</span></TabsTrigger>
                <TabsTrigger value="programs" className="py-5 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none text-base font-semibold transition-all"><Map className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0"/> <span className="hidden sm:inline">Programs</span></TabsTrigger>
              </TabsList>
              <div className="p-6 md:p-8 bg-white">
                <TabsContent value="flights" className="m-0 space-y-4 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">From</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 rtl:right-3 rtl:left-auto" />
                        <Input placeholder="Origin City or Airport" className="pl-10 rtl:pr-10 rtl:pl-3 h-12 bg-slate-50 border-slate-200 focus:bg-white text-base" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">To</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 rtl:right-3 rtl:left-auto" />
                        <Input placeholder="Destination City or Airport" className="pl-10 rtl:pr-10 rtl:pl-3 h-12 bg-slate-50 border-slate-200 focus:bg-white text-base" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Departure</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 rtl:right-3 rtl:left-auto" />
                        <Input type="date" className="pl-10 rtl:pr-10 rtl:pl-3 h-12 bg-slate-50 border-slate-200 focus:bg-white text-base tabular-nums" />
                      </div>
                    </div>
                    <div className="space-y-2 flex items-end">
                      <Button className="w-full h-12 bg-primary text-white hover:bg-primary/90 text-lg font-semibold rounded-xl">
                        <Search className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0" /> Search
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="hotels" className="m-0"><div className="py-12 flex flex-col items-center justify-center text-slate-500"><Building className="h-12 w-12 mb-4 text-slate-300" /><p className="text-lg font-medium">{language === 'ar' ? 'البحث عن فنادق' : 'Search hotels'}</p></div></TabsContent>
                <TabsContent value="visas" className="m-0"><div className="py-12 flex flex-col items-center justify-center text-slate-500"><FileText className="h-12 w-12 mb-4 text-slate-300" /><p className="text-lg font-medium">{language === 'ar' ? 'استعلام عن تأشيرة' : 'Search visas'}</p></div></TabsContent>
                <TabsContent value="programs" className="m-0"><div className="py-12 flex flex-col items-center justify-center text-slate-500"><Map className="h-12 w-12 mb-4 text-slate-300" /><p className="text-lg font-medium">{language === 'ar' ? 'تصفح البرامج' : 'Explore programs'}</p></div></TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-slate-50">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-primary mb-4 tracking-tight">{language === 'ar' ? 'خدماتنا المميزة' : 'Our Premium Services'}</h2>
            <div className="w-24 h-1.5 bg-accent mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <Card key={index} className="border border-slate-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group bg-white">
                  <CardContent className="p-6 md:p-8 flex flex-col items-center text-center space-y-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${service.color} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon size={28} strokeWidth={2.5} />
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm md:text-base">{service.label}</h3>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Featured Offers */}
      <section className="py-24 bg-white">
        <div className="container px-4 mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-primary mb-4 tracking-tight">{language === 'ar' ? 'عروض مميزة' : 'Featured Offers'}</h2>
              <div className="w-24 h-1.5 bg-accent rounded-full"></div>
            </div>
            <Link href="/offers" className="text-secondary font-semibold flex items-center hover:underline group">
              {language === 'ar' ? 'عرض الكل' : 'View All'} 
              {language === 'ar' ? <ArrowLeft className="ml-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> : <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />}
            </Link>
          </div>
          
          {offersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1,2,3].map(i => <div key={i} className="h-[450px] bg-slate-100 animate-pulse rounded-2xl"></div>)}
            </div>
          ) : offers && offers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {offers.slice(0,3).map(offer => (
                <Card key={offer.id} className="overflow-hidden group border border-slate-100 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col h-full rounded-2xl">
                  <div className="h-60 overflow-hidden relative">
                    <img src={offer.imageUrl || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1000&auto=format&fit=crop'} alt={language === 'ar' ? offer.titleAr : offer.titleEn} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute top-4 right-4 bg-accent text-primary font-bold px-4 py-1.5 rounded-full text-sm shadow-md tabular-nums">
                      {offer.price} {offer.currency || 'USD'}
                    </div>
                  </div>
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-1">{language === 'ar' ? offer.titleAr : offer.titleEn}</h3>
                    <p className="text-slate-600 mb-6 line-clamp-2 text-sm leading-relaxed flex-1">{language === 'ar' ? offer.descriptionAr : offer.descriptionEn}</p>
                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100">
                      <div className="flex items-center text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg tabular-nums">
                        <Calendar className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0 text-secondary" /> {offer.duration}
                      </div>
                    </div>
                    <Button className="w-full bg-primary hover:bg-primary/90 rounded-xl h-12 font-bold text-base">{t("bookNow")}</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
             <div className="text-center py-20 text-slate-500 bg-slate-50 rounded-2xl border border-slate-100 font-medium">
               {t("noData")}
             </div>
          )}
        </div>
      </section>
      
      {/* Stats Section */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-primary/80"></div>
        <div className="container relative z-10 px-4 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
            <div className="space-y-3">
              <div className="text-4xl md:text-6xl font-extrabold text-accent tabular-nums drop-shadow-sm">15+</div>
              <div className="text-lg font-semibold text-white/90">{language === 'ar' ? 'سنوات خبرة' : 'Years Experience'}</div>
            </div>
            <div className="space-y-3">
              <div className="text-4xl md:text-6xl font-extrabold text-accent tabular-nums drop-shadow-sm">50+</div>
              <div className="text-lg font-semibold text-white/90">{language === 'ar' ? 'وجهة سياحية' : 'Destinations'}</div>
            </div>
            <div className="space-y-3">
              <div className="text-4xl md:text-6xl font-extrabold text-accent tabular-nums drop-shadow-sm">10k+</div>
              <div className="text-lg font-semibold text-white/90">{language === 'ar' ? 'عميل سعيد' : 'Happy Clients'}</div>
            </div>
            <div className="space-y-3">
              <div className="text-4xl md:text-6xl font-extrabold text-accent tabular-nums drop-shadow-sm">24/7</div>
              <div className="text-lg font-semibold text-white/90">{language === 'ar' ? 'دعم فني' : 'Support'}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
