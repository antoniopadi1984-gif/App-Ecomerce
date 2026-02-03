
chrome.runtime.onInstalled.addListener(() => {
    console.log('HubSby Elite Spy Extension Installed');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'save_asset' || request.action === 'quick_save') {
        const adData = request.data;
        console.log('⚡ HubSby Spy: Capturando Anuncio...', adData);

        fetch('http://localhost:3000/api/extension/capture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(adData)
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    chrome.notifications.create({
                        type: 'basic',
                        iconUrl: 'icons/icon128.png',
                        title: '⚡ ¡BIEN HECHO!',
                        message: `Ad guardado en Biblioteca: ${adData.title || 'Referencia'}`
                    });
                    sendResponse({ success: true });
                } else {
                    sendResponse({ success: false, error: data.error });
                }
            })
            .catch(err => {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon128.png',
                    title: '⚠️ ERROR DE CONEXIÓN',
                    message: '¿Está el servidor HubSby activo?'
                });
                sendResponse({ success: false, error: err.message });
            });
        return true;
    }
});
