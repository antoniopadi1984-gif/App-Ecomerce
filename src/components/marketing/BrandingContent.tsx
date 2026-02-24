"use client";

import { useState, useEffect } from "react";
import { Sparkles, Save, Shield, Target, MessageSquare, Image as ImageIcon, Plus, X, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useProduct } from "@/context/ProductContext";
import { toast } from "sonner";

export function BrandingContent() {
    const { productId, product } = useProduct();
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<any>({
        brandVoice: "",
        targetAudience: "",
        usps: [],
        adAngles: [],
        visualGuidelines: "",
        offer: {
            dreamOutcome: "",
            likelihood: 5,
            timeDelay: 5,
            effort: 5,
            bonus: ""
        }
    });

    const calculateValueScore = () => {
        const { dreamOutcome, likelihood, timeDelay, effort } = profile.offer;
        // Hormozi Equation: (Outcome * Likelihood) / (Time * Effort)
        // Values normalized 1-10
        const score = (10 * (likelihood / 10)) / ((timeDelay / 10) * (effort / 10) || 1);
        return Math.min(100, score);
    };

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
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div>
                    <h1 className="text-lg font-black text-slate-900 flex items-center gap-2 uppercase italic tracking-tighter">
                        Branding Engine <span className="text-slate-400 not-italic">•</span> <span className="text-indigo-600">{product?.title || 'Producto'}</span>
                    </h1>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Identidad Forense y Offer Engineering</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="h-8 text-[9px] font-black uppercase tracking-widest rounded-xl border-slate-200">
                        <Sparkles className="w-3 h-3 mr-2 text-indigo-500" /> Analizar
                    </Button>
                    <Button onClick={handleSave} className="gap-2 bg-slate-900 hover:bg-black h-8 text-[9px] font-black uppercase tracking-widest rounded-xl px-4 shadow-xl shadow-slate-200">
                        <Save className="w-3 h-3" /> Guardar
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. BRAND DNA (Spencer Pawlin) */}
                <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white flex flex-col">
                    <CardHeader className="p-4 bg-slate-50 border-b border-slate-100">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-slate-900">
                            <Shield className="w-3.5 h-3.5 text-indigo-500" /> Creative DNA
                        </CardTitle>
                        <CardDescription className="text-slate-400 text-[8px] font-bold uppercase tracking-widest mt-0.5">Spencer Pawlin Framework</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4 flex-1">
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Identidad de Marca</label>
                                <Textarea
                                    value={profile.brandVoice}
                                    onChange={(e) => setProfile({ ...profile, brandVoice: e.target.value })}
                                    placeholder="Personalidad y valores..."
                                    className="min-h-[80px] text-xs bg-slate-50/50 border-slate-100 rounded-xl resize-none focus:bg-white transition-colors"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Avatar Omnisciente</label>
                                <Textarea
                                    value={profile.targetAudience}
                                    onChange={(e) => setProfile({ ...profile, targetAudience: e.target.value })}
                                    placeholder="Miedos y deseos..."
                                    className="min-h-[80px] text-xs bg-slate-50/50 border-slate-100 rounded-xl resize-none focus:bg-white transition-colors"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. OFFER ENGINEERING (Alex Hormozi) */}
                <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white flex flex-col">
                    <CardHeader className="p-4 bg-indigo-50 border-b border-indigo-100 flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-indigo-900">
                                <Zap className="w-3.5 h-3.5 fill-indigo-500 text-indigo-500" /> Offer Engine
                            </CardTitle>
                            <CardDescription className="text-indigo-400 text-[8px] font-bold uppercase tracking-widest mt-0.5">Alex Hormozi V2 Equation</CardDescription>
                        </div>
                        <Badge className="bg-indigo-600 text-white border-0 text-[10px] font-black px-2 py-0.5 rounded-lg">Score: {calculateValueScore().toFixed(0)}</Badge>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4 flex-1">
                        <div className="space-y-3">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500 tracking-widest flex justify-between">
                                        Perceived Likelihood <span className="text-indigo-600">{profile.offer.likelihood}/10</span>
                                    </label>
                                    <input type="range" min="1" max="10" value={profile.offer.likelihood} onChange={(e) => setProfile({ ...profile, offer: { ...profile.offer, likelihood: parseInt(e.target.value) } })} className="w-full accent-indigo-600 h-1 bg-slate-200 rounded-full appearance-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500 tracking-widest flex justify-between">
                                        Time Delay <span className="text-indigo-600">{profile.offer.timeDelay}/10</span>
                                    </label>
                                    <input type="range" min="1" max="10" value={profile.offer.timeDelay} onChange={(e) => setProfile({ ...profile, offer: { ...profile.offer, timeDelay: parseInt(e.target.value) } })} className="w-full accent-indigo-600 h-1 bg-slate-200 rounded-full appearance-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase text-slate-500 tracking-widest flex justify-between">
                                        Effort & Sacrifice <span className="text-indigo-600">{profile.offer.effort}/10</span>
                                    </label>
                                    <input type="range" min="1" max="10" value={profile.offer.effort} onChange={(e) => setProfile({ ...profile, offer: { ...profile.offer, effort: parseInt(e.target.value) } })} className="w-full accent-indigo-600 h-1 bg-slate-200 rounded-full appearance-none" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Bonus Irresistible</label>
                                <Input
                                    value={profile.offer.bonus}
                                    onChange={(e) => setProfile({ ...profile, offer: { ...profile.offer, bonus: e.target.value } })}
                                    placeholder="Multiplicador..."
                                    className="h-9 text-xs bg-slate-50/50 border-slate-100 rounded-xl"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. ASSET ENGINE guidelines */}
                <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white flex flex-col">
                    <CardHeader className="p-4 bg-slate-50 border-b border-slate-100">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-slate-900">
                            <ImageIcon className="w-3.5 h-3.5 text-emerald-500" /> Visual Engine
                        </CardTitle>
                        <CardDescription className="text-slate-400 text-[8px] font-bold uppercase tracking-widest mt-0.5">Intelligence Lab Output</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4 flex-1">
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Estética y Referencias</label>
                                <Textarea
                                    value={profile.visualGuidelines}
                                    onChange={(e) => setProfile({ ...profile, visualGuidelines: e.target.value })}
                                    placeholder="Mood y referencias..."
                                    className="min-h-[140px] text-xs bg-slate-50/50 border-slate-100 rounded-xl resize-none focus:bg-white transition-colors"
                                />
                            </div>

                            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-[9px] font-bold text-emerald-800 italic leading-relaxed">
                                "La estética debe reflejar autoridad instantánea. Evita contenido genérico."
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
