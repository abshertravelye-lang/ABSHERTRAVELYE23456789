import { useState } from "react";
import {
  useListApplicationDocuments,
  useUploadApplicationDocument,
  getListApplicationDocumentsQueryKey,
  ApplicationDocument,
  ApplicationDocumentVersion,
  ApplicationDocumentStatus,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { AuthImage } from "@/components/auth-image";
import { getSignedObjectUrl, uploadFileAuthenticated } from "@/lib/objectMedia";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Upload, FileText, Loader2, CheckCircle2, Clock, AlertCircle,
  Eye, Download, RefreshCw, History, ChevronDown, FileCheck2,
} from "lucide-react";

/* ── Status presentation config ── */
const DOC_STATUS: Record<
  ApplicationDocumentStatus,
  { ar: string; en: string; badge: string; icon: React.ComponentType<{ className?: string }>; emoji: string }
> = {
  required: {
    ar: "مطلوب منك رفع هذا المستند", en: "Upload required",
    badge: "bg-amber-100 text-amber-700 border-amber-200", icon: AlertCircle, emoji: "🟠",
  },
  waiting_customer: {
    ar: "مطلوب منك رفع هذا المستند", en: "Waiting for you",
    badge: "bg-amber-100 text-amber-700 border-amber-200", icon: AlertCircle, emoji: "🟠",
  },
  uploaded: {
    ar: "تم الرفع — بانتظار المراجعة", en: "Uploaded — under review",
    badge: "bg-sky-100 text-sky-700 border-sky-200", icon: Clock, emoji: "🔵",
  },
  under_review: {
    ar: "بانتظار المراجعة", en: "Under review",
    badge: "bg-sky-100 text-sky-700 border-sky-200", icon: Clock, emoji: "🔵",
  },
  approved: {
    ar: "مقبول", en: "Approved",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2, emoji: "🟢",
  },
  rejected: {
    ar: "مرفوض — أعد الرفع", en: "Rejected — re-upload",
    badge: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle, emoji: "🔴",
  },
  reupload_required: {
    ar: "مرفوض — أعد الرفع", en: "Rejected — re-upload",
    badge: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle, emoji: "🔴",
  },
};

/**
 * Normalize whatever the API returns (`image` | `pdf` | `image_pdf`) into a
 * canonical form. Defensive against casing / separator variants so a doc
 * created as "image_pdf" never collapses to a single type.
 */
function normalizeFileType(type: string | null | undefined): "image" | "pdf" | "both" {
  const t = (type ?? "").toLowerCase().replace(/[-\s]/g, "_");
  if (t === "image") return "image";
  if (t === "pdf") return "pdf";
  // image_pdf and any unknown value → accept both (widest, safest).
  return "both";
}

/** accept attribute per allowedFileType */
function acceptFor(type: ApplicationDocument["allowedFileType"]): string {
  const n = normalizeFileType(type);
  if (n === "image") return "image/*";
  if (n === "pdf") return "application/pdf";
  return "image/*,application/pdf";
}

function fileTypeLabel(type: ApplicationDocument["allowedFileType"], ar: boolean): string {
  const n = normalizeFileType(type);
  if (n === "image") return ar ? "صورة" : "Image";
  if (n === "pdf") return "PDF";
  return ar ? "صورة أو PDF" : "Image or PDF";
}

/** Client-side validation before hitting the storage upload. */
function validateFile(
  file: File,
  doc: ApplicationDocument,
  ar: boolean,
): string | null {
  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";
  const allowed = normalizeFileType(doc.allowedFileType);
  const typeOk =
    (allowed === "image" && isImage) ||
    (allowed === "pdf" && isPdf) ||
    (allowed === "both" && (isImage || isPdf));
  if (!typeOk) {
    return ar
      ? `نوع الملف غير مسموح. المسموح: ${fileTypeLabel(doc.allowedFileType, true)}.`
      : `File type not allowed. Expected: ${fileTypeLabel(doc.allowedFileType, false)}.`;
  }
  if (doc.maxFileSizeMb != null && file.size > doc.maxFileSizeMb * 1024 * 1024) {
    return ar
      ? `حجم الملف يتجاوز الحد الأقصى ${doc.maxFileSizeMb} ميغابايت.`
      : `File exceeds the maximum size of ${doc.maxFileSizeMb} MB.`;
  }
  return null;
}

/* ── File preview (image inline / PDF via signed URL) ── */
function DocumentPreview({ version, ar }: { version: ApplicationDocumentVersion; ar: boolean }) {
  const [open, setOpen] = useState(false);
  const isPdf = (version.mimeType ?? "").toLowerCase() === "application/pdf" ||
    version.storagePath.toLowerCase().endsWith(".pdf");

  const openInNewTab = async () => {
    try {
      const url = await getSignedObjectUrl(version.storagePath, false);
      window.open(url, "_blank", "noopener");
    } catch { /* ignore */ }
  };

  const download = async () => {
    try {
      const url = await getSignedObjectUrl(version.storagePath, true);
      const a = document.createElement("a");
      a.href = url;
      a.download = version.originalFilename || "document";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch { /* ignore */ }
  };

  return (
    <div className="flex items-center gap-3">
      {isPdf ? (
        <button
          onClick={openInNewTab}
          className="w-16 h-16 rounded-lg border bg-white flex items-center justify-center shrink-0 hover:bg-slate-50"
        >
          <FileText className="w-7 h-7 text-[#0d2351]" />
        </button>
      ) : (
        <button onClick={() => setOpen(true)} className="shrink-0">
          <AuthImage
            src={version.storagePath}
            className="w-16 h-16 rounded-lg object-cover border bg-white cursor-zoom-in"
          />
        </button>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={isPdf ? openInNewTab : () => setOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#0d2351]/20 bg-[#0d2351]/5 hover:bg-[#0d2351]/10 text-[#0d2351] text-xs font-bold transition-all"
        >
          <Eye className="w-3.5 h-3.5" /> {ar ? "عرض المستند" : "View"}
        </button>
        <button
          onClick={download}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all"
        >
          <Download className="w-3.5 h-3.5" /> {ar ? "تنزيل" : "Download"}
        </button>
      </div>

      {/* Image lightbox */}
      {!isPdf && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-3xl" dir={ar ? "rtl" : "ltr"}>
            <DialogHeader>
              <DialogTitle className="text-base">{ar ? "عرض المستند" : "Document"}</DialogTitle>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-slate-50 rounded-lg p-2">
              <AuthImage src={version.storagePath} className="max-w-full h-auto rounded" />
            </div>
            <div className="flex justify-end">
              <button
                onClick={download}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0d2351] text-white text-sm font-bold hover:bg-[#0d2351]/90"
              >
                <Download className="w-4 h-4" /> {ar ? "تنزيل" : "Download"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

/* ── Version history (simple list) ── */
function VersionHistory({ doc, ar }: { doc: ApplicationDocument; ar: boolean }) {
  const older = (doc.versions ?? []).filter((v) => v.id !== doc.currentVersion?.id);
  if (older.length === 0) return null;
  return (
    <Collapsible className="mt-3">
      <CollapsibleTrigger className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700">
        <History className="w-3.5 h-3.5" />
        {ar ? `النسخ السابقة (${older.length})` : `Previous versions (${older.length})`}
        <ChevronDown className="w-3.5 h-3.5" />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2">
        {older.map((v) => (
          <div key={v.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
            <div className="text-xs text-slate-500">
              <span className="font-bold text-slate-600">{ar ? "نسخة" : "Version"} {v.versionNumber}</span>
              <span className="mx-1.5">·</span>
              {new Date(v.uploadedAt).toLocaleDateString()}
              {v.status === "rejected" && (
                <span className="ms-2 text-red-500">{ar ? "مرفوضة" : "Rejected"}</span>
              )}
            </div>
            <DocumentPreview version={v} ar={ar} />
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ── Single document card ── */
function DocumentCard({ applicationId, doc, ar }: { applicationId: number; doc: ApplicationDocument; ar: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  const uploadMutation = useUploadApplicationDocument({
    mutation: {
      onSuccess: () => {
        toast({ title: ar ? "تم رفع المستند بنجاح" : "Document uploaded successfully" });
        queryClient.invalidateQueries({ queryKey: getListApplicationDocumentsQueryKey(applicationId) });
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onError: (err: any) => {
        toast({
          variant: "destructive",
          title: ar ? "فشل رفع المستند" : "Upload failed",
          description: err?.message || (ar ? "حدث خطأ أثناء الرفع. حاول مرة أخرى." : "An error occurred. Please try again."),
        });
      },
    },
  });

  const status = DOC_STATUS[doc.status] ?? DOC_STATUS.required;
  const StatusIcon = status.icon;
  const canUpload =
    doc.status === "required" ||
    doc.status === "waiting_customer" ||
    doc.status === "rejected" ||
    doc.status === "reupload_required";
  const isReupload = doc.status === "rejected" || doc.status === "reupload_required";
  const hasVersion = !!doc.currentVersion;
  const busy = isUploading || uploadMutation.isPending;

  const handleFile = async (file: File) => {
    const err = validateFile(file, doc, ar);
    if (err) {
      toast({ variant: "destructive", title: ar ? "ملف غير صالح" : "Invalid file", description: err });
      return;
    }
    setIsUploading(true);
    try {
      const uploaded = await uploadFileAuthenticated(file);
      if (!uploaded) {
        toast({
          variant: "destructive",
          title: ar ? "فشل رفع المستند" : "Upload failed",
          description: ar ? "تعذّر رفع الملف إلى التخزين." : "Could not upload the file to storage.",
        });
        return;
      }
      await uploadMutation.mutateAsync({
        id: applicationId,
        docId: doc.id,
        data: { storagePath: uploaded.objectPath },
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[#0d2351]/8 flex items-center justify-center shrink-0">
            <FileCheck2 className="w-5 h-5 text-[#0d2351]" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-slate-800 text-sm flex items-center gap-2 flex-wrap">
              {ar ? doc.nameAr : doc.nameEn}
              {doc.required && (
                <span className="text-[10px] font-bold text-red-500">*{ar ? " إلزامي" : " Required"}</span>
              )}
            </div>
            {(doc.requestDescription || doc.description) && (
              <p className="text-xs text-slate-500 mt-0.5">{doc.requestDescription || doc.description}</p>
            )}
            <p className="text-[11px] text-slate-400 mt-0.5">
              {ar ? "نوع الملف:" : "File type:"} {fileTypeLabel(doc.allowedFileType, ar)}
              {doc.maxFileSizeMb != null && ` · ${ar ? "الحد" : "max"} ${doc.maxFileSizeMb}MB`}
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${status.badge}`}>
          <StatusIcon className="w-3 h-3" />
          {ar ? status.ar : status.en}
        </span>
      </div>

      {/* Rejection reason */}
      {isReupload && doc.rejectionReason && (
        <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-red-700">{ar ? "سبب الرفض" : "Rejection reason"}</p>
            <p className="text-xs text-red-600 mt-0.5">{doc.rejectionReason}</p>
          </div>
        </div>
      )}

      {/* Current uploaded file */}
      {hasVersion && doc.currentVersion && (
        <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2">
            {ar ? "الملف الحالي" : "Current file"}
          </p>
          <DocumentPreview version={doc.currentVersion} ar={ar} />
        </div>
      )}

      {/* Version history */}
      <VersionHistory doc={doc} ar={ar} />

      {/* Upload / re-upload */}
      {canUpload && (
        <div className="mt-3">
          <label
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer
              ${busy ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-[#0d2351] text-white hover:bg-[#0d2351]/90"}`}
          >
            <input
              type="file"
              className="hidden"
              accept={acceptFor(doc.allowedFileType)}
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) handleFile(f);
              }}
            />
            {busy ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {ar ? "جاري الرفع..." : "Uploading..."}</>
            ) : isReupload ? (
              <><RefreshCw className="w-4 h-4" /> {ar ? "إعادة رفع المستند" : "Re-upload document"}</>
            ) : (
              <><Upload className="w-4 h-4" /> {ar ? "+ إرفاق المستند" : "+ Attach document"}</>
            )}
          </label>
        </div>
      )}
    </div>
  );
}

/* ── Section: required documents for an application ── */
export function ApplicationDocumentsSection({ applicationId, language }: { applicationId: number; language: string }) {
  const ar = language === "ar";
  const { data: docs, isLoading } = useListApplicationDocuments(applicationId);

  if (isLoading) {
    return (
      <div className="px-5 pb-4">
        <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
          <Loader2 className="w-4 h-4 animate-spin" /> {ar ? "جاري تحميل المستندات..." : "Loading documents..."}
        </div>
      </div>
    );
  }

  if (!docs || docs.length === 0) return null;

  return (
    <div className="px-5 pb-5 pt-1 border-t border-slate-100">
      <h4 className="font-bold text-slate-800 text-sm my-3 flex items-center gap-2">
        <FileText className="w-4 h-4 text-[#0d2351]" />
        {ar ? "المستندات المطلوبة" : "Required Documents"}
      </h4>
      <div className="space-y-3">
        {docs.map((doc) => (
          <DocumentCard key={doc.id} applicationId={applicationId} doc={doc} ar={ar} />
        ))}
      </div>
    </div>
  );
}
