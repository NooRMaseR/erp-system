"use server";

import type { components } from "../../generated/schema";
import { revalidatePath } from "next/cache";
import { API } from "../../utils/api";

export async function markInvoice(invoiceId: string, status: components['schemas']['StatusUpdatePayload']['status']) {
  const { error } = await API.PATCH("/ledger/{invoice_number}/status/", {
    params: { path: { invoice_number: invoiceId } },
    body: { status: status }
  });

  if (error) {
    console.error("Failed to update status:", error);
    return;
  }

  revalidatePath("/ledger");
}

export async function getInvoiceItemsAction(invoiceId: string) {
  const { data, error } = await API.GET("/ledger/{invoice_number}/bands/", {
    params: {
      path: { invoice_number: invoiceId }
    }
  });

  if (error) {
    return { error: (error as Record<string, string>).detail || "فشل في جلب بنود الفاتورة" };
  }

  return { data };
}

export async function updateInvoiceItemsAction(invoiceId: string, invoiceLinesData: components['schemas']['InvoiceEditPayload']) {
  const { data, error } = await API.PUT("/ledger/{invoice_number}/edit/", {
    params: {
      path: { invoice_number: invoiceId }
    },
    body: invoiceLinesData
  });

  if (error) {
    return { error: error.detail || "فشل في جلب بنود الفاتورة" };
  }
  revalidatePath("/super/ledger")
  return { data };
}


export async function approvePayrollAction(payrollId: string) {
  const { error } = await API.POST(`/ledger/payrolls/{payroll_id}/approve/`, {
    params: { path: { payroll_id: payrollId } }
  });

  if (error) {
    return {success: false, error: (error as Record<string, string>).detail || "فشل في اعتماد الرواتب، يرجى المحاولة لاحقاً." };
  }

  revalidatePath("/super/ledger");

  return { success: true };
}
