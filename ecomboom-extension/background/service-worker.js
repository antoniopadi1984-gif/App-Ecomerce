import { ApiClient } from './api-client.js';
import { DownloadManager } from './download-manager.js';

const api = new ApiClient();

// ── 1. Context Menus ──
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "save-to-ecomboom-video",
        title: "🚀 Guardar VÍDEO en EcomBoom",
        contexts: ["video"]
    });
    chrome.contextMenus.create({
        id: "save-to-ecomboom-image",
        title: "🚀 Guardar IMAGEN en EcomBoom",
        contexts: ["image"]
    });
    chrome.contextMenus.create({
        id: "spy-advertiser-library",
        title: "🚀 EcomBoom: Espiar anunciante",
        contexts: ["page", "link"]
    });
    chrome.contextMenus.create({
        id: "clone-landing-page",
        title: "🚀 EcomBoom: Clonar landing page",
        contexts: ["page"]
    });

    // Mock user if empty for demo
    chrome.storage.sync.get(['ecomboom_user'], (res) => {
        if (!res.ecomboom_user) {
            chrome.storage.sync.set({
                ecomboom_user: { name: "Tony Padi", avatar: "../icons/icon128.png" },
                ecomboom_store: { name: "Apple Store ES" }
            });
        }
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    const isSpyLibrary = info.menuItemId === "spy-advertiser-library";
    const type = info.menuItemId === "save-to-ecomboom-video" ? 'VIDEO' : 'IMAGE';
    const url = info.srcUrl || info.linkUrl || tab.url;

    chrome.storage.local.get(['last_product_id'], (res) => {
        const productId = res.last_product_id;
        if (!productId) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: '../icons/icon128.png',
                title: 'EcomBoom: Acción Requerida',
                message: 'Por favor, abre la extensión y selecciona un producto primero.'
            });
            return;
        }

        if (isSpyLibrary) {
            chrome.tabs.sendMessage(tab.id, {
                action: "scan_advertiser_library",
                productId: productId
            });
        } else if (info.menuItemId === "clone-landing-page") {
            chrome.tabs.sendMessage(tab.id, {
                action: "clone_landing",
                productId: productId
            });
        } else {
            handleSaveAsset({
                url,
                type,
                productId,
                meta: { pageTitle: tab.title, pageUrl: tab.url, source: "ContextMenu" }
            });
        }
    });
});

// ── 2. Message Orchestrator ──
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("[ServiceWorker] Action:", message.action);

    switch (message.action) {

        case "save_competitor_creative":
            handleSaveAsset(message.payload)
                .then(res => sendResponse({ success: true, res }))
                .catch(err => sendResponse({ success: false, error: err.message }));
            return true;

        case "capture_full_page":
            handleLandingClone(message.productId, sender.tab.id)
                .then(res => sendResponse({ success: true, res }))
                .catch(err => sendResponse({ success: false, error: err.message }));
            return true;

        default:
            console.warn("[ServiceWorker] Unknown action:", message.action);
            break;
    }
});

/**
 * Handle direct save + Download for large files
 */
async function handleSaveAsset(payload) {
    console.log("[ServiceWorker] Handle Save Asset:", payload);

    try {
        // Resolve PENDING productId from storage if needed
        if (payload.productId === 'PENDING' || !payload.productId) {
            const res = await chrome.storage.local.get(['last_product_id']);
            if (res.last_product_id) {
                payload.productId = res.last_product_id;
            } else {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: '../icons/icon128.png',
                    title: 'Proyecto no seleccionado',
                    message: 'Abre la extensión y selecciona un proyecto de destino primero.'
                });
                throw new Error("No active product selected.");
            }
        }

        // 1. Report to EcomBoom API
        const apiResult = await api.sendCompetitorAsset(payload);

        // 2. Local Download if it's large (offscreen method)
        if (payload.type === 'VIDEO') {
            await downloadLargeFile(payload.url, `comp_${Date.now()}.mp4`);
        } else {
            // Simple download for small images
            chrome.downloads.download({ url: payload.url, filename: `ecomboom/comp_${Date.now()}.jpg`, conflictAction: 'uniquify' });
        }

        // 3. Notify Success
        chrome.notifications.create({
            type: 'basic',
            iconUrl: '../icons/icon128.png',
            title: '¡Creativo Guardado!',
            message: `El activo ha sido enviado a tu inbox y está siendo analizado.`
        });

        return apiResult;
    } catch (err) {
        console.error("[ServiceWorker] ❌ Failed to save asset:", err);
        throw err;
    }
}

/**
 * Critical: Use offscreen document to create Blob URL for large downloads
 */
async function downloadLargeFile(url, filename) {
    // 1. Ensure offscreen is ready
    await setupOffscreenDocument();

    // 2. Request blob URL from offscreen
    const response = await chrome.runtime.sendMessage({
        target: 'offscreen',
        action: 'download_large_blob',
        payload: { url, filename }
    });

    if (response && response.success && response.blobUrl) {
        return new Promise((resolve, reject) => {
            chrome.downloads.download({
                url: response.blobUrl,
                filename: `ecomboom/videos/${filename}`,
                conflictAction: 'uniquify'
            }, (id) => {
                if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
                else resolve(id);
            });
        });
    } else {
        throw new Error(response?.error || "Offscreen download failed");
    }
}

async function setupOffscreenDocument() {
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT']
    });

    if (existingContexts.length > 0) return;

    await chrome.offscreen.createDocument({
        url: '../offscreen.html',
        reasons: ['BLOBS'],
        justification: 'Handling large video downloads and blob processing.'
    });
}

/**
 * Handle full page clone
 */
async function handleLandingClone(productId, tabId) {
    console.log(`[ServiceWorker] Starting clone for project ${productId}...`);
    const screenshot = await DownloadManager.captureTab(tabId);

    chrome.notifications.create({
        type: 'basic',
        iconUrl: '../icons/icon128.png',
        title: 'Landing Page Clonada',
        message: 'Captura completada. Se está procesando la estructura completa en el dashboard.'
    });

    return { status: "CAPTURED", screenshotLength: screenshot.length };
}
