function extractMetaAds() {
    const ads = document.querySelectorAll('[data-testid="ad-card"], .x1qjc9v5');

    return Array.from(ads).map(card => {
        // Vídeo
        const videoEl = card.querySelector('video');
        const videoUrl = videoEl?.src || videoEl?.querySelector('source')?.src;

        // Imagen
        const imageEl = card.querySelector('img[src*="fbcdn"]');

        // Copy
        const body = card.querySelector('[data-testid="ad-body"]')?.innerText;
        const headline = card.querySelector('[data-testid="ad-headline"]')?.innerText;
        const cta = card.querySelector('[data-testid="ad-cta"]')?.innerText;

        // Fecha inicio
        const startDate = card.querySelector('.startDate, [class*="start"]')?.innerText;

        // Formato
        const isVideo = !!videoEl;
        const isCarousel = card.querySelectorAll('img[src*="fbcdn"]').length > 1;

        return {
            type: isVideo ? "video" : isCarousel ? "carousel" : "image",
            videoUrl,
            imageUrls: Array.from(card.querySelectorAll('img[src*="fbcdn"]')).map(i => i.src),
            copyBody: body,
            headline,
            cta,
            startDate,
            source: "meta"
        };
    });
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function scrollAndExtractAll() {
    let lastCount = 0;
    while (true) {
        window.scrollTo(0, document.body.scrollHeight);
        await sleep(2000);
        const current = document.querySelectorAll('[data-testid="ad-card"]').length;
        if (current === lastCount) break;  // no hay más
        lastCount = current;
    }
    return extractMetaAds();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extract_meta_all") {
        scrollAndExtractAll().then(data => {
            console.log("Meta Extracted Data:", data);
            sendResponse({ success: true, count: data.length, data });
        });
        return true; // Keep message channel open for async
    }
});
