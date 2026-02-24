"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
 Users, Plus, Sparkles, Loader2, Trash2, Video,
 User, Zap, Wand2, Play, Save, Settings, CheckCircle2,
 MessageSquare, Volume2, Mic2, Globe, ChevronRight, AlertCircle, Eye, Download,
 ShieldCheck, ZapOff, Fingerprint, Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
 saveAvatarProfile,
 getAvatarProfiles,
 deleteAvatarProfile,
 getElevenLabsVoices,
 checkLocalEngineHealth,
 getFirstStoreId,
 createEvolutionPair,
 cleanupLegacyAvatars,
 createAvatarFromResearchAction,
 getProductDriveFolder
} from "@/app/marketing/avatars/actions";
import { ScrollArea } from "@/components/ui/scroll-area";

export function IdentidadPanel() {
 return (
 <Suspense fallback={
 <div className="flex-1 flex items-center justify-center min-h-[400px]">
 <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
 </div>
 }>
 <IdentidadBody />
 </Suspense>
 );
}

function IdentidadBody() {
 const [storeId, setStoreId] = useState<string | null>(null);
 const [avatars, setAvatars] = useState<any[]>([]);
 const [voices, setVoices] = useState<any[]>([]);
 const [loading, setLoading] = useState(false);
 const [isAdding, setIsAdding] = useState(false);
 const [activePanelTab, setActivePanelTab] = useState("biblioteca");
 const [qualityTier, setQualityTier] = useState<'balanced' | 'premium'>('premium');
 const [driveFolder, setDriveFolder] = useState<any>(null);
 const searchParams = useSearchParams();

 // Profile Form State
const [formData, setFormData] = useState({
 name: '',
 sex: 'FEMALE',
 ageRange: '35-45',
 region: 'España',
 voiceId: '',
 hasGreyHair: false,
 hasWrinkles: false,
 hasAcne: false,
 hasHairLoss: false,
 skinTone: 'CLARO',
 customPrompt: '',
 voiceStability: 0.5,
 voiceSimilarity: 0.75,
 voiceStyle: 0,
 voiceSpeakerBoost: true,
 voiceLanguage: 'es'
 });

 const [editingAvatarId, setEditingAvatarId] = useState<string | null>(null);

 useEffect(() => {
 loadData();
 loadDriveInfo();
 }, [storeId]);

 const loadDriveInfo = async () => {
 const pid = searchParams.get("productId");
 if (pid) {
 const res = await getProductDriveFolder(pid);
 if (res.success) setDriveFolder(res.data);
 }
else {
 setDriveFolder(null);
 }
 };

 const loadData = async () => {
 let currentStoreId = storeId;
 if (!currentStoreId) {
 const storeRes = await getFirstStoreId();
 if (storeRes.success && storeRes.id) {
 currentStoreId = storeRes.id;
 setStoreId(storeRes.id);
 }
else return;
 }
 const [profilesRes, voicesRes] = await Promise.all([
 getAvatarProfiles(currentStoreId),
 getElevenLabsVoices()
 ]);
 if (profilesRes.success) setAvatars(profilesRes.data || []);
 if (voicesRes.success) setVoices(voicesRes.voices || []);
 };

 const handleCreateProfile = async () => {
 if (!formData.name || !storeId) return toast.error("Datos incompletos");
 setLoading(true);
 try {
 const pid = searchParams.get("productId");
 const res = await saveAvatarProfile(storeId, {
 ...formData,
 id: editingAvatarId || undefined,
 productId: pid || undefined,
 tier: qualityTier
 } as any);

 if (res.success) {
 toast.success(qualityTier === 'premium' ? "Misión de Identidad de Máximo Nivel Iniciada" : "Identidad guardada");
 setIsAdding(false);
 setEditingAvatarId(null);
 setActivePanelTab("biblioteca");
 setFormData({
 name: '',
 sex: 'FEMALE',
 ageRange: '35-45',
 region: 'España',
 voiceId: '',
 hasGreyHair: false,
 hasWrinkles: false,
 hasAcne: false,
 hasHairLoss: false,
 skinTone: 'CLARO',
 customPrompt: '',
 voiceStability: 0.5,
 voiceSimilarity: 0.75,
 voiceStyle: 0,
 voiceSpeakerBoost: true,
 voiceLanguage: 'es'
 });
 loadData();
 }
else {
 toast.error(res.error || "Error al guardar identidad");
 }
 }
finally {
 setLoading(false);
 }
 };

 const handleCreateFromResearch = async () => {
 if (!storeId) return;
 setLoading(true);
 const pid = searchParams.get("productId") || "";

 const res = await createAvatarFromResearchAction(pid, storeId);
 setLoading(false);
 if (res.success) {
 toast.success("Avatar generado desde Research");
 loadData();
 }
else {
 toast.error(res.error);
 }
 };

 const handleCleanup = async () => {
 if (!confirm("¿Deseas realizar una limpieza profunda del historial? (Borrara borradores y perfiles con error)")) return;
 setLoading(true);
 const res = await cleanupLegacyAvatars(storeId || undefined);
 if (res.success) {
 toast.success(`Limpieza completada: ${res.deletedCount} eliminados`);
 loadData();
 }
else {
 toast.error(res.error);
 }
 setLoading(false);
 };

 return (
 <Tabs value={activePanelTab} onValueChange={setActivePanelTab}
className="flex flex-col h-full gap-4">
 <div className="flex items-center justify-between border-b border-white/20 pb-2">
 <div className="flex items-center justify-between w-full">
 <TabsList className="bg-slate-900/5 p-1 rounded-xl h-9">
 <TabsTrigger value="biblioteca" className="rounded-lg px-4 py-1.5 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">BIBLIOTECA</TabsTrigger>
 <TabsTrigger value="estudio" className="rounded-lg px-4 py-1.5 text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">ESTUDIO</TabsTrigger>
 </TabsList>

 <div className="flex items-center gap-2">
 {driveFolder?.driveFolderId && (
 <Button
 onClick={() => window.open(`https://drive.google.com/drive/folders/${driveFolder.driveFolderId}`, '_blank')}
 variant="outline"
 className="h-8 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 rounded-xl font-black px-3 text-[8px] uppercase tracking-widest gap-2"
 >
 <Globe className="w-3.5 h-3.5" /> DRIVE PRODUCTO
 </Button>
 )}
 <Button onClick={handleCleanup} variant="ghost" className="h-8 px-2 text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500">
 <Trash2 className="w-3 h-3 mr-1.5" /> LIMPIAR
 </Button>
 <Button onClick={handleCreateFromResearch} variant="outline" className="h-8 border-rose-500/30 text-rose-500 hover:bg-rose-50 rounded-xl font-black px-3 text-[8px] uppercase tracking-widest gap-2" >
 <Database className="w-3.5 h-3.5" /> RESEARCH
 </Button>
 <Button
 onClick={() => {
 setEditingAvatarId(null);
 setIsAdding(true);
 setActivePanelTab("estudio");
 }}
 className="bg-slate-900 text-white rounded-xl font-black px-4 h-8 shadow-sm text-[9px] uppercase tracking-widest gap-2"
 >
 <Plus className="w-3.5 h-3.5 text-rose-500" /> CREAR
 </Button>
 </div>
 </div>
 </div>

 <TabsContent value="estudio" className="flex-1 m-0 min-h-[500px] flex flex-col">
 {isAdding ? (
 <div className="bg-white/40 border border-white/50 rounded-[2rem] p-6 space-y-4 animate-in slide-in-from-top-4 duration-500 shadow-sm glass-panel">
 <div className="flex items-center justify-between border-b border-slate-900/5 pb-4">
 <div className="flex items-center gap-2">
 <Fingerprint className="w-4 h-4 text-rose-500" />
 <h3 className="text-[10px] font-black uppercase tracking-widest">Configuración Bio-Métrica</h3>
 </div>
 <div className="flex bg-slate-900/5 p-1 rounded-xl">
 <button
 onClick={() => setQualityTier('balanced')}
 className={cn("px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all", qualityTier === 'balanced' ? "bg-white shadow-sm text-slate-900" : "text-slate-400")}
 >ESTÁNDAR</button>
 <button
 onClick={() => setQualityTier('premium')}
 className={cn("px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all", qualityTier === 'premium' ? "bg-slate-900 text-white shadow-sm" : "text-slate-400")}
 >MÁXIMO NIVEL (FLUX PRO)</button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <div className="space-y-1.5 col-span-1">
 <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
 <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
className="h-9 rounded-xl text-[10px] uppercase font-bold" />
 </div>
 <div className="space-y-1.5 col-span-1">
 <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Género</label>
 <Select value={formData.sex} onValueChange={v => setFormData({ ...formData, sex: v })}>
 <SelectTrigger className="h-9 rounded-xl text-[10px] font-bold uppercase"><SelectValue /></SelectTrigger>
 <SelectContent><SelectItem value="FEMALE">FEMENINO</SelectItem><SelectItem value="MALE">MASCULINO</SelectItem></SelectContent>
 </Select>
 </div>
 <div className="space-y-1.5 col-span-1">
 <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Edad Target</label>
 <Select value={formData.ageRange} onValueChange={v => setFormData({ ...formData, ageRange: v })}>
 <SelectTrigger className="h-9 rounded-xl text-[10px] font-bold uppercase"><SelectValue /></SelectTrigger>
 <SelectContent>
 {['18-25', '25-35', '35-45', '45-55', '55-65', '65+'].map(r => <SelectItem key={r} value={r}>{r} AÑOS</SelectItem>)}
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-1.5 col-span-1">
 <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Región</label>
 <Input value={formData.region} onChange={e => setFormData({ ...formData, region: e.target.value })}
className="h-9 rounded-xl text-[10px] font-bold uppercase" />
 </div>
 </div>

 <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-slate-900/5 rounded-2xl border border-slate-900/5">
 <TraitToggle label="Arrugas" active={formData.hasWrinkles} onClick={() => setFormData({ ...formData, hasWrinkles: !formData.hasWrinkles })} />
 <TraitToggle label="Acné" active={formData.hasAcne} onClick={() => setFormData({ ...formData, hasAcne: !formData.hasAcne })} />
 <TraitToggle label="Calvicie" active={formData.hasHairLoss} onClick={() => setFormData({ ...formData, hasHairLoss: !formData.hasHairLoss })} />
 <TraitToggle label="Canas" active={formData.hasGreyHair} onClick={() => setFormData({ ...formData, hasGreyHair: !formData.hasGreyHair })} />
 <Select value={formData.skinTone} onValueChange={v => setFormData({ ...formData, skinTone: v })}>
 <SelectTrigger className="h-10 rounded-xl text-[10px] uppercase font-black"><SelectValue /></SelectTrigger>
 <SelectContent>
 {['CLARO', 'MEDIO', 'OSCURO', 'BRONCEADO'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
 </SelectContent>
 </Select>
 </div>

 <div className="p-6 bg-slate-900/5 rounded-[2rem] border border-slate-900/5 space-y-6">
 <div className="flex items-center gap-2 mb-2">
 <Volume2 className="w-3.5 h-3.5 text-rose-500" />
 <h3 className="text-[9px] font-black uppercase tracking-widest">Configuración Avanzada de Locución</h3>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 <div className="space-y-4">
 <VoiceSlider
 label="Estabilidad (Tono)"
 value={formData.voiceStability}
 onChange={v => setFormData({ ...formData, voiceStability: v })}
 description="Menor = Más emotivo/variable. Mayor = Más monótono/estable."
 />
 <VoiceSlider
 label="Fidelidad (Clonación)"
 value={formData.voiceSimilarity}
 onChange={v => setFormData({ ...formData, voiceSimilarity: v })}
 description="Fuerza del parecido con la voz original."
 />
 </div>
 <div className="space-y-4">
 <VoiceSlider
 label="Exageración de Estilo"
 value={formData.voiceStyle}
 onChange={v => setFormData({ ...formData, voiceStyle: v })}
 description="Aumenta la expresividad dramática de la voz."
 />
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Idioma</label>
 <Select value={formData.voiceLanguage} onValueChange={v => setFormData({ ...formData, voiceLanguage: v })}>
 <SelectTrigger className="h-9 rounded-xl text-[10px] font-bold uppercase"><SelectValue /></SelectTrigger>
 <SelectContent>
 <SelectItem value="es">Español</SelectItem>
 <SelectItem value="en">Inglés</SelectItem>
 <SelectItem value="it">Italiano</SelectItem>
 <SelectItem value="fr">Francés</SelectItem>
 <SelectItem value="de">Alemán</SelectItem>
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-2">
 <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Speaker Boost</label>
 <button
 onClick={() => setFormData({ ...formData, voiceSpeakerBoost: !formData.voiceSpeakerBoost })}
 className={cn(
 "w-full h-9 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all",
 formData.voiceSpeakerBoost ? "bg-slate-900 text-white" : "bg-white text-slate-400"
 )}
 >
 {formData.voiceSpeakerBoost ? "ACTIVO" : "INACTIVO"}
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>

 <div className="flex gap-3">
 <Button onClick={() => setIsAdding(false)} variant="outline" className="flex-1 rounded-xl h-10 font-black text-[10px] uppercase">Cancelar</Button>
 <Button onClick={handleCreateProfile} disabled={loading}
className="flex-[2] bg-slate-900 text-white rounded-xl h-10 font-black text-[10px] uppercase tracking-widest">
 {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (qualityTier === 'premium' ? <Sparkles className="w-4 h-4 text-rose-500 mr-2" /> : <Save className="w-4 h-4 text-rose-500 mr-2" />)}
 {qualityTier === 'premium' ? 'INICIAR SÍNTESIS AGÉNTICA' : 'GUARDAR IDENTIDAD'}
 </Button>
 </div>
 </div>
 ) : (
 <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
 <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6">
 <Sparkles className="w-10 h-10 text-rose-500" />
 </div>
 <h2 className="text-xl font-black uppercase tracking-tighter text-slate-900 mb-2">Comienza la Magia</h2>
 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest max-w-[200px] mb-8 leading-relaxed">Configura un nuevo avatar con parámetros bio-métricos avanzados.</p>
 <Button onClick={() => setIsAdding(true)}
className="bg-slate-900 text-white rounded-[2rem] px-10 h-14 font-black text-xs uppercase tracking-widest shadow-sm hover:scale-105 transition-all gap-4">
 <Plus className="w-5 h-5 text-rose-500" /> CREAR NUEVO AVATAR
 </Button>
 </div>
 )}
 </TabsContent>

 <TabsContent value="biblioteca" className="flex-1 m-0 min-h-[500px] flex flex-col">
 <ScrollArea className="h-full pr-4">
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-2">
 {avatars.map(a => (
 <div key={a.id}
className="group relative rounded-[2rem] border border-white/50 bg-white/20 overflow-hidden hover:shadow-sm transition-all duration-500">
 <div className="aspect-[3/4] bg-slate-100/50 relative">
 {a.imageUrl ? <img src={a.imageUrl}
className="w-full h-full object-cover" /> : <User className="w-10 h-10 text-slate-200 absolute inset-0 m-auto" />}
 <div className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center p-6 gap-3">
 <Button size="sm" variant="secondary" className="w-full rounded-xl text-[9px] font-black uppercase tracking-widest h-9 bg-white text-slate-900" onClick={() => {
 const meta = JSON.parse(a.metadataJson || "{}");
 setFormData({
 name: a.name,
 sex: a.sex,
 ageRange: a.ageRange,
 region: a.region,
 voiceId: meta.voiceId || "",
 hasGreyHair: meta.traits?.hasGreyHair || false,
 hasWrinkles: meta.traits?.hasWrinkles || false,
 hasAcne: meta.traits?.hasAcne || false,
 hasHairLoss: meta.traits?.hasHairLoss || false,
 skinTone: meta.traits?.skinTone || 'CLARO',
 customPrompt: meta.customPrompt || '',
 voiceStability: meta.voiceSettings?.stability ?? 0.5,
 voiceSimilarity: meta.voiceSettings?.similarity ?? 0.75,
 voiceStyle: meta.voiceSettings?.style ?? 0,
 voiceSpeakerBoost: meta.voiceSettings?.use_speaker_boost ?? true,
 voiceLanguage: meta.voiceSettings?.language || 'es'
 });
 setEditingAvatarId(a.id);
 setIsAdding(true);
 setActivePanelTab("estudio");
 }}>RE-CONFIGURAR</Button>
 <Button size="sm" variant="secondary" className="w-full rounded-xl text-[9px] font-black uppercase tracking-widest h-9 bg-rose-500 text-white" onClick={() => createEvolutionPair(a.id).then(loadData)}>
 <Zap className="w-3 h-3 fill-white" /> EVOLUCIÓN
 </Button>
 </div>
 <Badge className={cn(
 "absolute top-3 left-3 text-[7px] font-black uppercase tracking-widest px-2 h-5",
 a.status === 'GENERATING_IMAGE' ? "bg-amber-500 animate-pulse" : "bg-emerald-500 text-white"
 )}>
 {a.status === 'GENERATING_IMAGE' ? 'PROCESANDO' : 'LISTO'}
 </Badge>
 </div>
 <div className="p-4 bg-white/50">
 <div className="flex justify-between items-start mb-1">
 <h3 className="text-[10px] font-black text-slate-900 uppercase italic truncate">{a.name}</h3>
 {a.status === 'READY' && (
 <div className="flex gap-1">
 <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-rose-500" onClick={() => deleteAvatarProfile(a.id).then(loadData)}>
 <Trash2 className="w-3 h-3" />
 </Button>
 </div>
 )}
 </div>
 <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">{a.region} • {a.ageRange}</p>
 </div>
 </div>
 ))}
 </div>
 </ScrollArea>
 </TabsContent>
 </Tabs>
 );
}

function TraitToggle({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
 return (
 <button
 onClick={onClick}
 className={cn(
 "flex items-center justify-between px-3 h-10 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all",
 active
 ? "bg-slate-900 border-slate-900 text-white shadow-sm scale-105"
 : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
 )}
 >
 {label}
 {active && <CheckCircle2 className="w-3 h-3 text-rose-500 ml-2" />}
 </button>
 );
}

function VoiceSlider({ label, value, onChange, description }: { label: string, value: number, onChange: (v: number) => void, description: string }) {
 return (
 <div className="space-y-2">
 <div className="flex justify-between items-center">
 <label className="text-[9px] font-black text-slate-900 uppercase tracking-widest">{label}</label>
 <span className="text-[10px] font-black text-rose-500">{Math.round(value * 100)}%</span>
 </div>
 <input
 type="range"
 min="0"
 max="1"
 step="0.05"
 value={value}
 onChange={e => onChange(parseFloat(e.target.value))}
 className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
 />
 <p className="text-[7px] font-medium text-slate-400 uppercase tracking-tighter leading-none">{description}</p>
 </div>
 );
}
