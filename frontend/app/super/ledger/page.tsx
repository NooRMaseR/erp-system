import { SearchParamField } from "@/app/components/search-param-field";
import { API, type SearchParamsType } from "@/app/utils/api";
import { Download, DollarSign, Wallet } from "lucide-react";
import type { components } from "@/app/generated/schema";
import { PayrollRow } from "./payrollRow";
import { LedgerRow } from "./ledgerRow";
import Link from "next/link";

type LedgerType = components["schemas"]["LedgerItem"];
type PayrollType = components["schemas"]["PayrollLedgerSerializer"];

export default async function LedgerPage({searchParams}: SearchParamsType<{ inv?: string; client?: string; status?: string; tab?: string }>) {
  const { inv, client, status, tab } = await searchParams;

  const activeTab = tab === "payroll" ? "payroll" : "invoices";

  let records: PayrollType[] | LedgerType[] = [];
  let fetchError = false;

  if (activeTab === "invoices") {
    const { data, error } = await API.GET("/ledger/", {
      params: { query: { inv, client, status } },
    });
    if (error) fetchError = true;
    else records = data || [];
  } else {
    const { data, error } = await API.GET("/ledger/payrolls/");
    if (error) fetchError = true;
    else records = data || [];
  }

  if (fetchError) {
    return <div dir="rtl" className="p-6 sm:p-10 text-red-500 font-medium">فشل في جلب السجل المالي من الخادم.</div>;
  }

  return (
    <div dir="rtl" className="p-4 sm:p-6 md:p-10 max-w-7xl mx-auto w-full space-y-4 sm:space-y-6 flex-1 min-h-screen bg-slate-50/50 font-sans">

      {/* قسم الترويسة */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-0">
        <div className="w-full lg:w-auto">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">السجل المالي العام</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">إدارة الفواتير، مسيرات الرواتب، والامتثال الضريبي.</p>
        </div>

        {/* أزرار الإجراءات - تمكين الـ wrap للموبايل */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
          <button className="flex-1 lg:flex-none justify-center items-center gap-2 cursor-not-allowed bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg shadow-sm transition-colors flex">
            <Download size={16} /> <span className="whitespace-nowrap">تصدير CSV</span>
          </button>

          <Link
            href="/super/ledger/create"
            className="flex-1 lg:flex-none justify-center bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg shadow-sm transition-colors inline-flex items-center whitespace-nowrap"
          >
            + إنشاء فاتورة
          </Link>

        </div>
      </div>

      {/* التبويبات (Tabs) - دعم التمرير الأفقي على الموبايل */}
      <div className="flex gap-4 sm:gap-6 border-b border-slate-200 overflow-x-auto scrollbar-hide pb-1" style={{ scrollbarWidth: 'none' }}>
        <Link
          href="?tab=invoices"
          className={`flex items-center gap-2 pb-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap shrink-0 ${activeTab === "invoices"
              ? "border-teal-600 text-teal-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
        >
          <DollarSign size={16} />
          الإيرادات وفواتير العملاء
        </Link>

        <Link
          href="?tab=payroll"
          className={`flex items-center gap-2 pb-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap shrink-0 ${activeTab === "payroll"
              ? "border-teal-600 text-teal-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
        >
          <Wallet size={16} />
          مصروفات الرواتب والأجور
        </Link>
      </div>

      {/* شريط التحكم (البحث والفلترة) */}
      {activeTab === "invoices" && (
        <div className="flex flex-col lg:flex-row justify-between gap-3 sm:gap-4 bg-white p-3 sm:p-4 rounded-xl border border-slate-200/60 shadow-sm w-full">
          <div className="w-full lg:w-auto flex-1">
            <SearchParamField by="inv" placeholder="ابحث برقم الفاتورة (مثال: INV-2026)..." />
          </div>
          <div className="w-full lg:w-auto">
            <SearchParamField
              type="select"
              by="status"
              selectOptions={[
                {
                  label: "جميع الحالات",
                  value: ""
                },
                {
                  label: "مسودات",
                  value: "DRAFT"
                },
                {
                  label: "مُرسلة للعميل",
                  value: "SENT"
                },
                {
                  label: "تم الدفع",
                  value: "PAID"
                },
                {
                  label: "ملغاة",
                  value: "CANCELLED"
                },
              ]}
            />
            
          </div>
        </div>
      )}

      {/* جدول السجل المالي */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden w-full relative">
        {/* التلميح البصري بوجود تمرير على الموبايل (اختياري، يظهر كظل خفيف) */}
        <div className="absolute top-0 bottom-0 left-0 w-4 bg-linear-to-r from-white to-transparent md:hidden z-10 pointer-events-none"></div>

        <div className="overflow-x-auto">
          {/* السر هنا: إجبار الجدول على ألا يقل عرضه عن 900px لمنع تشوه الخلايا */}
          <table className="w-full text-right border-collapse min-w-225">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold text-xs tracking-wider">
                {activeTab === "invoices" ? (
                  <>
                    <th className="p-3 sm:p-4">الرقم التسلسلي</th>
                    <th className="p-3 sm:p-4">جهة العميل</th>
                    <th className="p-3 sm:p-4">تاريخ الإصدار</th>
                    <th className="p-3 sm:p-4">الإجمالي</th>
                    <th className="p-3 sm:p-4">حالة الدفع</th>
                    <th className="p-3 sm:p-4 text-left">الامتثال الضريبي (ETA)</th>
                  </>
                ) : (
                  <>
                    <th className="p-3 sm:p-4">رقم مسير الرواتب</th>
                    <th className="p-3 sm:p-4">الشهر المستحق</th>
                    <th className="p-3 sm:p-4">عدد الموظفين</th>
                    <th className="p-3 sm:p-4">إجمالي الرواتب الصافية</th>
                    <th className="p-3 sm:p-4">حالة الصرف</th>
                    <th className="p-3 sm:p-4 text-left">الإجراءات</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 sm:p-8 text-center text-slate-500">
                    {activeTab === "invoices" ? "لا توجد فواتير تطابق شروط البحث." : "لم يتم إصدار أي رواتب بعد."}
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  activeTab === "invoices"
                    ? <LedgerRow key={record.id} inv={record as LedgerType} />
                    : <PayrollRow key={record.id} payroll={record as PayrollType} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}