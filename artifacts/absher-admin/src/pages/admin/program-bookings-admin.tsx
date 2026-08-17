/**
 * Program Bookings Admin — in-platform tourism-program booking requests
 * (program_booking_requests, TRV-YYYY-NNNNNN). Staff can review each
 * request, change its status (customer is notified), and leave notes.
 */
import { useState } from "react";
import {
  useListProgramBookingsAdmin,
  useUpdateProgramBookingStatus,
  getListProgramBookingsAdminQueryKey,
  ProgramBooking,
  ProgramBookingStatus,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/use-translation";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Phone, Mail, MapPin, Calendar, Users, ChevronDown, ChevronUp,
  Flag, BedDouble, Loader2, StickyNote,
} from "lucide-react";

const STATUS_META: Record<ProgramBookingStatus, { ar: string; en: string; color: string }> = {
  draft:                 { ar: "مسودة",          en: "Draft",                 color: "bg-slate-100 text-slate-600" },
  submitted:             { ar: "تم الإرسال",      en: "Submitted",             color: "bg-blue-100 text-blue-700" },
  under_review:          { ar: "قيد المراجعة",    en: "Under Review",          color: "bg-amber-100 text-amber-700" },
  awaiting_availability: { ar: "بانتظار التوفر",  en: "Awaiting Availability", color: "bg-amber-100 text-amber-700" },
  awaiting_payment:      { ar: "بانتظار الدفع",   en: "Awaiting Payment",      color: "bg-purple-100 text-purple-700" },
  paid:                  { ar: "تم الدفع",        en: "Paid",                  color: "bg-emerald-100 text-emerald-700" },
  confirmed:             { ar: "مؤكد",           en: "Confirmed",             color: "bg-emerald-100 text-emerald-700" },
  completed:             { ar: "مكتمل",          en: "Completed",             color: "bg-emerald-100 text-emerald-700" },
  rejected:              { ar: "مرفوض",          en: "Rejected",              color: "bg-red-100 text-red-700" },
  cancelled:             { ar: "ملغى",           en: "Cancelled",             color: "bg-red-100 text-red-700" },
};

const STATUS_ORDER: ProgramBookingStatus[] = [
  "submitted", "under_review", "awaiting_availability", "awaiting_payment",
  "paid", "confirmed", "completed", "rejected", "cancelled",
];

function ExpandedDetails({ b, ar }: { b: ProgramBooking; ar: boolean }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const updateStatus = useUpdateProgramBookingStatus({
    mutation: {
      onSuccess: () => {
        toast({ title: ar ? "تم تحديث الحالة وإشعار العميل" : "Status updated, customer notified" });
        setNote("");
        qc.invalidateQueries({ queryKey: getListProgramBookingsAdminQueryKey() });
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onError: (err: any) => {
        toast({
          variant: "destructive",
          title: ar ? "فشل تحديث الحالة" : "Failed to update status",
          description: (err?.data as { error?: string } | null)?.error || undefined,
        });
      },
    },
  });
  const [nextStatus, setNextStatus] = useState<ProgramBookingStatus>(b.status);

  return (
    <div className="border-t border-card-border px-6 py-5 bg-muted/20 space-y-5">
      {/* Customer & trip details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="h-4 w-4 text-muted-foreground/60 shrink-0" /><span dir="ltr">{b.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-4 w-4 text-muted-foreground/60 shrink-0" /><span dir="ltr">{b.email}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Flag className="h-4 w-4 text-muted-foreground/60 shrink-0" />{b.nationality}
        </div>
        {b.programDestination && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 text-muted-foreground/60 shrink-0" />{b.programDestination}
          </div>
        )}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4 text-muted-foreground/60 shrink-0" />
          {b.travelDate}{b.returnDate ? ` → ${b.returnDate}` : ""}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4 text-muted-foreground/60 shrink-0" />
          {b.adults} {ar ? "بالغ" : "adults"}
          {b.children ? `, ${b.children} ${ar ? "طفل" : "children"}` : ""}
          {b.infants ? `, ${b.infants} ${ar ? "رضيع" : "infants"}` : ""}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <BedDouble className="h-4 w-4 text-muted-foreground/60 shrink-0" />
          {b.rooms} {ar ? "غرفة" : "rooms"}{b.roomType ? ` — ${b.roomType}` : ""}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground font-semibold">
          <span className="text-muted-foreground/60 text-xs font-bold">{b.programCurrency}</span>
          {Number(b.programPrice).toLocaleString()} {ar ? "للشخص" : "/person"}
        </div>
      </div>

      {(b.specialRequirements || b.customerNotes) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {b.specialRequirements && (
            <div className="bg-card rounded-lg p-3 border border-card-border text-muted-foreground">
              <div className="text-xs font-bold text-muted-foreground/70 mb-1">{ar ? "متطلبات خاصة" : "Special requirements"}</div>
              {b.specialRequirements}
            </div>
          )}
          {b.customerNotes && (
            <div className="bg-card rounded-lg p-3 border border-card-border text-muted-foreground italic">
              <div className="text-xs font-bold text-muted-foreground/70 mb-1 not-italic">{ar ? "ملاحظات العميل" : "Customer notes"}</div>
              {b.customerNotes}
            </div>
          )}
        </div>
      )}

      {/* Status history timeline */}
      {(b.statusHistory?.length ?? 0) > 0 && (
        <div>
          <div className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider mb-2">
            {ar ? "سجل الحالة" : "Status History"}
          </div>
          <div className="space-y-1.5">
            {b.statusHistory.map((h, i) => {
              const meta = STATUS_META[h.status as ProgramBookingStatus];
              return (
                <div key={i} className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className={`px-2 py-0.5 rounded-full font-semibold ${meta?.color ?? "bg-muted"}`}>
                    {meta ? (ar ? meta.ar : meta.en) : h.status}
                  </span>
                  <span>{new Date(h.at).toLocaleString(ar ? "ar-SA" : "en-US")}</span>
                  {h.note && <span className="italic">— {h.note}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Status update */}
      <div className="bg-card rounded-xl border border-card-border p-4 space-y-3">
        <div className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
          <StickyNote className="h-3.5 w-3.5" />{ar ? "تحديث الحالة (سيتم إشعار العميل)" : "Update status (customer will be notified)"}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={nextStatus} onValueChange={(v) => setNextStatus(v as ProgramBookingStatus)}>
            <SelectTrigger className="h-10 sm:w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_ORDER.map(s => (
                <SelectItem key={s} value={s}>{ar ? STATUS_META[s].ar : STATUS_META[s].en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            className="min-h-[40px] flex-1"
            placeholder={ar ? "رسالة اختيارية للعميل..." : "Optional message to the customer..."}
            value={note}
            onChange={e => setNote(e.target.value)}
          />
          <Button
            className="h-10"
            disabled={updateStatus.isPending || (nextStatus === b.status && !note.trim())}
            onClick={() => updateStatus.mutate({ id: b.id, data: { status: nextStatus, ...(note.trim() ? { note: note.trim() } : {}) } })}
          >
            {updateStatus.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (ar ? "حفظ" : "Save")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ProgramBookingsAdmin() {
  const { language } = useTranslation();
  const ar = language === "ar";
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const params = filterStatus !== "all" ? { status: filterStatus as ProgramBookingStatus } : undefined;
  const { data: bookings, isLoading } = useListProgramBookingsAdmin(params);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="bg-card rounded-2xl border border-card-border p-6 animate-pulse h-24" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="bg-card rounded-2xl border border-card-border p-5 flex flex-wrap gap-4 items-center shadow-sm">
        <div className="flex-1 min-w-[200px] max-w-xs">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            {ar ? "الحالة" : "Status"}
          </label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{ar ? "جميع الحالات" : "All Statuses"}</SelectItem>
              {STATUS_ORDER.map(s => (
                <SelectItem key={s} value={s}>{ar ? STATUS_META[s].ar : STATUS_META[s].en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="pt-5 text-sm text-muted-foreground font-medium">
          {bookings?.length ?? 0} {ar ? "طلب" : "requests"}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {!bookings?.length ? (
          <div className="bg-card rounded-2xl border border-card-border p-20 text-center text-muted-foreground shadow-sm">
            {ar ? "لا توجد طلبات حجز برامج" : "No program booking requests"}
          </div>
        ) : (
          bookings.map((b) => {
            const meta = STATUS_META[b.status] ?? STATUS_META.submitted;
            const isExpanded = expandedId === b.id;
            return (
              <div key={b.id} className="bg-card rounded-2xl border border-card-border overflow-hidden shadow-sm">
                <div
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : b.id)}
                >
                  <div className="text-xs font-bold text-muted-foreground shrink-0 w-32" dir="ltr">{b.requestNumber}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground truncate">{b.fullName}</div>
                    <div className="text-sm text-muted-foreground mt-0.5 truncate">
                      {ar ? b.programTitleAr : b.programTitleEn}
                    </div>
                  </div>
                  <div className="shrink-0 hidden md:block text-sm text-muted-foreground">
                    {new Date(b.createdAt).toLocaleDateString(ar ? "ar-SA" : "en-US")}
                  </div>
                  <Badge variant="outline" className={`border-0 text-xs px-2.5 py-1 rounded-full shrink-0 font-semibold ${meta.color}`}>
                    {ar ? meta.ar : meta.en}
                  </Badge>
                  <div className="shrink-0 text-muted-foreground">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
                {isExpanded && <ExpandedDetails b={b} ar={ar} />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
