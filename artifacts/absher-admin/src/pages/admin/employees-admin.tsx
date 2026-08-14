import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { useTranslation } from "@/hooks/use-translation";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Search, Plus, Edit2, Phone, Mail, KeyRound, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  PERMISSION_KEYS,
  PERMISSION_LABELS_AR,
  PRESET_LABELS_AR,
  ROLE_LABELS_AR,
} from "./permissions";

interface EmployeeRecord {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  profilePhotoUrl: string | null;
  role: "agent" | "admin" | "super_admin";
  isActive: boolean;
  permissions: string[];
  createdAt: string;
  lastLoginAt: string | null;
}

interface PermissionsMeta {
  permissions: string[];
  presets: Record<string, string[]>;
}

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700 border-purple-200",
  agent: "bg-blue-100 text-blue-700 border-blue-200",
  super_admin: "bg-red-100 text-red-700 border-red-200",
};

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  role: "agent" as "agent" | "admin" | "super_admin",
  preset: "custom",
  isActive: true,
  permissions: [] as string[],
};

export default function EmployeesAdmin() {
  const { language } = useTranslation();
  const ar = language === "ar";
  const qc = useQueryClient();
  const { user } = useAdminAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ...emptyForm });

  const [pwDialogFor, setPwDialogFor] = useState<EmployeeRecord | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<EmployeeRecord | null>(null);

  const { data: employees, isLoading } = useQuery<EmployeeRecord[]>({
    queryKey: ["employees", "list"],
    queryFn: () => customFetch<EmployeeRecord[]>(`/api/employees`, { method: "GET" }),
  });

  const { data: permsMeta } = useQuery<PermissionsMeta>({
    queryKey: ["employees", "permissions-meta"],
    queryFn: () => customFetch<PermissionsMeta>(`/api/employees/permissions`, { method: "GET" }),
    enabled: isSuperAdmin,
  });

  const presets = permsMeta?.presets ?? {};

  const invalidate = () => qc.invalidateQueries({ queryKey: ["employees"] });

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      customFetch(`/api/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      invalidate();
      setIsDialogOpen(false);
      toast.success(ar ? "تم إضافة الموظف بنجاح" : "Employee added successfully");
    },
    onError: () => toast.error(ar ? "تعذر إضافة الموظف" : "Failed to add employee"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      customFetch(`/api/employees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      invalidate();
      toast.success(ar ? "تم تحديث الموظف بنجاح" : "Employee updated successfully");
    },
    onError: () => toast.error(ar ? "تعذر تحديث الموظف" : "Failed to update employee"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customFetch(`/api/employees/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      toast.success(ar ? "تم حذف الموظف" : "Employee deleted");
    },
    onError: () => toast.error(ar ? "تعذر حذف الموظف" : "Failed to delete employee"),
  });

  const handleOpenDialog = (emp?: EmployeeRecord) => {
    if (emp) {
      setEditingId(emp.id);
      setFormData({
        firstName: emp.firstName ?? "",
        lastName: emp.lastName ?? "",
        email: emp.email ?? "",
        phone: emp.phone ?? "",
        password: "",
        role: emp.role,
        preset: "custom",
        isActive: emp.isActive,
        permissions: Array.isArray(emp.permissions) ? [...emp.permissions] : [],
      });
    } else {
      setEditingId(null);
      setFormData({ ...emptyForm });
    }
    setIsDialogOpen(true);
  };

  const applyPreset = (preset: string) => {
    if (preset === "custom") {
      setFormData(prev => ({ ...prev, preset }));
      return;
    }
    const perms = presets[preset] ?? [];
    setFormData(prev => ({ ...prev, preset, permissions: [...perms] }));
  };

  const togglePermission = (key: string) => {
    setFormData(prev => {
      const has = prev.permissions.includes(key);
      return {
        ...prev,
        preset: "custom",
        permissions: has ? prev.permissions.filter(p => p !== key) : [...prev.permissions, key],
      };
    });
  };

  const handleSave = () => {
    if (editingId) {
      const body: Record<string, unknown> = {
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        role: formData.role,
        isActive: formData.isActive,
        permissions: formData.permissions,
      };
      updateMutation.mutate({ id: editingId, body }, { onSuccess: () => setIsDialogOpen(false) });
    } else {
      const body: Record<string, unknown> = {
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        password: formData.password,
        role: formData.role,
        preset: formData.preset !== "custom" ? formData.preset : undefined,
        permissions: formData.permissions,
      };
      createMutation.mutate(body);
    }
  };

  const handleResetPassword = () => {
    if (!pwDialogFor) return;
    updateMutation.mutate(
      { id: pwDialogFor.id, body: { password: newPassword } },
      {
        onSuccess: () => {
          setPwDialogFor(null);
          setNewPassword("");
          toast.success(ar ? "تم إعادة تعيين كلمة المرور" : "Password reset");
        },
      },
    );
  };

  const handleToggleActive = (emp: EmployeeRecord) => {
    updateMutation.mutate({ id: emp.id, body: { isActive: !emp.isActive } });
  };

  const filtered = employees?.filter((e) => {
    const matchRole = roleFilter === "all" || e.role === roleFilter;
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? e.isActive : !e.isActive);
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (e.firstName?.toLowerCase().includes(q) ?? false) ||
      (e.lastName?.toLowerCase().includes(q) ?? false) ||
      (e.email?.toLowerCase().includes(q) ?? false) ||
      (e.phone?.includes(q) ?? false);
    return matchRole && matchStatus && matchSearch;
  });

  const fmtDate = (iso: string | null) => {
    if (!iso) return ar ? "لم يسجل الدخول" : "Never";
    try {
      return new Date(iso).toLocaleDateString(ar ? "ar-SA" : "en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return iso;
    }
  };

  if (isLoading) {
    return <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="bg-card rounded-2xl border border-card-border p-6 animate-pulse h-24" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{ar ? "إدارة الموظفين" : "Employees Management"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{ar ? "إدارة الموظفين وأدوارهم وصلاحياتهم" : "Manage staff members, roles and permissions"}</p>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => handleOpenDialog()} className="rounded-xl shrink-0">
            <Plus className="w-4 h-4 me-2" />
            {ar ? "إضافة موظف" : "Add Employee"}
          </Button>
        )}
      </div>

      <div className="bg-card rounded-2xl border border-card-border p-5 flex flex-wrap gap-4 items-center shadow-sm">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 absolute top-3 left-3 text-muted-foreground" />
          <Input
            placeholder={ar ? "بحث بالاسم أو البريد..." : "Search by name or email..."}
            className="rounded-xl ps-9 bg-background"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="w-full sm:w-auto flex gap-3">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[140px] rounded-xl bg-background">
              <SelectValue placeholder={ar ? "الدور" : "Role"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{ar ? "جميع الأدوار" : "All Roles"}</SelectItem>
              {["agent", "admin", "super_admin"].map(k => (
                <SelectItem key={k} value={k}>{ar ? ROLE_LABELS_AR[k] : k}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] rounded-xl bg-background">
              <SelectValue placeholder={ar ? "الحالة" : "Status"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{ar ? "جميع الحالات" : "All Statuses"}</SelectItem>
              <SelectItem value="active">{ar ? "نشط" : "Active"}</SelectItem>
              <SelectItem value="inactive">{ar ? "غير نشط" : "Inactive"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-card-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-start">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-start">{ar ? "الموظف" : "Employee"}</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-start">{ar ? "التواصل" : "Contact"}</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-start">{ar ? "الدور" : "Role"}</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-start">{ar ? "الصلاحيات" : "Permissions"}</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-start">{ar ? "آخر دخول" : "Last Login"}</th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-start">{ar ? "الحالة" : "Status"}</th>
                {isSuperAdmin && <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-start"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {!filtered?.length ? (
                <tr><td colSpan={isSuperAdmin ? 7 : 6} className="text-center py-16 text-muted-foreground">{ar ? "لا يوجد موظفين" : "No employees found"}</td></tr>
              ) : (
                filtered.map((emp) => {
                  const isAllPerms = emp.role === "admin" || emp.role === "super_admin";
                  return (
                    <tr key={emp.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0 overflow-hidden">
                            {emp.profilePhotoUrl
                              ? <img src={emp.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
                              : (emp.firstName?.[0] ?? emp.email?.[0] ?? "?").toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">{emp.firstName} {emp.lastName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5 text-muted-foreground text-xs">
                          {emp.phone && <span className="flex items-center gap-1.5" dir="ltr"><Phone className="h-3 w-3" />{emp.phone}</span>}
                          {emp.email && <span className="flex items-center gap-1.5" dir="ltr"><Mail className="h-3 w-3" />{emp.email}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${ROLE_COLORS[emp.role] || "bg-muted text-muted-foreground border-border"}`}>
                          {ar ? ROLE_LABELS_AR[emp.role] ?? emp.role : emp.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-[280px]">
                        {isAllPerms ? (
                          <span className="text-xs text-muted-foreground">{ar ? "جميع الصلاحيات" : "All permissions"}</span>
                        ) : emp.permissions?.length ? (
                          <div className="flex flex-wrap gap-1">
                            {emp.permissions.map(p => (
                              <span key={p} className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
                                {ar ? PERMISSION_LABELS_AR[p] ?? p : p}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs whitespace-nowrap">{fmtDate(emp.lastLoginAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={emp.isActive}
                            disabled={!isSuperAdmin}
                            onCheckedChange={() => handleToggleActive(emp)}
                          />
                          <span className={`text-xs font-medium ${emp.isActive ? "text-green-600" : "text-muted-foreground"}`}>
                            {emp.isActive ? (ar ? "نشط" : "Active") : (ar ? "غير نشط" : "Inactive")}
                          </span>
                        </div>
                      </td>
                      {isSuperAdmin && (
                        <td className="px-6 py-4 text-end">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(emp)} className="rounded-xl hover:bg-muted" title={ar ? "تعديل" : "Edit"}>
                              <Edit2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => { setPwDialogFor(emp); setNewPassword(""); }} className="rounded-xl hover:bg-muted" title={ar ? "إعادة تعيين كلمة المرور" : "Reset password"}>
                              <KeyRound className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(emp)} className="rounded-xl hover:bg-red-50" title={ar ? "حذف" : "Delete"}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[560px] rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingId ? (ar ? "تعديل بيانات الموظف" : "Edit Employee") : (ar ? "إضافة موظف جديد" : "Add New Employee")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-5 py-4">
            <div className="space-y-2">
              <Label>{ar ? "الاسم الأول" : "First Name"}</Label>
              <Input value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>{ar ? "الاسم الأخير" : "Last Name"}</Label>
              <Input value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} className="rounded-xl" />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>{ar ? "البريد الإلكتروني" : "Email"}</Label>
              <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="rounded-xl text-left" dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>{ar ? "رقم الهاتف" : "Phone"}</Label>
              <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="rounded-xl text-left" dir="ltr" />
            </div>
            {!editingId && (
              <div className="space-y-2">
                <Label>{ar ? "كلمة المرور" : "Password"}</Label>
                <Input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="rounded-xl text-left" dir="ltr" />
              </div>
            )}
            <div className="space-y-2">
              <Label>{ar ? "الدور" : "Role"}</Label>
              <Select value={formData.role} onValueChange={v => setFormData({ ...formData, role: v as typeof formData.role })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["agent", "admin", "super_admin"].map(k => (
                    <SelectItem key={k} value={k}>{ar ? ROLE_LABELS_AR[k] : k}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{ar ? "الحزمة الجاهزة" : "Preset"}</Label>
              <Select value={formData.preset} onValueChange={applyPreset}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["visa_employee", "support_employee", "flight_employee", "hotel_employee", "custom"].map(k => (
                    <SelectItem key={k} value={k}>{ar ? PRESET_LABELS_AR[k] : k}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editingId && (
              <div className="space-y-2 col-span-2 flex items-center justify-between bg-muted/40 rounded-2xl px-4 py-3">
                <Label className="font-semibold">{ar ? "الحساب نشط" : "Active"}</Label>
                <Switch checked={formData.isActive} onCheckedChange={v => setFormData({ ...formData, isActive: v })} />
              </div>
            )}
            <div className="col-span-2 space-y-3">
              <Label className="font-semibold">{ar ? "الصلاحيات" : "Permissions"}</Label>
              <div className="grid grid-cols-2 gap-3">
                {PERMISSION_KEYS.map(key => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer text-sm">
                    <Checkbox
                      checked={formData.permissions.includes(key)}
                      onCheckedChange={() => togglePermission(key)}
                    />
                    <span>{ar ? PERMISSION_LABELS_AR[key] : key}</span>
                  </label>
                ))}
              </div>
              {(formData.role === "admin" || formData.role === "super_admin") && (
                <p className="text-xs text-muted-foreground">
                  {ar ? "ملاحظة: المدير والمدير العام يملكان جميع الصلاحيات تلقائياً." : "Note: admin & super admin roles have all permissions automatically."}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleSave} className="rounded-xl" disabled={createMutation.isPending || updateMutation.isPending}>
              {ar ? "حفظ البيانات" : "Save Details"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog open={!!pwDialogFor} onOpenChange={(o) => { if (!o) setPwDialogFor(null); }}>
        <DialogContent className="sm:max-w-[420px] rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{ar ? "إعادة تعيين كلمة المرور" : "Reset Password"}</DialogTitle>
            <DialogDescription>
              {pwDialogFor ? `${pwDialogFor.firstName ?? ""} ${pwDialogFor.lastName ?? ""}`.trim() || pwDialogFor.email : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label>{ar ? "كلمة المرور الجديدة" : "New Password"}</Label>
            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="rounded-xl text-left" dir="ltr" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwDialogFor(null)} className="rounded-xl">{ar ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={handleResetPassword} className="rounded-xl" disabled={updateMutation.isPending || newPassword.length < 8}>
              {ar ? "تعيين" : "Set Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-[420px] rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{ar ? "حذف الموظف" : "Delete Employee"}</DialogTitle>
            <DialogDescription>
              {ar
                ? `هل أنت متأكد من حذف ${`${deleteTarget?.firstName ?? ""} ${deleteTarget?.lastName ?? ""}`.trim() || deleteTarget?.email || ""}؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete this employee? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="rounded-xl">{ar ? "إلغاء" : "Cancel"}</Button>
            <Button
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteMutation.isPending}
            >
              {ar ? "حذف" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
