"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Plus, Trash2, Power, PowerOff, AlertTriangle, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useStore } from "@/lib/store/store-context"
import { getAlertRules, createAlertRule, deleteAlertRule, toggleAlertRule } from "./actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { PageShell } from "@/components/ui/PageShell"
import { ModuleHeader } from "@/components/ui/ModuleHeader"
import { Badge } from "@/components/ui/badge"

const SCOPES = [
    { value: "ORDERS", label: "Pedidos" },
    { value: "PRODUCTS", label: "Productos" },
    { value: "FINANCES", label: "Finanzas" },
    { value: "MARKETING", label: "Marketing" },
]

const OPERATORS = [
    { value: "GT", label: ">" },
    { value: "GTE", label: ">=" },
    { value: "LT", label: "<" },
    { value: "LTE", label: "<=" },
    { value: "EQ", label: "=" },
]

function AlertsSettingsContent() {
    const searchParams = useSearchParams()
    const { activeStoreId: storeId } = useStore()
    const [rules, setRules] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)

    // Form state
    const [newRule, setNewRule] = React.useState({
        scope: "MARKETING",
        field: "cpa",
        operator: "GT",
        threshold: 0,
        label: "CPA Alto"
    })

    const loadRules = React.useCallback(async () => {
        if (!storeId) return
        setLoading(true)
        try {
            const data = await getAlertRules(storeId)
            setRules(data)
        } catch (error) {
            toast.error("Error al cargar reglas")
        } finally {
            setLoading(false)
        }
    }, [storeId])

    React.useEffect(() => {
        loadRules()
    }, [loadRules])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!storeId) return

        try {
            await createAlertRule({ ...newRule, storeId })
            toast.success("Regla creada")
            loadRules()
        } catch (error) {
            toast.error("Error al crear regla")
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await deleteAlertRule(id)
            toast.success("Regla eliminada")
            loadRules()
        } catch (error) {
            toast.error("Error al eliminar regla")
        }
    }

    const handleToggle = async (id: string, enabled: boolean) => {
        try {
            await toggleAlertRule(id, !enabled)
            toast.success(enabled ? "Regla desactivada" : "Regla activada")
            loadRules()
        } catch (error) {
            toast.error("Error al actualizar regla")
        }
    }

    if (!storeId) {
        return (
            <PageShell>
                <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 space-y-4">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <AlertTriangle className="size-6 text-slate-300" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[11px] font-black uppercase tracking-tight">Tienda no seleccionada</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Selecciona una tienda para gestionar alertas.</p>
                    </div>
                </div>
            </PageShell>
        )
    }

    return (
        <PageShell>
            <ModuleHeader
                title="Configuración de Alertas"
                subtitle="MONITOR DE UMBRALES CRÍTICOS"
                icon={Bell}
                badges={
                    <Badge variant="outline" className="bg-slate-50 text-slate-500 border-none font-black text-[7px] uppercase tracking-widest px-2 h-5 rounded-sm">V1.0</Badge>
                }
            />

            <main className="p-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="md:col-span-1 h-fit border-slate-100 shadow-sm rounded-xl">
                        <CardHeader className="p-4 border-b border-slate-50">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest">Nueva Regla</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Módulo</label>
                                    <Select value={newRule.scope} onValueChange={(v) => setNewRule({ ...newRule, scope: v })}>
                                        <SelectTrigger className="h-9 text-[11px] font-bold uppercase rounded-lg">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SCOPES.map(s => <SelectItem key={s.value} value={s.value} className="text-[11px] font-bold uppercase">{s.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Variable</label>
                                    <Input
                                        placeholder="ej: cpa, roas"
                                        value={newRule.field}
                                        onChange={(e) => setNewRule({ ...newRule, field: e.target.value.toLowerCase() })}
                                        className="h-9 text-[11px] font-bold uppercase rounded-lg"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Op</label>
                                        <Select value={newRule.operator} onValueChange={(v) => setNewRule({ ...newRule, operator: v })}>
                                            <SelectTrigger className="h-9 text-[11px] font-bold uppercase rounded-lg">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {OPERATORS.map(o => <SelectItem key={o.value} value={o.value} className="text-[11px] font-bold uppercase">{o.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Valor</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={newRule.threshold}
                                            onChange={(e) => setNewRule({ ...newRule, threshold: parseFloat(e.target.value) })}
                                            className="h-9 text-[11px] font-bold rounded-lg"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Etiqueta</label>
                                    <Input
                                        placeholder="ej: CPA Crítico"
                                        value={newRule.label}
                                        onChange={(e) => setNewRule({ ...newRule, label: e.target.value })}
                                        className="h-9 text-[11px] font-bold uppercase rounded-lg"
                                    />
                                </div>

                                <Button type="submit" className="w-full h-10 text-[10px] font-black uppercase tracking-widest bg-slate-900 rounded-lg">
                                    <Plus className="size-3.5 mr-2" /> CREAR
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-2 border-slate-100 shadow-sm rounded-xl">
                        <CardHeader className="p-4 border-b border-slate-50">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest">Reglas Activas</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            {loading ? (
                                <div className="py-8 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest animate-pulse italic">Sincronizando...</div>
                            ) : rules.length === 0 ? (
                                <div className="py-12 text-center text-slate-300 flex flex-col items-center gap-3 border border-dashed border-slate-100 rounded-2xl">
                                    <AlertTriangle className="size-6 opacity-30" />
                                    <span className="text-[9px] font-black uppercase tracking-widest italic opacity-60">Sin alertas activas</span>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {rules.map((rule) => (
                                        <div key={rule.id} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100 group transition-all hover:bg-white hover:shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black uppercase tracking-tight text-slate-400">{rule.scope}</span>
                                                    <span className="text-[11px] font-black uppercase tracking-tighter italic">{rule.label}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-bold text-slate-500">
                                                    {rule.field} {rule.operator === 'GT' ? '>' : rule.operator === 'GTE' ? '>=' : rule.operator === 'LT' ? '<' : rule.operator === 'LTE' ? '<=' : '='} {rule.threshold}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleToggle(rule.id, rule.enabled)}
                                                    className={cn("h-8 w-8", rule.enabled ? "text-slate-900" : "text-slate-300")}
                                                >
                                                    {rule.enabled ? <Power className="size-3.5" /> : <PowerOff className="size-3.5" />}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-300 hover:text-rose-600"
                                                    onClick={() => handleDelete(rule.id)}
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </PageShell>
    )
}

export default function AlertsSettingsPage() {
    return (
        <React.Suspense fallback={<div className="p-6 text-center animate-pulse text-[10px] font-bold uppercase tracking-widest italic text-slate-400">Cargando...</div>}>
            <AlertsSettingsContent />
        </React.Suspense>
    )
}
