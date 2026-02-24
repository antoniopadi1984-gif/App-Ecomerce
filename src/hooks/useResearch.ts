"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
    startResearchV3Action,
    getLatestRunStatus,
    updateProduct,
    syncGoogleDrive,
    clearResearchHistory,
    addAmazonLink,
    addCompetitorLink,
    deleteCompetitorLink,
    generateMasterDoc,
    regenerateAvatarsAction,
    generateAngleVariationsAction,
    generateCopyVariationsAction,
    checkSystemHealthAction,
    generateAnglesAction,
    generateGodTierCopyAction,
    syncKnowledgeGraphAction,
    calculateMaturityScoreAction
} from "@/app/research/actions/research-actions";
import { getLanguageDictionary } from "@/app/research/actions/language-actions";

export function useResearch(productId: string) {
    const [loading, setLoading] = useState(false);
    const [researchData, setResearchData] = useState<any>(null);
    const [progress, setProgress] = useState({ phase: 0, percent: 0, message: "" });
    const [logs, setLogs] = useState<string[]>([]);
    const [isSystemHealthOk, setIsSystemHealthOk] = useState(true);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    const loadDataRef = useRef<(() => Promise<void>) | undefined>(undefined);

    const startPolling = useCallback(() => {
        if (pollingRef.current) clearInterval(pollingRef.current);

        pollingRef.current = setInterval(async () => {
            if (!productId) return;
            const status = await getLatestRunStatus(productId);
            if (status) {
                // Update logs
                if (status.logs) {
                    const logsArray = status.logs.split('\n').filter(Boolean);
                    setLogs(logsArray);
                }

                if (status.status === 'RUNNING') {
                    const results = typeof status.results === 'string' ? JSON.parse(status.results) : status.results;
                    setProgress({
                        phase: status.currentPhase || (results?.currentPhase) || 0,
                        percent: status.progress || (results?.completionPercentage) || 0,
                        message: results?.statusMessage || "Procesando el escaneo forense..."
                    });
                } else if (status.status === 'READY') {
                    clearInterval(pollingRef.current!);
                    pollingRef.current = null;
                    setProgress({ phase: 0, percent: 100, message: "Operación Finalizada con Éxito" });
                    loadDataRef.current?.();
                    toast.success("Investigación finalizada");
                } else if (status.status === 'FAILED') {
                    clearInterval(pollingRef.current!);
                    pollingRef.current = null;
                    setLoading(false);
                    toast.error("La investigación ha fallado");
                }
            }
        }, 3000);
    }, [productId]);

    const loadData = useCallback(async () => {
        if (!productId) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/products/${productId}/research`);
            const result = await response.json();

            if (!result.success) throw new Error(result.error);

            const data = result.data;
            const dict = await getLanguageDictionary(productId);
            setResearchData({ ...data, dictionary: dict });

            // Re-check health
            const health = await checkSystemHealthAction();
            setIsSystemHealthOk((health as any).engine_reachable ?? false);

            // Check if there is an active run
            const status = await getLatestRunStatus(productId);
            if (status && status.status === 'RUNNING') {
                startPolling();
            }
        } catch (error: any) {
            console.error("Error loading research data:", error);
            toast.error("Error al cargar datos de investigación");
        } finally {
            setLoading(false);
        }
    }, [productId, startPolling]);

    useEffect(() => {
        loadDataRef.current = loadData;
    }, [loadData]);

    const startResearch = async () => {
        setLoading(true);
        setProgress({ phase: 1, percent: 5, message: "Iniciando motores..." });
        try {
            await startResearchV3Action(productId);
            startPolling();
        } catch (error: any) {
            toast.error(error.message);
            setLoading(false);
        }
    };

    const syncDrive = async () => {
        setLoading(true);
        try {
            await syncGoogleDrive(productId);
            toast.success("Google Drive sincronizado");
            loadData();
        } catch (error: any) {
            toast.error("Error al sincronizar Drive");
        } finally {
            setLoading(false);
        }
    };

    const addAmazon = async (url: string) => {
        try {
            await addAmazonLink(productId, url);
            toast.success("Link de Amazon añadido");
            loadData();
        } catch (error: any) {
            toast.error("Error al añadir link");
        }
    };

    const addCompetitor = async (url: string) => {
        try {
            await addCompetitorLink(productId, { url, type: "COMPETITOR" });
            toast.success("Competidor añadido");
            loadData();
        } catch (error: any) {
            toast.error("Error al añadir competidor");
        }
    };

    const deleteCompetitor = async (id: string) => {
        try {
            await deleteCompetitorLink(id);
            toast.success("Eliminado");
            loadData();
        } catch (error: any) {
            toast.error("Error al eliminar");
        }
    };

    const exportMasterDoc = async () => {
        toast.info("Generando Master Doc...");
        try {
            const result = await generateMasterDoc(productId);
            if (result.success) {
                toast.success(result.message);
                // In a real scenario, we would provide a download link
            } else {
                toast.error(result.error);
            }
        } catch (error: any) {
            toast.error("Error al generar documento");
        }
    };

    const clearHistory = async () => {
        if (!confirm("¿Seguro que quieres borrar todo el progreso?")) return;
        try {
            await clearResearchHistory(productId);
            toast.success("Historial borrado");
            loadData();
        } catch (error: any) {
            toast.error("Error al borrar");
        }
    };

    const generateAngles = async (avatarId: string) => {
        const versionId = researchData?.researchProjects?.[0]?.versions?.[0]?.id;
        if (!versionId) {
            toast.error("No hay versión de investigación activa.");
            return;
        }
        setLoading(true);
        try {
            const result = await generateAnglesAction(productId, versionId, avatarId);
            if (result.success) {
                toast.success("Ángulos generados");
                loadData();
            }
        } catch (error: any) {
            toast.error("Error al generar ángulos");
        } finally {
            setLoading(false);
        }
    };

    const generateGodTierCopy = async (avatarIdx: number, angleIdx: number) => {
        setLoading(true);
        try {
            const result = await generateGodTierCopyAction({ productId, avatarIndex: avatarIdx, angleIndex: angleIdx });
            if (result.success) {
                toast.success("Copy God Tier generado");
                loadData();
            }
        } catch (error: any) {
            toast.error("Error al generar copy");
        } finally {
            setLoading(false);
        }
    };

    const syncBrain = async () => {
        setLoading(true);
        try {
            await syncKnowledgeGraphAction(productId);
            await calculateMaturityScoreAction(productId);
            toast.success("Cerebro sincronizado correctamente");
            loadData();
        } catch (error: any) {
            toast.error("Error al sincronizar cerebro");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [loadData]);

    return {
        researchData,
        loading,
        progress,
        logs,
        isSystemHealthOk,
        startResearch,
        syncDrive,
        addAmazon,
        addCompetitor,
        deleteCompetitor,
        exportMasterDoc,
        clearHistory,
        loadData,
        generateAngles,
        generateGodTierCopy,
        syncBrain,
        regenerateAvatars: (params: any) => regenerateAvatarsAction(productId, params),
        generateAngleVariations: (params: any) => generateAngleVariationsAction({ ...params, productId }),
        generateCopyVariations: (params: any) => generateCopyVariationsAction({ ...params, productId })
    };
}
