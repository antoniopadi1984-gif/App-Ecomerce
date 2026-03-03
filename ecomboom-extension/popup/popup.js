document.addEventListener('DOMContentLoaded', async () => {
    // 1. Detect active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url || '';

    if (url.includes('facebook.com/ads/library')) {
        document.getElementById('meta-ui').style.display = 'flex';
        document.getElementById('meta-ui').style.flexDirection = 'column';
        document.getElementById('meta-ui').style.gap = '8px';
    } else if (url.includes('library.tiktok.com')) {
        document.getElementById('tiktok-ui').style.display = 'flex';
        document.getElementById('tiktok-ui').style.flexDirection = 'column';
        document.getElementById('tiktok-ui').style.gap = '8px';
    } else {
        document.getElementById('landing-ui').style.display = 'flex';
        document.getElementById('landing-ui').style.flexDirection = 'column';
        document.getElementById('landing-ui').style.gap = '8px';
    }

    // 2. Fetch products from Local Storage (sync from app later)
    chrome.storage.local.get(['products', 'activeProductId'], (res) => {
        const select = document.getElementById('product-select');
        if (res.products && res.products.length > 0) {
            select.innerHTML = res.products.map(p => `<option value="${p.id}">${p.title}</option>`).join('');
            if (res.activeProductId) {
                select.value = res.activeProductId;
            }
        } else {
            select.innerHTML = '<option value="">(Sin productos) Abre EcomBoom antes</option>';
        }
    });

    // 3. Handlers
    const setStatus = (msg) => {
        document.getElementById('status').innerText = msg;
    };

    const runExtraction = (actionName, tabId) => {
        setStatus("Extrayendo...");
        document.getElementById('progress-container').style.display = 'block';
        document.getElementById('progress-fill').style.width = '30%';

        chrome.tabs.sendMessage(tabId, { action: actionName }, (response) => {
            if (response && response.success) {
                document.getElementById('progress-fill').style.width = '70%';

                // Send to background to upload to server
                chrome.runtime.sendMessage({
                    action: "send_to_ecomboom",
                    payload: {
                        productId: document.getElementById('product-select').value,
                        competitor: document.getElementById('competitor-select').value,
                        data: response.data
                    }
                }, (bgRes) => {
                    if (bgRes && bgRes.success) {
                        document.getElementById('progress-fill').style.width = '100%';
                        setStatus(`¡${response.count || 1} assets guardados en EcomBoom -> 00_INBOX/SPY/!`);
                    } else {
                        setStatus("Error subiendo a EcomBoom.");
                    }
                });
            } else {
                setStatus("Error extrayendo o script no cargado en la página.");
            }
        });
    };

    // Meta Handlers
    document.getElementById('meta-save-all')?.addEventListener('click', async () => {
        runExtraction("extract_meta_all", tab.id);
    });

    // Landing Handlers
    document.getElementById('landing-copy')?.addEventListener('click', async () => {
        setStatus("Inyectando extractor de copy...");
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content/landing-cloner.js']
        }, () => {
            runExtraction("extract_landing_copy", tab.id);
        });
    });

    document.getElementById('landing-clone')?.addEventListener('click', async () => {
        setStatus("Clonando Landing...");
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content/landing-cloner.js']
        }, () => {
            runExtraction("extract_landing_full", tab.id);
        });
    });

    // Handle competitor select logic
    const compSelect = document.getElementById('competitor-select');
    const newCompInput = document.getElementById('new-competitor');
    compSelect.addEventListener('change', (e) => {
        if (e.target.value === 'NEW') {
            newCompInput.style.display = 'block';
            newCompInput.focus();
        } else {
            newCompInput.style.display = 'none';
        }
    });
});
