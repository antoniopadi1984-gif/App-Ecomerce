"use client";

import { useEffect, useState } from "react";
import { getAgentPerformance } from "@/app/logistics/orders/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function AgentPerformance() {
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAgentPerformance().then((res) => {
            if (res.success) setAgents(res.report);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="p-8 text-center text-xs uppercase animate-pulse">Calculando Rendimiento...</div>;

    return (
        <Card className="bg-gradient-to-br from-slate-900 to-black border-white/10 shadow-2xl">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-500" /> Ranking de Agentes
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader className="bg-white/5">
                        <TableRow className="border-white/5 hover:bg-transparent">
                            <TableHead className="text-[9px] font-black uppercase text-muted-foreground w-8">#</TableHead>
                            <TableHead className="text-[9px] font-black uppercase text-muted-foreground">Agente</TableHead>
                            <TableHead className="text-[9px] font-black uppercase text-muted-foreground text-center">Pedidos</TableHead>
                            <TableHead className="text-[9px] font-black uppercase text-muted-foreground text-center">Entrega %</TableHead>
                            <TableHead className="text-[9px] font-black uppercase text-muted-foreground text-center">Devolución %</TableHead>
                            <TableHead className="text-[9px] font-black uppercase text-muted-foreground text-right w-20">Score</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {agents.map((agent, i) => (
                            <TableRow key={agent.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                <TableCell className="font-bold text-xs text-muted-foreground">{i + 1}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-white">{agent.name}</span>
                                        <span className="text-[9px] text-muted-foreground uppercase">{agent.totalOrders} Asignados</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center font-bold text-xs">{agent.totalOrders}</TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline" className={cn("text-[9px] font-black border-none h-5",
                                        agent.deliveryRate > 85 ? "bg-emerald-500/20 text-emerald-400" :
                                            agent.deliveryRate > 70 ? "bg-amber-500/20 text-amber-400" : "bg-rose-500/20 text-rose-400"
                                    )}>
                                        {agent.deliveryRate.toFixed(1)}%
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    <span className={cn("text-[10px] font-bold", agent.returnRate > 15 ? "text-rose-500" : "text-slate-400")}>
                                        {agent.returnRate.toFixed(1)}%
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        {i === 0 && <TrendingUp className="h-3 w-3 text-emerald-400" />}
                                        <span className="text-xs font-black italic text-indigo-300">
                                            {((agent.deliveryRate * 1) - (agent.returnRate * 2)).toFixed(0)} pts
                                        </span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {agents.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                                    Sin datos. Sube la hoja de control para asignar agentes.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
