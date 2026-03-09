/**
 * EcomBoom Download Manager
 * Logic for managing local asset downloads (e.g. from Meta Ad Library).
 */

export class DownloadManager {
    static async downloadActiveCreative(url, filename) {
        console.log(`[DownloadManager] Starting download of: ${url} as ${filename}`);

        try {
            const downloadId = await new Promise((resolve, reject) => {
                chrome.downloads.download({
                    url: url,
                    filename: `ecomboom/competitor/${filename}`,
                    conflictAction: 'uniquify',
                    saveAs: false
                }, (id) => {
                    if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
                    else resolve(id);
                });
            });

            console.log(`[DownloadManager] Download queued with ID: ${downloadId}`);
            return downloadId;
        } catch (err) {
            console.error("[DownloadManager] ❌ Download error:", err);
            throw err;
        }
    }

    /**
     * Captures current visible tab as screenshot
     */
    static async captureTab(tabId) {
        return new Promise((resolve, reject) => {
            chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(dataUrl);
                }
            });
        });
    }
}
