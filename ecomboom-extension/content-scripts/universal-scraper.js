/**
 * Universal Scraper for EcomBoom Extension
 * Detects large images and videos on any landing page or website.
 */

console.log("[EcomBoom] Universal Scraper Loaded");

// 1. Message listener to handle extraction from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extract_creative") {
        console.log("[UniversalScraper] Extracting creatives for project:", request.productId);

        // Find best assets (heuristics)
        const assets = detectHeroAssets();

        if (assets.length > 0) {
            const best = assets[0]; // Take the first best one for now
            console.log("[UniversalScraper] 🎯 Best candidate found:", best.url);

            // Send to background to be processed (API call)
            chrome.runtime.sendMessage({
                action: "save_competitor_creative",
                payload: {
                    url: best.url,
                    type: best.type,
                    productId: request.productId,
                    storeId: 'GLOBAL', // Default
                    meta: {
                        pageTitle: document.title,
                        pageUrl: window.location.href,
                        detectedIn: "UniversalScraper"
                    }
                }
            }, (response) => {
                sendResponse(response);
            });

            return true; // Keep async channel open
        } else {
            sendResponse({ success: false, error: "No clear creative detected" });
        }
    }
});

/**
 * Heuristics to find high-value assets on a page
 */
function detectHeroAssets() {
    const candidates = [];

    // Find all videos
    const videos = Array.from(document.querySelectorAll('video'));
    videos.forEach(v => {
        const src = v.currentSrc || v.src;
        if (src && src.startsWith('http')) {
            candidates.push({ url: src, type: 'VIDEO', score: v.offsetWidth * v.offsetHeight });
        }
    });

    // Find large images
    const images = Array.from(document.querySelectorAll('img'));
    images.forEach(img => {
        // High quality images usually have dimensions > 300px
        if (img.naturalWidth > 300 && img.naturalHeight > 300) {
            candidates.push({ url: img.src, type: 'IMAGE', score: img.naturalWidth * img.naturalHeight });
        }
    });

    // Sort by "value" (area)
    return candidates.sort((a, b) => b.score - a.score);
}

// 2. Hover logic for floating capture button
function injectUniversalCaptureUI() {
    if (document.getElementById('eb-universal-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'eb-universal-btn';
    btn.innerHTML = '🚀 Save';
    btn.style.display = 'none';

    const style = document.createElement('style');
    style.textContent = `
        #eb-universal-btn {
            position: absolute;
            z-index: 1000000;
            background: #0f172a;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
            font-family: 'Plus Jakarta Sans', sans-serif;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            transition: transform 0.2s;
        }
        #eb-universal-btn:hover {
            transform: scale(1.1);
            background: #1e293b;
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(btn);

    let currentTarget = null;

    document.addEventListener('mouseover', (e) => {
        const el = e.target;
        if (el.tagName === 'IMG' || el.tagName === 'VIDEO' || (el.tagName === 'DIV' && window.getComputedStyle(el).backgroundImage !== 'none')) {
            currentTarget = el;
            const rect = el.getBoundingClientRect();
            btn.style.top = `${rect.top + window.scrollY + 10}px`;
            btn.style.left = `${rect.left + window.scrollX + 10}px`;
            btn.style.display = 'block';
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (!btn.contains(e.target) && !currentTarget?.contains(e.target)) {
            btn.style.display = 'none';
        }
    });

    btn.onclick = () => {
        if (!currentTarget) return;
        const src = currentTarget.src || currentTarget.currentSrc || window.getComputedStyle(currentTarget).backgroundImage.slice(4, -1).replace(/["']/g, '');
        const type = (currentTarget.tagName === 'VIDEO' || src.includes('.mp4')) ? 'VIDEO' : 'IMAGE';

        chrome.runtime.sendMessage({
            action: "save_competitor_creative",
            payload: {
                url: src,
                type: type,
                productId: 'PENDING', // Will use last_product_id in background
                meta: { source: "UniversalFloat" }
            }
        });

        btn.innerHTML = '✅ Saved';
        setTimeout(() => { btn.innerHTML = '🚀 Save'; }, 2000);
    };
}

injectUniversalCaptureUI();
