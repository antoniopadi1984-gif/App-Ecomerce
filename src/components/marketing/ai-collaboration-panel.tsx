
"use client";

import React, { useState } from "react";
import {
    Copy, ExternalLink, Download, Save,
    Sparkles, Bot, User, CheckCircle2,
    ChevronRight, AlertCircle, Trash2, Send,
    Wand2, FileText, LayoutList, Clapperboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MASTER_PROTOCOL_PROMPTS } from "@/lib/deep-protocol";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";

interface AiCollaborationPanelProps {
    productId: string;
    productName: string;
    context: {
        country?: string;
        urls?: string[];
        competitors?: string[];
        customPrompt?: string;
        playbookKey?: keyof typeof MASTER_PROTOCOL_PROMPTS;
    };
    onImport: (data: any, raw: string) => Promise<void>;
    onGenerateNext?: (type: 'advertorial' | 'listicle' | 'product_page' | 'scripts') => void;
}

export function AiCollaborationPanel({
    productId,
    productName,
    context,
    onImport,
    onGenerateNext
}: AiCollaborationPanelProps) {
    const [importValue, setImportValue] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const generatePrompt = () => {
        if (context.playbookKey && MASTER_PROTOCOL_PROMPTS[context.playbookKey]) {
            // Some prompts in deep-protocol take different arguments, this is a generic map
            const fn = MASTER_PROTOCOL_PROMPTS[context.playbookKey] as any;
            if (context.playbookKey === 'MASS_DESIRES') {
                return fn(productName, context.country || 'Global', context.competitors || []);
            }
            // Add other mappings if needed
        }
        return context.customPrompt || "No prompt configured";
    };

    const handleCopyAndOpen = (target: 'gemini' | 'claude') => {
        const prompt = generatePrompt();
        navigator.clipboard.writeText(prompt);

        const urls = {
            gemini: "https://gemini.google.com/app",
            claude: "https://claude.ai/new"
        };

        window.open(urls[target], "_blank");
        toast.success("Prompt Maestro copiado. Pega y ejecuta en la nueva pestaña.");
    };

    const handleProcessImport = async () => {
        if (!importValue.trim()) return;
        setIsSaving(true);

        try {
            let data = null;
            let isJson = false;

            // Validation Logic
            try {
                let cleaned = importValue.replace(/```json/g, "").replace(/```/g, "");
                const firstBrace = cleaned.indexOf('{');
                const lastBrace = cleaned.lastIndexOf('}');
                if (firstBrace !== -1 && lastBrace !== -1) {
                    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
                }
                data = JSON.parse(cleaned);
                isJson = true;
            } catch (e) {
                data = { raw: importValue }; // Fallback
            }

            await onImport(data, importValue);
            setImportValue("");
            toast.success(isJson ? "Respuesta estructurada importada con éxito." : "Contenido importado como texto raw.");
        } catch (error: any) {
            toast.error("Error al procesar la importación: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card className="rounded-[2rem] border-border bg-card shadow-2xl overflow-hidden border-2 border-primary/20">
            <CardHeader className="p-8 border-b border-border bg-muted/30">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" /> IA Collaboration Hub
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest mt-1">
                            Ahorro de API Mode: Generación Externa & Sincronización
                        </CardDescription>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] px-3">
                        MASTER PROTOCOL v.4.2
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
                {/* EXPORT SECTION */}
                <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">1. Exportar a Cerebro Externo</Label>
                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            onClick={() => handleCopyAndOpen('gemini')}
                            className="h-16 rounded-2xl bg-[#1a73e8] hover:bg-[#1557b0] text-white flex flex-col items-center justify-center gap-1 group transition-all active:scale-95"
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest group-hover:scale-110 transition-transform">Copiar + Gemini</span>
                            <div className="flex items-center gap-2 text-[8px] opacity-70">
                                <ExternalLink className="h-3 w-3" /> Abrir gemini.google.com
                            </div>
                        </Button>
                        <Button
                            onClick={() => handleCopyAndOpen('claude')}
                            className="h-16 rounded-2xl bg-[#d97757] hover:bg-[#bf6a4d] text-white flex flex-col items-center justify-center gap-1 group transition-all active:scale-95"
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest group-hover:scale-110 transition-transform">Copiar + Claude</span>
                            <div className="flex items-center gap-2 text-[8px] opacity-70">
                                <ExternalLink className="h-3 w-3" /> Abrir claude.ai
                            </div>
                        </Button>
                    </div>
                </div>

                {/* IMPORT SECTION */}
                <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">2. Importar Respuesta</Label>
                    <div className="relative">
                        <Textarea
                            placeholder="Pega aquí la respuesta completa de la IA (Markdown o JSON)..."
                            className="min-h-[200px] rounded-[1.5rem] bg-muted/50 border-border p-6 text-xs font-medium leading-relaxed focus:ring-primary/20 resize-none transition-all"
                            value={importValue}
                            onChange={(e) => setImportValue(e.target.value)}
                        />
                        {importValue && (
                            <Button
                                size="icon"
                                variant="ghost"
                                className="absolute top-4 right-4 h-8 w-8 text-muted-foreground hover:text-rose-500"
                                onClick={() => setImportValue("")}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={handleProcessImport}
                            disabled={!importValue || isSaving}
                            className="w-full h-14 rounded-2xl bg-foreground text-background font-black uppercase tracking-[0.2em] shadow-xl hover:bg-foreground/90 transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            {isSaving ? <Wand2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                            Guardar & Procesar Investigación
                        </Button>

                        {onGenerateNext && (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pt-2">
                                <QuickTool icon={FileText} label="Advertorial" onClick={() => onGenerateNext('advertorial')} />
                                <QuickTool icon={LayoutList} label="Listicle" onClick={() => onGenerateNext('listicle')} />
                                <QuickTool icon={Clapperboard} label="Script Video" onClick={() => onGenerateNext('scripts')} />
                                <QuickTool icon={Sparkles} label="Product Page" onClick={() => onGenerateNext('product_page')} />
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 bg-primary/5 rounded-[1.5rem] border border-primary/10">
                    <div className="flex gap-4">
                        <AlertCircle className="h-5 w-5 text-primary shrink-0" />
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-wider text-primary">Sincronización Inteligente</p>
                            <p className="text-[10px] text-muted-foreground leading-relaxed font-bold">
                                El sistema reconocerá automáticamente los campos de <b>Eugene Schwartz</b> y los inyectará en tu base de datos central para generar piezas creativas.
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function QuickTool({ icon: Icon, label, onClick }: any) {
    return (
        <Button
            variant="outline"
            onClick={onClick}
            className="flex flex-col h-16 rounded-xl border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all gap-1 p-2"
        >
            <Icon className="h-4 w-4 text-primary" />
            <span className="text-[8px] font-black uppercase tracking-tighter">{label}</span>
        </Button>
    );
}
