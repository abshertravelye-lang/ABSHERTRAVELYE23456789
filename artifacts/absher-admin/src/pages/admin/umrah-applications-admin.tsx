import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListUmrahApplicationsAdmin,
  useUpdateUmrahApplication,
  getListUmrahApplicationsAdminQueryKey,
  type UmrahApplicationAdmin,
} from "@workspace/api-client-react";
import { useTranslation } from "@/hooks/use-translation";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/hooks/use-admin-auth";
import { toast } from "sonner";
import {
  Search, Eye, X, Clock, FileText, CheckCircle, Award, CreditCard,
  UploadCloud, Paperclip, Phone, User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Storage upload helper (matches visa-applications-admin conventions) ──────
async function uploadFile(file: File): Promise<string | null> {
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
  const fd = new FormData();
  fd.append("file", file);
  try {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    const res = await fetch(`${base}/api/storage/uploads`, {
      method: "POST",
      body: fd,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.objectPath ?? json.url ?? null;
  } catch {
    return null;
  }
}

/**
 * Open a private storage object in a new tab. Objects require auth, so we
 * first exchange the path for a short-lived signed URL (an <a href> cannot
 * carry the Authorization header).
 */
async function openObjectInNewTab(path: string): Promise<void> {
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
  if (/^https?:\/\//.test(path)) { window.open(path, "_blank", "noopener"); return; }
  if (!path.startsWith("/objects/")) { window.open(`${base}${path.startsWith("/") ? "" : "/"}${path}`, "_blank", "noopener"); return; }
  try {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    const res = await fetch(`${base}/api/storage/sign?path=${encodeURIComponent(path)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) throw new Error(String(res.status));
    const { url } = await res.json();
    // url is already a root-absolute path (/api/storage/...); do not prepend
    // the artifact base prefix or it becomes /absher-admin/api/... which routes
    // to the admin SPA instead of the API server.
    window.open(url, "_blank", "noopener");
  } catch {
    toast.error("تعذر فتح الملف");
  }
}

const STATUS_META: Record<string, { arLabel: string; enLabel: string; color: string; icon: React.ReactNode }> = {
  awaiting_payment: { arLabel: "بانتظار الدفع", enLabel: "Awaiting Payment", color: "bg-orange-50 text-orange-700 border-orange-200", icon: <CreditCard className="w-3.5 h-3.5" /> },
  submitted:        { arLabel: "تم التقديم",     enLabel: "Submitted",        color: "bg-blue-50 text-blue-700 border-blue-200",       icon: <FileText className="w-3.5 h-3.5" /> },
  under_review:     { arLabel: "قيد المراجعة",   enLabel: "Under Review",     color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: <Clock className="w-3.5 h-3.5" /> },
  processing:       { arLabel: "قيد المعالجة",   enLabel: "Processing",       color: "bg-teal-50 text-teal-700 border-teal-200",       icon: <Clock className="w-3.5 h-3.5" /> },
  approved:         { arLabel: "تمت الموافقة",   enLabel: "Approved",         color: "bg-green-50 text-green-700 border-green-200",    icon: <CheckCircle className="w-3.5 h-3.5" /> },
  rejected:         { arLabel: "مرفوض",          enLabel: "Rejected",         color: "bg-red-50 text-red-700 border-red-200",          icon: <X className="w-3.5 h-3.5" /> },
  completed:        { arLabel: "مكتمل",          enLabel: "Completed",        color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <Award className="w-3.5 h-3.5" /> },
};

const STATUS_ORDER = ["awaiting_payment", "submitted", "under_review", "processing", "approved", "rejected", "completed"];

const PAYMENT_META: Record<string, { arLabel: string; enLabel: string; color: string }> = {
  unpaid: { arLabel: "غير مدفوع", enLabel: "Unpaid", color: "bg-orange-50 text-orange-700 border-orange-200" },
  paid:   { arLabel: "مدفوع",     enLabel: "Paid",   color: "bg-green-50 text-green-700 border-green-200" },
  failed: { arLabel: "فشل الدفع", enLabel: "Failed", color: "bg-red-50 text-red-700 border-red-200" },
};

function StatusBadge({ status, ar }: { status: string; ar: boolean }) {
  const meta = STATUS_META[status] ?? { arLabel: status, enLabel: status, color: "bg-slate-50 text-slate-700 border-slate-200", icon: null };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${meta.color}`}>
      {meta.icon}
      {ar ? meta.arLabel : meta.enLabel}
    </span>
  );
}

function PaymentBadge({ status, ar }: { status: string; ar: boolean }) {
  const meta = PAYMENT_META[status] ?? { arLabel: status, enLabel: status, color: "bg-slate-50 text-slate-700 border-slate-200" };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-medium ${meta.color}`}>
      {ar ? meta.arLabel : meta.enLabel}
    </span>
  );
}

function fmtMoney(amount: number | null | undefined, currency: string): string {
  if (amount === null || amount === undefined) return "—";
  return `${amount} ${currency}`;
}

function fmtDate(iso: string | null | undefined, ar: boolean): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString(ar ? "ar-SA" : "en-US"); }
  catch { return iso; }
}

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div>
      <span className="text-muted-foreground text-xs">{label}</span>
      <div className={`font-medium ${mono ? "font-mono" : ""}`}>{value ?? "—"}</div>
    </div>
  );
}

/** A document image entry read off the Umrah application row. */
interface DocEntry { labelAr: string; labelEn: string; path: string | null | undefined; }

function DocumentThumb({ doc, ar }: { doc: DocEntry; ar: boolean }) {
  if (!doc.path) return null;
  return (
    <button
      type="button"
      onClick={() => openObjectInNewTab(doc.path as string)}
      className="border rounded-2xl overflow-hidden bg-white text-start hover:border-[#0d2351]/50 transition-colors group"
    >
      <div className="h-32 bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-200 transition-colors">
        <FileText className="w-8 h-8" />
      </div>
      <div className="px-3 py-2 flex items-center justify-between gap-2">
        <span className="text-sm font-medium truncate">{ar ? doc.labelAr : doc.labelEn}</span>
        <Eye className="w-4 h-4 text-[#0d2351] shrink-0" />
      </div>
    </button>
  );
}

function DetailModal({ app, onClose, onUpdate, updating, ar }: {
  app: UmrahApplicationAdmin; onClose: () => void;
  onUpdate: (status: string, notes: string, issuedVisaUrl: string) => void; updating: boolean; ar: boolean;
}) {
  const [status, setStatus] = useState<string>(app.status);
  const [notes, setNotes] = useState(app.adminNotes ?? "");
  const [issuedVisaUrl, setIssuedVisaUrl] = useState(app.issuedVisaUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleVisaFile = async (file: File) => {
    setUploading(true);
    const path = await uploadFile(file);
    setUploading(false);
    if (path) { setIssuedVisaUrl(path); toast.success(ar ? "تم رفع الملف" : "File uploaded"); }
    else toast.error(ar ? "فشل رفع الملف" : "Upload failed");
  };

  const docs: DocEntry[] = [
    { labelAr: "صورة الجواز", labelEn: "Passport Image", path: app.passportImageUrl },
    { labelAr: "الصورة الشخصية", labelEn: "Personal Photo", path: app.personalPhotoUrl },
    { labelAr: "صورة إقامة المستضيف", labelEn: "Sponsor Residence", path: app.sponsorResidencyImageUrl },
  ];

  const userName = [app.user?.firstName, app.user?.lastName].filter(Boolean).join(" ").trim();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto" dir={ar ? "rtl" : "ltr"}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold">{ar ? "تفاصيل طلب العمرة" : "Umrah Application Details"}</h2>
            <p className="text-sm text-muted-foreground mt-0.5 font-mono">{app.trackingNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
          {/* Applicant */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">{ar ? "بيانات المعتمر" : "Pilgrim Information"}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Field label={ar ? "الاسم الكامل" : "Full Name"} value={app.fullName} />
              <Field label={ar ? "الجنسية" : "Nationality"} value={app.nationality} />
              <Field label={ar ? "الجنس" : "Gender"} value={app.gender === "male" ? (ar ? "ذكر" : "Male") : app.gender === "female" ? (ar ? "أنثى" : "Female") : "—"} />
              <Field label={ar ? "تاريخ الميلاد" : "Date of Birth"} value={app.dateOfBirth} />
              <Field label={ar ? "رقم الجوال" : "Phone"} value={<span dir="ltr">{app.phone}</span>} mono />
              <Field label={ar ? "جوال الطوارئ" : "Emergency Phone"} value={<span dir="ltr">{app.emergencyPhone}</span>} mono />
              <Field label={ar ? "البريد الإلكتروني" : "Email"} value={app.contactEmail ?? app.user?.email} />
              <Field label={ar ? "حساب العميل" : "Account"} value={userName || app.user?.email || "—"} />
            </div>
          </div>

          {/* Passport */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">{ar ? "بيانات جواز السفر" : "Passport Data"}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Field label={ar ? "رقم الجواز" : "Passport No."} value={app.passportNumber} mono />
              <Field label={ar ? "تاريخ الإصدار" : "Issue Date"} value={app.passportIssueDate} />
              <Field label={ar ? "تاريخ الانتهاء" : "Expiry Date"} value={app.passportExpiryDate} />
            </div>
          </div>

          {/* Sponsor */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">{ar ? "بيانات المستضيف" : "Sponsor (Host) Data"}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Field label={ar ? "يوجد مستضيف" : "Sponsor Available"} value={app.sponsorAvailable ? (ar ? "نعم" : "Yes") : (ar ? "لا" : "No")} />
              <Field label={ar ? "رقم جوال المستضيف" : "Sponsor Phone"} value={<span dir="ltr">{app.sponsorPhone}</span>} mono />
            </div>
          </div>

          {/* Payment */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">{ar ? "بيانات الدفع" : "Payment"}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground text-xs">{ar ? "حالة الدفع" : "Payment Status"}</span><div className="mt-1"><PaymentBadge status={app.paymentStatus} ar={ar} /></div></div>
              <Field label={ar ? "المبلغ" : "Amount"} value={fmtMoney(app.feeAmount, app.feeCurrency)} />
              <Field label={ar ? "رقم العملية" : "Payment Reference"} value={app.paymentReference} mono />
              <Field label={ar ? "تاريخ الدفع" : "Paid At"} value={fmtDate(app.paidAt, ar)} />
            </div>
          </div>

          {/* Documents */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">{ar ? "المستندات" : "Documents"}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {docs.filter(d => d.path).map((d) => <DocumentThumb key={d.labelEn} doc={d} ar={ar} />)}
            </div>
            {docs.every(d => !d.path) && (
              <div className="text-sm text-muted-foreground text-center py-4 border rounded-xl bg-slate-50">{ar ? "لا توجد مستندات" : "No documents"}</div>
            )}
          </div>

          {/* Status update */}
          <div className="bg-slate-50 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold">{ar ? "تحديث الحالة" : "Update Status"}</h3>
            <div>
              <label className="block text-sm font-medium mb-2">{ar ? "الحالة" : "Status"}</label>
              <select className="w-full border rounded-xl px-4 py-2.5 text-sm bg-white" value={status} onChange={e => setStatus(e.target.value)}>
                {STATUS_ORDER.map(s => {
                  const m = STATUS_META[s];
                  return <option key={s} value={s}>{ar ? m.arLabel : m.enLabel}</option>;
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{ar ? "ملاحظات إدارية" : "Admin Notes"}</label>
              <textarea rows={3} className="w-full border rounded-xl px-4 py-2.5 text-sm resize-none" value={notes} onChange={e => setNotes(e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">{ar ? "ستظهر هذه الملاحظة للعميل في التطبيق." : "This note is shown to the client in the app."}</p>
            </div>

            {/* Issued visa file */}
            <div>
              <label className="block text-sm font-medium mb-2">{ar ? "إرفاق ملف التأشيرة" : "Attach Visa File"}</label>
              {issuedVisaUrl ? (
                <div className="flex items-center justify-between gap-3 border rounded-xl px-4 py-2.5 bg-white">
                  <button
                    type="button"
                    onClick={() => openObjectInNewTab(issuedVisaUrl)}
                    className="flex items-center gap-2 text-sm text-[#0d2351] font-medium truncate hover:underline"
                  >
                    <Paperclip className="w-4 h-4 shrink-0" />
                    <span className="truncate" dir="ltr">{issuedVisaUrl.split("/").pop()}</span>
                  </button>
                  <div className="flex gap-2 shrink-0">
                    <button type="button" onClick={() => fileRef.current?.click()} className="text-xs text-[#0d2351] hover:underline font-medium">
                      {ar ? "استبدال" : "Replace"}
                    </button>
                    <button type="button" onClick={() => setIssuedVisaUrl("")} className="text-xs text-red-500 hover:underline">
                      {ar ? "حذف" : "Remove"}
                    </button>
                  </div>
                  <input ref={fileRef} type="file" className="hidden" accept="application/pdf,image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleVisaFile(f); }} disabled={uploading} />
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-xl px-4 py-4 text-sm text-muted-foreground cursor-pointer hover:border-[#0d2351]/50 hover:bg-[#0d2351]/5 transition-colors">
                  <input type="file" className="hidden" accept="application/pdf,image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleVisaFile(f); }} disabled={uploading} />
                  {uploading ? (
                    <><div className="w-4 h-4 border-2 border-[#0d2351]/20 border-t-[#0d2351] rounded-full animate-spin" />{ar ? "جاري الرفع..." : "Uploading..."}</>
                  ) : (
                    <><UploadCloud className="w-4 h-4" />{ar ? "رفع ملف التأشيرة (PDF أو صورة)" : "Upload visa file (PDF or image)"}</>
                  )}
                </label>
              )}
            </div>

            <Button onClick={() => onUpdate(status, notes, issuedVisaUrl)} disabled={updating || uploading} className="w-full">
              {updating ? (ar ? "جارٍ الحفظ..." : "Saving...") : (ar ? "حفظ وإرسال للعميل" : "Save & Send to Client")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UmrahApplicationsAdmin() {
  const { language } = useTranslation();
  const ar = language === "ar";
  const qc = useQueryClient();
  const { data: applications = [], isLoading } = useListUmrahApplicationsAdmin();
  const updateMut = useUpdateUmrahApplication();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedApp, setSelectedApp] = useState<UmrahApplicationAdmin | null>(null);

  const filtered = applications.filter(a => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      (a.fullName ?? "").toLowerCase().includes(q) ||
      (a.trackingNumber ?? "").toLowerCase().includes(q) ||
      (a.sponsorPhone ?? "").includes(q) ||
      (a.paymentReference ?? "").toLowerCase().includes(q);
    const matchesStatus = !filterStatus || a.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  async function handleUpdate(status: string, notes: string, issuedVisaUrl: string) {
    if (!selectedApp) return;
    try {
      await updateMut.mutateAsync({
        id: selectedApp.id,
        data: {
          status: status as never,
          adminNotes: notes,
          issuedVisaUrl: issuedVisaUrl || undefined,
        },
      });
      await qc.invalidateQueries({ queryKey: getListUmrahApplicationsAdminQueryKey() });
      toast.success(ar ? "تم تحديث الطلب بنجاح" : "Application updated successfully");
      setSelectedApp(null);
    } catch {
      toast.error(ar ? "تعذّر تحديث الطلب" : "Failed to update application");
    }
  }

  const stats = {
    total: applications.length,
    awaiting: applications.filter(a => a.status === "awaiting_payment").length,
    processing: applications.filter(a => ["submitted", "under_review", "processing"].includes(a.status)).length,
    completed: applications.filter(a => a.status === "completed" || a.status === "approved").length,
  };

  return (
    <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-bold">{ar ? "طلبات تأشيرة العمرة" : "Umrah Visa Applications"}</h1>
        <p className="text-sm text-muted-foreground mt-1">{ar ? "متابعة وتحديث حالة طلبات تأشيرة العمرة" : "Track and update Umrah visa application statuses"}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: ar ? "الإجمالي" : "Total", value: stats.total, color: "bg-blue-50 text-blue-700" },
          { label: ar ? "بانتظار الدفع" : "Awaiting Payment", value: stats.awaiting, color: "bg-orange-50 text-orange-700" },
          { label: ar ? "قيد المعالجة" : "Processing", value: stats.processing, color: "bg-purple-50 text-purple-700" },
          { label: ar ? "مكتملة" : "Completed", value: stats.completed, color: "bg-green-50 text-green-700" },
        ].map((s, i) => (
          <div key={i} className={`${s.color} rounded-2xl p-4`}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm font-medium mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full border rounded-xl ps-10 pe-4 py-2.5 text-sm bg-white"
            placeholder={ar ? "بحث بالاسم أو رقم الطلب أو رقم العملية..." : "Search by name, tracking or payment ref..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border rounded-xl px-4 py-2.5 text-sm bg-white min-w-44"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">{ar ? "كل الحالات" : "All Statuses"}</option>
          {STATUS_ORDER.map(s => {
            const m = STATUS_META[s];
            return <option key={s} value={s}>{ar ? m.arLabel : m.enLabel}</option>;
          })}
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground">{ar ? "جارٍ التحميل..." : "Loading..."}</div>
      ) : (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="text-start px-5 py-3 font-medium text-muted-foreground">{ar ? "رقم الطلب" : "Tracking #"}</th>
                <th className="text-start px-5 py-3 font-medium text-muted-foreground">{ar ? "اسم المعتمر" : "Pilgrim"}</th>
                <th className="text-start px-5 py-3 font-medium text-muted-foreground">{ar ? "الجنسية" : "Nationality"}</th>
                <th className="text-start px-5 py-3 font-medium text-muted-foreground">{ar ? "جوال المستضيف" : "Sponsor Phone"}</th>
                <th className="text-start px-5 py-3 font-medium text-muted-foreground">{ar ? "حالة الطلب" : "Status"}</th>
                <th className="text-start px-5 py-3 font-medium text-muted-foreground">{ar ? "الدفع" : "Payment"}</th>
                <th className="text-start px-5 py-3 font-medium text-muted-foreground">{ar ? "المبلغ" : "Amount"}</th>
                <th className="text-start px-5 py-3 font-medium text-muted-foreground">{ar ? "رقم العملية" : "Payment Ref"}</th>
                <th className="text-start px-5 py-3 font-medium text-muted-foreground">{ar ? "تاريخ التقديم" : "Submitted"}</th>
                <th className="text-start px-5 py-3 font-medium text-muted-foreground">{ar ? "إجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-16 text-muted-foreground">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <div>{ar ? "لا توجد طلبات" : "No applications found"}</div>
                </td></tr>
              ) : filtered.map(a => (
                <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-4"><span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded-lg">{a.trackingNumber}</span></td>
                  <td className="px-5 py-4">
                    <div className="font-medium flex items-center gap-1.5"><UserIcon className="w-3.5 h-3.5 text-muted-foreground" />{a.fullName ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{a.contactEmail ?? a.user?.email ?? ""}</div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{a.nationality ?? "—"}</td>
                  <td className="px-5 py-4 text-muted-foreground font-mono text-xs" dir="ltr"><span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" />{a.sponsorPhone ?? "—"}</span></td>
                  <td className="px-5 py-4"><StatusBadge status={a.status} ar={ar} /></td>
                  <td className="px-5 py-4"><PaymentBadge status={a.paymentStatus} ar={ar} /></td>
                  <td className="px-5 py-4 text-muted-foreground">{fmtMoney(a.feeAmount, a.feeCurrency)}</td>
                  <td className="px-5 py-4 text-muted-foreground font-mono text-xs">{a.paymentReference ?? "—"}</td>
                  <td className="px-5 py-4 text-muted-foreground text-xs">{fmtDate(a.createdAt, ar)}</td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => setSelectedApp(a)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg hover:bg-slate-50"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {ar ? "عرض" : "View"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedApp && (
        <DetailModal
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onUpdate={handleUpdate}
          updating={updateMut.isPending}
          ar={ar}
        />
      )}
    </div>
  );
}
