
// Estilos para el botón de guardado en las tarjetas de anuncios
const style = document.createElement('style');
style.textContent = `
    .ecom-save-btn {
        position: absolute !important;
        top: 15px !important;
        right: 15px !important;
        z-index: 2147483647 !important;
        background: #0f172a !important;
        color: white !important;
        border: 1px solid rgba(255,255,255,0.2) !important;
        padding: 8px 14px !important;
        border-radius: 12px !important;
        font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
        font-weight: 900 !important;
        font-size: 11px !important;
        text-transform: uppercase !important;
        letter-spacing: 0.05em !important;
        cursor: pointer !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.4), 0 8px 10px -6px rgba(0,0,0,0.4) !important;
        backdrop-filter: blur(8px) !important;
        pointer-events: auto !important;
        white-space: nowrap !important;
    }
    .ecom-save-btn:hover {
        background: #1e293b !important;
        transform: translateY(-2px) scale(1.02) !important;
        box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5) !important;
        border-color: rgba(255,255,255,0.4) !important;
    }
    .ecom-save-btn:active {
        transform: translateY(0) scale(0.98) !important;
    }
    .ecom-save-btn svg {
        width: 14px !important;
        height: 14px !important;
    }
`;
document.head.appendChild(style);

console.log('EcomFlow Spy v3.1: Motor Forense Ultra-Agresivo Iniciado');

const CONFIG = {
    selectors: [
        'div[data-testid="ad_library_card_container"]',
        'div.x1n2onr6.x1ja2u2z',
        'div[role="dialog"] div.x1n2onr6',
        '.css-1i5p66u', // TikTok
        '.ad-item',
        '[class*="AdCard"]'
    ],
    anchors: ['ID de la biblioteca', 'Library ID:', 'See ad details', 'Ver detalles del anuncio', 'Detalles del anuncio']
};

function injectButton(card) {
    if (card.querySelector('.ecom-save-btn')) return;

    // Forzar posición relativa para anclaje
    if (getComputedStyle(card).position === 'static') {
        card.style.position = 'relative';
    }

    const btn = document.createElement('button');
    btn.className = 'ecom-save-btn';
    btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
        <span>GUARDAR ECOMFLOW</span>
    `;

    btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const video = card.querySelector('video');
        const img = card.querySelector('img');

        let mediaUrl = "";
        let captureMethod = "direct";
        let mediaType = "IMAGE";

        if (video) {
            mediaType = "VIDEO";
            const source = video.querySelector('source')?.src;
            mediaUrl = source || video.src;

            // CASCADE STRATEGY
            if (mediaUrl.includes('.mp4')) {
                captureMethod = "direct";
            } else if (mediaUrl.startsWith('blob:')) {
                // If blob, check if we can find a data-url or similar
                const poster = video.getAttribute('poster');
                const dataUrl = video.getAttribute('data-video-url'); // TikTok sometimes has this
                mediaUrl = dataUrl || poster || mediaUrl;
                captureMethod = dataUrl ? "direct" : "stream"; // Mark as stream if only blob found
            } else if (mediaUrl.includes('.m3u8') || mediaUrl.includes('.mpd')) {
                captureMethod = "stream";
            } else {
                captureMethod = "capture"; // Fallback to screen recording request
            }
        } else if (img) {
            mediaUrl = img.src;
            captureMethod = "direct";
        }

        const advertiser = card.querySelector('strong, h4, [class*="AdvertiserName"], .x1heor9g')?.innerText || "Anunciante Detectado";
        const platform = window.location.hostname.includes('tiktok') ? 'TIKTOK' : 'META';

        chrome.runtime.sendMessage({
            action: 'quick_save',
            data: {
                url: mediaUrl,
                type: mediaType,
                title: advertiser,
                competitor: advertiser,
                platform: platform,
                captureMethod: captureMethod,
                metadata: {
                    sourceUrl: window.location.href,
                    capturedAt: new Date().toISOString(),
                    engine: "V4.0_CASCADE",
                    platform: platform,
                    captureMethod: captureMethod
                }
            }
        });

        btn.innerHTML = '<span>¡ORDEN ENVIADA! ✓</span>';
        btn.style.background = '#059669 !important';
        setTimeout(() => {
            btn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                <span>GUARDAR ECOMFLOW</span>
            `;
            btn.style.background = '#0f172a !important';
        }, 3000);
    };

    // Estrategia de Inyección: Arriba del todo o al final
    card.appendChild(btn);
}

function processAds() {
    // Escaneo por selectores conocidos
    CONFIG.selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
            if (el.offsetHeight > 80) injectButton(el);
        });
    });

    // Escaneo por anclas de texto (Forense)
    document.querySelectorAll('div, span, button').forEach(el => {
        if (el.children.length > 0) return;
        const text = el.innerText || "";
        if (CONFIG.anchors.some(anchor => text.includes(anchor))) {
            const card = el.closest('div[style*="background-color"]') ||
                el.closest('.x1n2onr6') ||
                el.closest('div[data-testid="ad_library_card_container"]') ||
                el.parentElement?.parentElement?.parentElement;
            if (card && card.offsetHeight > 80) injectButton(card);
        }
    });
}

// Observador de mutaciones para AJAX/Infinite Scroll
const observer = new MutationObserver((mutations) => {
    let shouldScan = false;
    for (const m of mutations) {
        if (m.addedNodes.length > 0) {
            shouldScan = true;
            break;
        }
    }
    if (shouldScan) processAds();
});

observer.observe(document.body, { childList: true, subtree: true });

// Escaneo inicial y periódico (seguridad)
processAds();
setInterval(processAds, 2500);
