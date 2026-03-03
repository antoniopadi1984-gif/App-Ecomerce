chrome.runtime.onInstalled.addListener(() => {
    console.log("EcomBoom Spy Extension Installed!");
});

// Listener to handle API calls to my Next.js local / remote server
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "send_to_ecomboom") {
        const apiUrl = "http://localhost:3000/api/drive/spy-inbox"; // Configurable in the future

        fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request.payload)
        })
            .then(res => res.json())
            .then(data => sendResponse({ success: true, serverResponse: data }))
            .catch(err => {
                console.error("EcomBoom Extension Error:", err);
                sendResponse({ success: false, error: err.toString() });
            });

        return true; // Keep channel alive for async response
    }
});
