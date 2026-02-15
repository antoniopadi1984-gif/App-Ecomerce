"use client";

import { useState, useEffect } from "react";
import { Sparkles, Save, Shield, Target, MessageSquare, Image as ImageIcon, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useProduct } from "@/context/ProductContext";
import { toast } from "sonner";

export default function BrandingPage() {
    const { productId, product } = useProduct();
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<any>({
        brandVoice: "",
        targetAudience: "",
        usps: [],
        adAngles: [],
        visualGuidelines: ""
    });

    const [newUSP, setNewUSP] = useState("");
    const [newAngle, setNewAngle] = useState("");

    useEffect(() => {
        if (productId && productId !== 'GLOBAL') {
            loadBranding();
        }
    }, [productId]);

    const loadBranding = async () => {
        setLoading(true);
        // In a real app, this would be a server action
        // For the blueprint, we simulate a fetch
        try {
            // Simulated fetch
            setTimeout(() => {
                setLoading(false);
            }, 500);
        } catch (e) {
            setLoading(false);
        }
    };

    const handleSave = () => {
        toast.success("Perfil de branding guardado");
    };

    const addUSP = () => {
        if (!newUSP) return;
        setProfile({ ...profile, usps: [...profile.usps, newUSP] });
        setNewUSP("");
    };

    const addAngle = () => {
        if (!newAngle) return;
        setProfile({ ...profile, adAngles: [...profile.adAngles, newAngle] });
        setNewAngle("");
    };

    if (productId === 'GLOBAL') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
                <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 mb-3">
                    <Sparkles className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">AI Branding Engine</h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] max-w-xs mt-1">
                    Selecciona un producto específico para construir su identidad inteligente.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between gap-4 items-end">
                <div>
                    <h1 className="text-xl font-black bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent flex items-center gap-2 uppercase italic tracking-tighter">
                        Branding Engine: {product?.title || 'Producto'}
                    </h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-0.5">Identidad de marca y ángulos ganadores</p>
                </div>
                <Button onClick={handleSave} className="gap-2 bg-indigo-600 hover:bg-indigo-700 h-8 text-[10px] font-black uppercase tracking-widest rounded-lg px-4 shadow-lg shadow-indigo-200">
                    <Save className="w-3.5 h-3.5" /> Guardar Identidad
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Brand Voice & Audience */}
                <Card className="border-indigo-100 shadow-sm rounded-lg">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <MessageSquare className="w-3.5 h-3.5 text-indigo-500" /> Voz y Audiencia
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Voz de Marca</label>
                            <Textarea
                                placeholder="Ej: Profesional, empático, directo..."
                                value={profile.brandVoice}
                                onChange={(e) => setProfile({ ...profile, brandVoice: e.target.value })}
                                className="min-h-[80px] text-xs p-3 rounded-lg border-slate-200 focus:ring-1 focus:ring-indigo-500/20"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Avatar / Público Objetivo</label>
                            <Textarea
                                placeholder="Ej: Mujeres 35-50 interesadas en salud natural..."
                                value={profile.targetAudience}
                                onChange={(e) => setProfile({ ...profile, targetAudience: e.target.value })}
                                className="min-h-[80px] text-xs p-3 rounded-lg border-slate-200 focus:ring-1 focus:ring-indigo-500/20"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* USPs & Angles */}
                <Card className="border-purple-100 shadow-sm rounded-lg">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Target className="w-3.5 h-3.5 text-purple-500" /> Diferenciales y Ángulos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 space-y-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">USPs (Propuesta Única de Venta)</label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Añadir beneficio..."
                                    value={newUSP}
                                    onChange={(e) => setNewUSP(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addUSP()}
                                    className="h-8 text-xs rounded-lg border-slate-200"
                                />
                                <Button size="sm" onClick={addUSP} variant="outline" className="h-8 rounded-lg px-2"><Plus className="w-3.5 h-3.5" /></Button>
                            </div>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {profile.usps.map((usp: string, i: number) => (
                                    <Badge key={i} variant="secondary" className="gap-1 px-2 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-600 border-0 rounded-md">
                                        {usp} <X className="w-2.5 h-2.5 cursor-pointer opacity-50 hover:opacity-100" onClick={() => setProfile({ ...profile, usps: profile.usps.filter((_: any, idx: number) => idx !== i) })} />
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Ángulos de Anuncio</label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Añadir ángulo..."
                                    value={newAngle}
                                    onChange={(e) => setNewAngle(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addAngle()}
                                    className="h-8 text-xs rounded-lg border-slate-200"
                                />
                                <Button size="sm" onClick={addAngle} variant="outline" className="h-8 rounded-lg px-2"><Plus className="w-3.5 h-3.5" /></Button>
                            </div>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {profile.adAngles.map((angle: string, i: number) => (
                                    <Badge key={i} className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-none gap-1 px-2 py-0.5 text-[9px] font-bold rounded-md">
                                        {angle} <X className="w-2.5 h-2.5 cursor-pointer opacity-50 hover:opacity-100" onClick={() => setProfile({ ...profile, adAngles: profile.adAngles.filter((_: any, idx: number) => idx !== i) })} />
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Visual Guidelines */}
                <Card className="border-emerald-100 shadow-sm md:col-span-2 rounded-lg">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <ImageIcon className="w-3.5 h-3.5 text-emerald-500" /> Guía Visual
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <Textarea
                            placeholder="Ej: Colores pasteles, tomas de lifestyle, tipografía limpia..."
                            value={profile.visualGuidelines}
                            onChange={(e) => setProfile({ ...profile, visualGuidelines: e.target.value })}
                            className="min-h-[60px] text-xs p-3 rounded-lg border-slate-200 focus:ring-1 focus:ring-indigo-500/20"
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
