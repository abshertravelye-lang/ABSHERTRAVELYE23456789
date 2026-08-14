import { useEffect, useState } from "react";
import { customFetch } from "@workspace/api-client-react";
import { useTranslation } from "@/hooks/use-translation";
import { COUNTRIES } from "@workspace/countries";
import { Save, FileText, Coins, Plus, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface UmrahFees {
  default: number;
  currency: string;
  byNationality: Record<string, number>;
}

interface UmrahSettings {
  umrah_declaration_ar: string;
  umrah_declaration_en: string;
  umrah_fees: UmrahFees;
}

const ALL_COUNTRIES = COUNTRIES.map(c => ({ en: c.nameEn, ar: c.nameAr }));

interface FeeRow { nationality: string; fee: number; }

function NationalityPicker({ value, onChange, exclude, ar }: {
  value: string; onChange: (v: string) => void; exclude: string[]; ar: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = ALL_COUNTRIES.filter(c =>
    !exclude.includes(c.en) &&
    (c.en.toLowerCase().includes(search.toLowerCase()) || c.ar.includes(search)),
  ).slice(0, 60);
  const selected = ALL_COUNTRIES.find(c => c.en === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full border rounded-xl px-4 py-2.5 text-sm bg-white text-start"
      >
        {selected ? (ar ? `${selected.ar} (${selected.en})` : `${selected.en} (${selected.ar})`) : (ar ? "اختر الجنسية" : "Select nationality")}
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border rounded-xl shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b relative">
            <Search className="w-4 h-4 absolute top-4 start-4 text-muted-foreground" />
            <input
              autoFocus
              className="w-full border rounded-lg ps-8 pe-3 py-1.5 text-sm"
              placeholder={ar ? "بحث..." : "Search..."}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-44 overflow-y-auto">
            {filtered.map(c => (
              <button
                key={c.en}
                type="button"
                onClick={() => { onChange(c.en); setOpen(false); setSearch(""); }}
                className="w-full px-4 py-2 text-sm text-start hover:bg-muted/50"
              >
                {ar ? `${c.ar} (${c.en})` : `${c.en} (${c.ar})`}
              </button>
            ))}
            {filtered.length === 0 && <div className="px-4 py-3 text-sm text-muted-foreground text-center">{ar ? "لا نتائج" : "No results"}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function UmrahSettingsAdmin() {
  const { language } = useTranslation();
  const ar = language === "ar";

  const [declarationAr, setDeclarationAr] = useState("");
  const [declarationEn, setDeclarationEn] = useState("");
  const [defaultFee, setDefaultFee] = useState(0);
  const [currency, setCurrency] = useState("SAR");
  const [feeRows, setFeeRows] = useState<FeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await customFetch<UmrahSettings>(`/api/settings/umrah`, { method: "GET" });
        if (cancelled) return;
        setDeclarationAr(data.umrah_declaration_ar ?? "");
        setDeclarationEn(data.umrah_declaration_en ?? "");
        setDefaultFee(data.umrah_fees?.default ?? 0);
        setCurrency(data.umrah_fees?.currency ?? "SAR");
        setFeeRows(
          Object.entries(data.umrah_fees?.byNationality ?? {}).map(([nationality, fee]) => ({ nationality, fee: Number(fee) })),
        );
      } catch {
        toast.error(ar ? "تعذّر تحميل إعدادات العمرة" : "Failed to load Umrah settings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addRow = () => setFeeRows(rows => [...rows, { nationality: "", fee: defaultFee }]);
  const updateRow = (i: number, patch: Partial<FeeRow>) => setFeeRows(rows => rows.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  const removeRow = (i: number) => setFeeRows(rows => rows.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    // Validate fee rows: unique, non-empty nationality.
    const byNationality: Record<string, number> = {};
    for (const r of feeRows) {
      if (!r.nationality) {
        toast.error(ar ? "يرجى اختيار الجنسية لكل صف رسوم" : "Please select a nationality for each fee row");
        return;
      }
      byNationality[r.nationality] = Number(r.fee) || 0;
    }
    setSaving(true);
    try {
      await customFetch(`/api/settings/umrah`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          umrah_declaration_ar: declarationAr,
          umrah_declaration_en: declarationEn,
          umrah_fees: { default: Number(defaultFee) || 0, currency, byNationality },
        }),
      });
      toast.success(ar ? "تم حفظ إعدادات العمرة بنجاح" : "Umrah settings saved successfully");
    } catch {
      toast.error(ar ? "حدث خطأ أثناء الحفظ" : "Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-muted-foreground">{ar ? "جارٍ التحميل..." : "Loading..."}</div>;
  }

  const usedNationalities = feeRows.map(r => r.nationality).filter(Boolean);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10" dir={ar ? "rtl" : "ltr"}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{ar ? "إعدادات العمرة" : "Umrah Settings"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{ar ? "تحرير نص الإقرار ورسوم تأشيرة العمرة" : "Edit the declaration text and Umrah visa fees"}</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="rounded-xl px-6 bg-[#0d2351] hover:bg-[#0d2351]/90">
          <Save className="w-4 h-4 me-2" />
          {saving ? (ar ? "جاري الحفظ..." : "Saving...") : (ar ? "حفظ التغييرات" : "Save Changes")}
        </Button>
      </div>

      {/* Declaration */}
      <div className="bg-card rounded-3xl border border-card-border p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">{ar ? "نص الإقرار والتعهد" : "Declaration & Undertaking"}</h2>
        </div>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">{ar ? "الإقرار (عربي)" : "Declaration (Arabic)"}</label>
            <textarea
              rows={10}
              dir="rtl"
              className="w-full border rounded-xl px-4 py-3 text-sm resize-y leading-relaxed"
              value={declarationAr}
              onChange={e => setDeclarationAr(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{ar ? "الإقرار (إنجليزي)" : "Declaration (English)"}</label>
            <textarea
              rows={10}
              dir="ltr"
              className="w-full border rounded-xl px-4 py-3 text-sm resize-y leading-relaxed"
              value={declarationEn}
              onChange={e => setDeclarationEn(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Fees */}
      <div className="bg-card rounded-3xl border border-card-border p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Coins className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">{ar ? "رسوم تأشيرة العمرة" : "Umrah Visa Fees"}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">{ar ? "الرسوم الافتراضية" : "Default Fee"}</label>
            <input type="number" min="0" className="w-full border rounded-xl px-4 py-2.5 text-sm" value={defaultFee} onChange={e => setDefaultFee(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{ar ? "العملة" : "Currency"}</label>
            <input className="w-full border rounded-xl px-4 py-2.5 text-sm" dir="ltr" value={currency} onChange={e => setCurrency(e.target.value)} />
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{ar ? "رسوم حسب الجنسية" : "Per-Nationality Fees"}</h3>
          <Button size="sm" variant="outline" onClick={addRow} className="gap-1.5">
            <Plus className="w-4 h-4" />{ar ? "إضافة صف" : "Add Row"}
          </Button>
        </div>

        {feeRows.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-6 border rounded-xl bg-slate-50">
            {ar ? "لا توجد رسوم مخصصة. تُطبَّق الرسوم الافتراضية على الجميع." : "No custom fees. The default fee applies to everyone."}
          </div>
        ) : (
          <div className="space-y-3">
            {feeRows.map((row, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end border rounded-2xl p-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">{ar ? "الجنسية" : "Nationality"}</label>
                  <NationalityPicker
                    value={row.nationality}
                    onChange={v => updateRow(i, { nationality: v })}
                    exclude={usedNationalities.filter(n => n !== row.nationality)}
                    ar={ar}
                  />
                </div>
                <div className="sm:w-40">
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">{ar ? "الرسوم" : "Fee"}</label>
                  <input type="number" min="0" className="w-full border rounded-xl px-4 py-2.5 text-sm" value={row.fee} onChange={e => updateRow(i, { fee: Number(e.target.value) })} />
                </div>
                <button type="button" onClick={() => removeRow(i)} className="shrink-0 h-[42px] px-3 border rounded-xl text-red-600 hover:bg-red-50 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
