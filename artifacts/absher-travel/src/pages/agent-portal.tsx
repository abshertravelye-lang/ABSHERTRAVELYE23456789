/**
 * ABSHER TRAVEL — B2B Travel Agency / Agent Portal (web only).
 *
 * Agents log in with credentials created by ABSHER TRAVEL admins (no self
 * sign-up). All authorization (agency status, enabled visa services, agent
 * pricing, application isolation) is enforced server-side; this UI only
 * mirrors it. Sections: Dashboard / New Application / My Applications /
 * Company Profile / Support.
 */
import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  useGetAgentMe,
  useGetAgentDashboard,
  useGetAgentVisaServices,
  useListMyAgentApplications,
  useSubmitAgentApplication,
  type AgentVisaService,
  type AgentApplication,
  type AgentApplicationInput,
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/hooks/use-translation";
import { useToast } from "@/hooks/use-toast";
import { uploadFileAuthenticated, toObjectPath, authHeader } from "@/lib/objectMedia";

const apiBase = () => (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
import { CountrySelect } from "@/components/country-select";
import { getCountryByCode } from "@workspace/countries";
import { openSupportChat } from "@/components/support-chat";
import { LogoutConfirmDialog } from "@/components/logout-confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  LayoutDashboard, FilePlus2, FolderOpen, Building2, Headset, LogOut,
  Loader2, Upload, CheckCircle2, ChevronLeft, ChevronRight, Download,
} from "lucide-react";

const NAVY = "#0A2342";

// ── Status labels ────────────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, { ar: string; en: string; cls: string }> = {
  received:            { ar: "تم الاستلام",        en: "Received",            cls: "bg-sky-100 text-sky-800" },
  under_review:        { ar: "قيد المراجعة",       en: "Under Review",        cls: "bg-amber-100 text-amber-800" },
  awaiting_documents:  { ar: "بانتظار مستندات",    en: "Awaiting Documents",  cls: "bg-orange-100 text-orange-800" },
  documents_uploaded:  { ar: "تم رفع المستندات",   en: "Documents Uploaded",  cls: "bg-indigo-100 text-indigo-800" },
  sent_to_embassy:     { ar: "أُرسل للسفارة",      en: "Sent to Embassy",     cls: "bg-purple-100 text-purple-800" },
  processing:          { ar: "قيد المعالجة",       en: "Processing",          cls: "bg-blue-100 text-blue-800" },
  issued:              { ar: "صدرت التأشيرة",      en: "Issued",              cls: "bg-emerald-100 text-emerald-800" },
  completed:           { ar: "مكتمل",              en: "Completed",           cls: "bg-emerald-100 text-emerald-800" },
  rejected:            { ar: "مرفوض",              en: "Rejected",            cls: "bg-red-100 text-red-800" },
  cancelled:           { ar: "ملغي",               en: "Cancelled",           cls: "bg-gray-200 text-gray-700" },
};

function StatusBadge({ status, ar }: { status: string; ar: boolean }) {
  const s = STATUS_LABELS[status] ?? { ar: status, en: status, cls: "bg-gray-100 text-gray-700" };
  return <Badge className={`${s.cls} border-0 font-medium`}>{ar ? s.ar : s.en}</Badge>;
}

async function openSignedObject(path: string) {
  const res = await fetch(`${apiBase()}/api/storage/sign?path=${encodeURIComponent(toObjectPath(path))}`, { headers: authHeader() });
  if (!res.ok) return;
  const { url } = await res.json();
  if (url) window.open(url, "_blank", "noopener");
}

// ── Upload field ─────────────────────────────────────────────────────────────
function UploadField({ label, value, onUploaded, ar }: {
  label: string; value?: string; onUploaded: (path: string) => void; ar: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-slate-700">{label}</Label>
      <label className={`flex items-center gap-3 rounded-lg border border-dashed px-4 py-3 cursor-pointer transition-colors ${value ? "border-emerald-300 bg-emerald-50/50" : "border-slate-300 hover:border-slate-400 bg-white"}`}>
        <input
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setBusy(true);
            const res = await uploadFileAuthenticated(file);
            setBusy(false);
            if (res?.objectPath) onUploaded(res.objectPath);
            else toast({ variant: "destructive", title: ar ? "فشل رفع الملف" : "Upload failed" });
            e.target.value = "";
          }}
        />
        {busy ? <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
          : value ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          : <Upload className="h-4 w-4 text-slate-500" />}
        <span className="text-sm text-slate-600">
          {busy ? (ar ? "جارٍ الرفع…" : "Uploading…") : value ? (ar ? "تم الرفع — اضغط للاستبدال" : "Uploaded — click to replace") : (ar ? "اضغط لاختيار الملف" : "Click to choose a file")}
        </span>
      </label>
    </div>
  );
}

// ── Portal login (agents use admin-provisioned credentials) ─────────────────
function AgentLogin({ ar }: { ar: boolean }) {
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4" dir={ar ? "rtl" : "ltr"}>
      <Card className="w-full max-w-md shadow-lg border-slate-200">
        <CardContent className="pt-8 pb-8 px-8">
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 h-12 w-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: NAVY }}>
              <Building2 className="h-6 w-6 text-amber-400" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">{ar ? "بوابة وكلاء السفر" : "Travel Agent Portal"}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {ar ? "ادخل ببيانات الحساب المزوّدة من ABSHER TRAVEL" : "Sign in with the credentials provided by ABSHER TRAVEL"}
            </p>
          </div>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                await login(email.trim(), password);
              } catch {
                toast({ variant: "destructive", title: ar ? "بيانات الدخول غير صحيحة" : "Invalid credentials" });
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="space-y-1.5">
              <Label>{ar ? "البريد الإلكتروني" : "Email"}</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
            </div>
            <div className="space-y-1.5">
              <Label>{ar ? "كلمة المرور" : "Password"}</Label>
              <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </div>
            <Button type="submit" disabled={busy} className="w-full text-white" style={{ backgroundColor: NAVY }}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (ar ? "تسجيل الدخول" : "Sign In")}
            </Button>
          </form>
          <p className="text-xs text-slate-400 text-center mt-5">
            {ar ? "لا تملك حساباً؟ تواصل مع ABSHER TRAVEL لاعتماد وكالتك." : "No account? Contact ABSHER TRAVEL to get your agency approved."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────
function DashboardView({ ar }: { ar: boolean }) {
  const { data, isLoading } = useGetAgentDashboard();
  if (isLoading) return <CenterSpinner />;
  if (!data) return null;
  const stats = data.stats ?? {};
  const agencyStatusMap: Record<string, { ar: string; en: string; cls: string }> = {
    active:    { ar: "نشطة",   en: "Active",    cls: "bg-emerald-100 text-emerald-800" },
    suspended: { ar: "موقوفة", en: "Suspended", cls: "bg-red-100 text-red-800" },
    pending:   { ar: "قيد الاعتماد", en: "Pending", cls: "bg-amber-100 text-amber-800" },
  };
  const st = agencyStatusMap[data.agencyStatus] ?? agencyStatusMap.pending;
  const cards = [
    { label: ar ? "إجمالي الطلبات" : "Total Applications", value: stats.total ?? 0 },
    { label: ar ? "طلبات مقدمة" : "Submitted", value: stats.submitted ?? 0 },
    { label: ar ? "قيد المعالجة" : "In Progress", value: stats.inProgress ?? 0 },
    { label: ar ? "موافَق عليها" : "Approved", value: stats.approved ?? 0 },
    { label: ar ? "مرفوضة" : "Rejected", value: stats.rejected ?? 0 },
  ];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{data.agencyName}</h2>
          <p className="text-sm text-slate-500">{ar ? "لوحة أداء الوكالة" : "Agency performance overview"}</p>
        </div>
        <Badge className={`${st.cls} border-0 text-sm px-3 py-1`}>{ar ? st.ar : st.en}</Badge>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="border-slate-200">
            <CardContent className="pt-5 pb-5">
              <p className="text-3xl font-bold" style={{ color: NAVY }}>{c.value}</p>
              <p className="text-sm text-slate-500 mt-1">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {stats.byStatus && Object.keys(stats.byStatus).length > 0 && (
        <Card className="border-slate-200">
          <CardContent className="pt-5 pb-5">
            <p className="font-semibold text-slate-800 mb-3">{ar ? "حسب الحالة" : "By status"}</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byStatus).map(([k, v]) => (
                <span key={k} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                  <StatusBadge status={k} ar={ar} /> <b>{v}</b>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── New Application wizard ───────────────────────────────────────────────────
function NewApplicationView({ ar, onDone }: { ar: boolean; onDone: () => void }) {
  const { data: services, isLoading } = useGetAgentVisaServices();
  const { toast } = useToast();
  const submitMutation = useSubmitAgentApplication();
  const [selected, setSelected] = useState<AgentVisaService | null>(null);
  const [submitted, setSubmitted] = useState<AgentApplication | null>(null);
  const [form, setForm] = useState<Partial<AgentApplicationInput>>({});

  const set = (patch: Partial<AgentApplicationInput>) => setForm((f) => ({ ...f, ...patch }));

  if (isLoading) return <CenterSpinner />;

  if (submitted) {
    return (
      <Card className="border-emerald-200 max-w-xl mx-auto">
        <CardContent className="pt-8 pb-8 text-center space-y-3">
          <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
          <h3 className="text-xl font-bold text-slate-900">{ar ? "تم تقديم الطلب بنجاح" : "Application submitted"}</h3>
          <p className="text-slate-600">{ar ? "رقم الطلب" : "Application number"}</p>
          <p className="text-2xl font-mono font-bold" style={{ color: NAVY }}>{submitted.trackingNumber}</p>
          <Button className="mt-2 text-white" style={{ backgroundColor: NAVY }} onClick={onDone}>
            {ar ? "عرض طلباتي" : "View my applications"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!selected) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">{ar ? "اختر خدمة التأشيرة" : "Select a visa service"}</h2>
        {(!services || services.length === 0) && (
          <Card className="border-slate-200"><CardContent className="pt-6 pb-6 text-slate-500">
            {ar ? "لا توجد خدمات تأشيرات مفعّلة لوكالتك حالياً. تواصل مع ABSHER TRAVEL." : "No visa services are enabled for your agency yet. Contact ABSHER TRAVEL."}
          </CardContent></Card>
        )}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(services ?? []).map((s) => (
            <button key={s.visaId} onClick={() => { setSelected(s); setForm({ visaId: s.visaId }); }}
              className="text-start rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-400 hover:shadow-sm transition-all">
              <p className="font-bold text-slate-900">{ar ? s.countryAr : s.countryEn}</p>
              <p className="text-sm text-slate-500 mt-0.5">{s.visaType}</p>
              <p className="mt-3 text-lg font-bold" style={{ color: NAVY }}>
                {s.agentPrice} <span className="text-xs font-normal text-slate-500">{s.currency ?? "SAR"}</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">{ar ? `المعالجة: ${s.processingDays ?? "-"} يوم` : `Processing: ${s.processingDays ?? "-"} days`}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const requiredOk =
    form.applicantNationality && form.fullName && form.gender && form.dateOfBirth &&
    form.email && form.phone && form.passportNumber && form.passportIssueDate && form.passportExpiryDate &&
    (!selected.requiresPassportImage || form.passportImageUrl) &&
    (!selected.requiresPersonalPhoto || form.personalPhotoUrl);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
          {ar ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {ar ? "تغيير الخدمة" : "Change service"}
        </Button>
        <div>
          <h2 className="text-lg font-bold text-slate-900">{ar ? selected.countryAr : selected.countryEn} — {selected.visaType}</h2>
          <p className="text-sm text-slate-500">{ar ? "سعر الوكالة:" : "Agency price:"} <b style={{ color: NAVY }}>{selected.agentPrice} {selected.currency ?? "SAR"}</b></p>
        </div>
      </div>

      <Card className="border-slate-200">
        <CardContent className="pt-6 pb-6 space-y-5">
          <p className="font-semibold text-slate-800">{ar ? "بيانات المتقدم" : "Applicant details"}</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{ar ? "جنسية المتقدم" : "Applicant nationality"} *</Label>
              <CountrySelect language={ar ? "ar" : "en"} value={form.applicantNationality}
                onChange={(code) => set({ applicantNationality: getCountryByCode(code)?.nameEn ?? code })} />
            </div>
            <div className="space-y-1.5">
              <Label>{ar ? "الاسم الكامل (كما في الجواز)" : "Full name (as in passport)"} *</Label>
              <Input value={form.fullName ?? ""} onChange={(e) => set({ fullName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{ar ? "الجنس" : "Gender"} *</Label>
              <div className="flex gap-2">
                {(["male", "female"] as const).map((g) => (
                  <Button key={g} type="button" variant={form.gender === g ? "default" : "outline"}
                    className={form.gender === g ? "text-white" : ""}
                    style={form.gender === g ? { backgroundColor: NAVY } : undefined}
                    onClick={() => set({ gender: g })}>
                    {g === "male" ? (ar ? "ذكر" : "Male") : (ar ? "أنثى" : "Female")}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{ar ? "تاريخ الميلاد" : "Date of birth"} *</Label>
              <Input type="date" value={form.dateOfBirth ?? ""} onChange={(e) => set({ dateOfBirth: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{ar ? "البريد الإلكتروني للعميل" : "Customer email"} *</Label>
              <Input type="email" value={form.email ?? ""} onChange={(e) => set({ email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{ar ? "جوال العميل" : "Customer phone"} *</Label>
              <Input dir="ltr" value={form.phone ?? ""} onChange={(e) => set({ phone: e.target.value })} />
            </div>
          </div>

          <p className="font-semibold text-slate-800 pt-2">{ar ? "بيانات الجواز" : "Passport details"}</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{ar ? "رقم الجواز" : "Passport number"} *</Label>
              <Input dir="ltr" value={form.passportNumber ?? ""} onChange={(e) => set({ passportNumber: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{ar ? "بلد الإصدار" : "Issuing country"}</Label>
              <CountrySelect language={ar ? "ar" : "en"} value={form.passportIssuingCountry}
                onChange={(code) => set({ passportIssuingCountry: getCountryByCode(code)?.nameEn ?? code })} />
            </div>
            <div className="space-y-1.5">
              <Label>{ar ? "تاريخ الإصدار" : "Issue date"} *</Label>
              <Input type="date" value={form.passportIssueDate ?? ""} onChange={(e) => set({ passportIssueDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{ar ? "تاريخ الانتهاء" : "Expiry date"} *</Label>
              <Input type="date" value={form.passportExpiryDate ?? ""} onChange={(e) => set({ passportExpiryDate: e.target.value })} />
            </div>
          </div>

          <p className="font-semibold text-slate-800 pt-2">{ar ? "المستندات" : "Documents"}</p>
          <div className="grid md:grid-cols-2 gap-4">
            <UploadField ar={ar} label={`${ar ? "صورة الجواز" : "Passport image"}${selected.requiresPassportImage ? " *" : ""}`}
              value={form.passportImageUrl} onUploaded={(p) => set({ passportImageUrl: p })} />
            <UploadField ar={ar} label={`${ar ? "الصورة الشخصية" : "Personal photo"}${selected.requiresPersonalPhoto ? " *" : ""}`}
              value={form.personalPhotoUrl} onUploaded={(p) => set({ personalPhotoUrl: p })} />
            <UploadField ar={ar} label={ar ? "مستند إضافي (اختياري)" : "Additional document (optional)"}
              value={form.residencyImageUrl} onUploaded={(p) => set({ residencyImageUrl: p })} />
            <UploadField ar={ar} label={ar ? "مستند إضافي آخر (اختياري)" : "Another document (optional)"}
              value={form.visaImageUrl} onUploaded={(p) => set({ visaImageUrl: p })} />
          </div>

          <Button
            disabled={!requiredOk || submitMutation.isPending}
            className="w-full text-white h-11 text-base"
            style={{ backgroundColor: NAVY }}
            onClick={() => {
              submitMutation.mutate(
                { data: { ...(form as AgentApplicationInput), agreedToTerms: true } },
                {
                  onSuccess: (row) => setSubmitted(row as AgentApplication),
                  onError: (err: unknown) => {
                    const msg = (err as { error?: string })?.error;
                    toast({ variant: "destructive", title: msg || (ar ? "تعذر تقديم الطلب" : "Could not submit the application") });
                  },
                },
              );
            }}
          >
            {submitMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : (ar ? "تقديم الطلب" : "Submit application")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ── My Applications ──────────────────────────────────────────────────────────
function ApplicationsView({ ar }: { ar: boolean }) {
  const { data, isLoading } = useListMyAgentApplications({ query: { refetchInterval: 15000 } } as never);
  const [open, setOpen] = useState<AgentApplication | null>(null);
  if (isLoading) return <CenterSpinner />;
  const rows = data ?? [];
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-900">{ar ? "طلباتي" : "My Applications"}</h2>
      {rows.length === 0 && (
        <Card className="border-slate-200"><CardContent className="pt-6 pb-6 text-slate-500">
          {ar ? "لا توجد طلبات بعد." : "No applications yet."}
        </CardContent></Card>
      )}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        {rows.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-4 py-3 text-start font-medium">{ar ? "رقم الطلب" : "Number"}</th>
                <th className="px-4 py-3 text-start font-medium">{ar ? "المتقدم" : "Applicant"}</th>
                <th className="px-4 py-3 text-start font-medium">{ar ? "الوجهة" : "Destination"}</th>
                <th className="px-4 py-3 text-start font-medium">{ar ? "السعر" : "Price"}</th>
                <th className="px-4 py-3 text-start font-medium">{ar ? "الحالة" : "Status"}</th>
                <th className="px-4 py-3 text-start font-medium">{ar ? "التاريخ" : "Date"}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer" onClick={() => setOpen(r)}>
                  <td className="px-4 py-3 font-mono font-medium" style={{ color: NAVY }}>{r.trackingNumber}</td>
                  <td className="px-4 py-3">{r.fullName}</td>
                  <td className="px-4 py-3">{ar ? r.countryAr : r.countryEn} · {r.visaType}</td>
                  <td className="px-4 py-3">{r.agentPrice ?? "-"}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} ar={ar} /></td>
                  <td className="px-4 py-3 text-slate-500">{new Date(r.createdAt).toLocaleDateString(ar ? "ar-SA" : "en-GB")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-lg" dir={ar ? "rtl" : "ltr"}>
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="font-mono" style={{ color: NAVY }}>{open.trackingNumber}</span>
                  <StatusBadge status={open.status} ar={ar} />
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <InfoRow label={ar ? "المتقدم" : "Applicant"} value={`${open.fullName ?? ""} (${open.nationality ?? ""})`} />
                <InfoRow label={ar ? "الوجهة" : "Destination"} value={`${ar ? open.countryAr : open.countryEn} — ${open.visaType}`} />
                <InfoRow label={ar ? "السعر" : "Price"} value={open.agentPrice ?? "-"} />
                <InfoRow label={ar ? "تاريخ التقديم" : "Submitted"} value={new Date(open.createdAt).toLocaleString(ar ? "ar-SA" : "en-GB")} />
                {open.adminNotes && <InfoRow label={ar ? "ملاحظات ABSHER TRAVEL" : "ABSHER TRAVEL notes"} value={open.adminNotes} />}
                {open.issuedVisaUrl && (
                  <Button size="sm" className="text-white" style={{ backgroundColor: NAVY }} onClick={() => openSignedObject(open.issuedVisaUrl!)}>
                    <Download className="h-4 w-4 me-1" /> {ar ? "تحميل التأشيرة الصادرة" : "Download issued visa"}
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800 text-end">{value}</span>
    </div>
  );
}

// ── Company profile ──────────────────────────────────────────────────────────
function ProfileView({ ar }: { ar: boolean }) {
  const { data, isLoading } = useGetAgentMe();
  if (isLoading) return <CenterSpinner />;
  if (!data) return null;
  const statusMap: Record<string, string> = {
    active: ar ? "نشطة" : "Active",
    suspended: ar ? "موقوفة" : "Suspended",
    pending: ar ? "قيد الاعتماد" : "Pending",
  };
  return (
    <div className="max-w-xl space-y-4">
      <h2 className="text-xl font-bold text-slate-900">{ar ? "ملف الوكالة" : "Company Profile"}</h2>
      <Card className="border-slate-200"><CardContent className="pt-6 pb-6 space-y-3 text-sm">
        <InfoRow label={ar ? "اسم الوكالة" : "Agency name"} value={data.agency.name ?? "-"} />
        <InfoRow label={ar ? "حالة الوكالة" : "Agency status"} value={statusMap[data.agency.status ?? "pending"]} />
        <InfoRow label={ar ? "بريد الوكالة" : "Agency email"} value={data.agency.contactEmail ?? "-"} />
        <InfoRow label={ar ? "هاتف الوكالة" : "Agency phone"} value={data.agency.contactPhone ?? "-"} />
        <InfoRow label={ar ? "الوكيل" : "Agent"} value={`${data.agent.firstName ?? ""} ${data.agent.lastName ?? ""}`.trim() || "-"} />
        <InfoRow label={ar ? "بريد الوكيل" : "Agent email"} value={data.agent.email ?? "-"} />
      </CardContent></Card>
      <p className="text-xs text-slate-400">
        {ar ? "لتعديل بيانات الوكالة أو إضافة مستخدمين، تواصل مع ABSHER TRAVEL." : "To change agency details or add users, contact ABSHER TRAVEL."}
      </p>
    </div>
  );
}

function CenterSpinner() {
  return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>;
}

// ── Shell ────────────────────────────────────────────────────────────────────
type Section = "dashboard" | "new" | "applications" | "profile";

export default function AgentPortal() {
  const { language } = useTranslation();
  const ar = language === "ar";
  const { user, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const [section, setSection] = useState<Section>("dashboard");
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Only check /agent/me when the logged-in user is actually an agent.
  const isAgent = isAuthenticated && user?.role === "agent";
  const { data: me, isLoading: meLoading, error: meError } = useGetAgentMe({ query: { enabled: isAgent, retry: false } } as never);

  const nav = useMemo(() => ([
    { key: "dashboard" as const, icon: LayoutDashboard, ar: "لوحة المعلومات", en: "Dashboard" },
    { key: "new" as const, icon: FilePlus2, ar: "طلب جديد", en: "New Application" },
    { key: "applications" as const, icon: FolderOpen, ar: "طلباتي", en: "My Applications" },
    { key: "profile" as const, icon: Building2, ar: "ملف الوكالة", en: "Company Profile" },
  ]), []);

  if (!isAuthenticated) return <AgentLogin ar={ar} />;

  if (!isAgent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4" dir={ar ? "rtl" : "ltr"}>
        <Card className="max-w-md border-slate-200"><CardContent className="pt-8 pb-8 text-center space-y-4">
          <h2 className="text-lg font-bold text-slate-900">{ar ? "هذه البوابة مخصصة لوكلاء السفر" : "This portal is for travel agents"}</h2>
          <p className="text-sm text-slate-500">
            {ar ? "حسابك الحالي ليس حساب وكيل. تواصل مع ABSHER TRAVEL لاعتماد وكالتك." : "Your current account is not an agent account. Contact ABSHER TRAVEL to get your agency approved."}
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => navigate("/")}>{ar ? "العودة للرئيسية" : "Back to home"}</Button>
            <Button className="text-white" style={{ backgroundColor: NAVY }} onClick={() => { logout(); }}>
              {ar ? "تسجيل الخروج" : "Log out"}
            </Button>
          </div>
        </CardContent></Card>
      </div>
    );
  }

  const suspended = !meLoading && (meError || me?.agency.status !== "active");

  return (
    <div className="min-h-screen bg-slate-100 flex" dir={ar ? "rtl" : "ltr"}>
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col text-white shrink-0" style={{ backgroundColor: NAVY }}>
        <div className="px-6 py-6 border-b border-white/10">
          <p className="font-bold tracking-wide">ABSHER TRAVEL</p>
          <p className="text-xs text-amber-400 mt-0.5">{ar ? "بوابة وكلاء السفر" : "Agent Portal"}</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((n) => (
            <button key={n.key} onClick={() => setSection(n.key)}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${section === n.key ? "bg-white/15 font-semibold" : "hover:bg-white/8 text-white/80"}`}>
              <n.icon className="h-4 w-4" /> {ar ? n.ar : n.en}
            </button>
          ))}
          <button onClick={openSupportChat}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/80 hover:bg-white/8 transition-colors">
            <Headset className="h-4 w-4" /> {ar ? "الدعم" : "Support"}
          </button>
        </nav>
        <div className="px-3 pb-5">
          <button onClick={() => setConfirmLogout(true)}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/8 transition-colors">
            <LogOut className="h-4 w-4" /> {ar ? "تسجيل الخروج" : "Logout"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        {/* Mobile top nav */}
        <div className="md:hidden flex items-center gap-1 overflow-x-auto px-3 py-2 text-white" style={{ backgroundColor: NAVY }}>
          {nav.map((n) => (
            <button key={n.key} onClick={() => setSection(n.key)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs ${section === n.key ? "bg-white/20 font-semibold" : "text-white/75"}`}>
              {ar ? n.ar : n.en}
            </button>
          ))}
          <button onClick={() => setConfirmLogout(true)} className="whitespace-nowrap rounded-full px-3 py-1.5 text-xs text-white/75">
            {ar ? "خروج" : "Logout"}
          </button>
        </div>

        <main className="p-5 md:p-8">
          {suspended && (
            <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {ar
                ? "وكالتك ليست نشطة حالياً — يمكنك تصفح البوابة لكن لا يمكنك تقديم طلبات جديدة. تواصل مع ABSHER TRAVEL."
                : "Your agency is not active — you can browse the portal but cannot submit new applications. Contact ABSHER TRAVEL."}
            </div>
          )}
          {section === "dashboard" && <DashboardView ar={ar} />}
          {section === "new" && <NewApplicationView ar={ar} onDone={() => setSection("applications")} />}
          {section === "applications" && <ApplicationsView ar={ar} />}
          {section === "profile" && <ProfileView ar={ar} />}
        </main>
      </div>

      <LogoutConfirmDialog
        open={confirmLogout}
        onOpenChange={setConfirmLogout}
        onConfirm={logout}
        ar={ar}
      />
    </div>
  );
}
