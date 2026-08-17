import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListBookings,
  useGetDashboardStats,
  useListAdminPaymentMethods,
  useCreatePaymentMethod,
  useUpdatePaymentMethod,
  useDeletePaymentMethod,
  useReorderPaymentMethods,
  getListAdminPaymentMethodsQueryKey,
  getGetPaymentConfigQueryKey,
  getListBookingsQueryKey,
  type PaymentMethod,
} from "@workspace/api-client-react";
import { useTranslation } from "@/hooks/use-translation";
import {
  DollarSign, Clock, CheckCircle, Plus, Pencil, Trash2, ArrowUp, ArrowDown,
  ImageIcon, Loader2, CreditCard, Wallet,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const ADMIN_ACCESS_TOKEN_KEY = "absher_admin_access_token";

/** Upload a public payment-method logo; returns the public image URL or null. */
async function uploadLogo(file: File): Promise<string | null> {
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
  const fd = new FormData();
  fd.append("file", file);
  try {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    const res = await fetch(`${base}/api/storage/uploads/public-payment-logo`, {
      method: "POST",
      body: fd,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.imageUrl ?? null;
  } catch {
    return null;
  }
}

const imgSrc = (url: string | null | undefined) => {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
  return `${base}${url}`;
};

interface MethodForm {
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  logoUrl: string;
  feePercent: string;
  feeFixed: string;
  isActive: boolean;
}

const emptyForm = (): MethodForm => ({
  nameAr: "", nameEn: "", descriptionAr: "", descriptionEn: "",
  logoUrl: "", feePercent: "0", feeFixed: "0", isActive: true,
});

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
  const qc = useQueryClient();

  const [tab, setTab] = useState<"methods" | "transactions">("methods");

  // ── Payment methods management ──────────────────────────────────────────
  const { data: methods, isLoading: methodsLoading } = useListAdminPaymentMethods();
  const createMutation = useCreatePaymentMethod();
  const updateMutation = useUpdatePaymentMethod();
  const deleteMutation = useDeletePaymentMethod();
  const reorderMutation = useReorderPaymentMethods();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getListAdminPaymentMethodsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetPaymentConfigQueryKey() });
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [form, setForm] = useState<MethodForm>(emptyForm());
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PaymentMethod | null>(null);

  const openCreate = () => { setEditing(null); setForm(emptyForm()); setModalOpen(true); };
  const openEdit = (m: PaymentMethod) => {
    setEditing(m);
    setForm({
      nameAr: m.nameAr, nameEn: m.nameEn,
      descriptionAr: m.descriptionAr ?? "", descriptionEn: m.descriptionEn ?? "",
      logoUrl: m.logoUrl ?? "",
      feePercent: String(m.feePercent), feeFixed: String(m.feeFixed),
      isActive: m.isActive,
    });
    setModalOpen(true);
  };

  const handleLogoFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    const url = await uploadLogo(file);
    setUploading(false);
    if (url) {
      setForm(f => ({ ...f, logoUrl: url }));
      toast.success(ar ? "تم رفع الشعار" : "Logo uploaded");
    } else {
      toast.error(ar ? "فشل رفع الشعار" : "Logo upload failed");
    }
  };

  const submitForm = async () => {
    if (!form.nameAr.trim() || !form.nameEn.trim()) {
      toast.error(ar ? "الاسم بالعربية والإنجليزية مطلوب" : "Arabic and English names are required");
      return;
    }
    const body = {
      nameAr: form.nameAr.trim(),
      nameEn: form.nameEn.trim(),
      descriptionAr: form.descriptionAr.trim() || null,
      descriptionEn: form.descriptionEn.trim() || null,
      logoUrl: form.logoUrl || null,
      feePercent: Number(form.feePercent) || 0,
      feeFixed: Number(form.feeFixed) || 0,
      isActive: form.isActive,
    };
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: body });
        toast.success(ar ? "تم تحديث وسيلة الدفع" : "Payment method updated");
      } else {
        await createMutation.mutateAsync({ data: body });
        toast.success(ar ? "تمت إضافة وسيلة الدفع" : "Payment method added");
      }
      setModalOpen(false);
      invalidate();
    } catch {
      toast.error(ar ? "حدث خطأ أثناء الحفظ" : "Error saving");
    }
  };

  const toggleActive = async (m: PaymentMethod) => {
    try {
      await updateMutation.mutateAsync({ id: m.id, data: { isActive: !m.isActive } });
      invalidate();
      toast.success(
        !m.isActive
          ? (ar ? "تم تفعيل وسيلة الدفع" : "Payment method enabled")
          : (ar ? "تم تعطيل وسيلة الدفع" : "Payment method disabled"),
      );
    } catch {
      toast.error(ar ? "حدث خطأ" : "Error");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteTarget.id });
      setDeleteTarget(null);
      invalidate();
      toast.success(ar ? "تم حذف وسيلة الدفع" : "Payment method deleted");
    } catch {
      toast.error(ar ? "حدث خطأ أثناء الحذف" : "Error deleting");
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    if (!methods) return;
    const target = index + dir;
    if (target < 0 || target >= methods.length) return;
    const order = methods.map((m, i) => ({
      id: m.id,
      sortOrder: i === index ? target : i === target ? index : i,
    }));
    try {
      await reorderMutation.mutateAsync({ data: { order } });
      invalidate();
    } catch {
      toast.error(ar ? "حدث خطأ أثناء إعادة الترتيب" : "Error reordering");
    }
  };

  // ── Bookings/transactions (existing view) ───────────────────────────────
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const { data: stats } = useGetDashboardStats();
  const { data: bookings, isLoading: bookingsLoading } = useListBookings(undefined, {
    query: { enabled: tab === "transactions", queryKey: getListBookingsQueryKey() },
  });

  const enhancedBookings = bookings?.map(b => ({
    ...b,
    paymentStatus: (b as any).paymentStatus || "paid",
  }));
  const filtered = enhancedBookings?.filter(b => {
    const matchType = filterType === "all" || b.type === filterType;
    const matchStatus = filterStatus === "all" || b.paymentStatus === filterStatus;
    return matchType && matchStatus;
  });

  const activeCount = methods?.filter(m => m.isActive).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{ar ? "المدفوعات ووسائل الدفع" : "Payments & Methods"}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {ar ? "إدارة وسائل الدفع الظاهرة في التطبيق والموقع ومتابعة المدفوعات" : "Manage payment methods shown in the app & website, and track payments"}
          </p>
        </div>
        {tab === "methods" && (
          <Button onClick={openCreate} className="rounded-xl px-5" data-testid="button-add-payment-method">
            <Plus className="w-4 h-4 me-2" />
            {ar ? "إضافة وسيلة دفع" : "Add Payment Method"}
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-2xl border border-card-border p-6 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Wallet className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">
              {ar ? "وسائل دفع مفعّلة" : "Active Methods"}
            </p>
            <h3 className="text-3xl font-extrabold text-foreground tabular-nums" data-testid="text-active-methods-count">
              {activeCount}
            </h3>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-card-border p-6 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <CreditCard className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">
              {ar ? "إجمالي الوسائل" : "Total Methods"}
            </p>
            <h3 className="text-3xl font-extrabold text-foreground tabular-nums">{methods?.length ?? 0}</h3>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-card-border p-6 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <CheckCircle className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">
              {ar ? "حجوزات مؤكدة" : "Confirmed Bookings"}
            </p>
            <h3 className="text-3xl font-extrabold text-foreground tabular-nums">{stats?.confirmedBookings ?? 0}</h3>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={tab === "methods" ? "default" : "outline"}
          onClick={() => setTab("methods")}
          className="rounded-xl"
          data-testid="tab-payment-methods"
        >
          {ar ? "وسائل الدفع" : "Payment Methods"}
        </Button>
        <Button
          variant={tab === "transactions" ? "default" : "outline"}
          onClick={() => setTab("transactions")}
          className="rounded-xl"
          data-testid="tab-transactions"
        >
          {ar ? "المدفوعات" : "Payments"}
        </Button>
      </div>

      {tab === "methods" && (
        <div className="bg-card rounded-2xl border border-card-border overflow-hidden shadow-sm">
          {methodsLoading ? (
            <div className="text-center py-16 text-muted-foreground">{ar ? "جاري التحميل..." : "Loading..."}</div>
          ) : !methods?.length ? (
            <div className="text-center py-16 text-muted-foreground">
              {ar ? "لا توجد وسائل دفع بعد — أضف أول وسيلة الآن" : "No payment methods yet — add your first one"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-start">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-start">{ar ? "الترتيب" : "Order"}</th>
                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-start">{ar ? "الوسيلة" : "Method"}</th>
                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-start">{ar ? "الرسوم" : "Fees"}</th>
                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-start">{ar ? "الحالة" : "Status"}</th>
                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-start">{ar ? "إجراءات" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {methods.map((m, i) => (
                    <tr key={m.id} className="hover:bg-muted/20 transition-colors" data-testid={`row-payment-method-${m.id}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={i === 0 || reorderMutation.isPending} onClick={() => move(i, -1)} data-testid={`button-move-up-${m.id}`}>
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={i === methods.length - 1 || reorderMutation.isPending} onClick={() => move(i, 1)} data-testid={`button-move-down-${m.id}`}>
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {m.logoUrl ? (
                            <img src={imgSrc(m.logoUrl)} alt="" className="w-10 h-10 rounded-lg object-contain bg-muted/40 border border-border p-1" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-muted/40 border border-border flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-foreground">{ar ? m.nameAr : m.nameEn}</div>
                            <div className="text-xs text-muted-foreground">{ar ? m.nameEn : m.nameAr}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground tabular-nums">
                        {m.feePercent > 0 && <span>{m.feePercent}%</span>}
                        {m.feePercent > 0 && m.feeFixed > 0 && <span> + </span>}
                        {m.feeFixed > 0 && <span>{m.feeFixed} SAR</span>}
                        {m.feePercent === 0 && m.feeFixed === 0 && <span>{ar ? "بدون رسوم" : "No fees"}</span>}
                      </td>
                      <td className="px-6 py-4">
                        <Switch checked={m.isActive} onCheckedChange={() => toggleActive(m)} data-testid={`switch-active-${m.id}`} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(m)} data-testid={`button-edit-${m.id}`}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(m)} data-testid={`button-delete-${m.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "transactions" && (
        <>
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
                          SAR {(b.totalPrice || 0).toLocaleString()}
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
        </>
      )}

      {/* Create / Edit modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto" dir={ar ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>
              {editing
                ? (ar ? "تعديل وسيلة الدفع" : "Edit Payment Method")
                : (ar ? "إضافة وسيلة دفع" : "Add Payment Method")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{ar ? "الاسم (عربي)" : "Name (Arabic)"} *</Label>
                <Input value={form.nameAr} onChange={e => setForm(f => ({ ...f, nameAr: e.target.value }))} className="rounded-xl" data-testid="input-method-name-ar" />
              </div>
              <div className="space-y-2">
                <Label>{ar ? "الاسم (إنجليزي)" : "Name (English)"} *</Label>
                <Input value={form.nameEn} onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))} className="rounded-xl text-left" dir="ltr" data-testid="input-method-name-en" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{ar ? "الوصف (عربي)" : "Description (Arabic)"}</Label>
                <Textarea value={form.descriptionAr} onChange={e => setForm(f => ({ ...f, descriptionAr: e.target.value }))} className="rounded-xl min-h-[60px]" />
              </div>
              <div className="space-y-2">
                <Label>{ar ? "الوصف (إنجليزي)" : "Description (English)"}</Label>
                <Textarea value={form.descriptionEn} onChange={e => setForm(f => ({ ...f, descriptionEn: e.target.value }))} className="rounded-xl min-h-[60px] text-left" dir="ltr" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{ar ? "الشعار" : "Logo"}</Label>
              <div className="flex items-center gap-3">
                {form.logoUrl ? (
                  <img src={imgSrc(form.logoUrl)} alt="" className="w-14 h-14 rounded-xl object-contain bg-muted/40 border border-border p-1" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-muted/40 border border-dashed border-border flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <label className="cursor-pointer">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold border border-border rounded-xl px-4 py-2 hover:bg-muted/40 transition-colors">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                    {ar ? "رفع شعار" : "Upload logo"}
                  </span>
                  <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={e => handleLogoFile(e.target.files?.[0])} data-testid="input-method-logo" />
                </label>
                {form.logoUrl && (
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setForm(f => ({ ...f, logoUrl: "" }))}>
                    {ar ? "إزالة" : "Remove"}
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{ar ? "رسوم نسبية (%)" : "Fee Percent (%)"}</Label>
                <Input type="number" min="0" max="100" step="0.01" value={form.feePercent} onChange={e => setForm(f => ({ ...f, feePercent: e.target.value }))} className="rounded-xl text-left" dir="ltr" data-testid="input-method-fee-percent" />
              </div>
              <div className="space-y-2">
                <Label>{ar ? "رسوم ثابتة (ريال)" : "Fixed Fee (SAR)"}</Label>
                <Input type="number" min="0" step="0.01" value={form.feeFixed} onChange={e => setForm(f => ({ ...f, feeFixed: e.target.value }))} className="rounded-xl text-left" dir="ltr" data-testid="input-method-fee-fixed" />
              </div>
            </div>

            <div className="flex items-center justify-between bg-muted/40 rounded-2xl p-4">
              <div>
                <Label className="text-base font-semibold">{ar ? "مفعّلة" : "Active"}</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {ar ? "تظهر مباشرة في التطبيق والموقع" : "Shows immediately in the app & website"}
                </p>
              </div>
              <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} data-testid="switch-method-active" />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} className="rounded-xl">
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={submitForm}
              disabled={createMutation.isPending || updateMutation.isPending || uploading}
              className="rounded-xl"
              data-testid="button-save-payment-method"
            >
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
              {ar ? "حفظ" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm rounded-2xl" dir={ar ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{ar ? "حذف وسيلة الدفع؟" : "Delete payment method?"}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {ar
              ? `سيتم حذف "${deleteTarget?.nameAr}" نهائياً وستختفي من التطبيق والموقع.`
              : `"${deleteTarget?.nameEn}" will be permanently deleted and disappear from the app & website.`}
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="rounded-xl">
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteMutation.isPending} className="rounded-xl" data-testid="button-confirm-delete">
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
              {ar ? "حذف" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
