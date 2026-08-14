import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { useTranslation } from "@/hooks/use-translation";
import { ROLE_LABELS_AR } from "./permissions";
import { ScrollText } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  newValue: unknown;
  ipAddress: string | null;
  createdAt: string;
  userId: string | null;
  userEmail: string | null;
  userFirstName: string | null;
  userLastName: string | null;
  userRole: string | null;
}

const ACTION_LABELS_AR: Record<string, string> = {
  "auth.login": "تسجيل دخول",
  "auth.login_failed": "محاولة دخول فاشلة",
  "auth.logout": "تسجيل خروج",
  "employee.created": "إنشاء موظف",
  "employee.updated": "تحديث موظف",
  "employee.deactivated": "تعطيل موظف",
  "employee.deleted": "حذف موظف",
  "employee.permissions_changed": "تغيير صلاحيات",
  "settings.app_links_updated": "تحديث روابط التطبيق",
  "visa_application.status_changed": "تغيير حالة طلب",
};

function useAuditLogs() {
  return useQuery<AuditLog[]>({
    queryKey: ["audit-logs"],
    queryFn: () => customFetch<AuditLog[]>(`/api/audit-logs?limit=100`, { method: "GET" }),
  });
}

export default function AuditLogsAdmin() {
  const { language } = useTranslation();
  const ar = language === "ar";
  const { data: logs, isLoading } = useAuditLogs();

  const fmtDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(ar ? "ar-SA" : "en-US", {
        year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const actionLabel = (a: string) => (ar ? ACTION_LABELS_AR[a] ?? a : a);

  const userName = (l: AuditLog) => {
    const name = [l.userFirstName, l.userLastName].filter(Boolean).join(" ").trim();
    return name || l.userEmail || "—";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{ar ? "سجل النشاط" : "Audit Log"}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {ar ? "أحدث العمليات والإجراءات على النظام" : "Most recent actions performed on the system"}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3, 4, 5].map(i => <div key={i} className="bg-card rounded-2xl border h-14 animate-pulse" />)}</div>
      ) : !logs?.length ? (
        <div className="bg-card rounded-3xl border border-card-border p-16 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <ScrollText className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">{ar ? "لا يوجد نشاط مسجل" : "No activity recorded"}</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-card-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-start">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-start">{ar ? "الإجراء" : "Action"}</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-start">{ar ? "المستخدم" : "User"}</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-start">{ar ? "عنوان IP" : "IP Address"}</th>
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-start">{ar ? "التوقيت" : "Timestamp"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-foreground">{actionLabel(l.action)}</span>
                      {l.entityType && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {l.entityType}{l.entityId ? ` #${l.entityId}` : ""}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{userName(l)}</div>
                      {l.userRole && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {ar ? ROLE_LABELS_AR[l.userRole] ?? l.userRole : l.userRole}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground" dir="ltr">{l.ipAddress || "—"}</td>
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">{fmtDate(l.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
