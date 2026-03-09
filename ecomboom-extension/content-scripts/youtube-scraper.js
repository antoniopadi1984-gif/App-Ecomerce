/**
 * YouTube Ad Scraper for EcomBoom
 */

console.log("[EcomBoom] YouTube Ad Scraper Loaded");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extract_creative") {
        const video = document.querySelector('video.video-stream');
        if (video && video.src) {
            chrome.runtime.sendMessage({
                action: "save_competitor_creative",
                payload: {
                    url: video.src,
                    type: 'VIDEO',
                    productId: request.productId,
                    storeId: 'GLOBAL',
                    meta: { platform: "YOUTUBE", pageUrl: window.location.href }
                }
            }, sendResponse);
            return true;
        } else {
            sendResponse({ success: false, error: "YouTube video not detected" });
        }
    }
});
