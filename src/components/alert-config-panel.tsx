"use client";

import { useState, useEffect } from "react";
import { Bell, Save, X, AlertTriangle, TrendingUp, Truck, DollarSign, Target, Percent, TrendingDown, MousePointer2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface AlertThresholds {
    // ROAS Alerts
    roasMinCritical: number;
    roasMinWarning: number;
    roasTarget: number;

    // CPA Alerts
    cpaMaxCritical: number;
    cpaMaxWarning: number;
    cpaTarget: number;

    // Delivery Rate Alerts
    deliveryMinCritical: number;
    deliveryMinWarning: number;
    deliveryTarget: number;

    // Profit Margin Alerts
    marginMinCritical: number;
    marginMinWarning: number;
    marginTarget: number;

    // Investment Alerts (Max Daily Spend)
    spendMaxCritical: number;
    spendMaxWarning: number;
    spendTarget: number;

    // CTR Alerts (Click Through Rate)
    ctrMinCritical: number;
    ctrMinWarning: number;
    ctrTarget: number;

    // CPC Alerts (Cost Per Click)
    cpcMaxCritical: number;
    cpcMaxWarning: number;
    cpcTarget: number;

    // Notifications
    emailAlerts: boolean;
    pushAlerts: boolean;
    dailyDigest: boolean;
}

const defaultThresholds: AlertThresholds = {
    roasMinCritical: 1.5,
    roasMinWarning: 2.0,
    roasTarget: 3.0,

    cpaMaxCritical: 25,
    cpaMaxWarning: 18,
    cpaTarget: 12,

    deliveryMinCritical: 65,
    deliveryMinWarning: 75,
    deliveryTarget: 85,

    marginMinCritical: 5,
    marginMinWarning: 15,
    marginTarget: 25,

    spendMaxCritical: 500,
    spendMaxWarning: 400,
    spendTarget: 300,

    ctrMinCritical: 0.5,
    ctrMinWarning: 1.0,
    ctrTarget: 2.0,

    cpcMaxCritical: 2.0,
    cpcMaxWarning: 1.5,
    cpcTarget: 0.8,

    emailAlerts: true,
    pushAlerts: false,
    dailyDigest: true,
};

interface AlertConfigPanelProps {
    storeId: string;
    isOpen: boolean;
    onClose: () => void;
    onSave?: (thresholds: AlertThresholds) => void;
}

export function AlertConfigPanel({ storeId, isOpen, onClose, onSave }: AlertConfigPanelProps) {
    const [thresholds, setThresholds] = useState<AlertThresholds>(defaultThresholds);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadThresholds();
        }
    }, [isOpen, storeId]);

    const loadThresholds = async () => {
        try {
            const res = await fetch(`/api/settings/alert-thresholds?storeId=${storeId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.thresholds) {
                    setThresholds({ ...defaultThresholds, ...data.thresholds });
                }
            }
        } catch (error) {
            console.error("Error loading thresholds:", error);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/settings/alert-thresholds", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ storeId, thresholds })
            });

            if (res.ok) {
                toast.success("Alertas configuradas correctamente");
                onSave?.(thresholds);
                onClose();
            } else {
                toast.error("Error al guardar configuración");
            }
        } catch (error) {
            toast.error("Error de conexión");
        } finally {
            setSaving(false);
        }
    };

    const updateThreshold = (key: keyof AlertThresholds, value: number | boolean) => {
        setThresholds(prev => ({ ...prev, [key]: value }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl bg-white shadow-sm rounded-2xl max-h-[90vh] overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 px-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                                <Bell className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold">Configuración de Alertas</CardTitle>
                                <p className="text-white/80 text-sm">Sistema de semáforos inteligente</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="text-white hover:bg-white/20 rounded-full"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
                    {/* ROAS Thresholds */}
                    <ThresholdSection
                        icon={TrendingUp}
                        title="ROAS (Return on Ad Spend)"
                        description="Alertas basadas en el retorno publicitario"
                        color="rose"
                    >
                        <ThresholdRow
                            label="🔴 Crítico (menor que)"
                            value={thresholds.roasMinCritical}
                            onChange={(v: number) => updateThreshold("roasMinCritical", v)}
                            suffix="x"
                        />
                        <ThresholdRow
                            label="🟡 Advertencia (menor que)"
                            value={thresholds.roasMinWarning}
                            onChange={(v: number) => updateThreshold("roasMinWarning", v)}
                            suffix="x"
                        />
                        <ThresholdRow
                            label="🟢 Objetivo"
                            value={thresholds.roasTarget}
                            onChange={(v: number) => updateThreshold("roasTarget", v)}
                            suffix="x"
                        />
                    </ThresholdSection>

                    {/* CPA Thresholds */}
                    <ThresholdSection
                        icon={Target}
                        title="CPA (Coste por Adquisición)"
                        description="Alertas basadas en el coste por pedido"
                        color="rose"
                    >
                        <ThresholdRow
                            label="🔴 Crítico (mayor que)"
                            value={thresholds.cpaMaxCritical}
                            onChange={(v: number) => updateThreshold("cpaMaxCritical", v)}
                            suffix="€"
                        />
                        <ThresholdRow
                            label="🟡 Advertencia (mayor que)"
                            value={thresholds.cpaMaxWarning}
                            onChange={(v: number) => updateThreshold("cpaMaxWarning", v)}
                            suffix="€"
                        />
                        <ThresholdRow
                            label="🟢 Objetivo"
                            value={thresholds.cpaTarget}
                            onChange={(v: number) => updateThreshold("cpaTarget", v)}
                            suffix="€"
                        />
                    </ThresholdSection>

                    {/* Delivery Rate Thresholds */}
                    <ThresholdSection
                        icon={Truck}
                        title="Tasa de Entrega"
                        description="Alertas basadas en entregas exitosas"
                        color="emerald"
                    >
                        <ThresholdRow
                            label="🔴 Crítico (menor que)"
                            value={thresholds.deliveryMinCritical}
                            onChange={(v: number) => updateThreshold("deliveryMinCritical", v)}
                            suffix="%"
                        />
                        <ThresholdRow
                            label="🟡 Advertencia (menor que)"
                            value={thresholds.deliveryMinWarning}
                            onChange={(v: number) => updateThreshold("deliveryMinWarning", v)}
                            suffix="%"
                        />
                        <ThresholdRow
                            label="🟢 Objetivo"
                            value={thresholds.deliveryTarget}
                            onChange={(v: number) => updateThreshold("deliveryTarget", v)}
                            suffix="%"
                        />
                    </ThresholdSection>

                    {/* Margin Thresholds */}
                    <ThresholdSection
                        icon={Percent}
                        title="Margen de Beneficio"
                        description="Alertas basadas en la rentabilidad"
                        color="amber"
                    >
                        <ThresholdRow
                            label="🔴 Crítico (menor que)"
                            value={thresholds.marginMinCritical}
                            onChange={(v: number) => updateThreshold("marginMinCritical", v)}
                            suffix="%"
                        />
                        <ThresholdRow
                            label="🟡 Advertencia (menor que)"
                            value={thresholds.marginMinWarning}
                            onChange={(v: number) => updateThreshold("marginMinWarning", v)}
                            suffix="%"
                        />
                        <ThresholdRow
                            label="🟢 Objetivo"
                            value={thresholds.marginTarget}
                            onChange={(v: number) => updateThreshold("marginTarget", v)}
                            suffix="%"
                        />
                    </ThresholdSection>

                    {/* Spend Thresholds */}
                    <ThresholdSection
                        icon={DollarSign}
                        title="Inversión Diaria"
                        description="Alertas por exceso de gasto"
                        color="rose"
                    >
                        <ThresholdRow
                            label="🔴 Crítico (mayor que)"
                            value={thresholds.spendMaxCritical}
                            onChange={(v: number) => updateThreshold("spendMaxCritical", v)}
                            suffix="€"
                        />
                        <ThresholdRow
                            label="🟡 Advertencia (mayor que)"
                            value={thresholds.spendMaxWarning}
                            onChange={(v: number) => updateThreshold("spendMaxWarning", v)}
                            suffix="€"
                        />
                        <ThresholdRow
                            label="🟢 Límite Ideal"
                            value={thresholds.spendTarget}
                            onChange={(v: number) => updateThreshold("spendTarget", v)}
                            suffix="€"
                        />
                    </ThresholdSection>

                    {/* CTR Thresholds */}
                    <ThresholdSection
                        icon={MousePointer2}
                        title="CTR (Click Through Rate)"
                        description="Calidad de los creativos"
                        color="emerald"
                    >
                        <ThresholdRow
                            label="🔴 Crítico (menor que)"
                            value={thresholds.ctrMinCritical}
                            onChange={(v: number) => updateThreshold("ctrMinCritical", v)}
                            suffix="%"
                        />
                        <ThresholdRow
                            label="🟡 Advertencia (menor que)"
                            value={thresholds.ctrMinWarning}
                            onChange={(v: number) => updateThreshold("ctrMinWarning", v)}
                            suffix="%"
                        />
                        <ThresholdRow
                            label="🟢 Objetivo"
                            value={thresholds.ctrTarget}
                            onChange={(v: number) => updateThreshold("ctrTarget", v)}
                            suffix="%"
                        />
                    </ThresholdSection>

                    {/* CPC Thresholds */}
                    <ThresholdSection
                        icon={TrendingDown}
                        title="CPC (Coste por Clic)"
                        description="Costes de tráfico"
                        color="rose"
                    >
                        <ThresholdRow
                            label="🔴 Crítico (mayor que)"
                            value={thresholds.cpcMaxCritical}
                            onChange={(v: number) => updateThreshold("cpcMaxCritical", v)}
                            suffix="€"
                        />
                        <ThresholdRow
                            label="🟡 Advertencia (mayor que)"
                            value={thresholds.cpcMaxWarning}
                            onChange={(v: number) => updateThreshold("cpcMaxWarning", v)}
                            suffix="€"
                        />
                        <ThresholdRow
                            label="🟢 Objetivo"
                            value={thresholds.cpcTarget}
                            onChange={(v: number) => updateThreshold("cpcTarget", v)}
                            suffix="€"
                        />
                    </ThresholdSection>


                    {/* Notification Settings */}
                    <div className="border-t pt-4">
                        <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            Notificaciones
                        </h4>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm text-slate-600">Alertas por Email</Label>
                                <Switch
                                    checked={thresholds.emailAlerts}
                                    onCheckedChange={(v) => updateThreshold("emailAlerts", v)}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label className="text-sm text-slate-600">Notificaciones Push</Label>
                                <Switch
                                    checked={thresholds.pushAlerts}
                                    onCheckedChange={(v) => updateThreshold("pushAlerts", v)}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label className="text-sm text-slate-600">Resumen Diario</Label>
                                <Switch
                                    checked={thresholds.dailyDigest}
                                    onCheckedChange={(v) => updateThreshold("dailyDigest", v)}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>

                <div className="p-4 border-t bg-slate-50 flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? "Guardando..." : "Guardar Configuración"}
                    </Button>
                </div>
            </Card>
        </div>
    );
}

function ThresholdSection({ icon: Icon, title, description, color, children }: any) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center",
                    color === "rose" && "bg-rose-100 text-rose-600",
                    color === "rose" && "bg-rose-100 text-rose-600",
                    color === "emerald" && "bg-emerald-100 text-emerald-600",
                    color === "amber" && "bg-amber-100 text-amber-600"
                )}>
                    <Icon className="h-4 w-4" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-slate-800">{title}</h4>
                    <p className="text-xs text-slate-500">{description}</p>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-3 pl-10">
                {children}
            </div>
        </div>
    );
}

function ThresholdRow({ label, value, onChange, suffix }: any) {
    return (
        <div className="space-y-1">
            <Label className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</Label>
            <div className="relative">
                <Input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                    className="h-8 text-sm pr-8 text-right font-bold"
                    step={suffix === "x" ? 0.1 : 1}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    {suffix}
                </span>
            </div>
        </div>
    );
}

// Helper function to get alert level based on value and thresholds
export function getAlertLevel(
    metricType: "roas" | "cpa" | "delivery" | "margin" | "spend" | "ctr" | "cpc",
    value: number,
    thresholds: AlertThresholds
): "critical" | "warning" | "optimal" | "neutral" {
    switch (metricType) {
        case "roas":
            if (value < thresholds.roasMinCritical) return "critical";
            if (value < thresholds.roasMinWarning) return "warning";
            if (value >= thresholds.roasTarget) return "optimal";
            return "neutral";
        case "cpa":
            if (value > thresholds.cpaMaxCritical) return "critical";
            if (value > thresholds.cpaMaxWarning) return "warning";
            if (value <= thresholds.cpaTarget) return "optimal";
            return "neutral";
        case "delivery":
            if (value < thresholds.deliveryMinCritical) return "critical";
            if (value < thresholds.deliveryMinWarning) return "warning";
            if (value >= thresholds.deliveryTarget) return "optimal";
            return "neutral";
        case "margin":
            if (value < thresholds.marginMinCritical) return "critical";
            if (value < thresholds.marginMinWarning) return "warning";
            if (value >= thresholds.marginTarget) return "optimal";
            return "neutral";
        case "spend":
            if (value > thresholds.spendMaxCritical) return "critical";
            if (value > thresholds.spendMaxWarning) return "warning";
            if (value <= thresholds.spendTarget) return "optimal";
            return "neutral";
        case "ctr":
            if (value < thresholds.ctrMinCritical) return "critical";
            if (value < thresholds.ctrMinWarning) return "warning";
            if (value >= thresholds.ctrTarget) return "optimal";
            return "neutral";
        case "cpc":
            if (value > thresholds.cpcMaxCritical) return "critical";
            if (value > thresholds.cpcMaxWarning) return "warning";
            if (value <= thresholds.cpcTarget) return "optimal";
            return "neutral";
        default:
            return "neutral";
    }
}

export function AlertBadge({ level }: { level: ReturnType<typeof getAlertLevel> }) {
    const config = {
        critical: { bg: "bg-rose-100", text: "text-rose-700", label: "CRÍTICO" },
        warning: { bg: "bg-amber-100", text: "text-amber-700", label: "ATENCIÓN" },
        optimal: { bg: "bg-emerald-100", text: "text-emerald-700", label: "ÓPTIMO" },
        neutral: { bg: "bg-slate-100", text: "text-slate-600", label: "NORMAL" }
    };

    const c = config[level];
    return (
        <Badge className={cn(c.bg, c.text, "border-none text-[9px] font-bold uppercase tracking-wide px-2")}>
            {c.label}
        </Badge>
    );
}
