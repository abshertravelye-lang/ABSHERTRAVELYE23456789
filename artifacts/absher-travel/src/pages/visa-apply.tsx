/**
 * Visa Application Page — Auth-gated, profile-driven.
 * The backend uses the user's stored profile for all eligibility checks.
 * This page only collects: custom visa fields + agreement.
 */
import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { Link, useParams, useLocation } from "wouter";
import {
  useGetVisa,
  useListVisaCustomFields,
  useCreateVisaApplication,
  useGetCurrentUser,
  getGetCurrentUserQueryKey,
} from "@workspace/api-client-react";
import {
  CheckCircle2, ChevronRight, Shield, FileText, User,
  AlertCircle, Loader2, ArrowRight, ArrowLeft, Globe,
  Phone, Mail, Flag, Calendar, Hash
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthImage } from "@/components/auth-image";
import { UnsavedChangesGuard } from "@/components/unsaved-changes-guard";
import { StepIndicator } from "@/components/step-indicator";
import { friendlyError } from "@/lib/error-message";

/** Profile completeness — mirrors the backend `isProfileComplete()` */
function checkProfileComplete(user: any): { complete: boolean; missing: string[] } {
  const required = [
    { key: "firstName", label: "الاسم الأول / First Name" },
    { key: "lastName", label: "اسم العائلة / Last Name" },
    { key: "phone", label: "رقم الهاتف / Phone" },
    { key: "nationality", label: "الجنسية / Nationality" },
    { key: "dateOfBirth", label: "تاريخ الميلاد / Date of Birth" },
    { key: "profilePhotoUrl", label: "الصورة الشخصية / Profile Photo" },
    { key: "passportNumber", label: "رقم الجواز / Passport Number" },
    { key: "passportExpiryDate", label: "انتهاء الجواز / Passport Expiry" },
  ];
  const missing = required.filter(r => !user[r.key]).map(r => r.label);
  return { complete: missing.length === 0, missing };
}

export default function VisaApply() {
  const { language } = useTranslation();
  const ar = language === "ar";
  const params = useParams();
  const visaId = Number(params.visaId);
  const [, setLocation] = useLocation();
  const { user: authUser, isAuthenticated } = useAuth();

  // Custom field state
  const [customResponses, setCustomResponses] = useState<Record<string, string>>({});
  const [agreed, setAgreed] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<string | null>(null); // tracking number

  // APIs
  const { data: visa, isLoading: isLoadingVisa } = useGetVisa(visaId, {
    query: { enabled: !!visaId, queryKey: ["visa", visaId] },
  });
  const { data: customFields } = useListVisaCustomFields(visaId, {
    query: { enabled: !!visaId, queryKey: ["visa-custom-fields", visaId] },
  });
  const { data: currentUser, isLoading: isLoadingUser } = useGetCurrentUser({
    query: { staleTime: 0, queryKey: getGetCurrentUserQueryKey(), enabled: isAuthenticated },
  });

  const submitMutation = useCreateVisaApplication();

  // Auth gate: redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation(`/login?redirect=/visas/apply/${visaId}`);
    }
  }, [isAuthenticated, visaId, setLocation]);

  const user = currentUser || authUser;
  const profileCheck = user ? checkProfileComplete(user) : { complete: false, missing: [] };

  // Form is "dirty" once the user has entered any custom response or agreed to
  // terms, and has not yet submitted. Used by the unsaved-data guard.
  const isDirty =
    !submitted &&
    (agreed || Object.values(customResponses).some((v) => v && v.trim() !== ""));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return;
    setServerError(null);
    try {
      const res = await submitMutation.mutateAsync({
        data: {
          visaId,
          customFieldResponses: customResponses,
          agreedToTerms: true,
        } as any,
      });
      setSubmitted(res.trackingNumber ?? null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      setServerError(friendlyError(e, ar));
    }
  };

  // Step labels for the top progress indicator
  const hasCustomFields = customFields && customFields.length > 0;
  const stepLabels = hasCustomFields
    ? (ar ? ["بياناتك", "معلومات إضافية", "التأكيد"] : ["Your Info", "Extra Info", "Confirm"])
    : (ar ? ["بياناتك", "التأكيد"] : ["Your Info", "Confirm"]);

  // 0 = profile review, 1 = custom fields (if any), last = confirm/submit
  const currentStep = 0; // Single-page form — all steps visible; highlight last (confirm)
  const confirmStep = stepLabels.length - 1;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoadingVisa || isLoadingUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#0A2342] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!visa) return null;

  // ── Success screen ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6" dir={ar ? "rtl" : "ltr"}>
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-3">
            {ar ? "تم تقديم طلبك بنجاح!" : "Application Submitted!"}
          </h1>
          <p className="text-slate-500 mb-6">
            {ar
              ? "تم استلام طلب التأشيرة الخاص بك. يمكنك متابعة حالته باستخدام رقم التتبع."
              : "Your visa application has been received. Track it using the reference number below."}
          </p>
          <div className="bg-[#0A2342]/5 border border-[#0A2342]/10 rounded-2xl p-4 mb-8">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              {ar ? "رقم المرجع" : "Reference Number"}
            </div>
            <div className="text-2xl font-black text-[#0A2342] tracking-widest" dir="ltr">
              {submitted}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/account">
              <button className="px-6 py-3 bg-[#0A2342] text-white rounded-xl font-bold hover:bg-[#0A2342]/90 transition-colors">
                {ar ? "متابعة الطلب" : "Track Application"}
              </button>
            </Link>
            <Link href="/visas">
              <button className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">
                {ar ? "تصفح تأشيرات أخرى" : "Browse More Visas"}
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Profile incomplete guard ──────────────────────────────────────────────
  if (!profileCheck.complete) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6" dir={ar ? "rtl" : "ltr"}>
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-amber-100 p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-amber-500" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-3">
            {ar ? "يجب إكمال ملفك الشخصي أولاً" : "Complete Your Profile First"}
          </h1>
          <p className="text-slate-500 mb-4">
            {ar
              ? "يجب إكمال جميع البيانات الأساسية في ملفك الشخصي قبل التقديم على أي تأشيرة."
              : "You must complete all required profile fields before applying for a visa."}
          </p>
          {profileCheck.missing.length > 0 && (
            <div className="text-start mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="text-xs font-bold text-amber-700 mb-2 uppercase tracking-wide">
                {ar ? "البيانات الناقصة:" : "Missing fields:"}
              </div>
              <ul className="space-y-1">
                {profileCheck.missing.map(m => (
                  <li key={m} className="text-sm text-amber-800 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Link href="/account">
            <button className="w-full px-6 py-3 bg-[#0A2342] text-white rounded-xl font-bold hover:bg-[#0A2342]/90 transition-colors">
              {ar ? "إكمال الملف الشخصي" : "Complete Profile"}
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Main apply form ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 pb-24" dir={ar ? "rtl" : "ltr"}>
      <UnsavedChangesGuard enabled={isDirty} ar={ar} />
      {/* Header */}
      <div className="bg-[#0A2342] pt-20 pb-24 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(212,175,55,0.1)_0%,transparent_50%)]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-400 mb-6">
            <Link href="/visas" className="hover:text-white transition-colors">{ar ? "التأشيرات" : "Visas"}</Link>
            <ChevronRight className={`w-4 h-4 ${ar ? "rotate-180" : ""}`} />
            <span className="text-white">{ar ? "تقديم طلب" : "Apply"}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
            {ar ? "طلب تأشيرة" : "Visa Application"}
          </h1>
          <p className="text-[#D4AF37] text-lg font-bold">
            {ar ? visa.countryAr : visa.countryEn} — {visa.visaType}
          </p>

          {/* Step indicator */}
          <div className="mt-8 max-w-md mx-auto">
            <StepIndicator steps={stepLabels} current={confirmStep} ar={ar} />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-10 relative z-20">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Profile summary card */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-[#0A2342] to-[#1E3A5F] px-8 py-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">
                  {ar ? "بياناتك الشخصية (من ملفك الشخصي)" : "Your Profile Data (Auto-Filled)"}
                </h2>
                <p className="text-slate-300 text-xs mt-0.5">
                  {ar
                    ? "يتم استخدام بياناتك المحفوظة تلقائياً. لتعديلها، اذهب إلى الملف الشخصي."
                    : "Your saved profile data is used automatically. Edit in your profile."}
                </p>
              </div>
            </div>

            <div className="p-8">
              {user?.profilePhotoUrl && (
                <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <AuthImage
                    src={user.profilePhotoUrl}
                    className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-sm"
                  />
                  <div>
                    <div className="font-bold text-slate-800 text-lg">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-slate-500">
                      {user.nationality} · {user.gender === "male" ? (ar ? "ذكر" : "Male") : (ar ? "أنثى" : "Female")}
                    </div>
                  </div>
                  <div className="ms-auto">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {ar ? "ملف مكتمل" : "Profile Complete"}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: Mail, label: ar ? "البريد الإلكتروني" : "Email", value: user?.email },
                  { icon: Phone, label: ar ? "رقم الهاتف" : "Phone", value: user?.phone },
                  { icon: Calendar, label: ar ? "تاريخ الميلاد" : "Date of Birth", value: user?.dateOfBirth },
                  { icon: Globe, label: ar ? "الجنسية" : "Nationality", value: user?.nationality },
                  { icon: Hash, label: ar ? "رقم الجواز" : "Passport Number", value: user?.passportNumber },
                  { icon: Calendar, label: ar ? "انتهاء الجواز" : "Passport Expiry", value: user?.passportExpiryDate },
                ].map(item => item.value ? (
                  <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-[#0A2342]/8 flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-[#0A2342]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</div>
                      <div className="font-semibold text-slate-700 text-sm truncate" dir="ltr">{item.value}</div>
                    </div>
                  </div>
                ) : null)}
              </div>

              {/* GCC Residency indicator */}
              {(user as any)?.isGccResident && (user as any)?.gccResidenceCountry && (
                <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <Flag className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">{ar ? "إقامة خليجية" : "GCC Residency"}</div>
                    <div className="font-semibold text-blue-800 text-sm">{(user as any).gccResidenceCountry}</div>
                  </div>
                </div>
              )}

              {/* European Residency indicator */}
              {(user as any)?.isEuropeanResident && (user as any)?.europeanDocumentType && (
                <div className="mt-2 flex items-center gap-3 p-3 rounded-xl bg-purple-50 border border-purple-100">
                  <Globe className="w-4 h-4 text-purple-600 shrink-0" />
                  <div>
                    <div className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">{ar ? "وثيقة أوروبية / شنغن" : "European / Schengen Doc"}</div>
                    <div className="font-semibold text-purple-800 text-sm">{(user as any).europeanDocumentType}</div>
                  </div>
                </div>
              )}

              <Link href="/account">
                <button className="mt-5 text-sm text-[#0A2342] hover:underline font-medium">
                  {ar ? "← تعديل بياناتي الشخصية" : "← Edit my profile"}
                </button>
              </Link>
            </div>
          </div>

          {/* Custom fields (if any) */}
          {customFields && customFields.length > 0 && (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
              <div className="bg-gradient-to-r from-[#0A2342] to-[#1E3A5F] px-8 py-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-black text-white">
                  {ar ? "معلومات إضافية" : "Additional Information"}
                </h2>
              </div>
              <div className="p-8 space-y-5">
                {customFields.map((field: any) => (
                  <div key={field.id} className="space-y-2">
                    <Label className="font-semibold text-slate-700">
                      {ar ? field.labelAr : field.labelEn}
                      {field.required && <span className="text-red-500 ms-1">*</span>}
                    </Label>
                    {field.fieldType === "select" && field.options?.length > 0 ? (
                      <select
                        className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0A2342]/20"
                        value={customResponses[field.id] || ""}
                        onChange={e => setCustomResponses(r => ({ ...r, [field.id]: e.target.value }))}
                        required={field.required}
                      >
                        <option value="">{ar ? "اختر..." : "Select..."}</option>
                        {field.options.map((opt: string) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        className="h-11 bg-slate-50 focus:bg-white"
                        value={customResponses[field.id] || ""}
                        onChange={e => setCustomResponses(r => ({ ...r, [field.id]: e.target.value }))}
                        placeholder={ar ? field.placeholderAr : field.placeholderEn}
                        required={field.required}
                        type={field.fieldType === "date" ? "date" : "text"}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visa summary + submit */}
          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
              <div className="bg-gradient-to-r from-[#0A2342] to-[#1E3A5F] px-8 py-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-black text-white">
                  {ar ? "ملخص الطلب والتأكيد" : "Application Summary & Confirmation"}
                </h2>
              </div>
              <div className="p-8 space-y-6">
                {/* Visa summary */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <div className="font-black text-slate-800 text-base">
                      {ar ? visa.countryAr : visa.countryEn}
                    </div>
                    <div className="text-sm text-slate-500 mt-0.5">{visa.visaType}</div>
                    {visa.processingDays && (
                      <div className="text-xs text-slate-400 mt-1">
                        {ar ? `وقت المعالجة: ${visa.processingDays} أيام` : `Processing: ${visa.processingDays} days`}
                      </div>
                    )}
                  </div>
                  <div className="text-end">
                    <div className="text-2xl font-black text-[#0A2342]">
                      {Number(visa.fee).toLocaleString()}
                    </div>
                    <div className="text-sm text-slate-500">{visa.currency}</div>
                  </div>
                </div>

                {/* Error */}
                {serverError && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-800">
                    <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                    <p className="text-sm font-medium">{serverError}</p>
                  </div>
                )}

                {/* Terms */}
                <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border border-slate-200 hover:border-[#0A2342]/30 transition-colors">
                  <Checkbox
                    checked={agreed}
                    onCheckedChange={(c) => setAgreed(!!c)}
                    className="mt-0.5 scale-110"
                  />
                  <div className="text-sm text-slate-600 leading-relaxed">
                    {ar
                      ? "أقر بأن جميع البيانات المقدمة صحيحة ودقيقة، وأن الوثائق المرفوعة في ملفي الشخصي أصلية وسارية المفعول. أوافق على الشروط والأحكام."
                      : "I confirm that all provided information is accurate, and that documents uploaded in my profile are genuine and valid. I agree to the terms and conditions."}
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={!agreed || submitMutation.isPending}
                  className="w-full h-14 bg-[#D4AF37] text-[#0A2342] font-black text-lg rounded-2xl hover:bg-[#c8a84b] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-lg"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{ar ? "جارٍ إرسال الطلب..." : "Submitting..."}</span>
                    </>
                  ) : (
                    <>
                      {ar ? "تقديم الطلب" : "Submit Application"}
                      <ArrowLeft className={`w-5 h-5 ${ar ? "" : "rotate-180"}`} />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-slate-400">
                  {ar
                    ? "سيتم مراجعة طلبك وإشعارك بالحالة عبر البريد الإلكتروني والإشعارات."
                    : "Your application will be reviewed and you'll be notified of the status via email and notifications."}
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
