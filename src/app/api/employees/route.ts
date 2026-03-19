import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
    const storeId = req.headers.get("X-Store-Id") || req.nextUrl.searchParams.get("storeId");
    if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 });

    const employees = await (prisma as any).employee.findMany({
        where: { storeId },
        orderBy: { name: "asc" },
    }).catch(() => []);

    // Calcular métricas por empleado desde pedidos
    const metrics = await Promise.all(employees.map(async (emp: any) => {
        const orders = await (prisma as any).order.findMany({
            where: { storeId, assignedAgentId: emp.id },
            select: { status: true, totalPrice: true, createdAt: true, confirmationAttempts: true },
        }).catch(() => []);

        const total = orders.length;
        const confirmed = orders.filter((o: any) => ["CONFIRMED","confirmed"].includes(o.status||"")).length;
        const delivered = orders.filter((o: any) => ["DELIVERED","ENTREGADO"].includes(o.status||"")).length;
        const revenue = orders.reduce((s: number, o: any) => s + (o.totalPrice||0), 0);
        const avgAttempts = total > 0 ? orders.reduce((s: number, o: any) => s + (o.confirmationAttempts||1), 0) / total : 0;

        return {
            ...emp,
            metrics: {
                totalOrders: total,
                confirmRate: total > 0 ? Math.round((confirmed/total)*100) : 0,
                deliveryRate: total > 0 ? Math.round((delivered/total)*100) : 0,
                revenue: Math.round(revenue*100)/100,
                avgAttempts: Math.round(avgAttempts*10)/10,
            }
        };
    }));

    return NextResponse.json({ employees: metrics });
}

export async function POST(req: NextRequest) {
    const storeId = req.headers.get("X-Store-Id");
    const { name, role, phone, email, isActive = true } = await req.json();
    if (!storeId || !name) return NextResponse.json({ error: "storeId y name requeridos" }, { status: 400 });

    const emp = await (prisma as any).employee.create({
        data: { storeId, name, role: role || "AGENT", phone, email, isActive },
    }).catch((e: any) => { throw new Error(e.message); });

    return NextResponse.json({ employee: emp });
}

export async function PUT(req: NextRequest) {
    const { id, ...data } = await req.json();
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
    const emp = await (prisma as any).employee.update({ where: { id }, data }).catch((e: any) => { throw new Error(e.message); });
    return NextResponse.json({ employee: emp });
}

export async function DELETE(req: NextRequest) {
    const { id } = await req.json();
    await (prisma as any).employee.delete({ where: { id } });
    return NextResponse.json({ ok: true });
}
