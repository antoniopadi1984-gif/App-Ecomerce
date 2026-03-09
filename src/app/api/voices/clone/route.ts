import { NextRequest, NextResponse } from 'next/server';
import { ElevenLabsService } from '@/lib/services/elevenlabs-service';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;

        if (!file || !name) {
            return NextResponse.json({ success: false, error: 'File and name required' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const voiceId = await ElevenLabsService.addVoice(name, description || '', [{ buffer, name: file.name }]);

        return NextResponse.json({ success: true, voiceId });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
