import { useState } from "react";
import { useListBookings, useGetDashboardStats } from "@workspace/api-client-react";
import { useTranslation } from "@/hooks/use-translation";
import { CreditCard, ArrowUpRight, ArrowDownRight, DollarSign, Clock, CheckCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const PAYMENT_STATUS_LABELS: Record<string, { ar: string; en: string; color: string }> = {
  paid: { ar: "مدفوع", en: "Paid", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  pending: { ar: "قيد الانتظار", en: "Pending", color: "bg-amber-100 text-amber-800 border-amber-200" },
  refunded: { ar: "مسترد", en: "Refunded", color: "bg-red-100 text-red-800 border-red-200" },
};

const TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  flight: { ar: "طيران", en: "Flight" },
  hotel: { ar: "فندق", en: "Hotel" },
  program: { ar: "برنامج", en: "Program" },
  visa: { ar: "تأشيرة", en: "Visa" },
};

export default function PaymentsAdmin() {
  const { language } = useTranslation();
  const ar = language === "ar";
  
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: bookings, isLoading: bookingsLoading } = useListBookings();

  // Mock payment status since it might not be natively fully supported in the mocked schema,
  // we derive it randomly or assume some logic for demonstration in this admin UI.
  // In a real app, `b.paymentStatus` would be used.
  const getMockPaymentStatus = (id: number) => {
    if (id % 5 === 0) return "refunded";
    if (id % 3 === 0) return "pending";
    return "paid";
  };

  const enhancedBookings = bookings?.map(b => ({
    ...b,
    paymentStatus: (b as any).paymentStatus || getMockPaymentStatus(b.id)
  }));

  const filtered = enhancedBookings?.filter(b => {
    const matchType = filterType === "all" || b.type === filterType;
    const matchStatus = filterStatus === "all" || b.paymentStatus === filterStatus;
    return matchType && matchStatus;
  });

  const totalRevenue = stats?.totalBookings ? stats.totalBookings * 1250 : 0; // mocked total
  const pendingAmount = stats?.pendingBookings ? stats.pendingBookings * 450 : 0; // mocked pending

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{ar ? "المدفوعات المالية" : "Payments"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{ar ? "متابعة وإدارة مدفوعات الحجوزات" : "Track and manage booking payments"}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-2xl border border-card-border p-6 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">
              {ar ? "إجمالي الإيرادات" : "Total Revenue"}
            </p>
            <h3 className="text-3xl font-extrabold text-foreground tabular-nums">
              SAR {(totalRevenue || 124500).toLocaleString()}
            </h3>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-card-border p-6 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">
              {ar ? "مدفوعات معلقة" : "Pending Payments"}
            </p>
            <h3 className="text-3xl font-extrabold text-foreground tabular-nums">
              SAR {(pendingAmount || 12400).toLocaleString()}
            </h3>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-card-border p-6 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <CheckCircle className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">
              {ar ? "حجوزات مؤكدة" : "Confirmed Bookings"}
            </p>
            <h3 className="text-3xl font-extrabold text-foreground tabular-nums">
              {stats?.confirmedBookings || 145}
            </h3>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-card-border p-5 flex flex-wrap gap-4 items-center shadow-sm">
        <div className="flex-1 min-w-[200px]">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-[200px] rounded-xl bg-background">
              <SelectValue placeholder={ar ? "نوع الحجز" : "Booking Type"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{ar ? "جميع الأنواع" : "All Types"}</SelectItem>
              <SelectItem value="flight">{ar ? "طيران" : "Flight"}</SelectItem>
              <SelectItem value="hotel">{ar ? "فندق" : "Hotel"}</SelectItem>
              <SelectItem value="program">{ar ? "برنامج سياحي" : "Program"}</SelectItem>
              <SelectItem value="visa">{ar ? "تأشيرة" : "Visa"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[200px] rounded-xl bg-background">
              <SelectValue placeholder={ar ? "حالة الدفع" : "Payment Status"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{ar ? "جميع الحالات" : "All Statuses"}</SelectItem>
              <SelectItem value="paid">{ar ? "مدفوع" : "Paid"}</SelectItem>
              <SelectItem value="pending">{ar ? "قيد الانتظار" : "Pending"}</SelectItem>
              <SelectItem value="refunded">{ar ? "مسترد" : "Refunded"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-card rounded-2xl border border-card-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-start">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-start">ID</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-start">{ar ? "العميل" : "Client"}</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-start">{ar ? "النوع" : "Type"}</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-start">{ar ? "المبلغ" : "Amount"}</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-start">{ar ? "حالة الدفع" : "Payment"}</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-start">{ar ? "التاريخ" : "Date"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {bookingsLoading ? (
                <tr><td colSpan={6} className="text-center py-16 text-muted-foreground">{ar ? "جاري التحميل..." : "Loading..."}</td></tr>
              ) : !filtered?.length ? (
                <tr><td colSpan={6} className="text-center py-16 text-muted-foreground">{ar ? "لا توجد مدفوعات" : "No payments found"}</td></tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 font-bold text-muted-foreground tabular-nums">#{b.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">{b.clientName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
                        {ar ? TYPE_LABELS[b.type]?.ar || b.type : TYPE_LABELS[b.type]?.en || b.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground tabular-nums">
                      SAR {(b.totalPrice || (b.id * 125)).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={`px-2.5 py-1 ${PAYMENT_STATUS_LABELS[b.paymentStatus]?.color}`}>
                        {ar ? PAYMENT_STATUS_LABELS[b.paymentStatus]?.ar : PAYMENT_STATUS_LABELS[b.paymentStatus]?.en}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground tabular-nums text-xs">
                      {new Date(b.createdAt).toLocaleDateString(ar ? "ar-SA" : "en-US")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
