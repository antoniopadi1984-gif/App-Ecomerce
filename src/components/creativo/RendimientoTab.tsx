import React, { useState } from 'react';
import {
    BarChart3, TrendingUp, Zap, Target, Award, AlertCircle,
    ArrowUpRight, ArrowDownRight, Play, User, Globe, Layout,
    Search, Filter, Calendar, Download, RefreshCcw, MoreHorizontal,
    ChevronRight, ExternalLink, Sparkles
} from 'lucide-react';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip as RechartsTooltip, LineChart, Line,
    ScatterChart, Scatter, ZAxis
} from 'recharts';

import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type RendimientoTabType = 'global' | 'creativo' | 'avatar' | 'concepto' | 'landing';

interface RendimientoTabProps {
    storeId: string;
    productId: string;
}

export function RendimientoTab({ storeId, productId }: RendimientoTabProps) {
    const [activeTab, setActiveTab] = useState<RendimientoTabType>('global');

    const TABS = [
        { id: 'global', label: 'Resumen Global', icon: BarChart3 },
        { id: 'creativo', label: 'Por Creativo', icon: Play },
        { id: 'avatar', label: 'Por Avatar', icon: User },
        { id: 'concepto', label: 'Por Concepto', icon: Target },
        { id: 'landing', label: 'Por Landing', icon: Globe },
    ];

    const stats = [
        { label: 'Hook Rate', value: '24.5%', trend: '+4.2%', ok: true },
        { label: '3s View Rate', value: '42.1%', trend: '+1.5%', ok: true },
        { label: 'CTR (Unique)', value: '1.85%', trend: '-0.2%', ok: false },
        { label: 'ROAS', value: '3.42x', trend: '+0.8x', ok: true }
    ];

    return (
        <div className="flex flex-col gap-4 animate-in fade-in duration-500">
            {/* Header & Global Filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-[18px] font-bold tracking-tight text-[var(--text-primary)]">Centro de Rendimiento</h2>
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-1 uppercase tracking-widest font-bold">Análisis de datos Meta & Shopify en tiempo real</p>
                </div>

                <div className="flex gap-0 border-b border-[var(--border)] bg-white px-6 -mx-6 mb-2">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as RendimientoTabType)}
                            data-active={activeTab === tab.id}
                            className={cn(
                                "px-4 py-3 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 border-transparent text-[var(--text-tertiary)]",
                                "data-[active=true]:border-[var(--cre)] data-[active=true]:text-[var(--cre)] hover:text-[var(--text-primary)]"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Switcher */}
            <div className="space-y-6">
                {activeTab === 'global' && <GlobalSummary stats={stats} />}
                {activeTab === 'creativo' && <CreativoPerformance />}
                {activeTab === 'avatar' && <AvatarPerformance />}
                {activeTab === 'concepto' && <ConceptoPerformance />}
                {activeTab === 'landing' && <LandingPerformance />}
            </div>
        </div>
    );
}

// --- Sub-sections ---

interface ChiefAgentOutput {
    semana: string;
    ganador_concepto: string;
    ganador_framework: string;
    ganador_hook_tipo: string;
    ganador_avatar: string;
    ganador_formato: string;
    en_fatiga: string[];
    sin_probar: string[];
    recomendacion: string;
    accion_directa: {
        tipo: string;
        config: any;
    };
}

function GlobalSummary({ stats }: { stats: any[] }) {
    const [sortMetric, setSortMetric] = useState('roas');

    // Learning Loop Maturity (Visual simulation based on creative count)
    const CREATIVE_COUNT = 34; // Simulation
    const getMaturity = () => {
        if (CREATIVE_COUNT >= 50) return { level: 'Predictivo', color: 'text-[var(--cre)]', progress: 100 };
        if (CREATIVE_COUNT >= 20) return { level: 'Específico de Tienda', color: 'text-emerald-600', progress: 68 };
        return { level: 'Aprendizaje Inicial', color: 'text-amber-600', progress: 30 };
    };
    const maturity = getMaturity();

    const chiefAgentData: ChiefAgentOutput = {
        semana: "2026-W10",
        ganador_concepto: "MECH01",
        ganador_framework: "PAS",
        ganador_hook_tipo: "Curiosidad",
        ganador_avatar: "PURE-AV02",
        ganador_formato: "9:16",
        en_fatiga: ["PURE-ERROR02-C-V1", "PURE-FEAR01-W-V3"],
        sin_probar: ["PURE-SHAME03", "PURE-STORY04"],
        recomendacion: "Genera 15 variantes de MECH01 con framework PAS, hook tipo curiosidad, con PURE-AV02 en 9:16 para tráfico frío. Pausa los creativos en fatiga. Prueba PURE-SHAME03 esta semana.",
        accion_directa: {
            tipo: "LANZAR_FABRICA",
            config: { concepto: "MECH01", framework: "PAS", hook: "curiosidad", avatar: "PURE-AV02", fase: "FRÍO", n: 15 }
        }
    };

    // Mock Trend Data
    const trendData = [
        { date: '01 Mar', ctr: 1.2, cpa: 15, roas: 3.2 },
        { date: '02 Mar', ctr: 1.5, cpa: 12, roas: 3.8 },
        { date: '03 Mar', ctr: 1.1, cpa: 18, roas: 2.9 },
        { date: '04 Mar', ctr: 1.8, cpa: 10, roas: 4.5 },
        { date: '05 Mar', ctr: 1.6, cpa: 11, roas: 4.1 },
        { date: '06 Mar', ctr: 1.9, cpa: 9, roas: 4.8 },
        { date: '07 Mar', ctr: 1.85, cpa: 10.5, roas: 4.4 },
    ];

    const leaderboard = [
        { id: 1, name: 'VD_C03_COLD_H01_V1', ctr: 2.1, cpa: 8.5, roas: 5.2, hook: 34, w25: 45, w50: 22, status: 'ESCALANDO' },
        { id: 2, name: 'VD_C01_WARM_H03_V2', ctr: 1.8, cpa: 11.2, roas: 4.1, hook: 28, w25: 38, w50: 18, status: 'ESTABLE' },
        { id: 3, name: 'VD_C02_COLD_H02_V1', ctr: 1.5, cpa: 14.5, roas: 3.2, hook: 22, w25: 30, w50: 12, status: 'DECLINANDO' },
        { id: 4, name: 'VD_C03_RT_H01_V3', ctr: 2.5, cpa: 6.2, roas: 6.8, hook: 41, w25: 52, w50: 28, status: 'ESCALANDO' },
        { id: 5, name: 'VD_C01_COLD_H05_V1', ctr: 1.2, cpa: 19.8, roas: 2.1, hook: 18, w25: 25, w50: 8, status: 'DECLINANDO' },
    ];

    const globalKPIs = [
        ...stats,
        { label: 'Creativos Activos', value: '24', trend: '+3', ok: true },
        { label: 'Generados Semana', value: '15', trend: '+100%', ok: true },
        { label: 'Presupuesto Activo', value: '€1.2k', trend: 'Estable', ok: true },
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* KPI Grid & Maturity */}
            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center px-4 py-3 bg-[var(--cre-bg)] rounded-xl border border-[var(--cre)]/10">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Estado del Learning Loop</span>
                            <span className={cn("text-xs font-bold uppercase tracking-tight", maturity.color)}>{maturity.level}</span>
                        </div>
                        <div className="w-[180px] h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                            <div className={cn("h-full transition-all duration-1000", maturity.color.replace('text', 'bg'))} style={{ width: `${maturity.progress}%` }} />
                        </div>
                        <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">{CREATIVE_COUNT} Creativos con datos</span>
                    </div>
                    {CREATIVE_COUNT >= 50 && (
                        <div className="flex items-center gap-2 bg-[var(--cre-bg)] text-[var(--cre)] px-2.5 py-1 rounded-lg border border-[var(--cre)]/20 animate-pulse">
                            <Zap size={14} />
                            <span className="text-[9px] font-bold uppercase tracking-widest">Predicción de CTR Activada</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                    {globalKPIs.map((s, i) => (
                        <div key={i} className="p-4 bg-white border border-[var(--border)] rounded-xl relative overflow-hidden group hover:border-[var(--cre)]/30 transition-all shadow-sm">
                            <p className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-1">{s.label}</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-sm font-bold text-[var(--text-primary)]">{s.value}</span>
                                <span className={cn("text-[9px] font-bold", s.ok ? "text-[var(--s-ok)]" : "text-[var(--s-ko)]")}>{s.trend}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Trend Chart */}
                <div className="xl:col-span-2 p-4 bg-white border border-[var(--border)] rounded-xl shadow-sm flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">Gráfica de Tendencias</h3>
                            <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Visualización de ROAS, CTR y CPA (Últimos 30 días)</p>
                        </div>
                        <div className="flex bg-[var(--bg)] p-1 rounded-lg border border-[var(--border)]">
                            {['30D', '60D', '90D'].map(d => (
                                <button key={d} className={cn("px-4 py-1 rounded-md text-[10px] font-bold transition-all", d === '30D' ? "bg-white text-[var(--cre)] shadow-sm" : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]")}>{d}</button>
                            ))}
                        </div>
                    </div>

                    <div className="h-[280px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={10} fontWeight="600" tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-tertiary)" fontSize={10} fontWeight="600" tickLine={false} axisLine={false} />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: '600' }}
                                    cursor={{ stroke: 'var(--cre)', strokeWidth: 2 }}
                                />
                                <Line type="monotone" dataKey="roas" stroke="var(--cre)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--cre)' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                                <Line type="monotone" dataKey="ctr" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Chief Agent Analysis */}
                <div className="p-0 overflow-hidden bg-[var(--text-primary)] rounded-xl border border-[var(--border)] shadow-md flex flex-col group h-full">
                    <div className="p-5 border-b border-white/5 bg-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-[var(--cre-bg)]/20 flex items-center justify-center text-[var(--cre)] shadow-inner">
                                <Sparkles size={20} className="animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white uppercase tracking-tight">Agente Jefe Creativo</h3>
                                <p className="text-[10px] font-bold text-[var(--cre)] uppercase tracking-widest">Semana {chiefAgentData.semana}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                <WinnerBadge label="Concepto" value={chiefAgentData.ganador_concepto} color="cre" />
                                <WinnerBadge label="Framework" value={chiefAgentData.ganador_framework} color="cre" />
                                <WinnerBadge label="Hook Type" value={chiefAgentData.ganador_hook_tipo} color="cre" />
                                <WinnerBadge label="Avatar" value={chiefAgentData.ganador_avatar} color="cre" />
                                <WinnerBadge label="Formato" value={chiefAgentData.ganador_formato} color="emerald" />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-red-400 uppercase tracking-widest leading-none">
                                    <AlertCircle size={12} /> Creativos en Fatiga
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {chiefAgentData.en_fatiga.map(f => (
                                        <span key={f} className="px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-[9px] font-mono text-red-300">{f}</span>
                                    ))}
                                </div>
                            </div>

                            <p className="text-[11px] text-[var(--text-subtle)] leading-relaxed font-bold p-3 bg-white/5 rounded-lg border border-white/10 uppercase tracking-tight">
                                {chiefAgentData.recomendacion}
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                toast.success("Configurando Fábrica en Masa...", {
                                    description: `Cargando recomendación: ${chiefAgentData.ganador_concepto} + ${chiefAgentData.ganador_framework}`
                                });
                            }}
                            className="w-full h-10 bg-[var(--cre)] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:opacity-90 shadow-lg shadow-[var(--cre)]/20 transition-all flex items-center justify-center gap-2"
                        >
                            <Zap size={14} /> Ejecutar Recomendación
                        </button>
                    </div>
                </div>
            </div>

            {/* Leaderboard Table */}
            <div className="bg-white border border-[var(--border)] rounded-xl p-0 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight flex items-center gap-2">
                            <Award size={18} className="text-amber-500" />
                            Leaderboard de la Semana
                        </h3>
                        <p className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mt-1">Top 10 Creativos de los últimos 7 días</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="h-9 px-4 bg-[var(--text-primary)] text-white rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-all shadow-sm">
                            <Download size={14} /> Informe Semanal
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[var(--bg)]/10 border-b border-[var(--border)]">
                                <th className="p-4 py-3 text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Creativo</th>
                                <th className="p-4 text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest text-center cursor-pointer hover:text-[var(--cre)] transition-colors">CTR%</th>
                                <th className="p-4 text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest text-center cursor-pointer hover:text-[var(--cre)] transition-colors">CPA</th>
                                <th className="p-4 text-[9px] font-bold text-[var(--cre)] uppercase tracking-widest text-center cursor-pointer font-bold">ROAS</th>
                                <th className="p-4 text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest text-center">Hook Rate</th>
                                <th className="p-4 text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest text-center">Watch 25%</th>
                                <th className="p-4 text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest text-center">Watch 50%</th>
                                <th className="p-4 text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Tendencia</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {leaderboard.map((item, idx) => (
                                <tr key={item.id} className="hover:bg-[var(--bg)]/50 transition-all group cursor-pointer">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded bg-[var(--text-primary)] flex items-center justify-center text-[10px] font-bold text-white italic">
                                                {idx + 1}
                                            </div>
                                            <span className="text-[11px] font-bold text-[var(--text-primary)] uppercase italic tracking-tighter truncate w-32">{item.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="text-xs font-bold text-[var(--text-secondary)]">{item.ctr}%</span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="text-xs font-bold text-[var(--text-tertiary)]">€{item.cpa}</span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="text-sm font-bold text-[var(--cre)]">{item.roas}x</span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="w-full bg-[var(--bg)] h-1.5 rounded-full overflow-hidden max-w-[60px] mx-auto border border-[var(--border)]">
                                            <div className="h-full bg-[var(--cre)]" style={{ width: `${item.hook}%` }} />
                                        </div>
                                        <span className="text-[9px] font-bold text-[var(--text-tertiary)] mt-1 block uppercase">{item.hook}% Hook</span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="text-[10px] font-mono font-bold text-[var(--text-secondary)]">{item.w25}%</span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="text-[10px] font-mono font-bold text-[var(--text-secondary)]">{item.w50}%</span>
                                    </td>
                                    <td className="p-4">
                                        <div className={cn(
                                            "flex items-center gap-1.5 px-3 py-0.5 rounded-full border text-[8px] font-bold uppercase w-fit tracking-tighter",
                                            item.status === 'ESCALANDO' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                item.status === 'ESTABLE' ? "bg-sky-50 text-sky-600 border-sky-100" :
                                                    "bg-rose-50 text-rose-600 border-rose-100 animate-pulse"
                                        )}>
                                            <TrendingUp size={10} className={item.status === 'DECLINANDO' ? 'rotate-180' : ''} />
                                            {item.status}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function WinnerBadge({ label, value, color }: { label: string, value: string, color: string }) {
    const colors: any = {
        cre: "bg-[var(--cre-bg)] text-[var(--cre)] border-[var(--cre)]/10",
        emerald: "bg-[var(--s-ok)]/10 text-[var(--s-ok)] border-[var(--s-ok)]/10"
    };

    return (
        <div className={cn("p-2 rounded-xl border flex flex-col gap-0.5 shadow-sm", colors[color])}>
            <span className="text-[7px] font-bold uppercase tracking-widest opacity-60">{label}</span>
            <span className="text-[10px] font-bold uppercase truncate">{value}</span>
        </div>
    );
}

function CreativoPerformance() {
    const [selectedAdId, setSelectedAdId] = useState<string | null>(null);
    const [attributionWindow, setAttributionWindow] = useState('7d_click');

    const creatives = [
        {
            id: 'VD_COLLAGEN_PAS_H01_V1',
            concept: 'Mecanismo Único',
            avatar: 'María 35',
            phase: 'Frío',
            framework: 'PAS',
            hookType: 'Problema',
            duration: '22s',
            format: '9:16',
            daysActive: 12,
            metrics: {
                impressions: '142.5k',
                reach: '110.2k',
                frequency: 1.29,
                ctr: 2.15,
                cpc: 0.85,
                cpm: 12.40,
                hookRate: 34.2,
                w25: 48.5,
                w50: 22.1,
                thruplay: 12450,
                clicks: 3064,
                conversions: 124,
                cvr: 4.05,
                cpa: 8.42,
                roas: 4.85,
                spend: 1044.08
            },
            status: 'ACTIVO',
            preLaunchScore: 88,
            fatigue: 'ESTABLE',
            driveUrl: '#'
        },
        {
            id: 'VD_BOTOX_VIBE_H03_V2',
            concept: 'Social Proof',
            avatar: 'Elena 25',
            phase: 'Warm',
            framework: 'AIDA',
            hookType: 'Resultados',
            duration: '18s',
            format: '9:16',
            daysActive: 8,
            metrics: {
                impressions: '84.2k',
                reach: '62.1k',
                frequency: 1.35,
                ctr: 1.82,
                cpc: 1.12,
                cpm: 15.20,
                hookRate: 28.5,
                w25: 38.2,
                w50: 16.5,
                thruplay: 6800,
                clicks: 1532,
                conversions: 42,
                cvr: 2.74,
                cpa: 14.50,
                roas: 3.12,
                spend: 609.00
            },
            status: 'FATIGADO',
            preLaunchScore: 92,
            fatigue: 'ALTA',
            driveUrl: '#'
        }
    ];

    return (
        <div className="relative">
            <div className="bg-white border border-[var(--border)] rounded-xl flex flex-col h-[700px] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-[var(--border)] bg-[var(--bg)]/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-6">
                        <h3 className="text-[12px] font-bold text-[var(--text-primary)] uppercase tracking-tight">Master Table Creativos</h3>

                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-[var(--border)] shadow-sm">
                            <span className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest border-r border-[var(--border)] pr-2">Attribution</span>
                            <select
                                value={attributionWindow}
                                onChange={(e) => setAttributionWindow(e.target.value)}
                                className="text-[9px] font-bold text-[var(--text-primary)] outline-none bg-transparent uppercase"
                            >
                                <option value="1d_click">1-day Click</option>
                                <option value="7d_click">7-day Click</option>
                                <option value="28d_click">28-day Click</option>

                                <option value="1d_engaged_view">1-day Engaged View</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex bg-white items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] shadow-sm group focus-within:border-[var(--cre)]/40 transition-all">
                            <Search size={12} className="text-[var(--text-tertiary)]" />
                            <input placeholder="BUSCAR ID..." className="bg-transparent text-[9px] font-bold outline-none w-32 uppercase placeholder:text-[var(--text-subtle)]" />
                        </div>
                        <button className="h-8 px-3 bg-white border border-[var(--border)] rounded-lg text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-[var(--bg)] transition-all shadow-sm">
                            <Filter size={12} className="text-[var(--cre)]" /> Filtros
                        </button>
                        <button className="h-8 px-4 bg-[var(--text-primary)] text-white rounded-lg text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-all shadow-sm">
                            <Download size={12} /> CSV
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto relative custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[2500px]">
                        <thead className="sticky top-0 z-20">
                            <tr className="bg-[var(--bg)] border-b border-[var(--border)]">
                                <th className="p-3 bg-[var(--bg)] sticky left-0 z-30 border-r border-[var(--border)] text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Miniatura</th>
                                <th className="p-3 bg-[var(--bg)] sticky left-[104px] z-30 border-r border-[var(--border)] text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">IDC ID / Concepto</th>

                                <th className="p-3 text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Avatar</th>
                                <th className="p-3 text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Fase / Framework</th>
                                <th className="p-3 text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Hook Type</th>
                                <th className="p-3 text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Duración / Formato</th>
                                <th className="p-3 text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Días Activo</th>

                                <th className="p-3 text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest bg-[var(--bg)]/40">Impresiones</th>
                                <th className="p-3 text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest bg-[var(--bg)]/40">Alcance</th>
                                <th className="p-3 text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest bg-[var(--bg)]/40">Frecuencia</th>

                                <th className="p-3 text-[8px] font-bold text-[var(--cre)] uppercase tracking-widest bg-[var(--cre-bg)]/30">CTR Link</th>
                                <th className="p-3 text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest bg-[var(--cre-bg)]/30">CPC</th>
                                <th className="p-3 text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest bg-[var(--cre-bg)]/30">CPM</th>

                                <th className="p-3 text-[8px] font-bold text-amber-600 uppercase tracking-widest bg-amber-50/30">Hook Rate (3s)</th>
                                <th className="p-3 text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest bg-amber-50/30">Watch 25%</th>
                                <th className="p-3 text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest bg-amber-50/30">Watch 50%</th>
                                <th className="p-3 text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest bg-amber-50/30">ThruPlay</th>

                                <th className="p-3 text-[8px] font-bold text-[var(--s-ok)] uppercase tracking-widest bg-emerald-50/30 text-center">Clicks</th>
                                <th className="p-3 text-[8px] font-bold text-[var(--s-ok)] uppercase tracking-widest bg-emerald-50/30 text-center">Conv.</th>
                                <th className="p-3 text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest bg-emerald-50/30 text-center">CVR LP</th>

                                <th className="p-3 text-[8px] font-bold text-[var(--text-primary)] uppercase tracking-widest bg-[var(--bg)] text-center">CPA</th>
                                <th className="p-3 text-[8px] font-bold text-[var(--cre)] uppercase tracking-widest bg-[var(--cre-bg)]/50 text-center border-x border-[var(--border)]">ROAS</th>
                                <th className="p-3 text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest bg-[var(--bg)] text-center">Gasto Total</th>

                                <th className="p-3 text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Estado</th>
                                <th className="p-3 text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">PL Score</th>
                                <th className="p-3 text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Fatiga</th>
                                <th className="p-3 text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest sticky right-0 bg-[var(--bg)] border-l border-[var(--border)]">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {creatives.map((ad) => (
                                <tr
                                    key={ad.id}
                                    className={cn(
                                        "hover:bg-[var(--bg)]/5 transition-all cursor-pointer group",
                                        selectedAdId === ad.id && "bg-[var(--cre-bg)]/20"
                                    )}
                                    onClick={() => setSelectedAdId(ad.id)}
                                >
                                    <td className="p-3 sticky left-0 bg-white group-hover:bg-[var(--bg)]/10 z-10 border-r border-[var(--border)]">
                                        <div className="w-16 h-20 rounded-lg bg-[var(--bg)] border border-[var(--border)] overflow-hidden relative group/thumb shadow-sm">
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                                                <Play size={16} className="text-white fill-white" />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3 sticky left-[104px] bg-white group-hover:bg-[var(--bg)]/10 z-10 border-r border-[var(--border)]">
                                        <div className="w-48">
                                            <p className="text-[10px] font-bold text-[var(--text-primary)] uppercase leading-none">{ad.id}</p>
                                            <p className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mt-1.5">{ad.concept}</p>
                                        </div>
                                    </td>
                                    <td className="p-3 text-[10px] font-bold text-[var(--text-secondary)] italic">{ad.avatar}</td>
                                    <td className="p-3">
                                        <div className="flex flex-col gap-1">
                                            <span className={cn("px-1.5 py-0.5 rounded text-[7px] font-bold w-fit uppercase border",
                                                ad.phase === 'Frío' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-[var(--cre-bg)] text-[var(--cre)] border-[var(--cre)]/10')}>{ad.phase}</span>
                                            <span className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest opacity-60">{ad.framework}</span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-[10px] font-bold text-[var(--text-secondary)] uppercase">{ad.hookType}</td>
                                    <td className="p-3 text-[10px] font-bold text-[var(--text-secondary)]">{ad.duration} / {ad.format}</td>
                                    <td className="p-3 text-[10px] font-bold text-[var(--text-primary)]">{ad.daysActive}d</td>

                                    <td className="p-3 text-[11px] font-bold text-[var(--text-secondary)]">{ad.metrics.impressions}</td>
                                    <td className="p-3 text-[11px] font-bold text-[var(--text-secondary)]">{ad.metrics.reach}</td>
                                    <td className="p-3 text-[11px] font-bold text-[var(--text-secondary)]">{ad.metrics.frequency}x</td>

                                    <td className="p-3 text-[11px] font-bold text-[var(--cre)]">{ad.metrics.ctr}%</td>
                                    <td className="p-3 text-[11px] font-bold text-[var(--text-secondary)]">€{ad.metrics.cpc}</td>
                                    <td className="p-3 text-[11px] font-bold text-[var(--text-secondary)]">€{ad.metrics.cpm}</td>

                                    <td className="p-3 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-[11px] font-bold text-[var(--text-primary)]">{ad.metrics.hookRate}%</span>
                                            <div className="h-1 w-10 bg-[var(--border)] rounded-full overflow-hidden">
                                                <div className="h-full bg-amber-500" style={{ width: `${ad.metrics.hookRate}%` }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3 text-center text-[10px] font-bold text-[var(--text-secondary)]">{ad.metrics.w25}%</td>
                                    <td className="p-3 text-center text-[10px] font-bold text-[var(--text-secondary)]">{ad.metrics.w50}%</td>
                                    <td className="p-3 text-center text-[10px] font-bold text-[var(--text-secondary)]">{ad.metrics.thruplay.toLocaleString()}</td>

                                    <td className="p-3 text-center text-[11px] font-bold text-[var(--text-secondary)]">{ad.metrics.clicks}</td>
                                    <td className="p-3 text-center text-[11px] font-bold text-[var(--s-ok)]">{ad.metrics.conversions}</td>
                                    <td className="p-3 text-center text-[11px] font-bold text-[var(--text-secondary)]">{ad.metrics.cvr}%</td>

                                    <td className="p-3 text-center text-[11px] font-bold text-[var(--text-primary)]">€{ad.metrics.cpa}</td>
                                    <td className="p-3 text-center border-x border-[var(--border)]">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[14px] font-bold text-[var(--text-primary)] tracking-tighter">{ad.metrics.roas}x</span>
                                            {ad.metrics.roas >= 4 && <span className="text-[7px] font-bold text-[var(--s-ok)] uppercase tracking-widest mt-0.5 animate-pulse">Winner</span>}
                                        </div>
                                    </td>
                                    <td className="p-3 text-center text-[11px] font-bold text-[var(--text-primary)] tracking-tight">€{ad.metrics.spend.toFixed(2)}</td>

                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-1.5 h-1.5 rounded-full", ad.status === 'ACTIVO' ? "bg-[var(--s-ok)] shadow-[0_0_8px_var(--s-ok)]/40" : "bg-[var(--s-wa)] shadow-[0_0_8px_var(--s-wa)]/40")} />
                                            <span className="text-[8px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">{ad.status}</span>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <div className="w-7 h-7 rounded-full border border-[var(--border)] flex items-center justify-center text-[9px] font-bold text-[var(--cre)] shadow-sm bg-white">
                                            {ad.preLaunchScore}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <span className={cn(
                                            "px-1.5 py-0.5 rounded-full text-[7px] font-bold uppercase tracking-widest border shadow-sm",
                                            ad.fatigue === 'ESTABLE' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-red-50 border-red-100 text-[var(--s-ko)]"
                                        )}>
                                            {ad.fatigue}
                                        </span>
                                    </td>
                                    <td className="p-3 sticky right-0 bg-white group-hover:bg-[var(--bg)]/10 z-10 border-l border-[var(--border)]">
                                        <div className="flex items-center gap-1.5">
                                            <button className="p-1.5 hover:bg-[var(--cre-bg)]/40 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--cre)] transition-all">
                                                <ExternalLink size={14} />
                                            </button>
                                            <button className="p-1.5 hover:bg-[var(--bg)]/10 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all">
                                                <MoreHorizontal size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Frame-by-Frame Side Panel */}
            {selectedAdId && (
                <FrameAnalysisPanel
                    adId={selectedAdId as string}
                    onClose={() => setSelectedAdId(null)}
                />
            )}
        </div>
    );
}

function FrameAnalysisPanel({ adId, onClose }: { adId: string, onClose: () => void }) {
    // Mock Retention Data
    const retentionData = Array.from({ length: 22 }, (_, i) => ({
        second: i,
        estimated: Math.max(10, 100 - (i * i * 0.2) - (i * 2)),
        real: i < 15 ? Math.max(10, 100 - (i * i * 0.18) - (i * 2.5)) : null,
        markers: i === 4 ? "Dropped Hook" : i === 12 ? "Call to Action start" : null
    }));

    return (
        <div className="fixed top-0 right-0 w-[450px] h-full bg-white shadow-[-20px_0_50px_rgba(0,0,0,0.1)] z-[100] animate-in slide-in-from-right duration-500 border-l border-[var(--border)] flex flex-col">
            <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg)]/10 backdrop-blur-xl">
                <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight italic">Análisis Frame-by-Frame</h3>
                    <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mt-1">{adId}</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 bg-white border border-[var(--border)] rounded-lg text-[var(--text-tertiary)] hover:text-[var(--s-ko)] hover:border-[var(--s-ko)]/10 transition-all shadow-sm"
                >
                    <MoreHorizontal size={18} className="rotate-90" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {/* Video Preview */}
                <div className="aspect-[9/16] w-full max-w-[220px] mx-auto rounded-xl bg-[var(--text-primary)] border-[6px] border-[var(--bg)] shadow-sm overflow-hidden relative group">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Play size={48} className="text-white opacity-40 group-hover:scale-110 group-hover:opacity-100 transition-all" />
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 h-1 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--cre)] w-1/3" />
                    </div>
                </div>

                {/* Performance Curve */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-widest">Curva de Retención Estimada</h4>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-[var(--cre)]" />
                                <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase">Estimada</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-[var(--s-ok)]" />
                                <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase">Real Meta</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-[200px] w-full bg-[var(--bg)]/20 rounded-xl border border-[var(--border)] p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={retentionData}>
                                <defs>
                                    <linearGradient id="colorEst" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--cre)" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="var(--cre)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="second" hide />
                                <YAxis hide domain={[0, 100]} />
                                <RechartsTooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-[var(--text-primary)] p-3 rounded-lg border border-white/10 shadow-sm">
                                                    <p className="text-[10px] font-bold text-[var(--cre)] uppercase mb-1">Segundo {payload[0].payload.second}</p>
                                                    <p className="text-sm font-bold text-white">{payload[0].value?.toString().slice(0, 4)}% retención</p>
                                                    {payload[0].payload.markers && (
                                                        <p className="text-[9px] text-[var(--s-wa)] font-bold mt-2 uppercase tracking-tight">⚠️ {payload[0].payload.markers}</p>
                                                    )}
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area type="monotone" dataKey="estimated" stroke="var(--cre)" strokeWidth={3} fillOpacity={1} fill="url(#colorEst)" />
                                <Area type="monotone" dataKey="real" stroke="var(--s-ok)" strokeWidth={3} fill="transparent" strokeDasharray="5 5" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* AI Timeline Alerts */}
                <div className="space-y-4">
                    <h4 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-widest">Diagnóstico por Segundos</h4>
                    <div className="space-y-3">
                        <div className="p-4 bg-[var(--s-ko)]/5 rounded-xl border border-[var(--s-ko)]/10 flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-[var(--s-ko)]/10 flex items-center justify-center text-[var(--s-ko)] shrink-0 font-bold text-[10px]">04s</div>
                            <div>
                                <p className="text-[11px] font-bold text-[var(--s-ko)] uppercase leading-none">Drop Detectado (Hook)</p>
                                <p className="text-[10px] text-[var(--s-ko)]/80 mt-1 leading-relaxed">
                                    "El hook pierde tensión visual justo antes de la transición. Recomendamos recortar 0.5s y usar un zoom dinámico."
                                </p>
                            </div>
                        </div>
                        <div className="p-4 bg-[var(--cre-bg)]/20 rounded-xl border border-[var(--cre)]/10 flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-[var(--cre-bg)] flex items-center justify-center text-[var(--cre)] shrink-0 font-bold text-[10px]">12s</div>
                            <div>
                                <p className="text-[11px] font-bold text-[var(--cre)] uppercase leading-none">Interés en Oferta</p>
                                <p className="text-[10px] text-[var(--cre)]/80 mt-1 leading-relaxed">
                                    "La retención sube un 4% al aparecer el bundle. Este ángulo de 'ahorro' conecta bien con el avatar."
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action CTA */}
                <button className="w-full h-14 bg-[var(--text-primary)] text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:opacity-90 shadow-sm transition-all flex items-center justify-center gap-3">
                    <Sparkles size={18} className="text-[var(--cre)]" /> Generar Variantes Optimizadas
                </button>
            </div>
        </div>
    );
}

function AvatarPerformance() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
                <div key={i} className="bg-white border border-[var(--border)] rounded-xl p-6 flex flex-col gap-6 group hover:border-[var(--cre)]/30 transition-all shadow-sm">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-[var(--bg)] border border-[var(--border)] overflow-hidden relative">
                                <div className="absolute inset-0 flex items-center justify-center text-[var(--text-tertiary)]/30">
                                    <User size={32} />
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase italic">Avatar {i === 1 ? 'María 35' : i === 2 ? 'Juan 45' : 'Elena 25'}</h4>
                                <div className="flex items-center gap-1.5 mt-1">
                                    {i === 1 && <span className="px-1.5 py-0.5 rounded bg-[var(--cre)] text-white text-[7px] font-bold uppercase tracking-widest">Top Performer</span>}
                                    <span className="text-[9px] font-bold text-[var(--text-tertiary)]">{i * 4} creativos activos</span>
                                </div>
                            </div>
                        </div>
                        <button className="p-2 text-[var(--text-tertiary)] hover:text-[var(--cre)] transition-all">
                            <ExternalLink size={16} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-[var(--bg)]/30 rounded-lg border border-[var(--border)]">
                            <p className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-1">CTR Medio</p>
                            <p className="text-sm font-bold text-[var(--text-primary)]">{(2.1 - i * 0.2).toFixed(2)}%</p>
                        </div>
                        <div className="p-3 bg-[var(--s-ok)]/5 rounded-lg border border-[var(--s-ok)]/10">
                            <p className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-1">ROAS Medio</p>
                            <p className="text-sm font-bold text-[var(--s-ok)]">{(4.2 - i * 0.5).toFixed(2)}x</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-[var(--text-tertiary)] uppercase tracking-tight">Eficiencia Hook</span>
                            <span className="text-[var(--text-primary)]">{85 - i * 5}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-[var(--bg)]/40 rounded-full overflow-hidden">
                            <div className="h-full bg-[var(--cre)] rounded-full" style={{ width: `${85 - i * 5}%` }} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function ConceptoPerformance() {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="bg-white border border-[var(--border)] rounded-xl p-0 overflow-hidden group hover:border-[var(--cre)]/20 transition-all shadow-sm">
                    <div className="p-5 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg)]/10">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-white border border-[var(--border)] flex items-center justify-center text-[var(--text-tertiary)]/40 group-hover:text-[var(--cre)] transition-colors">
                                <Target size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">C0{i}: {i === 1 ? 'Mecanismo Único' : i === 2 ? 'Prueba Social' : 'Problema-Solución'}</h4>
                                <p className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest leading-none mt-1 italic opacity-60">Ángulo: {i === 1 ? 'Biotecnología' : 'Validación Médica'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-10">
                            <div className="text-right">
                                <p className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Inversión</p>
                                <p className="text-sm font-bold text-[var(--text-primary)]">€{2400 - i * 400}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">ROAS</p>
                                <p className="text-sm font-bold text-[var(--s-ok)]">{(4.8 - i * 0.6).toFixed(2)}x</p>
                            </div>
                            <div className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center text-[10px] font-bold text-[var(--cre)] shadow-sm bg-white">
                                {95 - i * 8}%
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function LandingPerformance() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map(i => (
                <div key={i} className="bg-white border border-[var(--border)] rounded-xl p-6 space-y-6 group hover:border-[var(--cre)]/30 transition-all shadow-sm">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center text-[var(--text-tertiary)]/40 overflow-hidden relative shadow-sm">
                                <Globe size={28} />
                                <div className="absolute inset-0 bg-[var(--cre-bg)]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">{i === 1 ? 'LP_ADVERTORIAL_V1' : 'LP_DIRECT_OFFER_V3'}</h4>
                                <p className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mt-1 opacity-60">Tipo: {i === 1 ? 'Advertorial' : 'Product Page'}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className={cn("px-2 py-1 rounded-full text-[8px] font-bold border shadow-sm", i === 1 ? "bg-[var(--s-ok)]/10 border-[var(--s-ok)]/20 text-[var(--s-ok)]" : "bg-[var(--bg)] border-[var(--border)] text-[var(--text-tertiary)]")}>
                                {i === 1 ? 'WINNER-LP' : 'TESTING'}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <LandingMetric label="Visitas" value={i === 1 ? '4.2k' : '1.8k'} />
                        <LandingMetric label="CVR%" value={i === 1 ? '3.8%' : '1.2%'} highlight={i === 1} />
                        <LandingMetric label="AOV" value={i === 1 ? '€42.5' : '€38.2'} />
                    </div>

                    <div className="p-4 bg-[var(--bg)]/50 rounded-xl border border-[var(--border)] space-y-3 shadow-sm">
                        <div className="flex justify-between items-center text-[9px] font-bold uppercase text-[var(--text-tertiary)] tracking-widest">
                            <span>Velocidad Móvil</span>
                            <span className="text-[var(--s-ok)]">92/100</span>
                        </div>
                        <div className="h-1.5 w-full bg-[var(--bg)] rounded-full overflow-hidden">
                            <div className="h-full bg-[var(--s-ok)]" style={{ width: '92%' }} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function LandingMetric({ label, value, highlight }: any) {
    return (
        <div className="space-y-1">
            <p className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">{label}</p>
            <p className={cn("text-sm font-bold", highlight ? "text-[var(--cre)]" : "text-[var(--text-primary)]")}>{value}</p>
        </div>
    );
}
