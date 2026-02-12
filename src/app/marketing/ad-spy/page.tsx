"use client";

import { useState, useEffect } from "react";
import {
    Search, Filter, ExternalLink, Video,
    Image as ImageIcon, MoreVertical, Trash2,
    Eye, Copy, Share2, Facebook, Globe,
    ChevronRight, Zap, Microscope, Bot
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

export default function AdSpyPage() {
    const [captures, setCaptures] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");
    const [search, setSearch] = useState("");

    const loadCaptures = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/extension/capture');
            if (res.ok) {
                const data = await res.json();
                setCaptures(data);
            }
        } catch (e) {
            toast.error("Error al cargar capturas");
        }
        setLoading(false);
    };

    useEffect(() => {
        loadCaptures();
    }, []);

    const filtered = captures.filter(c => {
        const matchesPlatform = filter === "ALL" || c.platform === filter;
        const matchesSearch = (c.adText || "").toLowerCase().includes(search.toLowerCase()) ||
            (c.platform || "").toLowerCase().includes(search.toLowerCase());
        return matchesPlatform && matchesSearch;
    });

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] bg-white rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-2xl">

            {/* HEADER */}
            <header className="p-8 border-b border-slate-100 bg-slate-50/20 shrink-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
                            <Video className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black uppercase tracking-tight text-slate-900 leading-none">Intelligence <span className="text-indigo-600">Spy Hub</span></h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Interceptando {captures.length} Activos de la Competencia
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-1 max-w-xl gap-2">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                            <Input
                                placeholder="BUSCAR POR TEXTO O NICHO..."
                                className="h-12 pl-12 bg-white border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest placeholder:text-slate-300 focus:ring-indigo-500/10 focus:border-indigo-500/50 shadow-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-200 bg-white shadow-sm p-0">
                            <Filter className="h-4 w-4 text-slate-400" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <TabsList filter={filter} setFilter={setFilter} />
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT: MASONRY-LIKE GRID */}
            <ScrollArea className="flex-1 bg-slate-50/10">
                <div className="p-8">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="h-96 rounded-[2.5rem] bg-slate-100 animate-pulse" />
                            ))}
                        </div>
                    ) : filtered.length > 0 ? (
                        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-8 space-y-8">
                            {filtered.map((item) => (
                                <AdCard key={item.id} item={item} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-40 opacity-30 select-none text-center">
                            <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <Search className="h-12 w-12 text-slate-200" />
                            </div>
                            <h3 className="text-xl font-black text-slate-400 uppercase tracking-[0.2em] mb-2 font-bold italic transition-colors">Sin Capturas Recientes</h3>
                            <p className="text-xs font-bold text-slate-400 max-w-xs uppercase tracking-tighter leading-loose">Usa la extensión en Claude o Ad Library para capturar inspiración del mercado.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}

function TabsList({ filter, setFilter }: any) {
    const tabs = [
        { id: 'ALL', label: 'Todo' },
        { id: 'FACEBOOK', label: 'Facebook' },
        { id: 'TIKTOK', label: 'TikTok' },
        { id: 'CLAUDE', label: 'Claude AI' },
    ];

    return (
        <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id)}
                    className={cn(
                        "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        filter === tab.id
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                    )}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}

function AdCard({ item }: { item: any }) {
    return (
        <div className="break-inside-avoid relative group rounded-[2.5rem] border border-slate-100 bg-white overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
            {/* PLATFORM BADGE */}
            <div className="absolute top-4 left-4 z-10">
                <Badge className={cn(
                    "h-6 px-3 rounded-lg text-[9px] font-black uppercase italic shadow-lg",
                    item.platform === 'FACEBOOK' ? "bg-blue-600 text-white" :
                        item.platform === 'TIKTOK' ? "bg-black text-white" : "bg-indigo-600 text-white"
                )}>
                    {item.platform}
                </Badge>
            </div>

            {/* ACTION MENU */}
            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-white/90 backdrop-blur shadow-xl text-slate-900">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </div>

            {/* MEDIA PREVIEW */}
            <div className="relative aspect-video bg-slate-900 overflow-hidden flex items-center justify-center">
                {item.videoUrl ? (
                    <video
                        src={item.videoUrl}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        controls={false}
                        autoPlay
                        muted
                        loop
                    />
                ) : item.imageUrl ? (
                    <img src={item.imageUrl} alt="Ad Visual" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                    <div className="flex flex-col items-center gap-3 opacity-20">
                        <ImageIcon className="h-10 w-10 text-white" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Sin Media</span>
                    </div>
                )}

                {/* OVERLAY ACTION */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <Button variant="secondary" className="h-10 px-5 rounded-xl text-xs font-black uppercase tracking-widest gap-2">
                        <Eye className="h-4 w-4" /> Ver Full
                    </Button>
                    {item.url && (
                        <a href={item.url} target="_blank" className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                            <ExternalLink className="h-4 w-4 text-slate-900" />
                        </a>
                    )}
                </div>
            </div>

            {/* ANALYTICS PREVIEW (DUMMY FOR UI) */}
            <div className="px-8 py-6 space-y-4">
                <div className="flex items-center justify-between text-[10px] font-black uppercase italic text-slate-300 tracking-tighter">
                    <span>Capturado {new Date(item.createdAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1.5"><Globe className="h-3 w-3" /> Biblioteca IA</span>
                </div>

                <p className="text-xs font-medium text-slate-600 leading-relaxed line-clamp-3 italic">
                    {item.adText || "Sin descripción de texto capturada..."}
                </p>

                <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
                    <Button variant="ghost" className="flex-1 h-9 rounded-xl text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100">
                        <Microscope className="h-3.5 w-3.5 mr-2" /> Analizar con Gemini
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
