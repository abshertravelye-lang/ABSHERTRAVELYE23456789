import { useState, useMemo } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateVisaApplication, Visa, VisaApplicationInput } from "@workspace/api-client-react";
import { useUpload } from "@workspace/object-storage-web";
import { CheckCircle, X, UploadCloud, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";

type StepId =
  | "gcc_check"
  | "alternative_check"
  | "nationality_check"
  | "application_form"
  | "rejection"
  | "success";

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
  agreedToTerms?: boolean;

  passportImageUrl?: string;
  personalPhotoUrl?: string;
  residencyImageUrl?: string;
  visaImageUrl?: string;
}

const GCC_COUNTRIES = [
  { id: "saudi_arabia", ar: "المملكة العربية السعودية", en: "Saudi Arabia" },
  { id: "uae", ar: "الإمارات العربية المتحدة", en: "UAE" },
  { id: "kuwait", ar: "الكويت", en: "Kuwait" },
  { id: "qatar", ar: "قطر", en: "Qatar" },
  { id: "bahrain", ar: "البحرين", en: "Bahrain" },
];

function FileUploadField({ label, value, onChange, required, language }: { label: string, value?: string, onChange: (val: string) => void, required?: boolean, language: string }) {
  const { uploadFile, isUploading, error, progress } = useUpload({ basePath: "/api/storage" });
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const res = await uploadFile(file);
      if (res) onChange(res.objectPath);
    }
  };
  
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {value ? (
        <div className="flex items-center gap-3 p-3 border border-green-200 rounded-xl bg-green-50 text-green-700">
           <CheckCircle className="w-5 h-5 shrink-0" />
           <span className="text-sm truncate flex-1" dir="ltr">{value.split('/').pop()}</span>
           <button type="button" onClick={() => onChange("")} className="p-1 hover:bg-green-100 rounded-lg text-green-600 transition-colors">
             <X className="w-4 h-4" />
           </button>
        </div>
      ) : (
        <div className="relative group">
          <input type="file" onChange={handleFileChange} disabled={isUploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10" />
          <div className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl transition-all ${isUploading ? 'bg-primary/5 border-primary/30' : 'bg-slate-50 border-slate-200 group-hover:border-primary/40 group-hover:bg-primary/5'}`}>
            {isUploading ? (
               <div className="flex flex-col items-center gap-2">
                 <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                 <span className="text-xs text-primary font-medium" dir="ltr">{progress}%</span>
               </div>
            ) : (
               <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-primary transition-colors">
                 <UploadCloud className="w-6 h-6" />
                 <span className="text-sm font-medium text-center">{language === 'ar' ? 'اختر ملفاً أو اسحبه هنا' : 'Choose a file or drag it here'}</span>
               </div>
            )}
          </div>
        </div>
      )}
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {error.message}</p>}
    </div>
  );
}

export function VisaApplicationWizard({ visa, open, onOpenChange }: { visa: Visa; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { language } = useTranslation();
  const ar = language === "ar";
  
  const hasAlternative = !!(visa.acceptsSchengenResidency || visa.acceptsUkResidency || visa.acceptsUsVisa || visa.acceptsCanadaResidency || visa.acceptsAustraliaResidency);
  
  const getInitialStep = (): StepId => {
    if (visa.acceptsGccResidency) return "gcc_check";
    if (hasAlternative) return "alternative_check";
    return "application_form";
  };

  const [history, setHistory] = useState<StepId[]>([]);
  const [currentStep, setCurrentStep] = useState<StepId>(getInitialStep());
  const [data, setData] = useState<WizardData>({ gender: "male", agreedToTerms: false });
  const [rejectionMessage, setRejectionMessage] = useState("");
  const [applicationId, setApplicationId] = useState<number | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const updateData = (updates: Partial<WizardData>) => setData(prev => ({ ...prev, ...updates }));

  const goToNext = (next: StepId) => {
    setHistory(prev => [...prev, currentStep]);
    setCurrentStep(next);
  };

  const goBack = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory(h => h.slice(0, -1));
      setCurrentStep(prev);
    }
  };

  const ALT_REGIONS = [
    { id: "schengen", ar: "تأشيرة/إقامة الشنغن", en: "Schengen Visa/Residency", active: visa.acceptsSchengenResidency },
    { id: "uk", ar: "تأشيرة/إقامة بريطانيا", en: "UK Visa/Residency", active: visa.acceptsUkResidency },
    { id: "usa", ar: "تأشيرة/إقامة أمريكا", en: "US Visa/Residency", active: visa.acceptsUsVisa },
    { id: "canada", ar: "تأشيرة/إقامة كندا", en: "Canada Visa/Residency", active: visa.acceptsCanadaResidency },
    { id: "australia", ar: "تأشيرة/إقامة أستراليا", en: "Australia Visa/Residency", active: visa.acceptsAustraliaResidency },
  ].filter(r => r.active);

  const getProjectedSteps = () => {
    const projected: StepId[] = [...history, currentStep];
    let simStep = currentStep;
    let iterations = 0;
    while (simStep !== "application_form" && simStep !== "rejection" && simStep !== "success" && iterations < 10) {
      if (simStep === "gcc_check") {
         const ans = data.hasGcc ?? false;
         simStep = ans ? "application_form" : (hasAlternative ? "alternative_check" : "nationality_check");
      } else if (simStep === "alternative_check") {
         const ans = data.hasAlternative ?? false;
         simStep = ans ? "application_form" : "nationality_check";
      } else if (simStep === "nationality_check") {
         simStep = "application_form";
      }
      if (!projected.includes(simStep)) projected.push(simStep);
      iterations++;
    }
    return projected;
  };

  const projectedSteps = getProjectedSteps();
  const totalSteps = projectedSteps.length;
  const currentStepIndex = history.length + 1;
  const isTerminal = currentStep === "rejection" || currentStep === "success";
  
  const canGoNext = () => {
    if (currentStep === "gcc_check") return data.hasGcc !== undefined && (!data.hasGcc || !!data.gccCountry);
    if (currentStep === "alternative_check") return data.hasAlternative !== undefined && (!data.hasAlternative || !!data.alternativeRegion);
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
      onSuccess: (res) => {
        setApplicationId(res.id);
        goToNext("success");
      },
      onError: (err: any) => {
        const msg = err.error || err.message || (ar ? "حدث خطأ أثناء إرسال الطلب." : "An error occurred while submitting.");
        setServerError(msg);
      }
    }
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
          ar 
            ? (visa.ineligibleMessageAr || "عذراً، هذه التأشيرة غير متاحة لجنسيتك في الوقت الحالي.")
            : (visa.ineligibleMessageEn || "Sorry, this visa is not available for your nationality at the moment.")
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

      const payload: VisaApplicationInput = {
        visaId: visa.id,
        eligibilityPath: eligibilityPath as any,
        gccCountry: data.gccCountry,
        alternativeRegion: data.alternativeRegion,
        fullName: data.fullName!,
        nationality: data.nationality!,
        passportNumber: data.passportNumber!,
        passportIssueDate: data.passportIssueDate!,
        passportExpiryDate: data.passportExpiryDate!,
        dateOfBirth: data.dateOfBirth!,
        gender: data.gender as any,
        email: data.email!,
        phone: data.phone!,
        passportImageUrl: data.passportImageUrl,
        personalPhotoUrl: data.personalPhotoUrl,
        residencyImageUrl: data.residencyImageUrl,
        visaImageUrl: data.visaImageUrl,
        agreedToTerms: !!data.agreedToTerms,
      };
      submitApplication({ data: payload });
    }
  };

  const hasNationalityFromStep2 = !!data.nationality && history.includes("nationality_check");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
        <div className="p-6 pb-2 border-b bg-slate-50 shrink-0">
          <DialogHeader>
            <DialogTitle className="text-xl text-primary">{ar ? "طلب تأشيرة" : "Visa Application"} - {ar ? visa.countryAr : visa.countryEn}</DialogTitle>
            <DialogDescription className="sr-only">Visa application wizard</DialogDescription>
          </DialogHeader>
          
          {!isTerminal && (
            <div className="mt-6 mb-2">
              <div className="flex justify-between text-sm font-medium text-slate-500 mb-2">
                <span>{ar ? "الخطوة" : "Step"} {currentStepIndex} {ar ? "من" : "of"} {totalSteps}</span>
              </div>
              <div className="flex gap-1 h-1.5">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div key={i} className={`flex-1 rounded-full ${i < currentStepIndex ? 'bg-primary' : 'bg-slate-200'}`} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {currentStep === "gcc_check" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-800">{ar ? "هل أنت مقيم في أحد دول مجلس التعاون الخليجي؟" : "Are you a resident of a GCC country?"}</h3>
              <RadioGroup value={data.hasGcc === true ? "yes" : data.hasGcc === false ? "no" : ""} onValueChange={v => updateData({ hasGcc: v === "yes", gccCountry: undefined })}>
                <div className="flex items-center space-x-2 space-x-reverse mb-3">
                  <RadioGroupItem value="yes" id="gcc-yes" />
                  <Label htmlFor="gcc-yes">{ar ? "نعم" : "Yes"}</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="no" id="gcc-no" />
                  <Label htmlFor="gcc-no">{ar ? "لا" : "No"}</Label>
                </div>
              </RadioGroup>
              
              {data.hasGcc && (
                <div className="space-y-3 pt-4 border-t animate-in fade-in zoom-in-95 duration-200">
                  <Label>{ar ? "الرجاء اختيار دولة الإقامة" : "Please select country of residence"}</Label>
                  <Select value={data.gccCountry} onValueChange={v => updateData({ gccCountry: v })}>
                    <SelectTrigger><SelectValue placeholder={ar ? "اختر الدولة" : "Select Country"} /></SelectTrigger>
                    <SelectContent>
                      {GCC_COUNTRIES.map(c => <SelectItem key={c.id} value={c.id}>{ar ? c.ar : c.en}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {currentStep === "alternative_check" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-800">{ar ? "هل تحمل إقامة أو تأشيرة سارية لأحد الدول التالية؟" : "Do you hold a valid visa or residency for any of the following?"}</h3>
              <RadioGroup value={data.hasAlternative === true ? "yes" : data.hasAlternative === false ? "no" : ""} onValueChange={v => updateData({ hasAlternative: v === "yes", alternativeRegion: undefined })}>
                <div className="flex items-center space-x-2 space-x-reverse mb-3">
                  <RadioGroupItem value="yes" id="alt-yes" />
                  <Label htmlFor="alt-yes">{ar ? "نعم" : "Yes"}</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="no" id="alt-no" />
                  <Label htmlFor="alt-no">{ar ? "لا" : "No"}</Label>
                </div>
              </RadioGroup>
              
              {data.hasAlternative && (
                <div className="space-y-3 pt-4 border-t animate-in fade-in zoom-in-95 duration-200">
                  <Label>{ar ? "الرجاء اختيار التأشيرة/الإقامة" : "Please select your visa/residency"}</Label>
                  <Select value={data.alternativeRegion} onValueChange={v => updateData({ alternativeRegion: v })}>
                    <SelectTrigger><SelectValue placeholder={ar ? "اختر المنطقة" : "Select Region"} /></SelectTrigger>
                    <SelectContent>
                      {ALT_REGIONS.map(r => <SelectItem key={r.id} value={r.id}>{ar ? r.ar : r.en}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {currentStep === "nationality_check" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-800">{ar ? "الرجاء إدخال جنسيتك للتحقق من أهليتك" : "Please enter your nationality to check eligibility"}</h3>
              <div className="space-y-2">
                <Label>{ar ? "الجنسية" : "Nationality"}</Label>
                <Input placeholder={ar ? "مثال: مصري" : "e.g. Egyptian"} value={data.nationality || ""} onChange={e => updateData({ nationality: e.target.value })} />
              </div>
            </div>
          )}

          {currentStep === "application_form" && (
            <div className="space-y-8">
              {serverError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                  <p className="text-sm font-medium">{serverError}</p>
                </div>
              )}

              <div>
                <h4 className="text-base font-bold text-slate-800 mb-4 border-b pb-2">{ar ? "المعلومات الشخصية" : "Personal Information"}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2 md:col-span-2">
                    <Label>{ar ? "الاسم الكامل (كما في الجواز)" : "Full Name (as in passport)"} *</Label>
                    <Input value={data.fullName || ""} onChange={e => updateData({ fullName: e.target.value })} />
                  </div>
                  
                  {!hasNationalityFromStep2 && (
                    <div className="space-y-2">
                      <Label>{ar ? "الجنسية" : "Nationality"} *</Label>
                      <Input value={data.nationality || ""} onChange={e => updateData({ nationality: e.target.value })} />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>{ar ? "تاريخ الميلاد" : "Date of Birth"} *</Label>
                    <Input type="date" value={data.dateOfBirth || ""} onChange={e => updateData({ dateOfBirth: e.target.value })} />
                  </div>

                  <div className="space-y-2">
                    <Label>{ar ? "الجنس" : "Gender"} *</Label>
                    <Select value={data.gender} onValueChange={v => updateData({ gender: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">{ar ? "ذكر" : "Male"}</SelectItem>
                        <SelectItem value="female">{ar ? "أنثى" : "Female"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-800 mb-4 border-b pb-2">{ar ? "معلومات الاتصال" : "Contact Information"}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label>{ar ? "البريد الإلكتروني" : "Email"} *</Label>
                    <Input type="email" value={data.email || ""} onChange={e => updateData({ email: e.target.value })} dir="ltr" className={ar ? "text-right" : ""} />
                  </div>
                  <div className="space-y-2">
                    <Label>{ar ? "رقم الهاتف" : "Phone Number"} *</Label>
                    <Input type="tel" value={data.phone || ""} onChange={e => updateData({ phone: e.target.value })} dir="ltr" className={ar ? "text-right" : ""} placeholder="+966..." />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-800 mb-4 border-b pb-2">{ar ? "بيانات الجواز" : "Passport Details"}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2 md:col-span-2">
                    <Label>{ar ? "رقم الجواز" : "Passport Number"} *</Label>
                    <Input value={data.passportNumber || ""} onChange={e => updateData({ passportNumber: e.target.value })} className="uppercase" />
                  </div>
                  <div className="space-y-2">
                    <Label>{ar ? "تاريخ الإصدار" : "Issue Date"} *</Label>
                    <Input type="date" value={data.passportIssueDate || ""} onChange={e => updateData({ passportIssueDate: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>{ar ? "تاريخ الانتهاء" : "Expiry Date"} *</Label>
                    <Input type="date" value={data.passportExpiryDate || ""} onChange={e => updateData({ passportExpiryDate: e.target.value })} />
                  </div>
                </div>
              </div>

              {(visa.requiresPassportImage || visa.requiresPersonalPhoto || visa.requiresResidencyImage || visa.requiresVisaImage) && (
                <div>
                  <h4 className="text-base font-bold text-slate-800 mb-4 border-b pb-2">{ar ? "المستندات المطلوبة" : "Required Documents"}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {visa.requiresPassportImage && (
                      <FileUploadField required language={language} label={ar ? "صورة الجواز" : "Passport Image"} value={data.passportImageUrl} onChange={v => updateData({ passportImageUrl: v })} />
                    )}
                    {visa.requiresPersonalPhoto && (
                      <FileUploadField required language={language} label={ar ? "صورة شخصية" : "Personal Photo"} value={data.personalPhotoUrl} onChange={v => updateData({ personalPhotoUrl: v })} />
                    )}
                    {visa.requiresResidencyImage && (
                      <FileUploadField required language={language} label={ar ? "صورة الإقامة" : "Residency Image"} value={data.residencyImageUrl} onChange={v => updateData({ residencyImageUrl: v })} />
                    )}
                    {visa.requiresVisaImage && (
                      <FileUploadField required language={language} label={ar ? "صورة التأشيرة" : "Visa Image"} value={data.visaImageUrl} onChange={v => updateData({ visaImageUrl: v })} />
                    )}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer p-4 border rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <Checkbox checked={data.agreedToTerms} onCheckedChange={c => updateData({ agreedToTerms: !!c })} className="mt-1" />
                  <span className="text-sm text-slate-700 leading-relaxed">
                    {ar 
                      ? "أقر بأن جميع البيانات والمستندات المقدمة صحيحة، وأوافق على الشروط والأحكام المتعلقة باستخراج التأشيرة." 
                      : "I declare that all provided information and documents are correct, and I agree to the terms and conditions regarding visa processing."}
                  </span>
                </label>
              </div>
            </div>
          )}

          {currentStep === "rejection" && (
            <div className="text-center py-12 px-4 space-y-5 animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-red-100">
                <X className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">{ar ? "غير مؤهل للتقديم" : "Not Eligible"}</h2>
              <p className="text-slate-600 max-w-sm mx-auto leading-relaxed">{rejectionMessage}</p>
            </div>
          )}

          {currentStep === "success" && (
            <div className="text-center py-12 px-4 space-y-5 animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-green-100">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">{ar ? "تم استلام الطلب بنجاح" : "Application Received Successfully"}</h2>
              <p className="text-slate-600 max-w-sm mx-auto leading-relaxed">
                {ar ? `تم استلام طلب التأشيرة الخاص بك ورقم الطلب هو` : `Your visa application has been received. Your Application ID is`}<br />
                <strong className="text-primary text-xl mt-2 block">#{applicationId}</strong>
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-slate-50 flex justify-between shrink-0">
          {!isTerminal ? (
            <>
              <Button variant="outline" onClick={goBack} disabled={history.length === 0} className="rounded-xl px-6">
                {ar ? <ArrowRight className="w-4 h-4 ml-2" /> : <ArrowLeft className="w-4 h-4 mr-2" />}
                {ar ? "السابق" : "Back"}
              </Button>
              <Button onClick={handleNext} disabled={!canGoNext() || isPending} className="rounded-xl px-8 shadow-sm">
                {currentStep === "application_form" ? (
                  isPending ? (ar ? "جاري الإرسال..." : "Submitting...") : (ar ? "تقديم الطلب" : "Submit Application")
                ) : (
                  <>
                    {ar ? "التالي" : "Next"}
                    {ar ? <ArrowLeft className="w-4 h-4 mr-2" /> : <ArrowRight className="w-4 h-4 ml-2" />}
                  </>
                )}
              </Button>
            </>
          ) : currentStep === "rejection" ? (
            <>
              <Button variant="outline" onClick={goBack} className="rounded-xl px-6">
                {ar ? "تعديل البيانات" : "Edit Details"}
              </Button>
              <Button onClick={() => onOpenChange(false)} variant="secondary" className="rounded-xl px-8">
                {ar ? "إغلاق" : "Close"}
              </Button>
            </>
          ) : (
            <div className="w-full flex justify-center">
              <Button onClick={() => onOpenChange(false)} className="rounded-xl px-12 max-w-sm w-full">
                {ar ? "إغلاق" : "Close"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
