import { useState, useMemo } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CountrySelect } from "@/components/country-select";
import { Visa } from "@workspace/api-client-react";
import {
  CheckCircle, XCircle, ArrowRight, ArrowLeft, Globe, Home,
  Award, Briefcase, Calendar, Heart, ChevronRight, Shield,
} from "lucide-react";
import { COUNTRIES } from "@workspace/countries";

/* ─── Static reference data ─── */

export const RESIDENCY_TYPES = [
  { id: "gcc_sa", ar: "إقامة سعودية",                  en: "Saudi Residency",          group: "gcc" },
  { id: "gcc_ae", ar: "إقامة إماراتية",                en: "UAE Residency",             group: "gcc" },
  { id: "gcc_kw", ar: "إقامة كويتية",                  en: "Kuwaiti Residency",         group: "gcc" },
  { id: "gcc_qa", ar: "إقامة قطرية",                   en: "Qatari Residency",          group: "gcc" },
  { id: "gcc_bh", ar: "إقامة بحرينية",                 en: "Bahraini Residency",        group: "gcc" },
  { id: "gcc_om", ar: "إقامة عمانية",                  en: "Omani Residency",           group: "gcc" },
  { id: "schengen", ar: "إقامة / تأشيرة شنغن",        en: "Schengen Residency / Visa", group: "intl" },
  { id: "uk",       ar: "إقامة / تأشيرة بريطانية",    en: "UK Residency / Visa",       group: "intl" },
  { id: "us",       ar: "تأشيرة / إقامة أمريكية",     en: "US Visa / Residency",       group: "intl" },
  { id: "canada",   ar: "إقامة / تأشيرة كندية",       en: "Canadian Residency / Visa", group: "intl" },
  { id: "australia",ar: "إقامة / تأشيرة أسترالية",    en: "Australian Residency / Visa",group: "intl" },
  { id: "japan",    ar: "تأشيرة يابانية",              en: "Japanese Visa",             group: "intl" },
  { id: "south_korea", ar: "تأشيرة كورية الجنوبية",   en: "South Korean Visa",         group: "intl" },
  { id: "none",     ar: "بدون إقامة",                  en: "No Residency",              group: "none" },
];

export const PRIOR_VISA_TYPES = [
  { id: "schengen",    ar: "تأشيرة شنغن",              en: "Schengen Visa" },
  { id: "uk",          ar: "تأشيرة بريطانية",           en: "UK Visa" },
  { id: "us",          ar: "تأشيرة أمريكية",            en: "US Visa" },
  { id: "canada",      ar: "تأشيرة كندية",              en: "Canadian Visa" },
  { id: "australia",   ar: "تأشيرة أسترالية",           en: "Australian Visa" },
  { id: "japan",       ar: "تأشيرة يابانية",            en: "Japanese Visa" },
  { id: "south_korea", ar: "تأشيرة كورية الجنوبية",    en: "South Korean Visa" },
];

export const MARITAL_STATUS_TYPES = [
  { id: "single",   ar: "أعزب / عزباء",  en: "Single" },
  { id: "married",  ar: "متزوج / متزوجة", en: "Married" },
  { id: "divorced", ar: "مطلق / مطلقة",   en: "Divorced" },
  { id: "widowed",  ar: "أرمل / أرملة",   en: "Widowed" },
];

/* ─── Eligibility engine ─── */

export interface EligibilityInput {
  nationalityCode: string;
  residencies: string[];
  priorVisas: string[];
  profession: string;
  age: number | null;
  maritalStatus: string;
}

export interface EligibilityResult {
  eligible: boolean;
  failReasonsAr: string[];
  failReasonsEn: string[];
}

export function checkEligibility(visa: Visa, input: EligibilityInput): EligibilityResult {
  const failReasonsAr: string[] = [];
  const failReasonsEn: string[] = [];

  const add = (ar: string, en: string) => { failReasonsAr.push(ar); failReasonsEn.push(en); };

  // 1. Blocked nationalities
  const blocked = (visa as any).blockedNationalities as string[] | undefined ?? [];
  if (blocked.length > 0) {
    const country = COUNTRIES.find(c => c.code === input.nationalityCode);
    const nameAr = country?.nameAr ?? input.nationalityCode;
    const nameEn = country?.nameEn ?? input.nationalityCode;
    if (blocked.some(b => b === input.nationalityCode || b.toLowerCase() === nameEn.toLowerCase())) {
      add(`هذه التأشيرة غير متاحة لجنسية ${nameAr}.`, `This visa is not available for ${nameEn} nationals.`);
    }
  }

  // 2. Allowed nationalities (whitelist — empty = all allowed)
  const allowed = (visa as any).allowedNationalities as string[] | undefined ?? [];
  if (allowed.length > 0) {
    const country = COUNTRIES.find(c => c.code === input.nationalityCode);
    const nameEn = country?.nameEn ?? input.nationalityCode;
    const isAllowed = allowed.some(a =>
      a === input.nationalityCode || a.toLowerCase() === nameEn.toLowerCase()
    );
    if (!isAllowed) {
      add(
        `هذه التأشيرة متاحة فقط للجنسيات المحددة. جنسيتك غير مدرجة في قائمة الجنسيات المسموح لها.`,
        `This visa is only available for specific nationalities. Your nationality is not on the allowed list.`
      );
    }
  }

  // 3. Required residencies (new engine) — must hold at least one
  const reqResidencies = (visa as any).requiredResidencies as string[] | undefined ?? [];
  if (reqResidencies.length > 0) {
    const hasOne = reqResidencies.some(r => input.residencies.includes(r));
    if (!hasOne) {
      const names = reqResidencies.map(r => RESIDENCY_TYPES.find(x => x.id === r)?.ar ?? r).join(" أو ");
      const namesEn = reqResidencies.map(r => RESIDENCY_TYPES.find(x => x.id === r)?.en ?? r).join(" or ");
      add(`يجب أن تمتلك إقامة في إحدى الدول التالية: ${names}.`, `You must hold residency in one of: ${namesEn}.`);
    }
  }

  // 4. Legacy GCC / alternative residency flags mapped onto the same check
  // (only evaluated if the visa uses legacy booleans but NOT the new requiredResidencies)
  if (reqResidencies.length === 0) {
    const gccIds = ["gcc_sa", "gcc_ae", "gcc_kw", "gcc_qa", "gcc_bh", "gcc_om"];
    const altIds = [];
    if ((visa as any).acceptsSchengenResidency) altIds.push("schengen");
    if ((visa as any).acceptsUkResidency)       altIds.push("uk");
    if ((visa as any).acceptsUsVisa)            altIds.push("us");
    if ((visa as any).acceptsCanadaResidency)   altIds.push("canada");
    if ((visa as any).acceptsAustraliaResidency)altIds.push("australia");

    const hasGcc = (visa as any).acceptsGccResidency && gccIds.some(g => input.residencies.includes(g));
    const hasAlt = altIds.length > 0 && altIds.some(a => input.residencies.includes(a));
    const needsAny = (visa as any).acceptsGccResidency || altIds.length > 0;

    if (needsAny && !hasGcc && !hasAlt && !input.residencies.includes("none")) {
      const parts: string[] = [];
      const partsEn: string[] = [];
      if ((visa as any).acceptsGccResidency) { parts.push("إقامة خليجية (دول مجلس التعاون)"); partsEn.push("GCC residency"); }
      altIds.forEach(a => {
        const t = RESIDENCY_TYPES.find(x => x.id === a);
        if (t) { parts.push(t.ar); partsEn.push(t.en); }
      });
      add(`يجب أن تمتلك أحد هذه الإقامات: ${parts.join(" أو ")}.`, `You must hold one of: ${partsEn.join(" or ")}.`);
    }
  }

  // 5. Required prior visas — must hold at least one
  const reqPriorVisas = (visa as any).requiredPriorVisas as string[] | undefined ?? [];
  if (reqPriorVisas.length > 0) {
    const hasOne = reqPriorVisas.some(v => input.priorVisas.includes(v));
    if (!hasOne) {
      const names = reqPriorVisas.map(v => PRIOR_VISA_TYPES.find(x => x.id === v)?.ar ?? v).join(" أو ");
      const namesEn = reqPriorVisas.map(v => PRIOR_VISA_TYPES.find(x => x.id === v)?.en ?? v).join(" or ");
      add(`يجب أن تمتلك إحدى التأشيرات التالية: ${names}.`, `You must hold one of these visas: ${namesEn}.`);
    }
  }

  // 6. Profession check
  const allowedProfessions = (visa as any).allowedProfessions as string[] | undefined ?? [];
  if (allowedProfessions.length > 0 && input.profession.trim()) {
    const match = allowedProfessions.some(p =>
      p.trim().toLowerCase() === input.profession.trim().toLowerCase()
    );
    if (!match) {
      add(
        `هذه التأشيرة متاحة فقط للمهن التالية: ${allowedProfessions.join("، ")}.`,
        `This visa is available only for: ${allowedProfessions.join(", ")}.`
      );
    }
  }

  // 7. Age check
  if (input.age !== null) {
    const minAge = (visa as any).minAge as number | null;
    const maxAge = (visa as any).maxAge as number | null;
    if (minAge !== null && input.age < minAge) {
      add(`الحد الأدنى للسن هو ${minAge} سنة.`, `Minimum age is ${minAge} years.`);
    }
    if (maxAge !== null && input.age > maxAge) {
      add(`الحد الأقصى للسن هو ${maxAge} سنة.`, `Maximum age is ${maxAge} years.`);
    }
  }

  // 8. Marital status check
  const allowedMarital = (visa as any).allowedMaritalStatus as string[] | undefined ?? [];
  if (allowedMarital.length > 0 && input.maritalStatus) {
    if (!allowedMarital.includes(input.maritalStatus)) {
      const names = allowedMarital.map(m => MARITAL_STATUS_TYPES.find(x => x.id === m)?.ar ?? m).join(" أو ");
      const namesEn = allowedMarital.map(m => MARITAL_STATUS_TYPES.find(x => x.id === m)?.en ?? m).join(" or ");
      add(`الحالة الاجتماعية المطلوبة: ${names}.`, `Required marital status: ${namesEn}.`);
    }
  }

  return { eligible: failReasonsAr.length === 0, failReasonsAr, failReasonsEn };
}

/* ─── Step definitions ─── */

type StepId = "nationality" | "residency" | "prior_visas" | "profession" | "age" | "marital_status" | "result";

function buildSteps(visa: Visa): StepId[] {
  const steps: StepId[] = ["nationality"];

  const reqRes = (visa as any).requiredResidencies as string[] ?? [];
  const hasLegacyRes = (visa as any).acceptsGccResidency || (visa as any).acceptsSchengenResidency ||
    (visa as any).acceptsUkResidency || (visa as any).acceptsUsVisa ||
    (visa as any).acceptsCanadaResidency || (visa as any).acceptsAustraliaResidency;
  if (reqRes.length > 0 || hasLegacyRes) steps.push("residency");

  const reqVisa = (visa as any).requiredPriorVisas as string[] ?? [];
  if (reqVisa.length > 0) steps.push("prior_visas");

  const professions = (visa as any).allowedProfessions as string[] ?? [];
  if (professions.length > 0) steps.push("profession");

  if ((visa as any).minAge || (visa as any).maxAge) steps.push("age");

  const marital = (visa as any).allowedMaritalStatus as string[] ?? [];
  if (marital.length > 0) steps.push("marital_status");

  steps.push("result");
  return steps;
}

/* ─── Multi-select chip component ─── */

function ChipMultiSelect({
  options, selected, onToggle, ar,
}: {
  options: { id: string; ar: string; en: string }[];
  selected: string[];
  onToggle: (id: string) => void;
  ar: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const active = selected.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onToggle(opt.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
              active
                ? "bg-[#0d2351] border-[#0d2351] text-white"
                : "bg-white border-slate-200 text-slate-600 hover:border-[#0d2351]/40"
            }`}
          >
            {ar ? opt.ar : opt.en}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Main component ─── */

interface Props {
  visa: Visa;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProceed: (eligibilityPath?: string, gccCountry?: string, alternativeRegion?: string) => void;
}

export function VisaEligibilityCheck({ visa, open, onOpenChange, onProceed }: Props) {
  const { language } = useTranslation();
  const ar = language === "ar";

  const steps = useMemo(() => buildSteps(visa), [visa]);

  const [stepIdx, setStepIdx] = useState(0);
  const [nationalityCode, setNationalityCode] = useState("");
  const [residencies, setResidencies] = useState<string[]>([]);
  const [priorVisas, setPriorVisas] = useState<string[]>([]);
  const [profession, setProfession] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [maritalStatus, setMaritalStatus] = useState<string[]>([]);

  const currentStep = steps[stepIdx];

  const age = useMemo(() => {
    if (!birthYear || birthYear.length < 4) return null;
    const y = parseInt(birthYear, 10);
    if (isNaN(y)) return null;
    return new Date().getFullYear() - y;
  }, [birthYear]);

  const result = useMemo<EligibilityResult | null>(() => {
    if (currentStep !== "result") return null;
    return checkEligibility(visa, {
      nationalityCode,
      residencies,
      priorVisas,
      profession,
      age,
      maritalStatus: maritalStatus[0] ?? "",
    });
  }, [currentStep, visa, nationalityCode, residencies, priorVisas, profession, age, maritalStatus]);

  const goNext = () => setStepIdx(i => Math.min(i + 1, steps.length - 1));
  const goBack = () => setStepIdx(i => Math.max(i - 1, 0));

  const toggleResidency = (id: string) => {
    setResidencies(prev => {
      if (id === "none") return prev.includes("none") ? [] : ["none"];
      const next = prev.filter(x => x !== "none");
      return next.includes(id) ? next.filter(x => x !== id) : [...next, id];
    });
  };
  const togglePriorVisa = (id: string) => setPriorVisas(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );
  const toggleMarital = (id: string) => setMaritalStatus(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [id]
  );

  const canContinue = useMemo(() => {
    if (currentStep === "nationality") return !!nationalityCode;
    if (currentStep === "residency") return residencies.length > 0;
    if (currentStep === "profession") {
      const profs = (visa as any).allowedProfessions as string[] ?? [];
      return profs.length === 0 || profession.trim().length > 0;
    }
    if (currentStep === "age") return birthYear.length === 4 && !isNaN(parseInt(birthYear, 10));
    if (currentStep === "marital_status") return maritalStatus.length > 0;
    return true;
  }, [currentStep, nationalityCode, residencies, profession, birthYear, maritalStatus, visa]);

  // Derive wizard path for onProceed
  const getWizardPath = () => {
    const gccIds = ["gcc_sa", "gcc_ae", "gcc_kw", "gcc_qa", "gcc_bh", "gcc_om"];
    const gccMap: Record<string, string> = {
      gcc_sa: "saudi_arabia", gcc_ae: "uae", gcc_kw: "kuwait",
      gcc_qa: "qatar", gcc_bh: "bahrain", gcc_om: "oman",
    };
    const hasGcc = residencies.some(r => gccIds.includes(r));
    if (hasGcc && (visa as any).acceptsGccResidency) {
      const gccRes = residencies.find(r => gccIds.includes(r))!;
      return { path: "gcc", gccCountry: gccMap[gccRes], alt: undefined };
    }
    const altMap: Record<string, string> = { schengen: "schengen", uk: "uk", us: "us", canada: "canada", australia: "australia" };
    for (const r of residencies) {
      if (altMap[r]) return { path: "alternative", gccCountry: undefined, alt: altMap[r] };
    }
    return { path: "direct", gccCountry: undefined, alt: undefined };
  };

  // Visa country display
  const visaCountry = ar ? visa.countryAr : visa.countryEn;

  // Required residency options for this visa
  const reqRes = (visa as any).requiredResidencies as string[] ?? [];
  const residencyOptions = useMemo(() => {
    if (reqRes.length > 0) {
      return [...RESIDENCY_TYPES.filter(r => reqRes.includes(r.id)), RESIDENCY_TYPES.find(r => r.id === "none")!];
    }
    // Legacy flags
    const opts: typeof RESIDENCY_TYPES = [];
    if ((visa as any).acceptsGccResidency) {
      opts.push(...RESIDENCY_TYPES.filter(r => r.group === "gcc"));
    }
    if ((visa as any).acceptsSchengenResidency) opts.push(RESIDENCY_TYPES.find(r => r.id === "schengen")!);
    if ((visa as any).acceptsUkResidency) opts.push(RESIDENCY_TYPES.find(r => r.id === "uk")!);
    if ((visa as any).acceptsUsVisa) opts.push(RESIDENCY_TYPES.find(r => r.id === "us")!);
    if ((visa as any).acceptsCanadaResidency) opts.push(RESIDENCY_TYPES.find(r => r.id === "canada")!);
    if ((visa as any).acceptsAustraliaResidency) opts.push(RESIDENCY_TYPES.find(r => r.id === "australia")!);
    opts.push(RESIDENCY_TYPES.find(r => r.id === "none")!);
    return opts.filter(Boolean);
  }, [visa, reqRes]);

  const reqPriorVisas = (visa as any).requiredPriorVisas as string[] ?? [];
  const priorVisaOptions = useMemo(() => {
    if (reqPriorVisas.length > 0) return PRIOR_VISA_TYPES.filter(v => reqPriorVisas.includes(v.id));
    return PRIOR_VISA_TYPES;
  }, [reqPriorVisas]);

  const allowedMarital = (visa as any).allowedMaritalStatus as string[] ?? [];
  const maritalOptions = useMemo(() => {
    if (allowedMarital.length > 0) return MARITAL_STATUS_TYPES.filter(m => allowedMarital.includes(m.id));
    return MARITAL_STATUS_TYPES;
  }, [allowedMarital]);

  const progress = Math.round(((stepIdx + 1) / steps.length) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg w-full max-h-[90vh] overflow-y-auto p-0"
        dir={ar ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-[#0d2351] to-[#1a3875] px-6 py-5">
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-black flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#c8a84b]" />
              {ar ? "التحقق من الأهلية" : "Eligibility Check"}
            </DialogTitle>
            <p className="text-slate-300 text-sm mt-1">
              {ar ? `تأشيرة ${visaCountry}` : `${visaCountry} Visa`}
            </p>
          </DialogHeader>
          {/* Progress bar */}
          <div className="mt-4">
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#c8a84b] rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-white/50 mt-1">
              <span>{ar ? `خطوة ${stepIdx + 1} من ${steps.length}` : `Step ${stepIdx + 1} of ${steps.length}`}</span>
              <span>{progress}%</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* ── Nationality ── */}
          {currentStep === "nationality" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0d2351]/8 flex items-center justify-center text-[#0d2351]">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800">{ar ? "الجنسية" : "Nationality"}</h3>
                  <p className="text-xs text-slate-500">{ar ? "اختر جنسيتك" : "Select your nationality"}</p>
                </div>
              </div>
              <CountrySelect
                value={nationalityCode}
                onChange={setNationalityCode}
                language={language}
                placeholder={ar ? "اختر جنسيتك" : "Select your nationality"}
              />
            </div>
          )}

          {/* ── Residency ── */}
          {currentStep === "residency" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0d2351]/8 flex items-center justify-center text-[#0d2351]">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800">{ar ? "الإقامة" : "Residency"}</h3>
                  <p className="text-xs text-slate-500">{ar ? "اختر كل الإقامات التي تمتلكها" : "Select all residencies / visas you hold"}</p>
                </div>
              </div>
              <ChipMultiSelect
                options={residencyOptions}
                selected={residencies}
                onToggle={toggleResidency}
                ar={ar}
              />
            </div>
          )}

          {/* ── Prior Visas ── */}
          {currentStep === "prior_visas" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0d2351]/8 flex items-center justify-center text-[#0d2351]">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800">{ar ? "التأشيرات السابقة" : "Prior Visas"}</h3>
                  <p className="text-xs text-slate-500">{ar ? "اختر التأشيرات السارية التي تمتلكها حالياً" : "Select valid visas you currently hold"}</p>
                </div>
              </div>
              <ChipMultiSelect
                options={priorVisaOptions}
                selected={priorVisas}
                onToggle={togglePriorVisa}
                ar={ar}
              />
              <button
                type="button"
                onClick={() => setPriorVisas([])}
                className={`text-xs font-semibold transition-colors ${priorVisas.length === 0 ? "text-[#0d2351]" : "text-slate-400 hover:text-slate-600"}`}
              >
                {ar ? "لا أمتلك أياً منها" : "I don't hold any of these"}
              </button>
            </div>
          )}

          {/* ── Profession ── */}
          {currentStep === "profession" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0d2351]/8 flex items-center justify-center text-[#0d2351]">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800">{ar ? "المهنة" : "Profession"}</h3>
                  <p className="text-xs text-slate-500">{ar ? "اكتب مهنتك الحالية" : "Enter your current profession"}</p>
                </div>
              </div>
              {(() => {
                const profs = (visa as any).allowedProfessions as string[] ?? [];
                return (
                  <>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {profs.map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setProfession(p)}
                          className={`px-3 py-1.5 rounded-lg text-sm border-2 transition-all ${
                            profession === p
                              ? "bg-[#0d2351] border-[#0d2351] text-white"
                              : "border-slate-200 text-slate-600 hover:border-[#0d2351]/40"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={profession}
                      onChange={e => setProfession(e.target.value)}
                      placeholder={ar ? "اكتب مهنتك..." : "Type your profession..."}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d2351]/20 focus:border-[#0d2351]/40"
                    />
                  </>
                );
              })()}
            </div>
          )}

          {/* ── Age / Birth Year ── */}
          {currentStep === "age" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0d2351]/8 flex items-center justify-center text-[#0d2351]">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800">{ar ? "سنة الميلاد" : "Birth Year"}</h3>
                  <p className="text-xs text-slate-500">
                    {ar
                      ? `المطلوب: ${(visa as any).minAge ?? "—"} – ${(visa as any).maxAge ?? "—"} سنة`
                      : `Required: ${(visa as any).minAge ?? "—"} – ${(visa as any).maxAge ?? "—"} years`}
                  </p>
                </div>
              </div>
              <input
                type="number"
                value={birthYear}
                onChange={e => setBirthYear(e.target.value)}
                placeholder={ar ? "مثال: 1990" : "e.g. 1990"}
                min={1900}
                max={new Date().getFullYear()}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d2351]/20 focus:border-[#0d2351]/40 text-center text-lg font-bold"
              />
              {age !== null && (
                <p className="text-center text-sm text-slate-500">
                  {ar ? `العمر: ${age} سنة` : `Age: ${age} years`}
                </p>
              )}
            </div>
          )}

          {/* ── Marital Status ── */}
          {currentStep === "marital_status" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0d2351]/8 flex items-center justify-center text-[#0d2351]">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800">{ar ? "الحالة الاجتماعية" : "Marital Status"}</h3>
                  <p className="text-xs text-slate-500">{ar ? "اختر حالتك الاجتماعية" : "Select your marital status"}</p>
                </div>
              </div>
              <ChipMultiSelect
                options={maritalOptions}
                selected={maritalStatus}
                onToggle={toggleMarital}
                ar={ar}
              />
            </div>
          )}

          {/* ── Result ── */}
          {currentStep === "result" && result && (
            <div className="space-y-4">
              {result.eligible ? (
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-10 h-10 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-emerald-700">
                      {ar ? "✓ أنت مؤهل للتقديم" : "✓ You are eligible"}
                    </h3>
                    <p className="text-slate-500 text-sm mt-2">
                      {ar
                        ? ((visa as any).eligibleMessageAr || `يمكنك التقديم على تأشيرة ${visaCountry}.`)
                        : ((visa as any).eligibleMessageEn || `You can apply for the ${visaCountry} visa.`)}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const { path, gccCountry, alt } = getWizardPath();
                      onProceed(path, gccCountry, alt);
                      onOpenChange(false);
                    }}
                    className="w-full bg-[#0d2351] hover:bg-[#c8a84b] text-white font-bold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
                  >
                    {ar ? "ابدأ الطلب الآن" : "Start Application"}
                    {ar ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <XCircle className="w-10 h-10 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-red-600">
                      {ar ? "✗ غير مؤهل للتقديم" : "✗ Not Eligible"}
                    </h3>
                    <p className="text-slate-500 text-sm mt-2">
                      {ar
                        ? ((visa as any).ineligibleMessageAr || "لا يمكنك التقديم على هذه التأشيرة في الوقت الحالي.")
                        : ((visa as any).ineligibleMessageEn || "You are not eligible to apply for this visa at this time.")}
                    </p>
                  </div>
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-start space-y-2">
                    <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2">
                      {ar ? "أسباب الرفض:" : "Reasons:"}
                    </p>
                    {(ar ? result.failReasonsAr : result.failReasonsEn).map((reason, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-red-700">
                        <ChevronRight className={`w-4 h-4 mt-0.5 shrink-0 ${ar ? "rotate-180" : ""}`} />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setStepIdx(0)}
                    className="w-full border-2 border-slate-200 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-50 transition-all"
                  >
                    {ar ? "إعادة المحاولة" : "Try Again"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Nav buttons ── */}
        {currentStep !== "result" && (
          <div className="flex items-center justify-between px-6 pb-6">
            <button
              onClick={goBack}
              disabled={stepIdx === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {ar ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {ar ? "السابق" : "Back"}
            </button>
            <button
              onClick={goNext}
              disabled={!canContinue}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#0d2351] text-white rounded-xl text-sm font-bold hover:bg-[#0d2351]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {ar ? "التالي" : "Next"}
              {ar ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
