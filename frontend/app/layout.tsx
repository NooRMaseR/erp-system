import AuthGuard from "./components/auth-guard";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AccountFlow Pro",
  description: "Effortlessly manage your accounting and finance operations with AccountFlow Pro. Our ERP system streamlines your bookkeeping, invoicing, and financial reporting processes, providing you with real-time insights and automated tools to drive growth and efficiency.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      className={'h-full antialiased'}
    >
      <body className="min-h-full w-full flex flex-col md:flex-row bg-slate-50/50">
        <AuthGuard>
          {children}
        </AuthGuard>
      </body>
    </html>
  );
}
