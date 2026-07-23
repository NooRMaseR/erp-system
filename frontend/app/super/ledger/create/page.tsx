
import { API } from "@/app/utils/api";
import InvoiceForm from "./invoice-form";

export default async function CreateInvoicePage() {
  // Fetch the dynamic client list securely on the Next.js server
  const { data: clients, error } = await API.GET("/crm/clients/lookup/");

  if (error || !clients) {
    return (
      <div className="p-10 flex items-center justify-center min-h-screen text-red-500 font-medium">
        Failed to load CRM data. Please try again later.
      </div>
    );
  }

  // Pass the data down to the interactive client form
  return <InvoiceForm clients={clients} />;
}