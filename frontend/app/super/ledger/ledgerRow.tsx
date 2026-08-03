"use client";

import { FileText, CheckCircle, Lock, Edit3, Plus, Trash2, Save, Loader2, Send } from "lucide-react";
import { getInvoiceItemsAction, markInvoice, updateInvoiceItemsAction } from "./actions";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import * as ContextMenu from "@radix-ui/react-context-menu";
import { useTransition, useState, useEffect } from "react";
import { components } from "../../generated/schema";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { useAuthState } from "@/app/utils/store";

const statusTranslation: Record<string, string> = {
  PAID: "مدفوعة",
  SENT: "مُرسلة",
  DRAFT: "مسودة",
  CANCELLED: "ملغاة",
};

const etaTranslation: Record<string, string> = {
  Approved: "معتمدة",
  Pending: "معلقة",
};

export function LedgerRow({ inv }: { inv: components['schemas']['LedgerItem'] }) {
    const [isPending, startTransition] = useTransition();
    const userRole = useAuthState(state => state.user?.role);
    
    // حالة فتح النافذة وحالة التحميل أثناء جلب البيانات
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // نموذج التعديل يبدأ ببنود فارغة
    const { register, control, handleSubmit, reset, formState: { isSubmitting } } = useForm<components['schemas']['InvoiceEditPayload']>({
        defaultValues: { items: [] }
    });

    const { fields, append, remove } = useFieldArray({ control, name: "items" });
    const watchedItems = useWatch({ control, name: "items" });

    // حساب الإجماليات
    const totals = watchedItems.reduce(
        (acc, item) => {
            const lineBase = (item.quantity || 0) * (item.unit_price || 0);
            const lineVat = lineBase * (item.vat_rate || 0.14);
            return {
                subtotal: acc.subtotal + lineBase,
                vatTotal: acc.vatTotal + lineVat,
                grandTotal: acc.grandTotal + lineBase + lineVat,
            };
        },
        { subtotal: 0, vatTotal: 0, grandTotal: 0 }
    );

    // جلب البنود من الـ Backend بمجرد فتح النافذة
    useEffect(() => {
        let isMounted = true;

        const fetchItems = async () => {
            if (isEditModalOpen) {
                const res = await getInvoiceItemsAction(inv.id);
                
                if (isMounted) {
                    if (res.error) {
                        toast.error(res.error);
                        setIsEditModalOpen(false); // إغلاق النافذة إذا فشل الجلب
                    } else if (res.data) {
                        // تعبئة النموذج بالبيانات القادمة من السيرفر
                        reset({ items: res.data.items, });
                    }
                }
            }
        };

        fetchItems();

        return () => { isMounted = false; };
    }, [isEditModalOpen, inv.id, reset]);

    const onEditSubmit = async (data: components['schemas']['InvoiceEditPayload']) => {
        startTransition(async () => {
            await updateInvoiceItemsAction(inv.id, data);
        });
        
        toast.success("تم تحديث بنود الفاتورة بنجاح.");
        setIsEditModalOpen(false);
    };

    return (
        <>
            <ContextMenu.Root dir="rtl">
                <ContextMenu.Trigger asChild>
                    <tr className={`hover:bg-slate-50/50 transition-colors group cursor-context-menu ${isPending ? 'opacity-50' : ''}`}>
                        <td className="p-4 font-mono font-bold text-xs text-teal-700 flex items-center gap-2">
                            <FileText size={14} className="text-teal-600" /> {inv.id} 
                            {inv.is_locked && (
                                <Lock size={12} className="text-slate-400" aria-label="مستند مغلق قانونياً" />
                            )}
                        </td>
                        <td className="p-4 font-medium text-slate-900">{inv.client}</td>
                        <td className="p-4 text-slate-500">{inv.date}</td>
                        <td className="p-4 font-mono font-medium text-slate-900">{inv.amount}</td>
                        <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider ${
                                inv.status === "PAID" ? "bg-emerald-100 text-emerald-700" :
                                inv.status === "SENT" ? "bg-blue-100 text-blue-700" :
                                "bg-slate-200 text-slate-700"
                            }`}>
                                {statusTranslation[inv.status] || inv.status}
                            </span>
                        </td>
                        <td className="p-4 text-left">
                            <span className="text-xs font-medium text-slate-500 flex justify-end items-center gap-1.5">
                                <span className={`h-2 w-2 rounded-full ${inv.eta === 'Approved' ? 'bg-emerald-500' : inv.eta === 'Pending' ? 'bg-amber-500' : 'bg-slate-300'}`}></span>
                                {etaTranslation[inv.eta] || inv.eta}
                            </span>
                        </td>
                    </tr>
                </ContextMenu.Trigger>

                <ContextMenu.Portal>
                    <ContextMenu.Content
                        className="min-w-45 bg-white border border-slate-200 rounded-lg shadow-lg p-1 overflow-hidden z-50 text-sm"
                    >
                        <ContextMenu.Item
                            className="flex items-center gap-2 px-3 py-2 text-slate-700 rounded-md transition-colors cursor-pointer hover:bg-emerald-50 hover:text-emerald-700 hover:outline-none data-disabled:text-slate-400 data-disabled:bg-transparent data-disabled:cursor-not-allowed"
                            disabled={["PAID", "CANCELLED"].includes(inv.status)}
                            onSelect={() => {
                                startTransition(() => {
                                    markInvoice(inv.id, 'PAID');
                                });
                            }}
                        >
                            <CheckCircle size={14} /> تحديد كـ &quot;مدفوعة&quot;
                        </ContextMenu.Item>
                        {["MANAGER", "SUPER_ADMIN"].includes(userRole as string) && <ContextMenu.Item
                            className="flex items-center gap-2 px-3 py-2 text-slate-700 rounded-md transition-colors cursor-pointer hover:bg-blue-50 hover:text-blue-700 hover:outline-none data-disabled:text-slate-400 data-disabled:bg-transparent data-disabled:cursor-not-allowed"
                            disabled={["PAID", "CANCELLED", "SENT"].includes(inv.status)}
                            onSelect={() => {
                                startTransition(() => {
                                    markInvoice(inv.id, 'SENT');
                                });
                            }}
                        >
                            <Send size={14} /> تحديد كـ &quot;مرسله&quot;
                        </ContextMenu.Item>}
                        <ContextMenu.Separator className="h-px bg-slate-100 my-1" />
                        
                        {/* زر التعديل الذي سيفتح النافذة المنبثقة */}
                        <ContextMenu.Item
                            className="flex items-center gap-2 px-3 py-2 text-slate-700 rounded-md transition-colors cursor-pointer hover:bg-slate-100 hover:text-slate-900 hover:outline-none data-disabled:hover:text-slate-400 data-disabled:text-slate-300 data-disabled:bg-transparent data-disabled:cursor-not-allowed"
                            disabled={inv.is_locked || inv.status !== 'SENT'}
                            onSelect={() => {
                                setIsEditModalOpen(true);
                            }}
                        >
                            <Edit3 size={14} /> تعديل بنود الخدمة
                        </ContextMenu.Item>

                        <ContextMenu.Separator className="h-px bg-slate-100 my-1" />
                        <ContextMenu.Item className="px-3 py-2 text-slate-400 hover:bg-slate-50 hover:outline-none rounded-md cursor-pointer">
                            عرض إيصال الضرائب
                        </ContextMenu.Item>
                        <ContextMenu.Item
                            className="px-3 py-2 text-red-600 hover:bg-red-50 hover:outline-none rounded-md cursor-pointer data-disabled:hover:text-red-200 data-disabled:text-red-200 data-disabled:bg-transparent data-disabled:cursor-not-allowed"
                            disabled={["PAID", "CANCELLED"].includes(inv.status)}
                            onSelect={() => {
                                startTransition(() => {
                                    markInvoice(inv.id, 'CANCELLED');
                                });
                            }}
                        >
                            إلغاء الفاتورة
                        </ContextMenu.Item>
                    </ContextMenu.Content>
                </ContextMenu.Portal>
            </ContextMenu.Root>

            <Dialog open={isEditModalOpen} onOpenChange={(open) => {
                if (!open) reset();
                setIsEditModalOpen(open);
            }}>
                <DialogContent dir="rtl" className="bg-white border-slate-200 sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-900 text-right flex items-center gap-2">
                            <Edit3 className="text-teal-600" size={20} />
                            تعديل بنود الفاتورة <span className="font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded text-sm">{inv.id}</span>
                        </DialogTitle>
                    </DialogHeader>
                    
                    <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-6 mt-4">
                        
                        {/* حاوية البنود */}
                        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex gap-3 items-start bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                                    <div className="flex-1">
                                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">الخدمة / الوصف</label>
                                        <input 
                                            type="text" 
                                            {...register(`items.${index}.description` as const, { required: true })} 
                                            className="w-full p-2 bg-white border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-teal-600/20 outline-none transition-all" 
                                        />
                                    </div>
                                    <div className="w-24">
                                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">الكمية</label>
                                        <input 
                                            type="number" 
                                            dir="ltr"
                                            min="1" 
                                            {...register(`items.${index}.quantity` as const, { valueAsNumber: true, required: true })} 
                                            className="w-full p-2 bg-white border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-teal-600/20 outline-none text-center transition-all" 
                                        />
                                    </div>
                                    <div className="w-32">
                                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">السعر (ج.م)</label>
                                        <input 
                                            type="number" 
                                            dir="ltr"
                                            min="0" 
                                            step="0.01" 
                                            {...register(`items.${index}.unit_price` as const, { valueAsNumber: true, required: true })} 
                                            className="w-full p-2 bg-white border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-teal-600/20 outline-none text-left font-mono transition-all" 
                                        />
                                    </div>
                                    <input type="hidden" {...register(`items.${index}.vat_rate` as const, { valueAsNumber: true })} />
                                    <div className="pt-6">
                                        <button 
                                            type="button" 
                                            onClick={() => remove(index)} 
                                            disabled={fields.length === 1} 
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-30"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <button 
                            type="button" 
                            onClick={() => append({id: null, description: "", quantity: 1, unit_price: 0, vat_rate: 0.14 })} 
                            className="flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-700"
                        >
                            <Plus size={16} /> إضافة بند خدمة آخر
                        </button>

                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner">
                            <div className="w-full sm:w-64 space-y-1 text-sm">
                                <div className="flex justify-between text-slate-500">
                                    <span>الإجمالي الفرعي</span>
                                    <span dir="ltr">EGP {totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between font-bold text-base text-slate-900 pt-1 border-t border-slate-200">
                                    <span>الإجمالي الكلي (شامل الضريبة)</span>
                                    <span dir="ltr">EGP {totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                            
                            <DialogFooter className="w-full sm:w-auto mt-0">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors"
                                >
                                    إلغاء
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting} 
                                    className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-70 shadow-sm"
                                >
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    حفظ التعديلات
                                </button>
                            </DialogFooter>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}