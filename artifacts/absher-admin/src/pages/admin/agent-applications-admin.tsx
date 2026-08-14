/**
 * Admin → Agent Applications: central place where ABSHER TRAVEL staff receive
 * and process visa applications submitted by travel agencies (AG- numbers).
 * Permission: visa_applications.
 */
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListAgentApplications, useGetAgentApplication, useUpdateAgentApplication,
  getListAgentApplicationsQueryKey, getGetAgentApplicationQueryKey,
  type AgentApplication,
} from "@workspace/api-client-react";
import { useTranslation } from "@/hooks/use-translation";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/hooks/use-admin-auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Briefcase, Loader2, FileText, Upload, X, Search } from "lucide-react";

const STATUSES = [
  "received", "under_review", "awaiting_documents", "documents_uploaded",
  "sent_to_embassy", "processing", "issued", "completed", "rejected", "cancelled",
] as const;

const STATUS_META: Record<string, { ar: string; en: string; cls: string }> = {
  received:           { ar: "تم الاستلام", en: "Received", cls: "bg-sky-100 text-sky-800" },
  under_review:       { ar: "قيد المراجعة", en: "Under Review", cls: "bg-amber-100 text-amber-800" },
  awaiting_documents: { ar: "بانتظار مستندات", en: "Awaiting Docs", cls: "bg-orange-100 text-orange-800" },
  documents_uploaded: { ar: "تم رفع المستندات", en: "Docs Uploaded", cls: "bg-indigo-100 text-indigo-800" },
  sent_to_embassy:    { ar: "أُرسل للسفارة", en: "Sent to Embassy", cls: "bg-purple-100 text-purple-800" },
  processing:         { ar: "قيد المعالجة", en: "Processing", cls: "bg-blue-100 text-blue-800" },
  issued:             { ar: "صدرت", en: "Issued", cls: "bg-emerald-100 text-emerald-800" },
  completed:          { ar: "مكتمل", en: "Completed", cls: "bg-emerald-100 text-emerald-800" },
  rejected:           { ar: "مرفوض", en: "Rejected", cls: "bg-red-100 text-red-700" },
  cancelled:          { ar: "ملغي", en: "Cancelled", cls: "bg-gray-200 text-gray-600" },
};

function Pill({ status, ar }: { status: string; ar: boolean }) {
  const m = STATUS_META[status] ?? { ar: status, en: status, cls: "bg-gray-100 text-gray-600" };
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${m.cls}`}>{ar ? m.ar : m.en}</span>;
}

const base = () => import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

async function openObjectInNewTab(path: string): Promise<void> {
  if (/^https?:\/\//.test(path)) { window.open(path, "_blank", "noopener"); return; }
  try {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    const res = await fetch(`${base()}/api/storage/sign?path=${encodeURIComponent(path)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) throw new Error(String(res.status));
    const { url } = await res.json();
    window.open(`${base()}${url}`, "_blank", "noopener");
  } catch {
    toast.error("تعذر فتح الملف");
  }
}

async function uploadFile(file: File): Promise<string | null> {
  const fd = new FormData();
  fd.append("file", file);
  try {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    const res = await fetch(`${base()}/api/storage/uploads`, {
      method: "POST", body: fd,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.objectPath ?? null;
  } catch {
    return null;
  }
}

function DocLink({ label, path }: { label: string; path?: string | null }) {
  if (!path) return null;
  return (
    <button onClick={() => openObjectInNewTab(path)}
      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs hover:bg-slate-50">
      <FileText className="w-3.5 h-3.5" />{label}
    </button>
  );
}

function DetailPanel({ id, ar, onClose }: { id: number; ar: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: app, isLoading } = useGetAgentApplication(id);
  const update = useUpdateAgentApplication();
  const [notes, setNotes] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getListAgentApplicationsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetAgentApplicationQueryKey(id) });
  };
  const patch = (data: Record<string, unknown>, msg: string) =>
    update.mutate({ id, data: data as never }, {
      onSuccess: () => { invalidate(); toast.success(msg); },
      onError: () => toast.error(ar ? "فشلت العملية" : "Operation failed"),
    });

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-stretch justify-end" onClick={onClose}>
      <div className="bg-white w-full max-w-xl h-full overflow-y-auto p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">{ar ? "تفاصيل الطلب" : "Application details"}</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        {isLoading || !app ? <Loader2 className="w-5 h-5 animate-spin" /> : (
          <>
            <div className="rounded-xl border p-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-[#0d2351]">{app.trackingNumber}</span>
                <Pill status={app.status} ar={ar} />
              </div>
              <Row l={ar ? "الوكالة" : "Agency"} v={app.agencyName ?? "-"} />
              <Row l={ar ? "الوكيل" : "Agent"} v={app.agentName ?? "-"} />
              <Row l={ar ? "المتقدم" : "Applicant"} v={app.fullName ?? "-"} />
              <Row l={ar ? "الجنسية" : "Nationality"} v={app.nationality ?? "-"} />
              <Row l={ar ? "الوجهة" : "Destination"} v={`${ar ? app.countryAr : app.countryEn} — ${app.visaType ?? ""}`} />
              <Row l={ar ? "سعر الوكالة" : "Agency price"} v={app.agentPrice ?? "-"} />
              <Row l={ar ? "الجواز" : "Passport"} v={app.passportNumber ?? "-"} />
              <Row l={ar ? "تاريخ التقديم" : "Submitted"} v={new Date(app.createdAt).toLocaleString(ar ? "ar-SA" : "en-GB")} />
              <Row l={ar ? "بريد العميل" : "Customer email"} v={app.email ?? "-"} />
              <Row l={ar ? "جوال العميل" : "Customer phone"} v={app.phone ?? "-"} />
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-sm">{ar ? "المستندات" : "Documents"}</p>
              <div className="flex flex-wrap gap-2">
                <DocLink label={ar ? "الجواز" : "Passport"} path={app.passportImageUrl} />
                <DocLink label={ar ? "الصورة الشخصية" : "Photo"} path={app.personalPhotoUrl} />
                <DocLink label={ar ? "مستند إضافي" : "Extra doc"} path={app.residencyImageUrl} />
                <DocLink label={ar ? "مستند إضافي 2" : "Extra doc 2"} path={app.visaImageUrl} />
                <DocLink label={ar ? "التأشيرة الصادرة" : "Issued visa"} path={app.issuedVisaUrl} />
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-sm">{ar ? "تغيير الحالة" : "Change status"}</p>
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map((s) => (
                  <button key={s} disabled={update.isPending || app.status === s}
                    onClick={() => patch({ status: s }, ar ? "تم تحديث الحالة وإشعار الوكيل" : "Status updated; agent notified")}
                    className={`rounded-full px-3 py-1.5 text-xs border transition-colors ${app.status === s ? "bg-[#0d2351] text-white border-[#0d2351]" : "bg-white hover:bg-slate-50"}`}>
                    {ar ? STATUS_META[s].ar : STATUS_META[s].en}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-sm">{ar ? "التأشيرة الصادرة" : "Issued visa file"}</p>
              <label className="inline-flex items-center gap-2 rounded-lg border border-dashed px-4 py-2.5 text-sm cursor-pointer hover:bg-slate-50">
                <input type="file" className="hidden" accept="image/*,.pdf" onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setUploading(true);
                  const p = await uploadFile(f);
                  setUploading(false);
                  if (p) patch({ issuedVisaUrl: p, status: "issued" }, ar ? "تم رفع التأشيرة وإشعار الوكيل" : "Visa uploaded; agent notified");
                  else toast.error(ar ? "فشل الرفع" : "Upload failed");
                  e.target.value = "";
                }} />
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {ar ? "رفع ملف التأشيرة" : "Upload visa file"}
              </label>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-sm">{ar ? "ملاحظات للوكيل" : "Notes to agent"}</p>
              <textarea className="w-full border rounded-xl px-3 py-2 text-sm min-h-20"
                value={notes ?? app.adminNotes ?? ""} onChange={(e) => setNotes(e.target.value)} />
              <Button size="sm" className="bg-[#0d2351] text-white" disabled={update.isPending || notes === null}
                onClick={() => patch({ adminNotes: notes ?? "" }, ar ? "تم حفظ الملاحظات" : "Notes saved")}>
                {ar ? "حفظ الملاحظات" : "Save notes"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-slate-100 last:border-0 pb-1.5">
      <span className="text-muted-foreground">{l}</span>
      <span className="font-medium text-end">{v}</span>
    </div>
  );
}

export default function AgentApplicationsAdmin() {
  const { language } = useTranslation();
  const ar = language === "ar";
  const { data = [], isLoading } = useListAgentApplications();
  const [openId, setOpenId] = useState<number | null>(null);
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const list = data as AgentApplication[];
    if (!q.trim()) return list;
    const s = q.trim().toLowerCase();
    return list.filter((r) =>
      [r.trackingNumber, r.fullName, r.agencyName, r.agentName, r.nationality, r.countryEn, r.countryAr]
        .some((v) => (v ?? "").toLowerCase().includes(s)));
  }, [data, q]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Briefcase className="w-5 h-5" />{ar ? "طلبات الوكالات" : "Agent Applications"}</h1>
          <p className="text-sm text-muted-foreground">{ar ? "الطلبات المقدمة عبر بوابة وكلاء السفر" : "Applications submitted via the travel agent portal"}</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute top-2.5 start-3 text-muted-foreground" />
          <input className="border rounded-xl ps-9 pe-3 py-2 text-sm w-64" placeholder={ar ? "بحث..." : "Search..."} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border bg-white p-10 text-center text-muted-foreground">
          {ar ? "لا توجد طلبات من الوكالات بعد." : "No agency applications yet."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="px-4 py-3 text-start font-medium">{ar ? "رقم الطلب" : "Number"}</th>
                <th className="px-4 py-3 text-start font-medium">{ar ? "الوكالة" : "Agency"}</th>
                <th className="px-4 py-3 text-start font-medium">{ar ? "المتقدم" : "Applicant"}</th>
                <th className="px-4 py-3 text-start font-medium">{ar ? "الجنسية" : "Nationality"}</th>
                <th className="px-4 py-3 text-start font-medium">{ar ? "الوجهة" : "Destination"}</th>
                <th className="px-4 py-3 text-start font-medium">{ar ? "السعر" : "Price"}</th>
                <th className="px-4 py-3 text-start font-medium">{ar ? "الحالة" : "Status"}</th>
                <th className="px-4 py-3 text-start font-medium">{ar ? "التاريخ" : "Date"}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50 cursor-pointer" onClick={() => setOpenId(r.id)}>
                  <td className="px-4 py-3 font-mono font-medium text-[#0d2351]">{r.trackingNumber}</td>
                  <td className="px-4 py-3">{r.agencyName ?? "-"}</td>
                  <td className="px-4 py-3">{r.fullName}</td>
                  <td className="px-4 py-3">{r.nationality}</td>
                  <td className="px-4 py-3">{ar ? r.countryAr : r.countryEn} · {r.visaType}</td>
                  <td className="px-4 py-3">{r.agentPrice ?? "-"}</td>
                  <td className="px-4 py-3"><Pill status={r.status} ar={ar} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(r.createdAt).toLocaleDateString(ar ? "ar-SA" : "en-GB")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {openId !== null && <DetailPanel id={openId} ar={ar} onClose={() => setOpenId(null)} />}
    </div>
  );
}
