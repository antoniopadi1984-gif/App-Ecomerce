import { NextRequest, NextResponse } from 'next/server';
import AdmZip from 'adm-zip';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('theme') as File;
        const productId = formData.get('productId') as string;

        if (!file) {
            return NextResponse.json({ ok: false, error: 'No se ha subido ningún archivo' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const zip = new AdmZip(buffer);
        const zipEntries = zip.getEntries();

        let settingsData: any = {};
        let branding = {
            colors: {
                primary: '#000000',
                secondary: '#ffffff',
                cta: '#000000',
                background: '#ffffff'
            },
            typography: {
                titles: 'Inter',
                body: 'Inter',
                baseSize: '16px'
            }
        };

        // --- 1. Buscar settings_data.json para extraer colores y fuentes del tema ---
        const settingsEntry = zipEntries.find(e => e.entryName === 'config/settings_data.json');

        if (settingsEntry) {
            try {
                settingsData = JSON.parse(settingsEntry.getData().toString('utf8'));
                const current = settingsData?.current || {};

                // Intentar mapear variables comunes de Shopify (Dawn y otros temas modernos)
                branding.colors.primary = current.color_accent_1 || current.colors_accent_1 || branding.colors.primary;
                branding.colors.secondary = current.color_accent_2 || current.colors_accent_2 || branding.colors.secondary;
                branding.colors.cta = current.color_button_background || current.colors_button_background || branding.colors.primary;
                branding.colors.background = current.color_background_1 || current.colors_background_1 || branding.colors.background;

                // Tipografías
                branding.typography.titles = (current.type_header_font_family || 'Inter').split(',')[0].replace(/'|"/g, '');
                branding.typography.body = (current.type_base_font_family || 'Inter').split(',')[0].replace(/'|"/g, '');
                branding.typography.baseSize = current.type_base_size ? `${current.type_base_size}px` : '16px';

            } catch (e) {
                console.error('Error parseando settings_data.json', e);
            }
        }

        // --- 2. Buscar Logo ---
        // Podríamos buscar en assets/, pero Shopify suele guardar el handle en settings_data.
        // Por ahora devolvemos los datos extraídos.

        return NextResponse.json({
            ok: true,
            branding
        });

    } catch (e: any) {
        console.error('[AnalyzeTheme] Error:', e);
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}
