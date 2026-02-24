"use client";

import React from "react";
import { useProduct } from "@/context/ProductContext";
import { useProductFinancials } from "@/hooks/useProductFinancials";
import { ProductFinancialsDashboard } from "@/components/finances/ProductFinancialsDashboard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Wallet, Landmark, Loader2, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

import { t } from "@/lib/constants/translations";

export default function ProductFinancialsPage() {
 const { productId, product, allProducts } = useProduct();

 if (!productId) {
 return (
 <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center animate-in fade-in duration-700">
 <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center">
 <AlertCircle className="w-10 h-10 text-rose-500" />
 </div>
 <div className="space-y-2">
 <h2 className="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Contexto Requerido</h2>
 <p className="text-slate-500 max-w-sm mx-auto font-medium">Por favor, selecciona un producto en el menú lateral para acceder a Contabilidad & Finanzas.</p>
 </div>
 <div className="flex gap-4">
 <div className="flex -space-x-3 overflow-hidden p-1">
 {allProducts.slice(0, 3).map((p) => (
 <div key={p.id}
className="inline-block h-10 w-10 rounded-xl ring-4 ring-white shadow-sm overflow-hidden bg-slate-100">
 {p.imageUrl ? <img src={p.imageUrl} alt="" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">?</div>}
 </div>
 ))}
 </div>
 </div>
 </div>
 );
 }

 const {
 financialData,
 loading,
 dateRange,
 setDateRange,
 loadFinancials
 } = useProductFinancials(productId);

 return (
 <div className="flex flex-col h-screen bg-[#F8FAFC]">
 <ScrollArea className="flex-1">
 <main className="max-w-[1600px] mx-auto p-6 pb-20 space-y-6">

 {/* Header Section */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 px-6 py-5 rounded-2xl border border-slate-100 shadow-sm">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-xl bg-rose-600 flex items-center justify-center shadow-sm">
 <Landmark className="w-6 h-6 text-white" />
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('profitability_lab')}</h1>
 <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-rose-100">Financials v4</span>
 </div>
 <p className="text-slate-500 text-xs font-medium flex items-center gap-2 mt-0.5 whitespace-nowrap">
 {t('unit_economics_desc')}
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2">
 <Button
 variant="outline"
 className="h-10 px-4 rounded-xl border-slate-200 text-slate-600 font-bold active:scale-95 transition-all flex items-center gap-2 text-xs"
 >
 <Calendar className="w-3.5 h-3.5 text-slate-400" />
 {t('monthly')}
 </Button>
 </div>
 </div>

 {/* Content Section */}
 {loading && !financialData ? (
 <div className="flex flex-col items-center justify-center py-20 gap-4">
 <Loader2 className="w-10 h-10 text-rose-400 animate-spin" />
 <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">{t('calculating_profit')}</p>
 </div>
 ) : (
 <ProductFinancialsDashboard
 data={financialData}
 loading={loading}
 />
 )}

 </main>
 </ScrollArea>
 </div>
 );
}
