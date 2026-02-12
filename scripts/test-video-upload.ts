/**
 * REAL END-TO-END VIDEO UPLOAD TEST
 * Tests: Upload → Transcription → Classification → Drive Organization → Script Extraction
 */

import { prisma } from '../src/lib/prisma';
import { VideoProcessingPipeline } from '../src/lib/video/processing-pipeline';
import * as fs from 'fs/promises';
import * as path from 'path';

async function testVideoUpload() {
    console.log('\n🎬 ========== INICIO TEST VIDEO UPLOAD ==========\n');

    // 1. Get a product to test with
    const product = await prisma.product.findFirst({
        where: {
            storeId: { not: null },
            driveFolderId: { not: null } // Must have Drive structure created
        },
        select: { id: true, title: true, storeId: true, driveFolderId: true }
    });

    if (!product) {
        console.error('❌ No product found in database');
        return;
    }

    console.log(`✅ Testing with product: ${product.title} (${product.id})\n`);

    // 2. Create a small test video file (blank MP4)
    const testVideoPath = '/tmp/test_video.mp4';

    // Check if we have a real video to test with
    let videoBuffer: Buffer;
    let videoName: string;

    try {
        // Try to use a real video if it exists
        const realVideoPath = process.argv[2];
        if (realVideoPath && await fs.access(realVideoPath).then(() => true).catch(() => false)) {
            videoBuffer = await fs.readFile(realVideoPath);
            videoName = path.basename(realVideoPath);
            console.log(`✅ Using real video: ${videoName} (${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB)\n`);
        } else {
            console.log('⚠️  No real video provided. Usage: npm run test-video /path/to/video.mp4');
            console.log('⚠️  Creating minimal test file instead...\n');

            // Create minimal valid MP4 (just header, won't play but will test pipeline)
            videoBuffer = Buffer.from([
                0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70,
                0x69, 0x73, 0x6F, 0x6D, 0x00, 0x00, 0x02, 0x00
            ]);
            videoName = 'test_minimal.mp4';
        }
    } catch (error: any) {
        console.error('❌ Error loading video:', error.message);
        return;
    }

    // 3. Process through pipeline
    console.log('🔄 Processing through VideoProcessingPipeline...\n');
    console.log('Expected flow:');
    console.log('  1️⃣  Save to temp location');
    console.log('  2️⃣  Extract metadata with FFmpeg');
    console.log('  3️⃣  Transcribe with Gemini');
    console.log('  4️⃣  Classify with Advanced Classifier');
    console.log('  5️⃣  Organize in Drive');
    console.log('  6️⃣  Extract script');
    console.log('  7️⃣  Create DB entry\n');

    try {
        const result = await VideoProcessingPipeline.processVideo(
            videoBuffer,
            videoName,
            product.id
        );

        console.log('\n📊 ========== RESULTADO ==========\n');

        if (result.success) {
            console.log('✅ SUCCESS - Video procesado completamente');
            console.log(`   Video ID: ${result.videoId}`);
            console.log(`   Final Path: ${result.finalPath}`);
            console.log(`   Concept: ${result.concept}`);
            console.log(`   Script: ${result.script?.substring(0, 100) || 'N/A'}...`);

            // Verify DB entry
            const videoInDb = await prisma.video.findUnique({
                where: { id: result.videoId },
                select: {
                    title: true,
                    drivePath: true,
                    transcription: true,
                    stage: true,
                    awarenessLevel: true,
                    conceptType: true
                }
            });

            if (videoInDb) {
                console.log('\n✅ Video verified in database:');
                console.log(`   Title: ${videoInDb.title}`);
                console.log(`   Drive Path: ${videoInDb.drivePath || 'NOT SET'}`);
                console.log(`   Transcription: ${videoInDb.transcription ? 'YES' : 'NO'}`);
                console.log(`   Stage: ${videoInDb.stage || 'NOT SET'}`);
                console.log(`   Awareness: ${videoInDb.awarenessLevel || 'NOT SET'}`);
                console.log(`   Concept: ${videoInDb.conceptType || 'NOT SET'}`);
            }

            console.log('\n✅ ========== TEST PASÓ EXITOSAMENTE ==========\n');

        } else {
            console.log('❌ FAILED - Video processing failed');
            console.log(`   Error: ${result.error}`);
            console.log('\n❌ ========== TEST FALLÓ ==========\n');
        }

    } catch (error: any) {
        console.error('\n💥 ========== ERROR CRÍTICO ==========\n');
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
    }

    await prisma.$disconnect();
}

testVideoUpload();
