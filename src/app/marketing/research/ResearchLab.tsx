"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Microscope, SearchCode, Quote, Target, Sword, Sparkles, Loader2, Plus, Globe, FileText, Trash2, ArrowRight, ExternalLink, BookMarked, TrendingUp, AlertTriangle, CheckCircle2, History, Layers, BarChart3, ScanEye, BrainCircuit, RefreshCw, ShieldCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { ingestSource, runFullResearch, getResearchData, analyzeCompetitorLanding, runAnglePressureTest, generateWhyNotBuy, detectAngleFatigue } from "./actions";
import { generateDictionary, getLanguageDictionary } from "./language-actions";
import { runOfferPressureTest } from "./offer-actions";
import ProductBrain from "../product-brain/ProductBrain";

export default function ResearchLab({ storeId, products }: { storeId: string, products: any[] }) {
    const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || "");
    const [loading, setLoading] = useState(false);
    const [researchData, setResearchData] = useState<any>(null);

    // Context states
    const [newSource, setNewSource] = useState({ url: '', content: '', type: 'URL' });
    const [currentOffer, setCurrentOffer] = useState("");
    const [offerResult, setOfferResult] = useState<any>(null);
    const [competitorUrl, setCompetitorUrl] = useState("");

    useEffect(() => {
        if (selectedProductId) loadData();
    }, [selectedProductId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getResearchData(selectedProductId);
            const dict = await getLanguageDictionary(selectedProductId);
            setResearchData({ ...data, dictionary: dict });
        } catch (e) {
            toast.error("Error al cargar investigación");
        } finally {
            setLoading(false);
        }
    };

    const handleIngest = async () => {
        if (newSource.type === 'URL' && !newSource.url) return;
        if (newSource.type === 'TEXT' && !newSource.content) return;

        setLoading(true);
        try {
            await ingestSource(selectedProductId, newSource as any);
            toast.success("Fuente añadida correctamente");
            setNewSource({ url: '', content: '', type: 'URL' });
            loadData();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRunResearch = async () => {
        setLoading(true);
        try {
            await runFullResearch(selectedProductId);
            toast.success("Investigación profunda completada (Snapshot guardado)");
            loadData();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyzeCompetitor = async () => {
        if (!competitorUrl) return;
        setLoading(true);
        try {
            await analyzeCompetitorLanding(selectedProductId, competitorUrl);
            toast.success("Análisis de competencia completado");
            setCompetitorUrl("");
            loadData();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    const activeRun = researchData?.runs?.[0] ? JSON.parse(researchData.runs[0].results || "{}") : null;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 rounded-2xl">
                        <Microscope className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Research OS <span className="text-indigo-600 text-[10px] align-top bg-indigo-50 px-2 py-0.5 rounded-full ml-1">v2.0 Expert</span></h2>
                        <p className="text-slate-500 font-medium text-sm">Frameworks Hormozi & Schwartz integrados.</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                        <SelectTrigger className="w-full md:w-[250px] rounded-2xl border-slate-200 py-6 font-bold text-xs uppercase tracking-widest bg-slate-50/50">
                            <SelectValue placeholder="Selecciona producto" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-200 shadow-2xl">
                            {products.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleRunResearch} disabled={loading || !researchData?.sources?.length} className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-8 py-6 font-black shadow-lg shadow-indigo-100 transition-all active:scale-95 group">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2 group-hover:animate-pulse" />}
                        RUN DEEP RESEARCH
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar: Ingestor & Real Sources */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="rounded-[32px] border-slate-200 shadow-sm overflow-hidden bg-white">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Ingestión de Evidencia</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
                                <button
                                    onClick={() => setNewSource({ ...newSource, type: 'URL' })}
                                    className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${newSource.type === 'URL' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                                >URL</button>
                                <button
                                    onClick={() => setNewSource({ ...newSource, type: 'TEXT' })}
                                    className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${newSource.type === 'TEXT' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                                >TEXTO</button>
                            </div>

                            {newSource.type === 'URL' ? (
                                <Input
                                    value={newSource.url}
                                    onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                                    placeholder="Link de Reddit, Foro, Review..."
                                    className="rounded-xl border-slate-200 text-xs py-5"
                                />
                            ) : (
                                <Textarea
                                    value={newSource.content}
                                    onChange={(e) => setNewSource({ ...newSource, content: e.target.value })}
                                    placeholder="Pega comentarios sin filtrar..."
                                    className="rounded-xl border-slate-200 text-xs min-h-[120px]"
                                />
                            )}

                            <Button onClick={handleIngest} disabled={loading} className="w-full bg-slate-900 text-white rounded-xl font-bold text-xs py-6 flex items-center justify-center gap-2">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                AÑADIR FUENTE
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center px-2">
                            <h3 className="text-[10px] font-black uppercase text-slate-400">Knowledge Base ({researchData?.sources?.length || 0})</h3>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3 scrollbar-hide">
                            {researchData?.sources?.map((s: any) => (
                                <div key={s.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between group shadow-sm hover:border-indigo-200 transition-colors">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`p-2 rounded-lg ${s.type === 'URL' ? 'bg-blue-50 text-blue-500' : 'bg-slate-50 text-slate-400'}`}>
                                            {s.type === 'URL' ? <Globe className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-slate-600 truncate max-w-[120px]">{s.url || s.citationText || 'Texto Pegado'}</span>
                                            <span className="text-[9px] font-medium text-slate-400 italic">Capturado el {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-300 hover:text-rose-500 group-hover:opacity-100 opacity-0 transition-all">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Area: Logic & Strategy */}
                <div className="lg:col-span-3 space-y-6">
                    <Tabs defaultValue="matrix" className="w-full">
                        <TabsList className="bg-white p-1 rounded-[20px] border border-slate-100 shadow-sm mb-6 flex flex-wrap h-auto">
                            <TabsTrigger value="matrix" className="flex-1 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 rounded-xl px-4 font-black py-3 text-[10px] uppercase">
                                <Layers className="w-4 h-4 mr-2" /> Avatar Matrix
                            </TabsTrigger>
                            <TabsTrigger value="angles" className="flex-1 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600 rounded-xl px-4 font-black py-3 text-[10px] uppercase">
                                <Target className="w-4 h-4 mr-2" /> Angle Pressure
                            </TabsTrigger>
                            <TabsTrigger value="heatmap" className="flex-1 data-[state=active]:bg-rose-50 data-[state=active]:text-rose-600 rounded-xl px-4 font-black py-3 text-[10px] uppercase">
                                <BarChart3 className="w-4 h-4 mr-2" /> Objection Heatmap
                            </TabsTrigger>
                            <TabsTrigger value="spying" className="flex-1 data-[state=active]:bg-cyan-50 data-[state=active]:text-cyan-600 rounded-xl px-4 font-black py-3 text-[10px] uppercase">
                                <ScanEye className="w-4 h-4 mr-2" /> Spying Landings
                            </TabsTrigger>
                            <TabsTrigger value="quotes" className="flex-1 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600 rounded-xl px-4 font-black py-3 text-[10px] uppercase">
                                <Quote className="w-4 h-4 mr-2" /> Live VOC
                            </TabsTrigger>
                            <TabsTrigger value="history" className="flex-1 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 rounded-xl px-4 font-black py-3 text-[10px] uppercase">
                                <History className="w-4 h-4 mr-2" /> Research Runs
                            </TabsTrigger>
                            <TabsTrigger value="brain" className="flex-1 data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-xl px-4 font-black py-3 text-[10px] uppercase">
                                <BrainCircuit className="w-4 h-4 mr-2" /> Knowledge Brain
                            </TabsTrigger>
                            <TabsTrigger value="honest" className="flex-1 data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-xl px-4 font-black py-3 text-[10px] uppercase">
                                <ShieldCheck className="w-4 h-4 mr-2" /> Honest Copy
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="matrix" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {activeRun?.avatarMatrix ? activeRun.avatarMatrix.map((av: any) => (
                                    <Card key={av.id} className="rounded-[40px] border-slate-100 shadow-sm overflow-hidden bg-white hover:border-indigo-200 transition-all group">
                                        <CardHeader className="bg-indigo-50/20 border-b border-indigo-50 p-6">
                                            <div className="flex justify-between items-center">
                                                <Badge className="bg-white text-indigo-600 border-indigo-100 font-black text-[10px]">AVATAR {av.id}</Badge>
                                                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                                            </div>
                                            <CardTitle className="text-lg font-black text-slate-800 mt-2">{av.label}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-8 space-y-6">
                                            <div>
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2 underline decoration-indigo-200">Traits & Context</label>
                                                <p className="text-sm font-medium text-slate-600 leading-relaxed italic">"{av.traits}"</p>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 group-hover:bg-slate-100 transition-colors">
                                                <label className="text-[10px] font-black uppercase text-indigo-400 block mb-1">Winning Strategy</label>
                                                <p className="text-xs font-bold text-slate-700 leading-tight">{av.strategy}</p>
                                            </div>
                                            <Button className="w-full bg-indigo-600 text-white rounded-xl text-[10px] font-black py-4 shadow-lg shadow-indigo-100">
                                                ACTIVAR ESTE AVATAR
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )) : (
                                    <div className="col-span-full p-20 text-center border-2 border-dashed border-slate-100 rounded-[40px] bg-white">
                                        <Layers className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                                        <p className="text-slate-400 font-black italic">Sin Matrix activa. Ejecuta Deep Research.</p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="heatmap" className="animate-in fade-in slide-in-from-bottom-2 duration-700">
                            <Card className="rounded-[40px] border-slate-100 shadow-sm overflow-hidden bg-white">
                                <CardHeader className="p-8 border-b border-slate-50">
                                    <CardTitle className="text-sm font-black uppercase text-slate-800 flex items-center gap-2">
                                        <BarChart3 className="w-5 h-5 text-rose-500" /> Objection Gravity Matrix
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <div className="space-y-4">
                                        {activeRun?.objectionHeatmap ? activeRun.objectionHeatmap.map((obj: any, i: number) => (
                                            <div key={i} className="flex flex-col md:flex-row items-center gap-6 p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                                                <div className="w-full md:w-1/3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge className={`rounded-md px-2 ${obj.impact === 'HIGH' ? 'bg-rose-500' : 'bg-amber-500'} text-white font-black text-[9px]`}>
                                                            {obj.impact} IMPACT
                                                        </Badge>
                                                    </div>
                                                    <h4 className="text-lg font-black text-slate-800 uppercase leading-none">{obj.objection}</h4>
                                                </div>
                                                <div className="w-full md:w-1/3 flex flex-col gap-2">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Recommended Placement</span>
                                                    <div className="flex gap-2">
                                                        {obj.placement.split('/').map((p: string, idx: number) => (
                                                            <Badge key={idx} variant="outline" className="rounded-lg text-[10px] font-bold border-slate-200 text-slate-500 uppercase">{p}</Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="w-full md:w-1/3 text-right">
                                                    <Button variant="ghost" className="text-indigo-600 font-bold text-xs hover:bg-white rounded-xl">VER PRUEBAS REQUERIDAS <ArrowRight className="w-3 h-3 ml-2" /></Button>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="text-center py-20 opacity-30 italic font-medium">Ejecuta Research para calcular el Heatmap.</div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="angles" className="animate-in fade-in slide-in-from-bottom-2 duration-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {researchData?.angles?.map((angle: any) => (
                                    <Card key={angle.id} className="rounded-[40px] border-slate-100 shadow-sm overflow-hidden bg-white hover:border-emerald-200 transition-all">
                                        <CardHeader className="bg-slate-50/50 p-6 flex-row justify-between items-center border-b border-slate-100">
                                            <CardTitle className="text-sm font-black uppercase tracking-tight">{angle.title}</CardTitle>
                                            <Badge className={`rounded-lg ${angle.status === 'SATURATED' ? 'bg-rose-500' : angle.status === 'OPPORTUNITY' ? 'bg-emerald-500' : 'bg-amber-500'} text-white text-[9px]`}>
                                                {angle.status || 'V1'}
                                            </Badge>
                                        </CardHeader>
                                        <CardContent className="p-8 space-y-6">
                                            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                                <label className="text-[9px] font-black uppercase text-emerald-700 tracking-widest block mb-2">Primary Hook</label>
                                                <p className="text-sm font-bold text-slate-800 leading-tight">"{angle.hook}"</p>
                                            </div>
                                            <div className="pt-6 border-t border-slate-50 flex flex-wrap gap-2">
                                                <Button
                                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black py-5"
                                                >ACTIVAR ÁNGULO</Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={async () => {
                                                        setLoading(true);
                                                        try {
                                                            await runAnglePressureTest(angle.id);
                                                            toast.success("Pressure Test completado");
                                                            loadData();
                                                        } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
                                                    }}
                                                    className="rounded-xl border-amber-200 text-amber-600 font-bold text-[9px] px-3 h-12"
                                                >
                                                    PRESSURE TEST
                                                </Button>
                                            </div>
                                            {angle.saturationScore && (
                                                <div className="mt-4 flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                    <span className="text-[9px] font-black uppercase text-slate-400">Saturation Level</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-24 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                                            <div className={`h-full ${angle.saturationScore > 70 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${angle.saturationScore}%` }}></div>
                                                        </div>
                                                        <span className="text-[10px] font-black text-slate-600">{angle.saturationScore}%</span>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="spying" className="space-y-6">
                            <Card className="rounded-[40px] border-slate-100 shadow-sm overflow-hidden bg-white">
                                <div className="p-8 bg-cyan-50/30 border-b border-cyan-50">
                                    <h3 className="text-lg font-black text-cyan-900 flex items-center gap-2">
                                        <ScanEye className="w-5 h-5" /> Landing Intelligence (Competencia)
                                    </h3>
                                    <p className="text-cyan-700 text-xs font-medium">Detecta la estructura de la competencia para encontrar ángulos huérfanos.</p>

                                    <div className="flex gap-4 mt-6">
                                        <Input
                                            value={competitorUrl}
                                            onChange={(e) => setCompetitorUrl(e.target.value)}
                                            placeholder="URL de la landing enemiga..."
                                            className="rounded-xl border-cyan-100 bg-white"
                                        />
                                        <Button onClick={handleAnalyzeCompetitor} disabled={loading} className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-black px-6">
                                            ESPÍAR Y ANALIZAR
                                        </Button>
                                    </div>
                                </div>
                                <CardContent className="p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {researchData?.competitorLandings?.map((land: any) => (
                                            <Card key={land.id} className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
                                                <CardHeader className="bg-slate-50 p-4 border-b border-slate-100 flex-row justify-between items-center">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black uppercase text-slate-400">Opportunity Score</span>
                                                        <span className="text-lg font-black text-cyan-600">{land.opportunityScore}%</span>
                                                    </div>
                                                    <Badge className="bg-white text-slate-700 border-slate-200 uppercase font-black">{land.awareness}</Badge>
                                                </CardHeader>
                                                <CardContent className="p-6 space-y-4">
                                                    <div className="space-y-3">
                                                        <div className="p-3 bg-slate-50 rounded-xl">
                                                            <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Promesa Principal</label>
                                                            <p className="text-xs font-bold text-slate-800 leading-tight">"{land.promise}"</p>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div className="p-3 border border-slate-100 rounded-xl">
                                                                <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Ángulo</label>
                                                                <span className="text-[10px] font-bold text-slate-600">{land.angle}</span>
                                                            </div>
                                                            <div className="p-3 border border-slate-100 rounded-xl">
                                                                <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Avatar</label>
                                                                <span className="text-[10px] font-bold text-slate-600 uppercase">{land.avatar}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="pt-4 border-t border-slate-50">
                                                        <Button className="w-full bg-slate-900 border-0 rounded-xl py-5 font-black text-white group">
                                                            CREAR VERSIÓN OPTIMIZADA <Sparkles className="w-3.5 h-3.5 ml-2 group-hover:text-yellow-400" />
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="quotes">
                            <div className="columns-1 md:columns-2 gap-6 space-y-6">
                                {researchData?.quotes?.map((q: any) => (
                                    <div key={q.id} className="break-inside-avoid bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex justify-between mb-4">
                                            <Badge className={`border-0 rounded-lg text-[8px] font-black uppercase px-2 py-0.5 ${q.category === 'PAIN' ? 'bg-rose-50 text-rose-600' : q.category === 'DESIRE' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                                                {q.category}
                                            </Badge>
                                            <Quote className="w-4 h-4 text-slate-200" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-800 italic leading-relaxed">"{q.text}"</p>
                                        <div className="mt-3 text-[9px] font-black uppercase text-slate-400 flex items-center gap-1">
                                            <Target className="w-3 h-3 text-indigo-400" /> {q.citationText || "Live Evidence"}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="history" className="animate-in fade-in slide-in-from-bottom-2 duration-700">
                            <div className="space-y-4">
                                {researchData?.runs?.map((run: any) => (
                                    <Card key={run.id} className="rounded-[32px] border-slate-100 bg-white hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
                                        <CardContent className="p-6 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                                    <History className="w-6 h-6 text-slate-400" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-800 uppercase tracking-tight">Research Run: {new Date(run.createdAt).toLocaleDateString()}</h4>
                                                    <p className="text-xs text-slate-400 font-medium max-w-md truncate">{run.summary}</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" className="rounded-xl font-bold text-indigo-600 bg-indigo-50/50">REVISAR SNAPSHOT <ArrowRight className="w-4 h-4 ml-2" /></Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="brain" className="mt-8 animate-in fade-in duration-700">
                            <ProductBrain productId={selectedProductId} />
                        </TabsContent>

                        <TabsContent value="honest" className="mt-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <Card className="rounded-[40px] border-slate-100 shadow-sm bg-white overflow-hidden">
                                <CardHeader className="p-8 border-b border-slate-50 flex flex-row justify-between items-center">
                                    <div>
                                        <CardTitle className="text-xl font-black text-slate-800 uppercase">POR QUÉ NO COMPRAR (Honestidad Brutal)</CardTitle>
                                        <CardDescription>Filtrar a los curiosos para atraer a los creyentes.</CardDescription>
                                    </div>
                                    <Button variant="outline" className="rounded-2xl font-black border-slate-200" onClick={async () => {
                                        setLoading(true);
                                        try {
                                            await generateWhyNotBuy(selectedProductId);
                                            toast.success("Copia honesta generada");
                                            loadData();
                                        } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
                                    }}>
                                        <RefreshCw className="w-4 h-4 mr-2" /> GENERAR
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase text-slate-400">RED FLAGS (Filtro Anticapricho)</label>
                                            <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100">
                                                <ul className="space-y-3">
                                                    <li className="flex items-start gap-2 text-xs font-bold text-rose-900">
                                                        <AlertCircle className="w-4 h-4 shrink-0" /> No es para ti si buscas resultados mágicos sin esfuerzo.
                                                    </li>
                                                    <li className="flex items-start gap-2 text-xs font-bold text-rose-900">
                                                        <AlertCircle className="w-4 h-4 shrink-0" /> Si prefieres el método tradicional y lento, este mecanismo te asustará.
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase text-slate-400">TRUST LOGIC (Lógica de Verdad)</label>
                                            <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 italic text-xs font-medium text-emerald-900 leading-relaxed">
                                                "Al decirles quiénes NO deben comprar, quitamos la guardia del avatar ideal. La honestidad desarma el escepticismo de nivel 5."
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
