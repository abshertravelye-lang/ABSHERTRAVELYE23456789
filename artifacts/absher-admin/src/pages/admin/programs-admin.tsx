import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListPrograms, useCreateProgram, useUpdateProgram, useDeleteProgram, getListProgramsQueryKey,
} from "@workspace/api-client-react";
import { useTranslation } from "@/hooks/use-translation";
import { Plus, Edit2, Trash2, X, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ProgramForm {
  titleAr: string; titleEn: string;
  descriptionAr: string; descriptionEn: string;
  destination: string; duration: string;
  price: number; currency: string;
  imageUrl: string; isActive: boolean;
}
const empty = (): ProgramForm => ({
  titleAr: "", titleEn: "", descriptionAr: "", descriptionEn: "",
  destination: "", duration: "", price: 0, currency: "SAR",
  imageUrl: "", isActive: true,
});

function Modal({ initial, onSave, onCancel, loading, ar }: {
  initial: ProgramForm; onSave: (d: ProgramForm) => void; onCancel: () => void; loading: boolean; ar: boolean;
}) {
  const [form, setForm] = useState(initial);
  const set = <K extends keyof ProgramForm>(k: K, v: ProgramForm[K]) => setForm(f => ({ ...f, [k]: v }));

  const canSave = !loading && !!form.titleAr && !!form.titleEn;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full sm:rounded-2xl sm:shadow-2xl sm:max-w-2xl sm:my-8 min-h-full sm:min-h-0 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b sticky top-0 bg-white z-10 sm:rounded-t-2xl">
          <h2 className="text-lg sm:text-xl font-bold">{ar ? "تفاصيل البرنامج السياحي" : "Program Details"}</h2>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">

          {/* ── Names ── */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">{ar ? "عنوان البرنامج" : "Program Title"}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">{ar ? "العنوان بالعربية" : "Title (Arabic)"} *</label>
                <input
                  className="w-full border rounded-xl px-4 py-2.5 text-sm"
                  placeholder={ar ? "مثال: رحلة تركيا السياحية" : "e.g. Turkey Tourism Trip"}
                  value={form.titleAr}
                  onChange={e => set("titleAr", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{ar ? "العنوان بالإنجليزية" : "Title (English)"} *</label>
                <input
                  className="w-full border rounded-xl px-4 py-2.5 text-sm"
                  placeholder="e.g. Turkey Tourism Trip"
                  value={form.titleEn}
                  onChange={e => set("titleEn", e.target.value)}
                  dir="ltr"
                />
              </div>
            </div>
          </section>

          {/* ── Descriptions ── */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">{ar ? "الوصف" : "Description"}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">{ar ? "الوصف بالعربية" : "Description (Arabic)"}</label>
                <textarea
                  rows={3}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm resize-none"
                  placeholder={ar ? "وصف مختصر للبرنامج..." : "Brief description..."}
                  value={form.descriptionAr}
                  onChange={e => set("descriptionAr", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{ar ? "الوصف بالإنجليزية" : "Description (English)"}</label>
                <textarea
                  rows={3}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm resize-none"
                  placeholder="Brief description..."
                  value={form.descriptionEn}
                  onChange={e => set("descriptionEn", e.target.value)}
                  dir="ltr"
                />
              </div>
            </div>
          </section>

          {/* ── Trip Info ── */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">{ar ? "تفاصيل الرحلة" : "Trip Info"}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{ar ? "الوجهة" : "Destination"}</label>
                <input
                  className="w-full border rounded-xl px-4 py-2.5 text-sm"
                  placeholder={ar ? "مثال: إسطنبول، تركيا" : "e.g. Istanbul, Turkey"}
                  value={form.destination}
                  onChange={e => set("destination", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{ar ? "مدة الرحلة" : "Duration"}</label>
                <input
                  className="w-full border rounded-xl px-4 py-2.5 text-sm"
                  placeholder={ar ? "مثال: 7 أيام" : "e.g. 7 days"}
                  value={form.duration}
                  onChange={e => set("duration", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{ar ? "السعر" : "Price"} *</label>
                <input
                  type="number"
                  min="0"
                  className="w-full border rounded-xl px-4 py-2.5 text-sm"
                  value={form.price}
                  onChange={e => set("price", Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{ar ? "العملة" : "Currency"}</label>
                <select
                  className="w-full border rounded-xl px-4 py-2.5 text-sm bg-white"
                  value={form.currency}
                  onChange={e => set("currency", e.target.value)}
                >
                  {["SAR", "USD", "EUR", "AED"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* ── Media ── */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">{ar ? "الصورة" : "Image"}</h3>
            <div>
              <label className="block text-sm font-medium mb-1">{ar ? "رابط الصورة (URL)" : "Image URL"}</label>
              <input
                className="w-full border rounded-xl px-4 py-2.5 text-sm"
                placeholder="https://example.com/image.jpg"
                value={form.imageUrl}
                onChange={e => set("imageUrl", e.target.value)}
                dir="ltr"
              />
              {form.imageUrl && (
                <img src={form.imageUrl} alt="preview" className="mt-2 w-full h-40 object-cover rounded-xl border" onError={e => (e.currentTarget.style.display = "none")} />
              )}
            </div>
          </section>

          {/* ── Status ── */}
          <label className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3 cursor-pointer">
            <input
              type="checkbox"
              id="active"
              checked={form.isActive}
              onChange={e => set("isActive", e.target.checked)}
              className="w-4 h-4 accent-green-600"
            />
            <span className="text-sm font-medium text-green-800">{ar ? "نشط (يظهر للعملاء)" : "Active (visible to customers)"}</span>
          </label>

          {!canSave && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              {ar ? "⚠️ يرجى إدخال عنوان البرنامج بالعربية والإنجليزية" : "⚠️ Program title in Arabic and English are required"}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t flex gap-3 justify-end sticky bottom-0 bg-white sm:rounded-b-2xl">
          <Button variant="outline" onClick={onCancel}>{ar ? "إلغاء" : "Cancel"}</Button>
          <Button onClick={() => onSave(form)} disabled={!canSave}>
            {loading ? (ar ? "جارٍ الحفظ..." : "Saving...") : (ar ? "حفظ البرنامج" : "Save Program")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ProgramsAdmin() {
  const { language } = useTranslation();
  const ar = language === "ar";
  const qc = useQueryClient();
  const { data: programs = [], isLoading } = useListPrograms();
  const createMut = useCreateProgram();
  const updateMut = useUpdateProgram();
  const deleteMut = useDeleteProgram();
  const [modal, setModal] = useState<{ mode: "create" | "edit"; id?: number; initial: ProgramForm } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  async function handleSave(form: ProgramForm) {
    if (!modal) return;
    try {
      const invalidate = () => qc.invalidateQueries({ queryKey: getListProgramsQueryKey() });
      if (modal.mode === "create") {
        await createMut.mutateAsync(form as never);
        toast.success(ar ? "تمت إضافة البرنامج بنجاح ✓" : "Program added successfully ✓");
      } else {
        await updateMut.mutateAsync({ id: modal.id!, data: form as never });
        toast.success(ar ? "تم تحديث البرنامج بنجاح ✓" : "Program updated successfully ✓");
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
      await qc.invalidateQueries({ queryKey: getListProgramsQueryKey() });
      setDeleteConfirm(null);
      toast.success(ar ? "تم حذف البرنامج" : "Program deleted");
    } catch {
      toast.error(ar ? "فشل الحذف" : "Delete failed");
    }
  }

  return (
    <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{ar ? "البرامج السياحية" : "Travel Programs"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{ar ? "إدارة البرامج والرحلات السياحية" : "Manage travel programs and tours"}</p>
        </div>
        <Button onClick={() => setModal({ mode: "create", initial: empty() })} className="gap-2">
          <Plus className="w-4 h-4" />
          {ar ? "إضافة برنامج" : "Add Program"}
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground">{ar ? "جارٍ التحميل..." : "Loading..."}</div>
      ) : (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="text-start px-6 py-3 font-medium text-muted-foreground">{ar ? "البرنامج" : "Program"}</th>
                <th className="text-start px-6 py-3 font-medium text-muted-foreground hidden sm:table-cell">{ar ? "الوجهة" : "Destination"}</th>
                <th className="text-start px-6 py-3 font-medium text-muted-foreground hidden sm:table-cell">{ar ? "المدة" : "Duration"}</th>
                <th className="text-start px-6 py-3 font-medium text-muted-foreground">{ar ? "السعر" : "Price"}</th>
                <th className="text-start px-6 py-3 font-medium text-muted-foreground hidden sm:table-cell">{ar ? "الحالة" : "Status"}</th>
                <th className="text-start px-6 py-3 font-medium text-muted-foreground">{ar ? "إجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {programs.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-muted-foreground">
                  <Map className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <div>{ar ? "لا توجد برامج" : "No programs found"}</div>
                </td></tr>
              ) : programs.map(p => (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium">{ar ? p.titleAr : p.titleEn}</div>
                    <div className="text-xs text-muted-foreground sm:hidden">{p.destination}</div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground hidden sm:table-cell">{p.destination}</td>
                  <td className="px-6 py-4 text-muted-foreground hidden sm:table-cell">{p.days ?? "—"}</td>
                  <td className="px-6 py-4 font-medium">{Number(p.price).toLocaleString()} {p.currency}</td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${p.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                      {p.isActive ? (ar ? "نشط" : "Active") : (ar ? "معطل" : "Inactive")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setModal({
                          mode: "edit", id: p.id,
                          initial: {
                            titleAr: p.titleAr, titleEn: p.titleEn,
                            descriptionAr: p.descriptionAr ?? "", descriptionEn: p.descriptionEn ?? "",
                            destination: p.destination ?? "", duration: p.days ? String(p.days) : "",
                            price: Number(p.price), currency: p.currency ?? "SAR",
                            imageUrl: p.imageUrl ?? "", isActive: p.isActive
                          }
                        })}
                        className="p-2 hover:bg-slate-100 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteConfirm(p.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal initial={modal.initial} onSave={handleSave} onCancel={() => setModal(null)} loading={createMut.isPending || updateMut.isPending} ar={ar} />
      )}

      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
            <h3 className="text-lg font-bold mb-2">{ar ? "تأكيد الحذف" : "Confirm Delete"}</h3>
            <p className="text-muted-foreground text-sm mb-6">{ar ? "هل أنت متأكد من حذف هذا البرنامج نهائياً؟" : "Are you sure you want to permanently delete this program?"}</p>
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
