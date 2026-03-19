/**
 * EcomBoom Intelligence — Meta Ads Library Scraper v2
 * Panel flotante premium con extracción completa de copy, métricas y assets
 */

console.log("[EcomBoom] Intelligence v2 Loaded");

const EB_COLOR = '#FF6B2B';
const EB_DARK = '#1a1a2e';

// ── PANEL FLOTANTE POR TARJETA ────────────────────────────────────────────
function extractAdData(card) {
    const video = card.querySelector('video');
    const images = Array.from(card.querySelectorAll('img')).filter(i =>
        i.src && !i.src.includes('profile') && !i.src.includes('avatar') && i.width > 100
    );

    // Copy del anuncio
    const allText = card.innerText || '';
    const lines = allText.split('\n').map(l => l.trim()).filter(l => l.length > 10);

    // Métricas Meta
    const impressionBadge = card.querySelector('[class*="impression"]') ||
        Array.from(card.querySelectorAll('span')).find(s => s.textContent.includes('impresion') || s.textContent.includes('impression'));

    const activeDate = Array.from(card.querySelectorAll('span,div')).find(el =>
        el.textContent.match(/en circulaci[oó]n|running since|started|activo/i)
    );

    const adCount = Array.from(card.querySelectorAll('span,div')).find(el =>
        el.textContent.match(/\d+\s*anuncios?|ads? use/i)
    );

    const platforms = Array.from(card.querySelectorAll('[aria-label*="Facebook"],[aria-label*="Instagram"],[aria-label*="Messenger"]'))
        .map(el => el.getAttribute('aria-label')).filter(Boolean);

    const advertiserEl = card.closest('[data-testid]')?.querySelector('a[href*="/ads"]') ||
        card.querySelector('strong, h3, [class*="advertiser"]');

    return {
        type: video ? 'VIDEO' : 'IMAGE',
        videoUrl: video?.src && !video.src.startsWith('blob') ? video.src : null,
        imageUrls: images.map(i => i.src).slice(0, 5),
        copy: lines.slice(0, 10).join('\n'),
        headline: lines[0] || '',
        adCopy: lines.slice(1, 4).join(' '),
        cta: lines[lines.length - 1] || '',
        impressionLevel: impressionBadge?.textContent?.trim() || '',
        activeDate: activeDate?.textContent?.trim() || '',
        adCount: adCount?.textContent?.trim() || '',
        platforms: platforms.length ? platforms : ['Facebook', 'Instagram'],
        advertiser: advertiserEl?.textContent?.trim() || document.title,
        pageUrl: window.location.href,
        timestamp: new Date().toISOString(),
    };
}

function createPanel(card, adData) {
    const existing = card.querySelector('.eb-panel');
    if (existing) return;

    const panel = document.createElement('div');
    panel.className = 'eb-panel';
    panel.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: white;
        border-top: 3px solid ${EB_COLOR};
        padding: 10px 12px;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        box-shadow: 0 -4px 20px rgba(0,0,0,0.12);
        border-radius: 0 0 12px 12px;
    `;

    const mediaAsset = adData.videoUrl || adData.imageUrls[0] || '';
    const hasMedia = !!mediaAsset;

    panel.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <div style="width:28px;height:28px;background:${EB_COLOR};border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">🚀</div>
            <div style="flex:1;min-width:0;">
                <div style="font-size:10px;font-weight:900;color:${EB_DARK};text-transform:uppercase;letter-spacing:0.05em;">EcomBoom Intelligence</div>
                <div style="font-size:9px;color:#888;truncate;">${adData.advertiser.slice(0,30)}</div>
            </div>
            ${adData.adCount ? `<div style="font-size:9px;font-weight:800;color:${EB_COLOR};background:#fff3ed;padding:2px 6px;border-radius:6px;">🔥 ${adData.adCount}</div>` : ''}
        </div>
        
        ${adData.copy ? `
        <div style="font-size:9px;color:#444;background:#f8f8f8;padding:6px 8px;border-radius:6px;margin-bottom:8px;max-height:40px;overflow:hidden;line-height:1.4;">
            "${adData.copy.slice(0,120)}..."
        </div>` : ''}

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
            <button class="eb-save-btn" style="
                background:linear-gradient(135deg,${EB_COLOR},#ff8c42);
                color:white;border:none;border-radius:8px;
                padding:7px 10px;font-size:10px;font-weight:800;
                cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;
                box-shadow:0 2px 8px rgba(255,107,43,0.4);
            ">
                💾 Guardar en EcomBoom
            </button>
            <button class="eb-download-btn" style="
                background:${EB_DARK};
                color:white;border:none;border-radius:8px;
                padding:7px 10px;font-size:10px;font-weight:800;
                cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;
                ${!hasMedia ? 'opacity:0.5;cursor:not-allowed;' : ''}
            ">
                ⬇ Descargar HD
            </button>
        </div>

        ${adData.impressionLevel ? `
        <div style="margin-top:6px;font-size:8px;color:#888;display:flex;align-items:center;gap:4px;">
            <span style="width:6px;height:6px;background:#22c55e;border-radius:50%;display:inline-block;"></span>
            Activo · ${adData.impressionLevel}
            ${adData.activeDate ? ` · ${adData.activeDate}` : ''}
        </div>` : ''}
    `;

    // Botón guardar
    panel.querySelector('.eb-save-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        const btn = e.currentTarget;
        btn.innerHTML = '⏳ Enviando...';
        btn.style.opacity = '0.8';

        chrome.storage.local.get(['last_product_id', 'last_store_id'], (res) => {
            if (!res.last_product_id) {
                alert('⚠️ Abre EcomBoom y selecciona el producto primero');
                btn.innerHTML = '💾 Guardar en EcomBoom';
                btn.style.opacity = '1';
                return;
            }

            chrome.runtime.sendMessage({
                action: 'save_competitor_creative',
                payload: {
                    url: mediaAsset,
                    type: adData.type,
                    productId: res.last_product_id,
                    storeId: res.last_store_id || 'store-main',
                    meta: {
                        platform: 'META',
                        adCopy: adData.copy,
                        headline: adData.headline,
                        cta: adData.cta,
                        advertiser: adData.advertiser,
                        impressionLevel: adData.impressionLevel,
                        activeDate: adData.activeDate,
                        adCount: adData.adCount,
                        platforms: adData.platforms,
                        pageUrl: adData.pageUrl,
                        timestamp: adData.timestamp,
                    }
                }
            }, (response) => {
                if (response?.success) {
                    btn.innerHTML = '✅ ¡Guardado!';
                    btn.style.background = '#16a34a';
                } else {
                    btn.innerHTML = '❌ Error';
                    btn.style.background = '#dc2626';
                    setTimeout(() => {
                        btn.innerHTML = '💾 Guardar en EcomBoom';
                        btn.style.background = `linear-gradient(135deg,${EB_COLOR},#ff8c42)`;
                        btn.style.opacity = '1';
                    }, 2000);
                }
            });
        });
    });

    // Botón download
    panel.querySelector('.eb-download-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (!hasMedia) return;
        chrome.runtime.sendMessage({
            action: 'download_asset',
            url: mediaAsset,
            filename: `ecomboom_${Date.now()}.${adData.type === 'VIDEO' ? 'mp4' : 'jpg'}`
        });
    });

    card.style.position = 'relative';
    card.appendChild(panel);
}

// ── SCAN COMPLETO DE LA BIBLIOTECA ───────────────────────────────────────
function scanFullLibrary(productId, sendResponse) {
    const cards = document.querySelectorAll('div[role="region"]');
    const results = [];

    cards.forEach(card => {
        const data = extractAdData(card);
        if (data.videoUrl || data.imageUrls.length > 0) {
            results.push(data);
        }
    });

    chrome.runtime.sendMessage({
        action: 'bulk_save_competitor',
        payload: { ads: results, productId }
    }, sendResponse);
}

// ── INYECCIÓN EN TARJETAS ────────────────────────────────────────────────
function injectPanels() {
    const cards = document.querySelectorAll('div[role="region"]');
    cards.forEach(card => {
        if (card.querySelector('.eb-panel')) return;
        const data = extractAdData(card);
        if (data.videoUrl || data.imageUrls.length > 0 || data.copy) {
            createPanel(card, data);
        }
    });
}

// Observer para nuevas tarjetas al hacer scroll
const observer = new MutationObserver(() => injectPanels());
observer.observe(document.body, { childList: true, subtree: true });
setTimeout(injectPanels, 2000);
setInterval(injectPanels, 5000);

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extract_creative') {
        const cards = document.querySelectorAll('div[role="region"]');
        if (cards.length === 0) { sendResponse({ success: false, error: 'No cards found' }); return true; }
        const data = extractAdData(cards[0]);
        sendResponse({ success: true, data });
        return true;
    }
    if (request.action === 'scan_advertiser_library') {
        scanFullLibrary(request.productId, sendResponse);
        return true;
    }
});
