"use client";

import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { ArrowRight, Plus, Trash2, Save } from "lucide-react"; // تم تغيير ArrowLeft إلى ArrowRight
import type { components } from "@/app/generated/schema";
import { useRouter } from "next/navigation";
import { API } from "@/app/utils/api";
import { toast } from "sonner";
import Link from "next/link";

type InvoiceFormValues = components['schemas']['InvoiceCreatePayload'];

export default function InvoiceForm({ clients }: { clients: { id: number; name: string }[] }) {
  const router = useRouter();

  const { register, control, handleSubmit, formState: { isSubmitting } } = useForm<InvoiceFormValues>({
    defaultValues: {
      items: [{ description: "", quantity: 1, unitPrice: 0, vatRate: 0.14 }]
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = useWatch({ control, name: "items" });

  const totals = watchedItems.reduce(
    (acc, item) => {
      const lineBase = item.quantity * item.unitPrice;
      const lineVat = lineBase * item.vatRate;

      return {
        subtotal: acc.subtotal + lineBase,
        vatTotal: acc.vatTotal + lineVat,
        grandTotal: acc.grandTotal + lineBase + lineVat,
      };
    },
    { subtotal: 0, vatTotal: 0, grandTotal: 0 }
  );

  const onSubmit = async (data: InvoiceFormValues) => {
    const { error } = await API.POST("/ledger/create/", { body: data });

    if (error) {
      toast.error("فشل في إنشاء الفاتورة، يرجى المحاولة مرة أخرى.");
      return;
    }

    router.push("/super/ledger");
  };

  return (
    <div dir="rtl" className="p-6 md:p-10 max-w-5xl mx-auto w-full space-y-8 flex-1 min-h-screen bg-slate-50/50 text-slate-900 font-sans">

      {/* الترويسة */}
      <div className="flex items-center gap-4">
        <Link href="/super/ledger" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowRight size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">مسودة فاتورة جديدة</h1>
          <p className="text-slate-500 text-sm">إنشاء مستند مالي متوافق مع منظومة الضرائب المصرية (ETA).</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* القسم الأول: بيانات العميل */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-800 border-b border-slate-100 pb-2">بيانات العميل والاستحقاق</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">اختر العميل</label>
              <select
                {...register("clientId", { required: true })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-600/20 outline-none cursor-pointer"
              >
                <option value="">-- اختر من قائمة العملاء --</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ الاستحقاق (Due Date)</label>
              <input
                type="date"
                {...register("dueDate", { required: true })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-600/20 outline-none text-right"
              />
            </div>
          </div>
        </div>

        {/* القسم الثاني: بنود الفاتورة */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h2 className="font-semibold text-slate-800">بنود الخدمة (Line Items)</h2>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-3 items-start">
                
                {/* حقل الوصف */}
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">الخدمة / الوصف</label>
                  <input 
                    type="text" 
                    placeholder="مثال: خدمات استشارية ضريبية لشهر يوليو"
                    {...register(`items.${index}.description` as const, { required: true })} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-600/20 outline-none" 
                  />
                </div>

                {/* حقل الكمية */}
                <div className="w-24">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">الكمية</label>
                  <input 
                    type="number" 
                    dir="ltr"
                    min="1" 
                    {...register(`items.${index}.quantity` as const, { valueAsNumber: true, required: true })} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-600/20 outline-none text-left" 
                  />
                </div>

                {/* حقل السعر */}
                <div className="w-32">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">السعر (ج.م)</label>
                  <input 
                    type="number" 
                    dir="ltr"
                    min="0" 
                    step="0.01" 
                    {...register(`items.${index}.unitPrice` as const, { valueAsNumber: true, required: true })} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-600/20 outline-none text-left" 
                  />
                </div>

                <input type="hidden" {...register(`items.${index}.vatRate` as const, { valueAsNumber: true })} />
                
                {/* زر الحذف */}
                <div className="pt-6">
                  <button 
                    type="button" 
                    onClick={() => remove(index)} 
                    disabled={fields.length === 1} 
                    className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <button 
            type="button" 
            onClick={() => append({ description: "", quantity: 1, unitPrice: 0, vatRate: 0.14 })} 
            className="flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-700 mt-2"
          >
            <Plus size={16} /> إضافة بند جديد
          </button>
        </div>

        {/* القسم الثالث: الإجماليات وزر الحفظ */}
        <div className="flex flex-col sm:flex-row justify-between items-end gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-inner mt-6">
          <div className="w-full sm:w-64 space-y-2 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>الإجمالي الفرعي</span>
              <span dir="ltr">EGP {totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-slate-500 border-b border-slate-200 pb-2">
              <span>ض.ق.م (14%)</span>
              <span dir="ltr">EGP {totals.vatTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between font-bold text-lg text-slate-900 pt-1">
              <span>الإجمالي الكلي</span>
              <span dir="ltr">EGP {totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-70 shadow-md"
          >
            <Save size={18} />{isSubmitting ? "جاري الحفظ..." : "حفظ مسودة الفاتورة"}
          </button>
        </div>
      </form>
    </div>
  );
}