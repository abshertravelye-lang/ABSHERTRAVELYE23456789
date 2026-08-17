import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/use-translation";
import {
  customFetch,
  useGetWalletSettings,
  useUpdateWalletSettings,
  getGetWalletSettingsQueryKey,
  getGetPaymentConfigQueryKey,
} from "@workspace/api-client-react";
import { Save, Settings2, Globe, BellRing, Database, CreditCard, Shield, Smartphone, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface AppLinks {
  android_app_url: string;
  ios_app_url: string;
  app_landing_url: string;
  support_url: string;
}

export default function SettingsAdmin() {
  const { language } = useTranslation();
  const ar = language === "ar";

  const [settings, setSettings] = useState({
    companyName: "ABSHER TRAVEL",
    companyEmail: "info@absher.travel",
    companyPhone: "+966 50 000 0000",
    websiteUrl: "https://absher.travel",
    allowOnlineBookings: true,
    requireDeposit: true,
    depositPercentage: "25",
    emailNotifications: true,
    smsNotifications: false,
  });

  const [isSaving, setIsSaving] = useState(false);

  const [appLinks, setAppLinks] = useState<AppLinks>({
    android_app_url: "",
    ios_app_url: "",
    app_landing_url: "",
    support_url: "",
  });
  const [linksLoading, setLinksLoading] = useState(true);
  const [linksSaving, setLinksSaving] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("absher_admin_settings");
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch {}
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await customFetch<Partial<AppLinks>>(`/api/settings/app-links`, { method: "GET" });
        if (!cancelled) {
          setAppLinks({
            android_app_url: data?.android_app_url ?? "",
            ios_app_url: data?.ios_app_url ?? "",
            app_landing_url: data?.app_landing_url ?? "",
            support_url: data?.support_url ?? "",
          });
        }
      } catch {
        /* keep defaults */
      } finally {
        if (!cancelled) setLinksLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveLinks = async () => {
    setLinksSaving(true);
    try {
      await customFetch(`/api/settings/app-links`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appLinks),
      });
      toast.success(ar ? "تم حفظ روابط التطبيق بنجاح" : "App links saved successfully");
    } catch {
      toast.error(ar ? "حدث خطأ أثناء الحفظ" : "Error saving links");
    } finally {
      setLinksSaving(false);
    }
  };

  const updateLink = (key: keyof AppLinks, value: string) => {
    setAppLinks(prev => ({ ...prev, [key]: value }));
  };

  // ── Wallet feature toggle (server-backed) ──────────────────────────────
  const qc = useQueryClient();
  const { data: walletSettings, isLoading: walletLoading } = useGetWalletSettings();
  const walletMutation = useUpdateWalletSettings();
  const handleWalletToggle = async (enabled: boolean) => {
    try {
      await walletMutation.mutateAsync({ data: { walletEnabled: enabled } });
      qc.invalidateQueries({ queryKey: getGetWalletSettingsQueryKey() });
      qc.invalidateQueries({ queryKey: getGetPaymentConfigQueryKey() });
      toast.success(
        enabled
          ? (ar ? "تم تفعيل المحفظة في التطبيق" : "Wallet enabled in the app")
          : (ar ? "تم إيقاف المحفظة — ستختفي من التطبيق" : "Wallet disabled — it will disappear from the app"),
      );
    } catch {
      toast.error(ar ? "حدث خطأ أثناء الحفظ" : "Error saving");
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      try {
        localStorage.setItem("absher_admin_settings", JSON.stringify(settings));
        toast.success(ar ? "تم حفظ الإعدادات بنجاح" : "Settings saved successfully");
      } catch {
        toast.error(ar ? "حدث خطأ أثناء الحفظ" : "Error saving settings");
      }
      setIsSaving(false);
    }, 600);
  };

  const updateSetting = (key: keyof typeof settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{ar ? "إعدادات النظام" : "System Settings"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{ar ? "إدارة التكوينات العامة للمنصة" : "Manage global platform configurations"}</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="rounded-xl px-6">
          <Save className="w-4 h-4 me-2" />
          {isSaving ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "حفظ التغييرات" : "Save Changes")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* General Settings */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card rounded-3xl border border-card-border p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">{ar ? "البيانات العامة" : "General Information"}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label>{ar ? "اسم الشركة" : "Company Name"}</Label>
                <Input 
                  value={settings.companyName}
                  onChange={e => updateSetting('companyName', e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>{ar ? "رابط الموقع" : "Website URL"}</Label>
                <Input 
                  value={settings.websiteUrl}
                  onChange={e => updateSetting('websiteUrl', e.target.value)}
                  className="rounded-xl text-left" dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>{ar ? "البريد الإلكتروني" : "Email Address"}</Label>
                <Input 
                  value={settings.companyEmail}
                  onChange={e => updateSetting('companyEmail', e.target.value)}
                  className="rounded-xl text-left" dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>{ar ? "رقم الهاتف" : "Phone Number"}</Label>
                <Input 
                  value={settings.companyPhone}
                  onChange={e => updateSetting('companyPhone', e.target.value)}
                  className="rounded-xl text-left" dir="ltr"
                />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-3xl border border-card-border p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">{ar ? "إعدادات الحجز والدفع" : "Booking & Payment Settings"}</h2>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">{ar ? "السماح بالحجز الإلكتروني" : "Allow Online Bookings"}</Label>
                  <p className="text-sm text-muted-foreground mt-1">{ar ? "تفعيل استقبال الحجوزات عبر الموقع مباشرة" : "Enable receiving bookings directly through the website"}</p>
                </div>
                <Switch 
                  checked={settings.allowOnlineBookings}
                  onCheckedChange={v => updateSetting('allowOnlineBookings', v)}
                />
              </div>
              <hr className="border-border" />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">{ar ? "طلب عربون مبدئي" : "Require Deposit"}</Label>
                  <p className="text-sm text-muted-foreground mt-1">{ar ? "إلزام العميل بدفع نسبة من المبلغ لتأكيد الحجز" : "Require customer to pay a percentage to confirm booking"}</p>
                </div>
                <Switch 
                  checked={settings.requireDeposit}
                  onCheckedChange={v => updateSetting('requireDeposit', v)}
                />
              </div>
              {settings.requireDeposit && (
                <div className="bg-muted/40 p-4 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                  <Label>{ar ? "نسبة العربون (%)" : "Deposit Percentage (%)"}</Label>
                  <Input 
                    type="number" 
                    className="w-24 rounded-xl text-center" 
                    value={settings.depositPercentage}
                    onChange={e => updateSetting('depositPercentage', e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Wallet feature toggle — SERVER-BACKED, applies instantly to app & web */}
          <div className="bg-card rounded-3xl border border-card-border p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Wallet className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">{ar ? "المحفظة الإلكترونية" : "E-Wallet"}</h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold">{ar ? "تفعيل المحفظة" : "Enable Wallet"}</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {ar
                    ? "عند الإيقاف تختفي المحفظة بالكامل من تطبيق الجوال فوراً"
                    : "When disabled, the wallet disappears entirely from the mobile app immediately"}
                </p>
              </div>
              <Switch
                checked={walletSettings?.walletEnabled ?? true}
                disabled={walletLoading || walletMutation.isPending}
                onCheckedChange={handleWalletToggle}
                data-testid="switch-wallet-enabled"
              />
            </div>
          </div>

          <div className="bg-card rounded-3xl border border-card-border p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <BellRing className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">{ar ? "إعدادات الإشعارات" : "Notification Settings"}</h2>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">{ar ? "تنبيهات البريد الإلكتروني" : "Email Notifications"}</Label>
                  <p className="text-sm text-muted-foreground mt-1">{ar ? "إرسال إيصالات وتأكيدات عبر البريد" : "Send receipts and confirmations via email"}</p>
                </div>
                <Switch 
                  checked={settings.emailNotifications}
                  onCheckedChange={v => updateSetting('emailNotifications', v)}
                />
              </div>
              <hr className="border-border" />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">{ar ? "رسائل SMS" : "SMS Notifications"}</Label>
                  <p className="text-sm text-muted-foreground mt-1">{ar ? "إرسال تنبيهات قصيرة لرقم الجوال" : "Send short alerts to mobile number"}</p>
                </div>
                <Switch 
                  checked={settings.smsNotifications}
                  onCheckedChange={v => updateSetting('smsNotifications', v)}
                />
              </div>
            </div>
          </div>

          {/* Application & Download Links */}
          <div className="bg-card rounded-3xl border border-card-border p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold">{ar ? "روابط التطبيق والتنزيل" : "Application & Download Links"}</h2>
              </div>
              <Button onClick={handleSaveLinks} disabled={linksLoading || linksSaving} className="rounded-xl">
                <Save className="w-4 h-4 me-2" />
                {linksSaving ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "حفظ الروابط" : "Save Links")}
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label>Google Play</Label>
                <Input
                  value={appLinks.android_app_url}
                  onChange={e => updateLink('android_app_url', e.target.value)}
                  placeholder="https://play.google.com/..."
                  className="rounded-xl text-left" dir="ltr"
                  disabled={linksLoading}
                />
              </div>
              <div className="space-y-2">
                <Label>App Store</Label>
                <Input
                  value={appLinks.ios_app_url}
                  onChange={e => updateLink('ios_app_url', e.target.value)}
                  placeholder="https://apps.apple.com/..."
                  className="rounded-xl text-left" dir="ltr"
                  disabled={linksLoading}
                />
              </div>
              <div className="space-y-2">
                <Label>{ar ? "صفحة التطبيق" : "App Landing Page"}</Label>
                <Input
                  value={appLinks.app_landing_url}
                  onChange={e => updateLink('app_landing_url', e.target.value)}
                  placeholder="https://absher.travel/app"
                  className="rounded-xl text-left" dir="ltr"
                  disabled={linksLoading}
                />
              </div>
              <div className="space-y-2">
                <Label>{ar ? "رابط الدعم" : "Support URL"}</Label>
                <Input
                  value={appLinks.support_url}
                  onChange={e => updateLink('support_url', e.target.value)}
                  placeholder="https://absher.travel/support"
                  className="rounded-xl text-left" dir="ltr"
                  disabled={linksLoading}
                />
              </div>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="space-y-6">
          <div className="bg-muted/40 rounded-3xl border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <Settings2 className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-bold">{ar ? "معلومات النظام" : "System Info"}</h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">{ar ? "الإصدار" : "Version"}</span>
                <span className="text-sm font-mono font-medium">v2.4.1</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">{ar ? "تاريخ التحديث" : "Last Update"}</span>
                <span className="text-sm font-medium">12 Oct 2023</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5"><Database className="w-3.5 h-3.5" /> {ar ? "قاعدة البيانات" : "Database"}</span>
                <span className="text-sm font-medium text-emerald-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {ar ? "متصل" : "Connected"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> {ar ? "حالة الخادم" : "Server Status"}</span>
                <span className="text-sm font-medium text-emerald-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {ar ? "مستقر" : "Healthy"}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
