/**
 * Program Booking Wizard — in-platform multi-step booking request
 * for tourism programs (replaces the old WhatsApp redirect).
 *
 * Steps: traveler info → trip details → review → submit → request number.
 */
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { Link, useParams, useLocation } from "wouter";
import {
  useGetProgram,
  useCreateProgramBooking,
  useGetCurrentUser,
  getGetCurrentUserQueryKey,
  getListMyProgramBookingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CountrySelect } from "@/components/country-select";
import { ProgramDatePicker } from "@/components/program-date-picker";
import { StepIndicator } from "@/components/step-indicator";
import { UnsavedChangesGuard } from "@/components/unsaved-changes-guard";
import { friendlyError } from "@/lib/error-message";
import { getCountryByCode, getCountryByName } from "@workspace/countries";
import {
  CheckCircle2, ChevronRight, AlertCircle, Loader2, ArrowLeft, ArrowRight,
  User, Calendar, Users, ClipboardCheck, MapPin,
} from "lucide-react";

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  nationality: string; // ISO alpha-2 code
  travelDate: string;
  returnDate: string;
  adults: number;
  children: number;
  infants: number;
  rooms: number;
  roomType: string;
  specialRequirements: string;
  customerNotes: string;
}

const EMPTY: FormState = {
  fullName: "", email: "", phone: "", nationality: "",
  travelDate: "", returnDate: "", adults: 2, children: 0, infants: 0,
  rooms: 1, roomType: "", specialRequirements: "", customerNotes: "",
};

export default function ProgramBook() {
  const { language } = useTranslation();
  const ar = language === "ar";
  const params = useParams();
  const programId = Number(params.id);
  const [, setLocation] = useLocation();
  const { user: authUser, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [prefilled, setPrefilled] = useState(false);
  const [touched, setTouched] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<{ requestNumber: string; id: string } | null>(null);

  const { data: program, isLoading: isLoadingProgram } = useGetProgram(programId, {
    query: { enabled: Number.isFinite(programId) && programId > 0, queryKey: ["program", programId] },
  });
  const { data: currentUser } = useGetCurrentUser({
    query: { staleTime: 0, queryKey: getGetCurrentUserQueryKey(), enabled: isAuthenticated },
  });
  const submitMutation = useCreateProgramBooking();

  // Auth gate: booking requests are tied to the customer's account
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation(`/login?redirect=/programs/${programId}/book`);
    }
  }, [isAuthenticated, programId, setLocation]);

  // Prefill traveler info from the profile (once)
  useEffect(() => {
    const u = currentUser || authUser;
    if (!u || prefilled) return;
    const natCode =
      getCountryByCode(u.nationality ?? "")?.code ??
      getCountryByName(u.nationality ?? "")?.code ?? "";
    setForm(f => ({
      ...f,
      fullName: f.fullName || [u.firstName, u.lastName].filter(Boolean).join(" "),
      email: f.email || (u.email ?? ""),
      phone: f.phone || (u.phone ?? ""),
      nationality: f.nationality || natCode,
    }));
    setPrefilled(true);
  }, [currentUser, authUser, prefilled]);

  const steps = ar
    ? ["بيانات المسافر", "تفاصيل الرحلة", "المراجعة", "الإرسال"]
    : ["Traveler", "Trip Details", "Review", "Submit"];

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const set = (patch: Partial<FormState>) => {
    setForm(f => ({ ...f, ...patch }));
    setTouched(true);
    setStepError(null);
  };

  const validateStep = (s: number): string | null => {
    if (s === 0) {
      if (form.fullName.trim().length < 3) return ar ? "يرجى إدخال الاسم الكامل (3 أحرف على الأقل)." : "Please enter the full name (min 3 characters).";
      if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return ar ? "يرجى إدخال بريد إلكتروني صحيح." : "Please enter a valid email.";
      if (form.phone.trim().length < 6) return ar ? "يرجى إدخال رقم هاتف صحيح." : "Please enter a valid phone number.";
      if (!form.nationality) return ar ? "يرجى اختيار الجنسية من القائمة." : "Please select the nationality.";
    }
    if (s === 1) {
      if (!form.travelDate) return ar ? "يرجى اختيار تاريخ السفر." : "Please choose the travel date.";
      if (form.travelDate < todayStr) return ar ? "تاريخ السفر لا يمكن أن يكون في الماضي." : "Travel date cannot be in the past.";
      if (form.returnDate && form.returnDate < form.travelDate) return ar ? "تاريخ العودة يجب أن يكون بعد تاريخ السفر." : "Return date must be after the travel date.";
      if (form.adults < 1) return ar ? "يجب أن يكون هناك بالغ واحد على الأقل." : "At least one adult is required.";
      if (form.rooms < 1) return ar ? "يجب اختيار غرفة واحدة على الأقل." : "At least one room is required.";
    }
    return null;
  };

  const next = () => {
    const err = validateStep(step);
    if (err) { setStepError(err); return; }
    setStepError(null);
    setStep(s => Math.min(s + 1, 2));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const back = () => { setStepError(null); setStep(s => Math.max(s - 1, 0)); };

  const handleSubmit = async () => {
    if (submitMutation.isPending) return;
    setServerError(null);
    try {
      const res = await submitMutation.mutateAsync({
        data: {
          programId,
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          nationality: form.nationality,
          adults: form.adults,
          children: form.children,
          infants: form.infants,
          travelDate: form.travelDate,
          ...(form.returnDate ? { returnDate: form.returnDate } : {}),
          rooms: form.rooms,
          ...(form.roomType ? { roomType: form.roomType } : {}),
          ...(form.specialRequirements.trim() ? { specialRequirements: form.specialRequirements.trim() } : {}),
          ...(form.customerNotes.trim() ? { customerNotes: form.customerNotes.trim() } : {}),
        },
      });
      queryClient.invalidateQueries({ queryKey: getListMyProgramBookingsQueryKey() });
      setResult({ requestNumber: res.requestNumber, id: res.id });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setServerError(friendlyError(e, ar));
    }
  };

  // ── Loading / not found ────────────────────────────────────────────────────
  if (isLoadingProgram) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#0A2342] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!program) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6" dir={ar ? "rtl" : "ltr"}>
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-10 text-center">
          <h1 className="text-xl font-black text-slate-800 mb-3">{ar ? "البرنامج غير متاح" : "Program not available"}</h1>
          <Link href="/programs">
            <button className="px-6 py-3 bg-[#0A2342] text-white rounded-xl font-bold">{ar ? "العودة إلى البرامج" : "Back to Programs"}</button>
          </Link>
        </div>
      </div>
    );
  }

  const title = ar ? program.titleAr : program.titleEn;
  const natCountry = form.nationality ? getCountryByCode(form.nationality) : undefined;

  // ── Success screen ─────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6" dir={ar ? "rtl" : "ltr"}>
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-3">
            {ar ? "تم إرسال طلب الحجز بنجاح!" : "Booking Request Sent!"}
          </h1>
          <p className="text-slate-500 mb-6">
            {ar
              ? "تم استلام طلب حجز البرنامج. سيقوم فريقنا بمراجعته والتواصل معك، ويمكنك متابعة حالته من حسابك."
              : "Your program booking request was received. Our team will review it, and you can track its status from your account."}
          </p>
          <div className="bg-[#0A2342]/5 border border-[#0A2342]/10 rounded-2xl p-4 mb-8">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              {ar ? "رقم الطلب" : "Request Number"}
            </div>
            <div className="text-2xl font-black text-[#0A2342] tracking-widest select-all" dir="ltr">
              {result.requestNumber}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/account">
              <button className="px-6 py-3 bg-[#0A2342] text-white rounded-xl font-bold hover:bg-[#0A2342]/90 transition-colors w-full sm:w-auto">
                {ar ? "متابعة حالة الحجز" : "Track Booking"}
              </button>
            </Link>
            <Link href="/programs">
              <button className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors w-full sm:w-auto">
                {ar ? "تصفح برامج أخرى" : "Browse More Programs"}
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isDirty = touched && !result;

  return (
    <div className="min-h-screen bg-slate-50 pb-24" dir={ar ? "rtl" : "ltr"}>
      <UnsavedChangesGuard enabled={isDirty} ar={ar} />

      {/* Header */}
      <div className="bg-[#0A2342] pt-16 pb-24 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(212,175,55,0.1)_0%,transparent_50%)]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-400 mb-6 flex-wrap">
            <Link href="/programs" className="hover:text-white transition-colors">{ar ? "البرامج" : "Programs"}</Link>
            <ChevronRight className={`w-4 h-4 ${ar ? "rotate-180" : ""}`} />
            <Link href={`/programs/${programId}`} className="hover:text-white transition-colors">{title}</Link>
            <ChevronRight className={`w-4 h-4 ${ar ? "rotate-180" : ""}`} />
            <span className="text-white">{ar ? "طلب حجز" : "Booking"}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">{ar ? "طلب حجز برنامج" : "Program Booking Request"}</h1>
          <p className="text-[#D4AF37] text-lg font-bold">{title}</p>
          <div className="mt-8 max-w-lg mx-auto">
            <StepIndicator steps={steps} current={step} ar={ar} />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-10 relative z-20">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            {/* Step header */}
            <div className="bg-gradient-to-r from-[#0A2342] to-[#1E3A5F] px-8 py-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                {step === 0 ? <User className="w-5 h-5 text-white" /> : step === 1 ? <Calendar className="w-5 h-5 text-white" /> : <ClipboardCheck className="w-5 h-5 text-white" />}
              </div>
              <h2 className="text-lg font-black text-white">{steps[step]}</h2>
            </div>

            <div className="p-8 space-y-5">
              {/* ── Step 0: traveler ── */}
              {step === 0 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2 sm:col-span-2">
                      <Label className="font-semibold text-slate-700">{ar ? "الاسم الكامل" : "Full Name"} <span className="text-red-500">*</span></Label>
                      <Input className="h-11 bg-slate-50 focus:bg-white" value={form.fullName} onChange={e => set({ fullName: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-semibold text-slate-700">{ar ? "البريد الإلكتروني" : "Email"} <span className="text-red-500">*</span></Label>
                      <Input type="email" dir="ltr" className="h-11 bg-slate-50 focus:bg-white rtl:text-right" value={form.email} onChange={e => set({ email: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-semibold text-slate-700">{ar ? "رقم الهاتف" : "Phone"} <span className="text-red-500">*</span></Label>
                      <Input dir="ltr" className="h-11 bg-slate-50 focus:bg-white rtl:text-right" value={form.phone} onChange={e => set({ phone: e.target.value })} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label className="font-semibold text-slate-700">{ar ? "الجنسية" : "Nationality"} <span className="text-red-500">*</span></Label>
                      <CountrySelect value={form.nationality} onChange={code => set({ nationality: code })} language={language} />
                    </div>
                  </div>
                </>
              )}

              {/* ── Step 1: trip details ── */}
              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">{ar ? "تواريخ الرحلة" : "Trip Dates"} <span className="text-red-500">*</span></Label>
                    <ProgramDatePicker
                      travelDate={form.travelDate}
                      returnDate={form.returnDate}
                      onChange={patch => set(patch)}
                      language={language}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {([
                      ["adults", ar ? "البالغون" : "Adults", 1, 50],
                      ["children", ar ? "الأطفال" : "Children", 0, 50],
                      ["infants", ar ? "الرضّع" : "Infants", 0, 20],
                    ] as const).map(([key, label, min, max]) => (
                      <div key={key} className="space-y-2">
                        <Label className="font-semibold text-slate-700">{label}</Label>
                        <Input
                          type="number" min={min} max={max}
                          className="h-11 bg-slate-50 focus:bg-white"
                          value={form[key]}
                          onChange={e => set({ [key]: Math.max(min, Math.min(max, Number(e.target.value) || 0)) } as Partial<FormState>)}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="font-semibold text-slate-700">{ar ? "عدد الغرف" : "Rooms"} <span className="text-red-500">*</span></Label>
                      <Input type="number" min={1} max={50} className="h-11 bg-slate-50 focus:bg-white" value={form.rooms}
                        onChange={e => set({ rooms: Math.max(1, Math.min(50, Number(e.target.value) || 1)) })} />
                    </div>
                    {(program.roomTypes?.length ?? 0) > 0 && (
                      <div className="space-y-2">
                        <Label className="font-semibold text-slate-700">{ar ? "نوع الغرفة" : "Room Type"}</Label>
                        <select
                          className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0A2342]/20"
                          value={form.roomType}
                          onChange={e => set({ roomType: e.target.value })}
                        >
                          <option value="">{ar ? "اختر..." : "Select..."}</option>
                          {program.roomTypes!.map(rt => <option key={rt} value={rt}>{rt}</option>)}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">{ar ? "متطلبات خاصة (اختياري)" : "Special Requirements (optional)"}</Label>
                    <Textarea className="min-h-[80px] bg-slate-50 focus:bg-white" value={form.specialRequirements} onChange={e => set({ specialRequirements: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">{ar ? "ملاحظات إضافية (اختياري)" : "Notes (optional)"}</Label>
                    <Textarea className="min-h-[80px] bg-slate-50 focus:bg-white" value={form.customerNotes} onChange={e => set({ customerNotes: e.target.value })} />
                  </div>
                </>
              )}

              {/* ── Step 2: review ── */}
              {step === 2 && (
                <>
                  {/* Program summary */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <div className="font-black text-slate-800">{title}</div>
                      {program.destination && (
                        <div className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />{program.destination}
                        </div>
                      )}
                      <div className="text-xs text-slate-400 mt-1">
                        {program.days} {ar ? "أيام" : "days"}{program.nights ? ` / ${program.nights} ${ar ? "ليالٍ" : "nights"}` : ""}
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="text-2xl font-black text-[#0A2342]">{Number(program.price).toLocaleString()}</div>
                      <div className="text-sm text-slate-500">{program.currency || "USD"} {ar ? "للشخص" : "/person"}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      [ar ? "الاسم الكامل" : "Full Name", form.fullName],
                      [ar ? "البريد الإلكتروني" : "Email", form.email],
                      [ar ? "رقم الهاتف" : "Phone", form.phone],
                      [ar ? "الجنسية" : "Nationality", natCountry ? (ar ? natCountry.nameAr : natCountry.nameEn) : form.nationality],
                      [ar ? "تاريخ السفر" : "Travel Date", form.travelDate],
                      [ar ? "تاريخ العودة" : "Return Date", form.returnDate || (ar ? "—" : "—")],
                      [ar ? "المسافرون" : "Travelers", `${form.adults} ${ar ? "بالغ" : "adults"}${form.children ? `، ${form.children} ${ar ? "طفل" : "children"}` : ""}${form.infants ? `، ${form.infants} ${ar ? "رضيع" : "infants"}` : ""}`],
                      [ar ? "الغرف" : "Rooms", `${form.rooms}${form.roomType ? ` — ${form.roomType}` : ""}`],
                    ].map(([label, value]) => (
                      <div key={label} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</div>
                        <div className="font-semibold text-slate-700 text-sm break-words">{value}</div>
                      </div>
                    ))}
                  </div>

                  {(form.specialRequirements.trim() || form.customerNotes.trim()) && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-600 space-y-2">
                      {form.specialRequirements.trim() && (
                        <div><span className="font-bold">{ar ? "متطلبات خاصة: " : "Special requirements: "}</span>{form.specialRequirements}</div>
                      )}
                      {form.customerNotes.trim() && (
                        <div><span className="font-bold">{ar ? "ملاحظات: " : "Notes: "}</span>{form.customerNotes}</div>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-slate-400">
                    {ar
                      ? "بالضغط على «إرسال الطلب» سيتم إرسال طلب الحجز لفريقنا لمراجعته. لا يُعد هذا تأكيداً نهائياً للحجز، وسيتم إشعارك بكل تحديث."
                      : "By submitting, your booking request is sent to our team for review. This is not a final confirmation; you'll be notified of every update."}
                  </p>
                </>
              )}

              {/* Errors */}
              {(stepError || serverError) && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-800">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                  <p className="text-sm font-medium">{stepError || serverError}</p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3 pt-2">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={back}
                    disabled={submitMutation.isPending}
                    className="h-13 px-6 py-3.5 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {ar ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                    {ar ? "السابق" : "Back"}
                  </button>
                )}
                {step < 2 ? (
                  <button
                    type="button"
                    onClick={next}
                    className="flex-1 py-3.5 bg-[#0A2342] text-white rounded-2xl font-black hover:bg-[#0A2342]/90 transition-colors flex items-center justify-center gap-2"
                  >
                    {ar ? "التالي" : "Next"}
                    {ar ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitMutation.isPending}
                    className="flex-1 py-3.5 bg-[#D4AF37] text-[#0A2342] rounded-2xl font-black text-lg hover:bg-[#c8a84b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                  >
                    {submitMutation.isPending ? (
                      <><Loader2 className="w-5 h-5 animate-spin" />{ar ? "جارٍ إرسال الطلب..." : "Submitting..."}</>
                    ) : (
                      <>{ar ? "إرسال الطلب" : "Submit Request"}<Users className="w-5 h-5 hidden" /><ArrowLeft className={`w-5 h-5 ${ar ? "" : "rotate-180"}`} /></>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
