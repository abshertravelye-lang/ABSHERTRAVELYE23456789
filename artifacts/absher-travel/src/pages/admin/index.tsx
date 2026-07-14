import { Switch, Route, Link, useLocation } from "wouter";
import { useTranslation } from "@/hooks/use-translation";
import {
  LayoutDashboard, Ticket, Map, MessageSquare, Briefcase, FileText,
  Users, Globe, LogOut,
} from "lucide-react";
import { lazy, Suspense } from "react";
import DashboardOverview from "./dashboard-overview";

const ProgramsAdmin = lazy(() => import("./programs-admin"));
const VisasAdmin = lazy(() => import("./visas-admin"));

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
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
    <div className="flex h-screen bg-slate-100 overflow-hidden" dir={ar ? "rtl" : "ltr"}>
      {/* Admin Sidebar */}
      <aside className="w-64 bg-primary text-slate-300 flex flex-col shrink-0">
        <div className="h-20 flex items-center justify-center border-b border-white/10 px-6">
          <div className="text-center">
            <div className="font-bold text-lg text-white leading-tight">أبشر للسفريات</div>
            <div className="text-xs text-white/50 mt-0.5">لوحة الإدارة</div>
          </div>
        </div>
        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.href === "/admin"
              ? location === "/admin"
              : location.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <span className={`flex items-center px-4 py-3 rounded-xl transition-colors cursor-pointer gap-3 ${isActive ? "bg-white/15 text-white font-semibold" : "hover:bg-white/5 hover:text-white"}`}>
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="text-sm">{ar ? item.labelAr : item.labelEn}</span>
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <Link href="/">
            <span className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 hover:text-white cursor-pointer transition-colors text-sm">
              <LogOut className="w-4 h-4 shrink-0" />
              {ar ? "العودة للموقع" : "Back to Site"}
            </span>
          </Link>
        </div>
      </aside>

      {/* Admin Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center px-8 justify-between shrink-0">
          <h2 className="text-lg font-bold text-slate-800">
            {currentItem ? (ar ? currentItem.labelAr : currentItem.labelEn) : (ar ? "لوحة الإدارة" : "Admin Panel")}
          </h2>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">A</div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          <Suspense fallback={<LoadingSpinner />}>
            <Switch>
              <Route path="/admin" component={DashboardOverview} />
              <Route path="/admin/programs" component={ProgramsAdmin} />
              <Route path="/admin/visas" component={VisasAdmin} />
              <Route path="/admin/:rest*">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center text-slate-500">
                  <div className="text-5xl mb-4">🚧</div>
                  <h3 className="text-lg font-medium mb-2">{ar ? "قيد التطوير" : "Coming Soon"}</h3>
                  <p className="text-sm">{ar ? "هذا القسم سيكون متاحاً قريباً" : "This section will be available soon"}</p>
                </div>
              </Route>
            </Switch>
          </Suspense>
        </div>
      </main>
    </div>
  );
}
