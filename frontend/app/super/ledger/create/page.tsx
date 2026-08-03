import { API } from "@/app/utils/api";
import InvoiceForm from "./invoice-form";

export default async function CreateInvoicePage() {
  const { data: clients, error } = await API.GET("/crm/clients/lookup/");

  if (error || !clients) {
    return (
      <div className="p-10 flex items-center justify-center min-h-screen text-red-500 font-medium">
        فشل تحميل بيانات CRM، يرجى المحاوله مجدداً
      </div>
    );
  }

  return <InvoiceForm clients={clients} />;
}
