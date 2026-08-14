import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { setNavigationBlocker } from "@/lib/navigation-guard";
import { useTranslation } from "@/hooks/use-translation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateVisaApplication, Visa, VisaApplicationInput } from "@workspace/api-client-react";
import { CountrySelect } from "@/components/country-select";
import { useObjectUrl } from "@/components/auth-image";
import { authHeader } from "@/lib/objectMedia";
import { COUNTRIES } from "@workspace/countries";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  CheckCircle, X, UploadCloud, AlertCircle, ArrowRight, ArrowLeft,
  User, FileText, Phone, Mail, Globe, Calendar, Shield, CreditCard,
  Home, Award, Stamp, Info, Eye, Send, ChevronDown,
} from "lucide-react";

/* ── Types ── */
type StepId = "gcc_check" | "alternative_check" | "nationality_check" | "application_form" | "rejection" | "success";

interface WizardData {
  hasGcc?: boolean;
  gccCountry?: string;
  hasAlternative?: boolean;
  alternativeRegion?: string;
  nationality?: string;
  fullName?: string;
  passportNumber?: string;
  passportIssueDate?: string;
  passportExpiryDate?: string;
  dateOfBirth?: string;
  gender?: "male" | "female";
  email?: string;
  phone?: string;
  phoneDialCode?: string;
  agreedToTerms?: boolean;
  passportImageUrl?: string;
  personalPhotoUrl?: string;
  residencyImageUrl?: string;
  residencyBackImageUrl?: string;
  visaImageUrl?: string;
  alternativeVisaNumber?: string;
  alternativeVisaExpiry?: string;
}

const GCC_COUNTRIES = [
  { id: "saudi_arabia", ar: "المملكة العربية السعودية", en: "Saudi Arabia" },
  { id: "uae",          ar: "الإمارات العربية المتحدة", en: "UAE" },
  { id: "kuwait",       ar: "الكويت",                  en: "Kuwait" },
  { id: "qatar",        ar: "قطر",                     en: "Qatar" },
  { id: "bahrain",      ar: "البحرين",                 en: "Bahrain" },
  { id: "oman",         ar: "سلطنة عُمان",             en: "Oman" },
];

/* ── Step meta ── */
const STEP_META: Record<StepId, { arTitle: string; enTitle: string; icon: React.ReactNode }> = {
  gcc_check:          { arTitle: "إقامة خليجية",     enTitle: "GCC Residency",    icon: <Home className="w-4 h-4" /> },
  alternative_check:  { arTitle: "تأشيرة بديلة",    enTitle: "Alt. Visa",        icon: <Award className="w-4 h-4" /> },
  nationality_check:  { arTitle: "الجنسية",          enTitle: "Nationality",      icon: <Globe className="w-4 h-4" /> },
  application_form:   { arTitle: "بيانات الطلب",     enTitle: "Application",      icon: <FileText className="w-4 h-4" /> },
  rejection:          { arTitle: "غير مؤهل",          enTitle: "Not Eligible",     icon: <X className="w-4 h-4" /> },
  success:            { arTitle: "تم التقديم",        enTitle: "Submitted",        icon: <CheckCircle className="w-4 h-4" /> },
};

/* ── Comprehensive dial code map for all countries ── */
const DIAL_CODE_MAP: Record<string, string> = {
  AC:"+247", AD:"+376", AE:"+971", AF:"+93",  AG:"+1268",AL:"+355",
  AM:"+374", AO:"+244", AR:"+54",  AS:"+1684",AT:"+43",  AU:"+61",
  AW:"+297", AZ:"+994", BA:"+387", BB:"+1246",BD:"+880", BE:"+32",
  BF:"+226", BG:"+359", BH:"+973", BI:"+257", BJ:"+229", BN:"+673",
  BO:"+591", BR:"+55",  BS:"+1242",BT:"+975", BW:"+267", BY:"+375",
  BZ:"+501", CA:"+1",   CD:"+243", CF:"+236", CG:"+242", CH:"+41",
  CI:"+225", CL:"+56",  CM:"+237", CN:"+86",  CO:"+57",  CR:"+506",
  CU:"+53",  CV:"+238", CY:"+357", CZ:"+420", DE:"+49",  DJ:"+253",
  DK:"+45",  DM:"+1767",DO:"+1809",DZ:"+213", EC:"+593", EE:"+372",
  EG:"+20",  ER:"+291", ES:"+34",  ET:"+251", FI:"+358", FJ:"+679",
  FM:"+691", FR:"+33",  GA:"+241", GB:"+44",  GD:"+1473",GE:"+995",
  GH:"+233", GM:"+220", GN:"+224", GQ:"+240", GR:"+30",  GT:"+502",
  GW:"+245", GY:"+592", HN:"+504", HR:"+385", HT:"+509", HU:"+36",
  ID:"+62",  IE:"+353", IL:"+972", IN:"+91",  IQ:"+964", IR:"+98",
  IS:"+354", IT:"+39",  JM:"+1876",JO:"+962", JP:"+81",  KE:"+254",
  KG:"+996", KH:"+855", KI:"+686", KM:"+269", KN:"+1869",KP:"+850",
  KR:"+82",  KW:"+965", KZ:"+7",   LA:"+856", LB:"+961", LC:"+1758",
  LI:"+423", LK:"+94",  LR:"+231", LS:"+266", LT:"+370", LU:"+352",
  LV:"+371", LY:"+218", MA:"+212", MC:"+377", MD:"+373", ME:"+382",
  MG:"+261", MH:"+692", MK:"+389", ML:"+223", MM:"+95",  MN:"+976",
  MR:"+222", MT:"+356", MU:"+230", MV:"+960", MW:"+265", MX:"+52",
  MY:"+60",  MZ:"+258", NA:"+264", NE:"+227", NG:"+234", NI:"+505",
  NL:"+31",  NO:"+47",  NP:"+977", NR:"+674", NZ:"+64",  OM:"+968",
  PA:"+507", PE:"+51",  PG:"+675", PH:"+63",  PK:"+92",  PL:"+48",
  PR:"+1787",PS:"+970", PT:"+351", PW:"+680", PY:"+595", QA:"+974",
  RO:"+40",  RS:"+381", RU:"+7",   RW:"+250", SA:"+966", SB:"+677",
  SC:"+248", SD:"+249", SE:"+46",  SG:"+65",  SI:"+386", SK:"+421",
  SL:"+232", SM:"+378", SN:"+221", SO:"+252", SR:"+597", SS:"+211",
  ST:"+239", SV:"+503", SY:"+963", SZ:"+268", TD:"+235", TG:"+228",
  TH:"+66",  TJ:"+992", TL:"+670", TM:"+993", TN:"+216", TO:"+676",
  TR:"+90",  TT:"+1868",TV:"+688", TZ:"+255", UA:"+380", UG:"+256",
  US:"+1",   UY:"+598", UZ:"+998", VA:"+39",  VC:"+1784",VE:"+58",
  VN:"+84",  VU:"+678", WS:"+685", YE:"+967", ZA:"+27",  ZM:"+260",
  ZW:"+263",
};

/* ── All countries with dial codes, sorted: Arab/common first, then rest ── */
const PRIORITY_CODES = ["YE","SA","AE","OM","KW","QA","BH","EG","JO","IQ","SY","LB","MA","DZ","TN","LY","SD","SO","MR","PS","DJ","KM"];
const ALL_DIAL_COUNTRIES = COUNTRIES.filter(c => DIAL_CODE_MAP[c.code]);
const DIAL_CODES = [
  ...PRIORITY_CODES.map(code => ALL_DIAL_COUNTRIES.find(c => c.code === code)).filter(Boolean),
  ...ALL_DIAL_COUNTRIES.filter(c => !PRIORITY_CODES.includes(c.code)).sort((a, b) => a.nameEn.localeCompare(b.nameEn)),
] as typeof COUNTRIES;

function PhoneWithDialCode({
  value, dialCode, onValueChange, onDialChange, ar, className,
}: {
  value: string;
  dialCode: string;
  onValueChange: (v: string) => void;
  onDialChange: (v: string) => void;
  ar: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = DIAL_CODES.find(c => c.code === dialCode) ?? DIAL_CODES[2];

  return (
    <div className={`flex border border-slate-200 rounded-xl overflow-hidden bg-slate-50 focus-within:ring-2 focus-within:ring-[#0d2351]/20 focus-within:border-[#0d2351]/40 transition-all ${className ?? ""}`}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-2.5 border-e border-slate-200 bg-slate-100 hover:bg-slate-200 transition-colors shrink-0 text-sm font-medium text-slate-700"
          >
            <span className="text-base leading-none">{selected?.flag}</span>
            <span className="text-xs text-slate-500 font-mono">{selected ? DIAL_CODE_MAP[selected.code] : ""}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-1" align={ar ? "end" : "start"}>
          <div className="max-h-56 overflow-y-auto space-y-0.5">
            {DIAL_CODES.map(c => (
              <button
                key={c.code}
                type="button"
                onClick={() => { onDialChange(c.code); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-start ${dialCode === c.code ? "bg-[#0d2351]/10 text-[#0d2351] font-semibold" : "hover:bg-slate-50 text-slate-700"}`}
              >
                <span className="text-base leading-none">{c.flag}</span>
                <span className="font-mono text-xs text-slate-500 w-10 shrink-0">{DIAL_CODE_MAP[c.code]}</span>
                <span className="truncate">{ar ? c.nameAr : c.nameEn}</span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <input
        type="tel"
        value={value}
        onChange={e => onValueChange(e.target.value)}
        placeholder={ar ? "7xxxxxxxx" : "7xxxxxxxx"}
        className="flex-1 px-3 py-2.5 bg-transparent text-sm text-slate-800 focus:outline-none placeholder:text-slate-300"
        dir="ltr"
      />
    </div>
  );
}

/* ── 3-Select Date Picker ── */
const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function parseDateParts(iso?: string): { day: string; month: string; year: string } {
  if (!iso) return { day: "", month: "", year: "" };
  const [year, month, day] = iso.split("-");
  return {
    day: day ? String(parseInt(day, 10)) : "",
    month: month ? String(parseInt(month, 10)) : "",
    year: year || "",
  };
}

function buildIso(day: string, month: string, year: string): string {
  if (!day || !month || !year) return "";
  return `${year}-${String(Number(month)).padStart(2, "0")}-${String(Number(day)).padStart(2, "0")}`;
}

function DateSelectPicker({
  value, onChange, ar, minYear, maxYear,
}: {
  value?: string;
  onChange: (iso: string) => void;
  ar: boolean;
  minYear: number;
  maxYear: number;
}) {
  const { day, month, year } = parseDateParts(value);
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => String(maxYear - i));
  const months = ar ? MONTHS_AR : MONTHS_EN;
  const daysCount = day && month && year ? new Date(Number(year), Number(month), 0).getDate() : 31;
  const days = Array.from({ length: daysCount }, (_, i) => String(i + 1));

  const sel = "h-10 border-slate-200 bg-slate-50 rounded-xl text-sm focus:border-[#0d2351]/40 focus:ring-[#0d2351]/15";

  return (
    <div className="flex gap-2" dir="ltr">
      <Select value={day} onValueChange={d => onChange(buildIso(d, month, year))}>
        <SelectTrigger className={`${sel} w-[68px]`}>
          <SelectValue placeholder={ar ? "يوم" : "Day"} />
        </SelectTrigger>
        <SelectContent>
          {days.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={month} onValueChange={m => onChange(buildIso(day, m, year))}>
        <SelectTrigger className={`${sel} flex-1`}>
          <SelectValue placeholder={ar ? "شهر" : "Month"} />
        </SelectTrigger>
        <SelectContent>
          {months.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={year} onValueChange={y => onChange(buildIso(day, month, y))}>
        <SelectTrigger className={`${sel} w-[84px]`}>
          <SelectValue placeholder={ar ? "سنة" : "Year"} />
        </SelectTrigger>
        <SelectContent>
          {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

/* ── Upload field ── */
function FileUploadField({ label, value, onChange, required, language, imageOnly }: {
  label: string; value?: string; onChange: (val: string) => void; required?: boolean; language: string; imageOnly?: boolean;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Show local preview immediately for images
    if (file.type.startsWith("image/")) {
      const local = URL.createObjectURL(file);
      setPreviewUrl(local);
    }
    setIsUploading(true);
    setError(null);
    setProgress(10);
    try {
      const formData = new FormData();
      formData.append("file", file);
      setProgress(40);
      const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
      const res = await fetch(`${base}/api/storage/uploads`, { method: "POST", headers: authHeader(), body: formData });
      setProgress(90);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "فشل الرفع");
      }
      const data = await res.json();
      setProgress(100);
      onChange(data.objectPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل الرفع");
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onChange("");
    setPreviewUrl(null);
    setError(null);
  };

  const isImage = imageOnly || (value && /\.(jpg|jpeg|png|gif|webp)$/i.test(value));
  // For an existing stored object path, fetch it as a blob with the auth header
  // (no token in URL). A freshly-picked local previewUrl always takes priority.
  const storedObjectUrl = useObjectUrl(!previewUrl && value && isImage ? value : null);
  const displayPreview = previewUrl || storedObjectUrl || null;

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
        {label} {required && <span className="text-red-400">*</span>}
      </Label>
      {value ? (
        <div className={`border border-emerald-200 rounded-xl bg-emerald-50 overflow-hidden ${displayPreview ? "" : "flex items-center gap-3 p-3 text-emerald-700"}`}>
          {displayPreview ? (
            <div className="relative">
              <img src={displayPreview} alt={label} className="w-full max-h-48 object-cover rounded-xl" />
              <button type="button" onClick={handleRemove}
                className="absolute top-2 end-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full transition-colors shadow-md">
                <X className="w-3.5 h-3.5 text-white" />
              </button>
              <div className="absolute bottom-2 start-2 flex items-center gap-1.5 bg-emerald-600/90 text-white px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm">
                <CheckCircle className="w-3 h-3" /> {language === "ar" ? "تم الرفع" : "Uploaded"}
              </div>
            </div>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm flex-1 truncate" dir="ltr">{value.split("/").pop()}</span>
              <button type="button" onClick={handleRemove}
                className="p-1 hover:bg-emerald-100 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="relative group">
          <input
            type="file"
            onChange={handleFileChange}
            disabled={isUploading}
            accept={imageOnly ? "image/*" : "image/*,application/pdf"}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
          />
          <div className={`flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-xl transition-all
            ${isUploading ? "bg-[#0d2351]/5 border-[#0d2351]/30" : "bg-slate-50 border-slate-200 group-hover:border-[#c8a84b]/60 group-hover:bg-[#c8a84b]/5"}`}>
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-[#0d2351] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-[#0d2351] font-bold">{progress}%</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-[#c8a84b] transition-colors">
                <UploadCloud className="w-7 h-7" />
                <span className="text-sm font-medium">{language === "ar" ? "اختر ملفاً أو اسحبه هنا" : "Click or drag file here"}</span>
                <span className="text-xs opacity-70">{imageOnly ? "PNG, JPG" : "PNG, JPG, PDF"}</span>
              </div>
            )}
          </div>
        </div>
      )}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}

/* ── Section header ── */
function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 mb-4">
      <div className="w-8 h-8 rounded-lg bg-[#0d2351]/8 flex items-center justify-center text-[#0d2351]">{icon}</div>
      <h4 className="font-black text-slate-700 text-sm uppercase tracking-wide">{title}</h4>
    </div>
  );
}

/* ── Field wrapper ── */
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
        {label}{required && <span className="text-red-400 ms-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

const INPUT = "border-slate-200 bg-slate-50 focus:bg-white rounded-xl h-11 text-sm focus:border-[#0d2351]/40 focus:ring-[#0d2351]/15";

/* ── Main wizard ── */
export function VisaApplicationWizard({
  visa, open, onOpenChange,
}: { visa: Visa; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { language } = useTranslation();
  const ar = language === "ar";
  const currentYear = new Date().getFullYear();

  const hasAlternative = !!(
    visa.acceptsSchengenResidency || visa.acceptsUkResidency ||
    visa.acceptsUsVisa || visa.acceptsCanadaResidency || visa.acceptsAustraliaResidency
  );

  const getInitialStep = (): StepId => {
    if (visa.acceptsGccResidency) return "gcc_check";
    if (hasAlternative) return "alternative_check";
    return "application_form";
  };

  const [history, setHistory] = useState<StepId[]>([]);
  const [currentStep, setCurrentStep] = useState<StepId>(getInitialStep());
  const [data, setData] = useState<WizardData>({ gender: "male", agreedToTerms: false, phoneDialCode: "YE" });
  const [rejectionMessage, setRejectionMessage] = useState("");
  const [applicationId, setApplicationId] = useState<number | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const updateData = (updates: Partial<WizardData>) => setData(prev => ({ ...prev, ...updates }));
  const goToNext = (next: StepId) => { setHistory(prev => [...prev, currentStep]); setCurrentStep(next); };
  const goBack = () => {
    if (history.length > 0) {
      setCurrentStep(history[history.length - 1]);
      setHistory(h => h.slice(0, -1));
    }
  };

  const ALT_REGIONS = [
    { id: "schengen", ar: "شنغن", en: "Schengen", active: visa.acceptsSchengenResidency },
    { id: "uk",       ar: "بريطانيا", en: "UK", active: visa.acceptsUkResidency },
    { id: "usa",      ar: "أمريكا",   en: "USA", active: visa.acceptsUsVisa },
    { id: "canada",   ar: "كندا",     en: "Canada", active: visa.acceptsCanadaResidency },
    { id: "australia",ar: "أستراليا", en: "Australia", active: visa.acceptsAustraliaResidency },
  ].filter(r => r.active);

  const progressSteps = useMemo<StepId[]>(() => {
    const steps: StepId[] = [];
    if (visa.acceptsGccResidency) steps.push("gcc_check");
    if (hasAlternative) steps.push("alternative_check");
    steps.push("nationality_check", "application_form");
    return steps;
  }, [visa, hasAlternative]);

  const isTerminal = currentStep === "rejection" || currentStep === "success";
  const progressIdx = progressSteps.indexOf(currentStep);
  const progressPct = progressIdx >= 0
    ? Math.round(((progressIdx + 1) / progressSteps.length) * 100)
    : currentStep === "application_form" ? 100 : 0;

  const canGoNext = (): boolean => {
    if (currentStep === "gcc_check") {
      if (data.hasGcc === undefined) return false;
      if (!data.hasGcc) return true;
      // Back side is optional (some residency permits are electronic with no physical back)
      return !!data.gccCountry && !!data.residencyImageUrl;
    }
    if (currentStep === "alternative_check") {
      if (data.hasAlternative === undefined) return false;
      if (!data.hasAlternative) return true;
      return !!data.alternativeRegion && !!data.alternativeVisaNumber && !!data.alternativeVisaExpiry;
    }
    if (currentStep === "nationality_check") return !!data.nationality?.trim();
    if (currentStep === "application_form") {
      if (!data.fullName || !data.passportNumber || !data.email || !data.phone || !data.dateOfBirth || !data.passportIssueDate || !data.passportExpiryDate || !data.agreedToTerms) return false;
      const hasNatInStep2 = !!data.nationality && history.includes("nationality_check");
      if (!hasNatInStep2 && !data.nationality) return false;
      if (visa.requiresPassportImage && !data.passportImageUrl) return false;
      if (visa.requiresPersonalPhoto && !data.personalPhotoUrl) return false;
      if (visa.requiresResidencyImage && !data.residencyImageUrl) return false;
      if (visa.requiresVisaImage && !data.visaImageUrl) return false;
      return true;
    }
    return true;
  };

  const { mutate: submitApplication, isPending } = useCreateVisaApplication({
    mutation: {
      onSuccess: (res) => { setApplicationId(res.id); goToNext("success"); },
      onError: (err: unknown) => {
        const e = err as { data?: { error?: string }; message?: string };
        setServerError(e?.data?.error || e?.message || (ar ? "حدث خطأ أثناء الإرسال." : "An error occurred."));
      },
    },
  });

  const handleNext = () => {
    if (currentStep === "gcc_check") {
      goToNext(data.hasGcc ? "application_form" : (hasAlternative ? "alternative_check" : "nationality_check"));
    } else if (currentStep === "alternative_check") {
      goToNext(data.hasAlternative ? "application_form" : "nationality_check");
    } else if (currentStep === "nationality_check") {
      const nat = data.nationality?.trim().toLowerCase() || "";
      const isBlocked = visa.blockedNationalities?.some(n => n.trim().toLowerCase() === nat);
      const isAllowed = !visa.allowedNationalities?.length || visa.allowedNationalities.some(n => n.trim().toLowerCase() === nat);
      if (isBlocked || !isAllowed) {
        setRejectionMessage(
          ar ? (visa.ineligibleMessageAr || "عذراً، هذه التأشيرة غير متاحة لجنسيتك حالياً.")
             : (visa.ineligibleMessageEn || "Sorry, this visa is not available for your nationality.")
        );
        goToNext("rejection");
      } else {
        goToNext("application_form");
      }
    } else if (currentStep === "application_form") {
      setServerError(null);
      let eligibilityPath: "gcc" | "alternative" | "direct" = "direct";
      if (data.hasGcc && data.gccCountry) eligibilityPath = "gcc";
      else if (data.hasAlternative && data.alternativeRegion) eligibilityPath = "alternative";
      const dc = DIAL_CODE_MAP[data.phoneDialCode || "YE"] ?? "+967";
      const payload: VisaApplicationInput = {
        visaId: visa.id,
        eligibilityPath: eligibilityPath as never,
        gccCountry: data.gccCountry,
        alternativeRegion: data.alternativeRegion,
        fullName: data.fullName!,
        nationality: data.nationality!,
        passportNumber: data.passportNumber!,
        passportIssueDate: data.passportIssueDate!,
        passportExpiryDate: data.passportExpiryDate!,
        dateOfBirth: data.dateOfBirth!,
        gender: data.gender as never,
        email: data.email!,
        phone: `${dc}${data.phone}`,
        passportImageUrl: data.passportImageUrl,
        personalPhotoUrl: data.personalPhotoUrl,
        residencyImageUrl: data.residencyImageUrl,
        residencyBackImageUrl: data.residencyBackImageUrl,
        visaImageUrl: data.visaImageUrl,
        alternativeVisaNumber: data.alternativeVisaNumber,
        alternativeVisaExpiry: data.alternativeVisaExpiry,
        agreedToTerms: !!data.agreedToTerms,
      };
      submitApplication({ data: payload });
    }
  };

  const hasNationalityFromStep2 = !!data.nationality && history.includes("nationality_check");

  /* ── Unsaved-data guard ──
   * The wizard is "dirty" once the user has entered any meaningful data and
   * has not yet reached the terminal success step. Closing the modal while
   * dirty shows a branded confirmation instead of discarding silently. */
  const isDirty = useMemo(() => {
    if (currentStep === "success") return false;
    return !!(
      data.hasGcc !== undefined || data.hasAlternative !== undefined ||
      data.nationality || data.fullName || data.passportNumber ||
      data.email || data.phone || data.dateOfBirth ||
      data.passportIssueDate || data.passportExpiryDate ||
      data.passportImageUrl || data.personalPhotoUrl ||
      data.residencyImageUrl || data.visaImageUrl ||
      data.alternativeVisaNumber || data.alternativeVisaExpiry ||
      data.agreedToTerms
    );
  }, [data, currentStep]);

  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [, navigate] = useLocation();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  // When leaving is triggered by an in-app route change (Link / programmatic
  // navigate), remember the intended destination so we can complete it on
  // confirm. `null` means the prompt was triggered by a modal-close instead.
  const pendingNavRef = useRef<string | null>(null);

  const guardActive = open && isDirty;

  // Native prompt for browser close / hard reload while dirty (spec §7).
  useEffect(() => {
    if (!guardActive) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [guardActive]);

  // Register the central navigation blocker so BOTH <Link> clicks and
  // programmatic navigate() calls are intercepted while the wizard is open
  // with unsaved data.
  useEffect(() => {
    if (!guardActive) { setNavigationBlocker(null); return; }
    setNavigationBlocker((intendedPath: string) => {
      pendingNavRef.current = intendedPath;
      setConfirmLeaveOpen(true);
      return false;
    });
    return () => setNavigationBlocker(null);
  }, [guardActive]);

  /** Guarded close: prompt if there is unsaved data, otherwise close. */
  const requestClose = (next: boolean) => {
    if (next) { onOpenChange(true); return; }
    if (isDirty) { pendingNavRef.current = null; setConfirmLeaveOpen(true); return; }
    onOpenChange(false);
  };

  const confirmLeave = () => {
    setConfirmLeaveOpen(false);
    const target = pendingNavRef.current;
    pendingNavRef.current = null;
    // Clear the blocker so the follow-up navigation / close isn't re-vetoed.
    setNavigationBlocker(null);
    onOpenChange(false);
    if (target) {
      const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
      const appPath = base && target.startsWith(base) ? target.slice(base.length) || "/" : target;
      navigateRef.current(appPath, { __bypassGuard: true } as never);
    }
  };

  const cancelLeave = () => {
    pendingNavRef.current = null;
    setConfirmLeaveOpen(false);
  };

  /* ── Radio option helper ── */
  const RadioOption = ({ value, currentVal, label, desc, onSelect }: {
    value: string; currentVal: boolean | undefined; label: string; desc?: string; onSelect: (v: boolean) => void;
  }) => {
    const isSelected = (value === "yes") ? currentVal === true : currentVal === false;
    return (
      <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? "border-[#0d2351] bg-[#0d2351]/5" : "border-slate-200 hover:border-slate-300 bg-white"}`}>
        <RadioGroupItem value={value} className="mt-0.5 shrink-0" />
        <div>
          <span className="font-semibold text-slate-800 text-sm">{label}</span>
          {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
        </div>
      </label>
    );
  };

  return (
    <Dialog open={open} onOpenChange={requestClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 rounded-2xl" dir={ar ? "rtl" : "ltr"}>

        {/* ── Header ── */}
        <div className="shrink-0">
          <div className="bg-gradient-to-r from-[#0d2351] to-[#1a3875] px-6 py-5">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Stamp className="w-4 h-4 text-[#c8a84b]" />
                    <DialogTitle className="text-white font-black text-lg leading-none">
                      {ar ? "طلب تأشيرة" : "Visa Application"}
                    </DialogTitle>
                  </div>
                  <DialogDescription className="text-[#c8a84b] text-sm font-semibold">
                    {ar ? visa.countryAr : visa.countryEn} — {visa.visaType}
                  </DialogDescription>
                </div>
                <button onClick={() => requestClose(false)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </DialogHeader>

            {/* Progress bar */}
            {!isTerminal && progressIdx >= 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-white/60 mb-2">
                  <span className="flex items-center gap-1.5">
                    {STEP_META[currentStep].icon}
                    {ar ? STEP_META[currentStep].arTitle : STEP_META[currentStep].enTitle}
                  </span>
                  <span>{progressPct}%</span>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#c8a84b] rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Visa summary strip */}
          {!isTerminal && (
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-3 flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Shield className="w-3.5 h-3.5" />
                <span className="font-semibold">{ar ? "رسوم التأشيرة:" : "Fee:"}</span>
                <span className="text-[#0d2351] font-black">{Number(visa.fee).toLocaleString()} {visa.currency}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
                <span className="font-semibold">{ar ? "مدة المعالجة:" : "Processing:"}</span>
                <span className="text-[#0d2351] font-black">{visa.processingDays} {ar ? "يوم" : "days"}</span>
              </div>
              {visa.stayDuration && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Globe className="w-3.5 h-3.5" />
                  <span className="font-semibold">{ar ? "مدة الإقامة:" : "Stay:"}</span>
                  <span className="text-[#0d2351] font-black">{visa.stayDuration} {ar ? "يوم" : "days"}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">

          {/* GCC Check */}
          {currentStep === "gcc_check" && (
            <div className="p-6 space-y-5">
              <div>
                <h3 className="text-lg font-black text-slate-800 mb-1">
                  {ar ? "هل أنت مقيم في دولة خليجية؟" : "Are you a GCC resident?"}
                </h3>
                <p className="text-sm text-slate-400">{ar ? "الإقامة الخليجية السارية تتيح لك التقديم المباشر" : "A valid GCC residency allows direct application"}</p>
              </div>

              <RadioGroup
                value={data.hasGcc === true ? "yes" : data.hasGcc === false ? "no" : ""}
                onValueChange={v => updateData({ hasGcc: v === "yes", gccCountry: undefined })}
                className="space-y-3"
              >
                <RadioOption value="yes" currentVal={data.hasGcc} onSelect={() => updateData({ hasGcc: true })}
                  label={ar ? "نعم، لدي إقامة خليجية سارية" : "Yes, I have a valid GCC residency"}
                  desc={ar ? "ستحتاج لرفع صورة الإقامة" : "You'll need to upload your residency card"} />
                <RadioOption value="no" currentVal={data.hasGcc} onSelect={() => updateData({ hasGcc: false })}
                  label={ar ? "لا، ليس لدي إقامة خليجية" : "No, I don't have GCC residency"} />
              </RadioGroup>

              {data.hasGcc && (
                <div className="space-y-4 pt-2 border-t border-slate-100 animate-in fade-in duration-200">
                  <Field label={ar ? "دولة الإقامة" : "Country of Residence"} required>
                    <Select value={data.gccCountry} onValueChange={v => updateData({ gccCountry: v })}>
                      <SelectTrigger className={INPUT}><SelectValue placeholder={ar ? "اختر الدولة" : "Select Country"} /></SelectTrigger>
                      <SelectContent>
                        {GCC_COUNTRIES.map(c => <SelectItem key={c.id} value={c.id}>{ar ? c.ar : c.en}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>

                  {data.gccCountry && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
                      <FileUploadField required language={language}
                        label={ar ? "وجه بطاقة الإقامة" : "Residency Card (Front)"}
                        value={data.residencyImageUrl} onChange={v => updateData({ residencyImageUrl: v })} />
                      <FileUploadField required={false} language={language}
                        label={ar ? "خلف بطاقة الإقامة (اختياري)" : "Residency Card (Back) — Optional"}
                        value={data.residencyBackImageUrl} onChange={v => updateData({ residencyBackImageUrl: v })} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Alternative Check */}
          {currentStep === "alternative_check" && (
            <div className="p-6 space-y-5">
              <div>
                <h3 className="text-lg font-black text-slate-800 mb-1">
                  {ar ? "هل تحمل تأشيرة أو إقامة بديلة؟" : "Do you hold an alternative visa/residency?"}
                </h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {ALT_REGIONS.map(r => (
                    <span key={r.id} className="text-xs bg-[#0d2351]/8 text-[#0d2351] font-semibold px-2.5 py-1 rounded-full">
                      {ar ? r.ar : r.en}
                    </span>
                  ))}
                </div>
              </div>

              <RadioGroup
                value={data.hasAlternative === true ? "yes" : data.hasAlternative === false ? "no" : ""}
                onValueChange={v => updateData({ hasAlternative: v === "yes", alternativeRegion: undefined })}
                className="space-y-3"
              >
                <RadioOption value="yes" currentVal={data.hasAlternative} onSelect={() => updateData({ hasAlternative: true })}
                  label={ar ? "نعم، لدي تأشيرة/إقامة سارية" : "Yes, I hold a valid visa/residency"} />
                <RadioOption value="no" currentVal={data.hasAlternative} onSelect={() => updateData({ hasAlternative: false })}
                  label={ar ? "لا" : "No"} />
              </RadioGroup>

              {data.hasAlternative && (
                <div className="space-y-4 pt-2 border-t border-slate-100 animate-in fade-in duration-200">
                  <Field label={ar ? "نوع التأشيرة/الإقامة" : "Visa/Residency Type"} required>
                    <Select value={data.alternativeRegion} onValueChange={v => updateData({ alternativeRegion: v })}>
                      <SelectTrigger className={INPUT}><SelectValue placeholder={ar ? "اختر النوع" : "Select Type"} /></SelectTrigger>
                      <SelectContent>
                        {ALT_REGIONS.map(r => <SelectItem key={r.id} value={r.id}>{ar ? r.ar : r.en}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  {data.alternativeRegion && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
                      <Field label={ar ? "رقم التأشيرة/الإقامة" : "Visa/Residency Number"} required>
                        <Input value={data.alternativeVisaNumber || ""} onChange={e => updateData({ alternativeVisaNumber: e.target.value })}
                          placeholder="A12345678" className={`${INPUT} uppercase`} />
                      </Field>
                      <Field label={ar ? "تاريخ انتهاء الصلاحية" : "Expiry Date"} required>
                        <DateSelectPicker
                          value={data.alternativeVisaExpiry}
                          onChange={v => updateData({ alternativeVisaExpiry: v })}
                          ar={ar}
                          minYear={2015}
                          maxYear={2035}
                        />
                      </Field>
                      <div className="md:col-span-2">
                        <FileUploadField language={language}
                          label={ar ? "صورة التأشيرة/الإقامة (اختياري)" : "Visa/Residency Image (optional)"}
                          value={data.visaImageUrl} onChange={v => updateData({ visaImageUrl: v })} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Nationality check */}
          {currentStep === "nationality_check" && (
            <div className="p-6 space-y-5">
              <div>
                <h3 className="text-lg font-black text-slate-800 mb-1">
                  {ar ? "ما هي جنسيتك؟" : "What is your nationality?"}
                </h3>
                <p className="text-sm text-slate-400">{ar ? "نحتاج للتحقق من أهليتك للتقديم" : "We need to verify your eligibility"}</p>
              </div>
              <Field label={ar ? "الجنسية" : "Nationality"} required>
                <CountrySelect language={language as "ar" | "en"} value={data.nationality} onChange={(code) => updateData({ nationality: code })} />
              </Field>
            </div>
          )}

          {/* Application form */}
          {currentStep === "application_form" && (
            <div className="p-6 space-y-7">
              {serverError && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
                  <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                  <p className="text-sm font-medium">{serverError}</p>
                </div>
              )}

              {/* Personal */}
              <div>
                <SectionHeader icon={<User className="w-4 h-4" />} title={ar ? "المعلومات الشخصية" : "Personal Information"} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Field label={ar ? "الاسم الكامل (كما في الجواز)" : "Full Name (as in passport)"} required>
                      <Input value={data.fullName || ""} onChange={e => updateData({ fullName: e.target.value })} className={INPUT} placeholder={ar ? "محمد علي أحمد" : "John Michael Doe"} />
                    </Field>
                  </div>

                  {!hasNationalityFromStep2 && (
                    <Field label={ar ? "الجنسية" : "Nationality"} required>
                      <CountrySelect language={language as "ar" | "en"} value={data.nationality} onChange={code => updateData({ nationality: code })} />
                    </Field>
                  )}

                  {/* Date of Birth — 3-Select */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {ar ? "تاريخ الميلاد" : "Date of Birth"}<span className="text-red-400">*</span>
                    </Label>
                    <DateSelectPicker
                      value={data.dateOfBirth}
                      onChange={v => updateData({ dateOfBirth: v })}
                      ar={ar}
                      minYear={1940}
                      maxYear={currentYear - 5}
                    />
                  </div>

                  <Field label={ar ? "الجنس" : "Gender"} required>
                    <Select value={data.gender} onValueChange={v => updateData({ gender: v as "male" | "female" })}>
                      <SelectTrigger className={INPUT}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">{ar ? "ذكر" : "Male"}</SelectItem>
                        <SelectItem value="female">{ar ? "أنثى" : "Female"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </div>

              {/* Contact */}
              <div>
                <SectionHeader icon={<Phone className="w-4 h-4" />} title={ar ? "معلومات التواصل" : "Contact Information"} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label={ar ? "البريد الإلكتروني" : "Email Address"} required>
                    <div className="relative">
                      <Mail className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 ${ar ? "right-3" : "left-3"}`} />
                      <Input type="email" value={data.email || ""} onChange={e => updateData({ email: e.target.value })}
                        className={`${INPUT} ${ar ? "pr-9" : "pl-9"}`} dir="ltr" placeholder="name@email.com" />
                    </div>
                  </Field>

                  {/* Phone with dial code picker */}
                  <Field label={ar ? "رقم الهاتف (دولي)" : "Phone Number (intl.)"} required>
                    <PhoneWithDialCode
                      value={data.phone || ""}
                      dialCode={data.phoneDialCode || "YE"}
                      onValueChange={v => updateData({ phone: v })}
                      onDialChange={v => updateData({ phoneDialCode: v })}
                      ar={ar}
                    />
                  </Field>
                </div>
              </div>

              {/* Passport */}
              <div>
                <SectionHeader icon={<Shield className="w-4 h-4" />} title={ar ? "بيانات جواز السفر" : "Passport Details"} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Field label={ar ? "رقم جواز السفر" : "Passport Number"} required>
                      <Input value={data.passportNumber || ""} onChange={e => updateData({ passportNumber: e.target.value })}
                        className={`${INPUT} uppercase`} placeholder="A12345678" />
                    </Field>
                  </div>

                  {/* Passport Issue Date — 3-Select */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {ar ? "تاريخ الإصدار" : "Issue Date"}<span className="text-red-400">*</span>
                    </Label>
                    <DateSelectPicker
                      value={data.passportIssueDate}
                      onChange={v => updateData({ passportIssueDate: v })}
                      ar={ar}
                      minYear={2015}
                      maxYear={currentYear}
                    />
                  </div>

                  {/* Passport Expiry Date — 3-Select */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {ar ? "تاريخ الانتهاء" : "Expiry Date"}<span className="text-red-400">*</span>
                    </Label>
                    <DateSelectPicker
                      value={data.passportExpiryDate}
                      onChange={v => updateData({ passportExpiryDate: v })}
                      ar={ar}
                      minYear={2015}
                      maxYear={2035}
                    />
                  </div>
                </div>
              </div>

              {/* Documents */}
              {(visa.requiresPassportImage || visa.requiresPersonalPhoto || visa.requiresResidencyImage || visa.requiresVisaImage) && (
                <div>
                  <SectionHeader icon={<FileText className="w-4 h-4" />} title={ar ? "المستندات المطلوبة" : "Required Documents"} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {visa.requiresPassportImage && (
                      <FileUploadField required imageOnly language={language} label={ar ? "صورة جواز السفر" : "Passport Image"}
                        value={data.passportImageUrl} onChange={v => updateData({ passportImageUrl: v })} />
                    )}
                    {visa.requiresPersonalPhoto && (
                      <FileUploadField required imageOnly language={language} label={ar ? "صورة شخصية" : "Personal Photo"}
                        value={data.personalPhotoUrl} onChange={v => updateData({ personalPhotoUrl: v })} />
                    )}
                    {visa.requiresResidencyImage && (
                      <FileUploadField required language={language} label={ar ? "صورة الإقامة" : "Residency Image"}
                        value={data.residencyImageUrl} onChange={v => updateData({ residencyImageUrl: v })} />
                    )}
                    {visa.requiresVisaImage && (
                      <FileUploadField required language={language} label={ar ? "صورة التأشيرة" : "Visa Image"}
                        value={data.visaImageUrl} onChange={v => updateData({ visaImageUrl: v })} />
                    )}
                  </div>
                </div>
              )}

              {/* Fee summary */}
              <div className="bg-gradient-to-r from-[#0d2351]/5 to-[#c8a84b]/10 border border-[#c8a84b]/20 rounded-2xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#c8a84b]/20 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-[#c8a84b]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase">{ar ? "رسوم التأشيرة" : "Visa Fee"}</div>
                    <div className="text-2xl font-black text-[#0d2351]">{Number(visa.fee).toLocaleString()} <span className="text-base font-semibold text-slate-400">{visa.currency}</span></div>
                  </div>
                </div>
                <div className="text-xs text-slate-400 text-end">
                  <div className="flex items-center gap-1 text-emerald-600 font-semibold mb-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {ar ? "يُدفع لاحقاً" : "Pay later"}
                  </div>
                  <div>{ar ? `معالجة ${visa.processingDays} أيام` : `${visa.processingDays}-day processing`}</div>
                </div>
              </div>

              {/* Terms */}
              <label className="flex items-start gap-3 cursor-pointer p-4 border-2 border-slate-200 hover:border-[#0d2351]/30 rounded-xl bg-slate-50 hover:bg-[#0d2351]/3 transition-all">
                <Checkbox checked={data.agreedToTerms} onCheckedChange={c => updateData({ agreedToTerms: !!c })} className="mt-0.5" />
                <div className="text-sm text-slate-600 leading-relaxed">
                  <span className="font-bold text-slate-800">{ar ? "أقر وأوافق — " : "I confirm & agree — "}</span>
                  {ar
                    ? "جميع البيانات والمستندات المقدمة صحيحة ودقيقة، وأوافق على الشروط والأحكام المتعلقة باستخراج التأشيرة عبر ABSHER TRAVEL."
                    : "All submitted information and documents are accurate and correct. I agree to the terms and conditions for visa processing through Absher Travel."}
                  <span className="flex items-center gap-1 text-slate-400 text-xs mt-1.5">
                    <Info className="w-3 h-3" />
                    {ar ? "سيتواصل معك فريقنا خلال 24 ساعة" : "Our team will contact you within 24 hours"}
                  </span>
                </div>
              </label>
            </div>
          )}

          {/* Rejection */}
          {currentStep === "rejection" && (
            <div className="flex flex-col items-center text-center py-14 px-6 space-y-5 animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-red-50 border-2 border-red-100 rounded-full flex items-center justify-center">
                <X className="w-10 h-10 text-red-400" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">{ar ? "غير مؤهل للتقديم" : "Not Eligible"}</h2>
                <p className="text-slate-500 max-w-sm leading-relaxed">{rejectionMessage}</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 max-w-sm text-sm text-amber-700">
                <p className="font-semibold mb-1">{ar ? "هل تحتاج مساعدة؟" : "Need help?"}</p>
                <p>{ar ? "تواصل مع فريقنا مباشرةً وسنقدّم لك أفضل الحلول البديلة." : "Contact our team directly and we'll offer you the best alternative solutions."}</p>
              </div>
            </div>
          )}

          {/* Success */}
          {currentStep === "success" && (
            <div className="flex flex-col items-center py-10 px-6 space-y-6 animate-in zoom-in-95 duration-300">
              <div className="w-24 h-24 bg-emerald-50 border-2 border-emerald-200 rounded-full flex items-center justify-center shadow-lg shadow-emerald-100">
                <CheckCircle className="w-12 h-12 text-emerald-500" />
              </div>

              <div className="text-center space-y-1">
                <h2 className="text-2xl font-black text-slate-800">{ar ? "تم استلام الطلب" : "Application Submitted"}</h2>
                <p className="text-slate-400 text-sm">
                  {ar ? `تأشيرة ${visa.countryAr} — ${visa.visaType}` : `${visa.countryEn} Visa — ${visa.visaType}`}
                </p>
              </div>

              <div className="w-full max-w-sm bg-gradient-to-br from-[#0d2351] to-[#1a3875] rounded-2xl p-6 text-center shadow-xl shadow-[#0d2351]/20">
                <p className="text-white/50 text-xs uppercase tracking-widest font-bold mb-2">
                  {ar ? "رقم الطلب المرجعي" : "Application Reference"}
                </p>
                <p className="text-[#c8a84b] font-black text-3xl tracking-widest">
                  VIS-{String(applicationId).padStart(6, "0")}
                </p>
                <div className="mt-3 h-px bg-white/10" />
                <p className="text-white/40 text-xs mt-3">
                  {ar ? "احتفظ بهذا الرقم للمتابعة والاستفسار" : "Keep this number to track your application"}
                </p>
              </div>

              <div className="w-full max-w-sm space-y-3">
                {[
                  { step: "01", ar: "مراجعة طلبك من قِبل فريقنا", en: "Review by our team", icon: <Eye className="w-4 h-4" /> },
                  { step: "02", ar: "التواصل معك خلال 24 ساعة", en: "Contact within 24h", icon: <Phone className="w-4 h-4" /> },
                  { step: "03", ar: "إرسال الطلب للجهة المختصة", en: "Submit to embassy", icon: <Send className="w-4 h-4" /> },
                  { step: "04", ar: "استلام التأشيرة", en: "Receive your visa", icon: <Stamp className="w-4 h-4" /> },
                ].map(s => (
                  <div key={s.step} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-[#0d2351] text-white flex items-center justify-center shrink-0 text-xs font-black">{s.step}</div>
                    <span className="text-sm font-semibold text-slate-700">{ar ? s.ar : s.en}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 px-6 py-4 border-t bg-slate-50 flex justify-between gap-3">
          {!isTerminal ? (
            <>
              <Button variant="outline" onClick={goBack} disabled={history.length === 0}
                className="rounded-xl px-5 h-11 border-slate-200 font-semibold">
                {ar ? <><ArrowRight className="w-4 h-4 me-1" />السابق</> : <><ArrowLeft className="w-4 h-4 me-1" />Back</>}
              </Button>
              <Button onClick={handleNext} disabled={!canGoNext() || isPending}
                className="rounded-xl px-8 h-11 bg-[#0d2351] hover:bg-[#c8a84b] font-black text-white transition-colors shadow-md disabled:opacity-40">
                {currentStep === "application_form"
                  ? isPending
                    ? (ar ? "جارٍ الإرسال..." : "Submitting...")
                    : (ar ? "تقديم الطلب" : "Submit Application")
                  : (ar ? <>التالي <ArrowLeft className="w-4 h-4 ms-1" /></> : <>Next <ArrowRight className="w-4 h-4 ms-1" /></>)
                }
              </Button>
            </>
          ) : currentStep === "rejection" ? (
            <>
              <Button variant="outline" onClick={goBack} className="rounded-xl px-5 h-11 border-slate-200 font-semibold">
                {ar ? "تعديل البيانات" : "Edit Details"}
              </Button>
              <Button onClick={() => onOpenChange(false)} variant="secondary" className="rounded-xl px-8 h-11 font-semibold">
                {ar ? "إغلاق" : "Close"}
              </Button>
            </>
          ) : (
            <Button onClick={() => onOpenChange(false)} className="w-full rounded-xl h-11 bg-[#0d2351] hover:bg-[#c8a84b] text-white font-black transition-colors">
              {ar ? "إغلاق" : "Close"}
            </Button>
          )}
        </div>
      </DialogContent>

      {/* Unsaved-data confirmation (branded design-system dialog) */}
      <AlertDialog open={confirmLeaveOpen} onOpenChange={(o) => { if (!o) cancelLeave(); }}>
        <AlertDialogContent dir={ar ? "rtl" : "ltr"} className="max-w-md rounded-2xl">
          <AlertDialogHeader className="items-center text-center sm:text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-2">
              <AlertTriangle className="w-7 h-7 text-amber-500" />
            </div>
            <AlertDialogTitle className="text-[#0d2351] text-xl font-black">
              {ar ? "لديك بيانات غير محفوظة" : "You have unsaved data"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              {ar
                ? "إذا غادرت الآن، قد تفقد البيانات التي أدخلتها."
                : "If you leave now, you may lose the information you entered."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:justify-center">
            <AlertDialogCancel onClick={cancelLeave} className="rounded-xl font-bold bg-[#0d2351] hover:bg-[#0d2351]/90 text-white border-0">
              {ar ? "البقاء وإكمال الطلب" : "Stay & continue"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLeave}
              className="rounded-xl font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              {ar ? "مغادرة الصفحة" : "Leave page"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
