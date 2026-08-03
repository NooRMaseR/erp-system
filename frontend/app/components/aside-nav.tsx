'use client';

import {
  Users,
  FileText,
  TrendingUp,
  LogOut,
  Logs,
  Menu,
  X,
  ChevronRight,
  ChevronLeft
} from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePathname } from 'next/navigation';
import { useAuthState } from '../utils/store';
import { useState, useEffect } from 'react';
import LogoutButton from "./logout-btn";
import Link from 'next/link';

const routeMaps: Record<string, number> = {
  dashboard: 0,
  ledger: 1,
  crm: 2,
  hr: 3,
  audit: 4
};

const routeStyle = {
  active: 'bg-slate-900 text-white',
  notActive: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
}

export default function AsideNav() {
  const pathName = usePathname();
  const paths = pathName.split('/');
  const currentPath = paths[paths.length - 1];
  const [currentIndex, setCurrentIndex] = useState<number>(routeMaps[currentPath] || 0);

  const [isCollapsed, setIsCollapsed] = useState(true);
  
  const loggedEmail = useAuthState(state => state.user?.email);
  const userRole = useAuthState(state => state.user?.role);

  useEffect(() => {
    if (window.innerWidth >= 768) {
      setIsCollapsed(false);
    }
  }, []);

  const handleNavClick = (index: number) => {
    setCurrentIndex(index);
    if (window.innerWidth < 768) {
      setIsCollapsed(true);
    }
  };

  return (
    <>
      {/* 📱 1. الـ App Bar (شريط التطبيق العلوي) - يظهر للموبايل فقط */}
      <div className="md:hidden sticky top-0 z-40 w-full bg-white border-b border-slate-200 p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            A
          </div>
          <span className="font-bold text-lg tracking-tight bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            AccountFlow Pro
          </span>
        </div>
        <button 
          onClick={() => setIsCollapsed(false)}
          className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* 🌑 2. الطبقة المعتمة (Overlay) - تظهر على الموبايل عند فتح القائمة */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* 🖥️ 3. القائمة الجانبية (Drawer للموبايل / Sidebar للديسكتوب) */}
      {/* استخدمنا right-0 لأننا في بيئة RTL */}
      <aside 
        className={`h-svh fixed md:sticky top-0 right-0 z-50 bg-white border-l border-slate-200/80 flex flex-col justify-between transition-transform duration-300 ease-in-out md:transition-all
          ${isCollapsed 
            ? 'translate-x-full md:translate-x-0 md:w-20 md:p-4' // للموبايل: خارج الشاشة | للديسكتوب: مقلصة
            : 'translate-x-0 w-64 p-5 shadow-2xl md:shadow-none' // مفتوحة بالكامل
          }
        `}
      >
        {/* زر الإغلاق للموبايل (X) */}
        <button 
          onClick={() => setIsCollapsed(true)}
          className="md:hidden absolute top-5 left-5 text-slate-500 hover:bg-slate-100 p-1.5 rounded-lg"
        >
          <X size={20} />
        </button>

        {/* زر الطي للديسكتوب (Chevron) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`hidden md:flex absolute top-8 -left-3 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-full p-1.5 shadow-md hover:bg-slate-50 transition-all z-60 cursor-pointer items-center justify-center`}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className="space-y-6 mt-2 md:mt-0">
          {/* الترويسة واللوجو (تختفي على الموبايل لأنها موجودة في الـ App Bar، وتظهر في الديسكتوب) */}
          <div className={`hidden md:flex items-center gap-2 px-1 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="h-8 w-8 shrink-0 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              A
            </div>
            <span className={`font-bold text-lg tracking-tight bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent truncate transition-opacity duration-300 ${isCollapsed ? 'hidden' : 'block'}`}>
              AccountFlow Pro
            </span>
          </div>

          <nav className="space-y-2">
            <Link 
              href="/super/dashboard" 
              title="Dashboard"
              onClick={() => handleNavClick(0)} 
              className={`flex items-center gap-3 rounded-lg font-medium text-sm transition-all ${
                currentIndex === 0 ? routeStyle.active : routeStyle.notActive
              } ${isCollapsed ? 'md:justify-center p-2' : 'px-3 py-2'}`}
            >
              <TrendingUp size={18} className="shrink-0" />
              <span className={isCollapsed ? 'md:hidden' : 'block'}>Dashboard</span>
            </Link>
            
            <Link 
              href="/super/ledger" 
              title="Financial Ledger"
              onClick={() => handleNavClick(1)} 
              className={`flex items-center gap-3 rounded-lg font-medium text-sm transition-all ${
                currentIndex === 1 ? routeStyle.active : routeStyle.notActive
              } ${isCollapsed ? 'md:justify-center p-2' : 'px-3 py-2'}`}
            >
              <FileText size={18} className="shrink-0" />
              <span className={isCollapsed ? 'md:hidden' : 'block'}>Financial Ledger</span>
            </Link>
            
            <Link 
              href="/super/crm" 
              title="Clients (CRM)"
              onClick={() => handleNavClick(2)} 
              className={`flex items-center gap-3 rounded-lg font-medium text-sm transition-all ${
                currentIndex === 2 ? routeStyle.active : routeStyle.notActive
              } ${isCollapsed ? 'md:justify-center p-2' : 'px-3 py-2'}`}
            >
              <Users size={18} className="shrink-0" />
              <span className={isCollapsed ? 'md:hidden' : 'block'}>Clients (CRM)</span>
            </Link>
            
            <Link 
              href="/super/hr" 
              title="HR"
              onClick={() => handleNavClick(3)} 
              className={`flex items-center gap-3 rounded-lg font-medium text-sm transition-all ${
                currentIndex === 3 ? routeStyle.active : routeStyle.notActive
              } ${isCollapsed ? 'md:justify-center p-2' : 'px-3 py-2'}`}
            >
              <Users size={18} className="shrink-0" />
              <span className={isCollapsed ? 'md:hidden' : 'block'}>HR</span>
            </Link>
            
            {["MANAGER", "SUPER_ADMIN"].includes(userRole as string) &&
              <Link 
                href="/super/audit" 
                title="Audit Logs"
                onClick={() => handleNavClick(4)} 
                className={`flex items-center gap-3 rounded-lg font-medium text-sm transition-all ${
                  currentIndex === 4 ? routeStyle.active : routeStyle.notActive
                } ${isCollapsed ? 'md:justify-center p-2' : 'px-3 py-2'}`}
              >
                <Logs size={18} className="shrink-0" />
                <span className={isCollapsed ? 'md:hidden' : 'block'}>Audit</span>
              </Link>
            }
          </nav>
        </div>

        <div className={`border-t border-slate-100 pt-4 px-2 flex ${isCollapsed ? 'md:flex-col md:items-center gap-4' : 'flex-col'}`}>
          <p className={`text-xs font-semibold text-slate-400 mb-2 ${isCollapsed ? 'md:hidden' : 'block'}`}>LOGGED IN AS</p>
          
          <div className={`flex w-full ${isCollapsed ? 'md:justify-center' : 'justify-between items-center'}`}>
            <p className={`text-sm font-medium text-slate-800 truncate pr-2 ${isCollapsed ? 'md:hidden' : 'block'}`}>
              {loggedEmail ?? 'Demo Manager'}
            </p>

            <Dialog>
              <DialogTrigger asChild>
                <button 
                  title="تسجيل الخروج"
                  className="text-slate-500 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  <LogOut size={isCollapsed ? 20 : 18} />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>تسجيل الخروج؟</DialogTitle>
                  <DialogDescription>هل انت متأكد من أنك تريد تسجيل الخروج؟</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <LogoutButton />
                  <DialogClose asChild>
                    <Button className='cursor-pointer' variant="outline">إلغاء</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </aside>
    </>
  );
}