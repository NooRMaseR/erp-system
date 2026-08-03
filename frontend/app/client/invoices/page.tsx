import { FileText, Clock, CheckCircle2, AlertCircle, CreditCard } from "lucide-react";
import DownloadInvoiceButton from "@/app/components/invoice-download-button";
import { Button } from "@/components/ui/button";
import { API } from "@/app/utils/api";
import Link from "next/link";

type StatusStyleProps = {
    bg: string;
    text: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: any;
    label: string;
}

type StatusStyle = {
    PAID: StatusStyleProps;
    SENT: StatusStyleProps;
    CANCELLED: StatusStyleProps;
}

const statusStyles: StatusStyle = {
    PAID: { bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle2, label: "مدفوعة" },
    SENT: { bg: "bg-amber-100", text: "text-amber-700", icon: Clock, label: "مستحقة الدفع" },
    CANCELLED: { bg: "bg-red-100", text: "text-red-700", icon: AlertCircle, label: "ملغاة" },
};

export default async function ClientInvoicesPage() {
    const { data, error, response } = await API.GET("/crm/client/invoices/");
    if (response.status === 403) {
        return (
            <div dir="rtl" className="p-10 w-full flex items-center justify-center min-h-screen text-red-500 font-medium">
               عفواً، ليس لديك صلاحيات الدخول لصفحة العملاء
            </div>
        );
    }
    
    if (error) {
        console.error(error)
        return (
            <div dir="rtl" className="p-10 w-full flex items-center justify-center min-h-screen text-red-500 font-medium">
                فشل في تحميل الفواتير. يرجى المحاولة لاحقاً أو التواصل مع الدعم الفني.
            </div>
        );
    }

    const invoices = data || [];

    // حساب إجمالي المبالغ المستحقة (التي لم تُدفع بعد)
    const totalDue = invoices
        .filter(inv => inv.status === "SENT")
        .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

    return (
        <main dir="rtl" className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full space-y-8 bg-slate-50/50 min-h-screen text-slate-900 font-sans">
            <Link href="/">
                <Button className="cursor-pointer">إعادة تسجيل الدخول</Button>
            </Link>
            <div className="mt-10"></div>

            {/* الترويسة الترحيبية للعميل */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 rounded-2xl p-8 text-white shadow-lg">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">مرحباً بك في بوابة العملاء</h1>
                    <p className="text-slate-400 text-sm mt-2">راجع فواتيرك، حمل الإيصالات الضريبية، وتابع مدفوعاتك بأمان.</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl text-center min-w-50">
                    <div className="text-slate-400 text-xs font-semibold mb-1">إجمالي المستحقات (ج.م)</div>
                    <div className="text-2xl font-bold text-emerald-400 font-mono">
                        {totalDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                </div>
            </div>

            {/* قائمة الفواتير */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="text-teal-600" size={18} />
                        سجل الفواتير الضريبية
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 text-slate-400 font-semibold text-xs tracking-wider">
                                <th className="p-5">رقم الفاتورة</th>
                                <th className="p-5">تاريخ الإصدار</th>
                                <th className="p-5">المبلغ الإجمالي</th>
                                <th className="p-5">حالة السداد</th>
                                <th className="p-5 text-left">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                            {invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-10 text-center text-slate-500">
                                        لا توجد فواتير مسجلة في حسابك حالياً.
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((inv) => {
                                    const status = statusStyles[inv.status as keyof StatusStyle] || statusStyles.SENT;
                                    const StatusIcon = status.icon;

                                    return (
                                        <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">

                                            {/* رقم الفاتورة */}
                                            <td className="p-5 font-mono font-bold text-teal-700 text-xs">
                                                {inv.invoice_number}
                                            </td>

                                            {/* التاريخ */}
                                            <td className="p-5 text-slate-500">
                                                {inv.date}
                                            </td>

                                            {/* المبلغ */}
                                            <td className="p-5 font-mono font-medium text-slate-900" dir="ltr">
                                                EGP {Number(inv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>

                                            {/* حالة الفاتورة */}
                                            <td className="p-5">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${status.bg} ${status.text}`}>
                                                    <StatusIcon size={14} />
                                                    {status.label}
                                                </span>
                                            </td>

                                            {/* أزرار الإجراءات للعميل */}
                                            <td className="p-5 text-left">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* زر التحميل متاح دائماً */}
                                                    <DownloadInvoiceButton invoiceId={inv.id} />

                                                    {/* زر الدفع يظهر فقط للفواتير المستحقة */}
                                                    {inv.status === "SENT" && (
                                                        <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors shadow-sm">
                                                            <CreditCard size={14} />
                                                            دفع الآن
                                                        </button>
                                                    )}
                                                </div>
                                            </td>

                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}