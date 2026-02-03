"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Library, Layout, Video, UserCircle, FileText, ChevronRight, Folder, Filter, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { getLandingProjects } from "../landings/actions";
import { getVideoProjects } from "../videos/actions";

export default function LibraryLab({ storeId, products }: { storeId: string, products: any[] }) {
    const [selectedProductId, setSelectedProductId] = useState<string | null>(products[0]?.id || null);
    const [landings, setLandings] = useState<any[]>([]);
    const [videos, setVideos] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, [storeId]);

    const loadData = async () => {
        try {
            const [l, v] = await Promise.all([
                getLandingProjects(storeId),
                getVideoProjects(storeId)
            ]);
            setLandings(l);
            setVideos(v);
        } catch (e) {
            toast.error("Error al cargar biblioteca");
        }
    };

    const productLandings = landings.filter(l => l.productId === selectedProductId);
    const productVideos = videos.filter(v => v.productId === selectedProductId);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <Library className="w-6 h-6 text-amber-500" /> BIBLIOTECA DE PRODUCTOS
                    </h2>
                    <p className="text-slate-500 font-medium text-sm">Organización automática y versionado oficial de todos tus activos.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="rounded-xl font-bold bg-white"><Filter className="w-4 h-4 mr-2" /> FILTRAR</Button>
                    <Button className="bg-slate-900 border-0 text-white rounded-xl font-bold"><Settings2 className="w-4 h-4 mr-2" /> CONFIGURAR</Button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar: Product List */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input className="w-full bg-slate-100 border-0 rounded-2xl px-10 py-3 text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none" placeholder="BUSCAR PRODUCTO..." />
                    </div>
                    <div className="space-y-2">
                        {products.map(p => (
                            <div
                                key={p.id}
                                onClick={() => setSelectedProductId(p.id)}
                                className={`p-4 rounded-3xl cursor-pointer transition-all flex items-center gap-3 border ${selectedProductId === p.id ? 'bg-amber-500 text-white border-amber-600 shadow-lg shadow-amber-200' : 'bg-white text-slate-600 border-slate-100 hover:border-amber-200'}`}
                            >
                                <Folder className={`w-5 h-5 ${selectedProductId === p.id ? 'text-amber-200' : 'text-slate-300'}`} />
                                <span className="text-xs font-black uppercase tracking-tight truncate">{p.title}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3 space-y-10">
                    {selectedProductId ? (
                        <>
                            {/* Landings Section */}
                            <section>
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Layout className="w-4 h-4" /> LANDINGS & ADVERTORIALS ({productLandings.length})
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {productLandings.map(l => (
                                        <Card key={l.id} className="rounded-[32px] border-slate-100 p-6 hover:shadow-xl transition-all group bg-white">
                                            <div className="flex justify-between items-start mb-4">
                                                <Badge className="bg-blue-50 text-blue-600 border-0 rounded-lg text-[9px] font-black uppercase">{l.status}</Badge>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">V{l.versionsCount}</span>
                                            </div>
                                            <h4 className="text-lg font-black text-slate-800 leading-tight">{l.name}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">
                                                [PROD]_{l.name.substring(0, 10).toUpperCase()}_V{l.versionsCount}
                                            </p>
                                            <div className="mt-6 flex justify-end">
                                                <Button variant="ghost" size="sm" className="rounded-lg h-8 text-[11px] font-black hover:bg-slate-50">GESTIONAR <ChevronRight className="w-3 h-3 ml-1" /></Button>
                                            </div>
                                        </Card>
                                    ))}
                                    {productLandings.length === 0 && (
                                        <div className="col-span-full p-10 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                            <p className="text-xs text-slate-400 italic">No hay landings para este producto.</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Creatives Section */}
                            <section>
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Video className="w-4 h-4" /> CREATIVOS DE VÍDEO ({productVideos.length})
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {productVideos.map(v => (
                                        <Card key={v.id} className="rounded-[32px] border-slate-100 p-6 hover:shadow-xl transition-all group bg-white">
                                            <div className="flex justify-between items-start mb-4">
                                                <Badge className="bg-purple-50 text-purple-600 border-0 rounded-lg text-[9px] font-black uppercase">DISSECTED</Badge>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">9:16</span>
                                            </div>
                                            <h4 className="text-lg font-black text-slate-800 leading-tight">{v.name}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">
                                                [PROD]_VIDEO_V1
                                            </p>
                                            <div className="mt-6 flex justify-end">
                                                <Button variant="ghost" size="sm" className="rounded-lg h-8 text-[11px] font-black hover:bg-slate-50">GESTIONAR <ChevronRight className="w-3 h-3 ml-1" /></Button>
                                            </div>
                                        </Card>
                                    ))}
                                    {productVideos.length === 0 && (
                                        <div className="col-span-full p-10 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                            <p className="text-xs text-slate-400 italic">No hay vídeos para este producto.</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-20 text-center">
                            <Library className="w-20 h-20 text-slate-200 mb-6" />
                            <h4 className="text-2xl font-black text-slate-300">SELECCIONA UN PRODUCTO</h4>
                            <p className="text-slate-400 font-medium italic mt-2">Para ver y gestionar sus activos creativos.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
