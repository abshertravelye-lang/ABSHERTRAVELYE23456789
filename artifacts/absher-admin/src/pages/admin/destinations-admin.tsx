import { useState } from "react";
import { useListDestinations, useCreateDestination, useUpdateDestination, useDeleteDestination, getListDestinationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/use-translation";
import { Plus, Edit2, Trash2, Star, X, AlertCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DestForm {
  nameAr: string; nameEn: string;
  descriptionAr: string; descriptionEn: string;
  imageUrl: string; country: string; popular: boolean;
}

const emptyForm = (): DestForm => ({
  nameAr: "", nameEn: "", descriptionAr: "", descriptionEn: "",
  imageUrl: "", country: "", popular: false,
});

function DestFormModal({ initial, onSave, onCancel, loading }: {
  initial: DestForm; onSave: (d: DestForm) => void; onCancel: () => void; loading: boolean;
}) {
  const { language } = useTranslation();
  const ar = language === "ar";
  const [form, setForm] = useState(initial);
  const set = (k: keyof DestForm, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const canSave = !loading && !!form.nameAr && !!form.nameEn;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full sm:rounded-2xl sm:shadow-2xl sm:max-w-2xl sm:my-8 min-h-full sm:min-h-0 flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b sticky top-0 bg-white z-10 sm:rounded-t-2xl">
          <h2 className="text-lg sm:text-xl font-bold">{ar ? "تفاصيل الوجهة" : "Destination Details"}</h2>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{ar ? "الاسم بالعربية" : "Name (Arabic)"} *</label>
              <input className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.nameAr} onChange={e => set("nameAr", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{ar ? "الاسم بالإنجليزية" : "Name (English)"} *</label>
              <input className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.nameEn} onChange={e => set("nameEn", e.target.value)} dir="ltr" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{ar ? "الدولة" : "Country"} *</label>
                <input className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.country} onChange={e => set("country", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{ar ? "رابط الصورة" : "Image URL"}</label>
                <input className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.imageUrl} onChange={e => set("imageUrl", e.target.value)} dir="ltr" />
              </div>
            </div>
          </div>
          {form.imageUrl && <img src={form.imageUrl} alt="" className="w-full h-36 object-cover rounded-xl border" onError={e => (e.currentTarget.style.display = "none")} />}
          <div>
            <label className="block text-sm font-medium mb-1">{ar ? "الوصف بالعربية" : "Description (Arabic)"}</label>
            <textarea rows={3} className="w-full border rounded-xl px-4 py-2.5 text-sm resize-none" value={form.descriptionAr} onChange={e => set("descriptionAr", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{ar ? "الوصف بالإنجليزية" : "Description (English)"}</label>
            <textarea rows={3} className="w-full border rounded-xl px-4 py-2.5 text-sm resize-none" value={form.descriptionEn} onChange={e => set("descriptionEn", e.target.value)} dir="ltr" />
          </div>
          <label className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 cursor-pointer">
            <div onClick={() => set("popular", !form.popular)} className={`w-12 h-6 rounded-full transition-colors flex-shrink-0 ${form.popular ? "bg-amber-400" : "bg-slate-200"} relative`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.popular ? "start-6" : "start-0.5"}`} />
            </div>
            <span className="text-sm font-medium text-amber-800">{ar ? "وجهة شائعة (تظهر في الصفحة الرئيسية)" : "Popular (shown on homepage)"}</span>
          </label>
        </div>
        <div className="p-4 sm:p-6 border-t flex gap-3 justify-end sticky bottom-0 bg-white sm:rounded-b-2xl">
          <Button variant="outline" onClick={onCancel}>{ar ? "إلغاء" : "Cancel"}</Button>
          <Button disabled={!canSave} onClick={() => onSave(form)}>
            {loading ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "حفظ الوجهة" : "Save Destination")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function DestinationsAdmin() {
  const { language } = useTranslation();
  const ar = language === "ar";
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [formData, setFormData] = useState<DestForm>(emptyForm());
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const { data: destinations, isLoading } = useListDestinations();
  const createDest = useCreateDestination({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListDestinationsQueryKey() }); setShowForm(false); toast.success(ar ? "تمت إضافة الوجهة ✓" : "Destination added ✓"); }, onError: () => toast.error(ar ? "فشل الحفظ" : "Save failed") } });
  const updateDest = useUpdateDestination({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListDestinationsQueryKey() }); setShowForm(false); setEditing(null); toast.success(ar ? "تم التحديث ✓" : "Updated ✓"); }, onError: () => toast.error(ar ? "فشل التحديث" : "Update failed") } });
  const deleteDest = useDeleteDestination({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListDestinationsQueryKey() }); setDeleteConfirm(null); toast.success(ar ? "تم الحذف" : "Deleted"); }, onError: () => toast.error(ar ? "فشل الحذف" : "Delete failed") } });

  const openNew = () => { setFormData(emptyForm()); setEditing(null); setShowForm(true); };
  const openEdit = (d: NonNullable<typeof destinations>[0]) => {
    setFormData({ nameAr: d.nameAr, nameEn: d.nameEn, descriptionAr: d.descriptionAr, descriptionEn: d.descriptionEn, imageUrl: d.imageUrl, country: d.country, popular: d.popular ?? false });
    setEditing(d.id); setShowForm(true);
  };

  const handleSave = (data: DestForm) => {
    if (editing) updateDest.mutate({ id: editing, data });
    else createDest.mutate({ data });
  };

  if (isLoading) return <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">{[1,2,3].map(i => <div key={i} className="bg-card rounded-2xl border h-60 animate-pulse" />)}</div>;

  return (
    <div className="space-y-5">
      {showForm && (
        <DestFormModal initial={formData} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null); }} loading={createDest.isPending || updateDest.isPending} />
      )}

      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">{ar ? "تأكيد الحذف" : "Confirm Delete"}</h3>
            <p className="text-slate-500 text-sm mb-6">{ar ? "هل أنت متأكد من حذف هذه الوجهة؟" : "Are you sure you want to delete this destination?"}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteConfirm(null)} className="px-5 py-2.5 rounded-xl border text-sm font-medium">{ar ? "إلغاء" : "Cancel"}</button>
              <Button variant="destructive" onClick={() => deleteDest.mutate({ id: deleteConfirm! })} disabled={deleteDest.isPending}>{ar ? "حذف" : "Delete"}</Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">{destinations?.length ?? 0} {ar ? "وجهة" : "destinations"}</div>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" />{ar ? "إضافة وجهة" : "Add Destination"}</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {!destinations?.length ? (
          <div className="col-span-3 bg-card rounded-2xl border border-card-border p-16 text-center text-muted-foreground">{ar ? "لا توجد وجهات" : "No destinations yet"}</div>
        ) : (
          destinations.map((dest) => (
            <div key={dest.id} className="bg-card rounded-2xl border border-card-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="relative h-44">
                <img src={dest.imageUrl || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800"} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                {dest.popular && (
                  <div className="absolute top-3 end-3 bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />{ar ? "شائع" : "Popular"}
                  </div>
                )}
                <div className="absolute bottom-3 start-3 text-white">
                  <div className="font-bold text-lg leading-tight">{ar ? dest.nameAr : dest.nameEn}</div>
                  <div className="flex items-center gap-1 text-white/80 text-sm"><MapPin className="h-3 w-3" />{dest.country}</div>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{ar ? dest.descriptionAr : dest.descriptionEn}</p>
                <div className="flex justify-end gap-2">
                  <button onClick={() => openEdit(dest)} className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-primary"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => setDeleteConfirm(dest.id)} className="p-2 rounded-xl hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
