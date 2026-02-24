"use client";

import { useState } from "react";
import {
    Settings, Plug, Bell, Shield,
    CreditCard, Activity, Globe, Lock,
    ChevronRight, ExternalLink, Zap,
    Database, Mail, MessageSquare
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { PageShell } from "@/components/ui/PageShell";
import { ModuleHeader } from "@/components/ui/ModuleHeader";
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from "@/lib/styles/tokens";

export default function SettingsHubPage() {
    const [activeSection, setActiveSection] = useState("general");

    const sections = [
        { id: "general", label: "General", icon: Settings, description: "Configuración global" },
        { id: "connections", label: "Conexiones", icon: Plug, description: "Shopify, Meta, APIs", href: "/connections" },
        { id: "notifications", label: "Alertas", icon: Bell, description: "Stock, pedidos, incidencias", href: "/settings/notifications" },
        { id: "billing", label: "Facturación", icon: CreditCard, description: "Planes y uso de IA" },
        { id: "security", label: "Seguridad", icon: Shield, description: "Accesos y roles" },
        { id: "api", label: "API & Webhooks", icon: Database, description: "Infraestructura técnica", href: "/settings/api-usage" },
    ];

    return (
        <PageShell>
            <ModuleHeader
                title="Ajustes del Sistema"
                subtitle="System Control & Configuration"
                icon={Settings}
                badges={
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-none font-black text-[7px] uppercase tracking-widest px-2 h-5 rounded-sm">Healthy</Badge>
                }
            />

            <main className="flex-1 flex gap-3 p-3 min-h-0">
                {/* Internal Nav */}
                <div className="w-56 bg-white rounded-xl border border-slate-100 shadow-sm p-2 flex flex-col gap-1 overflow-y-auto">
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => section.href ? window.location.href = section.href : setActiveSection(section.id)}
                            className={cn(
                                "flex items-center gap-2.5 p-2 rounded-lg transition-all text-left group",
                                activeSection === section.id
                                    ? "bg-slate-900 text-white shadow-sm"
                                    : "hover:bg-slate-50 text-slate-600"
                            )}
                        >
                            <div className={cn(
                                "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                                activeSection === section.id ? "bg-white/10" : "bg-slate-50 border border-slate-100 text-slate-400 group-hover:text-slate-900"
                            )}>
                                <section.icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[9px] font-black uppercase tracking-tight italic leading-none">{section.label}</p>
                                <p className={cn(
                                    "text-[7px] font-bold uppercase tracking-widest opacity-60 mt-1 truncate w-24",
                                    activeSection === section.id ? "text-slate-100" : "text-slate-400"
                                )}>{section.description}</p>
                            </div>
                            {section.href && <ExternalLink className="w-2.5 h-2.5 opacity-20 group-hover:opacity-100" />}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden relative flex flex-col p-4">
                    <ScrollArea className="flex-1">
                        <div className="max-w-2xl space-y-6">
                            <section className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-1 w-1 rounded-full bg-slate-900" />
                                    <h3 className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Configuración del Entorno</h3>
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                    <Card className="border border-slate-100 rounded-lg p-3 hover:bg-slate-50/50 transition-all shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <h4 className="text-[10px] font-black text-slate-900 uppercase italic tracking-tight leading-none">Organización</h4>
                                                <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">ECOMBOM MASTER</p>
                                            </div>
                                            <Button variant="outline" size="sm" className="h-6 px-2 rounded-md text-[8px] font-black uppercase tracking-widest border-slate-200">EDITAR</Button>
                                        </div>
                                    </Card>
                                    <Card className="border border-slate-100 rounded-lg p-3 hover:bg-slate-50/50 transition-all shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <h4 className="text-[10px] font-black text-slate-900 uppercase italic tracking-tight leading-none">Región & Divisa</h4>
                                                <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Europa/Madrid • Euro (€)</p>
                                            </div>
                                            <Button variant="outline" size="sm" className="h-6 px-2 rounded-md text-[8px] font-black uppercase tracking-widest border-slate-200">EDITAR</Button>
                                        </div>
                                    </Card>
                                </div>
                            </section>

                            <section className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-1 w-1 rounded-full bg-emerald-500" />
                                    <h3 className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Estado de Servicios</h3>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                    <StatusItem label="Shopify API" status="online" />
                                    <StatusItem label="Meta Ads Graph" status="online" />
                                    <StatusItem label="Neural Engine" status="online" />
                                    <StatusItem label="Worker Sidecar" status="online" />
                                    <StatusItem label="Database" status="online" />
                                    <StatusItem label="Drive Sync" status="online" />
                                </div>
                            </section>

                            <section className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-1 w-1 rounded-full bg-rose-500" />
                                    <h3 className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Eliminación</h3>
                                </div>

                                <Card className="border border-rose-100 rounded-lg p-3 bg-rose-50/10 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <h4 className="text-[10px] font-black text-rose-900 uppercase italic tracking-tight leading-none">Purge Data</h4>
                                            <p className="text-[7px] text-rose-400 font-bold uppercase tracking-widest mt-1.5">Acción irreversible • Requiere autenticación</p>
                                        </div>
                                        <Button variant="outline" size="sm" className="h-6 px-2 rounded-md text-[8px] font-black uppercase tracking-widest border-rose-200 text-rose-600 hover:bg-rose-100">PURGAR</Button>
                                    </div>
                                </Card>
                            </section>
                        </div>
                    </ScrollArea>
                </div>
            </main>
        </PageShell>
    );
}

function StatusItem({ label, status }: { label: string, status: 'online' | 'offline' }) {
    return (
        <div className="flex items-center justify-between p-2 px-2.5 bg-slate-50 border border-slate-100 rounded-lg shadow-sm">
            <span className="text-[8px] font-black uppercase text-slate-500 tracking-tight italic">{label}</span>
            <div className="flex items-center gap-1">
                <div className={cn("h-1 w-1 rounded-full", status === 'online' ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                <span className={cn("text-[7px] font-black uppercase tracking-widest italic", status === 'online' ? "text-emerald-500" : "text-rose-500")}>{status}</span>
            </div>
        </div>
    );
}
