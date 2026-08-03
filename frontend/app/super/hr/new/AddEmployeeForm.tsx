"use client";

import { UserCircle, Briefcase, Lock, Save, ArrowRight, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState } from "react";
import Link from "next/link";
import type { components } from "@/app/generated/schema";

// استيراد مكونات النافذة المنبثقة
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { API } from "@/app/utils/api";


type AddEmployeeFormValues = components['schemas']['CreateEmployeeRequest'];
type Department = components['schemas']['DepartmentSerializer']; 

export default function AddEmployeeForm({ departments }: { departments: Department[] }) {
    const router = useRouter();

    const [result, setResult] = useState<{
        isOpen: boolean;
        status: "success" | "error";
        title: string;
        message: string;
    }>({ isOpen: false, status: "success", title: "", message: "" });

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<AddEmployeeFormValues>();

    const onSubmit = async (data: AddEmployeeFormValues) => {
        const payload: AddEmployeeFormValues = { ...data, baseSalary: Number(data.baseSalary), departmentId: Number(data.departmentId), nationalId: Number(data.nationalId) };
        
        const { error } = await API.POST("/hr/employees/create/", { body: payload });

        if (error) {
            setResult({
                isOpen: true,
                status: "error",
                title: "فشل في تسجيل الموظف",
                message: error?.detail as unknown as string  || "حدث خطأ غير متوقع أثناء حفظ البيانات."
            });
            return;
        }

        setResult({
            isOpen: true,
            status: "success",
            title: "تم التعيين بنجاح",
            message: `تم إنشاء الملف الوظيفي لـ "${data.fullName}" وحساب الدخول الخاص به بنجاح.`
        });

        reset();
    };

    const handleCloseDialog = () => {
        setResult(prev => ({ ...prev, isOpen: false }));
        if (result.status === "success") {
            router.push("/super/hr");
        }
    };

    return (
        <div dir="rtl" className="p-6 md:p-10 max-w-4xl mx-auto w-full space-y-8 flex-1 min-h-screen bg-slate-50/50 text-slate-900 font-sans">
            
            {/* الترويسة */}
            <div className="flex items-center gap-4">
                <Link href="/super/hr" className="text-slate-400 hover:text-slate-600 transition-colors">
                    <ArrowRight size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">تعيين موظف جديد</h1>
                    <p className="text-slate-500 text-sm">تسجيل البيانات الوظيفية الأساسية وإنشاء حساب الدخول للنظام.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* القسم الأول: البيانات الشخصية */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                        <UserCircle size={18} className="text-teal-600" />
                        <h2 className="font-semibold text-slate-800">البيانات الشخصية</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">الاسم الرباعي</label>
                            <input
                                type="text"
                                placeholder="مثال: أحمد محمد محمود علي"
                                {...register("fullName", { required: true })}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-600/20 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">الرقم القومي</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={14}
                                placeholder="14 رقماً"
                                {...register("nationalId", {
                                    required: true,
                                    pattern: /^[0-9]{14}$/
                                })}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-600/20 outline-none transition-all font-mono"
                            />
                            {errors.nationalId && <p className="text-red-500 text-xs mt-1">يجب أن يتكون من 14 رقماً بالضبط.</p>}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف</label>
                            <input
                                type="text"
                                inputMode="tel"
                                dir="ltr"
                                placeholder="010 0000 0000"
                                {...register("phone", { required: true })}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-600/20 outline-none transition-all text-left"
                            />
                        </div>
                    </div>
                </div>

                {/* القسم الثاني: البيانات الوظيفية والمالية */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                        <Briefcase size={18} className="text-teal-600" />
                        <h2 className="font-semibold text-slate-800">البيانات الوظيفية والمالية</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        
                        {/* حقل الأقسام الديناميكي */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">القسم</label>
                            <select
                                {...register("departmentId", { required: true })}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-600/20 outline-none transition-all cursor-pointer"
                            >
                                <option value="">-- اختر القسم --</option>
                                {departments.map((dept) => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.name} {/* تم التحديث بناءً على السكيما الجديدة */}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">المسمى الوظيفي</label>
                            <input
                                type="text"
                                placeholder="مثال: مراجع مالي أول"
                                {...register("position", { required: true })}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-600/20 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ التعيين</label>
                            <input
                                type="date"
                                {...register("hireDate", { required: true })}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-600/20 outline-none transition-all text-right"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">الراتب الأساسي الثابت (ج.م)</label>
                            <input
                                type="number"
                                min="0"
                                dir="ltr"
                                placeholder="0.00"
                                {...register("baseSalary", { required: true })}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-600/20 outline-none transition-all text-left font-mono"
                            />
                        </div>
                    </div>
                </div>

                {/* القسم الثالث: بيانات الدخول للنظام */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                        <Lock size={18} className="text-teal-600" />
                        <h2 className="font-semibold text-slate-800">بيانات دخول النظام (ERP Access)</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">البريد الإلكتروني للعمل</label>
                            <input
                                type="email"
                                dir="ltr"
                                placeholder="employee@company.com"
                                {...register("email", { required: true })}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-600/20 outline-none transition-all text-left"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">كلمة المرور المبدئية</label>
                            <input
                                type="password"
                                dir="ltr"
                                {...register("password", { required: true, minLength: 8 })}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-600/20 outline-none transition-all text-left"
                            />
                            {errors.password && <p className="text-red-500 text-xs mt-1 text-right">يجب ألا تقل عن 8 أحرف.</p>}
                        </div>
                    </div>
                </div>

                {/* أزرار الحفظ */}
                <div className="flex justify-end gap-3 pt-2">
                    <Link href="/super/hr" className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors">
                        إلغاء
                    </Link>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-8 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-70 shadow-sm"
                    >
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {isSubmitting ? "جاري الحفظ..." : "تسجيل بيانات الموظف"}
                    </button>
                </div>
            </form>

            {/* النافذة المنبثقة (Dialog) */}
            <Dialog open={result.isOpen} onOpenChange={handleCloseDialog}>
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
                            onClick={handleCloseDialog}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors text-sm font-medium w-full shadow-sm"
                        >
                            الاستمرار
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}