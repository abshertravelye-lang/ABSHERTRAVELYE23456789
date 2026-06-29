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
    return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-6 py-1"><div className="h-40 bg-slate-200 rounded"></div><div className="h-64 bg-slate-200 rounded"></div></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-sm border-l-4 border-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{language === 'ar' ? 'إجمالي الحجوزات' : 'Total Bookings'}</p>
                <h3 className="text-3xl font-bold text-slate-800">{stats?.totalBookings || 0}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                <Ticket size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm border-l-4 border-amber-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</p>
                <h3 className="text-3xl font-bold text-slate-800">{stats?.pendingBookings || 0}</h3>
              </div>
              <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center">
                <Clock size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm border-l-4 border-emerald-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{language === 'ar' ? 'مؤكدة' : 'Confirmed'}</p>
                <h3 className="text-3xl font-bold text-slate-800">{stats?.confirmedBookings || 0}</h3>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                <CheckCircle size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm border-l-4 border-rose-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{language === 'ar' ? 'رسائل جديدة' : 'New Messages'}</p>
                <h3 className="text-3xl font-bold text-slate-800">{stats?.unreadMessages || 0}</h3>
              </div>
              <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center">
                <MessageSquare size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-lg font-bold text-slate-800">{language === 'ar' ? 'أحدث الحجوزات' : 'Recent Bookings'}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 rtl:text-right">ID</th>
                  <th className="px-6 py-4 rtl:text-right">{language === 'ar' ? 'العميل' : 'Client'}</th>
                  <th className="px-6 py-4 rtl:text-right">{language === 'ar' ? 'النوع' : 'Type'}</th>
                  <th className="px-6 py-4 rtl:text-right">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                  <th className="px-6 py-4 rtl:text-right">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentBookings && recentBookings.length > 0 ? (
                  recentBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">#{booking.id}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{booking.clientName}</div>
                        <div className="text-xs text-slate-500" dir="ltr">{booking.clientPhone}</div>
                      </td>
                      <td className="px-6 py-4 uppercase tracking-wider text-xs font-semibold text-slate-600">{booking.type}</td>
                      <td className="px-6 py-4 text-slate-500">{new Date(booking.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <Badge 
                          variant={booking.status === 'confirmed' ? 'default' : booking.status === 'pending' ? 'secondary' : 'destructive'}
                          className={
                            booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' :
                            booking.status === 'pending' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' : ''
                          }
                        >
                          {booking.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
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
