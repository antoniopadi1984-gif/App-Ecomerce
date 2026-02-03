import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Layout, Video, UserCircle, Library, Zap, Sparkles, BookOpen, Image as ImageIcon, ScanSearch, Lightbulb } from "lucide-react";

const modules = [
    {
        title: "Landing Lab",
        description: "Clona landings de la competencia y conviértelas en bloques editables.",
        icon: Layout,
        href: "/marketing/creative-lab/landings",
        color: "text-blue-600",
        bg: "bg-blue-50"
    },
    {
        title: "Static Ads",
        description: "Convierte imágenes y ángulos en anuncios estáticos reales con psicología profunda.",
        icon: ImageIcon,
        href: "/marketing/creative-lab/statics",
        color: "text-emerald-500",
        bg: "bg-emerald-50"
    },
    {
        title: "Advertorial / Listicle",
        description: "Genera artículos de preventa de alta conversión con ángulos de Gemini.",
        icon: BookOpen,
        href: "/marketing/creative-lab/articles",
        color: "text-emerald-600",
        bg: "bg-emerald-50"
    },
    {
        title: "Videos & Creativos",
        description: "Sube vídeos, diséctalos y genera variaciones con hooks automáticos.",
        icon: Video,
        href: "/marketing/creative-lab/videos",
        color: "text-purple-600",
        bg: "bg-purple-50"
    },
    {
        title: "Avatares IA",
        description: "Crea perfiles de avatar estáticos y talking-heads realistas (Mac M3).",
        icon: UserCircle,
        href: "/marketing/creative-lab/avatars",
        color: "text-rose-600",
        bg: "bg-rose-50"
    },
    {
        title: "Biblioteca & Versiones",
        description: "Gestión centralizada de activos por producto y versión.",
        icon: Library,
        href: "/marketing/creative-lab/library",
        color: "text-amber-600",
        bg: "bg-amber-50"
    }
];

export default function CreativeLabDashboard() {
    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-700">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-800 flex items-center gap-3">
                        <Sparkles className="w-10 h-10 text-indigo-600" /> CREATIVE & LANDING OS
                    </h1>
                    <p className="text-slate-500 font-bold mt-2 text-lg italic">
                        "No pixel-perfect, solo velocidad y conversión."
                    </p>
                </div>
            </header>

            <section className="bg-indigo-600 rounded-[40px] p-10 text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform">
                    <Zap className="w-40 h-40" />
                </div>
                <div className="relative z-10">
                    <h2 className="text-2xl font-black uppercase tracking-widest flex items-center gap-2 mb-8">
                        <Zap className="w-6 h-6" /> SPEED FLOWS (ACCIONES RÁPIDAS)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Button className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-2xl h-auto py-6 flex flex-col items-center gap-2 group/btn">
                            <ImageIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            <span className="font-black text-[10px] uppercase">Static Rápido</span>
                        </Button>
                        <Button className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-2xl h-auto py-6 flex flex-col items-center gap-2 group/btn">
                            <ScanSearch className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            <span className="font-black text-[10px] uppercase">Optimizar Landing</span>
                        </Button>
                        <Button className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-2xl h-auto py-6 flex flex-col items-center gap-2 group/btn">
                            <Lightbulb className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            <span className="font-black text-[10px] uppercase">Ideas de Ventas</span>
                        </Button>
                        <Button className="bg-white/90 hover:bg-white text-indigo-600 rounded-2xl h-auto py-6 flex flex-col items-center gap-2 group/btn shadow-xl shadow-black/20 transform hover:-translate-y-1 transition-all">
                            <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                            <span className="font-black text-[10px] uppercase">Pack Creativo Completo</span>
                        </Button>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
                {modules.map((m) => (
                    <Link key={m.href} href={m.href}>
                        <Card className="rounded-[40px] border-slate-200/60 overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group h-full cursor-pointer hover:-translate-y-2 bg-white/50 backdrop-blur-sm">
                            <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
                                <div className={`w-20 h-20 ${m.bg} ${m.color} rounded-[28px] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
                                    <m.icon className="w-10 h-10" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors uppercase">{m.title}</h3>
                                    <p className="text-slate-500 font-medium mt-3 leading-relaxed">{m.description}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            <section className="mt-20">
                <div className="flex justify-between items-center mb-10">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase flex items-center gap-2">
                        <Zap className="w-6 h-6 text-amber-500" /> ÚLTIMOS PROYECTOS CREATIVOS
                    </h2>
                </div>

                <Card className="rounded-[40px] border-dashed border-2 border-slate-200 bg-slate-50/50 p-20 text-center">
                    <div className="max-w-md mx-auto">
                        <Library className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                        <h4 className="text-xl font-black text-slate-400">EL LABORATORIO ESTÁ VACÍO</h4>
                        <p className="text-slate-400 font-medium mt-2 italic">Selecciona un módulo superior para empezar a clonar o diseccionar activos.</p>
                    </div>
                </Card>
            </section>
        </div>
    );
}
