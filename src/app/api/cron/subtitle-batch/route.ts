import { NextRequest, NextResponse } from 'next/server';
import { runBatchSubtitleProcessor } from '@/lib/video/batch-subtitle-processor';

export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * GET /api/cron/subtitle-batch
 * 
 * Query params:
 *   storeId  — process only this store (optional, all stores if omitted)
 *   limit    — max videos per run (default: 20)
 *   concurrency — parallel workers (default: 3)
 * 
 * Auth: Bearer CRON_SECRET header
 */
export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const storeId     = searchParams.get('storeId') || undefined;
    const limit       = parseInt(searchParams.get('limit') || '20', 10);
    const concurrency = parseInt(searchParams.get('concurrency') || '3', 10);

    console.log(`[CronSubtitleBatch] Starting — storeId=${storeId ?? 'ALL'}, limit=${limit}, concurrency=${concurrency}`);

    try {
        const results = await runBatchSubtitleProcessor({ storeId, limit, concurrency });

        const ok      = results.filter(r => r.status === 'ok').length;
        const errors  = results.filter(r => r.status === 'error').length;
        const skipped = results.filter(r => r.status === 'skipped').length;

        console.log(`[CronSubtitleBatch] Done — ok=${ok}, errors=${errors}, skipped=${skipped}`);

        return NextResponse.json({
            ok: true,
            processed: ok,
            errors,
            skipped,
            results
        });
    } catch (err: any) {
        console.error('[CronSubtitleBatch] Fatal error:', err.message);
        return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
    }
}
