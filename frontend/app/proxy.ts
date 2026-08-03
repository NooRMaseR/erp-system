import type { NextRequest } from 'next/server';
import { BASE_API_URL } from './utils/api';
import { NextResponse } from 'next/server';

function isTokenExpired(token: string) {
  try {

    const payload = JSON.parse(atob(token.split(".")[1]));
    return (payload.exp * 1000) < Date.now() + 15000;
  } catch {
    return true;
  }
}
export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('auth_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value; 
  
  const { pathname } = request.nextUrl;
  const isProtectedRoute = pathname.startsWith('/super') || pathname.startsWith('/client');

  // 1. لا يوجد أي توكن ويحاول الدخول لمسارات محمية ⬅️ اطرده لصفحة الدخول
  if (isProtectedRoute && !accessToken && !refreshToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 2. يحاول الدخول لمسار محمي، وهناك رفريش توكن، لكن الأكسس توكن مفقود أو منتهي ⬅️ نجدده بصمت
  if (isProtectedRoute && refreshToken && (!accessToken || isTokenExpired(accessToken))) {
    try {
      // الاتصال بسيرفر Django لتجديد التوكن (تأكد من الرابط الخاص بالباك إند)
      const res = await fetch(`${BASE_API_URL}/refresh-token/`, {
        method: "GET",
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        
        const response = NextResponse.next();
        
        response.cookies.set('auth_token', data.access_token, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          path: "/",
        });

        // (اختياري) إذا كان سيرفرك يصدر رفريش توكن جديد مع كل عملية تجديد
        // if (data.refresh) {
        //   response.cookies.set('refresh_token', data.refresh, {
        //     httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7
        //   });
        // }

        // 🟢 تحديث الكوكي في الطلب الحالي (Request) لكي تقرأه الـ Server Components بشكل صحيح
        request.cookies.set('auth_token', data.access_token);
        
        return response;
      } else {
        // 🔴 إذا فشل التجديد (الرفريش توكن نفسه منتهي أو غير صالح)
        const response = NextResponse.redirect(new URL('/', request.url));
        response.cookies.delete('auth_token');
        response.cookies.delete('refresh_token');
        return response;
      }
    } catch {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 3. التوكن صالح، أو المسار غير محمي ⬅️ دعه يمر
  return NextResponse.next();
}

export const config = {
  // مطابقة كل المسارات عدا ملفات النظام والصور
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};