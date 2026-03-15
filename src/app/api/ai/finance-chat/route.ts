import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SYSTEM_PROMPT = `Eres un experto asesor financiero especializado en ecommerce y marketing digital, específicamente en modelos de negocio COD (Cash on Delivery).

Tu rol es analizar métricas financieras y dar recomendaciones accionables. Focuses principales:

1. **ROAS (Return on Ad Spend)**: Analiza si el retorno publicitario es saludable
2. **CPA (Cost Per Acquisition)**: Evalúa el coste de adquisición de clientes
3. **Margen de Beneficio**: Considera costes de producto, envío, devoluciones
4. **Tasa de Conversión COD**: Se calcula como (pedidos/visitantes)*100
5. **Tasa de Entrega**: Impacto de devoluciones e incidencias en la rentabilidad real
6. **Escalabilidad**: Cuándo y cómo escalar presupuesto publicitario

Para COD ecommerce, considera:
- Tasa de entregas típica: 70-85%
- ROAS mínimo saludable: 3-4x (depende de márgenes)
- Margen neto objetivo: 30-35%
- Costes ocultos: COD fees, devoluciones, reenvíos

Responde en español, de forma concisa y práctica. Da números específicos cuando sea posible.
Si te proporcionan datos del contexto, úsalos para personalizar tu análisis.`;

export async function POST(request: NextRequest) {
    try {
        const { message, context } = await request.json();

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({
                response: "⚠️ API Key de Gemini no configurada. Añade GEMINI_API_KEY a tu archivo .env"
            });
        }

        // Build context from monthly data if available
        let contextPrompt = "";
        if (context) {
            const t = context.totals || {};
            const avg = context.averages || {};
            contextPrompt = `
DATOS DEL MES ACTUAL:
- Inversión en Ads: €${t.spendAds?.toLocaleString('es-ES') || 0}
- Revenue Confirmado: €${t.revenueConfirmed?.toLocaleString('es-ES') || 0}
- Revenue Real (entregado): €${t.revenueReal?.toLocaleString('es-ES') || 0}
- Beneficio Neto: €${t.netProfit?.toLocaleString('es-ES') || 0}
- Pedidos: ${t.orders || 0}
- Visitantes: ${t.visitors || 0}
- Confirmados: ${t.confirmed || 0}
- Entregados: ${t.delivered || 0}
- Devueltos: ${t.returned || 0}
- ROAS Confirmado: ${avg.roasConfirmed?.toFixed(2) || 0}x
- Tasa de Entrega: ${avg.deliveryRate?.toFixed(1) || 0}%
- Margen de Beneficio: ${avg.profitPercentConfirmed?.toFixed(1) || 0}%
`;
        }

        const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [{ text: `${SYSTEM_PROMPT}\n\n${contextPrompt}\n\nPREGUNTA DEL USUARIO:\n${message}` }]
                }
            ],
            generationConfig: {
                maxOutputTokens: 500,
                temperature: 0.7
            }
        });

        const response = result.response.text();

        return NextResponse.json({ response });

    } catch (error: any) {
        console.error("[Finance Chat API] Error:", error);
        return NextResponse.json({
            response: "⚠️ Error al procesar tu consulta. " + (error.message || "Intenta de nuevo.")
        }, { status: 500 });
    }
}
