"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
    Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
    BrainCircuit,
    Telescope,
    FileText,
    Video,
    Plus,
    ExternalLink,
    Bot,
    Save,
    Upload,
    Wand2,
    Eye,
    Folder,
    Link as LinkIcon,
    Languages,
    Mic
} from "lucide-react";

import {
    getProductMasterData,
    addCompetitorLink,
    addResearchDocument,
    runDeepAnalysisAgent,
    updateProductDrive,
    uploadAndProcessVideo
} from "../actions";

export default function ProductMastermindPage({ params }: { params: { id: string } }) {
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);

    // Forms
    const [compForm, setCompForm] = useState({ url: "", notes: "", type: "FACEBOOK_AD_LIBRARY" });
    const [docForm, setDocForm] = useState({ title: "", content: "", type: "SCRIPT", fileUrl: "", language: "es" });
    const [videoForm, setVideoForm] = useState({ name: "", driveUrl: "", targetLanguage: "es" });

    const [driveFolder, setDriveFolder] = useState("");
    const [showDriveInput, setShowDriveInput] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const data = await getProductMasterData(params.id);
        setProduct(data);
        if (data && data.driveFolder) setDriveFolder(data.driveFolder);
        setLoading(false);
    };

    const handleUpdateDrive = async () => {
        await updateProductDrive(params.id, driveFolder);
        setShowDriveInput(false);
        loadData();
    };

    const handleAddCompetitor = async () => {
        if (!compForm.url) return;
        await addCompetitorLink(params.id, compForm);
        setCompForm({ url: "", notes: "", type: "FACEBOOK_AD_LIBRARY" });
        loadData();
    };

    const handleAddDocument = async () => {
        if (!docForm.title) return;
        await addResearchDocument(params.id, docForm);
        setDocForm({ title: "", content: "", type: "SCRIPT", fileUrl: "", language: "es" });
        loadData();
    };

    const handleUploadVideo = async () => {
        if (!videoForm.name) return;
        // Mocking upload process
        await uploadAndProcessVideo(params.id, videoForm);
        setVideoForm({ name: "", driveUrl: "", targetLanguage: "es" });
        loadData();
    };

    const handleRunAnalysis = async () => {
        setAnalyzing(true);
        await runDeepAnalysisAgent(params.id);
        setAnalyzing(false);
        loadData();
    };

    if (loading) return <div className="p-10 text-center">Cargando Mastermind...</div>;
    if (!product) return <div className="p-10 text-center">Producto no encontrado</div>;

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-white/10 pb-6">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden">
                        {product.image ? <img src={product.image} className="w-full h-full object-cover" /> : <span className="text-xl font-bold">{product.title?.charAt(0)}</span>}
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-white">{product.title}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-muted-foreground text-sm">Creative Lab Central</p>
                            {product.driveFolder ? (
                                <a href={product.driveFolder} target="_blank" className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs hover:bg-blue-500/20">
                                    <Folder className="w-3 h-3" /> Drive Sync Activo
                                </a>
                            ) : (
                                <Badge variant="outline" className="text-xs border-dashed cursor-pointer hover:bg-white/5" onClick={() => setShowDriveInput(!showDriveInput)}>
                                    + Vincular Google Drive
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2 border-primary/50 text-primary hover:bg-primary/10" onClick={handleRunAnalysis} disabled={analyzing}>
                        {analyzing ? <Wand2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                        {analyzing ? "Analizando..." : "Invocar Agente"}
                    </Button>
                </div>
            </div>

            {/* DRIVE CONFIG POPUP (Simple toggle) */}
            {showDriveInput && (
                <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-lg flex gap-2 items-center">
                    <Folder className="w-4 h-4 text-blue-400" />
                    <Input
                        placeholder="Pegar URL de la Carpeta de Google Drive del Producto"
                        value={driveFolder}
                        onChange={(e) => setDriveFolder(e.target.value)}
                        className="bg-black/50 border-white/10 h-8 text-sm"
                    />
                    <Button size="sm" onClick={handleUpdateDrive}>Guardar</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowDriveInput(false)}><ExternalLink className="w-4 h-4" /></Button>
                </div>
            )}

            <Tabs defaultValue="research" className="flex-1 flex flex-col">
                <TabsList className="w-full justify-start h-12 bg-black/40 border-b border-white/5 rounded-none p-0 gap-6 px-1">
                    <TabsTrigger value="research" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 text-base">
                        <Telescope className="w-4 h-4 mr-2" /> Investigación
                    </TabsTrigger>
                    <TabsTrigger value="creative" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 text-base">
                        <Video className="w-4 h-4 mr-2" /> Lab Creativo
                    </TabsTrigger>
                    <TabsTrigger value="deep" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 text-base">
                        <BrainCircuit className="w-4 h-4 mr-2" /> Análisis Profundo (AI)
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="research" className="flex-1 py-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* COMPETITORS CARD */}
                        <Card className="bg-black/20 border-white/10 h-full">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-lg">Enlaces de Competencia</CardTitle>
                                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">Spy Work</Badge>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Pegar URL (Ad Library, Landing Page...)"
                                        className="bg-black/50 border-white/10"
                                        value={compForm.url}
                                        onChange={e => setCompForm({ ...compForm, url: e.target.value })}
                                    />
                                    <Button size="icon" onClick={handleAddCompetitor}><Plus className="w-4 h-4" /></Button>
                                </div>
                                <div className="space-y-2 h-[300px] overflow-y-auto pr-2">
                                    {product.competitors?.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No hay enlaces guardados.</p>}
                                    {product.competitors?.map((comp: any) => (
                                        <div key={comp.id} className="flex items-center justify-between p-3 rounded-md bg-white/5 border border-white/5 hover:border-white/20 transition-all group">
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="text-xs font-bold text-muted-foreground uppercase mb-0.5">{comp.type.replace(/_/g, " ")}</span>
                                                <a href={comp.url} target="_blank" className="text-sm truncate text-blue-400 hover:underline flex items-center gap-1">
                                                    {comp.url} <ExternalLink className="w-3 h-3 opacity-50" />
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* DOCUMENTS / SCRIPTS CARD */}
                        <Card className="bg-black/20 border-white/10 h-full">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-lg">Documentos & Scripts</CardTitle>
                                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Assets Centralizados</Badge>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col gap-2 p-4 border border-dashed border-white/20 rounded-md">
                                    <Input
                                        placeholder="Título (ej: Script VSL 01)"
                                        className="bg-black/50 border-white/10"
                                        value={docForm.title}
                                        onChange={e => setDocForm({ ...docForm, title: e.target.value })}
                                    />
                                    <div className="flex gap-2">
                                        <Select value={docForm.language} onValueChange={(val) => setDocForm({ ...docForm, language: val })}>
                                            <SelectTrigger className="w-[140px] bg-black/50 border-white/10">
                                                <SelectValue placeholder="Idioma" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="es">Español</SelectItem>
                                                <SelectItem value="en">Inglés</SelectItem>
                                                <SelectItem value="fr">Francés</SelectItem>
                                                <SelectItem value="de">Alemán</SelectItem>
                                                <SelectItem value="it">Italiano</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Input
                                            placeholder="Enlace Drive / PDF"
                                            className="bg-black/50 border-white/10 flex-1"
                                            value={docForm.fileUrl}
                                            onChange={e => setDocForm({ ...docForm, fileUrl: e.target.value })}
                                        />
                                    </div>
                                    <Textarea
                                        placeholder="O pega el contenido/notas aquí (se traducirá si cambias el idioma)..."
                                        className="bg-black/50 border-white/10 min-h-[60px]"
                                        value={docForm.content}
                                        onChange={e => setDocForm({ ...docForm, content: e.target.value })}
                                    />
                                    <Button size="sm" onClick={handleAddDocument} className="w-full mt-2">
                                        {docForm.language !== 'es' ? <span className="flex items-center gap-2"><Languages className="w-4 h-4" /> Guardar & Traducir</span> : "Guardar Recurso"}
                                    </Button>
                                </div>

                                <div className="space-y-2 mt-4 max-h-[250px] overflow-y-auto">
                                    {product.documents?.map((doc: any) => (
                                        <div key={doc.id} className="flex items-center p-3 rounded-md bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                            <div className="mr-3 flex flex-col items-center">
                                                <FileText className="w-4 h-4 text-emerald-400" />
                                                <span className="text-[9px] font-bold text-muted-foreground mt-0.5 uppercase">{doc.language}</span>
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-sm font-medium text-white truncate">{doc.title}</p>
                                                <p className="text-xs text-muted-foreground">{doc.type}</p>
                                            </div>
                                            {doc.fileUrl && (
                                                <a href={doc.fileUrl} target="_blank">
                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-emerald-500/20"><LinkIcon className="w-3 h-3 text-emerald-400" /></Button>
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="deep" className="py-6">
                    <Card className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border-white/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bot className="w-5 h-5 text-purple-400" />
                                Agente de Marketing Profundo
                            </CardTitle>
                            <CardDescription>Análisis automatizado de psicología del consumidor y ángulos de venta.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!product.avatars?.[0]?.whyItSells ? (
                                <div className="text-center py-12">
                                    <p className="text-muted-foreground mb-4">El agente aún no ha analizado este producto.</p>
                                    <Button onClick={handleRunAnalysis} className="bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20">
                                        <Wand2 className="w-4 h-4 mr-2" /> Iniciar Análisis Profundo
                                    </Button>
                                </div>
                            ) : (
                                <div className="prose prose-invert max-w-none">
                                    <div className="bg-black/30 p-6 rounded-xl border border-purple-500/20 whitespace-pre-line text-sm leading-relaxed">
                                        {product.avatars[0].whyItSells}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                        <div className="p-4 rounded-lg bg-black/40 border border-white/5">
                                            <span className="text-xs font-bold text-gray-500 uppercase">Nivel de Consciencia</span>
                                            <p className="text-2xl font-black text-white mt-1">{product.avatars[0].levelOfAwareness || "O3"}</p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-black/40 border border-white/5">
                                            <span className="text-xs font-bold text-gray-500 uppercase">Market Mood</span>
                                            <p className="text-sm font-medium text-white mt-1">Skeptical but hopeful</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="creative" className="py-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* MASS UPLOAD & PROCESSING */}
                        <Card className="bg-black/20 border-white/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Upload className="w-5 h-5" /> Ingesta de Video & IA</CardTitle>
                                <CardDescription>Sube videos para procesar transcripción y doblaje automático.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Drive Folder Shortcut */}
                                {product.driveFolder ? (
                                    <div className="p-6 border-2 border-dashed border-blue-500/30 bg-blue-500/5 rounded-xl text-center cursor-pointer hover:bg-blue-500/10 transition-colors" onClick={() => window.open(product.driveFolder, '_blank')}>
                                        <Folder className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                                        <h3 className="text-base font-bold text-white">Drive Vinculado</h3>
                                        <p className="text-xs text-blue-300">Clic para abrir carpeta en la nube</p>
                                    </div>
                                ) : (
                                    <div className="p-4 border border-dashed border-white/10 rounded-xl text-center">
                                        <p className="text-xs text-muted-foreground">Vincula Drive para activar subida a nube.</p>
                                    </div>
                                )}

                                {/* Video Metadata Form */}
                                <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/5">
                                    <h4 className="text-sm font-medium text-white">Nuevo Procesamiento</h4>
                                    <Input
                                        placeholder="Nombre del Video (ej: Hook #2 - UGC)"
                                        className="bg-black/50 border-white/10"
                                        value={videoForm.name}
                                        onChange={(e) => setVideoForm({ ...videoForm, name: e.target.value })}
                                    />
                                    <Input
                                        placeholder="Drive Link Directo"
                                        className="bg-black/50 border-white/10"
                                        value={videoForm.driveUrl}
                                        onChange={(e) => setVideoForm({ ...videoForm, driveUrl: e.target.value })}
                                    />
                                    <div className="flex gap-2 items-center">
                                        <div className="flex-1">
                                            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Doblaje / Subs</label>
                                            <Select value={videoForm.targetLanguage} onValueChange={(val) => setVideoForm({ ...videoForm, targetLanguage: val })}>
                                                <SelectTrigger className="bg-black/50 border-white/10">
                                                    <SelectValue placeholder="Idioma" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="es">Español (Original)</SelectItem>
                                                    <SelectItem value="en">Inglés (Dubbing)</SelectItem>
                                                    <SelectItem value="fr">Francés (Dubbing)</SelectItem>
                                                    <SelectItem value="de">Alemán (Dubbing)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button className="mt-5" onClick={handleUploadVideo}>
                                            <Mic className="w-4 h-4 mr-2" /> Procesar con IA
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* ASSET LIST */}
                        <Card className="bg-black/20 border-white/10">
                            <CardHeader>
                                <CardTitle>Control de Creativos</CardTitle>
                                <CardDescription>Tracking de rendimiento y estado.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {product.creatives?.map((creative: any) => (
                                        <div key={creative.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                                            <div className="h-10 w-10 bg-indigo-500/20 rounded flex items-center justify-center">
                                                <Video className="w-5 h-5 text-indigo-400" />
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-sm font-bold text-white truncate">{creative.name}</p>
                                                <div className="flex gap-2 mt-1">
                                                    <Badge variant="secondary" className="text-[10px] h-4 px-1">{creative.language}</Badge>
                                                    {creative.verdict && <Badge variant="outline" className="text-[10px] h-4 px-1 border-yellow-500/50 text-yellow-500">{creative.verdict}</Badge>}
                                                </div>
                                            </div>
                                            <Button size="icon" variant="ghost" className="h-8 w-8"><ExternalLink className="w-4 h-4" /></Button>
                                        </div>
                                    ))}
                                    {(!product.creatives || product.creatives.length === 0) && (
                                        <div className="text-center py-8 text-muted-foreground text-sm">
                                            No hay creativos procesados.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
