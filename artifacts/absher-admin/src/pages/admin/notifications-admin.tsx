import { useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/use-translation";
import {
  useSendNotification,
  useListAdminNotificationHistory,
  getListAdminNotificationHistoryQueryKey,
  type Notification,
} from "@workspace/api-client-react";
import { Send, Bell, CheckCircle, Search, Users, X, ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

const ADMIN_ACCESS_TOKEN_KEY = "absher_admin_access_token";

type Audience = "all" | "users" | "group";
type RoleGroup = "customer" | "agent" | "admin" | "super_admin";

/** In-app pages an admin can deep-link a notification to. */
const APP_PAGES: Array<{ value: string; ar: string; en: string }> = [
  { value: "/(tabs)/", ar: "الرئيسية", en: "Home" },
  { value: "/(tabs)/visas", ar: "التأشيرات", en: "Visas" },
  { value: "/(tabs)/umrah", ar: "العمرة", en: "Umrah" },
  { value: "/(tabs)/programs", ar: "البرامج السياحية", en: "Programs" },
  { value: "/(tabs)/bookings", ar: "الحجوزات", en: "Bookings" },
  { value: "/(tabs)/notifications", ar: "الإشعارات", en: "Notifications" },
  { value: "/(tabs)/account", ar: "الحساب", en: "Account" },
  { value: "/support-chat", ar: "الدعم الفني", en: "Support Chat" },
];

interface UserRecord {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  role: "customer" | "agent" | "admin" | "super_admin";
}

/** Fetch every user (customers + staff) for the targeted-notification picker. */
function useAllUsers() {
  return useQuery<UserRecord[]>({
    queryKey: ["employees", "all"],
    queryFn: async () => {
      const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
      const res = await fetch("/api/employees?all=true", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return [];
      return res.json();
    },
  });
}

function userLabel(u: UserRecord, ar: boolean): string {
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return name || u.email || u.phone || (ar ? "مستخدم" : "User");
}

function fmtDate(iso: string | null | undefined, ar: boolean): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(ar ? "ar-SA" : "en-US", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

/** Group history rows that belong to the same broadcast (same titles + second). */
interface HistoryGroup {
  key: string;
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  createdAt: string;
  count: number;
}

function groupHistory(rows: Notification[]): HistoryGroup[] {
  const map = new Map<string, HistoryGroup>();
  for (const r of rows) {
    const second = r.createdAt ? r.createdAt.slice(0, 19) : "";
    const key = `${r.titleAr}|${r.titleEn}|${second}`;
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, {
        key,
        titleAr: r.titleAr,
        titleEn: r.titleEn,
        messageAr: r.messageAr,
        messageEn: r.messageEn,
        createdAt: r.createdAt,
        count: 1,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export default function NotificationsAdmin() {
  const { language } = useTranslation();
  const ar = language === "ar";
  const qc = useQueryClient();

  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [messageAr, setMessageAr] = useState("");
  const [messageEn, setMessageEn] = useState("");
  const [url, setUrl] = useState("");
  const [pagePick, setPagePick] = useState<string>("none");
  const [audience, setAudience] = useState<Audience>("all");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<RoleGroup[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendMut = useSendNotification();
  const { data: users = [] } = useAllUsers();
  const { data: history = [], isLoading: historyLoading } = useListAdminNotificationHistory();

  const groups = useMemo(() => groupHistory(history), [history]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users.slice(0, 50);
    return users
      .filter((u) => {
        return (
          (u.firstName?.toLowerCase().includes(q) ?? false) ||
          (u.lastName?.toLowerCase().includes(q) ?? false) ||
          (u.email?.toLowerCase().includes(q) ?? false) ||
          (u.phone?.includes(q) ?? false)
        );
      })
      .slice(0, 50);
  }, [users, userSearch]);

  const toggleUser = (id: string) => {
    setSelectedUserIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleRole = (role: RoleGroup) => {
    setSelectedRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  };

  const handleImagePick = async (file: File | null | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(ar ? "حجم الصورة يجب أن يكون أقل من 5 ميجابايت" : "Image must be smaller than 5 MB");
      return;
    }
    setImageUploading(true);
    try {
      const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/storage/uploads/public", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error("upload failed");
      const data = await res.json();
      setImageUrl(data.imageUrl);
      toast.success(ar ? "تم رفع الصورة" : "Image uploaded");
    } catch {
      toast.error(ar ? "تعذّر رفع الصورة" : "Failed to upload image");
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    // Bilingual — never mix languages: both AR and EN are required.
    if (!titleAr.trim() || !messageAr.trim()) {
      toast.error(ar ? "يرجى تعبئة العنوان والرسالة بالعربية" : "Please fill in the Arabic title and message");
      return;
    }
    if (!titleEn.trim() || !messageEn.trim()) {
      toast.error(ar ? "يرجى تعبئة العنوان والرسالة بالإنجليزية" : "Please fill in the English title and message");
      return;
    }
    if (audience === "users" && selectedUserIds.length === 0) {
      toast.error(ar ? "يرجى اختيار عميل واحد على الأقل" : "Please select at least one user");
      return;
    }
    if (audience === "group" && selectedRoles.length === 0) {
      toast.error(ar ? "يرجى اختيار مجموعة واحدة على الأقل" : "Please select at least one group");
      return;
    }

    // Deep link: explicit URL wins over the page picker.
    const finalUrl = url.trim() || (pagePick !== "none" ? pagePick : "");

    try {
      const res = await sendMut.mutateAsync({
        data: {
          titleAr: titleAr.trim(),
          titleEn: titleEn.trim(),
          messageAr: messageAr.trim(),
          messageEn: messageEn.trim(),
          audience,
          userIds: audience === "users" ? selectedUserIds : undefined,
          roles: audience === "group" ? selectedRoles : undefined,
          url: finalUrl || undefined,
          imageUrl: imageUrl || undefined,
        },
      });
      await qc.invalidateQueries({ queryKey: getListAdminNotificationHistoryQueryKey() });
      const count = res?.sentCount ?? 0;
      toast.success(
        ar ? `تم إرسال الإشعار بنجاح إلى ${count} مستخدم` : `Notification sent successfully to ${count} user(s)`,
      );
      setTitleAr("");
      setTitleEn("");
      setMessageAr("");
      setMessageEn("");
      setUrl("");
      setPagePick("none");
      setSelectedUserIds([]);
      setSelectedRoles([]);
      setUserSearch("");
      setImageUrl("");
    } catch {
      toast.error(ar ? "تعذّر إرسال الإشعار" : "Failed to send notification");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{ar ? "الإشعارات والتنبيهات" : "Notifications"}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {ar ? "إرسال إشعارات للعملاء ومتابعة السجل" : "Send notifications to customers and track history"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Compose Section */}
        <div className="bg-card rounded-3xl border border-card-border p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold">{ar ? "إرسال إشعار جديد" : "Compose Notification"}</h2>
          </div>

          <div className="space-y-5">
            {/* Audience */}
            <div className="space-y-2">
              <Label>{ar ? "الاستهداف" : "Target Audience"}</Label>
              <Select value={audience} onValueChange={(v) => setAudience(v as Audience)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{ar ? "جميع المستخدمين" : "All Users"}</SelectItem>
                  <SelectItem value="group">{ar ? "مجموعة (حسب الدور)" : "Group (by role)"}</SelectItem>
                  <SelectItem value="users">{ar ? "عملاء محددون" : "Specific Users"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Role-group picker */}
            {audience === "group" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label>{ar ? "اختيار المجموعات" : "Select Groups"}</Label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { role: "customer" as RoleGroup, ar: "العملاء", en: "Customers" },
                      { role: "agent" as RoleGroup, ar: "الوكلاء", en: "Agents" },
                      { role: "admin" as RoleGroup, ar: "المشرفون", en: "Admins" },
                      { role: "super_admin" as RoleGroup, ar: "المشرفون العامون", en: "Super Admins" },
                    ]
                  ).map((g) => {
                    const checked = selectedRoles.includes(g.role);
                    return (
                      <button
                        key={g.role}
                        type="button"
                        onClick={() => toggleRole(g.role)}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition-colors ${
                          checked
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:bg-muted/50"
                        }`}
                      >
                        {checked && <CheckCircle className="w-3.5 h-3.5" />}
                        {ar ? g.ar : g.en}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* User picker */}
            {audience === "users" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label>{ar ? "اختيار العملاء" : "Select Users"}</Label>
                {selectedUserIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    {selectedUserIds.map((id) => {
                      const u = users.find((x) => x.id === id);
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary rounded-lg px-2 py-1"
                        >
                          {u ? userLabel(u, ar) : id}
                          <button type="button" onClick={() => toggleUser(id)} className="hover:text-red-600">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
                <div className="relative">
                  <Search className="w-4 h-4 absolute top-3 start-3 text-muted-foreground" />
                  <Input
                    placeholder={ar ? "ابحث بالاسم أو البريد أو الهاتف..." : "Search by name, email or phone..."}
                    className="rounded-xl ps-9"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
                <div className="max-h-52 overflow-y-auto border border-border rounded-xl divide-y divide-border">
                  {filteredUsers.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      {ar ? "لا يوجد نتائج" : "No results"}
                    </div>
                  ) : (
                    filteredUsers.map((u) => {
                      const checked = selectedUserIds.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => toggleUser(u.id)}
                          className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 text-start hover:bg-muted/50 transition-colors ${
                            checked ? "bg-primary/5" : ""
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{userLabel(u, ar)}</div>
                            <div className="text-xs text-muted-foreground truncate" dir="ltr">
                              {u.email || u.phone || ""}
                            </div>
                          </div>
                          {checked && <CheckCircle className="w-4 h-4 text-primary shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedUserIds.length} {ar ? "عميل محدد" : "selected"}
                </p>
              </div>
            )}

            {/* Title (bilingual) */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>{ar ? "العنوان (عربي)" : "Title (Arabic)"} *</Label>
                <Input
                  placeholder={ar ? "أدخل العنوان بالعربية..." : "Arabic title..."}
                  className="rounded-xl"
                  dir="rtl"
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{ar ? "العنوان (إنجليزي)" : "Title (English)"} *</Label>
                <Input
                  placeholder={ar ? "أدخل العنوان بالإنجليزية..." : "English title..."}
                  className="rounded-xl"
                  dir="ltr"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                />
              </div>
            </div>

            {/* Message (bilingual) */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>{ar ? "الرسالة (عربي)" : "Message (Arabic)"} *</Label>
                <Textarea
                  placeholder={ar ? "اكتب نص الرسالة بالعربية..." : "Arabic message..."}
                  className="rounded-xl min-h-[90px] resize-none"
                  dir="rtl"
                  value={messageAr}
                  onChange={(e) => setMessageAr(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{ar ? "الرسالة (إنجليزي)" : "Message (English)"} *</Label>
                <Textarea
                  placeholder={ar ? "اكتب نص الرسالة بالإنجليزية..." : "English message..."}
                  className="rounded-xl min-h-[90px] resize-none"
                  dir="ltr"
                  value={messageEn}
                  onChange={(e) => setMessageEn(e.target.value)}
                />
              </div>
            </div>

            {/* Image (optional) */}
            <div className="space-y-2">
              <Label>{ar ? "صورة الإشعار (اختياري)" : "Notification Image (optional)"}</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => handleImagePick(e.target.files?.[0])}
              />
              {imageUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-border">
                  <img src={imageUrl} alt="" className="w-full max-h-44 object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="absolute top-2 end-2 bg-background/90 rounded-lg p-1.5 shadow hover:text-red-600 transition-colors"
                    aria-label={ar ? "إزالة الصورة" : "Remove image"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-xl border-dashed"
                  disabled={imageUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="w-4 h-4 me-2" />
                  {imageUploading
                    ? ar ? "جارٍ الرفع..." : "Uploading..."
                    : ar ? "رفع صورة" : "Upload Image"}
                </Button>
              )}
            </div>

            {/* In-app page picker */}
            <div className="space-y-2">
              <Label>{ar ? "صفحة داخل التطبيق (اختياري)" : "In-App Page (optional)"}</Label>
              <Select value={pagePick} onValueChange={setPagePick}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{ar ? "بدون" : "None"}</SelectItem>
                  {APP_PAGES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {ar ? p.ar : p.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Deep link */}
            <div className="space-y-2">
              <Label>{ar ? "رابط مخصص (اختياري — يتجاوز اختيار الصفحة)" : "Custom Deep Link (optional — overrides page)"}</Label>
              <Input
                placeholder="/umrah/track/UM-2025-000000"
                className="rounded-xl"
                dir="ltr"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <Button
              className="w-full rounded-xl py-6 text-md font-bold"
              onClick={handleSend}
              disabled={sendMut.isPending}
            >
              {sendMut.isPending ? (ar ? "جاري الإرسال..." : "Sending...") : (ar ? "إرسال الإشعار" : "Send Notification")}
              {!sendMut.isPending && <Send className="w-5 h-5 ms-2" />}
            </Button>
          </div>
        </div>

        {/* Preview & History Section */}
        <div className="space-y-6">
          {/* Live Preview */}
          <div className="bg-muted/30 rounded-3xl border border-dashed border-border p-6">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
              {ar ? "معاينة الإشعار" : "Live Preview"}
            </h3>
            <div className="bg-background rounded-2xl p-4 shadow-sm border border-border flex gap-4">
              <div className="shrink-0 mt-1">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-foreground text-sm">
                  {(ar ? titleAr : titleEn) || (ar ? "عنوان الإشعار" : "Notification Title")}
                </h4>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {(ar ? messageAr : messageEn) ||
                    (ar
                      ? "نص الرسالة سيظهر هنا ليعطي العميل التفاصيل الكاملة."
                      : "Message body will appear here to give the customer full details.")}
                </p>
                {imageUrl && (
                  <img src={imageUrl} alt="" className="w-full max-h-36 object-cover rounded-xl mt-2" />
                )}
                <div className="text-[10px] text-muted-foreground/60 mt-3 flex justify-between">
                  <span>{ar ? "الآن" : "Just now"}</span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {audience === "all"
                      ? ar
                        ? "جميع المستخدمين"
                        : "All users"
                      : audience === "group"
                        ? ar
                          ? `${selectedRoles.length} مجموعة`
                          : `${selectedRoles.length} group(s)`
                        : ar
                          ? `${selectedUserIds.length} عميل`
                          : `${selectedUserIds.length} user(s)`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* History */}
          <div className="bg-card rounded-3xl border border-card-border p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-bold">{ar ? "الإشعارات المرسلة" : "Sent Notifications"}</h2>
            </div>

            {historyLoading ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                {ar ? "جارٍ التحميل..." : "Loading..."}
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                {ar ? "لا توجد إشعارات مرسلة بعد" : "No notifications sent yet"}
              </div>
            ) : (
              <div className="space-y-4 max-h-[420px] overflow-y-auto">
                {groups.map((g) => (
                  <div
                    key={g.key}
                    className="flex gap-4 p-3 rounded-2xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                  >
                    <div className="shrink-0 mt-1">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm">{ar ? g.titleAr : g.titleEn}</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ar ? g.messageAr : g.messageEn}</p>
                      <div className="text-[10px] text-muted-foreground/60 mt-2 flex justify-between items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <CheckCircle className="w-3 h-3" />
                          {ar ? "تم الإرسال" : "Sent"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {g.count} {ar ? "مستلم" : "recipient(s)"}
                        </span>
                        <span>{fmtDate(g.createdAt, ar)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
