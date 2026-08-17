import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListOffersAdmin,
  useCreateOffer,
  useUpdateOffer,
  useDeleteOffer,
  getListOffersAdminQueryKey,
  type Offer,
} from "@workspace/api-client-react";
import { useTranslation } from "@/hooks/use-translation";
import { Plus, Edit2, Trash2, X, AlertCircle, Megaphone, UploadCloud, ImageOff, Link2, Calendar, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { uploadImageFile, resolveImageSrc } from "@/components/image-upload";

// ── Storage upload helper — unified compressed-image endpoint ────────────────
async function uploadFile(file: File): Promise<string | null> {
  try {
    return await uploadImageFile(file);
  } catch {
    return null;
  }
}

interface OfferForm {
  titleAr: string; titleEn: string;
  descriptionAr: string; descriptionEn: string;
  imageUrl: string;
  discountLabel: string;
  linkUrl: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  sortOrder: number;
}

const emptyForm = (): OfferForm => ({
  titleAr: "", titleEn: "", descriptionAr: "", descriptionEn: "",
  imageUrl: "", discountLabel: "", linkUrl: "", startDate: "", endDate: "",
  isActive: true, sortOrder: 0,
});

/** ISO datetime → value for <input type="date"> (YYYY-MM-DD). */
function toDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  try { return new Date(iso).toISOString().slice(0, 10); }
  catch { return ""; }
}

function fmtDate(iso: string | null | undefined, ar: boolean): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString(ar ? "ar-SA" : "en-US"); }
  catch { return iso; }
}

function ImageUpload({ value, onChange, ar }: { value: string; onChange: (v: string) => void; ar: boolean }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    const path = await uploadFile(file);
    setUploading(false);
    if (path) { onChange(path); toast.success(ar ? "تم رفع الصورة بنجاح" : "Image uploaded successfully"); }
    else toast.error(ar ? "فشل رفع الصورة" : "Image upload failed");
  };

  if (value) {
    return (
      <div className="border-2 border-slate-200 rounded-xl overflow-hidden">
        <img src={resolveImageSrc(value)} alt="" className="w-full h-40 object-cover" onError={e => (e.currentTarget.style.display = "none")} />
        <div className="flex gap-2 p-2 bg-slate-50">
          <button type="button" onClick={() => inputRef.current?.click()} className="flex-1 text-xs text-[#0d2351] hover:underline font-medium">
            {ar ? "استبدال الصورة" : "Replace image"}
          </button>
          <button type="button" onClick={() => onChange("")} className="flex-1 text-xs text-red-500 hover:underline">
            {ar ? "حذف" : "Remove"}
          </button>
          <input ref={inputRef} type="file" className="hidden" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} disabled={uploading} />
        </div>
      </div>
    );
  }

  return (
    <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-4 py-8 text-sm text-muted-foreground cursor-pointer hover:border-[#0d2351]/50 hover:bg-[#0d2351]/5 transition-colors">
      <input type="file" className="hidden" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} disabled={uploading} />
      {uploading ? (
        <><div className="w-5 h-5 border-2 border-[#0d2351]/20 border-t-[#0d2351] rounded-full animate-spin" />{ar ? "جاري الرفع..." : "Uploading..."}</>
      ) : (
        <><UploadCloud className="w-6 h-6" />{ar ? "رفع صورة العرض" : "Upload offer image"}</>
      )}
    </label>
  );
}

function OfferFormModal({ initial, onSave, onCancel, loading }: {
  initial: OfferForm; onSave: (d: OfferForm) => void; onCancel: () => void; loading: boolean;
}) {
  const { language } = useTranslation();
  const ar = language === "ar";
  const [form, setForm] = useState(initial);
  const set = <K extends keyof OfferForm>(k: K, v: OfferForm[K]) => setForm(f => ({ ...f, [k]: v }));

  const canSave = !loading && !!form.titleAr && !!form.titleEn && !!form.imageUrl;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto" dir={ar ? "rtl" : "ltr"}>
      <div className="bg-white w-full sm:rounded-2xl sm:shadow-2xl sm:max-w-2xl sm:my-8 min-h-full sm:min-h-0 flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b sticky top-0 bg-white z-10 sm:rounded-t-2xl">
          <h2 className="text-lg sm:text-xl font-bold">{ar ? "تفاصيل العرض الترويجي" : "Promotional Offer"}</h2>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{ar ? "صورة العرض" : "Offer Image"} *</label>
            <ImageUpload value={form.imageUrl} onChange={v => set("imageUrl", v)} ar={ar} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{ar ? "العنوان بالعربية" : "Title (Arabic)"} *</label>
            <input className="w-full border rounded-xl px-4 py-2.5 text-sm" dir="rtl" value={form.titleAr} onChange={e => set("titleAr", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{ar ? "العنوان بالإنجليزية" : "Title (English)"} *</label>
            <input className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.titleEn} onChange={e => set("titleEn", e.target.value)} dir="ltr" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{ar ? "الوصف بالعربية" : "Description (Arabic)"}</label>
            <textarea rows={3} className="w-full border rounded-xl px-4 py-2.5 text-sm resize-none" dir="rtl" value={form.descriptionAr} onChange={e => set("descriptionAr", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{ar ? "الوصف بالإنجليزية" : "Description (English)"}</label>
            <textarea rows={3} className="w-full border rounded-xl px-4 py-2.5 text-sm resize-none" value={form.descriptionEn} onChange={e => set("descriptionEn", e.target.value)} dir="ltr" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{ar ? "شارة الخصم" : "Discount Label"}</label>
              <input className="w-full border rounded-xl px-4 py-2.5 text-sm" placeholder={ar ? "مثال: خصم 20%" : "e.g. 20% OFF"} value={form.discountLabel} onChange={e => set("discountLabel", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{ar ? "الترتيب" : "Sort Order"}</label>
              <input type="number" className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.sortOrder} onChange={e => set("sortOrder", Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{ar ? "رابط العرض" : "Link URL"}</label>
            <input className="w-full border rounded-xl px-4 py-2.5 text-sm" dir="ltr" placeholder="https://... or /offers/..." value={form.linkUrl} onChange={e => set("linkUrl", e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{ar ? "تاريخ البداية" : "Start Date"}</label>
              <input type="date" className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.startDate} onChange={e => set("startDate", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{ar ? "تاريخ النهاية" : "End Date"}</label>
              <input type="date" className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.endDate} onChange={e => set("endDate", e.target.value)} />
            </div>
          </div>
          <label className="flex items-center justify-between border rounded-xl px-4 py-3 cursor-pointer">
            <span className="text-sm font-medium">{ar ? "العرض مفعّل" : "Active"}</span>
            <input type="checkbox" className="w-5 h-5 accent-[#0d2351]" checked={form.isActive} onChange={e => set("isActive", e.target.checked)} />
          </label>
        </div>
        <div className="p-4 sm:p-6 border-t flex gap-3 justify-end sticky bottom-0 bg-white">
          <Button variant="outline" onClick={onCancel}>{ar ? "إلغاء" : "Cancel"}</Button>
          <Button onClick={() => onSave(form)} disabled={!canSave} className="bg-[#0d2351] hover:bg-[#0d2351]/90">
            {loading ? (ar ? "جارٍ الحفظ..." : "Saving...") : (ar ? "حفظ العرض" : "Save Offer")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDelete({ onConfirm, onCancel, ar, loading }: { onConfirm: () => void; onCancel: () => void; ar: boolean; loading: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-[55] flex items-center justify-center p-4" dir={ar ? "rtl" : "ltr"}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold mb-1">{ar ? "حذف العرض" : "Delete Offer"}</h3>
        <p className="text-sm text-muted-foreground mb-6">{ar ? "هل أنت متأكد من حذف هذا العرض؟ لا يمكن التراجع." : "Are you sure you want to delete this offer? This cannot be undone."}</p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>{ar ? "إلغاء" : "Cancel"}</Button>
          <Button variant="destructive" className="flex-1" onClick={onConfirm} disabled={loading}>
            {loading ? (ar ? "جارٍ الحذف..." : "Deleting...") : (ar ? "حذف" : "Delete")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PromotionalOffersAdmin() {
  const { language } = useTranslation();
  const ar = language === "ar";
  const qc = useQueryClient();

  const { data: offers = [], isLoading } = useListOffersAdmin();
  const createMut = useCreateOffer();
  const updateMut = useUpdateOffer();
  const deleteMut = useDeleteOffer();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [formData, setFormData] = useState<OfferForm>(emptyForm());
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: getListOffersAdminQueryKey() });

  const openCreate = () => { setEditing(null); setFormData(emptyForm()); setModalOpen(true); };
  const openEdit = (o: Offer) => {
    setEditing(o);
    setFormData({
      titleAr: o.titleAr, titleEn: o.titleEn,
      descriptionAr: o.descriptionAr, descriptionEn: o.descriptionEn,
      imageUrl: o.imageUrl,
      discountLabel: o.discountLabel ?? "",
      linkUrl: o.linkUrl ?? "",
      startDate: toDateInput(o.startDate),
      endDate: toDateInput(o.endDate),
      isActive: o.isActive,
      sortOrder: o.sortOrder,
    });
    setModalOpen(true);
  };

  const handleSave = async (d: OfferForm) => {
    const payload = {
      titleAr: d.titleAr,
      titleEn: d.titleEn,
      descriptionAr: d.descriptionAr,
      descriptionEn: d.descriptionEn,
      imageUrl: d.imageUrl,
      discountLabel: d.discountLabel || undefined,
      linkUrl: d.linkUrl || undefined,
      startDate: d.startDate ? new Date(d.startDate).toISOString() : undefined,
      endDate: d.endDate ? new Date(d.endDate).toISOString() : undefined,
      isActive: d.isActive,
      sortOrder: d.sortOrder,
    };
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, data: payload });
        toast.success(ar ? "تم تحديث العرض" : "Offer updated");
      } else {
        await createMut.mutateAsync({ data: payload });
        toast.success(ar ? "تم إنشاء العرض" : "Offer created");
      }
      await invalidate();
      setModalOpen(false);
    } catch {
      toast.error(ar ? "تعذّر حفظ العرض" : "Failed to save offer");
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteMut.mutateAsync({ id: deleteId });
      await invalidate();
      toast.success(ar ? "تم حذف العرض" : "Offer deleted");
      setDeleteId(null);
    } catch {
      toast.error(ar ? "تعذّر حذف العرض" : "Failed to delete offer");
    }
  };

  return (
    <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{ar ? "العروض الترويجية" : "Promotional Offers"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{ar ? "إدارة العروض الترويجية الظاهرة للعملاء" : "Manage promotional banners shown to customers"}</p>
        </div>
        <Button onClick={openCreate} className="rounded-xl bg-[#0d2351] hover:bg-[#0d2351]/90">
          <Plus className="w-4 h-4 me-2" />
          {ar ? "عرض جديد" : "New Offer"}
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground">{ar ? "جارٍ التحميل..." : "Loading..."}</div>
      ) : offers.length === 0 ? (
        <div className="bg-card rounded-3xl border border-card-border p-16 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Megaphone className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold mb-1">{ar ? "لا توجد عروض" : "No offers yet"}</h3>
          <p className="text-sm text-muted-foreground">{ar ? "أضف أول عرض ترويجي." : "Add your first promotional offer."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map(o => (
            <div key={o.id} className="bg-card rounded-3xl border border-card-border shadow-sm overflow-hidden flex flex-col">
              <div className="relative h-40 bg-slate-100">
                {o.imageUrl ? (
                  <img src={resolveImageSrc(o.imageUrl)} alt="" className="w-full h-full object-cover" loading="lazy" onError={e => (e.currentTarget.style.display = "none")} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageOff className="w-8 h-8" /></div>
                )}
                {o.discountLabel && (
                  <span className="absolute top-3 start-3 bg-[#d4af37] text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow">{o.discountLabel}</span>
                )}
                <span className={`absolute top-3 end-3 text-xs font-medium px-2.5 py-1 rounded-lg ${o.isActive ? "bg-green-500 text-white" : "bg-slate-400 text-white"}`}>
                  {o.isActive ? (ar ? "مفعّل" : "Active") : (ar ? "معطّل" : "Inactive")}
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-sm">{ar ? o.titleAr : o.titleEn}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 flex-1">{ar ? o.descriptionAr : o.descriptionEn}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><ArrowUpDown className="w-3 h-3" />{o.sortOrder}</span>
                  {(o.startDate || o.endDate) && (
                    <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{fmtDate(o.startDate, ar)} - {fmtDate(o.endDate, ar)}</span>
                  )}
                  {o.linkUrl && <span className="inline-flex items-center gap-1 truncate max-w-[140px]" dir="ltr"><Link2 className="w-3 h-3 shrink-0" />{o.linkUrl}</span>}
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => openEdit(o)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm border rounded-lg hover:bg-slate-50">
                    <Edit2 className="w-4 h-4" />{ar ? "تعديل" : "Edit"}
                  </button>
                  <button onClick={() => setDeleteId(o.id)} className="flex items-center justify-center px-3 py-2 text-sm border rounded-lg text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <OfferFormModal
          initial={formData}
          onSave={handleSave}
          onCancel={() => setModalOpen(false)}
          loading={createMut.isPending || updateMut.isPending}
        />
      )}

      {deleteId !== null && (
        <ConfirmDelete onConfirm={handleDelete} onCancel={() => setDeleteId(null)} ar={ar} loading={deleteMut.isPending} />
      )}
    </div>
  );
}
