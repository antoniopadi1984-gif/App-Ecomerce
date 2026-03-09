/**
 * IA Pro (ex-Spencer) Creative Nomenclature Utility
 * Rule: [BRAND]_[CONCEPTO]_[ANGULO]_[VERSION]
 */

export function generateCreativeName({
    brand,
    conceptCode,
    angle,
    version = 1
}: {
    brand: string,
    conceptCode: string, // e.g. CONC01
    angle: string,
    version?: number
}) {
    const cleanBrand = brand.toUpperCase().replace(/\s+/g, '');
    const cleanConcept = conceptCode.toUpperCase();
    const cleanAngle = angle.toUpperCase().replace(/\s+/g, '_');
    const cleanVersion = `V${String(version).padStart(2, '0')}`;

    return `${cleanBrand}_${cleanConcept}_${cleanAngle}_${cleanVersion}`;
}

/**
 * Retargeting naming conventions
 */
export const RETARGETING_SUBFOLDERS = {
    DIRECTO: 'R10_COPY_DIRECTO',
    PROBLEMA: 'R20_COPY_PROBLEMA',
    STORY: 'R30_COPY_STORY'
};
