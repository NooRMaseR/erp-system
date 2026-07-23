"use client";

import { useTransition } from "react";
import * as ContextMenu from "@radix-ui/react-context-menu";
import { FileText, CheckCircle, Lock, Edit3 } from "lucide-react";
import { markInvoice } from "./actions"; // Import our Server Action
import { components } from "../../generated/schema";

export function LedgerRow({ inv }: { inv: components['schemas']['LedgerItem'] }) {
    const [isPending, startTransition] = useTransition();

    return (
        <ContextMenu.Root>
            <ContextMenu.Trigger asChild>
                <tr className={`hover:bg-slate-50/50 transition-colors group ${isPending ? 'opacity-50' : ''}`}>
                    <td className="p-4 font-mono font-bold text-xs text-teal-700 flex items-center gap-2">
                        <FileText size={14} className="text-teal-600" /> {inv.id} {inv.is_locked && (
                            <Lock size={12} className="text-slate-400" aria-label="Legally Locked Document" />
                        )}
                    </td>
                    <td className="p-4 font-medium text-slate-900">{inv.client}</td>
                    <td className="p-4 text-slate-500">{inv.date}</td>
                    <td className="p-4 font-mono font-medium text-slate-900">{inv.amount}</td>
                    <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${inv.status === "PAID" ? "bg-emerald-100 text-emerald-700" :
                            inv.status === "SENT" ? "bg-blue-100 text-blue-700" :
                                "bg-slate-200 text-slate-700"
                            }`}>
                            {inv.status}
                        </span>
                    </td>
                    <td className="p-4">
                        <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full ${inv.eta === 'Approved' ? 'bg-emerald-500' : inv.eta === 'Pending' ? 'bg-amber-500' : 'bg-slate-300'}`}></span>
                            {inv.eta}
                        </span>
                    </td>
                </tr>
            </ContextMenu.Trigger>

            {/* The Popup Menu */}
            <ContextMenu.Portal>
                <ContextMenu.Content
                    className="min-w-45 bg-white border border-slate-200 rounded-lg shadow-lg p-1 overflow-hidden z-50 text-sm"
                >
                    <ContextMenu.Item
                        className="flex items-center gap-2 px-3 py-2 text-slate-700 rounded-md transition-colors cursor-pointer hover:bg-emerald-50 hover:text-emerald-700 hover:outline-none data-disabled:text-slate-400 data-disabled:bg-transparent data-disabled:cursor-not-allowed"
                        disabled={inv.status === 'PAID'}
                        onSelect={() => {
                            startTransition(() => {
                                markInvoice(inv.id, 'PAID');
                            });
                        }}
                    >
                        <CheckCircle size={14} /> Mark as PAID
                    </ContextMenu.Item>
                    <ContextMenu.Separator className="h-px bg-slate-100 my-1" />
                    
                    <ContextMenu.Item
                        className="flex items-center gap-2 px-3 py-2 text-slate-700 rounded-md transition-colors cursor-pointer hover:bg-slate-100 hover:text-slate-900 hover:outline-none data-disabled:text-slate-300 data-disabled:bg-transparent data-disabled:cursor-not-allowed"
                        disabled={inv.is_locked}
                        onSelect={() => {
                            console.log("Opening Edit Modal for", inv.id);
                        }}
                    >
                        <Edit3 size={14} /> Edit Line Items
                    </ContextMenu.Item>

                    <ContextMenu.Separator className="h-px bg-slate-100 my-1" />
                    <ContextMenu.Item className="px-3 py-2 text-slate-400 hover:bg-slate-50 hover:outline-none rounded-md cursor-pointer">
                        View ETA Receipt
                    </ContextMenu.Item>
                    <ContextMenu.Item
                        className="px-3 py-2 text-red-600 hover:bg-red-50 hover:outline-none rounded-md cursor-pointer"
                        onSelect={() => {
                            startTransition(() => {
                                markInvoice(inv.id, 'CANCELLED');
                            });
                        }}
                    >
                        Cancel Document
                    </ContextMenu.Item>
                </ContextMenu.Content>
            </ContextMenu.Portal>
        </ContextMenu.Root>
    );
}