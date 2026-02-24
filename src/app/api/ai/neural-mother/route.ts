import { NextRequest, NextResponse } from "next/server";
import { NeuralMotherService } from "@/lib/agents/neural-mother";

/**
 * API: /api/ai/neural-mother
 * Trigger the full God-Tier automation wizard for a product.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { productId } = body;

        if (!productId) {
            return NextResponse.json({ error: "Missing productId" }, { status: 400 });
        }

        console.log(`[NeuralMother API] Triggering wizard for product: ${productId}`);

        const service = new NeuralMotherService(productId);

        // We run it as a "background-ish" task but await since it's a wizard.
        // For very long tasks, a worker would be better, but we already have 
        // research-orchestrator which handles its own logs and status.
        const result = await service.runFullAutomationWizard();

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: "Wizard completed successfully",
                data: result.outputs,
                logs: result.logs
            });
        } else {
            return NextResponse.json({
                success: false,
                error: result.error,
                logs: result.logs
            }, { status: 500 });
        }

    } catch (e: any) {
        console.error("[NeuralMother API Error]", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
