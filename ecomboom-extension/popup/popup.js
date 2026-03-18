'use strict';

const API_BASE = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', async () => {
    const $ = id => document.getElementById(id);

    // ── INIT ─────────────────────────────────────────────────────────────
    await Promise.all([
        initSession(),
        loadProducts(),
        detectPlatform(),
        renderHistory(),
    ]);

    // ── SESSION ───────────────────────────────────────────────────────────
    async function initSession() {
        try {
            const res = await fetch(`${API_BASE}/api/auth/extension-session`, { credentials: 'include' });
            const data = await res.json();
            if (data.authenticated) {
                $('user-name').textContent = data.user?.name || 'EcomBoom User';
                $('store-name').textContent = data.store?.name ? `🏪 ${data.store.name}` : 'Sin tienda';
                $('conn-status').classList.remove('offline');
                chrome.storage.sync.set({ ecomboom_user: data.user, ecomboom_store: data.store });
            } else {
                $('user-name').textContent = 'No conectado';
                $('store-name').textContent = 'Abre EcomBoom primero';
                $('conn-status').classList.add('offline');
            }
        } catch {
            $('user-name').textContent = 'EcomBoom Intelligence';
            $('store-name').textContent = 'Sin conexión al servidor';
            $('conn-status').classList.add('offline');
        }
    }

    // ── PRODUCTS ──────────────────────────────────────────────────────────
    async function loadProducts() {
        try {
            const res = await fetch(`${API_BASE}/api/products`);
            const data = await res.json();
            const products = data.products || data.data || [];
            const sel = $('product-selector');
            sel.innerHTML = '<option value="">Seleccionar producto...</option>';
            products.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = p.title?.slice(0, 35) || p.id;
                sel.appendChild(opt);
            });
            const saved = await chrome.storage.local.get(['last_product_id']);
            if (saved.last_product_id) sel.value = saved.last_product_id;
        } catch {
            $('product-selector').innerHTML = '<option value="">Error al conectar</option>';
        }
    }

    $('product-selector').onchange = () => {
        const val = $('product-selector').value;
        chrome.storage.local.set({ last_product_id: val });
    };

    // ── PLATFORM DETECTION ────────────────────────────────────────────────
    async function detectPlatform() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = tab?.url || '';
        if (url.includes('facebook.com/ads/library')) {
            $('banner-meta').classList.add('show');
            $('meta-section').classList.remove('hidden');
        } else if (url.includes('tiktok.com')) {
            $('banner-tiktok').classList.add('show');
            $('tiktok-section').classList.remove('hidden');
        }
    }

    // ── ACTIONS ───────────────────────────────────────────────────────────
    async function getProductId() {
        const val = $('product-selector').value;
        if (val) return val;
        const saved = await chrome.storage.local.get(['last_product_id']);
        return saved.last_product_id || null;
    }

    async function sendToTab(action, extra = {}) {
        const productId = await getProductId();
        if (!productId) { alert('Selecciona un producto primero'); return null; }
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        return new Promise(resolve => {
            chrome.tabs.sendMessage(tab.id, { action, productId, ...extra }, resolve);
        });
    }

    async function runAction(label, actionFn) {
        showProgress(label, 10);
        try {
            const res = await actionFn();
            if (res?.success !== false) {
                showProgress('✅ ¡Completado!', 100);
                addHistory(label, 'success');
                setTimeout(hideProgress, 1500);
            } else {
                showProgress(`❌ ${res?.error || 'Error'}`, 100);
                setTimeout(hideProgress, 2500);
            }
        } catch (e) {
            showProgress(`❌ ${e.message}`, 100);
            setTimeout(hideProgress, 2500);
        }
    }

    // Guardar creativo
    $('btn-save').onclick = () => runAction('Guardando creativo...', () => sendToTab('extract_creative'));

    // Descargar HD
    $('btn-download-hd').onclick = async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.tabs.sendMessage(tab.id, { action: 'download_hd_assets' });
    };

    // Clonar landing
    $('btn-clone').onclick = () => runAction('Clonando landing...', async () => {
        const productId = await getProductId();
        if (!productId) return { success: false, error: 'Sin producto' };
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        return new Promise(resolve => {
            chrome.runtime.sendMessage({ action: 'capture_full_page', productId, tabId: tab.id }, resolve);
        });
    });

    // Meta: espiar biblioteca completa
    $('btn-meta-spy').onclick = () => runAction('Espiando biblioteca...', () => sendToTab('scan_advertiser_library'));

    // Meta: descargar todo
    $('btn-meta-download-all').onclick = () => runAction('Descargando creativos...', () => sendToTab('download_all_creatives'));

    // Meta: analizar con IA
    $('btn-meta-analyze').onclick = () => runAction('Analizando con Gemini...', () => sendToTab('analyze_library_ai'));

    // TikTok
    $('btn-tiktok-video').onclick = () => runAction('Capturando vídeo...', () => sendToTab('extract_creative'));
    $('btn-tiktok-profile').onclick = () => runAction('Capturando perfil...', () => sendToTab('scan_tiktok_profile'));

    // Nuevo producto
    $('btn-new-product').onclick = () => {
        chrome.tabs.create({ url: `${API_BASE}/operaciones/productos?action=new` });
    };

    // Cancelar
    $('btn-cancel').onclick = hideProgress;

    // ── PROGRESS ──────────────────────────────────────────────────────────
    function showProgress(step, pct) {
        $('progress-overlay').classList.add('show');
        $('progress-step').textContent = step;
        $('progress-bar').style.width = `${pct}%`;
    }
    function hideProgress() { $('progress-overlay').classList.remove('show'); }

    // ── HISTORY ───────────────────────────────────────────────────────────
    async function renderHistory() {
        const { capture_history = [] } = await chrome.storage.local.get(['capture_history']);
        const list = $('history-list');
        if (!capture_history.length) { list.innerHTML = '<li class="history-empty">Sin capturas recientes</li>'; return; }
        list.innerHTML = capture_history.slice(0, 5).map(item => `
            <li class="history-item">
                <div class="hi-info">
                    <span class="hi-title">${item.title}</span>
                    <span class="hi-time">${item.timestamp}</span>
                </div>
                <span class="hi-check">${item.status === 'success' ? '✅' : '❌'}</span>
            </li>
        `).join('');
    }

    function addHistory(title, status) {
        chrome.storage.local.get(['capture_history'], ({ capture_history = [] }) => {
            capture_history.unshift({ title, status, timestamp: new Date().toLocaleTimeString() });
            chrome.storage.local.set({ capture_history: capture_history.slice(0, 10) }, renderHistory);
        });
    }
});
