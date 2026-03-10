import { NextRequest, NextResponse } from 'next/server';
import { generateCopy } from '@/lib/replicate-client';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        
        const script = await generateCopy({
            task: 'script_avatar',
            productTitle: body.productTitle || '',
            productDescription: body.productDescription || '',
            angle: body.angle || body.concept || '',
            tone: body.tone || 'directo',
            language: body.language || 'es',
            extraContext: `Gancho: ${body.hook}. Oferta: ${body.offer}. Avatar: ${body.avatar}. ${body.extraContext || ''}`,
        });
        
        // Replicate function usually returns a formatted string or JSON. If it's pure string, we might need to mock parsing or maybe the result is ready to use. 
        // For backwards compatibility, ensure we return something in JSON that the UI expects or just output the text
        let result;
        try {
            result = typeof script === 'string' ? JSON.parse(script) : script;
        } catch {
            result = { script_master: script, escenas: [] };
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('[API Video Script] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
