function extractTikTokAds() {
    const cards = document.querySelectorAll('.creative-card, [class*="adCard"]');

    return Array.from(cards).map(card => {
        const videoEl = card.querySelector('video');
        const imageEl = card.querySelector('img');

        // TikTok a veces sirve webm
        const sources = Array.from(videoEl?.querySelectorAll('source') ?? []);
        const webmUrl = sources.find(s => s.type === "video/webm")?.src;
        const mp4Url = sources.find(s => s.type === "video/mp4")?.src;

        return {
            type: videoEl ? "video" : "image",
            videoUrl: mp4Url ?? webmUrl ?? videoEl?.src,
            webmUrl: webmUrl,
            imageUrl: imageEl?.src,
            format: webmUrl ? "webm" : (videoEl ? "mp4" : "image"),
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
