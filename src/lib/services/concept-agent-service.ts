import { prisma } from '@/lib/prisma';
import { GeminiProvider } from '@/lib/ai/providers/gemini';
import { NomenclatureService } from './nomenclature-service';
import { setupProductDrive, findOrCreateFolder, getDriveClient } from './drive-service';

export class ConceptAgentService {
    /**
     * Automatización central: Genera conceptos creativos usando IA
     * cuando se añade un producto nuevo.
     */
    static async generateConcepts(productId: string, storeId: string) {
        console.log(`[ConceptAgent] Iniciando generación para producto: ${productId}`);

        // 1. Recopilar contexto del producto
        const product = await (prisma as any).product.findUnique({
            where: { id: productId },
            include: { store: true }
        });

        if (!product) throw new Error("Producto no encontrado en la base de datos");

        // 2. Definir Prompts para Gemini 3.1 Pro
        const systemPrompt = `Eres un estratega creativo especializado en direct response y
performance marketing. Tu trabajo es crear conceptos creativos
para anuncios de Meta Ads siguiendo criterios de alto rendimiento:
ángulos específicos, niveles de consciencia del cliente, tipos de
hook probados, y estructuras que generan conversión siguiendo el método IA Pro (Spencer).

Para cada concepto debes definir:
- Tipo (MECANISMO / PROBLEMA / SOLUCIÓN / MIEDO / VERGÜENZA /
  PRUEBA / HISTORIA / COMPARATIVA / AUTORIDAD / IDENTIDAD /
  OFERTA / FALSA_SOLUCIÓN / ERROR / CURIOSIDAD)
- Nombre corto (máximo 3 palabras, descriptivo)
- Descripción del ángulo (1 frase)
- Nivel de consciencia objetivo (1-5)
- Fase de embudo (TOF / MOF / BOF)

Genera entre 6 y 10 conceptos variados que cubran distintos
ángulos y niveles de consciencia. Prioriza ángulos que no se
repitan entre sí.

Responde SOLO en JSON con este formato exacto:
{
  "concepts": [
    {
      "type": string,
      "name": string,
      "angle": string,
      "awarenessLevel": number,
      "funnelStage": string
    }
  ]
}`;

        const userPrompt = `
CONTEXTO DEL PRODUCTO:
Nombre: ${product.title}
Descripción: ${product.description || 'No especificada'}
Categoría: ${product.productType || 'Generica'}
PVP Estimado: ${product.price || '0'}
SKU Sugerido (si existe): ${product.sku || 'N/A'}
`;

        // 3. Llamar a Gemini vía Vertex AI
        const gemini = new GeminiProvider();
        const response = await gemini.invokeText({
            model: process.env.GEMINI_MODEL_PRODUCTION || 'gemini-2.5-pro',
            prompt: userPrompt,
            systemPrompt: systemPrompt,
            jsonSchema: true // Forzado a JSON
        });

        // 4. Parsear respuesta
        let responseData;
        try {
            // Limpiar posibles backticks si Gemini los añade
            const cleanJson = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
            responseData = JSON.parse(cleanJson);
        } catch (e) {
            console.error("[ConceptAgent] Error parseando JSON de Gemini:", response.text);
            throw new Error("Respuesta de IA no válida");
        }

        const concepts = responseData.concepts || [];

        // 5. Guardar conceptos en BD
        const savedConcepts = [];
        for (let i = 0; i < concepts.length; i++) {
            const raw = concepts[i];
            const saved = await (prisma as any).concept.create({
                data: {
                    productId,
                    storeId,
                    number: i + 1,
                    type: raw.type,
                    name: raw.name,
                    angle: raw.angle,
                    awarenessLevel: raw.awarenessLevel,
                    funnelStage: raw.funnelStage || 'TOF',
                    status: 'ACTIVO',
                    createdBy: 'AGENT'
                }
            });
            savedConcepts.push(saved);
        }

        // 6. Generar SKU automático único
        const uniqueSku = await NomenclatureService.generateProductSku({
            title: product.title,
            storeId: storeId
        });

        await (prisma as any).product.update({
            where: { id: productId },
            data: { sku: uniqueSku }
        });

        // 7. Crear estructura de carpetas en Drive siguiendo IA Pro
        try {
            // setupProductDrive now creates the full CENTRO_CREATIVO > ... structure
            await setupProductDrive(productId, storeId);

            const drive = await getDriveClient();
            const productWithDrive = await (prisma as any).product.findUnique({
                where: { id: productId },
                select: { driveRootPath: true }
            });

            if (productWithDrive?.driveRootPath) {
                const structure = JSON.parse(productWithDrive.driveRootPath);
                // Target: 2_CREATIVOS > 2_CREATIVOS
                const conceptosFolderId = structure.biblioteca?.conceptos;

                if (conceptosFolderId) {
                    for (let i = 0; i < savedConcepts.length; i++) {
                        const c = savedConcepts[i];
                        const folderName = `CONC_${String(c.number).padStart(2, '0')}_${c.name.toUpperCase().replace(/\s+/g, '')}`;
                        const conceptFolderId = await findOrCreateFolder(drive, folderName, conceptosFolderId);

                        // Internal structure for concept
                        await findOrCreateFolder(drive, "HOOKS", conceptFolderId);
                        await findOrCreateFolder(drive, "SCRIPTS", conceptFolderId);
                        const videosId = await findOrCreateFolder(drive, "VIDEOS_PROCESADOS", conceptFolderId);
                        await findOrCreateFolder(drive, "VERSIONES", videosId);
                    }
                }
            }
        } catch (driveError) {
            console.warn("[ConceptAgent] Error creando carpetas Drive IA Pro, pero los conceptos se guardaron:", driveError);
        }

        console.log(`[ConceptAgent] Proceso finalizado con éxito para ${productId}. SKU: ${uniqueSku}`);
        return {
            success: true,
            sku: uniqueSku,
            conceptsCreated: savedConcepts.length
        };
    }
}
