import { useState } from "react";
import { useListOffers, useCreateOffer, useUpdateOffer, useDeleteOffer, getListOffersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/use-translation";
import { Plus, Edit2, Trash2, Star, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OfferForm {
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  price: number;
  currency: string;
  duration: string;
  imageUrl: string;
  destination: string;
  featured: boolean;
}

const emptyForm = (): OfferForm => ({
  titleAr: "", titleEn: "", descriptionAr: "", descriptionEn: "",
  price: 0, currency: "SAR", duration: "", imageUrl: "", destination: "", featured: false,
});

function OfferFormModal({
  initial, onSave, onCancel, loading,
}: { initial: OfferForm; onSave: (d: OfferForm) => void; onCancel: () => void; loading: boolean }) {
  const { language } = useTranslation();
  const ar = language === "ar";
  const [form, setForm] = useState(initial);
  const set = (k: keyof OfferForm, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-slate-800">{ar ? "تفاصيل العرض" : "Offer Details"}</h2>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "العنوان بالعربية" : "Title (Arabic)"} *</label>
              <input className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.titleAr} onChange={e => set("titleAr", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "العنوان بالإنجليزية" : "Title (English)"} *</label>
              <input className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.titleEn} onChange={e => set("titleEn", e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "الوصف بالعربية" : "Description (Arabic)"}</label>
              <textarea rows={3} className="w-full border rounded-xl px-4 py-2.5 text-sm resize-none" value={form.descriptionAr} onChange={e => set("descriptionAr", e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "الوصف بالإنجليزية" : "Description (English)"}</label>
              <textarea rows={3} className="w-full border rounded-xl px-4 py-2.5 text-sm resize-none" value={form.descriptionEn} onChange={e => set("descriptionEn", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "السعر" : "Price"} *</label>
              <input type="number" className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.price} onChange={e => set("price", Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "العملة" : "Currency"}</label>
              <select className="w-full border rounded-xl px-4 py-2.5 text-sm bg-white" value={form.currency} onChange={e => set("currency", e.target.value)}>
                <option value="SAR">SAR</option>
                <option value="USD">USD</option>
                <option value="AED">AED</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "المدة" : "Duration"} *</label>
              <input placeholder={ar ? "مثال: 7 ليالي / 8 أيام" : "e.g. 7 nights / 8 days"} className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.duration} onChange={e => set("duration", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "الوجهة" : "Destination"}</label>
              <input className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.destination} onChange={e => set("destination", e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "رابط الصورة" : "Image URL"} *</label>
              <input className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.imageUrl} onChange={e => set("imageUrl", e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => set("featured", !form.featured)}
                  className={`w-12 h-6 rounded-full transition-colors ${form.featured ? "bg-primary" : "bg-slate-200"} relative`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.featured ? "left-6" : "left-0.5"}`} />
                </div>
                <span className="text-sm font-medium text-slate-700">{ar ? "عرض مميز" : "Featured Offer"}</span>
              </label>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t bg-slate-50/50 rounded-b-2xl">
          <button onClick={onCancel} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">
            {ar ? "إلغاء" : "Cancel"}
          </button>
          <Button disabled={loading || !form.titleAr || !form.titleEn} onClick={() => onSave(form)}>
            {loading ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "حفظ" : "Save")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function OffersAdmin() {
  const { language } = useTranslation();
  const ar = language === "ar";
  const qc = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [formData, setFormData] = useState<OfferForm>(emptyForm());
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const { data: offers, isLoading } = useListOffers();
  const createOffer = useCreateOffer({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListOffersQueryKey() }); setShowForm(false); } } });
  const updateOffer = useUpdateOffer({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListOffersQueryKey() }); setShowForm(false); setEditing(null); } } });
  const deleteOffer = useDeleteOffer({ mutation: { onSuccess: () => { qc.invalidateQueries({ queryKey: getListOffersQueryKey() }); setDeleteConfirm(null); } } });

  const openNew = () => { setFormData(emptyForm()); setEditing(null); setShowForm(true); };
  const openEdit = (o: typeof offers extends (infer T)[] | undefined ? T : never) => {
    if (!o) return;
    setFormData({ titleAr: (o as {titleAr:string}).titleAr, titleEn: (o as {titleEn:string}).titleEn, descriptionAr: (o as {descriptionAr:string}).descriptionAr, descriptionEn: (o as {descriptionEn:string}).descriptionEn, price: (o as {price:number}).price, currency: (o as {currency?:string}).currency ?? "SAR", duration: (o as {duration:string}).duration, imageUrl: (o as {imageUrl:string}).imageUrl, destination: (o as {destination?:string|null}).destination ?? "", featured: (o as {featured:boolean}).featured });
    setEditing((o as {id:number}).id);
    setShowForm(true);
  };

  const handleSave = (data: OfferForm) => {
    if (editing) updateOffer.mutate({ id: editing, data });
    else createOffer.mutate({ data });
  };

  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl border border-slate-100 h-20 animate-pulse" />)}</div>;

  return (
    <div className="space-y-5">
      {(showForm || editing) && (
        <OfferFormModal
          initial={formData}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
          loading={createOffer.isPending || updateOffer.isPending}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="font-bold text-slate-800 text-lg mb-2">{ar ? "تأكيد الحذف" : "Confirm Delete"}</h3>
            <p className="text-slate-500 text-sm mb-6">{ar ? "هل أنت متأكد من حذف هذا العرض؟" : "Are you sure you want to delete this offer?"}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteConfirm(null)} className="px-5 py-2.5 rounded-xl border text-sm font-medium">{ar ? "إلغاء" : "Cancel"}</button>
              <Button variant="destructive" onClick={() => deleteOffer.mutate({ id: deleteConfirm })} disabled={deleteOffer.isPending}>{ar ? "حذف" : "Delete"}</Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="text-sm text-slate-500">{offers?.length ?? 0} {ar ? "عرض" : "offers"}</div>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" />{ar ? "إضافة عرض" : "Add Offer"}</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {!offers?.length ? (
          <div className="col-span-3 bg-white rounded-2xl border border-slate-100 p-16 text-center text-slate-400">{ar ? "لا توجد عروض" : "No offers yet"}</div>
        ) : (
          offers.map((offer) => (
            <div key={offer.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="relative h-44">
                <img src={offer.imageUrl || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800"} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                {offer.featured && (
                  <div className="absolute top-3 right-3 rtl:left-3 rtl:right-auto bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />{ar ? "مميز" : "Featured"}
                  </div>
                )}
                <div className="absolute bottom-3 left-3 rtl:right-3 rtl:left-auto text-white">
                  <div className="font-bold text-lg leading-tight">{ar ? offer.titleAr : offer.titleEn}</div>
                  <div className="text-white/80 text-sm">{offer.duration}</div>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-slate-500 line-clamp-2 mb-3">{ar ? offer.descriptionAr : offer.descriptionEn}</p>
                <div className="flex items-center justify-between">
                  <div className="font-bold text-primary text-lg">{(offer.price ?? 0).toLocaleString()} <span className="text-sm font-normal text-slate-400">{offer.currency}</span></div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(offer)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500 hover:text-primary">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => setDeleteConfirm(offer.id)} className="p-2 rounded-xl hover:bg-red-50 transition-colors text-slate-500 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
