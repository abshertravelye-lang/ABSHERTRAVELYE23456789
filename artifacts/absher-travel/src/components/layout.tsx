import { Link, useLocation } from "wouter";
import { useTranslation } from "@/hooks/use-translation";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Globe, Menu, X, User, LogOut, Mail, MessageCircle, Headphones, Building2 } from "lucide-react";
import logoMark from "@assets/absher-business-logo.png";
import { useState } from "react";
import { AppDownloadLinks } from "@/components/app-download-links";
import { LogoutConfirmDialog } from "@/components/logout-confirm-dialog";
import { SupportChat, openSupportChat } from "@/components/support-chat";

function AccountNavButton({ language }: { language: string }) {
  const { isAuthenticated, user, logout } = useAuth();
  const ar = language === "ar";
  const [confirmOpen, setConfirmOpen] = useState(false);

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
      <Button variant="ghost" size="icon" onClick={() => setConfirmOpen(true)} title={ar ? "تسجيل الخروج" : "Sign out"}>
        <LogOut size={16} />
      </Button>
      <LogoutConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={logout}
        ar={ar}
      />
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { t, language, setLanguage } = useTranslation();
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileLogoutOpen, setMobileLogoutOpen] = useState(false);
  const [location] = useLocation();

  // The B2B Agent Portal renders its own full-screen shell — no site chrome.
  if (location.startsWith("/agent")) {
    return (
      <>
        {children}
        <SupportChat />
      </>
    );
  }

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

  if (isAuthenticated) {
    navLinks.splice(1, 0, { href: "/account", label: language === "ar" ? "طلباتي" : "My Requests" });
  }

  return (
    <div className="min-h-[100dvh] flex flex-col w-full overflow-x-hidden bg-background">
      {/* Top Bar — language switch only (contact info moved to footer) */}
      <div className="bg-primary text-primary-foreground py-2 px-4 text-sm hidden md:block">
        <div className="container mx-auto flex justify-end items-center">
          <Button variant="ghost" size="sm" onClick={toggleLanguage} className="h-8 hover:bg-white/10 hover:text-white">
            <Globe size={16} className="mr-2 rtl:ml-2 rtl:mr-0" />
            {language === "ar" ? "English" : "العربية"}
          </Button>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4" aria-label="ABSHER TRAVEL">
            {/* Icon mark — standalone, no background */}
            <img
              src={logoMark}
              alt=""
              className="h-14 w-14 shrink-0 object-contain mix-blend-multiply"
            />
            {/* Divider */}
            <span className="h-10 w-px bg-slate-200 hidden sm:block shrink-0" aria-hidden="true" />
            {/* Wordmark */}
            <span className="hidden sm:flex flex-col leading-tight">
              <span className="text-lg font-extrabold tracking-wide text-primary">ABSHER TRAVEL</span>
              <span className="text-[10px] text-slate-400 font-medium">
                {language === "ar" ? "شريكك المتميز في السفر" : "Your premium travel partner"}
              </span>
            </span>
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
              {isAuthenticated ? (
                <>
                  <Link href="/account" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full gap-2 justify-start">
                      <User size={16} />
                      {user?.firstName || (language === "ar" ? "حسابي" : "My Account")}
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full gap-2 justify-start text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    onClick={() => { setMobileMenuOpen(false); setMobileLogoutOpen(true); }}
                  >
                    <LogOut size={16} />
                    {language === "ar" ? "تسجيل الخروج" : "Sign out"}
                  </Button>
                </>
              ) : (
                <div onClick={() => setMobileMenuOpen(false)}>
                  <AccountNavButton language={language} />
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* In-app Support Chat (replaces the old WhatsApp redirect) */}
      <SupportChat />

      <LogoutConfirmDialog
        open={mobileLogoutOpen}
        onOpenChange={setMobileLogoutOpen}
        onConfirm={logout}
        ar={language === "ar"}
      />

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground pt-16 pb-8">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={logoMark} alt="Absher Travel" className="h-16 w-16 object-contain shrink-0" />
              <div className="flex flex-col leading-tight">
                <span className="text-lg font-extrabold tracking-wide text-white">ABSHER TRAVEL</span>
                <span className="text-[10px] text-slate-300 font-medium">
                  {language === "ar" ? "شريكك المتميز في السفر" : "Your premium travel partner"}
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-300">
              {t("heroSub")}
            </p>
            <AppDownloadLinks variant="footer" />
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
              <li className="pt-3 mt-1 border-t border-white/10">
                <Link href="/agent" className="text-sm text-accent hover:text-white transition-colors font-medium flex items-center gap-1.5">
                  <Building2 size={13} />
                  {language === "ar" ? "بوابة الوكلاء" : "Agent Portal"}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 text-accent flex items-center gap-2">
              <Headphones size={18} className="text-accent shrink-0" />
              {language === 'ar' ? 'الدعم والتواصل' : 'Support & Contact'}
            </h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li>
                <button
                  type="button"
                  onClick={() => openSupportChat()}
                  className="flex items-center gap-2 hover:text-white transition-colors text-start"
                  data-testid="link-footer-contact"
                >
                  <MessageCircle size={16} className="text-accent shrink-0" />
                  {language === 'ar' ? 'الدردشة المباشرة' : 'Live Chat'}
                </button>
              </li>
              <li>
                <a href="mailto:info@abshertravel.com" className="flex items-center gap-2 hover:text-white transition-colors" dir="ltr">
                  <Mail size={16} className="text-accent shrink-0" />
                  info@abshertravel.com
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 text-accent">
              {language === 'ar' ? 'النشرة البريدية' : 'Newsletter'}
            </h3>
            <p className="text-sm text-slate-300 mb-3">
              {language === 'ar'
                ? 'اشترك ليصلك أحدث العروض والوجهات.'
                : 'Subscribe for the latest offers and destinations.'}
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                aria-label={language === 'ar' ? 'بريدك الإلكتروني' : 'Your email'}
                placeholder={language === 'ar' ? 'بريدك الإلكتروني' : 'Your email'}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                className="bg-white/10 border-white/20 text-white rounded px-3 py-2 text-sm w-full placeholder:text-slate-400"
              />
              <Button className="bg-accent text-primary hover:bg-accent/90 shrink-0">
                {language === 'ar' ? 'اشتراك' : 'Subscribe'}
              </Button>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 text-center text-sm text-slate-400">
          <p>
            © {new Date().getFullYear()} {language === 'ar' ? 'أبشر للسفريات والسياحة. جميع الحقوق محفوظة.' : 'ABSHER TRAVEL & TOURISM. All rights reserved.'}
          </p>
        </div>
      </footer>
    </div>
  );
}
