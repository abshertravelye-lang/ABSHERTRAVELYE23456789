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
  useListVisas,
  type Agency, type AgentAccount,
} from "@workspace/api-client-react";
import { useTranslation } from "@/hooks/use-translation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Building2, Plus, KeyRound, Loader2, UserPlus, BadgeCheck, PauseCircle, Clock } from "lucide-react";

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
  const busy = create.isPending || update.isPending;
  const save = () => {
    if (!f.name.trim()) { toast.error(ar ? "اسم الوكالة مطلوب" : "Agency name is required"); return; }
    const done = () => { qc.invalidateQueries({ queryKey: getListAgenciesQueryKey() }); onClose(); toast.success(ar ? "تم الحفظ" : "Saved"); };
    const fail = () => toast.error(ar ? "تعذر الحفظ" : "Save failed");
    if (agency) update.mutate({ id: agency.id, data: f as never }, { onSuccess: done, onError: fail });
    else create.mutate({ data: f as never }, { onSuccess: done, onError: fail });
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

// ── Page ─────────────────────────────────────────────────────────────────────
export default function AgenciesAdmin() {
  const { language } = useTranslation();
  const ar = language === "ar";
  const { data: agencies = [], isLoading } = useListAgencies();
  const [editing, setEditing] = useState<Agency | null>(null);
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const [tab, setTab] = useState<"agents" | "services">("agents");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Building2 className="w-5 h-5" />{ar ? "وكالات السفر" : "Travel Agencies"}</h1>
          <p className="text-sm text-muted-foreground">{ar ? "إدارة الوكالات، حسابات الوكلاء، الخدمات والأسعار" : "Manage agencies, agent accounts, services & pricing"}</p>
        </div>
        <Button className="bg-[#0d2351] text-white" onClick={() => setCreating(true)}>
          <Plus className="w-4 h-4 me-1" />{ar ? "وكالة جديدة" : "New agency"}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (agencies as Agency[]).length === 0 ? (
        <div className="rounded-2xl border bg-white p-10 text-center text-muted-foreground">
          {ar ? "لا توجد وكالات بعد — أنشئ أول وكالة." : "No agencies yet — create the first one."}
        </div>
      ) : (
        <div className="space-y-3">
          {(agencies as Agency[]).map((a) => (
            <div key={a.id} className="rounded-2xl border bg-white">
              <button className="w-full flex items-center justify-between px-4 py-3 text-start"
                onClick={() => setOpenId(openId === a.id ? null : a.id)}>
                <div>
                  <p className="font-bold">{a.name}</p>
                  <p className="text-xs text-muted-foreground" dir="ltr">{a.contactEmail ?? ""} {a.contactPhone ? `· ${a.contactPhone}` : ""}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill status={a.status} ar={ar} />
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setEditing(a); }}>
                    {ar ? "تعديل" : "Edit"}
                  </Button>
                </div>
              </button>
              {openId === a.id && (
                <div className="border-t px-4 py-4 space-y-4">
                  <div className="flex gap-2">
                    {(["agents", "services"] as const).map((t) => (
                      <button key={t} onClick={() => setTab(t)}
                        className={`rounded-full px-3 py-1.5 text-xs border ${tab === t ? "bg-[#0d2351] text-white border-[#0d2351]" : "bg-white"}`}>
                        {t === "agents" ? (ar ? "الوكلاء" : "Agents") : (ar ? "الخدمات والأسعار" : "Services & pricing")}
                      </button>
                    ))}
                  </div>
                  {tab === "agents" ? <AgentsPanel agency={a} /> : <ServicesPanel agency={a} />}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && <AgencyForm agency={editing} onClose={() => { setCreating(false); setEditing(null); }} />}
    </div>
  );
}
