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

// 2. Inject Buttons DIRECTLY onto the Ad Cards
function injectButtonsOnCards() {
    // Busca las tarjetas de anuncios
    const adCards = document.querySelectorAll('div[role="region"]');
    
    adCards.forEach(card => {
        // Verifica si ya inyectamos el botón para no duplicarlo
        if (card.querySelector('.ecomboom-card-btn')) return;

        // Buscaremos si hay video o imagen en la misma card
        const video = card.querySelector('video');
        const img = card.querySelector('img[src*="ad_creative"]');

        if (!video && !img) return; // Si no hay media, no inyectamos aún

        const type = video ? 'VIDEO' : 'IMAGE';
        
        // Creamos el botón
        const btnContainer = document.createElement('div');
        btnContainer.className = 'ecomboom-card-btn';
        btnContainer.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            z-index: 100;
        `;

        btnContainer.innerHTML = `
            <button style="
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                border: none;
                border-radius: 8px;
                padding: 6px 12px;
                font-family: 'Inter', sans-serif;
                font-size: 11px;
                font-weight: 800;
                cursor: pointer;
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                display: flex;
                align-items: center;
                gap: 5px;
            ">
                🚀 Guardar en EcomBoom
            </button>
        `;

        // Prevenimos que clicks en la tarjeta arruinen el botón
        btnContainer.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            // Obtenemos el product id por defecto
            chrome.storage.local.get(['last_product_id'], (res) => {
                const productId = res.last_product_id;
                if (!productId) {
                    alert("⚠️ ¡Atención! Abre la extensión de EcomBoom arriba a la derecha y selecciona el producto donde guardar esto.");
                    return;
                }

                // URL base
                let url = '';
                if (video && video.src && !video.src.startsWith('blob')) {
                    url = video.src;
                } else if (img && img.src) {
                    url = img.src;
                } else {
                    alert("Aún cargando video...");
                    return;
                }

                btnContainer.querySelector('button').innerHTML = "⏳ Guardando...";
                
                // Enviar a Background script para descarga/guardado
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
                    setTimeout(() => {
                        btnContainer.querySelector('button').innerHTML = "✅ ¡Enviado a Drive+IA!";
                        btnContainer.querySelector('button').style.background = "#0f172a";
                    }, 500);
                });
            });
        });

        // Buscamos el div contenedor del media para ponerlo arriba
        const mediaContainer = video ? video.parentElement : img.parentElement;
        if (mediaContainer) {
            mediaContainer.style.position = 'relative';
            mediaContainer.appendChild(btnContainer);
        }
    });
}

// Observador para cuando se hace scroll e inyectar en nuevas tarjetas
const observer = new MutationObserver(() => {
    injectButtonsOnCards();
});

observer.observe(document.body, { childList: true, subtree: true });

// Llamada inicial
setTimeout(injectButtonsOnCards, 2000);

// --- Funciones antiguas para el Popup interactivo ---
function captureActiveAd(productId, sendResponse) {
    const cards = Array.from(document.querySelectorAll('div[role="region"]'));
    if (cards.length === 0) {
        sendResponse({ success: false, error: "No ad cards found" });
        return;
    }
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
            meta: { platform: "META", adCopy: card.innerText.slice(0, 500) }
        }
    }, (response) => {
        sendResponse(response);
    });
}
