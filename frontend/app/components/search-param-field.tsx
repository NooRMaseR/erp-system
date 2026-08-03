"use client";

import { Filter, Search } from "lucide-react";
import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type SearchParamFieldProps = {
  by: string;
  type?: "search" | "select";
  placeholder?: string;
  selectOptions?: {
    label: string,
    value: string | number,
  }[];
}

export function SearchParamField({ by, placeholder, type = "search", selectOptions }: SearchParamFieldProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const [isPending, startTransition] = useTransition();
  const [canSearch, setCanSearch] = useState<boolean>(true);

  const handleSearch = (term: string) => {
    if (!canSearch) return;

    const params = new URLSearchParams(searchParams);

    if (term) {
      params.set(by, term);
    } else {
      params.delete(by);
    }
    if (type === "search") {

      setCanSearch(false);

      setTimeout(() => {
        setCanSearch(true);
      }, 1000);
    }

    startTransition(() => {
      replace(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="relative flex w-full sm:w-96 items-center">
      {
        type === "select" ? (
          <>
            <Filter
              className={`absolute right-3 pointer-events-none ${isPending ? 'text-teal-500 animate-pulse' : 'text-slate-500'}`}
              size={16}
            />
            <select
              defaultValue={searchParams.get(by)?.toString()}
              onChange={(e) => handleSearch(e.target.value)}
              className="appearance-none pr-9 pl-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/20 cursor-pointer transition-all disabled:opacity-50 w-full sm:w-auto"
              disabled={isPending}
            >
              {selectOptions?.map((option, idx) => (
                <option key={idx} value={option.value}>{option.label}</option>
              ))}
            </select>
          </>
        )
          : (
            <>
              <Search
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${isPending ? 'text-teal-500 animate-pulse' : 'text-slate-400'}`}
                size={18}
              />
              <input
                type="search"
                inputMode="search"
                placeholder={placeholder}
                defaultValue={searchParams.get(by)?.toString()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(e.currentTarget.value);
                  };
                }}
                className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all text-right"
              />
            </>
          )
      }
    </div>
  );
}