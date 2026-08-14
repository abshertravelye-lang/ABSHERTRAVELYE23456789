import { useState, useMemo } from "react";
import { useListVisaApplications, useUpdateVisaApplication, getListVisaApplicationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/use-translation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  ChevronDown, ChevronUp, FileText, Globe, User, Phone, Mail,
  Calendar, Search, CheckCircle2, Clock, ArrowRight, AlertCircle,
  Shield, Stamp, Send, RotateCcw, XCircle, Eye, Download,
  ClipboardList, Filter,
} from "lucide-react";

/* ── Types ── */
type AppStatus = "received" | "under_review" | "awaiting_documents" | "documents_uploaded" | "sent_to_embassy" | "processing" | "issued" | "completed" | "rejected";

const STATUS_META: Record<AppStatus, { ar: string; en: string; color: string; bg: string; icon: React.ReactNode }> = {
  received:           { ar: "تم الاستلام",       en: "Received",           color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",   icon: <ClipboardList className="w-3.5 h-3.5" /> },
  under_review:       { ar: "قيد المراجعة",       en: "Under Review",       color: "text-amber-700",  bg: "bg-amber-50 border-amber-200",  icon: <Eye className="w-3.5 h-3.5" /> },
  awaiting_documents: { ar: "بانتظار مستندات",   en: "Awaiting Documents", color: "text-orange-700", bg: "bg-orange-50 border-orange-200", icon: <AlertCircle className="w-3.5 h-3.5" /> },
  documents_uploaded: { ar: "تم رفع المستندات",  en: "Docs Uploaded",      color: "text-cyan-700",   bg: "bg-cyan-50 border-cyan-200",    icon: <Download className="w-3.5 h-3.5" /> },
  sent_to_embassy:    { ar: "أُرسل للسفارة",     en: "Sent to Embassy",    color: "text-purple-700", bg: "bg-purple-50 border-purple-200", icon: <Send className="w-3.5 h-3.5" /> },
  processing:         { ar: "قيد المعالجة",       en: "Processing",         color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200", icon: <RotateCcw className="w-3.5 h-3.5" /> },
  issued:             { ar: "تم الإصدار",         en: "Issued",             color: "text-teal-700",   bg: "bg-teal-50 border-teal-200",    icon: <Stamp className="w-3.5 h-3.5" /> },
  completed:          { ar: "مكتمل",             en: "Completed",          color: "text-green-700",  bg: "bg-green-50 border-green-200",  icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  rejected:           { ar: "مرفوض",             en: "Rejected",           color: "text-red-700",    bg: "bg-red-50 border-red-200",      icon: <XCircle className="w-3.5 h-3.5" /> },
};

const STATUS_FLOW: AppStatus[] = [
  "received", "under_review", "awaiting_documents", "documents_uploaded",
  "sent_to_embassy", "processing", "issued", "completed",
];

/* ── Stat card ── */
function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className={`rounded-2xl border p-4 flex items-center gap-3 ${color}`}>
      <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center shrink-0">{icon}</div>
      <div>
        <div className="text-2xl font-black">{value}</div>
        <div className="text-xs font-medium opacity-80">{label}</div>
      </div>
    </div>
  );
}

/* ── Status badge ── */
function StatusBadge({ status, ar }: { status: AppStatus; ar: boolean }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${m.bg} ${m.color}`}>
      {m.icon}
      {ar ? m.ar : m.en}
    </span>
  );
}

/* ── Timeline ── */
function StatusTimeline({ current, ar }: { current: AppStatus; ar: boolean }) {
  if (current === "rejected") {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-semibold">
        <XCircle className="w-4 h-4 shrink-0" />
        {ar ? "تم رفض الطلب" : "Application Rejected"}
      </div>
    );
  }
  const currentIdx = STATUS_FLOW.indexOf(current);
  return (
    <div className="overflow-x-auto">
      <div className="flex items-center gap-0 min-w-max">
        {STATUS_FLOW.map((s, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          const m = STATUS_META[s];
          return (
            <div key={s} className="flex items-center">
              <div className={`flex flex-col items-center gap-1 px-2 ${active ? "scale-110" : ""} transition-transform`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                  ${done ? "bg-[#0d2351] border-[#0d2351] text-white" : active ? "bg-[#c8a84b] border-[#c8a84b] text-white shadow-lg shadow-amber-500/30" : "bg-white border-slate-200 text-slate-400"}`}>
                  {done ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-[10px]">{i + 1}</span>}
                </div>
                <span className={`text-[9px] font-medium whitespace-nowrap ${active ? "text-[#c8a84b] font-bold" : done ? "text-[#0d2351]" : "text-slate-400"}`}>
                  {ar ? m.ar : m.en}
                </span>
              </div>
              {i < STATUS_FLOW.length - 1 && (
                <div className={`h-0.5 w-6 mx-0.5 rounded-full transition-all ${done ? "bg-[#0d2351]" : "bg-slate-200"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Document link ── */
function DocLink({ url, label }: { url?: string | null; label: string }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-xs bg-white border border-slate-200 text-[#0d2351] hover:bg-[#0d2351] hover:text-white hover:border-[#0d2351] transition-all px-3 py-2 rounded-lg font-semibold"
    >
      <FileText className="h-3.5 w-3.5 shrink-0" />
      {label}
    </a>
  );
}

/* ── Main ── */
export default function VisaApplicationsAdmin() {
  const { language } = useTranslation();
  const ar = language === "ar";
  const qc = useQueryClient();

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<number, string>>({});
  const [pendingStatus, setPendingStatus] = useState<Record<number, AppStatus>>({});

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params: any = filterStatus !== "all" ? { status: filterStatus } : {};
  const { data: applications, isLoading } = useListVisaApplications(params);
  const updateApp = useUpdateVisaApplication({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getListVisaApplicationsQueryKey() }) },
  });

  /* Stats */
  const stats = useMemo(() => {
    const all = applications ?? [];
    return {
      total: all.length,
      pending: all.filter(a => ["received","under_review","awaiting_documents","documents_uploaded"].includes(a.status)).length,
      inProgress: all.filter(a => ["sent_to_embassy","processing"].includes(a.status)).length,
      completed: all.filter(a => a.status === "completed" || a.status === "issued").length,
      rejected: all.filter(a => a.status === "rejected").length,
    };
  }, [applications]);

  const filtered = useMemo(() => {
    if (!applications) return [];
    return applications.filter(a =>
      !search || a.fullName.toLowerCase().includes(search.toLowerCase()) ||
      a.passportNumber?.toLowerCase().includes(search.toLowerCase()) ||
      a.email?.toLowerCase().includes(search.toLowerCase())
    );
  }, [applications, search]);

  const handleSaveStatus = (id: number, currentStatus: AppStatus) => {
    const newStatus = pendingStatus[id] ?? currentStatus;
    updateApp.mutate({ id, data: { status: newStatus, adminNotes: adminNotes[id] } as never });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label={ar ? "إجمالي الطلبات" : "Total"} value={stats.total}
          icon={<ClipboardList className="w-5 h-5 text-slate-600" />} color="bg-slate-50 border-slate-200 text-slate-700" />
        <StatCard label={ar ? "معلّقة" : "Pending"} value={stats.pending}
          icon={<Clock className="w-5 h-5 text-amber-600" />} color="bg-amber-50 border-amber-200 text-amber-700" />
        <StatCard label={ar ? "مكتملة / صادرة" : "Completed"} value={stats.completed}
          icon={<CheckCircle2 className="w-5 h-5 text-green-600" />} color="bg-green-50 border-green-200 text-green-700" />
        <StatCard label={ar ? "مرفوضة" : "Rejected"} value={stats.rejected}
          icon={<XCircle className="w-5 h-5 text-red-500" />} color="bg-red-50 border-red-200 text-red-700" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-wrap gap-4 items-end">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
            {ar ? "بحث" : "Search"}
          </label>
          <div className="relative">
            <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 ${ar ? "right-3" : "left-3"}`} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={ar ? "اسم، جواز، إيميل..." : "Name, passport, email..."}
              className={`w-full ${ar ? "pr-9 pl-4" : "pl-9 pr-4"} py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0d2351]/20 focus:border-[#0d2351]/40 bg-slate-50`}
            />
          </div>
        </div>

        {/* Status filter */}
        <div className="min-w-[180px]">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
            <Filter className="inline w-3 h-3 me-1" />{ar ? "الحالة" : "Status"}
          </label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-10 border-slate-200 bg-slate-50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{ar ? "جميع الحالات" : "All Statuses"}</SelectItem>
              {Object.entries(STATUS_META).map(([k, v]) => (
                <SelectItem key={k} value={k}>{ar ? v.ar : v.en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-slate-400 font-medium pb-1.5">
          {filtered.length} {ar ? "طلب" : "application(s)"}
        </div>
      </div>

      {/* Applications list */}
      <div className="space-y-3">
        {!filtered.length ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-20 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-slate-400 font-medium">{ar ? "لا توجد طلبات" : "No applications"}</p>
          </div>
        ) : filtered.map(app => {
          const status = app.status as AppStatus;
          const isExpanded = expanded === app.id;
          const m = STATUS_META[status];

          return (
            <div key={app.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Row */}
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50/60 transition-colors"
                onClick={() => setExpanded(isExpanded ? null : app.id)}
              >
                {/* ID */}
                <div className="w-12 h-12 rounded-xl bg-[#0d2351]/6 flex items-center justify-center shrink-0">
                  <span className="text-xs font-black text-[#0d2351]">#{app.id}</span>
                </div>

                {/* Applicant */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 text-sm truncate">{app.fullName}</div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Globe className="h-3 w-3" />{app.nationality}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Shield className="h-3 w-3" />{app.passportNumber}
                    </span>
                  </div>
                </div>

                {/* Date */}
                <div className="hidden md:flex flex-col items-end shrink-0">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(app.createdAt).toLocaleDateString(ar ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </span>
                  <span className="text-xs text-slate-300 mt-0.5">
                    {new Date(app.createdAt).toLocaleTimeString(ar ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                {/* Status badge */}
                <div className="shrink-0">
                  <StatusBadge status={status} ar={ar} />
                </div>

                {/* Chevron */}
                <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isExpanded ? "bg-[#0d2351] text-white" : "bg-slate-100 text-slate-400"}`}>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>

              {/* Expanded panel */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/40">

                  {/* Info grid */}
                  <div className="px-5 py-5 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { icon: <User className="h-4 w-4" />,     label: ar ? "الاسم الكامل" : "Full Name",    val: app.fullName },
                      { icon: <Mail className="h-4 w-4" />,     label: ar ? "البريد" : "Email",              val: app.email },
                      { icon: <Phone className="h-4 w-4" />,    label: ar ? "الهاتف" : "Phone",              val: app.phone },
                      { icon: <Calendar className="h-4 w-4" />, label: ar ? "تاريخ الميلاد" : "Date of Birth", val: app.dateOfBirth },
                      { icon: <Shield className="h-4 w-4" />,   label: ar ? "رقم الجواز" : "Passport No.",   val: app.passportNumber },
                      { icon: <Globe className="h-4 w-4" />,    label: ar ? "مسار التقديم" : "Eligibility Path", val: app.eligibilityPath },
                    ].map(({ icon, label, val }) => (
                      <div key={label} className="space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          {icon}{label}
                        </div>
                        <div className="text-sm font-semibold text-slate-700 break-all">{val ?? "—"}</div>
                      </div>
                    ))}
                  </div>

                  {/* Status timeline */}
                  <div className="px-5 pb-4">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                      {ar ? "مسار الحالة" : "Status Progress"}
                    </div>
                    <StatusTimeline current={status} ar={ar} />
                  </div>

                  {/* Documents */}
                  {(app.passportImageUrl || app.personalPhotoUrl || app.residencyImageUrl || app.residencyBackImageUrl || app.visaImageUrl) && (
                    <div className="px-5 pb-4">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                        {ar ? "المستندات المرفقة" : "Attached Documents"}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <DocLink url={app.passportImageUrl}     label={ar ? "صورة الجواز"          : "Passport Image"} />
                        <DocLink url={app.personalPhotoUrl}     label={ar ? "الصورة الشخصية"        : "Personal Photo"} />
                        <DocLink url={app.residencyImageUrl}    label={ar ? "الإقامة (وجه)"         : "Residency Front"} />
                        <DocLink url={app.residencyBackImageUrl}label={ar ? "الإقامة (خلف)"         : "Residency Back"} />
                        <DocLink url={app.visaImageUrl}         label={ar ? "صورة التأشيرة"         : "Visa Copy"} />
                      </div>
                    </div>
                  )}

                  {/* Update panel */}
                  <div className="mx-5 mb-5 bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <ArrowRight className={`w-4 h-4 text-[#0d2351] ${ar ? "rotate-180" : ""}`} />
                      {ar ? "تحديث الطلب" : "Update Application"}
                    </div>

                    {/* Quick status buttons */}
                    <div>
                      <div className="text-xs font-semibold text-slate-400 mb-2">{ar ? "تغيير الحالة السريع" : "Quick Status Change"}</div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(STATUS_META).map(([k, v]) => (
                          <button
                            key={k}
                            onClick={() => setPendingStatus(p => ({ ...p, [app.id]: k as AppStatus }))}
                            className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-all ${
                              (pendingStatus[app.id] ?? status) === k
                                ? `${v.bg} ${v.color} border-current shadow-sm`
                                : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {ar ? v.ar : v.en}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="text-xs font-semibold text-slate-400 mb-1.5 block">{ar ? "ملاحظات الإدارة" : "Admin Notes"}</label>
                      <textarea
                        rows={3}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0d2351]/20 focus:border-[#0d2351]/40 bg-slate-50"
                        value={adminNotes[app.id] ?? app.adminNotes ?? ""}
                        onChange={e => setAdminNotes(n => ({ ...n, [app.id]: e.target.value }))}
                        placeholder={ar ? "أضف ملاحظة داخلية..." : "Add internal note..."}
                      />
                    </div>

                    <Button
                      onClick={() => handleSaveStatus(app.id, status)}
                      disabled={updateApp.isPending}
                      className="bg-[#0d2351] hover:bg-[#c8a84b] text-white rounded-xl px-6 h-10 font-bold transition-colors"
                    >
                      {updateApp.isPending ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "حفظ التعديلات" : "Save Changes")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
