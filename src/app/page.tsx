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

  React.useEffect(() => {
    if (activeStoreId) {
      fetch(`/api/connections/status?storeId=${activeStoreId}&service=SHOPIFY`)
        .then(res => res.json())
        .then(data => setIsConnected(data.isConnected));
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

  return (
    <PageShell loading={isConnected === null} loadingMessage="VERIFICANDO CONEXIÓN...">
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

      <div className="flex flex-col gap-4 p-6 animate-in fade-in duration-500">

        {/* High-Density KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Ventas Hoy', value: '€2,450.00', trend: '+12.5%', color: 'text-emerald-500' },
            { label: 'Profit Neto', value: '€842.20', trend: '34.3%', color: 'text-rose-500' },
            { label: 'ROAS Global', value: '3.45x', trend: '-2.1%', color: 'text-amber-500' },
            { label: 'Pedidos Pend.', value: '14', trend: 'Auditando', color: 'text-blue-500' }
          ].map((kpi, i) => (
            <Card key={i} className="glass-card border-none overflow-hidden h-24">
              <CardContent className="p-3 flex flex-col justify-between h-full">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none">{kpi.label}</span>
                <div className="flex items-baseline justify-between mt-auto">
                  <span className="text-lg font-black tracking-tighter text-slate-900">{kpi.value}</span>
                  <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/50 backdrop-blur-sm shadow-sm", kpi.color)}>
                    {kpi.trend}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Areas - Two Column High-Density */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <Card className="lg:col-span-2 glass-card border-none min-h-[300px]">
            <CardHeader className="p-3 flex flex-row items-center justify-between border-b border-white/10">
              <CardTitle className="text-xs font-black uppercase tracking-wider">Actividad de Pedidos</CardTitle>
              <TrendingUp className="w-4 h-4 text-slate-300" />
            </CardHeader>
            <CardContent className="p-0">
              {/* Table Mockup Placeholder */}
              <div className="h-[250px] flex items-center justify-center text-slate-300 italic text-[10px]">
                Cargando métricas de operaciones...
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-none h-fit">
            <CardHeader className="p-3 border-b border-white/10">
              <CardTitle className="text-xs font-black uppercase tracking-wider">Alertas IA</CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {[
                { icon: Activity, label: 'CPA Spike en Meta', urgency: 'HIGH' },
                { icon: ShieldCheck, label: '3 Pedidos de Alto Riesgo', urgency: 'MED' },
                { icon: Bot, label: 'Research Lab Completado', urgency: 'LOW' }
              ].map((alert, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/30 border border-white/20">
                  <alert.icon className="w-4 h-4 text-rose-400" />
                  <span className="text-[11px] font-bold text-slate-700 truncate">{alert.label}</span>
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
