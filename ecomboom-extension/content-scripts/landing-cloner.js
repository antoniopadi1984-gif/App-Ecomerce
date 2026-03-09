/**
 * EcomBoom Landing Page Cloner
 * Captures full landing page structure, assets and metadata.
 */

console.log("[EcomBoom] Landing Page Cloner Loaded");

// 1. Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "clone_landing") {
        console.log("[LandingCloner] Cloning current page for project:", request.productId);

        // Find all interesting landing assets (CSS/IMG/SVG)
        const assets = collectLandingAssets();

        // Trigger background to capture visible area screenshot
        chrome.runtime.sendMessage({
            action: "capture_full_page",
            productId: request.productId,
            payload: {
                title: document.title,
                url: window.location.href,
                assets: assets,
                html: document.documentElement.innerHTML.slice(0, 100000) // Buffer first 100kb
            }
        }, (response) => {
            if (response && response.success) {
                console.log("[LandingCloner] Clone successful, data sent to background");
            }
            sendResponse(response);
        });

        return true;
    }
});

/**
 * Depth extraction of a landing page
 */
function collectLandingAssets() {
    const assets = {
        images: [],
        stylesheets: [],
        fonts: []
    };

    // Stylesheets
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    links.forEach(l => assets.stylesheets.push(l.href));

    // Landing Images
    const imgs = document.querySelectorAll('img');
    imgs.forEach(i => {
        if (i.src && i.src.startsWith('http')) assets.images.push(i.src);
    });

    // Background images from CSS
    // This is expensive correctly, so we'll just capture a few hero ones
    const hero = document.querySelector('.hero, #hero, header, .banner');
    if (hero) {
        const bg = window.getComputedStyle(hero).backgroundImage;
        if (bg && bg.startsWith('url')) {
            const url = bg.slice(4, -1).replace(/["']/g, '');
            assets.images.push(url);
        }
    }

    return assets;
}
