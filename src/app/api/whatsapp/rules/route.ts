import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const TRIGGER_LABELS: Record<string, string> = {
  ORDER_CREATED:       "Pedido creado",
  PAYMENT_CONFIRMED:   "Pago confirmado",
  TRACKING_ADDED:      "Tracking añadido",
  OUT_FOR_DELIVERY:    "En reparto",
  DELIVERY_ATTEMPTED:  "Intento de entrega fallido",
  DELIVERED:           "Entregado",
  RETURNED:            "Devuelto",
  DELIVERED_D3:        "D+3 post-entrega",
  DELIVERED_D7:        "D+7 post-entrega (review)",
  DELIVERED_D14:       "D+14 upsell",
  MANUAL_GIFT:         "Regalo puntual manual",
  NO_PICKUP_D1:        "Sin recoger D+1",
  NO_PICKUP_D3:        "Sin recoger D+3",
  REORDER_OFFER:       "Oferta recompra",
};

export async function GET(req: NextRequest) {
  const storeId = req.headers.get("X-Store-Id") || req.nextUrl.searchParams.get("storeId");
  if (!storeId) return NextResponse.json({ error: "storeId required" }, { status: 400 });
  const rules = await (prisma as any).whatsAppRule.findMany({
    where: { storeId }, orderBy: { createdAt: "asc" }
  });
  return NextResponse.json({ rules, triggerLabels: TRIGGER_LABELS });
}

export async function POST(req: NextRequest) {
  const storeId = req.headers.get("X-Store-Id");
  const body = await req.json();
  const rule = await (prisma as any).whatsAppRule.create({
    data: { storeId, ...body }
  });
  return NextResponse.json({ rule });
}

export async function PUT(req: NextRequest) {
  const { id, ...data } = await req.json();
  const rule = await (prisma as any).whatsAppRule.update({ where: { id }, data });
  return NextResponse.json({ rule });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await (prisma as any).whatsAppRule.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
