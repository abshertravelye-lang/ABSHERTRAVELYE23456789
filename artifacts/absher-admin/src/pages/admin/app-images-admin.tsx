/**
 * Unified app-image catalog admin page.
 *
 * Manages every admin-controllable image surface (home banners, service
 * cards, promotional strips) with upload, replace, delete, ordering,
 * scheduling (start/end window) and enable/disable — per category.
 */
import { useMemo, useState } from "react";
import {
  useListAppImagesAdmin,
  useCreateAppImage,
  useUpdateAppImage,
  useDeleteAppImage,
  getListAppImagesAdminQueryKey,
  getListAppImagesQueryKey,
  type AppImage,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/use-translation";
import { Plus, Edit2, Trash2, X, AlertCircle, ArrowUp, ArrowDown, CalendarClock, ImageOff, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ImageUpload, resolveImageSrc } from "@/components/image-upload";

/** Known categories — clients read these exact keys. */
const CATEGORIES: Array<{ key: string; labelAr: string; labelEn: string; hintAr: string; hintEn: string }> = [
  { key: "home_banner", labelAr: "بانرات الرئيسية", labelEn: "Home Banners", hintAr: "بانرات الشاشة الرئيسية في الجوال والموقع", hintEn: "Main home-screen banners (mobile & web)" },
  { key: "service_card", labelAr: "بطاقات الخدمات", labelEn: "Service Cards", hintAr: "صور بطاقات الخدمات في الشاشة الرئيسية", hintEn: "Home service card images" },
  { key: "promo", labelAr: "صور إعلانية", labelEn: "Promotional", hintAr: "صور ترويجية وإعلانية عامة", hintEn: "General promotional / advertising images" },
];

/**
 * Canonical service keys shared with BOTH clients. A service_card image is
 * assigned to a card via relatedEntityId = one of these keys (with
 * relatedEntityType = "service"); web and mobile match on the same key.
 */
const SERVICE_KEYS: Array<{ key: string; labelAr: string; labelEn: string }> = [
  { key: "flights", labelAr: "حجز الطيران", labelEn: "Flight Booking" },
  { key: "hotels", labelAr: "الفنادق", labelEn: "Hotels" },
  { key: "visas", labelAr: "التأشيرات", labelEn: "Visas" },
  { key: "umrah", labelAr: "تأشيرة العمرة", labelEn: "Umrah Visa" },
  { key: "programs", labelAr: "البرامج السياحية", labelEn: "Tourism Programs" },
];

interface FormState {
  category: string;
  titleAr: string;
  titleEn: string;
  imageUrl: string;
  linkUrl: string;
  serviceKey: string; // required when category === "service_card"
  sortOrder: number;
  startDate: string; // yyyy-MM-ddTHH:mm local or ""
  endDate: string;
  isActive: boolean;
}

const emptyForm = (category: string, nextOrder: number): FormState => ({
  category, titleAr: "", titleEn: "", imageUrl: "", linkUrl: "", serviceKey: "",
  sortOrder: nextOrder, startDate: "", endDate: "", isActive: true,
});

const toLocalInput = (iso: string | null | undefined): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromLocalInput = (v: string): string | null => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

function scheduleStatus(img: AppImage, ar: boolean): { label: string; cls: string } | null {
  const now = Date.now();
  if (!img.isActive) return { label: ar ? "معطّلة" : "Disabled", cls: "bg-slate-200 text-slate-600" };
  if (img.startDate && new Date(img.startDate).getTime() > now)
    return { label: ar ? "مجدولة" : "Scheduled", cls: "bg-blue-100 text-blue-700" };
  if (img.endDate && new Date(img.endDate).getTime() < now)
    return { label: ar ? "منتهية" : "Expired", cls: "bg-red-100 text-red-600" };
  return { label: ar ? "ظاهرة" : "Live", cls: "bg-green-100 text-green-700" };
}

function ImageFormModal({ initial, onSave, onCancel, loading }: {
  initial: FormState; onSave: (d: FormState) => void; onCancel: () => void; loading: boolean;
}) {
  const { language } = useTranslation();
  const ar = language === "ar";
  const [form, setForm] = useState(initial);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }));
  const isServiceCard = form.category === "service_card";
  const canSave = !loading && !!form.imageUrl && !!form.category && (!isServiceCard || !!form.serviceKey);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full sm:rounded-2xl sm:shadow-2xl sm:max-w-2xl sm:my-8 min-h-full sm:min-h-0 flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b sticky top-0 bg-white z-10 sm:rounded-t-2xl">
          <h2 className="text-lg sm:text-xl font-bold">{ar ? "تفاصيل الصورة" : "Image Details"}</h2>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{ar ? "الفئة" : "Category"} *</label>
            <select className="w-full border rounded-xl px-4 py-2.5 text-sm bg-white" value={form.category} onChange={e => set("category", e.target.value)}>
              {CATEGORIES.map(c => <option key={c.key} value={c.key}>{ar ? c.labelAr : c.labelEn}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{ar ? "الصورة" : "Image"} *</label>
            <ImageUpload value={form.imageUrl} onChange={v => set("imageUrl", v)} aspectRatio="16/9" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{ar ? "العنوان بالعربية" : "Title (Arabic)"}</label>
              <input className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.titleAr} onChange={e => set("titleAr", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{ar ? "العنوان بالإنجليزية" : "Title (English)"}</label>
              <input className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.titleEn} onChange={e => set("titleEn", e.target.value)} dir="ltr" />
            </div>
          </div>
          {isServiceCard && (
            <div>
              <label className="block text-sm font-medium mb-1">{ar ? "الخدمة المستهدفة" : "Target service"} *</label>
              <select className="w-full border rounded-xl px-4 py-2.5 text-sm bg-white" value={form.serviceKey} onChange={e => set("serviceKey", e.target.value)}>
                <option value="">{ar ? "اختر الخدمة..." : "Choose a service..."}</option>
                {SERVICE_KEYS.map(s => <option key={s.key} value={s.key}>{ar ? s.labelAr : s.labelEn}</option>)}
              </select>
              <p className="text-xs text-muted-foreground mt-1">{ar ? "الصورة ستستبدل صورة بطاقة هذه الخدمة في الجوال والموقع." : "This image replaces that service's card image on mobile & web."}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">{ar ? "رابط عند الضغط (اختياري)" : "Link on tap (optional)"}</label>
            <input className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.linkUrl} onChange={e => set("linkUrl", e.target.value)} dir="ltr" placeholder="/visas أو https://..." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1"><CalendarClock className="w-4 h-4" />{ar ? "تاريخ بدء العرض" : "Start showing"}</label>
              <input type="datetime-local" className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.startDate} onChange={e => set("startDate", e.target.value)} dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1"><CalendarClock className="w-4 h-4" />{ar ? "تاريخ انتهاء العرض" : "Stop showing"}</label>
              <input type="datetime-local" className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.endDate} onChange={e => set("endDate", e.target.value)} dir="ltr" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">{ar ? "اتركهما فارغين لعرض الصورة دائماً." : "Leave both empty to always show the image."}</p>
          <label className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => set("isActive", e.target.checked)} className="w-4 h-4 accent-green-600" />
            <span className="text-sm font-medium text-green-800">{ar ? "مفعّلة (تظهر للعملاء)" : "Active (visible to customers)"}</span>
          </label>
        </div>
        <div className="p-4 sm:p-6 border-t flex gap-3 justify-end sticky bottom-0 bg-white sm:rounded-b-2xl">
          <Button variant="outline" onClick={onCancel}>{ar ? "إلغاء" : "Cancel"}</Button>
          <Button disabled={!canSave} onClick={() => onSave(form)}>
            {loading ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "حفظ" : "Save")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AppImagesAdmin() {
  const { language } = useTranslation();
  const ar = language === "ar";
  const qc = useQueryClient();
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].key);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormState>(emptyForm(CATEGORIES[0].key, 0));
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const { data: allImages, isLoading } = useListAppImagesAdmin();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getListAppImagesAdminQueryKey() });
    qc.invalidateQueries({ queryKey: getListAppImagesQueryKey() });
  };

  const createImage = useCreateAppImage({ mutation: { onSuccess: () => { invalidate(); setShowForm(false); toast.success(ar ? "تمت إضافة الصورة ✓" : "Image added ✓"); }, onError: () => toast.error(ar ? "فشل حفظ الصورة" : "Failed to save image") } });
  const updateImage = useUpdateAppImage({ mutation: { onSuccess: () => { invalidate(); setShowForm(false); setEditing(null); toast.success(ar ? "تم التحديث ✓" : "Updated ✓"); }, onError: () => toast.error(ar ? "فشل التحديث" : "Failed to update") } });
  const deleteImage = useDeleteAppImage({ mutation: { onSuccess: () => { invalidate(); setDeleteConfirm(null); toast.success(ar ? "تم الحذف" : "Deleted"); }, onError: () => toast.error(ar ? "فشل الحذف" : "Delete failed") } });

  const images = useMemo(
    () => (allImages ?? []).filter(i => i.category === activeCategory).sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
    [allImages, activeCategory],
  );

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const i of allImages ?? []) m[i.category] = (m[i.category] ?? 0) + 1;
    return m;
  }, [allImages]);

  const openNew = () => {
    const nextOrder = images.length ? Math.max(...images.map(i => i.sortOrder)) + 1 : 0;
    setFormData(emptyForm(activeCategory, nextOrder));
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (img: AppImage) => {
    setFormData({
      category: img.category,
      titleAr: img.titleAr ?? "",
      titleEn: img.titleEn ?? "",
      imageUrl: img.imageUrl,
      linkUrl: img.linkUrl ?? "",
      serviceKey: img.relatedEntityType === "service" ? (img.relatedEntityId ?? "") : "",
      sortOrder: img.sortOrder,
      startDate: toLocalInput(img.startDate),
      endDate: toLocalInput(img.endDate),
      isActive: img.isActive,
    });
    setEditing(img.id);
    setShowForm(true);
  };

  const handleSave = (data: FormState) => {
    const payload = {
      category: data.category,
      titleAr: data.titleAr || null,
      titleEn: data.titleEn || null,
      imageUrl: data.imageUrl,
      linkUrl: data.linkUrl || null,
      relatedEntityType: data.category === "service_card" && data.serviceKey ? "service" : null,
      relatedEntityId: data.category === "service_card" && data.serviceKey ? data.serviceKey : null,
      sortOrder: data.sortOrder,
      startDate: fromLocalInput(data.startDate),
      endDate: fromLocalInput(data.endDate),
      isActive: data.isActive,
    };
    if (editing) updateImage.mutate({ id: editing, data: payload });
    else createImage.mutate({ data: payload });
  };

  /** Swap sortOrder with the neighbour above/below. */
  const move = (img: AppImage, dir: -1 | 1) => {
    const idx = images.findIndex(i => i.id === img.id);
    const neighbour = images[idx + dir];
    if (!neighbour) return;
    // Ensure distinct orders even if both were 0.
    const a = img.sortOrder === neighbour.sortOrder ? neighbour.sortOrder + (dir === -1 ? -1 : 1) : neighbour.sortOrder;
    updateImage.mutate({ id: img.id, data: { sortOrder: a } });
    updateImage.mutate({ id: neighbour.id, data: { sortOrder: img.sortOrder } });
  };

  const toggleActive = (img: AppImage) => updateImage.mutate({ id: img.id, data: { isActive: !img.isActive } });

  const catInfo = CATEGORIES.find(c => c.key === activeCategory)!;

  /** For service_card: find the active managed image for each service key */
  const serviceCardMap = useMemo(() => {
    const m: Record<string, AppImage | undefined> = {};
    for (const img of allImages ?? []) {
      if (img.category === "service_card" && img.relatedEntityType === "service" && img.relatedEntityId) {
        // Prefer active over inactive if multiple exist
        const existing = m[img.relatedEntityId];
        if (!existing || (!existing.isActive && img.isActive)) m[img.relatedEntityId] = img;
      }
    }
    return m;
  }, [allImages]);

  /** Open add-form pre-filled for a specific service key */
  const openNewForService = (serviceKey: string) => {
    const nextOrder = images.length ? Math.max(...images.map(i => i.sortOrder)) + 1 : 0;
    setFormData({ ...emptyForm("service_card", nextOrder), serviceKey });
    setEditing(null);
    setShowForm(true);
  };

  /** Open edit-form for an existing service card */
  const openEditServiceCard = (img: AppImage) => {
    openEdit(img);
  };

  if (isLoading) return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="bg-card rounded-2xl border h-20 animate-pulse" />)}</div>;

  return (
    <div className="space-y-5">
      {showForm && (
        <ImageFormModal initial={formData} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} loading={createImage.isPending || updateImage.isPending} />
      )}

      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">{ar ? "تأكيد الحذف" : "Confirm Delete"}</h3>
            <p className="text-slate-500 text-sm mb-6">{ar ? "هل أنت متأكد من حذف هذه الصورة؟" : "Are you sure you want to delete this image?"}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteConfirm(null)} className="px-5 py-2.5 rounded-xl border text-sm font-medium">{ar ? "إلغاء" : "Cancel"}</button>
              <Button variant="destructive" onClick={() => deleteImage.mutate({ id: deleteConfirm! })} disabled={deleteImage.isPending}>{ar ? "حذف" : "Delete"}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            onClick={() => setActiveCategory(c.key)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border ${activeCategory === c.key ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-card-border hover:bg-muted"}`}
          >
            {ar ? c.labelAr : c.labelEn}
            <span className="ms-2 text-xs opacity-70">({counts[c.key] ?? 0})</span>
          </button>
        ))}
      </div>

      {/* ── Service Cards quick panel ─────────────────────────────────────── */}
      {activeCategory === "service_card" && (
        <>
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <p className="text-sm text-blue-800 font-medium mb-1">
              {ar ? "🖼 لوحة صور بطاقات الخدمات الرئيسية" : "🖼 Home Service Card Images"}
            </p>
            <p className="text-xs text-blue-600">
              {ar
                ? "اضغط على أي بطاقة لاستبدال صورتها مباشرةً. الصور تظهر فوراً في تطبيق الجوال."
                : "Tap any card to replace its image instantly. Changes appear immediately in the mobile app."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {SERVICE_KEYS.map(sk => {
              const managed = serviceCardMap[sk.key];
              const hasImage = !!managed;
              const isActive = managed?.isActive ?? false;
              const imgSrc = managed ? resolveImageSrc(managed.imageUrl) : null;

              return (
                <div
                  key={sk.key}
                  className="bg-card rounded-2xl border border-card-border overflow-hidden shadow-sm flex flex-col"
                >
                  {/* Image preview area */}
                  <div className="relative h-32 bg-muted">
                    {imgSrc ? (
                      <img src={imgSrc} alt={ar ? sk.labelAr : sk.labelEn} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-muted-foreground">
                        <ImageOff className="w-7 h-7 opacity-40" />
                        <span className="text-xs opacity-60">{ar ? "صورة افتراضية" : "Default image"}</span>
                      </div>
                    )}
                    {/* Active badge */}
                    {hasImage && (
                      <span className={`absolute top-2 end-2 text-xs font-bold px-2 py-0.5 rounded-full ${isActive ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500"}`}>
                        {isActive ? (ar ? "ظاهرة" : "Live") : (ar ? "معطّلة" : "Off")}
                      </span>
                    )}
                  </div>

                  {/* Card footer */}
                  <div className="p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{ar ? sk.labelAr : sk.labelEn}</p>
                      {hasImage && managed && (
                        <p className="text-xs text-muted-foreground truncate">
                          {(ar ? managed.titleAr : managed.titleEn) || (ar ? managed.titleEn : managed.titleAr) || (ar ? "بدون عنوان" : "Untitled")}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {hasImage && managed ? (
                        <>
                          <button
                            onClick={() => openEditServiceCard(managed)}
                            className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                            title={ar ? "تعديل" : "Edit"}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(managed.id)}
                            className="p-2 rounded-xl hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-500"
                            title={ar ? "حذف" : "Delete"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => openNewForService(sk.key)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          {ar ? "رفع صورة" : "Upload"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-2 border-t">
            <p className="text-sm text-muted-foreground">{ar ? "جميع السجلات (متقدم)" : "All records (advanced)"}</p>
            <Button onClick={openNew} variant="outline" className="gap-2"><Plus className="h-4 w-4" />{ar ? "إضافة يدوياً" : "Add manually"}</Button>
          </div>
        </>
      )}

      {/* ── Non-service-card categories ───────────────────────────────────── */}
      {activeCategory !== "service_card" && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">{ar ? catInfo.hintAr : catInfo.hintEn}</div>
          <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" />{ar ? "إضافة صورة" : "Add Image"}</Button>
        </div>
      )}

      {!images.length ? (
        <div className="bg-card rounded-2xl border border-card-border p-16 text-center text-muted-foreground flex flex-col items-center gap-3">
          <ImageOff className="w-10 h-10 opacity-40" />
          <div>{ar ? "لا توجد صور في هذه الفئة — سيستخدم التطبيق الصور الافتراضية." : "No images in this category — the app will use built-in defaults."}</div>
        </div>
      ) : (
        <div className="space-y-3">
          {images.map((img, idx) => {
            const status = scheduleStatus(img, ar);
            const serviceKey = img.relatedEntityType === "service" ? img.relatedEntityId : null;
            const serviceLabelObj = serviceKey ? SERVICE_KEYS.find(s => s.key === serviceKey) : null;
            return (
              <div key={img.id} className="bg-card rounded-2xl border border-card-border p-3 flex items-center gap-4 shadow-sm">
                {/* Order controls */}
                <div className="flex flex-col gap-1 shrink-0">
                  <button disabled={idx === 0 || updateImage.isPending} onClick={() => move(img, -1)} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 text-muted-foreground"><ArrowUp className="w-4 h-4" /></button>
                  <button disabled={idx === images.length - 1 || updateImage.isPending} onClick={() => move(img, 1)} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 text-muted-foreground"><ArrowDown className="w-4 h-4" /></button>
                </div>
                {/* Preview */}
                <div className="w-36 h-20 rounded-xl overflow-hidden bg-muted shrink-0 border">
                  <img
                    src={resolveImageSrc(img.imageUrl)}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
                {/* Meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="font-semibold text-sm truncate">{(ar ? img.titleAr : img.titleEn) || (ar ? img.titleEn : img.titleAr) || (ar ? "بدون عنوان" : "Untitled")}</div>
                    {serviceLabelObj && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 shrink-0">
                        {ar ? serviceLabelObj.labelAr : serviceLabelObj.labelEn}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate" dir="ltr">{img.linkUrl || "—"}</div>
                  {(img.startDate || img.endDate) && (
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1" dir="ltr">
                      <CalendarClock className="w-3 h-3" />
                      {img.startDate ? new Date(img.startDate).toLocaleDateString() : "…"} → {img.endDate ? new Date(img.endDate).toLocaleDateString() : "…"}
                    </div>
                  )}
                </div>
                {/* Status + toggle */}
                {status && <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${status.cls}`}>{status.label}</span>}
                <div
                  onClick={() => toggleActive(img)}
                  className={`w-12 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${img.isActive ? "bg-green-500" : "bg-slate-200"} relative`}
                  title={ar ? (img.isActive ? "تعطيل" : "تفعيل") : (img.isActive ? "Disable" : "Enable")}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${img.isActive ? "start-6" : "start-0.5"}`} />
                </div>
                {/* Actions */}
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(img)} className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-primary"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => setDeleteConfirm(img.id)} className="p-2 rounded-xl hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
