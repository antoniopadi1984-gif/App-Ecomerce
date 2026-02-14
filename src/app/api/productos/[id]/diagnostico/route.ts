import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                finance: true,
                supplier: true,
                competitorLinks: true,
                researchSources: true,
                store: {
                    include: {
                        connections: {
                            select: {
                                id: true,
                                provider: true,
                                isActive: true,
                                updatedAt: true,
                            },
                        },
                    },
                },
            },
        });

        if (!product) {
            return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
        }

        return NextResponse.json(product);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const { action, data } = await req.json();
        const product = await prisma.product.findUnique({
            where: { id },
            include: { store: true },
        });

        if (!product) {
            return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
        }

        const storeId = product.storeId;
        let result: any = { status: "OK" };

        switch (action) {
            case "SAVE_COMPETITOR_LINKS": {
                const links = data.links || [];
                // Delete old links for this product and recreate
                await prisma.competitorLink.deleteMany({ where: { productId: id } });
                for (const link of links) {
                    await prisma.competitorLink.create({
                        data: {
                            productId: id,
                            type: link.type,
                            url: link.url,
                            notes: link.notes || null,
                        },
                    });
                }
                await logAudit({
                    storeId,
                    action: "DIAG_LINKS_SAVED",
                    entity: "DIAGNOSTICO",
                    entityId: id,
                    newValue: { count: links.length, links },
                });
                result = { status: "OK", message: `${links.length} enlaces guardados`, count: links.length };
                break;
            }

            case "GENERATE_NOMENCLATURE": {
                const template = product.store?.nomenclatureTemplate || "[PROD]_[CONC]_[VAR]_[LANG]";
                const nomenclature = template
                    .replace("[PROD]", (product.handle || "PROD").substring(0, 3).toUpperCase())
                    .replace("[CONC]", "C1")
                    .replace("[VAR]", "V1")
                    .replace("[LANG]", "ES");
                await logAudit({
                    storeId,
                    action: "DIAG_NOMENCLATURE",
                    entity: "DIAGNOSTICO",
                    entityId: id,
                    newValue: { nomenclature, template },
                });
                result = { status: "OK", message: `Nomenclatura generada: ${nomenclature}`, nomenclature };
                break;
            }

            case "CREATE_DRIVE_FOLDER": {
                // Check if Google Service Account is available
                const hasServiceAccount = !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
                if (!hasServiceAccount) {
                    await logAudit({
                        storeId,
                        action: "DIAG_DRIVE_FOLDER",
                        entity: "DIAGNOSTICO",
                        entityId: id,
                        newValue: { status: "STUB", reason: "Cuenta de servicio de Google no configurada" },
                    });
                    result = { status: "STUB", message: "STUB: Drive no disponible. Falta configurar cuenta de servicio de Google." };
                } else {
                    // Real implementation would call Google Drive API
                    const folderId = `PLACEHOLDER_${Date.now()}`;
                    await prisma.product.update({
                        where: { id },
                        data: { driveFolderId: folderId },
                    });
                    await logAudit({
                        storeId,
                        action: "DIAG_DRIVE_FOLDER",
                        entity: "DIAGNOSTICO",
                        entityId: id,
                        newValue: { status: "STUB", folderId, reason: "Service Account disponible pero creación real de carpeta deshabilitada en Fase 0" },
                    });
                    result = { status: "STUB", message: `STUB: Carpeta placeholder creada (${folderId}). Creación real pendiente.`, folderId };
                }
                break;
            }

            case "UPLOAD_ASSET": {
                await logAudit({
                    storeId,
                    action: "DIAG_ASSET_UPLOAD",
                    entity: "DIAGNOSTICO",
                    entityId: id,
                    newValue: { status: "STUB", reason: "Upload de assets no implementado en Fase 0" },
                });
                result = { status: "STUB", message: "STUB: Upload de assets pendiente de implementación." };
                break;
            }

            default:
                result = { status: "FAIL", message: `Acción desconocida: ${action}` };
        }

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
