import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "ar" | "en";

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.ar) => string;
}

const translations = {
  ar: {
    home: "الرئيسية",
    destinations: "الوجهات",
    offers: "العروض",
    programs: "البرامج السياحية",
    visas: "التأشيرات",
    about: "من نحن",
    contact: "تواصل معنا",
    admin: "لوحة التحكم",
    bookNow: "احجز الآن",
    heroTitle: "أبشر أعمال للسفريات والسياحة",
    heroSub: "بوابتك إلى العالم بخدمات سفر احترافية وأسعار منافسة",
    exploreOffers: "استكشف العروض",
    flightTicketBooking: "حجز تذاكر الطيران",
    hotelBooking: "حجز الفنادق",
    visaServices: "استخراج التأشيرات",
    tourismPrograms: "برامج سياحية",
    umrahPackages: "العمرة",
    carRental: "تأجير السيارات",
    travelInsurance: "التأمين السياحي",
    airportTransfer: "استقبال وتوديع المطارات",
    corporateBookings: "حجوزات الشركات",
    businessServices: "خدمات رجال الأعمال",
    loading: "جاري التحميل...",
    noData: "لا توجد بيانات",
    readMore: "المزيد",
    price: "السعر",
    bookViaWhatsApp: "احجز عبر واتساب",
    contactUs: "تواصل معنا",
    ourServices: "خدماتنا",
    featuredOffers: "العروض المميزة",
    popularDestinations: "الوجهات السياحية",
    ourDestinations: "وجهاتنا",
    tourismProgramsTitle: "البرامج السياحية",
    visaServices2: "خدمات التأشيرات",
    days: "يوم",
    nights: "ليلة",
    from: "من",
    perPerson: "للشخص",
    duration: "المدة",
    processingTime: "مدة الإنجاز",
    fee: "الرسوم",
    requirements: "المتطلبات",
    documents: "الوثائق المطلوبة",
    bookingRequest: "طلب حجز",
    submitRequest: "إرسال الطلب",
    name: "الاسم",
    phone: "رقم الهاتف",
    email: "البريد الإلكتروني",
    destination: "الوجهة",
    travelDate: "تاريخ السفر",
    returnDate: "تاريخ العودة",
    adults: "البالغين",
    children: "الأطفال",
    notes: "ملاحظات",
    flight: "طيران",
    hotel: "فندق",
    program: "برنامج سياحي",
    visa: "تأشيرة",
    aboutUs: "من نحن",
    ourVision: "رؤيتنا",
    ourMission: "رسالتنا",
    ourGoals: "أهدافنا",
    whyUs: "لماذا نحن",
    address: "العنوان",
    phones: "أرقام التواصل",
    sendMessage: "إرسال رسالة",
    subject: "الموضوع",
    message: "الرسالة",
    included: "يشمل",
  },
  en: {
    home: "Home",
    destinations: "Destinations",
    offers: "Offers",
    programs: "Tourism Programs",
    visas: "Visas",
    about: "About Us",
    contact: "Contact Us",
    admin: "Admin",
    bookNow: "Book Now",
    heroTitle: "ABSHER TRAVEL & TOURISM",
    heroSub: "Your Gateway to the World with Professional Travel Services",
    exploreOffers: "Explore Offers",
    flightTicketBooking: "Flight Ticket Booking",
    hotelBooking: "Hotel Booking",
    visaServices: "Visa Services",
    tourismPrograms: "Tourism Programs",
    umrahPackages: "Umrah Packages",
    carRental: "Car Rental",
    travelInsurance: "Travel Insurance",
    airportTransfer: "Airport Transfer",
    corporateBookings: "Corporate Bookings",
    businessServices: "Business Services",
    loading: "Loading...",
    noData: "No data available",
    readMore: "Read More",
    price: "Price",
    bookViaWhatsApp: "Book via WhatsApp",
    contactUs: "Contact Us",
    ourServices: "Our Services",
    featuredOffers: "Featured Offers",
    popularDestinations: "Popular Destinations",
    ourDestinations: "Our Destinations",
    tourismProgramsTitle: "Tourism Programs",
    visaServices2: "Visa Services",
    days: "days",
    nights: "nights",
    from: "From",
    perPerson: "per person",
    duration: "Duration",
    processingTime: "Processing Time",
    fee: "Fee",
    requirements: "Requirements",
    documents: "Required Documents",
    bookingRequest: "Booking Request",
    submitRequest: "Submit Request",
    name: "Name",
    phone: "Phone",
    email: "Email",
    destination: "Destination",
    travelDate: "Travel Date",
    returnDate: "Return Date",
    adults: "Adults",
    children: "Children",
    notes: "Notes",
    flight: "Flight",
    hotel: "Hotel",
    program: "Tourism Program",
    visa: "Visa",
    aboutUs: "About Us",
    ourVision: "Our Vision",
    ourMission: "Our Mission",
    ourGoals: "Our Goals",
    whyUs: "Why Us",
    address: "Address",
    phones: "Phone Numbers",
    sendMessage: "Send Message",
    subject: "Subject",
    message: "Message",
    included: "Included",
  }
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ar");

  useEffect(() => {
    const savedLang = localStorage.getItem("language") as Language | null;
    if (savedLang && (savedLang === "ar" || savedLang === "en")) {
      setLanguageState(savedLang);
      document.documentElement.dir = savedLang === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = savedLang;
    } else {
      document.documentElement.dir = "rtl";
      document.documentElement.lang = "ar";
    }
  }, []);

  const setLanguage = (lang: Language) => {
    localStorage.setItem("language", lang);
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    setLanguageState(lang);
  };

  const t = (key: keyof typeof translations.ar) => {
    return translations[language][key] || key;
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
};
