import { Switch, Route, Link, Redirect, useLocation } from "wouter";
import { useTranslation } from "@/hooks/use-translation";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import {
  LayoutDashboard, Ticket, Map, MessageSquare, Briefcase, FileText,
  Users, Globe, Wrench, Building2, Languages, Flag,
  UserCog, CreditCard, BarChart3, Bell, Settings, ScrollText, LogOut, ShieldAlert,
  Megaphone, Landmark, Sliders, Headset, Image as ImageIcon
} from "lucide-react";
import { lazy, Suspense, useState, useMemo, type ComponentType } from "react";
import { useListAdminSupportConversations, getListAdminSupportConversationsQueryKey } from "@workspace/api-client-react";
import DashboardOverview from "./dashboard-overview";
import { LogoutConfirmDialog } from "@/components/logout-confirm-dialog";

const ProgramsAdmin = lazy(() => import("./programs-admin"));
const VisasAdmin = lazy(() => import("./visas-admin"));
const VisaCountriesAdmin = lazy(() => import("./visa-countries-admin"));
const BookingsAdmin = lazy(() => import("./bookings-admin"));
const ProgramBookingsAdmin = lazy(() => import("./program-bookings-admin"));
const OffersAdmin = lazy(() => import("./offers-admin"));
const DestinationsAdmin = lazy(() => import("./destinations-admin"));
const CustomersAdmin = lazy(() => import("./customers-admin"));
const MessagesAdmin = lazy(() => import("./messages-admin"));
const SupportChatAdmin = lazy(() => import("./support-chat-admin"));
const VisaApplicationsAdmin = lazy(() => import("./visa-applications-admin"));
const EmployeesAdmin = lazy(() => import("./employees-admin"));
const PaymentsAdmin = lazy(() => import("./payments-admin"));
const ReportsAdmin = lazy(() => import("./reports-admin"));
const NotificationsAdmin = lazy(() => import("./notifications-admin"));
const SettingsAdmin = lazy(() => import("./settings-admin"));
const AuditLogsAdmin = lazy(() => import("./audit-logs"));
const UmrahApplicationsAdmin = lazy(() => import("./umrah-applications-admin"));
const UmrahSettingsAdmin = lazy(() => import("./umrah-settings-admin"));
const AgenciesAdmin = lazy(() => import("./agencies-admin"));
const AgentApplicationsAdmin = lazy(() => import("./agent-applications-admin"));
const PromotionalOffersAdmin = lazy(() => import("./promotional-offers-admin"));
const AppImagesAdmin = lazy(() => import("./app-images-admin"));

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
    </div>
  );
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function navHref(path: string) {
  return `${BASE}${path}`;
}

/** Arabic "not authorized" screen shown when a section is accessed without permission. */
function Unauthorized({ ar }: { ar: boolean }) {
  return (
    <div className="bg-card rounded-3xl shadow-sm border border-card-border p-20 text-center flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
        <ShieldAlert className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="text-2xl font-bold text-foreground mb-2">{ar ? "غير مصرح" : "Not Authorized"}</h3>
      <p className="text-base text-muted-foreground max-w-sm">
        {ar ? "ليس لديك صلاحية الوصول إلى هذا القسم." : "You do not have permission to access this section."}
      </p>
    </div>
  );
}

export default function AdminLayout() {
  const { language, setLanguage } = useTranslation();
  const { user, logout, hasPermission } = useAdminAuth();
  const [rawLocation] = useLocation();
  const ar = language === "ar";
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  /* wouter gives us the path relative to the WouterRouter base, so strip
     the BASE_URL prefix that was already stripped by the router, but the
     route pattern "/admin/..." still needs normalisation. */
  const location = rawLocation;

  const isSuperAdmin = user?.role === "super_admin";

  /* Total unread support messages — powers the sidebar badge. Only polls when
     the current user can access the support section. */
  const canSeeSupport = hasPermission("messages");
  const { data: supportConversations } = useListAdminSupportConversations({
    query: {
      queryKey: getListAdminSupportConversationsQueryKey(),
      enabled: canSeeSupport,
      refetchInterval: 5000,
    },
  });
  const supportUnread = useMemo(
    () => (supportConversations ?? []).reduce((sum, c) => sum + (c.staffUnreadCount ?? 0), 0),
    [supportConversations]
  );

  /* Each nav item maps to a backend permission key. `perm: null` means the
     item is always visible to authenticated staff (no specific permission). */
  const allNavItems: Array<{
    href: string;
    icon: ComponentType<{ className?: string }>;
    labelAr: string;
    labelEn: string;
    perm: string | null;
    show?: boolean;
    badge?: number;
  }> = [
    { href: "/",                         icon: LayoutDashboard, labelAr: "نظرة عامة",        labelEn: "Overview",           perm: "overview" },
    { href: "/admin/bookings",           icon: Ticket,          labelAr: "الحجوزات",          labelEn: "Bookings",           perm: "bookings" },
    { href: "/admin/program-bookings",   icon: Map,             labelAr: "حجوزات البرامج",    labelEn: "Program Bookings",   perm: "bookings" },
    { href: "/admin/payments",           icon: CreditCard,      labelAr: "المدفوعات",         labelEn: "Payments",           perm: "payments" },
    { href: "/admin/reports",            icon: BarChart3,       labelAr: "التقارير",          labelEn: "Reports",            perm: "reports" },
    { href: "/admin/visa-applications",  icon: FileText,        labelAr: "طلبات التأشيرة",    labelEn: "Visa Applications",  perm: "visa_applications" },
    { href: "/admin/umrah-applications", icon: Landmark,        labelAr: "طلبات تأشيرة العمرة",labelEn: "Umrah Applications", perm: "visa_applications" },
    { href: "/admin/agent-applications", icon: Briefcase,       labelAr: "طلبات الوكالات",    labelEn: "Agent Applications", perm: "visa_applications" },
    { href: "/admin/agencies",           icon: Building2,       labelAr: "وكالات السفر",      labelEn: "Travel Agencies",    perm: "employees", show: isSuperAdmin || hasPermission("employees") },
    { href: "/admin/visa-countries",     icon: Flag,            labelAr: "دول التأشيرة",      labelEn: "Visa Countries",     perm: "visa_config" },
    { href: "/admin/visas",              icon: Globe,           labelAr: "أنواع التأشيرات",   labelEn: "Visa Types",         perm: "visa_config" },
    { href: "/admin/programs",           icon: Map,             labelAr: "البرامج السياحية",  labelEn: "Programs",           perm: "visa_config" },
    { href: "/admin/offers",             icon: Briefcase,       labelAr: "العروض",            labelEn: "Offers",             perm: "visa_config" },
    { href: "/admin/promotional-offers", icon: Megaphone,       labelAr: "العروض الترويجية",  labelEn: "Promotional Offers", perm: "visa_config" },
    { href: "/admin/destinations",       icon: Building2,       labelAr: "الوجهات",           labelEn: "Destinations",       perm: "visa_config" },
    { href: "/admin/app-images",         icon: ImageIcon,       labelAr: "صور التطبيق",       labelEn: "App Images",         perm: "visa_config" },
    { href: "/admin/customers",          icon: Users,           labelAr: "العملاء",           labelEn: "Customers",          perm: "customers" },
    { href: "/admin/employees",          icon: UserCog,         labelAr: "الموظفون",         labelEn: "Employees",          perm: "employees", show: isSuperAdmin || hasPermission("employees") },
    { href: "/admin/messages",           icon: MessageSquare,   labelAr: "الرسائل",           labelEn: "Messages",           perm: "messages" },
    { href: "/admin/support-chat",       icon: Headset,         labelAr: "الدعم الفني",       labelEn: "Support Chat",       perm: "messages", badge: supportUnread },
    { href: "/admin/notifications",      icon: Bell,            labelAr: "الإشعارات",         labelEn: "Notifications",      perm: "notifications" },
    { href: "/admin/umrah-settings",      icon: Sliders,         labelAr: "إعدادات العمرة",    labelEn: "Umrah Settings",     perm: "settings" },
    { href: "/admin/settings",           icon: Settings,        labelAr: "الإعدادات",         labelEn: "Settings",           perm: "settings" },
    { href: "/admin/audit-logs",         icon: ScrollText,      labelAr: "سجل النشاط",        labelEn: "Audit Log",          perm: "audit_logs" },
  ];

  const navItems = allNavItems.filter((item) => {
    if (typeof item.show === "boolean") return item.show;
    return item.perm ? hasPermission(item.perm) : true;
  });

  const currentItem = allNavItems.find(i =>
    i.href === "/" ? location === "/" || location === "" : location.startsWith(i.href)
  );

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim()
    || user?.email || (ar ? "مستخدم" : "User");
  const roleLabels: Record<string, { ar: string; en: string }> = {
    agent: { ar: "وكيل", en: "Agent" },
    admin: { ar: "مدير", en: "Admin" },
    super_admin: { ar: "مدير عام", en: "Super Admin" },
    customer: { ar: "عميل", en: "Customer" },
  };
  const roleLabel = user ? (ar ? roleLabels[user.role]?.ar : roleLabels[user.role]?.en) ?? user.role : "";
  const initial = (user?.firstName?.[0] ?? user?.email?.[0] ?? "A").toUpperCase();

  /** Wrap a section so it renders the Unauthorized screen without the permission. */
  const guard = (perm: string | null, Comp: ComponentType) => {
    if (perm && !hasPermission(perm)) return () => <Unauthorized ar={ar} />;
    return Comp;
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans" dir={ar ? "rtl" : "ltr"}>
      {/* ── Sidebar ── */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col shrink-0 shadow-xl z-20">
        {/* Logo */}
        <div className="h-20 flex items-center justify-center border-b border-sidebar-border px-4">
          <div className="flex flex-col items-center gap-1">
            <img
              src={`${BASE}/absher-logo.png`}
              alt="ABSHER TRAVEL"
              className="h-12 w-44 object-contain"
            />
            <div className="text-xs text-sidebar-primary font-medium">
              {ar ? "لوحة التحكم" : "Admin Panel"}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => {
            const isActive = item.href === "/"
              ? location === "/" || location === ""
              : location.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <span
                  className={`flex items-center px-4 py-3 rounded-xl transition-all cursor-pointer gap-3 font-medium text-sm
                    ${isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                      : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground"
                    }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="flex-1">{ar ? item.labelAr : item.labelEn}</span>
                  {item.badge ? (
                    <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center shrink-0">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  ) : null}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border space-y-1">
          <button
            onClick={() => setLanguage(ar ? "en" : "ar")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer transition-colors text-sm font-medium text-sidebar-foreground"
          >
            <Languages className="w-5 h-5 shrink-0" />
            {ar ? "English" : "عربي"}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-20 bg-card border-b border-card-border flex items-center px-8 justify-between shrink-0 shadow-sm">
          <h2 className="text-xl font-extrabold text-foreground tracking-tight">
            {currentItem ? (ar ? currentItem.labelAr : currentItem.labelEn) : (ar ? "لوحة الإدارة" : "Admin Panel")}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium hidden md:block text-end leading-tight">
              <div className="text-foreground font-bold">{displayName}</div>
              <div className="text-xs text-muted-foreground">{roleLabel}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary text-accent flex items-center justify-center font-bold text-lg shadow-sm border border-primary/10">
              {initial}
            </div>
            <button
              onClick={() => setLogoutConfirmOpen(true)}
              title={ar ? "تسجيل الخروج" : "Logout"}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        <LogoutConfirmDialog
          open={logoutConfirmOpen}
          onOpenChange={setLogoutConfirmOpen}
          onConfirm={logout}
          ar={ar}
        />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <Suspense fallback={<LoadingSpinner />}>
            <Switch>
              <Route path="/" component={hasPermission("overview") ? guard("overview", DashboardOverview) : () => {
                const first = navItems.find((i) => i.href !== "/");
                return first ? <Redirect to={first.href} /> : <Unauthorized ar={ar} />;
              }} />
              <Route path="/admin/bookings" component={guard("bookings", BookingsAdmin)} />
              <Route path="/admin/program-bookings" component={guard("bookings", ProgramBookingsAdmin)} />
              <Route path="/admin/payments" component={guard("payments", PaymentsAdmin)} />
              <Route path="/admin/reports" component={guard("reports", ReportsAdmin)} />
              <Route path="/admin/visa-applications" component={guard("visa_applications", VisaApplicationsAdmin)} />
              <Route path="/admin/umrah-applications" component={guard("visa_applications", UmrahApplicationsAdmin)} />
              <Route path="/admin/agent-applications" component={guard("visa_applications", AgentApplicationsAdmin)} />
              <Route path="/admin/agencies" component={guard("employees", AgenciesAdmin)} />
              <Route path="/admin/visa-countries" component={guard("visa_config", VisaCountriesAdmin)} />
              <Route path="/admin/visas" component={guard("visa_config", VisasAdmin)} />
              <Route path="/admin/programs" component={guard("visa_config", ProgramsAdmin)} />
              <Route path="/admin/offers" component={guard("visa_config", OffersAdmin)} />
              <Route path="/admin/promotional-offers" component={guard("visa_config", PromotionalOffersAdmin)} />
              <Route path="/admin/destinations" component={guard("visa_config", DestinationsAdmin)} />
              <Route path="/admin/app-images" component={guard("visa_config", AppImagesAdmin)} />
              <Route path="/admin/customers" component={guard("customers", CustomersAdmin)} />
              <Route path="/admin/employees" component={guard("employees", EmployeesAdmin)} />
              <Route path="/admin/messages" component={guard("messages", MessagesAdmin)} />
              <Route path="/admin/support-chat" component={guard("messages", SupportChatAdmin)} />
              <Route path="/admin/notifications" component={guard("notifications", NotificationsAdmin)} />
              <Route path="/admin/umrah-settings" component={guard("settings", UmrahSettingsAdmin)} />
              <Route path="/admin/settings" component={guard("settings", SettingsAdmin)} />
              <Route path="/admin/audit-logs" component={guard("audit_logs", AuditLogsAdmin)} />
              <Route path="/admin/:rest*">
                <div className="bg-card rounded-3xl shadow-sm border border-card-border p-20 text-center flex flex-col items-center justify-center min-h-[60vh]">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                    <Wrench className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    {ar ? "قيد التطوير" : "Under Development"}
                  </h3>
                  <p className="text-base text-muted-foreground max-w-sm">
                    {ar ? "هذا القسم قيد الإنشاء وسيكون متاحاً قريباً." : "This section is under construction and will be available soon."}
                  </p>
                </div>
              </Route>
            </Switch>
          </Suspense>
        </div>
      </main>
    </div>
  );
}
