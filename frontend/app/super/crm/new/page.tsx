"use client";

import { Building2, Mail, Phone, FileText, Lock, Save, ArrowRight, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState } from "react";
import Link from "next/link";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { API } from "@/app/utils/api";
import type { components } from "@/app/generated/schema";

type AddClientFormValues = components['schemas']['CreateClientRequest'];

export default function AddClientPage() {
    const router = useRouter();

    const [result, setResult] = useState<{
        isOpen: boolean;
        status: "success" | "error";
        title: string;
        message: string;
    }>({ isOpen: false, status: "success", title: "", message: "" });

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<AddClientFormValues>();

    const onSubmit = async (data: AddClientFormValues) => {
        const { error } = await API.POST("/crm/clients/create/", { body: {...data, taxRegistration: Number(data.taxRegistration)} });

        if (error) {
            setResult({
                isOpen: true,
                status: "error",
                title: "خطأ في التسجيل",
                message: error.detail as unknown as string || "حدث خطأ غير متوقع أثناء حفظ البيانات."
            });
            return;
        }

        setResult({
            isOpen: true,
            status: "success",
            title: "تم الحفظ بنجاح",
            message: `تم إنشاء الملف الضريبي لشركة "${data.companyName}" وحساب الدخول الخاص بهم بنجاح.`
        });

        reset();
    };

    const handleCloseDialog = () => {
        setResult(prev => ({ ...prev, isOpen: false }));
        if (result.status === "success") {
            router.push("/super/crm"); // تم تصحيح المسار هنا
        }
    };

    return (
        <div dir="rtl" className="p-6 md:p-10 max-w-4xl mx-auto w-full space-y-8 flex-1 min-h-screen bg-slate-50/50 text-slate-900 font-sans">

            <div className="flex items-center gap-4">
                <Link href="/super/crm" className="text-slate-400 hover:text-slate-600 transition-colors">
                    <ArrowRight size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">إضافة عميل مؤسسي جديد</h1>
                    <p className="text-slate-500 text-sm">تسجيل البيانات الضريبية وإنشاء حساب البوابة الإلكترونية.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                        <Building2 size={18} className="text-teal-600" />
                        <h2 className="font-semibold text-slate-800">البيانات التجارية والضريبية</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">اسم الشركة (الكيان القانوني)</label>
                            <input
                                type="text"
                                placeholder="مثال: شركة النيل للوجستيات ش.م.م"
                                {...register("companyName", { required: true })}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">رقم التسجيل الضريبي</label>
                            <div className="relative">
                                <FileText size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text" 
                                    inputMode="numeric"
                                    maxLength={9}
                                    placeholder="9 أرقام (مثال: 123456789)"
                                    {...register("taxRegistration", {
                                        required: true,
                                        pattern: /^[0-9]{9}$/ // ضمان أنه 9 أرقام فقط كنص
                                    })}
                                    className="w-full pr-10 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition-all font-mono"
                                />
                            </div>
                            {errors.taxRegistration && <p className="text-red-500 text-xs mt-1">يجب أن يتكون من 9 أرقام بالضبط.</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">رقم السجل التجاري</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                {...register("commercialRegister")}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition-all"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">عنوان المقر الرئيسي</label>
                            <textarea
                                rows={2}
                                {...register("companyAddress", { required: true })}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition-all resize-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                        <Lock size={18} className="text-teal-600" />
                        <h2 className="font-semibold text-slate-800">حساب بوابة العملاء والتواصل</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2 text-sm text-slate-500 bg-teal-50/50 p-3 rounded-lg border border-teal-100">
                            سيتم استخدام البريد الإلكتروني وكلمة المرور أدناه لتمكين العميل من الدخول على البوابة لمراجعة فواتيره وعقوده.
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">البريد الإلكتروني (تسجيل الدخول)</label>
                            <div className="relative">
                                <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="email"
                                    inputMode="email"
                                    dir="ltr"
                                    placeholder="billing@company.com"
                                    {...register("contactEmail", { required: true })}
                                    className="w-full pr-10 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition-all text-left"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف للتواصل</label>
                            <div className="relative">
                                <Phone size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    inputMode="tel"
                                    dir="ltr"
                                    placeholder="+20 100 000 0000"
                                    {...register("phone")}
                                    className="w-full pr-10 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition-all text-left"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">كلمة المرور المبدئية</label>
                            <input
                                type="password"
                                dir="ltr"
                                {...register("password", { required: true, minLength: 8 })}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition-all text-left"
                            />
                            {errors.password && <p className="text-red-500 text-xs mt-1 text-right">يجب ألا تقل عن 8 أحرف.</p>}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Link href="/super/crm" className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors">
                        إلغاء
                    </Link>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-8 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-70 shadow-sm"
                    >
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {isSubmitting ? "جاري الحفظ..." : "حفظ وإنشاء الحساب"}
                    </button>
                </div>
            </form>

            <Dialog open={result.isOpen} onOpenChange={handleCloseDialog}>
                {/* تم تعديل عرض النافذة إلى الكلاس القياسي sm:max-w-[425px] */}
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