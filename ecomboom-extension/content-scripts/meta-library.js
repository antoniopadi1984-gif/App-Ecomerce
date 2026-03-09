/**
 * Advanced Meta Ad Library Scraper for EcomBoom
 * Specialized in deep extraction of ad cards, including multiple versions and full page scanning.
 */

console.log("[EcomBoom] Advanced Meta Scraper Loaded");

// 1. Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extract_creative") {
        captureActiveAd(request.productId, sendResponse);
        return true;
    }

    if (request.action === "scan_advertiser_library") {
        scanFullLibrary(request.productId, sendResponse);
        return true;
    }
});

// 2. Initial setup: Inject floating buttons into Meta Library
function injectEcomBoomUI() {
    // Only inject if not already there
    if (document.getElementById('ecomboom-float-btn')) return;

    const floatBtn = document.createElement('div');
    floatBtn.id = 'ecomboom-float-btn';
    floatBtn.innerHTML = `
        <div class="ecomboom-glow"></div>
        <button class="eb-main-btn">🚀 Spy Ad</button>
    `;

    // Minimal styles for the float button
    const style = document.createElement('style');
    style.textContent = `
        #ecomboom-float-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            z-index: 999999;
            filter: drop-shadow(0 4px 12px rgba(0,0,0,0.15));
        }
        .eb-main-btn {
            background: #0f172a;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 30px;
            font-weight: 800;
            font-family: 'Plus Jakarta Sans', sans-serif;
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
        }
        .eb-main-btn:hover {
            transform: scale(1.05) translateY(-2px);
            background: #1e293b;
        }
        .ecomboom-glow {
            position: absolute;
            inset: -5px;
            background: linear-gradient(45deg, #0f172a, #1877F2);
            border-radius: 40px;
            filter: blur(10px);
            opacity: 0.3;
            z-index: -1;
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(floatBtn);

    floatBtn.onclick = () => {
        chrome.runtime.sendMessage({ action: "open_popup_with_context", platform: "meta" });
    };
}

// Initial Scan
injectEcomBoomUI();

/**
 * Capture the most prominent ad card currently in view
 */
function captureActiveAd(productId, sendResponse) {
    const cards = Array.from(document.querySelectorAll('div[role="region"]'));
    if (cards.length === 0) {
        sendResponse({ success: false, error: "No ad cards found" });
        return;
    }

    // Heuristic: Find first active card with a video or image
    for (const card of cards) {
        const video = card.querySelector('video');
        const img = card.querySelector('img[src*="ad_creative"]');

        if (video && video.src && !video.src.startsWith('blob')) {
            reportAsset(video.src, 'VIDEO', card, productId, sendResponse);
            return;
        } else if (img && img.src) {
            reportAsset(img.src, 'IMAGE', card, productId, sendResponse);
            return;
        }
    }

    sendResponse({ success: false, error: "No clear creative source found in active cards" });
}

function reportAsset(url, type, card, productId, sendResponse) {
    chrome.runtime.sendMessage({
        action: "save_competitor_creative",
        payload: {
            url,
            type,
            productId,
            meta: {
                platform: "META",
                adCopy: card.innerText.slice(0, 500),
                timestamp: new Date().toISOString()
            }
        }
    }, (response) => {
        sendResponse(response);
    });
}

/**
 * Experimental: Multi-ad scanner for Meta Library
 * Automatically scrolls and captures every ad for a specific advertiser.
 */
async function scanFullLibrary(productId, sendResponse) {
    console.log("[MetaScraper] 🚀 Starting heavy library spy job...");

    // Identify advertiser name
    const advertiserName = document.title.split('|')[0].trim();
    let adsFound = 0;
    let lastHeight = 0;

    // Initial response to notify starting
    sendResponse({ success: true, status: "SCANNING", advertiser: advertiserName });

    // Scrolling loop to reveal all ads
    while (true) {
        const currentHeight = document.body.scrollHeight;
        if (currentHeight === lastHeight) break; // Reached bottom or no more loading

        lastHeight = currentHeight;
        window.scrollTo(0, currentHeight);

        // Wait for potential Lazy Loading
        await new Promise(r => setTimeout(r, 2000));

        // Find visible cards
        const cards = Array.from(document.querySelectorAll('div[role="region"]'));

        for (const card of cards) {
            // Check if we already processed this card
            if (card.dataset.ecomboomProcessed) continue;

            const video = card.querySelector('video');
            const img = card.querySelector('img[src*="ad_creative"]');

            if (video && video.src && !video.src.startsWith('blob')) {
                reportBackgroundAsset(video.src, 'VIDEO', card, productId);
                adsFound++;
            } else if (img && img.src) {
                reportBackgroundAsset(img.src, 'IMAGE', card, productId);
                adsFound++;
            }

            card.dataset.ecomboomProcessed = "true";
        }

        console.log(`[MetaScraper] Progress: ${adsFound} ads detected...`);

        // Safety break if it's too many (e.g. 200+)
        if (adsFound > 200) break;
    }

    console.log(`[MetaScraper] ✅ Finished! Total ads spied: ${adsFound}`);
}

function reportBackgroundAsset(url, type, card, productId) {
    chrome.runtime.sendMessage({
        action: "save_competitor_creative",
        payload: {
            url,
            type,
            productId,
            meta: {
                platform: "META_BULK",
                adCopy: card.innerText.slice(0, 500)
            }
        }
    });
}
