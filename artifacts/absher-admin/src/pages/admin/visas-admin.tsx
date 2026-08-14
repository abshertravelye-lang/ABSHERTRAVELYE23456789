import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListVisas, useCreateVisa, useUpdateVisa, useDeleteVisa, getListVisasQueryKey,
  useListVisaCountries, useListVisaCustomFields, useCreateVisaCustomField, useUpdateVisaCustomField, useDeleteVisaCustomField,
  getListVisaCustomFieldsQueryKey,
  useListVisaRequiredDocuments, useCreateVisaRequiredDocument, useUpdateVisaRequiredDocument, useDeleteVisaRequiredDocument,
  getListVisaRequiredDocumentsQueryKey,
} from "@workspace/api-client-react";
import { useTranslation } from "@/hooks/use-translation";
import { Plus, Edit2, Trash2, X, Globe, ChevronDown, ChevronRight, Upload, Image as ImageIcon, CheckCircle2, ShieldCheck, FileText, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { COUNTRIES } from "@workspace/countries";

// ── Canonical world country list (shared with profile + eligibility engine) ──
const ALL_COUNTRIES = COUNTRIES.map(c => ({ code: c.code, en: c.nameEn, ar: c.nameAr }));

const GCC_COUNTRIES = ["Saudi Arabia", "United Arab Emirates", "Kuwait", "Qatar", "Bahrain", "Oman"];
const GCC_LABELS: Record<string, string> = {
  "Saudi Arabia": "المملكة العربية السعودية",
  "United Arab Emirates": "الإمارات العربية المتحدة",
  "Kuwait": "الكويت",
  "Qatar": "قطر",
  "Bahrain": "البحرين",
  "Oman": "عُمان",
};

const CATEGORIES = [
  { value: "tourist",  ar: "سياحية",  en: "Tourist" },
  { value: "business", ar: "تجارية",  en: "Business" },
  { value: "medical",  ar: "طبية",    en: "Medical" },
  { value: "visit",    ar: "زيارة",   en: "Visit" },
  { value: "study",    ar: "دراسية",  en: "Study" },
  { value: "umrah",    ar: "عمرة",    en: "Umrah" },
];
const ENTRY_TYPES = [
  { value: "single",   ar: "دخول واحد",   en: "Single" },
  { value: "multiple", ar: "دخول متعدد",  en: "Multiple" },
  { value: "transit",  ar: "عبور",        en: "Transit" },
];
const FIELD_TYPES = [
  { value: "text",     ar: "نص",         en: "Text" },
  { value: "textarea", ar: "نص طويل",    en: "Long text" },
  { value: "number",   ar: "رقم",        en: "Number" },
  { value: "select",   ar: "قائمة",      en: "Select" },
  { value: "boolean",  ar: "نعم/لا",     en: "Yes/No" },
  { value: "date",     ar: "تاريخ",      en: "Date" },
];

const EU_SCHENGEN_OPTIONS = [
  { value: "neither",       ar: "غير مطلوب",                           en: "Not Required" },
  { value: "european_only", ar: "إقامة أوروبية فقط (EU/UK)",           en: "European Residency Only" },
  { value: "schengen_only", ar: "تأشيرة شنغن/بريطانية فقط",           en: "Schengen/UK Visa Only" },
  { value: "either",        ar: "إقامة أوروبية أو تأشيرة شنغن",       en: "European Residency OR Schengen Visa" },
  { value: "both",          ar: "إقامة أوروبية وتأشيرة شنغن معاً",    en: "Both Required" },
];

// ── Storage upload helper ──────────────────────────────────────────────────
async function uploadFile(file: File): Promise<string | null> {
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
  const fd = new FormData();
  fd.append("file", file);
  try {
    const res = await fetch(`${base}/api/storage/uploads`, { method: "POST", body: fd });
    if (!res.ok) return null;
    const json = await res.json();
    return json.objectPath ?? json.url ?? null;
  } catch {
    return null;
  }
}

function getDisplayUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
  return `${base}/api/storage/object/${path}`;
}

// ── NationalityPicker (searchable multi-select) ───────────────────────────
function NationalityPicker({
  value: valueProp, onChange, placeholder, ar,
}: { value: string[]; onChange: (v: string[]) => void; placeholder?: string; ar: boolean }) {
  const value = valueProp ?? [];
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = ALL_COUNTRIES.filter(c =>
    c.en.toLowerCase().includes(search.toLowerCase()) ||
    c.ar.includes(search)
  ).slice(0, 60);

  const toggle = (en: string) => {
    if (value.includes(en)) onChange(value.filter(v => v !== en));
    else onChange([...value, en]);
  };

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-100 min-h-[40px]">
          {value.map(v => {
            const c = ALL_COUNTRIES.find(c => c.en === v);
            return (
              <span key={v} className="flex items-center gap-1 bg-[#0d2351] text-white text-xs px-2 py-1 rounded-lg">
                {ar ? (c?.ar || v) : v}
                <button type="button" onClick={() => toggle(v)} className="hover:text-red-300 ml-1">×</button>
              </span>
            );
          })}
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs text-red-500 hover:underline px-1"
          >
            {ar ? "مسح الكل" : "Clear all"}
          </button>
        </div>
      )}
      <div className="relative">
        <input
          className="w-full border rounded-xl px-4 py-2.5 text-sm"
          placeholder={placeholder || (ar ? "ابحث عن دولة..." : "Search country...")}
          value={search}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          onChange={e => { setSearch(e.target.value); setOpen(true); }}
          dir="auto"
        />
        {open && (
          <div className="absolute top-full left-0 right-0 z-50 bg-white border rounded-xl shadow-xl max-h-52 overflow-y-auto mt-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-xs text-slate-400">{ar ? "لا توجد نتائج" : "No results"}</div>
            ) : filtered.map(c => (
              <button
                key={c.code}
                type="button"
                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center justify-between ${value.includes(c.en) ? "bg-[#0d2351]/5 text-[#0d2351] font-medium" : ""}`}
                onMouseDown={() => { toggle(c.en); setSearch(""); }}
              >
                <span dir="auto">{ar ? `${c.ar}` : c.en} <span className="text-slate-400 text-xs">({ar ? c.en : c.ar})</span></span>
                {value.includes(c.en) && <CheckCircle2 className="w-4 h-4 text-[#0d2351] shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>
      {value.length > 0 && (
        <p className="text-xs text-slate-400">{value.length} {ar ? "دولة محددة" : "countries selected"}</p>
      )}
    </div>
  );
}

// ── Visa Image Upload ──────────────────────────────────────────────────────
function VisaImageUpload({ value, onChange, ar }: { value: string; onChange: (v: string) => void; ar: boolean }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    const path = await uploadFile(file);
    setUploading(false);
    if (path) {
      onChange(path);
      toast.success(ar ? "تم رفع الصورة بنجاح" : "Image uploaded successfully");
    } else {
      toast.error(ar ? "فشل رفع الصورة" : "Image upload failed");
    }
  };

  if (value) {
    return (
      <div className="border-2 border-slate-200 rounded-xl overflow-hidden">
        <img src={getDisplayUrl(value)} className="w-full h-44 object-cover bg-slate-100" />
        <div className="flex items-center justify-between p-3 bg-slate-50">
          <p className="text-xs text-slate-500 truncate" dir="ltr">{value.split("/").pop()}</p>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-xs text-[#0d2351] hover:underline font-medium"
            >
              {ar ? "استبدال" : "Replace"}
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-xs text-red-500 hover:underline"
            >
              {ar ? "حذف" : "Remove"}
            </button>
          </div>
        </div>
        <input ref={inputRef} type="file" className="hidden" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>
    );
  }

  return (
    <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-300 rounded-xl p-8 cursor-pointer hover:border-[#0d2351]/50 hover:bg-[#0d2351]/3 transition-colors">
      <input type="file" className="hidden" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} disabled={uploading} />
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-[#0d2351]/20 border-t-[#0d2351] rounded-full animate-spin" />
          <p className="text-sm text-slate-500">{ar ? "جاري الرفع..." : "Uploading..."}</p>
        </div>
      ) : (
        <>
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
            <ImageIcon className="w-7 h-7 text-slate-400" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-sm text-slate-700">{ar ? "اضغط لرفع صورة التأشيرة" : "Click to upload visa image"}</p>
            <p className="text-xs text-slate-400 mt-1">{ar ? "PNG, JPG, WEBP حتى 10MB" : "PNG, JPG, WEBP up to 10MB"}</p>
          </div>
          <div className="flex items-center gap-2 text-[#0d2351] text-xs font-semibold bg-[#0d2351]/10 px-4 py-2 rounded-xl">
            <Upload className="w-4 h-4" />
            {ar ? "اختر ملفاً" : "Choose File"}
          </div>
        </>
      )}
    </label>
  );
}

// ── Custom Fields Panel ────────────────────────────────────────────────────
function CustomFieldsPanel({ visaId, ar }: { visaId: number; ar: boolean }) {
  const qc = useQueryClient();
  const { data: fields = [] } = useListVisaCustomFields(visaId);
  const createMut = useCreateVisaCustomField();
  const updateMut = useUpdateVisaCustomField();
  const deleteMut = useDeleteVisaCustomField();
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ labelAr: "", labelEn: "", fieldType: "text", isRequired: false, options: "", placeholderAr: "", placeholderEn: "", sortOrder: 0 });
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const invalidate = () => qc.invalidateQueries({ queryKey: getListVisaCustomFieldsQueryKey(visaId) });

  async function save() {
    try {
      const payload = { ...form, visaId, options: form.options ? form.options.split(",").map(s => s.trim()) : [] };
      if (editId !== null) {
        await updateMut.mutateAsync({ id: editId, data: payload as never });
      } else {
        await createMut.mutateAsync({ id: visaId, data: payload as never });
      }
      await invalidate();
      setAdding(false); setEditId(null);
      setForm({ labelAr: "", labelEn: "", fieldType: "text", isRequired: false, options: "", placeholderAr: "", placeholderEn: "", sortOrder: 0 });
      toast.success(ar ? "تم حفظ الحقل بنجاح" : "Field saved successfully");
    } catch {
      toast.error(ar ? "حدث خطأ أثناء الحفظ" : "Error saving field");
    }
  }

  return (
    <div className="mt-4 border-t pt-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-muted-foreground">{ar ? "الحقول المخصصة" : "Custom Fields"}</span>
        <button onClick={() => { setAdding(true); setEditId(null); }} className="text-xs text-primary hover:underline flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" />{ar ? "إضافة حقل" : "Add Field"}
        </button>
      </div>
      {fields.map(f => (
        <div key={f.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5 text-sm">
          <div>
            <span className="font-medium">{ar ? f.labelAr : f.labelEn}</span>
            <span className="mx-2 text-muted-foreground text-xs">({f.fieldType})</span>
            {f.isRequired && <span className="text-xs text-red-500">*</span>}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => { setEditId(f.id); setAdding(true); setForm({ labelAr: f.labelAr, labelEn: f.labelEn, fieldType: f.fieldType, isRequired: f.isRequired, options: (f.options ?? []).join(", "), placeholderAr: f.placeholderAr ?? "", placeholderEn: f.placeholderEn ?? "", sortOrder: f.sortOrder }); }} className="p-1 hover:bg-white rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
            <button onClick={async () => { await deleteMut.mutateAsync({ id: f.id }); invalidate(); }} className="p-1 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      ))}
      {fields.length === 0 && !adding && (
        <p className="text-xs text-muted-foreground italic">{ar ? "لا توجد حقول مخصصة" : "No custom fields yet"}</p>
      )}
      {adding && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">{ar ? "التسمية عربي" : "Label (Arabic)"}</label>
              <input className="w-full border rounded-lg px-3 py-1.5 text-sm" value={form.labelAr} onChange={e => set("labelAr", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{ar ? "التسمية إنجليزي" : "Label (English)"}</label>
              <input className="w-full border rounded-lg px-3 py-1.5 text-sm" value={form.labelEn} onChange={e => set("labelEn", e.target.value)} dir="ltr" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{ar ? "نوع الحقل" : "Field Type"}</label>
              <select className="w-full border rounded-lg px-3 py-1.5 text-sm bg-white" value={form.fieldType} onChange={e => set("fieldType", e.target.value)}>
                {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{ar ? t.ar : t.en}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{ar ? "الترتيب" : "Order"}</label>
              <input type="number" className="w-full border rounded-lg px-3 py-1.5 text-sm" value={form.sortOrder} onChange={e => set("sortOrder", Number(e.target.value))} />
            </div>
            {form.fieldType === "select" && (
              <div className="col-span-full">
                <label className="block text-xs font-medium mb-1">{ar ? "الخيارات (مفصولة بفاصلة)" : "Options (comma separated)"}</label>
                <input className="w-full border rounded-lg px-3 py-1.5 text-sm" value={form.options} onChange={e => set("options", e.target.value)} />
              </div>
            )}
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isReq" checked={form.isRequired} onChange={e => set("isRequired", e.target.checked)} className="w-4 h-4" />
              <label htmlFor="isReq" className="text-xs font-medium">{ar ? "مطلوب" : "Required"}</label>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setAdding(false); setEditId(null); }} className="text-xs text-muted-foreground hover:underline">{ar ? "إلغاء" : "Cancel"}</button>
            <Button size="sm" onClick={save} disabled={!form.labelAr || !form.labelEn}>{ar ? "حفظ" : "Save"}</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Required Documents Panel (dynamic per-visa document config) ──────────────
const DOC_FILE_TYPES = [
  { value: "image",     ar: "صورة",          en: "Image" },
  { value: "pdf",       ar: "PDF",           en: "PDF" },
  { value: "image_pdf", ar: "صورة أو PDF",   en: "Image or PDF" },
];
const DOC_REQUIRED_AT = [
  { value: "application_start",  ar: "عند بدء الطلب",     en: "Application Start" },
  { value: "before_submission", ar: "قبل الإرسال",       en: "Before Submission" },
  { value: "during_processing", ar: "أثناء المعالجة",    en: "During Processing" },
  { value: "optional",          ar: "اختياري",           en: "Optional" },
];

function RequiredDocumentsPanel({ visaId, ar }: { visaId: number; ar: boolean }) {
  const qc = useQueryClient();
  const { data: docs = [] } = useListVisaRequiredDocuments(visaId);
  const createMut = useCreateVisaRequiredDocument();
  const updateMut = useUpdateVisaRequiredDocument();
  const deleteMut = useDeleteVisaRequiredDocument();
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const emptyForm = { nameAr: "", nameEn: "", description: "", required: true, allowedFileType: "image_pdf", maxFileSizeMb: 10, requiredAt: "application_start", sortOrder: 0 };
  const [form, setForm] = useState(emptyForm);
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const invalidate = () => qc.invalidateQueries({ queryKey: getListVisaRequiredDocumentsQueryKey(visaId) });
  const reset = () => { setAdding(false); setEditId(null); setForm(emptyForm); };

  async function save() {
    try {
      const payload = {
        nameAr: form.nameAr,
        nameEn: form.nameEn,
        description: form.description || undefined,
        required: form.required,
        allowedFileType: form.allowedFileType,
        maxFileSizeMb: form.maxFileSizeMb ? Number(form.maxFileSizeMb) : undefined,
        requiredAt: form.requiredAt,
        sortOrder: Number(form.sortOrder) || 0,
      };
      if (editId !== null) {
        await updateMut.mutateAsync({ id: visaId, docId: editId, data: payload as never });
      } else {
        await createMut.mutateAsync({ id: visaId, data: payload as never });
      }
      await invalidate();
      reset();
      toast.success(ar ? "تم حفظ المستند بنجاح" : "Document saved successfully");
    } catch {
      toast.error(ar ? "حدث خطأ أثناء الحفظ" : "Error saving document");
    }
  }

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <div className="mt-4 border-t pt-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
          <FileText className="w-4 h-4" />{ar ? "المستندات المطلوبة" : "Required Documents"}
        </span>
        <button onClick={() => { reset(); setAdding(true); }} className="text-xs text-primary hover:underline flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" />{ar ? "إضافة مستند" : "Add Document"}
        </button>
      </div>
      {docs.map(d => {
        const ft = DOC_FILE_TYPES.find(t => t.value === d.allowedFileType);
        const ra = DOC_REQUIRED_AT.find(r => r.value === d.requiredAt);
        return (
          <div key={d.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5 text-sm">
            <div className="min-w-0">
              <span className="font-medium">{ar ? d.nameAr : d.nameEn}</span>
              {d.required
                ? <span className="ms-2 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-md">{ar ? "إلزامي" : "Required"}</span>
                : <span className="ms-2 text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md">{ar ? "اختياري" : "Optional"}</span>}
              <span className="ms-2 text-xs text-muted-foreground">{ar ? ft?.ar : ft?.en}{d.maxFileSizeMb ? ` · ${d.maxFileSizeMb}MB` : ""} · {ar ? ra?.ar : ra?.en}</span>
              {d.description && <div className="text-xs text-muted-foreground mt-0.5 truncate">{d.description}</div>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => { setEditId(d.id); setAdding(true); setForm({ nameAr: d.nameAr, nameEn: d.nameEn, description: d.description ?? "", required: d.required, allowedFileType: d.allowedFileType, maxFileSizeMb: d.maxFileSizeMb ?? 10, requiredAt: d.requiredAt, sortOrder: d.sortOrder }); }} className="p-1 hover:bg-white rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
              <button onClick={async () => { await deleteMut.mutateAsync({ id: visaId, docId: d.id }); invalidate(); }} className="p-1 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        );
      })}
      {docs.length === 0 && !adding && (
        <p className="text-xs text-muted-foreground italic">{ar ? "لا توجد مستندات مطلوبة بعد" : "No required documents yet"}</p>
      )}
      {adding && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">{ar ? "اسم المستند (عربي)" : "Document Name (Arabic)"}</label>
              <input className="w-full border rounded-lg px-3 py-1.5 text-sm" value={form.nameAr} onChange={e => set("nameAr", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{ar ? "اسم المستند (إنجليزي)" : "Document Name (English)"}</label>
              <input className="w-full border rounded-lg px-3 py-1.5 text-sm" value={form.nameEn} onChange={e => set("nameEn", e.target.value)} dir="ltr" />
            </div>
            <div className="col-span-full">
              <label className="block text-xs font-medium mb-1">{ar ? "الوصف / التعليمات" : "Description / Instructions"}</label>
              <textarea rows={2} className="w-full border rounded-lg px-3 py-1.5 text-sm resize-none" value={form.description} onChange={e => set("description", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{ar ? "نوع الملف" : "File Type"}</label>
              <select className="w-full border rounded-lg px-3 py-1.5 text-sm bg-white" value={form.allowedFileType} onChange={e => set("allowedFileType", e.target.value)}>
                {DOC_FILE_TYPES.map(t => <option key={t.value} value={t.value}>{ar ? t.ar : t.en}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{ar ? "الحجم الأقصى (ميغابايت)" : "Max Size (MB)"}</label>
              <input type="number" min="0" className="w-full border rounded-lg px-3 py-1.5 text-sm" value={form.maxFileSizeMb} onChange={e => set("maxFileSizeMb", Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{ar ? "مطلوب عند" : "Required At"}</label>
              <select className="w-full border rounded-lg px-3 py-1.5 text-sm bg-white" value={form.requiredAt} onChange={e => set("requiredAt", e.target.value)}>
                {DOC_REQUIRED_AT.map(r => <option key={r.value} value={r.value}>{ar ? r.ar : r.en}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{ar ? "الترتيب" : "Order"}</label>
              <input type="number" className="w-full border rounded-lg px-3 py-1.5 text-sm" value={form.sortOrder} onChange={e => set("sortOrder", Number(e.target.value))} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id={`doc-req-${visaId}`} checked={form.required} onChange={e => set("required", e.target.checked)} className="w-4 h-4" />
              <label htmlFor={`doc-req-${visaId}`} className="text-xs font-medium">{ar ? "إلزامي" : "Required"}</label>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={reset} className="text-xs text-muted-foreground hover:underline">{ar ? "إلغاء" : "Cancel"}</button>
            <Button size="sm" onClick={save} disabled={!form.nameAr || !form.nameEn || saving}>{saving ? (ar ? "جارٍ الحفظ..." : "Saving...") : (ar ? "حفظ" : "Save")}</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Form Interface ─────────────────────────────────────────────────────────
interface VisaForm {
  countryId: string; countryAr: string; countryEn: string; countryCode: string;
  visaType: string; category: string; fee: number; currency: string;
  processingDays: number; stayDuration: number; validityDays: number;
  entryType: string; isActive: boolean;
  imageUrl: string;
  // ── Eligibility ──
  allowedNationalities: string[];
  blockedNationalities: string[];
  gccResidencyRequirement: string;   // "not_required" | "required"
  acceptedGccCountries: string[];
  europeanSchengenLogic: string;     // "neither" | "european_only" | "schengen_only" | "either" | "both"
  // ── Required Documents ──
  requiresPassportImage: boolean;
  requiresPersonalPhoto: boolean;
  requiresResidencyImage: boolean;   // GCC residence permit
  requiresEuropeanDoc: boolean;      // European residence permit
  requiresSchengenDoc: boolean;      // Schengen visa
  requiresVisaImage: boolean;        // Other
  // ── Descriptions / Messages ──
  descriptionAr: string; descriptionEn: string;
  ineligibleMessageAr: string; ineligibleMessageEn: string;
}

const emptyVisa = (): VisaForm => ({
  countryId: "", countryAr: "", countryEn: "", countryCode: "",
  visaType: "", category: "tourist", fee: 0, currency: "USD",
  processingDays: 5, stayDuration: 30, validityDays: 90,
  entryType: "single", isActive: true,
  imageUrl: "",
  allowedNationalities: [], blockedNationalities: [],
  gccResidencyRequirement: "not_required", acceptedGccCountries: [],
  europeanSchengenLogic: "neither",
  requiresPassportImage: true, requiresPersonalPhoto: true,
  requiresResidencyImage: false, requiresEuropeanDoc: false,
  requiresSchengenDoc: false, requiresVisaImage: false,
  descriptionAr: "", descriptionEn: "",
  ineligibleMessageAr: "", ineligibleMessageEn: "",
});

// ── Section Header ──────────────────────────────────────────────────────────
function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4 pb-2 border-b border-slate-100">
      <div className="w-8 h-8 rounded-lg bg-[#0d2351]/10 flex items-center justify-center text-[#0d2351]">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-[#0d2351] uppercase tracking-wide">{title}</h3>
    </div>
  );
}

// ── Visa Modal ─────────────────────────────────────────────────────────────
function VisaModal({ initial, onSave, onCancel, loading, ar, countries }: {
  initial: VisaForm; onSave: (d: VisaForm) => void; onCancel: () => void; loading: boolean; ar: boolean;
  countries: Array<{ id: number; nameAr: string; nameEn: string; countryCode: string }>;
}) {
  const [form, setForm] = useState(initial);
  const set = <K extends keyof VisaForm>(k: K, v: VisaForm[K]) => setForm(f => ({ ...f, [k]: v }));
  const chk = (k: keyof VisaForm) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, e.target.checked as never);

  function handleCountryChange(id: string) {
    const c = countries.find(c => String(c.id) === id);
    set("countryId", id);
    if (c) { set("countryAr", c.nameAr); set("countryEn", c.nameEn); set("countryCode", c.countryCode); }
  }

  const canSave = !loading && !!form.visaType && !!form.countryAr;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full sm:rounded-2xl sm:shadow-2xl sm:max-w-3xl sm:my-8 min-h-full sm:min-h-0 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b sticky top-0 bg-white z-10 sm:rounded-t-2xl">
          <h2 className="text-lg sm:text-xl font-bold">{ar ? "بيانات التأشيرة" : "Visa Details"}</h2>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8">

          {/* ── A: Basic Info ── */}
          <section>
            <SectionHeader icon={<Globe className="w-4 h-4" />} title={ar ? "أ. المعلومات الأساسية" : "A. Basic Information"} />

            {/* Country */}
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-sm font-medium mb-1">{ar ? "اختر الدولة" : "Select Country"}</label>
                <select className="w-full border rounded-xl px-4 py-2.5 text-sm bg-white" value={form.countryId} onChange={e => handleCountryChange(e.target.value)}>
                  <option value="">{ar ? "-- اختر دولة --" : "-- Select country --"}</option>
                  {countries.map(c => <option key={c.id} value={c.id}>{ar ? c.nameAr : c.nameEn}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">{ar ? "اسم الدولة (عربي)" : "Country (AR)"} *</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.countryAr} onChange={e => set("countryAr", e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">{ar ? "اسم الدولة (إنجليزي)" : "Country (EN)"}</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.countryEn} onChange={e => set("countryEn", e.target.value)} dir="ltr" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">{ar ? "رمز الدولة" : "Country Code"}</label>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.countryCode} onChange={e => set("countryCode", e.target.value)} dir="ltr" placeholder="e.g. AE" />
                </div>
              </div>
            </div>

            {/* Visa core details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">{ar ? "نوع التأشيرة" : "Visa Type"} *</label>
                <input className="w-full border rounded-xl px-4 py-2.5 text-sm" placeholder={ar ? "مثال: تأشيرة سياحية إلكترونية" : "e.g. Tourist E-Visa"} value={form.visaType} onChange={e => set("visaType", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{ar ? "الفئة" : "Category"}</label>
                <select className="w-full border rounded-xl px-4 py-2.5 text-sm bg-white" value={form.category} onChange={e => set("category", e.target.value)}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{ar ? c.ar : c.en}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{ar ? "نوع الدخول" : "Entry Type"}</label>
                <select className="w-full border rounded-xl px-4 py-2.5 text-sm bg-white" value={form.entryType} onChange={e => set("entryType", e.target.value)}>
                  {ENTRY_TYPES.map(t => <option key={t.value} value={t.value}>{ar ? t.ar : t.en}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{ar ? "الرسوم" : "Fee"}</label>
                <input type="number" min="0" className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.fee} onChange={e => set("fee", Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{ar ? "العملة" : "Currency"}</label>
                <select className="w-full border rounded-xl px-4 py-2.5 text-sm bg-white" value={form.currency} onChange={e => set("currency", e.target.value)}>
                  {["USD", "SAR", "EUR", "AED"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{ar ? "أيام المعالجة" : "Processing Days"}</label>
                <input type="number" min="0" className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.processingDays} onChange={e => set("processingDays", Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{ar ? "مدة الإقامة (يوم)" : "Stay Duration (days)"}</label>
                <input type="number" min="0" className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.stayDuration} onChange={e => set("stayDuration", Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{ar ? "صلاحية التأشيرة (يوم)" : "Validity (days)"}</label>
                <input type="number" min="0" className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.validityDays} onChange={e => set("validityDays", Number(e.target.value))} />
              </div>
            </div>

            {/* Descriptions */}
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-sm font-medium mb-1">{ar ? "الوصف بالعربية" : "Description (Arabic)"}</label>
                <textarea rows={2} className="w-full border rounded-xl px-4 py-2.5 text-sm resize-none" value={form.descriptionAr} onChange={e => set("descriptionAr", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{ar ? "الوصف بالإنجليزية" : "Description (English)"}</label>
                <textarea rows={2} className="w-full border rounded-xl px-4 py-2.5 text-sm resize-none" value={form.descriptionEn} onChange={e => set("descriptionEn", e.target.value)} dir="ltr" />
              </div>
            </div>

            {/* Visa image upload */}
            <div>
              <label className="block text-sm font-semibold mb-2">{ar ? "صورة التأشيرة" : "Visa Image"}</label>
              <VisaImageUpload value={form.imageUrl} onChange={v => set("imageUrl", v)} ar={ar} />
            </div>
          </section>

          {/* ── B: Eligibility ── */}
          <section>
            <SectionHeader icon={<ShieldCheck className="w-4 h-4" />} title={ar ? "ب. الأهلية والجنسيات" : "B. Eligibility"} />

            {/* Allowed nationalities */}
            <div className="mb-5">
              <label className="block text-sm font-semibold mb-1 text-green-700">
                {ar ? "الجنسيات المسموح بها" : "Allowed Nationalities"}
                <span className="font-normal text-slate-400 ms-2 text-xs">{ar ? "(فارغ = مفتوح لجميع الجنسيات غير المحظورة)" : "(empty = open to all non-blocked)"}</span>
              </label>
              <NationalityPicker value={form.allowedNationalities} onChange={v => set("allowedNationalities", v)} ar={ar} placeholder={ar ? "ابحث وأضف جنسية مسموحة..." : "Search allowed nationality..."} />
            </div>

            {/* Blocked nationalities */}
            <div className="mb-5 p-4 bg-red-50 rounded-xl border border-red-100">
              <label className="block text-sm font-semibold mb-1 text-red-700">
                🚫 {ar ? "الجنسيات المحظورة (أولوية قصوى)" : "Prohibited Nationalities (Highest Priority)"}
              </label>
              <p className="text-xs text-red-500 mb-3">
                {ar ? "الجنسية المحظورة تحجب التقديم دائماً، حتى مع إقامة خليجية أو أوروبية كاملة." : "A blocked nationality always prevents application, regardless of any other document or residency."}
              </p>
              <NationalityPicker value={form.blockedNationalities} onChange={v => set("blockedNationalities", v)} ar={ar} placeholder={ar ? "ابحث وأضف جنسية محظورة..." : "Search blocked nationality..."} />
            </div>

            {/* GCC residency */}
            <div className="mb-5 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <label className="block text-sm font-semibold mb-3 text-amber-800">
                {ar ? "متطلب الإقامة الخليجية (GCC)" : "GCC Residency Requirement"}
              </label>
              <div className="space-y-2 mb-4">
                {[
                  { value: "not_required", ar: "غير مطلوب", en: "Not Required" },
                  { value: "required", ar: "مطلوب (الإقامة الخليجية إلزامية)", en: "Required (GCC residency mandatory)" },
                ].map(opt => (
                  <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="gccReq"
                      value={opt.value}
                      checked={form.gccResidencyRequirement === opt.value}
                      onChange={() => set("gccResidencyRequirement", opt.value)}
                      className="w-4 h-4 accent-amber-600"
                    />
                    <span className="text-sm font-medium">{ar ? opt.ar : opt.en}</span>
                  </label>
                ))}
              </div>
              {form.gccResidencyRequirement === "required" && (
                <div>
                  <p className="text-xs font-semibold text-amber-700 mb-2">
                    {ar ? "الدول الخليجية المقبولة (فارغ = كل دول الخليج)" : "Accepted GCC Countries (empty = all GCC)"}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {GCC_COUNTRIES.map(c => (
                      <label key={c} className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 cursor-pointer transition-colors ${form.acceptedGccCountries.includes(c) ? "border-amber-500 bg-amber-50" : "border-slate-200 bg-white hover:border-amber-200"}`}>
                        <input
                          type="checkbox"
                          checked={form.acceptedGccCountries.includes(c)}
                          onChange={() => {
                            if (form.acceptedGccCountries.includes(c))
                              set("acceptedGccCountries", form.acceptedGccCountries.filter(x => x !== c));
                            else
                              set("acceptedGccCountries", [...form.acceptedGccCountries, c]);
                          }}
                          className="w-4 h-4 accent-amber-600"
                        />
                        <span className="text-xs font-medium">{ar ? GCC_LABELS[c] : c}</span>
                      </label>
                    ))}
                  </div>
                  {form.acceptedGccCountries.length > 0 && (
                    <p className="text-xs text-amber-600 mt-2">
                      ✓ {ar ? `المقبولة: ${form.acceptedGccCountries.map(c => ar ? GCC_LABELS[c] : c).join("، ")}` : `Accepted: ${form.acceptedGccCountries.join(", ")}`}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* European / Schengen logic */}
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <label className="block text-sm font-semibold mb-3 text-blue-800">
                {ar ? "متطلب الإقامة الأوروبية / تأشيرة شنغن" : "European Residency / Schengen Visa Requirement"}
              </label>
              <div className="space-y-2">
                {EU_SCHENGEN_OPTIONS.map(opt => (
                  <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="euLogic"
                      value={opt.value}
                      checked={form.europeanSchengenLogic === opt.value}
                      onChange={() => set("europeanSchengenLogic", opt.value)}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span className="text-sm">{ar ? opt.ar : opt.en}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Ineligible messages */}
            <div className="mt-5 space-y-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">{ar ? "رسالة رفض مخصصة (عربي)" : "Custom Rejection Message (Arabic)"}</label>
                <input className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.ineligibleMessageAr} onChange={e => set("ineligibleMessageAr", e.target.value)} placeholder={ar ? "تُعرض عند حجب الطلب" : "Shown when application is blocked"} />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">{ar ? "رسالة رفض مخصصة (إنجليزي)" : "Custom Rejection Message (English)"}</label>
                <input className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.ineligibleMessageEn} onChange={e => set("ineligibleMessageEn", e.target.value)} dir="ltr" />
              </div>
            </div>
          </section>

          {/* ── C: Required Documents ── */}
          <section>
            <SectionHeader icon={<FileText className="w-4 h-4" />} title={ar ? "ج. المستندات المطلوبة" : "C. Required Documents"} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: "requiresPassportImage",  arLabel: "✓ صورة جواز السفر",          enLabel: "✓ Passport Image",          note: "" },
                { key: "requiresPersonalPhoto",  arLabel: "✓ صورة شخصية",               enLabel: "✓ Personal Photo",          note: "" },
                { key: "requiresResidencyImage", arLabel: "إقامة خليجية (GCC)",          enLabel: "GCC Residence Permit",      note: "" },
                { key: "requiresEuropeanDoc",    arLabel: "إقامة أوروبية (EU/UK)",       enLabel: "European Residence Permit", note: "" },
                { key: "requiresSchengenDoc",    arLabel: "تأشيرة شنغن / بريطانية",     enLabel: "Schengen / UK Visa",        note: "" },
                { key: "requiresVisaImage",      arLabel: "وثيقة تأشيرة أخرى",          enLabel: "Other Visa Document",       note: "" },
              ].map(item => (
                <label key={item.key} className={`flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer border-2 transition-colors ${(form as unknown as Record<string, unknown>)[item.key] ? "border-[#0d2351] bg-[#0d2351]/5" : "border-slate-200 bg-slate-50 hover:border-slate-300"}`}>
                  <input
                    type="checkbox"
                    checked={(form as unknown as Record<string, unknown>)[item.key] as boolean}
                    onChange={chk(item.key as keyof VisaForm)}
                    className="w-4 h-4 accent-[#0d2351]"
                  />
                  <span className="text-sm font-medium">{ar ? item.arLabel : item.enLabel}</span>
                </label>
              ))}
            </div>
          </section>

          {/* ── D: Status ── */}
          <section>
            <SectionHeader icon={<Settings className="w-4 h-4" />} title={ar ? "د. الحالة" : "D. Status"} />
            <label className={`flex items-center gap-3 rounded-xl px-4 py-4 cursor-pointer border-2 transition-colors ${form.isActive ? "border-green-400 bg-green-50" : "border-slate-200 bg-slate-50"}`}>
              <input type="checkbox" checked={form.isActive} onChange={chk("isActive")} className="w-5 h-5 accent-green-600" />
              <div>
                <div className="font-semibold text-sm">{ar ? "نشط (يظهر للعملاء)" : "Active (visible to customers)"}</div>
                <div className="text-xs text-slate-400">{ar ? "عطّل هذا الخيار لإخفاء التأشيرة مؤقتاً دون حذفها" : "Disable to hide the visa temporarily without deleting it"}</div>
              </div>
            </label>
          </section>

          {!canSave && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              {ar ? "⚠️ يرجى إدخال اسم الدولة بالعربي ونوع التأشيرة على الأقل" : "⚠️ Country name (Arabic) and Visa Type are required"}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t flex gap-3 justify-end sticky bottom-0 bg-white sm:rounded-b-2xl">
          <Button variant="outline" onClick={onCancel}>{ar ? "إلغاء" : "Cancel"}</Button>
          <Button onClick={() => onSave(form)} disabled={!canSave} className="bg-[#0d2351] hover:bg-[#0d2351]/90">
            {loading ? (ar ? "جارٍ الحفظ..." : "Saving...") : (ar ? "💾 حفظ التأشيرة" : "💾 Save Visa")}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Helper: visa to form ───────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function visaToForm(v: any): VisaForm {
  return {
    countryId: v.countryId ? String(v.countryId) : "",
    countryAr: v.countryAr ?? "",
    countryEn: v.countryEn ?? "",
    countryCode: v.countryCode ?? "",
    visaType: v.visaType ?? "",
    category: v.category ?? "tourist",
    fee: Number(v.fee ?? 0),
    currency: v.currency ?? "USD",
    processingDays: v.processingDays ?? 5,
    stayDuration: v.stayDuration ?? 30,
    validityDays: v.validityDays ?? 90,
    entryType: v.entryType ?? "single",
    isActive: v.isActive ?? true,
    imageUrl: v.imageUrl ?? "",
    allowedNationalities: v.allowedNationalities ?? [],
    blockedNationalities: v.blockedNationalities ?? [],
    gccResidencyRequirement: v.gccResidencyRequirement ?? "not_required",
    acceptedGccCountries: v.acceptedGccCountries ?? [],
    europeanSchengenLogic: v.europeanSchengenLogic ?? "neither",
    requiresPassportImage: v.requiresPassportImage ?? true,
    requiresPersonalPhoto: v.requiresPersonalPhoto ?? true,
    requiresResidencyImage: v.requiresResidencyImage ?? false,
    requiresEuropeanDoc: v.requiresEuropeanDoc ?? false,
    requiresSchengenDoc: v.requiresSchengenDoc ?? false,
    requiresVisaImage: v.requiresVisaImage ?? false,
    descriptionAr: v.descriptionAr ?? "",
    descriptionEn: v.descriptionEn ?? "",
    ineligibleMessageAr: v.ineligibleMessageAr ?? "",
    ineligibleMessageEn: v.ineligibleMessageEn ?? "",
  };
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function VisasAdmin() {
  const { language } = useTranslation();
  const ar = language === "ar";
  const qc = useQueryClient();
  const { data: visas = [], isLoading } = useListVisas();
  const { data: countries = [] } = useListVisaCountries();
  const createMut = useCreateVisa();
  const updateMut = useUpdateVisa();
  const deleteMut = useDeleteVisa();

  const [modal, setModal] = useState<{ mode: "create" | "edit"; id?: number; initial: VisaForm } | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  async function handleSave(form: VisaForm) {
    if (!modal) return;
    try {
      const payload = {
        ...form,
        countryId: form.countryId ? Number(form.countryId) : undefined,
        // Coerce for the API
        allowedNationalities: form.allowedNationalities,
        blockedNationalities: form.blockedNationalities,
        gccResidencyRequirement: form.gccResidencyRequirement,
        acceptedGccCountries: form.acceptedGccCountries,
        europeanSchengenLogic: form.europeanSchengenLogic,
        requiresEuropeanDoc: form.requiresEuropeanDoc,
        requiresSchengenDoc: form.requiresSchengenDoc,
      };
      const invalidate = () => qc.invalidateQueries({ queryKey: getListVisasQueryKey() });
      if (modal.mode === "create") {
        await createMut.mutateAsync(payload as never);
        toast.success(ar ? "تمت إضافة التأشيرة بنجاح ✓" : "Visa added successfully ✓");
      } else {
        await updateMut.mutateAsync({ id: modal.id!, data: payload as never });
        toast.success(ar ? "تم تحديث التأشيرة بنجاح ✓" : "Visa updated successfully ✓");
      }
      await invalidate();
      setModal(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(ar ? `فشل الحفظ: ${msg}` : `Save failed: ${msg}`);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteMut.mutateAsync({ id });
      await qc.invalidateQueries({ queryKey: getListVisasQueryKey() });
      setDeleteConfirm(null);
      toast.success(ar ? "تم حذف التأشيرة" : "Visa deleted");
    } catch {
      toast.error(ar ? "فشل الحذف" : "Delete failed");
    }
  }

  return (
    <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{ar ? "إدارة التأشيرات" : "Visa Management"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{ar ? "إعداد التأشيرات وقواعد الأهلية والمستندات المطلوبة" : "Configure visas, eligibility rules, and required documents"}</p>
        </div>
        <Button onClick={() => setModal({ mode: "create", initial: emptyVisa() })} className="gap-2">
          <Plus className="w-4 h-4" />
          {ar ? "إضافة تأشيرة" : "Add Visa"}
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground">{ar ? "جارٍ التحميل..." : "Loading..."}</div>
      ) : (
        <div className="space-y-3">
          {visas.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border p-20 text-center">
              <Globe className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground">{ar ? "لا توجد تأشيرات بعد" : "No visas yet"}</p>
            </div>
          ) : visas.map(v => {
            const isExpanded = expandedId === v.id;
            const cat = CATEGORIES.find(c => c.value === v.category);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const va = v as any;
            const allowedCount = (va.allowedNationalities ?? []).length;
            const blockedCount = (va.blockedNationalities ?? []).length;
            const gccReq = va.gccResidencyRequirement ?? "not_required";
            const euLogic = va.europeanSchengenLogic ?? "neither";
            return (
              <div key={v.id} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-5 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : v.id)}>
                  <div className="flex items-center gap-4 min-w-0">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                    {va.imageUrl && (
                      <img src={getDisplayUrl(va.imageUrl)} className="w-10 h-10 rounded-lg object-cover border border-slate-100 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{v.countryAr} — {v.visaType}</div>
                      <div className="text-xs text-muted-foreground">{v.countryEn} · {ar ? cat?.ar : cat?.en} · {Number(v.fee).toLocaleString()} {v.currency}</div>
                      {/* Eligibility badges */}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {allowedCount > 0 && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md">{allowedCount} {ar ? "جنسية مسموحة" : "allowed"}</span>}
                        {blockedCount > 0 && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-md">{blockedCount} {ar ? "محظورة" : "blocked"}</span>}
                        {gccReq === "required" && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md">GCC {ar ? "مطلوب" : "required"}</span>}
                        {euLogic !== "neither" && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md">{ar ? "شنغن/أوروبي" : "EU/Schengen"}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                    <span className={`hidden sm:inline px-2 py-1 rounded-lg text-xs font-medium ${v.isActive ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {v.isActive ? (ar ? "نشط" : "Active") : (ar ? "معطل" : "Inactive")}
                    </span>
                    <button onClick={() => setModal({ mode: "edit", id: v.id, initial: visaToForm(v) })} className="p-2 hover:bg-slate-100 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteConfirm(v.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-border/50">
                    <div className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      <div><span className="text-muted-foreground text-xs">{ar ? "المعالجة" : "Processing"}</span><div className="font-medium">{v.processingDays} {ar ? "يوم" : "days"}</div></div>
                      <div><span className="text-muted-foreground text-xs">{ar ? "مدة الإقامة" : "Stay"}</span><div className="font-medium">{v.stayDuration ?? "—"} {ar ? "يوم" : "days"}</div></div>
                      <div><span className="text-muted-foreground text-xs">{ar ? "نوع الدخول" : "Entry"}</span><div className="font-medium">{v.entryType}</div></div>
                      <div><span className="text-muted-foreground text-xs">{ar ? "الرسوم" : "Fee"}</span><div className="font-medium">{Number(v.fee).toLocaleString()} {v.currency}</div></div>
                    </div>
                    {/* Eligibility summary */}
                    {(allowedCount > 0 || blockedCount > 0 || gccReq !== "not_required" || euLogic !== "neither") && (
                      <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1 mb-3 border border-slate-100">
                        <p className="font-semibold text-slate-600 mb-1">{ar ? "قواعد الأهلية:" : "Eligibility rules:"}</p>
                        {allowedCount > 0 && <p className="text-green-600">✓ {ar ? `الجنسيات المسموحة: ${(va.allowedNationalities ?? []).join("، ")}` : `Allowed: ${(va.allowedNationalities ?? []).join(", ")}`}</p>}
                        {blockedCount > 0 && <p className="text-red-600">🚫 {ar ? `المحظورة: ${(va.blockedNationalities ?? []).join("، ")}` : `Blocked: ${(va.blockedNationalities ?? []).join(", ")}`}</p>}
                        {gccReq === "required" && <p className="text-amber-600">🏠 {ar ? `إقامة خليجية مطلوبة${va.acceptedGccCountries?.length ? ` من: ${va.acceptedGccCountries.join("، ")}` : " (أي دولة خليجية)"}` : `GCC residency required${va.acceptedGccCountries?.length ? ` from: ${va.acceptedGccCountries.join(", ")}` : " (any GCC)"}`}</p>}
                        {euLogic !== "neither" && <p className="text-blue-600">🌍 {ar ? EU_SCHENGEN_OPTIONS.find(o => o.value === euLogic)?.ar : EU_SCHENGEN_OPTIONS.find(o => o.value === euLogic)?.en}</p>}
                      </div>
                    )}
                    <RequiredDocumentsPanel visaId={v.id} ar={ar} />
                    <CustomFieldsPanel visaId={v.id} ar={ar} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <VisaModal
          initial={modal.initial}
          onSave={handleSave}
          onCancel={() => setModal(null)}
          loading={createMut.isPending || updateMut.isPending}
          ar={ar}
          countries={countries}
        />
      )}

      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
            <h3 className="text-lg font-bold mb-2">{ar ? "تأكيد الحذف" : "Confirm Delete"}</h3>
            <p className="text-muted-foreground text-sm mb-6">{ar ? "سيتم حذف التأشيرة وجميع حقولها المخصصة نهائياً." : "This visa and all its custom fields will be permanently deleted."}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>{ar ? "إلغاء" : "Cancel"}</Button>
              <Button variant="destructive" onClick={() => handleDelete(deleteConfirm)} disabled={deleteMut.isPending}>
                {deleteMut.isPending ? (ar ? "جارٍ الحذف..." : "Deleting...") : (ar ? "حذف نهائياً" : "Delete")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
