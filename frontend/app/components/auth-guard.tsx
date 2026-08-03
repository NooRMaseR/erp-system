"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuthState } from "../utils/store";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { API } from "@/app/utils/api";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, login } = useAuthState();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const authenticate = async () => {
      if (!pathname.startsWith("/super") && !pathname.startsWith("/client")) {
        setIsInitializing(false);
        return;
      }

      // إذا كانت البيانات غير موجودة في Zustand، نجلبها من الـ Backend
      let currentUser = user;
      
      if (!currentUser) {
        // الاتصال بنقطة test-auth (تأكد من المسار الصحيح للـ endpoint الخاص بك)
        const { data, error } = await API.GET("/test-auth/"); 

        if (error || !data) {
          router.replace("/");
          return;
        }
        
        currentUser = data;
        login(data);
      }

      // --- التوجيه الذكي (Role-based Routing) ---
      if (currentUser.role === "CLIENT" && pathname.startsWith("/super")) {
        router.replace("/client/invoices");
      } else if (currentUser.role !== "CLIENT" && pathname.startsWith("/client")) {
        router.replace("/super/dashboard");
      } else {
        setIsInitializing(false);
      }
    };

    authenticate();
  }, [pathname, user, router, login]);

  // شاشة تحميل بيضاء بسيطة لحين التحقق من الصلاحيات (حتى لا تومض الشاشات الخاطئة)
  if (isInitializing && (pathname.startsWith("/super") || pathname.startsWith("/client"))) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-teal-600" size={32} />
      </div>
    );
  }

  return <>{children}</>;
}