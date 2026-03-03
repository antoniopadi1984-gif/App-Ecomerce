function extractTikTokAds() {
    // TikTok specific selectors for the CC Library
    const ads = document.querySelectorAll('.cc-ad-card, .video-card');

    return Array.from(ads).map(card => {
        const videoEl = card.querySelector('video');
        const title = card.querySelector('.title, .ad-title')?.innerText;

        return {
            type: "video",
            videoUrl: videoEl?.src,
            title,
            source: "tiktok"
        };
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extract_tiktok_all") {
        const data = extractTikTokAds();
        sendResponse({ success: true, count: data.length, data });
    }
});
