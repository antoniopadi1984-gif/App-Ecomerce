import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStoreIdNext } from "@/lib/server/store-context";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            storeId,
            productName,
            offerName = '',
            salePrice,
            productCost,
            iva,
            shippingCost,
            codFee,
            shipmentRate,
            deliveryRate,
            maxCpa,
            roasBreakeven,
            grossProfit,
            effectiveProfit,
            marginPercent,
            roi
        } = body;

        if (!storeId || !productName) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const offer = await prisma.pricingOffer.create({
            data: {
                storeId,
                productName,
                offerName: offerName || productName,
                salePrice: salePrice || 0,
                productCost: productCost || 0,
                iva: iva || 0,
                shippingCost: shippingCost || 0,
                codFee: codFee || 0,
                shipmentRate: shipmentRate || 80,
                deliveryRate: deliveryRate || 70,
                maxCpa: maxCpa || 0,
                roasBreakeven: roasBreakeven || 0,
                grossProfit: grossProfit || 0,
                effectiveProfit: effectiveProfit || 0,
                marginPercent: marginPercent || 0,
                roi: roi || 0
            }
        });

        return NextResponse.json({ success: true, offer });
    } catch (error: any) {
        console.error("[pricing-offers] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const storeId = request.nextUrl.searchParams.get('storeId') || 'default-store';

        const offers = await prisma.pricingOffer.findMany({
            where: { storeId, isActive: true },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ offers });
    } catch (error: any) {
        console.error("[pricing-offers] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
