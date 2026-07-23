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