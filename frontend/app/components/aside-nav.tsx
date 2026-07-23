'use client';

import {
  Users,
  FileText,
  TrendingUp,
} from "lucide-react";

import { usePathname } from 'next/navigation';
import { useAuthState } from '../utils/store';
import Link from 'next/link';
import React from 'react';

const routeMaps: Record<string, number> = {
  dashboard: 0,
  ledger: 1,
  crm: 2
};

const routeStyle = {
  active: 'bg-slate-900 text-white',
  notActive: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
}

export default function AsideNav() {
  const pathName = usePathname();
  const paths = pathName.split('/');
  const currentPath = paths[paths.length - 1];
  const [currentIndex, setCurrentIndex] = React.useState<number>(routeMaps[currentPath]);
  const loggedEmail = useAuthState(state => state.email);

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 p-5 flex flex-col justify-between md:flex">
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2">
            <div className="h-8 w-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-lg">
              A
            </div>
            <span className="font-bold text-lg tracking-tight bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              AccountFlow Pro
            </span>
          </div>

          <nav className="space-y-1">
            <Link href="/super/dashboard" onClick={() => setCurrentIndex(0)} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${currentIndex === 0 ? routeStyle.active : routeStyle.notActive} font-medium text-sm transition-all`}>
              <TrendingUp size={18} /> Dashboard
            </Link>
            <Link href="/super/ledger" onClick={() => setCurrentIndex(1)} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${currentIndex === 1 ? routeStyle.active : routeStyle.notActive} font-medium text-sm transition-all`}>
              <FileText size={18} /> Financial Ledger
            </Link>
            <Link href="/super/crm" onClick={() => setCurrentIndex(2)} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${currentIndex === 2 ? routeStyle.active : routeStyle.notActive} font-medium text-sm transition-all`}>
              <Users size={18} /> Clients (CRM)
            </Link>
          </nav>
        </div>

        <div className="border-t border-slate-100 pt-4 px-2">
          <p className="text-xs font-semibold text-slate-400">LOGGED IN AS</p>
          <p className="text-sm font-medium text-slate-800">Demo Manager</p>
        </div>
      </aside>
  )
}
