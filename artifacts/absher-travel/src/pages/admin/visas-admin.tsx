import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Eye, EyeOff, AlertCircle, X, Globe } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

const API = "/api";

type VisaStatus = "available" | "suspended" | "closed";
type EntryType = "single" | "multiple" | "transit";

interface Visa {
  id: number;
  countryAr: string;
  countryEn: string;
  countryCode?: string;
  visaType: string;
  requirements: string;
  documents?: string;
  notes?: string;
  processingDays: number;
  fee: number;
  currency: string;
  stayDuration?: number;
  validityDays?: number;
  entryType: EntryType;
  entryCount?: number;
  allowedNationalities: string[];
  imageUrl?: string;
  status: VisaStatus;
  isActive: boolean;
  createdAt: string;
}

const emptyVisa = (): Omit<Visa, "id" | "createdAt"> => ({
  countryAr: "",
  countryEn: "",
  countryCode: "",
  visaType: "",
  requirements: "",
  documents: "",
  notes: "",
  processingDays: 5,
  fee: 0,
  currency: "SAR",
  stayDuration: undefined,
  validityDays: undefined,
  entryType: "single",
  entryCount: undefined,
  allowedNationalities: [],
  imageUrl: "",
  status: "available",
  isActive: true,
});

const STATUS_LABELS: Record<VisaStatus, { ar: string; en: string; color: string }> = {
  available:  { ar: "متاحة",        en: "Available",   color: "bg-green-100 text-green-700" },
  suspended:  { ar: "متوقفة مؤقتاً", en: "Suspended",  color: "bg-yellow-100 text-yellow-700" },
  closed:     { ar: "مغلقة",        en: "Closed",      color: "bg-red-100 text-red-700" },
};

const ENTRY_TYPE_LABELS: Record<EntryType, { ar: string; en: string }> = {
  single:   { ar: "دخول واحد",   en: "Single Entry" },
  multiple: { ar: "دخول متعدد",  en: "Multiple Entry" },
  transit:  { ar: "عبور",        en: "Transit" },
};

function VisaForm({
  initial,
  onSave,
  onCancel,
  loading,
}: {
  initial: Omit<Visa, "id" | "createdAt">;
  onSave: (data: Omit<Visa, "id" | "createdAt">) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const { language } = useTranslation();
  const ar = language === "ar";
  const [form, setForm] = useState(initial);
  const [tab, setTab] = useState<"basic" | "details" | "access">("basic");
  const set = (field: string, value: unknown) => setForm(f => ({ ...f, [field]: value }));

  const tabs = [
    { id: "basic",   ar: "المعلومات الأساسية", en: "Basic Info" },
    { id: "details", ar: "تفاصيل التأشيرة",    en: "Visa Details" },
    { id: "access",  ar: "الوصول والشروط",     en: "Access & Terms" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-slate-800">{ar ? "تفاصيل التأشيرة" : "Visa Details"}</h2>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex border-b overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as typeof tab)}
              className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${tab === t.id ? "border-b-2 border-primary text-primary" : "text-slate-500 hover:text-slate-700"}`}
            >
              {ar ? t.ar : t.en}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-5">
          {tab === "basic" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "اسم الدولة بالعربية" : "Country (Arabic)"} *</label>
                <input className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.countryAr} onChange={e => set("countryAr", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "اسم الدولة بالإنجليزية" : "Country (English)"} *</label>
                <input className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.countryEn} onChange={e => set("countryEn", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "رمز الدولة (ISO)" : "Country Code (ISO)"}</label>
                <input placeholder="e.g. UAE, FR, US" maxLength={3} className="w-full border rounded-xl px-4 py-2.5 text-sm uppercase" value={form.countryCode ?? ""} onChange={e => set("countryCode", e.target.value.toUpperCase())} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "نوع التأشيرة" : "Visa Type"} *</label>
                <input placeholder={ar ? "مثال: سياحية، عمل، دراسة" : "e.g. Tourist, Business, Student"} className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.visaType} onChange={e => set("visaType", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "الرسوم" : "Fee"} *</label>
                <input type="number" min={0} className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.fee} onChange={e => set("fee", Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "العملة" : "Currency"}</label>
                <select className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.currency} onChange={e => set("currency", e.target.value)}>
                  <option value="SAR">SAR - ريال سعودي</option>
                  <option value="USD">USD - دولار</option>
                  <option value="AED">AED - درهم</option>
                  <option value="EGP">EGP - جنيه مصري</option>
                  <option value="EUR">EUR - يورو</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "مدة المعالجة (أيام)" : "Processing Days"} *</label>
                <input type="number" min={1} className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.processingDays} onChange={e => set("processingDays", Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "حالة التأشيرة" : "Visa Status"}</label>
                <select className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.status} onChange={e => set("status", e.target.value as VisaStatus)}>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{ar ? v.ar : v.en}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "رابط صورة الدولة / العلم" : "Country Image / Flag URL"}</label>
                <input className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.imageUrl ?? ""} onChange={e => set("imageUrl", e.target.value)} />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" className="w-4 h-4 accent-primary" id="visaActive" checked={form.isActive} onChange={e => set("isActive", e.target.checked)} />
                <label htmlFor="visaActive" className="text-sm font-medium cursor-pointer">{ar ? "مفعّلة للعرض في الموقع" : "Active & visible on website"}</label>
              </div>
            </div>
          )}

          {tab === "details" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "مدة الإقامة (أيام)" : "Stay Duration (days)"}</label>
                <input type="number" min={1} className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.stayDuration ?? ""} onChange={e => set("stayDuration", e.target.value ? Number(e.target.value) : undefined)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "مدة صلاحية التأشيرة (أيام)" : "Visa Validity (days)"}</label>
                <input type="number" min={1} className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.validityDays ?? ""} onChange={e => set("validityDays", e.target.value ? Number(e.target.value) : undefined)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "نوع الدخول" : "Entry Type"}</label>
                <select className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.entryType} onChange={e => set("entryType", e.target.value as EntryType)}>
                  {Object.entries(ENTRY_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{ar ? v.ar : v.en}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "عدد مرات الدخول" : "Entry Count"}</label>
                <input type="number" min={1} className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.entryCount ?? ""} onChange={e => set("entryCount", e.target.value ? Number(e.target.value) : undefined)} placeholder={ar ? "اتركه فارغاً إذا غير محدد" : "Leave blank if unlimited"} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "المتطلبات" : "Requirements"}</label>
                <textarea rows={4} className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.requirements} onChange={e => set("requirements", e.target.value)} placeholder={ar ? "المستندات المطلوبة والشروط..." : "Required documents and conditions..."} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "المستندات المطلوبة" : "Required Documents"}</label>
                <textarea rows={4} className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.documents ?? ""} onChange={e => set("documents", e.target.value)} placeholder={ar ? "قائمة المستندات..." : "Document list..."} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "ملاحظات" : "Notes"}</label>
                <textarea rows={3} className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.notes ?? ""} onChange={e => set("notes", e.target.value)} placeholder={ar ? "ملاحظات إضافية..." : "Additional notes..."} />
              </div>
            </div>
          )}

          {tab === "access" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{ar ? "الجنسيات المسموح لها بالتقديم (سطر لكل جنسية)" : "Allowed Nationalities (one per line)"}</label>
              <textarea
                rows={10}
                className="w-full border rounded-xl px-4 py-2.5 text-sm"
                value={form.allowedNationalities.join("\n")}
                onChange={e => set("allowedNationalities", e.target.value.split("\n").map(s => s.trim()).filter(Boolean))}
                placeholder={ar ? "مثال:\nسعودي\nإماراتي\nمصري\n\nاتركه فارغاً للسماح لجميع الجنسيات" : "e.g.\nSaudi\nEmirati\nEgyptian\n\nLeave empty to allow all nationalities"}
              />
              <p className="text-xs text-slate-400 mt-2">
                {form.allowedNationalities.length === 0
                  ? (ar ? "✓ مسموح لجميع الجنسيات" : "✓ All nationalities allowed")
                  : `${form.allowedNationalities.length} ${ar ? "جنسية محددة" : "nationalities specified"}`
                }
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t justify-end">
          <button onClick={onCancel} className="px-6 py-2.5 border rounded-xl text-slate-600 hover:bg-slate-50 text-sm">{ar ? "إلغاء" : "Cancel"}</button>
          <button
            onClick={() => onSave(form)}
            disabled={loading || !form.countryAr || !form.countryEn || !form.visaType || !form.processingDays}
            className="px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 text-sm font-medium"
          >
            {loading ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "حفظ التأشيرة" : "Save Visa")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VisasAdmin() {
  const { language } = useTranslation();
  const ar = language === "ar";
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Visa | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const { data: visas = [], isLoading } = useQuery<Visa[]>({
    queryKey: ["admin-visas"],
    queryFn: () => fetch(`${API}/visas`).then(r => r.json()),
  });

  const createMut = useMutation({
    mutationFn: (body: object) => fetch(`${API}/visas`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-visas"] }); setCreating(false); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: number; body: object }) =>
      fetch(`${API}/visas/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-visas"] }); setEditing(null); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => fetch(`${API}/visas/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-visas"] }); setDeleteConfirm(null); },
  });

  const toggleActive = (v: Visa) => updateMut.mutate({ id: v.id, body: { isActive: !v.isActive } });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{ar ? "إدارة التأشيرات" : "Visa Management"}</h1>
          <p className="text-slate-500 text-sm mt-1">{visas.length} {ar ? "دولة" : "countries"}</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl hover:bg-primary/90 font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          {ar ? "تأشيرة جديدة" : "New Visa"}
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visas.map(v => {
          const statusMeta = STATUS_LABELS[v.status] ?? STATUS_LABELS.available;
          const entryMeta = ENTRY_TYPE_LABELS[v.entryType];
          const flagEmoji = v.countryCode ? String.fromCodePoint(...v.countryCode.toUpperCase().split("").map(c => c.charCodeAt(0) + 127397)) : "🌐";

          return (
            <div key={v.id} className={`bg-white rounded-2xl shadow-sm border p-5 ${!v.isActive ? "opacity-60 border-slate-100" : "border-slate-100 hover:border-primary/20"} transition-all`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center bg-slate-50 text-2xl">
                    {v.imageUrl ? <img src={v.imageUrl} alt="" className="w-full h-full object-cover" /> : flagEmoji}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{ar ? v.countryAr : v.countryEn}</h3>
                    <p className="text-sm text-slate-500">{v.visaType}</p>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => setEditing(v)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => toggleActive(v)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
                    {v.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                  </button>
                  <button onClick={() => setDeleteConfirm(v.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusMeta.color}`}>{ar ? statusMeta.ar : statusMeta.en}</span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 font-bold">{v.currency} {v.fee.toLocaleString()}</span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">⏱ {v.processingDays} {ar ? "أيام" : "days"}</span>
                {entryMeta && <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">{ar ? entryMeta.ar : entryMeta.en}</span>}
                {v.stayDuration && <span className="text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-600">{v.stayDuration} {ar ? "يوم إقامة" : "days stay"}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {visas.length === 0 && !isLoading && (
        <div className="text-center py-20 text-slate-400">
          <Globe className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="font-medium">{ar ? "لا توجد تأشيرات بعد" : "No visas yet"}</p>
        </div>
      )}

      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">{ar ? "تأكيد الحذف" : "Confirm Delete"}</h3>
                <p className="text-sm text-slate-500">{ar ? "سيتم حذف التأشيرة نهائياً" : "This visa entry will be permanently deleted"}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border rounded-xl text-slate-600 hover:bg-slate-50 text-sm">{ar ? "إلغاء" : "Cancel"}</button>
              <button onClick={() => deleteMut.mutate(deleteConfirm!)} disabled={deleteMut.isPending} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 text-sm font-medium disabled:opacity-50">
                {deleteMut.isPending ? "..." : (ar ? "حذف" : "Delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {creating && (
        <VisaForm
          initial={emptyVisa()}
          onSave={(data) => createMut.mutate(data)}
          onCancel={() => setCreating(false)}
          loading={createMut.isPending}
        />
      )}

      {editing && (
        <VisaForm
          initial={editing}
          onSave={(data) => updateMut.mutate({ id: editing.id, body: data })}
          onCancel={() => setEditing(null)}
          loading={updateMut.isPending}
        />
      )}
    </div>
  );
}
