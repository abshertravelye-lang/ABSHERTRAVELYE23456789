import { useTranslation } from "@/hooks/use-translation";
import { Shield, Award, Users, Globe, Target, Eye } from "lucide-react";

export default function About() {
  const { t, language } = useTranslation();

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      <div className="relative bg-primary text-primary-foreground py-24 mb-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1542314831-c53cd4b85ca2?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center"></div>
        <div className="container relative z-10 mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">{t("about")}</h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            {language === 'ar' 
              ? 'أبشر أعمال للسفريات والسياحة.. بوابتك نحو تجربة سفر راقية وموثوقة.' 
              : 'Absher Travel & Tourism.. Your gateway to a premium and reliable travel experience.'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20 items-center">
          <div>
            <h2 className="text-3xl font-bold text-primary mb-6 flex items-center">
              <div className="w-12 h-1 bg-accent mr-4 rtl:ml-4 rtl:mr-0 rounded-full"></div>
              {language === 'ar' ? 'قصتنا' : 'Our Story'}
            </h2>
            <div className="prose prose-slate max-w-none text-slate-600 leading-loose text-lg">
              <p className="mb-4">
                {language === 'ar'
                  ? 'تأسست شركة أبشر أعمال للسفريات والسياحة في العاصمة اليمنية صنعاء، بهدف تقديم مفهوم جديد ومبتكر في عالم السفر والسياحة. لقد أدركنا الحاجة الماسة إلى خدمات سفر ترتقي للمستويات العالمية وتلبي تطلعات المسافر اليمني.'
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
            <img src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1000&auto=format&fit=crop" alt="Absher Travel" className="rounded-3xl relative z-10 shadow-xl object-cover h-[400px] w-full" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-blue-100 text-secondary rounded-2xl flex items-center justify-center mb-6">
              <Eye size={28} />
            </div>
            <h3 className="text-2xl font-bold text-primary mb-4">{language === 'ar' ? 'رؤيتنا' : 'Our Vision'}</h3>
            <p className="text-slate-600 leading-relaxed">
              {language === 'ar'
                ? 'أن نكون الخيار الأول والأكثر موثوقية لخدمات السفر والسياحة في اليمن والمنطقة، من خلال تقديم خدمات استثنائية تفوق توقعات عملائنا.'
                : 'To be the first and most reliable choice for travel and tourism services in Yemen and the region, by providing exceptional services that exceed our clients\' expectations.'}
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
              <Target size={28} />
            </div>
            <h3 className="text-2xl font-bold text-primary mb-4">{language === 'ar' ? 'مهمتنا' : 'Our Mission'}</h3>
            <p className="text-slate-600 leading-relaxed">
              {language === 'ar'
                ? 'تسهيل وإثراء تجربة السفر لعملائنا من خلال تقديم حلول متكاملة ومبتكرة، والالتزام بأعلى معايير الجودة والمهنية في كل تفاصيل رحلتهم.'
                : 'Facilitating and enriching the travel experience for our clients by providing integrated and innovative solutions, and adhering to the highest standards of quality and professionalism in every detail of their journey.'}
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-amber-100 text-accent rounded-2xl flex items-center justify-center mb-6">
              <Award size={28} />
            </div>
            <h3 className="text-2xl font-bold text-primary mb-4">{language === 'ar' ? 'قيمنا' : 'Our Values'}</h3>
            <p className="text-slate-600 leading-relaxed">
              {language === 'ar'
                ? 'المصداقية، الشفافية، التميز في الخدمة، الابتكار، والالتزام بوضع العميل في قلب كل ما نقوم به.'
                : 'Credibility, transparency, excellence in service, innovation, and commitment to putting the client at the heart of everything we do.'}
            </p>
          </div>
        </div>

        <div className="bg-primary text-white rounded-3xl p-12 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute left-0 bottom-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-10 text-center">{language === 'ar' ? 'لماذا تختار أبشر أعمال؟' : 'Why Choose Absher Travel?'}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 text-accent">
                  <Shield size={32} />
                </div>
                <h4 className="text-xl font-semibold mb-2">{language === 'ar' ? 'موثوقية وأمان' : 'Reliability & Security'}</h4>
                <p className="text-slate-300 text-sm">{language === 'ar' ? 'نضمن لك تجربة سفر آمنة مع أفضل شركاء السفر عالمياً.' : 'We guarantee a secure travel experience with the best global travel partners.'}</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 text-accent">
                  <Users size={32} />
                </div>
                <h4 className="text-xl font-semibold mb-2">{language === 'ar' ? 'فريق محترف' : 'Professional Team'}</h4>
                <p className="text-slate-300 text-sm">{language === 'ar' ? 'خبراء سفر متمرسون لخدمتك وتقديم الاستشارة الأفضل.' : 'Experienced travel experts to serve you and provide the best advice.'}</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 text-accent">
                  <Globe size={32} />
                </div>
                <h4 className="text-xl font-semibold mb-2">{language === 'ar' ? 'تغطية عالمية' : 'Global Coverage'}</h4>
                <p className="text-slate-300 text-sm">{language === 'ar' ? 'شراكات واسعة تتيح لك الوصول لأي وجهة في العالم.' : 'Extensive partnerships allowing you to reach any destination in the world.'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
