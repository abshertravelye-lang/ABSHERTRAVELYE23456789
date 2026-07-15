import { Switch, Route, Link, useLocation } from "wouter";
import { useTranslation } from "@/hooks/use-translation";
import {
  LayoutDashboard, Ticket, Map, MessageSquare, Briefcase, FileText,
  Users, Globe, LogOut, Wrench
} from "lucide-react";
import { lazy, Suspense } from "react";
import DashboardOverview from "./dashboard-overview";

const ProgramsAdmin = lazy(() => import("./programs-admin"));
const VisasAdmin = lazy(() => import("./visas-admin"));

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

export default function AdminLayout() {
  const { language } = useTranslation();
  const [location] = useLocation();
  const ar = language === "ar";

  const navItems = [
    { href: "/admin",              icon: LayoutDashboard, labelAr: "نظرة عامة",       labelEn: "Overview" },
    { href: "/admin/programs",     icon: Map,             labelAr: "البرامج السياحية", labelEn: "Programs" },
    { href: "/admin/visas",        icon: Globe,           labelAr: "التأشيرات",        labelEn: "Visas" },
    { href: "/admin/bookings",     icon: Ticket,          labelAr: "الحجوزات",         labelEn: "Bookings" },
    { href: "/admin/offers",       icon: Briefcase,       labelAr: "العروض",           labelEn: "Offers" },
    { href: "/admin/destinations", icon: Map,             labelAr: "الوجهات",          labelEn: "Destinations" },
    { href: "/admin/customers",    icon: Users,           labelAr: "العملاء",          labelEn: "Customers" },
    { href: "/admin/messages",     icon: MessageSquare,   labelAr: "الرسائل",          labelEn: "Messages" },
  ];

  const currentItem = navItems.find(i =>
    i.href === "/admin" ? location === "/admin" : location.startsWith(i.href)
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans" dir={ar ? "rtl" : "ltr"}>
      {/* Admin Sidebar */}
      <aside className="w-64 bg-primary text-slate-300 flex flex-col shrink-0 shadow-xl z-20">
        <div className="h-20 flex items-center justify-center border-b border-white/10 px-6">
          <div className="text-center">
            <div className="font-extrabold text-lg text-white tracking-wide">ABSHER ADMIN</div>
            <div className="text-xs text-accent mt-1 font-medium">{ar ? "لوحة التحكم" : "Control Panel"}</div>
          </div>
        </div>
        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.href === "/admin"
              ? location === "/admin"
              : location.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <span className={`flex items-center px-4 py-3 rounded-xl transition-all cursor-pointer gap-3 font-medium ${isActive ? "bg-accent text-primary shadow-md" : "hover:bg-white/10 hover:text-white"}`}>
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="text-sm">{ar ? item.labelAr : item.labelEn}</span>
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <Link href="/">
            <span className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 hover:text-white cursor-pointer transition-colors text-sm font-medium">
              <LogOut className="w-5 h-5 shrink-0" />
              {ar ? "العودة للموقع" : "Back to Site"}
            </span>
          </Link>
        </div>
      </aside>

      {/* Admin Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center px-8 justify-between shrink-0 shadow-sm">
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
            {currentItem ? (ar ? currentItem.labelAr : currentItem.labelEn) : (ar ? "لوحة الإدارة" : "Admin Panel")}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-500 font-medium hidden md:block">{ar ? "مرحباً، مدير النظام" : "Welcome, Admin"}</div>
            <div className="w-10 h-10 rounded-full bg-primary text-accent flex items-center justify-center font-bold text-lg shadow-sm border border-primary/10">A</div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          <Suspense fallback={<LoadingSpinner />}>
            <Switch>
              <Route path="/admin" component={DashboardOverview} />
              <Route path="/admin/programs" component={ProgramsAdmin} />
              <Route path="/admin/visas" component={VisasAdmin} />
              <Route path="/admin/:rest*">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-20 text-center text-slate-500 flex flex-col items-center justify-center min-h-[60vh]">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <Wrench className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">{ar ? "قيد التطوير" : "Under Development"}</h3>
                  <p className="text-base text-slate-500 max-w-sm">{ar ? "هذا القسم قيد الإنشاء وسيكون متاحاً قريباً في التحديث القادم." : "This section is under construction and will be available in the next update."}</p>
                </div>
              </Route>
            </Switch>
          </Suspense>
        </div>
      </main>
    </div>
  );
}
