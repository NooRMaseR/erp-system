"use client";

import { Download, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { API } from "../utils/api";
import { toast } from "sonner";

type DownloadInvoiceButtonProps = {
    invoiceId: number;
}

export default function DownloadInvoiceButton({ invoiceId }: DownloadInvoiceButtonProps) {
    const [isDownloading, startTransition] = useTransition();

    const handleDownload = () => startTransition(async () => {
        
        try {
            const {response, data: pdfBlob} = await API.GET(`/crm/client/invoices/{invoice_id}/pdf/`, {
                params: {
                    path: {
                        invoice_id: invoiceId
                    }
                },
                parseAs: "blob"
            });
            
            if (!response.ok) {
                toast.error("حدث خطأ عند تحميل الفاتورة")
                return;
            }
            
            const url = window.URL.createObjectURL(pdfBlob as Blob);
            
            const link = document.createElement("a");
            link.href = url;
            link.download = `Invoice-${invoiceId}.pdf`;
            document.body.appendChild(link);
            link.click();
            
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            toast.success("تم تحميل الفاتورة بنجاح");
            
        } catch (error) {
            console.error("Download Error:", error);
            toast.error("حدث خطأ أثناء تحميل الفاتورة. يرجى المحاولة لاحقاً.");
        }
    });

    return (
        <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors border border-transparent hover:border-teal-100 disabled:opacity-50"
            title="تحميل الفاتورة PDF"
        >
            {isDownloading ? (
                <Loader2 size={18} className="animate-spin text-teal-600" />
            ) : (
                <Download size={18} />
            )}
        </button>
    );
}