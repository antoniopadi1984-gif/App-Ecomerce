import fs from 'fs';
import path from 'path';
import { PDFParse } from 'pdf-parse';
import { prisma } from '../prisma';

export async function importGodTierPrompts() {
    const promptsDir = path.join(process.cwd(), 'docs/god-tier-prompts');

    if (!fs.existsSync(promptsDir)) {
        console.error(`Directory not found: ${promptsDir}`);
        return;
    }

    const files = fs.readdirSync(promptsDir).filter(f => f.endsWith('.pdf'));
    console.log(`Found ${files.length} PDF files to process.`);

    for (const file of files) {
        const filePath = path.join(promptsDir, file);
        const dataBuffer = fs.readFileSync(filePath);

        try {
            const parser = new PDFParse({ data: dataBuffer });
            const result = await parser.getText();
            let text = result.text;

            // Normalize newlines and spaces
            text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

            // TRUNCATION LOGIC: Cut off "Simulation" or "Example" sections to prevent AI confusion
            const exampleMarkers = [
                'STEP 7: FINAL DELIVERABLE',
                'Simulation based on',
                'Example Avatar',
                'Primary desires: "Find what finally works"',
                'CAT WATER FOUNTAINS'
            ];

            for (const marker of exampleMarkers) {
                if (text.includes(marker)) {
                    const parts = text.split(marker);
                    text = parts[0] + "\n\n[TRUNCATED: EXAMPLE REMOVED]";
                    break;
                }
            }

            // NEW SANITIZATION: Remove newlines inside placeholders like [PRODUCT\nCATEGORY]
            text = text.replace(/\[([^\]]+)\]/g, (match, content) => {
                return `[${content.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()}]`;
            });

            // Normalize spacing
            text = text.replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n');

            // Normalize newlines and spaces
            text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

            // NEW SANITIZATION: Remove newlines inside placeholders like [PRODUCT\nCATEGORY]
            text = text.replace(/\[([^\]]+)\]/g, (match, content) => {
                return `[${content.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()}]`;
            });

            // Normalize spacing
            text = text.replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n');

            // Extract title/category from first few lines or filename
            const firstLines = text.split('\n').slice(0, 10).join('\n');
            const titleMatch = firstLines.match(/PROMPT\s+#?\d*:\s+([^\n]+)/i);
            const name = titleMatch ? titleMatch[1].trim() : file.replace('.pdf', '');

            // Determine modelTarget (heuristic: mostly GEMINI for research, CLAUDE for copy)
            const modelTarget = (text.toLowerCase().includes('claude') || text.toLowerCase().includes('copywriter')) ? 'CLAUDE' : 'GEMINI';

            // Identify placeholders like [VARIABLE]
            const placeholderRegex = /\[([A-Z\s_0-9]{3,})\]/g;
            const placeholders = Array.from(new Set(Array.from(text.matchAll(placeholderRegex)).map((m: any) => m[1])));

            // Category detection (More specific first)
            let category = 'RESEARCH';
            const lowerText = text.toLowerCase();
            const lowerFile = file.toLowerCase();

            if (lowerText.includes('voice of customer') || lowerText.includes('voc') || lowerFile.includes('voc')) {
                category = 'VOC';
            } else if (lowerText.includes('consciencia') || lowerText.includes('awareness') || lowerFile.includes('awareness')) {
                category = 'AWARENESS';
            } else if (lowerText.includes('avatar') || lowerFile.includes('avatar')) {
                category = 'AVATAR';
            } else if (lowerText.includes('angulo') || lowerText.includes('angle') || lowerFile.includes('angle')) {
                category = 'ANGLE';
            } else if (lowerText.includes('creative brief') || lowerFile.includes('creative')) {
                category = 'CREATIVE';
            } else if (lowerText.includes('copia') || lowerText.includes('copy') || lowerFile.includes('copy')) {
                category = 'COPY';
            }

            let finalContent = text;
            if (category === 'VOC') {
                finalContent += "\n\nSTRUCTURE REQUIREMENT: You MUST include:\n1. EXECUTIVE SUMMARY\n2. KEYWORD FREQUENCY ANALYSIS (frequencies/intensity)\n3. SURFACE DESIRE RANKINGS (Primary/Secondary Table)\n4. EMOTIONAL DRIVER RANKINGS\n5. EMOTION-TO-SURFACE MAPPING (3 drivers for 10 desires)\n6. PRODUCT REQUIREMENTS LOG (Not desires).\n\nCRITICAL: Use literal quotes and forum citations. Focus on 'unfiltered' insights.";
            } else if (category === 'AVATAR') {
                finalContent += "\n\nSTRUCTURE REQUIREMENT: Include:\n1. AVATAR TARGETING STATEMENTS\n2. NATURAL DESIRE-BASED SEGMENTS\n3. AVATAR MATRIX.";
            } else if (category === 'AWARENESS' || category === 'ANGLE') {
                finalContent += "\n\nINSTRUCTION: Build directly on the preceding analysis. Every claim must be backed by the 'Truth Layer' extracted in previous phases. Demand high density of specific information.";
            }

            await (prisma as any).promptTemplate.upsert({
                where: { name },
                update: {
                    content: finalContent,
                    modelTarget,
                    placeholders: JSON.stringify(placeholders),
                    category,
                    version: 1
                },
                create: {
                    name,
                    content: finalContent,
                    modelTarget,
                    placeholders: JSON.stringify(placeholders),
                    category,
                    version: 1
                }
            });

            console.log(`Imported template: ${name} [${category}] with ${placeholders.length} placeholders.`);
        } catch (error) {
            console.error(`Error processing ${file}:`, error);
        }
    }
}
