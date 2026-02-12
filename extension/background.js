
chrome.runtime.onInstalled.addListener(() => {
    console.log('EcomFlow Control Bridge Extension Installed');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const API_BASE = 'http://localhost:3000/api';

    if (request.action === 'quick_save') {
        fetch(`${API_BASE}/extension/capture`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request.data)
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    chrome.notifications.create({
                        type: 'basic',
                        iconUrl: 'icons/icon128.png',
                        title: '⚡ ¡BIEN HECHO!',
                        message: `Anuncio guardado en Biblioteca.`
                    });
                    sendResponse({ success: true });
                }
            })
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }

    if (request.action === 'import_copy') {
        // En un escenario real, necesitaríamos el productId y jobId. 
        // Podemos guardarlos en storage cuando se abre la pestaña de Claude.
        chrome.storage.local.get(['activeProductId', 'activeJobId', 'activeCopyType'], (result) => {
            const payload = {
                productId: result.activeProductId,
                jobId: result.activeJobId,
                type: result.activeCopyType,
                resultText: request.data.resultText
            };

            fetch(`${API_BASE}/copy/import`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        chrome.notifications.create({
                            type: 'basic',
                            iconUrl: 'icons/icon128.png',
                            title: '🚀 ¡COPY IMPORTADO!',
                            message: `El resultado de Claude ya está en EcomFlow.`
                        });
                        sendResponse({ success: true });
                    } else {
                        sendResponse({ success: false, error: data.error });
                    }
                })
                .catch(err => sendResponse({ success: false, error: err.message }));
        });
        return true;
    }
});
