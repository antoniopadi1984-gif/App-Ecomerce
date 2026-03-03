function extractLandingCopy() {
    const textNodes = [];
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let n;
    while (n = walk.nextNode()) {
        const text = n.textContent.trim();
        if (text.length > 20) {
            textNodes.push(text);
        }
    }
    return [{
        type: "copy",
        url: window.location.href,
        title: document.title,
        copyBody: textNodes.join('\n\n'),
        source: "landing"
    }];
}

function extractLandingFull() {
    return [{
        type: "landing_html",
        url: window.location.href,
        title: document.title,
        html: document.documentElement.outerHTML,
        source: "landing"
    }];
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extract_landing_copy") {
        const data = extractLandingCopy();
        sendResponse({ success: true, count: 1, data });
    } else if (request.action === "extract_landing_full") {
        const data = extractLandingFull();
        sendResponse({ success: true, count: 1, data });
    }
});
