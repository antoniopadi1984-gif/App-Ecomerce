"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, BookOpen, Video, Ticket, Zap, ArrowRight, Plus, Library } from "lucide-react";
import Link from "next/link";
import { PageShell } from "@/components/ui/PageShell";
import { ModuleHeader } from "@/components/ui/ModuleHeader";
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from "@/lib/styles/tokens";

const modules = [
    {
        title: "Generador de eBooks",
        description: "Guías, FAQs y manuales automáticos con Gemini.",
        icon: BookOpen,
        href: "/marketing/contents/ebooks",
        color: "bg-rose-50 text-rose-600",
        stats: "12 Generados"
    },
    {
        title: "Mini-Cursos",
        description: "Vídeos educativos con voz y música para tus productos.",
        icon: Video,
        href: "/marketing/contents/courses",
        color: "bg-rose-50 text-rose-600",
        stats: "5 Cursos"
    },
    {
        title: "Tarjetas & Cupones",
        description: "Certificados de garantía, cupones QR y tarjetas VIP.",
        icon: Ticket,
        href: "/marketing/contents/coupons",
        color: "bg-rose-50 text-rose-600",
        stats: "24 Activos"
    },
    {
        title: "Automatizaciones",
        description: "Configura cuándo enviar cada regalo dinámicamente.",
        icon: Zap,
        href: "/marketing/contents/automations",
        color: "bg-rose-50 text-rose-600",
        stats: "3 Reglas ON"
    }
];

export default function ContentsDashboard() {
    return (
        <PageShell>
            <ModuleHeader
                title="Regalos & Contenidos"
                subtitle="CENTRO DE VALOR PERCIBIDO V1.2"
                icon={Gift}
                actions={
                    <Link href="/marketing/products">
                        <Button variant="outline" className="rounded-xl font-black border-slate-100 text-[10px] uppercase tracking-widest h-9 bg-white/60 hover:bg-white transition-all">
                            <Library className="w-3.5 h-3.5 mr-2" /> BIBLIOTECA
                        </Button>
                    </Link>
                }
            />

            <main className="p-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {modules.map((m) => (
                        <Link key={m.href} href={m.href}>
                            <Card className="h-full border-slate-100 bg-white hover:border-rose-500/30 hover:shadow-xl transition-all rounded-2xl group overflow-hidden">
                                <CardHeader className="pb-2 p-4">
                                    <div className={`w-10 h-10 ${m.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-300`}>
                                        <m.icon className="w-5 h-5" />
                                    </div>
                                    <CardTitle className="text-[11px] font-black text-slate-900 uppercase italic tracking-tight">{m.title}</CardTitle>
                                    <CardDescription className="font-bold text-slate-400 text-[9px] uppercase tracking-widest leading-relaxed mt-1">
                                        {m.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex justify-between items-center p-4 pt-2">
                                    <Badge variant="secondary" className="bg-slate-50 text-slate-500 font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-lg border-none">
                                        {m.stats}
                                    </Badge>
                                    <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors border border-slate-100 shadow-sm">
                                        <ArrowRight className="w-3 h-3" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                <section className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-tight italic flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-rose-500" /> ÚLTIMAS GENERACIONES
                        </h2>
                        <Button size="sm" className="bg-slate-900 hover:bg-black text-white font-black rounded-lg px-4 h-8 text-[9px] uppercase tracking-widest">
                            <Plus className="w-3 h-3 mr-1.5" /> GENERAR
                        </Button>
                    </div>

                    <Card className="rounded-3xl border-slate-100 bg-white border">
                        <CardContent className="p-12 text-center space-y-4">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-slate-100">
                                <Library className="w-6 h-6 text-slate-300" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-[11px] font-black text-slate-900 uppercase italic">No hay activos generados</h3>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[8px]">Empieza creando una plantilla para tu primer producto.</p>
                            </div>
                            <Link href="/marketing/contents/ebooks">
                                <Button className="mt-4 bg-slate-900 hover:bg-black text-white px-6 h-10 rounded-xl font-black text-[10px] tracking-widest uppercase shadow-md transition-all hover:scale-102">
                                    IR AL GENERADOR
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </section>
            </main>
        </PageShell>
    );
}
