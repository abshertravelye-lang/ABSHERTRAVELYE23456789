import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/hooks/use-translation";
import { Users, UserCheck, UserX, Phone, Mail, Shield } from "lucide-react";
import { useState } from "react";

interface UserRecord {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  role: "customer" | "agent" | "admin" | "super_admin";
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

function useAllUsers() {
  return useQuery<UserRecord[]>({
    queryKey: ["employees", "all"],
    queryFn: async () => {
      const token = localStorage.getItem("absher_admin_access_token");
      const res = await fetch("/api/employees?all=true", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return [];
      return res.json();
    },
  });
}

const ROLE_LABELS: Record<string, { ar: string; en: string; color: string }> = {
  customer:    { ar: "عميل",    en: "Customer",   color: "bg-blue-100 text-blue-700" },
  agent:       { ar: "وكيل",    en: "Agent",      color: "bg-teal-100 text-teal-700" },
  admin:       { ar: "مدير",    en: "Admin",      color: "bg-purple-100 text-purple-700" },
  super_admin: { ar: "مدير عام",en: "Super Admin",color: "bg-red-100 text-red-700" },
};

export default function CustomersAdmin() {
  const { language } = useTranslation();
  const ar = language === "ar";
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const { data: employees, isLoading } = useAllUsers();

  const filtered = employees?.filter(e => {
    const matchRole = roleFilter === "all" || e.role === roleFilter;
    const q = search.toLowerCase();
    const matchSearch = !q
      || (e.firstName?.toLowerCase().includes(q) ?? false)
      || (e.lastName?.toLowerCase().includes(q) ?? false)
      || (e.email?.toLowerCase().includes(q) ?? false)
      || (e.phone?.includes(q) ?? false);
    return matchRole && matchSearch;
  });

  if (isLoading) {
    return <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="bg-card rounded-2xl border h-16 animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-5">
      {/* Search + filter */}
      <div className="bg-card rounded-2xl border border-card-border p-5 flex flex-wrap gap-4 shadow-sm">
        <div className="flex-1 min-w-[200px]">
          <input
            placeholder={ar ? "بحث بالاسم أو البريد أو الهاتف..." : "Search by name, email or phone..."}
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "customer", "agent", "admin", "super_admin"].map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${roleFilter === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {r === "all" ? (ar ? "الكل" : "All") : (ar ? ROLE_LABELS[r]?.ar : ROLE_LABELS[r]?.en)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { role: "customer",   icon: Users,  color: "text-blue-600 bg-blue-50" },
          { role: "agent",      icon: Shield, color: "text-teal-600 bg-teal-50" },
          { role: "admin",      icon: Shield, color: "text-purple-600 bg-purple-50" },
          { role: "super_admin",icon: Shield, color: "text-red-600 bg-red-50" },
        ].map(({ role, icon: Icon, color }) => (
          <div key={role} className="bg-card rounded-2xl border border-card-border p-4 flex items-center gap-3 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}><Icon className="h-5 w-5" /></div>
            <div>
              <div className="text-2xl font-bold text-foreground">{employees?.filter(e => e.role === role).length ?? 0}</div>
              <div className="text-xs text-muted-foreground">{ar ? ROLE_LABELS[role]?.ar : ROLE_LABELS[role]?.en}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-card-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="text-start px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{ar ? "المستخدم" : "User"}</th>
                <th className="text-start px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{ar ? "التواصل" : "Contact"}</th>
                <th className="text-start px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{ar ? "الدور" : "Role"}</th>
                <th className="text-start px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{ar ? "الحالة" : "Status"}</th>
                <th className="text-start px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">{ar ? "تاريخ الانضمام" : "Joined"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {!filtered?.length ? (
                <tr><td colSpan={5} className="text-center py-16 text-muted-foreground">{ar ? "لا يوجد مستخدمون" : "No users found"}</td></tr>
              ) : (
                filtered.map(emp => (
                  <tr key={emp.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0">
                          {(emp.firstName?.[0] ?? emp.email?.[0] ?? "?").toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">
                            {emp.firstName ? `${emp.firstName} ${emp.lastName ?? ""}`.trim() : (ar ? "غير محدد" : "Not set")}
                          </div>
                          <div className="text-xs text-muted-foreground truncate max-w-[160px]">{emp.email ?? emp.phone ?? "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-muted-foreground text-xs">
                        {emp.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{emp.phone}</span>}
                        {emp.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3 shrink-0" /><span className="truncate max-w-[140px]">{emp.email}</span></span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_LABELS[emp.role]?.color ?? "bg-muted text-muted-foreground"}`}>
                        {ar ? ROLE_LABELS[emp.role]?.ar : ROLE_LABELS[emp.role]?.en}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {emp.isActive
                          ? <><UserCheck className="h-4 w-4 text-green-500" /><span className="text-green-600 text-xs font-medium">{ar ? "نشط" : "Active"}</span></>
                          : <><UserX className="h-4 w-4 text-red-400" /><span className="text-red-500 text-xs font-medium">{ar ? "غير نشط" : "Inactive"}</span></>
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {new Date(emp.createdAt).toLocaleDateString(ar ? "ar-SA" : "en-US")}
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
