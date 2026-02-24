"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, Activity, ShieldCheck, Bot, LayoutDashboard, AlertCircle, Link2 } from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { ModuleHeader } from "@/components/ui/ModuleHeader";
import React from "react";
import { useStore } from "@/lib/store/store-context";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { activeStoreId } = useStore();
  const [isConnected, setIsConnected] = React.useState<boolean | null>(null);
  const [stats, setStats] = React.useState<any>(null);
  const [loadingStats, setLoadingStats] = React.useState(true);

  React.useEffect(() => {
    if (activeStoreId) {
      // 1. Check Shopify Connection
      fetch(`/api/connections/status?storeId=${activeStoreId}&service=SHOPIFY`)
        .then(res => res.json())
        .then(data => setIsConnected(data.isConnected));

      // 2. Fetch Profit Stats
      setLoadingStats(true);
      fetch('/api/finances/profit-stats', {
        headers: { 'X-Store-Id': activeStoreId }
      })
        .then(res => res.json())
        .then(data => {
          setStats(data);
          setLoadingStats(false);
        })
        .catch(err => {
          console.error("Error fetching dashboard stats:", err);
          setLoadingStats(false);
        });
    }
  }, [activeStoreId]);

  if (isConnected === false) {
    return (
      <PageShell>
        <ModuleHeader title="Control Maestro" subtitle="Visión Global de Operaciones" icon={LayoutDashboard} />
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 mt-6">
          <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-rose-500" />
          </div>
          <div className="space-y-2 text-center">
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">Shopify No Conectado</h2>
            <p className="text-slate-500 max-w-sm mx-auto font-medium text-sm">Debes vincular tu tienda oficial de Shopify para ver las operaciones globales.</p>
          </div>
          <Link href="/connections">
            <Button className="bg-rose-500 hover:bg-black text-white font-black text-[10px] uppercase tracking-widest h-10 px-6 rounded-xl shadow-lg shadow-rose-500/20">
              <Link2 className="w-4 h-4 mr-2" />
              Ir a Conexiones
            </Button>
          </Link>
        </div>
      </PageShell>
    );
  }

  const kpis = [
    { label: 'Ventas Hoy', value: stats ? `€${stats.totalRevenue?.toLocaleString('es-ES', { minimumFractionDigits: 2 })}` : '€0,00', trend: stats ? '+0.0%' : '...', color: 'text-emerald-500' },
    { label: 'Profit Neto', value: stats ? `€${stats.netProfit?.toLocaleString('es-ES', { minimumFractionDigits: 2 })}` : '€0,00', trend: stats ? '10.0%' : '...', color: 'text-rose-500' },
    { label: 'COGS Est.', value: stats ? `€${stats.totalCogs?.toLocaleString('es-ES', { minimumFractionDigits: 2 })}` : '€0,00', trend: '...', color: 'text-amber-500' },
    { label: 'Logística', value: stats ? `€${stats.totalLogistics?.toLocaleString('es-ES', { minimumFractionDigits: 2 })}` : '€0,00', trend: 'Auditando', color: 'text-blue-500' }
  ];

  return (
    <PageShell loading={isConnected === null || (loadingStats && !stats)} loadingMessage="ACTUALIZANDO DASHBOARD...">
      <ModuleHeader
        title="Control Maestro"
        subtitle="Visión Global de Operaciones"
        icon={LayoutDashboard}
        actions={
          <>
            <div className="h-8 w-24 bg-white/50 border border-slate-200 rounded-md" />
            <div className="h-8 w-8 bg-white/50 border border-slate-200 rounded-md" />
          </>
        }
      />

      <div className="flex flex-col gap-1 p-1 animate-in fade-in duration-500">

        {/* High-Density KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1">
          {kpis.map((kpi, i) => (
            <div key={i} className="glass-card border-none overflow-hidden h-[52px]">
              <div className="p-1.5 flex flex-col justify-between h-full">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 leading-none">{kpi.label}</span>
                <div className="flex items-baseline justify-between mt-0">
                  <span className="text-[18px] font-black tracking-tighter text-slate-900 leading-none">{kpi.value}</span>
                  <span className={cn("text-[9px] font-bold px-1 py-0 rounded-full bg-white/50 shadow-sm", kpi.color)}>
                    {kpi.trend}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Areas - Two Column High-Density */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-1">
          <Card className="lg:col-span-2 glass-card border-none min-h-[140px]">
            <CardHeader className="px-2 py-0.5 flex flex-row items-center justify-between border-b border-white/10 h-7">
              <CardTitle className="text-[11px] font-black uppercase tracking-wider">Actividad de Pedidos Recientes</CardTitle>
              <TrendingUp className="w-3 h-3 text-slate-400" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-2 space-y-1">
                {stats?.recentOrders?.length > 0 ? (
                  stats.recentOrders.map((order: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-1.5 bg-white/40 rounded-lg border border-white/20 text-[10px]">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900">#{order.orderNumber}</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold uppercase text-[8px] border border-slate-200/50">
                          {order.logisticsStatus}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn("font-bold", order.profit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                          {order.profit >= 0 ? "+" : ""}€{order.profit.toFixed(2)}
                        </span>
                        <span className="text-slate-400 font-medium italic">{order.status}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-[100px] flex items-center justify-center text-slate-400 italic text-[10px] font-bold">
                    No hay actividad reciente para esta tienda.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-none h-fit">
            <CardHeader className="px-2 py-1 border-b border-white/10">
              <CardTitle className="text-[10px] font-black uppercase tracking-wider">Alertas IA</CardTitle>
            </CardHeader>
            <CardContent className="p-1 space-y-0.5">
              {[
                { icon: Activity, label: 'CPA Spike en Meta', urgency: 'HIGH' },
                { icon: ShieldCheck, label: '3 Pedidos de Alto Riesgo', urgency: 'MED' },
                { icon: Bot, label: 'Research Lab Completado', urgency: 'LOW' }
              ].map((alert, i) => (
                <div key={i} className="flex items-center gap-1.5 p-1 rounded bg-white/30 border border-white/20">
                  <alert.icon className="w-3 h-3 text-rose-500" />
                  <span className="text-[10px] font-bold text-slate-700 truncate">{alert.label}</span>
                  <div className={cn("ml-auto w-1.5 h-1.5 rounded-full shadow-sm",
                    alert.urgency === 'HIGH' ? 'bg-rose-500' : alert.urgency === 'MED' ? 'bg-amber-500' : 'bg-emerald-500'
                  )} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
