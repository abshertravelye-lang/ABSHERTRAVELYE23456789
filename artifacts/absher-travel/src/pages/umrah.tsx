/**
 * Umrah Visa — standalone application service (NOT the generic visa flow).
 *
 * This page implements the dedicated Umrah workflow end-to-end:
 *   1. Host eligibility question (نعم / لا). "لا" → professional rejection modal.
 *   2. Host residency image upload (real multipart) + host phone (+966, 9 digits, starts 5).
 *   3. Pilgrim data (NO profile data shown): passport image + OCR autofill,
 *      personal photo, phone, optional contact email, emergency phone.
 *   4. Declaration page (ar/en per site language) + mandatory acceptance checkbox.
 *   5. Payment step (fee per nationality) → pay.
 *   6. Success screen (tracking number, pilgrim name, type, payment status,
 *      status, date) with ONLY "العودة للرئيسية"; the form cannot be re-entered.
 *
 * Backend enforces sponsor_required/sponsor_available; the UI mirrors the rule.
 * All auth uses the app's Bearer-token pattern (Authorization header) and the
 * generated @workspace/api-client-react hooks. Uploads go through the shared
 * uploadFileAuthenticated helper (BASE_URL-prefixed — never root-relative).
 */
import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  useGetUmrahConfig,
  getGetUmrahConfigQueryKey,
  useCreateUmrahApplication,
  usePayUmrahApplication,
  useOcrPassport,
  useListUmrahApplications,
  getListUmrahApplicationsQueryKey,
} from "@workspace/api-client-react";
import type { OcrResult, UmrahApplication } from "@workspace/api-client-react";
import { uploadFileAuthenticated, getSignedObjectUrl } from "@/lib/objectMedia";
import { useObjectUrl } from "@/components/auth-image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Loader2, CheckCircle2, AlertCircle, Camera, X, ShieldCheck, HelpCircle,
  Home as HomeIcon, ArrowLeft, ArrowRight, ScanLine, CreditCard, FileText,
  ChevronLeft, ChevronRight, Download, Clock, Hash, StickyNote,
} from "lucide-react";

type Step = "ask" | "host" | "pilgrim" | "declaration" | "payment" | "success";

interface CreatedResult {
  id: string;
  trackingNumber: string;
  feeAmount?: number | null;
  feeCurrency: string;
  paymentStatus: string;
  status: string;
  createdAt?: string;
  fullName?: string | null;
}

/** Single authenticated image upload field (real multipart to /api/storage/uploads). */
function UmrahUpload({
  label, value, onChange, onFile, uploading, ar, required,
}: {
  label: string;
  value: string;
  onChange: (path: string) => void;
  onFile?: (file: File) => void;
  uploading?: boolean;
  ar: boolean;
  required?: boolean;
}) {
  const [localUploading, setLocalUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const storedUrl = useObjectUrl(!preview && value ? value : null);
  const displayed = preview || storedUrl || null;
  const busy = uploading || localUploading;

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    if (file.type.startsWith("image/")) setPreview(URL.createObjectURL(file));
    setLocalUploading(true);
    try {
      const res = await uploadFileAuthenticated(file);
      if (!res) throw new Error(ar ? "فشل رفع الملف" : "Upload failed");
      onChange(res.objectPath);
      onFile?.(file);
    } catch (e: any) {
      setErr(e?.message || (ar ? "فشل رفع الملف" : "Upload failed"));
      setPreview(null);
    } finally {
      setLocalUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {value ? (
        <div className="border border-emerald-200 rounded-2xl bg-emerald-50 overflow-hidden relative">
          {displayed ? (
            <img src={displayed} alt={label} className="w-full max-h-56 object-cover" />
          ) : (
            <div className="p-4 text-sm font-medium text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {ar ? "تم الرفع" : "Uploaded"}
            </div>
          )}
          <button
            type="button"
            onClick={() => { onChange(""); setPreview(null); }}
            className="absolute top-2 end-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full shadow-md"
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>
          <div className="absolute bottom-2 start-2 flex items-center gap-1.5 bg-emerald-600/90 text-white px-2.5 py-1 rounded-full text-[10px] font-bold">
            <CheckCircle2 className="w-3 h-3" /> {ar ? "تم الرفع" : "Uploaded"}
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer bg-slate-50 hover:bg-[#0A2342]/5 hover:border-[#0A2342]/40 transition-colors text-sm text-slate-500">
          <input type="file" accept="image/*" className="hidden" onChange={handleChange} disabled={busy} />
          {busy ? <Loader2 className="h-6 w-6 animate-spin text-[#0A2342]" /> : <Camera className="h-6 w-6 text-slate-400" />}
          <span className="font-medium">{busy ? (ar ? "جاري الرفع..." : "Uploading...") : (ar ? "اختر صورة" : "Choose image")}</span>
        </label>
      )}
      {err && <p className="text-xs text-red-500 font-medium">{err}</p>}
    </div>
  );
}

/** Card wrapper matching the app's navy/gold design system. */
function SectionCard({ icon: Icon, title, subtitle, children }: {
  icon: any; title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
      <div className="bg-gradient-to-r from-[#0A2342] to-[#1E3A5F] px-6 md:px-8 py-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-black text-white">{title}</h2>
          {subtitle && <p className="text-slate-300 text-xs mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="p-6 md:p-8">{children}</div>
    </div>
  );
}

export default function Umrah() {
  const { language } = useTranslation();
  const ar = language === "ar";
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  const [step, setStep] = useState<Step>("ask");
  const [showReject, setShowReject] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Host data
  const [sponsorResidencyImageUrl, setSponsorResidencyImageUrl] = useState("");
  const [sponsorPhoneDigits, setSponsorPhoneDigits] = useState(""); // 9 digits, starts with 5

  // Pilgrim data
  const [passportImageUrl, setPassportImageUrl] = useState("");
  const [personalPhotoUrl, setPersonalPhotoUrl] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [emergencyDigits, setEmergencyDigits] = useState("");
  const [ocr, setOcr] = useState<Partial<OcrResult>>({});
  const [ocrRan, setOcrRan] = useState(false);

  // Declaration
  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  // Result
  const [created, setCreated] = useState<CreatedResult | null>(null);

  // Detail/tracking view for "طلباتي للعمرة" rows.
  const [selectedApp, setSelectedApp] = useState<UmrahApplication | null>(null);

  const ocrMutation = useOcrPassport();
  const createMutation = useCreateUmrahApplication();
  const payMutation = usePayUmrahApplication();

  const nationality = ocr.nationality || ocr.issuingCountry || undefined;

  // Declaration text + fee for the pilgrim's nationality.
  const { data: config, isLoading: configLoading } = useGetUmrahConfig(
    nationality ? { nationality } : undefined,
    { query: { queryKey: getGetUmrahConfigQueryKey(nationality ? { nationality } : undefined), enabled: step === "declaration" || step === "payment" } },
  );

  // The caller's own Umrah applications ("طلباتي للعمرة").
  const { data: myApps } = useListUmrahApplications({
    query: { queryKey: getListUmrahApplicationsQueryKey(), enabled: isAuthenticated && step === "ask" },
  });

  // Require login before starting.
  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/umrah`, { replace: true } as any);
    }
  }, [isAuthenticated, navigate]);

  // Prevent going back into the form once the request is finalized.
  useEffect(() => {
    if (step !== "success") return;
    const onPop = () => navigate("/", { replace: true } as any);
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [step, navigate]);

  if (!isAuthenticated) return null;

  const sponsorPhone = `+966${sponsorPhoneDigits}`;
  const phone = `+966${phoneDigits}`;
  const emergencyPhone = `+966${emergencyDigits}`;

  const saudiPhoneValid = (d: string) => d.length === 9 && d.startsWith("5");

  const handlePassportUploaded = async (path: string) => {
    setPassportImageUrl(path);
    if (!path) { setOcr({}); setOcrRan(false); return; }
    setServerError(null);
    try {
      const result = await ocrMutation.mutateAsync({ data: { imageUrl: path } });
      setOcrRan(true);
      if (result?.success) setOcr(result);
    } catch {
      setOcrRan(true);
    }
  };

  const pilgrimValid =
    !!passportImageUrl &&
    !!personalPhotoUrl &&
    saudiPhoneValid(phoneDigits) &&
    saudiPhoneValid(emergencyDigits);

  const surfaceError = (e: any) =>
    setServerError(
      e?.data?.error || e?.message ||
      (ar ? "حدث خطأ، يرجى المحاولة مرة أخرى" : "An error occurred. Please try again."),
    );

  const submitApplication = async () => {
    setServerError(null);
    try {
      const res = await createMutation.mutateAsync({
        data: {
          sponsorAvailable: true,
          sponsorResidencyImageUrl,
          sponsorPhone,
          passportImageUrl,
          personalPhotoUrl,
          fullName: ocr.fullName || ocr.fullNameAr || ocr.fullNameEn || undefined,
          passportNumber: ocr.passportNumber || undefined,
          nationality: nationality,
          dateOfBirth: ocr.dateOfBirth || undefined,
          gender: (ocr.gender === "male" || ocr.gender === "female") ? ocr.gender : undefined,
          passportIssueDate: ocr.issueDate || undefined,
          passportExpiryDate: ocr.expiryDate || undefined,
          phone,
          contactEmail: contactEmail.trim() || undefined,
          emergencyPhone,
          declarationAccepted: true,
        } as any,
      });
      setCreated({
        id: res.id,
        trackingNumber: res.trackingNumber,
        feeAmount: res.feeAmount,
        feeCurrency: res.feeCurrency,
        paymentStatus: res.paymentStatus,
        status: res.status,
        fullName: ocr.fullName || ocr.fullNameAr || ocr.fullNameEn || null,
      });
      setStep("payment");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      surfaceError(e);
    }
  };

  const handlePay = async () => {
    if (!created) return;
    setServerError(null);
    try {
      const res = await payMutation.mutateAsync({ id: created.id });
      setCreated((c) => c ? {
        ...c,
        paymentStatus: res.paymentStatus,
        status: res.status,
        createdAt: res.createdAt,
        fullName: res.fullName ?? c.fullName,
        feeAmount: res.feeAmount ?? c.feeAmount,
        feeCurrency: res.feeCurrency ?? c.feeCurrency,
      } : c);
      setStep("success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      surfaceError(e);
    }
  };

  const feeAmount = created?.feeAmount ?? config?.feeForNationality?.amount ?? null;
  const feeCurrency = created?.feeCurrency ?? config?.feeForNationality?.currency ?? "SAR";

  const statusLabel = (s: string) => {
    if (!ar) return s.replace(/_/g, " ");
    const map: Record<string, string> = {
      awaiting_payment: "بانتظار الدفع",
      submitted: "تم التقديم",
      under_review: "قيد المراجعة",
      processing: "قيد المعالجة",
      approved: "مقبول",
      rejected: "مرفوض",
      completed: "مكتمل",
    };
    return map[s] || s;
  };
  const paymentLabel = (s: string) => {
    if (!ar) return s;
    const map: Record<string, string> = { unpaid: "غير مدفوع", paid: "مدفوع", failed: "فشل الدفع" };
    return map[s] || s;
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (step === "success" && created) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6" dir={ar ? "rtl" : "ltr"}>
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-black text-[#0A2342] mb-2">
            {ar ? "تم تقديم طلب تأشيرة العمرة بنجاح" : "Umrah Visa Application Submitted"}
          </h1>
          <p className="text-slate-500 mb-6">
            {ar ? "يمكنك متابعة حالة طلبك باستخدام رقم التتبع." : "You can track your application using the tracking number."}
          </p>
          <div className="text-start bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-8 space-y-3">
            <Row label={ar ? "رقم الطلب" : "Tracking Number"} value={created.trackingNumber} ltr />
            {created.fullName && <Row label={ar ? "اسم المعتمر" : "Pilgrim Name"} value={created.fullName} />}
            <Row label={ar ? "نوع الطلب" : "Application Type"} value={ar ? "تأشيرة العمرة" : "Umrah Visa"} />
            <Row label={ar ? "حالة الدفع" : "Payment Status"} value={paymentLabel(created.paymentStatus)} />
            <Row label={ar ? "حالة الطلب" : "Application Status"} value={statusLabel(created.status)} />
            <Row
              label={ar ? "تاريخ التقديم" : "Submission Date"}
              value={new Date(created.createdAt ?? Date.now()).toLocaleString(ar ? "ar-SA" : "en-US")}
            />
          </div>
          <Link href="/" onClick={() => navigate("/", { replace: true } as any)}>
            <Button className="w-full h-12 bg-[#D4AF37] text-[#0A2342] hover:bg-[#D4AF37]/90 font-black rounded-2xl gap-2" data-testid="button-umrah-success-home">
              <HomeIcon className="h-4 w-4" />
              {ar ? "العودة للرئيسية" : "Back to Home"}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24" dir={ar ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="bg-[#0A2342] pt-16 pb-20 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(212,175,55,0.12)_0%,transparent_50%)]" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="text-4xl mb-2">🕋</div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
            {ar ? "تأشيرة العمرة" : "Umrah Visa"}
          </h1>
          <p className="text-[#D4AF37] text-base font-bold">
            {ar ? "خدمة مستقلة لتقديم طلب تأشيرة العمرة" : "A dedicated Umrah visa application service"}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-12 relative z-20">
        <div className="max-w-2xl mx-auto space-y-6">

          {serverError && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-800">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
              <p className="text-sm font-medium">{serverError}</p>
            </div>
          )}

          {/* Step 1 — host eligibility question */}
          {step === "ask" && (
            <>
              <SectionCard
                icon={HelpCircle}
                title={ar ? "شرط المستضيف" : "Host Requirement"}
                subtitle={ar ? "تأشيرة العمرة تتطلب وجود مستضيف في المملكة العربية السعودية." : "An Umrah visa requires a host in Saudi Arabia."}
              >
                <p className="text-base font-bold text-[#0A2342] mb-5 text-center">
                  {ar ? "هل لديك مستضيف في المملكة العربية السعودية؟" : "Do you have a host in the Kingdom of Saudi Arabia?"}
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setStep("host")}
                    className="flex-1 h-12 bg-[#0A2342] text-white hover:bg-[#0A2342]/90 font-bold rounded-xl"
                    data-testid="button-umrah-host-yes"
                  >
                    {ar ? "نعم" : "Yes"}
                  </Button>
                  <Button
                    onClick={() => setShowReject(true)}
                    variant="outline"
                    className="flex-1 h-12 border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl"
                    data-testid="button-umrah-host-no"
                  >
                    {ar ? "لا" : "No"}
                  </Button>
                </div>
              </SectionCard>

              {/* طلباتي للعمرة — my Umrah applications */}
              {myApps && myApps.length > 0 && (
                <SectionCard icon={FileText} title={ar ? "طلباتي للعمرة" : "My Umrah Applications"}>
                  <div className="space-y-3">
                    {myApps.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setSelectedApp(a)}
                        className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-[#0A2342]/5 hover:border-[#0A2342]/30 transition-colors text-start"
                        data-testid={`button-umrah-app-${a.id}`}
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-[#0A2342] text-sm truncate" dir="ltr">{a.trackingNumber}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {new Date(a.createdAt).toLocaleDateString(ar ? "ar-SA" : "en-US")}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#0A2342]/8 text-[#0A2342]">
                            {statusLabel(a.status)}
                          </span>
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${a.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                            {paymentLabel(a.paymentStatus)}
                          </span>
                          {ar ? <ChevronLeft className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </SectionCard>
              )}
            </>
          )}

          {/* Step 2 — host data */}
          {step === "host" && (
            <SectionCard
              icon={ShieldCheck}
              title={ar ? "بيانات المستضيف" : "Host Information"}
              subtitle={ar ? "أرفق صورة إقامة المستضيف وأدخل رقم جواله المسجل في أبشر." : "Attach the host's residency image and Absher-registered phone."}
            >
              <div className="space-y-6">
                <UmrahUpload
                  ar={ar}
                  required
                  label={ar ? "إرفاق صورة إقامة المستضيف" : "Host Residency Image"}
                  value={sponsorResidencyImageUrl}
                  onChange={setSponsorResidencyImageUrl}
                />

                {sponsorResidencyImageUrl && (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-700">
                      {ar ? "رقم جوال المستضيف المسجل في أبشر" : "Host Phone (Registered in Absher)"} <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex items-stretch rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-[#0A2342]/20">
                      <span className="px-3 flex items-center bg-slate-100 text-slate-600 font-bold text-sm border-e border-slate-200" dir="ltr">+966</span>
                      <input
                        inputMode="numeric"
                        maxLength={9}
                        dir="ltr"
                        className="flex-1 h-11 px-3 bg-transparent outline-none text-sm font-medium"
                        placeholder="5XXXXXXXX"
                        value={sponsorPhoneDigits}
                        onChange={(e) => setSponsorPhoneDigits(e.target.value.replace(/\D/g, "").slice(0, 9))}
                        data-testid="input-umrah-host-phone"
                      />
                    </div>
                    {sponsorPhoneDigits && !saudiPhoneValid(sponsorPhoneDigits) && (
                      <p className="text-xs text-amber-600 font-medium">
                        {ar ? "يجب أن يتكون الرقم من 9 أرقام ويبدأ بـ 5." : "Must be 9 digits and start with 5."}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setStep("ask")} className="h-11 rounded-xl font-bold border-slate-200">
                    {ar ? "رجوع" : "Back"}
                  </Button>
                  <Button
                    onClick={() => { setServerError(null); setStep("pilgrim"); }}
                    disabled={!sponsorResidencyImageUrl || !saudiPhoneValid(sponsorPhoneDigits)}
                    className="flex-1 h-11 bg-[#0A2342] text-white hover:bg-[#0A2342]/90 font-bold rounded-xl gap-2 disabled:opacity-50"
                    data-testid="button-umrah-host-next"
                  >
                    {ar ? "متابعة إلى بيانات المعتمر" : "Continue to Pilgrim Data"}
                    {ar ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Step 3 — pilgrim data */}
          {step === "pilgrim" && (
            <SectionCard
              icon={ScanLine}
              title={ar ? "بيانات المعتمر" : "Pilgrim Information"}
              subtitle={ar ? "نطلب فقط البيانات والمستندات اللازمة لتقديم تأشيرة العمرة." : "We only ask for the data and documents required for the Umrah visa."}
            >
              <div className="space-y-6">
                <UmrahUpload
                  ar={ar}
                  required
                  label={ar ? "صورة الجواز" : "Passport Image"}
                  value={passportImageUrl}
                  onChange={handlePassportUploaded}
                />
                {passportImageUrl && ocrMutation.isPending && (
                  <div className="flex items-center gap-2 text-sm text-[#0A2342] font-medium">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {ar ? "جاري استخراج بيانات الجواز..." : "Extracting passport data..."}
                  </div>
                )}
                {ocrRan && (ocr.fullName || ocr.fullNameAr || ocr.passportNumber || ocr.nationality) && (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-3">
                      <CheckCircle2 className="w-4 h-4" />
                      {ar ? "تم استخراج البيانات من الجواز تلقائياً" : "Data extracted from passport"}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      {[
                        [ar ? "الاسم" : "Name", ocr.fullName || ocr.fullNameAr || ocr.fullNameEn],
                        [ar ? "رقم الجواز" : "Passport No.", ocr.passportNumber],
                        [ar ? "الجنسية" : "Nationality", ocr.nationality || ocr.issuingCountry],
                        [ar ? "تاريخ الميلاد" : "Date of Birth", ocr.dateOfBirth],
                        [ar ? "الجنس" : "Gender", ocr.gender],
                        [ar ? "تاريخ الإصدار" : "Issue Date", ocr.issueDate],
                        [ar ? "تاريخ الانتهاء" : "Expiry Date", ocr.expiryDate],
                      ].filter(([, v]) => v).map(([k, v]) => (
                        <div key={k as string} className="flex justify-between gap-2">
                          <span className="text-slate-500">{k}</span>
                          <span className="font-semibold text-slate-800" dir="ltr">{v as string}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <UmrahUpload
                  ar={ar}
                  required
                  label={ar ? "الصورة الشخصية" : "Personal Photo"}
                  value={personalPhotoUrl}
                  onChange={setPersonalPhotoUrl}
                />

                <PhoneField
                  ar={ar}
                  label={ar ? "رقم جوال المعتمر" : "Pilgrim Phone"}
                  value={phoneDigits}
                  onChange={setPhoneDigits}
                  valid={saudiPhoneValid}
                  testid="input-umrah-pilgrim-phone"
                />

                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-700">
                    {ar ? "بيانات التواصل (بريد إلكتروني)" : "Contact Email"}
                    <span className="text-slate-400 font-normal ms-1">({ar ? "اختياري" : "optional"})</span>
                  </Label>
                  <Input
                    type="email"
                    dir="ltr"
                    className="h-11 bg-slate-50"
                    placeholder="name@example.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    data-testid="input-umrah-contact-email"
                  />
                </div>

                <PhoneField
                  ar={ar}
                  label={ar ? "رقم جوال قريب أو صديق للطوارئ" : "Emergency Contact Phone"}
                  value={emergencyDigits}
                  onChange={setEmergencyDigits}
                  valid={saudiPhoneValid}
                  testid="input-umrah-emergency-phone"
                />

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setStep("host")} className="h-11 rounded-xl font-bold border-slate-200">
                    {ar ? "رجوع" : "Back"}
                  </Button>
                  <Button
                    onClick={() => { setServerError(null); setStep("declaration"); }}
                    disabled={!pilgrimValid}
                    className="flex-1 h-11 bg-[#0A2342] text-white hover:bg-[#0A2342]/90 font-bold rounded-xl gap-2 disabled:opacity-50"
                    data-testid="button-umrah-pilgrim-next"
                  >
                    {ar ? "متابعة إلى الإقرار" : "Continue to Declaration"}
                    {ar ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Step 4 — declaration */}
          {step === "declaration" && (
            <SectionCard
              icon={FileText}
              title={ar ? "إقرار وتعهد تأشيرة العمرة" : "Umrah Visa Declaration & Undertaking"}
            >
              <div className="space-y-5">
                {configLoading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin" /> {ar ? "جاري تحميل نص الإقرار..." : "Loading declaration..."}
                  </div>
                ) : (
                  <div
                    className="max-h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed text-slate-700 whitespace-pre-line"
                    dir={ar ? "rtl" : "ltr"}
                  >
                    {(ar ? config?.declarationAr : config?.declarationEn) ||
                      (ar
                        ? "المعتمر والمستضيف مسؤولان عن الالتزام بأنظمة وتعليمات العمرة والأنظمة المعمول بها في المملكة العربية السعودية. تنبيه: قد تصل الغرامة إلى 50,000 ريال بالإضافة إلى السجن وفق النظام المعتمد."
                        : "The pilgrim and host are responsible for complying with Umrah regulations and the laws in force in the Kingdom of Saudi Arabia. Warning: fines may reach SAR 50,000 in addition to imprisonment under the applicable law.")}
                  </div>
                )}

                <label className="flex items-start gap-3 cursor-pointer p-4 rounded-2xl border border-slate-200 hover:border-[#0A2342]/30 transition-colors">
                  <Checkbox
                    checked={declarationAccepted}
                    onCheckedChange={(c) => setDeclarationAccepted(!!c)}
                    className="mt-0.5 scale-110"
                    data-testid="checkbox-umrah-declaration"
                  />
                  <div className="text-sm text-slate-700 leading-relaxed font-medium">
                    {ar
                      ? "أقر بأنني قرأت ووافقت على إقرار وتعهد تأشيرة العمرة."
                      : "I acknowledge that I have read and agreed to the Umrah visa declaration and undertaking."}
                  </div>
                </label>

                <div className="flex gap-3 pt-1">
                  <Button variant="outline" onClick={() => setStep("pilgrim")} className="h-11 rounded-xl font-bold border-slate-200">
                    {ar ? "رجوع" : "Back"}
                  </Button>
                  <Button
                    onClick={submitApplication}
                    disabled={!declarationAccepted || createMutation.isPending}
                    className="flex-1 h-11 bg-[#0A2342] text-white hover:bg-[#0A2342]/90 font-bold rounded-xl gap-2 disabled:opacity-50"
                    data-testid="button-umrah-declaration-next"
                  >
                    {createMutation.isPending
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <>{ar ? "متابعة إلى الدفع" : "Continue to Payment"}{ar ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}</>}
                  </Button>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Step 5 — payment */}
          {step === "payment" && created && (
            <SectionCard
              icon={CreditCard}
              title={ar ? "دفع رسوم تأشيرة العمرة" : "Umrah Visa Payment"}
              subtitle={ar ? "تتطلب تأشيرة العمرة الدفع مقدماً." : "The Umrah visa requires prepayment."}
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <div className="text-sm text-slate-500">{ar ? "رقم الطلب" : "Tracking Number"}</div>
                    <div className="font-bold text-[#0A2342]" dir="ltr">{created.trackingNumber}</div>
                  </div>
                  <div className="text-end">
                    <div className="text-3xl font-black text-[#0A2342]">
                      {feeAmount != null ? Number(feeAmount).toLocaleString() : "—"}
                    </div>
                    <div className="text-sm text-slate-500">{feeCurrency}</div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 text-center">
                  {ar
                    ? "يتم تحديد الرسوم حسب جنسية المعتمر ويتحقق النظام من عملية الدفع من الخادم."
                    : "The fee is set by the pilgrim's nationality and payment is verified on the server."}
                </p>
                <Button
                  onClick={handlePay}
                  disabled={payMutation.isPending}
                  className="w-full h-14 bg-[#D4AF37] text-[#0A2342] font-black text-lg rounded-2xl hover:bg-[#D4AF37]/90 disabled:opacity-50 gap-3"
                  data-testid="button-umrah-pay"
                >
                  {payMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CreditCard className="w-5 h-5" />{ar ? "ادفع الآن" : "Pay Now"}</>}
                </Button>
              </div>
            </SectionCard>
          )}
        </div>
      </div>

      {/* Rejection modal — no host in KSA */}
      <Dialog open={showReject} onOpenChange={setShowReject}>
        <DialogContent className="max-w-md rounded-2xl" dir={ar ? "rtl" : "ltr"}>
          <DialogHeader className="items-center text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center mb-3 mx-auto">
              <span className="text-3xl">🕋</span>
            </div>
            <DialogTitle className="text-lg font-extrabold text-[#0A2342]">
              {ar ? "عذراً" : "Sorry"}
            </DialogTitle>
            <DialogDescription className="text-base text-slate-600 pt-1 leading-relaxed">
              {ar
                ? "عذراً، لا يمكنك التقديم على تأشيرة العمرة لعدم وجود مستضيف في المملكة العربية السعودية."
                : "Sorry, you cannot apply for an Umrah visa because you do not have a host in the Kingdom of Saudi Arabia."}
            </DialogDescription>
          </DialogHeader>
          <div className="pt-2">
            <Link href="/">
              <Button
                className="w-full h-12 bg-[#D4AF37] text-[#0A2342] hover:bg-[#D4AF37]/90 font-bold rounded-xl gap-2"
                data-testid="button-umrah-reject-home"
              >
                <HomeIcon className="h-4 w-4" />
                {ar ? "العودة للرئيسية" : "Back to Home"}
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      {/* Umrah application detail / tracking view */}
      <UmrahDetailDialog
        app={selectedApp}
        onClose={() => setSelectedApp(null)}
        ar={ar}
        statusLabel={statusLabel}
        paymentLabel={paymentLabel}
      />
    </div>
  );
}

/** Ordered status timeline (rejected is a terminal branch shown inline). */
const TIMELINE_STEPS = ["awaiting_payment", "submitted", "under_review", "processing", "approved", "completed"] as const;

function UmrahDetailDialog({
  app, onClose, ar, statusLabel, paymentLabel,
}: {
  app: UmrahApplication | null;
  onClose: () => void;
  ar: boolean;
  statusLabel: (s: string) => string;
  paymentLabel: (s: string) => string;
}) {
  const [downloading, setDownloading] = useState(false);
  const [dlError, setDlError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!app?.issuedVisaUrl) return;
    setDlError(null);
    setDownloading(true);
    try {
      const url = await getSignedObjectUrl(app.issuedVisaUrl, true);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setDlError(ar ? "تعذّر تحميل التأشيرة، حاول مرة أخرى." : "Could not download the visa, please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const rejected = app?.status === "rejected";
  const currentIdx = app ? TIMELINE_STEPS.indexOf(app.status as any) : -1;

  return (
    <Dialog open={!!app} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto" dir={ar ? "rtl" : "ltr"}>
        {app && (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-[#0A2342] flex items-center gap-2">
                <span className="text-2xl">🕋</span>
                {ar ? "تفاصيل طلب تأشيرة العمرة" : "Umrah Visa Application"}
              </DialogTitle>
              <DialogDescription className="sr-only">{ar ? "تفاصيل ومتابعة الطلب" : "Application details and tracking"}</DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              {/* Tracking number + badges */}
              <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Hash className="w-3 h-3" /> {ar ? "رقم الطلب" : "Tracking Number"}
                  </div>
                  <div className="font-black text-[#0A2342] text-lg tracking-wide truncate" dir="ltr">{app.trackingNumber}</div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#0A2342]/8 text-[#0A2342]">
                    {statusLabel(app.status)}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${app.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-700" : app.paymentStatus === "failed" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                    {paymentLabel(app.paymentStatus)}
                  </span>
                </div>
              </div>

              {/* Status timeline */}
              <div>
                <div className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> {ar ? "مسار الطلب" : "Status Timeline"}
                </div>
                {rejected ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-bold">{ar ? "تم رفض الطلب" : "Application Rejected"}</span>
                  </div>
                ) : (
                  <ol className="space-y-0">
                    {TIMELINE_STEPS.map((s, i) => {
                      const done = currentIdx >= 0 && i <= currentIdx;
                      const active = i === currentIdx;
                      return (
                        <li key={s} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-[#0A2342] text-white" : "bg-slate-200 text-slate-400"}`}>
                              {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                            </div>
                            {i < TIMELINE_STEPS.length - 1 && (
                              <div className={`w-0.5 h-6 ${i < currentIdx ? "bg-[#0A2342]" : "bg-slate-200"}`} />
                            )}
                          </div>
                          <div className={`text-sm pb-4 ${active ? "font-black text-[#0A2342]" : done ? "font-semibold text-slate-700" : "text-slate-400"}`}>
                            {statusLabel(s)}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 gap-2 text-sm">
                <Row label={ar ? "نوع الطلب" : "Application Type"} value={ar ? "تأشيرة العمرة" : "Umrah Visa"} />
                {app.fullName && <Row label={ar ? "اسم المعتمر" : "Pilgrim Name"} value={app.fullName} />}
                {app.nationality && <Row label={ar ? "الجنسية" : "Nationality"} value={app.nationality} />}
                {app.feeAmount != null && (
                  <Row label={ar ? "مبلغ الرسوم" : "Fee"} value={`${Number(app.feeAmount).toLocaleString()} ${app.feeCurrency}`} ltr />
                )}
                <Row
                  label={ar ? "تاريخ التقديم" : "Submission Date"}
                  value={new Date(app.createdAt).toLocaleString(ar ? "ar-SA" : "en-US")}
                />
              </div>

              {/* Admin notes */}
              {app.adminNotes && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                  <div className="text-xs font-bold text-amber-700 mb-1.5 flex items-center gap-1.5">
                    <StickyNote className="w-3.5 h-3.5" /> {ar ? "ملاحظات الإدارة" : "Admin Notes"}
                  </div>
                  <p className="text-sm text-amber-800 leading-relaxed whitespace-pre-line">{app.adminNotes}</p>
                </div>
              )}

              {/* Issued visa download */}
              {app.issuedVisaUrl && (
                <div className="space-y-2">
                  <Button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="w-full h-12 bg-[#D4AF37] text-[#0A2342] hover:bg-[#D4AF37]/90 font-black rounded-2xl gap-2"
                    data-testid="button-umrah-download-visa"
                  >
                    {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Download className="w-5 h-5" />{ar ? "تحميل تأشيرة العمرة" : "Download Umrah Visa"}</>}
                  </Button>
                  {dlError && <p className="text-xs text-red-500 font-medium text-center">{dlError}</p>}
                </div>
              )}

              <Button variant="outline" onClick={onClose} className="w-full h-11 rounded-xl font-bold border-slate-200">
                {ar ? "إغلاق" : "Close"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** +966 phone field (9 digits, must start with 5). */
function PhoneField({ ar, label, value, onChange, valid, testid }: {
  ar: boolean; label: string; value: string; onChange: (v: string) => void;
  valid: (d: string) => boolean; testid?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold text-slate-700">{label} <span className="text-red-500">*</span></Label>
      <div className="flex items-stretch rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-[#0A2342]/20">
        <span className="px-3 flex items-center bg-slate-100 text-slate-600 font-bold text-sm border-e border-slate-200" dir="ltr">+966</span>
        <input
          inputMode="numeric"
          maxLength={9}
          dir="ltr"
          className="flex-1 h-11 px-3 bg-transparent outline-none text-sm font-medium"
          placeholder="5XXXXXXXX"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 9))}
          data-testid={testid}
        />
      </div>
      {value && !valid(value) && (
        <p className="text-xs text-amber-600 font-medium">
          {ar ? "يجب أن يتكون الرقم من 9 أرقام ويبدأ بـ 5." : "Must be 9 digits and start with 5."}
        </p>
      )}
    </div>
  );
}

/** Success-screen label/value row. */
function Row({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-bold text-[#0A2342]" dir={ltr ? "ltr" : undefined}>{value}</span>
    </div>
  );
}
