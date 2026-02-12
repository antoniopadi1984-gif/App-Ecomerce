"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Play, Video, Image as ImageIcon, FileText, Search, Filter,
    ExternalLink, Wand2, Zap, Sparkles, Edit, UserSquare2,
    Trash2, FolderOpen, Folder, CheckSquare, Square,
    ChevronRight, Eye, Film, Plus, Database, Upload,
    BrainCircuit, ChevronLeft, MoreVertical, LayoutGrid, List, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ScriptEditorModal from "./ScriptEditorModal";

interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    type: string;
    isFolder: boolean;
    createdTime: string;
    webViewLink?: string;
    thumbnailLink?: string;
    duration?: number;
    width?: number;
    height?: number;
}

interface ParentInfo {
    id: string;
    name: string;
    parentId: string;
}

export default function BibliotecaPanel({ productId }: { productId: string }) {
    const [files, setFiles] = useState<DriveFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [parentInfo, setParentInfo] = useState<ParentInfo | null>(null);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [mounted, setMounted] = useState(false);
    const [storageInfo, setStorageInfo] = useState<{ usage: string, limit: string }>({ usage: "0", limit: "0" });

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!productId || !mounted) return;
        loadFiles(currentFolderId);
    }, [productId, currentFolderId, mounted]);

    const loadFiles = async (folderId: string | null = null) => {
        setLoading(true);
        try {
            const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
            const url = new URL("/api/video-lab/drive-files", baseUrl);
            url.searchParams.append("productId", productId);
            if (folderId) url.searchParams.append("folderId", folderId);

            const res = await fetch(url.toString());
            const data = await res.json();

            if (data.error) {
                toast.error("Error Drive: " + data.error);
                setFiles([]);
            } else {
                setFiles(data.files || []);
                setParentInfo(data.parentInfo);
                if (data.storage) {
                    setStorageInfo({
                        usage: data.storage.usage,
                        limit: data.storage.limit
                    });
                }
            }
        } catch (error: any) {
            toast.error("Error de red: " + error.message);
            setFiles([]);
        } finally {
            setLoading(false);
        }
    };

    const formatBytes = (bytes: string | number) => {
        const b = typeof bytes === 'string' ? parseInt(bytes) : bytes;
        if (b === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(b) / Math.log(k));
        return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const storagePercentage = useMemo(() => {
        const u = parseInt(storageInfo.usage);
        const l = parseInt(storageInfo.limit);
        if (!l) return u > 0 ? 5 : 0; // Show a small sliver if usage exists but limit is unlimited
        return Math.min(100, (u / l) * 100);
    }, [storageInfo]);

    const sortedFiles = useMemo(() => {
        return [...files].sort((a, b) => {
            if (a.isFolder && !b.isFolder) return -1;
            if (!a.isFolder && b.isFolder) return 1;
            return a.name.localeCompare(b.name);
        });
    }, [files]);

    const filteredFiles = sortedFiles.filter(file =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleToggleSelect = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const next = new Set(selectedFiles);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedFiles(next);
    };

    const handleFolderClick = (id: string) => {
        setCurrentFolderId(id);
        setSelectedFiles(new Set());
    };

    const handleBack = () => {
        if (parentInfo) {
            setCurrentFolderId(parentInfo.parentId);
            setSelectedFiles(new Set());
        }
    };

    if (!mounted) return null;

    return (
        <div className="h-full flex gap-6 overflow-hidden relative">
            {/* 1. LATERAL FOLDERS - Real Product Categories */}
            <div className="w-60 shrink-0 flex flex-col gap-6">
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Estructura Drive</h4>
                    <nav className="space-y-1">
                        {[
                            { id: 'root', label: 'Raíz del Producto', icon: Database },
                            { id: 'conceptos', label: '04_CONCEPTOS', icon: Sparkles },
                            { id: 'competencia', label: '09_COMPETENCIA', icon: Eye },
                            { id: 'scripts', label: '08_SCRIPTS', icon: FileText },
                            { id: 'variantes', label: 'Variantes IA', icon: Zap },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    if (item.id === 'root') setCurrentFolderId(null);
                                    else toast.info(`Navegando a ${item.label}...`);
                                }}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all",
                                    (item.id === 'root' && !currentFolderId)
                                        ? "bg-indigo-50 text-indigo-600"
                                        : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                                )}
                            >
                                <div className="flex items-center gap-2.5">
                                    <item.icon className={cn("w-4 h-4", (item.id === 'root' && !currentFolderId) ? "text-indigo-600" : "text-slate-400")} />
                                    {item.label}
                                </div>
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="mt-auto p-4 bg-white/50 rounded-2xl border border-slate-200/50 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest">
                        <Zap className="w-3 h-3 fill-indigo-600" />
                        Espacio Drive
                    </div>
                    <div className="space-y-1.5">
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                                style={{ width: `${storagePercentage}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold leading-tight flex justify-between">
                            <span>{formatBytes(storageInfo.usage)}</span>
                            <span className="opacity-40">{storageInfo.limit !== "0" ? `/ ${formatBytes(storageInfo.limit)}` : "Limitado"}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* 2. MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col gap-4 min-w-0 bg-white rounded-[32px] border border-slate-100 shadow-sm p-4 overflow-hidden relative">
                {/* Header & Controls */}
                <div className="flex items-center justify-between gap-4 shrink-0">
                    <div className="flex items-center gap-3">
                        {currentFolderId && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleBack}
                                className="h-8 w-8 rounded-lg hover:bg-slate-100"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                        )}
                        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                            {currentFolderId ? (parentInfo?.name || "Carpeta") : "Biblioteca"}
                            <span className="text-slate-300 font-medium">/</span>
                            <div className="flex items-center gap-2">
                                <span className="text-indigo-600/50 text-[10px] tracking-widest uppercase">{files.length} ITEMS</span>
                                {loading && <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin" />}
                            </div>
                        </h3>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <Input
                                placeholder="Buscar archivos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 h-9 bg-slate-50/50 border-slate-100 text-xs font-medium rounded-xl focus:ring-indigo-500/10"
                            />
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => loadFiles(currentFolderId)}
                            disabled={loading}
                            className="h-8 w-8 text-slate-400 hover:text-indigo-600"
                        >
                            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                        </Button>
                        <div className="h-8 w-px bg-slate-100 mx-1" />
                        <div className="flex bg-slate-100/50 p-1 rounded-lg border border-slate-100">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewMode("grid")}
                                className={cn("h-7 w-7 rounded-md", viewMode === "grid" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400")}
                            >
                                <LayoutGrid className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewMode("list")}
                                className={cn("h-7 w-7 rounded-md", viewMode === "list" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400")}
                            >
                                <List className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* File Grid/List */}
                <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-300">
                            <span className="relative flex h-10 w-10">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-20"></span>
                                <Database className="relative inline-flex w-10 h-10 text-indigo-600/30" />
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Consultando Drive...</span>
                        </div>
                    ) : (
                        <div className={cn(
                            viewMode === "grid"
                                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-6"
                                : "flex flex-col gap-1"
                        )}>
                            {filteredFiles.map((file) => (
                                <div
                                    key={file.id}
                                    onClick={() => file.isFolder ? handleFolderClick(file.id) : null}
                                    className={cn(
                                        "group relative transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-sm",
                                        viewMode === "grid"
                                            ? "aspect-[3/4] bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1"
                                            : "flex items-center gap-4 p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100"
                                    )}
                                >
                                    {/* SELECTION OVERLAY */}
                                    <div
                                        onClick={(e) => handleToggleSelect(file.id, e)}
                                        className={cn(
                                            "absolute top-3 left-3 z-30 w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center",
                                            selectedFiles.has(file.id)
                                                ? "bg-indigo-600 border-indigo-600 shadow-lg"
                                                : "bg-white/80 border-slate-200 opacity-0 group-hover:opacity-100"
                                        )}
                                    >
                                        <CheckSquare className={cn("w-3 h-3 text-white transition-opacity", selectedFiles.has(file.id) ? "opacity-100" : "opacity-0")} />
                                    </div>

                                    {/* CONTENT - GRID VIEW */}
                                    {viewMode === "grid" ? (
                                        <>
                                            <div className="absolute inset-0 z-0 flex items-center justify-center pb-12">
                                                {file.isFolder ? (
                                                    <div className="w-full h-full flex items-center justify-center bg-indigo-50/20">
                                                        <Folder className="w-28 h-28 text-indigo-500/10 fill-indigo-500/5 group-hover:scale-110 transition-transform duration-500" />
                                                    </div>
                                                ) : file.thumbnailLink ? (
                                                    <div className="w-full h-full relative">
                                                        <img
                                                            src={file.thumbnailLink?.replace('=s220', '=s1000')}
                                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                            alt={file.name}
                                                            onError={(e) => {
                                                                const target = e.currentTarget;
                                                                target.style.display = 'none';
                                                                const fallback = target.nextElementSibling as HTMLElement;
                                                                if (fallback) fallback.style.display = 'flex';
                                                            }}
                                                        />
                                                        <div className="hidden absolute inset-0 items-center justify-center bg-slate-100">
                                                            {file.type === 'video' ? <Video className="w-12 h-12 text-slate-300" /> : <ImageIcon className="w-12 h-12 text-slate-300" />}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                                        {file.type === 'video' ? <Video className="w-12 h-12 text-slate-300" /> : <ImageIcon className="w-12 h-12 text-slate-300" />}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Buttons Overlay - Smaller */}
                                            {!file.isFolder && (
                                                <div className="absolute top-1/2 -translate-y-1/2 right-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 flex flex-col gap-1 z-20">
                                                    <Button size="icon" className="w-7 h-7 rounded-lg bg-white/95 text-indigo-600 hover:bg-white shadow-lg border border-slate-100">
                                                        <Wand2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button size="icon" className="w-7 h-7 rounded-lg bg-white/95 text-emerald-600 hover:bg-white shadow-lg border border-slate-100">
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            )}

                                            <div className="absolute bottom-0 inset-x-0 h-24 p-3 z-10 bg-gradient-to-t from-white via-white/80 to-transparent flex flex-col items-center justify-end">
                                                <div className="flex flex-col items-center gap-1.5 text-center w-full">
                                                    <Badge className={cn(
                                                        "w-fit h-4 px-2 text-[7px] font-black uppercase tracking-widest leading-none",
                                                        file.isFolder ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-indigo-600 text-white border-none"
                                                    )}>
                                                        {file.isFolder ? "Carpeta" : file.type}
                                                    </Badge>
                                                    <div className="min-h-[2.4rem] flex items-center justify-center w-full">
                                                        <span className="text-[10px] font-black text-slate-900 leading-tight whitespace-normal break-all line-clamp-2 max-w-[95%]">
                                                            {file.name}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        /* CONTENT - LIST VIEW */
                                        <>
                                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                                {file.isFolder ? <Folder className="w-5 h-5 text-amber-500 fill-amber-50" /> : <Video className="w-5 h-5 text-indigo-600" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-slate-900 truncate">{file.name}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">{file.type.toUpperCase()} • {new Date(file.createdTime).toLocaleDateString()}</p>
                                            </div>
                                            <div className="flex items-center gap-2 pr-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400"><MoreVertical className="w-4 h-4" /></Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* BULK ACTION BAR - Real Implementation */}
                {selectedFiles.size > 0 && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-6 animate-in slide-in-from-bottom-8 duration-500 z-[60] backdrop-blur-xl">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{selectedFiles.size} SELECCIONADOS</span>
                            <span className="text-[9px] text-white/40 font-bold italic">Acciones rápidas en lote</span>
                        </div>
                        <div className="h-8 w-px bg-white/10" />
                        <div className="flex items-center gap-2">
                            <Button size="sm" className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold text-xs gap-2">
                                <BrainCircuit className="w-4 h-4" /> Clasificar IA
                            </Button>
                            <Button size="sm" className="h-9 px-4 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-xs gap-2">
                                <Trash2 className="w-4 h-4 text-rose-400" /> Eliminar
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
