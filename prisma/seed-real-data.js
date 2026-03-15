const { PrismaClient } = require("@prisma/client");
const { PrismaLibSql } = require("@prisma/adapter-libsql");

const adapter = new PrismaLibSql({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Seed de datos reales desactivado para evitar creación de tiendas temporales.\n");
    /*
    const shopDomain = "f7z7nn-ei.myshopify.com";
    // ...
    */
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
