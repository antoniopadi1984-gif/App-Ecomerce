import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { productId, conceptId, hookText, avatarId, formato, duracion, oferta, fase, framework, idioma } = body;

        if (!productId || !conceptId || !hookText) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // Fetch product and concept details
        const product: any = await prisma.product.findUnique({
            where: { id: productId }
        });

        const concept: any = await prisma.concept.findUnique({
            where: { id: conceptId }
        });

        if (!product || !concept) {
            return NextResponse.json({ error: 'Product or concept not found' }, { status: 404 });
        }

        const positioning = product.agentDescription || 'N/A';
        const angle = concept.angle || concept.hypothesis || 'N/A';
        const sku = product.sku || product.handle || 'PROD';
        const concNum = concept.number ? String(concept.number).padStart(2, '0') : '01';

        let faseShort = 'C';
        if (fase === 'TEMPLADO') faseShort = 'W';
        if (fase === 'CALIENTE') faseShort = 'H';
        if (fase === 'RETARGETING') faseShort = 'R';

        const nomenclature = `${sku}-C${concNum}-${faseShort}-V1`;

        const prompt = `
        Eres IA IA, un experto en guionización de vídeos publicitarios de alto impacto para E-commerce.
        Genera un guion de vídeo completo siguiendo el framework: ${framework}.

        DATOS DEL PRODUCTO: ${product.title}
        POSICIONAMIENTO: ${positioning}
        ÁNGULO: ${angle}
        HOOK INICIAL: ${hookText}
        OFERTA: ${oferta}
        DURACIÓN OBJETIVO: ${duracion}
        FORMATO: ${formato}
        FASE: ${fase}
        IDIOMA: ${idioma}

        ESTRUCTURA DE RESPUESTA:
        Responde ÚNICAMENTE con un objeto JSON (sin markdown) con esta estructura:
        {
          "nomenclatura": "${nomenclature}",
          "escenas": [
            {
              "idx": 1,
              "texto": "Audio para la escena...",
              "duracion": 3,
              "tipo": "HOOK",
              "broll_necesario": false,
              "emocion": "miedo",
              "musica_tipo": "tension"
            }
          ]
        }

        INSTRUCCIONES EXTRA:
        - El guion debe ser magnético y estar optimizado para retención.
        - Las escenas deben durar entre 2 y 5 segundos en promedio.
        - Indica si se necesita B-Roll (imágenes de apoyo) o si el avatar puede hablar solo.
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        const cleanJson = responseText.replace(/```json|```/g, '').trim();
        const scriptData = JSON.parse(cleanJson);

        return NextResponse.json(scriptData);

    } catch (error) {
        console.error('Error in script generation:', error);

        // Fallback
        return NextResponse.json({
            nomenclatura: "ERROR-V1",
            escenas: [
                { idx: 1, texto: "Error en la generación. Por favor reintenta.", duracion: 3, tipo: "HOOK", broll_necesario: false, emocion: "curiosidad", musica_tipo: "chill" }
            ]
        });
    }
}
