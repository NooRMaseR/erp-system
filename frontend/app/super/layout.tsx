import React from 'react'
import AsideNav from '../components/aside-nav';
import { Toaster } from "@/components/ui/sonner";

export default function Layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <AsideNav />
            <main className="flex-1 w-full flex flex-col min-w-0">
                {children}
            </main>
            <Toaster position="bottom-right" />
        </>
    );
}
