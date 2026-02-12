
// EcomFlow Control Bridge: Content Script

const isClaude = window.location.hostname.includes('claude.ai');
const isAdLibrary = window.location.hostname.includes('facebook.com') || window.location.hostname.includes('tiktok.com');

// ---------------------------------------------------------
// REGLAS PARA CLAUDE BRIDGE
// ---------------------------------------------------------

if (isClaude) {
    console.log('EcomFlow Bridge: Claude Mode Active');

    const urlParams = new URLSearchParams(window.location.search);
    const efPid = urlParams.get('eflow_pid');
    const efJid = urlParams.get('eflow_jid');
    const efType = urlParams.get('eflow_type');
    const efTrigger = urlParams.get('ef_trigger');

    if (efPid && efJid) {
        chrome.storage.local.set({
            activeProductId: efPid,
            activeJobId: efJid,
            activeCopyType: efType || 'General'
        }, () => {
            console.log('EcomFlow Context Saved:', { efPid, efJid });
        });
    }

    // 1. Panel lateral pequeño (No invasivo)
    const panel = document.createElement('div');
    panel.id = 'eflow-bridge-panel';
    panel.style.cssText = `
        position: fixed;
        right: 20px;
        top: 100px;
        width: 220px;
        background: #0f172a;
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 16px;
        padding: 15px;
        z-index: 2147483647;
        color: white;
        font-family: 'Inter', sans-serif;
        box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        display: ${efTrigger === 'copy' ? 'block' : 'none'};
    `;

    panel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <span style="font-size: 10px; font-weight: 900; color: #6366f1; text-transform: uppercase;">EcomFlow Bridge</span>
            <button id="eflow-close" style="background:none; border:none; color:white; cursor:pointer; font-size:12px;">✕</button>
        </div>
        <div id="eflow-status" style="font-size: 11px; font-weight: 600; margin-bottom: 12px; color: #94a3b8;">
            ${efTrigger === 'copy' ? 'Esperando respuesta...' : 'Listo para importar'}
        </div>
        <button id="eflow-import-btn" style="width: 100%; background: #6366f1; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: 800; font-size: 11px; cursor: pointer; text-transform: uppercase; transition: all 0.2s;">Importar a EcomFlow</button>
    `;

    document.body.appendChild(panel);

    document.getElementById('eflow-close').onclick = () => panel.style.display = 'none';

    function getLatestClaudeResponse() {
        // Selector for Claude's messages (v2024/2025)
        const messages = document.querySelectorAll('.font-claude-message, [data-testid="message-row"]');
        if (messages.length === 0) return null;

        // Find last message from Claude
        for (let i = messages.length - 1; i >= 0; i--) {
            const msg = messages[i];
            // Skip user messages (usually have a different bg or align-end)
            if (!msg.innerText.includes('Copywriting') && !msg.querySelector('.bg-slate-100')) {
                // Simple heuristic: Claude's messages don't have our injected panel data
                return msg.innerText;
            }
        }
        return messages[messages.length - 1].innerText;
    }

    document.getElementById('eflow-import-btn').onclick = async () => {
        const text = getLatestClaudeResponse();
        if (!text) {
            alert('No se detectó ninguna respuesta de Claude aún en esta ventana.');
            return;
        }

        const btn = document.getElementById('eflow-import-btn');
        const originalText = btn.innerText;
        btn.innerText = 'IMPORTANDO...';
        btn.disabled = true;

        chrome.runtime.sendMessage({
            action: 'import_copy',
            data: { resultText: text }
        }, (response) => {
            if (response?.success) {
                btn.innerText = '¡IMPORTADO! ✓';
                btn.style.background = '#059669';
                document.getElementById('eflow-status').innerText = 'Copy guardado con éxito';
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.style.background = '#6366f1';
                    btn.disabled = false;
                }, 3000);
            } else {
                btn.innerText = 'ERROR';
                btn.style.background = '#dc2626';
                alert('Error al importar: ' + (response?.error || 'Conexión fallida'));
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.style.background = '#6366f1';
                    btn.disabled = false;
                }, 3000);
            }
        });
    };
}

// ---------------------------------------------------------
// REGLAS PARA AD SPY (SIN CAMBIOS)
// ---------------------------------------------------------

if (isAdLibrary) {
    // ... mantengo la lógica de los botones de Ads library ...
    const adStyle = document.createElement('style');
    adStyle.textContent = `
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
            font-family: 'Inter', sans-serif !important;
            font-weight: 900 !important;
            font-size: 11px !important;
            text-transform: uppercase !important;
            cursor: pointer !important;
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            box-shadow: 0 10px 25px rgba(0,0,0,0.4) !important;
        }
    `;
    document.head.appendChild(adStyle);

    function injectButton(card) {
        if (card.querySelector('.ecom-save-btn')) return;
        if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
        const btn = document.createElement('button');
        btn.className = 'ecom-save-btn';
        btn.innerHTML = '<span>GUARDAR ECOMFLOW</span>';
        btn.onclick = (e) => {
            e.preventDefault(); e.stopPropagation();
            const advertiser = card.querySelector('strong, h4')?.innerText || "Anunciante";
            chrome.runtime.sendMessage({
                action: 'quick_save',
                data: {
                    url: card.querySelector('video')?.src || card.querySelector('img')?.src || '',
                    type: card.querySelector('video') ? 'VIDEO' : 'IMAGE',
                    title: advertiser,
                    metadata: { sourceUrl: window.location.href }
                }
            });
            btn.innerText = '¡ENVIADO! ✓';
            setTimeout(() => btn.innerText = 'GUARDAR ECOMFLOW', 3000);
        };
        card.appendChild(btn);
    }

    const processAds = () => {
        document.querySelectorAll('div[data-testid="ad_library_card_container"], .ad-item, [class*="AdCard"]').forEach(el => {
            if (el.offsetHeight > 80) injectButton(el);
        });
    };
    setInterval(processAds, 3000);
}
