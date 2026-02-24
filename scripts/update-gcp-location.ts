import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const cnns = await prisma.connection.findMany({ where: { provider: 'GOOGLE_CLOUD' } });
  
  for (const c of cnns) {
      let cfg: any = {};
      if (typeof c.extraConfig === 'string') {
          try { cfg = JSON.parse(c.extraConfig); } catch(e){}
      } else if (c.extraConfig) {
          cfg = c.extraConfig;
      }
      
      cfg.GOOGLE_CLOUD_LOCATION = 'eu';
      
      await prisma.connection.update({
          where: { id: c.id },
          data: { extraConfig: JSON.stringify(cfg) }
      });
      console.log(`Updated GOOGLE_CLOUD connection ${c.id} to location 'eu'. New extraConfig format:`, JSON.stringify(cfg));
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
