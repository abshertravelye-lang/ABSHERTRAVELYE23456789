import { Link } from "wouter";
import { useTranslation } from "@/hooks/use-translation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Globe, Menu, X, Phone, MapPin, User, LogOut } from "lucide-react";
import logo from "@assets/absher-business-logo.png";
import { useState } from "react";

function AccountNavButton({ language }: { language: string }) {
  const { isAuthenticated, user, logout } = useAuth();
  const ar = language === "ar";

  if (!isAuthenticated) {
    return (
      <Link href="/login">
        <Button variant="outline" size="sm" className="ml-2 rtl:mr-2 rtl:ml-0 gap-2">
          <User size={16} />
          {ar ? "تسجيل الدخول" : "Sign in"}
        </Button>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2 ml-2 rtl:mr-2 rtl:ml-0">
      <Link href="/account">
        <Button variant="outline" size="sm" className="gap-2">
          <User size={16} />
          {user?.firstName || (ar ? "حسابي" : "My Account")}
        </Button>
      </Link>
      <Button variant="ghost" size="icon" onClick={logout} title={ar ? "تسجيل الخروج" : "Sign out"}>
        <LogOut size={16} />
      </Button>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { t, language, setLanguage } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === "ar" ? "en" : "ar");
  };

  const navLinks = [
    { href: "/", label: t("home") },
    { href: "/destinations", label: t("destinations") },
    { href: "/offers", label: t("offers") },
    { href: "/programs", label: t("programs") },
    { href: "/visas", label: t("visas") },
    { href: "/about", label: t("about") },
    { href: "/contact", label: t("contact") },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col w-full overflow-x-hidden bg-background">
      {/* Top Bar */}
      <div className="bg-primary text-primary-foreground py-2 px-4 text-sm hidden md:block">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-accent" />
              <span>+967 779055511 / +967 784055511</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-accent" />
              <span>{language === 'ar' ? 'اليمن - صنعاء - شارع الزبيري - جولة كنتاكي سابقاً' : 'Yemen - Sana\'a - Zubairi St'}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={toggleLanguage} className="h-8 hover:bg-white/10 hover:text-white">
              <Globe size={16} className="mr-2 rtl:ml-2 rtl:mr-0" />
              {language === "ar" ? "English" : "العربية"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src={logo} alt="Absher Travel Logo" className="h-14 object-contain" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-primary transition-colors">
                {link.label}
              </Link>
            ))}
            <Link href="/book">
              <Button className="ml-4 rtl:mr-4 rtl:ml-0 bg-accent text-primary hover:bg-accent/90">
                {t("bookNow")}
              </Button>
            </Link>
            <AccountNavButton language={language} />
          </nav>

          {/* Mobile Actions */}
          <div className="flex items-center gap-2 lg:hidden">
            <Button variant="ghost" size="icon" onClick={toggleLanguage}>
              <Globe size={20} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t p-4 bg-white space-y-4">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className="block px-4 py-2 text-base font-medium text-slate-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t space-y-3">
              <Link href="/book" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-accent text-primary">{t("bookNow")}</Button>
              </Link>
              <div onClick={() => setMobileMenuOpen(false)}>
                <AccountNavButton language={language} />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* WhatsApp Floating Button */}
      <a 
        href="https://wa.me/967779055511" 
        target="_blank" 
        rel="noreferrer"
        className="fixed bottom-6 right-6 rtl:left-6 rtl:right-auto bg-[#25D366] text-white p-4 rounded-full shadow-xl hover:scale-110 transition-transform z-50 flex items-center justify-center"
      >
        <svg xmlns="http://www.0000.com/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
      </a>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground pt-16 pb-8">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="space-y-4">
            <img src={logo} alt="Absher Travel Logo" className="h-16 object-contain bg-white/10 p-2 rounded" />
            <p className="text-sm text-slate-300">
              {t("heroSub")}
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 text-accent">{t("about")}</h3>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-300 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 text-accent">{t("contact")}</h3>
            <ul className="space-y-4 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <MapPin size={18} className="text-accent shrink-0" />
                <span>{language === 'ar' ? 'اليمن - صنعاء - شارع الزبيري - جولة كنتاكي سابقاً' : 'Yemen - Sana\'a - Zubairi St'}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={18} className="text-accent shrink-0" />
                <span>+967 779055511 <br/> +967 784055511</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 text-accent">Newsletter</h3>
            <div className="flex gap-2">
              <input type="email" placeholder="Email" className="bg-white/10 border-white/20 text-white rounded px-3 py-2 text-sm w-full" />
              <Button className="bg-accent text-primary hover:bg-accent/90">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 text-center text-sm text-slate-400">
          <p>© {new Date().getFullYear()} ABSHER TRAVEL & TOURISM. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
