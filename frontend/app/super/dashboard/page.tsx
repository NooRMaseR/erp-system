import { Users, TrendingUp, Wallet, AlertCircle } from "lucide-react";
import { DashboardChart } from "./dashboard-charts";
import { API } from "@/app/utils/api";

export default async function DashboardPage() {
  const { data, error } = await API.GET("/dashboard/");

  if (error) {
    return (
      <div dir="rtl" className="flex-1 p-10 flex items-center justify-center min-h-screen text-red-500 font-medium">
        تعذر تحميل إحصائيات لوحة القيادة.
      </div>
    );
  }

  const stats = data;

  return (
    <main dir="rtl" className="flex-1 p-4 sm:p-6 md:p-10 max-w-7xl mx-auto w-full space-y-6 md:space-y-8 bg-slate-50/50 min-h-screen text-slate-900 font-sans">
      
      {/* الترويسة */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">نظرة عامة</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">ملخص الأداء المالي والمؤشرات الرئيسية للشركة.</p>
      </div>

      {/* شبكة المؤشرات (KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* الإيرادات */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp size={22} />
            </div>
          </div>
          <div>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">الإيرادات المحصلة</p>
            <h3 className="text-xl sm:text-2xl font-bold font-mono mt-1 text-slate-800">
              {stats?.totalRevenue?.toLocaleString()} <span className="text-xs text-slate-400 font-sans">ج.م</span>
            </h3>
          </div>
        </div>

        {/* المستحقات */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <AlertCircle size={22} />
            </div>
          </div>
          <div>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">مستحقات متأخرة</p>
            <h3 className="text-xl sm:text-2xl font-bold font-mono mt-1 text-slate-800">
              {stats?.pendingReceivables?.toLocaleString()} <span className="text-xs text-slate-400 font-sans">ج.م</span>
            </h3>
          </div>
        </div>

        {/* الرواتب */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
              <Wallet size={22} />
            </div>
          </div>
          <div>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">إجمالي الرواتب المصروفة</p>
            <h3 className="text-xl sm:text-2xl font-bold font-mono mt-1 text-slate-800">
              {stats?.totalPayroll?.toLocaleString()} <span className="text-xs text-slate-400 font-sans">ج.م</span>
            </h3>
          </div>
        </div>

        {/* العملاء */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users size={22} />
            </div>
          </div>
          <div>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">العملاء النشطين</p>
            <h3 className="text-xl sm:text-2xl font-bold font-mono mt-1 text-slate-800">
              {stats?.activeClients} <span className="text-xs text-slate-400 font-sans">عميل</span>
            </h3>
          </div>
        </div>

      </div>

      {/* قسم الرسم البياني */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <h2 className="font-bold text-slate-800 text-sm sm:text-base border-b border-slate-100 pb-4">
          الإيرادات مقابل الرواتب (آخر 6 أشهر)
        </h2>
        
        {/* استدعاء الـ Client Component هنا */}
        <DashboardChart data={stats?.chartData || []} />
      </div>

    </main>
  );
}