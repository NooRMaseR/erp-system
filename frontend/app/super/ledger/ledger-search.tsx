"use client";

import { Search } from "lucide-react";
import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function LedgerSearch() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const [isPending, startTransition] = useTransition();
  const [canSearch, setCanSearch] = useState<boolean>(true);

  const handleSearch = (term: string) => {
    if (!canSearch) return;

    const params = new URLSearchParams(searchParams);
    
    if (term) {
      params.set("inv", term);
    } else {
      params.delete("inv");
    }
    setCanSearch(false);

    setTimeout(() => {
      setCanSearch(true);
    }, 1000);
    
    startTransition(() => {
      replace(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="relative w-full sm:w-96">
      <Search 
        className={`absolute left-3 top-1/2 -translate-y-1/2 ${isPending ? 'text-teal-500 animate-pulse' : 'text-slate-400'}`} 
        size={18} 
      />
      <input
        type="text"
        placeholder="Search invoice serial (e.g. INV-2026)..."
        defaultValue={searchParams.get("inv")?.toString()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleSearch(e.currentTarget.value);
          };
        }}
        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all"
      />
    </div>
  );
}