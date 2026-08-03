"use client";

import { Loader2, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { API } from "@/app/utils/api";
import { useState } from "react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function ProcessPayrollButton() {
    const router = useRouter();

    // --- إدارة الحالة (State) ---
    const [isProcessing, setIsProcessing] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    // حالة النتيجة للنجاح أو الفشل
    const [result, setResult] = useState<{
        isOpen: boolean;
        status: "success" | "error";
        title: string;
        message: string;
    }>({
        isOpen: false,
        status: "success",
        title: "",
        message: ""
    });
    const dt = new Date();
    const currentMonth = dt.getMonth() + 1;
    const currentYear = dt.getFullYear();

    // --- دالة التشغيل ---
    const executePayrollRun = async () => {
        setIsConfirmOpen(false);
        setIsProcessing(true);

        const { data, error } = await API.POST("/hr/payroll/process/", {
            body: { month: currentMonth, year: currentYear }
        });

        setIsProcessing(false);

        if (error) {
            setResult({
                isOpen: true,
                status: "error",
                title: "فشل إصدار الرواتب",
                message: error.detail as unknown as string || "حدث خطأ غير متوقع أثناء معالجة البيانات من الخادم."
            });
            return;
        }

        setResult({
            isOpen: true,
            status: "success",
            title: "تم إصدار وإغلاق الرواتب بنجاح",
            message: `تم إنشاء ${data.processedCount} قسيمة راتب للموظفين بنجاح. إجمالي الرواتب الصافية ${data.totalNetSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })} ج.م، وتم توجيهها للسجل المالي.`
        });

        // تحديث الصفحة لجلب الإحصائيات الجديدة
        router.refresh();
    };

    return (
        <>
            {/* الزر الرئيسي */}
            <button
                onClick={() => setIsConfirmOpen(true)}
                disabled={isProcessing}
                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-sm px-4 py-2 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
                {isProcessing && <Loader2 size={16} className="animate-spin text-teal-600" />}
                {isProcessing ? "جاري معالجة البيانات..." : "إصدار الرواتب"}
            </button>

            {/* 1. نافذة تأكيد الإجراء */}
            <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogContent dir="rtl" className="bg-white border-slate-200 sm:max-w-106.25">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-900 text-right">
                            <AlertCircle className="text-amber-500" size={20} />
                            تأكيد إصدار الرواتب
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 pt-2 leading-relaxed text-right">
                            أنت على وشك حساب وإغلاق رواتب شهر <strong>{currentMonth}/{currentYear}</strong>.
                            سيتم تطبيق كافة استقطاعات الضرائب المصرية، التأمينات الاجتماعية، وقواعد الغياب.
                            <br /><br />
                            <span className="text-red-500 font-medium">ملاحظة: هذا الإجراء نهائي ولا يمكن التراجع عنه.</span>
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="flex gap-2 sm:justify-start mt-4">
                        <button
                            onClick={() => setIsConfirmOpen(false)}
                            className="px-4 py-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium w-full sm:w-auto"
                        >
                            إلغاء
                        </button>
                        <button
                            onClick={executePayrollRun}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors text-sm font-medium w-full sm:w-auto shadow-sm"
                        >
                            تأكيد وتنفيذ
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 2. نافذة النتيجة (نجاح أو فشل) */}
            <Dialog
                open={result.isOpen}
                onOpenChange={(isOpen) => setResult(prev => ({ ...prev, isOpen }))}
            >
                <DialogContent dir="rtl" className="bg-white border-slate-200 sm:max-w-106.25">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-900 text-right">
                            {result.status === "success" ? (
                                <CheckCircle2 className="text-emerald-500" size={20} />
                            ) : (
                                <XCircle className="text-red-500" size={20} />
                            )}
                            {result.title}
                        </DialogTitle>
                        <DialogDescription className="text-slate-600 pt-2 leading-relaxed text-right">
                            {result.message}
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="mt-4">
                        <button
                            onClick={() => setResult(prev => ({ ...prev, isOpen: false }))}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors text-sm font-medium w-full shadow-sm"
                        >
                            حسناً
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}