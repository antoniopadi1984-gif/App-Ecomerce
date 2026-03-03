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

async function blobToBase64(blob) {
    return new Promise((resolve, _) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}

async function extractLandingFull() {
    // 1. HTML completo
    const html = document.documentElement.outerHTML;

    // 2. Todos los estilos CSS (inline + externos)
    const styles = Array.from(document.styleSheets).map(sheet => {
        try {
            return Array.from(sheet.cssRules).map(r => r.cssText).join('\n');
        } catch { return ''; }
    }).join('\n');

    // 3. Todas las imágenes → convertir a base64
    const images = await Promise.all(
        Array.from(document.querySelectorAll('img')).map(async img => {
            try {
                const response = await fetch(img.src);
                const blob = await response.blob();
                const base64 = await blobToBase64(blob);
                return { originalSrc: img.src, base64, alt: img.alt };
            } catch { return { originalSrc: img.src, base64: null, alt: img.alt }; }
        })
    );

    // 4. Copy extraído estructurado
    const copy = {
        title: document.title,
        h1: document.querySelector('h1')?.innerText,
        h2s: Array.from(document.querySelectorAll('h2')).map(h => h.innerText),
        paragraphs: Array.from(document.querySelectorAll('p')).map(p => p.innerText),
        ctas: Array.from(document.querySelectorAll('button, .cta, [class*="btn"]')).map(b => b.innerText),
        testimonials: Array.from(document.querySelectorAll('[class*="testimonial"], [class*="review"]')).map(t => t.innerText),
    };

    // 5. Screenshot via html2canvas (si la prop inyectada a window ya existe)
    let screenshotBase64 = null;
    if (window.html2canvas) {
        const screenshot = await window.html2canvas(document.body);
        screenshotBase64 = screenshot.toDataURL('image/jpeg', 0.85);
    }

    return [{
        type: "landing_html",
        url: window.location.href,
        title: document.title,
        html,
        styles,
        images,
        copy,
        screenshot: screenshotBase64,
        source: "landing"
    }];
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extract_landing_copy") {
        const data = extractLandingCopy();
        sendResponse({ success: true, count: 1, data });
    } else if (request.action === "extract_landing_full") {
        extractLandingFull().then(data => {
            sendResponse({ success: true, count: 1, data });
        });
        return true; // async
    }
});
