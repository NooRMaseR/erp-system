import { Users, Clock, CalendarDays, MoreVertical, ShieldCheck, UserPlus } from "lucide-react";
import { SearchParamField } from "@/app/components/search-param-field";
import { API, type SearchParamsType } from "@/app/utils/api";
import ProcessPayrollButton from "./ProcessPayrollButton";
import Link from "next/link";

const statusTranslation = {
  PRESENT: "حاضر",
  LATE: "متأخر",
  LEAVE: "في إجازة",
  ABSENT: "غائب"
} as const;

export default async function HRDashboardPage({ searchParams }: SearchParamsType<{ user: string }>) {
  const { user } = await searchParams;
  const { data, error } = await API.GET("/hr/dashboard/", {
    params: { query: { user } }
  });

  if (error || !data) {
    return (
      <div dir="rtl" className="p-10 flex items-center justify-center min-h-screen text-red-500 font-medium">
        فشل في تحميل بيانات الموارد البشرية. الرجاء المحاولة لاحقاً.
      </div>
    );
  }

  const { totalEmployees, presentToday, onLeave, absentToday, employees } = data;

  const todayDate = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <main dir="rtl" className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8 bg-slate-50/50 min-h-screen text-slate-900 font-sans">

      {/* قسم الترويسة (Header) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">الموارد البشرية</h1>
          <p className="text-slate-500 text-sm mt-1">إدارة شؤون الموظفين، الحضور اليومي، وتجهيز الرواتب.</p>
        </div>
        <div className="flex gap-3">

          {/* زر معالجة الرواتب (مكون منفصل) */}
          <ProcessPayrollButton />

          <Link href="/super/hr/new" className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm px-4 py-2 rounded-lg shadow-sm transition-colors">
            <UserPlus size={16} /> إضافة موظف
          </Link>
        </div>
      </div>

      {/* بطاقات الإحصائيات (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-400 tracking-wider">إجمالي الموظفين</span>
            <Users className="text-blue-500" size={16} />
          </div>
          <div className="text-2xl font-bold tracking-tight">{totalEmployees}</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-400 tracking-wider">الحضور اليوم</span>
            <ShieldCheck className="text-emerald-500" size={16} />
          </div>
          <div className="text-2xl font-bold tracking-tight">{presentToday}</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-400 tracking-wider">في إجازة</span>
            <CalendarDays className="text-amber-500" size={16} />
          </div>
          <div className="text-2xl font-bold tracking-tight">{onLeave}</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-400 tracking-wider">الغياب</span>
            <Clock className="text-red-500" size={16} />
          </div>
          <div className="text-2xl font-bold tracking-tight">{absentToday}</div>
        </div>
      </div>

      {/* شريط البحث */}
      <div className="flex bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
        <SearchParamField by="user" placeholder="البحث بأسم الموظف..." />
      </div>

      {/* جدول بيانات الموظفين والحضور */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">سجل الحضور والغياب اليوم</h2>
          <p className="text-xs text-slate-400 mt-0.5">عرض مباشر لحالة الموظفين ليوم {todayDate}.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-xs tracking-wider">
                <th className="p-4">بيانات الموظف</th>
                <th className="p-4">القسم</th>
                <th className="p-4">الرقم القومي</th>
                <th className="p-4">حالة اليوم</th>
                <th className="p-4">وقت الحضور</th>
                <th className="p-4 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    لا يوجد موظفين مسجلين.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">

                    {/* بيانات الموظف */}
                    <td className="p-4">
                      <div className="flex flex-col">
                        <div className="font-semibold text-slate-900">{emp.fullName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{emp.email}</div>
                      </div>
                    </td>

                    {/* القسم والمسمى الوظيفي */}
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800">{emp.department}</span>
                        <span className="text-xs text-slate-400">{emp.position}</span>
                      </div>
                    </td>

                    {/* الرقم القومي */}
                    <td className="p-4 font-mono text-slate-600 text-xs tracking-wider">
                      {emp.nationalId}
                    </td>

                    {/* حالة الحضور */}
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider ${emp.todayStatus === "PRESENT" ? "bg-emerald-100 text-emerald-700" :
                          emp.todayStatus === "LATE" ? "bg-amber-100 text-amber-700" :
                            emp.todayStatus === "LEAVE" ? "bg-blue-100 text-blue-700" :
                              "bg-red-100 text-red-700"
                        }`}>
                        {statusTranslation[emp.todayStatus] || emp.todayStatus}
                      </span>
                    </td>

                    {/* وقت الدخول */}
                    <td className="p-4 font-medium text-slate-700 dir-ltr text-right">
                      {emp.clockIn ? emp.clockIn : <span className="text-slate-300">--:--</span>}
                    </td>

                    {/* الإجراءات */}
                    <td className="p-4 text-left">
                      <button className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-100 transition-colors">
                        <MoreVertical size={16} />
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}