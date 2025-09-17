
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { LanguageProvider } from "@/context/language-context";
import { PT_Sans, Roboto_Slab } from 'next/font/google';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});

const robotoSlab = Roboto_Slab({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-roboto-slab',
});

export const metadata: Metadata = {
  title: "KrishiAI",
  description: "Your Personal AI Agri-Scientist, Always in Your Pocket.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${ptSans.variable} ${robotoSlab.variable}`}>
      <head/>
      <body className="font-body antialiased">
        <LanguageProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <main className="flex-1 p-4 sm:p-6">{children}</main>
            </SidebarInset>
          </SidebarProvider>
        </LanguageProvider>
        <Toaster />
      </body>
    </html>
  );
}
