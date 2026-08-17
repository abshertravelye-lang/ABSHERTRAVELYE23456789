/**
 * ABSHER TRAVEL — B2B Travel Agency / Agent Portal (web only).
 *
 * Agents log in with credentials created by ABSHER TRAVEL admins (no self
 * sign-up). All authorization (agency status, enabled visa services, agent
 * pricing, application isolation) is enforced server-side; this UI only
 * mirrors it. Sections: Dashboard / New Application / My Applications /
 * Company Profile / Support.
 */
import { useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  useGetAgentMe,
  useGetAgentDashboard,
  useGetAgentVisaServices,
  useListMyAgentApplications,
  useSubmitAgentApplication,
  useListVisaRequiredDocuments,
  useListApplicationDocuments,
  useUploadApplicationDocument,
  useListNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useGetUnreadNotificationCount,
  getListApplicationDocumentsQueryKey,
  getListNotificationsQueryKey,
  getGetUnreadNotificationCountQueryKey,
  type AgentVisaService,
  type AgentApplication,
  type AgentApplicationInput,
  type ApplicationDocument,
  type VisaRequiredDocument,
  type Notification,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/hooks/use-translation";
import { useToast } from "@/hooks/use-toast";
import { uploadFileAuthenticated, uploadFileWithProgress, toObjectPath, authHeader } from "@/lib/objectMedia";

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
  Bell, X,
} from "lucide-react";
import { StepIndicator } from "@/components/step-indicator";
import { friendlyError } from "@/lib/error-message";

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

// ── Upload validation helpers ────────────────────────────────────────────────
const IMAGE_MIMES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const PDF_MIME = "application/pdf";
const DEFAULT_MAX_MB = 10;

function acceptFor(fileType?: string): string {
  if (fileType === "image") return IMAGE_MIMES.join(",");
  if (fileType === "pdf") return ".pdf,application/pdf";
  return `${IMAGE_MIMES.join(",")},.pdf,application/pdf`;
}

function validateFile(file: File, fileType: string | undefined, maxMb: number, ar: boolean): string | null {
  const mime = (file.type || "").toLowerCase();
  const isImage = IMAGE_MIMES.includes(mime);
  const isPdf = mime === PDF_MIME || file.name.toLowerCase().endsWith(".pdf");
  if (fileType === "image" && !isImage) return ar ? "هذا الحقل يقبل صوراً فقط (JPG, PNG, WEBP)" : "This field accepts images only (JPG, PNG, WEBP)";
  if (fileType === "pdf" && !isPdf) return ar ? "هذا الحقل يقبل ملفات PDF فقط" : "This field accepts PDF files only";
  if (!isImage && !isPdf) return ar ? "نوع الملف غير مدعوم — يُقبل صور أو PDF" : "Unsupported file type — images or PDF only";
  if (file.size > maxMb * 1024 * 1024) return ar ? `حجم الملف يتجاوز الحد (${maxMb} م.ب)` : `File exceeds the ${maxMb} MB limit`;
  return null;
}

// ── Upload field (with progress bar + type/size validation) ─────────────────
function UploadField({ label, value, onUploaded, ar, description, fileType, maxMb }: {
  label: string; value?: string; onUploaded: (path: string) => void; ar: boolean;
  description?: string | null; fileType?: string; maxMb?: number;
}) {
  const [progress, setProgress] = useState<number | null>(null);
  const { toast } = useToast();
  const limit = maxMb ?? DEFAULT_MAX_MB;
  const busy = progress !== null;
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-slate-700">{label}</Label>
      {description && <p className="text-xs text-slate-500">{description}</p>}
      <label className={`flex items-center gap-3 rounded-lg border border-dashed px-4 py-3 cursor-pointer transition-colors ${value ? "border-emerald-300 bg-emerald-50/50" : "border-slate-300 hover:border-slate-400 bg-white"}`}>
        <input
          type="file"
          accept={acceptFor(fileType)}
          className="hidden"
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            const err = validateFile(file, fileType, limit, ar);
            if (err) { toast({ variant: "destructive", title: err }); return; }
            setProgress(0);
            try {
              const res = await uploadFileWithProgress(file, setProgress);
              onUploaded(res.objectPath);
              toast({ title: ar ? "تم رفع الملف بنجاح" : "File uploaded" });
            } catch (upErr) {
              toast({ variant: "destructive", title: ar ? "فشل رفع الملف" : "Upload failed", description: (upErr as Error)?.message });
            } finally {
              setProgress(null);
            }
          }}
        />
        {busy ? <Loader2 className="h-4 w-4 animate-spin text-slate-500 shrink-0" />
          : value ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          : <Upload className="h-4 w-4 text-slate-500 shrink-0" />}
        <span className="text-sm text-slate-600 flex-1 min-w-0">
          {busy ? `${ar ? "جارٍ الرفع…" : "Uploading…"} ${progress}%` : value ? (ar ? "تم الرفع — اضغط للاستبدال" : "Uploaded — click to replace") : (ar ? "اضغط لاختيار الملف" : "Click to choose a file")}
        </span>
      </label>
      {busy && (
        <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: NAVY }} />
        </div>
      )}
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
interface ExtraDoc { nameAr: string; nameEn: string; description?: string; storagePath: string; }

function NewApplicationView({ ar, onDone }: { ar: boolean; onDone: () => void }) {
  const { data: services, isLoading } = useGetAgentVisaServices();
  const { toast } = useToast();
  const submitMutation = useSubmitAgentApplication();
  const [selected, setSelected] = useState<AgentVisaService | null>(null);
  const [submitted, setSubmitted] = useState<AgentApplication | null>(null);
  const [form, setForm] = useState<Partial<AgentApplicationInput>>({});
  // Dynamic uploads keyed by the visa config documentKey.
  const [docUploads, setDocUploads] = useState<Record<string, string>>({});
  // Agency-added extra documents (name + optional description + file).
  const [extraDocs, setExtraDocs] = useState<ExtraDoc[]>([]);
  const [addingExtra, setAddingExtra] = useState(false);
  const [extraDraft, setExtraDraft] = useState<{ name: string; description: string; storagePath: string }>({ name: "", description: "", storagePath: "" });

  // Dynamic requirements for the selected visa (authoritative config).
  const { data: requiredDocs = [], isLoading: reqLoading } = useListVisaRequiredDocuments(
    selected ? selected.visaId : (undefined as unknown as number),
  );

  const set = (patch: Partial<AgentApplicationInput>) => setForm((f) => ({ ...f, ...patch }));

  // Step indicator for new application wizard
  // Step 0: select service, Step 1: fill form & docs, Step 2: review & submit
  const agentWizardStep = submitted ? 2 : !selected ? 0 : 1;
  const agentStepLabels = ar
    ? ["اختر الخدمة", "بيانات الطلب", "تأكيد"]
    : ["Select Service", "Application", "Confirm"];

  if (isLoading) return <CenterSpinner />;

  if (submitted) {
    return (
      <div className="space-y-6">
        <StepIndicator steps={agentStepLabels} current={2} ar={ar} />
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
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="space-y-4">
        <StepIndicator steps={agentStepLabels} current={0} ar={ar} />
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

  const dynamicOk = requiredDocs.every((d) => !d.required || !!docUploads[d.documentKey]);
  const requiredOk =
    form.applicantNationality && form.fullName && form.gender && form.dateOfBirth &&
    form.email && form.phone && form.passportNumber && form.passportIssueDate && form.passportExpiryDate &&
    (!selected.requiresPassportImage || form.passportImageUrl) &&
    (!selected.requiresPersonalPhoto || form.personalPhotoUrl) &&
    dynamicOk;

  return (
    <div className="max-w-3xl space-y-6">
      <StepIndicator steps={agentStepLabels} current={agentWizardStep} ar={ar} />
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
            <UploadField ar={ar} fileType="image" label={`${ar ? "صورة الجواز" : "Passport image"}${selected.requiresPassportImage ? " *" : ""}`}
              value={form.passportImageUrl} onUploaded={(p) => set({ passportImageUrl: p })} />
            <UploadField ar={ar} fileType="image" label={`${ar ? "الصورة الشخصية" : "Personal photo"}${selected.requiresPersonalPhoto ? " *" : ""}`}
              value={form.personalPhotoUrl} onUploaded={(p) => set({ personalPhotoUrl: p })} />
          </div>

          {reqLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />{ar ? "جارٍ تحميل متطلبات المستندات…" : "Loading document requirements…"}</div>
          ) : requiredDocs.length > 0 && (
            <>
              <p className="font-semibold text-slate-800 pt-2">{ar ? "المستندات المطلوبة لهذه التأشيرة" : "Documents required for this visa"}</p>
              <div className="grid md:grid-cols-2 gap-4">
                {requiredDocs.map((d) => (
                  <UploadField
                    key={d.documentKey}
                    ar={ar}
                    label={`${ar ? d.nameAr : d.nameEn}${d.required ? " *" : ` (${ar ? "اختياري" : "optional"})`}`}
                    description={d.description}
                    fileType={d.allowedFileType}
                    maxMb={d.maxFileSizeMb ?? undefined}
                    value={docUploads[d.documentKey]}
                    onUploaded={(p) => setDocUploads((u) => ({ ...u, [d.documentKey]: p }))}
                  />
                ))}
              </div>
            </>
          )}

          {/* Agency-added extra documents */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-800">{ar ? "مستندات إضافية" : "Additional documents"}</p>
              {!addingExtra && (
                <Button type="button" variant="outline" size="sm" onClick={() => setAddingExtra(true)}>
                  <FilePlus2 className="h-4 w-4 me-1" />{ar ? "إضافة مستند" : "Add document"}
                </Button>
              )}
            </div>
            {extraDocs.length > 0 && (
              <div className="space-y-2">
                {extraDocs.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 px-4 py-2.5 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="flex-1 min-w-0 truncate font-medium text-slate-700">{ar ? d.nameAr : d.nameEn}</span>
                    <button type="button" className="text-xs text-red-500 hover:underline" onClick={() => setExtraDocs((x) => x.filter((_, j) => j !== i))}>
                      {ar ? "إزالة" : "Remove"}
                    </button>
                  </div>
                ))}
              </div>
            )}
            {addingExtra && (
              <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50">
                <div className="space-y-1.5">
                  <Label>{ar ? "اسم المستند *" : "Document name *"}</Label>
                  <Input value={extraDraft.name} onChange={(e) => setExtraDraft({ ...extraDraft, name: e.target.value })}
                    placeholder={ar ? "مثال: كشف حساب بنكي" : "e.g. Bank statement"} />
                </div>
                <div className="space-y-1.5">
                  <Label>{ar ? "وصف (اختياري)" : "Description (optional)"}</Label>
                  <Input value={extraDraft.description} onChange={(e) => setExtraDraft({ ...extraDraft, description: e.target.value })} />
                </div>
                <UploadField ar={ar} label={ar ? "الملف *" : "File *"} value={extraDraft.storagePath}
                  onUploaded={(p) => setExtraDraft((x) => ({ ...x, storagePath: p }))} />
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setAddingExtra(false); setExtraDraft({ name: "", description: "", storagePath: "" }); }}>
                    {ar ? "إلغاء" : "Cancel"}
                  </Button>
                  <Button type="button" size="sm" className="text-white" style={{ backgroundColor: NAVY }}
                    disabled={!extraDraft.name.trim() || !extraDraft.storagePath}
                    onClick={() => {
                      setExtraDocs((x) => [...x, { nameAr: extraDraft.name.trim(), nameEn: extraDraft.name.trim(), description: extraDraft.description.trim() || undefined, storagePath: extraDraft.storagePath }]);
                      setAddingExtra(false);
                      setExtraDraft({ name: "", description: "", storagePath: "" });
                    }}>
                    {ar ? "إضافة" : "Add"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Button
            disabled={!requiredOk || submitMutation.isPending}
            className="w-full text-white h-11 text-base"
            style={{ backgroundColor: NAVY }}
            onClick={() => {
              const documents = [
                ...requiredDocs
                  .filter((d) => docUploads[d.documentKey])
                  .map((d) => ({ documentKey: d.documentKey, storagePath: docUploads[d.documentKey] })),
                ...extraDocs.map((d) => ({ nameAr: d.nameAr, nameEn: d.nameEn, description: d.description, storagePath: d.storagePath })),
              ];
              submitMutation.mutate(
                { data: { ...(form as AgentApplicationInput), agreedToTerms: true, documents } as never },
                {
                  onSuccess: (row) => setSubmitted(row as AgentApplication),
                  onError: (err: unknown) => {
                    toast({ variant: "destructive", title: friendlyError(err, ar) });
                  },
                },
              );
            }}
          >
            {submitMutation.isPending ? (
            <><Loader2 className="h-5 w-5 animate-spin" /><span>{ar ? "جارٍ إرسال الطلب..." : "Submitting..."}</span></>
          ) : (ar ? "تقديم الطلب" : "Submit application")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ── My Applications ──────────────────────────────────────────────────────────
const PENDING_DOC_STATUSES = ["required", "waiting_customer", "reupload_required"];

function ApplicationsView({
  ar,
  openApplicationId,
  onOpenHandled,
}: {
  ar: boolean;
  openApplicationId?: number | null;
  onOpenHandled?: () => void;
}) {
  const { data, isLoading } = useListMyAgentApplications({ query: { refetchInterval: 15000 } } as never);
  const [open, setOpen] = useState<AgentApplication | null>(null);

  // Open the application dialog when directed from a notification click.
  const rows = data ?? [];
  const prevOpenAppId = useRef<number | null | undefined>(null);
  if (
    openApplicationId != null &&
    openApplicationId !== prevOpenAppId.current &&
    rows.length > 0
  ) {
    prevOpenAppId.current = openApplicationId;
    const target = rows.find((r) => r.id === openApplicationId);
    if (target) {
      setOpen(target);
      onOpenHandled?.();
    }
  }

  if (isLoading) return <CenterSpinner />;
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-900">{ar ? "طلباتي" : "My Applications"}</h2>
      {rows.length === 0 && (
        <Card className="border-slate-200"><CardContent className="pt-6 pb-6 text-slate-500">
          {ar ? "لا توجد طلبات بعد." : "No applications yet."}
        </CardContent></Card>
      )}
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 bg-white">
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
              {rows.map((r) => {
                const needsDocs = r.status === "awaiting_documents";
                return (
                  <tr
                    key={r.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer"
                    onClick={() => setOpen(r)}
                  >
                    <td className="px-4 py-3 font-mono font-medium" style={{ color: NAVY }}>
                      <span className="flex items-center gap-1.5 flex-wrap">
                        {r.trackingNumber}
                        {needsDocs && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-semibold px-1.5 py-0.5 leading-none shrink-0">
                            {ar ? "⚠ مستندات مطلوبة" : "⚠ Docs needed"}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">{r.fullName}</td>
                    <td className="px-4 py-3">{ar ? r.countryAr : r.countryEn} · {r.visaType}</td>
                    <td className="px-4 py-3">{r.agentPrice ?? "-"}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} ar={ar} /></td>
                    <td className="px-4 py-3 text-slate-500">{new Date(r.createdAt).toLocaleDateString(ar ? "ar-SA" : "en-GB")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {rows.map((r) => {
          const needsDocs = r.status === "awaiting_documents";
          return (
            <button
              key={r.id}
              onClick={() => setOpen(r)}
              className="w-full text-start rounded-xl border border-slate-200 bg-white p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="font-mono text-sm font-bold truncate" style={{ color: NAVY }}>
                  {r.trackingNumber}
                </div>
                <StatusBadge status={r.status} ar={ar} />
              </div>
              {needsDocs && (
                <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-orange-100 text-orange-700 text-[10px] font-semibold px-2 py-0.5">
                  {ar ? "⚠ مستندات مطلوبة" : "⚠ Docs needed"}
                </div>
              )}
              <div className="text-sm text-slate-700 font-medium">{r.fullName}</div>
              <div className="flex items-center justify-between gap-2 mt-1">
                <span className="text-xs text-slate-500">{ar ? r.countryAr : r.countryEn} · {r.visaType}</span>
                <span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString(ar ? "ar-SA" : "en-GB")}</span>
              </div>
            </button>
          );
        })}
      </div>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir={ar ? "rtl" : "ltr"}>
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
                <AgentApplicationDocuments appId={open.id} ar={ar} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Suppress unused-variable warning for PENDING_DOC_STATUSES (kept for reference).
void PENDING_DOC_STATUSES;

// ── Application documents (agency side) ─────────────────────────────────────
// Lists the application's named document slots with their review status and
// lets the agent upload/re-upload files for requested or rejected documents.
const DOC_STATUS_LABELS: Record<string, { ar: string; en: string; cls: string }> = {
  required:          { ar: "مطلوب",            en: "Required",          cls: "bg-slate-100 text-slate-700" },
  waiting_customer:  { ar: "بانتظار الرفع",    en: "Awaiting upload",   cls: "bg-orange-100 text-orange-800" },
  uploaded:          { ar: "تم الرفع",          en: "Uploaded",          cls: "bg-indigo-100 text-indigo-800" },
  under_review:      { ar: "قيد المراجعة",     en: "Under review",      cls: "bg-amber-100 text-amber-800" },
  approved:          { ar: "مقبول",             en: "Approved",          cls: "bg-emerald-100 text-emerald-800" },
  rejected:          { ar: "مرفوض",             en: "Rejected",          cls: "bg-red-100 text-red-800" },
  reupload_required: { ar: "مطلوب إعادة الرفع", en: "Re-upload needed",  cls: "bg-red-100 text-red-800" },
};

function AgentDocCard({ doc, appId, ar }: { doc: ApplicationDocument; appId: number; ar: boolean }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const uploadMut = useUploadApplicationDocument();
  const [progress, setProgress] = useState<number | null>(null);
  const s = DOC_STATUS_LABELS[doc.status] ?? { ar: doc.status, en: doc.status, cls: "bg-slate-100 text-slate-700" };
  const canUpload = ["required", "waiting_customer", "reupload_required", "rejected", "uploaded", "under_review"].includes(doc.status);
  const busy = progress !== null || uploadMut.isPending;

  const handleFile = async (file: File) => {
    const err = validateFile(file, doc.allowedFileType, doc.maxFileSizeMb ?? DEFAULT_MAX_MB, ar);
    if (err) { toast({ variant: "destructive", title: err }); return; }
    setProgress(0);
    try {
      const { objectPath } = await uploadFileWithProgress(file, setProgress);
      await uploadMut.mutateAsync({ id: appId, docId: doc.id, data: { storagePath: objectPath } as never });
      await qc.invalidateQueries({ queryKey: getListApplicationDocumentsQueryKey(appId) });
      toast({ title: ar ? "تم رفع المستند بنجاح" : "Document uploaded" });
    } catch (e) {
      toast({ variant: "destructive", title: ar ? "فشل رفع المستند" : "Upload failed", description: (e as Error)?.message });
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-slate-800">{ar ? doc.nameAr : doc.nameEn}{doc.required ? " *" : ""}</p>
          {(doc.requestDescription || doc.description) && (
            <p className="text-xs text-slate-500 mt-0.5">{doc.requestDescription || doc.description}</p>
          )}
        </div>
        <Badge className={`${s.cls} border-0 font-medium shrink-0`}>{ar ? s.ar : s.en}</Badge>
      </div>
      {doc.rejectionReason && (doc.status === "reupload_required" || doc.status === "rejected") && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {ar ? "سبب الرفض: " : "Rejection reason: "}{doc.rejectionReason}
        </p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        {doc.currentVersion?.storagePath && (
          <Button type="button" size="sm" variant="outline" onClick={() => openSignedObject(doc.currentVersion!.storagePath)}>
            <Download className="h-3.5 w-3.5 me-1" />{ar ? "عرض الملف الحالي" : "View current file"}
          </Button>
        )}
        {canUpload && (
          <label className={`inline-flex items-center gap-1.5 rounded-lg border border-dashed px-3 py-1.5 text-sm cursor-pointer transition-colors ${busy ? "opacity-60 pointer-events-none" : "hover:border-slate-400"}`}>
            <input type="file" accept={acceptFor(doc.allowedFileType)} className="hidden" disabled={busy}
              onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) handleFile(f); }} />
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {busy ? `${progress ?? 0}%` : doc.currentVersion ? (ar ? "استبدال الملف" : "Replace file") : (ar ? "رفع الملف" : "Upload file")}
          </label>
        )}
      </div>
      {busy && progress !== null && (
        <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: NAVY }} />
        </div>
      )}
    </div>
  );
}

function AgentApplicationDocuments({ appId, ar }: { appId: number; ar: boolean }) {
  const { data: docs = [], isLoading } = useListApplicationDocuments(appId);
  if (isLoading) {
    return <div className="flex items-center gap-2 text-slate-500 pt-2"><Loader2 className="h-4 w-4 animate-spin" />{ar ? "جارٍ تحميل المستندات…" : "Loading documents…"}</div>;
  }
  if (docs.length === 0) return null;
  const pending = docs.filter((d) => ["required", "waiting_customer", "reupload_required"].includes(d.status));
  return (
    <div className="pt-2 space-y-3">
      <p className="font-semibold text-slate-800">
        {ar ? "المستندات" : "Documents"}
        {pending.length > 0 && (
          <span className="ms-2 text-xs font-normal text-orange-600">
            {ar ? `${pending.length} بحاجة إلى رفع` : `${pending.length} awaiting upload`}
          </span>
        )}
      </p>
      <div className="grid gap-3">
        {docs.map((d) => <AgentDocCard key={d.id} doc={d} appId={appId} ar={ar} />)}
      </div>
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

// ── Notification bell ─────────────────────────────────────────────────────────
function NotificationBell({
  ar,
  onApplicationOpen,
}: {
  ar: boolean;
  onApplicationOpen: (appId: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data: countData } = useGetUnreadNotificationCount({
    query: { refetchInterval: 30000 },
  } as never);
  const unread = countData?.unread ?? 0;

  const { data: notifications = [], isLoading } = useListNotifications(
    { unreadOnly: false } as never,
    { query: { enabled: open, refetchInterval: open ? 30000 : false } } as never,
  );

  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetUnreadNotificationCountQueryKey() });
  };

  const handleNotificationClick = (n: Notification) => {
    if (!n.isRead) {
      markRead.mutate({ id: n.id } as never, { onSuccess: invalidate });
    }
    if (n.relatedEntityType === "agent_application" && n.relatedEntityId) {
      const appId = parseInt(n.relatedEntityId, 10);
      if (!isNaN(appId)) {
        setOpen(false);
        onApplicationOpen(appId);
      }
    }
  };

  const handleMarkAll = () => {
    markAllRead.mutate(undefined as never, { onSuccess: invalidate });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center h-8 w-8 rounded-lg hover:bg-white/10 transition-colors text-white"
        aria-label={ar ? "الإشعارات" : "Notifications"}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -end-0.5 min-w-[16px] h-4 rounded-full bg-amber-400 text-[10px] font-bold text-slate-900 flex items-center justify-center px-0.5 leading-none">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* Panel */}
          <div
            ref={panelRef}
            className="absolute end-0 top-10 z-50 w-80 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden"
            dir={ar ? "rtl" : "ltr"}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <p className="font-semibold text-slate-800 text-sm">
                {ar ? "الإشعارات" : "Notifications"}
                {unread > 0 && (
                  <span className="ms-1.5 inline-flex items-center justify-center min-w-[18px] h-4.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold px-1">
                    {unread}
                  </span>
                )}
              </p>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button
                    onClick={handleMarkAll}
                    className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    {ar ? "تحديد الكل كمقروء" : "Mark all read"}
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
              {isLoading && (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              )}
              {!isLoading && notifications.length === 0 && (
                <div className="py-8 text-center text-sm text-slate-500">
                  {ar ? "لا توجد إشعارات" : "No notifications"}
                </div>
              )}
              {notifications.slice(0, 30).map((n) => {
                const isAgentApp = n.relatedEntityType === "agent_application";
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-start px-4 py-3 text-sm transition-colors hover:bg-slate-50 ${!n.isRead ? "bg-amber-50/60" : ""}`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.isRead && (
                        <span className="mt-1.5 shrink-0 h-1.5 w-1.5 rounded-full bg-amber-400" />
                      )}
                      <div className={!n.isRead ? "" : "ms-3.5"}>
                        <p className="font-medium text-slate-800 leading-snug">
                          {ar ? n.titleAr : n.titleEn}
                        </p>
                        <p className="text-slate-500 mt-0.5 leading-snug">
                          {ar ? n.messageAr : n.messageEn}
                        </p>
                        {isAgentApp && (
                          <p className="text-xs text-blue-600 mt-0.5">
                            {ar ? "انقر لفتح الطلب ←" : "Click to open application →"}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(n.createdAt).toLocaleString(ar ? "ar-SA" : "en-GB")}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
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
  // Notification-driven: when a notification is clicked, open this application.
  const [pendingOpenAppId, setPendingOpenAppId] = useState<number | null>(null);

  const handleApplicationOpen = (appId: number) => {
    setSection("applications");
    setPendingOpenAppId(appId);
  };

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
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-bold tracking-wide">ABSHER TRAVEL</p>
              <p className="text-xs text-amber-400 mt-0.5">{ar ? "بوابة وكلاء السفر" : "Agent Portal"}</p>
            </div>
            <NotificationBell ar={ar} onApplicationOpen={handleApplicationOpen} />
          </div>
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
          <div className="ms-auto shrink-0">
            <NotificationBell ar={ar} onApplicationOpen={handleApplicationOpen} />
          </div>
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
          {section === "applications" && (
            <ApplicationsView
              ar={ar}
              openApplicationId={pendingOpenAppId}
              onOpenHandled={() => setPendingOpenAppId(null)}
            />
          )}
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
