document.addEventListener('DOMContentLoaded', async () => {
    const productNameInput = document.getElementById('productName');
    const competitorNameInput = document.getElementById('competitorName');
    const captureBtn = document.getElementById('captureAssets');
    const saveLandingBtn = document.getElementById('saveLanding');
    const assetList = document.getElementById('assetList');
    const targetFolderInput = document.getElementById('targetFolder');
    const searchLibraryBtn = document.getElementById('searchLibrary');

    // Cargar valores por defecto
    chrome.storage.local.get(['targetFolder', 'lastProduct', 'lastCompetitor'], (result) => {
        if (result.targetFolder) targetFolderInput.value = result.targetFolder;
        if (result.lastProduct) productNameInput.value = result.lastProduct;
        if (result.lastCompetitor) competitorNameInput.value = result.lastCompetitor;
    });

    // Guardar entradas al cambiar
    targetFolderInput.addEventListener('change', (e) => chrome.storage.local.set({ targetFolder: e.target.value }));
    productNameInput.addEventListener('change', (e) => chrome.storage.local.set({ lastProduct: e.target.value }));
    competitorNameInput.addEventListener('change', (e) => chrome.storage.local.set({ lastCompetitor: e.target.value }));

    // Botón de búsqueda en biblioteca (Simulado)
    searchLibraryBtn.addEventListener('click', () => {
        if (targetFolderInput.value === '') {
            targetFolderInput.value = 'Analisis_Competencia/Q1';
            chrome.storage.local.set({ targetFolder: 'Analisis_Competencia/Q1' });
        }
    });

    captureBtn.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const btnText = document.getElementById('btnText');
        captureBtn.disabled = true;
        btnText.innerText = 'Analizando...';

        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: scrapeAssets
        }, (results) => {
            captureBtn.disabled = false;
            btnText.innerText = 'Buscar Multimedia';

            if (chrome.runtime.lastError || !results || !results[0]) {
                assetList.innerHTML = '<div style="padding:20px; text-align:center; color:#ef4444; font-size:10px;">Error de conexión. Refresca la página.</div>';
                return;
            }

            const assets = results[0].result;
            displayAssets(assets);
        });
    });

    saveLandingBtn.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        saveLandingBtn.disabled = true;
        saveLandingBtn.innerText = 'Capturando...';

        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: scrapeAssets // Reuse scrapeAssets to get all images/videos/gifs
        }, async (results) => {
            if (results && results[0]) {
                const assets = results[0].result;
                const product = productNameInput.value || 'Sin_Producto';
                const competitor = competitorNameInput.value || 'Sin_Competidor';

                for (const asset of assets) {
                    await downloadAsset(asset, product, competitor);
                }

                saveLandingBtn.innerText = '¡GUARDADO!';
                saveLandingBtn.style.background = '#10b981';
                setTimeout(() => {
                    saveLandingBtn.disabled = false;
                    saveLandingBtn.innerText = 'Guardar Landing';
                    saveLandingBtn.style.background = '#0f172a';
                }, 2000);
            }
        });
    });

    async function downloadAsset(a, product, competitor) {
        const url = a.url;
        const type = a.type; // VIDEO, IMAGE, GIF

        const safeProduct = product.replace(/[^a-z0-9]/gi, '_');
        const safeCompetitor = competitor.replace(/[^a-z0-9]/gi, '_');

        let subfolder = 'Imagenes';
        if (type === 'VIDEO') subfolder = 'Videos';
        if (type === 'GIF') subfolder = 'Gifs';

        let filename = url.split('/').pop().split('?')[0];
        if (!filename || filename.length < 5) filename = `archivo_${Math.random().toString(36).substr(2, 5)}`;
        if (!filename.includes('.')) {
            filename += (type === 'VIDEO' ? '.mp4' : (type === 'GIF' ? '.gif' : '.jpg'));
        }

        return new Promise((resolve) => {
            chrome.downloads.download({
                url: url,
                filename: `EcomFlow_Spy/${safeProduct}/${safeCompetitor}/${subfolder}/${filename}`,
                saveAs: false
            }, () => resolve());
        });
    }

    function displayAssets(assets) {
        if (assets.length === 0) {
            assetList.innerHTML = '<div style="color: #94a3b8; font-size: 10px; padding: 20px; text-align: center;">No se encontró multimedia válida.</div>';
            return;
        }

        assetList.innerHTML = assets.map(a => `
      <div class="asset-item">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 32px; height: 32px; background: #f1f5f9; border-radius: 4px; overflow: hidden; display: flex; align-items: center; justify-content: center; border: 1px solid #e2e8f0;">
             ${a.type === 'VIDEO' ?
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>' :
                '<img src="' + a.url + '" style="width:100%; height:100%; object-fit:cover;">'}
          </div>
          <div style="display: flex; flex-direction: column;">
             <span style="font-weight: 700; color: #0f172a; max-width: 140px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;" title="${a.url}">${new URL(a.url).pathname.split('/').pop() || 'archivo'}</span>
             <span style="font-size: 9px; color: #64748b; font-weight: 600;">${a.type} &bull; DETECTADO</span>
          </div>
        </div>
        <button class="btn-sync" data-url="${a.url}" data-type="${a.type}">
          Sincronizar
        </button>
      </div>
    `).join('');

        document.querySelectorAll('.btn-sync').forEach(btn => {
            btn.addEventListener('click', async () => {
                const url = btn.getAttribute('data-url');
                const type = btn.getAttribute('data-type');
                const product = productNameInput.value || 'Sin_Producto';
                const competitor = competitorNameInput.value || 'Sin_Competidor';

                btn.disabled = true;
                btn.innerText = '...';

                await downloadAsset({ url, type }, product, competitor);

                btn.innerText = 'OK';
                btn.style.background = '#10b981';
                btn.style.color = 'white';
            });
        });
    }
});

function scrapeAssets() {
    const assets = [];

    // Buscar Videos e IFrames con video
    document.querySelectorAll('video').forEach(v => {
        const src = v.src || v.querySelector('source')?.src;
        if (src && !src.startsWith('blob:')) assets.push({ type: 'VIDEO', url: src });
    });

    // Buscar Imágenes y GIFs
    document.querySelectorAll('img').forEach(img => {
        if (img.width > 100 && img.height > 100) {
            const type = img.src.toLowerCase().includes('.gif') ? 'GIF' : 'IMAGE';
            assets.push({ type: type, url: img.src });
        }
    });

    return assets.slice(0, 50); // Limitar a los primeros 50 para evitar sobrecarga
}
