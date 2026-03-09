/**
 * Advanced TikTok Scraper for EcomBoom
 * Specialized in capturing current video or scanning entire profiles.
 */

console.log("[EcomBoom] Advanced TikTok Scraper Loaded");

// 1. Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extract_creative") {
        captureCurrentTikTok(request.productId, sendResponse);
        return true;
    }

    if (request.action === "scan_tiktok_profile") {
        scanTiktokProfile(request.productId, sendResponse);
        return true;
    }
});

/**
 * Automated Scan of entire TikTok profile
 * Scrolls and captures all video links to be analyzed in background.
 */
async function scanTiktokProfile(productId, sendResponse) {
    console.log("[TikTokScraper] 🚀 Profile spy started...");

    let lastHeight = 0;
    let itemsFound = 0;

    sendResponse({ success: true, status: "SCANNING_PROFILE" });

    while (true) {
        const currentHeight = document.body.scrollHeight;
        if (currentHeight === lastHeight) break;

        lastHeight = currentHeight;
        window.scrollTo(0, currentHeight);

        await new Promise(r => setTimeout(r, 2000));

        const items = document.querySelectorAll('div[data-e2e="user-post-item"]');

        for (const item of items) {
            if (item.dataset.ecomboomProcessed) continue;

            const link = item.querySelector('a');
            if (link && link.href) {
                chrome.runtime.sendMessage({
                    action: "save_competitor_creative",
                    payload: {
                        url: link.href,
                        type: 'VIDEO',
                        productId: productId,
                        meta: { platform: "TIKTOK_PROFILE", pageUrl: link.href }
                    }
                });
                itemsFound++;
            }
            item.dataset.ecomboomProcessed = "true";
        }

        console.log(`[TikTokScraper] Progress: ${itemsFound} items detected...`);
        if (itemsFound > 120) break;
    }

    console.log(`[TikTokScraper] ✅ Finished! Processed: ${itemsFound}`);
}

/**
 * Capture currently playing TikTok in view
 */
function captureCurrentTikTok(productId, sendResponse) {
    const video = document.querySelector('video');

    if (video && video.src) {
        chrome.runtime.sendMessage({
            action: "save_competitor_creative",
            payload: {
                url: video.src,
                type: 'VIDEO',
                productId: productId,
                meta: {
                    platform: "TIKTOK",
                    username: "@tiktok_user",
                    pageUrl: window.location.href
                }
            }
        }, (response) => {
            sendResponse(response);
        });
        return;
    }

    sendResponse({ success: false, error: "TikTok video not found in view" });
}
