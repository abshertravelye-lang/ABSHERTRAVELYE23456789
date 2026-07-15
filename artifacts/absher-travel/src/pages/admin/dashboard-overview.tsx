import { useTranslation } from "@/hooks/use-translation";
import { useGetDashboardStats, useGetRecentBookings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, Clock, CheckCircle, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function DashboardOverview() {
  const { language } = useTranslation();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: recentBookings, isLoading: bookingsLoading } = useGetRecentBookings({ limit: 5 });

  if (statsLoading || bookingsLoading) {
    return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-6 py-1"><div className="h-40 bg-slate-200 rounded-2xl"></div><div className="h-64 bg-slate-200 rounded-2xl"></div></div></div>;
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
          <div className="h-1.5 w-full bg-blue-500"></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">{language === 'ar' ? 'إجمالي الحجوزات' : 'Total Bookings'}</p>
                <h3 className="text-4xl font-extrabold text-slate-900 tabular-nums">{stats?.totalBookings || 0}</h3>
              </div>
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Ticket size={28} strokeWidth={2.5} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
          <div className="h-1.5 w-full bg-amber-500"></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</p>
                <h3 className="text-4xl font-extrabold text-slate-900 tabular-nums">{stats?.pendingBookings || 0}</h3>
              </div>
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                <Clock size={28} strokeWidth={2.5} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
          <div className="h-1.5 w-full bg-emerald-500"></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">{language === 'ar' ? 'مؤكدة' : 'Confirmed'}</p>
                <h3 className="text-4xl font-extrabold text-slate-900 tabular-nums">{stats?.confirmedBookings || 0}</h3>
              </div>
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                <CheckCircle size={28} strokeWidth={2.5} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
          <div className="h-1.5 w-full bg-rose-500"></div>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">{language === 'ar' ? 'رسائل جديدة' : 'New Messages'}</p>
                <h3 className="text-4xl font-extrabold text-slate-900 tabular-nums">{stats?.unreadMessages || 0}</h3>
              </div>
              <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                <MessageSquare size={28} strokeWidth={2.5} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings Table */}
      <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-5">
          <CardTitle className="text-xl font-bold text-slate-900">{language === 'ar' ? 'أحدث الحجوزات' : 'Recent Bookings'}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left rtl:text-right">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-xs font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">{language === 'ar' ? 'العميل' : 'Client'}</th>
                  <th className="px-6 py-4">{language === 'ar' ? 'النوع' : 'Type'}</th>
                  <th className="px-6 py-4">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                  <th className="px-6 py-4">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {recentBookings && recentBookings.length > 0 ? (
                  recentBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900 tabular-nums">#{booking.id}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 mb-0.5">{booking.clientName}</div>
                        <div className="text-xs font-medium text-slate-500 tabular-nums" dir="ltr">{booking.clientPhone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="uppercase tracking-wider text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">{booking.type}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium tabular-nums">{new Date(booking.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <Badge 
                          variant={booking.status === 'confirmed' ? 'default' : booking.status === 'pending' ? 'secondary' : 'destructive'}
                          className={
                            booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200 px-3' :
                            booking.status === 'pending' ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200 px-3' : 'px-3'
                          }
                        >
                          {booking.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium text-base">
                      {language === 'ar' ? 'لا توجد حجوزات حديثة' : 'No recent bookings'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
