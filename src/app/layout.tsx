import React from "react";
import type { Metadata } from "next";
import { Outfit } from "next/font/google"; // Switch to Outfit for a more modern, premium feel
import "./globals.css";
import AppLayout from "@/components/layout/app-layout";
import { Toaster } from "sonner";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ecombom Control | Operations OS",
  description: "Advanced E-commerce Management Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${outfit.className} antialiased`} suppressHydrationWarning>
        <AppLayout>
          {children}
        </AppLayout>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
