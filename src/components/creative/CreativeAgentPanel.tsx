'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Sparkles, ChevronDown, ChevronUp, Save, Wand2, Copy, Plus, X,
    ExternalLink, Loader2, Check, Brain
} from 'lucide-react';
import {
    getOrCreateCreativeAgent,
    updateAgentPrompt,
    addAgentExample,
    removeAgentExample,
    generateWithAgent,
} from '@/app/centro-creativo/agents-actions';
import { CREATIVE_CONCEPTS, AUDIENCE_TYPES, AWARENESS_LEVELS } from '@/lib/creative/spencer-knowledge';

interface CreativeAgentPanelProps {
    storeId: string;
    productId?: string;
    productTitle?: string;
    agentRole: string;
    agentName?: string;
    initialPrompt?: string;
    onGenerate?: (text: string, context: any) => void;
    onImport?: (data: string) => void;
    defaultOpen?: boolean;
}

export function CreativeAgentPanel({
    storeId,
    productId,
    productTitle,
    agentRole,
    agentName,
    initialPrompt = '',
    onGenerate,
    onImport,
    defaultOpen = false,
}: CreativeAgentPanelProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [agent, setAgent] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [result, setResult] = useState<string>('');
    const [copied, setCopied] = useState(false);

    // Selectors
    const [selectedConcept, setSelectedConcept] = useState<number | undefined>();
    const [selectedAudience, setSelectedAudience] = useState<string | undefined>();
    const [selectedAwareness, setSelectedAwareness] = useState<string | undefined>();

    // Prompt
    const [customPrompt, setCustomPrompt] = useState(initialPrompt);
    const [instructions, setInstructions] = useState('');

    // Examples
    const [newExampleUrl, setNewExampleUrl] = useState('');

    // Load agent on mount
    useEffect(() => {
        if (isOpen && !agent) loadAgent();
    }, [isOpen]);

    const loadAgent = useCallback(async () => {
        setLoading(true);
        try {
            const a = await getOrCreateCreativeAgent(storeId, agentRole, {
                name: agentName || `Agente ${agentRole}`,
            });
            setAgent(a);
            setInstructions(a.instructions || '');
        } catch (e) {
            console.error('Failed to load agent:', e);
        }
        setLoading(false);
    }, [storeId, agentRole, agentName]);

    const handleSavePrompt = async () => {
        if (!agent) return;
        setSaving(true);
        await updateAgentPrompt(agent.id, instructions);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleAddExample = async () => {
        if (!agent || !newExampleUrl.trim()) return;
        const res = await addAgentExample(agent.id, {
            type: newExampleUrl.startsWith('http') ? 'url' : 'text',
            content: newExampleUrl.trim(),
        });
        if (res.success) {
            setAgent({ ...agent, examples: res.examples });
            setNewExampleUrl('');
        }
    };

    const handleRemoveExample = async (index: number) => {
        if (!agent) return;
        const res = await removeAgentExample(agent.id, index);
        if (res.success) {
            setAgent({ ...agent, examples: res.examples });
        }
    };

    const handleGenerate = async () => {
        if (!agent) return;
        setGenerating(true);
        setResult('');
        try {
            const res = await generateWithAgent({
                agentId: agent.id,
                storeId,
                context: productTitle ? `Producto: ${productTitle}` : 'Centro Creativo',
                funnelStage: selectedAudience,
                concept: selectedConcept,
                awarenessLevel: selectedAwareness,
                customPrompt,
            });
            if (res.success && res.text) {
                setResult(res.text);
                onGenerate?.(res.text, res.context);
            } else {
                setResult(`Error: ${res.error || 'Generation failed'}`);
            }
        } catch (e: any) {
            setResult(`Error: ${e.message}`);
        }
        setGenerating(false);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Header — Always visible */}
            <CardHeader
                className="p-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-purple-50/30 cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-purple-600" />
                        <div>
                            <CardTitle className="text-sm font-black uppercase tracking-tight">
                                {agentName || `Agente ${agentRole}`}
                            </CardTitle>
                            <CardDescription className="text-[9px] font-bold uppercase tracking-widest">
                                Spencer Pawlin v4 — IA Generativa
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge className="bg-purple-50 text-purple-600 border border-purple-100 text-[8px] font-black px-2 py-0.5">
                            C1-C7
                        </Badge>
                        {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                    </div>
                </div>
            </CardHeader>

            {/* Body — Collapsible */}
            {isOpen && (
                <CardContent className="p-4 space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                            <span className="ml-2 text-sm text-slate-500">Cargando agente...</span>
                        </div>
                    ) : (
                        <>
                            {/* ROW 1: Concept Selector C1-C7 */}
                            <div>
                                <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
                                    Concepto Creativo
                                </Label>
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                    {CREATIVE_CONCEPTS.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => setSelectedConcept(selectedConcept === c.id ? undefined : c.id)}
                                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${selectedConcept === c.id
                                                ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300'
                                                }`}
                                        >
                                            {c.code} {c.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ROW 2: Audience + Awareness */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
                                        Audiencia
                                    </Label>
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                        {AUDIENCE_TYPES.map(a => (
                                            <button
                                                key={a.id}
                                                onClick={() => setSelectedAudience(selectedAudience === a.id ? undefined : a.id)}
                                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all border ${selectedAudience === a.id
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                                                    }`}
                                            >
                                                {a.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
                                        Consciencia
                                    </Label>
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                        {AWARENESS_LEVELS.map(a => (
                                            <button
                                                key={a.id}
                                                onClick={() => setSelectedAwareness(selectedAwareness === a.id ? undefined : a.id)}
                                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all border ${selectedAwareness === a.id
                                                    ? 'text-white border-current'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                                    }`}
                                                style={selectedAwareness === a.id ? { backgroundColor: a.color, borderColor: a.color } : {}}
                                            >
                                                {a.id}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* ROW 3: Custom Prompt */}
                            <div>
                                <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
                                    Instrucciones Personalizadas
                                </Label>
                                <Textarea
                                    value={instructions}
                                    onChange={e => setInstructions(e.target.value)}
                                    placeholder="Instrucciones específicas para este agente (se guardan permanentemente)..."
                                    className="mt-1.5 min-h-[60px] text-xs rounded-lg border-slate-200 resize-none"
                                />
                                <div className="flex justify-end mt-1">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleSavePrompt}
                                        disabled={saving}
                                        className="h-7 text-[9px] font-bold"
                                    >
                                        {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> :
                                            saved ? <Check className="h-3 w-3 mr-1 text-green-500" /> :
                                                <Save className="h-3 w-3 mr-1" />}
                                        {saved ? 'Guardado' : 'Guardar'}
                                    </Button>
                                </div>
                            </div>

                            {/* ROW 4: Examples */}
                            <div>
                                <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
                                    Ejemplos de Referencia ({agent?.examples?.length || 0})
                                </Label>
                                <div className="mt-1.5 space-y-1">
                                    {agent?.examples?.map((ex: any, i: number) => (
                                        <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg px-2 py-1">
                                            <Badge variant="outline" className="text-[8px] font-bold">
                                                {ex.type}
                                            </Badge>
                                            <span className="text-[10px] text-slate-600 truncate flex-1">{ex.content}</span>
                                            <button onClick={() => handleRemoveExample(i)} className="text-slate-400 hover:text-red-500">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2 mt-1.5">
                                    <Input
                                        value={newExampleUrl}
                                        onChange={e => setNewExampleUrl(e.target.value)}
                                        placeholder="URL, texto o descripción de ejemplo..."
                                        className="text-xs h-8 rounded-lg"
                                        onKeyDown={e => e.key === 'Enter' && handleAddExample()}
                                    />
                                    <Button size="sm" variant="outline" onClick={handleAddExample} className="h-8 px-2">
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>

                            {/* ROW 5: Generation Input */}
                            <div>
                                <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
                                    Petición Específica
                                </Label>
                                <Textarea
                                    value={customPrompt}
                                    onChange={e => setCustomPrompt(e.target.value)}
                                    placeholder="¿Qué quieres generar? (ej: 3 headlines para COLD con hook de miedo)..."
                                    className="mt-1.5 min-h-[70px] text-xs rounded-lg border-slate-200 resize-none"
                                />
                            </div>

                            {/* Generate Button */}
                            <Button
                                onClick={handleGenerate}
                                disabled={generating}
                                className="w-full h-10 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black uppercase tracking-wider text-xs shadow-md hover:shadow-lg transition-all"
                            >
                                {generating ? (
                                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generando...</>
                                ) : (
                                    <><Sparkles className="h-4 w-4 mr-2" /> Generar con IA Spencer</>
                                )}
                            </Button>

                            {/* Result */}
                            {result && (
                                <div className="relative bg-slate-50 rounded-xl p-3 border border-slate-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
                                            Resultado
                                        </Label>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={handleCopy}
                                            className="h-6 text-[9px]"
                                        >
                                            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                        </Button>
                                    </div>
                                    <div className="text-xs text-slate-700 whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                                        {result}
                                    </div>
                                    {onImport && (
                                        <Button
                                            size="sm"
                                            onClick={() => onImport(result)}
                                            className="mt-2 h-7 text-[9px] font-bold bg-slate-900 text-white rounded-lg"
                                        >
                                            <Save className="h-3 w-3 mr-1" /> Importar al Módulo
                                        </Button>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            )}
        </Card>
    );
}
