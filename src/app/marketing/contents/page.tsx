"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, BookOpen, Video, Ticket, Zap, ArrowRight, Plus, Library } from "lucide-react";
import Link from "next/link";

const modules = [
    {
        title: "Generador de eBooks",
        description: "Crea guías de uso, FAQs y manuales automáticos con Gemini.",
        icon: BookOpen,
        href: "/marketing/contents/ebooks",
        color: "bg-rose-500/10 text-rose-600",
        stats: "12 Generados"
    },
    {
        title: "Mini-Cursos",
        description: "Vídeos educativos rápidos con voz y música para tus productos.",
        icon: Video,
        href: "/marketing/contents/courses",
        color: "bg-rose-500/10 text-rose-600",
        stats: "5 Cursos"
    },
    {
        title: "Tarjetas & Cupones",
        description: "Certificados de garantía, cupones QR y tarjetas VIP.",
        icon: Ticket,
        href: "/marketing/contents/coupons",
        color: "bg-rose-500/10 text-rose-600",
        stats: "24 Activos"
    },
    {
        title: "Automatizaciones",
        description: "Configura cuándo enviar cada regalo según el estado del pedido.",
        icon: Zap,
        href: "/marketing/contents/automations",
        color: "bg-rose-500/10 text-rose-600",
        stats: "3 Reglas ON"
    }
];

export default function ContentsDashboard() {
    return (
        <div className="flex-1 bg-transparent text-slate-900 font-sans selection:bg-rose-500/30 overflow-x-hidden flex flex-col p-4 space-y-6">
            <header className="flex justify-between items-end bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-slate-100/50 shadow-sm">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                        <div className="p-2.5 bg-slate-900 rounded-xl text-white shadow-md">
                            <Gift className="w-5 h-5" />
                        </div>
                        REGALOS & <span className="text-rose-500 uppercase italic">CONTENIDOS</span>
                    </h1>
                    <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest mt-2 ml-1">
                        CENTRO DE VALOR PERCIBIDO & FIDELIZACIÓN DIGITAL
                    </p>
                </div>
                <Link href="/marketing/products">
                    <Button variant="outline" className="rounded-xl font-black border-slate-100 text-[10px] uppercase tracking-widest h-9 bg-white/60 hover:bg-white transition-all">
                        <Library className="w-3.5 h-3.5 mr-2" /> BIBLIOTECA POR PRODUCTO
                    </Button>
                </Link>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {modules.map((m) => (
                    <Link key={m.href} href={m.href}>
                        <Card className="h-full border-slate-100/50 bg-white/40 backdrop-blur-md hover:border-rose-500/30 hover:shadow-xl hover:shadow-rose-500/5 transition-all rounded-3xl group overflow-hidden">
                            <CardHeader className="pb-2 p-5">
                                <div className={`w-12 h-12 ${m.color} rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 duration-300 font-black shadow-sm`}>
                                    <m.icon className="w-6 h-6" />
                                </div>
                                <CardTitle className="text-sm font-black text-slate-900 uppercase italic tracking-tight">{m.title}</CardTitle>
                                <CardDescription className="font-bold text-slate-400 text-[10px] uppercase tracking-widest leading-relaxed mt-1">
                                    {m.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex justify-between items-center p-5 pt-2">
                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-black text-[8px] uppercase tracking-widest px-2.5 py-0.5 rounded-lg border-none shadow-sm">
                                    {m.stats}
                                </Badge>
                                <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors border border-slate-100 shadow-sm">
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            <section className="mt-8 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight italic flex items-center gap-2.5">
                        <Zap className="w-4 h-4 text-rose-500" /> ÚLTIMAS GENERACIONES
                    </h2>
                    <Button size="sm" className="bg-slate-900 hover:bg-black text-white font-black rounded-lg px-4 h-8 text-[9px] uppercase tracking-widest shadow-lg">
                        <Plus className="w-3 h-3 mr-1.5" /> GENERACIÓN RÁPIDA
                    </Button>
                </div>

                <Card className="rounded-[32px] border-slate-100/50 shadow-sm overflow-hidden bg-white/40 backdrop-blur-md flex-1 flex flex-col justify-center border">
                    <CardContent className="p-0">
                        <div className="p-20 text-center space-y-4">
                            <div className="w-16 h-16 bg-white/60 rounded-full flex items-center justify-center mx-auto border border-slate-100 shadow-sm">
                                <Library className="w-7 h-7 text-slate-300" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-sm font-black text-slate-900 uppercase italic">No hay activos generados todavía</h3>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Empieza creando una plantilla para tu primer producto.</p>
                            </div>
                            <Link href="/marketing/contents/ebooks">
                                <Button className="mt-4 bg-slate-900 hover:bg-black text-white px-6 h-11 rounded-xl font-black text-[11px] tracking-widest uppercase shadow-xl transition-all hover:scale-105 active:scale-95">
                                    IR AL GENERADOR DE EBOOKS
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
