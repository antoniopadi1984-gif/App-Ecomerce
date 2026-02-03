
import { JobHandler } from "../worker";
import { syncBeepingStatuses } from "../../app/logistics/orders/actions";

const logisticsSyncHandler: JobHandler = {
    handle: async (payload, onProgress) => {
        console.log("🚀 [Worker] Starting Automated Logistics Sync (Beeping API)...");

        await onProgress(10);

        // We call the existing robust action
        // 'limit: 0' means full history or until API stops
        const result = await syncBeepingStatuses(0);

        await onProgress(100);

        console.log(`✅ [Worker] Logistics Sync Completed: ${result.message}`);

        return result;
    }
};

export default logisticsSyncHandler;
