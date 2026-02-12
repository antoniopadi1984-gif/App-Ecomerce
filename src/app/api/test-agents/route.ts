import { NextResponse } from 'next/server';
import { CopywriterAgent, ScriptWriterAgent, ForensicResearcherAgent } from '@/lib/ai/agents/specialist-agents';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function GET() {
    try {
        console.log("🚀 Starting Specialist Agents Test...");

        const storeId = "test-store-id";

        // 1. Test Forensic Researcher
        console.log("Testing ForensicResearcherAgent...");
        const research = await ForensicResearcherAgent.executeDeepAnalysis(
            storeId,
            "Suplemento de NAD+ Antienvejecimiento",
            "Suplemento de alta pureza, enfoque en longevidad y energía celular."
        );

        console.log("✅ Research Complete. Waiting 5s for rate limits...");
        await sleep(5000);

        // 2. Test Copywriter
        console.log("Testing CopywriterAgent...");
        const copy = await CopywriterAgent.generateSalesLetter(
            storeId,
            research.text,
            { name: "Executive over 40", pain: "Low energy, aging markers" }
        );

        return NextResponse.json({
            success: true,
            research: research.text.substring(0, 500) + "...",
            copy: copy.text.substring(0, 500) + "...",
            provider: "REPLICATE/CLAUDE-3.7"
        });
    } catch (error: any) {
        console.error("❌ Test Failed:", error);

        const isRateLimit = error.message?.includes("429") || JSON.stringify(error).includes("429");

        return NextResponse.json({
            success: false,
            error: error.message,
            isRateLimit,
            suggestion: isRateLimit ? "Replicate está limitando la tasa. Tu cuenta tiene dinero, pero puede haber límites de ráfaga (burst) o el modelo tiene alta demanda. Los 5s de espera deberían ayudar." : "Revisa tu token de Replicate.",
            raw: error
        }, { status: isRateLimit ? 429 : 500 });
    }
}
