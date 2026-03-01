
import { JobHandler } from "../worker";
import { syncBeepingStatuses } from "../../app/pedidos/actions";

const logisticsSyncHandler: JobHandler = {
    handle: async (payload, onProgress, jobId) => {
        console.log("🚀 [Worker] Starting Automated Logistics Sync (Beeping API)...");

        await onProgress(10);

        // 'limit: 0' means full history or until API stops
        const storeId = payload.storeId as string || 'store-main';
        const priority = payload.priority ? 'high' : 'normal';
        const result = await syncBeepingStatuses(storeId, 0, priority);

        await onProgress(100);

        console.log(`✅ [Worker] Logistics Sync Completed: ${result?.message ?? 'done'}`);

        return result;
    }
};

export default logisticsSyncHandler;
