import { useTranslation } from "@/hooks/use-translation";
import { useAuth } from "@/hooks/use-auth";
import {
  useListVisaApplications, useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead,
  VisaApplication, Notification as ApiNotification,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Bell, User, CheckCheck, Circle } from "lucide-react";

const STATUS_ORDER = [
  "received", "under_review", "awaiting_documents", "documents_uploaded",
  "sent_to_embassy", "processing", "issued", "completed",
];

const STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  received: { ar: "تم الاستلام", en: "Received" },
  under_review: { ar: "قيد المراجعة", en: "Under review" },
  awaiting_documents: { ar: "بانتظار مستندات", en: "Awaiting documents" },
  documents_uploaded: { ar: "تم رفع المستندات", en: "Documents uploaded" },
  sent_to_embassy: { ar: "أُرسل للسفارة", en: "Sent to embassy" },
  processing: { ar: "قيد المعالجة", en: "Processing" },
  issued: { ar: "تم الإصدار", en: "Issued" },
  completed: { ar: "مكتمل", en: "Completed" },
  rejected: { ar: "مرفوض", en: "Rejected" },
};

function StatusStepper({ status, language }: { status: string; language: string }) {
  const ar = language === "ar";
  if (status === "rejected") {
    return <Badge variant="destructive">{ar ? STATUS_LABELS.rejected.ar : STATUS_LABELS.rejected.en}</Badge>;
  }
  const currentIndex = STATUS_ORDER.indexOf(status);
  return (
    <div className="flex items-center flex-wrap gap-1.5">
      {STATUS_ORDER.map((s, i) => (
        <div key={s} className={`text-xs px-2.5 py-1 rounded-full font-medium ${i <= currentIndex ? "bg-primary text-white" : "bg-slate-100 text-slate-400"}`}>
          {ar ? STATUS_LABELS[s].ar : STATUS_LABELS[s].en}
        </div>
      ))}
    </div>
  );
}

function ApplicationCard({ app, language }: { app: VisaApplication; language: string }) {
  const ar = language === "ar";
  return (
    <Card className="border border-slate-200 rounded-xl">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-slate-800">{ar ? "طلب رقم" : "Application"} #{app.id}</div>
          <div className="text-xs text-slate-400">{new Date(app.createdAt).toLocaleDateString()}</div>
        </div>
        <div className="text-sm text-slate-500">{app.fullName} · {app.nationality}</div>
        <StatusStepper status={app.status} language={language} />
      </CardContent>
    </Card>
  );
}

function NotificationRow({ n, language, onRead }: { n: ApiNotification; language: string; onRead: (id: string) => void }) {
  const ar = language === "ar";
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${n.isRead ? "border-slate-100 bg-white" : "border-primary/20 bg-primary/5"}`}>
      {!n.isRead ? <Circle className="h-2 w-2 mt-1.5 fill-primary text-primary shrink-0" /> : <div className="w-2 shrink-0" />}
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

export default function Account() {
  const { language } = useTranslation();
  const { user } = useAuth();
  const ar = language === "ar";

  const { data: applications, isLoading: appsLoading } = useListVisaApplications();
  const { data: notifications, isLoading: notifsLoading } = useListNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold shrink-0">
            {(user?.firstName?.[0] ?? user?.email?.[0] ?? "U").toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{user?.firstName ? `${user.firstName} ${user.lastName ?? ""}` : (ar ? "حسابي" : "My Account")}</h1>
            <p className="text-slate-500 text-sm">{user?.email ?? user?.phone}</p>
          </div>
        </div>

        <Tabs defaultValue="requests">
          <TabsList className="bg-white border mb-6">
            <TabsTrigger value="requests" className="gap-2"><FileText size={16} />{ar ? "طلباتي" : "My Requests"}</TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell size={16} />{ar ? "الإشعارات" : "Notifications"}
              {unreadCount > 0 && <Badge className="ml-1 rtl:mr-1 rtl:ml-0 bg-accent text-primary">{unreadCount}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-3">
            {appsLoading && <div className="text-slate-400 text-center py-10">{ar ? "جاري التحميل..." : "Loading..."}</div>}
            {!appsLoading && (applications?.length ?? 0) === 0 && (
              <div className="text-center py-16 text-slate-400">
                <FileText className="mx-auto h-10 w-10 mb-3" />
                {ar ? "لا توجد طلبات تأشيرة بعد" : "No visa applications yet"}
              </div>
            )}
            {applications?.map((app) => <ApplicationCard key={app.id} app={app} language={language} />)}
          </TabsContent>

          <TabsContent value="notifications" className="space-y-3">
            {(notifications?.length ?? 0) > 0 && (
              <div className="flex justify-end">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => markAllRead.mutate()}>
                  <CheckCheck size={14} /> {ar ? "تحديد الكل كمقروء" : "Mark all as read"}
                </Button>
              </div>
            )}
            {notifsLoading && <div className="text-slate-400 text-center py-10">{ar ? "جاري التحميل..." : "Loading..."}</div>}
            {!notifsLoading && (notifications?.length ?? 0) === 0 && (
              <div className="text-center py-16 text-slate-400">
                <Bell className="mx-auto h-10 w-10 mb-3" />
                {ar ? "لا توجد إشعارات" : "No notifications"}
              </div>
            )}
            {notifications?.map((n) => (
              <NotificationRow key={n.id} n={n} language={language} onRead={(id) => markRead.mutate({ id })} />
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
