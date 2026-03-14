export const CREATIVE_CONCEPTS = [
    {
        id: 1, code: 'C1', name: 'Problema',
        description: 'Identificar y agitar el dolor exacto del avatar',
        traffic: ['COLD'],
        awareness: [1, 2],
        driveFolder: 'C1_Problema'
    },
    {
        id: 2, code: 'C2', name: 'Falsa_Solucion',
        description: 'Por qué lo que han probado no funciona — errores, mitos, riesgos',
        traffic: ['COLD', 'WARM'],
        awareness: [2, 3],
        driveFolder: 'C2_Falsa_Solucion'
    },
    {
        id: 3, code: 'C3', name: 'Mecanismo',
        description: 'Por qué SÍ funciona — el mecanismo único del producto',
        traffic: ['WARM'],
        awareness: [3],
        driveFolder: 'C3_Mecanismo'
    },
    {
        id: 4, code: 'C4', name: 'Prueba',
        description: 'Testimonios, demos, resultados reales, UGC auténtico',
        traffic: ['WARM', 'HOT_RETARGET'],
        awareness: [3, 4],
        driveFolder: 'C4_Prueba'
    },
    {
        id: 5, code: 'C5', name: 'Autoridad',
        description: 'Experto, estudio, credencial, comparativa directa',
        traffic: ['WARM', 'HOT_RETARGET'],
        awareness: [4],
        driveFolder: 'C5_Autoridad'
    },
    {
        id: 6, code: 'C6', name: 'Historia',
        description: 'Narrativa personal de transformación — shock, revelación',
        traffic: ['COLD', 'WARM'],
        awareness: [1, 2, 3],
        driveFolder: 'C6_Historia'
    },
    {
        id: 7, code: 'C7', name: 'Identidad',
        description: 'Lifestyle, aspiracional, estatus, pertenencia, futuro ideal',
        traffic: ['HOT_RETARGET'],
        awareness: [4, 5],
        driveFolder: 'C7_Identidad'
    },
    {
        id: 8, code: 'C8', name: 'Resultado',
        description: 'Before/after, transformación completa, resultado final visual',
        traffic: ['HOT_RETARGET'],
        awareness: [4, 5],
        driveFolder: 'C8_Resultado'
    },
    {
        id: 9, code: 'C9', name: 'Oferta',
        description: 'CTA directo con oferta fuerte, urgencia, escasez',
        traffic: ['HOT_RETARGET'],
        awareness: [5],
        driveFolder: 'C9_Oferta'
    },
] as const;

export const AWARENESS_LEVELS = [
    { level: 1, name: 'Unaware',        folder: '1_Unaware' },
    { level: 2, name: 'Problem_Aware',  folder: '2_Problem_Aware' },
    { level: 3, name: 'Solution_Aware', folder: '3_Solution_Aware' },
    { level: 4, name: 'Product_Aware',  folder: '4_Product_Aware' },
    { level: 5, name: 'Most_Aware',     folder: '5_Most_Aware' },
] as const;

export const TRAFFIC_TEMPS = [
    { id: 'COLD',        folder: 'COLD',        awareness: [1, 2] },
    { id: 'WARM',        folder: 'WARM',        awareness: [2, 3] },
    { id: 'HOT_RETARGET',folder: 'HOT_RETARGET',awareness: [4, 5] },
] as const;

// Nomenclatura: [SKU]-[C1-C9]-V[N].[ext]
export function buildNomenclature(params: {
    sku: string;
    concept: string;   // 'C1', 'C2'... 'C9'
    version: number;
    ext: string;
}): string {
    return `${params.sku}-${params.concept}-V${params.version}.${params.ext}`;
}
// Ejemplo: MICR-C1-V1.mp4

// Ruta Drive: [C1_Problema]/[COLD]/[2_Problem_Aware]/
export function getDrivePath(params: {
    concept: string;   // 'C1'
    traffic: string;   // 'COLD'
    awareness: number; // 2
}): string {
    const c = CREATIVE_CONCEPTS.find(x => ((x as any).code === params.concept));
    const a = AWARENESS_LEVELS.find(x => x.level === params.awareness);
    const t = TRAFFIC_TEMPS.find(x => x.id === params.traffic);
    if (!c || !a || !t) return 'INBOX';
    return `${c.driveFolder}/${t.folder}/${a.folder}`;
}
// Ejemplo: C1_Problema/COLD/2_Problem_Aware/
