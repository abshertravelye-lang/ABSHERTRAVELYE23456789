import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Eye, EyeOff, Star, Tag, AlertCircle, ChevronDown, ChevronUp, X } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

const API = "/api";

type ProgramStatus = "active" | "featured" | "new" | "special_offer" | "expired" | "hidden";

interface DailyItineraryItem {
  day: number;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
}

interface ProgramHotel {
  nameAr: string;
  nameEn: string;
  stars: number;
  city: string;
}

interface Program {
  id: number;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  country: string;
  cities: string[];
  price: number;
  currency: string;
  days: number;
  nights?: number;
  imageUrl: string;
  images: string[];
  dailyItinerary: DailyItineraryItem[];
  hotels: ProgramHotel[];
  airlines: string[];
  includedServices: string[];
  excludedServices: string[];
  bookingTerms?: string;
  cancellationPolicy?: string;
  status: ProgramStatus;
  featured: boolean;
  isActive: boolean;
  createdAt: string;
}

const emptyProgram = (): Omit<Program, "id" | "createdAt"> => ({
  titleAr: "",
  titleEn: "",
  descriptionAr: "",
  descriptionEn: "",
  country: "",
  cities: [],
  price: 0,
  currency: "SAR",
  days: 1,
  nights: undefined,
  imageUrl: "",
  images: [],
  dailyItinerary: [],
  hotels: [],
  airlines: [],
  includedServices: [],
  excludedServices: [],
  bookingTerms: "",
  cancellationPolicy: "",
  status: "active",
  featured: false,
  isActive: true,
});

const STATUS_LABELS: Record<ProgramStatus, { ar: string; en: string; color: string }> = {
  active:       { ar: "نشط",        en: "Active",        color: "bg-green-100 text-green-700" },
  featured:     { ar: "مميز",       en: "Featured",      color: "bg-yellow-100 text-yellow-700" },
  new:          { ar: "جديد",       en: "New",           color: "bg-blue-100 text-blue-700" },
  special_offer:{ ar: "عرض خاص",   en: "Special Offer", color: "bg-purple-100 text-purple-700" },
  expired:      { ar: "منتهي",      en: "Expired",       color: "bg-red-100 text-red-700" },
  hidden:       { ar: "مخفي",      en: "Hidden",        color: "bg-gray-100 text-gray-500" },
};

function arrayField(val: string): string[] {
  return val.split("\n").map(s => s.trim()).filter(Boolean);
}
function toTextarea(arr: string[]): string {
  return arr.join("\n");
}

function ProgramForm({
  initial,
  onSave,
  onCancel,
  loading,
}: {
  initial: Omit<Program, "id" | "createdAt">;
  onSave: (data: Omit<Program, "id" | "createdAt">) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const { language } = useTranslation();
  const ar = language === "ar";
  const [form, setForm] = useState(initial);
  const [tab, setTab] = useState<"basic" | "details" | "itinerary" | "terms">("basic");

  const set = (field: string, value: unknown) => setForm(f => ({ ...f, [field]: value }));

  const addItineraryDay = () => {
    const day = form.dailyItinerary.length + 1;
    set("dailyItinerary", [...form.dailyItinerary, { day, titleAr: "", titleEn: "", descriptionAr: "", descriptionEn: "" }]);
  };
  const removeItineraryDay = (i: number) => set("dailyItinerary", form.dailyItinerary.filter((_, idx) => idx !== i));
  const updateItinerary = (i: number, field: keyof DailyItineraryItem, value: string | number) => {
    const updated = [...form.dailyItinerary];
    updated[i] = { ...updated[i], [field]: value };
    set("dailyItinerary", updated);
  };

  const addHotel = () => set("hotels", [...form.hotels, { nameAr: "", nameEn: "", stars: 3, city: "" }]);
  const removeHotel = (i: number) => set("hotels", form.hotels.filter((_, idx) => idx !== i));
  const updateHotel = (i: number, field: keyof ProgramHotel, value: string | number) => {
    const updated = [...form.hotels];
    updated[i] = { ...updated[i], [field]: value };
    set("hotels", updated);
  };

  const tabs = [
    { id: "basic",     ar: "المعلومات الأساسية",   en: "Basic Info" },
    { id: "details",   ar: "الخدمات والتفاصيل",     en: "Services & Details" },
    { id: "itinerary", ar: "البرنامج اليومي",       en: "Daily Itinerary" },
    { id: "terms",     ar: "الشروط والسياسات",      en: "Terms & Policies" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-slate-800">{ar ? "تفاصيل البرنامج" : "Program Details"}</h2>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        {/* Tabs */}
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
          {/* BASIC INFO */}
          {tab === "basic" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "الاسم بالعربية" : "Title (Arabic)"} *</label>
                <input className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.titleAr} onChange={e => set("titleAr", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "الاسم بالإنجليزية" : "Title (English)"} *</label>
                <input className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.titleEn} onChange={e => set("titleEn", e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "الوصف بالعربية" : "Description (Arabic)"}</label>
                <textarea rows={3} className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.descriptionAr} onChange={e => set("descriptionAr", e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "الوصف بالإنجليزية" : "Description (English)"}</label>
                <textarea rows={3} className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.descriptionEn} onChange={e => set("descriptionEn", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "الدولة" : "Country"}</label>
                <input className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.country} onChange={e => set("country", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "المدن (سطر لكل مدينة)" : "Cities (one per line)"}</label>
                <textarea rows={2} className="w-full border rounded-xl px-4 py-2.5 text-sm" value={toTextarea(form.cities)} onChange={e => set("cities", arrayField(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "السعر" : "Price"} *</label>
                <input type="number" className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.price} onChange={e => set("price", Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "العملة" : "Currency"}</label>
                <select className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.currency} onChange={e => set("currency", e.target.value)}>
                  <option value="SAR">SAR - ريال سعودي</option>
                  <option value="USD">USD - دولار</option>
                  <option value="AED">AED - درهم</option>
                  <option value="EGP">EGP - جنيه مصري</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "عدد الأيام" : "Days"} *</label>
                <input type="number" min={1} className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.days} onChange={e => set("days", Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "عدد الليالي" : "Nights"}</label>
                <input type="number" min={0} className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.nights ?? ""} onChange={e => set("nights", e.target.value ? Number(e.target.value) : undefined)} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "رابط الصورة الرئيسية" : "Main Image URL"}</label>
                <input className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.imageUrl} onChange={e => set("imageUrl", e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "روابط الصور (سطر لكل صورة)" : "Image URLs (one per line)"}</label>
                <textarea rows={3} className="w-full border rounded-xl px-4 py-2.5 text-sm" value={toTextarea(form.images)} onChange={e => set("images", arrayField(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "حالة البرنامج" : "Program Status"}</label>
                <select className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.status} onChange={e => set("status", e.target.value as ProgramStatus)}>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{ar ? v.ar : v.en}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-6 pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-primary" checked={form.featured} onChange={e => set("featured", e.target.checked)} />
                  <span className="text-sm font-medium">{ar ? "مميز" : "Featured"}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-primary" checked={form.isActive} onChange={e => set("isActive", e.target.checked)} />
                  <span className="text-sm font-medium">{ar ? "مفعّل" : "Active"}</span>
                </label>
              </div>
            </div>
          )}

          {/* SERVICES & DETAILS */}
          {tab === "details" && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "شركات الطيران (سطر لكل شركة)" : "Airlines (one per line)"}</label>
                <textarea rows={3} className="w-full border rounded-xl px-4 py-2.5 text-sm" value={toTextarea(form.airlines)} onChange={e => set("airlines", arrayField(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "الخدمات المشمولة (سطر لكل خدمة)" : "Included Services (one per line)"}</label>
                <textarea rows={4} className="w-full border rounded-xl px-4 py-2.5 text-sm" value={toTextarea(form.includedServices)} onChange={e => set("includedServices", arrayField(e.target.value))} placeholder={ar ? "مثال:\nإقامة فندقية 5 نجوم\nجولات سياحية\nوجبات الإفطار" : "e.g.\n5-star hotel\nGuided tours\nBreakfast"} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "الخدمات غير المشمولة (سطر لكل خدمة)" : "Excluded Services (one per line)"}</label>
                <textarea rows={4} className="w-full border rounded-xl px-4 py-2.5 text-sm" value={toTextarea(form.excludedServices)} onChange={e => set("excludedServices", arrayField(e.target.value))} placeholder={ar ? "مثال:\nتذاكر الطيران\nتأشيرة السفر\nالوجبات الإضافية" : "e.g.\nAirline tickets\nVisa fees\nExtra meals"} />
              </div>

              {/* Hotels */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">{ar ? "الفنادق المستخدمة" : "Hotels"}</label>
                  <button onClick={addHotel} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium">
                    <Plus className="w-4 h-4" /> {ar ? "إضافة فندق" : "Add Hotel"}
                  </button>
                </div>
                {form.hotels.map((h, i) => (
                  <div key={i} className="flex gap-3 mb-3 p-3 bg-slate-50 rounded-xl">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <input placeholder={ar ? "اسم الفندق بالعربية" : "Hotel name (AR)"} className="border rounded-lg px-3 py-2 text-sm" value={h.nameAr} onChange={e => updateHotel(i, "nameAr", e.target.value)} />
                      <input placeholder={ar ? "اسم الفندق بالإنجليزية" : "Hotel name (EN)"} className="border rounded-lg px-3 py-2 text-sm" value={h.nameEn} onChange={e => updateHotel(i, "nameEn", e.target.value)} />
                      <input placeholder={ar ? "المدينة" : "City"} className="border rounded-lg px-3 py-2 text-sm" value={h.city} onChange={e => updateHotel(i, "city", e.target.value)} />
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">{ar ? "النجوم:" : "Stars:"}</span>
                        <select className="flex-1 border rounded-lg px-2 py-2 text-sm" value={h.stars} onChange={e => updateHotel(i, "stars", Number(e.target.value))}>
                          {[1,2,3,4,5].map(s => <option key={s} value={s}>{s} ★</option>)}
                        </select>
                      </div>
                    </div>
                    <button onClick={() => removeHotel(i)} className="text-red-400 hover:text-red-600 self-start mt-1"><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DAILY ITINERARY */}
          {tab === "itinerary" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-slate-700">{ar ? "البرنامج اليومي" : "Daily Itinerary"}</h3>
                <button onClick={addItineraryDay} className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium px-4 py-2 border border-primary rounded-xl">
                  <Plus className="w-4 h-4" /> {ar ? "إضافة يوم" : "Add Day"}
                </button>
              </div>
              {form.dailyItinerary.length === 0 && (
                <div className="text-center py-12 text-slate-400 border-2 border-dashed rounded-xl">
                  {ar ? "اضغط على إضافة يوم لبدء البرنامج اليومي" : "Click Add Day to start building the itinerary"}
                </div>
              )}
              {form.dailyItinerary.map((d, i) => (
                <div key={i} className="mb-4 p-4 bg-slate-50 rounded-xl border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-primary">{ar ? `اليوم ${d.day}` : `Day ${d.day}`}</span>
                    <button onClick={() => removeItineraryDay(i)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input placeholder={ar ? "عنوان اليوم بالعربية" : "Day title (AR)"} className="border rounded-lg px-3 py-2 text-sm" value={d.titleAr} onChange={e => updateItinerary(i, "titleAr", e.target.value)} />
                    <input placeholder={ar ? "عنوان اليوم بالإنجليزية" : "Day title (EN)"} className="border rounded-lg px-3 py-2 text-sm" value={d.titleEn} onChange={e => updateItinerary(i, "titleEn", e.target.value)} />
                    <textarea rows={3} placeholder={ar ? "وصف اليوم بالعربية" : "Day description (AR)"} className="border rounded-lg px-3 py-2 text-sm" value={d.descriptionAr} onChange={e => updateItinerary(i, "descriptionAr", e.target.value)} />
                    <textarea rows={3} placeholder={ar ? "وصف اليوم بالإنجليزية" : "Day description (EN)"} className="border rounded-lg px-3 py-2 text-sm" value={d.descriptionEn} onChange={e => updateItinerary(i, "descriptionEn", e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TERMS */}
          {tab === "terms" && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "شروط الحجز" : "Booking Terms"}</label>
                <textarea rows={6} className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.bookingTerms ?? ""} onChange={e => set("bookingTerms", e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{ar ? "سياسة الإلغاء" : "Cancellation Policy"}</label>
                <textarea rows={6} className="w-full border rounded-xl px-4 py-2.5 text-sm" value={form.cancellationPolicy ?? ""} onChange={e => set("cancellationPolicy", e.target.value)} />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t justify-end">
          <button onClick={onCancel} className="px-6 py-2.5 border rounded-xl text-slate-600 hover:bg-slate-50 text-sm">{ar ? "إلغاء" : "Cancel"}</button>
          <button
            onClick={() => onSave(form)}
            disabled={loading || !form.titleAr || !form.titleEn || !form.price || !form.days}
            className="px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 text-sm font-medium"
          >
            {loading ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "حفظ البرنامج" : "Save Program")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProgramsAdmin() {
  const { language } = useTranslation();
  const ar = language === "ar";
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Program | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const { data: programs = [], isLoading } = useQuery<Program[]>({
    queryKey: ["admin-programs"],
    queryFn: () => fetch(`${API}/programs`).then(r => r.json()),
  });

  const createMut = useMutation({
    mutationFn: (body: object) => fetch(`${API}/programs`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-programs"] }); setCreating(false); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: number; body: object }) =>
      fetch(`${API}/programs/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-programs"] }); setEditing(null); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => fetch(`${API}/programs/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-programs"] }); setDeleteConfirm(null); },
  });

  const toggleVisibility = (p: Program) => {
    updateMut.mutate({ id: p.id, body: { isActive: !p.isActive } });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{ar ? "إدارة البرامج السياحية" : "Tourist Programs"}</h1>
          <p className="text-slate-500 text-sm mt-1">{programs.length} {ar ? "برنامج" : "programs"}</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl hover:bg-primary/90 font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          {ar ? "برنامج جديد" : "New Program"}
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {programs.map(p => {
          const statusMeta = STATUS_LABELS[p.status] ?? STATUS_LABELS.active;
          return (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex gap-5">
              {p.imageUrl && (
                <img src={p.imageUrl} alt="" className="w-24 h-24 rounded-xl object-cover shrink-0" />
              )}
              {!p.imageUrl && (
                <div className="w-24 h-24 rounded-xl bg-slate-100 shrink-0 flex items-center justify-center text-slate-300 text-3xl">🌍</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-800">{ar ? p.titleAr : p.titleEn}</h3>
                    <p className="text-slate-500 text-sm">{ar ? p.titleEn : p.titleAr}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setEditing(p)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors" title={ar ? "تعديل" : "Edit"}>
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => toggleVisibility(p)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors" title={ar ? (p.isActive ? "إخفاء" : "إظهار") : (p.isActive ? "Hide" : "Show")}>
                      {p.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                    </button>
                    <button onClick={() => setDeleteConfirm(p.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-400 transition-colors" title={ar ? "حذف" : "Delete"}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusMeta.color}`}>{ar ? statusMeta.ar : statusMeta.en}</span>
                  {p.featured && <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-amber-100 text-amber-700">⭐ {ar ? "مميز" : "Featured"}</span>}
                  {!p.isActive && <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-500">{ar ? "مخفي" : "Hidden"}</span>}
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">{p.days} {ar ? "أيام" : "days"}</span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 font-bold">{p.currency} {p.price.toLocaleString()}</span>
                  {p.country && <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">🌍 {p.country}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {programs.length === 0 && !isLoading && (
        <div className="text-center py-20 text-slate-400">
          <div className="text-5xl mb-4">🌍</div>
          <p className="font-medium">{ar ? "لا توجد برامج بعد" : "No programs yet"}</p>
          <p className="text-sm mt-1">{ar ? "اضغط على برنامج جديد للبدء" : "Click New Program to get started"}</p>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">{ar ? "تأكيد الحذف" : "Confirm Delete"}</h3>
                <p className="text-sm text-slate-500">{ar ? "سيتم حذف البرنامج نهائياً" : "This program will be permanently deleted"}</p>
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

      {/* Create Form */}
      {creating && (
        <ProgramForm
          initial={emptyProgram()}
          onSave={(data) => createMut.mutate(data)}
          onCancel={() => setCreating(false)}
          loading={createMut.isPending}
        />
      )}

      {/* Edit Form */}
      {editing && (
        <ProgramForm
          initial={editing}
          onSave={(data) => updateMut.mutate({ id: editing.id, body: data })}
          onCancel={() => setEditing(null)}
          loading={updateMut.isPending}
        />
      )}
    </div>
  );
}
