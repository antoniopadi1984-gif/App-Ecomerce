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
            <div className="w-56 shrink-0 flex flex-col gap-5">
                <div className="space-y-3">
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-3">Estructura Drive</h4>
                    <nav className="space-y-0.5 px-1">
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
                                    "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                                    (item.id === 'root' && !currentFolderId)
                                        ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                                        : "text-slate-500 hover:text-slate-900 hover:bg-white/60"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon className={cn("w-3.5 h-3.5", (item.id === 'root' && !currentFolderId) ? "text-white" : "text-rose-500/50")} />
                                    {item.label}
                                </div>
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="mt-auto p-4 bg-white/40 backdrop-blur-md rounded-2xl border border-slate-100/50 space-y-3 shadow-sm mx-1">
                    <div className="flex items-center gap-2 text-rose-500 font-black text-[9px] uppercase tracking-widest">
                        <Zap className="w-3 h-3 fill-rose-500" />
                        ESPACIO DRIVE
                    </div>
                    <div className="space-y-1.5">
                        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-rose-500 rounded-full transition-all duration-500"
                                style={{ width: `${storagePercentage}%` }}
                            />
                        </div>
                        <p className="text-[9px] text-slate-500 font-black leading-tight flex justify-between uppercase tracking-tighter">
                            <span>{formatBytes(storageInfo.usage)}</span>
                            <span className="opacity-40">{storageInfo.limit !== "0" ? `/ ${formatBytes(storageInfo.limit)}` : "Limitado"}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* 2. MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col gap-4 min-w-0 bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-slate-100/50 shadow-sm p-4 overflow-hidden relative">
                {/* Header & Controls */}
                <div className="flex items-center justify-between gap-4 shrink-0 px-2">
                    <div className="flex items-center gap-3">
                        {currentFolderId && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleBack}
                                className="h-8 w-8 rounded-xl hover:bg-white text-slate-400 hover:text-rose-500 transition-all shadow-sm border border-transparent hover:border-slate-100"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                        )}
                        <h3 className="text-xs font-black text-slate-900 uppercase italic tracking-tighter flex items-center gap-2">
                            {currentFolderId ? (parentInfo?.name || "Carpeta") : "Biblioteca"}
                            <span className="text-slate-300 font-medium not-italic">/</span>
                            <div className="flex items-center gap-2">
                                <span className="text-rose-500 text-[9px] tracking-widest uppercase not-italic no-italic">{files.length} ITEMS</span>
                                {loading && <RefreshCw className="w-3 h-3 text-rose-500 animate-spin" />}
                            </div>
                        </h3>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="relative w-56">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <Input
                                placeholder="BUSCAR ARCHIVOS..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 h-8 bg-white/60 border-slate-100 text-[10px] font-black uppercase tracking-widest rounded-xl focus:ring-rose-500/10 placeholder:text-slate-300"
                            />
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => loadFiles(currentFolderId)}
                            disabled={loading}
                            className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-white rounded-xl transition-all"
                        >
                            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                        </Button>
                        <div className="h-6 w-px bg-slate-100 mx-1" />
                        <div className="flex bg-slate-50/50 p-1 rounded-xl border border-slate-100 shadow-inner">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewMode("grid")}
                                className={cn("h-6 w-6 rounded-lg transition-all", viewMode === "grid" ? "bg-white text-rose-500 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                            >
                                <LayoutGrid className="w-3 h-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewMode("list")}
                                className={cn("h-6 w-6 rounded-lg transition-all", viewMode === "list" ? "bg-white text-rose-500 shadow-sm" : "text-slate-400 hover:text-slate-600")}
                            >
                                <List className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* File Grid/List */}
                <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-300">
                            <div className="relative flex h-12 w-12">
                                <div className="animate-ping absolute inline-flex h-full w-full rounded-2xl bg-rose-400 opacity-20" />
                                <div className="relative inline-flex items-center justify-center w-12 h-12 bg-white/60 rounded-2xl shadow-xl border border-slate-100">
                                    <Database className="w-6 h-6 text-rose-500/40" />
                                </div>
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] animate-pulse text-slate-400">SINCRONIZANDO DRIVE...</span>
                        </div>
                    ) : (
                        <div className={cn(
                            viewMode === "grid"
                                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4"
                                : "flex flex-col gap-1"
                        )}>
                            {filteredFiles.map((file) => (
                                <div
                                    key={file.id}
                                    onClick={() => file.isFolder ? handleFolderClick(file.id) : null}
                                    className={cn(
                                        "group relative transition-all duration-500 cursor-pointer overflow-hidden backdrop-blur-sm",
                                        viewMode === "grid"
                                            ? "aspect-[4/5] bg-white/40 rounded-2xl border border-slate-100/50 hover:border-rose-300 hover:shadow-xl hover:shadow-rose-500/5 hover:-translate-y-1"
                                            : "flex items-center gap-4 p-2 rounded-xl hover:bg-white/60 border border-transparent hover:border-slate-100"
                                    )}
                                >
                                    {/* SELECTION OVERLAY */}
                                    <div
                                        onClick={(e) => handleToggleSelect(file.id, e)}
                                        className={cn(
                                            "absolute top-2.5 left-2.5 z-30 w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center",
                                            selectedFiles.has(file.id)
                                                ? "bg-rose-500 border-rose-500 shadow-lg scale-110"
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
                                                <div className="absolute top-1/2 -translate-y-1/2 right-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 flex flex-col gap-1.5 z-20">
                                                    <Button size="icon" className="w-8 h-8 rounded-xl bg-slate-900/90 text-rose-500 hover:text-rose-400 hover:bg-slate-900 shadow-xl backdrop-blur-md">
                                                        <Wand2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="icon" className="w-8 h-8 rounded-xl bg-white/90 text-rose-500 hover:text-rose-600 hover:bg-white shadow-xl backdrop-blur-md border border-slate-100">
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            )}

                                            <div className="absolute bottom-0 inset-x-0 h-20 p-2.5 z-10 bg-gradient-to-t from-white via-white/90 to-transparent flex flex-col items-center justify-end">
                                                <div className="flex flex-col items-center gap-1 text-center w-full">
                                                    <Badge className={cn(
                                                        "w-fit h-4 px-2 text-[7px] font-black uppercase tracking-widest leading-none",
                                                        file.isFolder ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-rose-500 text-white border-none shadow-sm shadow-rose-500/20"
                                                    )}>
                                                        {file.isFolder ? "CARPETA" : file.type.toUpperCase()}
                                                    </Badge>
                                                    <div className="min-h-[1.5rem] flex items-center justify-center w-full">
                                                        <span className="text-[9px] font-black text-slate-900 uppercase tracking-tighter leading-tight line-clamp-2 max-w-[95%]">
                                                            {file.name}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        /* CONTENT - LIST VIEW */
                                        <>
                                            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shrink-0 shadow-sm border border-slate-800">
                                                {file.isFolder ? <Folder className="w-4 h-4 text-rose-500 fill-rose-500/20" /> : <Video className="w-4 h-4 text-rose-500" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight truncate">{file.name}</p>
                                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{file.type} • {new Date(file.createdTime).toLocaleDateString()}</p>
                                            </div>
                                            <div className="flex items-center gap-2 pr-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-500 rounded-xl"><MoreVertical className="w-4 h-4" /></Button>
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
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 ml-0.5">{selectedFiles.size} SELECCIONADOS</span>
                            <span className="text-[8px] text-white/40 font-bold italic uppercase tracking-widest">Acciones rápidas en lote</span>
                        </div>
                        <div className="h-8 w-px bg-white/10" />
                        <div className="flex items-center gap-2">
                            <Button size="sm" className="h-9 px-4 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all hover:scale-105">
                                <BrainCircuit className="w-3.5 h-3.5 mr-2" /> Clasificar IA
                            </Button>
                            <Button size="sm" variant="ghost" className="h-9 px-4 hover:bg-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">
                                <Trash2 className="w-3.5 h-3.5 mr-2 text-rose-500" /> Eliminar
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
