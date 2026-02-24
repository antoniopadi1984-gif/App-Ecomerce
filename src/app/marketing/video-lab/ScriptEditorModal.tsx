"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Mic, Wand2 } from "lucide-react";

interface ScriptEditorModalProps {
    videoName: string;
    videoUrl: string;
    initialScript?: string;
    onClose: () => void;
    onSaved: (newVideoUrl: string) => void;
}

export default function ScriptEditorModal({
    videoName,
    videoUrl,
    initialScript,
    onClose,
    onSaved
}: ScriptEditorModalProps) {
    const [script, setScript] = useState(initialScript || "");
    const [loading, setLoading] = useState(false);
    const [extracting, setExtracting] = useState(false);
    const [generating, setGenerating] = useState(false);

    const extractScript = async () => {
        setExtracting(true);
        try {
            const res = await fetch("/api/video-lab/extract-script", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ videoUrl })
            });

            const data = await res.json();
            if (data.success) {
                setScript(data.script);
                toast.success("Script extraído correctamente");
            } else {
                toast.error(data.error || "Error extrayendo script");
            }
        } catch (error: any) {
            toast.error("Error: " + error.message);
        } finally {
            setExtracting(false);
        }
    };

    const generateNewAudio = async () => {
        if (!script.trim()) {
            toast.error("Escribe un script primero");
            return;
        }

        setGenerating(true);
        try {
            const res = await fetch("/api/video-lab/replace-audio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    videoUrl,
                    newScript: script
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success("Audio generado y reemplazado");
                // TODO: Upload to Drive and get new URL
                // For now, just notify success
                onSaved(videoUrl);
            } else {
                toast.error(data.error || "Error generando audio");
            }
        } catch (error: any) {
            toast.error("Error: " + error.message);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-gray-900 rounded-lg max-w-3xl w-full max-h-[80vh] overflow-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-white">Editor de Script</h2>
                            <p className="text-sm text-white/60">{videoName}</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="text-white/60 hover:text-white"
                        >
                            ✕
                        </Button>
                    </div>

                    {/* Extract Script Button */}
                    {!initialScript && (
                        <Button
                            onClick={extractScript}
                            disabled={extracting}
                            className="w-full"
                            variant="outline"
                        >
                            {extracting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Extrayendo script con Replicate Whisper...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-4 h-4 mr-2" />
                                    Extraer Script del Video
                                </>
                            )}
                        </Button>
                    )}

                    {/* Script Editor */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white">
                            Script / Transcript
                        </label>
                        <Textarea
                            value={script}
                            onChange={(e) => setScript(e.target.value)}
                            placeholder="El script aparecerá aquí... o escribe uno nuevo"
                            className="min-h-[200px] bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-500"
                        />
                        <p className="text-xs text-white/40">
                            {script.length} caracteres
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button
                            onClick={generateNewAudio}
                            disabled={generating || !script.trim()}
                            className="flex-1"
                        >
                            {generating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Generando con ElevenLabs...
                                </>
                            ) : (
                                <>
                                    <Mic className="w-4 h-4 mr-2" />
                                    Generar Audio y Aplicar
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={onClose}
                        >
                            Cancelar
                        </Button>
                    </div>

                    {/* Info */}
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3">
                        <p className="text-xs text-indigo-300">
                            💡 <strong>Cómo funciona:</strong> Edita el script, luego genera el nuevo audio con ElevenLabs.
                            El sistema reemplazará la pista de audio del video automáticamente con FFmpeg.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
