"use client";

import React from "react";
import { useProduct } from "@/context/ProductContext";
import {
    BarChart3,
    TrendingUp,
    ShoppingCart,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Video,
    Wallet,
    AlertCircle,
    ChevronRight,
    Info,
    Package
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { t } from "@/lib/constants/translations";

export default function ProductOverviewPage() {
    const { product, isLoading } = useProduct();

    if (isLoading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-slate-100 rounded-2xl border border-slate-200" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="h-64 bg-slate-100 rounded-3xl border border-slate-200" />
                    <div className="h-64 bg-slate-100 rounded-3xl border border-slate-200" />
                </div>
            </div>
        );
    }

    if (!product) return (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <AlertCircle className="w-12 h-12 text-rose-400 mb-4" />
            <h2 className="text-xl font-bold text-slate-900">{t('not_found_product')}</h2>
            <p className="text-slate-500 mt-1">{t('not_found_product_desc')}</p>
            <Link href="/dashboard/productos" className="mt-6">
                <Button>{t('back_to_list')}</Button>
            </Link>
        </div>
    );

    return (
        <div className="space-y-8">
            {/* KPI Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title={t('total_sales')}
                    value={`€${(product.metrics?.revenue || 0).toLocaleString()}`}
                    change="+12.5%"
                    isPositive={true}
                    icon={TrendingUp}
                />
                <MetricCard
                    title={t('roas_avg')}
                    value={`${(product.metrics?.roas || 0).toFixed(2)}x`}
                    change="+0.4"
                    isPositive={true}
                    icon={BarChart3}
                />
                <MetricCard
                    title={t('ads_spend')}
                    value={`€${(product.metrics?.spend || 0).toLocaleString()}`}
                    change="-5.2%"
                    isPositive={false}
                    icon={Wallet}
                />
                <MetricCard
                    title={t('orders_count')}
                    value="142"
                    change="+18"
                    isPositive={true}
                    icon={ShoppingCart}
                />
            </div>

            {/* Modules Quick Access */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Research Status */}
                <ModuleStatusCard
                    title={t('research_lab')}
                    description={t('market_analysis_desc')}
                    progress={75}
                    statusText={t('phase_3_refinement')}
                    href={`/research`}
                    icon={Search}
                />

                {/* Creative Production */}
                <ModuleStatusCard
                    title={t('creative_factory')}
                    description={t('ai_creative_gen_desc')}
                    progress={40}
                    statusText={`2 ${t('processing_videos')}`}
                    href={`/marketing`}
                    icon={Video}
                    color="blue"
                />
            </div>

            {/* Product Info Summary */}
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <div className="flex items-start justify-between mb-8">
                    <div className="text-left">
                        <h2 className="text-2xl font-bold text-slate-900">{t('product_config')}</h2>
                        <p className="text-slate-500">{t('integration_status_desc')}</p>
                    </div>
                    <Link href={`/dashboard/productos/${product.id}/settings`}>
                        <Button variant="outline" className="rounded-xl border-slate-200 border-dashed hover:border-blue-300 hover:bg-blue-50 transition-all font-bold text-xs uppercase tracking-widest">
                            {t('edit_config')}
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <InfoItem label={t('family')} value={product.productFamily || "N/A"} icon={Package} />
                    <InfoItem
                        label="Meta Pixel"
                        value={product.metaConfig?.pixelId || t('pixel_pending')}
                        isWarning={!product.metaConfig?.pixelId}
                        icon={TrendingUp}
                    />
                    <InfoItem
                        label="Repositorio"
                        value={product.driveFolderId ? t('connected') : t('disconnected')}
                        isWarning={!product.driveFolderId}
                        icon={Info}
                    />
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, change, isPositive, icon: Icon }: any) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <Icon className="w-5 h-5" />
                </div>
                <div className={cn(
                    "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                    isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                )}>
                    {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {change}
                </div>
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{value}</div>
        </div>
    );
}

function ModuleStatusCard({ title, description, progress, statusText, href, icon: Icon, color = "emerald" }: any) {
    const colorClasses: any = {
        emerald: "bg-emerald-50 text-emerald-600",
        blue: "bg-blue-50 text-blue-600"
    };

    const progressClasses: any = {
        emerald: "[&>div]:bg-emerald-500",
        blue: "[&>div]:bg-blue-500"
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all group">
            <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500", colorClasses[color])}>
                        <Icon className="w-7 h-7" />
                    </div>
                    <Link href={href}>
                        <Button variant="ghost" className="rounded-xl group/btn font-bold text-[10px] uppercase tracking-widest">
                            {t('enter')}
                            <ChevronRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-6">{description}</p>

                <div className="space-y-4">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-left">
                        <span className="text-slate-400">{t('completion_status')}</span>
                        <span className={color === 'emerald' ? 'text-emerald-600' : 'text-blue-600'}>{progress}%</span>
                    </div>
                    <Progress value={progress} className={cn("h-2 bg-slate-100", progressClasses[color])} />
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                        <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", color === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500')} />
                        {statusText}
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoItem({ label, value, isWarning, icon: Icon }: any) {
    return (
        <div className="flex items-center gap-3">
            <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                isWarning ? "bg-amber-50 text-amber-500" : "bg-slate-50 text-slate-400"
            )}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
                <div className={cn(
                    "text-sm font-bold truncate max-w-[150px]",
                    isWarning ? "text-amber-700" : "text-slate-700"
                )}>
                    {value}
                </div>
            </div>
        </div>
    );
}
