"use client";

import { Filter } from "lucide-react";
import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function LedgerFilter() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleFilter = (status: string) => {
    // 1. Grab the current URL parameters (this preserves the 'inv' search term if it exists!)
    const params = new URLSearchParams(searchParams);
    
    // 2. Explicitly target the 'status' parameter
    if (status && status !== "ALL") {
      params.set("status", status);
    } else {
      params.delete("status"); // Remove the param entirely if "ALL" is selected
    }
    
    // 3. Trigger the SSR Server Action update
    startTransition(() => {
      replace(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="relative flex items-center">
      <Filter 
        className={`absolute left-3 pointer-events-none ${isPending ? 'text-teal-500 animate-pulse' : 'text-slate-500'}`} 
        size={16} 
      />
      <select
        defaultValue={searchParams.get("status")?.toString() || "ALL"}
        onChange={(e) => handleFilter(e.target.value)}
        className="appearance-none pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/20 cursor-pointer transition-all disabled:opacity-50"
        disabled={isPending}
      >
        <option value="ALL">All Statuses</option>
        <option value="DRAFT">Drafts</option>
        <option value="SENT">Sent to Client</option>
        <option value="PAID">Settled / Paid</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
    </div>
  );
}