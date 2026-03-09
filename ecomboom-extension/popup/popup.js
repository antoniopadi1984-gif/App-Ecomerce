/**
 * EcomBoom Popup Logic
 * Handles Authentication, UI states, and Messaging.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // ── Elements ──
    const authState = document.getElementById('authenticated');
    const guestState = document.getElementById('not-authenticated');
    const userNameEl = document.getElementById('user-name');
    const storeNameEl = document.getElementById('active-store');
    const productSelector = document.getElementById('product-selector');
    const progressBar = document.getElementById('progress-bar-fill');
    const progressOverlay = document.getElementById('processing-overlay');
    const progressStep = document.getElementById('processing-step');
    const progressPercent = document.getElementById('processing-percent');

    // Platform Banners & Actions
    const metaBanner = document.getElementById('platform-banner-meta');
    const metaActions = document.getElementById('meta-actions');
    const tiktokBanner = document.getElementById('platform-banner-tiktok');
    const tiktokActions = document.getElementById('tiktok-actions');

    // History
    const historyList = document.getElementById('capture-history');

    // ── 1. Check Authentication State ──
    // Normally checking for a token or session in storage
    chrome.storage.sync.get(['ecomboom_user', 'ecomboom_store'], (result) => {
        if (result.ecomboom_user) {
            showAuthenticated(result.ecomboom_user, result.ecomboom_store);
        } else {
            showGuest();
        }
    });

    function showGuest() {
        guestState.classList.remove('hidden');
        authState.classList.add('hidden');
        document.getElementById('btn-login').onclick = () => {
            chrome.tabs.create({ url: 'http://localhost:3000/auth/login' });
        };
    }

    async function showAuthenticated(user, store) {
        authState.classList.remove('hidden');
        guestState.classList.add('hidden');

        userNameEl.textContent = user.name || "Usuario EcomBoom";
        storeNameEl.textContent = `Store: ${store?.name || "Sin Store"}`;

        // Load Products
        loadProducts();

        // Detect Platform
        detectPlatform();

        // Render History
        renderHistory();
    }

    // ── 2. Platform Detection ──
    async function detectPlatform() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = tab.url;

        if (url.includes('facebook.com/ads/library')) {
            metaBanner.classList.remove('hidden');
            metaActions.classList.remove('hidden');
        } else if (url.includes('tiktok.com')) {
            tiktokBanner.classList.remove('hidden');
            tiktokActions.classList.remove('hidden');
        }
    }

    // ── 3. Load Products ──
    async function loadProducts() {
        try {
            const res = await fetch('http://localhost:3000/api/products');
            const data = await res.json();
            if (data.success && data.products) {
                productSelector.innerHTML = '<option value="">Seleccionar producto...</option>';
                data.products.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p.id;
                    opt.textContent = p.title;
                    productSelector.appendChild(opt);
                });

                // Auto-select last project
                chrome.storage.local.get(['last_product_id'], (res) => {
                    if (res.last_product_id) productSelector.value = res.last_product_id;
                });
            }
        } catch (err) {
            productSelector.innerHTML = '<option value="">Error al conectar (Auth required)</option>';
        }
    }

    productSelector.onchange = () => {
        chrome.storage.local.set({ last_product_id: productSelector.value });
    };

    // ── 4. Action Handlers ──
    document.getElementById('btn-save-creative').onclick = () => runCapture('extract_creative');
    document.getElementById('btn-clone-landing').onclick = () => runCapture('clone_landing');

    // Meta Specials
    document.getElementById('btn-meta-ad').onclick = () => runCapture('extract_creative');
    document.getElementById('btn-meta-full').onclick = () => runCapture('scan_advertiser_library');

    // TikTok Specials
    document.getElementById('btn-tiktok-video').onclick = () => runCapture('extract_creative');
    document.getElementById('btn-tiktok-profile').onclick = () => runCapture('scan_tiktok_profile');

    async function runCapture(action) {
        const productId = productSelector.value;
        if (!productId) {
            alert("Selecciona un producto de destino primero.");
            return;
        }

        // Show Processing UI
        showProcessing("Iniciando captura...");

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        chrome.tabs.sendMessage(tab.id, { action, productId }, (response) => {
            if (chrome.runtime.lastError) {
                updateProcessing("Error de conexión", 100);
                setTimeout(hideProcessing, 2000);
                return;
            }

            if (response && response.success) {
                updateProcessing("¡Guardado con éxito!", 100);
                saveToHistory({
                    title: document.title || "Creativo detectado",
                    status: 'success',
                    timestamp: new Date().toLocaleTimeString()
                });
                setTimeout(hideProcessing, 1500);
            } else {
                updateProcessing("No se detectó el contenido", 100);
                setTimeout(hideProcessing, 2000);
            }
        });
    }

    // ── UI Utilities ──
    function showProcessing(step) {
        progressOverlay.classList.remove('hidden');
        updateProcessing(step, 10);
    }

    function updateProcessing(step, percent) {
        progressStep.textContent = step;
        progressPercent.textContent = `${percent}%`;
        progressBar.style.width = `${percent}%`;
    }

    function hideProcessing() {
        progressOverlay.classList.add('hidden');
    }

    function renderHistory() {
        chrome.storage.local.get(['capture_history'], (res) => {
            const history = res.capture_history || [];
            if (history.length === 0) return;

            historyList.innerHTML = '';
            history.slice(0, 5).forEach(item => {
                const li = document.createElement('li');
                li.className = 'history-item';
                li.innerHTML = `
                    <div class="info">
                        <span class="title">${item.title}</span>
                        <span class="time">${item.timestamp}</span>
                    </div>
                    <span class="history-status ${item.status === 'success' ? 'status-success' : 'status-error'}">
                        ${item.status === 'success' ? '✓' : '✗'}
                    </span>
                `;
                historyList.appendChild(li);
            });
        });
    }

    function saveToHistory(item) {
        chrome.storage.local.get(['capture_history'], (res) => {
            const history = res.capture_history || [];
            history.unshift(item);
            chrome.storage.local.set({ capture_history: history.slice(0, 10) }, renderHistory);
        });
    }
});
