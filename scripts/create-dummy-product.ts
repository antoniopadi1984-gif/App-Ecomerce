import { prisma } from "../src/lib/prisma";

async function main() {
  const store = await prisma.store.findFirst();
  if (!store) throw new Error("No store found");

  const product = await prisma.product.create({
    data: {
      storeId: store.id,
      title: "Maestro Test Product",
      price: 29.99,
      status: "ACTIVE"
    }
  });

  console.log("Created Product:", product.id);
}

main();
