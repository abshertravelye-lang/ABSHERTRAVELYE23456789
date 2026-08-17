import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListVisaCountries, useCreateVisaCountry, useUpdateVisaCountry, useDeleteVisaCountry,
  getListVisaCountriesQueryKey,
} from "@workspace/api-client-react";
import { useTranslation } from "@/hooks/use-translation";
import { Plus, Edit2, Trash2, X, Globe, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ImageUpload } from "@/components/image-upload";

const REGIONS = [
  { value: "gulf",     ar: "الخليج",    en: "Gulf" },
  { value: "arab",     ar: "العربي",    en: "Arab" },
  { value: "asian",    ar: "آسيا",      en: "Asian" },
  { value: "european", ar: "أوروبا",    en: "European" },
  { value: "african",  ar: "أفريقيا",   en: "African" },
  { value: "american", ar: "الأمريكتان",en: "American" },
];

interface CountryForm {
  nameAr: string; nameEn: string; countryCode: string; region: string;
  flagEmoji: string; imageUrl: string; descriptionAr: string; descriptionEn: string;
  isActive: boolean; sortOrder: number;
}
const empty = (): CountryForm => ({
  nameAr: "", nameEn: "", countryCode: "", region: "gulf",
  flagEmoji: "", imageUrl: "", descriptionAr: "", descriptionEn: "",
  isActive: true, sortOrder: 0,
});

function Modal({ initial, onSave, onCancel, loading, ar }: {
  initial: CountryForm; onSave: (d: CountryForm) => void; onCancel: () => void; loading: boolean; ar: boolean;
}) {
  const [form, setForm] = useState(initial);
  const set = <K extends keyof CountryForm>(k: K, v: CountryForm[K]) => setForm(f => ({ ...f, [k]: v }));

  const canSave = !loading && !!form.nameAr && !!form.nameEn && !!form.countryCode;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full sm:rounded-2xl sm:shadow-2xl sm:max-w-2xl sm:my-8 min-h-full sm:min-h-0 flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b sticky top-0 bg-white z-10 sm:rounded-t-2xl">
          <h2 className="text-lg sm:text-xl font-bold">{ar ? "بيانات الدولة" : "Country Details"}</h2>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{ar ? "الاسم بالعربية" : "Name (Arabic)"} *</label>
            <input className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.nameAr} onChange={e => set("nameAr", e.target.value)} placeholder={ar ? "مثال: الإمارات" : "e.g. UAE"} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{ar ? "الاسم بالإنجليزية" : "Name (English)"} *</label>
            <input className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.nameEn} onChange={e => set("nameEn", e.target.value)} dir="ltr" placeholder="e.g. United Arab Emirates" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{ar ? "رمز الدولة (ISO)" : "Country Code (ISO)"} *</label>
              <input className="w-full border rounded-xl px-4 py-2.5 text-sm uppercase" placeholder="AE" value={form.countryCode} onChange={e => set("countryCode", e.target.value.toUpperCase())} dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{ar ? "رمز العلم" : "Flag Emoji"}</label>
              <input className="w-full border rounded-xl px-4 py-2.5 text-sm" placeholder="🇦🇪" value={form.flagEmoji} onChange={e => set("flagEmoji", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{ar ? "ترتيب العرض" : "Sort Order"}</label>
              <input type="number" className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.sortOrder} onChange={e => set("sortOrder", Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{ar ? "المنطقة" : "Region"} *</label>
            <select className="w-full border rounded-xl px-4 py-2.5 text-sm bg-white" value={form.region} onChange={e => set("region", e.target.value)}>
              {REGIONS.map(r => <option key={r.value} value={r.value}>{ar ? r.ar : r.en}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{ar ? "صورة الدولة" : "Country Image"}</label>
            <ImageUpload value={form.imageUrl} onChange={v => set("imageUrl", v)} aspectRatio="16/9" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{ar ? "الوصف بالعربية" : "Description (Arabic)"}</label>
            <textarea rows={2} className="w-full border rounded-xl px-4 py-2.5 text-sm resize-none" value={form.descriptionAr} onChange={e => set("descriptionAr", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{ar ? "الوصف بالإنجليزية" : "Description (English)"}</label>
            <textarea rows={2} className="w-full border rounded-xl px-4 py-2.5 text-sm resize-none" value={form.descriptionEn} onChange={e => set("descriptionEn", e.target.value)} dir="ltr" />
          </div>
          <label className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3 cursor-pointer">
            <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => set("isActive", e.target.checked)} className="w-4 h-4 accent-green-600" />
            <span className="text-sm font-medium text-green-800">{ar ? "نشط (تظهر للعملاء)" : "Active (visible to customers)"}</span>
          </label>
          {!canSave && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              {ar ? "⚠️ الاسم بالعربية والإنجليزية ورمز الدولة مطلوبة" : "⚠️ Name (AR/EN) and country code are required"}
            </p>
          )}
        </div>
        <div className="p-4 sm:p-6 border-t flex gap-3 justify-end sticky bottom-0 bg-white sm:rounded-b-2xl">
          <Button variant="outline" onClick={onCancel}>{ar ? "إلغاء" : "Cancel"}</Button>
          <Button onClick={() => onSave(form)} disabled={!canSave}>
            {loading ? (ar ? "جارٍ الحفظ..." : "Saving...") : (ar ? "حفظ الدولة" : "Save Country")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function VisaCountriesAdmin() {
  const { language } = useTranslation();
  const ar = language === "ar";
  const qc = useQueryClient();
  const { data: countries = [], isLoading } = useListVisaCountries();
  const createMut = useCreateVisaCountry();
  const updateMut = useUpdateVisaCountry();
  const deleteMut = useDeleteVisaCountry();

  const [modal, setModal] = useState<{ mode: "create" | "edit"; id?: number; initial: CountryForm } | null>(null);
  const [filterRegion, setFilterRegion] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const filtered = filterRegion ? countries.filter(c => c.region === filterRegion) : countries;

  async function handleSave(form: CountryForm) {
    if (!modal) return;
    try {
      const invalidate = () => qc.invalidateQueries({ queryKey: getListVisaCountriesQueryKey() });
      if (modal.mode === "create") {
        await createMut.mutateAsync(form as never);
        toast.success(ar ? "تمت إضافة الدولة ✓" : "Country added ✓");
      } else {
        await updateMut.mutateAsync({ id: modal.id!, data: form as never });
        toast.success(ar ? "تم تحديث الدولة ✓" : "Country updated ✓");
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
      await qc.invalidateQueries({ queryKey: getListVisaCountriesQueryKey() });
      setDeleteConfirm(null);
      toast.success(ar ? "تم حذف الدولة" : "Country deleted");
    } catch {
      toast.error(ar ? "فشل الحذف" : "Delete failed");
    }
  }

  return (
    <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{ar ? "دول التأشيرة" : "Visa Countries"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{ar ? "إدارة الدول والمناطق المتاحة" : "Manage destination countries by region"}</p>
        </div>
        <Button onClick={() => setModal({ mode: "create", initial: empty() })} className="gap-2">
          <Plus className="w-4 h-4" />
          {ar ? "إضافة دولة" : "Add Country"}
        </Button>
      </div>

      {/* Region filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterRegion("")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${!filterRegion ? "bg-primary text-white" : "bg-white border border-slate-200 hover:bg-slate-50"}`}
        >
          {ar ? "الكل" : "All"}
        </button>
        {REGIONS.map(r => (
          <button
            key={r.value}
            onClick={() => setFilterRegion(r.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filterRegion === r.value ? "bg-primary text-white" : "bg-white border border-slate-200 hover:bg-slate-50"}`}
          >
            {ar ? r.ar : r.en}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground">{ar ? "جارٍ التحميل..." : "Loading..."}</div>
      ) : (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="text-start px-6 py-3 font-medium text-muted-foreground">{ar ? "الدولة" : "Country"}</th>
                <th className="text-start px-6 py-3 font-medium text-muted-foreground">{ar ? "الرمز" : "Code"}</th>
                <th className="text-start px-6 py-3 font-medium text-muted-foreground">{ar ? "المنطقة" : "Region"}</th>
                <th className="text-start px-6 py-3 font-medium text-muted-foreground">{ar ? "التأشيرات" : "Visas"}</th>
                <th className="text-start px-6 py-3 font-medium text-muted-foreground">{ar ? "الحالة" : "Status"}</th>
                <th className="text-start px-6 py-3 font-medium text-muted-foreground">{ar ? "إجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-muted-foreground">
                  <Globe className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <div>{ar ? "لا توجد دول" : "No countries found"}</div>
                </td></tr>
              ) : filtered.map(c => {
                const regionLabel = REGIONS.find(r => r.value === c.region);
                return (
                  <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{c.flagEmoji || "🌍"}</span>
                        <div>
                          <div className="font-medium">{c.nameAr}</div>
                          <div className="text-xs text-muted-foreground">{c.nameEn}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{c.countryCode}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">
                        {ar ? regionLabel?.ar : regionLabel?.en}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{c.visaCount ?? 0}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${c.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                        {c.isActive ? (ar ? "نشط" : "Active") : (ar ? "معطل" : "Inactive")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setModal({ mode: "edit", id: c.id, initial: { nameAr: c.nameAr, nameEn: c.nameEn, countryCode: c.countryCode, region: c.region, flagEmoji: c.flagEmoji ?? "", imageUrl: c.imageUrl ?? "", descriptionAr: c.descriptionAr ?? "", descriptionEn: c.descriptionEn ?? "", isActive: c.isActive, sortOrder: c.sortOrder } })}
                          className="p-2 hover:bg-slate-100 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteConfirm(c.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal
          initial={modal.initial}
          onSave={handleSave}
          onCancel={() => setModal(null)}
          loading={createMut.isPending || updateMut.isPending}
          ar={ar}
        />
      )}

      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
            <h3 className="text-lg font-bold mb-2">{ar ? "تأكيد الحذف" : "Confirm Delete"}</h3>
            <p className="text-muted-foreground text-sm mb-6">{ar ? "هل أنت متأكد من حذف هذه الدولة؟" : "Are you sure you want to delete this country?"}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>{ar ? "إلغاء" : "Cancel"}</Button>
              <Button variant="destructive" onClick={() => handleDelete(deleteConfirm)} disabled={deleteMut.isPending}>
                {deleteMut.isPending ? (ar ? "جارٍ الحذف..." : "Deleting...") : (ar ? "حذف" : "Delete")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
