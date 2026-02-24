"use client";

import { useState, useEffect } from "react";
import {
    Search, Filter, ExternalLink, Video,
    Image as ImageIcon, MoreVertical, Trash2,
    Eye, Globe, Microscope
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

export function EspiaPanel({ onSelect }: { onSelect?: (item: any) => void }) {
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
        <div className="flex flex-col h-full gap-4">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 glass-panel rounded-[2rem] border border-white/50 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-sm">
                        <Video className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xs font-black uppercase tracking-tight text-slate-900 leading-none">Intelligence <span className="text-rose-500">Spy Hub</span></h2>
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                            Capturando {captures.length} Activos
                        </p>
                    </div>
                </div>

                <div className="flex flex-1 max-w-md gap-2">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300 group-focus-within:text-rose-500 transition-colors" />
                        <Input
                            placeholder="BUSCAR ACTIVOS..."
                            className="h-9 pl-10 bg-white/60 border-white/40 rounded-xl text-[9px] font-black uppercase tracking-widest placeholder:text-slate-300 focus:ring-rose-500/10 focus:border-rose-500/50 shadow-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" className="h-9 w-9 rounded-xl border-white/40 bg-white/60 shadow-sm p-0">
                        <Filter className="h-3.5 w-3.5 text-slate-400" />
                    </Button>
                </div>

                <div className="flex gap-1 bg-white/60 p-1 rounded-xl border border-white/40">
                    {['ALL', 'FACEBOOK', 'TIKTOK'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setFilter(t)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all",
                                filter === t ? "bg-slate-900 text-white shadow-sm" : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                            )}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </header>

            <ScrollArea className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-2">
                    {loading ? (
                        Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="h-64 rounded-[2rem] bg-white/20 animate-pulse border border-white/40" />
                        ))
                    ) : filtered.length > 0 ? (
                        filtered.map((item) => (
                            <div key={item.id} className="group relative rounded-[2rem] border border-white/50 bg-white/40 overflow-hidden shadow-sm hover:shadow-sm hover:-translate-y-1 transition-all duration-500">
                                <div className="relative aspect-video bg-slate-100/50 overflow-hidden flex items-center justify-center">
                                    {item.videoUrl ? (
                                        <video src={item.videoUrl} className="w-full h-full object-cover" muted loop onMouseOver={e => e.currentTarget.play()} onMouseOut={e => e.currentTarget.pause()} />
                                    ) : item.imageUrl ? (
                                        <img src={item.imageUrl} alt="Ad Visual" className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon className="h-8 w-8 text-slate-200" />
                                    )}
                                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                        <Button
                                            size="sm"
                                            className="bg-white text-slate-900 hover:bg-rose-500 hover:text-white font-black text-[9px] uppercase tracking-widest rounded-xl px-4 h-8"
                                            onClick={() => onSelect?.(item)}
                                        >
                                            USAR ESTE
                                        </Button>
                                        {item.url && (
                                            <a href={item.url} target="_blank" className="h-8 w-8 bg-white/20 border border-white/30 rounded-xl flex items-center justify-center text-white hover:bg-rose-500 transition-colors">
                                                <ExternalLink className="h-3.5 h-3.5" />
                                            </a>
                                        )}
                                    </div>
                                    <Badge className="absolute top-3 left-3 bg-black/60 text-white border-white/20 text-[7px] font-black uppercase tracking-widest px-2 h-5">{item.platform}</Badge>
                                </div>
                                <div className="p-4 space-y-2">
                                    <p className="text-[10px] text-slate-600 font-medium leading-relaxed line-clamp-2 italic">
                                        {item.adText || "Sin descripción..."}
                                    </p>
                                    <div className="flex items-center justify-between pt-2 border-t border-white/20">
                                        <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">CAPTURA: {new Date(item.createdAt).toLocaleDateString()}</span>
                                        <Microscope className="w-3 h-3 text-rose-500 opacity-30" />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center text-slate-300">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Sin capturas encontradas</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
