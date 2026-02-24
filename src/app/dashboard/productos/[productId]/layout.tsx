"use client";

import React from "react";
import { ProductProvider } from "@/context/ProductContext";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Search,
    Video,
    BarChart3,
    Package,
    Wallet,
    ChevronRight,
    Home
} from "lucide-react";
import { t } from "@/lib/constants/translations";

const navItems = [
    { name: t('overview'), href: "", icon: LayoutDashboard },
    { name: t('research'), href: "/research", icon: Search, isGlobal: true },
    { name: t('marketing'), href: "/marketing", icon: Video, isGlobal: true },
    { name: t('analytics'), href: "/analiticas", icon: BarChart3, isGlobal: true },
    { name: t('orders'), href: "/pedidos", icon: Package, isGlobal: true },
    { name: t('financials'), href: "/contabilidad", icon: Wallet, isGlobal: true },
];

export default function ProductDashboardLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const pathname = usePathname();
    const productId = params.productId as string;

    const getBaseHref = () => `/dashboard/productos/${productId}`;

    return (
        <ProductProvider productId={productId}>
            <div className="space-y-6">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                    <Link href="/dashboard" className="hover:text-slate-800 transition-colors flex items-center gap-1">
                        <Home className="w-3.5 h-3.5" />
                        <span>Dashboard</span>
                    </Link>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <Link href="/dashboard/productos" className="hover:text-slate-800 transition-colors">
                        Productos
                    </Link>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span className="font-medium text-slate-900 truncate max-w-[200px]">
                        {productId}
                    </span>
                </nav>

                {/* Sub-Navigation Tabs */}
                <div className="flex items-center gap-1 bg-white/50 backdrop-blur-sm p-1 rounded-xl border border-slate-200 w-fit">
                    {navItems.map((item) => {
                        const href = item.isGlobal ? item.href : getBaseHref() + item.href;
                        const isActive = pathname === href || (item.href !== "" && pathname.startsWith(href));

                        return (
                            <Link
                                key={item.name}
                                href={href}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200",
                                    isActive
                                        ? "bg-white text-indigo-600 shadow-lg shadow-indigo-100/50 border border-slate-200"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-white"
                                )}
                            >
                                <item.icon className={cn("w-4 h-4", isActive ? "text-indigo-500" : "text-slate-400")} />
                                {item.name}
                            </Link>
                        );
                    })}
                </div>

                {/* Page Content */}
                <div className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {children}
                </div>
            </div>
        </ProductProvider>
    );
}
