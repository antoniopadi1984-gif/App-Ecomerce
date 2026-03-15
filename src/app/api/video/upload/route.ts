import { NextRequest, NextResponse } from 'next/server';
import { BulkUploadPipeline } from '@/lib/creative/bulk-upload-pipeline';
import { VideoProcessingPipeline } from '@/lib/video/processing-pipeline';

export async function POST(req: NextRequest) {
 try {
 const formData = await req.formData();
 
// Support 'file' (generic) or 'video' (legacy) keys
const file = (formData.get('file') || formData.get('video')) as File;
 const productId = formData.get('productId') as string;
 const storeId = formData.get('storeId') as string;
 const isCompetitor = formData.get('isCompetitor') === 'true';

 if (!file || !productId || !storeId) {
 return NextResponse.json(
 { success: false, error: 'Missing file, productId or storeId' },
 { status: 400 }
 );
 }

 console.log(`[Upload API] Incoming file: ${file.name}
for product ${productId} (store: ${storeId})`);

 const arrayBuffer = await file.arrayBuffer();
 const buffer = Buffer.from(arrayBuffer);

 
// Run through the specialized IA pipeline
const result = await BulkUploadPipeline.processFile({
 buffer,
 fileName: file.name,
 productId,
 storeId,
 isCompetitor
 });

 if (!result.success) {
 return NextResponse.json(
 { success: false, error: result.error },
 { status: 500 }
 );
 }

 return NextResponse.json(result);
 }
catch (error: any) {
 console.error('[Upload API] Error:', error);
 return NextResponse.json(
 { success: false, error: error.message },
 { status: 500 }
 );
 }
}

/**
 * Batch upload multiple videos
 */
export async function PUT(req: NextRequest) {
 try {
 const formData = await req.formData();
 const productId = formData.get('productId') as string;

 if (!productId) {
 return NextResponse.json(
 { success: false, error: 'No productId provided' },
 { status: 400 }
 );
 }

 
// Get all video files
const videos: Array<{ buffer: Buffer; fileName: string }> = [];
 for (let i = 0;
formData.has(`video_${i}`); i++) {
 const file = formData.get(`video_${i}`) as File;
 const arrayBuffer = await file.arrayBuffer();
 videos.push({
 buffer: Buffer.from(arrayBuffer),
 fileName: file.name
 });
 }

 if (videos.length === 0) {
 return NextResponse.json(
 { success: false, error: 'No videos provided' },
 { status: 400 }
 );
 }

 console.log(`[Upload API] Batch processing: ${videos.length} videos`);

 const results = await VideoProcessingPipeline.processBatch(videos, productId);
 const successful = results.filter((r: any) => r.success);

 return NextResponse.json({
 success: true,
 total: results.length,
 successful: successful.length,
 failed: results.length - successful.length,
 videos: successful.map((r: any) => ({
 id: r.videoId,
 path: r.finalPath,
 concept: r.concept
 }))
 });
 }
catch (error: any) {
 console.error('[Upload API] Batch error:', error);
 return NextResponse.json(
 { success: false, error: error.message },
 { status: 500 }
 );
 }
}
