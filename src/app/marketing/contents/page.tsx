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
        color: "bg-blue-50 text-blue-600",
        stats: "12 Generados"
    },
    {
        title: "Mini-Cursos",
        description: "Vídeos educativos rápidos con voz y música para tus productos.",
        icon: Video,
        href: "/marketing/contents/courses",
        color: "bg-purple-50 text-purple-600",
        stats: "5 Cursos"
    },
    {
        title: "Tarjetas & Cupones",
        description: "Certificados de garantía, cupones QR y tarjetas VIP.",
        icon: Ticket,
        href: "/marketing/contents/coupons",
        color: "bg-amber-50 text-amber-600",
        stats: "24 Activos"
    },
    {
        title: "Automatizaciones",
        description: "Configura cuándo enviar cada regalo según el estado del pedido.",
        icon: Zap,
        href: "/marketing/contents/automations",
        color: "bg-emerald-50 text-emerald-600",
        stats: "3 Reglas ON"
    }
];

export default function ContentsDashboard() {
    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-700">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-100">
                            <Gift className="w-8 h-8" />
                        </div>
                        REGALOS & CONTENIDOS
                    </h1>
                    <p className="text-slate-500 font-medium mt-3 text-lg">
                        Aumenta el valor percibido y reduce devoluciones con contenido digital automático.
                    </p>
                </div>
                <Link href="/marketing/products">
                    <Button variant="outline" className="rounded-xl font-bold border-slate-200">
                        <Library className="w-4 h-4 mr-2" /> BIBLIOTECA POR PRODUCTO
                    </Button>
                </Link>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {modules.map((m) => (
                    <Link key={m.href} href={m.href}>
                        <Card className="h-full border-slate-200/60 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all rounded-[32px] group overflow-hidden">
                            <CardHeader className="pb-2">
                                <div className={`w-14 h-14 ${m.color} rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300 font-black`}>
                                    <m.icon className="w-7 h-7" />
                                </div>
                                <CardTitle className="text-xl font-black text-slate-800">{m.title}</CardTitle>
                                <CardDescription className="font-medium text-slate-500 text-sm leading-relaxed">
                                    {m.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex justify-between items-center mt-4">
                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold px-3 py-1">
                                    {m.stats}
                                </Badge>
                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            <section className="mt-12">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight italic flex items-center gap-2">
                        <Zap className="w-6 h-6 text-indigo-500" /> ÚLTIMAS GENERACIONES
                    </h2>
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl px-6">
                        <Plus className="w-4 h-4 mr-2" /> GENERACIÓN RÁPIDA
                    </Button>
                </div>

                <Card className="rounded-[40px] border-slate-200/60 shadow-xl shadow-slate-200/20 overflow-hidden bg-white/50 backdrop-blur-sm">
                    <CardContent className="p-0">
                        <div className="p-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-slate-200">
                                <Library className="w-8 h-8 text-slate-300" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800">No hay activos generados todavía</h3>
                                <p className="text-slate-500 font-medium">Empieza creando una plantilla para tu primer producto.</p>
                            </div>
                            <Link href="/marketing/contents/ebooks">
                                <Button className="mt-4 bg-slate-900 hover:bg-black text-white px-8 py-6 rounded-2xl font-black tracking-tight">
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
