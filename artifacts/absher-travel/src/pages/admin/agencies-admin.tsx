/**
 * ABSHER TRAVEL — Admin: Agencies & Authorized Agents
 *
 * Sections:
 *  1. Agencies list  — create, edit info, activate / suspend
 *  2. Agents panel   — add agents, reset passwords, enable / disable
 *  3. Visa services  — toggle visas on/off, set custom agent pricing
 *  4. Applications   — review & update status of B2B submissions
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authHeader } from "@/lib/objectMedia";
import { useTranslation } from "@/hooks/use-translation";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Building2, Users, Globe, FileText, Plus, ChevronRight, ChevronLeft,
  CheckCircle2, XCircle, RotateCcw, Loader2, Search, Eye, Download,
  ShieldCheck, ShieldOff, KeyRound,
} from "lucide-react";

// ── API base & helpers ────────────────────────────────────────────────────────
const API = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "") + "/api";

async function apiFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...authHeader(), ...(opts.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || res.statusText);
  }
  return res.json();
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Agency {
  id: number;
  name: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  notes?: string | null;
  status: "active" | "suspended" | "pending";
  createdAt: string;
}

interface Agent {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  isActive?: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
}

interface VisaService {
  id: number;
  visaId: number;
  enabled: boolean;
  agentPrice: string;
  currency: string;
}

interface Visa {
  id: number;
  countryAr: string;
  countryEn: string;
  visaType: string;
  fee: number;
  currency: string;
  isActive: boolean;
}

interface AgentApp {
  id: number;
  trackingNumber: string;
  fullName: string;
  status: string;
  agencyName?: string | null;
  agentName?: string | null;
  countryEn?: string | null;
  countryAr?: string | null;
  visaType?: string | null;
  agentPrice?: string | null;
  adminNotes?: string | null;
  issuedVisaUrl?: string | null;
  createdAt: string;
}

// ── Status config ─────────────────────────────────────────────────────────────
const AGENCY_STATUS: Record<string, { label: string; cls: string }> = {
  active:    { label: "نشطة",          cls: "bg-emerald-100 text-emerald-800" },
  suspended: { label: "موقوفة",        cls: "bg-red-100 text-red-800" },
  pending:   { label: "قيد الاعتماد", cls: "bg-amber-100 text-amber-800" },
};

const APP_STATUS: Record<string, { ar: string; cls: string }> = {
  received:           { ar: "تم الاستلام",        cls: "bg-sky-100 text-sky-800" },
  under_review:       { ar: "قيد المراجعة",       cls: "bg-amber-100 text-amber-800" },
  awaiting_documents: { ar: "بانتظار مستندات",    cls: "bg-orange-100 text-orange-800" },
  documents_uploaded: { ar: "تم رفع المستندات",   cls: "bg-indigo-100 text-indigo-800" },
  sent_to_embassy:    { ar: "أُرسل للسفارة",      cls: "bg-purple-100 text-purple-800" },
  processing:         { ar: "قيد المعالجة",       cls: "bg-blue-100 text-blue-800" },
  issued:             { ar: "صدرت التأشيرة",      cls: "bg-emerald-100 text-emerald-800" },
  completed:          { ar: "مكتمل",              cls: "bg-emerald-200 text-emerald-900" },
  rejected:           { ar: "مرفوض",              cls: "bg-red-100 text-red-800" },
  cancelled:          { ar: "ملغي",               cls: "bg-gray-200 text-gray-700" },
};

const APP_STATUS_KEYS = Object.keys(APP_STATUS);

// ── Shared small components ───────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
    </div>
  );
}

function AgencyBadge({ status }: { status: string }) {
  const s = AGENCY_STATUS[status] ?? { label: status, cls: "bg-gray-100 text-gray-700" };
  return <Badge className={`${s.cls} border-0 font-medium text-xs`}>{s.label}</Badge>;
}

function AppBadge({ status }: { status: string }) {
  const s = APP_STATUS[status] ?? { ar: status, cls: "bg-gray-100 text-gray-700" };
  return <Badge className={`${s.cls} border-0 font-medium text-xs`}>{s.ar}</Badge>;
}

// ════════════════════════════════════════════════════════════════════════════════
// AGENCIES LIST
// ════════════════════════════════════════════════════════════════════════════════
function AgenciesList({
  onSelect,
  selected,
}: {
  onSelect: (a: Agency) => void;
  selected: Agency | null;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", contactEmail: "", contactPhone: "", address: "", notes: "" });

  const { data: agencies = [], isLoading } = useQuery<Agency[]>({
    queryKey: ["admin-agencies"],
    queryFn: () => apiFetch("/agencies"),
  });

  const createMut = useMutation({
    mutationFn: (body: typeof form) => apiFetch("/agencies", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (row: Agency) => {
      qc.invalidateQueries({ queryKey: ["admin-agencies"] });
      setShowCreate(false);
      setForm({ name: "", contactEmail: "", contactPhone: "", address: "", notes: "" });
      toast({ title: "تم إنشاء الوكالة" });
      onSelect(row);
    },
    onError: (e: Error) => toast({ variant: "destructive", title: e.message }),
  });

  const filtered = agencies.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.contactEmail ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold text-slate-900">الوكالات المعتمدة</h2>
        <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> وكالة جديدة
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
        <Input
          className="pr-9"
          placeholder="بحث باسم الوكالة أو البريد…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          dir="rtl"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">لا توجد وكالات</div>
      ) : (
        <div className="space-y-2 overflow-y-auto flex-1">
          {filtered.map((a) => (
            <button
              key={a.id}
              onClick={() => onSelect(a)}
              className={`w-full text-right rounded-xl border px-4 py-3 transition-all hover:border-primary hover:shadow-sm ${
                selected?.id === a.id ? "border-primary bg-primary/5 shadow-sm" : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <ChevronLeft className="h-4 w-4 text-slate-400" />
                <div className="flex-1 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <AgencyBadge status={a.status} />
                    <p className="font-semibold text-slate-900 text-sm">{a.name}</p>
                  </div>
                  {a.contactEmail && (
                    <p className="text-xs text-slate-500 mt-0.5">{a.contactEmail}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>إنشاء وكالة جديدة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>اسم الوكالة *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>البريد الإلكتروني</Label>
              <Input type="email" dir="ltr" value={form.contactEmail} onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>رقم الهاتف</Label>
              <Input dir="ltr" value={form.contactPhone} onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>العنوان</Label>
              <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>ملاحظات داخلية</Label>
              <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            <Button
              className="w-full"
              disabled={!form.name.trim() || createMut.isPending}
              onClick={() => createMut.mutate(form)}
            >
              {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "إنشاء الوكالة"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// AGENCY DETAIL — Info & Status
// ════════════════════════════════════════════════════════════════════════════════
function AgencyInfoTab({ agency, onUpdated }: { agency: Agency; onUpdated: (a: Agency) => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: agency.name,
    contactEmail: agency.contactEmail ?? "",
    contactPhone: agency.contactPhone ?? "",
    address: agency.address ?? "",
    notes: agency.notes ?? "",
  });

  const patchMut = useMutation({
    mutationFn: (body: object) => apiFetch(`/agencies/${agency.id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: (row: Agency) => {
      qc.invalidateQueries({ queryKey: ["admin-agencies"] });
      onUpdated(row);
      toast({ title: "تم حفظ التعديلات" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: e.message }),
  });

  const setStatus = (status: Agency["status"]) => patchMut.mutate({ status });

  return (
    <div className="space-y-6">
      {/* Status actions */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">حالة الوكالة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {agency.status !== "active" && (
                <Button size="sm" variant="outline" className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 gap-1.5"
                  disabled={patchMut.isPending} onClick={() => setStatus("active")}>
                  <CheckCircle2 className="h-3.5 w-3.5" /> تفعيل
                </Button>
              )}
              {agency.status !== "suspended" && (
                <Button size="sm" variant="outline" className="text-red-700 border-red-300 hover:bg-red-50 gap-1.5"
                  disabled={patchMut.isPending} onClick={() => setStatus("suspended")}>
                  <XCircle className="h-3.5 w-3.5" /> إيقاف
                </Button>
              )}
              {agency.status !== "pending" && (
                <Button size="sm" variant="outline" className="text-amber-700 border-amber-300 hover:bg-amber-50 gap-1.5"
                  disabled={patchMut.isPending} onClick={() => setStatus("pending")}>
                  <RotateCcw className="h-3.5 w-3.5" /> قيد الاعتماد
                </Button>
              )}
            </div>
            <AgencyBadge status={agency.status} />
          </div>
          {agency.status === "suspended" && (
            <p className="text-xs text-red-600 mt-2">تحذير: إيقاف الوكالة يُلغي جلسات جميع وكلائها فوراً.</p>
          )}
        </CardContent>
      </Card>

      {/* Edit form */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">بيانات الوكالة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>اسم الوكالة *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>البريد الإلكتروني</Label>
              <Input dir="ltr" type="email" value={form.contactEmail} onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>رقم الهاتف</Label>
              <Input dir="ltr" value={form.contactPhone} onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>العنوان</Label>
              <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>ملاحظات داخلية</Label>
            <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          <Button disabled={!form.name.trim() || patchMut.isPending} onClick={() => patchMut.mutate(form)}>
            {patchMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "حفظ التعديلات"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// AGENCY DETAIL — Agents
// ════════════════════════════════════════════════════════════════════════════════
function AgentsTab({ agencyId }: { agencyId: number }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [showReset, setShowReset] = useState<Agent | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });

  const { data: agents = [], isLoading } = useQuery<Agent[]>({
    queryKey: ["admin-agency-agents", agencyId],
    queryFn: () => apiFetch(`/agencies/${agencyId}/agents`),
  });

  const createMut = useMutation({
    mutationFn: (body: typeof form) => apiFetch(`/agencies/${agencyId}/agents`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-agency-agents", agencyId] });
      setShowAdd(false);
      setForm({ firstName: "", lastName: "", email: "", phone: "", password: "" });
      toast({ title: "تم إنشاء حساب الوكيل" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: e.message }),
  });

  const resetMut = useMutation({
    mutationFn: ({ agentId, password }: { agentId: string; password: string }) =>
      apiFetch(`/agents/${agentId}/reset-password`, { method: "POST", body: JSON.stringify({ password }) }),
    onSuccess: () => {
      setShowReset(null);
      setNewPassword("");
      toast({ title: "تم تغيير كلمة المرور" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: e.message }),
  });

  const toggleMut = useMutation({
    mutationFn: ({ agentId, isActive }: { agentId: string; isActive: boolean }) =>
      apiFetch(`/agents/${agentId}`, { method: "PATCH", body: JSON.stringify({ isActive }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-agency-agents", agencyId] }),
    onError: (e: Error) => toast({ variant: "destructive", title: e.message }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">حسابات الوكلاء</h3>
        <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> وكيل جديد
        </Button>
      </div>

      {isLoading ? <Spinner /> : agents.length === 0 ? (
        <div className="text-sm text-slate-400 text-center py-8">لا توجد حسابات وكلاء لهذه الوكالة</div>
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-right font-medium text-slate-600">الوكيل</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">البريد / الجوال</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">آخر دخول</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">الحالة</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((ag) => (
                <tr key={ag.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {`${ag.firstName ?? ""} ${ag.lastName ?? ""}`.trim() || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs" dir="ltr">
                    {ag.email ?? ag.phone ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {ag.lastLoginAt ? new Date(ag.lastLoginAt).toLocaleDateString("ar-SA") : "لم يدخل بعد"}
                  </td>
                  <td className="px-4 py-3">
                    {ag.isActive !== false ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-0 text-xs">نشط</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800 border-0 text-xs">موقوف</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-500"
                        title="إعادة تعيين كلمة المرور"
                        onClick={() => { setShowReset(ag); setNewPassword(""); }}>
                        <KeyRound className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost"
                        className={`h-7 w-7 p-0 ${ag.isActive !== false ? "text-red-500" : "text-emerald-600"}`}
                        title={ag.isActive !== false ? "إيقاف الحساب" : "تفعيل الحساب"}
                        disabled={toggleMut.isPending}
                        onClick={() => toggleMut.mutate({ agentId: ag.id, isActive: ag.isActive === false })}>
                        {ag.isActive !== false ? <ShieldOff className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Agent Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader><DialogTitle>إضافة وكيل جديد</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>الاسم الأول *</Label>
                <Input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>الاسم الأخير</Label>
                <Input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>البريد الإلكتروني</Label>
              <Input dir="ltr" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>رقم الجوال</Label>
              <Input dir="ltr" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>كلمة المرور * (8 أحرف كحد أدنى)</Label>
              <Input type="password" dir="ltr" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
            </div>
            <p className="text-xs text-slate-500">يجب توفير البريد الإلكتروني أو رقم الجوال.</p>
            <Button className="w-full"
              disabled={!form.firstName || form.password.length < 8 || (!form.email && !form.phone) || createMut.isPending}
              onClick={() => createMut.mutate(form)}>
              {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "إنشاء الحساب"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!showReset} onOpenChange={(v) => !v && setShowReset(null)}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader>
            <DialogTitle>إعادة تعيين كلمة المرور</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-600">
              الوكيل: <strong>{`${showReset?.firstName ?? ""} ${showReset?.lastName ?? ""}`.trim()}</strong>
            </p>
            <div className="space-y-1.5">
              <Label>كلمة المرور الجديدة *</Label>
              <Input type="password" dir="ltr" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)} placeholder="8 أحرف على الأقل" />
            </div>
            <Button className="w-full"
              disabled={newPassword.length < 8 || resetMut.isPending || !showReset}
              onClick={() => showReset && resetMut.mutate({ agentId: showReset.id, password: newPassword })}>
              {resetMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "تغيير كلمة المرور"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// AGENCY DETAIL — Visa Services
// ════════════════════════════════════════════════════════════════════════════════
function VisaServicesTab({ agencyId }: { agencyId: number }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [searchV, setSearchV] = useState("");

  const { data: allVisas = [], isLoading: loadingVisas } = useQuery<Visa[]>({
    queryKey: ["admin-all-visas"],
    queryFn: () => apiFetch("/visas"),
  });

  const { data: services = [], isLoading: loadingServices } = useQuery<VisaService[]>({
    queryKey: ["admin-agency-services", agencyId],
    queryFn: () => apiFetch(`/agencies/${agencyId}/visa-services`),
  });

  // Local editable map: visaId → { enabled, agentPrice, currency }
  const [local, setLocal] = useState<Record<number, { enabled: boolean; agentPrice: string; currency: string }>>({});

  // Merge API data into local state (once loaded)
  const serviceMap: Record<number, VisaService> = {};
  for (const s of services) serviceMap[s.visaId] = s;

  const getRow = (visaId: number, currency: string) => {
    if (local[visaId] !== undefined) return local[visaId];
    const s = serviceMap[visaId];
    return s ? { enabled: s.enabled, agentPrice: s.agentPrice, currency: s.currency } : { enabled: false, agentPrice: "", currency };
  };

  const saveMut = useMutation({
    mutationFn: (svcList: { visaId: number; enabled: boolean; agentPrice: string; currency: string }[]) =>
      apiFetch(`/agencies/${agencyId}/visa-services`, {
        method: "PUT",
        body: JSON.stringify({ services: svcList.map((s) => ({ ...s, agentPrice: Number(s.agentPrice) || 0 })) }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-agency-services", agencyId] });
      setLocal({});
      toast({ title: "تم حفظ الخدمات" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: e.message }),
  });

  const activeVisas = allVisas.filter((v) => v.isActive);
  const filtered = activeVisas.filter((v) =>
    v.countryAr.includes(searchV) || v.countryEn.toLowerCase().includes(searchV.toLowerCase()) || v.visaType.toLowerCase().includes(searchV.toLowerCase())
  );

  const handleSave = () => {
    const svcList = activeVisas.map((v) => {
      const r = getRow(v.id, v.currency);
      return { visaId: v.id, enabled: r.enabled, agentPrice: r.agentPrice, currency: r.currency };
    });
    saveMut.mutate(svcList);
  };

  const hasChanges = Object.keys(local).length > 0;

  if (loadingVisas || loadingServices) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-slate-800">خدمات التأشيرة وتسعير الوكالة</h3>
        <Button size="sm" disabled={!hasChanges || saveMut.isPending} onClick={handleSave}>
          {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "حفظ التعديلات"}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
        <Input className="pr-9" dir="rtl" placeholder="بحث بالدولة أو نوع التأشيرة…"
          value={searchV} onChange={(e) => setSearchV(e.target.value)} />
      </div>

      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-right font-medium text-slate-600 w-8">مفعّل</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">الدولة والنوع</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600">سعر العميل</th>
              <th className="px-4 py-3 text-right font-medium text-slate-600 w-40">سعر الوكالة</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => {
              const row = getRow(v.id, v.currency);
              return (
                <tr key={v.id} className={`border-b border-slate-100 last:border-0 transition-colors ${row.enabled ? "bg-white" : "bg-slate-50/60"}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={row.enabled}
                      className="h-4 w-4 accent-primary cursor-pointer"
                      onChange={(e) => setLocal((l) => ({ ...l, [v.id]: { ...row, enabled: e.target.checked } }))}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{v.countryAr}</p>
                    <p className="text-xs text-slate-500">{v.visaType}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {v.fee} {v.currency}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min="0"
                        dir="ltr"
                        className="h-8 w-24 text-sm"
                        disabled={!row.enabled}
                        value={row.agentPrice}
                        placeholder={String(v.fee)}
                        onChange={(e) => setLocal((l) => ({ ...l, [v.id]: { ...row, agentPrice: e.target.value } }))}
                      />
                      <span className="text-xs text-slate-500">{row.currency}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {hasChanges && (
        <p className="text-xs text-amber-700 text-right">لديك تعديلات غير محفوظة — اضغط "حفظ التعديلات"</p>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// AGENCY DETAIL — Applications
// ════════════════════════════════════════════════════════════════════════════════
function AgencyAppsTab({ agencyId }: { agencyId: number }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState<AgentApp | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [notes, setNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");

  const { data: apps = [], isLoading } = useQuery<AgentApp[]>({
    queryKey: ["admin-agent-apps", agencyId],
    queryFn: () => apiFetch(`/agent-applications?agencyId=${agencyId}`),
    refetchInterval: 30000,
  });

  const patchMut = useMutation({
    mutationFn: ({ id, body }: { id: number; body: object }) =>
      apiFetch(`/agent-applications/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: (row: AgentApp) => {
      qc.invalidateQueries({ queryKey: ["admin-agent-apps", agencyId] });
      setOpen(row);
      toast({ title: "تم تحديث الطلب" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: e.message }),
  });

  const filtered = apps.filter((a) => statusFilter === "all" || a.status === statusFilter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">طلبات التأشيرة ({apps.length})</h3>
        <div className="flex gap-1.5 flex-wrap justify-end">
          {["all", "received", "under_review", "issued", "rejected"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1 text-xs border transition-colors ${statusFilter === s ? "bg-primary text-white border-primary" : "border-slate-200 text-slate-600 hover:border-primary"}`}>
              {s === "all" ? "الكل" : APP_STATUS[s]?.ar ?? s}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <Spinner /> : filtered.length === 0 ? (
        <div className="text-sm text-slate-400 text-center py-8">لا توجد طلبات</div>
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-right font-medium text-slate-600">رقم الطلب</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">المتقدم</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">الوجهة</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">الحالة</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer"
                  onClick={() => { setOpen(a); setNewStatus(a.status); setNotes(a.adminNotes ?? ""); }}>
                  <td className="px-4 py-3 font-mono font-medium text-primary text-xs">{a.trackingNumber}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{a.fullName}</td>
                  <td className="px-4 py-3 text-slate-600">{a.countryAr} · {a.visaType}</td>
                  <td className="px-4 py-3"><AppBadge status={a.status} /></td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {new Date(a.createdAt).toLocaleDateString("ar-SA")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Application detail dialog */}
      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent dir="rtl" className="max-w-lg">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-mono text-primary text-sm">
                  {open.trackingNumber}
                  <AppBadge status={open.status} />
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div><span className="text-slate-500">المتقدم: </span><span className="font-medium">{open.fullName}</span></div>
                  <div><span className="text-slate-500">الوجهة: </span><span className="font-medium">{open.countryAr} · {open.visaType}</span></div>
                  <div><span className="text-slate-500">الوكيل: </span><span className="font-medium">{open.agentName ?? "—"}</span></div>
                  <div><span className="text-slate-500">السعر: </span><span className="font-medium">{open.agentPrice ?? "—"}</span></div>
                  <div><span className="text-slate-500">التاريخ: </span><span className="font-medium">{new Date(open.createdAt).toLocaleDateString("ar-SA")}</span></div>
                </div>

                {/* Status update */}
                <div className="space-y-1.5">
                  <Label className="text-xs">تحديث الحالة</Label>
                  <select
                    dir="rtl"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {APP_STATUS_KEYS.map((k) => (
                      <option key={k} value={k}>{APP_STATUS[k].ar}</option>
                    ))}
                  </select>
                </div>

                {/* Admin notes */}
                <div className="space-y-1.5">
                  <Label className="text-xs">ملاحظات (تُرسل للوكيل)</Label>
                  <textarea
                    dir="rtl"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    placeholder="ملاحظات اختيارية…"
                  />
                </div>

                {/* Download issued visa */}
                {open.issuedVisaUrl && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <Download className="h-4 w-4 text-emerald-700" />
                    <a
                      href={`${API}/storage/objects/${open.issuedVisaUrl.replace(/^\/objects\//, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-800 text-xs font-medium hover:underline"
                    >
                      تحميل التأشيرة الصادرة
                    </a>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    disabled={patchMut.isPending}
                    onClick={() => patchMut.mutate({ id: open.id, body: { status: newStatus, adminNotes: notes } })}
                  >
                    {patchMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "حفظ"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setOpen(null)}>إغلاق</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// ALL AGENT APPLICATIONS (global view, no agency filter)
// ════════════════════════════════════════════════════════════════════════════════
function AllAppsView() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState<AgentApp | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [notes, setNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [search, setSearch] = useState("");

  const { data: apps = [], isLoading } = useQuery<AgentApp[]>({
    queryKey: ["admin-all-agent-apps"],
    queryFn: () => apiFetch("/agent-applications"),
    refetchInterval: 30000,
  });

  const patchMut = useMutation({
    mutationFn: ({ id, body }: { id: number; body: object }) =>
      apiFetch(`/agent-applications/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: (row: AgentApp) => {
      qc.invalidateQueries({ queryKey: ["admin-all-agent-apps"] });
      setOpen(row);
      toast({ title: "تم تحديث الطلب" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: e.message }),
  });

  const filtered = apps.filter((a) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (a.trackingNumber ?? "").toLowerCase().includes(q) ||
        (a.fullName ?? "").toLowerCase().includes(q) ||
        (a.agencyName ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-900">جميع طلبات الوكلاء ({apps.length})</h2>
        <div className="relative">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input className="pr-9 w-56" dir="rtl" placeholder="بحث…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {["all", "received", "under_review", "awaiting_documents", "issued", "rejected"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs border transition-colors ${statusFilter === s ? "bg-primary text-white border-primary" : "border-slate-200 text-slate-600 hover:border-primary"}`}>
            {s === "all" ? "الكل" : APP_STATUS[s]?.ar ?? s}
          </button>
        ))}
      </div>

      {isLoading ? <Spinner /> : filtered.length === 0 ? (
        <div className="text-sm text-slate-400 text-center py-12">لا توجد طلبات</div>
      ) : (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-right font-medium text-slate-600">رقم الطلب</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">المتقدم</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">الوكالة</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">الوجهة</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">الحالة</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer"
                  onClick={() => { setOpen(a); setNewStatus(a.status); setNotes(a.adminNotes ?? ""); }}>
                  <td className="px-4 py-3 font-mono font-medium text-primary text-xs">{a.trackingNumber}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{a.fullName}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{a.agencyName ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{a.countryAr} · {a.visaType}</td>
                  <td className="px-4 py-3"><AppBadge status={a.status} /></td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(a.createdAt).toLocaleDateString("ar-SA")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent dir="rtl" className="max-w-lg">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-mono text-primary text-sm">
                  {open.trackingNumber} <AppBadge status={open.status} />
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div><span className="text-slate-500">المتقدم: </span><span className="font-medium">{open.fullName}</span></div>
                  <div><span className="text-slate-500">الوكالة: </span><span className="font-medium">{open.agencyName ?? "—"}</span></div>
                  <div><span className="text-slate-500">الوكيل: </span><span className="font-medium">{open.agentName ?? "—"}</span></div>
                  <div><span className="text-slate-500">الوجهة: </span><span className="font-medium">{open.countryAr} · {open.visaType}</span></div>
                  <div><span className="text-slate-500">السعر: </span><span className="font-medium">{open.agentPrice ?? "—"}</span></div>
                  <div><span className="text-slate-500">التاريخ: </span><span className="font-medium">{new Date(open.createdAt).toLocaleDateString("ar-SA")}</span></div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">تحديث الحالة</Label>
                  <select dir="rtl" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    {APP_STATUS_KEYS.map((k) => (
                      <option key={k} value={k}>{APP_STATUS[k].ar}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">ملاحظات (تُرسل للوكيل)</Label>
                  <textarea dir="rtl" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none resize-none focus:ring-2 focus:ring-primary/30"
                    placeholder="ملاحظات اختيارية…" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" disabled={patchMut.isPending}
                    onClick={() => patchMut.mutate({ id: open.id, body: { status: newStatus, adminNotes: notes } })}>
                    {patchMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "حفظ"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setOpen(null)}>إغلاق</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// AGENCY DETAIL PANEL (tabs: Info / Agents / Services / Applications)
// ════════════════════════════════════════════════════════════════════════════════
type AgencyTab = "info" | "agents" | "services" | "apps";

function AgencyDetailPanel({ agency, onUpdated, onClose }: {
  agency: Agency;
  onUpdated: (a: Agency) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<AgencyTab>("info");

  const tabs: { key: AgencyTab; label: string; icon: React.ReactNode }[] = [
    { key: "info",     label: "بيانات الوكالة",   icon: <Building2 className="h-4 w-4" /> },
    { key: "agents",   label: "الوكلاء",           icon: <Users className="h-4 w-4" /> },
    { key: "services", label: "خدمات التأشيرة",   icon: <Globe className="h-4 w-4" /> },
    { key: "apps",     label: "الطلبات",           icon: <FileText className="h-4 w-4" /> },
  ];

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{agency.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <AgencyBadge status={agency.status} />
            {agency.contactEmail && <span className="text-xs text-slate-500">{agency.contactEmail}</span>}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-slate-200 mb-5 gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.key ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-y-auto flex-1">
        {tab === "info"     && <AgencyInfoTab agency={agency} onUpdated={onUpdated} />}
        {tab === "agents"   && <AgentsTab agencyId={agency.id} />}
        {tab === "services" && <VisaServicesTab agencyId={agency.id} />}
        {tab === "apps"     && <AgencyAppsTab agencyId={agency.id} />}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// ROOT PAGE
// ════════════════════════════════════════════════════════════════════════════════
type View = "agencies" | "all-apps";

export default function AgenciesAdmin() {
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [view, setView] = useState<View>("agencies");

  const handleUpdated = (a: Agency) => setSelectedAgency(a);

  return (
    <div dir="rtl" className="flex flex-col h-full gap-6">
      {/* Top view toggle */}
      <div className="flex items-center gap-2">
        <button onClick={() => setView("agencies")}
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${view === "agencies" ? "bg-primary text-white border-primary" : "border-slate-200 text-slate-600 hover:border-primary"}`}>
          <Building2 className="h-3.5 w-3.5" /> الوكالات المعتمدة
        </button>
        <button onClick={() => { setView("all-apps"); setSelectedAgency(null); }}
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${view === "all-apps" ? "bg-primary text-white border-primary" : "border-slate-200 text-slate-600 hover:border-primary"}`}>
          <FileText className="h-3.5 w-3.5" /> جميع الطلبات
        </button>
      </div>

      {view === "all-apps" ? (
        <AllAppsView />
      ) : (
        <div className={`grid gap-6 flex-1 min-h-0 ${selectedAgency ? "md:grid-cols-[320px_1fr]" : "grid-cols-1 max-w-xl"}`}>
          {/* Agencies list column */}
          <div className="overflow-y-auto">
            <AgenciesList onSelect={setSelectedAgency} selected={selectedAgency} />
          </div>

          {/* Detail panel */}
          {selectedAgency && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-y-auto">
              <AgencyDetailPanel
                agency={selectedAgency}
                onUpdated={handleUpdated}
                onClose={() => setSelectedAgency(null)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
