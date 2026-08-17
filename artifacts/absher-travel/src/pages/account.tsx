import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { useAuth } from "@/hooks/use-auth";
import { PhoneDialInput, parseFullPhone, buildFullPhone } from "@/components/phone-dial-input";
import {
  useListVisaApplications, useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead,
  useListMyBookings, useUpdateProfile, useGetCurrentUser, getGetCurrentUserQueryKey,
  VisaApplication, Notification as ApiNotification, Booking, useOcrPassport,
  customFetch, ApiError,
  useListMyProgramBookings, useCancelProgramBooking, getListMyProgramBookingsQueryKey,
  ProgramBooking,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { CountrySelect } from "@/components/country-select";
import { getCountryByCode, canonicalCountryEn } from "@workspace/countries";
import { useQueryClient } from "@tanstack/react-query";

/* ── PDF Ticket Generator ── */
function generateFlightTicketHTML(booking: Booking, ar: boolean): string {
  const logo = "ABSHER TRAVEL";
  const date = new Date(booking.createdAt).toLocaleDateString(ar ? "ar-SA" : "en-US", { year: "numeric", month: "long", day: "numeric" });
  const ref = `ABR-${String(booking.id).padStart(6, "0")}`;

  return `<!DOCTYPE html>
<html dir="${ar ? "rtl" : "ltr"}" lang="${ar ? "ar" : "en"}">
<head>
  <meta charset="UTF-8">
  <title>${ar ? "تذكرة حجز" : "Booking Ticket"} — ${ref}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Tajawal',Arial,sans-serif; background:#f1f5f9; padding:24px; color:#1e293b; }
    .ticket { max-width:680px; margin:0 auto; background:#fff; border-radius:20px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,.12); }
    .header { background:linear-gradient(135deg,#0d2351 0%,#1a3875 100%); padding:28px 32px; color:#fff; }
    .header-row { display:flex; justify-content:space-between; align-items:center; }
    .logo { font-size:22px; font-weight:900; letter-spacing:-0.5px; }
    .type-badge { background:rgba(200,168,75,.25); color:#c8a84b; border:1px solid rgba(200,168,75,.4); padding:4px 14px; border-radius:20px; font-size:13px; font-weight:700; }
    .ref-block { margin-top:18px; }
    .ref-label { font-size:11px; color:rgba(255,255,255,.5); text-transform:uppercase; letter-spacing:2px; margin-bottom:4px; }
    .ref-number { font-size:28px; font-weight:900; color:#c8a84b; letter-spacing:3px; }
    .divider { display:flex; align-items:center; gap:0; position:relative; }
    .circle-left,.circle-right { width:22px; height:22px; border-radius:50%; background:#f1f5f9; flex-shrink:0; }
    .dashed { flex:1; border-top:2px dashed #e2e8f0; }
    .body { padding:28px 32px; }
    .row { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px; }
    .field label { font-size:11px; color:#94a3b8; font-weight:700; text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:4px; }
    .field .val { font-size:16px; font-weight:700; color:#0d2351; }
    .status-bar { background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:12px; padding:14px 18px; display:flex; align-items:center; justify-content:space-between; margin:20px 0; }
    .status-label { font-size:12px; color:#64748b; font-weight:600; }
    .status-val { font-size:14px; font-weight:900; color:#0d2351; }
    .footer { background:#f8fafc; border-top:1.5px dashed #e2e8f0; padding:18px 32px; display:flex; justify-content:space-between; align-items:center; font-size:12px; color:#94a3b8; }
    .footer .company { font-weight:700; color:#0d2351; }
    @media print { body{background:#fff;padding:0;} .ticket{box-shadow:none;border-radius:0;} }
  </style>
</head>
<body>
<div class="ticket">
  <div class="header">
    <div class="header-row">
      <span class="logo">${logo}</span>
      <span class="type-badge">${ar ? (booking.type === "flight" ? "رحلة طيران" : booking.type === "hotel" ? "فندق" : booking.type === "program" ? "برنامج سياحي" : "حجز") : (booking.type === "flight" ? "Flight" : booking.type === "hotel" ? "Hotel" : booking.type === "program" ? "Program" : "Booking")}</span>
    </div>
    <div class="ref-block">
      <div class="ref-label">${ar ? "رقم الحجز المرجعي" : "Booking Reference"}</div>
      <div class="ref-number">${ref}</div>
    </div>
  </div>
  <div class="divider"><div class="circle-left"></div><div class="dashed"></div><div class="circle-right"></div></div>
  <div class="body">
    <div class="row">
      <div class="field"><label>${ar ? "اسم العميل" : "Passenger Name"}</label><div class="val">${booking.clientName}</div></div>
      <div class="field"><label>${ar ? "رقم الهاتف" : "Phone"}</label><div class="val" dir="ltr">${booking.clientPhone}</div></div>
    </div>
    <div class="row">
      <div class="field"><label>${ar ? "الوجهة" : "Destination"}</label><div class="val">${booking.destination || "—"}</div></div>
      <div class="field"><label>${ar ? "تاريخ السفر" : "Travel Date"}</label><div class="val">${booking.travelDate || "—"}</div></div>
    </div>
    ${booking.returnDate ? `<div class="row"><div class="field"><label>${ar ? "تاريخ العودة" : "Return Date"}</label><div class="val">${booking.returnDate}</div></div><div class="field"><label>${ar ? "عدد المسافرين" : "Passengers"}</label><div class="val">${(booking.adults || 1) + (booking.children || 0)} ${ar ? "مسافر" : "pax"}</div></div></div>` : ""}
    ${booking.totalPrice ? `<div class="row"><div class="field"><label>${ar ? "السعر الإجمالي" : "Total Price"}</label><div class="val">${Number(booking.totalPrice).toLocaleString()} ${ar ? "ريال" : "SAR"}</div></div><div class="field"></div></div>` : ""}
    <div class="status-bar">
      <span class="status-label">${ar ? "حالة الحجز" : "Booking Status"}</span>
      <span class="status-val">${ar ? (booking.status === "confirmed" ? "✓ مؤكد" : booking.status === "pending" ? "⏳ قيد الانتظار" : "✕ ملغى") : (booking.status === "confirmed" ? "✓ Confirmed" : booking.status === "pending" ? "⏳ Pending" : "✕ Cancelled")}</span>
    </div>
    ${booking.notes ? `<div class="field"><label>${ar ? "ملاحظات" : "Notes"}</label><div class="val" style="font-weight:400;font-size:14px;color:#475569;">${booking.notes}</div></div>` : ""}
  </div>
  <div class="footer">
    <span>${ar ? "تاريخ الإصدار:" : "Issued:"} ${date}</span>
    <span class="company">ABSHER TRAVEL</span>
  </div>
</div>
<script>window.onload=function(){window.print();setTimeout(function(){window.close();},1500);};</script>
</body>
</html>`;
}

function downloadTicketPdf(booking: Booking, ar: boolean) {
  // If server-provided ticket URL exists, open it directly
  if ((booking as Booking & { ticketUrl?: string | null }).ticketUrl) {
    const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
    const url = (booking as Booking & { ticketUrl?: string | null }).ticketUrl!;
    window.open(url.startsWith("/api") ? `${base}${url}` : url, "_blank");
    return;
  }
  // Otherwise generate a printable ticket in a new window
  const html = generateFlightTicketHTML(booking, ar);
  const win = window.open("", "_blank", "width=780,height=700");
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
  }
}

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AuthImage, useObjectUrl } from "@/components/auth-image";
import { ApplicationDocumentsSection } from "@/components/application-documents";
import { authHeader } from "@/lib/objectMedia";
import {
  FileText, Bell, User, CheckCheck, Circle, Plane, Building2, MapPin, Shield,
  Camera, Save, Package, AlertCircle, Loader2, Download, Share2, CheckCircle2,
  Clock, Send, TicketCheck,
} from "lucide-react";

/* ── Visa status config ── */
const STATUS_ORDER = [
  "received", "under_review", "awaiting_documents", "documents_uploaded",
  "sent_to_embassy", "processing", "issued", "completed",
];

const STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  received:             { ar: "تم الاستلام",        en: "Received" },
  under_review:         { ar: "قيد المراجعة",       en: "Under review" },
  awaiting_documents:   { ar: "بانتظار مستندات",    en: "Awaiting documents" },
  documents_uploaded:   { ar: "تم رفع المستندات",   en: "Documents uploaded" },
  sent_to_embassy:      { ar: "أُرسل للسفارة",      en: "Sent to embassy" },
  processing:           { ar: "قيد المعالجة",       en: "Processing" },
  issued:               { ar: "تم الإصدار",         en: "Issued" },
  completed:            { ar: "مكتمل",              en: "Completed" },
  rejected:             { ar: "مرفوض",              en: "Rejected" },
};

/* ── Flight booking status timeline steps ── */
const FLIGHT_STEPS_AR = ["تم الحجز", "تم الدفع", "إصدار التذكرة", "مكتمل"];
const FLIGHT_STEPS_EN = ["Booked", "Paid", "Ticket Issued", "Completed"];

/* ── Visa status timeline steps (condensed) ── */
const VISA_STEPS_AR = ["تقديم الطلب", "مراجعة", "معالجة", "إصدار التأشيرة", "مكتمل"];
const VISA_STEPS_EN = ["Applied", "Review", "Processing", "Visa Issued", "Completed"];

function mapVisaStatusToStep(status: string): number {
  const map: Record<string, number> = {
    received: 0,
    under_review: 1,
    awaiting_documents: 1,
    documents_uploaded: 1,
    sent_to_embassy: 2,
    processing: 2,
    issued: 3,
    completed: 4,
    rejected: -1,
  };
  return map[status] ?? 0;
}

function mapFlightStatusToStep(status: string): number {
  const map: Record<string, number> = {
    pending: 0,
    confirmed: 2,
    cancelled: -1,
  };
  return map[status] ?? 0;
}

/* ── Horizontal status timeline ── */
function StatusTimeline({
  steps, currentStep, ar, rejected,
}: {
  steps: string[];
  currentStep: number;
  ar: boolean;
  rejected?: boolean;
}) {
  if (rejected) {
    return (
      <div className="flex items-center gap-2 mt-3">
        <div className="w-5 h-5 rounded-full bg-red-100 border border-red-300 flex items-center justify-center shrink-0">
          <div className="w-2 h-2 rounded-full bg-red-500" />
        </div>
        <span className="text-xs font-bold text-red-500">{ar ? "مرفوض" : "Rejected"}</span>
      </div>
    );
  }

  return (
    <div className="mt-3 w-full overflow-x-auto">
      <div className="flex items-center min-w-max gap-0" dir="ltr">
        {steps.map((step, i) => {
          const done = i <= currentStep;
          const active = i === currentStep;
          return (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black transition-all
                  ${done ? (active ? "bg-[#c8a84b] text-white shadow-sm" : "bg-[#0d2351] text-white") : "bg-slate-100 text-slate-400"}`}>
                  {done && !active ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                <span className={`text-[9px] font-semibold whitespace-nowrap max-w-[56px] text-center leading-tight
                  ${active ? "text-[#c8a84b]" : done ? "text-[#0d2351]" : "text-slate-300"}`}>
                  {step}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 w-8 mx-1 mb-4 rounded-full transition-all ${i < currentStep ? "bg-[#0d2351]" : "bg-slate-100"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Visa StatusStepper (detailed) ── */
function StatusStepper({ status, language }: { status: string; language: string }) {
  const ar = language === "ar";
  if (status === "rejected") {
    return <Badge variant="destructive" className="mt-2">{ar ? STATUS_LABELS.rejected.ar : STATUS_LABELS.rejected.en}</Badge>;
  }
  const currentIndex = STATUS_ORDER.indexOf(status);
  return (
    <div className="mt-2">
      <StatusTimeline
        steps={ar ? VISA_STEPS_AR : VISA_STEPS_EN}
        currentStep={mapVisaStatusToStep(status)}
        ar={ar}
        rejected={status === "rejected"}
      />
    </div>
  );
}

function ApplicationCard({ app, language }: { app: VisaApplication; language: string }) {
  const ar = language === "ar";
  const currentIdx = STATUS_ORDER.indexOf(app.status);
  const isCompleted = app.status === "completed" || app.status === "issued";
  const isRejected = app.status === "rejected";

  return (
    <Card className={`border rounded-2xl overflow-hidden transition-all hover:shadow-md ${isCompleted ? "border-emerald-200" : isRejected ? "border-red-200" : "border-slate-200 hover:border-[#0d2351]/30"}`}>
      <CardContent className="p-0">
        {/* Header */}
        <div className={`px-5 py-3 flex items-center justify-between ${isCompleted ? "bg-emerald-50" : isRejected ? "bg-red-50" : "bg-gradient-to-r from-[#0d2351]/5 to-transparent"}`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isCompleted ? "bg-emerald-100" : isRejected ? "bg-red-100" : "bg-[#0d2351]/10"}`}>
              <Shield className={`w-5 h-5 ${isCompleted ? "text-emerald-600" : isRejected ? "text-red-500" : "text-[#0d2351]"}`} />
            </div>
            <div>
              <div className="font-bold text-slate-800 text-sm">
                {ar ? "طلب تأشيرة" : "Visa Application"} #{app.id}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">{app.fullName} · {app.nationality}</div>
            </div>
          </div>
          <div className="text-end">
            <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
              isCompleted ? "bg-emerald-100 text-emerald-700" :
              isRejected  ? "bg-red-100 text-red-700" :
              "bg-[#0d2351]/10 text-[#0d2351]"
            }`}>
              {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : isRejected ? null : <Clock className="w-3 h-3" />}
              {ar ? STATUS_LABELS[app.status]?.ar : STATUS_LABELS[app.status]?.en}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">{new Date(app.createdAt).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Progress timeline */}
        <div className="px-5 pb-4">
          <StatusStepper status={app.status} language={language} />
        </div>

        {/* Required documents */}
        <ApplicationDocumentsSection applicationId={app.id} language={language} />
      </CardContent>
    </Card>
  );
}

function BookingCard({ booking, language, onToast }: {
  booking: Booking;
  language: string;
  onToast: (msg: string) => void;
}) {
  const ar = language === "ar";

  const typeLabels = {
    flight: { ar: "رحلة طيران", en: "Flight", icon: Plane },
    hotel:  { ar: "فندق",       en: "Hotel",  icon: Building2 },
    program:{ ar: "برنامج سياحي",en: "Program",icon: MapPin },
    visa:   { ar: "تأشيرة",     en: "Visa",   icon: Shield },
  };

  const statusConfig = {
    pending:   { ar: "قيد الانتظار", en: "Pending",   color: "bg-amber-100 text-amber-700",   step: 0 },
    confirmed: { ar: "مؤكد",         en: "Confirmed", color: "bg-emerald-100 text-emerald-700", step: 2 },
    cancelled: { ar: "ملغى",         en: "Cancelled", color: "bg-red-100 text-red-700",        step: -1 },
  };

  const typeInfo  = typeLabels[booking.type as keyof typeof typeLabels]   || { ar: booking.type, en: booking.type, icon: Package };
  const statusInfo = statusConfig[booking.status as keyof typeof statusConfig] || statusConfig.pending;
  const TypeIcon  = typeInfo.icon;
  const isFlightBooking = booking.type === "flight";
  const isVisa = booking.type === "visa";
  const flightStep = mapFlightStatusToStep(booking.status);
  const visaStep = 0; // basic bookings don't have detailed visa status
  const cancelled = booking.status === "cancelled";

  const handleDownload = () => {
    downloadTicketPdf(booking, ar);
  };

  const handleWhatsapp = () => {
    const bookingText = encodeURIComponent(
      ar
        ? `مرحباً، أريد الاستفسار عن حجزي رقم #${booking.id} — ${ar ? typeInfo.ar : typeInfo.en}`
        : `Hello, I'd like to inquire about my booking #${booking.id} — ${typeInfo.en}`
    );
    window.open(`https://wa.me/?text=${bookingText}`, "_blank");
  };

  return (
    <Card className={`border rounded-2xl overflow-hidden transition-all hover:shadow-md ${cancelled ? "border-red-200 opacity-80" : "border-slate-200 hover:border-[#0d2351]/30"}`}>
      <CardContent className="p-0">
        {/* Header row */}
        <div className="px-5 py-3 flex items-center justify-between bg-gradient-to-r from-[#0d2351]/4 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#0d2351]/8 border border-[#0d2351]/10 rounded-xl flex items-center justify-center shrink-0">
              <TypeIcon className="w-5 h-5 text-[#0d2351]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-sm">
                  {ar ? typeInfo.ar : typeInfo.en} #{booking.id}
                </span>
                <Badge variant="outline" className={`border-0 text-xs px-2 py-0.5 ${statusInfo.color}`}>
                  {ar ? statusInfo.ar : statusInfo.en}
                </Badge>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {booking.destination || booking.clientName || (ar ? "حجز" : "Booking")}
              </div>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 text-end whitespace-nowrap">
            {new Date(booking.createdAt).toLocaleDateString()}
          </div>
        </div>

        {/* Timeline for flight bookings */}
        {isFlightBooking && !cancelled && (
          <div className="px-5 pb-3">
            <StatusTimeline
              steps={ar ? FLIGHT_STEPS_AR : FLIGHT_STEPS_EN}
              currentStep={flightStep}
              ar={ar}
            />
          </div>
        )}

        {/* Timeline for visa bookings */}
        {isVisa && !cancelled && (
          <div className="px-5 pb-3">
            <StatusTimeline
              steps={ar ? VISA_STEPS_AR : VISA_STEPS_EN}
              currentStep={visaStep}
              ar={ar}
            />
          </div>
        )}

        {/* Action buttons for flight bookings */}
        {isFlightBooking && !cancelled && (
          <div className="px-5 pb-4 flex gap-2 flex-wrap">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#0d2351]/20 bg-[#0d2351]/5 hover:bg-[#0d2351]/10 text-[#0d2351] text-xs font-bold transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              {ar ? "تحميل التذكرة" : "Download Ticket"}
            </button>
            <button
              onClick={handleWhatsapp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              {ar ? "مشاركة عبر واتساب" : "Share via WhatsApp"}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── In-platform program booking request card (TRV-… tracking) ── */
const PROGRAM_BOOKING_STATUSES: Record<string, { ar: string; en: string; color: string; step: number }> = {
  draft:                 { ar: "مسودة",              en: "Draft",                 color: "bg-slate-100 text-slate-600",     step: 0 },
  submitted:             { ar: "تم الإرسال",          en: "Submitted",             color: "bg-blue-100 text-blue-700",       step: 0 },
  under_review:          { ar: "قيد المراجعة",        en: "Under Review",          color: "bg-amber-100 text-amber-700",     step: 1 },
  awaiting_availability: { ar: "بانتظار التوفر",      en: "Checking Availability", color: "bg-amber-100 text-amber-700",     step: 1 },
  awaiting_payment:      { ar: "بانتظار الدفع",       en: "Awaiting Payment",      color: "bg-purple-100 text-purple-700",   step: 2 },
  paid:                  { ar: "تم الدفع",            en: "Paid",                  color: "bg-emerald-100 text-emerald-700", step: 2 },
  confirmed:             { ar: "مؤكد",               en: "Confirmed",             color: "bg-emerald-100 text-emerald-700", step: 3 },
  completed:             { ar: "مكتمل",              en: "Completed",             color: "bg-emerald-100 text-emerald-700", step: 4 },
  rejected:              { ar: "مرفوض",              en: "Rejected",              color: "bg-red-100 text-red-700",         step: -1 },
  cancelled:             { ar: "ملغى",               en: "Cancelled",             color: "bg-red-100 text-red-700",         step: -1 },
};
const PROGRAM_CANCELLABLE = ["draft", "submitted", "under_review", "awaiting_availability", "awaiting_payment"];
const PROGRAM_STEPS_AR = ["تم الإرسال", "المراجعة والتوفر", "الدفع", "التأكيد", "الاكتمال"];
const PROGRAM_STEPS_EN = ["Submitted", "Review & Availability", "Payment", "Confirmed", "Completed"];

function ProgramBookingRequestCard({ booking, language }: { booking: ProgramBooking; language: string }) {
  const ar = language === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const cancelMutation = useCancelProgramBooking({
    mutation: {
      onSuccess: () => {
        toast({ title: ar ? "تم إلغاء طلب الحجز" : "Booking request cancelled" });
        queryClient.invalidateQueries({ queryKey: getListMyProgramBookingsQueryKey() });
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onError: (err: any) => {
        toast({
          variant: "destructive",
          title: ar ? "تعذر الإلغاء" : "Cancellation failed",
          description: (err?.data as { error?: string } | null)?.error || (ar ? "حدث خطأ، حاول لاحقاً." : "Something went wrong, try again later."),
        });
      },
    },
  });
  const [confirmCancel, setConfirmCancel] = useState(false);

  const info = PROGRAM_BOOKING_STATUSES[booking.status] ?? PROGRAM_BOOKING_STATUSES.submitted;
  const failed = info.step === -1;
  const canCancel = PROGRAM_CANCELLABLE.includes(booking.status);

  return (
    <Card className={`border rounded-2xl overflow-hidden transition-all hover:shadow-md ${failed ? "border-red-200 opacity-80" : "border-slate-200 hover:border-[#0d2351]/30"}`}>
      <CardContent className="p-0">
        <div className="px-5 py-3 flex items-center justify-between bg-gradient-to-r from-[#0d2351]/4 to-transparent flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#0d2351]/8 border border-[#0d2351]/10 rounded-xl flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-[#0d2351]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-800 text-sm">
                  {ar ? booking.programTitleAr : booking.programTitleEn}
                </span>
                <Badge variant="outline" className={`border-0 text-xs px-2 py-0.5 ${info.color}`}>
                  {ar ? info.ar : info.en}
                </Badge>
              </div>
              <div className="text-xs text-slate-500 mt-0.5" dir="ltr">
                {booking.requestNumber}
                <span dir={ar ? "rtl" : "ltr"}>
                  {booking.programDestination ? ` · ${booking.programDestination}` : ""} · {booking.travelDate}
                </span>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 text-end whitespace-nowrap">
            {new Date(booking.createdAt).toLocaleDateString()}
          </div>
        </div>

        {!failed && (
          <div className="px-5 pb-3">
            <StatusTimeline
              steps={ar ? PROGRAM_STEPS_AR : PROGRAM_STEPS_EN}
              currentStep={info.step}
              ar={ar}
            />
          </div>
        )}

        <div className="px-5 pb-4 flex items-center justify-between gap-2 flex-wrap">
          <div className="text-xs text-slate-500">
            {booking.adults} {ar ? "بالغ" : "adults"}
            {booking.children ? ` · ${booking.children} ${ar ? "طفل" : "children"}` : ""}
            {booking.infants ? ` · ${booking.infants} ${ar ? "رضيع" : "infants"}` : ""}
            {" · "}{booking.rooms} {ar ? "غرفة" : "rooms"}
            {" · "}{Number(booking.programPrice).toLocaleString()} {booking.programCurrency} {ar ? "للشخص" : "/person"}
          </div>
          {canCancel && (
            confirmCancel ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-red-600">{ar ? "تأكيد الإلغاء؟" : "Confirm cancel?"}</span>
                <button
                  onClick={() => cancelMutation.mutate({ id: booking.id })}
                  disabled={cancelMutation.isPending}
                  className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50 transition-all"
                >
                  {cancelMutation.isPending ? (ar ? "جارٍ الإلغاء..." : "Cancelling...") : (ar ? "نعم، إلغاء" : "Yes, cancel")}
                </button>
                <button
                  onClick={() => setConfirmCancel(false)}
                  disabled={cancelMutation.isPending}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all"
                >
                  {ar ? "تراجع" : "Keep"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmCancel(true)}
                className="px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-all"
              >
                {ar ? "إلغاء الطلب" : "Cancel Request"}
              </button>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationRow({ n, language, onRead }: { n: ApiNotification; language: string; onRead: (id: string) => void }) {
  const ar = language === "ar";
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${n.isRead ? "border-slate-100 bg-white" : "border-[#0d2351]/20 bg-[#0d2351]/5 hover:border-[#0d2351]/30"}`}>
      {!n.isRead ? <Circle className="h-2 w-2 mt-1.5 fill-[#0d2351] text-[#0d2351] shrink-0" /> : <div className="w-2 shrink-0" />}
      <div className="flex-1">
        <div className="font-medium text-slate-800 text-sm">{ar ? n.titleAr : n.titleEn}</div>
        <div className="text-sm text-slate-500 mt-0.5">{ar ? n.messageAr : n.messageEn}</div>
        <div className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
      </div>
      {!n.isRead && (
        <Button variant="ghost" size="sm" onClick={() => onRead(n.id)}>
          {ar ? "تحديد كمقروء" : "Mark read"}
        </Button>
      )}
    </div>
  );
}

async function uploadFileDirect(file: File): Promise<{ objectPath: string } | null> {
  const formData = new FormData();
  formData.append("file", file);
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
  // Authenticated upload — the server records ownership (object_uploads).
  const res = await fetch(`${base}/api/storage/uploads`, { method: "POST", headers: authHeader(), body: formData });
  if (!res.ok) return null;
  return res.json();
}

function ProfileFileUpload({ label, value, onChange }: { label: string; value?: string | null; onChange: (url: string) => void }) {
  const [isUploading, setIsUploading] = useState(false);
  return (
    <div>
      <Label className="text-sm font-semibold">{label}</Label>
      {value ? (
        <div className="flex items-center gap-3 mt-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
          <AuthImage src={value} className="h-16 w-16 object-cover rounded-lg border bg-white" />
          <div className="flex-1 min-w-0"><p className="text-xs text-slate-400 truncate" dir="ltr">{value.split('/').pop()}</p></div>
          <Button variant="outline" size="sm" onClick={() => onChange("")}>إزالة</Button>
        </div>
      ) : (
        <label className="mt-2 flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-[#0d2351]/5 hover:border-[#0d2351]/40 transition-colors text-sm text-slate-500">
          <input type="file" className="hidden" onChange={async e => {
            const f = e.target.files?.[0]; if (!f) return;
            setIsUploading(true);
            const r = await uploadFileDirect(f);
            setIsUploading(false);
            if (r) onChange(r.objectPath);
          }} disabled={isUploading} />
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin text-[#0d2351]" /> : <Camera className="h-5 w-5 text-slate-400" />}
          <span className="font-medium">{isUploading ? "جاري الرفع..." : "اختر ملفاً"}</span>
        </label>
      )}
    </div>
  );
}

type RequestTab = "all" | "visas" | "flights" | "hotels" | "programs";

export default function Account() {
  const { language } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const ar = language === "ar";

  const { data: applications, isLoading: appsLoading } = useListVisaApplications();
  const { data: bookings, isLoading: bookingsLoading } = useListMyBookings();
  const { data: programBookings, isLoading: programBookingsLoading } = useListMyProgramBookings();
  const { data: notifications, isLoading: notifsLoading } = useListNotifications();
  const { data: currentUserData } = useGetCurrentUser({ query: { staleTime: 0, queryKey: getGetCurrentUserQueryKey() } });

  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const [activeSubTab, setActiveSubTab] = useState<RequestTab>("all");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [profile, setProfile] = useState<any>({});
  const avatarUrl = useObjectUrl(profile.profilePhotoUrl);

  // Dial code state for phone + whatsapp fields (ISO country code, default SA)
  const [phoneDialCountry, setPhoneDialCountry] = useState("SA");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [whatsappDialCountry, setWhatsappDialCountry] = useState("SA");
  const [whatsappLocal, setWhatsappLocal] = useState("");

  const authUser = currentUserData || user;

  useEffect(() => {
    if (authUser) {
      // Parse stored international phone numbers into dial-code + local parts
      const parsedPhone = parseFullPhone(authUser.phone || "");
      const parsedWhatsapp = parseFullPhone(authUser.whatsapp || "");
      setPhoneDialCountry(parsedPhone.dialCode);
      setPhoneLocal(parsedPhone.local);
      setWhatsappDialCountry(parsedWhatsapp.dialCode);
      setWhatsappLocal(parsedWhatsapp.local);

      setProfile({
        firstName: authUser.firstName || "",
        lastName: authUser.lastName || "",
        email: authUser.email || "",
        phone: authUser.phone || "",
        whatsapp: authUser.whatsapp || "",
        address: authUser.address || "",
        nationality: authUser.nationality || "",
        gender: authUser.gender || "male",
        dateOfBirth: authUser.dateOfBirth || "",
        passportNumber: authUser.passportNumber || "",
        passportIssueCountry: authUser.passportIssueCountry || "",
        passportIssuePlace: authUser.passportIssuePlace || "",
        passportIssueDate: authUser.passportIssueDate || "",
        passportExpiryDate: authUser.passportExpiryDate || "",
        passportImageUrl: authUser.passportImageUrl || "",
        isGccResident: authUser.isGccResident || false,
        gccResidenceCountry: authUser.gccResidenceCountry || "",
        gccResidenceNumber: authUser.gccResidenceNumber || "",
        gccResidenceExpiry: authUser.gccResidenceExpiry || "",
        gccResidenceFrontUrl: authUser.gccResidenceFrontUrl || "",
        gccResidenceBackUrl: authUser.gccResidenceBackUrl || "",
        profilePhotoUrl: authUser.profilePhotoUrl || "",
        isEuropeanResident: (authUser as any).isEuropeanResident || false,
        europeanDocumentType: (authUser as any).europeanDocumentType || "",
        europeanDocumentUrl: (authUser as any).europeanDocumentUrl || "",
        europeanDocumentExpiry: (authUser as any).europeanDocumentExpiry || "",
      });
    }
  }, [authUser]);

  const updateProfileMutation = useUpdateProfile({
    mutation: {
      onSuccess: () => {
        toast({ title: ar ? "تم التحديث بنجاح" : "Profile Updated", description: ar ? "تم حفظ بيانات الملف الشخصي" : "Your profile has been saved." });
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onError: (err: any) => {
        toast({ variant: "destructive", title: ar ? "خطأ" : "Error", description: err.message || (ar ? "فشل تحديث الملف الشخصي" : "Failed to update profile.") });
      }
    }
  });

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoValidation, setPhotoValidation] = useState<{ valid: boolean; reason: string } | null>(null);
  const [isValidatingPhoto, setIsValidatingPhoto] = useState(false);
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [ocrAttempted, setOcrAttempted] = useState(false);
  const [ocrFailed, setOcrFailed] = useState(false);
  const [isUploadingPassport, setIsUploadingPassport] = useState(false);
  const ocrMutation = useOcrPassport();

  const handleSaveProfile = async () => {
    // Merge the dial-code + local parts back into full international numbers before saving
    const fullPhone = buildFullPhone(phoneDialCountry, phoneLocal);
    const fullWhatsapp = buildFullPhone(whatsappDialCountry, whatsappLocal);
    // phone is required — keep the stored value if the field was emptied;
    // whatsapp is optional — send "" explicitly so clearing it persists.
    updateProfileMutation.mutate({ data: { ...profile, phone: fullPhone || profile.phone, whatsapp: fullWhatsapp } });
  };

  /** Upload personal photo → validate face → update profile state */
  const handlePhotoUpload = async (file: File) => {
    setIsUploadingPhoto(true);
    setPhotoValidation(null);
    try {
      const r = await uploadFileDirect(file);
      if (!r) {
        toast({ variant: "destructive", title: ar ? "فشل رفع الصورة" : "Upload Failed", description: ar ? "حدث خطأ أثناء رفع الصورة. حاول مرة أخرى." : "An error occurred. Please try again." });
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setProfile((p: any) => ({ ...p, profilePhotoUrl: r.objectPath }));

      // Validate photo with AI (customFetch attaches the token and
      // auto-refreshes an expired session before retrying)
      setIsValidatingPhoto(true);
      try {
        const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
        const vData = await customFetch<{ valid?: boolean; reason?: string }>(
          `${base}/api/visa-applications/validate-photo`,
          { method: "POST", headers: { "x-lang": ar ? "ar" : "en" }, body: JSON.stringify({ imageUrl: r.objectPath }) },
        );
        setPhotoValidation({ valid: !!vData.valid, reason: vData.reason || "" });
        if (!vData.valid) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setProfile((p: any) => ({ ...p, profilePhotoUrl: "" }));
        }
      } catch (err) {
        // A server/auth error is NOT a photo rejection — keep the uploaded
        // photo and tell the user what actually happened.
        if (err instanceof ApiError && err.status === 401) {
          toast({
            variant: "destructive",
            title: ar ? "انتهت الجلسة" : "Session Expired",
            description: ar ? "يرجى تسجيل الدخول مرة أخرى ثم إعادة رفع الصورة." : "Please log in again, then re-upload the photo.",
          });
        } else {
          const serverMsg = err instanceof ApiError ? (err.data as { error?: string } | null)?.error : undefined;
          toast({
            variant: "destructive",
            title: ar ? "تعذر التحقق من الصورة" : "Photo Check Unavailable",
            description: serverMsg || (ar ? "تم رفع الصورة، لكن التحقق الآلي غير متاح حالياً." : "The photo was uploaded, but automatic verification is temporarily unavailable."),
          });
        }
        setPhotoValidation(null);
      } finally {
        setIsValidatingPhoto(false);
      }
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  /** Upload passport image → auto-run OCR → prefill passport fields */
  const handlePassportUpload = async (file: File) => {
    setIsUploadingPassport(true);
    setOcrAttempted(false);
    setOcrFailed(false);
    try {
      const r = await uploadFileDirect(file);
      if (!r) {
        toast({ variant: "destructive", title: ar ? "فشل رفع الجواز" : "Upload Failed", description: ar ? "حدث خطأ أثناء رفع الجواز. حاول مرة أخرى." : "Failed to upload passport image. Please try again." });
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setProfile((p: any) => ({ ...p, passportImageUrl: r.objectPath }));
      setIsUploadingPassport(false);

      // Auto-run OCR
      setIsOcrRunning(true);
      try {
        const ocr = await ocrMutation.mutateAsync({ data: { imageUrl: r.objectPath } });
        setOcrAttempted(true);
        if (ocr.success) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setProfile((p: any) => ({
            ...p,
            passportImageUrl: r.objectPath,
            // Always take the name from the passport (user can still edit)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...((ocr as any).firstName ? { firstName: (ocr as any).firstName } : {}),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...((ocr as any).lastName ? { lastName: (ocr as any).lastName } : {}),
            // Always overwrite from passport (user can edit)
            ...(ocr.passportNumber ? { passportNumber: ocr.passportNumber } : {}),
            ...(ocr.nationality ? { nationality: canonicalCountryEn(ocr.nationality) ?? ocr.nationality } : {}),
            ...(ocr.dateOfBirth ? { dateOfBirth: ocr.dateOfBirth } : {}),
            ...(ocr.issueDate ? { passportIssueDate: ocr.issueDate } : {}),
            ...(ocr.expiryDate ? { passportExpiryDate: ocr.expiryDate } : {}),
            ...(ocr.issuingCountry ? { passportIssueCountry: ocr.issuingCountry } : {}),
            ...(ocr.gender ? { gender: ocr.gender === "M" || ocr.gender?.toLowerCase() === "male" ? "male" : "female" } : {}),
          }));
          toast({ title: ar ? "✓ تم استخراج بيانات الجواز" : "✓ Passport Data Extracted", description: ar ? "يرجى مراجعة البيانات وتصحيحها إذا لزم." : "Please review and correct if needed." });
        } else {
          setOcrFailed(true);
        }
      } catch {
        setOcrAttempted(true);
        setOcrFailed(true);
      } finally {
        setIsOcrRunning(false);
      }
    } catch {
      setIsUploadingPassport(false);
    }
  };

  const keyFields = ["firstName", "lastName", "phone", "nationality", "dateOfBirth", "passportNumber", "passportExpiryDate", "profilePhotoUrl", "passportImageUrl"];
  const completedKeyFields = keyFields.filter(k => !!profile[k]).length;
  const completionPercentage = Math.round((completedKeyFields / keyFields.length) * 100);
  const isProfileFull = completionPercentage === 100;

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  const allItems = [
    ...(applications || []).map(a => ({ ...a, _itemType: 'app', date: new Date(a.createdAt).getTime() })),
    ...(bookings || []).map(b => ({ ...b, _itemType: 'booking', date: new Date(b.createdAt).getTime() })),
    ...(programBookings || []).map(b => ({ ...b, _itemType: 'programBooking', date: new Date(b.createdAt).getTime() }))
  ].sort((a, b) => b.date - a.date);

  const filteredItems = allItems.filter(item => {
    if (activeSubTab === "all") return true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bookingType = item._itemType === "booking" ? (item as any).type as string : undefined;
    if (activeSubTab === "visas") return item._itemType === "app" || bookingType === "visa";
    if (activeSubTab === "flights") return bookingType === "flight";
    if (activeSubTab === "hotels") return bookingType === "hotel";
    if (activeSubTab === "programs") return item._itemType === "programBooking" || bookingType === "program";
    return true;
  });

  const REQUEST_TABS: { id: RequestTab; ar: string; en: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "all",      ar: "جميع الطلبات",   en: "All Requests", icon: Package },
    { id: "visas",    ar: "تأشيرات",         en: "Visas",        icon: Shield },
    { id: "flights",  ar: "رحلات طيران",    en: "Flights",      icon: Plane },
    { id: "hotels",   ar: "فنادق",           en: "Hotels",       icon: Building2 },
    { id: "programs", ar: "برامج سياحية",   en: "Programs",     icon: MapPin },
  ];

  const isLoadingRequests = appsLoading || bookingsLoading || programBookingsLoading;

  const showToast = (msg: string) => {
    toast({ title: msg });
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10" dir={ar ? "rtl" : "ltr"}>
      <div className="container mx-auto px-4 max-w-4xl">

        {/* Profile header */}
        <div className="flex items-center gap-5 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="relative">
            <Avatar className="w-20 h-20 border-4 border-white shadow-md">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-[#0d2351]/10 text-[#0d2351] text-2xl font-bold">
                {(authUser?.firstName?.[0] || authUser?.email?.[0] || "U").toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-slate-800">
              {authUser?.firstName ? `${authUser.firstName} ${authUser.lastName ?? ""}` : (ar ? "حسابي" : "My Account")}
            </h1>
            <p className="text-slate-500 font-medium">{authUser?.email ?? authUser?.phone}</p>
          </div>
          {/* Stats summary */}
          <div className="hidden md:flex items-center gap-4">
            <div className="text-center px-4 border-s border-slate-100">
              <div className="text-2xl font-black text-[#0d2351]">{(applications?.length ?? 0) + (bookings?.length ?? 0) + (programBookings?.length ?? 0)}</div>
              <div className="text-xs text-slate-400 font-medium">{ar ? "إجمالي الطلبات" : "Total Requests"}</div>
            </div>
            <div className="text-center px-4 border-s border-slate-100">
              <div className="text-2xl font-black text-[#c8a84b]">{completionPercentage}%</div>
              <div className="text-xs text-slate-400 font-medium">{ar ? "اكتمال الملف" : "Profile"}</div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="requests">
          <TabsList className="bg-white border mb-6 flex-wrap h-auto p-1.5 shadow-sm rounded-xl">
            <TabsTrigger value="requests" className="gap-2 rounded-lg py-2.5">
              <TicketCheck size={16} />{ar ? "طلباتي" : "My Requests"}
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2 rounded-lg py-2.5">
              <User size={16} />{ar ? "ملفي الشخصي" : "Profile"}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 rounded-lg py-2.5">
              <Bell size={16} />{ar ? "الإشعارات" : "Notifications"}
              {unreadCount > 0 && (
                <Badge className="ml-1 rtl:mr-1 rtl:ml-0 bg-[#c8a84b] text-white px-1.5 min-w-[20px] h-5 flex items-center justify-center border-0">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── Requests tab ── */}
          <TabsContent value="requests" className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
              {REQUEST_TABS.map(tab => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id as RequestTab)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap text-sm font-bold transition-all shadow-sm
                      ${activeSubTab === tab.id
                        ? "bg-[#0d2351] text-white scale-[1.02]"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
                  >
                    <TabIcon className="w-4 h-4" />
                    {ar ? tab.ar : tab.en}
                  </button>
                );
              })}
            </div>

            <div className="space-y-4">
              {isLoadingRequests && (
                <div className="text-slate-400 text-center py-16 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border">
                  <Loader2 className="w-8 h-8 animate-spin text-[#0d2351]/40" />
                  <span className="font-medium">{ar ? "جاري التحميل..." : "Loading..."}</span>
                </div>
              )}
              {!isLoadingRequests && filteredItems.length === 0 && (
                <div className="text-center py-20 text-slate-400 bg-white rounded-2xl border border-dashed flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Package className="h-8 w-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-700 mb-1">{ar ? "لا توجد طلبات هنا" : "No requests found"}</h3>
                  <p className="text-sm">{ar ? "لم تقم بأي حجوزات أو طلبات في هذا القسم بعد." : "You haven't made any bookings in this category yet."}</p>
                </div>
              )}
              {filteredItems.map(item =>
                item._itemType === "app" ? (
                  <ApplicationCard key={`app-${item.id}`} app={item as VisaApplication} language={language} />
                ) : item._itemType === "programBooking" ? (
                  <ProgramBookingRequestCard key={`pb-${item.id}`} booking={item as unknown as ProgramBooking} language={language} />
                ) : (
                  <BookingCard key={`booking-${item.id}`} booking={item as Booking} language={language} onToast={showToast} />
                )
              )}
            </div>
          </TabsContent>

          {/* ── Profile tab ── */}
          <TabsContent value="profile" className="space-y-5">

            {/* Completion banner */}
            {isProfileFull ? (
              <div className="flex items-center gap-4 p-5 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-emerald-800">{ar ? "✓ ملفك الشخصي مكتمل 100%" : "✓ Profile 100% Complete"}</h4>
                  <p className="text-sm text-emerald-600 mt-0.5">{ar ? "بياناتك محفوظة وجاهزة للتقديم على التأشيرات." : "Your data is saved and ready for visa applications."}</p>
                </div>
                <div className="text-3xl font-black text-emerald-600 hidden md:block">100%</div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h4 className="font-bold text-slate-800">{ar ? "اكتمال الملف الشخصي" : "Profile Completion"}</h4>
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1.5 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {ar ? "أكمل ملفك للتمكن من التقديم على التأشيرات." : "Complete your profile to apply for visas."}
                    </p>
                  </div>
                  <span className="text-2xl font-black text-[#0d2351]">{completionPercentage}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-[#0d2351] h-full rounded-full transition-all duration-700" style={{ width: `${completionPercentage}%` }} />
                </div>
              </div>
            )}

            {/* ── SECTION 1: Personal Photo ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0d2351] text-white flex items-center justify-center text-sm font-black shrink-0">1</div>
                <div>
                  <h4 className="font-bold text-slate-800">{ar ? "الصورة الشخصية" : "Personal Photo"}</h4>
                  <p className="text-xs text-slate-500">{ar ? "صورة واضحة للوجه (خلفية بيضاء مُفضَّل)" : "Clear face photo, white background preferred"}</p>
                </div>
              </div>
              <div className="p-6">
                {profile.profilePhotoUrl ? (
                  <div className="flex items-center gap-5">
                    <div className="relative shrink-0">
                      <AuthImage src={profile.profilePhotoUrl} className="w-24 h-24 rounded-xl object-cover border-2 border-emerald-200 shadow" />
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-emerald-700">✓ {ar ? "الصورة الشخصية مقبولة" : "Personal Photo Accepted"}</p>
                      <label className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer text-sm font-semibold text-slate-600 transition-colors">
                        <Camera className="w-4 h-4" />
                        {ar ? "استبدال الصورة" : "Replace Photo"}
                        <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }} disabled={isUploadingPhoto || isValidatingPhoto} />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div>
                    {photoValidation && !photoValidation.valid && (
                      <div className="mb-4 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-red-700 text-sm">{ar ? "الصورة غير مقبولة" : "Photo not accepted"}</p>
                          <p className="text-red-600 text-xs mt-0.5">
                            {photoValidation.reason && photoValidation.reason !== "Photo accepted"
                              ? photoValidation.reason
                              : (ar ? "يرجى رفع صورة شخصية أوضح." : "Please upload a clearer personal photo.")}
                          </p>
                        </div>
                      </div>
                    )}
                    <label className={`flex flex-col items-center justify-center gap-3 py-10 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                      isUploadingPhoto || isValidatingPhoto
                        ? "border-[#0d2351]/30 bg-[#0d2351]/5"
                        : "border-slate-200 bg-slate-50 hover:border-[#0d2351]/40 hover:bg-[#0d2351]/5"
                    }`}>
                      <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }} disabled={isUploadingPhoto || isValidatingPhoto} />
                      {isUploadingPhoto ? (
                        <><Loader2 className="w-8 h-8 text-[#0d2351] animate-spin" /><span className="text-sm font-semibold text-[#0d2351]">{ar ? "جاري الرفع..." : "Uploading..."}</span></>
                      ) : isValidatingPhoto ? (
                        <><Loader2 className="w-8 h-8 text-[#0d2351] animate-spin" /><span className="text-sm font-semibold text-[#0d2351]">{ar ? "جاري التحقق من الصورة..." : "Validating photo..."}</span></>
                      ) : (
                        <>
                          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                            <Camera className="w-8 h-8 text-slate-400" />
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-slate-700">{ar ? "ارفع الصورة الشخصية" : "Upload Personal Photo"}</p>
                            <p className="text-xs text-slate-400 mt-1">{ar ? "PNG, JPG — حتى 20 ميغابايت" : "PNG, JPG — up to 20 MB"}</p>
                          </div>
                        </>
                      )}
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* ── SECTION 2: Passport ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0d2351] text-white flex items-center justify-center text-sm font-black shrink-0">2</div>
                <div>
                  <h4 className="font-bold text-slate-800">{ar ? "جواز السفر" : "Passport"}</h4>
                  <p className="text-xs text-slate-500">{ar ? "ارفع صفحة المعلومات — سيتم استخراج البيانات تلقائياً" : "Upload the bio page — data will be extracted automatically"}</p>
                </div>
                {profile.passportImageUrl && !isOcrRunning && (
                  <div className="ms-auto">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {ar ? "تم الرفع" : "Uploaded"}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-6 space-y-5">
                {/* Upload area — always visible; if already uploaded, show thumbnail + replace */}
                {!profile.passportImageUrl && !isUploadingPassport && !isOcrRunning ? (
                  <label className="flex flex-col items-center justify-center gap-3 py-10 border-2 border-dashed border-[#0d2351]/20 rounded-xl cursor-pointer bg-[#0d2351]/3 hover:bg-[#0d2351]/8 hover:border-[#0d2351]/50 transition-colors">
                    <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePassportUpload(f); }} />
                    <div className="w-16 h-16 rounded-full bg-[#0d2351]/10 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-[#0d2351]" />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-[#0d2351]">{ar ? "ارفع صورة جواز السفر" : "Upload Passport Image"}</p>
                      <p className="text-xs text-[#0d2351]/60 mt-1">{ar ? "صفحة المعلومات الشخصية فقط" : "Bio / information page only"}</p>
                    </div>
                  </label>
                ) : (isUploadingPassport || isOcrRunning) ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-10 border-2 border-dashed border-[#0d2351]/30 rounded-xl bg-[#0d2351]/5">
                    <Loader2 className="w-10 h-10 text-[#0d2351] animate-spin" />
                    <p className="font-bold text-[#0d2351] text-sm">
                      {isUploadingPassport ? (ar ? "جاري الرفع..." : "Uploading...") : (ar ? "جاري قراءة بيانات الجواز..." : "Reading passport information...")}
                    </p>
                    <p className="text-xs text-[#0d2351]/60">{ar ? "الذكاء الاصطناعي يستخرج البيانات تلقائياً" : "AI is extracting your data automatically"}</p>
                  </div>
                ) : profile.passportImageUrl && (
                  <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <AuthImage src={profile.passportImageUrl} className="h-14 w-20 object-cover rounded-lg border bg-white shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 font-medium">{ar ? "صورة الجواز" : "Passport image"}</p>
                      <p className="text-xs text-slate-400 truncate" dir="ltr">{profile.passportImageUrl.split('/').pop()}</p>
                    </div>
                    <label className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs font-semibold text-slate-600 transition-colors">
                      <Camera className="w-3.5 h-3.5" />
                      {ar ? "استبدال" : "Replace"}
                      <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { setProfile((p: any) => ({...p, passportImageUrl: ""})); handlePassportUpload(f); } }} />
                    </label>
                  </div>
                )}

                {/* OCR failure message */}
                {ocrAttempted && ocrFailed && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-amber-800 text-sm">{ar ? "تعذّر قراءة الجواز تلقائياً" : "Couldn't read passport automatically"}</p>
                      <p className="text-amber-700 text-xs mt-0.5">{ar ? "يرجى إدخال البيانات يدوياً أدناه، أو ارفع صورة أوضح." : "Please enter your data manually below, or upload a clearer image."}</p>
                    </div>
                  </div>
                )}

                {/* Extracted / editable passport fields — only shown after upload */}
                {(profile.passportImageUrl && !isOcrRunning) && (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-slate-100" />
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">
                        {ocrAttempted && !ocrFailed ? (ar ? "البيانات المستخرجة — راجع وصحّح إذا لزم" : "Extracted data — review and correct if needed") : (ar ? "بيانات الجواز" : "Passport Details")}
                      </span>
                      <div className="h-px flex-1 bg-slate-100" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{ar ? "الاسم الأول" : "First Name"} *</Label>
                        <Input className="bg-slate-50 focus:bg-white" value={profile.firstName || ""} onChange={e => setProfile({...profile, firstName: e.target.value})} placeholder={ar ? "الاسم الأول" : "First name"} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{ar ? "اسم العائلة" : "Last Name"} *</Label>
                        <Input className="bg-slate-50 focus:bg-white" value={profile.lastName || ""} onChange={e => setProfile({...profile, lastName: e.target.value})} placeholder={ar ? "اسم العائلة" : "Last name"} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{ar ? "رقم الجواز" : "Passport Number"} *</Label>
                        <Input className="bg-slate-50 focus:bg-white font-mono uppercase" value={profile.passportNumber || ""} onChange={e => setProfile({...profile, passportNumber: e.target.value})} placeholder={ar ? "رقم الجواز" : "Passport number"} dir="ltr" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{ar ? "الجنسية" : "Nationality"} *</Label>
                        <CountrySelect
                          className="bg-slate-50"
                          language={ar ? "ar" : "en"}
                          value={profile.nationality || ""}
                          onChange={code => setProfile({ ...profile, nationality: getCountryByCode(code)?.nameEn ?? code })}
                          placeholder={ar ? "اختر الجنسية" : "Select nationality"}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{ar ? "تاريخ الميلاد" : "Date of Birth"} *</Label>
                        <Input type="date" className="bg-slate-50 focus:bg-white" value={profile.dateOfBirth?.split('T')[0] || ""} onChange={e => setProfile({...profile, dateOfBirth: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{ar ? "الجنس" : "Gender"}</Label>
                        <Select value={profile.gender || "male"} onValueChange={v => setProfile({...profile, gender: v})}>
                          <SelectTrigger className="bg-slate-50"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">{ar ? "ذكر" : "Male"}</SelectItem>
                            <SelectItem value="female">{ar ? "أنثى" : "Female"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{ar ? "تاريخ الإصدار" : "Issue Date"}</Label>
                        <Input type="date" className="bg-slate-50 focus:bg-white" value={profile.passportIssueDate?.split('T')[0] || ""} onChange={e => setProfile({...profile, passportIssueDate: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{ar ? "تاريخ الانتهاء" : "Expiry Date"} *</Label>
                        <Input type="date" className="bg-slate-50 focus:bg-white" value={profile.passportExpiryDate?.split('T')[0] || ""} onChange={e => setProfile({...profile, passportExpiryDate: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{ar ? "دولة الإصدار" : "Issuing Country"}</Label>
                        <Input className="bg-slate-50 focus:bg-white" value={profile.passportIssueCountry || ""} onChange={e => setProfile({...profile, passportIssueCountry: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{ar ? "مكان الإصدار" : "Place of Issue"}</Label>
                        <Input className="bg-slate-50 focus:bg-white" value={profile.passportIssuePlace || ""} onChange={e => setProfile({...profile, passportIssuePlace: e.target.value})} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── SECTION 3: Contact Info ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0d2351] text-white flex items-center justify-center text-sm font-black shrink-0">3</div>
                <div>
                  <h4 className="font-bold text-slate-800">{ar ? "معلومات التواصل" : "Contact Information"}</h4>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{ar ? "رقم الهاتف" : "Phone Number"} *</Label>
                  <PhoneDialInput
                    value={phoneLocal}
                    dialCode={phoneDialCountry}
                    onValueChange={setPhoneLocal}
                    onDialChange={setPhoneDialCountry}
                    ar={ar}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{ar ? "واتساب" : "WhatsApp"}</Label>
                  <PhoneDialInput
                    value={whatsappLocal}
                    dialCode={whatsappDialCountry}
                    onValueChange={setWhatsappLocal}
                    onDialChange={setWhatsappDialCountry}
                    ar={ar}
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{ar ? "البريد الإلكتروني" : "Email"}</Label>
                  <Input value={profile.email || ""} disabled className="bg-slate-100 text-slate-400 border-dashed cursor-not-allowed" />
                </div>
              </div>
            </div>

            {/* ── SECTION 4: GCC Residency ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0d2351] text-white flex items-center justify-center text-sm font-black shrink-0">4</div>
                <div>
                  <h4 className="font-bold text-slate-800">{ar ? "إقامة دول مجلس التعاون" : "GCC Residency"}</h4>
                  <p className="text-xs text-slate-500">{ar ? "هل أنت مقيم في إحدى دول مجلس التعاون الخليجي؟" : "Are you a resident of a GCC country?"}</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex gap-3">
                  <button
                    onClick={() => setProfile({...profile, isGccResident: true})}
                    className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all ${profile.isGccResident ? "border-[#0d2351] bg-[#0d2351] text-white" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-[#0d2351]/40"}`}
                  >
                    {ar ? "نعم" : "Yes"}
                  </button>
                  <button
                    onClick={() => setProfile({...profile, isGccResident: false, gccResidenceCountry: "", gccResidenceFrontUrl: ""})}
                    className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all ${profile.isGccResident === false ? "border-slate-500 bg-slate-100 text-slate-700" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"}`}
                  >
                    {ar ? "لا" : "No"}
                  </button>
                </div>

                {profile.isGccResident && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-200 pt-1">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{ar ? "دولة الإقامة" : "Residence Country"}</Label>
                      <Select value={profile.gccResidenceCountry || ""} onValueChange={v => setProfile({...profile, gccResidenceCountry: v})}>
                        <SelectTrigger className="bg-slate-50"><SelectValue placeholder={ar ? "اختر الدولة" : "Select country"} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Saudi Arabia">{ar ? "المملكة العربية السعودية" : "Saudi Arabia"}</SelectItem>
                          <SelectItem value="United Arab Emirates">{ar ? "الإمارات العربية المتحدة" : "United Arab Emirates"}</SelectItem>
                          <SelectItem value="Kuwait">{ar ? "الكويت" : "Kuwait"}</SelectItem>
                          <SelectItem value="Qatar">{ar ? "قطر" : "Qatar"}</SelectItem>
                          <SelectItem value="Bahrain">{ar ? "البحرين" : "Bahrain"}</SelectItem>
                          <SelectItem value="Oman">{ar ? "عُمان" : "Oman"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{ar ? "رقم الإقامة" : "Residence Number"}</Label>
                      <Input className="bg-slate-50 focus:bg-white" value={profile.gccResidenceNumber || ""} onChange={e => setProfile({...profile, gccResidenceNumber: e.target.value})} dir="ltr" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{ar ? "تاريخ الانتهاء" : "Expiry Date"}</Label>
                      <Input type="date" className="bg-slate-50 focus:bg-white" value={profile.gccResidenceExpiry?.split('T')[0] || ""} onChange={e => setProfile({...profile, gccResidenceExpiry: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{ar ? "صورة الإقامة (الوجه الأمامي)" : "Residence Front Image"}</Label>
                      <ProfileFileUpload label="" value={profile.gccResidenceFrontUrl} onChange={v => setProfile({...profile, gccResidenceFrontUrl: v})} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{ar ? "صورة الإقامة (الوجه الخلفي)" : "Residence Back Image"}</Label>
                      <ProfileFileUpload label="" value={profile.gccResidenceBackUrl} onChange={v => setProfile({...profile, gccResidenceBackUrl: v})} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── SECTION 5: European / Schengen ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0d2351] text-white flex items-center justify-center text-sm font-black shrink-0">5</div>
                <div>
                  <h4 className="font-bold text-slate-800">{ar ? "الإقامة الأوروبية / تأشيرة شنغن" : "European Residency / Schengen Visa"}</h4>
                  <p className="text-xs text-slate-500">{ar ? "هل لديك إقامة أوروبية أو تأشيرة شنغن سارية؟" : "Do you have a valid European residency or Schengen visa?"}</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex gap-3">
                  <button
                    onClick={() => setProfile({...profile, isEuropeanResident: true})}
                    className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all ${profile.isEuropeanResident ? "border-[#0d2351] bg-[#0d2351] text-white" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-[#0d2351]/40"}`}
                  >
                    {ar ? "نعم" : "Yes"}
                  </button>
                  <button
                    onClick={() => setProfile({...profile, isEuropeanResident: false, europeanDocumentType: "", europeanDocumentUrl: ""})}
                    className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all ${profile.isEuropeanResident === false ? "border-slate-500 bg-slate-100 text-slate-700" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"}`}
                  >
                    {ar ? "لا" : "No"}
                  </button>
                </div>

                {profile.isEuropeanResident && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-200 pt-1">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{ar ? "نوع الوثيقة" : "Document Type"}</Label>
                      <Select value={profile.europeanDocumentType || ""} onValueChange={v => setProfile({...profile, europeanDocumentType: v})}>
                        <SelectTrigger className="bg-slate-50"><SelectValue placeholder={ar ? "اختر النوع" : "Select type"} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="schengen_visa">{ar ? "تأشيرة شنغن" : "Schengen Visa"}</SelectItem>
                          <SelectItem value="eu_residency">{ar ? "إقامة أوروبية" : "EU Residency Permit"}</SelectItem>
                          <SelectItem value="uk_visa">{ar ? "تأشيرة بريطانية" : "UK Visa"}</SelectItem>
                          <SelectItem value="uk_residency">{ar ? "إقامة بريطانية" : "UK Residency Permit"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{ar ? "تاريخ الانتهاء" : "Expiry Date"}</Label>
                      <Input type="date" className="bg-slate-50 focus:bg-white" value={profile.europeanDocumentExpiry?.split('T')[0] || ""} onChange={e => setProfile({...profile, europeanDocumentExpiry: e.target.value})} />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{ar ? "صورة الوثيقة" : "Document Image"}</Label>
                      <ProfileFileUpload label="" value={profile.europeanDocumentUrl} onChange={v => setProfile({...profile, europeanDocumentUrl: v})} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Save button ── */}
            <div className="sticky bottom-6 z-10 flex justify-end">
              <Button
                onClick={handleSaveProfile}
                disabled={updateProfileMutation.isPending}
                className="h-14 px-10 rounded-2xl shadow-lg shadow-[#0d2351]/25 hover:shadow-xl transition-all font-bold text-lg gap-3 text-white bg-[#0d2351] hover:bg-[#0d2351]/90"
              >
                {updateProfileMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {ar ? "حفظ الملف الشخصي" : "Save Profile"}
              </Button>
            </div>

            {/* Post-save success indicator */}
            {updateProfileMutation.isSuccess && isProfileFull && (
              <div className="text-center py-4 text-emerald-700 font-bold text-sm animate-in fade-in">
                ✓ {ar ? "تم إكمال بيانات الملف الشخصي بنجاح" : "Profile Completed Successfully"}
              </div>
            )}
          </TabsContent>

          {/* ── Notifications tab ── */}
          <TabsContent value="notifications" className="space-y-4">
            {(notifications?.length ?? 0) > 0 && (
              <div className="flex justify-end mb-2">
                <Button variant="outline" size="sm" className="gap-2 bg-white rounded-xl shadow-sm" onClick={() => markAllRead.mutate()}>
                  <CheckCheck size={14} /> {ar ? "تحديد الكل كمقروء" : "Mark all as read"}
                </Button>
              </div>
            )}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-100">
              {notifsLoading && (
                <div className="text-slate-400 text-center py-16 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[#0d2351]/40" />
                  <span className="font-medium">{ar ? "جاري التحميل..." : "Loading..."}</span>
                </div>
              )}
              {!notifsLoading && (notifications?.length ?? 0) === 0 && (
                <div className="text-center py-20 text-slate-400 flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Bell className="h-8 w-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-700 mb-1">{ar ? "لا توجد إشعارات" : "No notifications"}</h3>
                  <p className="text-sm">{ar ? "أنت على اطلاع بكل شيء، لا جديد حالياً." : "You're all caught up!"}</p>
                </div>
              )}
              {notifications?.map((n) => (
                <NotificationRow key={n.id} n={n} language={language} onRead={(id) => markRead.mutate({ id })} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
