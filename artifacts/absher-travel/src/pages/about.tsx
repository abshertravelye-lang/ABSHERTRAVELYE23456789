import { useTranslation } from "@/hooks/use-translation";
import { Shield, Award, Users, Globe, Target, Eye } from "lucide-react";

export default function About() {
  const { t, language } = useTranslation();

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      <div className="relative bg-primary text-primary-foreground py-32 mb-20 overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1542314831-c53cd4b85ca2?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-primary"></div>
        <div className="container relative z-10 mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">{t("about")}</h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed font-medium">
            {language === 'ar' 
              ? 'ABSHER TRAVEL.. بوابتك نحو تجربة سفر راقية وموثوقة.' 
              : 'ABSHER TRAVEL.. Your gateway to a premium and reliable travel experience.'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-24 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-8 flex items-center">
              <div className="w-12 h-1.5 bg-accent mr-4 rtl:ml-4 rtl:mr-0 rounded-full"></div>
              {language === 'ar' ? 'قصتنا' : 'Our Story'}
            </h2>
            <div className="prose prose-slate max-w-none text-slate-600 leading-loose text-lg font-medium">
              <p className="mb-6">
                {language === 'ar'
                  ? 'تأسست شركة ABSHER TRAVEL في العاصمة اليمنية صنعاء، بهدف تقديم مفهوم جديد ومبتكر في عالم السفر والسياحة. لقد أدركنا الحاجة الماسة إلى خدمات سفر ترتقي للمستويات العالمية وتلبي تطلعات المسافر اليمني.'
                  : 'Absher Travel & Tourism was established in the Yemeni capital, Sana\'a, with the goal of introducing a new and innovative concept in the world of travel and tourism. We recognized the urgent need for travel services that rise to global standards and meet the expectations of the Yemeni traveler.'}
              </p>
              <p>
                {language === 'ar'
                  ? 'منذ انطلاقتنا، حرصنا على بناء شبكة علاقات قوية مع أبرز شركات الطيران العالمية وسلاسل الفنادق الفاخرة لضمان تقديم أفضل الخيارات والأسعار لعملائنا. نحن لا نبيع تذاكر سفر فحسب، بل نصنع ذكريات لا تُنسى.'
                  : 'Since our inception, we have been keen to build a strong network of relationships with the most prominent global airlines and luxury hotel chains to ensure offering the best choices and prices to our clients. We do not just sell travel tickets, we create unforgettable memories.'}
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-accent rounded-3xl translate-x-4 translate-y-4 rtl:-translate-x-4 z-0"></div>
            <img src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1000&auto=format&fit=crop" alt="Absher Travel" className="rounded-3xl relative z-10 shadow-2xl object-cover h-[500px] w-full" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          <div className="bg-white p-10 rounded-2xl shadow-md border border-slate-100 hover:shadow-xl transition-shadow group">
            <div className="w-16 h-16 bg-blue-50 text-secondary rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
              <Eye size={32} strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 mb-4">{language === 'ar' ? 'رؤيتنا' : 'Our Vision'}</h3>
            <p className="text-slate-600 leading-relaxed font-medium">
              {language === 'ar'
                ? 'أن نكون الخيار الأول والأكثر موثوقية لخدمات السفر والسياحة في اليمن والمنطقة، من خلال تقديم خدمات استثنائية تفوق توقعات عملائنا.'
                : 'To be the first and most reliable choice for travel and tourism services in Yemen and the region, by providing exceptional services that exceed our clients\' expectations.'}
            </p>
          </div>
          
          <div className="bg-white p-10 rounded-2xl shadow-md border border-slate-100 hover:shadow-xl transition-shadow group">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
              <Target size={32} strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 mb-4">{language === 'ar' ? 'مهمتنا' : 'Our Mission'}</h3>
            <p className="text-slate-600 leading-relaxed font-medium">
              {language === 'ar'
                ? 'تسهيل وإثراء تجربة السفر لعملائنا من خلال تقديم حلول متكاملة ومبتكرة، والالتزام بأعلى معايير الجودة والمهنية في كل تفاصيل رحلتهم.'
                : 'Facilitating and enriching the travel experience for our clients by providing integrated and innovative solutions, and adhering to the highest standards of quality and professionalism in every detail of their journey.'}
            </p>
          </div>
          
          <div className="bg-white p-10 rounded-2xl shadow-md border border-slate-100 hover:shadow-xl transition-shadow group">
            <div className="w-16 h-16 bg-amber-50 text-accent rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
              <Award size={32} strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 mb-4">{language === 'ar' ? 'قيمنا' : 'Our Values'}</h3>
            <p className="text-slate-600 leading-relaxed font-medium">
              {language === 'ar'
                ? 'المصداقية، الشفافية، التميز في الخدمة، الابتكار، والالتزام بوضع العميل في قلب كل ما نقوم به.'
                : 'Credibility, transparency, excellence in service, innovation, and commitment to putting the client at the heart of everything we do.'}
            </p>
          </div>
        </div>

        <div className="bg-primary text-white rounded-3xl p-12 md:p-16 relative overflow-hidden shadow-2xl">
          <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute left-0 bottom-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>
          
          <div className="relative z-10">
            <h2 className="text-4xl font-extrabold mb-16 text-center tracking-tight">{language === 'ar' ? 'لماذا تختار ABSHER TRAVEL؟' : 'Why Choose ABSHER TRAVEL?'}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-accent backdrop-blur-sm">
                  <Shield size={40} strokeWidth={2} />
                </div>
                <h4 className="text-xl font-bold mb-3">{language === 'ar' ? 'موثوقية وأمان' : 'Reliability & Security'}</h4>
                <p className="text-white/70 text-base leading-relaxed">{language === 'ar' ? 'نضمن لك تجربة سفر آمنة مع أفضل شركاء السفر عالمياً.' : 'We guarantee a secure travel experience with the best global travel partners.'}</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-accent backdrop-blur-sm">
                  <Users size={40} strokeWidth={2} />
                </div>
                <h4 className="text-xl font-bold mb-3">{language === 'ar' ? 'فريق محترف' : 'Professional Team'}</h4>
                <p className="text-white/70 text-base leading-relaxed">{language === 'ar' ? 'خبراء سفر متمرسون لخدمتك وتقديم الاستشارة الأفضل.' : 'Experienced travel experts to serve you and provide the best advice.'}</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-accent backdrop-blur-sm">
                  <Globe size={40} strokeWidth={2} />
                </div>
                <h4 className="text-xl font-bold mb-3">{language === 'ar' ? 'تغطية عالمية' : 'Global Coverage'}</h4>
                <p className="text-white/70 text-base leading-relaxed">{language === 'ar' ? 'شراكات واسعة تتيح لك الوصول لأي وجهة في العالم.' : 'Extensive partnerships allowing you to reach any destination in the world.'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
