import React from 'react'
import AsideNav from '../components/aside-nav';
import { Toaster } from "@/components/ui/sonner";

export default function Layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            // className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
            className={'h-full antialiased'}
        >
            <body className="min-h-full w-full flex flex-row">
                <AsideNav />
                {children}
                <Toaster position="bottom-right" />
            </body>
        </html>
    );
}
