"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Layout, Globe, Zap, Loader2, Copy, Trash2, ExternalLink, ChevronRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cloneLanding, getLandingProjects, deleteLandingProject } from "./actions";
import BlueprintManager from "../blueprints/BlueprintManager";
import LandingDiffOptimizer from "./LandingDiffOptimizer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function LandingLab({ storeId, products }: { storeId: string, products: any[] }) {
    const [projects, setProjects] = useState<any[]>([]);
    const [url, setUrl] = useState("");
    const [isCloning, setIsCloning] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || "");

    useEffect(() => {
        loadProjects();
    }, [storeId]);

    const loadProjects = async () => {
        try {
            const data = await getLandingProjects(storeId);
            setProjects(data);
        } catch (e) {
            toast.error("Error al cargar proyectos");
        }
    };

    const handleClone = async () => {
        if (!url) return;
        setIsCloning(true);
        try {
            await cloneLanding(storeId, url, selectedProductId);
            toast.success("Landing clonada y diseccionada");
            setUrl("");
            loadProjects();
        } catch (e: any) {
            toast.error(e.message || "Error al clonar");
        } finally {
            setIsCloning(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Borrar este proyecto?")) return;
        try {
            await deleteLandingProject(id);
            toast.success("Proyecto eliminado");
            loadProjects();
        } catch (e) {
            toast.error("Error al eliminar");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <Layout className="w-6 h-6 text-blue-600" /> LANDING LAB
                    </h2>
                    <p className="text-slate-500 font-medium text-sm">Copia estructuras ganadoras y conviértelas en tus propios bloques.</p>
                </div>
            </header>

            <div className="space-y-12">
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Producto Seleccionado</label>
                        <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                            <SelectTrigger className="w-64 rounded-xl border-slate-200">
                                <SelectValue placeholder="Selecciona producto" />
                            </SelectTrigger>
                            <SelectContent>
                                {products.map((p: any) => (
                                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <BlueprintManager storeId={storeId} productId={selectedProductId} />

                <Card className="rounded-[32px] border-blue-100 bg-blue-50/20 border-2 overflow-hidden shadow-xl shadow-blue-500/5">
                    <CardContent className="p-8">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <Input
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="Pega la URL de la competencia (Shopify, Webflow...)"
                                    className="pl-12 rounded-2xl border-slate-200 py-6 text-lg focus:ring-blue-500"
                                />
                            </div>
                            <Button
                                onClick={handleClone}
                                disabled={isCloning || !url || !selectedProductId}
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-8 py-6 font-black shadow-lg shadow-blue-200 transition-all hover:scale-105"
                            >
                                {isCloning ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Zap className="w-5 h-5 mr-2" />}
                                CLONAR LANDING
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-6">
                    {projects.map((p) => {
                        const blocks = JSON.parse(p.blocksJson || '[]');
                        return (
                            <Card key={p.id} className="rounded-[40px] border-slate-200 overflow-hidden hover:shadow-2xl transition-all bg-white">
                                <CardContent className="p-0">
                                    <div className="flex flex-col md:flex-row">
                                        <div className="p-8 md:w-1/3 bg-slate-50/50 border-r border-slate-100 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <Badge className="bg-blue-100 text-blue-700 border-0 rounded-lg text-[10px] font-black uppercase">
                                                    {p.status}
                                                </Badge>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(p.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <h3 className="text-2xl font-black text-slate-800 leading-tight">{p.name}</h3>
                                            <div className="pt-4 border-t border-slate-100 flex gap-2">
                                                <Button onClick={() => handleDelete(p.id)} variant="ghost" size="icon" className="rounded-xl h-10 w-10 text-rose-500 hover:bg-rose-50">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="p-8 flex-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Optimización y Bloques ({blocks.length})</p>
                                            <LandingDiffOptimizer project={p} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
