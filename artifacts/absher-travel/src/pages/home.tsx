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
    { icon: Plane, label: t("flightTicketBooking"), color: "bg-blue-100 text-blue-600" },
    { icon: Building, label: t("hotelBooking"), color: "bg-indigo-100 text-indigo-600" },
    { icon: FileText, label: t("visaServices"), color: "bg-sky-100 text-sky-600" },
    { icon: Map, label: t("tourismPrograms"), color: "bg-emerald-100 text-emerald-600" },
    { icon: Star, label: t("umrahPackages"), color: "bg-amber-100 text-amber-600" },
    { icon: Car, label: t("carRental"), color: "bg-slate-100 text-slate-600" },
    { icon: Shield, label: t("travelInsurance"), color: "bg-teal-100 text-teal-600" },
    { icon: MapPin, label: t("airportTransfer"), color: "bg-orange-100 text-orange-600" },
    { icon: Briefcase, label: t("corporateBookings"), color: "bg-violet-100 text-violet-600" },
    { icon: Users, label: t("businessServices"), color: "bg-rose-100 text-rose-600" }
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          {/* A dark navy gradient overlay on top of an image, or just a rich gradient if image fails */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/60 z-10" />
          <img 
            src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop" 
            alt="Aviation Background" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="container relative z-20 px-4 text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-lg">
            {t("heroTitle")}
          </h1>
          <p className="text-lg md:text-2xl text-slate-200 mb-10 max-w-3xl mx-auto drop-shadow-md">
            {t("heroSub")}
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/book">
              <Button size="lg" className="bg-accent text-primary hover:bg-accent/90 text-lg px-8 py-6 rounded-full font-bold">
                {t("bookNow")}
              </Button>
            </Link>
            <Link href="/offers">
              <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-lg px-8 py-6 rounded-full backdrop-blur-sm">
                {t("exploreOffers")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Booking Engine / Search Widget */}
      <section className="relative z-30 -mt-24 container px-4 mx-auto">
        <Card className="shadow-2xl border-0 rounded-2xl overflow-hidden bg-white/95 backdrop-blur-md">
          <CardContent className="p-0">
            <Tabs defaultValue="flights" className="w-full">
              <TabsList className="w-full grid grid-cols-4 h-auto rounded-none bg-slate-100 p-0">
                <TabsTrigger value="flights" className="py-4 data-[state=active]:bg-white data-[state=active]:text-primary rounded-none text-base"><Plane className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0"/> Flights</TabsTrigger>
                <TabsTrigger value="hotels" className="py-4 data-[state=active]:bg-white data-[state=active]:text-primary rounded-none text-base"><Building className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0"/> Hotels</TabsTrigger>
                <TabsTrigger value="visas" className="py-4 data-[state=active]:bg-white data-[state=active]:text-primary rounded-none text-base"><FileText className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0"/> Visas</TabsTrigger>
                <TabsTrigger value="programs" className="py-4 data-[state=active]:bg-white data-[state=active]:text-primary rounded-none text-base"><Map className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0"/> Programs</TabsTrigger>
              </TabsList>
              <div className="p-6 md:p-8">
                <TabsContent value="flights" className="m-0 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-600">From</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400 rtl:right-3 rtl:left-auto" />
                        <Input placeholder="Origin City or Airport" className="pl-9 rtl:pr-9 rtl:pl-3 h-12" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-600">To</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400 rtl:right-3 rtl:left-auto" />
                        <Input placeholder="Destination City or Airport" className="pl-9 rtl:pr-9 rtl:pl-3 h-12" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-600">Departure</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400 rtl:right-3 rtl:left-auto" />
                        <Input type="date" className="pl-9 rtl:pr-9 rtl:pl-3 h-12" />
                      </div>
                    </div>
                    <div className="space-y-2 flex items-end">
                      <Button className="w-full h-12 bg-primary text-white hover:bg-primary/90 text-lg">
                        <Search className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0" /> Search Flights
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                {/* Add placeholders for others to keep it concise */}
                <TabsContent value="hotels" className="m-0"><p className="text-slate-500 py-4 text-center">Search hotels... (Form similar to flights)</p></TabsContent>
                <TabsContent value="visas" className="m-0"><p className="text-slate-500 py-4 text-center">Search visas... (Form similar to flights)</p></TabsContent>
                <TabsContent value="programs" className="m-0"><p className="text-slate-500 py-4 text-center">Search programs... (Form similar to flights)</p></TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-slate-50">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">{language === 'ar' ? 'خدماتنا المميزة' : 'Our Premium Services'}</h2>
            <div className="w-24 h-1 bg-accent mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <Card key={index} className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${service.color} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon size={32} />
                    </div>
                    <h3 className="font-semibold text-slate-800">{service.label}</h3>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Featured Offers */}
      <section className="py-24">
        <div className="container px-4 mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">{language === 'ar' ? 'عروض مميزة' : 'Featured Offers'}</h2>
              <div className="w-24 h-1 bg-accent rounded-full"></div>
            </div>
            <Link href="/offers" className="text-secondary font-medium flex items-center hover:underline">
              {language === 'ar' ? 'عرض الكل' : 'View All'} 
              {language === 'ar' ? <ArrowLeft className="ml-2 h-4 w-4" /> : <ArrowRight className="ml-2 h-4 w-4" />}
            </Link>
          </div>
          
          {offersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1,2,3].map(i => <div key={i} className="h-80 bg-slate-100 animate-pulse rounded-2xl"></div>)}
            </div>
          ) : offers && offers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {offers.slice(0,3).map(offer => (
                <Card key={offer.id} className="overflow-hidden group border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="h-56 overflow-hidden relative">
                    <img src={offer.imageUrl || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1000&auto=format&fit=crop'} alt={language === 'ar' ? offer.titleAr : offer.titleEn} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-4 right-4 bg-accent text-primary font-bold px-3 py-1 rounded-full text-sm">
                      {offer.price} {offer.currency || 'USD'}
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-primary mb-2 line-clamp-1">{language === 'ar' ? offer.titleAr : offer.titleEn}</h3>
                    <p className="text-slate-500 mb-4 line-clamp-2 text-sm">{language === 'ar' ? offer.descriptionAr : offer.descriptionEn}</p>
                    <div className="flex items-center text-sm text-slate-400 mb-6">
                      <Calendar className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" /> {offer.duration}
                    </div>
                    <Button className="w-full bg-primary hover:bg-primary/90">{t("bookNow")}</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
             <div className="text-center py-12 text-slate-500">{t("noData")}</div>
          )}
        </div>
      </section>
      
      {/* Stats Section */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center"></div>
        <div className="container relative z-10 px-4 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl md:text-6xl font-bold text-accent">15+</div>
              <div className="text-lg font-medium">{language === 'ar' ? 'سنوات خبرة' : 'Years Experience'}</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-6xl font-bold text-accent">50+</div>
              <div className="text-lg font-medium">{language === 'ar' ? 'وجهة سياحية' : 'Destinations'}</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-6xl font-bold text-accent">10k+</div>
              <div className="text-lg font-medium">{language === 'ar' ? 'عميل سعيد' : 'Happy Clients'}</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-6xl font-bold text-accent">24/7</div>
              <div className="text-lg font-medium">{language === 'ar' ? 'دعم فني' : 'Support'}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
