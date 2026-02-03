"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Save, Play, Pause, Scissors, Wand2,
    Mic, Image as ImageIcon, Music, Type,
    Layers, MonitorPlay, ChevronLeft, Download,
    Settings, Sparkles, Zap, Globe, ShieldCheck, Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

// Actions
import {
    saveProjectState,
    generateElevenLabsVoice,
    generateVeoVideo,
    generateAvatarVideo,
    getSmartPromptContext,
    optimizeAssetExport,
    replicateCompetitorVideo,
    translateAndDubVideo,
    cleanAssetMetadata
} from "../actions";

export default function EditorPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [project, setProject] = useState<any>(null);
    const [timeline, setTimeline] = useState<any>({ tracks: [] });
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [totalDuration, setTotalDuration] = useState(30); // Mock total duration

    // AI Generation Panel State
    const [aiPanelOpen, setAiPanelOpen] = useState(false);
    const [aiMode, setAiMode] = useState<'VOICE' | 'VIDEO' | 'AVATAR'>('VOICE');
    const [prompt, setPrompt] = useState("");
    const [generating, setGenerating] = useState(false);
    const [smartContext, setSmartContext] = useState("");

    useEffect(() => {
        // Mock loading project data
        // In real app: const data = await getProject(params.id);
        setTimeline({
            tracks: [
                { id: 'video-1', type: 'video', name: 'Main Video', clips: [{ id: 1, name: 'HOOK_01', start: 0, duration: 3 }] },
                { id: 'audio-1', type: 'audio', name: 'Voiceover', clips: [] },
                { id: 'text-1', type: 'text', name: 'Overlays', clips: [] }
            ]
        });
    }, []);

    const handleSave = async () => {
        await saveProjectState(params.id, timeline);
        alert("Proyecto Guardado");
    };

    const handleGenerateAI = async () => {
        setGenerating(true);
        if (aiMode === 'VOICE') {
            const res = await generateElevenLabsVoice(prompt, "eleven_turbo_v2");
            if (res.success) {
                // Add to audio track
                const newClip = {
                    id: `ai-voice-${Date.now()}`,
                    name: `AI Voice: ${prompt.substring(0, 10)}...`,
                    start: currentTime,
                    duration: res.duration,
                    type: 'AUDIO'
                };
                const newTracks = [...timeline.tracks];
                newTracks[1].clips.push(newClip);
                setTimeline({ ...timeline, tracks: newTracks });
            }
        } else if (aiMode === 'VIDEO') {
            const res = await generateVeoVideo(prompt, "text-to-video");
            if (res.success) {
                // Add to video track
                const newClip = {
                    id: `ai-veo-${Date.now()}`,
                    name: `Veo Gen: ${prompt.substring(0, 10)}...`,
                    start: currentTime,
                    duration: res.duration,
                    type: 'VIDEO'
                };
                const newTracks = [...timeline.tracks];
                newTracks[0].clips.push(newClip);
                setTimeline({ ...timeline, tracks: newTracks });
            }
        } else if (aiMode === 'AVATAR') {
            const res = await generateAvatarVideo({
                productId: "dummy-prod", // Replace with real productId
                script: prompt,
                avatarId: "nano-banana-v1",
                backgroundStyle: "modern-studio"
            });
            if (res.success) {
                const newClip = {
                    id: `ai-avatar-${Date.now()}`,
                    name: `Avatar IA: ${prompt.substring(0, 10)}...`,
                    start: currentTime,
                    duration: res.duration,
                    type: 'VIDEO'
                };
                const newTracks = [...timeline.tracks];
                newTracks[0].clips.push(newClip);
                setTimeline({ ...timeline, tracks: newTracks });
            }
        }
        setGenerating(false);
        setAiPanelOpen(false);
    };

    const handleSmartPrompt = async () => {
        const res = await getSmartPromptContext("dummy-prod"); // Replace with real productId
        if (res.success) {
            setSmartContext(res.context);
            setPrompt(`${res.context}\n\nEscribe un guion persuasivo basado en esto:`);
        }
    };

    // --- TIMELINE RENDERER (Basic Visualization) ---
    const renderTrack = (track: any) => {
        return (
            <div key={track.id} className="h-24 bg-black/40 border-b border-white/5 relative mb-2 flex items-center">
                <div className="w-32 flex-shrink-0 p-2 border-r border-white/5 h-full flex flex-col justify-center bg-zinc-900/50">
                    <span className="text-xs font-bold text-gray-400 uppercase">{track.name}</span>
                    <div className="flex gap-1 mt-1">
                        {track.type === 'video' && <Scissors className="w-3 h-3 text-muted-foreground" />}
                        {track.type === 'audio' && <Mic className="w-3 h-3 text-muted-foreground" />}
                    </div>
                </div>
                <div className="flex-1 relative h-full overflow-hidden bg-white/[0.02]">
                    {/* Time markers (bg grid) */}
                    <div className="absolute inset-0 grid grid-cols-10 pointer-events-none opacity-10">
                        {[...Array(10)].map((_, i) => <div key={i} className="border-l border-white h-full"></div>)}
                    </div>

                    {/* Clips */}
                    {track.clips.map((clip: any) => (
                        <div
                            key={clip.id}
                            className={`absolute top-2 bottom-2 rounded-md border text-xs flex items-center justify-center overflow-hidden cursor-pointer hover:brightness-110 transition-all shadow-lg
                                ${track.type === 'video' ? 'bg-indigo-600/80 border-indigo-400/50' :
                                    track.type === 'audio' ? 'bg-emerald-600/80 border-emerald-400/50' :
                                        'bg-orange-600/80 border-orange-400/50'}`}
                            style={{
                                left: `${(clip.start / totalDuration) * 100}%`,
                                width: `${(clip.duration / totalDuration) * 100}%`
                            }}
                        >
                            <span className="truncate px-2 font-medium text-white shadow-black drop-shadow-md">{clip.name}</span>
                        </div>
                    ))}

                    {/* Playhead Line */}
                    <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-50 pointer-events-none"
                        style={{ left: `${(currentTime / totalDuration) * 100}%` }}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="h-screen bg-[#0A0A0A] text-white flex flex-col overflow-hidden">
            {/* TOP BAR */}
            <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-[#050505]">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}><ChevronLeft className="w-5 h-5" /></Button>
                    <div>
                        <h1 className="text-sm font-bold">Frankenstein Editor Project #1</h1>
                        <span className="text-[10px] text-muted-foreground">Last saved: Just now</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-black/50 rounded-lg p-1 border border-white/5 mr-4">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-white"><Settings className="w-4 h-4" /></Button>
                        <span className="text-xs font-mono px-2">1080x1920 (9:16)</span>
                    </div>

                    <Button
                        variant="secondary"
                        size="sm"
                        className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 hover:opacity-90"
                        onClick={() => setAiPanelOpen(true)}
                    >
                        <Sparkles className="w-4 h-4" /> Laboratorio IA
                    </Button>

                    <Button variant="outline" size="sm" className="gap-2" onClick={handleSave}>
                        <Save className="w-4 h-4" /> Save
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="sm" className="gap-2 bg-white text-black hover:bg-gray-200">
                                <Download className="w-4 h-4" /> Export
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-zinc-900 border-white/10 text-white w-56">
                            <DropdownMenuLabel className="text-[10px] uppercase font-black text-muted-foreground">Formato Estándar</DropdownMenuLabel>
                            <DropdownMenuItem className="cursor-pointer hover:bg-white/10">MP4 (Alta Calidad)</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer hover:bg-white/10">JPG/PNG (Miniatura)</DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuLabel className="text-[10px] uppercase font-black text-emerald-400">Optimizado para Web (Lento)</DropdownMenuLabel>
                            <DropdownMenuItem
                                className="cursor-pointer hover:bg-emerald-500/10 text-emerald-400 font-bold"
                                onClick={() => toast.promise(optimizeAssetExport("current", "webm"), {
                                    loading: 'Optimizando video para Landing (WebM)...',
                                    success: 'Video WebM listo para descarga',
                                    error: 'Error en la optimización'
                                })}
                            >
                                Exportar WEBM (Landing/Listicle)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="cursor-pointer hover:bg-emerald-500/10 text-emerald-400 font-bold"
                                onClick={() => toast.promise(optimizeAssetExport("current", "webp"), {
                                    loading: 'Convirtiendo a WebP progresivo...',
                                    success: 'Imagen WebP lista para descarga',
                                    error: 'Error en la conversión'
                                })}
                            >
                                Exportar WEBP (Ads/Advertorial)
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* MAIN WORKSPACE */}
            <div className="flex-1 flex overflow-hidden">
                {/* LEFT: ASSETS */}
                <div className="w-64 border-r border-white/10 bg-[#0C0C0C] flex flex-col">
                    <div className="p-4 border-b border-white/5">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Librería</h3>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="p-4 space-y-4">
                            {/* Mock Assets */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500">HOOKS (Best Performers)</label>
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="bg-white/5 p-2 rounded flex items-center gap-2 cursor-grab active:cursor-grabbing border border-transparent hover:border-white/20">
                                        <div className="h-8 w-8 bg-indigo-500/20 rounded flex items-center justify-center"><Scissors className="w-4 h-4 text-indigo-400" /></div>
                                        <div className="overflow-hidden">
                                            <p className="text-xs font-medium truncate">UGC_Hook_{i}.mp4</p>
                                            <p className="text-[10px] text-emerald-400 font-bold">CTR 2.{i}%</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500">VOICEOVERS (ElevenLabs)</label>
                                {[1, 2].map(i => (
                                    <div key={i} className="bg-white/5 p-2 rounded flex items-center gap-2 cursor-grab border border-transparent hover:border-white/20">
                                        <div className="h-8 w-8 bg-purple-500/20 rounded flex items-center justify-center"><Mic className="w-4 h-4 text-purple-400" /></div>
                                        <div>
                                            <p className="text-xs font-medium">Script_Var_{i}.mp3</p>
                                            <p className="text-[10px] text-muted-foreground">0:15</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </ScrollArea>
                </div>

                {/* CENTER: PREVIEW */}
                <div className="flex-1 flex flex-col bg-black relative">
                    <div className="flex-1 flex items-center justify-center p-8 bg-[url('/grid-bg.png')]">
                        <div className="aspect-[9/16] h-full max-h-[600px] bg-gray-900 border border-white/10 rounded-lg shadow-2xl relative overflow-hidden group">
                            {/* PREVIEW PLACEHOLDER */}
                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                                <MonitorPlay className="w-12 h-12 opacity-50 mb-2" />
                            </div>
                            <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur p-2 rounded text-xs text-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                Preview: {currentTime.toFixed(1)}s
                            </div>
                        </div>
                    </div>

                    {/* TRANSPORT CONTROLS */}
                    <div className="h-12 border-t border-white/5 bg-[#0C0C0C] flex items-center justify-center gap-4">
                        <div className="text-xs font-mono text-muted-foreground">00:00:00</div>
                        <Button size="icon" className="rounded-full h-8 w-8 bg-white text-black hover:bg-gray-200" onClick={() => setIsPlaying(!isPlaying)}>
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                        </Button>
                        <div className="text-xs font-mono text-muted-foreground">00:00:{totalDuration}</div>
                    </div>
                </div>

                {/* RIGHT: PROPERTIES */}
                <div className="w-64 border-l border-white/10 bg-[#0C0C0C]">
                    <div className="p-4">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Propiedades</h3>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase text-gray-500">Escala</label>
                                <Slider defaultValue={[100]} max={200} step={1} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase text-gray-500">Volumen</label>
                                <Slider defaultValue={[80]} max={100} step={1} />
                            </div>
                            <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                <p className="text-xs text-center text-muted-foreground">Selecciona un clip en la línea de tiempo para editar.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BOTTOM: TIMELINE */}
            <div className="h-72 border-t border-white/10 bg-[#080808] flex flex-col">
                <div className="h-8 border-b border-white/5 flex items-center px-4 justify-between">
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-white"><Scissors className="w-3 h-3 mr-1" /> Split</Button>
                        <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-white"><Type className="w-3 h-3 mr-1" /> Add Text</Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Slider defaultValue={[50]} max={100} className="w-24" />
                    </div>
                </div>
                <ScrollArea className="flex-1 p-2">
                    {timeline.tracks.map((track: any) => renderTrack(track))}
                </ScrollArea>
            </div>

            {/* AI GENERATION SHEET */}
            <Sheet open={aiPanelOpen} onOpenChange={setAiPanelOpen}>
                <SheetContent className="bg-[#0A0A0A] border-l border-white/10 text-white w-[400px]">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-400" /> Generador AI
                        </SheetTitle>
                        <SheetDescription>Crea assets sintéticos para tu video.</SheetDescription>
                    </SheetHeader>

                    <div className="py-6 space-y-6">
                        <Tabs defaultValue="voice" onValueChange={(v) => setAiMode(v as any)}>
                            <TabsList className="w-full bg-black/40 border border-white/10">
                                <TabsTrigger value="voice" className="flex-1">Voz</TabsTrigger>
                                <TabsTrigger value="video" className="flex-1">Video</TabsTrigger>
                                <TabsTrigger value="avatar" className="flex-1">Avatar</TabsTrigger>
                                <TabsTrigger value="advanced" className="flex-1">Hacks</TabsTrigger>
                            </TabsList>

                            <TabsContent value="voice" className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/5">Text-to-Speech</Badge>
                                        <Button variant="ghost" size="sm" className="h-6 text-[10px] text-purple-400" onClick={handleSmartPrompt}>
                                            <Wand2 className="w-3 h-3 mr-1" /> Smart Prompt
                                        </Button>
                                    </div>
                                    <Textarea
                                        placeholder="Escribe el guión aquí..."
                                        className="h-32 bg-white/5 border-white/10 text-xs"
                                        value={prompt}
                                        onChange={e => setPrompt(e.target.value)}
                                    />
                                    <p className="text-[10px] text-muted-foreground uppercase font-black">Voz: Adam (American Deep)</p>
                                </div>
                            </TabsContent>

                            <TabsContent value="video" className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 bg-indigo-500/5">Generative Video</Badge>
                                    <Textarea
                                        placeholder="Describe la escena (ej: Producto girando neón)..."
                                        className="h-32 bg-white/5 border-white/10 text-xs"
                                        value={prompt}
                                        onChange={e => setPrompt(e.target.value)}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="avatar" className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/5">Avatar Realista (Veo 3)</Badge>
                                        <Button variant="ghost" size="sm" className="h-6 text-[10px] text-emerald-400" onClick={handleSmartPrompt}>
                                            <Wand2 className="w-3 h-3 mr-1" /> Basar en Ganadores
                                        </Button>
                                    </div>
                                    <Textarea
                                        placeholder="Escribe el guión que dirá el avatar..."
                                        className="h-32 bg-white/5 border-white/10 text-xs"
                                        value={prompt}
                                        onChange={e => setPrompt(e.target.value)}
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Select defaultValue="male-1">
                                            <SelectTrigger className="h-8 text-[10px] bg-white/5 border-white/10">
                                                <SelectValue placeholder="Elegir Avatar" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-white/10">
                                                <SelectItem value="male-1">Alejandro (Host)</SelectItem>
                                                <SelectItem value="female-1">Sofía (UGC Style)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select defaultValue="studio">
                                            <SelectTrigger className="h-8 text-[10px] bg-white/5 border-white/10">
                                                <SelectValue placeholder="Escenario" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-white/10">
                                                <SelectItem value="studio">Estudio Pro</SelectItem>
                                                <SelectItem value="office">Oficina Moderna</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="advanced" className="space-y-4 pt-4">
                                <div className="space-y-4">
                                    <div className="p-3 bg-white/5 rounded-lg border border-white/10 space-y-2">
                                        <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                                            <Zap className="w-3 h-3" /> Replicar Competencia
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">Analiza una URL, sube un video o elige uno de tu galería para replicar.</p>

                                        <Tabs defaultValue="url" className="w-full">
                                            <TabsList className="w-full h-7 bg-black/40 p-0.5 mb-2">
                                                <TabsTrigger value="url" className="text-[9px] flex-1 h-full">URL</TabsTrigger>
                                                <TabsTrigger value="upload" className="text-[9px] flex-1 h-full">Subir</TabsTrigger>
                                                <TabsTrigger value="library" className="text-[9px] flex-1 h-full">Galería</TabsTrigger>
                                            </TabsList>

                                            <TabsContent value="url">
                                                <Input
                                                    placeholder="URL de TikTok/Ad Library..."
                                                    className="h-8 text-[10px] bg-black/40 border-white/10"
                                                    onChange={(e) => setPrompt(e.target.value)}
                                                />
                                            </TabsContent>
                                            <TabsContent value="upload">
                                                <div className="border border-dashed border-white/10 rounded-lg p-3 text-center cursor-pointer hover:bg-white/5">
                                                    <Upload className="h-4 w-4 mx-auto mb-1 text-white/30" />
                                                    <span className="text-[9px] text-white/40">Arrastra video competidor</span>
                                                </div>
                                            </TabsContent>
                                            <TabsContent value="library">
                                                <Select>
                                                    <SelectTrigger className="h-8 text-[10px] bg-black/40 border-white/10">
                                                        <SelectValue placeholder="Elegir video..." />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-zinc-900 border-white/10">
                                                        <SelectItem value="v1">Ganador_Q4_Hook.mp4</SelectItem>
                                                        <SelectItem value="v2">Retargeting_UGC.mp4</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TabsContent>
                                        </Tabs>

                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="w-full h-8 text-[10px] font-bold"
                                            onClick={async () => {
                                                const res = await replicateCompetitorVideo({
                                                    videoUrl: prompt,
                                                    targetProductId: "dummy"
                                                });
                                                if (res.success) {
                                                    setPrompt(res.suggestedScript);
                                                    setAiMode('AVATAR');
                                                    toast.success("Fuente analizada. ¡Crea tu avatar ahora!");
                                                }
                                            }}
                                        >
                                            Analizar & Replicar Guión
                                        </Button>
                                    </div>

                                    <div className="p-3 bg-white/5 rounded-lg border border-white/10 space-y-2">
                                        <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                                            <Globe className="w-3 h-3" /> Traducción & LipSync
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">Traduce el video actual con doblaje perfecto y quita subtítulos originales.</p>
                                        <Select defaultValue="en">
                                            <SelectTrigger className="h-8 text-[10px] bg-black/40 border-white/10">
                                                <SelectValue placeholder="Idioma Destino" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-white/10">
                                                <SelectItem value="en">Inglés (US)</SelectItem>
                                                <SelectItem value="pt">Portugués (BR)</SelectItem>
                                                <SelectItem value="fr">Francés</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full h-8 text-[10px] font-bold border-blue-500/30 text-blue-400"
                                            onClick={async () => {
                                                toast.promise(translateAndDubVideo({
                                                    assetId: "current",
                                                    targetLanguage: "en",
                                                    removeOriginalSubtitles: true
                                                }), {
                                                    loading: 'Traduciendo & Sincronizando labios...',
                                                    success: 'Video traducido con LipSync perfecto',
                                                    error: 'Error en la traducción'
                                                });
                                            }}
                                        >
                                            Traducir Master (Inpainting Subtitles)
                                        </Button>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full h-8 text-[10px] text-muted-foreground border border-white/5"
                                        onClick={() => {
                                            toast.promise(cleanAssetMetadata(["current"]), {
                                                loading: 'Limpiando metadata masivamente...',
                                                success: 'Archivos saneados y listos para escalar',
                                            });
                                        }}
                                    >
                                        <ShieldCheck className="w-3 h-3 mr-2" /> Limpiar Metadata (Sanitize)
                                    </Button>
                                </div>
                            </TabsContent>
                        </Tabs>

                        <Button
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 h-12 font-bold"
                            onClick={handleGenerateAI}
                            disabled={generating || !prompt}
                        >
                            {generating ? <Sparkles className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
                            {generating ? "Generando Asset..." : "Generar & Añadir al Timeline"}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
