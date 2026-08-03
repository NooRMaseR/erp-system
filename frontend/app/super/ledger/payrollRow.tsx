"use client";

import { Wallet, CheckCircle2, Clock, Loader2 } from "lucide-react";
import type { components } from "@/app/generated/schema";
import { approvePayrollAction } from "./actions";
import { useTransition } from "react";
import { toast } from "sonner";

export function PayrollRow({ payroll }: { payroll: components['schemas']['PayrollLedgerSerializer'] }) {
    const isPaid = payroll.status === "PAID";
    const [isPending, startTransition] = useTransition();

    const handleApprove = () => {
        startTransition(async () => {
            const res = await approvePayrollAction(payroll.id);
            
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(`تم اعتماد ${payroll.month} بنجاح وتحويله للصرف.`);
            }
        });
    };

    return (
        <tr className={`hover:bg-slate-50/50 transition-colors group ${isPending ? 'opacity-60 pointer-events-none' : ''}`}>
            <td className="p-4 font-mono font-bold text-xs text-slate-700 flex items-center gap-2">
                <Wallet size={14} className="text-teal-600" /> {payroll.id}
            </td>
            <td className="p-4 font-medium text-slate-900">{payroll.month}</td>
            <td className="p-4 text-slate-600 font-medium">{payroll.employeesCount} موظف</td>
            <td className="p-4 font-mono font-bold text-slate-900" dir="ltr">
                EGP {payroll.totalNetSalaries?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </td>
            <td className="p-4">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tracking-wider ${
                    isPaid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}>
                    {isPaid ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    {isPaid ? "تم الصرف" : "معلق"}
                </span>
            </td>
            <td className="p-4 text-left">
                {!isPaid && (
                    <button 
                        onClick={handleApprove}
                        disabled={isPending}
                        className="flex items-center justify-center gap-1.5 min-w-25 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition-colors disabled:opacity-70"
                    >
                        {isPending ? (
                            <>
                                <Loader2 size={14} className="animate-spin" /> جاري الاعتماد...
                            </>
                        ) : (
                            "اعتماد الصرف"
                        )}
                    </button>
                )}
            </td>
        </tr>
    );
}