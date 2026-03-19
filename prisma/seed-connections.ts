/**
 * seed-connections.ts
 * Garantiza que las conexiones Shopify de las 3 tiendas siempre estén
 * en BD aunque se haga prisma db push desde cero.
 * Ejecutar: npx ts-node prisma/seed-connections.ts
 * O automático después de prisma db push via package.json#prisma.seed
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const connections = [
  {
    storeId: 'store-main',
    provider: 'SHOPIFY',
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN!,
    extraConfig: JSON.stringify({
      SHOPIFY_SHOP_DOMAIN: process.env.SHOPIFY_SHOP_DOMAIN || 'f7z7nn-ei.myshopify.com',
      SHOP_NAME: 'Aleessence',
    }),
  },
  {
    storeId: 'alecare-mx',
    provider: 'SHOPIFY',
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN_MX!,
    extraConfig: JSON.stringify({
      SHOPIFY_SHOP_DOMAIN: process.env.SHOPIFY_SHOP_DOMAIN_MX || 'im8zf5-6c.myshopify.com',
      DOMINIO_TIENDA_SHOPIFY: process.env.SHOPIFY_SHOP_DOMAIN_MX || 'im8zf5-6c.myshopify.com',
      CLAVE_API_SHOPIFY: process.env.SHOPIFY_ACCESS_TOKEN_MX!,
    }),
  },
  {
    storeId: 'cmlxrad5405b826d99j9kpgyy',
    provider: 'SHOPIFY',
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN_UK!,
    extraConfig: JSON.stringify({
      SHOPIFY_SHOP_DOMAIN: 'v1ethu-he.myshopify.com',
    }),
  },
];

const stores = [
  { id: 'store-main',               name: 'AleEssence',  domain: 'f7z7nn-ei.myshopify.com',   currency: 'EUR' },
  { id: 'alecare-mx',               name: 'AleCare MX',  domain: 'im8zf5-6c.myshopify.com',   currency: 'MXN' },
  { id: 'cmlxrad5405b826d99j9kpgyy', name: 'AleCare UK', domain: 'v1ethu-he.myshopify.com',   currency: 'EUR' },
];

async function main() {
  console.log('🌱 Seeding stores y connections...');

  for (const store of stores) {
    await prisma.store.upsert({
      where: { id: store.id },
      update: { name: store.name, domain: store.domain, currency: store.currency },
      create: { id: store.id, name: store.name, domain: store.domain, currency: store.currency },
    });
    console.log(`  ✅ Store: ${store.name}`);
  }

  for (const conn of connections) {
    await (prisma as any).connection.upsert({
      where: { storeId_provider: { storeId: conn.storeId, provider: conn.provider } },
      update: { accessToken: conn.accessToken, extraConfig: conn.extraConfig, isActive: true },
      create: { storeId: conn.storeId, provider: conn.provider, accessToken: conn.accessToken, extraConfig: conn.extraConfig, isActive: true },
    });
    console.log(`  ✅ Connection: ${conn.storeId} / ${conn.provider}`);
  }

  console.log('✅ Seed completado.');
}

main()
  .catch(e => { console.error('❌ Seed error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());

// ── Agent Profiles ─────────────────────────────────────────────────────────
const agentRoles = [
  'general','research-core','funnel-architect','video-intelligence',
  'media-buyer','image-director','ops-commander','drive-intelligence'
];

async function seedAgentProfiles(prisma: PrismaClient) {
  console.log('🌱 Seeding agent profiles...');
  const storeIds = ['store-main','alecare-mx','cmlxrad5405b826d99j9kpgyy'];
  for (const storeId of storeIds) {
    const existing = await prisma.agentProfile.findMany({ where: { storeId } });
    const existingRoles = existing.map((a: any) => a.role);
    const missing = agentRoles.filter(r => !existingRoles.includes(r));
    for (const role of missing) {
      await prisma.agentProfile.create({
        data: { storeId, role, name: role, isActive: true, model: 'gemini-3.1-flash-lite-preview' }
      });
      console.log(`  ✅ AgentProfile: ${storeId} / ${role}`);
    }
  }
}
