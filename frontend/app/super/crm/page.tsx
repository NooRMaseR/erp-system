import { Building2, Mail, Phone, MoreVertical, Plus } from "lucide-react";
import { SearchParamField } from "@/app/components/search-param-field";
import { API, type SearchParamsType } from "@/app/utils/api";
import Link from "next/link";

const statusTranslation = {
  ACTIVE: "نشط",
  INACTIVE: "غير نشط"
} as const;

export default async function CrmPage({ searchParams }: SearchParamsType<{ company: string }>) {
  const { company } = await searchParams;
  const { data: clients, error } = await API.GET("/crm/clients/", {
    params: {query: {company}}
  });

  if (error) {
    return (
      <div dir="rtl" className="p-10 flex items-center justify-center min-h-screen text-red-500 font-medium">
        فشل في مزامنة بيانات العملاء من الخادم.
      </div>
    );
  }

  const clientList = clients || [];

  return (
    <main dir="rtl" className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8 bg-slate-50/50 min-h-screen text-slate-900 font-sans">
      
      {/* قسم الترويسة */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">دليل العملاء</h1>
          <p className="text-slate-500 text-sm mt-1">إدارة عقود الشركات، تفاصيل التواصل، وفترات التعاقد.</p>
        </div>
        <Link href="/super/crm/new" className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm px-4 py-2.5 rounded-lg shadow-sm transition-colors">
          <Plus size={16} /> إضافة عميل جديد
        </Link>
      </div>

      {/* شريط البحث */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
        <SearchParamField by="company" placeholder="البحث بأسم الشركه" />
      </div>

      {/* جدول بيانات العملاء */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold text-xs tracking-wider">
                <th className="p-4">ملف الشركة</th>
                <th className="p-4">جهة التواصل</th>
                <th className="p-4">حالة الحساب</th>
                <th className="p-4">مدة التعاقد</th>
                <th className="p-4 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {clientList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    لا يوجد عملاء مسجلين في النظام.
                  </td>
                </tr>
              ) : (
                clientList.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                    
                    {/* ملف الشركة والبطاقة الضريبية */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                          <Building2 size={18} />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{client.companyName}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            الرقم الضريبي: <span className="font-medium text-slate-600 font-mono tracking-wider">{client.taxRegistration}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* بيانات التواصل */}
                    <td className="p-4">
                      <div className="flex flex-col gap-2 text-xs">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mail size={14} className="text-slate-400 shrink-0" />
                          <a href={`mailto:${client.contactEmail}`} className="hover:text-teal-600 hover:underline" dir="ltr">
                            {client.contactEmail}
                          </a>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone size={14} className="text-slate-400 shrink-0" />
                          <span dir="ltr">{client.phone}</span>
                        </div>
                      </div>
                    </td>

                    {/* حالة الحساب */}
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider ${
                        client.status === "ACTIVE" 
                          ? "bg-emerald-100 text-emerald-700" 
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {statusTranslation[client.status] || client.status}
                      </span>
                    </td>

                    {/* مدة التعاقد (Lifespan) */}
                    <td className="p-4">
                      <div className="font-medium text-slate-900">{client.daysActive} يوم</div>
                      <div className="text-xs text-slate-400 mt-0.5" dir="rtl">
                        منذ {client.registeredDate}
                      </div>
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