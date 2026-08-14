import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListVisaApplications, useUpdateVisaApplication, getListVisaApplicationsQueryKey,
  useListApplicationDocuments, useRequestApplicationDocument, useApproveApplicationDocument, useRejectApplicationDocument,
  getListApplicationDocumentsQueryKey,
  type ApplicationDocument, type ApplicationDocumentVersion,
} from "@workspace/api-client-react";
import { useTranslation } from "@/hooks/use-translation";
import { useAdminAuth, ADMIN_ACCESS_TOKEN_KEY } from "@/hooks/use-admin-auth";
import { toast } from "sonner";
import { Search, Eye, CheckCircle, X, Clock, FileText, Send, Award, Stamp, AlertTriangle, Ban, Download, ZoomIn, ZoomOut, ImageOff, RotateCw, Plus, History, ThumbsUp, ThumbsDown, UploadCloud, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Storage upload helper (matches visas-admin conventions) ────────────────
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
    window.open(`${base}${url}`, "_blank", "noopener");
  } catch {
    toast.error("تعذر فتح الملف");
  }
}

const STATUS_META: Record<string, { arLabel: string; enLabel: string; color: string; icon: React.ReactNode }> = {
  received:           { arLabel: "مستلم",             enLabel: "Received",            color: "bg-blue-50 text-blue-700 border-blue-200",     icon: <FileText className="w-3.5 h-3.5" /> },
  under_review:       { arLabel: "قيد المراجعة",      enLabel: "Under Review",        color: "bg-yellow-50 text-yellow-700 border-yellow-200",icon: <Clock className="w-3.5 h-3.5" /> },
  awaiting_documents: { arLabel: "بانتظار وثائق",     enLabel: "Awaiting Docs",       color: "bg-orange-50 text-orange-700 border-orange-200",icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  documents_uploaded: { arLabel: "تم رفع الوثائق",   enLabel: "Docs Uploaded",       color: "bg-purple-50 text-purple-700 border-purple-200",icon: <CheckCircle className="w-3.5 h-3.5" /> },
  sent_to_embassy:    { arLabel: "أُرسل للسفارة",     enLabel: "Sent to Embassy",     color: "bg-indigo-50 text-indigo-700 border-indigo-200",icon: <Send className="w-3.5 h-3.5" /> },
  processing:         { arLabel: "قيد المعالجة",      enLabel: "Processing",          color: "bg-teal-50 text-teal-700 border-teal-200",     icon: <Clock className="w-3.5 h-3.5" /> },
  issued:             { arLabel: "صدرت التأشيرة",     enLabel: "Issued",              color: "bg-green-50 text-green-700 border-green-200",  icon: <Stamp className="w-3.5 h-3.5" /> },
  completed:          { arLabel: "مكتمل",              enLabel: "Completed",           color: "bg-emerald-50 text-emerald-700 border-emerald-200",icon: <Award className="w-3.5 h-3.5" /> },
  rejected:           { arLabel: "مرفوض",              enLabel: "Rejected",            color: "bg-red-50 text-red-700 border-red-200",        icon: <X className="w-3.5 h-3.5" /> },
  cancelled:          { arLabel: "ملغى",               enLabel: "Cancelled",           color: "bg-slate-50 text-slate-600 border-slate-200",  icon: <Ban className="w-3.5 h-3.5" /> },
};

const STATUS_ORDER = ["received","under_review","awaiting_documents","documents_uploaded","sent_to_embassy","processing","issued","completed","rejected","cancelled"];

/** Document status metadata — independent from application status (spec §11). */
const DOC_STATUS_META: Record<string, { arLabel: string; enLabel: string; color: string }> = {
  required:          { arLabel: "مطلوب",                    enLabel: "Required",           color: "bg-slate-50 text-slate-700 border-slate-200" },
  waiting_customer:  { arLabel: "بانتظار العميل",           enLabel: "Waiting for Customer",color: "bg-orange-50 text-orange-700 border-orange-200" },
  uploaded:          { arLabel: "تم الرفع",                 enLabel: "Uploaded",           color: "bg-blue-50 text-blue-700 border-blue-200" },
  under_review:      { arLabel: "قيد المراجعة",             enLabel: "Under Review",       color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  approved:          { arLabel: "مقبول",                    enLabel: "Approved",           color: "bg-green-50 text-green-700 border-green-200" },
  rejected:          { arLabel: "مرفوض",                    enLabel: "Rejected",           color: "bg-red-50 text-red-700 border-red-200" },
  reupload_required: { arLabel: "مطلوب إعادة الرفع",        enLabel: "Re-upload Required", color: "bg-red-50 text-red-700 border-red-200" },
};

function DocStatusBadge({ status, ar }: { status: string; ar: boolean }) {
  const meta = DOC_STATUS_META[status] ?? { arLabel: status, enLabel: status, color: "bg-slate-50 text-slate-700 border-slate-200" };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-medium ${meta.color}`}>
      {ar ? meta.arLabel : meta.enLabel}
    </span>
  );
}

/**
 * Storage object paths (/objects/...) are served by the access-controlled API
 * route /api/storage/objects/*. NO session token ever goes in a URL. Instead:
 *   • Previews / full-size viewing: fetch the object as a blob WITH the
 *     Authorization header, then render the resulting object-URL.
 *   • Download / PDF iframe (where a header is impossible): request a
 *     short-lived, path-scoped signed URL from /api/storage/sign.
 */
const API_ROOT = ""; // API mounted at root /api/... (not under the artifact base)

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function isPdf(url: string): boolean {
  return /\.pdf(\?|$)/i.test(url);
}

/** Fetch a protected object as a blob object-URL using the Authorization header. */
async function fetchObjectBlobUrl(objectPath: string): Promise<string> {
  const res = await fetch(`${API_ROOT}/api/storage${objectPath}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

/** Ask the server for a short-lived signed URL (used for <a download> / iframe). */
async function getSignedUrl(objectPath: string, download = false): Promise<string> {
  const params = new URLSearchParams({ path: objectPath });
  if (download) params.set("download", "1");
  const res = await fetch(`${API_ROOT}/api/storage/sign?${params.toString()}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`sign failed: ${res.status}`);
  const data = await res.json();
  return data.url as string;
}

/** Trigger a browser download of the ORIGINAL file via a signed URL. */
async function downloadObject(objectPath: string, ar: boolean): Promise<void> {
  try {
    const signed = await getSignedUrl(objectPath, true);
    const a = document.createElement("a");
    a.href = signed;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch {
    alert(ar ? "تعذّر تنزيل الملف" : "Failed to download the file");
  }
}

interface ViewerTarget { path: string; label: string; }

/** A profile-document entry read directly off the application row. */
interface LegacyDoc { key: string; labelAr: string; labelEn: string; path: string; }

/**
 * Collect profile documents stored directly on the application row
 * (passport / photo / residence …). These exist for applications that predate
 * the application_documents seeding, and are what the customer app renders.
 * We surface any that are NOT already represented as an application_document
 * (matched by documentKey) so the admin never sees an empty section for an
 * application that clearly has uploaded files.
 */
function collectLegacyDocuments(app: Record<string, unknown> | null | undefined): LegacyDoc[] {
  if (!app) return [];
  const defs: Array<{ key: string; field: string; labelAr: string; labelEn: string }> = [
    { key: "personal-photo",  field: "personalPhotoUrl",     labelAr: "الصورة الشخصية",         labelEn: "Personal Photo" },
    { key: "passport",        field: "passportImageUrl",     labelAr: "جواز السفر",             labelEn: "Passport" },
    { key: "residence",       field: "residencyImageUrl",    labelAr: "الإقامة",                labelEn: "Residence ID" },
    { key: "residence-back",  field: "residencyBackImageUrl",labelAr: "الإقامة (الخلف)",        labelEn: "Residence ID (Back)" },
    { key: "visa-document",   field: "visaImageUrl",         labelAr: "إقامة الكفيل / التأشيرة", labelEn: "Sponsor Residence / Visa" },
  ];
  const out: LegacyDoc[] = [];
  for (const d of defs) {
    const path = app[d.field];
    if (typeof path === "string" && path) {
      out.push({ key: d.key, labelAr: d.labelAr, labelEn: d.labelEn, path });
    }
  }
  const custom = app.customFieldResponses as Record<string, unknown> | undefined;
  if (custom && typeof custom === "object") {
    for (const [k, v] of Object.entries(custom)) {
      if (typeof v === "string" && v.startsWith("/objects/")) {
        out.push({ key: `custom_${k}`, labelAr: k, labelEn: k, path: v });
      }
    }
  }
  return out;
}

/** Full-screen image viewer with zoom + rotate; PDFs render via a signed-URL iframe. */
function DocumentViewer({ path, label, ar, onClose }: { path: string; label: string; ar: boolean; onClose: () => void }) {
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const pdf = isPdf(path);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let revoked = false;
    let objectUrl: string | null = null;
    (async () => {
      try {
        if (pdf) {
          setSrc(await getSignedUrl(path)); // signed URL — iframe can't send headers
        } else {
          objectUrl = await fetchObjectBlobUrl(path); // full-quality original via Authorization header
          if (!revoked) setSrc(objectUrl);
        }
      } catch {
        setError(true);
      }
    })();
    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path, pdf]);

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex flex-col" dir={ar ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between p-4 text-white">
        <div className="font-medium">{label}</div>
        <div className="flex items-center gap-2">
          {!pdf && <>
            <button title={ar ? "تصغير" : "Zoom out"} onClick={() => setScale(s => Math.max(0.25, s - 0.25))} className="p-2 hover:bg-white/10 rounded-lg"><ZoomOut className="w-5 h-5" /></button>
            <span className="text-sm w-12 text-center">{Math.round(scale * 100)}%</span>
            <button title={ar ? "تكبير" : "Zoom in"} onClick={() => setScale(s => Math.min(6, s + 0.25))} className="p-2 hover:bg-white/10 rounded-lg"><ZoomIn className="w-5 h-5" /></button>
            <button title={ar ? "تدوير" : "Rotate"} onClick={() => setRotate(r => (r + 90) % 360)} className="p-2 hover:bg-white/10 rounded-lg"><RotateCw className="w-5 h-5" /></button>
          </>}
          <button title={ar ? "تنزيل" : "Download"} onClick={() => downloadObject(path, ar)} className="p-2 hover:bg-white/10 rounded-lg"><Download className="w-5 h-5" /></button>
          <button title={ar ? "إغلاق" : "Close"} onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
      </div>
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        {error ? (
          <div className="flex flex-col items-center text-white/70"><ImageOff className="w-10 h-10 mb-2" /><span className="text-sm">{ar ? "تعذّر تحميل المستند" : "Failed to load document"}</span></div>
        ) : !src ? (
          <div className="text-white/70 text-sm">{ar ? "جارٍ التحميل..." : "Loading..."}</div>
        ) : pdf ? (
          <iframe src={src} title={label} className="w-full h-full bg-white rounded-lg" />
        ) : (
          <img
            src={src}
            alt={label}
            style={{ transform: `scale(${scale}) rotate(${rotate}deg)`, transition: "transform 0.15s ease" }}
            className="max-w-none object-contain select-none"
            draggable={false}
          />
        )}
      </div>
    </div>
  );
}

/** Thumbnail preview for a document version (authenticated blob for images, icon for PDFs). */
function DocPreview({ path, label, ar, onView }: { path: string; label: string; ar: boolean; onView: () => void }) {
  const [failed, setFailed] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const pdf = isPdf(path);

  useEffect(() => {
    if (pdf) return;
    let revoked = false;
    let objectUrl: string | null = null;
    (async () => {
      try {
        objectUrl = await fetchObjectBlobUrl(path);
        if (!revoked) setPreviewUrl(objectUrl);
      } catch {
        if (!revoked) setFailed(true);
      }
    })();
    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path, pdf]);

  return (
    <button
      onClick={onView}
      className="w-full h-40 bg-slate-100 flex items-center justify-center overflow-hidden hover:bg-slate-200 transition-colors rounded-xl"
      title={ar ? "عرض" : "View"}
    >
      {pdf ? (
        <div className="flex flex-col items-center text-slate-500"><FileText className="w-10 h-10 mb-1" /><span className="text-xs">PDF</span></div>
      ) : failed ? (
        <div className="flex flex-col items-center text-slate-400"><ImageOff className="w-8 h-8 mb-1" /><span className="text-xs">{ar ? "تعذّر تحميل المعاينة" : "Preview unavailable"}</span></div>
      ) : !previewUrl ? (
        <div className="text-slate-400 text-xs">{ar ? "جارٍ التحميل..." : "Loading..."}</div>
      ) : (
        <img src={previewUrl} alt={label} className="w-full h-full object-cover" onError={() => setFailed(true)} />
      )}
    </button>
  );
}

function fmtDate(iso: string | null | undefined, ar: boolean): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString(ar ? "ar-SA" : "en-US", { dateStyle: "medium", timeStyle: "short" }); }
  catch { return iso; }
}

const VER_STATUS_AR: Record<string, string> = { uploaded: "تم الرفع", approved: "مقبول", rejected: "مرفوض" };
const VER_STATUS_EN: Record<string, string> = { uploaded: "Uploaded", approved: "Approved", rejected: "Rejected" };

/** Version history list for a document (spec §16). */
function VersionHistory({ versions, currentVersionId, ar, onView }: {
  versions: ApplicationDocumentVersion[]; currentVersionId?: number | null; ar: boolean;
  onView: (t: ViewerTarget) => void;
}) {
  if (!versions || versions.length === 0) return null;
  return (
    <div className="mt-3 border-t pt-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2">
        <History className="w-3.5 h-3.5" />{ar ? "سجل الإصدارات" : "Version History"}
      </div>
      <div className="space-y-1.5">
        {versions.map(v => {
          const isCurrent = v.id === currentVersionId;
          return (
            <div key={v.id} className={`flex items-center justify-between gap-2 text-xs rounded-lg px-3 py-2 ${isCurrent ? "bg-[#052B5B]/5 border border-[#052B5B]/20" : "bg-slate-50"}`}>
              <div className="min-w-0">
                <span className="font-medium">v{v.versionNumber}</span>
                {isCurrent && <span className="ms-2 text-[10px] bg-[#D4AF37]/20 text-[#8a6d1a] px-1.5 py-0.5 rounded-md font-medium">{ar ? "الحالية" : "Current"}</span>}
                <span className="ms-2 text-muted-foreground">{ar ? VER_STATUS_AR[v.status] ?? v.status : VER_STATUS_EN[v.status] ?? v.status}</span>
                <div className="text-muted-foreground mt-0.5">{fmtDate(v.uploadedAt, ar)}</div>
                {v.rejectionReason && <div className="text-red-600 mt-0.5">{ar ? "سبب الرفض: " : "Reason: "}{v.rejectionReason}</div>}
              </div>
              <button onClick={() => onView({ path: v.storagePath, label: `v${v.versionNumber}` })} className="shrink-0 text-[#052B5B] hover:underline flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />{ar ? "عرض" : "View"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** A single application document card: metadata, status, preview, actions, version history. */
function ApplicationDocumentCard({ doc, ar, appId, canReview, onView }: {
  doc: ApplicationDocument; ar: boolean; appId: number; canReview: boolean;
  onView: (t: ViewerTarget) => void;
}) {
  const qc = useQueryClient();
  const approveMut = useApproveApplicationDocument();
  const rejectMut = useRejectApplicationDocument();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  const current = doc.currentVersion ?? null;
  const label = ar ? doc.nameAr : doc.nameEn;
  const canAct = canReview && current != null && (doc.status === "uploaded" || doc.status === "under_review");

  const invalidate = () => qc.invalidateQueries({ queryKey: getListApplicationDocumentsQueryKey(appId) });

  async function approve() {
    try {
      await approveMut.mutateAsync({ id: appId, docId: doc.id });
      await invalidate();
      toast.success(ar ? "تم قبول المستند" : "Document approved");
    } catch {
      toast.error(ar ? "تعذّر قبول المستند" : "Failed to approve");
    }
  }

  async function reject() {
    const r = reason.trim();
    if (!r) return;
    try {
      await rejectMut.mutateAsync({ id: appId, docId: doc.id, data: { rejectionReason: r } });
      await invalidate();
      setRejecting(false); setReason("");
      toast.success(ar ? "تم رفض المستند" : "Document rejected");
    } catch {
      toast.error(ar ? "تعذّر رفض المستند" : "Failed to reject");
    }
  }

  return (
    <div className="border rounded-2xl overflow-hidden bg-white">
      <div className="px-4 py-3 border-b bg-slate-50 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium text-sm flex items-center gap-2">
            {label}
            {doc.required
              ? <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-md">{ar ? "إلزامي" : "Required"}</span>
              : <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md">{ar ? "اختياري" : "Optional"}</span>}
          </div>
          {(doc.requestDescription || doc.description) && (
            <p className="text-xs text-muted-foreground mt-1">{doc.requestDescription || doc.description}</p>
          )}
        </div>
        <DocStatusBadge status={doc.status} ar={ar} />
      </div>

      <div className="p-3 space-y-3">
        {doc.rejectionReason && (doc.status === "rejected" || doc.status === "reupload_required") && (
          <div className="text-xs bg-red-50 border border-red-100 text-red-700 rounded-lg px-3 py-2">
            <span className="font-medium">{ar ? "سبب الرفض: " : "Rejection reason: "}</span>{doc.rejectionReason}
          </div>
        )}

        {current ? (
          <>
            <DocPreview path={current.storagePath} label={label} ar={ar} onView={() => onView({ path: current.storagePath, label })} />
            <div className="flex gap-2">
              <button onClick={() => onView({ path: current.storagePath, label })} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm border rounded-lg hover:bg-slate-50">
                <Eye className="w-4 h-4" />{ar ? "عرض" : "View"}
              </button>
              <button onClick={() => downloadObject(current.storagePath, ar)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm border rounded-lg hover:bg-slate-50 text-[#052B5B]">
                <Download className="w-4 h-4" />{ar ? "تنزيل" : "Download"}
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground border rounded-xl bg-slate-50">
            <ImageOff className="w-7 h-7 mb-1.5 opacity-40" />
            <span className="text-xs">{ar ? "لم يرفع العميل هذا المستند بعد" : "Not uploaded by the customer yet"}</span>
          </div>
        )}

        {canAct && (
          rejecting ? (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 space-y-2">
              <label className="block text-xs font-medium text-red-700">{ar ? "سبب الرفض (إلزامي)" : "Rejection reason (required)"}</label>
              <textarea
                rows={2}
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                placeholder={ar ? "مثال: الصورة غير واضحة، يرجى رفع نسخة أوضح." : "e.g. Image is unclear, please upload a clearer copy."}
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setRejecting(false); setReason(""); }} className="text-xs text-muted-foreground hover:underline">{ar ? "إلغاء" : "Cancel"}</button>
                <Button size="sm" variant="destructive" onClick={reject} disabled={!reason.trim() || rejectMut.isPending}>
                  {rejectMut.isPending ? (ar ? "جارٍ..." : "...") : (ar ? "تأكيد الرفض" : "Confirm Reject")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={approve} disabled={approveMut.isPending} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60">
                <ThumbsUp className="w-4 h-4" />{approveMut.isPending ? (ar ? "جارٍ..." : "...") : (ar ? "قبول" : "Approve")}
              </button>
              <button onClick={() => setRejecting(true)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700">
                <ThumbsDown className="w-4 h-4" />{ar ? "رفض" : "Reject"}
              </button>
            </div>
          )
        )}

        <VersionHistory versions={doc.versions} currentVersionId={doc.currentVersionId} ar={ar} onView={onView} />
      </div>
    </div>
  );
}

/** Modal for staff to request an additional document from the customer (spec §3). */
function RequestDocumentModal({ appId, ar, onClose }: { appId: number; ar: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const requestMut = useRequestApplicationDocument();
  const [form, setForm] = useState({ nameAr: "", nameEn: "", description: "", fileType: "image_pdf" as "image" | "pdf" | "image_pdf", required: true });
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  async function submit() {
    try {
      await requestMut.mutateAsync({
        id: appId,
        data: {
          nameAr: form.nameAr,
          nameEn: form.nameEn || form.nameAr,
          description: form.description || undefined,
          fileType: form.fileType,
          required: form.required,
        },
      });
      await qc.invalidateQueries({ queryKey: getListApplicationDocumentsQueryKey(appId) });
      toast.success(ar ? "تم إرسال طلب المستند بنجاح" : "Document request sent");
      onClose();
    } catch {
      toast.error(ar ? "تعذّر إرسال طلب المستند" : "Failed to send request");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[55] flex items-center justify-center p-4" dir={ar ? "rtl" : "ltr"}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-bold flex items-center gap-2"><Plus className="w-4 h-4 text-[#052B5B]" />{ar ? "طلب مستند إضافي" : "Request Additional Document"}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{ar ? "اسم المستند المطلوب (عربي)" : "Document name (Arabic)"} *</label>
            <input className="w-full border rounded-xl px-4 py-2.5 text-sm" placeholder={ar ? "مثال: كشف حساب بنكي" : "e.g. Bank Statement"} value={form.nameAr} onChange={e => set("nameAr", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{ar ? "اسم المستند (إنجليزي)" : "Document name (English)"}</label>
            <input className="w-full border rounded-xl px-4 py-2.5 text-sm" placeholder="e.g. Bank Statement" value={form.nameEn} onChange={e => set("nameEn", e.target.value)} dir="ltr" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{ar ? "وصف / تعليمات للعميل" : "Description / instructions"}</label>
            <textarea rows={3} className="w-full border rounded-xl px-4 py-2.5 text-sm resize-none" placeholder={ar ? "يرجى إرفاق كشف حساب بنكي لآخر 6 أشهر بصورة واضحة." : "Please upload a clear bank statement for the last 6 months."} value={form.description} onChange={e => set("description", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{ar ? "نوع الملف" : "File type"}</label>
            <select className="w-full border rounded-xl px-4 py-2.5 text-sm bg-white" value={form.fileType} onChange={e => set("fileType", e.target.value)}>
              <option value="image">{ar ? "صورة" : "Image"}</option>
              <option value="pdf">PDF</option>
              <option value="image_pdf">{ar ? "صورة أو PDF" : "Image or PDF"}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{ar ? "هل المستند إلزامي؟" : "Is the document required?"}</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" name="req" checked={form.required} onChange={() => set("required", true)} className="w-4 h-4" />
                {ar ? "نعم" : "Yes"}
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" name="req" checked={!form.required} onChange={() => set("required", false)} className="w-4 h-4" />
                {ar ? "لا" : "No"}
              </label>
            </div>
          </div>
        </div>
        <div className="p-5 border-t flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>{ar ? "إلغاء" : "Cancel"}</Button>
          <Button onClick={submit} disabled={!form.nameAr.trim() || requestMut.isPending} className="bg-[#052B5B] hover:bg-[#052B5B]/90">
            {requestMut.isPending ? (ar ? "جارٍ الإرسال..." : "Sending...") : (ar ? "إرسال طلب المستند" : "Send Request")}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Read-only card for a profile document read off the application row (no status/review). */
function LegacyDocumentCard({ doc, ar, onView }: { doc: LegacyDoc; ar: boolean; onView: (t: ViewerTarget) => void }) {
  const label = ar ? doc.labelAr : doc.labelEn;
  return (
    <div className="border rounded-2xl overflow-hidden bg-white">
      <div className="px-4 py-3 border-b bg-slate-50 font-medium text-sm">{label}</div>
      <div className="p-3 space-y-3">
        <DocPreview path={doc.path} label={label} ar={ar} onView={() => onView({ path: doc.path, label })} />
        <div className="flex gap-2">
          <button onClick={() => onView({ path: doc.path, label })} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm border rounded-lg hover:bg-slate-50">
            <Eye className="w-4 h-4" />{ar ? "عرض" : "View"}
          </button>
          <button onClick={() => downloadObject(doc.path, ar)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm border rounded-lg hover:bg-slate-50 text-[#052B5B]">
            <Download className="w-4 h-4" />{ar ? "تنزيل" : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** The Documents section inside the application detail modal. */
function ApplicationDocumentsSection({ app, appId, ar, canRequest, canReview, onView }: {
  app: Record<string, unknown> | null | undefined; appId: number; ar: boolean; canRequest: boolean; canReview: boolean;
  onView: (t: ViewerTarget) => void;
}) {
  const validId = Number.isFinite(appId);
  // Hooks must run unconditionally; the query is a no-op when the id is invalid.
  const { data: documents = [], isLoading } = useListApplicationDocuments(validId ? appId : (undefined as unknown as number));
  const [requesting, setRequesting] = useState(false);

  // Fallback: profile documents stored on the application row that are NOT yet
  // represented as application_documents (apps predating the seeding). This
  // keeps the admin view in sync with what the customer app shows.
  const coveredKeys = new Set(documents.map(d => d.documentKey));
  const coveredPaths = new Set(
    documents.flatMap(d => [d.currentVersion?.storagePath, ...(d.versions ?? []).map(v => v.storagePath)]).filter(Boolean) as string[],
  );
  const legacyDocs = collectLegacyDocuments(app).filter(
    l => !coveredKeys.has(l.key) && !coveredPaths.has(l.path),
  );

  const isEmpty = documents.length === 0 && legacyDocs.length === 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{ar ? "المستندات" : "Documents"}</h3>
        {canRequest && validId && (
          <Button size="sm" onClick={() => setRequesting(true)} className="gap-1.5 bg-[#052B5B] hover:bg-[#052B5B]/90">
            <Plus className="w-4 h-4" />{ar ? "طلب مستند إضافي" : "Request Document"}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">{ar ? "جارٍ التحميل..." : "Loading..."}</div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground border rounded-2xl bg-slate-50">
          <ImageOff className="w-8 h-8 mb-2 opacity-40" />
          <span className="text-sm">{ar ? "لا توجد مستندات" : "No documents"}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {documents.map(d => (
            <ApplicationDocumentCard key={`doc-${d.id}`} doc={d} ar={ar} appId={appId} canReview={canReview} onView={onView} />
          ))}
          {legacyDocs.map(l => (
            <LegacyDocumentCard key={`legacy-${l.key}`} doc={l} ar={ar} onView={onView} />
          ))}
        </div>
      )}

      {requesting && validId && <RequestDocumentModal appId={appId} ar={ar} onClose={() => setRequesting(false)} />}
    </div>
  );
}

function StatusBadge({ status, ar }: { status: string; ar: boolean }) {
  const meta = STATUS_META[status] ?? { arLabel: status, enLabel: status, color: "bg-slate-50 text-slate-700 border-slate-200", icon: null };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${meta.color}`}>
      {meta.icon}
      {ar ? meta.arLabel : meta.enLabel}
    </span>
  );
}

function DetailModal({ app, onClose, onUpdate, updating, ar, canViewDocs, canRequest, canReview }: {
  app: Record<string, unknown>; onClose: () => void;
  onUpdate: (status: string, notes: string, issuedVisaUrl: string) => void; updating: boolean; ar: boolean;
  canViewDocs: boolean; canRequest: boolean; canReview: boolean;
}) {
  const [status, setStatus] = useState(app.status as string);
  const [notes, setNotes] = useState((app.adminNotes as string) ?? "");
  const [viewerDoc, setViewerDoc] = useState<ViewerTarget | null>(null);
  const appId = Number(app?.id);
  const [issuedVisaUrl, setIssuedVisaUrl] = useState((app.issuedVisaUrl as string) ?? "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleVisaFile = async (file: File) => {
    setUploading(true);
    const path = await uploadFile(file);
    setUploading(false);
    if (path) setIssuedVisaUrl(path);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold">{ar ? "تفاصيل الطلب" : "Application Details"}</h2>
            <p className="text-sm text-muted-foreground mt-0.5 font-mono">{app.trackingNumber as string}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
          {/* Personal Info */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">{ar ? "البيانات الشخصية" : "Personal Information"}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">{ar ? "الاسم" : "Full Name"}</span><div className="font-medium">{String(app.fullName ?? "")}</div></div>
              <div><span className="text-muted-foreground">{ar ? "الجنسية" : "Nationality"}</span><div className="font-medium">{String(app.nationality ?? "")}</div></div>
              <div><span className="text-muted-foreground">{ar ? "الجنس" : "Gender"}</span><div className="font-medium">{app.gender === "male" ? (ar ? "ذكر" : "Male") : (ar ? "أنثى" : "Female")}</div></div>
              <div><span className="text-muted-foreground">{ar ? "تاريخ الميلاد" : "Date of Birth"}</span><div className="font-medium">{String(app.dateOfBirth ?? "")}</div></div>
              <div><span className="text-muted-foreground">{ar ? "البريد الإلكتروني" : "Email"}</span><div className="font-medium">{String(app.email ?? "")}</div></div>
              <div><span className="text-muted-foreground">{ar ? "الهاتف" : "Phone"}</span><div className="font-medium">{String(app.phone ?? "")}</div></div>
            </div>
          </div>

          {/* Passport */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">{ar ? "بيانات جواز السفر" : "Passport Data"}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">{ar ? "رقم الجواز" : "Passport No."}</span><div className="font-mono font-medium">{String(app.passportNumber ?? "")}</div></div>
              <div><span className="text-muted-foreground">{ar ? "تاريخ الإصدار" : "Issue Date"}</span><div className="font-medium">{String(app.passportIssueDate ?? "")}</div></div>
              <div><span className="text-muted-foreground">{ar ? "تاريخ الانتهاء" : "Expiry Date"}</span><div className="font-medium">{String(app.passportExpiryDate ?? "")}</div></div>
              {!!app.passportIssuingCountry && <div><span className="text-muted-foreground">{ar ? "دولة الإصدار" : "Issuing Country"}</span><div className="font-medium">{String(app.passportIssuingCountry)}</div></div>}
            </div>
          </div>

          {/* Documents — only for staff authorized to view visa applications */}
          {canViewDocs && (
            <ApplicationDocumentsSection
              app={app}
              appId={appId}
              ar={ar}
              canRequest={canRequest}
              canReview={canReview}
              onView={setViewerDoc}
            />
          )}

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

      {viewerDoc && <DocumentViewer path={viewerDoc.path} label={viewerDoc.label} ar={ar} onClose={() => setViewerDoc(null)} />}
    </div>
  );
}

export default function VisaApplicationsAdmin() {
  const { language } = useTranslation();
  const ar = language === "ar";
  const { hasPermission } = useAdminAuth();
  const canViewDocs = hasPermission("visa_applications");
  const canRequestDocs = hasPermission("documents_request");
  const canReviewDocs = hasPermission("documents_review");
  const qc = useQueryClient();
  const { data: applications = [], isLoading } = useListVisaApplications();
  const updateMut = useUpdateVisaApplication();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedApp, setSelectedApp] = useState<Record<string, unknown> | null>(null);

  const filtered = applications.filter(a => {
    const matchesSearch = !search ||
      (a.fullName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (a.trackingNumber ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (a.email ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !filterStatus || a.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  async function handleUpdate(status: string, notes: string, issuedVisaUrl: string) {
    if (!selectedApp) return;
    await updateMut.mutateAsync({
      id: selectedApp.id as number,
      data: { status: status as never, adminNotes: notes, issuedVisaUrl: issuedVisaUrl || undefined },
    });
    await qc.invalidateQueries({ queryKey: getListVisaApplicationsQueryKey() });
    setSelectedApp(null);
  }

  const stats = {
    total: applications.length,
    received: applications.filter(a => a.status === "received").length,
    processing: applications.filter(a => ["under_review","sent_to_embassy","processing"].includes(a.status)).length,
    completed: applications.filter(a => a.status === "completed" || a.status === "issued").length,
  };

  return (
    <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>
      <div>
        <h1 className="text-2xl font-bold">{ar ? "طلبات التأشيرة" : "Visa Applications"}</h1>
        <p className="text-sm text-muted-foreground mt-1">{ar ? "متابعة وتحديث حالة طلبات التأشيرة" : "Track and update visa application statuses"}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: ar ? "الإجمالي" : "Total", value: stats.total, color: "bg-blue-50 text-blue-700" },
          { label: ar ? "جديدة" : "New", value: stats.received, color: "bg-yellow-50 text-yellow-700" },
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
            placeholder={ar ? "بحث بالاسم أو رقم التتبع..." : "Search by name or tracking number..."}
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
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="text-start px-6 py-3 font-medium text-muted-foreground">{ar ? "رقم التتبع" : "Tracking #"}</th>
                <th className="text-start px-6 py-3 font-medium text-muted-foreground">{ar ? "مقدم الطلب" : "Applicant"}</th>
                <th className="text-start px-6 py-3 font-medium text-muted-foreground">{ar ? "الجنسية" : "Nationality"}</th>
                <th className="text-start px-6 py-3 font-medium text-muted-foreground">{ar ? "الحالة" : "Status"}</th>
                <th className="text-start px-6 py-3 font-medium text-muted-foreground">{ar ? "التاريخ" : "Date"}</th>
                <th className="text-start px-6 py-3 font-medium text-muted-foreground">{ar ? "إجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-muted-foreground">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <div>{ar ? "لا توجد طلبات" : "No applications found"}</div>
                </td></tr>
              ) : filtered.map(a => (
                <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded-lg">{a.trackingNumber || `#${a.id}`}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{a.fullName}</div>
                    <div className="text-xs text-muted-foreground">{a.email}</div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{a.nationality}</td>
                  <td className="px-6 py-4"><StatusBadge status={a.status} ar={ar} /></td>
                  <td className="px-6 py-4 text-muted-foreground text-xs">{new Date(a.createdAt).toLocaleDateString(ar ? "ar-SA" : "en-US")}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedApp(a as unknown as Record<string, unknown>)}
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
          canViewDocs={canViewDocs}
          canRequest={canRequestDocs}
          canReview={canReviewDocs}
        />
      )}
    </div>
  );
}
