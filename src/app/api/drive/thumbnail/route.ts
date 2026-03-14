import { NextRequest, NextResponse } from 'next/server';
import { getDriveClient } from '@/lib/services/drive-service';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) return new NextResponse('Missing fileId', { status: 400 });

    try {
        const drive = await getDriveClient();
        const res = await drive.files.get({
            fileId,
            fields: 'thumbnailLink',
            supportsAllDrives: true
        });

        const thumbnailLink = res.data.thumbnailLink;
        if (!thumbnailLink) return new NextResponse('No thumbnail found', { status: 404 });

        // Fetch the actual image from Google (short-lived link) and stream it back
        const imageRes = await fetch(thumbnailLink);
        const imageBuffer = await imageRes.arrayBuffer();

        return new NextResponse(imageBuffer, {
            headers: {
                'Content-Type': imageRes.headers.get('Content-Type') || 'image/jpeg',
                'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
            },
        });
    } catch (error: any) {
        console.error('[DriveThumbnailProxy] Error:', error.message);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
