import { Switch, Route, Link, useLocation } from "wouter";
import { useTranslation } from "@/hooks/use-translation";
import { LayoutDashboard, Ticket, Map, Settings, Users, MessageSquare, Briefcase, FileText } from "lucide-react";
import DashboardOverview from "./dashboard-overview";
// Stubs for other admin views - we'll keep it simple for this task and just show overview
// In a full implementation we would have separate components for each CRUD view

export default function AdminLayout() {
  const { language } = useTranslation();
  const [location] = useLocation();

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: language === 'ar' ? 'نظرة عامة' : 'Overview' },
    { href: "/admin/bookings", icon: Ticket, label: language === 'ar' ? 'الحجوزات' : 'Bookings' },
    { href: "/admin/offers", icon: Briefcase, label: language === 'ar' ? 'العروض' : 'Offers' },
    { href: "/admin/destinations", icon: Map, label: language === 'ar' ? 'الوجهات' : 'Destinations' },
    { href: "/admin/programs", icon: Map, label: language === 'ar' ? 'البرامج' : 'Programs' },
    { href: "/admin/visas", icon: FileText, label: language === 'ar' ? 'التأشيرات' : 'Visas' },
    { href: "/admin/messages", icon: MessageSquare, label: language === 'ar' ? 'الرسائل' : 'Messages' },
  ];

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-primary text-slate-300 flex flex-col shrink-0">
        <div className="h-20 flex items-center justify-center border-b border-white/10 px-6">
          <span className="font-bold text-xl text-white">ABSHER ADMIN</span>
        </div>
        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <span className={`flex items-center px-4 py-3 rounded-xl transition-colors cursor-pointer ${isActive ? 'bg-accent text-primary font-semibold' : 'hover:bg-white/5 hover:text-white'}`}>
                  <Icon className="w-5 h-5 mr-3 rtl:ml-3 rtl:mr-0" />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Admin Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white border-b flex items-center px-8 justify-between shrink-0">
          <h2 className="text-xl font-bold text-slate-800">
            {navItems.find(i => i.href === location)?.label || 'Dashboard'}
          </h2>
          <div className="flex items-center gap-4">
            {/* User profile dropdown stub */}
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
              A
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          <Switch>
            <Route path="/admin" component={DashboardOverview} />
            <Route path="/admin/:rest*">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center text-slate-500">
                <Settings className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-medium mb-2">Section Under Construction</h3>
                <p>This admin view is part of the full implementation.</p>
              </div>
            </Route>
          </Switch>
        </div>
      </main>
    </div>
  );
}
