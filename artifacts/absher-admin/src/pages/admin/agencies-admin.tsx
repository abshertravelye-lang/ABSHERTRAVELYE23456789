/**
 * Admin → Travel Agencies: create/edit agencies, manage agent accounts
 * (create + reset password), and configure per-agency visa services & agent
 * pricing. All enforcement is server-side (permission: employees).
 */
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListAgencies, useCreateAgency, useUpdateAgency, getListAgenciesQueryKey,
  useListAgencyAgents, useCreateAgencyAgent, useResetAgentPassword, useUpdateAgentAccount, getListAgencyAgentsQueryKey,
  useListAgencyVisaServices, usePutAgencyVisaServices, getListAgencyVisaServicesQueryKey,
  useListVisas, useListAgentApplications, getListAgentApplicationsQueryKey,
  type Agency, type AgentAccount, type AgentApplication, type ListAgentApplicationsParams,
} from "@workspace/api-client-react";
import { useTranslation } from "@/hooks/use-translation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Building2, Plus, KeyRound, Loader2, UserPlus, BadgeCheck, PauseCircle, Clock, Search, Users, Briefcase, Eye, EyeOff, RefreshCw } from "lucide-react";
import { Pill, DetailPanel, STATUSES, STATUS_META as APP_STATUS_META } from "./agent-applications-admin";

const STATUS_META: Record<string, { ar: string; en: string; cls: string; icon: React.ReactNode }> = {
  active:    { ar: "نشطة", en: "Active", cls: "bg-emerald-100 text-emerald-800", icon: <BadgeCheck className="w-3.5 h-3.5" /> },
  suspended: { ar: "موقوفة", en: "Suspended", cls: "bg-red-100 text-red-700", icon: <PauseCircle className="w-3.5 h-3.5" /> },
  pending:   { ar: "قيد الاعتماد", en: "Pending", cls: "bg-amber-100 text-amber-800", icon: <Clock className="w-3.5 h-3.5" /> },
};

function StatusPill({ status, ar }: { status: string; ar: boolean }) {
  const m = STATUS_META[status] ?? STATUS_META.pending;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${m.cls}`}>
      {m.icon}{ar ? m.ar : m.en}
    </span>
  );
}

// ── Agency form dialog (create / edit) ───────────────────────────────────────
function AgencyForm({ agency, onClose }: { agency: Agency | null; onClose: () => void }) {
  const { language } = useTranslation();
  const ar = language === "ar";
  const qc = useQueryClient();
  const create = useCreateAgency();
  const update = useUpdateAgency();
  const [f, setF] = useState({
    name: agency?.name ?? "",
    contactEmail: agency?.contactEmail ?? "",
    contactPhone: agency?.contactPhone ?? "",
    address: agency?.address ?? "",
    notes: agency?.notes ?? "",
    status: agency?.status ?? "pending",
  });
  // Primary portal login (create-mode only).
  const [withAccount, setWithAccount] = useState(false);
  const [acc, setAcc] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const pwStrength = useMemo(() => {
    const p = acc.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (p.length >= 12) s++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return Math.min(s, 4);
  }, [acc.password]);
  const genPassword = () => {
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ", lower = "abcdefghijkmnopqrstuvwxyz", digits = "23456789", special = "!@#$%&*";
    const all = upper + lower + digits + special;
    const pick = (set: string) => set[Math.floor(Math.random() * set.length)];
    let pw = pick(upper) + pick(lower) + pick(digits) + pick(special);
    for (let i = 0; i < 10; i++) pw += pick(all);
    pw = pw.split("").sort(() => Math.random() - 0.5).join("");
    setAcc((a) => ({ ...a, password: pw }));
    setShowPw(true);
  };
  const busy = create.isPending || update.isPending;
  const save = () => {
    if (!f.name.trim()) { toast.error(ar ? "اسم الوكالة مطلوب" : "Agency name is required"); return; }
    if (!agency && withAccount) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(acc.email.trim())) {
        toast.error(ar ? "بريد الدخول غير صالح" : "Login email is invalid"); return;
      }
      if (acc.password.length < 8) {
        toast.error(ar ? "كلمة المرور يجب أن تكون 8 أحرف على الأقل" : "Password must be at least 8 characters"); return;
      }
    }
    const done = () => { qc.invalidateQueries({ queryKey: getListAgenciesQueryKey() }); onClose(); toast.success(ar ? "تم الحفظ" : "Saved"); };
    const fail = (e: unknown) => {
      const msg = (e as { data?: { error?: string } })?.data?.error;
      if (msg === "Email already registered") toast.error(ar ? "البريد الإلكتروني مسجل مسبقاً" : "Email already registered");
      else toast.error(ar ? "تعذر الحفظ" : "Save failed");
    };
    if (agency) update.mutate({ id: agency.id, data: f as never }, { onSuccess: done, onError: fail });
    else {
      const payload = withAccount
        ? { ...f, agentAccount: { email: acc.email.trim(), password: acc.password, firstName: f.name.trim() } }
        : f;
      create.mutate({ data: payload as never }, { onSuccess: done, onError: fail });
    }
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-lg">{agency ? (ar ? "تعديل الوكالة" : "Edit agency") : (ar ? "إضافة وكالة" : "New agency")}</h3>
        {[
          { k: "name", label: ar ? "اسم الوكالة *" : "Agency name *" },
          { k: "contactEmail", label: ar ? "البريد الإلكتروني" : "Contact email" },
          { k: "contactPhone", label: ar ? "الهاتف" : "Contact phone" },
          { k: "address", label: ar ? "العنوان" : "Address" },
          { k: "notes", label: ar ? "ملاحظات" : "Notes" },
        ].map(({ k, label }) => (
          <div key={k}>
            <label className="text-sm text-muted-foreground">{label}</label>
            <input className="w-full border rounded-xl px-3 py-2 text-sm mt-1"
              value={(f as Record<string, string>)[k] ?? ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
          </div>
        ))}
        <div>
          <label className="text-sm text-muted-foreground">{ar ? "الحالة" : "Status"}</label>
          <div className="flex gap-2 mt-1">
            {(["active", "suspended", "pending"] as const).map((s) => (
              <button key={s} onClick={() => setF({ ...f, status: s })}
                className={`rounded-full px-3 py-1.5 text-xs border ${f.status === s ? "bg-[#0d2351] text-white border-[#0d2351]" : "bg-white"}`}>
                {ar ? STATUS_META[s].ar : STATUS_META[s].en}
              </button>
            ))}
          </div>
        </div>
        {!agency && (
          <div className="border rounded-xl p-3 space-y-3 bg-slate-50">
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input type="checkbox" checked={withAccount} onChange={(e) => setWithAccount(e.target.checked)} className="rounded" />
              {ar ? "إنشاء حساب دخول لبوابة الوكالة" : "Create a portal login for this agency"}
            </label>
            {withAccount && (
              <>
                <div>
                  <label className="text-sm text-muted-foreground">{ar ? "بريد الدخول *" : "Login email *"}</label>
                  <input dir="ltr" type="email" autoComplete="off" className="w-full border rounded-xl px-3 py-2 text-sm mt-1"
                    value={acc.email} onChange={(e) => setAcc({ ...acc, email: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">{ar ? "كلمة المرور *" : "Password *"}</label>
                  <div className="flex gap-2 mt-1">
                    <div className="relative flex-1">
                      <input dir="ltr" type={showPw ? "text" : "password"} autoComplete="new-password"
                        className="w-full border rounded-xl px-3 py-2 text-sm pe-9"
                        value={acc.password} onChange={(e) => setAcc({ ...acc, password: e.target.value })} />
                      <button type="button" onClick={() => setShowPw(!showPw)}
                        className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                        aria-label={showPw ? (ar ? "إخفاء" : "Hide") : (ar ? "إظهار" : "Show")}>
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={genPassword}>
                      <RefreshCw className="w-3.5 h-3.5 me-1" />{ar ? "توليد" : "Generate"}
                    </Button>
                  </div>
                  {acc.password && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 flex gap-1">
                        {[0, 1, 2, 3].map((i) => (
                          <div key={i} className={`h-1.5 flex-1 rounded-full ${i < pwStrength ? (pwStrength <= 1 ? "bg-red-400" : pwStrength === 2 ? "bg-amber-400" : "bg-emerald-500") : "bg-slate-200"}`} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {pwStrength <= 1 ? (ar ? "ضعيفة" : "Weak") : pwStrength === 2 ? (ar ? "متوسطة" : "Fair") : pwStrength === 3 ? (ar ? "جيدة" : "Good") : (ar ? "قوية" : "Strong")}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>{ar ? "إلغاء" : "Cancel"}</Button>
          <Button className="bg-[#0d2351] text-white" disabled={busy} onClick={save}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : (ar ? "حفظ" : "Save")}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Agents panel ─────────────────────────────────────────────────────────────
function AgentsPanel({ agency }: { agency: Agency }) {
  const { language } = useTranslation();
  const ar = language === "ar";
  const qc = useQueryClient();
  const { data: agents = [], isLoading } = useListAgencyAgents(agency.id);
  const createAgent = useCreateAgencyAgent();
  const resetPw = useResetAgentPassword();
  const updateAgent = useUpdateAgentAccount();
  const [adding, setAdding] = useState(false);
  const [na, setNa] = useState({ firstName: "", lastName: "", email: "", password: "" });

  const invalidate = () => qc.invalidateQueries({ queryKey: getListAgencyAgentsQueryKey(agency.id) });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">{ar ? "حسابات الوكلاء" : "Agent accounts"}</p>
        <Button size="sm" variant="outline" onClick={() => setAdding((v) => !v)}>
          <UserPlus className="w-4 h-4 me-1" />{ar ? "وكيل جديد" : "New agent"}
        </Button>
      </div>
      {adding && (
        <div className="rounded-xl border p-3 grid grid-cols-2 gap-2">
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder={ar ? "الاسم الأول *" : "First name *"} value={na.firstName} onChange={(e) => setNa({ ...na, firstName: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder={ar ? "اسم العائلة" : "Last name"} value={na.lastName} onChange={(e) => setNa({ ...na, lastName: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 text-sm col-span-2" dir="ltr" placeholder="email@agency.com *" value={na.email} onChange={(e) => setNa({ ...na, email: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 text-sm col-span-2" dir="ltr" placeholder={ar ? "كلمة المرور (8+ أحرف) *" : "Password (8+ chars) *"} value={na.password} onChange={(e) => setNa({ ...na, password: e.target.value })} />
          <Button size="sm" className="bg-[#0d2351] text-white col-span-2" disabled={createAgent.isPending}
            onClick={() => {
              if (!na.firstName.trim() || !na.email.trim() || na.password.length < 8) { toast.error(ar ? "أكمل الحقول المطلوبة (كلمة المرور 8 أحرف على الأقل)" : "Fill required fields (password 8+ chars)"); return; }
              createAgent.mutate({ id: agency.id, data: na as never }, {
                onSuccess: () => { invalidate(); setAdding(false); setNa({ firstName: "", lastName: "", email: "", password: "" }); toast.success(ar ? "تم إنشاء حساب الوكيل — زوّد الوكالة بالبريد وكلمة المرور" : "Agent account created — share the credentials with the agency"); },
                onError: (e: unknown) => toast.error((e as { error?: string })?.error || (ar ? "تعذر الإنشاء (قد يكون البريد مستخدماً)" : "Creation failed (email may be in use)")),
              });
            }}>
            {createAgent.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (ar ? "إنشاء الحساب" : "Create account")}
          </Button>
        </div>
      )}
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : agents.length === 0 ? (
        <p className="text-sm text-muted-foreground">{ar ? "لا يوجد وكلاء بعد." : "No agents yet."}</p>
      ) : (
        <div className="space-y-2">
          {(agents as AgentAccount[]).map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm">
              <div>
                <p className="font-medium">{`${a.firstName ?? ""} ${a.lastName ?? ""}`.trim() || a.email}</p>
                <p className="text-xs text-muted-foreground" dir="ltr">{a.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs rounded-full px-2 py-0.5 ${a.isActive ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-600"}`}>
                  {a.isActive ? (ar ? "مفعل" : "Active") : (ar ? "معطل" : "Disabled")}
                </span>
                <Button size="sm" variant="ghost" title={ar ? "إعادة تعيين كلمة المرور" : "Reset password"}
                  onClick={() => {
                    const pw = window.prompt(ar ? "كلمة المرور الجديدة (8 أحرف على الأقل):" : "New password (8+ chars):");
                    if (!pw || pw.length < 8) return;
                    resetPw.mutate({ agentId: a.id, data: { password: pw } }, {
                      onSuccess: () => toast.success(ar ? "تم تحديث كلمة المرور" : "Password updated"),
                      onError: () => toast.error(ar ? "فشل التحديث" : "Update failed"),
                    });
                  }}>
                  <KeyRound className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost"
                  onClick={() => updateAgent.mutate({ agentId: a.id, data: { isActive: !a.isActive } }, { onSuccess: invalidate })}>
                  {a.isActive ? (ar ? "تعطيل" : "Disable") : (ar ? "تفعيل" : "Enable")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Visa services & pricing panel ────────────────────────────────────────────
function ServicesPanel({ agency }: { agency: Agency }) {
  const { language } = useTranslation();
  const ar = language === "ar";
  const qc = useQueryClient();
  const { data: visas = [] } = useListVisas();
  const { data: services = [], isLoading } = useListAgencyVisaServices(agency.id);
  const putServices = usePutAgencyVisaServices();
  const [draft, setDraft] = useState<Record<number, { enabled: boolean; agentPrice: string }> | null>(null);

  const current = useMemo(() => {
    const map: Record<number, { enabled: boolean; agentPrice: string }> = {};
    for (const s of services as Array<{ visaId: number; enabled: boolean; agentPrice: string }>) {
      map[s.visaId] = { enabled: s.enabled, agentPrice: String(s.agentPrice) };
    }
    return map;
  }, [services]);

  const state = draft ?? current;
  const setRow = (visaId: number, patch: Partial<{ enabled: boolean; agentPrice: string }>) =>
    setDraft({ ...state, [visaId]: { ...(state[visaId] ?? { enabled: false, agentPrice: "" }), ...patch } });

  if (isLoading) return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">{ar ? "خدمات التأشيرات والأسعار" : "Visa services & pricing"}</p>
        <Button size="sm" className="bg-[#0d2351] text-white" disabled={!draft || putServices.isPending}
          onClick={() => {
            const rows = Object.entries(state)
              .filter(([, v]) => v.enabled || v.agentPrice !== "")
              .map(([visaId, v]) => ({ visaId: Number(visaId), enabled: v.enabled, agentPrice: v.agentPrice || "0" }));
            const bad = rows.find((r) => r.enabled && (isNaN(Number(r.agentPrice)) || Number(r.agentPrice) <= 0));
            if (bad) { toast.error(ar ? "أدخل سعراً صحيحاً لكل خدمة مفعلة" : "Enter a valid price for every enabled service"); return; }
            putServices.mutate({ id: agency.id, data: { services: rows } as never }, {
              onSuccess: () => { qc.invalidateQueries({ queryKey: getListAgencyVisaServicesQueryKey(agency.id) }); setDraft(null); toast.success(ar ? "تم حفظ الخدمات" : "Services saved"); },
              onError: () => toast.error(ar ? "تعذر الحفظ" : "Save failed"),
            });
          }}>
          {putServices.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (ar ? "حفظ" : "Save")}
        </Button>
      </div>
      <div className="max-h-80 overflow-y-auto rounded-xl border divide-y">
        {(visas as unknown as Array<{ id: number; countryAr: string; countryEn: string; visaType: string; fee: string | number; currency: string }>).map((v) => {
          const row = state[v.id];
          return (
            <div key={v.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <input type="checkbox" className="w-4 h-4 accent-[#0d2351]" checked={row?.enabled ?? false}
                onChange={(e) => setRow(v.id, { enabled: e.target.checked })} />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{ar ? v.countryAr : v.countryEn} — {v.visaType}</p>
                <p className="text-xs text-muted-foreground">{ar ? "سعر العميل:" : "Customer price:"} {v.fee} {v.currency}</p>
              </div>
              <input dir="ltr" className="w-24 border rounded-lg px-2 py-1.5 text-sm text-end" placeholder={ar ? "سعر الوكيل" : "Agent price"}
                value={row?.agentPrice ?? ""} onChange={(e) => setRow(v.id, { agentPrice: e.target.value })} />
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {ar ? "الخدمات غير المفعلة لا تظهر في بوابة الوكيل، والسعر المعتمد هو سعر الوكيل أعلاه (يُطبق من الخادم)." : "Disabled services are hidden from the agent portal; the agent price above is applied server-side."}
      </p>
    </div>
  );
}

// ── Applications panel (per-agency) ─────────────────────────────────────────
function ApplicationsPanel({ agency }: { agency: Agency }) {
  const { language } = useTranslation();
  const ar = language === "ar";
  const [status, setStatus] = useState<string>("");
  const params = useMemo<ListAgentApplicationsParams>(() => {
    const p: ListAgentApplicationsParams = { agencyId: agency.id };
    if (status) p.status = status;
    return p;
  }, [agency.id, status]);
  const { data = [], isLoading } = useListAgentApplications(params, {
    query: { queryKey: [...getListAgentApplicationsQueryKey(params)] },
  });
  const [openId, setOpenId] = useState<number | null>(null);
  const rows = data as AgentApplication[];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-sm">
          {ar ? "طلبات الوكالة" : "Agency applications"}
          <span className="text-muted-foreground font-normal ms-2">({rows.length})</span>
        </p>
        <select className="border rounded-xl px-3 py-1.5 text-xs bg-white" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">{ar ? "كل الحالات" : "All statuses"}</option>
          {STATUSES.map((s) => <option key={s} value={s}>{ar ? APP_STATUS_META[s].ar : APP_STATUS_META[s].en}</option>)}
        </select>
      </div>
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{ar ? "لا توجد طلبات لهذه الوكالة." : "No applications for this agency."}</p>
      ) : (
        <div className="rounded-xl border divide-y max-h-96 overflow-y-auto">
          {rows.map((r) => (
            <button key={r.id} className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-sm text-start hover:bg-slate-50"
              onClick={() => setOpenId(r.id)}>
              <div className="min-w-0">
                <p className="font-mono font-medium text-[#0d2351] text-xs">{r.trackingNumber}</p>
                <p className="font-medium truncate">{r.fullName}</p>
                <p className="text-xs text-muted-foreground truncate">{ar ? r.countryAr : r.countryEn} · {r.visaType}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Pill status={r.status} ar={ar} />
                <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString(ar ? "ar-SA" : "en-GB")}</span>
              </div>
            </button>
          ))}
        </div>
      )}
      {openId !== null && <DetailPanel id={openId} ar={ar} onClose={() => setOpenId(null)} />}
    </div>
  );
}

// ── Agency card (stats + expandable tabs) ────────────────────────────────────
function AgencyCard({ a, ar, open, onToggle, onEdit }: {
  a: Agency; ar: boolean; open: boolean; onToggle: () => void; onEdit: () => void;
}) {
  const [tab, setTab] = useState<"agents" | "services" | "applications">("agents");
  const { data: agents = [] } = useListAgencyAgents(a.id);
  const appParams = useMemo<ListAgentApplicationsParams>(() => ({ agencyId: a.id }), [a.id]);
  const { data: apps = [] } = useListAgentApplications(appParams, {
    query: { queryKey: [...getListAgentApplicationsQueryKey(appParams)] },
  });

  return (
    <div className="rounded-2xl border bg-white">
      <div role="button" tabIndex={0} className="w-full flex items-center justify-between px-4 py-3 text-start cursor-pointer"
        onClick={onToggle} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}>
        <div>
          <p className="font-bold">{a.name}</p>
          <p className="text-xs text-muted-foreground" dir="ltr">{a.contactEmail ?? ""} {a.contactPhone ? `· ${a.contactPhone}` : ""}</p>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" />{(agents as AgentAccount[]).length} {ar ? "وكيل" : "agents"}</span>
            <span className="inline-flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{(apps as AgentApplication[]).length} {ar ? "طلب" : "applications"}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill status={a.status} ar={ar} />
          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            {ar ? "تعديل" : "Edit"}
          </Button>
        </div>
      </div>
      {open && (
        <div className="border-t px-4 py-4 space-y-4">
          <div className="flex gap-2">
            {(["agents", "services", "applications"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`rounded-full px-3 py-1.5 text-xs border ${tab === t ? "bg-[#0d2351] text-white border-[#0d2351]" : "bg-white"}`}>
                {t === "agents" ? (ar ? "الوكلاء" : "Agents") : t === "services" ? (ar ? "الخدمات والأسعار" : "Services & pricing") : (ar ? "الطلبات" : "Applications")}
              </button>
            ))}
          </div>
          {tab === "agents" ? <AgentsPanel agency={a} /> : tab === "services" ? <ServicesPanel agency={a} /> : <ApplicationsPanel agency={a} />}
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function AgenciesAdmin() {
  const { language } = useTranslation();
  const ar = language === "ar";
  const { data: agencies = [], isLoading } = useListAgencies();
  const [editing, setEditing] = useState<Agency | null>(null);
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const rows = useMemo(() => {
    let list = agencies as Agency[];
    if (statusFilter) list = list.filter((a) => a.status === statusFilter);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter((a) =>
        [a.name, a.contactEmail, a.contactPhone].some((v) => (v ?? "").toLowerCase().includes(s)));
    }
    return list;
  }, [agencies, q, statusFilter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Building2 className="w-5 h-5" />{ar ? "وكالات السفر" : "Travel Agencies"}</h1>
          <p className="text-sm text-muted-foreground">{ar ? "إدارة الوكالات، حسابات الوكلاء، الخدمات والأسعار" : "Manage agencies, agent accounts, services & pricing"}</p>
        </div>
        <Button className="bg-[#0d2351] text-white" onClick={() => setCreating(true)}>
          <Plus className="w-4 h-4 me-1" />{ar ? "وكالة جديدة" : "New agency"}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute top-2.5 start-3 text-muted-foreground" />
          <input className="border rounded-xl ps-9 pe-3 py-2 text-sm w-64" placeholder={ar ? "بحث بالاسم أو البريد أو الهاتف..." : "Search name, email, phone..."}
            value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => setStatusFilter("")}
            className={`rounded-full px-3 py-1.5 text-xs border ${statusFilter === "" ? "bg-[#0d2351] text-white border-[#0d2351]" : "bg-white"}`}>
            {ar ? "الكل" : "All"}
          </button>
          {(["active", "suspended", "pending"] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
              className={`rounded-full px-3 py-1.5 text-xs border ${statusFilter === s ? "bg-[#0d2351] text-white border-[#0d2351]" : "bg-white"}`}>
              {ar ? STATUS_META[s].ar : STATUS_META[s].en}
            </button>
          ))}
        </div>
        <span className="text-sm text-muted-foreground ms-auto">
          {ar ? `عدد الوكالات: ${rows.length}` : `Agencies: ${rows.length}`}
        </span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border bg-white p-10 text-center text-muted-foreground">
          {(agencies as Agency[]).length === 0
            ? (ar ? "لا توجد وكالات بعد — أنشئ أول وكالة." : "No agencies yet — create the first one.")
            : (ar ? "لا توجد نتائج مطابقة للبحث." : "No agencies match your search.")}
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((a) => (
            <AgencyCard key={a.id} a={a} ar={ar} open={openId === a.id}
              onToggle={() => setOpenId(openId === a.id ? null : a.id)}
              onEdit={() => setEditing(a)} />
          ))}
        </div>
      )}

      {(creating || editing) && <AgencyForm agency={editing} onClose={() => { setCreating(false); setEditing(null); }} />}
    </div>
  );
}
