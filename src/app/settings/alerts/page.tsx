"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Plus, Trash2, Power, PowerOff, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useStore } from "@/lib/store/store-context"
import { getAlertRules, createAlertRule, deleteAlertRule, toggleAlertRule } from "./actions"
import { toast } from "sonner"

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

export default function AlertsSettingsPage() {
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
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 space-y-4">
                <div className="p-4 bg-slate-100 rounded-full">
                    <AlertTriangle className="size-8 text-slate-400" />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-black uppercase tracking-tight">Tienda no seleccionada</p>
                    <p className="text-xs text-muted-text">Selecciona una tienda en la barra superior para gestionar sus alertas.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black tracking-tight uppercase italic">Configuración de Alertas</h1>
                    <p className="text-muted-text text-sm">Define umbrales críticos para monitorizar tus métricas sin colores.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle className="text-sm font-black uppercase">Nueva Regla</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-text">Módulo</label>
                                <Select value={newRule.scope} onValueChange={(v) => setNewRule({ ...newRule, scope: v })}>
                                    <SelectTrigger className="h-8 text-xs font-bold uppercase">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SCOPES.map(s => <SelectItem key={s.value} value={s.value} className="text-xs font-bold uppercase">{s.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-text">Campo (Variable)</label>
                                <Input
                                    placeholder="ej: cpa, roas, revenue"
                                    value={newRule.field}
                                    onChange={(e) => setNewRule({ ...newRule, field: e.target.value.toLowerCase() })}
                                    className="h-8 text-xs font-bold uppercase"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-text">Operador</label>
                                    <Select value={newRule.operator} onValueChange={(v) => setNewRule({ ...newRule, operator: v })}>
                                        <SelectTrigger className="h-8 text-xs font-bold uppercase">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {OPERATORS.map(o => <SelectItem key={o.value} value={o.value} className="text-xs font-bold uppercase">{o.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-text">Umbral</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={newRule.threshold}
                                        onChange={(e) => setNewRule({ ...newRule, threshold: parseFloat(e.target.value) })}
                                        className="h-8 text-xs font-bold"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-text">Etiqueta Visual</label>
                                <Input
                                    placeholder="ej: CPA Crítico"
                                    value={newRule.label}
                                    onChange={(e) => setNewRule({ ...newRule, label: e.target.value })}
                                    className="h-8 text-xs font-bold uppercase"
                                />
                            </div>

                            <Button type="submit" className="w-full h-8 text-[10px] font-black uppercase tracking-widest" variant="default">
                                <Plus className="size-3 mr-2" /> Crear Regla
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-sm font-black uppercase">Reglas Activas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="py-8 text-center text-muted-text animate-pulse">Cargando reglas...</div>
                        ) : rules.length === 0 ? (
                            <div className="py-8 text-center text-muted-text flex flex-col items-center gap-2 border-2 border-dashed border-border rounded-xl">
                                <AlertTriangle className="size-6 opacity-20" />
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">No hay alertas configuradas</span>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {rules.map((rule) => (
                                    <div key={rule.id} className="flex items-center justify-between p-3 bg-surface-2 rounded-xl border border-border group transition-all hover:bg-white hover:shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">{rule.scope}</span>
                                                <span className="text-xs font-bold uppercase">{rule.label}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-border rounded-lg text-[10px] font-mono lowercase text-muted-text">
                                                {rule.field} {rule.operator === 'GT' ? '>' : rule.operator === 'GTE' ? '>=' : rule.operator === 'LT' ? '<' : rule.operator === 'LTE' ? '<=' : '='} {rule.threshold}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon-xs"
                                                onClick={() => handleToggle(rule.id, rule.enabled)}
                                                className={rule.enabled ? "text-primary" : "text-muted-text"}
                                            >
                                                {rule.enabled ? <Power className="size-3" /> : <PowerOff className="size-3" />}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon-xs"
                                                className="text-muted-text hover:text-danger"
                                                onClick={() => handleDelete(rule.id)}
                                            >
                                                <Trash2 className="size-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
