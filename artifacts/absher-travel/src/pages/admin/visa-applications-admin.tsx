import { useState } from "react";
import { useListVisaApplications, useUpdateVisaApplication, getListVisaApplicationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/use-translation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, FileText, Globe, User, Phone, Mail, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type AppStatus = "received" | "under_review" | "awaiting_documents" | "documents_uploaded" | "sent_to_embassy" | "processing" | "issued" | "completed" | "rejected";

const STATUS_LABELS: Record<AppStatus, { ar: string; en: string; color: string }> = {
  received:            { ar: "تم الاستلام",        en: "Received",            color: "bg-blue-100 text-blue-700" },
  under_review:        { ar: "قيد المراجعة",        en: "Under Review",        color: "bg-amber-100 text-amber-700" },
  awaiting_documents:  { ar: "بانتظار مستندات",    en: "Awaiting Documents",  color: "bg-orange-100 text-orange-700" },
  documents_uploaded:  { ar: "تم رفع المستندات",   en: "Documents Uploaded",  color: "bg-cyan-100 text-cyan-700" },
  sent_to_embassy:     { ar: "أُرسل للسفارة",      en: "Sent to Embassy",     color: "bg-purple-100 text-purple-700" },
  processing:          { ar: "قيد المعالجة",        en: "Processing",          color: "bg-indigo-100 text-indigo-700" },
  issued:              { ar: "تم الإصدار",          en: "Issued",              color: "bg-teal-100 text-teal-700" },
  completed:           { ar: "مكتمل",              en: "Completed",           color: "bg-green-100 text-green-700" },
  rejected:            { ar: "مرفوض",              en: "Rejected",            color: "bg-red-100 text-red-700" },
};

const STATUS_FLOW: AppStatus[] = ["received", "under_review", "awaiting_documents", "documents_uploaded", "sent_to_embassy", "processing", "issued", "completed"];

export default function VisaApplicationsAdmin() {
  const { language } = useTranslation();
  const ar = language === "ar";
  const qc = useQueryClient();

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<number, string>>({});

  const params = filterStatus !== "all" ? { status: filterStatus as AppStatus } : {};
  const { data: applications, isLoading } = useListVisaApplications(params);
  const updateApp = useUpdateVisaApplication({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getListVisaApplicationsQueryKey() }) },
  });

  const handleStatusUpdate = (id: number, status: AppStatus) => {
    updateApp.mutate({ id, data: { status, adminNotes: adminNotes[id] } });
  };

  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border h-24 animate-pulse" />)}</div>;

  return (
    <div className="space-y-5">
      {/* Filter */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">{ar ? "الحالة" : "Status"}</label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-10 border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{ar ? "جميع الحالات" : "All Statuses"}</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{ar ? v.ar : v.en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="pt-5 text-sm text-slate-500 font-medium">
          {applications?.length ?? 0} {ar ? "طلب" : "applications"}
        </div>
      </div>

      {/* Applications */}
      <div className="space-y-3">
        {!applications?.length ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-20 text-center text-slate-400">
            <FileText className="h-12 w-12 mx-auto mb-3 text-slate-200" />
            {ar ? "لا توجد طلبات تأشيرة" : "No visa applications"}
          </div>
        ) : (
          applications.map(app => {
            const status = app.status as AppStatus;
            const isExpanded = expanded === app.id;

            return (
              <div key={app.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : app.id)}
                >
                  <div className="text-xs font-bold text-slate-400 w-8 shrink-0">#{app.id}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800">{app.fullName}</div>
                    <div className="text-sm text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Globe className="h-3.5 w-3.5" />{app.nationality}
                    </div>
                  </div>
                  <div className="shrink-0 hidden md:block text-xs text-slate-400">
                    {new Date(app.createdAt).toLocaleDateString(ar ? "ar-SA" : "en-US")}
                  </div>
                  <div className="shrink-0">
                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${STATUS_LABELS[status]?.color ?? "bg-slate-100 text-slate-600"}`}>
                      {ar ? STATUS_LABELS[status]?.ar : STATUS_LABELS[status]?.en}
                    </span>
                  </div>
                  <div className="shrink-0 text-slate-400">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 px-6 py-5 bg-slate-50/30 space-y-5">
                    {/* Applicant info */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <User className="h-4 w-4 text-slate-400 shrink-0" />
                        {app.fullName}
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                        {app.phone}
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                        {app.email}
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                        {app.dateOfBirth}
                      </div>
                      <div className="text-slate-600">{ar ? "الجواز:" : "Passport:"} {app.passportNumber}</div>
                      <div className="text-slate-600">{ar ? "مسار التقديم:" : "Path:"} {app.eligibilityPath}</div>
                    </div>

                    {/* Status progress */}
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{ar ? "تسلسل الحالة" : "Status Progress"}</p>
                      {status === "rejected" ? (
                        <Badge variant="destructive">{ar ? "مرفوض" : "Rejected"}</Badge>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {STATUS_FLOW.map((s, i) => {
                            const currentIdx = STATUS_FLOW.indexOf(status);
                            return (
                              <div key={s} className={`text-xs px-2.5 py-1 rounded-full font-medium ${i <= currentIdx ? "bg-primary text-white" : "bg-slate-100 text-slate-400"}`}>
                                {ar ? STATUS_LABELS[s].ar : STATUS_LABELS[s].en}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Documents */}
                    {(app.passportImageUrl || app.personalPhotoUrl || app.residencyImageUrl || app.visaImageUrl) && (
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{ar ? "المستندات" : "Documents"}</p>
                        <div className="flex flex-wrap gap-3">
                          {[
                            { url: app.passportImageUrl, label: ar ? "صورة الجواز" : "Passport" },
                            { url: app.personalPhotoUrl, label: ar ? "صورة شخصية" : "Personal Photo" },
                            { url: app.residencyImageUrl, label: ar ? "صورة الإقامة" : "Residency" },
                            { url: app.visaImageUrl, label: ar ? "صورة التأشيرة" : "Visa Copy" },
                          ].filter(d => d.url).map(doc => (
                            <a key={doc.label} href={doc.url!} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs bg-white border border-slate-200 text-primary hover:bg-primary hover:text-white transition-colors px-3 py-1.5 rounded-lg font-medium">
                              <FileText className="h-3.5 w-3.5" />{doc.label}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Update status */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                      <p className="text-sm font-semibold text-slate-700">{ar ? "تحديث الحالة" : "Update Status"}</p>
                      <div className="flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[180px]">
                          <Select defaultValue={status} onValueChange={(v) => handleStatusUpdate(app.id, v as AppStatus)}>
                            <SelectTrigger className="h-10 border-slate-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{ar ? v.ar : v.en}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 mb-1 block">{ar ? "ملاحظات الإدارة" : "Admin Notes"}</label>
                        <textarea
                          rows={2}
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                          value={adminNotes[app.id] ?? app.adminNotes ?? ""}
                          onChange={e => setAdminNotes(n => ({ ...n, [app.id]: e.target.value }))}
                          placeholder={ar ? "ملاحظات اختيارية..." : "Optional notes..."}
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(app.id, status)}
                        disabled={updateApp.isPending}
                      >
                        {ar ? "حفظ الملاحظات" : "Save Notes"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
