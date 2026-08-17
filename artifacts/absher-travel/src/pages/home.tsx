import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plane, Building, FileText, Map, Star, ArrowRight, ArrowLeft, Calendar } from "lucide-react";
import { useListOffers, useListDestinations, useListAppImages } from "@workspace/api-client-react";
import { Link } from "wouter";
import { AppDownloadLinks } from "@/components/app-download-links";
import { AppImage, resolveImageSrc } from "@/components/app-image";

/**
 * Offer `duration` is a single free-text DB field (usually Arabic, e.g.
 * "5 أيام / 4 ليالي"). Localize the common day/night words for display so the
 * English UI doesn't show Arabic remnants (and vice versa).
 */
function localizeDuration(duration: string | null | undefined, ar: boolean): string {
  if (!duration) return "";
  if (ar) {
    return duration
      .replace(/\bdays?\b/gi, "أيام")
      .replace(/\bnights?\b/gi, "ليالي");
  }
  return duration
    .replace(/يوم(اً|ان|ين)?|أيام/g, "days")
    .replace(/ليلة|ليلتان|ليلتين|ليالي?/g, "nights");
}

export default function Home() {
  const { t, language } = useTranslation();

  const { data: offers, isLoading: offersLoading } = useListOffers({ featured: true });
  const { data: destinations, isLoading: destLoading } = useListDestinations();
  // Admin-managed images (unified catalog). Falls back to built-ins when empty.
  const { data: appImages } = useListAppImages();

  const ar = language === "ar";

  const bannerImages = useMemo(() => (appImages ?? []).filter(i => i.category === "home_banner"), [appImages]);
  const serviceImages = useMemo(() => (appImages ?? []).filter(i => i.category === "service_card"), [appImages]);

  // Hero carousel: brand slide(s) + featured offers (like the mobile app home).
  const heroSlides = useMemo(() => {
    const base = bannerImages.length
      ? bannerImages.map(b => ({
          image: resolveImageSrc(b.imageUrl) ?? "",
          title: (ar ? b.titleAr : b.titleEn) || t("heroTitle"),
          subtitle: t("heroSub"),
          badge: null as string | null,
          cta: ar ? "اطلب تأشيرة العمرة أو اطلب تأشيرتك الإلكترونية" : "Request an Umrah or electronic visa",
          href: b.linkUrl || "/visas",
        }))
      : [{
          image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop",
          title: t("heroTitle"),
          subtitle: t("heroSub"),
          badge: null as string | null,
          cta: ar ? "اطلب تأشيرة العمرة أو اطلب تأشيرتك الإلكترونية" : "Request an Umrah or electronic visa",
          href: "/visas",
        }];
    for (const o of offers ?? []) {
      base.push({
        image: o.imageUrl || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1600&auto=format&fit=crop",
        title: ar ? o.titleAr : o.titleEn,
        subtitle: ar ? o.descriptionAr : o.descriptionEn,
        badge: o.discountLabel ?? (ar ? "عرض مميز" : "Featured offer"),
         cta: ar ? "اطلب تأشيرة العمرة أو اطلب تأشيرتك الإلكترونية" : "Request an Umrah or electronic visa",
         href: "/visas",
      });
    }
    return base;
  }, [offers, ar, t, bannerImages]);

  const [heroIndex, setHeroIndex] = useState(0);
  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const id = setInterval(() => setHeroIndex((i) => (i + 1) % heroSlides.length), 6000);
    return () => clearInterval(id);
  }, [heroSlides.length]);
  useEffect(() => {
    // Keep index valid if offers load/change.
    if (heroIndex >= heroSlides.length) setHeroIndex(0);
  }, [heroSlides.length, heroIndex]);

  // Primary services — each links to a REAL page in the system.
  // Umrah is a dedicated standalone service at /umrah.
  // `key` is the canonical service key shared with the admin catalog and the
  // mobile app: a service_card image with relatedEntityId === key overrides
  // this card's bundled image.
  const services = [
    {
      key: "flights",
      icon: Plane,
      emoji: "✈️",
      image: "https://images.unsplash.com/photo-1556388158-158ea5ccacbd?q=80&w=800&auto=format&fit=crop",
      href: "/flights",
      titleAr: "حجز الطيران",
      titleEn: "Flight Booking",
      descAr: "احجز رحلاتك الجوية بأفضل الأسعار",
      descEn: "Book your flights at the best prices",
      color: "bg-blue-50 text-blue-600",
      ring: "group-hover:ring-blue-200",
    },
    {
      key: "hotels",
      icon: Building,
      emoji: "🏨",
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop",
      href: "/hotels",
      titleAr: "الفنادق",
      titleEn: "Hotels",
      descAr: "حجوزات الفنادق في مختلف الوجهات",
      descEn: "Hotel bookings across destinations",
      color: "bg-indigo-50 text-indigo-600",
      ring: "group-hover:ring-indigo-200",
    },
    {
      key: "visas",
      icon: FileText,
      emoji: "🛂",
      image: "https://images.unsplash.com/photo-1578574577315-3fbeb0cecdc2?q=80&w=800&auto=format&fit=crop",
      href: "/visas",
      titleAr: "التأشيرات",
      titleEn: "Visas",
      descAr: "استخراج تأشيرات السفر لأكثر من ١٥٠ وجهة",
      descEn: "Travel visas for 150+ destinations",
      color: "bg-sky-50 text-sky-600",
      ring: "group-hover:ring-sky-200",
    },
    {
      key: "umrah",
      icon: Star,
      emoji: "🕋",
      image: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?q=80&w=800&auto=format&fit=crop",
      href: "/umrah",
      titleAr: "تأشيرة العمرة",
      titleEn: "Umrah Visa",
      descAr: "تقديم طلب تأشيرة العمرة",
      descEn: "Apply for an Umrah visa",
      color: "bg-amber-50 text-amber-600",
      ring: "group-hover:ring-amber-200",
    },
    {
      key: "programs",
      icon: Map,
      emoji: "🌍",
      image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop",
      href: "/programs",
      titleAr: "البرامج السياحية",
      titleEn: "Tourism Programs",
      descAr: "تصفح البرامج السياحية المتاحة",
      descEn: "Browse available tourism programs",
      color: "bg-emerald-50 text-emerald-600",
      ring: "group-hover:ring-emerald-200",
    },
  ];

  return (
    <div className="w-full">
      {/* Hero Section — auto-rotating offers carousel (matches the mobile app home) */}
      <section className="relative h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Slide backgrounds (cross-fade) */}
        <div className="absolute inset-0 z-0">
          {heroSlides.map((slide, i) => (
            <AppImage
              key={i}
              src={slide.image}
              alt=""
              loading={i === 0 ? "eager" : "lazy"}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === heroIndex ? "opacity-100 scale-105" : "opacity-0"}`}
            />
          ))}
          <div className="absolute inset-0 bg-primary/70 z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/50 to-transparent z-10" />
        </div>

        <div className="container relative z-20 px-4 text-center mt-[-4rem]" dir={ar ? "rtl" : "ltr"}>
          {heroSlides[heroIndex]?.badge && (
            <span className="inline-flex items-center gap-2 bg-accent text-primary font-bold px-4 py-1.5 rounded-full text-sm mb-5 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-500">
              {heroSlides[heroIndex].badge}
            </span>
          )}
          <h1 key={`t-${heroIndex}`} className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 drop-shadow-sm tracking-tight animate-in fade-in slide-in-from-bottom-3 duration-700">
            {heroSlides[heroIndex]?.title ?? t("heroTitle")}
          </h1>
          <p key={`s-${heroIndex}`} className="text-lg md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto drop-shadow-sm font-medium animate-in fade-in slide-in-from-bottom-3 duration-700">
            {heroSlides[heroIndex]?.subtitle ?? t("heroSub")}
          </p>

           <div className="flex justify-center">
            <Link href={heroSlides[heroIndex]?.href ?? "/book"}>
              <Button size="lg" className="bg-accent text-primary hover:bg-accent/90 text-lg px-8 py-6 rounded-xl font-bold shadow-xl shadow-accent/20 transition-all hover:-translate-y-1">
                 {heroSlides[heroIndex]?.cta ?? (ar ? "اطلب تأشيرة العمرة أو اطلب تأشيرتك الإلكترونية" : "Request an Umrah or electronic visa")}
              </Button>
            </Link>
          </div>

          {/* Slide dots */}
          {heroSlides.length > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  aria-label={`slide ${i + 1}`}
                  onClick={() => setHeroIndex(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${i === heroIndex ? "w-8 bg-accent" : "w-2 bg-white/40 hover:bg-white/70"}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Services showcase — floating over the hero (replaces the old search widget) */}
      <section className="relative z-30 -mt-28 container px-4 mx-auto" dir={ar ? "rtl" : "ltr"}>
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 bg-white/10 text-[#D4AF37] border border-[#D4AF37]/40 px-4 py-1.5 rounded-full text-sm font-bold tracking-wide backdrop-blur-md shadow-sm">
            {ar ? "خدماتنا" : "Our Services"}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
          {services.map((service, index) => {
            const Icon = service.icon;
            const title = ar ? service.titleAr : service.titleEn;
            const desc = ar ? service.descAr : service.descEn;
            // Admin-managed override: a service_card image is assigned via the
            // explicit service key (relatedEntityType "service" + relatedEntityId).
            // Same convention as the mobile app.
            const managed = serviceImages.find(s => s.relatedEntityType === "service" && s.relatedEntityId === service.key);
            const cardImage = managed ? managed.imageUrl : service.image;
            return (
              <Link key={index} href={service.href} className="group block h-full" data-testid={`link-service-${index}`}>
                <div className={`h-full bg-white rounded-2xl border border-slate-100 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden ring-0 ring-transparent ${service.ring} group-hover:ring-4`}>
                  {/* Card image */}
                  <div className="relative h-28 md:h-32 overflow-hidden">
                    <AppImage
                      src={cardImage}
                      fallback={service.image}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#052B5B]/70 via-[#052B5B]/10 to-transparent" />
                    <div className={`absolute bottom-0 ${ar ? "right-3" : "left-3"} translate-y-1/2 w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${service.color} bg-white`}>
                      <Icon size={22} strokeWidth={2.5} />
                    </div>
                  </div>
                  {/* Card body */}
                  <div className={`px-4 pt-8 pb-4 ${ar ? "text-right" : "text-left"}`}>
                    <h3 className="font-bold text-[#052B5B] text-sm md:text-base mb-1">{title}</h3>
                    <p className="text-xs md:text-[13px] text-slate-500 leading-relaxed">{desc}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity">
                      {ar ? "اذهب للخدمة" : "Explore"}
                      {ar ? <ArrowLeft className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
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
                    <AppImage src={offer.imageUrl} fallback='https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1000&auto=format&fit=crop' alt={language === 'ar' ? offer.titleAr : offer.titleEn} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute top-4 right-4 bg-accent text-primary font-bold px-4 py-1.5 rounded-full text-sm shadow-md tabular-nums">
                      {offer.price ?? '—'} {offer.currency || 'USD'}
                    </div>
                  </div>
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-1">{language === 'ar' ? offer.titleAr : offer.titleEn}</h3>
                    <p className="text-slate-600 mb-6 line-clamp-2 text-sm leading-relaxed flex-1">{language === 'ar' ? offer.descriptionAr : offer.descriptionEn}</p>
                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100">
                      <div className="flex items-center text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg tabular-nums">
                        <Calendar className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0 text-secondary" /> {localizeDuration(offer.duration, language === 'ar')}
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

      {/* App Download Promo — renders only when a store link is configured */}
      <AppDownloadLinks variant="section" />
    </div>
  );
}
