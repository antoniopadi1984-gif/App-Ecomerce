/**
 * EcomBoom Offscreen Document Script
 * Used for creating blob URLs from large fetches for the download manager.
 */

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.target !== 'offscreen') return;

    if (message.action === 'download_large_blob') {
        const { url, filename } = message.payload;
        try {
            console.log("[Offscreen] Starting large blob fetch:", url);
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            // Return blobUrl to background to be used in chrome.downloads
            sendResponse({ success: true, blobUrl });

            // Note: We need to revoke this later
            setTimeout(() => {
                URL.revokeObjectURL(blobUrl);
            }, 30000); // 30s buffer for download to start
        } catch (err) {
            console.error("[Offscreen] Download failed:", err);
            sendResponse({ success: false, error: err.message });
        }
        return true;
    }
});
