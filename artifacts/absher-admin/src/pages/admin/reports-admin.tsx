import { useTranslation } from "@/hooks/use-translation";
import { useGetDashboardStats, useGetRecentBookings, useListVisaApplications } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Download, TrendingUp, Users, FileText, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const MONTHLY_REVENUE = [
  { nameAr: "يناير", nameEn: "Jan", total: 45000 },
  { nameAr: "فبراير", nameEn: "Feb", total: 52000 },
  { nameAr: "مارس", nameEn: "Mar", total: 48000 },
  { nameAr: "أبريل", nameEn: "Apr", total: 61000 },
  { nameAr: "مايو", nameEn: "May", total: 59000 },
  { nameAr: "يونيو", nameEn: "Jun", total: 72000 },
  { nameAr: "يوليو", nameEn: "Jul", total: 85000 },
  { nameAr: "أغسطس", nameEn: "Aug", total: 91000 },
  { nameAr: "سبتمبر", nameEn: "Sep", total: 87000 },
  { nameAr: "أكتوبر", nameEn: "Oct", total: 65000 },
  { nameAr: "نوفمبر", nameEn: "Nov", total: 54000 },
  { nameAr: "ديسمبر", nameEn: "Dec", total: 68000 },
];

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function ReportsAdmin() {
  const { language } = useTranslation();
  const ar = language === "ar";

  const { data: stats } = useGetDashboardStats();
  const { data: recentBookings } = useGetRecentBookings({ limit: 5 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: visaApps } = useListVisaApplications({ limit: 5 } as any);

  const handleExport = () => {
    toast.info(ar ? "قريباً - سيتم تصدير التقرير" : "Coming Soon - Exporting report");
  };

  const bookingData = [
    { name: ar ? "طيران" : "Flight", value: 35 },
    { name: ar ? "فندق" : "Hotel", value: 25 },
    { name: ar ? "برامج" : "Programs", value: 20 },
    { name: ar ? "تأشيرات" : "Visas", value: 20 },
  ];

  const chartConfig = {
    total: {
      label: ar ? "الإيرادات" : "Revenue",
      color: "hsl(var(--primary))"
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{ar ? "التقارير والإحصائيات" : "Reports & Analytics"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{ar ? "نظرة شاملة على أداء المبيعات والنشاط" : "Comprehensive overview of sales and activity"}</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="rounded-xl border-primary/20 text-primary hover:bg-primary/5">
          <Download className="w-4 h-4 me-2" />
          {ar ? "تصدير التقرير" : "Export Report"}
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl border border-card-border p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">+12%</Badge>
          </div>
          <p className="text-sm font-semibold text-muted-foreground mb-1">{ar ? "إجمالي الإيرادات" : "Total Revenue"}</p>
          <h3 className="text-2xl font-extrabold tabular-nums">SAR 787,000</h3>
        </div>
        
        <div className="bg-card rounded-2xl border border-card-border p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">+5%</Badge>
          </div>
          <p className="text-sm font-semibold text-muted-foreground mb-1">{ar ? "حجوزات هذا الشهر" : "Bookings This Month"}</p>
          <h3 className="text-2xl font-extrabold tabular-nums">{stats?.totalBookings || 124}</h3>
        </div>

        <div className="bg-card rounded-2xl border border-card-border p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">+18%</Badge>
          </div>
          <p className="text-sm font-semibold text-muted-foreground mb-1">{ar ? "طلبات التأشيرة" : "Visa Applications"}</p>
          <h3 className="text-2xl font-extrabold tabular-nums">85</h3>
        </div>

        <div className="bg-card rounded-2xl border border-card-border p-5 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <Badge variant="outline" className="bg-muted text-muted-foreground">0%</Badge>
          </div>
          <p className="text-sm font-semibold text-muted-foreground mb-1">{ar ? "العملاء النشطين" : "Active Customers"}</p>
          <h3 className="text-2xl font-extrabold tabular-nums">1,240</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="col-span-1 lg:col-span-2 rounded-2xl border-card-border shadow-sm">
          <CardHeader>
            <CardTitle>{ar ? "إيرادات العام" : "Annual Revenue"}</CardTitle>
            <CardDescription>{ar ? "تحليل الإيرادات الشهرية بالريال السعودي" : "Monthly revenue analysis in SAR"}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={MONTHLY_REVENUE} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey={ar ? "nameAr" : "nameEn"} 
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v / 1000}k`}
                  width={40}
                />
                <ChartTooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent />} />
                <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Donut Chart */}
        <Card className="rounded-2xl border-card-border shadow-sm">
          <CardHeader>
            <CardTitle>{ar ? "توزيع الحجوزات" : "Bookings Distribution"}</CardTitle>
            <CardDescription>{ar ? "نسبة المبيعات حسب النوع" : "Sales ratio by type"}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bookingData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {bookingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  formatter={(value: number) => [`${value}%`]}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings Summary */}
        <Card className="rounded-2xl border-card-border shadow-sm">
          <CardHeader>
            <CardTitle>{ar ? "أحدث الحجوزات" : "Recent Bookings"}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentBookings?.map(b => (
                <div key={b.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="font-semibold text-sm">{b.clientName}</p>
                    <p className="text-xs text-muted-foreground">{new Date(b.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge variant="outline" className="bg-muted text-muted-foreground">{b.type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Visa Apps Summary */}
        <Card className="rounded-2xl border-card-border shadow-sm">
          <CardHeader>
            <CardTitle>{ar ? "حالة التأشيرات" : "Visa Applications Status"}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {visaApps?.slice(0,5).map(v => (
                <div key={v.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <p className="font-semibold text-sm">{(v as any).applicantName ?? v.fullName ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">ID: #{v.id}</p>
                  </div>
                  <Badge 
                    className={
                      (v.status === 'issued' || v.status === 'completed') ? 'bg-emerald-100 text-emerald-800' :
                      v.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-amber-100 text-amber-800'
                    }
                  >
                    {v.status}
                  </Badge>
                </div>
              ))}
              {(!visaApps || visaApps.length === 0) && (
                <div className="p-8 text-center text-muted-foreground">{ar ? "لا توجد طلبات" : "No applications"}</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
