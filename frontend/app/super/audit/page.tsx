import { SearchParamField } from "@/app/components/search-param-field";
import { API, type SearchParamsType } from "@/app/utils/api";
import { ShieldAlert } from "lucide-react";
import { AuditRow } from "./audit-row";

export default async function AuditLogsPage({searchParams}: SearchParamsType<{user: string, module: string}>) {
  const { user, module } = await searchParams;
  const { data, error } = await API.GET("/audit-logs/", {
    params: {query: {user, module}}
  });
  
  if (error) {
    return (
      <div dir="rtl" className="p-10 text-red-500 font-medium flex items-center justify-center min-h-screen">
        فشل في جلب سجل التدقيق من الخادم.
      </div>
    );
  }
  
  const logs = data || [];
  
  return (
    <main dir="rtl" className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-6 bg-slate-50/50 min-h-screen text-slate-900 font-sans">
      
      {/* الترويسة (Header) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <ShieldAlert size={28} />
            </div>
            سجل التدقيق (Audit Logs)
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            مراقبة شاملة وتتبع لكافة التعديلات، الحذف، والإجراءات الحساسة التي تتم داخل النظام.
          </p>
        </div>
      </div>

      {/* أدوات للبحث والفلترة */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
        <SearchParamField by="user" placeholder="ابحث عن اسم المستخدم..." />
        <SearchParamField
          by="module"
          type="select"
          selectOptions={[
            {
              label: "All",
              value: "",
            },
            {
              label: "Financials",
              value: "financials",
            },
            {
              label: "CRM",
              value: "crm",
            },
            {
              label: "HR",
              value: "hr",
            },
          ]}
        />
      </div>

      {/* جدول السجل */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold text-xs tracking-wider">
                <th className="p-4 w-20">ID</th>
                <th className="p-4">حساب المستخدم (المُعدِّل)</th>
                <th className="p-4">اسم المستخدم (المُعدِّل)</th>
                <th className="p-4">القسم</th>
                <th className="p-4">الإجراء المُسجل</th>
                <th className="p-4">التاريخ والوقت</th>
                <th className="p-4 text-left">مراجعة البيانات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-500">
                    لا توجد أي نشاطات مسجلة في النظام حتى الآن.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <AuditRow key={log.id} log={log} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}