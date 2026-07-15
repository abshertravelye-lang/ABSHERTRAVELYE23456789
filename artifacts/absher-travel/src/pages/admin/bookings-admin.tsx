import { useState } from "react";
import { useListBookings, useUpdateBooking, getListBookingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/use-translation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Clock, XCircle, Phone, Mail, MapPin, Calendar, Users, ChevronDown, ChevronUp } from "lucide-react";

type BookingStatus = "pending" | "confirmed" | "cancelled";
type BookingType = "flight" | "hotel" | "program" | "visa";

const STATUS_LABELS: Record<BookingStatus, { ar: string; en: string; color: string; icon: typeof CheckCircle }> = {
  pending:   { ar: "قيد الانتظار", en: "Pending",   color: "bg-amber-100 text-amber-700",   icon: Clock },
  confirmed: { ar: "مؤكد",        en: "Confirmed", color: "bg-green-100 text-green-700",   icon: CheckCircle },
  cancelled: { ar: "ملغي",        en: "Cancelled", color: "bg-red-100 text-red-700",       icon: XCircle },
};

const TYPE_LABELS: Record<BookingType, { ar: string; en: string; color: string }> = {
  flight:  { ar: "تذكرة طيران", en: "Flight",  color: "bg-blue-100 text-blue-700" },
  hotel:   { ar: "فندق",         en: "Hotel",   color: "bg-purple-100 text-purple-700" },
  program: { ar: "برنامج سياحي", en: "Program", color: "bg-teal-100 text-teal-700" },
  visa:    { ar: "تأشيرة",       en: "Visa",    color: "bg-orange-100 text-orange-700" },
};

export default function BookingsAdmin() {
  const { language } = useTranslation();
  const ar = language === "ar";
  const qc = useQueryClient();

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const params = {
    ...(filterStatus !== "all" ? { status: filterStatus as BookingStatus } : {}),
    ...(filterType !== "all" ? { type: filterType as BookingType } : {}),
  };

  const { data: bookings, isLoading } = useListBookings(params);
  const updateBooking = useUpdateBooking({
    mutation: {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListBookingsQueryKey() }),
    },
  });

  const handleStatusChange = (id: number, status: BookingStatus) => {
    updateBooking.mutate({ id, data: { status } });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[160px]">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
            {ar ? "الحالة" : "Status"}
          </label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-10 border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{ar ? "جميع الحالات" : "All Statuses"}</SelectItem>
              <SelectItem value="pending">{ar ? "قيد الانتظار" : "Pending"}</SelectItem>
              <SelectItem value="confirmed">{ar ? "مؤكد" : "Confirmed"}</SelectItem>
              <SelectItem value="cancelled">{ar ? "ملغي" : "Cancelled"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
            {ar ? "النوع" : "Type"}
          </label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-10 border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{ar ? "جميع الأنواع" : "All Types"}</SelectItem>
              <SelectItem value="flight">{ar ? "تذكرة طيران" : "Flight"}</SelectItem>
              <SelectItem value="hotel">{ar ? "فندق" : "Hotel"}</SelectItem>
              <SelectItem value="program">{ar ? "برنامج سياحي" : "Program"}</SelectItem>
              <SelectItem value="visa">{ar ? "تأشيرة" : "Visa"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="pt-5 text-sm text-slate-500 font-medium">
          {bookings?.length ?? 0} {ar ? "حجز" : "bookings"}
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-3">
        {!bookings?.length ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-20 text-center text-slate-400">
            {ar ? "لا توجد حجوزات" : "No bookings found"}
          </div>
        ) : (
          bookings.map((b) => {
            const status = b.status as BookingStatus;
            const type = b.type as BookingType;
            const StatusIcon = STATUS_LABELS[status].icon;
            const isExpanded = expandedId === b.id;

            return (
              <div key={b.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                {/* Main row */}
                <div
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : b.id)}
                >
                  <div className="text-xs font-bold text-slate-400 w-8 shrink-0">#{b.id}</div>

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 truncate">{b.clientName}</div>
                    <div className="text-sm text-slate-400 mt-0.5">{b.clientPhone}</div>
                  </div>

                  <div className="shrink-0 hidden sm:block">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_LABELS[type]?.color ?? "bg-slate-100 text-slate-600"}`}>
                      {ar ? TYPE_LABELS[type]?.ar : TYPE_LABELS[type]?.en}
                    </span>
                  </div>

                  <div className="shrink-0 hidden md:block text-sm text-slate-500">
                    {new Date(b.createdAt).toLocaleDateString(ar ? "ar-SA" : "en-US")}
                  </div>

                  <div className="shrink-0">
                    <Select
                      value={status}
                      onValueChange={(v) => handleStatusChange(b.id, v as BookingStatus)}
                    >
                      <SelectTrigger
                        className={`h-8 text-xs font-semibold border-0 shadow-none ${STATUS_LABELS[status].color} hover:opacity-80 w-36 rounded-full`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <StatusIcon className="h-3.5 w-3.5 mr-1 rtl:ml-1 rtl:mr-0 shrink-0" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">{ar ? "قيد الانتظار" : "Pending"}</SelectItem>
                        <SelectItem value="confirmed">{ar ? "مؤكد" : "Confirmed"}</SelectItem>
                        <SelectItem value="cancelled">{ar ? "ملغي" : "Cancelled"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="shrink-0 text-slate-400">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-6 py-5 bg-slate-50/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      {b.clientEmail && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                          {b.clientEmail}
                        </div>
                      )}
                      {b.destination && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                          {b.destination}
                        </div>
                      )}
                      {b.travelDate && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                          {b.travelDate}
                          {b.returnDate && ` → ${b.returnDate}`}
                        </div>
                      )}
                      {(b.adults || b.children) && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Users className="h-4 w-4 text-slate-400 shrink-0" />
                          {b.adults} {ar ? "بالغ" : "adults"}{b.children ? `, ${b.children} ${ar ? "أطفال" : "children"}` : ""}
                        </div>
                      )}
                      {b.totalPrice && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <span className="text-slate-400 text-xs font-bold">SAR</span>
                          {b.totalPrice.toLocaleString()}
                        </div>
                      )}
                      {b.notes && (
                        <div className="md:col-span-2 lg:col-span-3 text-slate-500 italic bg-white rounded-lg p-3 border border-slate-100">
                          {b.notes}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
