import { PrismaClient } from '@prisma/client';
import { STORES_CONFIG } from '../src/lib/config/stores.config';
import { getConnectionSecret } from '../src/lib/server/connections';

const p = new PrismaClient();

async function verify() {
    console.log('\n🔍 Verificando tiendas y tokens...\n');
    let allOk = true;

    // 1. Verificar que existen exactamente las 3 tiendas correctas
    const stores = await p.store.findMany({ select: { id: true, name: true } });
    const storeIds = stores.map(s => s.id);
    
    for (const validId of Object.keys(STORES_CONFIG)) {
        if (!storeIds.includes(validId)) {
            console.log(`❌ TIENDA FALTANTE: ${validId}`);
            allOk = false;
        } else {
            console.log(`✅ Tienda OK: ${validId} (${STORES_CONFIG[validId].name})`);
        }
    }

    const extraStores = storeIds.filter(id => !Object.keys(STORES_CONFIG).includes(id));
    if (extraStores.length > 0) {
        console.log(`⚠️  TIENDAS EXTRA (considerar eliminar): ${extraStores.join(', ')}`);
    }

    // 2. Verificar tokens Shopify con llamada real
    console.log('\n🔑 Verificando tokens Shopify...\n');

    for (const [storeId, config] of Object.entries(STORES_CONFIG)) {
        const token = await getConnectionSecret(storeId, 'SHOPIFY');
        if (!token) {
            console.log(`❌ TOKEN FALTANTE: ${storeId}`);
            allOk = false;
            continue;
        }

        try {
            const res = await fetch(
                `https://${config.domain}/admin/api/2026-01/shop.json`,
                { headers: { 'X-Shopify-Access-Token': token } }
            );

            if (res.ok) {
                const data = await res.json();
                console.log(`✅ Token OK: ${storeId} → ${data.shop?.name}`);
            } else {
                console.log(`❌ TOKEN INVÁLIDO: ${storeId} (HTTP ${res.status})`);
                allOk = false;
            }
        } catch (e: any) {
            console.log(`❌ ERROR RED: ${storeId} — ${e.message}`);
            allOk = false;
        }
    }

    // 3. Verificar que no hay productos duplicados
    console.log('\n📦 Verificando productos...\n');

    for (const storeId of Object.keys(STORES_CONFIG)) {
        const products = await p.product.findMany({
            where: { storeId },
            select: { shopifyId: true, title: true }
        });

        const ids = products.map(prod => prod.shopifyId).filter(Boolean);
        const unique = new Set(ids);

        if (ids.length !== unique.size) {
            console.log(`❌ DUPLICADOS EN: ${storeId} (${ids.length} productos, ${unique.size} únicos)`);
            allOk = false;
        } else {
            console.log(`✅ Productos OK: ${storeId} (${products.length} productos, sin duplicados)`);
        }
    }

    await p.$disconnect();

    console.log(allOk ? '\n✅ Todo OK — sistema en perfecto estado\n' : '\n❌ Hay problemas que resolver\n');
    process.exit(allOk ? 0 : 1);
}

verify();
