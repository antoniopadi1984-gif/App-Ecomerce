import { jsPDF } from "jspdf";
import { askGemini } from "./ai";
import fs from "fs";
import path from "path";

/**
 * EBOOK MAESTRO: Generador de Contenido de Valor
 * Genera guías, ebooks y almanaques automáticos con IA para fidelizar clientes.
 */

export interface EbookRequest {
    title: string;
    productName: string;
    theme: string;
    targetAudience: string;
    tone: 'EDUCA' | 'INSPIRE' | 'SELL' | 'FUN';
}

export async function generateEbookPDF(req: EbookRequest) {
    try {
        console.log(`[EBOOK] Generando contenido para: ${req.title}...`);

        // 1. Generate Content with Gemini
        const prompt = `
            Actúa como un Autor Best-Seller y Experto en Marketing de Respuesta Directa.
            Tu objetivo es crear el contenido para un EBOOK/GUÍA MAESTRA de altísimo valor que será el imán de fidelización para clientes que compraron "${req.productName}".
            
            DETALLES:
            TITULO: ${req.title}
            TEMA: ${req.theme}
            PÚBLICO: ${req.targetAudience}
            TONO: ${req.tone} (Prioriza la autoridad y el beneficio tangible)
            
            ESTRUCTURA OBLIGATORIA (Aporta valor REAL, no generalidades):
            1. INTRODUCCIÓN DISRUPTIVA: Rompe el patrón y explica por qué esta guía es vital. (250 palabras)
            2. CAPÍTULO 1: LA CIENCIA TRAS EL ÉXITO: Detalles técnicos y prácticos sobre ${req.theme}. (400 palabras)
            3. CAPÍTULO 2: IMPLEMENTACIÓN MÉTODO MAESTRO: Pasos exactos A-B-C para dominarlo. (400 palabras)
            4. CAPÍTULO 3: ERRORES FATALES Y CÓMO EVITARLOS: Lo que nadie dice. (400 palabras)
            5. TRUCO "NANO BANANA": Un secreto de "insider" exclusivo relacionado con ${req.productName} que duplica sus resultados.
            6. CIERRE ESTRATÉGICO: Llamada a la acción hacia la comunidad y fidelización total.
            
            FORMATO CRÍTICO:
            Usa marcadores exactos: [TITULO], [INTRO], [CAP1], [CAP2], [CAP3], [TRUCO], [CIERRE].
            No incluyas texto fuera de estos bloques. Usa un lenguaje magnético, profesional y cargado de valor técnico.
        `;

        const aiResponse = await askGemini(prompt);
        const content = aiResponse.text;
        if (!content) throw new Error("No se pudo generar el contenido con IA.");

        // 2. Setup PDF Generation
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        const margin = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let yPos = 30;

        // Custom Styles
        const applyTitleStyle = () => {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(24);
            doc.setTextColor(5, 6, 15); // Dark Blue Nano Banana
        };

        const applyHeaderStyle = () => {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.setTextColor(79, 70, 229); // Indigo
        };

        const applyBodyStyle = () => {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(11);
            doc.setTextColor(60, 60, 60);
        };

        // --- COVER PAGE ---
        doc.setFillColor(5, 6, 15);
        doc.rect(0, 0, pageWidth, 40, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text("GUÍA EXCLUSIVA NANO BANANA MAESTRO", pageWidth / 2, 20, { align: "center" });

        yPos = 80;
        applyTitleStyle();
        const titleLines = doc.splitTextToSize(req.title.toUpperCase(), pageWidth - 40);
        doc.text(titleLines, pageWidth / 2, yPos, { align: "center" });

        yPos += 40;
        doc.setFontSize(12);
        doc.setTextColor(150, 150, 150);
        doc.text(`Creado para la comunidad de ${req.productName}`, pageWidth / 2, yPos, { align: "center" });

        doc.addPage();
        yPos = 30;

        // --- CONTENT PARSING & WRITING ---
        const sections = content.split(/\[(.*?)\]/g);

        for (let i = 1; i < sections.length; i += 2) {
            const sectionName = sections[i];
            const sectionContent = sections[i + 1]?.trim();

            if (!sectionContent) continue;

            // Header
            applyHeaderStyle();
            doc.text(sectionName, margin, yPos);
            yPos += 10;

            // Body
            applyBodyStyle();
            const lines = doc.splitTextToSize(sectionContent, pageWidth - (margin * 2));

            for (const line of lines) {
                if (yPos > pageHeight - 20) {
                    doc.addPage();
                    yPos = 20;
                }
                doc.text(line, margin, yPos);
                yPos += 6;
            }
            yPos += 15;
        }

        // 3. Save PDF
        const outputDir = path.join(process.cwd(), "public", "outputs", "ebooks");
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        const filename = `ebook_${Date.now()}.pdf`;
        const filepath = path.join(outputDir, filename);

        const buffer = Buffer.from(doc.output("arraybuffer"));
        fs.writeFileSync(filepath, buffer);

        return {
            success: true,
            url: `/outputs/ebooks/${filename}`,
            filename
        };

    } catch (e: any) {
        console.error("[EBOOK ERROR]", e);
        return { success: false, error: e.message };
    }
}
