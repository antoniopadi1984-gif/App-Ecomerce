import { NextRequest, NextResponse } from "next/server";
import { executeWhatsAppRule } from "@/lib/automation/whatsapp-rule-executor";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const storeId = req.headers.get("X-Store-Id") || "store-main";
  const { orderId, message, imageUrl, discountCode, shopifyLink } = await req.json();

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });

  const result = await executeWhatsAppRule({
    storeId,
    orderId,
    customerPhone: (order as any).customerPhone || "",
    customerName: (order as any).customerName || "Cliente",
    orderNumber: (order as any).orderNumber || "",
    productTitle: (order as any).productTitle || "",
    trigger: "MANUAL_GIFT",
    customMessage: message,
    imageUrl,
    discountCode,
    shopifyLink,
  });

  return NextResponse.json(result);
}
