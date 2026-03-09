import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { productId, conceptId, tipos, cantidad, fase, agresividad, idioma } = body;

        if (!productId || !conceptId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // Fetch product and concept details for the prompt
        const product: any = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                avatarResearches: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        const concept: any = await prisma.concept.findUnique({
            where: { id: conceptId }
        });

        if (!product || !concept) {
            return NextResponse.json({ error: 'Product or concept not found' }, { status: 404 });
        }

        const positioning = product.agentDescription || 'N/A';
        const research = product.avatarResearches?.[0];
        const avatarInfo = research ? `Deseos: ${research.desires}, Miedos: ${research.fears}, Sofisticación: ${research.sophistication}` : 'N/A';
        const angle = concept.angle || concept.hypothesis || 'N/A';

        const prompt = `
        Eres IA IA, un experto copywriter de respuesta directa especializado en E-commerce.
        Tu tarea es generar ${cantidad} ganchos (hooks) de vídeo de alto impacto para publicidad en redes sociales.
        
        PRODUCTO: ${product.title}
        POSICIONAMIENTO: ${positioning}
        AVATAR (Investigación): ${avatarInfo}
        CONCEPTO CREATIVO (Ángulo Maestro): ${angle}
        FASE DE TRÁFICO: ${fase}
        NIVEL DE AGRESIVIDAD: ${agresividad}/10
        IDIOMA: ${idioma}
        TIPOS SOLICITADOS: ${tipos.join(', ')}

        INSTRUCCIONES CRÍTICAS:
        - Aplica frameworks de: Alex Hormozi (100M Offers), Cashvertising (Drew Eric Whitman) y Breakthrough Advertising (Eugene Schwartz).
        - Ten en cuenta el nivel de sofisticación del mercado.
        - Los ganchos deben ser cortos, contundentes y provocar una reacción inmediata (Pattern Interrupt).
        - Formatea la respuesta EXACTAMENTE como un JSON array de objetos con las propiedades: id (string), text (string), type (string de los solicitados), phase (string "${fase}"), aggressiveness (number ${agresividad}).

        EJEMPLO DE SALIDA:
        [
            {"id": "h1", "text": "El error de 2 segundos que mata tu tasa de conversión.", "type": "Miedo", "phase": "${fase}", "aggressiveness": ${agresividad}}
        ]
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Clean the response if it has markdown formatting
        const cleanJson = responseText.replace(/```json|```/g, '').trim();
        const hooks = JSON.parse(cleanJson);

        return NextResponse.json({ hooks });

    } catch (error) {
        console.error('Error in hook generation:', error);

        // Mock fallback for development if API fails
        const mockHooks = Array.from({ length: 5 }).map((_, i) => ({
            id: `hook-mock-${Date.now()}-${i}`,
            text: `[FALLBACK] Gancho estratégico generado automáticamente por IA IA para el mercado en español.`,
            type: 'Estratégico',
            phase: 'FRÍO',
            aggressiveness: 7
        }));

        return NextResponse.json({ hooks: mockHooks });
    }
}
